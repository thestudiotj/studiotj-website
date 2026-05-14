#!/usr/bin/env node
/**
 * Prodigi Verification Audit — Session 12
 *
 * Enumerates every variant across all visible product MDX files and verifies:
 *   1. Price correctness: price_cents == round(base_prices.EU * (1 + margin_pct/100) * 100) ± 10c
 *   2. Prodigi SKU exists in the sandbox catalogue (via quote API as probe)
 *   3. Photo asset URL returns HTTP 200
 *   4. Photo dimensions adequate for print size at MIN_DPI (150)
 *
 * Outputs: _audit/prodigi-verification.csv
 *
 * Usage (from project root):
 *   node scripts/audit-prodigi.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const matter = require('gray-matter')

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const PRODUCTS_DIR = path.join(ROOT, 'content', 'products')
const AUDIT_DIR = path.join(ROOT, '_audit')
const CSV_PATH = path.join(AUDIT_DIR, 'prodigi-verification.csv')

const R2_BASE = 'https://photos.studiotj.com'
const PRODIGI_SANDBOX_BASE = 'https://api.sandbox.prodigi.com'
const MIN_DPI = 150
const PRICE_TOLERANCE_CENTS = 10

// ── .env.local loader ─────────────────────────────────────────────────────────

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

// ── JPEG dimension parser ─────────────────────────────────────────────────────

function jpegDimensions(buf) {
  if (buf.length < 4 || buf[0] !== 0xFF || buf[1] !== 0xD8) return null
  let i = 2
  while (i < buf.length - 8) {
    if (buf[i] !== 0xFF) break
    const marker = buf[i + 1]
    if (i + 3 >= buf.length) break
    const segLen = (buf[i + 2] << 8) | buf[i + 3]
    const isSOF =
      (marker >= 0xC0 && marker <= 0xC3) ||
      (marker >= 0xC5 && marker <= 0xC7) ||
      (marker >= 0xC9 && marker <= 0xCB) ||
      (marker >= 0xCD && marker <= 0xCF)
    if (isSOF) {
      const h = (buf[i + 5] << 8) | buf[i + 6]
      const w = (buf[i + 7] << 8) | buf[i + 8]
      return { width: w, height: h }
    }
    i += 2 + segLen
  }
  return null
}

// ── Print size → inches ───────────────────────────────────────────────────────

// Dimensions stored as {w, h} in their "natural" orientation.
// The DPI check resolves orientation at runtime.
const SIZE_INCHES = {
  '16x12': { w: 16, h: 12 },
  '20x16': { w: 20, h: 16 },
  '40x30': { w: 40, h: 30 },
  'a5':    { w: 8.27,  h: 5.83 },
  'a4':    { w: 11.69, h: 8.27 },
  'a3':    { w: 16.54, h: 11.69 },
  '16x20': { w: 16,   h: 20 },
  '24x36': { w: 24,   h: 36 },
  '6x4':   { w: 6,    h: 4 },
  '7x5':   { w: 7,    h: 5 },
}

function computeDpi(imgW, imgH, sizeKey, orientation) {
  const dims = SIZE_INCHES[sizeKey.toLowerCase()]
  if (!dims) return null
  let { w: pw, h: ph } = dims
  // Swap print dims if the product orientation conflicts with stored dims
  if (orientation === 'portrait' && pw > ph) { const tmp = pw; pw = ph; ph = tmp }
  if (orientation === 'landscape' && ph > pw) { const tmp = pw; pw = ph; ph = tmp }
  return Math.min(imgW / pw, imgH / ph)
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

async function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)),
  ])
}

async function headRequest(url) {
  try {
    const res = await withTimeout(fetch(url, { method: 'HEAD' }), 15000)
    return { ok: res.ok, status: res.status }
  } catch (e) {
    return { ok: false, status: 0, error: String(e) }
  }
}

async function fetchPartial(url, bytes = 65536) {
  try {
    const res = await withTimeout(
      fetch(url, { method: 'GET', headers: { Range: `bytes=0-${bytes - 1}` } }),
      20000,
    )
    if (!res.ok && res.status !== 206) return null
    const ab = await withTimeout(res.arrayBuffer(), 20000)
    return Buffer.from(ab)
  } catch {
    return null
  }
}

// ── Prodigi SKU probe via quote ───────────────────────────────────────────────

const prodigiSkuCache = new Map()

async function checkProdigiSku(sku) {
  if (prodigiSkuCache.has(sku)) return prodigiSkuCache.get(sku)

  const apiKey = process.env.PRODIGI_API_KEY
  if (!apiKey) {
    const r = { status: 'SKIPPED', notes: 'PRODIGI_API_KEY not set' }
    prodigiSkuCache.set(sku, r)
    return r
  }

  // Primary: try the products endpoint
  try {
    const url = `${PRODIGI_SANDBOX_BASE}/v4.0/products/${encodeURIComponent(sku)}`
    const res = await withTimeout(
      fetch(url, { headers: { 'X-API-Key': apiKey } }),
      15000,
    )
    const text = await res.text()
    if (res.status === 200) {
      const r = { status: 'OK', notes: '' }
      prodigiSkuCache.set(sku, r)
      return r
    }
    if (res.status === 404) {
      // Fall through to quote probe
    } else if (res.status === 405 || res.status === 404) {
      // Endpoint may not exist; use quote probe
    } else {
      // Some other error — fall through to quote probe
    }
  } catch {
    // Fall through to quote probe
  }

  // Fallback: verify via quote
  try {
    const res = await withTimeout(
      fetch(`${PRODIGI_SANDBOX_BASE}/v4.0/quotes`, {
        method: 'POST',
        headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingMethod: 'Standard',
          destinationCountryCode: 'NL',
          currencyCode: 'EUR',
          items: [{ sku, copies: 1, assets: [{ printArea: 'default' }] }],
        }),
      }),
      15000,
    )
    const text = await res.text()
    if (res.ok) {
      const r = { status: 'OK', notes: 'verified via quote' }
      prodigiSkuCache.set(sku, r)
      return r
    }
    // Parse error to see if it's a bad SKU
    let parsed = null
    try { parsed = JSON.parse(text) } catch { /**/ }
    const msg = parsed?.detail ?? parsed?.message ?? text.slice(0, 120)
    if (res.status >= 400 && res.status < 500) {
      const r = { status: 'NOT_FOUND', notes: `Quote rejected ${res.status}: ${msg}` }
      prodigiSkuCache.set(sku, r)
      return r
    }
    const r = { status: 'API_ERROR', notes: `HTTP ${res.status}: ${msg}` }
    prodigiSkuCache.set(sku, r)
    return r
  } catch (e) {
    const r = { status: 'API_ERROR', notes: String(e).slice(0, 120) }
    prodigiSkuCache.set(sku, r)
    return r
  }
}

