#!/usr/bin/env python3
"""
Prodigi pricing extraction — multi-currency, grouped-MDX, ECB-FX-aware.

Stages:
  --discover : Read all CSVs, write sku-mapping-report.md
  --update   : Walk grouped MDX, refresh per-variant base_prices + cost_basis_currency
  --check    : Run acceptance checks (no CSV processing required)

Reads Prodigi pricing CSVs from --csv-dir and updates per-variant base_prices in
grouped MDX at --products-dir. Each variant carries its SKU; the script looks up
that SKU across regional CSVs, determines a cost-basis currency (EUR if europe.csv
has any EUR row; GBP otherwise), and stores all four regional prices in that
cost-basis currency, applying ECB reference rates for cross-currency conversion.

Storefront price_cents is preserved on every variant by re-selecting the same
europe-regionid row that fed the existing base_prices.EU value.

Usage:
  python scripts/extract-prodigi-pricing.py --discover --csv-dir <path>
  python scripts/extract-prodigi-pricing.py --update --dry-run --csv-dir <path>
  python scripts/extract-prodigi-pricing.py --update --csv-dir <path>
"""

import argparse
import csv
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from collections import defaultdict
from datetime import datetime
from pathlib import Path

# ─── Paths ────────────────────────────────────────────────────────────────────
_SCRIPT_DIR = Path(__file__).resolve().parent
_REPO_ROOT = _SCRIPT_DIR.parent

PRODUCTS_DIR_DEFAULT = str(_REPO_ROOT / "content" / "products")
REPORT_PATH_DEFAULT = str(_SCRIPT_DIR / "sku-mapping-report.md")
FX_NOTES_PATH = _SCRIPT_DIR / "extraction-fx-rates.md"

# Customer region → CSV regionid candidates (first match wins)
REGION_CSV_IDS = {
    "EU": ["europe"],
    "UK": ["europe"],
    "US": ["us_canada"],
    "AU": ["au"],
}

ECB_URL = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml"

# Locked FX rates (ECB reference, 2026-05-13). See scripts/extraction-fx-rates.md.
# These drive both:
#   • compute_price_cents (GBP→EUR cost-basis conversion via LOCKED_FX_RATES['GBP']),
#   • lookup_uk/us/au regional FX conversion (when --use-locked-fx is set).
# Hardcoding keeps storefront price_cents and stored base_prices reproducible
# from MDX alone. Pass --refresh-fx to fetch fresh ECB rates instead.
LOCKED_FX_DATE = "2026-05-13"
LOCKED_FX_RATES = {
    "EUR": 1.0,
    "USD": 1.171500,
    "GBP": 0.867130,
    "AUD": 1.615800,
}
GBP_PER_EUR = LOCKED_FX_RATES["GBP"]


# ─── ECB FX rates ─────────────────────────────────────────────────────────────

