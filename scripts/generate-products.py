#!/usr/bin/env python3
"""
Generate photography product MDX files for studiotj-website.
Session 12a — 27 launch photos × ~64 SKUs/photo + 36 collection stubs.

Run with --collection <slug> to generate one collection at a time:
  python scripts/generate-products.py --collection signature
  python scripts/generate-products.py --collection mono
  python scripts/generate-products.py --collection atmospheric
  python scripts/generate-products.py --collection halcyon
  python scripts/generate-products.py --stubs

Run without args to generate all at once.

PRICING NOTICE: All base_prices values are PLACEHOLDER estimates.
Verify against Prodigi pricing CSVs at /mnt/user-data/uploads/prodigi-*.csv
on the Hetzner server before launch. The CSV files were not accessible during
generation from the Windows dev machine.
"""

import sys
import math
from pathlib import Path

OUTPUT_DIR = Path(__file__).parent.parent / "content" / "products"
CREATED_AT = "2026-05-10"

# ─── Photo manifest ───────────────────────────────────────────────────────────
# photo_id: actual portfolio.json ID (DO NOT use the short suggestion)
# photo_short: short form used in filenames and R2 paths
# title_base: human title (from sorter manifest)
# collection: full collection slug
# collection_short: short label for filenames and R2 paths
# cards_ok: passes greeting-card/postcard mood check
#   False for TheHague 187/194/218 — moods (minimalist, cinematic) lack
#   warm/serene/contemplative/atmospheric/quiet/golden-hour register required.
# canvas_ok: passes canvas composition check (all True — no tight-crop/edge-subject)

