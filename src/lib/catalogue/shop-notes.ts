import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { z } from 'zod'
import { COLLECTION_CONFIG } from './collections'

const SHOP_NOTES_DIR = path.join(process.cwd(), 'content', 'shop-notes')

export const shopNoteSchema = z.object({
  quote: z.string().min(1),
  href: z.string().optional(),
})

export type ShopNote = z.infer<typeof shopNoteSchema>

export function getAllShopNotes(): readonly ShopNote[] {
  return COLLECTION_CONFIG.map((col) => {
    const filePath = path.join(SHOP_NOTES_DIR, `${col.slug}.mdx`)
    const raw = fs.readFileSync(filePath, 'utf-8')
    const { data } = matter(raw)
    const parsed = shopNoteSchema.safeParse(data)
    if (!parsed.success) {
      throw new Error(
        `Invalid shop-note frontmatter in ${col.slug}.mdx:\n${parsed.error.toString()}`,
      )
    }
    return parsed.data
  })
}
