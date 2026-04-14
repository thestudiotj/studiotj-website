# StudioTJ Pre-Session-6 Fix-It Session

## Context

You are working in `thestudiotj/studiotj-website` (Next.js 14 App Router, Tailwind, Vercel). This is a small fix-it session covering four items that have been tracked as pending across prior sessions. None of them is big on its own; together they're the cleanup pass before Session 6 (SEO + self-hosted fonts + image optimisation) lands.

**Scope is tight.** Four phases, verify-and-commit between each. No scope creep — the DO NOT TOUCH list at the bottom is authoritative.

## Working discipline

- Four phases, separate commits.
- After each phase: `npm run build` clean, confirm behaviour in dev, commit.
- If a phase hits an unexpected issue, stop and flag it — don't work around silently.

---

## Phase 1 — Fix 4 pre-existing lint errors in `shop/EmailCapture`

### Context

Four lint errors surfaced in Session 3 after `.eslintrc.json` was added. Tracked as low priority for Session 6 prep. Should be mechanical fixes — unused variables, `any` types, missing deps in hooks, that shape of thing.

### Steps

1. Run `npm run lint` and capture the current errors on the `shop/EmailCapture` component.
2. Fix each one.
3. Re-run `npm run lint` and confirm zero errors on that file.
4. Run `npm run build` to confirm no downstream type issues.

If the fixes are straightforward (unused imports, trivial type annotations, etc.), proceed without further input. If any error requires a real design decision (like changing the component's public API), stop and surface it before committing.

### Commit

`fix(lint): resolve 4 pre-existing lint errors in shop/EmailCapture`

---

## Phase 2 — Fix Stripe module-level init crash

### Context

`new Stripe(undefined!)` runs at module load time in the current implementation, which crashes local builds when `STRIPE_SECRET_KEY` isn't set. The existing workaround is a dummy `STRIPE_SECRET_KEY` in `.env.local` (gitignored). Production has the real env var, so deploys succeed — this only bites local development.

### Target

Lazy-init inside the webhook handler: defer `new Stripe(...)` until the webhook actually runs. By then, production runtime has the env var; local `npm run build` no longer needs a dummy because the constructor isn't called at build time.

### Implementation

Typical Next.js pattern for this:

```ts
// BEFORE (module scope)
import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { ... })

export async function POST(req: Request) {
  // uses `stripe`
}

// AFTER (request scope)
import Stripe from 'stripe'

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY not set')
  return new Stripe(key, { ... })
}

export async function POST(req: Request) {
  const stripe = getStripe()
  // uses `stripe`
}
```

`getStripe()` only runs when the route is hit; the throw is a real error surface if the env var is missing at runtime in production (which would be a deployment bug, and should fail loudly).

Apply the same pattern to any other file in the repo that module-scope-initialises a Stripe client. Check `src/lib/` and the `app/api/` tree for instances.

### Verify

1. Delete the dummy `STRIPE_SECRET_KEY` line from `.env.local` (or comment it out).
2. Run `npm run build` — should complete cleanly.
3. Run `npm run dev` — homepage and other non-Stripe routes load without error.
4. Restore `.env.local` to its previous state if you want to keep the dummy for webhook testing (optional — the fix means it's no longer required, but keeping it doesn't hurt).

### Commit

`fix(stripe): lazy-init client inside webhook handler to unblock local builds`

In the commit body, note: `Removes need for dummy STRIPE_SECRET_KEY in .env.local. Production runtime uses real env var, unchanged.`

---

## Phase 3 — Verify or replace Alamy footer URL

### Context

Session 5 Phase 3 flagged the Alamy URL as TODO. The current URL in the footer is a contributor search URL:

```
https://www.alamy.com/stock-photo/search.html?cid=YCLQJL4TSRM49GEASAHTCF2U7BCHX6RQ43SXPL74Y2PP5R9MJ8N3GDQMDHSFCRS6
```

Alamy shut down individual contributor portfolio pages mid-Feb 2026. The current URL is a search-based fallback using the `cid` query parameter that identifies T.J.'s contributor ID. It may still resolve to a useful page; it may redirect somewhere useless; Alamy may have removed the `cid` filter entirely.

### Steps

1. Open the URL in a browser and verify it still resolves to a page showing StudioTJ's photos (or at least something recognisable as T.J.'s work).
2. If the URL resolves correctly: remove the TODO comment in the footer code. No URL change needed.
3. If the URL redirects to a generic Alamy search page or shows no StudioTJ photos: the `cid` parameter is no longer honoured. Options in that case:
   - (a) Check Alamy for a current contributor profile URL format and update accordingly.
   - (b) Remove the Alamy icon from the social row entirely until a stable URL exists. If you take this path, leave a comment in the Footer component noting why.
