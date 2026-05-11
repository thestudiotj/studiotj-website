#!/usr/bin/env python3
"""
Session 12c-pricing: Prodigi SKU mapping and real pricing extraction.

Stages:
  --discover : Read all CSVs, build inventory, write sku-mapping-report.md
  --update   : Match MDX files to real SKUs, update base_prices and price_cents
  Both flags may be combined to run stages sequentially.

Paths default to Hetzner layout; override with --csv-dir and --products-dir.

Usage:
  python scripts/extract-prodigi-pricing.py --discover
  python scripts/extract-prodigi-pricing.py --update [--dry-run]
  python scripts/extract-prodigi-pricing.py --discover --update [--dry-run]
"""

import argparse
import csv
import math
import re
import sys
from collections import defaultdict
from pathlib import Path
from datetime import datetime

# ─── Default paths ────────────────────────────────────────────────────────────
# Resolve repo root relative to this script's location (<repo>/scripts/this.py)
_SCRIPT_DIR = Path(__file__).resolve().parent
_REPO_ROOT = _SCRIPT_DIR.parent

CSV_DIR_DEFAULT = None  # Must be supplied via --csv-dir
PRODUCTS_DIR_DEFAULT = str(_REPO_ROOT / "content" / "products")
REPORT_PATH_DEFAULT = str(_SCRIPT_DIR / "sku-mapping-report.md")

# ─── Locked margin table ──────────────────────────────────────────────────────
MARGIN_TABLE = {
    "HPR": 50, "HGE": 50, "EMA": 70, "CLP": 150,
    "canvas-stretched": 70, "canvas-framed": 60,
    "framed": 60, "book-hardcover": 100, "book-softcover": 90,
    "card": 250, "postcard": 350, "calendar": 100,
}

# Customer region → CSV RegionId candidates (first match wins)
REGION_CSV_IDS = {
    "EU": ["europe", "european_economic_area"],
    "UK": ["europe", "european_economic_area"],
    "US": ["us_canada", "us"],
    "AU": ["au"],
}

# ─── Size normalization ───────────────────────────────────────────────────────
# MDX `size` display string → canonical size key used in SKU lookups
BOOK_SIZE_MAP = {
    "A5 Portrait": "A5-P",
    "A5 Landscape": "A5-L",
    "A4 Portrait": "A4-P",
    "A4 Landscape": "A4-L",
    '8.3" Square': "8_3-SQ",
}

CARD_SIZE_MAP = {
    '6×4"': "6X4IN",
    '5.5×5.5" sq': "5X5SQ",
    '7×5"': "7X5IN",
}

PACK_ID_MAP = {
    "single": "1",
    "pack10": "10",
    "pack20": "20",
    "pack50": "50",
    "pack100": "100",
}


def normalize_size_key(size_str: str, family: str) -> str:
    """Convert MDX `size` display value to canonical SKU size key."""
    s = str(size_str).strip()
    if family in ("HPR", "HGE", "EMA", "framed"):
        return s.replace("×", "X").replace('"', "").replace(" ", "").upper()
    if family == "CLP":
        return s.replace("×", "X").replace('"', "").replace(" ", "").upper()
    if family in ("canvas-stretched", "canvas-framed"):
        return s.replace("×", "X").replace('"', "").replace(" ", "").upper()
    if family in ("card", "postcard"):
        return CARD_SIZE_MAP.get(s, s.replace("×", "X").replace('"', "").replace(" ", "").upper())
    if family in ("book-hardcover", "book-softcover"):
        return BOOK_SIZE_MAP.get(s, s.replace(" ", "").upper())
    if family == "calendar":
        if "A4" in s:
            return "A4"
        if "A5" in s:
            return "A5"
        return s.upper()
    return s.upper()


def extract_pack_from_id(product_id: str) -> str:
    """Extract pack tier string from product ID for card/postcard lookup."""
    for suffix, val in PACK_ID_MAP.items():
        if product_id.endswith(f"-{suffix}"):
            return val
    return "1"


# ─── CSV loading ──────────────────────────────────────────────────────────────

def norm_col(name: str) -> str:
    """Normalize CSV column header for consistent lookup."""
    return (name.strip().lower()
            .replace(" ", "_").replace("(", "").replace(")", "")
            .replace("/", "_").replace("-", "_"))


def load_csvs(csv_dir: Path) -> list:
    """Load all *.csv files; return list of file records."""
    files = []
    for p in sorted(csv_dir.glob("*.csv")):
        try:
            with p.open(encoding="utf-8-sig") as f:
                reader = csv.DictReader(f)
                orig_cols = list(reader.fieldnames or [])
                norm_map = {c: norm_col(c) for c in orig_cols}
                rows = []
                for row in reader:
                    norm_row = {norm_map[k]: (v.strip() if v else "") for k, v in row.items() if k}
                    rows.append(norm_row)
        except Exception as e:
            print(f"  WARNING: could not read {p.name}: {e}", file=sys.stderr)
            continue
        files.append({
            "path": p,
            "filename": p.name,
            "rows": rows,
            "orig_cols": orig_cols,
            "norm_cols": [norm_map[c] for c in orig_cols],
        })
    return files


def build_price_index(files: list) -> dict:
    """
    Build {sku: {region_id: {price, currency, source}}} from all CSV rows.
    One entry per (SKU × RegionId); duplicates are ignored (same price per region).
    """
    index = defaultdict(dict)
    for f in files:
        for row in f["rows"]:
            sku = row.get("sku", "").strip()
            region = row.get("regionid", "").strip().lower()
            if not sku or not region:
                continue
            if region in index[sku]:
                continue
            try:
                price = float(row.get("product_price", "0").replace(",", ""))
            except (ValueError, AttributeError):
                price = None
            index[sku][region] = {
                "price": price,
                "currency": row.get("product_currency", ""),
                "source": row.get("source_country", ""),
            }
    return dict(index)


