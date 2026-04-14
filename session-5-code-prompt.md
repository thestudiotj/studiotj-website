# StudioTJ Session 5 — `/gear` + Nav + Footer + Latest Strip

## Context

You are working in `thestudiotj/studiotj-website` (Next.js 14 App Router, Tailwind, Vercel). This session implements the four Session 5 surfaces locked in the April 14 architecture chat:

1. **`/gear` page** + 9 MDX entries committed to `content/gear/`
2. **Nav update** to 6-item with Subtext Lab dot marker; `/film` removed, `Notes` → `Blog`
3. **Footer reshuffle** to target: Gear · Contact · Privacy · Terms + social icons + KvK + Postbus
4. **Homepage Latest strip refactor** — one card per content section, per-section card shape, graceful degradation

All architectural and copy decisions are locked. No open design questions. The full 9 gear entry bodies are in this prompt verbatim — do not rewrite, paraphrase, or "improve" the copy.

## Repo landmarks (as of post-Session-4)

- Loader: `src/lib/content.ts` — gear schema already defined (`name, category, status, summary, image?, image_caption?, affiliate_link?, affiliate_provider?, date_added`); `getAllPosts('gear')` returns validated entries sorted by `date_added` desc.
- MDX components: `src/components/mdx/` — `Photo`, `PhotoRow`, `Video`, `Pullquote`, barrel-exported via `index.ts` + `mdxComponents` const. `Video` is click-to-play by default. All available to gear MDX bodies (though the 9 MVP entries use plain prose).
- Tailwind Typography: `prose prose-lg max-w-none` is the consumed pattern.
- Theme: `.theme-subtext` class in `globals.css` aliases accent CSS vars to `--st-*` values. Applied via wrapper `<div>` in `app/subtext-lab/layout.tsx`.
- Nav: `src/components/Nav.tsx` (current: Portfolio · Film · Notes · Shop · About)
- Footer: `src/components/Footer.tsx` (current post-1B: /contact link + KvK/BTW/Postbus block)
- Homepage: `app/page.tsx` — includes current Latest strip (blog-only, renders-if-posts-exist)

## Voice brief reminder

State what things ARE; don't frame by negation. Dutch-direct confident declarative. Do not edit the 9 gear entry bodies for tone — they were drafted to this brief and locked. If any entry has a typo or a factual error, flag it in chat, don't fix silently.

## Working discipline

- Four phases, verify-and-commit between each. Don't stack commits across phases.
- After each phase: run `npm run build` locally, fix any type errors, confirm the page renders, commit.
- If a phase hits an unexpected issue, stop and surface it — do not work around silently.
- Scope creep forbidden. Only the four surfaces in this prompt. The "DO NOT TOUCH" list at the end is authoritative.

---

## Phase 1 — `/gear` page + 9 MDX entries

### 1a. Create content files

Create directory `content/gear/` if not present. Create these 9 files verbatim. The bodies are copy-locked — do not modify prose.

#### `content/gear/nikon-d3500.mdx`

```mdx
---
name: "Nikon D3500"
category: "cameras"
status: "current"
summary: "Entry-level DSLR that's carried every shoot since 2019."
affiliate_link: "https://www.amazon.nl/"
date_added: "2026-04-14"
---

The D3500 is the camera I learned photography on, and the one I still reach for every shoot. 24-megapixel APS-C sensor, no optical low-pass filter, Nikon DX lens mount, 415 grams with battery and card. Discontinued in 2021, available used from the usual places. The sensor still holds up in 2026 — RAW files come out clean and edit generously, and JPEG straight out of the camera looks like someone made a choice about it rather than fighting whatever the camera decided.

What makes it hold up is what it asks you to do. Manual, aperture-priority, shutter-priority, programmed auto — I live in programmed auto, adjusting as the light changes. Battery life is genuinely excessive (Nikon rates 1,550 shots per charge, which is closer to "days at a time" than a number on a spec sheet). Guide Mode on the dial teaches camera fundamentals in context rather than in a manual.

The limits are real and worth knowing. The 11-point autofocus array clusters toward the centre of the frame and starts showing its age on moving subjects and in low light — fine for architecture and landscape work, frustrating for anything that doesn't stand still. Video caps at 1080p with built-in mono microphones and no external mic port, which is why the OnePlus Nord 4 covers the video side instead. Connectivity is Bluetooth-only via Nikon's SnapBridge app; image transfer to phone is slow, and you'll want a card reader for any volume. The LCD is fixed — no tilt, no touch — and charging needs the dedicated brick. The 95% viewfinder coverage means a sliver of the frame edge is guesswork.

Ready for an upgrade doesn't mean done with the D3500. The Z50 II sits in the wishlist below — better autofocus, mirrorless ergonomics, modern connectivity — but the D3500 made the case for Nikon as a system, and the system is where the next body goes.
```

