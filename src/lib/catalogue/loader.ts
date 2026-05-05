import fs from "fs"
import path from "path"
import matter from "gray-matter"
import { productSchema, type Product } from "./types"

const PRODUCTS_DIR = path.join(process.cwd(), "content", "products")

let cache: Product[] | null = null

export function getAllProducts(): Product[] {
  if (cache) return cache
  if (!fs.existsSync(PRODUCTS_DIR)) {
    cache = []
    return cache
  }
  const files = fs.readdirSync(PRODUCTS_DIR).filter((f) => f.endsWith(".mdx"))
  const products: Product[] = []
  for (const file of files) {
    const fullPath = path.join(PRODUCTS_DIR, file)
    const raw = fs.readFileSync(fullPath, "utf-8")
    const { data } = matter(raw)
    const parsed = productSchema.safeParse(data)
    if (!parsed.success) {
      throw new Error(`Invalid product frontmatter in ${file}:\n${parsed.error.toString()}`)
    }
    products.push(parsed.data)
  }
  cache = products
  return cache
}

export function getProductBySlug(slug: string): Product | null {
  return getAllProducts().find((p) => p.id === slug) ?? null
}

export function getAvailableProducts(): Product[] {
  return getAllProducts().filter((p) => p.available)
}

export function getProductsByCollection(collection: string): Product[] {
  return getAllProducts().filter((p) => p.type === "photo" && p.collection === collection)
}

export function getProductsByPhotoId(photoId: string): Product[] {
  return getAllProducts().filter((p) => p.type === "photo" && p.photo_id === photoId)
}

export function getProductsByPhraseId(phraseId: string): Product[] {
  return getAllProducts().filter((p) => p.type === "typography" && p.phrase_id === phraseId)
}
