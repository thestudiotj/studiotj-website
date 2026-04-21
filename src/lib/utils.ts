const ROUTE_TITLE_STOPWORDS = new Set([
  'along', 'the', 'and', 'of', 'in', 'to', 'van', 'der', 'den', 'aan', 'at', 'by', 'on',
])

export function routeSlugToTitle(slug: string): string {
  return slug
    .split('-')
    .map((word, i) => {
      const lower = word.toLowerCase()
      if (i > 0 && ROUTE_TITLE_STOPWORDS.has(lower)) return lower
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}