def fetch_ecb_rates() -> tuple:
    """
    Fetch EUR-based ECB reference rates.
    Returns (rates: dict, fetch_date: str, source_url: str).
    rates maps ISO code → multiplier such that EUR × rate = currency_amount.
    e.g., rates['USD'] ≈ 1.08 means 1 EUR ≈ 1.08 USD.
    """
    req = urllib.request.Request(ECB_URL, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        xml_bytes = resp.read()
    root = ET.fromstring(xml_bytes)
    ns = {"gesmes": "http://www.gesmes.org/xml/2002-08-01",
          "ecb": "http://www.ecb.int/vocabulary/2002-08-01/eurofxref"}
    cube_day = root.find(".//ecb:Cube/ecb:Cube", ns)
    fetch_date = cube_day.attrib.get("time", datetime.utcnow().strftime("%Y-%m-%d"))
    rates = {"EUR": 1.0}
    for cube in cube_day.findall("ecb:Cube", ns):
        ccy = cube.attrib["currency"]
        rates[ccy] = float(cube.attrib["rate"])
    return rates, fetch_date, ECB_URL


def fx_convert(amount: float, from_ccy: str, to_ccy: str, rates: dict) -> float:
    """Convert between two currencies via EUR pivot using ECB rates."""
    if from_ccy == to_ccy:
        return amount
    if from_ccy not in rates:
        raise ValueError(f"Unknown source currency: {from_ccy}")
    if to_ccy not in rates:
        raise ValueError(f"Unknown target currency: {to_ccy}")
    eur = amount / rates[from_ccy]
    return eur * rates[to_ccy]


# ─── CSV loading ──────────────────────────────────────────────────────────────

def norm_col(name: str) -> str:
    return (name.strip().lower()
            .replace(" ", "_").replace("(", "").replace(")", "")
            .replace("/", "_").replace("-", "_"))


def load_csvs(csv_dir: Path) -> list:
    files = []
    for p in sorted(csv_dir.glob("*.csv")):
        try:
            with p.open(encoding="utf-8-sig") as f:
                reader = csv.DictReader(f)
                orig_cols = list(reader.fieldnames or [])
                nm = {c: norm_col(c) for c in orig_cols}
                rows = [
                    {nm[k]: (v.strip() if v else "") for k, v in r.items() if k}
                    for r in reader
                ]
        except Exception as e:
            print(f"  WARNING: could not read {p.name}: {e}", file=sys.stderr)
            continue
        files.append({"path": p, "filename": p.name, "rows": rows,
                      "orig_cols": orig_cols})
    return files


def infer_regionid_from_filename(filename: str) -> str:
    """
    Some Prodigi CSV exports (au, us) lack the RegionId column. Infer it
    from filename suffix when the row's regionid is empty.
    """
    fn = filename.lower()
    if fn.endswith("-au.csv"):
        return "au"
    if fn.endswith("-us.csv"):
        return "us"
    if fn.endswith("-us_canada.csv"):
        return "us_canada"
    if fn.endswith("-europe.csv"):
        return "europe"
    return ""


def build_price_index(files: list) -> dict:
    """
    Re-keyed index. For each (sku, regionid), store a *list* of all matching
    rows preserving currency, destination, source. This lets downstream
    lookups pick the right row per region/currency rule. RegionId is inferred
    from filename when the column is absent (the au.csv / us.csv exports omit it).

    Returns: {sku: {regionid: [row_dict, ...]}} where row_dict is
    {price, currency, source, destination}.
    """
    index = defaultdict(lambda: defaultdict(list))
    for f in files:
        fallback_region = infer_regionid_from_filename(f["filename"])
        for row in f["rows"]:
            sku = row.get("sku", "").strip()
            region = row.get("regionid", "").strip().lower() or fallback_region
            if not sku or not region:
                continue
            try:
                price = float(row.get("product_price", "0").replace(",", ""))
            except (ValueError, AttributeError):
                price = None
            index[sku][region].append({
                "price": price,
                "currency": row.get("product_currency", "").upper(),
                "source": row.get("source_country", "").upper(),
                "destination": row.get("destination_country", "").upper(),
            })
    return {sku: dict(regions) for sku, regions in index.items()}


# ─── Cost-basis determination ────────────────────────────────────────────────

def determine_cost_basis(sku: str, price_index: dict) -> str:
    """
    Per-SKU cost basis: 'EUR' if europe.csv has any EUR row for this SKU,
    otherwise 'GBP'. Returns 'GBP' as fallback if SKU absent.
    """
    europe_rows = price_index.get(sku, {}).get("europe", [])
    for r in europe_rows:
        if r["currency"] == "EUR":
            return "EUR"
    return "GBP"


# ─── Region price lookup ─────────────────────────────────────────────────────

def lookup_eu(sku: str, basis: str, price_index: dict) -> float:
    """
    EU value: pick a row from europe regionid whose currency matches the
    cost basis. Numerical value stored as-is. Returns None if absent.
    """
    rows = price_index.get(sku, {}).get("europe", [])
    for r in rows:
        if r["currency"] == basis and r["price"] is not None:
            return r["price"]
    return None


def lookup_uk(sku: str, basis: str, price_index: dict, rates: dict) -> float:
    """
    UK value: pick a row from europe regionid with destination=GB.
    Convert FX into cost basis. Returns None if no GB-destination row.
    """
    rows = price_index.get(sku, {}).get("europe", [])
    # Prefer GB destination explicitly
    gb_rows = [r for r in rows if r["destination"] == "GB" and r["price"] is not None]
    if not gb_rows:
        return None
    # Prefer a row already in cost basis to avoid FX rounding
    same_basis = next((r for r in gb_rows if r["currency"] == basis), None)
    chosen = same_basis or gb_rows[0]
    if chosen["currency"] == basis:
        return chosen["price"]
    return round(fx_convert(chosen["price"], chosen["currency"], basis, rates), 2)


def lookup_us(sku: str, basis: str, price_index: dict, rates: dict) -> float:
    """
    US value: row from us_canada with destination=US and currency=USD.
    Convert USD → basis. If no USD-US row exists, return None (no fallback).
    """
    rows = price_index.get(sku, {}).get("us_canada", [])
    usd_us_rows = [r for r in rows
                   if r["destination"] == "US"
                   and r["currency"] == "USD"
                   and r["price"] is not None]
    if not usd_us_rows:
        return None
    price = usd_us_rows[0]["price"]
    if basis == "USD":
        return price
    return round(fx_convert(price, "USD", basis, rates), 2)


def lookup_au(sku: str, basis: str, price_index: dict, rates: dict) -> float:
    """
    AU value: row from au regionid with destination=AU, currency=AUD,
    source=AU (real AU production only). Cross-shipped (EUR-DE-source) rows
    are skipped. Convert AUD → basis. Returns None if no AUD-AU-source row.
    """
    rows = price_index.get(sku, {}).get("au", [])
    aud_au_rows = [r for r in rows
                   if r["destination"] == "AU"
                   and r["currency"] == "AUD"
                   and r["source"] == "AU"
                   and r["price"] is not None]
    if not aud_au_rows:
        return None
    price = aud_au_rows[0]["price"]
    return round(fx_convert(price, "AUD", basis, rates), 2)


def build_base_prices(sku: str, basis: str, price_index: dict,
                      rates: dict) -> dict:
    """Return {EU, UK, US, AU: float or None} in cost-basis currency."""
    return {
        "EU": lookup_eu(sku, basis, price_index),
        "UK": lookup_uk(sku, basis, price_index, rates),
        "US": lookup_us(sku, basis, price_index, rates),
        "AU": lookup_au(sku, basis, price_index, rates),
    }


# ─── Grouped MDX parsing/rewriting ───────────────────────────────────────────

VARIANT_HEADER_RE = re.compile(r"^  - variantId: (\S+)\s*$", re.MULTILINE)

def parse_grouped_mdx(path: Path) -> dict:
    """
    Return {'text': original_text,
            'fm_start': int, 'fm_end': int (offset of closing ---),
            'margin_pct': int,
            'variants': [{'variant_id', 'sku', 'price_cents',
                          'base_prices': {EU,UK,US,AU},
                          'start_offset', 'end_offset',
                          'bp_block_start', 'bp_block_end'}, ...]}.

    Offsets are absolute character positions in `text`. Each variant block
    spans from its '  - variantId:' line through (but not including) the
    next variant header or the closing '---'.
    """
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---"):
        raise ValueError(f"No frontmatter in {path.name}")
    try:
        fm_close_idx = text.index("\n---", 3)
    except ValueError:
        raise ValueError(f"No closing --- in {path.name}")
    fm_start = 4  # after "---\n"
    fm_end = fm_close_idx + 1  # offset of the '---' line start
    fm_text = text[fm_start:fm_end]

    # margin_pct (top-level). Accepts decimals — re-target families encode
    # the FX-cancellation factor with multi-decimal precision so storefront
    # price_cents stay within 1 cent of the legacy value.
    m = re.search(r"^margin_pct: ([\d.]+)\s*$", fm_text, re.MULTILINE)
    margin_pct = float(m.group(1)) if m else None

    fam_m = re.search(r"^family: (\S+)\s*$", fm_text, re.MULTILINE)
    family = fam_m.group(1) if fam_m else None

    # Find variant headers
    variants = []
    headers = list(VARIANT_HEADER_RE.finditer(fm_text))
    for i, h in enumerate(headers):
        variant_start = fm_start + h.start()
        variant_end = fm_start + (headers[i + 1].start() if i + 1 < len(headers)
                                  else len(fm_text))
        variant_block = text[variant_start:variant_end]
        variant_id = h.group(1)

        sku_m = re.search(r"^    sku: (\S+)\s*$", variant_block, re.MULTILINE)
        pc_m = re.search(r"^    price_cents: (\d+)\s*$", variant_block, re.MULTILINE)
        bp_header_m = re.search(r"^    base_prices:\s*$", variant_block, re.MULTILINE)
        if not (sku_m and pc_m and bp_header_m):
            raise ValueError(
                f"Variant {variant_id} in {path.name} missing sku/price_cents/base_prices"
            )

        # Walk the bp block: lines that begin with at least 6 spaces, immediately
        # following the header, until the first line not starting with 6 spaces.
        bp_block_start = variant_start + bp_header_m.start()
        bp_header_end = variant_start + bp_header_m.end()
        # Move to start of next line
        after_header = bp_header_end
        if after_header < len(text) and text[after_header] == "\n":
            after_header += 1
        # Now scan lines beginning with at least 6 spaces
        scan = after_header
        while scan < variant_start + len(variant_block):
            line_end = text.find("\n", scan)
            if line_end == -1:
                line_end = variant_start + len(variant_block)
            line = text[scan:line_end]
            if not line.startswith("      "):
                break
            scan = line_end + 1
        bp_block_end = scan  # one past the final newline of the last bp entry

        bp = {}
        bp_lines = text[after_header:bp_block_end].splitlines()
        for ln in bp_lines:
            m2 = re.match(r"\s+([A-Z]+):\s*([\d.]+)", ln)
            if m2:
                bp[m2.group(1)] = float(m2.group(2))

        # Check for existing cost_basis_currency in variant block (for round-trip)
        cbc_m = re.search(r"^    cost_basis_currency: (\S+)\s*$",
                          variant_block, re.MULTILINE)
        existing_cbc = cbc_m.group(1).strip('"') if cbc_m else None

        variants.append({
            "variant_id": variant_id,
            "sku": sku_m.group(1),
            "price_cents": int(pc_m.group(1)),
            "base_prices": bp,
            "existing_cost_basis_currency": existing_cbc,
            "block_start": variant_start,
            "block_end": variant_end,
            "bp_block_start": bp_block_start,
            "bp_block_end": bp_block_end,
        })

    return {"text": text, "fm_start": fm_start, "fm_end": fm_end,
            "margin_pct": margin_pct, "family": family, "variants": variants}


def format_base_prices_block(bp: dict, indent: str = "      ") -> str:
    """
    Format a base_prices block. Always emits 'EU: X.YY' style with two
    decimals to match the existing MDX convention.
    """
    lines = ["    base_prices:"]
    for region in ("EU", "UK", "US", "AU"):
        v = bp.get(region)
        if v is None:
            continue
        if abs(v - round(v)) < 1e-9:
            lines.append(f"{indent}{region}: {int(round(v))}.00")
        else:
            lines.append(f"{indent}{region}: {v:.2f}")
    return "\n".join(lines) + "\n"


def rewrite_grouped_mdx(parsed: dict, new_variants: list,
                        new_cbc_per_variant: dict,
                        new_pc_per_variant: dict) -> str:
    """
    Reconstruct full MDX text with updated base_prices, cost_basis_currency,
    and price_cents per variant. new_variants maps variant_id → new_bp dict.
    new_cbc_per_variant maps variant_id → basis string. new_pc_per_variant
    maps variant_id → recomputed price_cents int.

    Strategy: process variants in reverse order (so offsets remain valid as we
    splice). For each variant:
      1. Replace bp_block (from bp_block_start to bp_block_end) with new bp text.
      2. Re-locate the variant block by variantId, then replace/insert
         cost_basis_currency and rewrite the price_cents line.
    """
    text = parsed["text"]
    # Sort variants by block_start in reverse so edits don't invalidate offsets
    sorted_vars = sorted(parsed["variants"], key=lambda v: v["block_start"],
                         reverse=True)

    for v in sorted_vars:
        new_bp = new_variants.get(v["variant_id"])
        if new_bp is None:
            continue
        new_cbc = new_cbc_per_variant.get(v["variant_id"])
        new_pc = new_pc_per_variant.get(v["variant_id"])

        # 1. Replace base_prices block
        new_bp_text = format_base_prices_block(new_bp)
        text = text[:v["bp_block_start"]] + new_bp_text + text[v["bp_block_end"]:]

        # 2. Re-locate variant block (offsets shifted after bp replace).
        header_re = re.compile(rf"^  - variantId: {re.escape(v['variant_id'])}\s*$",
                               re.MULTILINE)
        hm = header_re.search(text)
        if not hm:
            raise RuntimeError(f"Lost variant {v['variant_id']} during rewrite")
        next_hm = re.search(r"^  - variantId: \S+\s*$|^---\s*$",
                            text[hm.end():], re.MULTILINE)
        block_end = hm.end() + (next_hm.start() if next_hm else len(text) - hm.end())
        var_block = text[hm.end():block_end]

        # 2a. Rewrite price_cents
        if new_pc is not None:
            pc_re = re.compile(r"^(    price_cents: )\d+(\s*)$", re.MULTILINE)
            new_var_block, n_pc = pc_re.subn(rf"\g<1>{new_pc}\g<2>", var_block)
            if n_pc != 1:
                raise RuntimeError(
                    f"Could not rewrite price_cents for {v['variant_id']} "
                    f"(matched {n_pc} times)")
            var_block = new_var_block

        # 2b. Handle cost_basis_currency line (insert or replace).
        if new_cbc is None:
            text = text[:hm.end()] + var_block + text[block_end:]
            continue
        cbc_re = re.compile(r"^    cost_basis_currency: \S+\s*$", re.MULTILINE)
        new_cbc_line = f"    cost_basis_currency: {new_cbc}\n"
        if cbc_re.search(var_block):
            new_var_block = cbc_re.sub(new_cbc_line.rstrip(), var_block)
        else:
            # Insert after base_prices block.
            bp_hdr = re.search(r"^    base_prices:\s*\n(?:      [A-Z]+: [^\n]+\n)+",
                               var_block, re.MULTILINE)
            if not bp_hdr:
                raise RuntimeError(f"Could not locate base_prices block for "
                                   f"{v['variant_id']} after rewrite")
            insert_at = bp_hdr.end()
            new_var_block = var_block[:insert_at] + new_cbc_line + var_block[insert_at:]
        text = text[:hm.end()] + new_var_block + text[block_end:]

    return text


# ─── Discovery report ────────────────────────────────────────────────────────

def run_discover(files: list, price_index: dict, report_path: Path) -> None:
    lines = []
    ts = datetime.now().strftime("%Y-%m-%d %H:%M UTC")
    lines += [f"# Prodigi pricing extraction — discovery report ({ts})", ""]
    lines += [f"Source: `scripts/extract-prodigi-pricing.py --discover`", ""]

    # File inventory
    lines += ["## CSV file inventory", ""]
    lines += [f"Total CSV files: **{len(files)}**", ""]
    lines += ["| Filename | Rows | RegionId source |", "|---|---|---|"]
    for f in files:
        has_rid = any("regionid" == c for c in
                      [norm_col(c) for c in f["orig_cols"]])
        if has_rid:
            origin = "column"
        else:
            inferred = infer_regionid_from_filename(f["filename"])
            origin = f"inferred ({inferred})" if inferred else "n/a — skipped"
        lines.append(f"| `{f['filename']}` | {len(f['rows'])} | {origin} |")
    lines.append("")

    # Per-regionid coverage
    lines += ["## SKUs indexed by regionid", ""]
    region_counts = defaultdict(int)
    for sku, regions in price_index.items():
        for r in regions:
            region_counts[r] += 1
    lines += ["| regionid | distinct SKUs |", "|---|---|"]
    for rid, cnt in sorted(region_counts.items()):
        lines.append(f"| {rid} | {cnt} |")
    lines.append("")

    # Family-level currency mix for europe regionid
    lines += ["## Currency mix per family (europe regionid)", ""]
    sku_prefixes = {
        "Canvas stretched": "CAN-",
        "C-type Lustre": "ART-PAP-LPP-",
        "EMA fine art": "GLOBAL-FAP-",
        "HPR fine art": "GLOBAL-HPR-",
        "HGE fine art": "GLOBAL-HGE-",
        "Greeting card": "GLOBAL-GRE-",
        "Postcard": "GLOBAL-POST-",
        "Framed print": "FRA-",
        "Book": "BOOK-FE-",
        "Calendar": "CALENDAR-",
    }
    lines += ["| Family | EUR-only | GBP-only | Mixed | Total SKUs |",
              "|---|---|---|---|---|"]
    for label, prefix in sku_prefixes.items():
        eur_only = gbp_only = mixed = total = 0
        for sku, regions in price_index.items():
            if not sku.startswith(prefix):
                continue
            europe = regions.get("europe", [])
            currencies = {r["currency"] for r in europe if r["currency"]}
            if not currencies:
                continue
            total += 1
            if currencies == {"EUR"}:
                eur_only += 1
            elif currencies == {"GBP"}:
                gbp_only += 1
            else:
                mixed += 1
        lines.append(f"| {label} ({prefix}…) | {eur_only} | {gbp_only} | "
                     f"{mixed} | {total} |")
    lines.append("")

    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"Discovery report written: {report_path}")


