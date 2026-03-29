import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog')

export interface PostMeta {
  slug: string
  title: string
  date: string
  excerpt?: string
  tags?: string[]
  coverImage?: string
}

export interface Post extends PostMeta {
  content: string
}

function ensureBlogDir() {
  if (!fs.existsSync(BLOG_DIR)) {
    fs.mkdirSync(BLOG_DIR, { recursive: true })
  }
}

export async function getAllPosts(): Promise<PostMeta[]> {
  ensureBlogDir()
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.mdx') || f.endsWith('.md'))

  return files
    .map((filename) => {
      const raw = fs.readFileSync(path.join(BLOG_DIR, filename), 'utf-8')
      const { data } = matter(raw)
      return {
        slug: filename.replace(/\.(mdx|md)$/, ''),
        title: data.title ?? 'Untitled',
        date: data.date ?? new Date().toISOString(),
        excerpt: data.excerpt,
        tags: data.tags,
        coverImage: data.coverImage,
      } as PostMeta
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  ensureBlogDir()
  const candidates = [`${slug}.mdx`, `${slug}.md`]

  for (const filename of candidates) {
    const filePath = path.join(BLOG_DIR, filename)
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8')
      const { data, content } = matter(raw)
      return {
        slug,
        title: data.title ?? 'Untitled',
        date: data.date ?? new Date().toISOString(),
        excerpt: data.excerpt,
        tags: data.tags,
        coverImage: data.coverImage,
        content,
      }
    }
  }
  return null
}
