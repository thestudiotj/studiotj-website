export function buildOverpassQuery(lat: number, lng: number, radiusM: number): string {
  const r = radiusM;
  const around = `(around:${r},${lat},${lng})`;

  const tier1 = [
    `node["historic"]${around}`,
    `way["historic"]${around}`,
    `node["tourism"~"^(attraction|museum|viewpoint)$"]${around}`,
    `way["tourism"~"^(attraction|museum|viewpoint)$"]${around}`,
    `node["building"~"^(church|cathedral|chapel|monastery|synagogue|temple|mosque)$"]${around}`,
    `way["building"~"^(church|cathedral|chapel|monastery|synagogue|temple|mosque)$"]${around}`,
    `node["amenity"="place_of_worship"]${around}`,
    `way["amenity"="place_of_worship"]${around}`,
    `node["man_made"~"^(tower|lighthouse|windmill|water_tower)$"]${around}`,
    `way["man_made"~"^(tower|lighthouse|windmill|water_tower)$"]${around}`,
    `node["place"="square"]${around}`,
    `way["place"="square"]${around}`,
    `node["leisure"~"^(park|garden)$"]${around}`,
    `way["leisure"~"^(park|garden)$"]${around}`,
    `node["natural"~"^(peak|cliff|cave_entrance)$"]${around}`,
    `way["natural"~"^(peak|cliff|cave_entrance)$"]${around}`,
    `node["waterway"="waterfall"]${around}`,
    `way["waterway"="waterfall"]${around}`,
  ];

  return `[out:json][timeout:25];\n(\n  ${tier1.join(';\n  ')};\n);\nout center tags;`;
}

export function matchedTag(tags: Record<string, string>): string {
  if (tags.historic) return `historic=${tags.historic}`;
  if (tags.tourism) return `tourism=${tags.tourism}`;
  if (tags.building && ['church','cathedral','chapel','monastery','synagogue','temple','mosque'].includes(tags.building))
    return `building=${tags.building}`;
  if (tags.amenity === 'place_of_worship') return `amenity=place_of_worship`;
  if (tags.man_made) return `man_made=${tags.man_made}`;
  if (tags.place === 'square') return `place=square`;
  if (tags.leisure) return `leisure=${tags.leisure}`;
  if (tags.natural) return `natural=${tags.natural}`;
  if (tags.waterway === 'waterfall') return `waterway=waterfall`;
  return 'unknown';
}
