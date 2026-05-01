#!/usr/bin/env python3
"""
Content/image audit for studiotj-website.

Reads all MDX frontmatter under content/{gear,vondsten,picks}/,
lists R2 keys under those prefixes, and writes a markdown audit report
to audit/content-image-audit-YYYY-MM-DD.md.

Re-runnable, read-only: no MDX edits, no R2 mutations.
"""

import os
import re
import sys
import yaml
import boto3
import subprocess
from datetime import date, datetime, timezone
from pathlib import Path

# ── Constants ──────────────────────────────────────────────────────────────────

SECTIONS = ["gear", "vondsten", "picks"]

REPO_ROOT = Path(__file__).parent.parent
CONTENT_ROOT = REPO_ROOT / "content"
AUDIT_DIR = REPO_ROOT / "audit"

# Locked R2 path convention regexes (match against normalized path, no leading /)
CONVENTION_PATTERNS = {
    "landing":   re.compile(r"^(gear|vondsten|picks)/_landing/hero\.webp$"),
    "intro":     re.compile(r"^(gear|vondsten|picks)/[^/]+/_intro/hero\.webp$"),
    "unit_hero": re.compile(r"^(gear|vondsten|picks)/[^/]+/[^/]+/hero\.webp$"),
    "unit_thumb":re.compile(r"^(gear|vondsten|picks)/[^/]+/[^/]+/thumb\.webp$"),
    "unit_supp": re.compile(r"^(gear|vondsten|picks)/[^/]+/[^/]+/supporting-[1-3]\.webp$"),
    "bp_hero":   re.compile(r"^picks/[^/]+/[^/]+/[^/]+/hero\.webp$"),
    "bp_thumb":  re.compile(r"^picks/[^/]+/[^/]+/[^/]+/thumb\.webp$"),
    "bp_supp":   re.compile(r"^picks/[^/]+/[^/]+/[^/]+/supporting-[1-3]\.webp$"),
}

STALE_BODY_PATTERNS = [
    r"\bTODO\b",
    r"TODO_GENERATE_VIA_SITESTRIPE",
    r"Editorial pass pending",
    r"\bplaceholder\b",
    r"lorem ipsum",
]

# ── 1. Env loading ─────────────────────────────────────────────────────────────

def load_env():
    """Load env vars from .env files in priority order (first match wins per key)."""
    env_candidates = [
        REPO_ROOT.parent / "studiotj-content-upload" / ".env",
        REPO_ROOT / ".env",
    ]
    for env_path in env_candidates:
        if env_path.exists():
            with open(env_path, encoding="utf-8") as f:
                for raw in f:
                    line = raw.strip()
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                    key, _, val = line.partition("=")
                    key = key.strip()
                    val = val.strip().strip('"').strip("'")
                    os.environ.setdefault(key, val)
            break  # use first .env that exists


def get_r2_client():
    endpoint = os.environ.get("R2_ENDPOINT_URL")
    access_key = os.environ.get("R2_ACCESS_KEY_ID")
    secret_key = os.environ.get("R2_SECRET_ACCESS_KEY")
    if not all([endpoint, access_key, secret_key]):
        sys.exit("ERROR: Missing R2 credentials (R2_ENDPOINT_URL / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY)")
    return boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name="auto",
    )


def get_bucket():
    bucket = os.environ.get("R2_BUCKET_NAME")
    if not bucket:
        sys.exit("ERROR: Missing R2_BUCKET_NAME")
    return bucket


# ── 2. MDX parsing ─────────────────────────────────────────────────────────────

def parse_mdx(path: Path):
    """Return (frontmatter dict, body str). Handles missing/malformed frontmatter."""
    text = path.read_text(encoding="utf-8")
    lines = text.split("\n")
    if not lines or lines[0].strip() != "---":
        return {}, text
    for i, line in enumerate(lines[1:], 1):
        if line.strip() == "---":
            fm_text = "\n".join(lines[1:i])
            body = "\n".join(lines[i + 1:])
            try:
                fm = yaml.safe_load(fm_text) or {}
            except yaml.YAMLError:
                fm = {}
            return fm, body
    return {}, text


# ── 3. MDX classification ──────────────────────────────────────────────────────