def get_price(price_index: dict, sku: str, customer_region: str):
    """Return (price, currency) for sku × customer_region, or (None, None)."""
    if sku not in price_index:
        return None, None
    region_data = price_index[sku]
    for csv_rid in REGION_CSV_IDS.get(customer_region, []):
        if csv_rid in region_data:
            r = region_data[csv_rid]
            return r["price"], r["currency"]
    return None, None


# ─── CSV-based family lookup builders ────────────────────────────────────────

def col_contains(row: dict, col: str, needle: str) -> bool:
    return needle.lower() in row.get(col, "").lower()


def build_canvas_stretched_lookup(files: list, price_index: dict) -> dict:
    """
    {size_key: sku} for stretched canvas (38mm ImageWrap, Standard canvas).
    Uses europe region rows to find SKUs.
    """
    lookup = {}
    seen_candidates = []
    for f in files:
        fn = f["filename"].lower()
        if "canvas" not in fn:
            continue
        for row in f["rows"]:
            region = row.get("regionid", "").lower()
            if "europe" not in region:
                continue
            sku = row.get("sku", "")
            wrap = row.get("wrap", "")
            paper = row.get("paper_type", row.get("paper", ""))
            size_in = row.get("size_inches", row.get("size_in", ""))
            is_imagewrap = "imagewrap" in wrap.lower() or "image wrap" in wrap.lower()
            is_standard = ("standard" in paper.lower() or "sc" in paper.upper()
                           or "SC" in sku)
            is_38mm = "38MM" in sku.upper() or "38mm" in fn
            if not (is_imagewrap or is_38mm):
                continue
            if not sku:
                continue
            seen_candidates.append({"sku": sku, "wrap": wrap, "paper": paper, "size_in": size_in})
            size_key = parse_csv_size_inches(size_in)
            if size_key and sku not in lookup.values():
                lookup[size_key] = sku
    return lookup, seen_candidates


def build_canvas_framed_lookup(files: list, price_index: dict) -> dict:
    """
    {size_key: sku} for framed canvas (38mm, Standard canvas, Black frame).
    """
    lookup = {}
    seen_candidates = []
    for f in files:
        fn = f["filename"].lower()
        if "canvas" not in fn:
            continue
        for row in f["rows"]:
            region = row.get("regionid", "").lower()
            if "europe" not in region:
                continue
            sku = row.get("sku", "")
            frame = row.get("frame", row.get("frame_colour", row.get("style", "")))
            paper = row.get("paper_type", row.get("paper", ""))
            size_in = row.get("size_inches", row.get("size_in", ""))
            if not sku:
                continue
            is_38mm = "38MM" in sku.upper()
            is_sc = ("standard" in paper.lower() or "sc" in paper.upper() or "SC" in sku)
            is_black = ("black" in frame.lower() or "blk" in sku.upper()
                        or "bk" in sku.upper() or "-B-" in sku or "_B_" in sku)
            is_framed = ("FRA" in sku.upper() or "framed" in fn.lower()
                         or "FRC" in sku.upper())
            # Must look like a framed canvas: has 38MM + framed indicator
            if not (is_38mm and is_framed):
                continue
            seen_candidates.append({"sku": sku, "frame": frame, "paper": paper,
                                     "size_in": size_in, "is_black": is_black})
            if is_black and is_sc:
                size_key = parse_csv_size_inches(size_in)
                if size_key:
                    lookup[size_key] = sku
    return lookup, seen_candidates


def build_framed_prints_lookup(files: list, price_index: dict) -> dict:
    """
    {(size_key, color_key): sku} for framed art prints (Classic frame).
    Locked colors: black, white, natural-oak.

    Preferred product: HPR paper, No Mount, Float Glass (matches MDX "no mount, glass glaze").
    Falls back to any Classic frame entry for sizes where NM variant is unavailable.

    CSV column layout (framed-prints files):
      "Frame"       -> row["frame"]       : frame style, e.g. "Classic"
      "Color"       -> row["color"]       : frame finish, e.g. "black", "white", "natural"
      "Mount"       -> row["mount"]       : mount type, e.g. "No mount / Mat", "1.4mm"
      "Paper type"  -> row["paper_type"]  : paper substrate, e.g. "HPR", "EMA", "LPP"
      "Mount color" -> row["mount_color"] : mat board color (NOT the frame color)
    """
    # Three priority tiers: HPR-NM (best) > any-NM > mounted (fallback)
    tier1 = {}  # HPR paper + no-mount: exact match for "no mount, glass glaze" MDX products
    tier2 = {}  # no-mount, non-HPR paper
    tier3 = {}  # mounted variants (any Classic frame)
    seen_candidates = []
    for f in files:
        fn = f["filename"].lower()
        if "framed" not in fn or "canvas" in fn:
            continue
        for row in f["rows"]:
            region = row.get("regionid", "").lower()
            if "europe" not in region:
                continue
            sku = row.get("sku", "")
            frame = row.get("frame", row.get("style", ""))
            color_raw = row.get("color", row.get("colour", ""))
            size_in = row.get("size_inches", row.get("size_in", ""))
            mount = row.get("mount", "").lower()
            paper = row.get("paper_type", "").upper()
            if not sku:
                continue
            is_classic = "classic" in frame.lower() or not frame
            is_no_mount = "no" in mount
            color_key = normalize_frame_color(color_raw or extract_color_from_sku(sku))
            seen_candidates.append({"sku": sku, "frame": frame, "color_raw": color_raw,
                                     "size_in": size_in, "color_key": color_key,
                                     "paper": paper, "is_no_mount": is_no_mount})
            if is_classic and color_key in ("black", "white", "natural-oak"):
                size_key = parse_csv_size_inches(size_in)
                if size_key:
                    if is_no_mount and paper == "HPR":
                        tier1[(size_key, color_key)] = sku
                    elif is_no_mount:
                        tier2[(size_key, color_key)] = sku
                    else:
                        tier3[(size_key, color_key)] = sku
    lookup = {**tier3, **tier2, **tier1}  # tier1 (HPR-NM) wins
    return lookup, seen_candidates


