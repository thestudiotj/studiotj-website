import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { z } from 'zod'

const LEARN_DIR = path.join(process.cwd(), 'content', 'learn-pages')

const learnFrontmatterSchema = z.object({
  family: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
})

export type LearnFrontmatter = z.infer<typeof learnFrontmatterSchema>

export interface LearnPage {
  frontmatter: LearnFrontmatter
  body: string
}

export function getLearnPage(family: string): LearnPage | null {
  const filePath = path.join(LEARN_DIR, `${family}.mdx`)
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(raw)

  const parsed = learnFrontmatterSchema.safeParse(data)
  if (!parsed.success) {
    throw new Error(
      `Invalid learn-page frontmatter in ${family}.mdx:\n${parsed.error.toString()}`,
    )
  }

  return { frontmatter: parsed.data, body: content }
}
