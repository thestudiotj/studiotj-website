export type LearnTeaser = {
  family: string
  displayName: string
  teaser: string
}

export const LEARN_TEASERS: Record<string, LearnTeaser> = {
  hpr: {
    family: 'hpr',
    displayName: 'Hahnemühle Photo Rag',
    teaser:
      "Hahnemühle Photo Rag is the museum standard for fine art photography on cotton — it renders deep blacks across a matte surface, takes pigment evenly through 308gsm of pure cotton, and stays true for a century or more in good light. Not only a paper — a substrate built for the photo to outlast the room it hangs in.",
  },
  hge: {
    family: 'hge',
    displayName: 'Hahnemühle German Etching',
    teaser:
      "Hahnemühle German Etching is the textured matte paper at the museum tier — 310gsm of mould-made alpha-cellulose, a soft tooth that catches light across the surface, archival pigment that settles into the texture. Not only a paper — a substrate that adds weight to the photograph.",
  },
  ema: {
    family: 'ema',
    displayName: 'Enhanced Matte Art',
    teaser:
      "Enhanced Matte Art is the bright white matte paper at the heart of the StudioTJ catalog — 200gsm of alpha-cellulose, a smooth matte surface, archival pigment that prints cleanly across every register. Not only a paper — a substrate that holds whatever the catalog asks of it.",
  },
  clp: {
    family: 'clp',
    displayName: 'C-type Lustre Pro',
    teaser:
      "C-type Lustre Pro is silver halide photographic paper at the archival professional tier — exposed by RGB laser in a colour lab, finished with a lustre surface that holds detail across the full tonal range. Not only a paper — a print made by the photographic process the medium grew up on.",
  },
  can: {
    family: 'can',
    displayName: 'Stretched Canvas',
    teaser:
      "Stretched canvas is the wall-ready form of the photograph — 400gsm canvas wrapped over a 38mm Float ImageWrap stretcher, archival pigment held in the weave, the image carried around the edges. Not only a print — a photograph the wall can carry directly.",
  },
  fap: {
    family: 'fap',
    displayName: 'Framed Art Print',
    teaser:
      "A framed art print is a Photo Rag print finished for the wall — a Classic frame in black, white, or natural oak, glass glaze across the face, the print filling the frame edge-to-edge. Not only a print — a photograph framed at the gallery standard.",
  },
  gre: {
    family: 'gre',
    displayName: 'Fine Art Greeting Cards',
    teaser:
      "A fine art greeting card is a photograph on Mohawk 324gsm uncoated paper — heavy, textured, off-white, with a single image taking up the full face. Sets of ten, twenty, fifty, or a hundred. Not only a card — a photograph kept in the home it arrives at.",
  },
  pos: {
    family: 'pos',
    displayName: 'Fine Art Postcards',
    teaser:
      "A fine art postcard is a photograph on Mohawk 324gsm uncoated paper — heavy, textured, off-white, with a single landscape image on the front and a writing surface on the back. Sets of ten, twenty, fifty, or a hundred. Not only a postcard — a photograph that travels with a message written across it.",
  },
}

export function getLearnTeaser(family: string | undefined): LearnTeaser | null {
  if (!family) return null
  return LEARN_TEASERS[family] ?? null
}

export function getAllLearnFamilies(): string[] {
  return Object.keys(LEARN_TEASERS)
}
