import type { JournalEntry, JournalIndexEntry, ResolvedJournalEntry } from '../types/journal'

function slugifyText(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function getBaseSlug(entry: JournalEntry) {
  if (entry.slug && entry.slug.trim()) {
    return slugifyText(entry.slug)
  }

  if (typeof entry.day === 'number') {
    return `day-${entry.day}`
  }

  const dayLabel = String(entry.day).trim()
  const weekMatch = dayLabel.match(/^w(\d+)$/i)
  if (weekMatch) {
    return `week-${weekMatch[1]}`
  }

  const fromDay = slugifyText(dayLabel)
  if (fromDay) return fromDay

  const fromTitle = slugifyText(entry.title)
  if (fromTitle) return fromTitle

  return 'journal-entry'
}

export function resolveJournalEntries(entries: JournalEntry[]): ResolvedJournalEntry[] {
  const slugCount = new Map<string, number>()

  return entries.map((entry) => {
    const base = getBaseSlug(entry)
    const used = slugCount.get(base) ?? 0
    const slug = used === 0 ? base : `${base}-${used + 1}`
    slugCount.set(base, used + 1)

    return {
      ...entry,
      slug,
    }
  })
}

export function findJournalEntryBySlug(entries: ResolvedJournalEntry[], slug: string) {
  const normalized = slugifyText(slug)
  if (!normalized) return null

  return (
    entries.find((entry) => entry.slug === normalized) ??
    entries.find((entry) => String(entry.day).toLowerCase() === normalized) ??
    null
  )
}

export function findJournalIndexBySlug(entries: JournalIndexEntry[], slug: string) {
  const normalized = slugifyText(slug)
  if (!normalized) return null

  return (
    entries.find((entry) => entry.slug === normalized) ??
    entries.find((entry) => String(entry.day).toLowerCase() === normalized) ??
    null
  )
}

/**
 * Strip WeChat-style boilerplate ("方鑫一人公司纪实 Day 87 | XXX") from a
 * journal title so the listing only shows the substantive subtitle.
 *
 * Strategy: split the title on `|`, drop any segment that is pure boilerplate
 * (author-prefix + column-name + optional day/no marker, OR a standalone
 * "Day NN" / "No.NN" segment), rejoin the rest with " | ".
 *
 * Returns "" when the entire title was boilerplate — caller can decide whether
 * to fall back to the summary, the day number, or the raw title.
 */
const BOILERPLATE_FULL = /^(方鑫|独舟).{0,8}(纪实|创业日志|创业周报|日报)(\s*[·\s]\s*(Day|No\.?)\s*[·\s]?\s*\d+)?$/i
const BOILERPLATE_DAY_ONLY = /^(Day|No\.?)\s*[·\s]?\s*\d+$/i

function isBoilerplateSegment(segment: string): boolean {
  const trimmed = segment.trim()
  if (!trimmed) return true
  if (BOILERPLATE_FULL.test(trimmed)) return true
  if (BOILERPLATE_DAY_ONLY.test(trimmed)) return true
  return false
}

export function cleanJournalTitle(rawTitle: string): string {
  if (!rawTitle) return ''
  const segments = rawTitle.split('|').map((s) => s.trim()).filter(Boolean)
  const kept = segments.filter((s) => !isBoilerplateSegment(s))
  return kept.join(' | ')
}

/**
 * Strip the WeChat article opener boilerplate from a summary, e.g.:
 *   "你正在阅读的是《方鑫一人公司创业日志 day46》, 今天我..."
 * becomes:
 *   "今天我..."
 */
const SUMMARY_OPENER = /^你正在阅读的是《[^》]*》[，,。\s]*/
const SUMMARY_GREETING = /^(各位.{0,4}股东.{0,8}|大家好.{0,8}|首先[，,]\s*给.{0,12}汇报[^，,]*[，,]\s*)/

function cleanJournalSummary(rawSummary: string): string {
  let s = rawSummary.trim()
  // Strip 1-2 leading boilerplate sentences if present.
  for (let i = 0; i < 2; i++) {
    const before = s
    s = s.replace(SUMMARY_OPENER, '').trim()
    s = s.replace(SUMMARY_GREETING, '').trim()
    if (s === before) break
  }
  return s
}

function clipToFirstSentence(text: string, maxChars = 40): string {
  const firstStop = text.search(/[。！？\n]/)
  const cut = firstStop > 0 ? text.slice(0, firstStop) : text
  return cut.length > maxChars ? cut.slice(0, maxChars) + '…' : cut
}

/**
 * The user-facing title for a journal entry: cleaned title with sensible
 * fallbacks when the original was 100% boilerplate.
 *   1. Cleaned title (preferred)
 *   2. Cleaned summary first sentence (~40 chars)
 *   3. Cleaned content first sentence (~40 chars) — handles entries where both
 *      title and summary are the WeChat boilerplate
 *   4. Original raw title (last resort — never show empty)
 */
export function getDisplayJournalTitle(entry: {
  title: string
  summary?: string
  content?: string
}): string {
  const cleaned = cleanJournalTitle(entry.title)
  if (cleaned) return cleaned

  const summary = entry.summary ? cleanJournalSummary(entry.summary) : ''
  if (summary) return clipToFirstSentence(summary)

  const content = entry.content ? cleanJournalSummary(entry.content) : ''
  if (content) return clipToFirstSentence(content)

  return entry.title
}