def classify_mdx(path: Path) -> dict:
    """
    Derive section/category/slug/role from a content/*.mdx path.

    Roles: landing | intro | unit | brand | brandproduct | acties
    """
    rel = path.relative_to(CONTENT_ROOT)
    parts = rel.parts  # e.g. ("gear", "cameras", "nikon-d3500.mdx")
    fm, body = parse_mdx(path)

    base = {
        "mdx_path": rel.as_posix(),
        "fm": fm,
        "body": body,
        "brand_slug": None,
    }

    if len(parts) == 2 and parts[1] == "_landing.mdx":
        return {**base, "section": parts[0], "category": None, "slug": "_landing", "role": "landing"}

    if len(parts) == 3 and parts[2] == "_intro.mdx":
        return {**base, "section": parts[0], "category": parts[1], "slug": "_intro", "role": "intro"}

    if len(parts) == 3:
        section, category, filename = parts
        stem = Path(filename).stem
        if section == "vondsten" and category == "_acties":
            return {**base, "section": section, "category": category, "slug": stem, "role": "acties"}
        return {**base, "section": section, "category": category, "slug": stem, "role": "unit"}

    if len(parts) == 4:
        section, category, brand_dir, filename = parts
        stem = Path(filename).stem
        if stem == "_brand":
            # brand directory pattern: picks/<category>/<brand>/_brand.mdx
            return {**base, "section": section, "category": category, "slug": brand_dir, "role": "brand"}
        # BrandProduct: picks/<category>/<brand>/<product>.mdx with sibling _brand.mdx
        brand_mdx = CONTENT_ROOT / section / category / brand_dir / "_brand.mdx"
        if brand_mdx.exists():
            return {**base, "section": section, "category": category, "slug": stem,
                    "role": "brandproduct", "brand_slug": brand_dir}
        return {**base, "section": section, "category": category, "slug": stem, "role": "unit"}

    # Unexpected depth — include but flag
    return {**base, "section": parts[0] if parts else "unknown",
            "category": "/".join(parts[1:-1]) if len(parts) > 1 else None,
            "slug": Path(parts[-1]).stem if parts else "unknown", "role": "unknown"}


def walk_content() -> list:
    slots = []
    for section in SECTIONS:
        section_dir = CONTENT_ROOT / section
        if not section_dir.exists():
            continue
        for mdx_path in sorted(section_dir.rglob("*.mdx")):
            slots.append(classify_mdx(mdx_path))
    return slots


# ── 4. Expected R2 paths ───────────────────────────────────────────────────────

def expected_hero(slot: dict) -> str | None:
    role, section, category, slug = slot["role"], slot["section"], slot["category"], slot["slug"]
    brand_slug = slot.get("brand_slug")
    if role == "landing":
        return f"{section}/_landing/hero.webp"
    if role == "intro":
        return f"{section}/{category}/_intro/hero.webp"
    if role in ("unit", "brand"):
        return f"{section}/{category}/{slug}/hero.webp"
    if role == "brandproduct":
        return f"picks/{category}/{brand_slug}/{slug}/hero.webp"
    return None


def expected_supporting(slot: dict, n: int) -> str | None:
    role, section, category, slug = slot["role"], slot["section"], slot["category"], slot["slug"]
    brand_slug = slot.get("brand_slug")
    if role == "landing":
        return f"{section}/_landing/supporting-{n}.webp"
    if role == "intro":
        return f"{section}/{category}/_intro/supporting-{n}.webp"
    if role in ("unit", "brand"):
        return f"{section}/{category}/{slug}/supporting-{n}.webp"
    if role == "brandproduct":
        return f"picks/{category}/{brand_slug}/{slug}/supporting-{n}.webp"
    return None


# ── 5. Path helpers ────────────────────────────────────────────────────────────

def normalize(path_str: str | None) -> str | None:
    """Strip leading slash from an MDX path value."""
    if path_str:
        return str(path_str).strip().lstrip("/")
    return None


def is_static(path_str: str | None) -> bool:
    """True if the path is a /public static or external URL, not an R2 key."""
    if not path_str:
        return False
    s = path_str.strip()
    return s.startswith("/images/") or s.startswith("/public/") \
        or s.startswith("http://") or s.startswith("https://")


def is_folder_key(r2_key: str) -> bool:
    """True for R2 directory placeholder objects (keys ending in / or 0-byte markers)."""
    return r2_key.endswith("/")


def matches_any_convention(r2_key: str) -> bool:
    return any(pat.match(r2_key) for pat in CONVENTION_PATTERNS.values())


