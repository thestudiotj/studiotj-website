#!/usr/bin/env node
/**
 * Fix-up for CLP (C-type Lustre Pro) files that got `landscape` from the
 * add-orientation script because their hero URLs use size-only codes (e.g.
 * `hero-16x20.jpg`) rather than orientation keywords.
 *
 * Parses the WxH size to infer portrait / landscape, then overwrites the
 * `orientation:` line already in the frontmatter.
 */

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PRODUCTS_DIR = path.join(__dirname, '..', 'content', 'products')

function orientationFromWxH(heroUrl) {
  const match = heroUrl.match(/(\d+)x(\d+)/i)
  if (!match) return null
  const w = parseInt(match[1])
  const h = parseInt(match[2])
  if (h > w) return 'portrait'
  if (w > h) return 'landscape'
  return 'square'
}

const files = fs.readdirSync(PRODUCTS_DIR)
  .filter(f => f.endsWith('-clp.mdx'))
  .sort()

let updated = 0

for (const file of files) {
  const filePath = path.join(PRODUCTS_DIR, file)
  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data } = matter(raw)

  if (!data.orientation) {
    console.warn(`SKIP (no orientation): ${file}`)
    continue
  }

  const { variants = [], default_variant = 0 } = data
  const defaultIdx = Math.min(default_variant, variants.length - 1)
  const heroUrl = variants[defaultIdx]?.hero ?? ''

  const inferred = orientationFromWxH(heroUrl)
  if (!inferred) {
    console.log(`SKIP (no WxH in hero URL): ${file}`)
    continue
  }

  if (inferred === data.orientation) {
    console.log(`OK (${inferred}): ${file}`)
    continue
  }

  // Replace the existing `orientation:` line
  const fixed = raw.replace(
    /^orientation:[ \t]+\S+/m,
    `orientation: ${inferred}`
  )

  if (fixed === raw) {
    console.warn(`WARN: could not replace orientation line in ${file}`)
    continue
  }

  fs.writeFileSync(filePath, fixed, 'utf-8')
  console.log(`FIXED ${data.orientation} → ${inferred}: ${file}`)
  updated++
}

console.log(`\nDone: ${updated} CLPs corrected`)
