export const GEAR_CATEGORIES = [
  'cameras',
  'lenses',
  'lighting',
  'software',
  'accessories',
  'computer-storage',
] as const;

export const GEAR_CATEGORY_LABELS: Record<typeof GEAR_CATEGORIES[number], string> = {
  'cameras': 'Cameras',
  'lenses': 'Lenses',
  'lighting': 'Lighting',
  'software': 'Software',
  'accessories': 'Accessories',
  'computer-storage': 'Computer & Storage',
};

export type GearCategory = typeof GEAR_CATEGORIES[number];

export function isValidGearCategory(value: string): value is GearCategory {
  return (GEAR_CATEGORIES as readonly string[]).includes(value);
}