def classify_r2_key_role(r2_key: str) -> str:
    """Guess the intended role of an R2 key for the violation table."""
    parts = r2_key.split("/")
    fname = parts[-1] if parts else ""
    depth = len(parts)
    if depth == 3 and fname == "hero.webp":
        return "landing_hero (depth=3)"
    if depth == 4 and fname == "hero.webp":
        return "intro_or_unit_hero (depth=4)"
    if depth == 5 and fname == "hero.webp":
        return "brandproduct_hero (depth=5)"
    if fname.startswith("supporting-"):
        return f"supporting (depth={depth})"
    if fname == "thumb.webp":
        return f"thumb (depth={depth})"
    return f"unknown (depth={depth})"


# ── 6. R2 listing ──────────────────────────────────────────────────────────────

def list_r2_keys(s3, bucket: str) -> dict:
    """Return {key: {size, last_modified}} for all keys under SECTIONS prefixes."""
    keys = {}
    paginator = s3.get_paginator("list_objects_v2")
    for section in SECTIONS:
        for page in paginator.paginate(Bucket=bucket, Prefix=f"{section}/"):
            for obj in page.get("Contents", []):
                keys[obj["Key"]] = {
                    "size": obj["Size"],
                    "last_modified": obj["LastModified"],
                }
    return keys


# ── 7. Slot state classification ───────────────────────────────────────────────

def classify_image(path_str: str | None, exp_path: str | None, r2_keys: dict) -> dict:
    """
    Returns a state dict for one image slot:
      state: good | needs-migration | not-r2 | empty | broken
      current: normalized path or None
      expected: locked convention path
      r2_current_exists: bool
      r2_locked_exists: bool
      not_r2: bool
    """
    exp = exp_path  # no leading slash

    if not path_str or not str(path_str).strip():
        return {"state": "empty", "current": None, "expected": exp,
                "r2_current_exists": False, "r2_locked_exists": exp in r2_keys if exp else False,
                "not_r2": False}

    if is_static(path_str):
        return {"state": "not-r2", "current": str(path_str).strip(), "expected": exp,
                "r2_current_exists": False, "r2_locked_exists": exp in r2_keys if exp else False,
                "not_r2": True}

    current = normalize(path_str)
    r2_cur = current in r2_keys
    r2_lock = exp in r2_keys if exp else False

    if current == exp:
        state = "good" if r2_cur else "broken"
    else:
        state = "needs-migration"

    return {"state": state, "current": current, "expected": exp,
            "r2_current_exists": r2_cur, "r2_locked_exists": r2_lock,
            "not_r2": False}


# ── 8. Stale content scan ──────────────────────────────────────────────────────

def scan_stale(slot: dict) -> list:
    """Return list of {flag_type, excerpt} dicts."""
    flags = []
    body = slot.get("body", "") or ""
    fm = slot.get("fm", {}) or {}

    for raw_pat in STALE_BODY_PATTERNS:
        for m in re.finditer(raw_pat, body, re.IGNORECASE):
            start = max(0, m.start() - 40)
            end = min(len(body), m.end() + 40)
            excerpt = body[start:end].replace("\n", " ").strip()
            if len(excerpt) > 80:
                excerpt = excerpt[:77] + "..."
            flags.append({"flag_type": f"body:{raw_pat}", "excerpt": excerpt})

    # image_source: "Own photography" on an empty/broken hero
    if fm.get("image_source") == "Own photography":
        hero_image = fm.get("hero_image")
        if not hero_image:
            flags.append({"flag_type": "own_photography_no_hero",
                          "excerpt": "image_source='Own photography' but hero_image not set"})

    # Explicitly empty hero_image field
    if "hero_image" not in fm or not fm.get("hero_image"):
        flags.append({"flag_type": "empty_hero_image",
                      "excerpt": "hero_image field absent or empty"})

    return flags


# ── 9. Build full audit ────────────────────────────────────────────────────────