PHOTOS = [
    # ─── The Signature Collection ─────────────────────────────────────────────
    {
        "photo_id": "2025-05-01-TheHague-export-2025-05-01-thehague-148",
        "photo_short": "signature-thehague-148",
        "title_base": "Gothic Brick Gable Cross — The Hague",
        "collection": "the-signature-collection",
        "collection_short": "signature",
        "cards_ok": True,
        "canvas_ok": True,
    },
    {
        "photo_id": "2025-05-01-TheHague-export-2025-05-01-thehague-153",
        "photo_short": "signature-thehague-153",
        "title_base": "Gothic Gable Rising Against Blue Sky — The Hague",
        "collection": "the-signature-collection",
        "collection_short": "signature",
        "cards_ok": True,
        "canvas_ok": True,
    },
    {
        "photo_id": "2025-05-01-TheHague-export-2025-05-01-thehague-187",
        "photo_short": "signature-thehague-187",
        "title_base": "Modern Tower Balconies Against Blue Sky — The Hague",
        "collection": "the-signature-collection",
        "collection_short": "signature",
        "cards_ok": False,  # mood: minimalist, cinematic only
        "canvas_ok": True,
    },
    {
        "photo_id": "2025-05-01-TheHague-export-2025-05-01-thehague-194",
        "photo_short": "signature-thehague-194",
        "title_base": "Curved Tower Facade Against Blue Sky — The Hague",
        "collection": "the-signature-collection",
        "collection_short": "signature",
        "cards_ok": False,  # mood: cinematic only
        "canvas_ok": True,
    },
    {
        "photo_id": "2025-05-01-TheHague-export-2025-05-01-thehague-218",
        "photo_short": "signature-thehague-218",
        "title_base": "Curved Glass Tower Rising to Blue Sky — The Hague",
        "collection": "the-signature-collection",
        "collection_short": "signature",
        "cards_ok": False,  # mood: minimalist, cinematic only
        "canvas_ok": True,
    },
    # ─── Monochrome Moods ─────────────────────────────────────────────────────
    {
        "photo_id": "2025-05-05-Amsterdam-Science-Park-export-2025-05-05-amsterdam-240",
        "photo_short": "mono-asp-240",
        "title_base": "Modernist Facade Clock — Amsterdam Science Park",
        "collection": "monochrome-moods",
        "collection_short": "mono",
        "cards_ok": True,
        "canvas_ok": True,
    },
    {
        "photo_id": "2025-05-05-Amsterdam-Science-Park-export-2025-05-05-amsterdam-272",
        "photo_short": "mono-asp-272",
        "title_base": "Ribbed Concrete Wall Against Clear Sky — Amsterdam Science Park",
        "collection": "monochrome-moods",
        "collection_short": "mono",
        "cards_ok": True,
        "canvas_ok": True,
    },
    {
        "photo_id": "2025-05-05-Amsterdam-Science-Park-export-2025-05-05-amsterdam-273",
        "photo_short": "mono-asp-273",
        "title_base": "Dark Cladding Against Blue Sky — Amsterdam Science Park",
        "collection": "monochrome-moods",
        "collection_short": "mono",
        "cards_ok": True,
        "canvas_ok": True,
    },
    {
        "photo_id": "2025-05-05-Amsterdam-Science-Park-export-2025-05-05-amsterdam-312",
        "photo_short": "mono-asp-312",
        "title_base": "Layered Overpasses — Amsterdam Science Park",
        "collection": "monochrome-moods",
        "collection_short": "mono",
        "cards_ok": True,
        "canvas_ok": True,
    },
    # ─── The Atmospheric Collection ────────────────────────────────────────────
    {
        "photo_id": "2025-05-22-LeidenPolderpark-2025-05-22-leidenpolderpark-17",
        "photo_short": "atmospheric-leiden-017",
        "title_base": "Canal Lock and Dramatic Sky — Leiden Polderpark",
        "collection": "the-atmospheric-collection",
        "collection_short": "atmospheric",
        "cards_ok": True,
        "canvas_ok": True,
    },
    {
        "photo_id": "2025-05-22-LeidenPolderpark-2025-05-22-leidenpolderpark-68",
        "photo_short": "atmospheric-leiden-068",
        "title_base": "Cloud Mirror — Leiden Polderpark Canal",
        "collection": "the-atmospheric-collection",
        "collection_short": "atmospheric",
        "cards_ok": True,
        "canvas_ok": True,
    },
    {
        "photo_id": "2025-05-22-LeidenPolderpark-2025-05-22-leidenpolderpark-74",
        "photo_short": "atmospheric-leiden-074",
        "title_base": "Polderpark Canal Under Dramatic Sky — Leiden",
        "collection": "the-atmospheric-collection",
        "collection_short": "atmospheric",
        "cards_ok": True,
        "canvas_ok": True,
    },
    {
        "photo_id": "2025-05-22-LeidenPolderpark-2025-05-22-leidenpolderpark-91",
        "photo_short": "atmospheric-leiden-091",
        "title_base": "Polder Canal Under Summer Clouds — Leiden Polderpark",
        "collection": "the-atmospheric-collection",
        "collection_short": "atmospheric",
        "cards_ok": True,
        "canvas_ok": True,
    },
    {
        "photo_id": "2025-05-22-LeidenPolderpark-2025-05-22-leidenpolderpark-122",
        "photo_short": "atmospheric-leiden-122",
        "title_base": "Cumulus Over Polderpark Canal — Leiden",
        "collection": "the-atmospheric-collection",
        "collection_short": "atmospheric",
        "cards_ok": True,
        "canvas_ok": True,
    },
    {
        "photo_id": "2025-05-22-LeidenPolderpark-2025-05-22-leidenpolderpark-151",
        "photo_short": "atmospheric-leiden-151",
        "title_base": "Wind Pump Under Dramatic Polder Sky — Leiden Polderpark",
        "collection": "the-atmospheric-collection",
        "collection_short": "atmospheric",
        "cards_ok": True,
        "canvas_ok": True,
    },
    {
        "photo_id": "2025-05-22-LeidenPolderpark-2025-05-22-leidenpolderpark-167",
        "photo_short": "atmospheric-leiden-167",
        "title_base": "Polder Dusk Under Storm Clouds — Leiden Polderpark",
        "collection": "the-atmospheric-collection",
        "collection_short": "atmospheric",
        "cards_ok": True,
        "canvas_ok": True,
    },
    # ─── The Halcyon Collection — Roelofarendsveen ────────────────────────────
    {
        "photo_id": "2025-05-13-Roelofarendsveen-export-2025-05-13-roelofarendsveen-68",
        "photo_short": "halcyon-roelof-068",
        "title_base": "Waterside Boathouse Golden Hour — Roelofarendsveen",
        "collection": "the-halcyon-collection",
        "collection_short": "halcyon",
        "cards_ok": True,
        "canvas_ok": True,
    },
    {
        "photo_id": "2025-05-13-Roelofarendsveen-export-2025-05-13-roelofarendsveen-159",
        "photo_short": "halcyon-roelof-159",
        "title_base": "Wooden Jetty at Dusk — Roelofarendsveen",
        "collection": "the-halcyon-collection",
        "collection_short": "halcyon",
        "cards_ok": True,
        "canvas_ok": True,
    },
    {
        "photo_id": "2025-05-13-Roelofarendsveen-export-2025-05-13-roelofarendsveen-182",
        "photo_short": "halcyon-roelof-182",
        "title_base": "Canal Evening Light — Roelofarendsveen",
        "collection": "the-halcyon-collection",
        "collection_short": "halcyon",
        "cards_ok": True,
        "canvas_ok": True,
    },
    # ─── The Halcyon Collection — Katwijk aan Zee ─────────────────────────────
    {
        "photo_id": "2025-05-12-KatwijkaanZee-export-2025-05-12-katwijkaanzee-221",
        "photo_short": "halcyon-katwijk-221",
        "title_base": "Sun Over Tidal Flats — Katwijk aan Zee",
        "collection": "the-halcyon-collection",
        "collection_short": "halcyon",
        "cards_ok": True,
        "canvas_ok": True,
    },
    {
        "photo_id": "2025-05-12-KatwijkaanZee-export-2025-05-12-katwijkaanzee-275",
        "photo_short": "halcyon-katwijk-275",
        "title_base": "Wind Ripples in Coastal Sand — Katwijk aan Zee",
        "collection": "the-halcyon-collection",
        "collection_short": "halcyon",
        "cards_ok": True,
        "canvas_ok": True,
    },
    {
        "photo_id": "2025-05-12-KatwijkaanZee-export-2025-05-12-katwijkaanzee-281",
        "photo_short": "halcyon-katwijk-281",
        "title_base": "Sand Drifts Over Concrete — Katwijk aan Zee",
        "collection": "the-halcyon-collection",
        "collection_short": "halcyon",
        "cards_ok": True,
        "canvas_ok": True,
    },
    {
        "photo_id": "2025-05-12-KatwijkaanZee-export-2025-05-12-katwijkaanzee-293",
        "photo_short": "halcyon-katwijk-293",
        "title_base": "Sunset Path to the Sea — Katwijk aan Zee",
        "collection": "the-halcyon-collection",
        "collection_short": "halcyon",
        "cards_ok": True,
        "canvas_ok": True,
    },
    {
        "photo_id": "2025-05-12-KatwijkaanZee-export-2025-05-12-katwijkaanzee-315",
        "photo_short": "halcyon-katwijk-315",
        "title_base": "Sun Over Sea — Katwijk aan Zee",
        "collection": "the-halcyon-collection",
        "collection_short": "halcyon",
        "cards_ok": True,
        "canvas_ok": True,
    },
    {
        "photo_id": "2025-05-12-KatwijkaanZee-export-2025-05-12-katwijkaanzee-338",
        "photo_short": "halcyon-katwijk-338",
        "title_base": "Sunset Through Dune Grass — Katwijk aan Zee",
        "collection": "the-halcyon-collection",
        "collection_short": "halcyon",
        "cards_ok": True,
        "canvas_ok": True,
    },
    {
        "photo_id": "2025-05-12-KatwijkaanZee-export-2025-05-12-katwijkaanzee-405",
        "photo_short": "halcyon-katwijk-405",
        "title_base": "Sun Touching Sea — Katwijk aan Zee",
        "collection": "the-halcyon-collection",
        "collection_short": "halcyon",
        "cards_ok": True,
        "canvas_ok": True,
    },
    {
        "photo_id": "2025-05-12-KatwijkaanZee-export-2025-05-12-katwijkaanzee-444",
        "photo_short": "halcyon-katwijk-444",
        "title_base": "Sailboat Silhouette Sunset — Katwijk aan Zee",
        "collection": "the-halcyon-collection",
        "collection_short": "halcyon",
        "cards_ok": True,
        "canvas_ok": True,
    },
]

