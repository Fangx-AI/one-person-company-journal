#!/usr/bin/env node
/**
 * Builds a lightweight journal index + per-entry detail bundles from the
 * master `public/data/journal-entries.json` file.
 *
 * Why this exists:
 *   The master file is the single source of truth, but it grows ~4KB per new
 *   entry. After 1 year of daily journaling it is ~1.5MB; after 3 years it
 *   would be ~4.4MB and the journal list page would have to download every
 *   word of every post just to render a list of titles.
 *
 * Output:
 *   public/data/journal-index.json
 *     - Array of { day, title, summary, slug, tags, cover } — never grows
 *       past ~50KB even with 1000+ entries.
 *   public/data/journal/<slug>.json
 *     - Full entry payload, fetched lazily when the user opens a detail page
 *       or the in-list modal.
 *
 * Run as part of `npm run check:release`. Idempotent — safe to run repeatedly.
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')
const DATA_DIR = path.join(ROOT, 'public', 'data')
const SOURCE = path.join(DATA_DIR, 'journal-entries.json')
const INDEX_OUT = path.join(DATA_DIR, 'journal-index.json')
const ENTRY_OUT_DIR = path.join(DATA_DIR, 'journal')

function slugifyText(input) {
  return String(input)
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ---------- Title cleaning (mirrors src/utils/journal.ts) ----------
//
// WeChat publication titles include heavy SEO boilerplate prefixes/suffixes
// like "方鑫一人公司纪实 Day 87 | XXX" or "...XXX | 方鑫一人公司创业日志·Day83".
// We strip them at build time so the index ships pre-cleaned `displayTitle`
// values — the list page never has to do this work at runtime.

const BOILERPLATE_FULL = /^(方鑫|独舟).{0,8}(纪实|创业日志|创业周报|日报)(\s*[·\s]\s*(Day|No\.?)\s*[·\s]?\s*\d+)?$/i
const BOILERPLATE_DAY_ONLY = /^(Day|No\.?)\s*[·\s]?\s*\d+$/i
const SUMMARY_OPENER = /^你正在阅读的是《[^》]*》[，,。\s]*/
const SUMMARY_GREETING = /^(各位.{0,4}股东.{0,8}|大家好.{0,8}|首先[，,]\s*给.{0,12}汇报[^，,]*[，,]\s*)/

function isBoilerplateSegment(segment) {
  const trimmed = segment.trim()
  if (!trimmed) return true
  return BOILERPLATE_FULL.test(trimmed) || BOILERPLATE_DAY_ONLY.test(trimmed)
}

function cleanTitle(rawTitle) {
  if (!rawTitle) return ''
  return String(rawTitle)
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => !isBoilerplateSegment(s))
    .join(' | ')
}

function cleanSummary(raw) {
  let s = String(raw ?? '').trim()
  for (let i = 0; i < 2; i++) {
    const before = s
    s = s.replace(SUMMARY_OPENER, '').trim()
    s = s.replace(SUMMARY_GREETING, '').trim()
    if (s === before) break
  }
  return s
}

function clipToFirstSentence(text, maxChars = 40) {
  const firstStop = text.search(/[。！？\n]/)
  const cut = firstStop > 0 ? text.slice(0, firstStop) : text
  return cut.length > maxChars ? cut.slice(0, maxChars) + '…' : cut
}

function deriveDisplayTitle(entry) {
  const cleaned = cleanTitle(entry.title)
  if (cleaned) return cleaned
  const summary = entry.summary ? cleanSummary(entry.summary) : ''
  if (summary) return clipToFirstSentence(summary)
  const content = entry.content ? cleanSummary(entry.content) : ''
  if (content) return clipToFirstSentence(content)
  return entry.title || ''
}

function getBaseSlug(entry) {
  if (entry.slug && String(entry.slug).trim()) {
    return slugifyText(entry.slug)
  }
  if (typeof entry.day === 'number') {
    return `day-${entry.day}`
  }
  const dayLabel = String(entry.day ?? '').trim()
  const weekMatch = dayLabel.match(/^w(\d+)$/i)
  if (weekMatch) return `week-${weekMatch[1]}`
  const fromDay = slugifyText(dayLabel)
  if (fromDay) return fromDay
  const fromTitle = slugifyText(entry.title ?? '')
  if (fromTitle) return fromTitle
  return 'journal-entry'
}

