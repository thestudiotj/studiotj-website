import { z } from "zod";

export const CATEGORIES = [
  "lezen",
  "verzorging",
  "fotografie",
  "amazon-direct",
  "lego",
  "film-en-anime",
  "games",
  "tekenen",
  "japans-leren",
  "home-media-hardware",
] as const;

export const VERZORGING_LANES = ["masc", "femme"] as const;
export const AMAZON_DIRECT_LANES = ["devices", "abonnementen"] as const;

const SubLane = z.enum(["masc", "femme", "devices", "abonnementen"]);

export const ProductFrontmatter = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  category: z.enum(CATEGORIES),
  sub_lane: SubLane.optional(),
  tag: z.string().min(1),
  hook: z.string().min(1),
  hero_image: z.string().min(1),
  supporting_images: z.array(z.string().min(1)).min(0),
  specs: z.array(z.object({ label: z.string(), value: z.string() })).min(0),
  amazon_url: z.string().min(1),
  related_slugs: z.array(z.string()).min(0),
  image_source: z.string().min(1),
  image_license: z.string().min(1),
  attribution: z.string().optional(),
});

export const LandingFrontmatter = z.object({
  slug: z.literal("vondsten"),
  title: z.string(),
  hero_image: z.string().min(1),
  type: z.literal("landing").optional(),
});

export const CategoryIntroFrontmatter = z.object({
  slug: z.enum(CATEGORIES),
  title: z.string(),
  hero_image: z.string().min(1),
  type: z.literal("category_intro").optional(),
});

export const ActieFrontmatter = z.object({
  name: z.string(),
  date_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  date_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  source: z.string(),
  display_label: z.string(),
  type: z.literal("actie").optional(),
});

export type Product = z.infer<typeof ProductFrontmatter> & { body: string; slug: string };
export type Landing = z.infer<typeof LandingFrontmatter> & { body: string };
export type CategoryIntro = z.infer<typeof CategoryIntroFrontmatter> & { body: string };
export type Actie = z.infer<typeof ActieFrontmatter> & { body: string };