# ─── Update pass ─────────────────────────────────────────────────────────────

def compute_price_cents(eu_price: float, margin_pct: float,
                        cost_basis_currency: str) -> int:
    """
    Storefront price_cents in EUR. eu_price arrives in the variant's
    cost-basis currency (per build_base_prices); GBP-basis variants must
    FX-convert to EUR before margin is applied, otherwise the price treats
    GBP base as EUR and under-prices by the FX gap (the bug fixed in
    Session 2). See GBP_PER_EUR constant.
    """
    if cost_basis_currency == "GBP":
        eur_base = eu_price / GBP_PER_EUR
    else:
        eur_base = eu_price
    return round(eur_base * (1 + margin_pct / 100) * 100)


def write_fx_notes(rates: dict, fetch_date: str, source_url: str) -> None:
    lines = [
        "# ECB FX rates captured for pricing extraction",
        "",
        f"- Source: {source_url}",
        f"- Fetch date (ECB): {fetch_date}",
        f"- Captured by: scripts/extract-prodigi-pricing.py",
        "",
        "## Rates (EUR base)",
        "",
        "| Currency | Rate (1 EUR = …) |",
        "|---|---|",
    ]
    for ccy in ("USD", "GBP", "AUD"):
        if ccy in rates:
            lines.append(f"| {ccy} | {rates[ccy]:.6f} |")
    lines.append("")
    lines += [
        "## Conversion identities used in extraction",
        "",
        "- USD → EUR: amount / rates['USD']",
        "- GBP → EUR: amount / rates['GBP']",
        "- AUD → EUR: amount / rates['AUD']",
        "- Cross-conversions pivot through EUR.",
    ]
    FX_NOTES_PATH.write_text("\n".join(lines), encoding="utf-8")
    print(f"FX rate notes written: {FX_NOTES_PATH}")