# ─── PLACEHOLDER pricing tables ───────────────────────────────────────────────
# ALL VALUES ARE ESTIMATES — verify against Prodigi CSV files before launch.
# Keys: EU, UK, US, AU representing customer shipping region.
# Values: lab-native currency per routing matrix:
#   EU/UK → UK lab → GBP
#   US    → US lab (where noted) → USD, else UK lab GBP
#   AU    → AU lab (where noted) → AUD, else UK lab GBP or DE lab EUR
# Books exception: AU on hardcover uses DE lab EUR; US/AU on softcover = DE lab EUR.

# Hahnemühle Photo Rag — 50% margin
# Routing: EU/UK/US = UK lab GBP; AU = AU lab AUD
HPR = {
    "a5":    {"EU": 8.50,  "UK": 8.50,  "US": 8.50,  "AU": 17.00},
    "a4":    {"EU": 12.50, "UK": 12.50, "US": 12.50, "AU": 25.00},
    "a3":    {"EU": 18.50, "UK": 18.50, "US": 18.50, "AU": 37.00},
    "16x20": {"EU": 28.00, "UK": 28.00, "US": 28.00, "AU": 56.00},
    "24x36": {"EU": 54.00, "UK": 54.00, "US": 54.00, "AU": 108.00},
}
HPR_SIZES = list(HPR.keys())
HPR_SKU_SIZE = {"a5": "A5", "a4": "A4", "a3": "A3", "16x20": "16X20", "24x36": "24X36"}
HPR_DISPLAY_SIZE = {"a5": "A5", "a4": "A4", "a3": "A3", "16x20": '16×20"', "24x36": '24×36"'}

# Hahnemühle German Etching — 50% margin
HGE = {
    "a5":    {"EU": 9.50,  "UK": 9.50,  "US": 9.50,  "AU": 19.00},
    "a4":    {"EU": 14.00, "UK": 14.00, "US": 14.00, "AU": 28.00},
    "a3":    {"EU": 20.50, "UK": 20.50, "US": 20.50, "AU": 41.00},
    "16x20": {"EU": 31.00, "UK": 31.00, "US": 31.00, "AU": 62.00},
    "24x36": {"EU": 60.00, "UK": 60.00, "US": 60.00, "AU": 120.00},
}

# Enhanced Matte Art 200gsm — 70% margin
EMA = {
    "a5":    {"EU": 5.50,  "UK": 5.50,  "US": 5.50,  "AU": 11.00},
    "a4":    {"EU": 8.50,  "UK": 8.50,  "US": 8.50,  "AU": 17.00},
    "a3":    {"EU": 12.50, "UK": 12.50, "US": 12.50, "AU": 25.00},
    "16x20": {"EU": 19.00, "UK": 19.00, "US": 19.00, "AU": 38.00},
    "24x36": {"EU": 37.00, "UK": 37.00, "US": 37.00, "AU": 74.00},
}

# C-type Lustre Pro — 150% margin
# Routing: EU/UK/AU = UK lab GBP; US = US lab USD
CLP = {
    "8x10":  {"EU": 6.50,  "UK": 6.50,  "US": 9.00,  "AU": 6.50},
    "12x16": {"EU": 10.50, "UK": 10.50, "US": 14.00, "AU": 10.50},
    "16x20": {"EU": 14.50, "UK": 14.50, "US": 19.00, "AU": 14.50},
    "20x30": {"EU": 22.00, "UK": 22.00, "US": 29.00, "AU": 22.00},
    "24x36": {"EU": 32.00, "UK": 32.00, "US": 42.00, "AU": 32.00},
}
CLP_SKU_SIZE = {"8x10": "8X10", "12x16": "12X16", "16x20": "16X20", "20x30": "20X30", "24x36": "24X36"}
CLP_DISPLAY_SIZE = {"8x10": '8×10"', "12x16": '12×16"', "16x20": '16×20"', "20x30": '20×30"', "24x36": '24×36"'}

