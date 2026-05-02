import imageRegistry from '@content/_image-registry.json';

type AspectInfo = { aspect: string; width: number; height: number };

const ROLE_DEFAULTS: Record<string, string> = {
  hero: '4 / 5',
  supporting: '1 / 1',
  intro: '3 / 2',
  thumb: '4 / 5',
};

export function resolveAspect(
  imagePath: string,
  role: 'hero' | 'supporting' | 'intro' | 'thumb',
  schemaOverride?: string,
): string {
  if (schemaOverride) return schemaOverride.replace(':', ' / ');
  // Strip leading slash to match registry key format (picks/...)
  const key = imagePath.replace(/^\//, '');
  const entry = (imageRegistry as Record<string, AspectInfo>)[key];
  if (entry) return entry.aspect.replace(':', ' / ');
  return ROLE_DEFAULTS[role];
}