// ── Photo check (URL + dimensions) ───────────────────────────────────────────

const photoCache = new Map()

async function checkPhoto(r2Path) {
  if (photoCache.has(r2Path)) return photoCache.get(r2Path)
  const url = `${R2_BASE}/${r2Path}`
  const head = await headRequest(url)
  if (!head.ok) {
    const r = { ok: false, width: 0, height: 0, notes: `HEAD ${head.status}` }
    photoCache.set(r2Path, r)
    return r
  }
  const buf = await fetchPartial(url)
  if (!buf) {
    const r = { ok: true, width: 0, height: 0, notes: 'partial fetch failed' }
    photoCache.set(r2Path, r)
    return r
  }
  const dims = jpegDimensions(buf)
  if (!dims) {
    const r = { ok: true, width: 0, height: 0, notes: 'JPEG header not found in first 64KB' }
    photoCache.set(r2Path, r)
    return r
  }
  const r = { ok: true, width: dims.width, height: dims.height, notes: '' }
  photoCache.set(r2Path, r)
  return r
}

// ── Price check ───────────────────────────────────────────────────────────────

// Locked ECB rate 2026-05-13 (scripts/extraction-fx-rates.md). The storefront
// is EUR-only; GBP-basis variants FX-convert their base before margin is
// applied (Session 2 formula fix). Must match extract-prodigi-pricing.py's
// GBP_PER_EUR constant.
const GBP_PER_EUR = 0.867130

function checkPrice(variant, marginPct) {
  const euBase = variant.base_prices?.EU
  if (euBase == null) return { ok: false, expected: null, notes: 'no base_prices.EU' }
  const eurBase = variant.cost_basis_currency === 'GBP' ? euBase / GBP_PER_EUR : euBase
  const expected = Math.round(eurBase * (1 + marginPct / 100) * 100)
  const diff = Math.abs(expected - (variant.price_cents ?? 0))
  if (diff > PRICE_TOLERANCE_CENTS) {
    return { ok: false, expected, notes: `price_cents=${variant.price_cents} expected=${expected} diff=${diff}c` }
  }
  return { ok: true, expected, notes: '' }
}

// ── CSV helpers ───────────────────────────────────────────────────────────────