def build_photo_paper_lookup(files: list, price_index: dict) -> dict:
    """
    {(paper_code, size_key): sku} for fine art photo papers: HPR, HGE, EMA.
    Also builds {('CLP', size_key): sku} for C-type Lustre Pro.
    """
    lookup = {}
    seen_candidates = []
    for f in files:
        fn = f["filename"].lower()
        if "print" not in fn and "photo" not in fn and "art" not in fn:
            continue
        for row in f["rows"]:
            region = row.get("regionid", "").lower()
            if "europe" not in region:
                continue
            sku = row.get("sku", "")
            paper = row.get("paper_type", row.get("paper", row.get("finish", "")))
            size_in = row.get("size_inches", row.get("size_in", ""))
            if not sku:
                continue
            paper_code = classify_paper(paper, sku)
            if paper_code:
                size_key = parse_csv_size_inches(size_in)
                if size_key:
                    seen_candidates.append({"sku": sku, "paper": paper,
                                            "code": paper_code, "size": size_key})
                    lookup[(paper_code, size_key)] = sku
    return lookup, seen_candidates


def build_card_lookup(files: list, price_index: dict) -> dict:
    """
    {(size_key, pack): sku} for greeting cards (Mohawk 324gsm, BLA).
    Separately: {(size_key, pack): sku} for postcards.
    """
    card_lookup = {}
    postcard_lookup = {}
    card_candidates = []
    postcard_candidates = []
    for f in files:
        fn = f["filename"].lower()
        is_card = "greeting" in fn or ("card" in fn and "postcard" not in fn)
        is_postcard = "postcard" in fn
        if not (is_card or is_postcard):
            continue
        for row in f["rows"]:
            region = row.get("regionid", "").lower()
            if "europe" not in region:
                continue
            sku = row.get("sku", "")
            substrate = row.get("substrate_weight", row.get("substrate", row.get("paper", "")))
            if not sku:
                continue
            # Filter: Mohawk paper
            is_mohawk = "mohawk" in substrate.lower() or "mohawk" in sku.lower() or "moh" in sku.lower()
            # Filter: BLA (blank inside)
            is_bla = "bla" in sku.lower() or "blank" in sku.lower()
            if not (is_mohawk and is_bla):
                continue
            # Extract size and pack from SKU
            size_key, pack = extract_card_size_pack_from_sku(sku, is_postcard)
            if is_card:
                card_candidates.append({"sku": sku, "substrate": substrate,
                                         "size": size_key, "pack": pack})
                if size_key and pack:
                    card_lookup[(size_key, pack)] = sku
            else:
                postcard_candidates.append({"sku": sku, "substrate": substrate,
                                             "size": size_key, "pack": pack})
                if size_key and pack:
                    postcard_lookup[(size_key, pack)] = sku
    return card_lookup, postcard_lookup, card_candidates, postcard_candidates


def build_book_lookup(price_index: dict) -> dict:
    """
    Derive book SKUs from known pattern BOOK-FE-{size1}-{size2}-{HARD/SOFT}-MHK.
    Real Prodigi format: BOOK-FE-A4-L-HARD-MHK (6 dash-delimited parts).
    Returns {(book_format, size_key): sku} where size_key = "A4-L", "8_3-SQ", etc.
    """
    lookup = {}
    for sku in price_index:
        if not sku.startswith("BOOK-") or not sku.endswith("-MHK"):
            continue
        parts = sku.split("-")
        # Expected: ["BOOK", "FE", <sz1>, <sz2>, "HARD"|"SOFT", "MHK"]
        if len(parts) < 6:
            continue
        book_type = parts[4].upper()   # HARD or SOFT
        size_key = parts[2] + "-" + parts[3]  # e.g. "A4-L", "8_3-SQ"
        if book_type == "HARD":
            lookup[("book-hardcover", size_key)] = sku
        elif book_type == "SOFT":
            lookup[("book-softcover", size_key)] = sku
    return lookup


def build_calendar_lookup(price_index: dict) -> dict:
    """
    Derive calendar SKUs from known pattern CALENDAR-{A4/A5}-L-UNDATED.
    """
    lookup = {}
    for sku in price_index:
        if not sku.startswith("CALENDAR-"):
            continue
        if "A4" in sku:
            lookup["A4"] = sku
        elif "A5" in sku:
            lookup["A5"] = sku
    return lookup


# ─── Utility: size parsing from CSV columns ───────────────────────────────────

A4_APPROX = (8.27, 11.69)
A5_APPROX = (5.83, 8.27)
A3_APPROX = (11.69, 16.54)
A2_APPROX = (16.54, 23.39)
A1_APPROX = (23.39, 33.11)
A_SIZES = [("A5", A5_APPROX), ("A4", A4_APPROX), ("A3", A3_APPROX),
           ("A2", A2_APPROX), ("A1", A1_APPROX)]