def build_audit(r2_keys: dict) -> dict:
    slots = walk_content()
    referenced = set()
    migration_list = []
    broken_list = []
    stale_flags_all = []
    audit_slots = []

    for slot in slots:
        role = slot["role"]
        section = slot["section"]
        category = slot["category"] or ""
        slug = slot["slug"]
        fm = slot["fm"] or {}
        mdx_path = slot["mdx_path"]

        # _acties files: skip image checks, still include in inventory
        if role == "acties":
            audit_slots.append({**slot, "hero": None, "supporting": []})
            continue

        # Hero image
        hero_im = fm.get("hero_image")
        hero = classify_image(hero_im, expected_hero(slot), r2_keys)
        if hero["current"] and not hero["not_r2"]:
            referenced.add(hero["current"])

        if hero["state"] in ("needs-migration", "not-r2"):
            migration_list.append({
                "section": section, "category": category, "slug": slug,
                "role": "hero",
                "current_path": hero["current"] or "",
                "locked_path": hero["expected"] or "",
                "r2_current_exists": hero["r2_current_exists"],
                "r2_locked_exists": hero["r2_locked_exists"],
                "not_r2": hero["not_r2"],
            })
        if hero["state"] == "broken":
            broken_list.append({
                "section": section, "category": category, "slug": slug,
                "role": "hero", "mdx_path": mdx_path,
                "referenced_r2_key": hero["current"],
            })

        # Supporting images
        raw_supps = fm.get("supporting_images") or []
        if isinstance(raw_supps, str):
            raw_supps = [raw_supps]

        supporting = []
        for i, supp_path in enumerate(raw_supps, 1):
            s = classify_image(supp_path, expected_supporting(slot, i), r2_keys)
            s["index"] = i
            if s["current"] and not s["not_r2"]:
                referenced.add(s["current"])

            if s["state"] in ("needs-migration", "not-r2"):
                migration_list.append({
                    "section": section, "category": category, "slug": slug,
                    "role": f"supporting-{i}",
                    "current_path": s["current"] or "",
                    "locked_path": s["expected"] or "",
                    "r2_current_exists": s["r2_current_exists"],
                    "r2_locked_exists": s["r2_locked_exists"],
                    "not_r2": s["not_r2"],
                })
            if s["state"] == "broken":
                broken_list.append({
                    "section": section, "category": category, "slug": slug,
                    "role": f"supporting-{i}", "mdx_path": mdx_path,
                    "referenced_r2_key": s["current"],
                })
            supporting.append(s)

        # Stale content (skip _acties — already handled above)
        for flag in scan_stale(slot):
            stale_flags_all.append({"mdx_path": mdx_path, **flag})

        audit_slots.append({**slot, "hero": hero, "supporting": supporting})

    image_r2_keys = {k for k in r2_keys if not is_folder_key(k)}
    orphan_keys = sorted(image_r2_keys - referenced)
    violation_keys = sorted(k for k in image_r2_keys if not matches_any_convention(k))
    migration_list.sort(key=lambda x: (x["section"], x["category"], x["slug"]))
    broken_list.sort(key=lambda x: (x["section"], x["category"], x["slug"]))

    return {
        "slots": audit_slots,
        "r2_keys": r2_keys,
        "migration_list": migration_list,
        "broken_list": broken_list,
        "stale_flags": stale_flags_all,
        "orphan_keys": orphan_keys,
        "violation_keys": violation_keys,
        "referenced": referenced,
    }


# ── 10. Report rendering ───────────────────────────────────────────────────────

def _bool(v):
    return "yes" if v else "no"


def _cur(v):
    return f"`{v}`" if v else "`(unset)`"


def _supp_summary(supporting: list) -> str:
    if not supporting:
        return "[]"
    return "[" + ", ".join(s["state"] for s in supporting) + "]"