# Canvas stretched 38mm Float ImageWrap — 70% margin
# Routing: all regions = UK lab GBP
CAN = {
    "16x12": {"EU": 26.00, "UK": 26.00, "US": 26.00, "AU": 26.00},
    "20x16": {"EU": 36.00, "UK": 36.00, "US": 36.00, "AU": 36.00},
    "30x20": {"EU": 52.00, "UK": 52.00, "US": 52.00, "AU": 52.00},
    "36x24": {"EU": 72.00, "UK": 72.00, "US": 72.00, "AU": 72.00},
    "40x30": {"EU": 88.00, "UK": 88.00, "US": 88.00, "AU": 88.00},
}
CAN_SKU_SIZE = {"16x12": "16X12", "20x16": "20X16", "30x20": "30X20", "36x24": "36X24", "40x30": "40X30"}
CAN_DISPLAY_SIZE = {"16x12": '16×12"', "20x16": '20×16"', "30x20": '30×20"', "36x24": '36×24"', "40x30": '40×30"'}

# Canvas framed 38mm Float — 60% margin
# Routing: EU/UK = UK lab GBP; US = US lab USD; AU = AU lab AUD
CANF = {
    "16x12": {"EU": 65.00, "UK": 65.00, "US": 90.00,  "AU": 130.00},
    "20x16": {"EU": 85.00, "UK": 85.00, "US": 118.00, "AU": 170.00},
    "30x20": {"EU": 115.00,"UK": 115.00,"US": 160.00, "AU": 230.00},
    "36x24": {"EU": 145.00,"UK": 145.00,"US": 200.00, "AU": 290.00},
}

# Framed art print — Classic frame, no mount, glass glaze — 60% margin
# Routing: EU/UK = UK lab GBP; US = US lab USD; AU = AU lab AUD
FAP = {
    "a4": {"EU": 36.00, "UK": 36.00, "US": 50.00,  "AU": 72.00},
    "a3": {"EU": 56.00, "UK": 56.00, "US": 78.00,  "AU": 112.00},
    "a2": {"EU": 80.00, "UK": 80.00, "US": 110.00, "AU": 160.00},
    "a1": {"EU": 120.00,"UK": 120.00,"US": 165.00, "AU": 240.00},
}
FAP_SIZES = list(FAP.keys())
FAP_SKU_SIZE = {"a4": "A4", "a3": "A3", "a2": "A2", "a1": "A1"}
FAP_DISPLAY_SIZE = {"a4": "A4", "a3": "A3", "a2": "A2", "a1": "A1"}
FRAME_COLOURS = ["black", "white", "natural-oak"]
FRAME_COLOUR_SKU = {"black": "BLK", "white": "WHT", "natural-oak": "OAK"}
FRAME_COLOUR_DISPLAY = {"black": "Black", "white": "White", "natural-oak": "Natural Oak"}

# Greeting cards Mohawk 324gsm BLA — 250% margin
# Routing: all regions = UK lab GBP
GRE_SIZES = ["6x4", "5x5", "7x5"]
GRE_PACKS = ["single", "pack10", "pack20", "pack50", "pack100"]
GRE_PRICES = {
    "6x4-single":   {"EU": 1.20, "UK": 1.20, "US": 1.20, "AU": 1.20},
    "6x4-pack10":   {"EU": 6.50, "UK": 6.50, "US": 6.50, "AU": 6.50},
    "6x4-pack20":   {"EU": 11.00,"UK": 11.00,"US": 11.00,"AU": 11.00},
    "6x4-pack50":   {"EU": 23.00,"UK": 23.00,"US": 23.00,"AU": 23.00},
    "6x4-pack100":  {"EU": 42.00,"UK": 42.00,"US": 42.00,"AU": 42.00},
    "5x5-single":   {"EU": 1.50, "UK": 1.50, "US": 1.50, "AU": 1.50},
    "5x5-pack10":   {"EU": 8.00, "UK": 8.00, "US": 8.00, "AU": 8.00},
    "5x5-pack20":   {"EU": 13.50,"UK": 13.50,"US": 13.50,"AU": 13.50},
    "5x5-pack50":   {"EU": 28.00,"UK": 28.00,"US": 28.00,"AU": 28.00},
    "5x5-pack100":  {"EU": 52.00,"UK": 52.00,"US": 52.00,"AU": 52.00},
    "7x5-single":   {"EU": 1.80, "UK": 1.80, "US": 1.80, "AU": 1.80},
    "7x5-pack10":   {"EU": 9.50, "UK": 9.50, "US": 9.50, "AU": 9.50},
    "7x5-pack20":   {"EU": 16.00,"UK": 16.00,"US": 16.00,"AU": 16.00},
    "7x5-pack50":   {"EU": 33.00,"UK": 33.00,"US": 33.00,"AU": 33.00},
    "7x5-pack100":  {"EU": 61.00,"UK": 61.00,"US": 61.00,"AU": 61.00},
}
GRE_SKU_SIZE = {"6x4": "6X4IN", "5x5": "5X5SQ", "7x5": "7X5IN"}
GRE_DISPLAY_SIZE = {"6x4": '6×4"', "5x5": '5.5×5.5" sq', "7x5": '7×5"'}
GRE_SKU_PACK = {"single": "1", "pack10": "10", "pack20": "20", "pack50": "50", "pack100": "100"}

