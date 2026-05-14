import type {
  JournalEntry,
  JournalIndexEntry,
  ResolvedJournalEntry,
} from '../types/journal'
import { resolveJournalEntries } from './journal'

declare const __BUILD_STAMP__: string

const FETCH_TIMEOUT_MS = 10000

// URL-level cache buster. Every deploy → new BUILD_STAMP → different URL,
// which forces every caching layer (browser, EdgeOne CDN, transparent
// proxies) to fetch from origin. `Cache-Control: no-cache` alone is not
// reliable here because some intermediate CDNs serve from edge cache
// regardless of client revalidation hints.
const BUILD_STAMP = typeof __BUILD_STAMP__ !== 'undefined' ? __BUILD_STAMP__ : 'dev'

const INDEX_CACHE_KEY = 'fxin-journal-index-v1'
const ENTRY_CACHE_PREFIX = 'fxin-journal-entry-v1:'

// Legacy cache key used while the journal data shipped as a single 200KB
// array. Cleared on first new load so users don't keep stale full payloads in
// localStorage forever.
const LEGACY_FULL_CACHE_KEY = 'fxin-journal-entries-v1'

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function purgeLegacyCache() {
  if (!isBrowser()) return
  try {
    window.localStorage.removeItem(LEGACY_FULL_CACHE_KEY)
  } catch {
    // ignore
  }
}

function readJsonFromCache<T>(key: string): T | null {
  if (!isBrowser()) return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function writeJsonToCache(key: string, value: unknown) {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Quota or private mode; safe to ignore.
  }
}

async function fetchJsonWithTimeout<T>(url: string): Promise<T> {
  const controller = new AbortController()
  const timeout = isBrowser()
    ? window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    : null
  try {
    // `no-cache` here means: ALWAYS revalidate against the origin via
    // If-None-Match (ETag), even when Cache-Control max-age has not expired.
    // Server returns 304 when nothing changed (zero bytes transferred), and
    // 200 with fresh JSON when we publish new entries. Without this, the
    // browser would honor the 10-minute max-age and silently serve a stale
    // index for up to 10 minutes after every publish.
    const response = await fetch(url, {
      cache: 'no-cache',
      signal: controller.signal,
    })
    if (!response.ok) {
      throw new Error(`Fetch ${url} failed: ${response.status}`)
    }
    return (await response.json()) as T
  } finally {
    if (timeout !== null) window.clearTimeout(timeout)
  }
}

// ---------- Index (lightweight list) ----------

export function getCachedJournalIndex(): JournalIndexEntry[] {
  const cached = readJsonFromCache<JournalIndexEntry[]>(INDEX_CACHE_KEY)
  if (!Array.isArray(cached) || cached.length === 0) return []
  return cached
}

export async function fetchLatestJournalIndex(): Promise<JournalIndexEntry[]> {
  purgeLegacyCache()
  const data = await fetchJsonWithTimeout<unknown>(
    `/data/journal-index.json?v=${BUILD_STAMP}`,
  )
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('journal-index payload empty or invalid')
  }
  const entries = data as JournalIndexEntry[]
  writeJsonToCache(INDEX_CACHE_KEY, entries)
  return entries
}

// ---------- Single entry detail (lazy) ----------

function entryCacheKey(slug: string) {
  return `${ENTRY_CACHE_PREFIX}${slug}`
}

export function getCachedJournalEntry(slug: string): ResolvedJournalEntry | null {
  if (!slug) return null
  const cached = readJsonFromCache<JournalEntry>(entryCacheKey(slug))
  if (!cached || typeof cached !== 'object') return null
  // Resolve in case the cached payload pre-dates the slug field guarantee.
  const [resolved] = resolveJournalEntries([cached])
  return resolved ?? null
}

export async function fetchJournalEntryBySlug(slug: string): Promise<ResolvedJournalEntry> {
  if (!slug) throw new Error('slug is required')
  const data = await fetchJsonWithTimeout<JournalEntry>(
    `/data/journal/${encodeURIComponent(slug)}.json?v=${BUILD_STAMP}`,
  )
  if (!data || typeof data !== 'object' || !data.title) {
    throw new Error(`journal entry ${slug} payload invalid`)
  }
  writeJsonToCache(entryCacheKey(slug), data)
  const [resolved] = resolveJournalEntries([data])
  if (!resolved) throw new Error(`journal entry ${slug} could not be resolved`)
  return resolved
}
