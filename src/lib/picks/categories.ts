export const PICKS_CATEGORIES = [
  'photography',
  'video',
  'audio',
  'writing',
  'software',
  'drawing',
  'design',
  'site-workflow',
  'workspace',
  'print',
  'gaming',
] as const;

export const PICKS_CATEGORY_LABELS: Record<typeof PICKS_CATEGORIES[number], string> = {
  'photography': 'Photography',
  'video': 'Video',
  'audio': 'Audio',
  'writing': 'Writing',
  'software': 'Software',
  'drawing': 'Drawing',
  'design': 'Design',
  'site-workflow': 'Site & Workflow',
  'workspace': 'Workspace',
  'print': 'Print',
  'gaming': 'Gaming',
};

export type PicksCategory = typeof PICKS_CATEGORIES[number];

export function isValidPicksCategory(value: string): value is PicksCategory {
  return (PICKS_CATEGORIES as readonly string[]).includes(value);
}