# Postcards Mohawk 324gsm BLA — 350% margin
# No singles, no square size. Routing: all regions = UK lab GBP
POS_SIZES = ["6x4", "7x5"]
POS_PACKS = ["pack10", "pack20", "pack50", "pack100"]
POS_PRICES = {
    "6x4-pack10":   {"EU": 4.50, "UK": 4.50, "US": 4.50, "AU": 4.50},
    "6x4-pack20":   {"EU": 7.50, "UK": 7.50, "US": 7.50, "AU": 7.50},
    "6x4-pack50":   {"EU": 15.00,"UK": 15.00,"US": 15.00,"AU": 15.00},
    "6x4-pack100":  {"EU": 27.00,"UK": 27.00,"US": 27.00,"AU": 27.00},
    "7x5-pack10":   {"EU": 5.50, "UK": 5.50, "US": 5.50, "AU": 5.50},
    "7x5-pack20":   {"EU": 9.00, "UK": 9.00, "US": 9.00, "AU": 9.00},
    "7x5-pack50":   {"EU": 18.00,"UK": 18.00,"US": 18.00,"AU": 18.00},
    "7x5-pack100":  {"EU": 33.00,"UK": 33.00,"US": 33.00,"AU": 33.00},
}

# Books — collection-level stubs (available: false until 12c)
# Hardcover routing: EU/UK = UK lab GBP; US = US lab USD; AU = DE lab EUR
# Softcover routing: EU/UK = UK lab GBP; US = DE lab EUR; AU = DE lab EUR
BOOK_HARDCOVER_SIZES = ["a5p", "a5l", "a4p", "a4l", "8.3sq"]
BOOK_SOFTCOVER_SIZES = ["a5p", "a4p"]
BOOK_HC_PRICES = {
    "a5p":  {"EU": 20.00, "UK": 20.00, "US": 28.00, "AU": 24.00},
    "a5l":  {"EU": 22.00, "UK": 22.00, "US": 30.00, "AU": 26.00},
    "a4p":  {"EU": 28.00, "UK": 28.00, "US": 38.00, "AU": 34.00},
    "a4l":  {"EU": 30.00, "UK": 30.00, "US": 42.00, "AU": 36.00},
    "8.3sq":{"EU": 32.00, "UK": 32.00, "US": 44.00, "AU": 38.00},
}
BOOK_SC_PRICES = {
    "a5p":  {"EU": 14.00, "UK": 14.00, "US": 18.00, "AU": 18.00},
    "a4p":  {"EU": 20.00, "UK": 20.00, "US": 24.00, "AU": 24.00},
}
BOOK_HC_DISPLAY = {"a5p": "A5 Portrait", "a5l": "A5 Landscape", "a4p": "A4 Portrait", "a4l": "A4 Landscape", "8.3sq": '8.3" Square'}
BOOK_SC_DISPLAY = {"a5p": "A5 Portrait", "a4p": "A4 Portrait"}

# Calendars — collection-level stubs (available: false until 12c)
# Routing: EU/UK = UK lab GBP; US = US lab USD; AU = AU lab AUD
CAL_SIZES = ["a4l", "a5l"]
CAL_PRICES = {
    "a4l": {"EU": 12.00, "UK": 12.00, "US": 16.00, "AU": 22.00},
    "a5l": {"EU": 9.00,  "UK": 9.00,  "US": 12.00, "AU": 16.00},
}
CAL_DISPLAY = {"a4l": "A4 Landscape", "a5l": "A5 Landscape"}

# Collection display names for titles
COLLECTION_NAMES = {
    "the-signature-collection": "The Signature Collection",
    "monochrome-moods": "Monochrome Moods",
    "the-atmospheric-collection": "The Atmospheric Collection",
    "the-halcyon-collection": "The Halcyon Collection",
}

# ─── Helpers ──────────────────────────────────────────────────────────────────

def price_cents(base_prices: dict, margin_pct: float) -> int:
    return round(base_prices["UK"] * (1 + margin_pct / 100) * 100)

def fmt_bp(bp: dict) -> str:
    parts = []
    for k in ("EU", "UK", "US", "AU"):
        if k in bp:
            v = bp[k]
            if v == int(v):
                parts.append(f"  {k}: {int(v)}.00")
            else:
                parts.append(f"  {k}: {v:.2f}")
    return "\n".join(parts)

def safe_title(s: str) -> str:
    # Escape double quotes in YAML-quoted strings
    return s.replace('"', '\\"')

def r2_path(coll_short: str, photo_short: str) -> str:
    return f"print/photography/{coll_short}/{photo_short}/master.jpg"

def r2_path_collection(coll_short: str, kind: str) -> str:
    return f"print/photography/{coll_short}/collection/{kind}.jpg"

