# Session 4 — `/subtext-lab` index + templates (Code prompt)

Repo: `thestudiotj/studiotj-website` · Next.js 14 App Router · Vercel.

This session builds the `/subtext-lab` section on top of the MDX foundation shipped in Session 2, the shared template patterns locked in Session 2.5 (`/blog` note + essay), and the journal-specific patterns from Session 3 (not applicable here). The loader, generic MDX components, and theme override are already live — this session consumes them.

Read `CLAUDE.md` at repo root for technical conventions. Below is everything locked in the chat session that produced this prompt. Do not re-decide; if something is ambiguous below, stop and ask.

---

## Scope summary

1. Schema change in `src/lib/content.ts` — Subtext Lab discriminator becomes `"essay" | "article" | "video"`.
2. Shared `summary` auto-derive helper — applied to Subtext Lab *and* `/blog`.
3. `<Video>` component in `src/components/mdx/Video.tsx` — extend to click-to-play by default, site-wide.
4. New click-to-play hero component for the Subtext Lab `video` type surface (or `<Video>` reused with a wrapper — your call, as long as there is one shared click-to-play behaviour between inline and hero).
5. Replace stub `app/subtext-lab/page.tsx` with real index.
6. `app/subtext-lab/[slug]/page.tsx` — three template branches: `essay`, `article`, `video`.
7. Hand-authored proof entry — `content/subtext-lab/rewatching.mdx` (full body supplied below).

Out of scope: anything under `/blog`, `/journal`, `/gear`; nav changes; homepage Latest strip; SEO infrastructure; new MDX components beyond the click-to-play work; theme override changes.

---

## Scope exceptions to note explicitly

Three things this session touches that were previously declared stable:

- **`src/lib/content.ts`** — Subtext Lab Zod schema changes (discriminator expanded from 2 to 3 values; per-type validation rules for `hero`, `video_embed`, `video_poster`; `summary` becomes optional). Blog schema gets its `summary` field flipped to optional too, as part of the shared auto-derive helper. No other sections touched.
- **`src/components/mdx/Video.tsx`** — click-to-play becomes the default. Any existing call sites inherit the new behaviour. No new autoplay; click is the user's consent.
- **Shared helper location** — put the summary auto-derive in `src/lib/content.ts` alongside `getReadingTime` (same family of utilities).

---

## 1. Schema change — Subtext Lab discriminator + validation

In `src/lib/content.ts`, the Subtext Lab schema moves to a discriminated union over `type: "essay" | "article" | "video"`. Per-type shape:

### `essay`
```yaml
type: "essay"
title: string
date: string (ISO)
summary?: string        # optional — auto-derived if absent
hero?: string           # optional — R2 URL to the -hero.jpg file
subjects: Subject[]     # required, ≥1, values from SUBJECTS enum
draft: boolean
```
Reject `video_embed` and `video_poster` on this branch.

### `article`
```yaml
type: "article"
title: string
date: string
summary?: string
subjects: Subject[]
draft: boolean
```
Reject `hero`, `video_embed`, `video_poster` on this branch.

### `video`
```yaml
type: "video"
title: string
date: string
summary?: string
video_embed: string     # 11-char YouTube ID, e.g. "dQw4w9WgXcQ"
video_poster: string    # R2 URL, photos.studiotj.com/video-posters/<slug>.jpg
subjects: Subject[]
draft: boolean
```
Reject `hero` on this branch. `video_embed` and `video_poster` are both required together (the discriminated union enforces this structurally — they're part of this branch's schema, not optional).

### Subjects

Keep the existing `SUBJECTS` const and `Subject` type as-is. Add a minimum-length validation: `subjects: z.array(z.enum(SUBJECTS)).min(1)`. Empty `subjects: []` is invalid and must hard-error at load time.

### YouTube ID validation

Validate `video_embed` as an 11-char YouTube ID via regex. Expected shape: `/^[A-Za-z0-9_-]{11}$/`. Reject URLs, query strings, embed codes — the field is ID-only by convention.

### Blog schema companion change

In the same file, flip Blog's `summary` field from required to optional. This is the only change to the Blog schema; discriminator, tags, and everything else stay as-is.

---

## 2. `summary` auto-derive helper

New utility in `src/lib/content.ts`:

```ts
export function deriveSummary(mdxBody: string, maxChars = 155): string {
  // 1. Strip MDX component tags (<Photo ... />, <Pullquote>...</Pullquote>, etc.)
  // 2. Strip markdown syntax (headings #, emphasis * _, links [x](y), code `x`, images ![x](y))
  // 3. Collapse whitespace
  // 4. Take first maxChars
  // 5. Trim to last complete word boundary
  // 6. Append "…" (single ellipsis char) if truncated
}
```