def run_update(files: list, price_index: dict, products_dir: Path,
               dry_run: bool, rates: dict) -> None:
    mdx_files = sorted(products_dir.glob("*.mdx"))
    summary = {
        "files_total": 0,
        "files_modified": 0,
        "variants_total": 0,
        "variants_eu_changed": 0,
        "variants_uk_now_present": 0,
        "variants_us_now_present": 0,
        "variants_au_now_present": 0,
        "variants_us_null": 0,
        "variants_au_null": 0,
        "variants_price_cents_drift": 0,
        "skus_not_in_index": [],
    }
    sample_diffs = []
    pc_drift_details = []

    for path in mdx_files:
        if path.name.startswith("_"):
            continue
        summary["files_total"] += 1
        try:
            parsed = parse_grouped_mdx(path)
        except ValueError as e:
            print(f"  SKIP {path.name}: {e}")
            continue
        margin_pct = parsed["margin_pct"]
        if margin_pct is None:
            print(f"  SKIP {path.name}: no margin_pct")
            continue

        # HPB is deferred (Session 12d activation). Leave the MDX byte-identical
        # — no base_prices refresh, no price_cents recompute. Without this skip
        # the formula fix would propagate the FX correction to HPB landscape and
        # change customer-facing prices outside the deferred scope.
        if parsed["family"] == "hpb":
            print(f"  SKIP {path.name}: family=hpb (deferred)")
            continue

        new_variants_bp = {}
        new_variants_cbc = {}
        new_variants_pc = {}
        file_changed = False

        for v in parsed["variants"]:
            summary["variants_total"] += 1
            sku = v["sku"]
            if sku not in price_index:
                summary["skus_not_in_index"].append((path.name, sku))
                continue
            basis = determine_cost_basis(sku, price_index)
            new_bp = build_base_prices(sku, basis, price_index, rates)
            old_bp = v["base_prices"]
            old_pc = v["price_cents"]

            if new_bp["EU"] is None:
                summary["skus_not_in_index"].append((path.name, f"{sku}-EU-null"))
                continue

            new_pc = compute_price_cents(new_bp["EU"], margin_pct, basis)
            if new_pc != old_pc:
                summary["variants_price_cents_drift"] += 1
                pc_drift_details.append(
                    (path.name, v["variant_id"], sku, basis,
                     old_pc, new_pc, old_bp.get("EU"), new_bp["EU"])
                )

            # Tally changes
            old_eu = old_bp.get("EU")
            if old_eu is not None and abs(new_bp["EU"] - old_eu) > 0.005:
                summary["variants_eu_changed"] += 1
            if new_bp["UK"] is not None and old_bp.get("UK") is not None and \
                    abs(new_bp["UK"] - old_bp.get("UK")) > 0.005:
                summary["variants_uk_now_present"] += 1
            elif new_bp["UK"] is not None and old_bp.get("UK") is None:
                summary["variants_uk_now_present"] += 1
            if new_bp["US"] is not None:
                if old_bp.get("US") is None or \
                        abs(new_bp["US"] - old_bp.get("US")) > 0.005:
                    summary["variants_us_now_present"] += 1
            else:
                summary["variants_us_null"] += 1
            if new_bp["AU"] is not None:
                if old_bp.get("AU") is None or \
                        abs(new_bp["AU"] - old_bp.get("AU")) > 0.005:
                    summary["variants_au_now_present"] += 1
            else:
                summary["variants_au_null"] += 1

            new_variants_bp[v["variant_id"]] = new_bp
            new_variants_cbc[v["variant_id"]] = basis
            new_variants_pc[v["variant_id"]] = new_pc

            if len(sample_diffs) < 8:
                sample_diffs.append({
                    "file": path.name,
                    "variant": v["variant_id"],
                    "sku": sku,
                    "basis": basis,
                    "old_bp": old_bp,
                    "new_bp": {k: v for k, v in new_bp.items() if v is not None},
                    "old_pc": old_pc,
                    "new_pc": new_pc,
                })

            # File-changed test
            if (old_eu != new_bp["EU"] or
                old_bp.get("UK") != new_bp["UK"] or
                old_bp.get("US") != new_bp["US"] or
                old_bp.get("AU") != new_bp["AU"] or
                v["existing_cost_basis_currency"] != basis or
                old_pc != new_pc):
                file_changed = True

        if new_variants_bp and file_changed and not dry_run:
            new_text = rewrite_grouped_mdx(parsed, new_variants_bp,
                                           new_variants_cbc, new_variants_pc)
            path.write_text(new_text, encoding="utf-8")
        if file_changed:
            summary["files_modified"] += 1

    # Print summary
    mode = "[DRY RUN] " if dry_run else ""
    print(f"\n{'='*64}")
    print(f"{mode}Update summary")
    print(f"{'='*64}")
    print(f"  Files scanned:               {summary['files_total']}")
    print(f"  Files modified:              {summary['files_modified']}")
    print(f"  Variants scanned:            {summary['variants_total']}")
    print(f"  Variants EU value changed:   {summary['variants_eu_changed']}")
    print(f"  Variants UK populated:       {summary['variants_uk_now_present']}")
    print(f"  Variants US populated:       {summary['variants_us_now_present']}")
    print(f"  Variants US set to null:     {summary['variants_us_null']}")
    print(f"  Variants AU populated:       {summary['variants_au_now_present']}")
    print(f"  Variants AU set to null:     {summary['variants_au_null']}")
    print(f"  price_cents drift detected:  {summary['variants_price_cents_drift']}")
    if summary["skus_not_in_index"]:
        print(f"  SKUs not in CSV index:     {len(summary['skus_not_in_index'])}")
        for fn, sku in summary["skus_not_in_index"][:10]:
            print(f"    - {fn}: {sku}")
    print()

    if summary["variants_price_cents_drift"] > 0:
        print("PRICE_CENTS DRIFT DETAILS — halt and review:")
        for fn, vid, sku, basis, old_pc, new_pc, old_eu, new_eu in pc_drift_details[:30]:
            print(f"  {fn} :: {vid} :: {sku} :: basis={basis} "
                  f":: pc {old_pc} → {new_pc} :: EU {old_eu} → {new_eu}")
        print()

    print("Sample variant diffs:")
    for s in sample_diffs:
        print(f"  [{s['basis']}] {s['file']} :: {s['variant']}")
        print(f"    SKU: {s['sku']}")
        print(f"    base_prices: {s['old_bp']} → {s['new_bp']}")
        print(f"    price_cents: {s['old_pc']} → {s['new_pc']}")
    print(f"{'='*64}\n")


