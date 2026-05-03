// Run after deployment: node scripts/submit-indexnow.mjs
// Fetches the live sitemap and submits all URLs to IndexNow (Bing + others).

const HOST = 'studiotj.com'
const KEY = '9044ae6950b4405b8af9311d897d968e'
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'

async function fetchSitemapUrls() {
  const res = await fetch(`https://${HOST}/sitemap.xml`)
  if (!res.ok) throw new Error(`Sitemap fetch failed: ${res.status}`)
  const xml = await res.text()
  const matches = xml.matchAll(/<loc>(https?:\/\/[^<]+)<\/loc>/g)
  return [...matches].map((m) => m[1])
}

async function submitUrls(urls) {
  const res = await fetch(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: urls }),
  })
  return res.status
}

const urls = await fetchSitemapUrls()
console.log(`Found ${urls.length} URLs in sitemap`)

// IndexNow accepts up to 10,000 URLs per request
const BATCH = 10_000
for (let i = 0; i < urls.length; i += BATCH) {
  const chunk = urls.slice(i, i + BATCH)
  const status = await submitUrls(chunk)
  console.log(`Submitted ${chunk.length} URLs — HTTP ${status}`)
  if (status === 200) console.log('  OK: URLs accepted')
  else if (status === 202) console.log('  OK: URLs received (crawl not guaranteed)')
  else if (status === 400) console.log('  ERROR: Invalid format')
  else if (status === 403) console.log('  ERROR: Key not found at key location')
  else if (status === 422) console.log('  ERROR: URLs not belonging to host')
  else if (status === 429) console.log('  WARNING: Too many requests — slow down')
}
