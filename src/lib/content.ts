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
  summary: z.string(),
  hero: z.string().optional(),
  location: z.string().optional(),
  shoot_date: z.string().optional(),
  tags: z.array(z.string()).optional(),
  draft: z.boolean().default(false),
})

const blogEssaySchema = blogNoteSchema.extend({ type: z.literal('essay') })
const blogFrontmatterSchema = z.discriminatedUnion('type', [blogNoteSchema, blogEssaySchema])

const journalFrontmatterSchema = z.object({
  title: z.string(),
  date: z.string(),
  summary: z.string(),
  hero_photo_id: z.string(),
  photo_ids: z.array(z.string()),
  location: z.string().optional(),
  shoot_date: z.string().optional(),
  draft: z.boolean().default(false),
})

const subtextNoteSchema = z.object({
  title: z.string(),
  date: z.string(),
  type: z.literal('note'),
  summary: z.string(),
  hero: z.string().optional(),
  video_embed: z.string().optional(),
  subjects: z.array(z.enum(SUBJECTS)),  // hard-error on unknown subjects
  draft: z.boolean().default(false),
})

const subtextEssaySchema = subtextNoteSchema.extend({ type: z.literal('essay') })
const subtextFrontmatterSchema = z.discriminatedUnion('type', [subtextNoteSchema, subtextEssaySchema])

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
export type JournalFrontmatter = z.infer<typeof journalFrontmatterSchema>
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

// ─── Internal helpers ─────────────────────────────────────────────────────────

type Section = 'blog' | 'journal' | 'subtext-lab' | 'gear'

const CONTENT_DIR = path.join(process.cwd(), 'content')

function getSchema(section: Section) {
  switch (section) {
    case 'blog':        return blogFrontmatterSchema
    case 'journal':     return journalFrontmatterSchema
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

// ─── Public types ─────────────────────────────────────────────────────────────

export interface PostEntry<T> {
  slug: string
  frontmatter: T
  readingTime: number
}

export interface PostWithBody<T> extends PostEntry<T> {
  /** Raw MDX body string, ready for <MDXRemote source={body} /> */
  body: string
}

// ─── getAllPosts ───────────────────────────────────────────────────────────────

export async function getAllPosts(section: 'blog'): Promise<PostEntry<BlogFrontmatter>[]>
export async function getAllPosts(section: 'journal'): Promise<PostEntry<JournalFrontmatter>[]>
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
export async function getPostBySlug(section: 'journal', slug: string): Promise<PostWithBody<JournalFrontmatter> | null>
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
    body: content,
  }
}