def make_mdx(
    product_id: str,
    title: str,
    description: str,
    hero_image: str,
    prodigi_sku: str,
    print_area_r2: str,
    margin_pct: float,
    price_c: int,
    base_prices: dict,
    available: bool,
    collection: str,
    photo_id,
    fmt: str,
    paper_type: str = None,
    frame_colour: str = None,
    canvas_style: str = None,
    book_format: str = None,
    size: str = None,
) -> str:
    lines = ["---"]
    lines.append("type: photo")
    lines.append(f"id: {product_id}")
    lines.append(f'title: "{safe_title(title)}"')
    lines.append(f'description: "{safe_title(description)}"')
    lines.append(f"hero_image: /placeholder/{product_id}.webp")
    lines.append(f"prodigi_sku: {prodigi_sku}")
    lines.append("print_areas:")
    lines.append("  - slot: default")
    lines.append(f"    default_asset_r2: {print_area_r2}")
    lines.append(f"margin_pct: {int(margin_pct)}")
    lines.append(f"price_cents: {price_c}")
    lines.append("base_prices:")
    lines.append(fmt_bp(base_prices))
    lines.append(f"available: {'true' if available else 'false'}")
    lines.append(f'created_at: "{CREATED_AT}"')
    lines.append(f"collection: {collection}")
    if photo_id is None:
        lines.append("photo_id: null")
    else:
        lines.append(f"photo_id: {photo_id}")
    lines.append(f"format: {fmt}")
    if paper_type:
        lines.append(f"paper_type: {paper_type}")
    if frame_colour:
        lines.append(f"frame_colour: {frame_colour}")
    if canvas_style:
        lines.append(f"canvas_style: {canvas_style}")
    if book_format:
        lines.append(f"book_format: {book_format}")
    if size:
        lines.append(f"size: {size}")
    lines.append("---")
    lines.append("")
    return "\n".join(lines)

def write_mdx(filename: str, content: str) -> Path:
    path = OUTPUT_DIR / filename
    path.write_text(content, encoding="utf-8")
    return path

# ─── Per-photo generators ─────────────────────────────────────────────────────

def gen_hpr(photo: dict) -> int:
    ps = photo["photo_short"]; cs = photo["collection_short"]
    pid = photo["photo_id"]; coll = photo["collection"]
    tb = photo["title_base"]; margin = 50.0; count = 0
    for sz, bp in HPR.items():
        prod_id = f"photo-{ps}-hpr-{sz}"
        title = f"{tb}, Hahnemühle Photo Rag, {HPR_DISPLAY_SIZE[sz]}"
        desc = f"{tb}. Fine art giclée print on Hahnemühle Photo Rag 308gsm, {HPR_DISPLAY_SIZE[sz]}. Archival pigment ink."
        sku = f"GLOBAL-PAP-HPR-{HPR_SKU_SIZE[sz]}"
        pc = price_cents(bp, margin)
        mdx = make_mdx(prod_id, title, desc, None, sku,
                       r2_path(cs, ps), margin, pc, bp,
                       True, coll, pid, "paper", paper_type="HPR", size=HPR_DISPLAY_SIZE[sz])
        write_mdx(f"{prod_id}.mdx", mdx); count += 1
    return count

def gen_hge(photo: dict) -> int:
    ps = photo["photo_short"]; cs = photo["collection_short"]
    pid = photo["photo_id"]; coll = photo["collection"]
    tb = photo["title_base"]; margin = 50.0; count = 0
    for sz, bp in HGE.items():
        prod_id = f"photo-{ps}-hge-{sz}"
        title = f"{tb}, Hahnemühle German Etching, {HPR_DISPLAY_SIZE[sz]}"
        desc = f"{tb}. Fine art giclée print on Hahnemühle German Etching 310gsm, {HPR_DISPLAY_SIZE[sz]}. Archival pigment ink."
        sku = f"GLOBAL-PAP-HGE-{HPR_SKU_SIZE[sz]}"
        pc = price_cents(bp, margin)
        mdx = make_mdx(prod_id, title, desc, None, sku,
                       r2_path(cs, ps), margin, pc, bp,
                       True, coll, pid, "paper", paper_type="HGE", size=HPR_DISPLAY_SIZE[sz])
        write_mdx(f"{prod_id}.mdx", mdx); count += 1
    return count

def gen_ema(photo: dict) -> int:
    ps = photo["photo_short"]; cs = photo["collection_short"]
    pid = photo["photo_id"]; coll = photo["collection"]
    tb = photo["title_base"]; margin = 70.0; count = 0
    for sz, bp in EMA.items():
        prod_id = f"photo-{ps}-ema-{sz}"
        title = f"{tb}, Enhanced Matte Art, {HPR_DISPLAY_SIZE[sz]}"
        desc = f"{tb}. Giclée print on Enhanced Matte Art 200gsm, {HPR_DISPLAY_SIZE[sz]}. Archival pigment ink."
        sku = f"GLOBAL-PAP-EMA-{HPR_SKU_SIZE[sz]}"
        pc = price_cents(bp, margin)
        mdx = make_mdx(prod_id, title, desc, None, sku,
                       r2_path(cs, ps), margin, pc, bp,
                       True, coll, pid, "paper", paper_type="EMA", size=HPR_DISPLAY_SIZE[sz])
        write_mdx(f"{prod_id}.mdx", mdx); count += 1
    return count

def gen_clp(photo: dict) -> int:
    ps = photo["photo_short"]; cs = photo["collection_short"]
    pid = photo["photo_id"]; coll = photo["collection"]
    tb = photo["title_base"]; margin = 150.0; count = 0
    for sz, bp in CLP.items():
        prod_id = f"photo-{ps}-clp-{sz}"
        title = f"{tb}, C-type Lustre Pro, {CLP_DISPLAY_SIZE[sz]}"
        desc = f"{tb}. C-type Lustre Pro archival print, {CLP_DISPLAY_SIZE[sz]}."
        sku = f"GLOBAL-PHO-{CLP_SKU_SIZE[sz]}-PRO"
        pc = price_cents(bp, margin)
        mdx = make_mdx(prod_id, title, desc, None, sku,
                       r2_path(cs, ps), margin, pc, bp,
                       True, coll, pid, "paper", paper_type="CLP", size=CLP_DISPLAY_SIZE[sz])
        write_mdx(f"{prod_id}.mdx", mdx); count += 1
    return count

