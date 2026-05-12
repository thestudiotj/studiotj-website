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

// Full product attributes for canvas
const r0 = await fetch(`${BASE}/v4.0/products/CAN-38MM-SC-16x12`, { headers: { 'X-API-Key': KEY } })
const d0 = await r0.json()
console.log('CAN-38MM-SC-16x12 full attributes:', JSON.stringify(d0.product?.attributes, null, 2))

// Try quote WITHOUT wrap attribute
console.log('\n--- Quote without wrap ---')
const r1 = await fetch(`${BASE}/v4.0/quotes`, {
  method: 'POST',
  headers: { 'X-API-Key': KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    shippingMethod: 'Standard',
    destinationCountryCode: 'NL',
    currencyCode: 'EUR',
    items: [{ sku: 'CAN-38MM-SC-16x12', copies: 1, assets: [{ printArea: 'default' }] }]
  })
})
console.log('Status:', r1.status)
console.log(JSON.stringify(await r1.json(), null, 2).slice(0, 800))

// Try quote WITH wrap: ImageWrap
console.log('\n--- Quote with wrap: ImageWrap ---')
const r2 = await fetch(`${BASE}/v4.0/quotes`, {
  method: 'POST',
  headers: { 'X-API-Key': KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    shippingMethod: 'Standard',
    destinationCountryCode: 'NL',
    currencyCode: 'EUR',
    items: [{ sku: 'CAN-38MM-SC-16x12', copies: 1, attributes: { wrap: 'ImageWrap' }, assets: [{ printArea: 'default' }] }]
  })
})
console.log('Status:', r2.status)
console.log(JSON.stringify(await r2.json(), null, 2).slice(0, 800))
