import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { z } from 'zod'

// ─── Section subjects (Subtext Lab) ───────────────────────────────────────────

export const SUBJECTS = [
  'games', 'film', 'tv', 'anime', 'manga', 'comics',
  'books', 'music', 'tech', 'society',
] as const
export type Subject = typeof SUBJECTS[number]

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const blogNoteSchema = z.object({
  title: z.string(),
  date: z.string(),
  type: z.literal('note'),
  summary: z.string().optional(),
  hero: z.string().optional(),
  location: z.string().optional(),
  shoot_date: z.string().optional(),
  tags: z.array(z.string()).optional(),
  draft: z.boolean().default(false),
})

const blogEssaySchema = blogNoteSchema.extend({ type: z.literal('essay') })
const blogFrontmatterSchema = z.discriminatedUnion('type', [blogNoteSchema, blogEssaySchema])

const subtextEssaySchema = z.object({
  type: z.literal('essay'),
  title: z.string(),
  date: z.string(),
  summary: z.string().optional(),
  hero: z.string().optional(),
  subjects: z.array(z.enum(SUBJECTS)).min(1),
  draft: z.boolean().default(false),
})

const subtextArticleSchema = z.object({
  type: z.literal('article'),
  title: z.string(),
  date: z.string(),
  summary: z.string().optional(),
  subjects: z.array(z.enum(SUBJECTS)).min(1),
  draft: z.boolean().default(false),
})

const subtextVideoSchema = z.object({
  type: z.literal('video'),
  title: z.string(),
  date: z.string(),
  summary: z.string().optional(),
  video_embed: z.string().regex(/^[A-Za-z0-9_-]{11}$/, 'Must be an 11-character YouTube ID'),
  video_poster: z.string(),
  subjects: z.array(z.enum(SUBJECTS)).min(1),
  draft: z.boolean().default(false),
})

const subtextFrontmatterSchema = z.discriminatedUnion('type', [
  subtextEssaySchema,
  subtextArticleSchema,
  subtextVideoSchema,
])

const gearFrontmatterSchema = z.object({
  name: z.string(),
  category: z.enum(['Cameras', 'Lenses', 'Lighting', 'Software', 'Accessories', 'Computer & Storage']),
  status: z.enum(['current', 'previous', 'wishlist']),
  summary: z.string(),
  image: z.string().optional(),
  image_caption: z.string().optional(),
  affiliate_link: z.string().url().optional(),
  affiliate_provider: z.string().optional(),
  date_added: z.string(),
})

export type BlogFrontmatter = z.infer<typeof blogFrontmatterSchema>
export type SubtextFrontmatter = z.infer<typeof subtextFrontmatterSchema>
export type GearFrontmatter = z.infer<typeof gearFrontmatterSchema>

// ─── Reading time ─────────────────────────────────────────────────────────────

