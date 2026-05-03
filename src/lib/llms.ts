import { getAllPosts, getPostBySlug } from './content'
import { getPortfolio, sortCollections } from './portfolio'
import { getProducts as getPrintifyProducts, getPriceRange, formatPrice } from './printify'
import { getAllSeries, getRouteEntries } from './series'
import {
  getProducts as getVondstenProducts,
  getLanding as getVondstenLanding,
  getCategoryIntro as getVondstenCategoryIntro,
} from './vondsten/loader'
import { CATEGORIES as VONDSTEN_CATEGORIES } from './vondsten/schemas'
import { CATEGORY_DISPLAY as VONDSTEN_CATEGORY_DISPLAY } from './vondsten/categories'
import {
  loadActiveCategories as loadActivePicksCategories,
  loadAllBrandsInCategory,
  loadBrandProducts,
  loadLanding as loadPicksLanding,
  loadCategoryIntro as loadPicksCategoryIntro,
} from './picks/loader'
import { PICKS_CATEGORY_LABELS } from './picks/categories'
import {
  loadActiveCategories as loadActiveGearCategories,
  loadAllItemsInCategory,
  loadLanding as loadGearLanding,
  loadCategoryIntro as loadGearCategoryIntro,
} from './gear/loader'
import { GEAR_CATEGORY_LABELS } from './gear/categories'

const BASE_URL = 'https://studiotj.com'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LlmsEntry {
  title: string
  url: string
  description: string
}

export interface LlmsSection {
  heading: string
  entries: LlmsEntry[]
}

export interface LlmsEntryFull extends LlmsEntry {
  body?: string
}

export interface LlmsSectionFull {
  heading: string
  entries: LlmsEntryFull[]
}

// ─── Prose utilities ─────────────────────────────────────────────────────────

function truncate(text: string, max = 200): string {
  if (!text) return ''
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.lastIndexOf(' ', max)
  return cut > 0 ? clean.slice(0, cut) : clean.slice(0, max)
}

function stripJsx(mdx: string): string {
  let out = mdx
  // JSX comments
  out = out.replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
  // Pullquote → blockquote
  out = out.replace(/<Pullquote[^>]*>([\s\S]*?)<\/Pullquote>/g, (_m, inner) => {
    return inner
      .trim()
      .split('\n')
      .map((l: string) => `> ${l.trim()}`)
      .filter((l: string) => l !== '>')
      .join('\n')
  })
  // Self-closing JSX components
  out = out.replace(/<[A-Z][A-Za-z0-9.]*(?:\s[^>]*)?\s*\/>/g, '')
  // Paired JSX components
  out = out.replace(/<[A-Z][A-Za-z0-9.]*(?:\s[^>]*)?>[\s\S]*?<\/[A-Z][A-Za-z0-9.]*>/g, '')
  // MDX import/export lines
  out = out.replace(/^(?:import|export)\s[^\n]+\n?/gm, '')
  // Collapse blank lines
  out = out.replace(/\n{3,}/g, '\n\n').trim()
  return out
}

function firstPara(body: string): string {
  const clean = stripJsx(body)
  for (const line of clean.split('\n')) {
    const t = line.trim()
    if (t && !t.startsWith('#') && !t.startsWith('>') && !t.startsWith('-') && !t.startsWith('|')) {
      return truncate(t)
    }
  }
  return ''
}

// ─── Static prose bodies for code-driven pages ───────────────────────────────

