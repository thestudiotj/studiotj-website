import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

function loadEnv() {
  const envPath = path.join(ROOT, '.env.local')
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq < 0) continue
    const k = t.slice(0, eq).trim()
    const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[k]) process.env[k] = v
  }
}

loadEnv()
const key = process.env.PRODIGI_API_KEY
console.log('Key loaded:', key ? `yes (${key.length} chars)` : 'NO')

const BASE = 'https://api.sandbox.prodigi.com'

// Test 1: products endpoint
console.log('\n--- GET /v4.0/products/FRA-CLA-HPR-NM-GLA-A4 ---')
const r1 = await fetch(`${BASE}/v4.0/products/FRA-CLA-HPR-NM-GLA-A4`, {
  headers: { 'X-API-Key': key }
})
console.log('Status:', r1.status)
const t1 = await r1.text()
console.log(t1.slice(0, 1000))

// Test 2: quote to see items detail
console.log('\n--- POST /v4.0/quotes for FRA-CLA-HPR-NM-GLA-A4 ---')
const r2 = await fetch(`${BASE}/v4.0/quotes`, {
  method: 'POST',
  headers: { 'X-API-Key': key, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    shippingMethod: 'Standard',
    destinationCountryCode: 'NL',
    currencyCode: 'EUR',
    items: [{ sku: 'FRA-CLA-HPR-NM-GLA-A4', copies: 1, assets: [{ printArea: 'default' }] }]
  })
})
console.log('Status:', r2.status)
const t2 = await r2.text()
try {
  console.log(JSON.stringify(JSON.parse(t2), null, 2).slice(0, 2000))
} catch {
  console.log(t2.slice(0, 2000))
}

// Test 3: quote with frameColor attribute
console.log('\n--- POST /v4.0/quotes with attributes.frameColor=Black ---')
const r3 = await fetch(`${BASE}/v4.0/quotes`, {
  method: 'POST',
  headers: { 'X-API-Key': key, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    shippingMethod: 'Standard',
    destinationCountryCode: 'NL',
    currencyCode: 'EUR',
    items: [{
      sku: 'FRA-CLA-HPR-NM-GLA-A4',
      copies: 1,
      attributes: { frameColor: 'Black' },
      assets: [{ printArea: 'default' }]
    }]
  })
})
console.log('Status:', r3.status)
const t3 = await r3.text()
try {
  console.log(JSON.stringify(JSON.parse(t3), null, 2).slice(0, 2000))
} catch {
  console.log(t3.slice(0, 2000))
}
