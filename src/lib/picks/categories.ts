export const PICKS_CATEGORIES = [
  'photography',
  'drawing',
  'software',
  'print',
  'site-workflow',
  'workspace',
] as const;

export const PICKS_CATEGORY_LABELS: Record<typeof PICKS_CATEGORIES[number], string> = {
  'photography': 'Photography',
  'drawing': 'Drawing',
  'software': 'Software',
  'print': 'Print',
  'site-workflow': 'Site & Workflow',
  'workspace': 'Workspace',
};

export type PicksCategory = typeof PICKS_CATEGORIES[number];

export function isValidPicksCategory(value: string): value is PicksCategory {
  return (PICKS_CATEGORIES as readonly string[]).includes(value);
}
