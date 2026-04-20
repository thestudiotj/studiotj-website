import type { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/content'
import { getPortfolio } from '@/lib/portfolio'
import { getProducts } from '@/lib/printify'
import {
  getAllSeries,
  getSeriesShape,
  getEntriesForSeries,
  getGroupsForSeries,
  getSubSeriesForSeries,
} from '@/lib/series'

const BASE_URL = 'https://studiotj.com'

const STATIC_PAGES = [
  '/',
  '/portfolio',
  '/series',
  '/blog',
  '/subtext-lab',
  '/gear',
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
    const shape = getSeriesShape(series)

    if (shape === 'flat_filter') {
      for (const entry of getEntriesForSeries(series.slug)) {
        entries.push({
          url: `${BASE_URL}/series/${series.slug}/${entry.entry_slug}`,
          lastModified: new Date(entry.approved_at),
        })
      }
    } else if (shape === 'grouped') {
      for (const group of getGroupsForSeries(series)) {
        entries.push({ url: `${BASE_URL}/series/${series.slug}/${group.slug}` })
        for (const entry of group.entries) {
          entries.push({
            url: `${BASE_URL}/series/${series.slug}/${group.slug}/${entry.entry_slug}`,
            lastModified: new Date(entry.approved_at),
          })
        }
      }
    } else {
      // sub_series
      for (const ss of getSubSeriesForSeries(series)) {
        entries.push({ url: `${BASE_URL}/series/${series.slug}/${ss.slug}` })
        for (const entry of ss.entries) {
          entries.push({
            url: `${BASE_URL}/series/${series.slug}/${ss.slug}/${entry.entry_slug}`,
            lastModified: new Date(entry.approved_at),
          })
        }
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

  return entries
}