def parse_csv_size_inches(size_str: str) -> str:
    """
    Parse Size (inches) CSV column to canonical size key.
    "8.3 x 11.7" → "A4", "16 x 12" → "16X12", "8.3" → "83SQ"
    """
    if not size_str:
        return ""
    s = size_str.strip().lower()
    m = re.match(r"(\d+\.?\d*)\s*[xX×]\s*(\d+\.?\d*)", s)
    if m:
        w, h = float(m.group(1)), float(m.group(2))
        # Check A-size (both orientations)
        for aname, (aw, ah) in A_SIZES:
            if ((abs(w - aw) < 0.3 and abs(h - ah) < 0.3) or
                    (abs(w - ah) < 0.3 and abs(h - aw) < 0.3)):
                return aname
        wi = round(w); hi = round(h)
        return f"{wi}X{hi}"
    m2 = re.match(r"(\d+\.?\d*)", s)
    if m2:
        v = float(m2.group(1))
        vi = str(round(v * 10)).lstrip("0") if (v != round(v)) else str(int(v))
        return f"{vi}SQ"
    return ""


def classify_paper(paper_col: str, sku: str) -> str:
    """Map paper_type column value (or SKU hint) to HPR/HGE/EMA/CLP."""
    combined = (paper_col + " " + sku).lower()
    if "photo rag" in combined or "hpr" in combined:
        return "HPR"
    if "german etching" in combined or "hge" in combined:
        return "HGE"
    if "enhanced matte" in combined or "ema" in combined or "matte art" in combined:
        return "EMA"
    if ("lustre" in combined or "lpp" in combined or "c-type" in combined
            or "ctype" in combined or "c type" in combined):
        return "CLP"
    return ""


def normalize_frame_color(color: str) -> str:
    """Map color string to locked set: black / white / natural-oak."""
    c = color.lower()
    if "natural" in c or "oak" in c:
        return "natural-oak"
    if "white" in c:
        return "white"
    if "black" in c:
        return "black"
    return c


def extract_color_from_sku(sku: str) -> str:
    """Try to infer frame color from SKU string."""
    u = sku.upper()
    if "-BLK" in u or "-BK-" in u or u.endswith("-BK"):
        return "black"
    if "-WHT" in u or "-WH-" in u or u.endswith("-WH"):
        return "white"
    if "-NAT" in u or "-OAK" in u:
        return "natural-oak"
    return ""


def extract_card_size_pack_from_sku(sku: str, is_postcard: bool) -> tuple:
    """
    Extract (size_key, pack) from a greeting-card or postcard SKU.
    Returns ("", "") if unable to parse.
    """
    u = sku.upper()
    # Size tokens
    size_key = ""
    for token in ("6X4IN", "7X5IN", "5X5SQ", "6X4", "7X5", "5X5"):
        if token in u:
            size_key = token if token.endswith("IN") or token.endswith("SQ") else token + "IN"
            if "5X5" in token:
                size_key = "5X5SQ"
            break
    # Pack count
    pack = ""
    for n in ("100", "50", "20", "10", "1"):
        if f"-{n}-" in u or u.endswith(f"-{n}"):
            pack = n
            break
    return size_key, pack


# ─── MDX parsing and updating ─────────────────────────────────────────────────

def parse_mdx_frontmatter(path: Path) -> tuple:
    """
    Returns (fm_dict, fm_raw, full_text).
    fm_dict: parsed key→value dict (best-effort for key fields)
    fm_raw: the text between the opening and closing --- markers
    """
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---"):
        raise ValueError(f"No YAML frontmatter in {path.name}")
    try:
        end_idx = text.index("\n---", 3)
    except ValueError:
        raise ValueError(f"Could not find closing --- in {path.name}")
    fm_raw = text[4:end_idx]  # after "---\n"

    fm = {}
    lines = fm_raw.split("\n")
    i = 0
    while i < len(lines):
        line = lines[i]
        if not line.strip() or line.strip().startswith("#"):
            i += 1
            continue
        if ":" in line and not line.startswith(" ") and not line.startswith("-"):
            key, _, val = line.partition(":")
            key = key.strip()
            val = val.strip()
            if key == "base_prices":
                bp = {}
                i += 1
                while i < len(lines) and lines[i].startswith("  "):
                    bk, _, bv = lines[i].strip().partition(":")
                    try:
                        bp[bk.strip()] = float(bv.strip())
                    except ValueError:
                        bp[bk.strip()] = bv.strip()
                    i += 1
                fm["base_prices"] = bp
                continue
            else:
                if val.startswith('"') and val.endswith('"'):
                    val = val[1:-1].replace('\\"', '"')
                elif val == "true":
                    val = True
                elif val == "false":
                    val = False
                elif val == "null":
                    val = None
                else:
                    try:
                        val = int(val)
                    except ValueError:
                        try:
                            val = float(val)
                        except ValueError:
                            pass
                fm[key] = val
        i += 1
    return fm, fm_raw, text


def detect_family(fm: dict) -> str:
    """Identify product family from MDX frontmatter fields."""
    fmt = fm.get("format", "")
    if fmt == "paper":
        return fm.get("paper_type", "unknown")
    if fmt == "canvas":
        return "canvas-stretched" if fm.get("canvas_style") == "stretched" else "canvas-framed"
    if fmt == "framed":
        return "framed"
    if fmt == "card":
        return "card"
    if fmt == "postcard":
        return "postcard"
    if fmt == "book":
        return f"book-{fm.get('book_format', 'unknown')}"
    if fmt == "calendar":
        return "calendar"
    return "unknown"


