import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { BrandSchema, BrandProductSchema, LandingSchema, CategoryIntroSchema } from "./schemas";
import type { Brand, BrandProduct, Landing, CategoryIntro } from "./schemas";
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
  // Directory layout: {category}/{brand}/_brand.mdx
  const dirPath = path.join(CONTENT_DIR, category, brandSlug, "_brand.mdx");
  if (fs.existsSync(dirPath)) {
    const { data, content } = readMdx(`${category}/${brandSlug}/_brand.mdx`);
    const fm = BrandSchema.parse(data);
    return { ...fm, body: content };
  }
  // Flat file layout: {category}/{brand}.mdx
  const { data, content } = readMdx(`${category}/${brandSlug}.mdx`);
  const fm = BrandSchema.parse(data);
  return { ...fm, body: content };
}

export function loadAllBrandsInCategory(category: string): Brand[] {
  const catDir = path.join(CONTENT_DIR, category);
  if (!fs.existsSync(catDir)) return [];

  const brands: Brand[] = [];
  const entries = fs.readdirSync(catDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith(".mdx") && entry.name !== "_intro.mdx") {
      const { data, content } = readMdx(`${category}/${entry.name}`);
      const fm = BrandSchema.parse(data);
      brands.push({ ...fm, body: content });
    } else if (entry.isDirectory()) {
      const brandFile = path.join(catDir, entry.name, "_brand.mdx");
      if (fs.existsSync(brandFile)) {
        const { data, content } = readMdx(`${category}/${entry.name}/_brand.mdx`);
        const fm = BrandSchema.parse(data);
        brands.push({ ...fm, body: content });
      }
    }
  }

  return brands.sort((a, b) => a.slug.localeCompare(b.slug));
}

export function loadActiveCategories(): PicksCategory[] {
  return PICKS_CATEGORIES.filter((cat) => {
    const catDir = path.join(CONTENT_DIR, cat);
    if (!fs.existsSync(catDir)) return false;
    const entries = fs.readdirSync(catDir, { withFileTypes: true });
    const hasBrandFiles = entries.some(
      (e) => e.isFile() && e.name.endsWith(".mdx") && e.name !== "_intro.mdx"
    );
    const hasBrandDirs = entries.some(
      (e) => e.isDirectory() && fs.existsSync(path.join(catDir, e.name, "_brand.mdx"))
    );
    return hasBrandFiles || hasBrandDirs;
  });
}

export function loadAllBrands(): Brand[] {
  return PICKS_CATEGORIES.flatMap((cat) => loadAllBrandsInCategory(cat));
}

export function loadBrandProducts(category: string, brandSlug: string): BrandProduct[] {
  const brandDir = path.join(CONTENT_DIR, category, brandSlug);
  if (!fs.existsSync(brandDir)) return [];

  const files = fs
    .readdirSync(brandDir)
    .filter((f) => f.endsWith(".mdx") && f !== "_brand.mdx")
    .sort();

  const products: BrandProduct[] = [];
  for (const filename of files) {
    try {
      const { data, content } = readMdx(`${category}/${brandSlug}/${filename}`);
      const fm = BrandProductSchema.parse(data);
      products.push({ ...fm, body: content });
    } catch {
      // Skip files that don't conform to BrandProduct schema
    }
  }

  return products.sort((a, b) => a.display_order - b.display_order);
}

export function loadBrandProduct(
  category: string,
  brandSlug: string,
  productSlug: string
): BrandProduct | null {
  const filePath = path.join(CONTENT_DIR, category, brandSlug, `${productSlug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  try {
    const { data, content } = readMdx(`${category}/${brandSlug}/${productSlug}.mdx`);
    const fm = BrandProductSchema.parse(data);
    return { ...fm, body: content };
  } catch {
    return null;
  }
}

export function getEffectiveAffiliateUrl(product: BrandProduct, brand: Brand): string {
  return product.affiliate_url ?? brand.affiliate_url;
}