function csv(v) {
  if (v == null) return ''
  const s = String(v)
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  loadEnv()

  const apiKey = process.env.PRODIGI_API_KEY
  if (!apiKey) console.warn('[WARN] PRODIGI_API_KEY not set — Prodigi checks will be skipped')

  const files = fs.readdirSync(PRODUCTS_DIR).filter(
    (f) => f.endsWith('.mdx') && f !== 'README.md'
  ).sort()

  const rows = []
  let totalVariants = 0

  for (const file of files) {
    const raw = fs.readFileSync(path.join(PRODUCTS_DIR, file), 'utf-8')
    const { data } = matter(raw)
    if (!data || data.type !== 'grouped') continue
    if (['book', 'calendar'].includes(data.format)) continue
    if (!data.available) continue

    const mdxPath = `content/products/${file}`
    const photoId = data.photo_id ?? ''
    const family = data.family ?? ''
    const r2Path = data.print_areas?.[0]?.default_asset_r2 ?? ''
    const marginPct = Number(data.margin_pct ?? 0)

    // Pre-fetch photo once per MDX (shared across all variants)
    const photoResult = r2Path ? await checkPhoto(r2Path) : { ok: false, width: 0, height: 0, notes: 'no r2 path' }
    const photoUrl = r2Path ? `${R2_BASE}/${r2Path}` : ''

    for (const variant of data.variants ?? []) {
      totalVariants++
      const sku = variant.sku ?? ''
      const sizeKey = variant.size ?? ''
      const orientation = variant.orientation ?? data.orientation ?? 'landscape'

      // 1. Price
      const priceCheck = checkPrice(variant, marginPct)

      // 2. Prodigi SKU
      const skuResult = sku ? await checkProdigiSku(sku) : { status: 'NO_SKU', notes: 'missing sku field' }

      // 3. DPI
      let dpiAtSize = ''
      const photoDims = photoResult.width ? `${photoResult.width}x${photoResult.height}` : ''
      if (photoResult.width && photoResult.height && sizeKey) {
        const dpi = computeDpi(photoResult.width, photoResult.height, sizeKey, orientation)
        if (dpi != null) dpiAtSize = dpi.toFixed(0)
      }

      // 4. Status
      const issues = []
      if (!priceCheck.ok) issues.push('PRICE_MISMATCH')
      if (skuResult.status === 'NOT_FOUND') issues.push('PRODIGI_MISSING')
      if (skuResult.status === 'API_ERROR' || skuResult.status === 'NO_SKU') issues.push('PRODIGI_ERROR')
      if (!photoResult.ok) issues.push('PHOTO_404')
      if (photoResult.ok && dpiAtSize && Number(dpiAtSize) < MIN_DPI) issues.push('PHOTO_LOW_RES')

      let status = issues.length === 0 ? 'OK' : issues.length === 1 ? issues[0] : 'MULTI'

      const notes = [priceCheck.notes, skuResult.notes, photoResult.notes].filter(Boolean).join('; ')

      rows.push({
        mdx_path: mdxPath,
        photo_id: photoId,
        family,
        size: sizeKey,
        sku,
        variant_id: variant.variantId,
        mdx_price_cents: variant.price_cents ?? '',
        expected_price_cents: priceCheck.expected ?? '',
        price_ok: priceCheck.ok ? 'OK' : 'MISMATCH',
        prodigi_status: skuResult.status,
        photo_url: photoUrl,
        photo_dimensions: photoDims,
        dpi_at_size: dpiAtSize,
        status,
        notes,
      })

      const icon = status === 'OK' ? '✓' : '✗'
      process.stdout.write(
        `${icon} ${(variant.variantId ?? '').padEnd(55)} SKU:${sku.padEnd(28)} ${status}${notes ? ' — ' + notes : ''}\n`
      )
    }
  }

  // Write CSV
  fs.mkdirSync(AUDIT_DIR, { recursive: true })
  const COLS = [
    'mdx_path', 'photo_id', 'family', 'size', 'sku', 'variant_id',
    'mdx_price_cents', 'expected_price_cents', 'price_ok',
    'prodigi_status', 'photo_url', 'photo_dimensions', 'dpi_at_size',
    'status', 'notes',
  ]
  const csvContent = [
    COLS.map(csv).join(','),
    ...rows.map((r) => COLS.map((c) => csv(r[c])).join(',')),
  ].join('\n') + '\n'
  fs.writeFileSync(CSV_PATH, csvContent, 'utf-8')

  // Summary
  const byStatus = {}
  for (const r of rows) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1

  console.log('\n─── Audit Summary ────────────────────────────────────────')
  console.log(`Variants audited: ${totalVariants}`)
  for (const [s, n] of Object.entries(byStatus).sort()) {
    console.log(`  ${s.padEnd(22)} ${n}`)
  }
  console.log(`\nCSV: ${CSV_PATH}`)
}

main().catch((err) => {
  console.error('[FATAL]', err)
  process.exit(1)
})