export function getReadingTime(content: string): number {
  const stripped = content
    .replace(/^---[\s\S]*?---/, '')    // frontmatter remnants
    .replace(/<[^>]+>/g, ' ')          // JSX/HTML tags
    .replace(/```[\s\S]*?```/g, ' ')   // code fences
    .replace(/`[^`]+`/g, ' ')          // inline code
    .replace(/[#*_~>|[\]()]/g, ' ')    // markdown symbols
  const words = stripped.trim().split(/\s+/).filter(Boolean)
  return Math.ceil(words.length / 200)
}

// ─── Summary auto-derive ──────────────────────────────────────────────────────

export function deriveSummary(mdxBody: string, maxChars = 155): string {
  let text = mdxBody
  // 1. Strip MDX component tags (self-closing and paired)
  text = text.replace(/<[A-Za-z][A-Za-z0-9]*[^>]*\/>/g, ' ')
  text = text.replace(/<[A-Za-z][A-Za-z0-9]*[^>]*>[\s\S]*?<\/[A-Za-z][A-Za-z0-9]*>/g, ' ')
  // 2. Strip markdown syntax
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')         // images
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')        // links (keep text)
  text = text.replace(/^#{1,6}\s+/gm, ' ')                   // headings
  text = text.replace(/[*_]{1,2}([^*_\n]+)[*_]{1,2}/g, '$1') // emphasis/bold
  text = text.replace(/`[^`]+`/g, ' ')                        // inline code
  // 3. Collapse whitespace
  text = text.replace(/\s+/g, ' ').trim()
  // 4. Return as-is if short enough
  if (text.length <= maxChars) return text
  // 5. Truncate to last complete word within maxChars
  const truncated = text.slice(0, maxChars)
  const lastSpace = truncated.lastIndexOf(' ')
  const trimmed = lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated
  // 6. Append ellipsis char
  return trimmed + '\u2026'
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

type Section = 'blog' | 'subtext-lab' | 'gear'

const CONTENT_DIR = path.join(process.cwd(), 'content')

function getSchema(section: Section) {
  switch (section) {
    case 'blog':        return blogFrontmatterSchema
    case 'subtext-lab': return subtextFrontmatterSchema
    case 'gear':        return gearFrontmatterSchema
  }
}

function parseFrontmatter(section: Section, rawData: unknown, filename: string) {
  const schema = getSchema(section)
  const result = (schema as z.ZodType).safeParse(rawData)
  if (!result.success) {
    const issues = result.error.issues
      .map((i: z.ZodIssue) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n')
    throw new Error(`Frontmatter validation failed in content/${section}/${filename}:\n${issues}`)
  }
  return result.data
}

// In production, draft: true posts are excluded from getAllPosts.
// In dev, they're included so authoring is visible during work.
function isExcludedDraft(frontmatter: { draft?: boolean }): boolean {
  return process.env.NODE_ENV === 'production' && frontmatter.draft === true
}

function computeSummary(section: Section, frontmatter: unknown, content: string): string {
  if (section === 'blog' || section === 'subtext-lab') {
    return (frontmatter as { summary?: string }).summary ?? deriveSummary(content)
  }
  // gear has a required summary field in frontmatter
  return (frontmatter as { summary: string }).summary
}

// ─── Public types ─────────────────────────────────────────────────────────────

export interface PostEntry<T> {
  slug: string
  frontmatter: T
  readingTime: number
  summary: string
}

export interface PostWithBody<T> extends PostEntry<T> {
  /** Raw MDX body string, ready for <MDXRemote source={body} /> */
  body: string
}

// ─── getAllPosts ───────────────────────────────────────────────────────────────

export async function getAllPosts(section: 'blog'): Promise<PostEntry<BlogFrontmatter>[]>
export async function getAllPosts(section: 'subtext-lab'): Promise<PostEntry<SubtextFrontmatter>[]>
export async function getAllPosts(section: 'gear'): Promise<PostEntry<GearFrontmatter>[]>
export async function getAllPosts(section: Section): Promise<PostEntry<unknown>[]> {
  const dir = path.join(CONTENT_DIR, section)
  if (!fs.existsSync(dir)) return []

  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.mdx'))

  const posts = files
    .map((filename) => {
      const raw = fs.readFileSync(path.join(dir, filename), 'utf-8')
      const { data, content } = matter(raw)
      const frontmatter = parseFrontmatter(section, data, filename)
      if (isExcludedDraft(frontmatter as { draft?: boolean })) return null
      return {
        slug: filename.replace(/\.mdx$/, ''),
        frontmatter,
        readingTime: getReadingTime(content),
        summary: computeSummary(section, frontmatter, content),
      }
    })
    .filter((p): p is PostEntry<unknown> => p !== null)

  // Sort by date descending; gear uses date_added instead of date
  return posts.sort((a, b) => {
    const fm = (x: PostEntry<unknown>) => x.frontmatter as Record<string, string>
    const dateA = fm(a).date ?? fm(a).date_added ?? ''
    const dateB = fm(b).date ?? fm(b).date_added ?? ''
    return dateB.localeCompare(dateA)
  })
}

// ─── getPostBySlug ────────────────────────────────────────────────────────────

export async function getPostBySlug(section: 'blog', slug: string): Promise<PostWithBody<BlogFrontmatter> | null>
export async function getPostBySlug(section: 'subtext-lab', slug: string): Promise<PostWithBody<SubtextFrontmatter> | null>
export async function getPostBySlug(section: 'gear', slug: string): Promise<PostWithBody<GearFrontmatter> | null>
export async function getPostBySlug(section: Section, slug: string): Promise<PostWithBody<unknown> | null> {
  const filePath = path.join(CONTENT_DIR, section, `${slug}.mdx`)
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(raw)
  const frontmatter = parseFrontmatter(section, data, `${slug}.mdx`)

  if (isExcludedDraft(frontmatter as { draft?: boolean })) return null

  return {
    slug,
    frontmatter,
    readingTime: getReadingTime(content),
    summary: computeSummary(section, frontmatter, content),
    body: content,
  }
}