Consumers:
- `getPostBySlug('subtext-lab' | 'blog', slug)` should expose both the frontmatter and the derived summary so templates can render without re-parsing. Cleanest shape: the returned object includes a `summary` field that is `frontmatter.summary ?? deriveSummary(body)`. Templates and `generateMetadata` both consume this.
- `getAllPosts('subtext-lab' | 'blog')` likewise includes derived summary on each entry so the index card rendering is straightforward.

Do not apply auto-derive to `/journal` or `/gear` — their summary semantics are different (journal `summary` is required per current schema; gear has no `summary` field).

---

## 3. `<Video>` click-to-play

`src/components/mdx/Video.tsx` currently auto-loads the `youtube-nocookie.com` iframe. Change to click-to-play by default:

- Initial state renders a 16:9 container showing a YouTube thumbnail (hotlinked from `https://i.ytimg.com/vi/<id>/hqdefault.jpg` for the inline MDX use case — this is the existing pattern; don't change it here, the Subtext Lab video *hero* surface uses the self-hosted `video_poster` which is different).
- Centred play-triangle overlay in `var(--accent)` on a semi-transparent dark scrim for legibility against any thumbnail.
- Click swaps the poster for the `youtube-nocookie.com` iframe with `autoplay=1` (the click is the consent).
- Fixed 16:9 aspect via CSS; no layout shift on swap.
- State: single `useState` boolean, initial `false`. `'use client'` at top of file.

The component must continue accepting its existing props (probably a YouTube URL or ID — match whatever the current API is). Don't break its existing call sites.

---

## 4. Click-to-play video hero for `/subtext-lab` `video` type

The `video` type's hero surface is full-width, above the title block, same visual footprint as an essay's `-hero.jpg` hero. It uses `video_poster` (self-hosted on R2) rather than `i.ytimg.com`, because Subtext Lab video posters are author-uploaded.

Implementation flexibility: you can either
- (a) extend `<Video>` to accept an optional `poster` prop that overrides the hotlinked thumbnail, and have the hero call `<Video>` with the full-width wrapper; or
- (b) create a thin `<VideoHero>` component that shares the click-to-play state logic with `<Video>` via a shared hook.

Pick whichever keeps the click-to-play behaviour in one place. Don't reimplement the state toggle twice.

Hero-surface rendering:
- Full-width, above the title block.
- `video_poster` loaded as the poster image at full width, `object-fit: cover` to a 16:9 container.
- Same purple play-triangle overlay as inline videos, scaled larger for the hero context.
- Click loads the iframe at the same 16:9 container, autoplay on.

---

## 5. `/subtext-lab` index page

Replace `app/subtext-lab/page.tsx` (current stub). Server component; the filter pill row is a client component extracted into `src/components/subtext-lab/SubjectFilter.tsx` (or co-located — your call, just keep the client-interactive part isolated).

### Layout, top to bottom

1. **Section intro block.**
   - H1: `The Subtext Lab` (display font, same size as other section H1s)
   - Subhead (one paragraph, display-font normal weight or body — match `/blog` index subhead styling):
     > Notes on media and digital society. Threads between pieces — an article catches the first thought, an essay develops it, video carries it further.

2. **Subjects pill filter row.** Renders only when ≥3 distinct subjects exist across published entries. Shape inherited from Session 2.5's `/blog` tag filter:
   - URL-query-param backed: `?subject=<slug>`.
   - Alphabetical sort.
   - Leading `All` pill as reset (active by default, i.e. when no `?subject` param).
   - Active pill colour `var(--accent)` (which is the Subtext Lab purple inside this section), inactive `var(--fg-muted)`.
   - Multi-subject entries match if any of their subjects equals the selected subject (OR logic, same as `/blog`).

3. **Entry list.** Two-column grid on tablet/desktop, single-column on mobile. Each card is thumb-on-top with three possible states:

   **Image card** (`essay` with `hero`):
   - 3:2 cropped thumbnail using `hero` URL with `-hero.jpg` → `-thumb.jpg` substitution (same pattern as `/blog` note hero handling). `object-fit: cover`.
   - Below thumb: title (display font), `Type · date` small-caps inline metadata, subjects pill row (mini version), summary (frontmatter or auto-derived).

   **Video card** (`video` type):
   - 3:2 cropped thumbnail using `video_poster` URL directly.
   - Play-triangle overlay in `var(--accent)` centered over the poster, semi-transparent dark scrim.
   - Below: same title + `Type · date` + pill row + summary.

   **Text-only card** (`article` always; `essay` without hero):
   - No thumb slot.
   - Title renders larger than on image/video cards (where the thumb carries visual weight).
   - Same `Type · date` + pill row + summary below the title.

4. **Empty state** (zero published entries):
   > *No entries yet — still watching, still reading, still playing.*

   Rendered in `var(--fg-muted)` in the same column as the subhead, replacing the list entirely. No placeholder cards.

### Date format on index

Short-month en-GB: `20 Feb 2026`. Use the Session 2.5 convention.

### Card summary rendering

All three card states show the `summary` field (frontmatter or auto-derived). Rendered below the type/date line and pill row, body font, `var(--fg-muted)` colour, 1–3 lines depending on length — no hard truncation beyond what auto-derive already did.

### Cards are links

Entire card is a link to `/subtext-lab/<slug>`. Subjects pills inside cards are also clickable — clicking a subject pill from a card navigates to `/subtext-lab?subject=<slug>` (not the entry). Use `e.stopPropagation()` or careful event handling on the pill links so they don't trigger the outer card navigation.

---

## 6. `/subtext-lab/[slug]` templates

One route file at `app/subtext-lab/[slug]/page.tsx` branches on the entry's `type`. Three template branches:

### Shared elements (all three types)

- **Back-link:** `← Subtext Lab` above the title block. Small-caps tracking-widest, `var(--fg-muted)`, hover to `var(--accent)`. Links to `/subtext-lab`.
- **Title block order:** back-link → (hero slot if applicable) → title → subjects pill row → metadata strip.
- **Subjects pill row:** between title and metadata strip on all three types. Pills link to `/subtext-lab?subject=<slug>`.
- **Metadata strip:** single line, middot-separated, `Type · date` as leading segments. Long-month en-GB date (`20 February 2026`).
- **Prose body:** `@tailwindcss/typography` `prose prose-lg max-w-none` plus the existing display-font heading overrides and `--accent` link colour.
- **`generateMetadata`:** `title` from frontmatter, `description` from the derived summary, `openGraph.images` per the OG rules below.

### `essay` branch

- Hero: if `hero` is set, render full-width above the title block using the `-hero.jpg` URL directly (same shape as `/blog` essay hero). If no `hero`, the title block sits directly under the back-link.
- Metadata strip: `Essay · 20 February 2026 · N min read`.
- Reading time: yes, via existing `getReadingTime`.
- Related-posts footer: **two entries, all types eligible**, subjects-overlap then recency fallback. See "Related-posts logic" below.
- OG image: `hero` URL if present, else none (site default).

### `article` branch

- No hero.
- Metadata strip: `Article · 20 February 2026`.
- Reading time: no.
- Related-posts footer: **two entries, all types eligible**, subjects-overlap then recency fallback.
- OG image: none (site default).

### `video` branch

- Hero: full-width click-to-play using `video_embed` + `video_poster` (per §4 above).
- Metadata strip: `Video · 20 February 2026`.
- Reading time: no.
- Related-posts footer: **two entries, all types eligible**, subjects-overlap then recency fallback.
- OG image: `video_poster` URL.

### Related-posts logic

Single shared implementation used by all three branches:

1. Load all published Subtext Lab entries via `getAllPosts('subtext-lab')`.
2. Exclude the current entry by slug.
3. Partition into matched (≥1 subject overlap with current entry) and unmatched. Both partitions already date-descending from the loader.
4. Concatenate matched + unmatched.
5. Slice to 2.
6. If fewer than 2 exist, render 0 or 1 — no placeholders.

Related-posts card shape: mirror the index card shape (thumb-on-top / video / text-only depending on the related entry's type and fields), so the reader can see at a glance what type of entry they're heading to. Smaller overall size than index cards — a compact version, two in a row on desktop, stacked on mobile.

Footer heading: `Related` (small-caps tracking-widest, `var(--fg-muted)`), directly above the related cards.

---

## 7. Proof entry — `content/subtext-lab/rewatching.mdx`

Hand-author this MDX file. Test content, disposable. Intent: exercise the essay template path without a hero, exercise auto-derived summary (no `summary` frontmatter), exercise `<Pullquote>`, exercise subjects pill row with two subjects.

```mdx
---
title: Rewatching
date: 2026-04-14
type: essay
subjects:
  - film
  - society
draft: false
---

The first watch of a film is about following — tracking the plot, reading the characters, getting your bearings in whatever world the thing has decided to drop you into. Most of your attention is spent on what-comes-next. It has to be. You don't yet know.

The second watch is a different activity. The plot is already spent, so attention drifts elsewhere: to a reaction shot that holds a beat longer than it needs to, to the way a room is lit before anyone speaks in it, to a line of dialogue that made no particular impression the first time and now reads as the entire point of the scene. What seemed like framing becomes argument. What seemed like pacing becomes rhythm.

This isn't a hot take — critics and directors have been saying it for as long as there's been film criticism. What's changed is that rewatching is now trivial. Streaming rolls your watched list infinitely, and "I haven't seen that one in a while" is a fifteen-second problem to solve. You'd think this would make the second watch more common, and in one sense it has: you can rewatch on a whim. But the rewatch-as-practice — the deliberate return to something because you want to see what you missed — is not the same activity as rewatching because the next thing you wanted isn't on your platform.

<Pullquote>What seemed like framing becomes argument. What seemed like pacing becomes rhythm.</Pullquote>

The deliberate rewatch is a small discipline. It's what separates the person who likes a film from the person who understands why they like it — which is not the same thing, and the gap between them is wider than most people admit.
```

Note: no `summary` frontmatter — deliberate, to verify the auto-derive path. `draft: false` so it renders; T.J. will decide after verification whether to keep, flip to draft, or delete.

---

## Verification checklist (before handing back)

Run through each:

1. `npm run build` completes without type errors. If Stripe module-level init crashes the build locally, add a dummy `STRIPE_SECRET_KEY` to `.env.local` (gitignored) — known workaround from prior sessions, not something to fix in this session.
2. Visit `/subtext-lab` in dev — H1, subhead, one card (the Rewatching essay) visible. Subjects pill filter does NOT render (only one entry, <3 distinct subjects — this is correct behaviour).
3. Click the Rewatching card → navigates to `/subtext-lab/rewatching`. Back-link, title, subjects pill row (film, society), metadata strip (`Essay · 14 April 2026 · N min read`), prose body, `<Pullquote>` renders in purple, no related-posts footer (no other entries exist — 0-card state is valid).
4. Click a subject pill on the post page → navigates to `/subtext-lab?subject=film`. Pill row doesn't render on the index yet (only one entry), but the URL works and the list filters to the single matching entry.
5. Create a throwaway second MDX file in `content/subtext-lab/` with `type: video`, any valid 11-char YouTube ID, a `video_poster` URL (can be a placeholder R2 URL that 404s for now — the click-to-play poster will just show a broken image but the state toggle and iframe load should still work on click). Verify the video card renders on the index with play-triangle overlay; verify the video hero renders and swaps to iframe on click. Delete the throwaway file before finishing.
6. Create a throwaway `type: article` file similarly. Verify the text-only card state. Verify the article template renders without reading time, without hero. Delete before finishing.
7. `getAllPosts('blog')` still works — blog schema change (optional `summary`) doesn't break existing blog content.
8. Pre-existing four lint errors in `shop/EmailCapture` — known, do NOT fix in this session.
9. Commit with a descriptive message and push. Vercel will auto-deploy — verify production rendering matches dev.

---

## Reference: what already exists, don't rebuild

- `src/lib/content.ts`: `getAllPosts`, `getPostBySlug`, `getReadingTime`, `SUBJECTS`, `Subject` — all in place. Zod schemas per section already wired.
- `src/components/mdx/`: `Photo`, `PhotoRow`, `Video`, `Pullquote`, barrel export `mdxComponents`.
- `app/subtext-lab/layout.tsx`: `.theme-subtext` wrapper already applied, header/footer render outside it (stay StudioTJ blue).
- `app/globals.css`: `.theme-subtext` class aliases `--accent`, `--accent-deep`, `--accent-soft` to `--st-accent*`.
- `tailwind.config.js`: accent tokens reference CSS variables, so components using `bg-accent` / `text-accent` automatically pick up the Subtext Lab override inside the section.
- `@tailwindcss/typography` plugin registered.
- `/blog` templates at `app/blog/page.tsx` and `app/blog/[slug]/page.tsx` — the canonical reference implementation for note/essay shape. Subtext Lab templates should feel architecturally familiar to these.

---

## If you're unsure

Stop and ask rather than guess. This prompt locks the full set of decisions from the chat session; anything genuinely ambiguous is a bug in the prompt, not a freedom to improvise.
