import fs from "fs";
import path from "path";
import matter from "gray-matter";
import {
  ProductFrontmatter,
  LandingFrontmatter,
  CategoryIntroFrontmatter,
  ActieFrontmatter,
} from "./schemas";
import type { Product, Landing, CategoryIntro, Actie } from "./schemas";

const CONTENT_DIR = path.join(process.cwd(), "content", "vondsten");

function walkDir(dir: string, basePath = ""): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const relPath = basePath ? `${basePath}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...walkDir(path.join(dir, entry.name), relPath));
    } else if (entry.name.endsWith(".mdx")) {
      files.push(relPath);
    }
  }
  return files;
}

type PathType = "landing" | "actie" | "category_intro" | "product" | null;

function dispatchPath(filePath: string): PathType {
  if (filePath === "_landing.mdx") return "landing";
  if (filePath.startsWith("_acties/") && filePath.endsWith(".mdx")) return "actie";
  if (filePath.endsWith("/_intro.mdx")) return "category_intro";
  if (/^[^/]+\/[^_][^/]+\.mdx$/.test(filePath)) return "product";
  return null;
}

function readMdx(relPath: string): { data: Record<string, unknown>; content: string } {
  const fullPath = path.join(CONTENT_DIR, ...relPath.split("/"));
  const raw = fs.readFileSync(fullPath, "utf-8");
  const { data, content } = matter(raw);
  return { data: data as Record<string, unknown>, content };
}

export function getLanding(): Landing {
  const { data, content } = readMdx("_landing.mdx");
  const fm = LandingFrontmatter.parse(data);
  return { ...fm, body: content };
}

export function getActies(): Actie[] {
  const allFiles = walkDir(CONTENT_DIR);
  return allFiles
    .filter((f) => dispatchPath(f) === "actie")
    .map((f) => {
      const { data, content } = readMdx(f);
      const fm = ActieFrontmatter.parse(data);
      return { ...fm, body: content };
    });
}

export function getActiveActies(today: Date = new Date()): Actie[] {
  const todayStr = today.toISOString().slice(0, 10);
  return getActies().filter(
    (a) => todayStr >= a.date_start && todayStr <= a.date_end
  );
}

export function getCategoryIntro(category: string): CategoryIntro {
  const { data, content } = readMdx(`${category}/_intro.mdx`);
  const fm = CategoryIntroFrontmatter.parse(data);
  return { ...fm, body: content };
}

export function getProducts(category: string): Product[] {
  const catDir = path.join(CONTENT_DIR, category);
  if (!fs.existsSync(catDir)) return [];
  const files = fs
    .readdirSync(catDir)
    .filter((f) => f.endsWith(".mdx") && f !== "_intro.mdx")
    .sort();
  return files.map((filename) => {
    const { data, content } = readMdx(`${category}/${filename}`);
    const fm = ProductFrontmatter.parse(data);
    return { ...fm, body: content };
  });
}

export function getProduct(category: string, slug: string): Product | null {
  const fullPath = path.join(CONTENT_DIR, category, `${slug}.mdx`);
  if (!fs.existsSync(fullPath)) return null;
  const { data, content } = readMdx(`${category}/${slug}.mdx`);
  const fm = ProductFrontmatter.parse(data);
  return { ...fm, body: content };
}

export function getAllProducts(): Product[] {
  const allFiles = walkDir(CONTENT_DIR);
  return allFiles
    .filter((f) => dispatchPath(f) === "product")
    .sort()
    .map((f) => {
      const { data, content } = readMdx(f);
      const fm = ProductFrontmatter.parse(data);
      return { ...fm, body: content };
    });
}

export function getRelatedProducts(product: Product): Product[] {
  return product.related_slugs
    .map((slug) => getProduct(product.category, slug))
    .filter((p): p is Product => p !== null);
}
