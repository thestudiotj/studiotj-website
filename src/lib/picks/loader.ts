import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { BrandSchema, LandingSchema, CategoryIntroSchema } from "./schemas";
import type { Brand, Landing, CategoryIntro } from "./schemas";
import { PICKS_CATEGORIES, type PicksCategory } from "./categories";

const CONTENT_DIR = path.join(process.cwd(), "content", "picks");

function readMdx(relPath: string): { data: Record<string, unknown>; content: string } {
  const fullPath = path.join(CONTENT_DIR, ...relPath.split("/"));
  const raw = fs.readFileSync(fullPath, "utf-8");
  const { data, content } = matter(raw);
  return { data: data as Record<string, unknown>, content };
}

export function loadLanding(): Landing {
  const { data, content } = readMdx("_landing.mdx");
  const fm = LandingSchema.parse(data);
  return { ...fm, body: content };
}

export function loadCategoryIntro(slug: string): CategoryIntro | null {
  const filePath = path.join(CONTENT_DIR, slug, "_intro.mdx");
  if (!fs.existsSync(filePath)) return null;
  const { data, content } = readMdx(`${slug}/_intro.mdx`);
  const fm = CategoryIntroSchema.parse(data);
  return { ...fm, body: content };
}

export function loadBrand(category: string, brandSlug: string): Brand {
  const { data, content } = readMdx(`${category}/${brandSlug}.mdx`);
  const fm = BrandSchema.parse(data);
  return { ...fm, body: content };
}

export function loadAllBrandsInCategory(category: string): Brand[] {
  const catDir = path.join(CONTENT_DIR, category);
  if (!fs.existsSync(catDir)) return [];
  const files = fs
    .readdirSync(catDir)
    .filter((f) => f.endsWith(".mdx") && f !== "_intro.mdx")
    .sort();
  return files.map((filename) => {
    const { data, content } = readMdx(`${category}/${filename}`);
    const fm = BrandSchema.parse(data);
    return { ...fm, body: content };
  });
}

export function loadActiveCategories(): PicksCategory[] {
  return PICKS_CATEGORIES.filter((cat) => {
    const catDir = path.join(CONTENT_DIR, cat);
    if (!fs.existsSync(catDir)) return false;
    const brandFiles = fs
      .readdirSync(catDir)
      .filter((f) => f.endsWith(".mdx") && f !== "_intro.mdx");
    return brandFiles.length > 0;
  });
}

export function loadAllBrands(): Brand[] {
  return PICKS_CATEGORIES.flatMap((cat) => loadAllBrandsInCategory(cat));
}
