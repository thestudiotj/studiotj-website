"""
Session 12c-variants — Flat MDX → Grouped MDX migration.

Reads all flat product MDX from content/products/, groups by (photo_id, family)
for photo products and by (collection, format_key) for books/calendars, then
writes grouped MDX to content/products-grouped/.

Usage:
    python scripts/migrate-to-grouped.py
"""

import os
import re
import sys
from collections import defaultdict
from pathlib import Path

# PyYAML is needed; run `pip install pyyaml` if missing.
try:
    import yaml
except ImportError:
    print("Missing pyyaml — run: pip install pyyaml")
    sys.exit(1)

ROOT = Path(__file__).parent.parent
PRODUCTS_DIR = ROOT / "content" / "products"
OUTPUT_DIR = ROOT / "content" / "products-grouped"

# ─── Family display names ──────────────────────────────────────────────────────

FAMILY_DISPLAY = {
    "can": "Stretched Canvas",
    "clp": "C-type Lustre Pro",
    "ema": "Enhanced Matte Art",
    "hge": "Hahnemühle German Etching",
    "hpr": "Hahnemühle Photo Rag",
    "fap": "Framed Print",
    "gre": "Greeting Card",
    "pos": "Postcard",
    "hpb": "Hardcover Photo Book",
    "spb": "Softcover Photo Book",
    "cal": "Wall Calendar",
}

# Variant axes per family
# "size" = all families; "color" = fap only; "pack" = gre/pos only
FAMILY_AXES = {
    "can": ["size"],
    "clp": ["size"],
    "ema": ["size"],
    "hge": ["size"],
    "hpr": ["size"],
    "fap": ["size", "color"],
    "gre": ["size", "pack"],
    "pos": ["size", "pack"],
    "hpb": ["size"],
    "spb": ["size"],
    "cal": ["size"],
}

# Size ordering for default-variant selection (lower index = preferred default)
SIZE_ORDER = {
    # paper sizes
    "a5": 0, "a4": 1, "a3": 2,
    # canvas
    "16x12": 0, "20x16": 1, "40x30": 2,
    # clp
    "16x20": 0, "24x36": 1,
    # card/postcard sizes
    "6x4": 0, "7x5": 1,
    # book sizes (smallest area first)
    "83sq": 0, "a5l": 1, "a5p": 2, "a4l": 3, "a4p": 4,
    # calendar sizes
    "a5l": 0, "a4l": 1,
}

COLOR_ORDER = {"black": 0, "natural-oak": 1, "white": 2}

PACK_ORDER = {10: 0, 20: 1, 50: 2, 100: 3}


# ─── Filename parsers ──────────────────────────────────────────────────────────

# photo-{photo_id}-{family}-{...rest}
PHOTO_PATTERN = re.compile(
    r"^photo-"
    r"((?:atmospheric|halcyon|mono|signature)-\S+?-\d+)"  # photo_id
    r"-([a-z]+)"                                            # family
    r"-(.+?)$"                                              # rest (size/color/pack)
)

# book-{collection}-{hardcover|softcover}-{size}
BOOK_PATTERN = re.compile(
    r"^book-([a-z]+)-(hardcover|softcover)-(.+?)$"
)

# cal-{collection}-{size}
CAL_PATTERN = re.compile(
    r"^cal-([a-z]+)-(.+?)$"
)


def parse_photo_filename(stem: str):
    """Returns (photo_id, family, size_tokens) or None."""
    m = PHOTO_PATTERN.match(stem)
    if not m:
        return None
    photo_id, family, rest = m.group(1), m.group(2), m.group(3)
    if family not in FAMILY_DISPLAY:
        return None
    return photo_id, family, rest


def parse_book_filename(stem: str):
    """Returns (collection, book_format, size) or None."""
    m = BOOK_PATTERN.match(stem)
    if not m:
        return None
    return m.group(1), m.group(2), m.group(3)