def format_base_prices(bp: dict) -> str:
    """Format base_prices block for MDX frontmatter."""
    lines = ["base_prices:"]
    for region in ("EU", "UK", "US", "AU"):
        if region in bp and bp[region] is not None:
            v = bp[region]
            if v == int(v):
                lines.append(f"  {region}: {int(v)}.00")
            else:
                lines.append(f"  {region}: {v:.2f}")
    return "\n".join(lines)


def update_frontmatter_text(fm_raw: str, new_sku: str,
                             new_bp: dict, new_price_cents: int) -> str:
    """Apply targeted regex substitutions to update three fields in raw frontmatter."""
    # prodigi_sku: single line, unquoted
    fm = re.sub(r"^prodigi_sku: .+$", f"prodigi_sku: {new_sku}",
                fm_raw, flags=re.MULTILINE)
    # price_cents: single integer line
    fm = re.sub(r"^price_cents: \d+$", f"price_cents: {new_price_cents}",
                fm, flags=re.MULTILINE)
    # base_prices: multi-line block
    new_bp_block = format_base_prices(new_bp) + "\n"
    fm = re.sub(r"^base_prices:\n(?:  [A-Z]+: [^\n]+\n)+",
                new_bp_block, fm, flags=re.MULTILINE)
    return fm


def rewrite_mdx(path: Path, new_sku: str, new_bp: dict,
                new_price_cents: int, full_text: str, fm_raw: str) -> None:
    """Write updated MDX file in-place."""
    new_fm = update_frontmatter_text(fm_raw, new_sku, new_bp, new_price_cents)
    end_idx = full_text.index("\n---", 3)
    body = full_text[end_idx:]
    new_text = "---\n" + new_fm + body
    path.write_text(new_text, encoding="utf-8")


# ─── Stage 1: Discovery ───────────────────────────────────────────────────────

def detect_duplicates(files: list) -> list:
    """Find CSV files with identical SKU sets."""
    sku_sets = {}
    for f in files:
        skus = frozenset(r.get("sku", "") for r in f["rows"] if r.get("sku"))
        if skus in sku_sets:
            sku_sets[skus].append(f["filename"])
        else:
            sku_sets[skus] = [f["filename"]]
    return [(fnames, len(skus)) for skus, fnames in sku_sets.items() if len(fnames) > 1]


def run_discover(files: list, price_index: dict, report_path: Path) -> None:
    lines = []
    ts = datetime.now().strftime("%Y-%m-%d %H:%M UTC")
    lines += [f"# Prodigi SKU Mapping Report -- {ts}", ""]
    lines += [f"Generated by `scripts/extract-prodigi-pricing.py --discover`", ""]

    # File inventory
    lines += ["## CSV File Inventory", ""]
    lines += [f"Total CSV files found: **{len(files)}**", ""]
    lines += ["| Filename | Rows | Columns |", "|---|---|---|"]
    for f in files:
        col_sample = ", ".join(f["orig_cols"][:6])
        if len(f["orig_cols"]) > 6:
            col_sample += ", ..."
        lines.append(f"| `{f['filename']}` | {len(f['rows'])} | {col_sample} |")
    lines.append("")

    # Duplicate detection
    dups = detect_duplicates(files)
    lines += ["## Duplicate Detection", ""]
    if dups:
        lines += [f"WARNING: Found {len(dups)} duplicate group(s):", ""]
        for fnames, n in dups:
            lines.append(f"- {', '.join(f'`{fn}`' for fn in fnames)} -- {n} identical SKUs")
    else:
        lines += ["No duplicate files detected.", ""]

    # Per-family SKU inventory
    lines += ["## SKU Inventory by Family", ""]

    family_patterns = {
        "Canvas (stretched/framed)": lambda fn: "canvas" in fn,
        "Framed prints": lambda fn: "framed" in fn and "canvas" not in fn,
        "Fine art / photo prints": lambda fn: "print" in fn or ("art" in fn and "fine" in fn) or "photo" in fn,
        "Greeting cards": lambda fn: "greeting" in fn or ("card" in fn and "postcard" not in fn),
        "Postcards": lambda fn: "postcard" in fn,
        "Hardcover books": lambda fn: "book" in fn and "hardcover" in fn,
        "Softcover books": lambda fn: "book" in fn and "softcover" in fn,
        "Calendars": lambda fn: "calendar" in fn,
    }

    for family_label, fn_pred in family_patterns.items():
        family_files = [f for f in files if fn_pred(f["filename"].lower())]
        if not family_files:
            lines += [f"### {family_label}", "", "WARNING: No CSV files matched.", ""]
            continue
        lines += [f"### {family_label}", ""]
        for f in family_files:
            if not f["rows"]:
                continue
            sample_row = f["rows"][0]
            # Unique SKU prefixes
            skus = [r.get("sku", "") for r in f["rows"] if r.get("sku")]
            unique_skus = sorted(set(skus))
            prefixes = sorted(set(s[:12] for s in unique_skus))
            regions = sorted(set(r.get("regionid", "").lower() for r in f["rows"] if r.get("regionid")))
            lines += [f"**`{f['filename']}`** -- {len(f['rows'])} rows, {len(unique_skus)} unique SKUs", ""]
            lines += [f"- Regions: {', '.join(regions)}"]
            lines += [f"- SKU prefix samples: {', '.join(prefixes[:8])}"]
            lines += [f"- Columns: {', '.join(f['orig_cols'])}", ""]
            # Sample rows
            lines += ["Sample rows:"]
            for row in f["rows"][:3]:
                row_display = {k: v for k, v in row.items()
                               if k in ("sku", "product_type", "size_inches",
                                        "wrap", "paper_type", "finish", "frame",
                                        "style", "substrate_weight", "regionid",
                                        "product_price", "product_currency")}
                lines.append(f"```\n{row_display}\n```")
            lines.append("")

    # Price index summary
    lines += ["## Price Index Summary", ""]
    lines += [f"Total unique SKUs across all CSVs: **{len(price_index)}**", ""]
    region_counts = defaultdict(int)
    for sku, regions in price_index.items():
        for r in regions:
            region_counts[r] += 1
    lines += ["| RegionId | SKU count |", "|---|---|"]
    for rid, cnt in sorted(region_counts.items()):
        lines += [f"| {rid} | {cnt} |"]
    lines.append("")

    # Known SKU pattern checks
    lines += ["## Known Pattern Checks", ""]
    checks = [
        ("HPR photo paper", "ART-PAP-HPR-"),
        ("HGE photo paper", "ART-PAP-HGE-"),
        ("EMA photo paper", "ART-PAP-EMA-"),
        ("CLP (Lustre Pro)", "ART-PAP-LPP-"),
        ("Canvas stretched", "CAN-38MM-SC-"),
        ("Hardcover book MHK", "BOOK-FE-"),
        ("Softcover book MHK", "BOOK-FE-"),
        ("Calendar", "CALENDAR-"),
        ("Greeting card GLOBAL", "GLOBAL-GRE-"),
        ("Postcard GLOBAL", "GLOBAL-POST-"),
    ]
    lines += ["| Pattern | Matching SKUs in index |", "|---|---|"]
    for label, prefix in checks:
        matches = [s for s in price_index if s.startswith(prefix)]
        lines.append(f"| {label} (`{prefix}...`) | {len(matches)}: {', '.join(sorted(matches)[:5])} |")
    lines.append("")

    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"Discovery report written to: {report_path}")