def render_report(data: dict, git_hash: str, run_time: str) -> str:
    slots = data["slots"]
    r2_keys = data["r2_keys"]
    migration_list = data["migration_list"]
    broken_list = data["broken_list"]
    stale_flags = data["stale_flags"]
    orphan_keys = data["orphan_keys"]
    violation_keys = data["violation_keys"]

    non_acties = [s for s in slots if s["role"] != "acties"]
    total_mdx = len(slots)
    total_all_mdx = sum(1 for _ in CONTENT_ROOT.rglob("*.mdx"))
    out_of_scope = total_all_mdx - total_mdx
    total_r2 = len(r2_keys)
    total_slots = sum(1 + len(s["supporting"]) for s in non_acties)

    out = []
    ap = out.append  # shorthand

    # ── §1 Header ──────────────────────────────────────────────────────────────
    ap("# Content & Image Audit")
    ap("")
    ap(f"**Run time (UTC):** {run_time}  ")
    ap(f"**Git commit:** `{git_hash}`  ")
    ap(f"**MDX files read (in-scope):** {total_mdx} of {total_all_mdx} total ({out_of_scope} out-of-scope, e.g. journal/)  ")
    ap(f"**R2 keys (gear + vondsten + picks):** {total_r2}  ")
    ap(f"**Total slots audited:** {total_slots}")
    ap("")

    # ── §2 Summary table ───────────────────────────────────────────────────────
    ap("## 2. Summary")
    ap("")
    ap("| Section | Total slots | Filled-good | Filled-needs-migration | Empty | Broken |")
    ap("|---------|-------------|-------------|------------------------|-------|--------|")

    for section in SECTIONS:
        ss = [s for s in non_acties if s["section"] == section]
        all_states = []
        for s in ss:
            if s["hero"]:
                all_states.append(s["hero"]["state"])
            for sup in s["supporting"]:
                all_states.append(sup["state"])
        total = len(all_states)
        good = all_states.count("good")
        mig = all_states.count("needs-migration") + all_states.count("not-r2")
        empty = all_states.count("empty")
        broken = all_states.count("broken")
        ap(f"| {section} | {total} | {good} | {mig} | {empty} | {broken} |")

    ap("")

    # ── §3 Per-section slot inventory ──────────────────────────────────────────
    ap("## 3. Per-section slot inventory")
    ap("")

    for section in SECTIONS:
        ap(f"### {section.capitalize()}")
        ap("")

        # Landing
        ap("**Landing**")
        ap("")
        landing = next((s for s in slots if s["section"] == section and s["role"] == "landing"), None)
        if landing and landing["hero"]:
            h = landing["hero"]
            ap("| state | current_hero_image | expected_path | r2_exists |")
            ap("|-------|--------------------|---------------|-----------|")
            ap(f"| {h['state']} | {_cur(h['current'])} | `{h['expected']}` | {_bool(h['r2_current_exists'])} |")
        else:
            ap("_No landing file found._")
        ap("")

        # Category intros
        ap("**Category intros**")
        ap("")
        intros = sorted(
            [s for s in slots if s["section"] == section and s["role"] == "intro"],
            key=lambda x: x["category"]
        )
        if intros:
            ap("| category | mdx_path | state | current_hero_image | expected_path | r2_exists |")
            ap("|----------|----------|-------|--------------------|---------------|-----------|")
            for intro in intros:
                h = intro["hero"]
                if h:
                    ap(f"| {intro['category']} | `{intro['mdx_path']}` | {h['state']} "
                       f"| {_cur(h['current'])} | `{h['expected']}` | {_bool(h['r2_current_exists'])} |")
        else:
            ap("_None._")
        ap("")

        # Unit / Brand / BrandProduct pages
        if section == "picks":
            brands = sorted(
                [s for s in slots if s["section"] == section and s["role"] in ("brand", "unit")],
                key=lambda x: (x["category"], x["slug"])
            )
            ap("**Brand pages**")
            ap("")
            if brands:
                ap("| category | slug | hero_state | hero_current | hero_expected | hero_r2_exists | supporting_count | supporting_states |")
                ap("|----------|------|------------|--------------|---------------|----------------|------------------|-------------------|")
                for s in brands:
                    h = s["hero"]
                    if h:
                        ap(f"| {s['category']} | {s['slug']} | {h['state']} | {_cur(h['current'])} "
                           f"| `{h['expected']}` | {_bool(h['r2_current_exists'])} "
                           f"| {len(s['supporting'])} | {_supp_summary(s['supporting'])} |")
            else:
                ap("_None._")
            ap("")

            bps = sorted(
                [s for s in slots if s["section"] == section and s["role"] == "brandproduct"],
                key=lambda x: (x["category"], x.get("brand_slug") or "", x["slug"])
            )
            ap("**BrandProduct pages**")
            ap("")
            if bps:
                ap("| category | brand_slug | slug | hero_state | hero_current | hero_expected | hero_r2_exists | supporting_count | supporting_states |")
                ap("|----------|-----------|------|------------|--------------|---------------|----------------|------------------|-------------------|")
                for s in bps:
                    h = s["hero"]
                    if h:
                        ap(f"| {s['category']} | {s.get('brand_slug','')} | {s['slug']} "
                           f"| {h['state']} | {_cur(h['current'])} | `{h['expected']}` "
                           f"| {_bool(h['r2_current_exists'])} "
                           f"| {len(s['supporting'])} | {_supp_summary(s['supporting'])} |")
            else:
                ap("_None._")
            ap("")

        else:
            units = sorted(
                [s for s in slots if s["section"] == section and s["role"] == "unit"],
                key=lambda x: (x["category"] or "", x["slug"])
            )
            ap("**Unit pages**")
            ap("")
            if units:
                ap("| category | slug | hero_state | hero_current | hero_expected | hero_r2_exists | supporting_count | supporting_states |")
                ap("|----------|------|------------|--------------|---------------|----------------|------------------|-------------------|")
                for s in units:
                    h = s["hero"]
                    if h:
                        ap(f"| {s['category']} | {s['slug']} | {h['state']} | {_cur(h['current'])} "
                           f"| `{h['expected']}` | {_bool(h['r2_current_exists'])} "
                           f"| {len(s['supporting'])} | {_supp_summary(s['supporting'])} |")
            else:
                ap("_None._")
            ap("")

            if section == "vondsten":
                acties = sorted(
                    [s for s in slots if s["section"] == section and s["role"] == "acties"],
                    key=lambda x: x["slug"]
                )
                ap("**_acties (no image checks)**")
                ap("")
                if acties:
                    ap("| slug | mdx_path |")
                    ap("|------|----------|")
                    for s in acties:
                        ap(f"| {s['slug']} | `{s['mdx_path']}` |")
                else:
                    ap("_None._")
                ap("")

    # ── §4 Path migration list ─────────────────────────────────────────────────
    ap("## 4. Path migration list")
    ap("")
    if migration_list:
        ap("| section | category | slug | role | current_path | locked_path | r2_current_exists | r2_locked_exists |")
        ap("|---------|----------|------|------|--------------|-------------|-------------------|------------------|")
        for m in migration_list:
            r2_cur_label = "not-r2" if m["not_r2"] else _bool(m["r2_current_exists"])
            ap(f"| {m['section']} | {m['category']} | {m['slug']} | {m['role']} "
               f"| `{m['current_path']}` | `{m['locked_path']}` "
               f"| {r2_cur_label} | {_bool(m['r2_locked_exists'])} |")
    else:
        ap("_None._")
    ap("")

    # ── §5 Broken references ───────────────────────────────────────────────────
    ap("## 5. Broken references")
    ap("")
    if broken_list:
        ap("| section | category | slug | role | mdx_path | referenced_r2_key |")
        ap("|---------|----------|------|------|----------|-------------------|")
        for b in broken_list:
            ap(f"| {b['section']} | {b['category']} | {b['slug']} | {b['role']} "
               f"| `{b['mdx_path']}` | `{b['referenced_r2_key']}` |")
    else:
        ap("_None._")
    ap("")

    # ── §6 Orphan R2 keys ──────────────────────────────────────────────────────
    ap("## 6. Orphan R2 keys")
    ap("")
    if orphan_keys:
        for key in orphan_keys:
            meta = r2_keys[key]
            size = meta["size"]
            lm = meta["last_modified"]
            lm_str = lm.strftime("%Y-%m-%d") if hasattr(lm, "strftime") else str(lm)
            ap(f"- `{key}` — {size:,} bytes, modified {lm_str}")
    else:
        ap("_None._")
    ap("")

    # ── §7 Convention violations ───────────────────────────────────────────────
    ap("## 7. Convention violations")
    ap("")
    ap("_(R2 keys that exist but don't match any locked path pattern.)_")
    ap("")
    if violation_keys:
        ap("| r2_key | inferred_section | inferred_role |")
        ap("|--------|-----------------|---------------|")
        for key in violation_keys:
            parts = key.split("/")
            inferred_section = parts[0] if parts else "unknown"
            inferred_role = classify_r2_key_role(key)
            ap(f"| `{key}` | {inferred_section} | {inferred_role} |")
    else:
        ap("_None._")
    ap("")

    # ── §8 Stale-content flags ─────────────────────────────────────────────────
    ap("## 8. Stale-content flags")
    ap("")
    if stale_flags:
        ap("| mdx_path | flag_type | excerpt |")
        ap("|----------|-----------|---------|")
        for f in stale_flags:
            excerpt = f.get("excerpt", "").replace("|", "\\|").replace("\n", " ")
            ap(f"| `{f['mdx_path']}` | {f['flag_type']} | {excerpt[:100]} |")
    else:
        ap("_None._")
    ap("")

    # ── §9 Image-session feed ──────────────────────────────────────────────────
    ap("## 9. Image-session feed")
    ap("")
    ap("_(Only slots with state = empty or broken. Migrations and not-r2 are a separate workflow.)_")
    ap("")

    for section in SECTIONS:
        ap(f"### {section}")
        ap("")
        feed = []

        # Landing
        landing = next((s for s in slots if s["section"] == section and s["role"] == "landing"), None)
        if landing and landing["hero"] and landing["hero"]["state"] in ("empty", "broken"):
            feed.append((landing, "hero", landing["hero"]["state"], landing["hero"]["current"]))

        # Intros (sorted by category)
        intros = sorted(
            [s for s in slots if s["section"] == section and s["role"] == "intro"],
            key=lambda x: x["category"]
        )
        for intro in intros:
            h = intro["hero"]
            if h and h["state"] in ("empty", "broken"):
                feed.append((intro, "hero", h["state"], h["current"]))

        # Units / brands / brandproducts (by category, then brand, then slug)
        unit_roles = ("unit", "brand", "brandproduct")
        units = sorted(
            [s for s in slots if s["section"] == section and s["role"] in unit_roles],
            key=lambda x: (x["category"] or "", x.get("brand_slug") or "", x["slug"])
        )
        for u in units:
            h = u["hero"]
            if h and h["state"] in ("empty", "broken"):
                feed.append((u, "hero", h["state"], h["current"]))
            # Supporting: only if hero is good and supporting slot is empty
            if h and h["state"] == "good":
                for sup in u["supporting"]:
                    if sup["state"] == "empty":
                        feed.append((u, f"supporting-{sup['index']}", "empty", None))

        if feed:
            for slot, img_role, state, current in feed:
                s_sec = slot["section"]
                s_cat = slot["category"] or ""
                s_slug = slot["slug"]
                s_role = slot["role"]
                s_brand = slot.get("brand_slug") or ""

                if s_role == "landing":
                    slot_id = f"{s_sec}/_landing/{img_role}"
                elif s_role == "intro":
                    slot_id = f"{s_sec}/{s_cat}/_intro/{img_role}"
                elif s_role == "brandproduct":
                    slot_id = f"{s_sec}/{s_cat}/{s_brand}/{s_slug}/{img_role}"
                else:
                    slot_id = f"{s_sec}/{s_cat}/{s_slug}/{img_role}"

                notes_parts = []
                if current:
                    notes_parts.append(f"current: {current}")

                ap("```")
                ap(f"SLOT: {slot_id}")
                ap(f"STATE: {state}")
                if notes_parts:
                    ap(f"NOTES: {'; '.join(notes_parts)}")
                ap("```")
                ap("")
        else:
            ap("_No empty or broken slots._")
            ap("")

    return "\n".join(out)


