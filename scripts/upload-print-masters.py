#!/usr/bin/env python3
"""
upload-print-masters — sibling to studiotj-upload/upload.py

Reads product MDX files to discover all print master JPEG requirements, locates the
source JPEG in the Lightroom export folders via the photo_url field, and uploads
each file to R2 at:
  print/photography/{collection}/{photo-id}/master.jpg

Reuses the R2 credentials and exports_folder path from studiotj-upload/config.json.
Does NOT re-encode: the original Lightroom JPEG is uploaded verbatim (no generation
loss). The upload tool already exports at ≥6000px long edge which satisfies Prodigi's
print requirements.

Usage:
  python3.14 scripts/upload-print-masters.py [--dry-run] [--force]

  --dry-run   Scan and print what would be done; no uploads.
  --force     Re-upload even if the R2 key already exists.
"""

import argparse
import json
import re
import sys
from pathlib import Path
from urllib.parse import unquote

if sys.platform == "win32" and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# ── Config ─────────────────────────────────────────────────────────────────────
SCRIPT_DIR  = Path(__file__).resolve().parent
WEBSITE_DIR = SCRIPT_DIR.parent
UPLOAD_CFG  = WEBSITE_DIR.parent / "studiotj-upload" / "config.json"
PRODUCTS_DIR = WEBSITE_DIR / "content" / "products"

MIN_LONG_EDGE = 6000  # px — 150 DPI at 40×30"

# ── Helpers ────────────────────────────────────────────────────────────────────

def load_upload_config() -> dict:
    if not UPLOAD_CFG.exists():
        sys.exit(f"ERROR: config.json not found at {UPLOAD_CFG}")
    with open(UPLOAD_CFG, encoding="utf-8") as f:
        return json.load(f)


def make_r2_client(cfg: dict):
    try:
        import boto3
    except ImportError:
        sys.exit("ERROR: boto3 not installed. Run: pip install boto3")
    r2 = cfg["r2"]
    return boto3.client(
        "s3",
        endpoint_url=r2["endpoint_url"],
        aws_access_key_id=r2["access_key_id"],
        aws_secret_access_key=r2["secret_access_key"],
    ), r2["bucket_name"]


def r2_key_exists(client, bucket: str, key: str) -> bool:
    try:
        client.head_object(Bucket=bucket, Key=key)
        return True
    except Exception:
        return False


def parse_mdx_field(mdx_text: str, field: str) -> str | None:
    """Extract a top-level frontmatter field value (unquoted)."""
    for line in mdx_text.splitlines():
        stripped = line.strip()
        if stripped.startswith(field + ":"):
            val = stripped[len(field)+1:].strip().strip('"').strip("'")
            return val or None
    return None


def parse_default_asset_r2(mdx_text: str) -> str | None:
    """Extract the first default_asset_r2 value from print_areas."""
    for line in mdx_text.splitlines():
        if "default_asset_r2:" in line:
            val = line.split("default_asset_r2:", 1)[1].strip().strip('"').strip("'")
            return val or None
    return None


def photo_url_to_source_path(photo_url: str, exports_root: Path) -> Path | None:
    """
    Given a hero URL like:
      https://photos.studiotj.com/2025-05-22-LeidenPolderpark/2025-05-22-LeidenPolderpark (17)-hero.webp
    return the expected source JPEG path:
      {exports_root}/2025-05-22-LeidenPolderpark/2025-05-22-LeidenPolderpark (17).jpg
    """
    prefix = "https://photos.studiotj.com/"
    if not photo_url.startswith(prefix):
        return None
    rel = photo_url[len(prefix):]
    parts = rel.split("/", 1)
    if len(parts) != 2:
        return None
    shoot_folder, hero_filename = parts
    # Strip "-hero.webp" to get stem, then add ".jpg"
    if not hero_filename.endswith("-hero.webp"):
        return None
    stem = hero_filename[: -len("-hero.webp")]
    return exports_root / shoot_folder / (stem + ".jpg")