def gen_canvas(photo: dict) -> int:
    ps = photo["photo_short"]; cs = photo["collection_short"]
    pid = photo["photo_id"]; coll = photo["collection"]
    tb = photo["title_base"]; margin = 70.0; count = 0
    for sz, bp in CAN.items():
        prod_id = f"photo-{ps}-can-{sz}"
        title = f"{tb}, Stretched Canvas, {CAN_DISPLAY_SIZE[sz]}"
        desc = f"{tb}. Stretched canvas 38mm float ImageWrap, {CAN_DISPLAY_SIZE[sz]}."
        sku = f"GLOBAL-CAN-FLT-IMW-{CAN_SKU_SIZE[sz]}"
        pc = price_cents(bp, margin)
        mdx = make_mdx(prod_id, title, desc, None, sku,
                       r2_path(cs, ps), margin, pc, bp,
                       True, coll, pid, "canvas", canvas_style="stretched", size=CAN_DISPLAY_SIZE[sz])
        write_mdx(f"{prod_id}.mdx", mdx); count += 1
    return count

def gen_canf(photo: dict) -> int:
    ps = photo["photo_short"]; cs = photo["collection_short"]
    pid = photo["photo_id"]; coll = photo["collection"]
    tb = photo["title_base"]; margin = 60.0; count = 0
    for sz, bp in CANF.items():
        prod_id = f"photo-{ps}-canf-{sz}"
        title = f"{tb}, Framed Canvas, {CAN_DISPLAY_SIZE[sz]}"
        desc = f"{tb}. Canvas in 38mm float frame, {CAN_DISPLAY_SIZE[sz]}."
        sku = f"GLOBAL-FRC-FLT-{CAN_SKU_SIZE[sz]}"
        pc = price_cents(bp, margin)
        mdx = make_mdx(prod_id, title, desc, None, sku,
                       r2_path(cs, ps), margin, pc, bp,
                       True, coll, pid, "canvas", canvas_style="framed", size=CAN_DISPLAY_SIZE[sz])
        write_mdx(f"{prod_id}.mdx", mdx); count += 1
    return count

def gen_fap(photo: dict) -> int:
    ps = photo["photo_short"]; cs = photo["collection_short"]
    pid = photo["photo_id"]; coll = photo["collection"]
    tb = photo["title_base"]; margin = 60.0; count = 0
    for sz, bp in FAP.items():
        for colour in FRAME_COLOURS:
            prod_id = f"photo-{ps}-fap-{sz}-{colour}"
            colour_label = FRAME_COLOUR_DISPLAY[colour]
            title = f"{tb}, Framed Print {colour_label} Frame, {FAP_DISPLAY_SIZE[sz]}"
            desc = f"{tb}. Classic frame, no mount, glass glaze, {colour_label.lower()} finish, {FAP_DISPLAY_SIZE[sz]}."
            sku = f"GLOBAL-FAP-{FAP_SKU_SIZE[sz]}-{FRAME_COLOUR_SKU[colour]}-HPR"
            pc = price_cents(bp, margin)
            mdx = make_mdx(prod_id, title, desc, None, sku,
                           r2_path(cs, ps), margin, pc, bp,
                           True, coll, pid, "framed",
                           frame_colour=colour, size=FAP_DISPLAY_SIZE[sz])
            write_mdx(f"{prod_id}.mdx", mdx); count += 1
    return count

def gen_gre(photo: dict) -> int:
    if not photo["cards_ok"]:
        return 0
    ps = photo["photo_short"]; cs = photo["collection_short"]
    pid = photo["photo_id"]; coll = photo["collection"]
    tb = photo["title_base"]; margin = 250.0; count = 0
    for gsize in GRE_SIZES:
        for pack in GRE_PACKS:
            key = f"{gsize}-{pack}"
            bp = GRE_PRICES[key]
            prod_id = f"photo-{ps}-gre-{gsize}-{pack}"
            pack_label = "single" if pack == "single" else pack.replace("pack", "") + "-pack"
            title = f"{tb}, Greeting Card {GRE_DISPLAY_SIZE[gsize]}, {pack_label}"
            desc = f"{tb}. Greeting card, {GRE_DISPLAY_SIZE[gsize]}, Mohawk 324gsm, {pack_label}."
            sku = f"GLOBAL-GRE-MOH-{GRE_SKU_SIZE[gsize]}-{GRE_SKU_PACK[pack]}-BLA"
            pc = price_cents(bp, margin)
            mdx = make_mdx(prod_id, title, desc, None, sku,
                           r2_path(cs, ps), margin, pc, bp,
                           True, coll, pid, "card", size=GRE_DISPLAY_SIZE[gsize])
            write_mdx(f"{prod_id}.mdx", mdx); count += 1
    return count

def gen_pos(photo: dict) -> int:
    if not photo["cards_ok"]:
        return 0
    ps = photo["photo_short"]; cs = photo["collection_short"]
    pid = photo["photo_id"]; coll = photo["collection"]
    tb = photo["title_base"]; margin = 350.0; count = 0
    for psize in POS_SIZES:
        for pack in POS_PACKS:
            key = f"{psize}-{pack}"
            bp = POS_PRICES[key]
            prod_id = f"photo-{ps}-pos-{psize}-{pack}"
            pack_label = pack.replace("pack", "") + "-pack"
            title = f"{tb}, Postcard {GRE_DISPLAY_SIZE[psize]}, {pack_label}"
            desc = f"{tb}. Postcard, {GRE_DISPLAY_SIZE[psize]}, Mohawk 324gsm, {pack_label}."
            sku = f"GLOBAL-POS-MOH-{GRE_SKU_SIZE[psize]}-{GRE_SKU_PACK[pack]}-BLA"
            pc = price_cents(bp, margin)
            mdx = make_mdx(prod_id, title, desc, None, sku,
                           r2_path(cs, ps), margin, pc, bp,
                           True, coll, pid, "postcard", size=GRE_DISPLAY_SIZE[psize])
            write_mdx(f"{prod_id}.mdx", mdx); count += 1
    return count