# ─── Stage 2–3: MDX update ────────────────────────────────────────────────────

def derive_sku(fm: dict, family: str, price_index: dict,
               lookups: dict) -> tuple:
    """
    Return (real_sku, confidence) where confidence is 'exact'|'derived'|'none'.
    lookups keys: 'canvas-stretched', 'canvas-framed', 'framed', 'photo-paper',
                  'card', 'postcard', 'book', 'calendar'
    """
    size_raw = str(fm.get("size", ""))
    product_id = str(fm.get("id", ""))

    if family in ("HPR", "HGE", "EMA", "CLP"):
        size_key = normalize_size_key(size_raw, family)
        # Try lookup from CSV
        sku = lookups.get("photo-paper", {}).get((family, size_key))
        if sku and sku in price_index:
            return sku, "exact"
        # Fallback: derive from known patterns
        fallback = {
            "HPR": f"ART-PAP-HPR-{size_key}",
            "HGE": f"ART-PAP-HGE-{size_key}",
            "EMA": f"ART-PAP-EMA-{size_key}",
            "CLP": f"ART-PAP-LPP-{size_key}",
        }
        candidate = fallback[family]
        if candidate in price_index:
            return candidate, "derived"
        return candidate, "none"

    if family == "canvas-stretched":
        size_key = normalize_size_key(size_raw, family)
        sku = lookups.get("canvas-stretched", {}).get(size_key)
        if sku and sku in price_index:
            return sku, "exact"
        candidate = f"CAN-38MM-SC-{size_key}"
        if candidate in price_index:
            return candidate, "derived"
        return candidate, "none"

    if family == "canvas-framed":
        size_key = normalize_size_key(size_raw, family)
        sku = lookups.get("canvas-framed", {}).get(size_key)
        if sku and sku in price_index:
            return sku, "exact"
        # No reliable fallback pattern without CSV — flag
        return "", "none"

    if family == "framed":
        size_key = normalize_size_key(size_raw, family)
        color = normalize_frame_color(str(fm.get("frame_colour", "")))
        sku = lookups.get("framed", {}).get((size_key, color))
        if sku and sku in price_index:
            return sku, "exact"
        return "", "none"

    if family == "card":
        size_key = normalize_size_key(size_raw, family)
        pack = extract_pack_from_id(product_id)
        sku = lookups.get("card", {}).get((size_key, pack))
        if sku and sku in price_index:
            return sku, "exact"
        return "", "none"

    if family == "postcard":
        size_key = normalize_size_key(size_raw, family)
        pack = extract_pack_from_id(product_id)
        sku = lookups.get("postcard", {}).get((size_key, pack))
        if sku and sku in price_index:
            return sku, "exact"
        return "", "none"

    if family in ("book-hardcover", "book-softcover"):
        size_key = normalize_size_key(size_raw, family)
        sku = lookups.get("book", {}).get((family, size_key))
        if sku and sku in price_index:
            return sku, "exact"
        # Derive pattern
        fmt = "HARD" if family == "book-hardcover" else "SOFT"
        candidate = f"BOOK-FE-{size_key}-{fmt}-MHK"
        if candidate in price_index:
            return candidate, "derived"
        return candidate, "none"

    if family == "calendar":
        size_key = normalize_size_key(size_raw, family)
        sku = lookups.get("calendar", {}).get(size_key)
        if sku and sku in price_index:
            return sku, "exact"
        candidate = f"CALENDAR-{size_key}-L-UNDATED"
        if candidate in price_index:
            return candidate, "derived"
        return candidate, "none"

    return "", "none"


