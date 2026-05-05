import fs from 'fs'
import path from 'path'
import { z } from 'zod'

// ─── Schemas ──────────────────────────────────────────────────────────────────

const ChannelSchema = z.object({
  platform: z.enum(['bluesky', 'mastodon', 'pixelfed', 'instagram', 'pinterest', 'tiktok', 'youtube']),
  public_url: z.string().url(),
  posted_at: z.string().datetime(),
})

const ItemSchema = z.object({
  cluster_id: z.string(),
  identity: z.enum(['studiotj', 'subtextlab', 'tjvanderheeft']),
  primary_image_url: z.string().url().nullable(),
  aspect_ratio: z.number(),
  copy: z.string(),
  earliest_posted_at: z.string().datetime(),
  channels: z.array(ChannelSchema).min(1),
})

const ElsewhereSchema = z.object({
  schema_version: z.literal(1),
  generated_at: z.string().datetime(),
  items: z.array(ItemSchema),
  meta: z.record(z.string(), z.unknown()),
})

// ─── Types ────────────────────────────────────────────────────────────────────

export type ElsewhereItem = z.infer<typeof ItemSchema>
export type ElsewhereChannel = z.infer<typeof ChannelSchema>
export type Platform = ElsewhereChannel['platform']
export type Identity = ElsewhereItem['identity']
export type ElsewhereData = z.infer<typeof ElsewhereSchema>

export const ALL_PLATFORMS: Platform[] = [
  'bluesky', 'mastodon', 'pixelfed', 'instagram', 'pinterest', 'tiktok', 'youtube',
]

// ─── Data access ──────────────────────────────────────────────────────────────

const EMPTY: ElsewhereData = {
  schema_version: 1,
  generated_at: '1970-01-01T00:00:00Z',
  items: [],
  meta: {},
}

export function getElsewhereData(): ElsewhereData {
  const filePath = path.join(process.cwd(), 'content', '_elsewhere.json')
  if (!fs.existsSync(filePath)) return EMPTY
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    return ElsewhereSchema.parse(raw)
  } catch {
    return EMPTY
  }
}
