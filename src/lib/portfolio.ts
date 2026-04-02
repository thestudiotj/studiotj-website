import fs from 'fs'
import path from 'path'

// ─── Types ────────────────────────────────────────────────────────────────────

export type Mood = 'moody' | 'warm' | 'bold' | 'serene' | 'gritty' | 'playful' | 'minimal'
export type StyleIntensity = 'subtle' | 'moderate' | 'bold'
export type Layout = 'masonry' | 'grid' | 'auto'

export interface Collection {
  slug: string
  name: string
  tagline: string
  description: string
  mood: Mood
  palette: string[]
  hero_photo_id: string
  layout: Layout
  style_intensity: StyleIntensity
  photo_ids: string[]
}

export interface Photo {
  id: string
  url: string
  thumbnail_url: string
  title: string
  aspect_ratio: number
  dominant_colors: string[]
  collections: string[]
  shoot_folder: string
  date: string
}

export interface PortfolioData {
  version: string
  generated_at: string
  site: { photo_base_url: string }
  collections: Collection[]
  photos: Photo[]
}

export interface MoodTheme {
  bg: string
  text: string
  textMuted: string
  accent: string
  border: string
  surface: string
  isLight: boolean // true = light text on dark bg
}

// ─── Data access ──────────────────────────────────────────────────────────────

function readPortfolio(): PortfolioData | null {
  const filePath = path.join(process.cwd(), 'public', 'portfolio.json')
  if (!fs.existsSync(filePath)) return null
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as PortfolioData
  } catch {
    return null
  }
}

export function getPortfolio(): PortfolioData | null {
  return readPortfolio()
}

export function getCollection(slug: string): Collection | null {
  return getPortfolio()?.collections.find(c => c.slug === slug) ?? null
}

export function getCollectionPhotos(slug: string): Photo[] {
  const data = getPortfolio()
  if (!data) return []
  const collection = data.collections.find(c => c.slug === slug)
  if (!collection) return []
  const photoMap = new Map(data.photos.map(p => [p.id, p]))
  return collection.photo_ids
    .map(id => photoMap.get(id))
    .filter((p): p is Photo => p !== undefined)
}

export function getPhoto(id: string): Photo | null {
  return getPortfolio()?.photos.find(p => p.id === id) ?? null
}

// ─── Mood theming ─────────────────────────────────────────────────────────────

export function getMoodTheme(
  mood: Mood,
  intensity: StyleIntensity,
  palette: string[]
): MoodTheme {
  const p0 = palette[0] ?? '#2a2a2a'
  const p1 = palette[1] ?? '#4a4a4a'
  const pLight = palette[palette.length - 1] ?? '#e8e8e8'

  switch (mood) {
    case 'moody':
      if (intensity === 'bold') {
        return { bg: '#0f0f0f', text: '#e0e0e0', textMuted: '#808080', accent: p0, border: '#2a2a2a', surface: '#1a1a1a', isLight: true }
      }
      if (intensity === 'moderate') {
        return { bg: '#1c1c1c', text: '#d4d4d4', textMuted: '#707070', accent: p1, border: '#303030', surface: '#242424', isLight: true }
      }
      return { bg: '#222222', text: '#c8c8c8', textMuted: '#666666', accent: p1, border: '#363636', surface: '#2a2a2a', isLight: true }

    case 'warm':
      if (intensity === 'bold') {
        return { bg: '#faf0e4', text: '#1a0e04', textMuted: '#6b5a4a', accent: p0, border: '#e0c9a8', surface: '#f4e8d8', isLight: false }
      }
      if (intensity === 'moderate') {
        return { bg: '#fbf7f0', text: '#1a1208', textMuted: '#6b6058', accent: p0, border: '#e8ddd0', surface: '#f5f0e8', isLight: false }
      }
      // subtle — almost identical to paper, just breathes a bit warmer
      return { bg: '#f8f5f0', text: '#0d0d0d', textMuted: '#6b6560', accent: p0, border: '#e8e0d4', surface: '#f5f0e8', isLight: false }

    case 'bold':
      if (intensity === 'bold') {
        return { bg: '#F5F2EC', text: '#0D0D0D', textMuted: '#6B6560', accent: p0, border: p0 + '40', surface: pLight + '20', isLight: false }
      }
      return { bg: '#F5F2EC', text: '#0D0D0D', textMuted: '#6B6560', accent: p0, border: '#C4BEB4', surface: '#EDEBE4', isLight: false }

    case 'serene':
      return { bg: '#f9f8f7', text: '#2a2a2a', textMuted: '#7a7a7a', accent: p1, border: '#ddd8d2', surface: '#f2f0ee', isLight: false }

    case 'gritty':
      if (intensity === 'bold') {
        return { bg: '#111111', text: '#d8d4d0', textMuted: '#787470', accent: p0, border: '#282828', surface: '#1c1c1c', isLight: true }
      }
      return { bg: '#1c1c1a', text: '#c8c4c0', textMuted: '#686460', accent: p0, border: '#2c2c2a', surface: '#242422', isLight: true }

    case 'playful':
      return { bg: '#fafaf8', text: '#0D0D0D', textMuted: '#6B6560', accent: p0, border: '#C4BEB4', surface: '#f0eeea', isLight: false }

    case 'minimal':
    default:
      return { bg: '#F5F2EC', text: '#0D0D0D', textMuted: '#6B6560', accent: p1, border: '#C4BEB4', surface: '#EDEBE4', isLight: false }
  }
}