# ─── Acceptance check ────────────────────────────────────────────────────────

def run_acceptance_check(products_dir: Path) -> None:
    print("\nAcceptance check …")
    zero_pc = []
    missing_cbc = 0
    total_variants = 0
    for path in products_dir.glob("*.mdx"):
        if path.name.startswith("_"):
            continue
        text = path.read_text(encoding="utf-8")
        # zero price_cents
        for m in re.finditer(r"^    price_cents: (\d+)$", text, re.MULTILINE):
            total_variants += 1
            if m.group(1) == "0":
                zero_pc.append(path.name)
        # cost_basis_currency present per variant?
        variant_headers = re.findall(r"^  - variantId: \S+\s*$", text, re.MULTILINE)
        cbc_lines = re.findall(r"^    cost_basis_currency: \S+\s*$", text, re.MULTILINE)
        if len(variant_headers) and len(cbc_lines) < len(variant_headers):
            missing_cbc += len(variant_headers) - len(cbc_lines)
    if zero_pc:
        print(f"  WARN: {len(zero_pc)} files have a price_cents: 0 variant")
        for n in zero_pc[:5]:
            print(f"    {n}")
    else:
        print("  OK: no zero price_cents")
    print(f"  Total variants seen: {total_variants}")
    print(f"  Variants without cost_basis_currency: {missing_cbc}")


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--discover", action="store_true",
                    help="Read CSVs, write discovery report")
    ap.add_argument("--update", action="store_true",
                    help="Walk grouped MDX and refresh per-variant prices")
    ap.add_argument("--dry-run", action="store_true",
                    help="With --update: report but do not write")
    ap.add_argument("--check", action="store_true",
                    help="Run acceptance checks only")
    ap.add_argument("--refresh-fx", action="store_true",
                    help="Fetch live ECB FX rates instead of using the "
                         "values locked in extract-prodigi-pricing.py / "
                         "extraction-fx-rates.md.")
    ap.add_argument("--csv-dir", default=None,
                    help="Directory with Prodigi pricing CSVs")
    ap.add_argument("--products-dir", default=PRODUCTS_DIR_DEFAULT,
                    help=f"Grouped MDX directory (default: {PRODUCTS_DIR_DEFAULT})")
    ap.add_argument("--report", default=REPORT_PATH_DEFAULT,
                    help="Discovery report output path")
    args = ap.parse_args()

    if not (args.discover or args.update or args.check):
        ap.print_help()
        sys.exit(1)

    if (args.discover or args.update) and not args.csv_dir:
        print("ERROR: --csv-dir required for --discover/--update", file=sys.stderr)
        sys.exit(1)

    products_dir = Path(args.products_dir)
    report_path = Path(args.report)

    if args.check:
        if not products_dir.exists():
            print(f"ERROR: products dir not found: {products_dir}", file=sys.stderr)
            sys.exit(1)
        run_acceptance_check(products_dir)
        return

    csv_dir = Path(args.csv_dir)
    if not csv_dir.exists():
        print(f"ERROR: CSV dir not found: {csv_dir}", file=sys.stderr)
        sys.exit(1)
    if not products_dir.exists():
        print(f"ERROR: products dir not found: {products_dir}", file=sys.stderr)
        sys.exit(1)

    print(f"Loading CSVs from: {csv_dir}")
    files = load_csvs(csv_dir)
    print(f"  Loaded {len(files)} CSV files.")

    print("Building price index …")
    price_index = build_price_index(files)
    print(f"  {len(price_index)} unique SKUs indexed.")

    if args.update:
        if args.refresh_fx:
            print(f"\nFetching ECB FX rates from {ECB_URL} …")
            rates, fetch_date, source_url = fetch_ecb_rates()
        else:
            print(f"\nUsing locked FX rates from {LOCKED_FX_DATE} "
                  "(scripts/extraction-fx-rates.md). Pass --refresh-fx to refetch.")
            rates = dict(LOCKED_FX_RATES)
            fetch_date = LOCKED_FX_DATE
            source_url = "scripts/extraction-fx-rates.md (locked)"
        print(f"  Fetch date: {fetch_date}")
        for ccy in ("USD", "GBP", "AUD"):
            if ccy in rates:
                print(f"  1 EUR = {rates[ccy]:.6f} {ccy}")
        if not args.dry_run and args.refresh_fx:
            write_fx_notes(rates, fetch_date, source_url)
    else:
        rates = None

    if args.discover:
        run_discover(files, price_index, report_path)

    if args.update:
        run_update(files, price_index, products_dir,
                   dry_run=args.dry_run, rates=rates)

    if args.update and not args.dry_run:
        run_acceptance_check(products_dir)


if __name__ == "__main__":
    main()
