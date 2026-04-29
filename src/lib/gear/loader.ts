import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { ItemSchema, LandingSchema, CategoryIntroSchema } from "./schemas";
import type { Item, Landing, CategoryIntro } from "./schemas";
import { GEAR_CATEGORIES, type GearCategory } from "./categories";

const CONTENT_DIR = path.join(process.cwd(), "content", "gear");

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

export function loadItem(category: string, itemSlug: string): Item {
  const { data, content } = readMdx(`${category}/${itemSlug}.mdx`);
  const fm = ItemSchema.parse(data);
  return { ...fm, slug: itemSlug, body: content };
}

export function loadAllItemsInCategory(category: string): Item[] {
  const catDir = path.join(CONTENT_DIR, category);
  if (!fs.existsSync(catDir)) return [];
  const files = fs
    .readdirSync(catDir)
    .filter((f) => f.endsWith(".mdx") && f !== "_intro.mdx")
    .sort();
  return files.map((filename) => {
    const slug = filename.replace(/\.mdx$/, "");
    const { data, content } = readMdx(`${category}/${filename}`);
    const fm = ItemSchema.parse(data);
    return { ...fm, slug, body: content };
  });
}

export function loadActiveCategories(): GearCategory[] {
  return GEAR_CATEGORIES.filter((cat) => {
    const catDir = path.join(CONTENT_DIR, cat);
    if (!fs.existsSync(catDir)) return false;
    const itemFiles = fs
      .readdirSync(catDir)
      .filter((f) => f.endsWith(".mdx") && f !== "_intro.mdx");
    return itemFiles.length > 0;
  });
}

export function loadAllItems(): Item[] {
  return GEAR_CATEGORIES.flatMap((cat) => loadAllItemsInCategory(cat));
}