def gen_photo(photo: dict) -> int:
    count = 0
    count += gen_hpr(photo)
    count += gen_hge(photo)
    count += gen_ema(photo)
    count += gen_clp(photo)
    count += gen_canvas(photo)
    count += gen_canf(photo)
    count += gen_fap(photo)
    count += gen_gre(photo)
    count += gen_pos(photo)
    return count

# ─── Collection stubs ─────────────────────────────────────────────────────────

COLLECTIONS = [
    ("the-signature-collection", "signature", "Signature"),
    ("monochrome-moods", "mono", "Monochrome Moods"),
    ("the-atmospheric-collection", "atmospheric", "Atmospheric"),
    ("the-halcyon-collection", "halcyon", "Halcyon"),
]

def gen_stubs() -> int:
    count = 0
    for coll, cshort, cname in COLLECTIONS:
        # Hardcover books
        for sz in BOOK_HARDCOVER_SIZES:
            bp = BOOK_HC_PRICES[sz]
            prod_id = f"book-{cshort}-hardcover-{sz.replace('.', '')}"
            size_label = BOOK_HC_DISPLAY[sz]
            title = f"{cname} — Hardcover Photo Book, {size_label}"
            desc = f"12-photo curated sequence from {COLLECTION_NAMES[coll]}. Hardcover, {size_label}, Mohawk uncoated. Sequence locked Session 12c."
            sku = f"GLOBAL-HARD-MOH-{sz.upper().replace('.', '').replace('SQ', 'SQ')}"
            pc = price_cents(bp, 100.0)
            mdx = make_mdx(prod_id, title, desc, None, sku,
                           r2_path_collection(cshort, f"hardcover-{sz}"),
                           100.0, pc, bp, False, coll, None, "book",
                           book_format="hardcover", size=size_label)
            write_mdx(f"{prod_id}.mdx", mdx); count += 1

        # Softcover books
        for sz in BOOK_SOFTCOVER_SIZES:
            bp = BOOK_SC_PRICES[sz]
            prod_id = f"book-{cshort}-softcover-{sz}"
            size_label = BOOK_SC_DISPLAY[sz]
            title = f"{cname} — Softcover Photo Book, {size_label}"
            desc = f"12-photo curated sequence from {COLLECTION_NAMES[coll]}. Softcover, {size_label}, Mohawk uncoated. Sequence locked Session 12c."
            sku = f"GLOBAL-SOFT-MOH-{sz.upper()}"
            pc = price_cents(bp, 90.0)
            mdx = make_mdx(prod_id, title, desc, None, sku,
                           r2_path_collection(cshort, f"softcover-{sz}"),
                           90.0, pc, bp, False, coll, None, "book",
                           book_format="softcover", size=size_label)
            write_mdx(f"{prod_id}.mdx", mdx); count += 1

        # Calendars
        for sz in CAL_SIZES:
            bp = CAL_PRICES[sz]
            prod_id = f"cal-{cshort}-{sz}"
            size_label = CAL_DISPLAY[sz]
            title = f"{cname} — Undated Calendar, {size_label}"
            desc = f"12-month undated full-layout calendar from {COLLECTION_NAMES[coll]}, {size_label}. Sequence locked Session 12c."
            sku = f"GLOBAL-CAL-{sz.upper()}"
            pc = price_cents(bp, 100.0)
            mdx = make_mdx(prod_id, title, desc, None, sku,
                           r2_path_collection(cshort, f"calendar-{sz}"),
                           100.0, pc, bp, False, coll, None, "calendar",
                           size=size_label)
            write_mdx(f"{prod_id}.mdx", mdx); count += 1

    return count

# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    args = sys.argv[1:]
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    if "--stubs" in args:
        n = gen_stubs()
        print(f"Generated {n} collection stubs.")
        return

    target = None
    if "--collection" in args:
        idx = args.index("--collection")
        target = args[idx + 1] if idx + 1 < len(args) else None

    total = 0
    collection_counts = {}
    excluded_canvas = []
    excluded_cards = []

    for photo in PHOTOS:
        cshort = photo["collection_short"]
        if target and cshort != target:
            continue
        n = gen_photo(photo)
        collection_counts[cshort] = collection_counts.get(cshort, 0) + n
        total += n
        if not photo["cards_ok"]:
            excluded_cards.append(photo["photo_short"])

    print(f"\nGenerated {total} product files.")
    for coll, n in collection_counts.items():
        print(f"  {coll}: {n}")
    if excluded_cards:
        print(f"\nCards/postcards excluded (mood mismatch): {', '.join(excluded_cards)}")
    if excluded_canvas:
        print(f"Canvas excluded (composition): {', '.join(excluded_canvas)}")

    if not target:
        n = gen_stubs()
        print(f"\nGenerated {n} collection stubs.")
        print(f"\nTotal: {total + n} files.")

if __name__ == "__main__":
    main()