def parse_cal_filename(stem: str):
    """Returns (collection, size) or None."""
    m = CAL_PATTERN.match(stem)
    if not m:
        return None
    return m.group(1), m.group(2)


# ─── Gallery extraction ────────────────────────────────────────────────────────

def extract_gallery_fields(family: str, gallery: list, hero_image: str):
    """
    Returns (variant_hero, variant_mock1, variant_mock2, product_photo_url, product_example_image).

    Gallery layouts by family:
      Wall art (can/fap/ema/hge/hpr/clp) — 5 images: [mock1, mock2, photo_url, hero, example_image]
      gre — 2 images: [hero, example_image]
      pos — 4 images: [hero, mock1, mock2, example_image]
      books/calendars — 4 images: [hero, mock1, mock2, example_image]
    """
    if not gallery:
        return hero_image, None, None, None, None

    if family in ("can", "fap", "ema", "hge", "hpr", "clp"):
        if len(gallery) >= 5:
            return gallery[3], gallery[0], gallery[1], gallery[2], gallery[4]
        elif len(gallery) == 4:
            # Missing hero at index 3? Use hero_image.
            return hero_image, gallery[0], gallery[1], gallery[2], gallery[3]
        else:
            return hero_image, gallery[0] if len(gallery) > 0 else None, None, None, gallery[-1] if gallery else None

    elif family == "gre":
        if len(gallery) >= 2:
            return gallery[0], None, None, None, gallery[1]
        else:
            return gallery[0] if gallery else hero_image, None, None, None, None

    elif family in ("pos", "hpb", "spb", "cal"):
        if len(gallery) >= 4:
            return gallery[0], gallery[1], gallery[2], None, gallery[3]
        elif len(gallery) == 3:
            return gallery[0], gallery[1], None, None, gallery[2]
        else:
            return gallery[0] if gallery else hero_image, None, None, None, gallery[-1] if gallery else None

    else:
        # Fallback
        return hero_image, None, None, None, gallery[-1] if gallery else None


# ─── Size/color/pack extraction from filename rest ─────────────────────────────

def parse_variant_dims(family: str, rest: str):
    """
    Returns dict with keys: size, size_label, color (fap only), pack (gre/pos only).
    """
    if family in ("can", "clp", "ema", "hge", "hpr"):
        return {"size": rest, "size_label": format_size_label(rest)}

    elif family == "fap":
        # rest = "a3-black", "a3-natural-oak", "a4-white", etc.
        parts = rest.split("-", 1)
        size = parts[0]
        color = parts[1] if len(parts) > 1 else "black"
        return {"size": size, "size_label": format_size_label(size), "color": color}

    elif family in ("gre", "pos"):
        # rest = "6x4-pack10", "7x5-pack100", etc.
        m = re.match(r"(\d+x\d+)-pack(\d+)", rest)
        if m:
            size = m.group(1)
            pack = int(m.group(2))
            return {"size": size, "size_label": format_size_label(size), "pack": pack}
        return {"size": rest, "size_label": rest}

    else:
        return {"size": rest, "size_label": format_size_label(rest)}


def format_size_label(size: str) -> str:
    """Human-readable size label."""
    mapping = {
        "a3": "A3", "a4": "A4", "a5": "A5",
        "16x12": '16×12"', "20x16": '20×16"', "40x30": '40×30"',
        "16x20": '16×20"', "24x36": '24×36"',
        "6x4": '6×4"', "7x5": '7×5"',
        "83sq": '8.3" Square',
        "a4l": "A4 Landscape", "a4p": "A4 Portrait",
        "a5l": "A5 Landscape", "a5p": "A5 Portrait",
        "a3l": "A3 Landscape",
    }
    return mapping.get(size.lower(), size.upper())


# ─── Variant sort key ──────────────────────────────────────────────────────────

