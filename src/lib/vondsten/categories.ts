import { CATEGORIES } from "./schemas";

export type Category = typeof CATEGORIES[number];

export const CATEGORY_DISPLAY: Record<Category, string> = {
  lezen: "Lezen",
  verzorging: "Verzorging",
  fotografie: "Fotografie",
  "amazon-direct": "Amazon Direct",
  lego: "LEGO",
  "film-en-anime": "Film & Anime",
  games: "Games",
  tekenen: "Tekenen",
  "japans-leren": "Japans leren",
  "home-media-hardware": "Home & Media Hardware",
};

export function isValidCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}