function resolveEntries(entries) {
  const slugCount = new Map()
  return entries.map((entry) => {
    const base = getBaseSlug(entry)
    const used = slugCount.get(base) ?? 0
    const slug = used === 0 ? base : `${base}-${used + 1}`
    slugCount.set(base, used + 1)
    return { ...entry, slug }
  })
}

function journalSortRank(entry) {
  if (typeof entry.day === 'number') return entry.day
  const week = String(entry.day ?? '').trim().match(/^w(\d+)$/i)
  if (week) return Number(week[1]) * 7
  return Number.NEGATIVE_INFINITY
}

function sortNewestFirst(entries) {
  return [...entries].sort((a, b) => journalSortRank(b) - journalSortRank(a))
}

async function readSource() {
  const raw = await fs.readFile(SOURCE, 'utf8')
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch (err) {
    throw new Error(`journal-entries.json is not valid JSON: ${err.message}`)
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('journal-entries.json must be a non-empty array')
  }
  return parsed
}

async function clearStaleDetailFiles(currentSlugs) {
  let existing
  try {
    existing = await fs.readdir(ENTRY_OUT_DIR)
  } catch (err) {
    if (err.code === 'ENOENT') return 0
    throw err
  }
  const allowed = new Set(currentSlugs.map((slug) => `${slug}.json`))
  let removed = 0
  for (const name of existing) {
    if (!name.endsWith('.json')) continue
    if (allowed.has(name)) continue
    await fs.unlink(path.join(ENTRY_OUT_DIR, name))
    removed += 1
  }
  return removed
}

function summariseSize(bytes) {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`
}

async function build() {
  const startedAt = Date.now()
  const source = await readSource()
  const resolved = sortNewestFirst(resolveEntries(source))

  const sourceBytes = Buffer.byteLength(JSON.stringify(source), 'utf8')

  // Build index payload (lightweight metadata only).
  // `displayTitle` is the cleaned, listing-ready title — see deriveDisplayTitle
  // above. We keep the raw `title` for SEO/meta usage on detail pages.
  const indexPayload = resolved.map((entry) => ({
    day: entry.day,
    title: entry.title,
    displayTitle: deriveDisplayTitle(entry),
    summary: entry.summary,
    slug: entry.slug,
    tags: Array.isArray(entry.tags) ? entry.tags : [],
    cover: entry.cover ?? '',
  }))

  await fs.mkdir(ENTRY_OUT_DIR, { recursive: true })

  // Atomic write helper: write to .tmp then rename, so a failed run never
  // leaves a half-written JSON the site might pick up.
  async function writeJsonAtomic(targetPath, data) {
    const tmpPath = `${targetPath}.tmp`
    await fs.writeFile(tmpPath, JSON.stringify(data), 'utf8')
    await fs.rename(tmpPath, targetPath)
  }

  await writeJsonAtomic(INDEX_OUT, indexPayload)

  let detailBytes = 0
  for (const entry of resolved) {
    const detailPath = path.join(ENTRY_OUT_DIR, `${entry.slug}.json`)
    const payload = {
      day: entry.day,
      title: entry.title,
      summary: entry.summary,
      content: entry.content ?? '',
      tags: Array.isArray(entry.tags) ? entry.tags : [],
      cover: entry.cover ?? '',
      images: Array.isArray(entry.images) ? entry.images : [],
      slug: entry.slug,
    }
    const serialized = JSON.stringify(payload)
    detailBytes += Buffer.byteLength(serialized, 'utf8')
    await writeJsonAtomic(detailPath, payload)
  }

  const removed = await clearStaleDetailFiles(resolved.map((e) => e.slug))

  const indexBytes = (await fs.stat(INDEX_OUT)).size
  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(2)

  console.log('Journal index built:')
  console.log(`  source: ${path.relative(ROOT, SOURCE)} (${summariseSize(sourceBytes)}, ${resolved.length} entries)`)
  console.log(`  index:  ${path.relative(ROOT, INDEX_OUT)} (${summariseSize(indexBytes)})`)
  console.log(`  details: ${resolved.length} files in ${path.relative(ROOT, ENTRY_OUT_DIR)} (${summariseSize(detailBytes)} total)`)
  if (removed > 0) {
    console.log(`  removed ${removed} stale detail file(s)`)
  }
  console.log(`  elapsed: ${elapsed}s`)
}

build().catch((err) => {
  console.error('build-journal-index failed:', err.message)
  process.exit(1)
})