def variant_sort_key(family: str, dims: dict) -> tuple:
    size_key = SIZE_ORDER.get(dims.get("size", "").lower(), 99)
    color_key = COLOR_ORDER.get(dims.get("color", ""), 99)
    pack_key = PACK_ORDER.get(dims.get("pack", 0), 99)
    return (size_key, color_key, pack_key)


# ─── Title derivation ─────────────────────────────────────────────────────────

def derive_group_title(flat_title: str, family: str) -> str:
    """
    Strips the variant-specific suffix from the flat title.

    Photo products:  "{photo_name}, {FamilyDisplayName}, {Size}" → "{photo_name}, {FamilyDisplay}"
    Books/calendars: "{CollectionName} — {Type}, {Size}"          → "{CollectionName} — {Type}"
    """
    family_display = FAMILY_DISPLAY.get(family, "")

    if family in ("hpb", "spb", "cal"):
        # Strip last ", {size}" component
        idx = flat_title.rfind(", ")
        if idx >= 0:
            return flat_title[:idx]
        return flat_title

    # Photo products: find `, {FamilyDisplay}` and strip everything after
    idx = flat_title.find(", " + family_display)
    if idx >= 0:
        photo_part = flat_title[:idx]
        return f"{photo_part}, {family_display}"

    return flat_title


def derive_group_description(flat_description: str, family: str) -> str:
    """
    Strip the size-specific part from the flat description.
    """
    # Flat desc: "Photo Name. Product type details, size."
    # We want: "Photo Name. Product type details."
    # Strategy: strip everything after the last comma (which contains the size).
    if family in ("hpb", "spb", "cal"):
        # Book/cal descriptions already have size - strip from last comma
        idx = flat_description.rfind(", ")
        if idx >= 0:
            return flat_description[:idx] + "."
    elif family in ("can", "fap", "ema", "hge", "hpr", "clp", "gre", "pos"):
        # Strip size from the end: "..., A3." → "..."
        # Match ", {size}." or ", {size}" at end
        stripped = flat_description.rstrip(".")
        idx = stripped.rfind(", ")
        if idx >= 0:
            candidate = stripped[:idx] + "."
            return candidate

    return flat_description


# ─── Orientation detection ────────────────────────────────────────────────────

def detect_orientation(gallery: list) -> str:
    """Detect landscape/portrait from gallery URL keywords."""
    combined = " ".join(str(u) for u in gallery)
    if "portrait" in combined:
        return "portrait"
    elif "landscape" in combined:
        return "landscape"
    return ""


# ─── MDX writer ───────────────────────────────────────────────────────────────