#### `content/gear/dji-osmo-pocket-3.mdx`

```mdx
---
name: "DJI Osmo Pocket 3"
category: "cameras"
status: "wishlist"
summary: "One-inch sensor, built-in gimbal, pocket-sized — the atmospheric video tool the D3500 isn't."
affiliate_link: "https://www.amazon.nl/"
date_added: "2026-04-14"
---

The Pocket 3 sits on the wishlist because it does one thing the D3500 doesn't and the OnePlus Nord 4 can't: atmospheric handheld video on a 1-inch sensor with mechanical three-axis stabilisation, in a device that fits in a jacket pocket. 4K up to 120fps, 20mm f/2.0 lens, D-Log M colour profile for post, rotating touchscreen that flips between portrait and landscape with a tap. The Mic Mini transmitter I already use pairs with it directly via DJI's OsmoAudio protocol — no receiver, no cable, one less accessory to pack.

The real trade-offs are worth naming. It's not weather-sealed, which matters in the Netherlands — light rain is recoverable, a proper shower is not. The gimbal has no locking mechanism, so it wants careful handling in transit rather than a casual toss into a bag. Stills are 9 megapixels, which is fine for a frame grab and not a photo camera in any serious sense. The Mimo app gets described as fiddly by long-term users.

It's complementary to the Osmo Mobile 7P, not a replacement. The 7P stabilises a phone; the Pocket 3 is its own camera. Different tools, different reasons.
```

#### `content/gear/nikon-z50-ii.mdx`

```mdx
---
name: "Nikon Z50 II"
category: "cameras"
status: "wishlist"
summary: "The body the D3500 retires into — same system, modern everything."
affiliate_link: "https://www.amazon.nl/"
date_added: "2026-04-14"
---

The Z50 II is the upgrade that keeps the system. Same Nikon mount family, same philosophy, and with the FTZ II adapter the three F-mount lenses I already shoot with — the 10-20mm wide, the 35mm prime, and the kit zoom — keep working. APS-C, 20.9 megapixels, the same Expeed 7 processor Nikon puts in the Z8 and Z9, which is the one detail that turns an entry-level spec sheet into a camera that performs well above its tier.

What it adds over the D3500 is exactly what the D3500's closing paragraph named: modern autofocus (209 phase-detection points with subject recognition for people, animals, birds and vehicles), 4K video at up to 60fps with 10-bit N-Log, a headphone socket, weather sealing, USB-C, a vari-angle touchscreen, and an EVF that shows exposure as you compose rather than after the shutter.

The real limits are worth naming. Battery life is notably short (CIPA 250 shots, real-world closer to 275–300) — shooting a full day needs spare batteries and a way to charge them. There's no in-body image stabilisation, which makes lens-side VR the way to keep handheld work sharp in low light. Nikon's native DX lens lineup is thin; the ecosystem expects you to reach for full-frame Z lenses or stay with F-mount glass via FTZ II, which for my kit is a feature, not a limitation.
```

#### `content/gear/nikon-10-20mm.mdx`

