# StudioTJ — Phase 2 Session 3: `/journal` section

Website repo: `studiotj-website`. Next.js 14 App Router, Tailwind, Vercel. You've worked on this repo before — same conventions, same file layout.

This session builds the `/journal` section. Every architectural decision below has been locked in chat before this prompt was written. Don't re-decide; execute.

## Scope

1. **New schema file:** `public/journal.json` — flat photos array, populated manually in this session (the sorter feature that will eventually write to it isn't shipped yet).
2. **New loader:** `src/lib/journal.ts` — reads `journal.json`, exports photo-lookup helpers.
3. **New index route:** `app/journal/page.tsx` — reverse-chron grid of journal entries.
4. **New gallery route:** `app/journal/[slug]/page.tsx` — per-entry gallery template.
5. **New content:** two hand-authored MDX journal entries as proof. See "Proof entries" section.
6. **Lightbox inspection step** before touching the gallery template — details below.

## Out of scope (do not touch)

- `src/lib/content.ts` — stable, do not modify.
- The four generic MDX components (`Photo`, `PhotoRow`, `Video`, `Pullquote`) — do not add new ones, do not modify existing ones.
- Zod schema for journal frontmatter — already defined in `src/lib/content.ts` from Session 2. Do not modify.
- `src/lib/portfolio.ts` — journal has its own loader. Don't touch portfolio's.
- The `/blog` routes and templates — don't touch.
- The `/subtext-lab` stub — don't touch.
- Nav, footer, homepage — all deferred to Session 5.
- Sitemap, JSON-LD, image optimisation — all deferred to Session 6.
- No new npm dependencies except `react-masonry-css` (see Masonry section).

---

## Schema: `public/journal.json`

Create this file. Shape:

```json
{
  "version": "1.0",
  "photos": [
    {
      "id": "...",
      "url": "https://photos.studiotj.com/<shoot-folder>/<basename>.jpg",
      "thumbnail_url": "https://photos.studiotj.com/<shoot-folder>/<basename>-thumb.jpg",
      "hero_url": "https://photos.studiotj.com/<shoot-folder>/<basename>-hero.jpg",
      "title": "",
      "aspect_ratio": 1.5,
      "dominant_colors": ["#...", "#...", "#..."],
      "shoot_folder": "...",
      "date": "YYYY-MM-DD"
    }
  ]
}
```

Every field except `hero_url` mirrors the photo record shape already used inside `portfolio.json`. `hero_url` is new and points at the 1600px `-hero.jpg` variant that the upload script produces for every shoot post-Session-2. Do not derive it in code — write it explicitly into each record.

**Photo ID convention:** match whatever pattern `portfolio.json` already uses for photo `id`. Open `public/portfolio.json`, read the first few records, use the same format. Don't invent a new one.

---

## Loader: `src/lib/journal.ts`

Create. Exports:

- `getJournalPhoto(id: string): JournalPhoto | null` — single record lookup.
- `getJournalPhotos(ids: string[]): JournalPhoto[]` — ordered lookup by ID list. Preserves input order. Silently drops IDs that aren't found; console-warns in dev.
- TypeScript `JournalPhoto` interface matching the schema above.

Reads `public/journal.json` at build time via `fs`, same pattern as `src/lib/portfolio.ts`. Handles a missing file gracefully (returns empty state, not an error).

No Zod validation required for the photo records themselves — the schema is simple and hand-authored right now. Frontmatter validation already lives in `src/lib/content.ts` and stays there.

---

## Index route: `app/journal/page.tsx`

Server component. Uses `getAllPosts('journal')` from `src/lib/content.ts` — the loader already exists, already validates, already draft-filters in production.

### Layout

- Page heading: `Journal` (display font, same size convention as `/blog` index heading).
- Subhead, directly under heading, in `--fg-muted`:
  > Galleries from walks, trips, and visits. The four portfolio collections define what StudioTJ is; the journal is everything else worth keeping.
- Grid of entry cards below.

### Grid

- 2 columns mobile, 3 columns tablet (`md:`), 3 columns desktop (`lg:`).
- Reverse-chronological by frontmatter `date`.
- Card gap and page padding: match `/blog` index conventions.

### Entry card shape

```
[ thumbnail — cover-cropped to 3:2 aspect ]
Title                    (display font, regular weight)
20 Feb 2026 · Haarlem    (short-month form, --fg-muted, middot-separated, silent-drop)
```

- Thumbnail source: resolve `frontmatter.hero_photo_id` via `getJournalPhoto()`, use the record's `thumbnail_url` (600px variant). Use `object-fit: cover` on a 3:2 container — do NOT use the photo's native aspect ratio. Predictable grid rhythm matters more than per-card aspect fidelity on the index.
- While the thumb loads, render a gradient fallback from the photo's `dominant_colors` (same pattern as `CollectionCard`).
- Date format: `Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })` — `20 Feb 2026`.
- Location segment silent-drops if `frontmatter.location` is absent.
- Whole card is a link to `/journal/[slug]`. Hover state: subtle — slight accent tint on title, no dramatic transform. Match the tone of existing card hover states in the repo.

### Empty state

If `getAllPosts('journal')` returns an empty array, render:

> Nothing here yet — first gallery in progress.

In `--fg-muted`, in the same prose column as the subhead. No placeholder cards, no illustration.

### Index metadata

```ts
export const metadata = {
  title: 'Journal — StudioTJ',
  description: 'Photo galleries from walks, trips, and visits — the work beyond the four StudioTJ portfolio collections.',
  openGraph: {
    images: [ /* hero_url of the most recent published entry, if any */ ],
  },
};
```

If zero entries exist, drop `openGraph.images` (falls back to the site default).

---

## Gallery route: `app/journal/[slug]/page.tsx`

Server component. Uses `getPostBySlug('journal', slug)` from `src/lib/content.ts`.

### Lightbox inspection step — DO THIS FIRST

Before you write the gallery template, open `src/components/Lightbox.tsx` and read it. Report back in your response:

1. What props does the component accept?
2. Is it coupled to `portfolio.json`'s collection structure (e.g. expects a `collection` object prop), or does it take a generic `photos[]` array?
3. What does it show as the "where you are" label (currently shows collection name on portfolio pages)?

Then pick one of:

- **If it's already generic** (accepts `photos[]` + a label string): import it, pass the journal entry's resolved photo array and the entry's `title` as the label. Done.
- **If it's tightly coupled to portfolio collections**: STOP, don't refactor in this session. Report the coupling shape in your response, and I'll decide in chat whether to refactor now or ship the gallery without a lightbox for v1.

Do NOT build a new lightbox component. Reuse or escalate.

### Gallery page layout

In order, top to bottom:

1. **Back-link**: `← Journal`, linking to `/journal`. Small-caps tracking-widest, `--fg-muted`, hover shifts to `--accent`. Same styling as the `/blog` essay back-link.
2. **Hero photo**: full-bleed width, resolved from `frontmatter.hero_photo_id` → `hero_url`. Native aspect ratio (do NOT banner-crop). `max-height: 75vh` so portrait heroes don't eat the viewport. `object-fit: contain` against a subtle `--bg` background so letterboxing reads intentional.
3. **Title**: display font, regular weight, centered below hero.
4. **Metadata strip**: centered below title. Format:
   ```
   20 February 2026 · Haarlem · 13 April 2026
   ```
   That is `date · location? · shoot_date?`. Rules:
   - Long-month form (`20 February 2026`), not short-month.
   - Middot separator between adjacent present segments only.
   - `location` silent-drops if absent.
   - `shoot_date` silent-drops if absent OR if `shoot_date === date` (dedup rule — equal dates means same-day publication, no need to show twice).
   - `--fg-muted`, small-caps or regular case (match `/blog` essay strip).
5. **Optional MDX body** (from the `.mdx` file's prose content, if any): renders above the photo grid. Uses `<MDXRemote components={mdxComponents} />`. Styled with `prose prose-lg max-w-none` + the Session-2.5 typography overrides. Constrain prose column to the same max-width as `/blog` essay prose (do not span full page width).
6. **Photo grid**: masonry, full width within the page padding container. Built from `frontmatter.photo_ids[]` resolved via `getJournalPhotos()`. Uses `thumbnail_url` (600px variants) for the grid images. Order is `photo_ids[]` order — do NOT re-sort.

### Masonry

Use `react-masonry-css`. Add to `package.json`:

```bash
npm install react-masonry-css
```

Configuration:

- Desktop: 3 columns
- Tablet: 2 columns
- Mobile: 1 column

Gap between items: match the `/portfolio/[slug]` collection gallery gap (read it from there). Each grid photo is a clickable thumbnail that opens the lightbox at that photo's index.

### Gallery page metadata (`generateMetadata`)

Same shape as Session 2.5's essay metadata:

- `title`: frontmatter `title` (no suffix — site title handled at layout level, verify against `/blog` essay metadata).
- `description`: frontmatter `summary`.
- `openGraph.images`: `[hero_url]` resolved from `hero_photo_id`.

If the resolved `hero_url` is null (ID not found in `journal.json`), omit `openGraph.images` and console-warn in dev.

### 404 handling

If `getPostBySlug('journal', slug)` returns null, call `notFound()` from `next/navigation`. Same pattern as `/blog/[slug]`.

---

## Proof entries

Hand-author two MDX journal entries as proof the templates render. Both ship with `draft: true` so they don't appear on the live index until T.J. reviews them. Both summaries explicitly marked as test data.

### Entry 1: Maastricht ENCI

- File: `content/journal/maastricht-enci.mdx`
- Search `public/portfolio.json` for photos whose `shoot_folder` matches the Maastricht ENCI shoot. The local export folder is named `2025-02-08-Maastricht-export` — the R2 `shoot_folder` value likely matches this or a close variant. Confirm by reading `portfolio.json`.
- Pick **10 photos** in chronological order. Chronological means: sort by the photo record's `date` field ascending; if multiple photos share the same date, sort by `id` or filename ascending as tiebreak.
- Copy those 10 photo records from `portfolio.json` into `public/journal.json`. Add the `hero_url` field to each — derive it by replacing `.jpg` with `-hero.jpg` in the `url` (the upload script produces this variant for every shoot). Keep every other field identical.
- Frontmatter:
  ```yaml
  ---
  title: Maastricht ENCI
  date: 2026-04-14
  summary: "Test entry — placeholder prose, real photos from the ENCI quarry shoot."
  hero_photo_id: <id of the first chronological photo>
  photo_ids:
    - <id 1>  # chronological order, first shot of the day to last
    - <id 2>
    - ... 10 total
  location: Maastricht
  shoot_date: <the actual shoot date from the photo records>
  draft: true
  ---
  ```
- Body: 2–3 short paragraphs of placeholder prose. Make clear in the prose itself that it's placeholder ("Placeholder prose for template verification. Real text lands in a later pass."). Do not invent factual content about the ENCI quarry or the shoot. Do not try to be poetic or evocative — dry, factual, brief.

### Entry 2: Haarlem

- File: `content/journal/haarlem.mdx`
- Search `public/portfolio.json` for photos in the May 2025 Haarlem shoot. Folder is likely `2025-05-23-haarlem-export` or close variant — confirm in the file.
- **Do NOT pull from the April 2026 Haarlem shoot.** There's an open watch-item about that shoot's presence in `portfolio.json` — stay away from it.
- Pick **10 photos** in chronological order, **excluding** any photos already referenced in `content/blog/haarlem-walked-slowly.mdx` (open that file, read the R2 paths or photo IDs it references, exclude them).
- Copy those 10 records into `journal.json`. Same `hero_url` derivation rule.
- Frontmatter:
  ```yaml
  ---
  title: Haarlem
  date: 2026-04-14
  summary: "Test entry — placeholder prose, real photos from the May 2025 Haarlem walk."
  hero_photo_id: <id of the first chronological photo>
  photo_ids:
    - <id 1>  # chronological, first to last
    - ...
  location: Haarlem
  shoot_date: 2025-05-23
  draft: true
  ---
  ```
- Body: same placeholder convention as Maastricht entry.

### Shortfall handling

If either shoot has fewer than 10 eligible photos, **surface the shortfall in your response before writing any files**. Do not pad with photos from a different shoot, do not silently ship fewer than 10. Report the exact count per shoot and wait for direction. This is important — test data padding from the wrong shoot defeats the point of testing grid rendering against real chronological sequences.

### Uniqueness note

Normal rule is that a `photo_id` exists in exactly one of `portfolio.json` or `journal.json`. These test entries deliberately violate that rule because the sorter journal-tag feature (which would populate `journal.json` with photos that never entered `portfolio.json`) hasn't shipped yet. The uniqueness check doesn't exist in upload-script code yet, so nothing blocks these commits. The violation is flagged in each entry's summary and will be resolved when the test entries are replaced with real journal content later.

---

## Verification before commit

1. `npm run build` — must pass. Expect the Stripe module-level init watch-item to surface; workaround is a dummy `STRIPE_SECRET_KEY` in `.env.local` (gitignored). If this is a fresh environment without `.env.local`, add the dummy key.
2. `/journal` renders with both entry cards in reverse-chron order.
3. Clicking a card navigates to `/journal/[slug]` and renders the full gallery.
4. Lightbox opens from grid click (or the lightbox-escalation report is in your response).
5. Set one entry to `draft: false` locally (do NOT commit that change — just test) and verify it disappears from the index in production mode via `npm run build && npm run start`. Revert.
6. `npm run lint` clean.

---

## Commit

One commit at the end, message:

```
feat: /journal index + gallery template + journal.json + two proof entries

- Add public/journal.json schema + two populated entries (Maastricht ENCI, Haarlem)
- Add src/lib/journal.ts loader (getJournalPhoto, getJournalPhotos)
- Add app/journal/page.tsx (reverse-chron grid, 2/3/3, title-below cards)
- Add app/journal/[slug]/page.tsx (full-bleed hero, metadata strip, react-masonry-css grid, lightbox reuse)
- Add react-masonry-css dependency
- Author content/journal/maastricht-enci.mdx + haarlem.mdx as test entries (draft: true, placeholder prose, 10 photos each)
```

Both proof entries ship with `draft: true`. The live deploy won't show them until T.J. flips the flag. Verified by `npm run build`.

---

## Things to surface in your response

Before I review, put in your response:

1. The lightbox inspection findings (props, coupling, label slot).
2. The photo-ID format you found in `portfolio.json` (one example is enough).
3. The two shoot_folder values you matched (Maastricht ENCI and May 2025 Haarlem).
4. Any shortfall counts if either shoot had fewer than 10 eligible photos.
5. The list of photo IDs excluded from the Haarlem entry because they're already used in `haarlem-walked-slowly.mdx`.

If any of those surface a genuine blocker (e.g. lightbox is tightly coupled to collections, or a shoot has 4 eligible photos), STOP before writing template code and wait for direction.