def write_grouped_mdx(path: Path, group: dict):
    """Write a grouped MDX file."""
    lines = ["---"]

    def emit(key, value, indent=0):
        prefix = "  " * indent
        if value is None:
            lines.append(f"{prefix}{key}: null")
        elif isinstance(value, bool):
            lines.append(f"{prefix}{key}: {'true' if value else 'false'}")
        elif isinstance(value, int):
            lines.append(f"{prefix}{key}: {value}")
        elif isinstance(value, float):
            lines.append(f"{prefix}{key}: {value}")
        elif isinstance(value, str):
            # Quote strings that need it
            if any(c in value for c in ['"', "'", "\n", ":", "{", "}", "[", "]"]):
                escaped = value.replace('"', '\\"')
                lines.append(f'{prefix}{key}: "{escaped}"')
            else:
                lines.append(f"{prefix}{key}: {value}")
        elif isinstance(value, list):
            if not value:
                lines.append(f"{prefix}{key}: []")
            else:
                lines.append(f"{prefix}{key}:")
                for item in value:
                    if isinstance(item, str):
                        lines.append(f"{prefix}  - '{item}'")
                    else:
                        lines.append(f"{prefix}  - {item}")

    emit("type", "grouped")
    emit("id", group["id"])
    emit("title", group["title"])
    emit("description", group["description"])
    emit("photo_url", group.get("photo_url"))
    emit("example_image", group.get("example_image"))
    emit("available", group["available"])
    emit("collection", group["collection"])
    emit("photo_id", group.get("photo_id"))
    emit("format", group["format"])
    emit("family", group["family"])
    emit("margin_pct", group["margin_pct"])

    # print_areas
    lines.append("print_areas:")
    for pa in group["print_areas"]:
        lines.append(f"  - slot: {pa['slot']}")
        lines.append(f"    default_asset_r2: {pa['default_asset_r2']}")

    # variant_axes
    axes = group.get("variant_axes", ["size"])
    lines.append(f"variant_axes: [{', '.join(axes)}]")

    emit("default_variant", group["default_variant"])

    # variants
    lines.append("variants:")
    for v in group["variants"]:
        lines.append(f"  - variantId: {v['variantId']}")
        emit("size", v["size"], indent=2)
        emit("size_label", v["size_label"], indent=2)
        if "color" in v:
            emit("color", v["color"], indent=2)
        if "pack" in v:
            lines.append(f"    pack: {v['pack']}")
        if v.get("orientation"):
            emit("orientation", v["orientation"], indent=2)
        emit("sku", v["sku"], indent=2)
        lines.append(f"    price_cents: {v['price_cents']}")
        if v.get("base_prices"):
            lines.append("    base_prices:")
            for lab, price in v["base_prices"].items():
                lines.append(f"      {lab}: {price}")
        # gallery images
        if v.get("hero"):
            lines.append(f"    hero: '{v['hero']}'")
        if v.get("mock1"):
            lines.append(f"    mock1: '{v['mock1']}'")
        if v.get("mock2"):
            lines.append(f"    mock2: '{v['mock2']}'")

    lines.append("---")
    lines.append("")  # empty body

    path.write_text("\n".join(lines), encoding="utf-8")


# ─── Main ─────────────────────────────────────────────────────────────────────

