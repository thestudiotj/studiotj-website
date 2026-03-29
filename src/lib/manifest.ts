import fs from 'fs'
import path from 'path'

export interface PhotoManifest {
  total_photos: number
  collections: Collection[]
  all_photos: Photo[]
  alamy_top_picks: AlamyPick[]
}

export interface Collection {
  name: string
  photo_count: number
  photos: Photo[]
}

export interface Photo {
  filename: string
  filepath: string
  title?: string
  description?: string
  caption_ideas?: string[]
  subject_tags?: string[]
  style_tags?: string[]
  collections?: string[]
  edit_suggestions?: { style: string; notes: string }
  alamy_score?: number
  alamy_notes?: string
  alamy_keywords?: string[]
  portfolio_section?: string
  portfolio_notes?: string
}

export interface AlamyPick {
  filename: string
  title: string
  score: number
  notes: string
  keywords: string[]
}

export async function getManifest(): Promise<PhotoManifest | null> {
  // In production, manifest.json is dropped into public/ by the sorter tool
  const manifestPath = path.join(process.cwd(), 'public', 'manifest.json')

  if (!fs.existsSync(manifestPath)) {
    return null
  }

  try {
    const raw = fs.readFileSync(manifestPath, 'utf-8')
    return JSON.parse(raw) as PhotoManifest
  } catch {
    return null
  }
}