```mdx
---
name: "Nikon AF-P DX NIKKOR 10-20mm f/4.5-5.6G VR"
category: "lenses"
status: "current"
summary: "Ultra-wide that handles architecture, landscape, and tight interiors on a light budget."
affiliate_link: "https://www.amazon.nl/"
date_added: "2026-04-14"
---

The 10-20mm is the lens I reach for when the subject is bigger than I am. Architecture that won't fit in a frame at 18mm, a sweep of landscape that needs the horizon to stretch, an interior tight enough that a kit zoom makes you back into a wall. 15–30mm equivalent on DX, 109 degrees of view at the wide end, and a field that bends space in a way the human eye doesn't — which is exactly the point.

Built for the price it costs. 230 grams, plastic mount, no physical switches (VR and focus mode live in the camera menu), a stepping motor that's genuinely quiet and quick. VR rated at 3.5 stops, which is how handheld low-light shots stay usable without a tripod. A 72mm filter thread that doesn't rotate during focus — polarisers and NDs thread on and stay put.

Barrel distortion at 10mm is significant and visible, especially on architecture where straight lines want to stay straight. Lightroom's lens profile correction handles it in one click, but if you shoot RAW without applying the profile, the wide end looks drunk. Corners soften and show colour fringing away from centre — typical behaviour for a budget ultra-wide, again cleaned up in post. The lens leans on digital correction, and knowing that is most of the relationship.
```

#### `content/gear/nikon-35mm-dx.mdx`

```mdx
---
name: "Nikon AF-S DX NIKKOR 35mm f/1.8G"
category: "lenses"
status: "current"
summary: "Normal-field prime that lives on the camera when the subject is the subject."
affiliate_link: "https://www.amazon.nl/"
date_added: "2026-04-14"
---

The 35mm sits at the other end of the bag from the 10-20mm. 52.5mm equivalent on DX — what gets called a "normal" lens because its field of view is close to what the centre of human vision actually takes in. Everything at its own size, no wide-angle stretch, no telephoto compression. When a shot wants to look like you just saw it, this is the lens.

Fast aperture (f/1.8, three stops brighter than the kit zoom at the same focal length), 200 grams, Silent Wave Motor for quick quiet autofocus, 52mm filter thread, minimum focus distance of 30cm. The build is simple — plastic barrel, metal mount, one AF/MF switch and a damped focus ring, no distance scale, no VR. It's the lens that disappears on the camera and earns its place there.

Things to know. The aperture is not smooth across its range: wide open at f/1.8 shows mild longitudinal chromatic aberration (green and magenta fringing on out-of-focus highlights) and soft corners. Stopping down to f/2.8 clears both. Bokeh is decent but not creamy — the seven aperture blades give away the price. Around two percent barrel distortion, easily corrected in Lightroom. No stabilisation means handheld shutter speeds need to stay above 1/60 or so without a tripod, which the fast aperture largely handles.

Different job from the 10-20mm. The wide zoom opens space outward; the 35mm closes it in.
```

#### `content/gear/lightroom-classic.mdx`