const ABOUT_BODY = `## The studio

StudioTJ is a Dutch photography practice created by Tjeerd van der Heeft. Colour photography of architecture is the main lane — bold geometry, urban form, the lines buildings hold. Monochrome is the other lane, and the one I started in. It's stayed because monochrome carries texture, weight, and contrast on its own terms.

StudioTJ shares the site with The Subtext Lab — essays and video about games, film, TV, music, and the way digital society is shaping all of them. The lens is analytical and Dutch. The Dutch part stays even when the writing is in English.

The site is curated. Everything here has been chosen, edited, and shipped on purpose.

## The work

The portfolio sits in four collections.

The Signature Collection is bold architecture in colour. Old buildings, new buildings, and the lines that hold them together. Punchy, accurate, made to print well.

Monochrome Moods is just cool. Black and white photography that earns its medium — texture, contrast, weight, and the kind of light that only reads in greyscale.

The Atmospheric Collection is sense of place. Urban or natural, ambient or dramatic, anywhere the weather, the light, or the quiet of a scene becomes the actual subject.

The Halcyon Collection makes you feel warm. A pink-and-peach grade with lavender shadows, applied whole-image to photographs where warmth makes the photograph better. Golden hour expanded into a palette.

Beyond the four collections: /series — ongoing sequences of photographs, organized by subject, weather, and season. /shop — apparel and prints, fulfilled by print-on-demand partners. /gear — what I shoot and edit with, honest takes, recommendations on merit. /subtext-lab — essays and video, by the same person.

## Get in touch

For commissions, licensing, or anything else, /contact has the details — single inbox, plain email, no form to fill out.`

const CONTACT_BODY = `One inbox for everything: info@studiotj.com

To help me get to the right reply faster, put one of these in your subject line:

- Commission — for assignment work, custom shoots, or anything where you'd like a photo made
- Licensing — for use of an existing photograph in editorial, commercial, or print contexts
- General — anything else, including questions about the prints, the site, or the writing

Email only. No form, no portal — direct email is the whole interface.

StudioTJ — eenmanszaak, the Netherlands
KvK: 75602172
BTW: NL002283139B11
Post: Keurenplein 41, Box D2818, 1069CD Amsterdam`

// ─── Header ───────────────────────────────────────────────────────────────────

export function formatLlmsHeader(): string {
  return [
    '# StudioTJ',
    '',
    '> Photography, print, and writing by Tjeerd van der Heeft. Four collections, a shop, and The Subtext Lab — media analysis covering film, series, anime, games, books, comics, manga, music.',
    '',
    'StudioTJ is a one-person studio based in Maastricht, Netherlands. The work splits between photography (portfolio and shop) and writing — short editorial on the blog, longer analytical pieces on The Subtext Lab. /gear, /picks, and /vondsten are reference surfaces: gear in use, brand recommendations in English, productcuratie in Dutch.',
  ].join('\n')
}

// ─── Formatters ───────────────────────────────────────────────────────────────

export function formatLlmsTxt(inventory: LlmsSection[]): string {
  const lines: string[] = [formatLlmsHeader(), '']
  for (const section of inventory) {
    lines.push(`## ${section.heading}`, '')
    for (const entry of section.entries) {
      lines.push(`- [${entry.title}](${entry.url}): ${entry.description}`)
    }
    lines.push('')
  }
  return lines.join('\n').trimEnd() + '\n'
}

export function formatLlmsFullTxt(sections: LlmsSectionFull[]): string {
  const lines: string[] = [formatLlmsHeader(), '']

  // Link inventory (same shape as llms.txt)
  for (const section of sections) {
    lines.push(`## ${section.heading}`, '')
    for (const entry of section.entries) {
      lines.push(`- [${entry.title}](${entry.url}): ${entry.description}`)
    }
    lines.push('')
  }

  // Full content
  lines.push('## Full Content')

  for (const section of sections) {
    for (const entry of section.entries) {
      const body = entry.body?.trim()
      lines.push('', '---', '', `# ${entry.title}`, '', `Source: ${entry.url}`)
      if (body) {
        lines.push('', body)
      }
    }
  }

  lines.push('')
  return lines.join('\n').trimEnd() + '\n'
}

// ─── Main inventory builder ───────────────────────────────────────────────────

