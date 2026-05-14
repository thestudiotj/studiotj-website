# ECB FX rates captured for pricing extraction

- Source: https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml
- Fetch date (ECB): 2026-05-13
- Captured by: scripts/extract-prodigi-pricing.py

## Rates (EUR base)

| Currency | Rate (1 EUR = …) |
|---|---|
| USD | 1.171500 |
| GBP | 0.867130 |
| AUD | 1.615800 |

## Conversion identities used in extraction

- USD → EUR: amount / rates['USD']
- GBP → EUR: amount / rates['GBP']
- AUD → EUR: amount / rates['AUD']
- Cross-conversions pivot through EUR.