# ── Main ───────────────────────────────────────────────────────────────────────

def get_git_hash() -> str:
    try:
        result = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            capture_output=True, text=True, cwd=str(REPO_ROOT)
        )
        return result.stdout.strip() or "unknown"
    except Exception:
        return "unknown"


def main():
    load_env()
    s3 = get_r2_client()
    bucket = get_bucket()

    print("Listing R2 keys...", end=" ", flush=True)
    r2_keys = list_r2_keys(s3, bucket)
    print(f"{len(r2_keys)} keys found.")

    print("Building slot inventory and audit data...", end=" ", flush=True)
    data = build_audit(r2_keys)
    print("done.")

    run_time = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    git_hash = get_git_hash()

    print("Rendering report...", end=" ", flush=True)
    report = render_report(data, git_hash, run_time)
    print("done.")

    AUDIT_DIR.mkdir(exist_ok=True)
    report_path = AUDIT_DIR / f"content-image-audit-{date.today().isoformat()}.md"
    report_path.write_text(report, encoding="utf-8")

    # One-line summary
    slots = data["slots"]
    non_acties = [s for s in slots if s["role"] != "acties"]
    all_states = []
    for s in non_acties:
        if s["hero"]:
            all_states.append(s["hero"]["state"])
        for sup in s["supporting"]:
            all_states.append(sup["state"])

    print(
        f"{len(all_states)} slots audited, "
        f"{all_states.count('empty')} empty, "
        f"{all_states.count('broken')} broken, "
        f"{len(data['migration_list'])} migrations, "
        f"report at {report_path}"
    )


if __name__ == "__main__":
    main()
