import { CATEGORIES } from "./schemas";

export type Category = typeof CATEGORIES[number];

export const CATEGORY_DISPLAY: Record<Category, string> = {
  lezen: "Lezen",
  "dames-verzorging": "Dames-verzorging",
  "amazon-direct": "Amazon Direct",
  "heren-verzorging": "Heren-verzorging",
  lego: "LEGO",
  "home-media-hardware": "Home & Media Hardware",
  gaming: "Gaming",
  fotografie: "Fotografie",
  film: "Film",
  muziek: "Muziek",
  schrijven: "Schrijven",
  tekenen: "Tekenen",
  anime: "Anime",
  manga: "Manga",
  pokemon: "Pokémon",
  gundam: "Gundam",
  "fidget-toys": "Fidget toys",
  "taal-leren": "Taal leren",
};

export function isValidCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}
