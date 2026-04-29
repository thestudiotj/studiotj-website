export const PICKS_CATEGORIES = [
  'photography',
  'video',
  'writing',
  'software',
  'drawing',
  'site-workflow',
  'workspace',
  'print',
] as const;

export const PICKS_CATEGORY_LABELS: Record<typeof PICKS_CATEGORIES[number], string> = {
  'photography': 'Photography',
  'video': 'Video',
  'writing': 'Writing',
  'software': 'Software',
  'drawing': 'Drawing',
  'site-workflow': 'Site & Workflow',
  'workspace': 'Workspace',
  'print': 'Print',
};

export type PicksCategory = typeof PICKS_CATEGORIES[number];

export function isValidPicksCategory(value: string): value is PicksCategory {
  return (PICKS_CATEGORIES as readonly string[]).includes(value);
}