```mdx
---
name: "Adobe Lightroom Classic"
category: "software"
status: "current"
summary: "The catalog and darkroom where every RAW from the D3500 gets finished."
affiliate_link: "https://www.adobe.com/products/photoshop-lightroom-classic.html"
date_added: "2026-04-14"
---

Lightroom Classic is where every shoot lands after import. Catalog on the left, develop module on the right, the same interface since forever and the same interface I'd still choose. RAW files stay untouched; edits live as instructions in a database until export. That non-destructive pipeline is the reason the software has held up for more than a decade — the original negative is always still there, and every decision is reversible.

The real argument for it, at least in this kit, is lens profile correction. The 10-20mm's barrel distortion at 10mm is significant on paper; one checkbox in the Lens Corrections panel solves it before I've looked at the rest of the photo. The 35mm prime's colour fringing wide open, the corner softness on both lenses, the vignetting at edge apertures — all of it lives in a lens profile Adobe maintains, applied automatically the moment the file is imported. The lens limits I named in the earlier entries exist in the optics and stop existing in the catalog. That's most of why they're acceptable.

Organisation is the other half. Folders, collections, smart collections, star ratings, flags, colour labels, keywords, metadata filters — whatever way you want to find a photo three years after you shot it, Lightroom has a handle for it. The catalog is a database, which means that if you move files outside Lightroom it gets confused, and which means that smart collections, keyword search, and metadata filters all work the way a database search should.

Things that aren't great. It's subscription-only, and Adobe's pricing trends one direction. The interface is unfashionable compared to Lightroom CC (the cloud-first sibling), and the catalog model does expect you to understand it. The recent AI features are a mix — Assisted Culling is useful and free; the Firefly credits are a separate line item and don't always give results worth the spend.

Sorted, rated, edited, exported. The whole chain sits in one application, and that's the argument.
```

#### `content/gear/mosh-pro.mdx`

```mdx
---
name: "Mosh Pro"
category: "software"
status: "current"
summary: "Real-time visual effects mixer for when a photo or video needs to look like something went wrong on purpose."
affiliate_link: "https://moshpro.app/"
date_added: "2026-04-14"
---

Mosh Pro is the tool for when I want a photo or a short video to carry a specific kind of broken — datamosh glitching, VHS artefacts, chromatic aberration, CRT scanlines, pixel sort, ASCII mosaic, 8-bit CGA palettes, the whole aesthetic vocabulary of video-compression failure made deliberate. Sixty-plus effects that stack and reorder in real time, modulators that animate parameters over time, 4K export. Previously called PhotoMosh, renamed in late 2024.

The reason to own it is that the alternative is FFmpeg scripts and command-line patience. Mosh Pro takes the minute you want to spend on the effect and leaves it at about a minute, rather than an afternoon of tutorials and config files. Used sparingly — the aesthetic is a seasoning, not a meal — but three years in, when a moment calls for it, nothing else I've tried comes close.
```

#### `content/gear/dji-osmo-mobile-7p.mdx`

```mdx
---
name: "DJI Osmo Mobile 7P"
category: "accessories"
status: "current"
summary: "Phone gimbal that turns atmospheric handheld video into something actually watchable."
affiliate_link: "https://www.amazon.nl/"
date_added: "2026-04-14"
---

The Osmo Mobile 7P is the piece of kit that makes phone video worth using for anything beyond quick reference. Three-axis mechanical stabilisation, magnetic phone clamp that auto-balances, built-in extension rod, retractable tripod in the base, and ten hours of battery that can also top up the phone over USB-C. Open the arm and it powers on — no app dance required for basic use.

What sets this generation apart is the Multifunctional Module that ships in the 7P box. It handles subject tracking through any camera app (not just DJI's Mimo), carries a DJI Mic Mini receiver directly on the rig, and has a small LED fill light built in. The Mic Mini I own pairs straight to the module, which means the audio and the stabilisation sit on one rig instead of two. The side wheel adds smooth manual focus and zoom control.

Things worth naming. Android gets the second-class citizen treatment in DJI's app ecosystem — Mimo was absent from Google Play for a stretch and the sideload-from-DJI workaround is still the first thing a lot of product pages will tell you; it's back on the Play Store now, but the iPhone-first feature set remains. The adjustment wheel is sensitive enough to bump accidentally while holding the grip. There's no 360-degree rotation, so some shots the newer Osmo Mobile 8 can do are out of reach here. The module halves battery life when in use, more if the fill light stays on.

None of that stops it from being the tool that makes phone video usable. The OnePlus Nord 4 isn't a cinema camera and never will be, but with this in hand, it's enough.
```

#### `content/gear/dji-mic-mini.mdx`