def read_mdx_frontmatter(filepath: Path) -> dict:
    """Parse YAML frontmatter from an MDX file.

    These MDX files have no closing --- delimiter; the entire file content
    (after the opening ---) is valid YAML frontmatter. We try the closing
    delimiter first (standard), then fall back to parsing the whole body.
    """
    text = filepath.read_text(encoding="utf-8")
    stripped = text.lstrip("\r\n")
    if not stripped.startswith("---"):
        return {}
    # Strip the opening ---
    body = stripped[3:].lstrip("\r\n")
    # Try to find a closing --- on its own line
    for sep in ("\n---\n", "\r\n---\r\n", "\n---", "\r\n---"):
        idx = body.find(sep)
        if idx >= 0:
            fm_text = body[:idx]
            try:
                return yaml.safe_load(fm_text) or {}
            except Exception as e:
                print(f"  YAML error in {filepath.name}: {e}")
                return {}
    # No closing delimiter — parse entire body as YAML
    try:
        return yaml.safe_load(body) or {}
    except Exception as e:
        print(f"  YAML error in {filepath.name}: {e}")
        return {}


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # ── Group flat MDX files ───────────────────────────────────────────────────
    # groups maps group_id → list of (sort_key, variant_data)
    groups: dict[str, list] = defaultdict(list)
    group_meta: dict[str, dict] = {}  # group_id → shared fields
    errors = []
    skipped = []

    mdx_files = sorted(PRODUCTS_DIR.glob("*.mdx"))
    print(f"Found {len(mdx_files)} MDX files in {PRODUCTS_DIR}")

    for filepath in mdx_files:
        stem = filepath.stem

        # Skip README
        if stem.lower() == "readme":
            skipped.append(stem)
            continue

        fm = read_mdx_frontmatter(filepath)
        if not fm:
            errors.append(f"Empty frontmatter: {stem}")
            continue

        if fm.get("type") == "grouped":
            # Already grouped — skip (shouldn't happen on first run)
            skipped.append(stem)
            continue

        # ── Photo products ─────────────────────────────────────────────────
        parsed_photo = parse_photo_filename(stem)
        if parsed_photo:
            photo_id_slug, family, rest = parsed_photo
            group_id = f"photo-{photo_id_slug}-{family}"
            dims = parse_variant_dims(family, rest)
            sort_key = variant_sort_key(family, dims)
            gallery = fm.get("gallery") or []
            v_hero, v_mock1, v_mock2, photo_url, example_image = extract_gallery_fields(
                family, gallery, fm.get("hero_image", "")
            )
            orientation = detect_orientation(gallery)

            variant = {
                "variantId": fm.get("id", stem),
                **dims,
                "orientation": orientation,
                "sku": fm.get("prodigi_sku", ""),
                "price_cents": fm.get("price_cents"),
                "base_prices": fm.get("base_prices") or {},
                "hero": v_hero,
                "mock1": v_mock1,
                "mock2": v_mock2,
            }

            groups[group_id].append((sort_key, variant))

            if group_id not in group_meta:
                group_meta[group_id] = {
                    "id": group_id,
                    "family": family,
                    "format": fm.get("format", ""),
                    "collection": fm.get("collection", ""),
                    "photo_id": fm.get("photo_id"),
                    "available": fm.get("available", True),
                    "margin_pct": fm.get("margin_pct", 0),
                    "print_areas": fm.get("print_areas") or [],
                    "photo_url": photo_url,
                    "example_image": example_image,
                    "_flat_title": fm.get("title", ""),
                    "_flat_description": fm.get("description", ""),
                }
            continue

        # ── Book products ──────────────────────────────────────────────────
        parsed_book = parse_book_filename(stem)
        if parsed_book:
            collection, book_format, size = parsed_book
            family = "hpb" if book_format == "hardcover" else "spb"
            group_id = f"book-{collection}-{family}"
            dims = {"size": size, "size_label": format_size_label(size)}
            sort_key = variant_sort_key(family, dims)
            gallery = fm.get("gallery") or []
            v_hero, v_mock1, v_mock2, photo_url, example_image = extract_gallery_fields(
                family, gallery, fm.get("hero_image", "")
            )

            variant = {
                "variantId": fm.get("id", stem),
                **dims,
                "orientation": "",
                "sku": fm.get("prodigi_sku", ""),
                "price_cents": fm.get("price_cents"),
                "base_prices": fm.get("base_prices") or {},
                "hero": v_hero,
                "mock1": v_mock1,
                "mock2": v_mock2,
            }

            groups[group_id].append((sort_key, variant))

            if group_id not in group_meta:
                group_meta[group_id] = {
                    "id": group_id,
                    "family": family,
                    "format": fm.get("format", "book"),
                    "collection": fm.get("collection", f"the-{collection}-collection"),
                    "photo_id": None,
                    "available": fm.get("available", False),
                    "margin_pct": fm.get("margin_pct", 0),
                    "print_areas": fm.get("print_areas") or [],
                    "photo_url": None,
                    "example_image": example_image,
                    "_flat_title": fm.get("title", ""),
                    "_flat_description": fm.get("description", ""),
                }
            continue

        # ── Calendar products ──────────────────────────────────────────────
        parsed_cal = parse_cal_filename(stem)
        if parsed_cal:
            collection, size = parsed_cal
            family = "cal"
            group_id = f"cal-{collection}"
            dims = {"size": size, "size_label": format_size_label(size)}
            sort_key = variant_sort_key(family, dims)
            gallery = fm.get("gallery") or []
            v_hero, v_mock1, v_mock2, photo_url, example_image = extract_gallery_fields(
                family, gallery, fm.get("hero_image", "")
            )

            variant = {
                "variantId": fm.get("id", stem),
                **dims,
                "orientation": "",
                "sku": fm.get("prodigi_sku", ""),
                "price_cents": fm.get("price_cents"),
                "base_prices": fm.get("base_prices") or {},
                "hero": v_hero,
                "mock1": v_mock1,
                "mock2": v_mock2,
            }

            groups[group_id].append((sort_key, variant))

            if group_id not in group_meta:
                group_meta[group_id] = {
                    "id": group_id,
                    "family": family,
                    "format": fm.get("format", "calendar"),
                    "collection": fm.get("collection", f"the-{collection}-collection"),
                    "photo_id": None,
                    "available": fm.get("available", False),
                    "margin_pct": fm.get("margin_pct", 0),
                    "print_areas": fm.get("print_areas") or [],
                    "photo_url": None,
                    "example_image": example_image,
                    "_flat_title": fm.get("title", ""),
                    "_flat_description": fm.get("description", ""),
                }
            continue

        errors.append(f"Unrecognised filename: {stem}")

    # ── Generate grouped MDX ──────────────────────────────────────────────────
    total_variants = 0
    written_groups = 0

    for group_id, variant_entries in sorted(groups.items()):
        meta = group_meta[group_id]
        family = meta["family"]

        # Sort variants and determine default
        variant_entries.sort(key=lambda x: x[0])
        variants = [v for _, v in variant_entries]
        total_variants += len(variants)

        # Derive group-level title and description
        flat_title = meta["_flat_title"]
        flat_desc = meta["_flat_description"]
        group_title = derive_group_title(flat_title, family)
        group_desc = derive_group_description(flat_desc, family)

        # Derive photo_url from variants if not set (wall art has it in gallery)
        photo_url = meta.get("photo_url")
        example_image = meta.get("example_image")

        # For families where photo_url / example_image come from variants,
        # use the first variant's values (they should all be the same)
        if not photo_url and family in ("can", "fap", "ema", "hge", "hpr", "clp"):
            # These should have been extracted; use first variant's mock1 URL base
            pass

        # variant_axes
        axes = FAMILY_AXES.get(family, ["size"])

        group = {
            "id": group_id,
            "title": group_title,
            "description": group_desc,
            "photo_url": photo_url,
            "example_image": example_image,
            "available": meta["available"],
            "collection": meta["collection"],
            "photo_id": meta["photo_id"],
            "format": meta["format"],
            "family": family,
            "margin_pct": meta["margin_pct"],
            "print_areas": meta["print_areas"],
            "variant_axes": axes,
            "default_variant": 0,
            "variants": variants,
        }

        out_path = OUTPUT_DIR / f"{group_id}.mdx"
        try:
            write_grouped_mdx(out_path, group)
            written_groups += 1
        except Exception as e:
            errors.append(f"Failed to write {group_id}: {e}")

    # ── Report ────────────────────────────────────────────────────────────────
    print(f"\n{'='*60}")
    print(f"MIGRATION COMPLETE")
    print(f"{'='*60}")
    print(f"  Groups written:   {written_groups}")
    print(f"  Total variants:   {total_variants}")
    print(f"  Files skipped:    {len(skipped)}")
    print(f"  Output dir:       {OUTPUT_DIR}")

    if errors:
        print(f"\n  ERRORS ({len(errors)}):")
        for e in errors:
            print(f"    - {e}")
    else:
        print(f"\n  No errors.")

    # ── Per-family breakdown ──────────────────────────────────────────────────
    print(f"\n  Per-family groups:")
    family_counts: dict[str, int] = defaultdict(int)
    family_variants: dict[str, int] = defaultdict(int)
    for group_id, entries in groups.items():
        meta = group_meta[group_id]
        fam = meta["family"]
        family_counts[fam] += 1
        family_variants[fam] += len(entries)
    for fam in sorted(family_counts):
        print(f"    {fam:6s}: {family_counts[fam]:3d} groups, {family_variants[fam]:4d} variants")

    return total_variants


if __name__ == "__main__":
    main()
