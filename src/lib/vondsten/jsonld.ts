import { resolveR2 } from "./paths";
import type { Product } from "./schemas";

function deriveBrandFromName(name: string): string {
  const knownBrands = ["Kobo", "Kindle", "LEGO", "Rituals"];
  for (const brand of knownBrands) {
    if (name.includes(brand)) return brand;
  }
  return name.split(" ")[0];
}

function firstParagraph(body: string): string {
  const lines = body.trim().split(/\n+/);
  for (const line of lines) {
    const clean = line.trim();
    if (clean && !clean.startsWith("#") && !clean.startsWith("<")) {
      return clean.split(".")[0] + ".";
    }
  }
  return "";
}

export function buildProductJsonLd(product: Product): object {
  return {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    image: [
      resolveR2(product.hero_image),
      ...product.supporting_images.map(resolveR2),
    ],
    description: product.hook + " — " + firstParagraph(product.body),
    brand: {
      "@type": "Brand",
      name: deriveBrandFromName(product.name),
    },
    url: product.amazon_url,
  };
}