```mdx
---
name: "DJI Mic Mini"
category: "accessories"
status: "current"
summary: "Wireless lavalier that clips to a shirt and disappears, pairs to anything DJI without ceremony."
affiliate_link: "https://www.amazon.nl/"
date_added: "2026-04-14"
---

The Mic Mini is the audio piece that completes the video side of the kit. Ten-gram transmitter with a magnetic clip and a built-in omnidirectional capsule; wireless range claimed up to 400 metres in clear line of sight; two levels of noise cancellation and auto-limiting to prevent clipping. The charging case holds the transmitters, the receiver, and the windscreens all at once and does the full top-up without fuss. Battery life on a transmitter is around eleven hours of recording, which means it doesn't need thinking about inside a normal shoot day.

The fit with the rest of the DJI kit is what makes this specific mic worth owning. Pairs directly with the Osmo Mobile 7P's Multifunctional Module via the OsmoAudio protocol — no receiver on the gimbal, audio lands on the phone's recording through the module itself. Same direct-pairing story with the Pocket 3 if that one moves from wishlist to current. One ecosystem, one wireless protocol, no dongles.

Things to know. No internal recording on the transmitter — if the wireless signal drops mid-take, that audio is gone, and there's no onboard backup the way the full-size Mic 2 provides. No 32-bit float either, so clipping at the source isn't recoverable in post the way it would be with pricier systems. The Mic 2 and Mic Mini receivers aren't cross-compatible; picking the ecosystem is a one-way door. Omnidirectional pickup means the environment comes through alongside the voice, which is mostly a feature (natural ambient bed) and occasionally a limit (noisy locations want a shotgun mic instead).

For the scale this rig operates at — one-person shoots, atmospheric video, occasional interview — it's the right call.
```

### 1b. Build the page

Create `app/gear/page.tsx` with:

- **H1:** `Gear`
- **Subhead:** `What I carry, what I shoot with, what I'd add next.`
- **Disclosure banner** (below subhead, above first category): `Some links go through affiliate programs; when you buy through them, StudioTJ earns a commission. If you ask me in person, this is what I'd recommend — gear I use, gear I wish for, and gear I've researched hard enough to vouch for.`
  - Rendered in a visually distinct block (muted background or subtle border) so it's clearly disclosure, not body copy.
- **Category jump-nav** below the banner, across the top of the content area:
  - Shows only **populated** categories. MVP has 4: Cameras · Lenses · Software · Accessories. Lighting and Computer & Storage do not render (no greyed-out items, no placeholders).
  - Implement by querying `getAllPosts('gear')` and deriving the set of categories that have at least one entry.
  - Anchor links: clicking a category scrolls to `#cameras`, `#lenses`, etc. Section `id` matches the category slug (lowercase, single word).
  - Sticky on desktop acceptable if clean; plain anchor-nav fine if sticky gets fiddly. Don't block the phase on sticky behaviour.
- **Entry rendering per category:**
  - Category heading (`<h2 id="cameras">Cameras</h2>` etc.)
  - Within each category, entries sorted by: status order (`current` → `wishlist` → `previous`) then `date_added` descending. All MVP entries share today's date, so within-status ordering falls to whatever the loader returns (fine).
  - Each entry card:
    - Name as self-anchor: `<h3 id="{slug}"><a href="#{slug}">{name}</a></h3>`. The anchor target enables `/gear#nikon-d3500` deep-linking.
    - Status badge: inline middot-separated small-caps after the name, all in `--fg-muted`, literal wording. Rendered as `{name} · {STATUS}`.
    - Image slot: 3:2 aspect ratio, `object-fit: cover`, consistent size. Uses `-thumb.jpg` path derived from the `image` frontmatter value. **Graceful fallback:** if `-thumb.jpg` doesn't load, render the full-size image at the `image` path. If `image` is absent entirely, render text-only card (no image slot, no blank space).
    - Image caption (if present) below the image in smaller muted text.
    - Summary line between badge and prose body, rendered in a slightly larger or emphasised weight than body copy (like an intro lede).
    - MDX body rendered with `mdxComponents` and `prose prose-lg max-w-none`.
    - Affiliate link (if `affiliate_link` present) appears at the end of the body as a text link. `(affiliate)` badge in parentheses, `--fg-muted`, inline after the link, **only renders if `affiliate_provider` is truthy**. For the MVP 9 entries, `affiliate_provider` is absent/empty on all, so no badges render on day one. Banner still renders (anticipatory).
  - Entries have no per-item route. The card is the terminal destination. Rest of the card (outside the name and the affiliate link) is inert — no hover state on the card itself.
