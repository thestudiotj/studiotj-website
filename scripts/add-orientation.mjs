#!/usr/bin/env node
/**
 * One-off migration: add top-level `orientation` field to every grouped product MDX.
 *
 * Rules:
 *   - gre (greeting cards): portrait (locked)
 *   - pos (postcards):       landscape (locked)
 *   - all others: infer from first variant's `orientation` field, then from hero
 *     URL keyword (-portrait / -landscape / -square), then default to landscape
 *
 * Safe: inserts a line after `format:` in the raw YAML text — no YAML serialiser
 * used, so frontmatter formatting is preserved exactly.
 */

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PRODUCTS_DIR = path.join(__dirname, '..', 'content', 'products')

function inferOrientation(data) {
  const { family = '', variants = [], default_variant = 0 } = data

  if (family === 'gre') return 'portrait'
  if (family === 'pos') return 'landscape'

  // Use the first variant that has an explicit orientation field
  for (const v of variants) {
    if (v.orientation === 'portrait') return 'portrait'
    if (v.orientation === 'landscape') return 'landscape'
    if (v.orientation === 'square') return 'square'
  }

  // Infer from default variant's hero URL keyword
  const defaultIdx = Math.min(default_variant, variants.length - 1)
  const heroUrl = variants[defaultIdx]?.hero ?? ''
  if (heroUrl.includes('-portrait')) return 'portrait'
  if (heroUrl.includes('-landscape')) return 'landscape'
  if (heroUrl.includes('-square')) return 'square'

  return 'landscape'
}

const files = fs.readdirSync(PRODUCTS_DIR)
  .filter(f => f.endsWith('.mdx') && f !== 'README.md')
  .sort()

let skipped = 0
let updated = 0
let warnings = 0

for (const file of files) {
  const filePath = path.join(PRODUCTS_DIR, file)
  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data } = matter(raw)

  if (data.orientation) {
    skipped++
    continue
  }

  const orientation = inferOrientation(data)

  // Insert `orientation: X` immediately after the `format: ...` line
  const patched = raw.replace(
    /^(format:[ \t]+\S.*)/m,
    `$1\norientation: ${orientation}`
  )

  if (patched === raw) {
    console.warn(`WARNING: no format: line found in ${file} — skipping`)
    warnings++
    continue
  }

  fs.writeFileSync(filePath, patched, 'utf-8')
  console.log(`${file}  →  orientation: ${orientation}`)
  updated++
}

console.log(`\nDone: ${updated} updated, ${skipped} already set, ${warnings} warnings`)
