# Regional pricing coverage — post-fix audit

Variants audited: **834**

Source: `content/products/*.mdx` (post extraction fix).

## F3 — US margin status by family

Status defined per cost-basis currency: LOSS if `revenue − base_US < 0`, EROSION if positive but less than half EU margin, OK otherwise. NO-US-DATA = US is null (no Prodigi USD-US row).

| Family | LOSS | EROSION | OK | NO-US-DATA | Total |
|---|---|---|---|---|---|
| cal | 0 | 0 | 8 | 0 | 8 |
| can | 0 | 0 | 0 | 81 | 81 |
| clp | 0 | 0 | 0 | 30 | 30 |
| ema | 0 | 81 | 30 | 0 | 111 |
| fap | 0 | 0 | 0 | 162 | 162 |
| gre | 0 | 0 | 0 | 96 | 96 |
| hge | 0 | 54 | 57 | 0 | 111 |
| hpb | 0 | 0 | 20 | 0 | 20 |
| hpr | 0 | 54 | 57 | 0 | 111 |
| pos | 0 | 0 | 0 | 96 | 96 |
| spb | 0 | 0 | 8 | 0 | 8 |

## F5 — `base_US / base_EU` ratio buckets by family (cost-basis-comparable)

| Family | <1.0× | 1.0–1.2× | 1.2–1.5× | 1.5–2.0× | ≥2.0× | N/A |
|---|---|---|---|---|---|---|
| cal | 8 | 0 | 0 | 0 | 0 | 0 |
| can | 0 | 0 | 0 | 0 | 0 | 81 |
| clp | 0 | 0 | 0 | 0 | 0 | 30 |
| ema | 15 | 0 | 42 | 54 | 0 | 0 |
| fap | 0 | 0 | 0 | 0 | 0 | 162 |
| gre | 0 | 0 | 0 | 0 | 0 | 96 |
| hge | 57 | 0 | 54 | 0 | 0 | 0 |
| hpb | 20 | 0 | 0 | 0 | 0 | 0 |
| hpr | 57 | 0 | 54 | 0 | 0 | 0 |
| pos | 0 | 0 | 0 | 0 | 0 | 96 |
| spb | 8 | 0 | 0 | 0 | 0 | 0 |

## AU coverage by family

Count of variants with non-null `base_prices.AU` (populated only when au.csv has an AUD row with source=AU).

| Family | AU populated | AU null | Total |
|---|---|---|---|
| cal | 8 | 0 | 8 |
| can | 0 | 81 | 81 |
| clp | 0 | 30 | 30 |
| ema | 0 | 111 | 111 |
| fap | 0 | 162 | 162 |
| gre | 0 | 96 | 96 |
| hge | 0 | 111 | 111 |
| hpb | 0 | 20 | 20 |
| hpr | 111 | 0 | 111 |
| pos | 0 | 96 | 96 |
| spb | 0 | 8 | 8 |

## UK coverage by family

Count of variants where `base_prices.UK ≠ base_prices.EU` (diverges after FX-conversion of the GB-destination row). For GBP-basis families the UK and EU rows are the same UK-sourced production cost, so the columns match; for EUR-basis families with a GBP-currency GB-destination row, UK diverges after FX.

| Family | UK diverges | UK matches EU | Total |
|---|---|---|---|
| cal | 8 | 0 | 8 |
| can | 0 | 81 | 81 |
| clp | 0 | 30 | 30 |
| ema | 0 | 111 | 111 |
| fap | 0 | 162 | 162 |
| gre | 0 | 96 | 96 |
| hge | 0 | 111 | 111 |
| hpb | 12 | 8 | 20 |
| hpr | 0 | 111 | 111 |
| pos | 0 | 96 | 96 |
| spb | 8 | 0 | 8 |

## cost_basis_currency by family

| Family | EUR | GBP | other | Total |
|---|---|---|---|---|
| cal | 8 | 0 | 0 | 8 |
| can | 0 | 81 | 0 | 81 |
| clp | 0 | 30 | 0 | 30 |
| ema | 0 | 111 | 0 | 111 |
| fap | 0 | 162 | 0 | 162 |
| gre | 0 | 96 | 0 | 96 |
| hge | 0 | 111 | 0 | 111 |
| hpb | 12 | 8 | 0 | 20 |
| hpr | 0 | 111 | 0 | 111 |
| pos | 0 | 96 | 0 | 96 |
| spb | 8 | 0 | 0 | 8 |
