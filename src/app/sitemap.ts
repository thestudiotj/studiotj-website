import type { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/content'
import { getPortfolio } from '@/lib/portfolio'
import { getProducts } from '@/lib/printify'
import { getAllSeries, getRouteEntries } from '@/lib/series'
import { getProducts as getVondstenProducts } from '@/lib/vondsten/loader'
import { CATEGORIES } from '@/lib/vondsten/schemas'
import { loadActiveCategories, loadAllBrandsInCategory, loadBrandProducts } from '@/lib/picks/loader'
import { loadActiveCategories as loadActiveGearCategories, loadAllItemsInCategory } from '@/lib/gear/loader'

const BASE_URL = 'https://studiotj.com'

const STATIC_PAGES = [
  '/',
  '/portfolio',
  '/series',
  '/blog',
  '/subtext-lab',
  '/shop',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = []

  // Static pages
  for (const page of STATIC_PAGES) {
    entries.push({ url: `${BASE_URL}${page}` })
  }

  // Portfolio collections
  const portfolio = getPortfolio()
  for (const col of portfolio?.collections ?? []) {
    entries.push({ url: `${BASE_URL}/portfolio/${col.slug}` })
  }

  // Individual photo pages — portfolio only
  const buildTime = new Date()
  for (const photo of portfolio?.photos ?? []) {
    entries.push({
      url: `${BASE_URL}/photo/${photo.id}`,
      lastModified: photo.date ? new Date(photo.date) : buildTime,
      changeFrequency: 'monthly',
      priority: 0.7,
    })
  }

  // Series pages
  const allSeries = getAllSeries()
  for (const series of allSeries) {
    entries.push({ url: `${BASE_URL}/series/${series.slug}` })

    if (series.routing === 'manual_only') {
      for (const route of getRouteEntries()) {
        entries.push({ url: `${BASE_URL}/series/${series.slug}/${route.route_slug}` })
      }
    } else {
      for (const sp of series.sub_pools ?? []) {
        entries.push({ url: `${BASE_URL}/series/${series.slug}/${sp.slug}` })
      }
    }
  }

  // Blog posts
  const blogPosts = await getAllPosts('blog')
  for (const post of blogPosts) {
    entries.push({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.frontmatter.date),
    })
  }

  // Subtext Lab entries
  const subtextPosts = await getAllPosts('subtext-lab')
  for (const post of subtextPosts) {
    entries.push({
      url: `${BASE_URL}/subtext-lab/${post.slug}`,
      lastModified: new Date(post.frontmatter.date),
    })
  }

  // Shop products
  try {
    const products = await getProducts()
    for (const product of products) {
      entries.push({ url: `${BASE_URL}/shop/${product.id}` })
    }
  } catch (err) {
    console.error('[sitemap] Printify fetch failed — omitting shop products:', err)
  }

  // Gear — landing, active category indexes, item pages
  entries.push({ url: `${BASE_URL}/gear` })
  const activeGearCategories = loadActiveGearCategories()
  for (const cat of activeGearCategories) {
    entries.push({ url: `${BASE_URL}/gear/${cat}` })
    const gearItems = loadAllItemsInCategory(cat)
    for (const item of gearItems) {
      entries.push({ url: `${BASE_URL}/gear/${cat}/${item.slug}` })
    }
  }

  // Picks — landing, active category indexes, brand pages, brand product pages
  entries.push({ url: `${BASE_URL}/picks` })
  const activePicksCategories = loadActiveCategories()
  for (const cat of activePicksCategories) {
    entries.push({ url: `${BASE_URL}/picks/${cat}` })
    const picksbrands = loadAllBrandsInCategory(cat)
    for (const brand of picksbrands) {
      entries.push({ url: `${BASE_URL}/picks/${cat}/${brand.slug}` })
      const brandProducts = loadBrandProducts(cat, brand.slug)
      for (const product of brandProducts) {
        entries.push({ url: `${BASE_URL}/picks/${cat}/${brand.slug}/${product.slug}` })
      }
    }
  }

  // Vondsten — landing, category indexes, product pages
  entries.push({ url: `${BASE_URL}/vondsten` })
  for (const cat of CATEGORIES) {
    const catProducts = getVondstenProducts(cat)
    if (catProducts.length === 0) continue
    entries.push({ url: `${BASE_URL}/vondsten/${cat}` })
    for (const product of catProducts) {
      entries.push({ url: `${BASE_URL}/vondsten/${cat}/${product.slug}` })
    }
  }

  return entries
}