def discover_print_masters() -> list[dict]:
    """
    Scan all grouped MDX files. Return one entry per unique default_asset_r2 path,
    with the source JPEG path resolved.
    """
    seen_r2_paths: set[str] = set()
    entries: list[dict] = []

    for mdx_file in sorted(PRODUCTS_DIR.glob("*.mdx")):
        text = mdx_file.read_text(encoding="utf-8")
        # Only grouped products that are available in the shop
        if "type: grouped" not in text:
            continue
        if "available: true" not in text:
            continue
        r2_path = parse_default_asset_r2(text)
        if not r2_path:
            continue
        if r2_path in seen_r2_paths:
            continue
        seen_r2_paths.add(r2_path)

        photo_url = parse_mdx_field(text, "photo_url")
        entries.append({
            "mdx": mdx_file.name,
            "r2_path": r2_path,
            "photo_url": photo_url,
        })

    return entries


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--dry-run", action="store_true",
                        help="Show what would be done without uploading")
    parser.add_argument("--force", action="store_true",
                        help="Re-upload even if the R2 key already exists")
    args = parser.parse_args()

    cfg = load_upload_config()
    exports_root = (UPLOAD_CFG.parent / cfg["paths"]["exports_folder"]).resolve()
    bucket_public_url = cfg["r2"]["public_url"].rstrip("/")

    print(f"Exports root:  {exports_root}")
    print(f"R2 bucket:     {cfg['r2']['bucket_name']}")
    print(f"Public URL:    {bucket_public_url}")
    print()

    entries = discover_print_masters()
    print(f"Found {len(entries)} unique print master slots in MDX files.\n")

    client, bucket = (None, None)
    if not args.dry_run:
        client, bucket = make_r2_client(cfg)

    # ── Pillow for dimension check ─────────────────────────────────────────────
    try:
        from PIL import Image, ImageOps
    except ImportError:
        sys.exit("ERROR: Pillow not installed. Run: pip install Pillow")

    stats = {"uploaded": 0, "skipped_exists": 0, "missing_source": 0, "errors": 0, "low_res": 0}
    results = []

    for entry in entries:
        r2_path = entry["r2_path"]
        photo_url = entry["photo_url"] or ""
        mdx = entry["mdx"]

        # Resolve source path
        src = photo_url_to_source_path(photo_url, exports_root) if photo_url else None

        if src is None or not src.exists():
            print(f"  ✗ MISSING  {r2_path}")
            print(f"            (looked for: {src})")
            stats["missing_source"] += 1
            results.append({"r2_path": r2_path, "status": "MISSING", "notes": str(src)})
            continue

        # Open and check dimensions
        try:
            img = Image.open(src)
            ImageOps.exif_transpose(img).load()
            img = ImageOps.exif_transpose(img)
            w, h = img.size
            long_edge = max(w, h)
            size_mb = src.stat().st_size / 1024 / 1024
        except Exception as e:
            print(f"  ✗ ERROR    {r2_path}  ({e})")
            stats["errors"] += 1
            results.append({"r2_path": r2_path, "status": "ERROR", "notes": str(e)})
            continue

        dim_note = f"{w}×{h}px  {size_mb:.1f}MB"
        if long_edge < MIN_LONG_EDGE:
            dim_note += f"  ⚠ long={long_edge} < {MIN_LONG_EDGE}"
            stats["low_res"] += 1

        # Skip-if-exists check
        if not args.dry_run and not args.force:
            if r2_key_exists(client, bucket, r2_path):
                print(f"  ↷ EXISTS   {r2_path}  ({dim_note})")
                stats["skipped_exists"] += 1
                results.append({"r2_path": r2_path, "status": "EXISTS", "notes": dim_note})
                continue

        if args.dry_run:
            print(f"  ○ DRY-RUN  {r2_path}  ({dim_note})  ← {src.name}")
            stats["uploaded"] += 1
            results.append({"r2_path": r2_path, "status": "DRY-RUN", "notes": dim_note})
            continue

        # Upload the original JPEG verbatim (no re-encoding)
        try:
            with open(src, "rb") as f:
                data = f.read()
            client.put_object(
                Bucket=bucket,
                Key=r2_path,
                Body=data,
                ContentType="image/jpeg",
            )
            print(f"  ✓ UPLOADED {r2_path}  ({dim_note})")
            stats["uploaded"] += 1
            results.append({"r2_path": r2_path, "status": "UPLOADED", "notes": dim_note, "src": str(src)})
        except Exception as e:
            print(f"  ✗ ERROR    {r2_path}  ({e})")
            stats["errors"] += 1
            results.append({"r2_path": r2_path, "status": "ERROR", "notes": str(e)})

    # ── Summary ────────────────────────────────────────────────────────────────
    print()
    print("=" * 60)
    print(f"Uploaded:        {stats['uploaded']}")
    print(f"Already exists:  {stats['skipped_exists']}")
    print(f"Missing source:  {stats['missing_source']}")
    print(f"Errors:          {stats['errors']}")
    if stats["low_res"]:
        print(f"Low-res warned:  {stats['low_res']}  (long edge < {MIN_LONG_EDGE}px)")

    if stats["missing_source"] or stats["errors"]:
        print("\nWARNING: some files were not uploaded. Re-run after fixing missing sources.")
        sys.exit(1)
    elif not args.dry_run and stats["uploaded"] == 0 and stats["skipped_exists"] > 0:
        print("\nAll files already in R2. Use --force to re-upload.")
    else:
        print("\nDone.")


if __name__ == "__main__":
    main()
