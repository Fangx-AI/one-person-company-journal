import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const siteUrl = (process.env.SITE_URL || 'https://fxin.cc').replace(/\/+$/, '')
const entriesPath = resolve(process.cwd(), 'public/data/journal-entries.json')
const outputPath = resolve(process.cwd(), 'public/sitemap.xml')

function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function getEntrySlug(entry) {
  if (typeof entry.slug === 'string' && entry.slug.trim()) return entry.slug.trim()
  if (typeof entry.day === 'number') return `day-${entry.day}`
  const dayLabel = String(entry.day ?? '').trim().toLowerCase()
  const week = dayLabel.match(/^w(\d+)$/)
  if (week) return `week-${week[1]}`
  return dayLabel.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'journal-entry'
}

function buildUrl(path, priority, changefreq) {
  return {
    loc: `${siteUrl}${path}`,
    priority,
    changefreq,
  }
}

async function main() {
  const raw = await readFile(entriesPath, 'utf8')
  const entries = JSON.parse(raw)
  if (!Array.isArray(entries)) {
    throw new Error('journal-entries.json 必须是数组')
  }

  const staticUrls = [
    buildUrl('/', '1.0', 'daily'),
    buildUrl('/journal', '0.9', 'daily'),
    buildUrl('/skills', '0.8', 'weekly'),
    buildUrl('/products', '0.8', 'monthly'),
    buildUrl('/about', '0.6', 'monthly'),
  ]

  const journalUrls = entries.map((entry) => buildUrl(`/journal/${getEntrySlug(entry)}`, '0.7', 'weekly'))
  const today = new Date().toISOString()
  const allUrls = [...staticUrls, ...journalUrls]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (item) => `  <url>
    <loc>${escapeXml(item.loc)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`

  await writeFile(outputPath, xml, 'utf8')
  console.log(`sitemap 生成完成：${allUrls.length} 条 URL -> public/sitemap.xml`)
}

main().catch((error) => {
  console.error(`sitemap 生成失败：${error.message}`)
  process.exitCode = 1
})
