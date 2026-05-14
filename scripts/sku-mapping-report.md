# Prodigi pricing extraction — discovery report (2026-05-14 15:24 UTC)

Source: `scripts/extract-prodigi-pricing.py --discover`

## CSV file inventory

Total CSV files: **39**

| Filename | Rows | Has RegionId |
|---|---|---|
| `prodigi-books-&-magazines-hardcover-books-au.csv` | 11 | no — skipped |
| `prodigi-books-&-magazines-hardcover-books-europe.csv` | 440 | yes |
| `prodigi-books-&-magazines-hardcover-books-us.csv` | 34 | no — skipped |
| `prodigi-books-&-magazines-hardcover-books-us_canada.csv` | 51 | yes |
| `prodigi-books-&-magazines-softcover-books-au.csv` | 6 | no — skipped |
| `prodigi-books-&-magazines-softcover-books-europe.csv` | 117 | yes |
| `prodigi-books-&-magazines-softcover-books-us_canada.csv` | 16 | yes |
| `prodigi-calendars-full-layout-calendars-au.csv` | 2 | no — skipped |
| `prodigi-calendars-full-layout-calendars-europe.csv` | 46 | yes |
| `prodigi-calendars-full-layout-calendars-us.csv` | 4 | no — skipped |
| `prodigi-calendars-full-layout-calendars-us_canada.csv` | 4 | yes |
| `prodigi-prints-&-posters-art-prints-europe.csv` | 20424 | yes |
| `prodigi-prints-&-posters-art-prints-us_canada.csv` | 4842 | yes |
| `prodigi-prints-&-posters-mounted-prints-europe.csv` | 536 | yes |
| `prodigi-prints-&-posters-photo-prints-au.csv` | 689 | no — skipped |
| `prodigi-prints-&-posters-photo-prints-europe.csv` | 14594 | yes |
| `prodigi-prints-&-posters-photo-prints-us_canada.csv` | 2344 | yes |
| `prodigi-prints-&-posters-poster-hangers-europe.csv` | 208 | yes |
| `prodigi-prints-&-posters-posters-europe.csv` | 1477 | yes |
| `prodigi-prints-&-posters-specialist-prints-europe.csv` | 4702 | yes |
| `prodigi-prints-&-posters-sticky-prints-europe.csv` | 3603 | yes |
| `prodigi-prints-art-prints-europe.csv` | 24 | yes |
| `prodigi-stationery-greetings-cards-au.csv` | 124 | no — skipped |
| `prodigi-stationery-greetings-cards-europe.csv` | 2484 | yes |
| `prodigi-stationery-greetings-cards-us_canada.csv` | 204 | yes |
| `prodigi-stationery-planners-europe.csv` | 180 | yes |
| `prodigi-stationery-postcards-au.csv` | 121 | no — skipped |
| `prodigi-stationery-postcards-europe.csv` | 2173 | yes |
| `prodigi-stationery-postcards-us_canada.csv` | 201 | yes |
| `prodigi-wall-art-framed-canvas-au.csv` | 55712 | no — skipped |
| `prodigi-wall-art-framed-canvas-europe.csv` | 447139 | yes |
| `prodigi-wall-art-framed-canvas-us_canada.csv` | 114681 | yes |
| `prodigi-wall-art-framed-prints-au.csv` | 68819 | no — skipped |
| `prodigi-wall-art-framed-prints-europe.csv` | 420728 | yes |
| `prodigi-wall-art-framed-prints-us_canada.csv` | 145380 | yes |
| `prodigi-wall-art-rolled-canvas-europe.csv` | 85675 | yes |
| `prodigi-wall-art-stretched-canvas-au.csv` | 11211 | no — skipped |
| `prodigi-wall-art-stretched-canvas-europe.csv` | 289902 | yes |
| `prodigi-wall-art-stretched-canvas-us_canada.csv` | 23962 | yes |

## SKUs indexed by regionid

| regionid | distinct SKUs |
|---|---|
| au | 5671 |
| europe | 5485 |
| us | 19 |
| us_canada | 6390 |

## Currency mix per family (europe regionid)

| Family | EUR-only | GBP-only | Mixed | Total SKUs |
|---|---|---|---|---|
| Canvas stretched (CAN-…) | 0 | 2824 | 0 | 2824 |
| C-type Lustre (ART-PAP-LPP-…) | 0 | 16 | 0 | 16 |
| EMA fine art (GLOBAL-FAP-…) | 0 | 178 | 0 | 178 |
| HPR fine art (GLOBAL-HPR-…) | 0 | 91 | 0 | 91 |
| HGE fine art (GLOBAL-HGE-…) | 0 | 97 | 0 | 97 |
| Greeting card (GLOBAL-GRE-…) | 0 | 40 | 0 | 40 |
| Postcard (GLOBAL-POST-…) | 0 | 40 | 0 | 40 |
| Framed print (FRA-…) | 0 | 542 | 0 | 542 |
| Book (BOOK-FE-…) | 2 | 2 | 19 | 23 |
| Calendar (CALENDAR-…) | 0 | 0 | 2 | 2 |
