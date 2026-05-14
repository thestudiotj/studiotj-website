#!/usr/bin/env python3
"""
Post-fix audit of regional pricing coverage.

Walks grouped MDX in content/products/, builds per-variant rows in
cost-basis-currency terms, computes F3 (LOSS/EROSION/OK) status, F5 ratio
buckets, and AU/UK coverage summaries. Writes:

- _audit/regional-pricing-coverage-postfix.csv  (per-variant data)
- _audit/regional-pricing-coverage-postfix.md   (summary tables)

The pre-fix CSV at _audit/regional-pricing-coverage.csv stays in place for
comparison.
"""

import csv
import re
from collections import defaultdict
from pathlib import Path

_SCRIPT_DIR = Path(__file__).resolve().parent
_REPO_ROOT = _SCRIPT_DIR.parent
MDX_DIR = _REPO_ROOT / "content" / "products"
AUDIT_DIR = _REPO_ROOT / "_audit"

VARIANT_HEADER_RE = re.compile(r"^  - variantId: (\S+)\s*$", re.MULTILINE)


def parse_mdx(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    fm_end = text.index("\n---", 3)
    fm = text[4:fm_end]
    out = {"variants": []}
    out["collection"] = re.search(r"^collection: (\S+)\s*$",
                                  fm, re.MULTILINE).group(1) \
        if re.search(r"^collection: (\S+)\s*$", fm, re.MULTILINE) else ""
    out["family"] = re.search(r"^family: (\S+)\s*$",
                              fm, re.MULTILINE).group(1) \
        if re.search(r"^family: (\S+)\s*$", fm, re.MULTILINE) else ""
    margin_m = re.search(r"^margin_pct: ([\d.]+)\s*$", fm, re.MULTILINE)
    out["margin_pct"] = float(margin_m.group(1)) if margin_m else None

    headers = list(VARIANT_HEADER_RE.finditer(fm))
    for i, h in enumerate(headers):
        v_start = h.start()
        v_end = headers[i + 1].start() if i + 1 < len(headers) else len(fm)
        block = fm[v_start:v_end]
        sku_m = re.search(r"^    sku: (\S+)\s*$", block, re.MULTILINE)
        pc_m = re.search(r"^    price_cents: (\d+)\s*$", block, re.MULTILINE)
        size_m = re.search(r"^    size: (\S+)\s*$", block, re.MULTILINE)
        cbc_m = re.search(r"^    cost_basis_currency: (\S+)\s*$",
                          block, re.MULTILINE)
        bp = {}
        for m in re.finditer(r"^      ([A-Z]+): ([\d.]+)\s*$",
                             block, re.MULTILINE):
            bp[m.group(1)] = float(m.group(2))
        if not (sku_m and pc_m):
            continue
        out["variants"].append({
            "variant_id": h.group(1),
            "size": size_m.group(1) if size_m else "",
            "sku": sku_m.group(1),
            "price_cents": int(pc_m.group(1)),
            "cost_basis_currency": cbc_m.group(1) if cbc_m else "?",
            "base_prices": bp,
        })
    return out


def f3_status(revenue: float, us_cost: float, eu_margin: float) -> str:
    if us_cost is None:
        return "NO-US-DATA"
    margin = revenue - us_cost
    if margin < 0:
        return "LOSS"
    if eu_margin > 0 and margin < eu_margin / 2:
        return "EROSION"
    return "OK"


def f5_bucket(ratio: float) -> str:
    if ratio is None:
        return "N/A"
    if ratio < 1.0:
        return "<1.0×"
    if ratio < 1.2:
        return "1.0–1.2×"
    if ratio < 1.5:
        return "1.2–1.5×"
    if ratio < 2.0:
        return "1.5–2.0×"
    return "≥2.0×"


def main():
    AUDIT_DIR.mkdir(parents=True, exist_ok=True)
    csv_path = AUDIT_DIR / "regional-pricing-coverage-postfix.csv"
    md_path = AUDIT_DIR / "regional-pricing-coverage-postfix.md"

    rows = []
    for path in sorted(MDX_DIR.glob("*.mdx")):
        if path.name.startswith("_"):
            continue
        parsed = parse_mdx(path)
        for v in parsed["variants"]:
            bp = v["base_prices"]
            revenue = v["price_cents"] / 100
            eu = bp.get("EU")
            uk = bp.get("UK")
            us = bp.get("US")
            au = bp.get("AU")
            eu_margin = revenue - eu if eu is not None else None
            us_margin = revenue - us if us is not None else None
            au_margin = revenue - au if au is not None else None
            us_ratio = (us / eu) if (us is not None and eu) else None
            uk_diverges = "yes" if (uk is not None and eu is not None
                                    and abs(uk - eu) > 0.005) else "no"
            status = f3_status(revenue, us, eu_margin or 0)
            rows.append({
                "product_id": v["variant_id"],
                "family": parsed["family"],
                "collection": parsed["collection"],
                "variant_size": v["size"],
                "margin_pct": parsed["margin_pct"],
                "price_cents": v["price_cents"],
                "cost_basis_currency": v["cost_basis_currency"],
                "base_eu_costbasis": eu,
                "base_uk_costbasis": uk,
                "base_us_costbasis_converted": us,
                "base_au_costbasis_converted": au,
                "revenue_costbasis": revenue,
                "eu_margin_costbasis": eu_margin,
                "us_margin_costbasis": us_margin,
                "au_margin_costbasis": au_margin,
                "us_eu_ratio": round(us_ratio, 3) if us_ratio is not None else None,
                "uk_diverges_from_eu": uk_diverges,
                "status_us": status,
            })

    # Write CSV
    with csv_path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    print(f"CSV: {csv_path}  ({len(rows)} rows)")

    # Build summary tables
    md = ["# Regional pricing coverage — post-fix audit", "",
          f"Variants audited: **{len(rows)}**", "",
          "Source: `content/products/*.mdx` (post extraction fix).", ""]

    # F3 by family
    md += ["## F3 — US margin status by family", "",
           "Status defined per cost-basis currency: LOSS if `revenue − base_US < 0`, "
           "EROSION if positive but less than half EU margin, OK otherwise. "
           "NO-US-DATA = US is null (no Prodigi USD-US row).", ""]
    by_fam = defaultdict(lambda: defaultdict(int))
    for r in rows:
        by_fam[r["family"]][r["status_us"]] += 1
    md += ["| Family | LOSS | EROSION | OK | NO-US-DATA | Total |",
           "|---|---|---|---|---|---|"]
    for fam in sorted(by_fam):
        c = by_fam[fam]
        total = sum(c.values())
        md.append(f"| {fam} | {c['LOSS']} | {c['EROSION']} | {c['OK']} | "
                  f"{c['NO-US-DATA']} | {total} |")
    md += [""]

    # F5 ratio buckets by family
    md += ["## F5 — `base_US / base_EU` ratio buckets by family (cost-basis-comparable)", ""]
    bucket_order = ["<1.0×", "1.0–1.2×", "1.2–1.5×", "1.5–2.0×", "≥2.0×", "N/A"]
    by_fam_bucket = defaultdict(lambda: defaultdict(int))
    for r in rows:
        bucket = f5_bucket(r["us_eu_ratio"])
        by_fam_bucket[r["family"]][bucket] += 1
    md += ["| Family | " + " | ".join(bucket_order) + " |",
           "|" + "|".join(["---"] * (len(bucket_order) + 1)) + "|"]
    for fam in sorted(by_fam_bucket):
        c = by_fam_bucket[fam]
        md.append("| " + fam + " | " + " | ".join(str(c.get(b, 0))
                                                   for b in bucket_order) + " |")
    md += [""]

    # AU coverage
    md += ["## AU coverage by family", "",
           "Count of variants with non-null `base_prices.AU` "
           "(populated only when au.csv has an AUD row with source=AU).", ""]
    au_counts = defaultdict(lambda: [0, 0])  # [populated, null]
    for r in rows:
        if r["base_au_costbasis_converted"] is not None:
            au_counts[r["family"]][0] += 1
        else:
            au_counts[r["family"]][1] += 1
    md += ["| Family | AU populated | AU null | Total |", "|---|---|---|---|"]
    for fam in sorted(au_counts):
        p, n = au_counts[fam]
        md.append(f"| {fam} | {p} | {n} | {p + n} |")
    md += [""]

    # UK coverage
    md += ["## UK coverage by family", "",
           "Count of variants where `base_prices.UK ≠ base_prices.EU` "
           "(diverges after FX-conversion of the GB-destination row). "
           "For GBP-basis families the UK and EU rows are the same UK-sourced "
           "production cost, so the columns match; for EUR-basis families with "
           "a GBP-currency GB-destination row, UK diverges after FX.", ""]
    uk_counts = defaultdict(lambda: [0, 0])
    for r in rows:
        if r["uk_diverges_from_eu"] == "yes":
            uk_counts[r["family"]][0] += 1
        else:
            uk_counts[r["family"]][1] += 1
    md += ["| Family | UK diverges | UK matches EU | Total |", "|---|---|---|---|"]
    for fam in sorted(uk_counts):
        p, n = uk_counts[fam]
        md.append(f"| {fam} | {p} | {n} | {p + n} |")
    md += [""]

    # cost basis distribution
    md += ["## cost_basis_currency by family", ""]
    cb_counts = defaultdict(lambda: defaultdict(int))
    for r in rows:
        cb_counts[r["family"]][r["cost_basis_currency"]] += 1
    md += ["| Family | EUR | GBP | other | Total |", "|---|---|---|---|---|"]
    for fam in sorted(cb_counts):
        c = cb_counts[fam]
        other = sum(v for k, v in c.items() if k not in ("EUR", "GBP"))
        total = sum(c.values())
        md.append(f"| {fam} | {c.get('EUR', 0)} | {c.get('GBP', 0)} | {other} | {total} |")
    md += [""]

    md_path.write_text("\n".join(md), encoding="utf-8")
    print(f"MD:  {md_path}")


if __name__ == "__main__":
    main()
