# Products

Static catalogue, MDX with frontmatter. Schema authority lives in `src/lib/catalogue/types.ts`.

Files are named by product `id` (slug). One product per file. Frontmatter holds all structured fields; body is reserved for future rich product copy and stays empty for now.

Adding a product: copy an existing file, update frontmatter, commit. Vercel rebuilds and the new product appears on `/shop`.

Setting `available: false` soft-disables a product without deletion. Use this for staging products through Session 12a curation, or for retiring products without losing the URL.

> **Placeholders**: files under `public/placeholder/` are temporary stand-ins for `hero_image` paths. Remove and replace with real product imagery before setting a product to `available: true`.
