import { z } from 'zod';
import { GEAR_CATEGORIES } from './categories';

export const ItemSchema = z.object({
  name: z.string(),
  slug: z.string().optional(),
  category: z.enum(GEAR_CATEGORIES),
  status: z.string(),
  tag: z.string().optional(),
  summary: z.string(),
  hero_image: z.string().optional(),
  supporting_images: z.array(z.string()).default([]),
  specs: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
  related_slugs: z.array(z.string()).default([]),
  image_source: z.string().optional(),
  image_license: z.string().optional(),
  attribution: z.string().optional(),
  affiliate_link: z.string().optional(),
  affiliate_provider: z.string().optional(),
  date_added: z.string().optional(),
});

// slug always present on loaded items — derived from filename
export type Item = z.infer<typeof ItemSchema> & { body: string; slug: string };

export const LandingSchema = z.object({
  slug: z.literal('gear'),
  title: z.literal('My Gear'),
  description: z.string().optional(),
  hero_image: z.string(),
});

export type Landing = z.infer<typeof LandingSchema> & { body: string };

export const CategoryIntroSchema = z.object({
  slug: z.enum(GEAR_CATEGORIES),
  title: z.string(),
  hero_image: z.string().optional(),
});

export type CategoryIntro = z.infer<typeof CategoryIntroSchema> & { body: string };