async function buildData(): Promise<LlmsSectionFull[]> {
  const sections: LlmsSectionFull[] = []

  // ── 1. Portfolio ─────────────────────────────────────────────────────────────
  const portfolio = getPortfolio()
  const rawCollections = portfolio?.collections ?? []
  const rawPhotos = portfolio?.photos ?? []
  const collections = sortCollections(rawCollections, rawPhotos)

  const portfolioOverviewBody = [
    'Four collections. Each one answers a different question about what a photograph can be.',
    '',
    ...collections.flatMap(col => [
      `## ${col.name}`, '', `*${col.tagline}*`, '', col.description, '',
    ]),
  ].join('\n').trimEnd()

  const portfolioEntries: LlmsEntryFull[] = [
    {
      title: 'Portfolio',
      url: `${BASE_URL}/portfolio`,
      description: 'Four collections. Each one answers a different question about what a photograph can be.',
      body: portfolioOverviewBody,
    },
    ...collections.map(col => ({
      title: col.name,
      url: `${BASE_URL}/portfolio/${col.slug}`,
      description: truncate(col.tagline),
      body: [`*${col.tagline}*`, '', col.description].join('\n'),
    })),
  ]
  sections.push({ heading: 'Portfolio', entries: portfolioEntries })

  // ── 2. Series ─────────────────────────────────────────────────────────────────
  const allSeries = getAllSeries()
  const routeEntries = getRouteEntries()

  const seriesOverviewBody = [
    'Ongoing sequences of photographs, organized by subject, weather, and season.',
    '',
    ...allSeries.flatMap(s => {
      const block = [`## ${s.display_name}`, '', s.description]
      if (s.evergreen_note) block.push('', s.evergreen_note)
      if (s.refill_note) block.push('', s.refill_note)
      block.push('')
      return block
    }),
  ].join('\n').trimEnd()

  const seriesEntries: LlmsEntryFull[] = [
    {
      title: 'Series',
      url: `${BASE_URL}/series`,
      description: 'Ongoing sequences of photographs, organized by subject, weather, and season.',
      body: seriesOverviewBody,
    },
  ]

  for (const series of allSeries) {
    const seriesBodyParts = [series.description]
    if (series.evergreen_note) seriesBodyParts.push('', series.evergreen_note)
    if (series.refill_note) seriesBodyParts.push('', series.refill_note)

    seriesEntries.push({
      title: series.display_name,
      url: `${BASE_URL}/series/${series.slug}`,
      description: truncate(series.description),
      body: seriesBodyParts.join('\n'),
    })

    if (series.routing === 'manual_only') {
      for (const route of routeEntries) {
        seriesEntries.push({
          title: route.display_name,
          url: `${BASE_URL}/series/${series.slug}/${route.route_slug}`,
          description: truncate(`Walk through ${route.display_name} — ${route.photo_count} photographs, chronological sequence.`),
          body: `A walk through ${route.display_name} — ${route.photo_count} photographs, chronological sequence.\n\n${series.description}`,
        })
      }
    } else {
      for (const sp of series.sub_pools ?? []) {
        const label = sp.slug.charAt(0).toUpperCase() + sp.slug.slice(1).replace(/-/g, ' ')
        seriesEntries.push({
          title: `${series.display_name} — ${label}`,
          url: `${BASE_URL}/series/${series.slug}/${sp.slug}`,
          description: truncate(`${series.display_name} photographs — ${label} pool.`),
          body: `Part of ${series.display_name}. ${series.description}\n\nSubject pool: ${label}.`,
        })
      }
    }
  }
  sections.push({ heading: 'Series', entries: seriesEntries })

  // ── 3. Subtext Lab ───────────────────────────────────────────────────────────
  const subtextPosts = await getAllPosts('subtext-lab')
  const subtextEntries: LlmsEntryFull[] = [
    {
      title: 'The Subtext Lab',
      url: `${BASE_URL}/subtext-lab`,
      description: 'Notes on media and digital society. Threads between pieces — an article catches the first thought, an essay develops it, video carries it further.',
      body: 'Notes on media and digital society. Threads between pieces — an article catches the first thought, an essay develops it, video carries it further.\n\nAnalytical writing covering games, film, TV, anime, manga, comics, books, music, technology, and digital society. Contact: subtext@studiotj.com',
    },
  ]
  for (const post of subtextPosts) {
    const full = await getPostBySlug('subtext-lab', post.slug)
    subtextEntries.push({
      title: post.frontmatter.title,
      url: `${BASE_URL}/subtext-lab/${post.slug}`,
      description: truncate(post.summary),
      body: full ? stripJsx(full.body) || undefined : undefined,
    })
  }
  sections.push({ heading: 'Subtext Lab', entries: subtextEntries })

  // ── 4. Blog ──────────────────────────────────────────────────────────────────
  const blogPosts = await getAllPosts('blog')
  const blogEntries: LlmsEntryFull[] = [
    {
      title: 'Blog',
      url: `${BASE_URL}/blog`,
      description: 'Short notes from the edit desk and the studio. Longer pieces from the walk itself.',
      body: "Short notes from the edit desk and the studio. Longer pieces from the walk itself.\n\nNotes are quick — something caught the eye in editing, a shoot worked or didn't. Essays are slower — a day spent shooting somewhere, written long enough to do justice to the place. Photography is at the centre: the process, the craft, the choices that make a frame work.",
    },
  ]
  for (const post of blogPosts) {
    const full = await getPostBySlug('blog', post.slug)
    blogEntries.push({
      title: post.frontmatter.title,
      url: `${BASE_URL}/blog/${post.slug}`,
      description: truncate(post.summary),
      body: full ? stripJsx(full.body) || undefined : undefined,
    })
  }
  sections.push({ heading: 'Blog', entries: blogEntries })

  // ── 5. My Gear ───────────────────────────────────────────────────────────────
  const gearLanding = loadGearLanding()
  const activeGearCategories = loadActiveGearCategories()
  const sortedGearCats = [...activeGearCategories].sort()

  const gearEntries: LlmsEntryFull[] = [
    {
      title: 'My Gear',
      url: `${BASE_URL}/gear`,
      description: firstPara(gearLanding.body) || "What I carry, what I shoot with, what I'd add next.",
      body: stripJsx(gearLanding.body) || undefined,
    },
  ]

  for (const cat of sortedGearCats) {
    const intro = loadGearCategoryIntro(cat)
    const catLabel = GEAR_CATEGORY_LABELS[cat]

    gearEntries.push({
      title: catLabel,
      url: `${BASE_URL}/gear/${cat}`,
      description: intro ? (firstPara(intro.body) || catLabel) : catLabel,
      body: intro ? (stripJsx(intro.body) || undefined) : undefined,
    })

    const items = [...loadAllItemsInCategory(cat)].sort((a, b) => a.name.localeCompare(b.name))
    for (const item of items) {
      gearEntries.push({
        title: item.name,
        url: `${BASE_URL}/gear/${cat}/${item.slug}`,
        description: truncate(item.summary),
        body: stripJsx(item.body) || undefined,
      })
    }
  }
  sections.push({ heading: 'My Gear', entries: gearEntries })

  // ── 6. Picks ─────────────────────────────────────────────────────────────────
  const picksLanding = loadPicksLanding()
  const activePicksCats = loadActivePicksCategories()
  const sortedPicksCats = [...activePicksCats].sort()

  const picksEntries: LlmsEntryFull[] = [
    {
      title: 'Picks',
      url: `${BASE_URL}/picks`,
      description: firstPara(picksLanding.body) || 'Curated brands across photography, software, print, workspace, and more.',
      body: stripJsx(picksLanding.body) || undefined,
    },
  ]

  for (const cat of sortedPicksCats) {
    const intro = loadPicksCategoryIntro(cat)
    const catLabel = PICKS_CATEGORY_LABELS[cat]

    picksEntries.push({
      title: catLabel,
      url: `${BASE_URL}/picks/${cat}`,
      description: intro ? (firstPara(intro.body) || catLabel) : catLabel,
      body: intro ? (stripJsx(intro.body) || undefined) : undefined,
    })

    const brands = loadAllBrandsInCategory(cat)
    for (const brand of brands) {
      picksEntries.push({
        title: brand.name,
        url: `${BASE_URL}/picks/${cat}/${brand.slug}`,
        description: truncate(brand.hook),
        body: stripJsx(brand.body) || undefined,
      })

      const products = loadBrandProducts(cat, brand.slug)
      for (const product of products) {
        picksEntries.push({
          title: product.title,
          url: `${BASE_URL}/picks/${cat}/${brand.slug}/${product.slug}`,
          description: truncate(product.description),
          body: stripJsx(product.body) || undefined,
        })
      }
    }
  }
  sections.push({ heading: 'Picks', entries: picksEntries })

  // ── 7. Vondsten ──────────────────────────────────────────────────────────────
  const vondstenLanding = getVondstenLanding()

  const vondstenEntries: LlmsEntryFull[] = [
    {
      title: 'Vondsten',
      url: `${BASE_URL}/vondsten`,
      description: firstPara(vondstenLanding.body) || 'Editoriale productselecties per categorie. Alle producten op amazon.nl.',
      body: stripJsx(vondstenLanding.body) || undefined,
    },
  ]

  for (const cat of VONDSTEN_CATEGORIES) {
    const products = getVondstenProducts(cat)
    if (products.length === 0) continue

    const catLabel = VONDSTEN_CATEGORY_DISPLAY[cat]
    let catDesc = catLabel
    let catBody: string | undefined

    try {
      const intro = getVondstenCategoryIntro(cat)
      const stripped = stripJsx(intro.body)
      catDesc = firstPara(intro.body) || catLabel
      catBody = stripped || undefined
    } catch {
      // no _intro.mdx for this category — use label as description
    }

    vondstenEntries.push({
      title: catLabel,
      url: `${BASE_URL}/vondsten/${cat}`,
      description: catDesc,
      body: catBody,
    })

    const sortedProducts = [...products].sort((a, b) => a.name.localeCompare(b.name))
    for (const product of sortedProducts) {
      vondstenEntries.push({
        title: product.name,
        url: `${BASE_URL}/vondsten/${cat}/${product.slug}`,
        description: truncate(product.hook),
        body: stripJsx(product.body) || undefined,
      })
    }
  }
  sections.push({ heading: 'Vondsten', entries: vondstenEntries })

  // ── 8. Shop ──────────────────────────────────────────────────────────────────
  const shopEntries: LlmsEntryFull[] = [
    {
      title: 'Shop',
      url: `${BASE_URL}/shop`,
      description: 'Fine art prints and objects. Printed on demand, shipped from the Netherlands.',
      body: 'Fine art prints and objects. Printed on demand, shipped from the Netherlands. Fulfilled via Printify partners.',
    },
  ]

  try {
    const shopProducts = await getPrintifyProducts()
    for (const product of shopProducts) {
      const firstSentence = (product.description.split(/[.!?]\s/)[0] ?? product.title).trim()
      const { min, max } = getPriceRange(product)
      const priceStr = min === max ? formatPrice(min) : `${formatPrice(min)} – ${formatPrice(max)}`
      shopEntries.push({
        title: product.title,
        url: `${BASE_URL}/shop/${product.id}`,
        description: truncate(firstSentence),
        body: [`${product.description}`, '', `Price: ${priceStr}`, 'Available: Yes'].join('\n'),
      })
    }
  } catch (err) {
    console.error('[llms] Printify fetch failed — omitting shop products:', err)
  }
  sections.push({ heading: 'Shop', entries: shopEntries })

  // ── 9. About ─────────────────────────────────────────────────────────────────
  sections.push({
    heading: 'About',
    entries: [
      {
        title: 'About',
        url: `${BASE_URL}/about`,
        description: 'Personal story, work, and how to reach me.',
        body: ABOUT_BODY,
      },
      {
        title: 'Contact',
        url: `${BASE_URL}/contact`,
        description: 'Email, KvK, BTW, postal address.',
        body: CONTACT_BODY,
      },
    ],
  })

  return sections
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function buildLlmsInventory(): Promise<LlmsSection[]> {
  const full = await buildData()
  return full.map(s => ({
    heading: s.heading,
    entries: s.entries.map(({ title, url, description }) => ({ title, url, description })),
  }))
}

export async function buildLlmsFullData(): Promise<LlmsSectionFull[]> {
  return buildData()
}