- **Empty category copy** (defensive only, should not render at MVP given the hide-empty policy): `Nothing here yet.`

### 1c. Image assets

The 9 entries ship with `image:` absent (field not present in the frontmatter). This means all 9 render as text-only cards at launch. When you upload gear images later to R2 at `photos.studiotj.com/gear/<slug>/<filename>.jpg`, adding the `image:` field to the relevant frontmatter will make the image appear with the graceful-thumb fallback.

**Do not fabricate placeholder images for this phase.** Ship the entries text-only.

### 1d. Verify

- `npm run build` clean
- `/gear` renders at http://localhost:3000/gear in dev
- Jump-nav shows 4 categories (Cameras, Lenses, Software, Accessories), not 6
- Clicking a jump-nav item scrolls to the correct category heading
- All 9 entries render with correct name, status badge, summary, body
- No `(affiliate)` badges render (since no `affiliate_provider` set)
- Deep link `/gear#nikon-d3500` scrolls to the D3500 card
- Banner renders above the jump-nav

### 1e. Commit

`feat(gear): ship /gear page with 9 MVP entries, category jump-nav, disclosure banner`

---

## Phase 2 — Nav update

### 2a. Target state

Current nav: `Portfolio · Film · Notes · Shop · About`
Target nav: `Portfolio · Journal · Blog · • Subtext Lab · Shop · About`

Operations:
- Remove `Film` nav item (route `/film` is not in the target architecture; if the route file exists, do not delete it in this phase — flag for separate cleanup)
- Rename `Notes` link to `Blog`, update `href` from `/notes` to `/blog` (if currently pointing elsewhere)
- Add `Journal` nav item, `href="/journal"`, between Portfolio and Blog
- Add `Subtext Lab` nav item, `href="/subtext-lab"`, between Blog and Shop

### 2b. Dot marker on Subtext Lab

6px × 6px filled circle in `var(--st-accent)`, vertically centred on the label's x-height (not baseline), ~6px right margin before the label text.

Implement as a pseudo-element on the Subtext Lab nav link or as an inline styled span. Exact sizing control required — do not use the Unicode `•` character (font-render variability makes the size inconsistent across weights and browsers).

Recommended implementation:
```tsx
// In Nav.tsx, for the Subtext Lab item only:
<Link href="/subtext-lab" className="...">
  <span
    aria-hidden="true"
    style={{
      display: 'inline-block',
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      backgroundColor: 'var(--st-accent)',
      marginRight: '6px',
      verticalAlign: 'middle',
      // Optional: slight offset to hit x-height midline rather than baseline
      transform: 'translateY(-1px)',
    }}
  />
  Subtext Lab
</Link>
```

`aria-hidden` on the dot span — it's decorative, not semantic.

### 2c. Mobile hamburger

Verify the 6-item nav renders cleanly in the mobile menu. If the current hamburger implementation is a vertical list, 6 items should fit without change. If it's a horizontal overflow-scrolling list, 6 items will still fit on most phone widths. Don't redesign the hamburger for this phase; just verify 6 items look right.

### 2d. Verify

- `npm run build` clean
- Desktop nav renders 6 items in correct order
- Subtext Lab nav item has the purple dot at the correct size and position
- Clicking each nav item routes to the correct path
- Mobile nav renders all 6 items
- The purple dot does not leak into other nav items

### 2e. Commit

`feat(nav): update to 6-item target with Subtext Lab dot marker, remove /film, rename Notes→Blog`

