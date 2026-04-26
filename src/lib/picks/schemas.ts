import { z } from 'zod';
import { PICKS_CATEGORIES } from './categories';

export const BrandSchema = z.object({
  name: z.string(),
  slug: z.string(),
  category: z.enum(PICKS_CATEGORIES),
  sub_lane: z.string().optional(),
  tag: z.string(),
  hook: z.string(),
  hero_image: z.string(),
  supporting_images: z.array(z.string()),
  makes: z.array(z.object({ label: z.string(), value: z.string() })),
  affiliate_url: z.string().url(),
  network: z.enum(['impact', 'partnerize']),
  related_slugs: z.array(z.string()).default([]),
  image_source: z.string(),
  image_license: z.string(),
  attribution: z.string().optional(),
});

export const LandingSchema = z.object({
  slug: z.literal('picks'),
  title: z.literal('Picks'),
  hero_image: z.string(),
});

export const CategoryIntroSchema = z.object({
  slug: z.enum(PICKS_CATEGORIES),
  title: z.string(),
  hero_image: z.string(),
});

export type Brand = z.infer<typeof BrandSchema> & { body: string };
export type Landing = z.infer<typeof LandingSchema> & { body: string };
export type CategoryIntro = z.infer<typeof CategoryIntroSchema> & { body: string };
