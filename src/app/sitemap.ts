import type { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/content'
import { getPortfolio } from '@/lib/portfolio'
import { getProducts } from '@/lib/printify'

const BASE_URL = 'https://studiotj.com'

const STATIC_PAGES = [
  '/',
  '/portfolio',
  '/journal',
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

  // Static pages — no lastModified (not cheaply truthful)
  for (const page of STATIC_PAGES) {
    entries.push({ url: `${BASE_URL}${page}` })
  }

  // Portfolio collections — no lastModified (no timestamps in portfolio.json)
  const portfolio = getPortfolio()
  for (const col of portfolio?.collections ?? []) {
    entries.push({ url: `${BASE_URL}/portfolio/${col.slug}` })
  }

  // Blog posts — lastModified from frontmatter.date
  const blogPosts = await getAllPosts('blog')
  for (const post of blogPosts) {
    entries.push({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.frontmatter.date),
    })
  }

  // Journal entries — lastModified from frontmatter.date
  const journalPosts = await getAllPosts('journal')
  for (const post of journalPosts) {
    entries.push({
      url: `${BASE_URL}/journal/${post.slug}`,
      lastModified: new Date(post.frontmatter.date),
    })
  }

  // Subtext Lab entries — lastModified from frontmatter.date
  const subtextPosts = await getAllPosts('subtext-lab')
  for (const post of subtextPosts) {
    entries.push({
      url: `${BASE_URL}/subtext-lab/${post.slug}`,
      lastModified: new Date(post.frontmatter.date),
    })
  }

  // Shop products — on Printify fetch failure: log loudly, continue with zero entries
  try {
    const products = await getProducts()
    for (const product of products) {
      entries.push({ url: `${BASE_URL}/shop/${product.id}` })
    }
  } catch (err) {
    console.error(
      '[sitemap] Printify fetch failed — omitting shop products from sitemap:',
      err,
    )
  }

  return entries
}