---

## Phase 3 — Footer reshuffle

### 3a. Target state

Current footer (post-1B): /contact link + KvK/BTW/Postbus business-details block.

Target footer:

```
Top row:      Gear · Contact · Privacy · Terms
Social row:   [Instagram] [Pinterest] [YouTube] [TikTok] [Alamy]
Bottom row:   KvK 75602172 · BTW NL002283139B11 · Postbus: Keurenplein 41 Box D2818, 1069CD Amsterdam
```

Top row: text links, middot-separated, styled to match existing footer link typography.

Social row: icon links, monochrome icons matching site text colour (no brand colours), modest size (don't dominate the footer). Use either `react-icons`, `lucide-react`, or inline SVG — pick whichever the project already has a dependency on; if none, add `lucide-react` (lightest).

Social URLs:
- Instagram: `https://www.instagram.com/thestudiotj/`
- Pinterest: `https://nl.pinterest.com/thestudiotj/`
- YouTube: `https://www.youtube.com/@thestudiotj`
- TikTok: `https://www.tiktok.com/@thestudiotj`
- Alamy: **needs verification before commit.** The Alamy contributor portfolio shut down mid-Feb 2026; the current state is a contributor search URL. Before committing, confirm the correct URL by checking `https://www.alamy.com/` search for "StudioTJ" or the contributor profile. If uncertain, stub the Alamy icon with a `TODO` comment and a placeholder URL, flag it in the commit message, and we'll resolve in a follow-up.

Bottom row: KvK + BTW + Postbus, small text, `--fg-muted`. The existing post-1B block already has this content; preserve it (maybe reformat to a single line with middot separators if it fits, or keep stacked as is).

### 3b. What does NOT go in the footer

- Subtext Lab social accounts (they live inside `/subtext-lab`)
- Personal Instagram `@tjvanderheeft` (lives on `/about`)
- Email address (lives on `/contact`)

### 3c. Verify

- `npm run build` clean
- Top row: 4 text links, middot-separated, all route correctly (`/gear`, `/contact`, `/privacy`, `/terms`)
- Social row: 5 icons, each routing to the correct URL (verify Alamy URL before commit, or stub with TODO)
- Bottom row: KvK + BTW + Postbus content intact
- Footer renders consistently across breakpoints

### 3d. Commit

`feat(footer): reshuffle to target layout (links, social icons, business details)`

If Alamy URL was stubbed with TODO, add a note in the commit body: `Alamy URL stubbed — contributor portal migration pending, resolve in follow-up.`

---

## Phase 4 — Homepage Latest strip refactor

### 4a. Current state

Homepage Latest strip currently renders blog posts only, with a render-if-posts-exist conditional. The strip lives in `app/page.tsx` (or a component it imports).

### 4b. Target state

Three-card strip: blog · journal · subtext-lab. Each card adopts its section's native index card shape.

- **Blog card:** text-forward. Title (larger, display font), inline `Type · date` metadata, summary line. No thumbnail, even if the blog essay has a `hero` field. Matches the `/blog` index card convention.
- **Journal card:** photo-forward. 3:2 cover-cropped `-thumb.jpg` via `hero_photo_id` → `journal.json` lookup (use `getJournalPhoto(photoId)` from `src/lib/journal.ts`). Title below the thumb. Inline metadata `20 Feb 2026 · location?` (silent-drop on missing location). `dominant_colors` gradient fallback if thumb fails to load. Matches the `/journal` index card convention.
- **Subtext Lab card:** three-state based on entry type.
  - Image card (essay with `hero`): thumb-on-top 3:2, title below, summary line
  - Video card (type `video`): `video_poster` thumb-on-top 3:2, **centred purple play-triangle overlay** (uses `var(--st-accent)`), title below, summary line
  - Text-only card (article, or essay without `hero`): no thumb slot, title scales larger to carry visual weight, summary line
  - Matches the `/subtext-lab` index card convention.

### 4c. Subtext Lab card theming

Wrap the Subtext Lab card in `.theme-subtext` locally. All interior accent usage inside that card (play-triangle colour, any subject pills, link hover state) resolves to `--st-accent`. The rest of the homepage stays on the default StudioTJ blue accent.

```tsx
// Rough shape:
<div className="latest-strip">
  {blogPost && <BlogCard post={blogPost} />}
  {journalEntry && <JournalCard entry={journalEntry} />}
  {subtextPost && (
    <div className="theme-subtext">
      <SubtextCard post={subtextPost} />
    </div>
  )}
</div>
```

### 4d. Graceful degradation

- If a section has zero published entries, its card does not render. Strip renders 1, 2, or 3 cards depending on what exists.
- If **all three sections** have zero published entries, the entire strip does not render. No placeholder, no "Latest work — coming soon" message. The homepage shows one less section on it.
- Use `getAllPosts('<section>')` for each section, take the first entry (already sorted by date descending), render if it exists.
- Optional: a `getLatestAcrossSections()` helper in `src/lib/content.ts` if cleaner than three separate calls. Decide based on whether it actually simplifies — don't add if the three calls are fine.

### 4e. Card click target

Each card is a full-card link to the destination post (matches each section's index card behaviour — `/blog/<slug>`, `/journal/<slug>`, `/subtext-lab/<slug>`). No subject-pill stretched-link complexity needed on the Subtext Lab homepage card; the homepage isn't where subject filtering happens.

### 4f. Strip heading

Keep whatever heading currently precedes the Latest strip (likely "Latest" or similar). Don't rename unless the current label is actively wrong.

### 4g. Verify

- `npm run build` clean
- Homepage renders with the strip showing current published-entry state
- Blog card: text-forward, no thumb, correct metadata shape
- Journal card: 3:2 thumb via journal.json lookup, correct metadata
- Subtext Lab card: correct shape per the type of the latest entry; if it's a video, play-triangle is purple; if it's an essay without hero, text-only
- Subtext Lab card's purple accents confirmed via `.theme-subtext` wrap
- Delete a section's entries or mark them all `draft: true` in dev and confirm the strip degrades gracefully (render the dev-only check, then revert)
- Card clicks route to the correct destination slugs

### 4h. Commit

`feat(homepage): refactor Latest strip to one card per section with graceful degradation`

---

## DO NOT TOUCH

These are carved out of this session's scope. If any of them tempts a change during implementation, stop and flag in chat.

- `/blog`, `/journal`, `/subtext-lab` templates or index pages (Session 5 consumes their card shapes, does not modify them)
- `src/lib/content.ts` beyond potentially adding `getLatestAcrossSections()` helper if cleaner for Phase 4
- `src/lib/journal.ts` (reuse `getJournalPhoto`, don't modify)
- Any frontmatter schema (gear schema already defined in the loader; all four section schemas are locked)
- New MDX components
- Stripe module-level init crash (tracked separately; do not touch in this session)
- Four pre-existing lint errors in `shop/EmailCapture` (tracked for a dedicated fix-it session before Session 6; do not touch)
- `/film` route files (if they still exist; nav is updated to drop the link, route cleanup is separate)
- Upload script, sorter, any Python tooling
- Portfolio collections, portfolio.json, shop pages
- SEO infrastructure (sitemap, robots, JSON-LD, og:product) — Session 6
- Self-hosted fonts + image optimisation — Session 6

## Expected outcome

After this session:
- `/gear` is live with 9 text-only entries across 4 categories, disclosure banner at top, category jump-nav, `(affiliate)` badges dormant
- Primary nav shows 6 items with a small purple dot before Subtext Lab
- Footer matches target layout
- Homepage Latest strip adapts to one-card-per-section with graceful degradation
- Four commits, clean build, no scope creep

The master plan and any remaining architectural decisions do not need to be updated by Code — those are chat-session concerns. Surface anything unexpected; don't silently adapt.
