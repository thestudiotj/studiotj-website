import { z } from 'zod';
import { GEAR_CATEGORIES } from './categories';

export const ItemSchema = z.object({
  name: z.string(),
  slug: z.string(),
  category: z.enum(GEAR_CATEGORIES),
  status: z.enum(['current', 'wishlist']),
  tag: z.string().optional(),
  hook: z.string(),
  hero_image: z.string(),
  supporting_images: z.array(z.string()).default([]),
  specs: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
  related_slugs: z.array(z.string()).default([]),
  image_source: z.string(),
  image_license: z.string(),
  attribution: z.string().optional(),
});

export type Item = z.infer<typeof ItemSchema> & { body: string };

export const LandingSchema = z.object({
  slug: z.literal('gear'),
  title: z.literal('My Gear'),
  hero_image: z.string(),
});

export type Landing = z.infer<typeof LandingSchema> & { body: string };

export const CategoryIntroSchema = z.object({
  slug: z.enum(GEAR_CATEGORIES),
  title: z.string(),
  hero_image: z.string().optional(),
});

export type CategoryIntro = z.infer<typeof CategoryIntroSchema> & { body: string };
