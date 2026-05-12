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

const SKUS_TO_CHECK = [
  'CAN-38MM-SC-16x12',
  'CAN-19MM-SC-40x30',
  'GLOBAL-HPR-A4',
  'GLOBAL-HGE-A4',
  'GLOBAL-FAP-A4',
  'ART-PAP-LPP-16X20',
  'GLOBAL-GRE-MOH-6X4-BLA-10',
  'GLOBAL-POST-MOH-6X4-BLA-10',
  'FRA-CLA-HPR-NM-GLA-A4',
]

for (const sku of SKUS_TO_CHECK) {
  const r = await fetch(`${BASE}/v4.0/products/${encodeURIComponent(sku)}`, {
    headers: { 'X-API-Key': KEY }
  })
  const d = await r.json()
  const attrs = d.product?.attributes ?? {}
  const required = Object.entries(attrs)
    .filter(([, vals]) => Array.isArray(vals) && vals.length > 1)
    .map(([k, vals]) => `${k}: [${vals.slice(0, 3).join(', ')}${vals.length > 3 ? '…' : ''}]`)
  console.log(`${sku}: ${required.length ? required.join(' | ') : 'no required attrs'}`)
}
