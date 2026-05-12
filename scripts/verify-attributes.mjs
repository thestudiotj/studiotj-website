// Verify that the Prodigi attributes we now compute are accepted by the sandbox API.
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
for (const line of fs.readFileSync(path.join(ROOT, '.env.local'), 'utf-8').split('\n')) {
  const t = line.trim()
  if (!t || t.startsWith('#')) continue
  const eq = t.indexOf('=')
  if (eq < 0) continue
  const k = t.slice(0, eq).trim()
  const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
  if (!process.env[k]) process.env[k] = v
}

const KEY = process.env.PRODIGI_API_KEY
const BASE = 'https://api.sandbox.prodigi.com'

const tests = [
  { label: 'Canvas 16x12 with wrap:ImageWrap',  sku: 'CAN-38MM-SC-16x12', attrs: { wrap: 'ImageWrap' } },
  { label: 'Canvas 40x30 with wrap:ImageWrap',  sku: 'CAN-19MM-SC-40x30', attrs: { wrap: 'ImageWrap' } },
  { label: 'FAP A4 black frame',                sku: 'FRA-CLA-HPR-NM-GLA-A4', attrs: { color: 'black' } },
  { label: 'FAP A3 natural-oak → natural',      sku: 'FRA-CLA-HPR-NM-GLA-A3', attrs: { color: 'natural' } },
  { label: 'FAP A4 white frame',                sku: 'FRA-CLA-HPR-NM-GLA-A4', attrs: { color: 'white' } },
]

for (const { label, sku, attrs } of tests) {
  const r = await fetch(`${BASE}/v4.0/quotes`, {
    method: 'POST',
    headers: { 'X-API-Key': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      shippingMethod: 'Standard',
      destinationCountryCode: 'NL',
      currencyCode: 'EUR',
      items: [{ sku, copies: 1, attributes: attrs, assets: [{ printArea: 'default' }] }]
    })
  })
  const d = await r.json()
  const status = r.status === 200 ? '✓ OK' : `✗ ${r.status}: ${d.outcome}`
  console.log(`${status.padEnd(10)} ${label}`)
  if (r.status !== 200) console.log('  Failures:', JSON.stringify(d.failures, null, 2))
}
