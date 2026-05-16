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
  hero_aspect: z.string().optional(),
  supporting_images: z.array(z.string()),
  makes: z.array(z.object({ label: z.string(), value: z.string() })),
  affiliate_url: z.string().url(),
  network: z.enum(['impact', 'partnerize']),
  related_slugs: z.array(z.string()).default([]),
  image_source: z.string(),
  image_license: z.string(),
  attribution: z.string().optional(),
  impact_catalog_id: z.string().optional(),
});

export const BrandProductSchema = z.object({
  title: z.string(),
  slug: z.string(),
  brand_slug: z.string(),
  category: z.string(),
  product_line: z.string().optional(),
  release_year: z.number().int().optional(),
  display_order: z.number().int(),
  featured: z.boolean(),
  tag: z.string().optional(),
  hook: z.string().optional(),
  hero_image: z.string().optional(),
  hero_aspect: z.string().optional(),
  hero_image_alt: z.string().optional(),
  image_source: z.string().optional(),
  image_license: z.string().optional(),
  attribution: z.string().optional(),
  description: z.string(),
  affiliate_url: z.string().url().optional(),
  specs: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
  impact_catalog_item_id: z.string().optional(),
  supporting_images: z.array(z.string()).optional(),
  related_slugs: z.array(z.string()).default([]),
});

export const LandingSchema = z.object({
  slug: z.literal('picks'),
  title: z.literal('Picks'),
  description: z.string().optional(),
  hero_image: z.string(),
});

export const CategoryIntroSchema = z.object({
  slug: z.enum(PICKS_CATEGORIES),
  title: z.string(),
  description: z.string().optional(),
  hero_image: z.string().optional(),
});

export const ArticleSchema = z.object({
  title: z.string(),
  slug: z.string(),
  description: z.string(),
  published_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'published_date must be YYYY-MM-DD'),
  hero_image: z.string(),
  hero_image_alt: z.string(),
  hero_aspect: z.enum(['3:2', '1:1']).optional(),
  related_brands: z.array(z.string()).default([]),
  related_articles: z.array(z.string()).default([]),
  image_source: z.string(),
  image_license: z.string(),
  attribution: z.string().optional(),
});

export const ArticleIndexSchema = z.object({
  slug: z.literal('articles'),
  title: z.literal('Articles'),
  hero_image: z.string().optional(),
});

export type Brand = z.infer<typeof BrandSchema> & { body: string };
export type BrandProduct = z.infer<typeof BrandProductSchema> & { body: string };
export type Landing = z.infer<typeof LandingSchema> & { body: string };
export type CategoryIntro = z.infer<typeof CategoryIntroSchema> & { body: string };
export type Article = z.infer<typeof ArticleSchema> & { body: string };
export type ArticleIndex = z.infer<typeof ArticleIndexSchema> & { body: string };