def build_base_prices(sku: str, price_index: dict, family: str) -> tuple:
    """
    Return (base_prices dict, warnings list).
    base_prices: {EU, UK, US, AU: float or None}
    """
    bp = {}
    warnings = []
    for region in ("EU", "UK", "US", "AU"):
        price, currency = get_price(price_index, sku, region)
        if price is None:
            bp[region] = None
            warnings.append(f"{region} price missing for {sku}")
        else:
            bp[region] = price
    return bp, warnings


def compute_price_cents(bp: dict, margin_pct: int) -> int:
    uk_price = bp.get("UK")
    if uk_price is None:
        return 0
    return round(uk_price * (1 + margin_pct / 100) * 100)


def run_update(files: list, price_index: dict, products_dir: Path,
               dry_run: bool) -> None:
    # Build all lookups
    photo_lookup, photo_cands = build_photo_paper_lookup(files, price_index)
    can_s_lookup, _ = build_canvas_stretched_lookup(files, price_index)
    can_f_lookup, _ = build_canvas_framed_lookup(files, price_index)
    fap_lookup, _ = build_framed_prints_lookup(files, price_index)
    card_lookup, pos_lookup, _, _ = build_card_lookup(files, price_index)
    book_lookup = build_book_lookup(price_index)
    cal_lookup = build_calendar_lookup(price_index)

    lookups = {
        "photo-paper": photo_lookup,
        "canvas-stretched": can_s_lookup,
        "canvas-framed": can_f_lookup,
        "framed": fap_lookup,
        "card": card_lookup,
        "postcard": pos_lookup,
        "book": book_lookup,
        "calendar": cal_lookup,
    }

    # Process MDX files
    mdx_files = sorted(products_dir.glob("*.mdx"))
    total = len(mdx_files)

    counts = defaultdict(int)
    unmatched = []
    margin_flags = []
    before_after_samples = []
    all_price_cents = []  # for outlier detection

    print(f"\nProcessing {total} MDX files ...")

    for path in mdx_files:
        if path.name == "README.md":
            continue
        try:
            fm, fm_raw, full_text = parse_mdx_frontmatter(path)
        except ValueError as e:
            print(f"  SKIP: {e}")
            counts["skip_parse"] += 1
            continue

        family = detect_family(fm)
        counts[f"family_{family}"] += 1

        if family == "unknown":
            unmatched.append((path.name, "unknown family"))
            counts["unmatched"] += 1
            continue

        # Margin check
        expected_margin = MARGIN_TABLE.get(family)
        actual_margin = fm.get("margin_pct")
        if expected_margin is not None and actual_margin != expected_margin:
            margin_flags.append((path.name, family, actual_margin, expected_margin))

        # Derive real SKU
        real_sku, confidence = derive_sku(fm, family, price_index, lookups)
        if not real_sku or confidence == "none":
            unmatched.append((path.name, f"no SKU match (family={family}, "
                              f"size={fm.get('size')}, derived='{real_sku}')"))
            counts["unmatched"] += 1
            continue

        # Look up prices
        bp, warnings = build_base_prices(real_sku, price_index, family)
        if bp.get("UK") is None:
            unmatched.append((path.name, f"UK price missing for SKU {real_sku}"))
            counts["unmatched"] += 1
            continue

        new_price_cents = compute_price_cents(bp, int(fm.get("margin_pct", 0)))
        all_price_cents.append((path.name, family, new_price_cents))

        # Sample before/after for reporting
        if len(before_after_samples) < 5:
            before_after_samples.append({
                "file": path.name,
                "old_sku": fm.get("prodigi_sku"),
                "new_sku": real_sku,
                "old_bp": fm.get("base_prices"),
                "new_bp": {k: v for k, v in bp.items() if v is not None},
                "old_pc": fm.get("price_cents"),
                "new_pc": new_price_cents,
                "confidence": confidence,
            })

        if not dry_run:
            rewrite_mdx(path, real_sku,
                        {k: v for k, v in bp.items() if v is not None},
                        new_price_cents, full_text, fm_raw)

        counts["updated"] += 1
        if warnings:
            counts["warned"] += len(warnings)

    counts["total"] = total

    # Outlier detection: flag price_cents > 3× median per family
    family_prices = defaultdict(list)
    for name, fam, pc in all_price_cents:
        family_prices[fam].append((name, pc))

    outliers = []
    for fam, entries in family_prices.items():
        prices = [pc for _, pc in entries]
        if len(prices) < 3:
            continue
        median = sorted(prices)[len(prices) // 2]
        for name, pc in entries:
            if median > 0 and (pc > 3 * median or pc < median / 3):
                outliers.append((name, fam, pc, median))

    # Print summary
    print_summary(counts, unmatched, margin_flags, before_after_samples, outliers, dry_run)

    # Write unmatched report
    if unmatched:
        unmatched_path = _SCRIPT_DIR / "_unmatched.txt"
        lines = [f"Session 12c-pricing: Unmatched products ({len(unmatched)})", ""]
        for name, reason in unmatched:
            lines.append(f"{name}: {reason}")
        unmatched_path.write_text("\n".join(lines), encoding="utf-8")
        print(f"\nUnmatched product list: {unmatched_path}")


# ─── Reporting ────────────────────────────────────────────────────────────────

def print_summary(counts, unmatched, margin_flags, samples, outliers, dry_run):
    mode = "[DRY RUN] " if dry_run else ""
    print(f"\n{'='*60}")
    print(f"Session 12c-pricing -- {mode}Run Summary")
    print(f"{'='*60}")
    print(f"  Total MDX files:        {counts['total']}")
    print(f"  Updated:                {counts['updated']}")
    print(f"  Unmatched (flagged):    {counts['unmatched']}")
    print(f"  Parse errors (skipped): {counts['skip_parse']}")
    if counts.get("warned"):
        print(f"  Price warnings:         {counts['warned']}")
    print()

    # Family breakdown
    print("Family breakdown:")
    for k, v in sorted(counts.items()):
        if k.startswith("family_"):
            print(f"  {k[7:]:<25} {v}")
    print()

    if margin_flags:
        print(f"MARGIN MISMATCHES ({len(margin_flags)} -- do not auto-correct):")
        for name, fam, actual, expected in margin_flags:
            print(f"  {name}: margin_pct={actual} but table says {expected} (family={fam})")
        print()

    if samples:
        print("Before/after sample diffs:")
        for s in samples:
            print(f"  [{s['confidence']}] {s['file']}")
            print(f"    SKU:       {s['old_sku']} -> {s['new_sku']}")
            print(f"    base_prices: {s['old_bp']} -> {s['new_bp']}")
            print(f"    price_cents: {s['old_pc']} -> {s['new_pc']}")
        print()

    if unmatched:
        print(f"Unmatched products ({len(unmatched)}) -- need human review:")
        for name, reason in unmatched[:20]:
            print(f"  {name}: {reason}")
        if len(unmatched) > 20:
            print(f"  ... and {len(unmatched) - 20} more (see _unmatched.txt)")
        print()

    if outliers:
        print(f"Pricing outliers ({len(outliers)}) -- verify manually:")
        for name, fam, pc, median in outliers:
            print(f"  {name}: price_cents={pc}, family median={median}")
        print()
    else:
        print("Outlier check: no outliers detected.")

    print(f"{'='*60}\n")


# ─── Acceptance check ─────────────────────────────────────────────────────────

def run_acceptance_check(products_dir: Path) -> None:
    """Check no GLOBAL-* SKUs remain (except cards/postcards which are legitimately GLOBAL-)."""
    print("\nRunning acceptance check ...")
    placeholder_pattern = re.compile(r"^prodigi_sku: GLOBAL-(?!GRE|POST)", re.MULTILINE)
    remaining = []
    for path in products_dir.glob("*.mdx"):
        text = path.read_text(encoding="utf-8")
        if placeholder_pattern.search(text):
            remaining.append(path.name)
    if remaining:
        print(f"  WARN: {len(remaining)} files still have non-card/postcard GLOBAL- SKUs:")
        for name in remaining[:10]:
            print(f"    {name}")
    else:
        print("  OK: No non-card/postcard GLOBAL- placeholder SKUs remain.")
    # Check no zero price_cents
    zero_pc = []
    for path in products_dir.glob("*.mdx"):
        text = path.read_text(encoding="utf-8")
        m = re.search(r"^price_cents: (\d+)$", text, re.MULTILINE)
        if m and m.group(1) == "0":
            zero_pc.append(path.name)
    if zero_pc:
        print(f"  WARN: {len(zero_pc)} files have price_cents: 0")
    else:
        print("  OK: No zero price_cents values.")
    print()


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--discover", action="store_true",
                    help="Stage 1: read CSVs, write sku-mapping-report.md")
    ap.add_argument("--update", action="store_true",
                    help="Stage 2-3: match MDX files to real SKUs and update pricing")
    ap.add_argument("--dry-run", action="store_true",
                    help="With --update: parse and report but don't write files")
    ap.add_argument("--check", action="store_true",
                    help="Run acceptance checks only (no CSV processing required)")
    ap.add_argument("--csv-dir", default=None,
                    help="Directory containing Prodigi pricing CSVs (required for --discover and --update)")
    ap.add_argument("--products-dir", default=PRODUCTS_DIR_DEFAULT,
                    help=f"content/products directory (default: {PRODUCTS_DIR_DEFAULT})")
    ap.add_argument("--report", default=REPORT_PATH_DEFAULT,
                    help="Output path for discovery report")
    args = ap.parse_args()

    if not args.discover and not args.update and not args.check:
        ap.print_help()
        sys.exit(1)

    if (args.discover or args.update) and not args.csv_dir:
        print("ERROR: --csv-dir is required for --discover and --update stages", file=sys.stderr)
        sys.exit(1)

    csv_dir = Path(args.csv_dir) if args.csv_dir else None
    products_dir = Path(args.products_dir)
    report_path = Path(args.report)

    if args.check:
        run_acceptance_check(products_dir)
        return

    if not csv_dir.exists():
        print(f"ERROR: CSV directory not found: {csv_dir}", file=sys.stderr)
        sys.exit(1)
    if not products_dir.exists():
        print(f"ERROR: Products directory not found: {products_dir}", file=sys.stderr)
        sys.exit(1)

    print(f"Loading CSVs from: {csv_dir}")
    files = load_csvs(csv_dir)
    print(f"  Loaded {len(files)} CSV files.")

    print("Building price index ...")
    price_index = build_price_index(files)
    print(f"  {len(price_index)} unique SKUs indexed.")

    if args.discover:
        print("Running discovery ...")
        run_discover(files, price_index, report_path)

    if args.update:
        run_update(files, price_index, products_dir, dry_run=args.dry_run)

    if args.update and not args.dry_run:
        run_acceptance_check(products_dir)


if __name__ == "__main__":
    main()