4. Surface the outcome in the commit message.

### Commit

One of:

- `chore(footer): verify Alamy contributor URL still resolves; remove TODO comment` (if URL works)
- `fix(footer): update Alamy URL to <new-format>` (if URL needed replacement)
- `chore(footer): remove Alamy social icon pending contributor URL resolution` (if removed)

---

## Phase 4 — Homepage email-capture microcopy update

### Context

Current copy implies emails are being sent. Actual state is collect-only: addresses are saved, nothing is sent. Biggest integrity issue is the success state promising a wallpaper pack "on its way" — the wallpaper pack was never produced. Copy needs to be rewritten to be honest about the collect-only state without framing by negation (voice brief applies).

Change affects the **light variant** of the EmailCapture component on the homepage. If a dark variant also exists elsewhere (previously on a `/videos` page that may no longer be in the architecture), apply the same copy changes there for consistency, but don't revive dead routes.

### Locked copy (Option A)

Replace the following:

| Field | Current copy | New copy |
|---|---|---|
| Headline | `When new work is ready` | `A list for later` |
| Sub | `An occasional email. No schedule, no noise — just new work and where it came from.` | `Leave your address and it joins the list. When StudioTJ has something worth sending, this is how you'll hear about it first.` |
| Incentive | `First email includes a free high-res cloud wallpaper pack.` | *(remove entirely — no replacement)* |
| Button | `Subscribe` | `Join the list` |
| Success title | `You're in.` | `You're on the list.` |
| Success sub | `Check your inbox — the wallpaper pack is on its way.` | `When there's something to send, it lands here first.` |
| Note | `No tracking. Unsubscribe any time. KvK-registered eenmanszaak.` | *(keep as-is — all three clauses are still accurate)* |

### Implementation

- The EmailCapture component likely lives at `src/components/EmailCapture.tsx` and is consumed from `app/page.tsx`.
- If the component takes props (`headline`, `subline`, `incentive`, `buttonText`, etc.), update the props at the consumption site in `app/page.tsx`.
- If the component hardcodes the strings internally, update them in the component file.
- If the incentive is a prop, pass `undefined` or omit the prop at the call site; if the component renders the incentive unconditionally, add a conditional so it doesn't render when absent/empty.
- Check whether the component has a dark variant being consumed anywhere. If yes, update those strings too. If it's not being consumed, leave the dark-variant code alone for now (don't refactor out dead code in this session).

### Verify

1. Homepage renders with the new headline "A list for later" and all updated copy.
2. The incentive line ("First email includes...") no longer appears anywhere.
3. Submit a test email in dev; the success state shows "You're on the list." / "When there's something to send, it lands here first."
4. No layout regressions from the removed incentive line (if the component relied on three lines of text for vertical rhythm, a small spacing tweak may be needed — flag if so).

### Commit

`copy(homepage): rewrite email-capture microcopy to reflect collect-only state`

In the commit body, note: `Removes wallpaper-pack promise and "occasional email" framing. New copy states what the list IS (collecting addresses for future sends), no promises about frequency or incentives that don't exist yet.`

---

## DO NOT TOUCH

Carved out of this session:

- Anything Session 6 scope (sitemap, robots, JSON-LD, og:product, self-hosted fonts, image optimisation, contrast audit, Pinterest tag, logo via `next/image`)
- Any content in `content/gear/`, `content/blog/`, `content/journal/`, `content/subtext-lab/`
- Any template or index page (`/blog`, `/journal`, `/subtext-lab`, `/gear`)
- Nav, footer layout (only the specific Alamy URL fix in Phase 3 — do not reshuffle, re-style, or add/remove items)
- Homepage sections beyond the email capture (hero, about-strip, Latest strip, collection grid — all stay as-is)
- MDX components, Zod schemas, `src/lib/content.ts`
- Upload script, sorter, any Python tooling
- Portfolio.json, journal.json
- Any new features, refactors, or "while I'm in here" improvements

If a cleanup temptation shows up during any phase (unused imports outside EmailCapture, formatting inconsistencies elsewhere, a `TODO` in another file), leave it. That's the next fix-it session or Session 6's problem.

## Expected outcome

Four focused commits:

1. `fix(lint): resolve 4 pre-existing lint errors in shop/EmailCapture`
2. `fix(stripe): lazy-init client inside webhook handler to unblock local builds`
3. One of the three Phase 3 commit shapes
4. `copy(homepage): rewrite email-capture microcopy to reflect collect-only state`

Clean build, no scope creep, ready for Session 6.
