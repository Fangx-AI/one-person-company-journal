import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { JournalIndexEntry, ResolvedJournalEntry } from '../types/journal'
import { findJournalIndexBySlug, getDisplayJournalTitle } from '../utils/journal'
import { getJournalMetaLine } from '../utils/journalDates'
import {
  fetchJournalEntryBySlug,
  fetchLatestJournalIndex,
  getCachedJournalEntry,
  getCachedJournalIndex,
} from '../utils/journalLoader'

function ensureMetaByName(name: string) {
  let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  return el
}

function ensureMetaByProperty(property: string) {
  let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('property', property)
    document.head.appendChild(el)
  }
  return el
}

function ensureCanonical() {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  return el
}

function EntryBody({ entry }: { entry: ResolvedJournalEntry }) {
  if (!entry.content) {
    return (
      <p style={{ color: 'var(--color-text-3)' }}>内容即将更新,敬请期待。</p>
    )
  }
  return (
    <>
      {entry.content.split(/(\[IMG:\d+\])/).map((part, i) => {
        const imgMatch = part.match(/^\[IMG:(\d+)\]$/)
        if (imgMatch && entry.images) {
          const imgIdx = parseInt(imgMatch[1], 10)
          const src = entry.images[imgIdx]
          if (!src) return null
          return (
            <figure key={i} className="my-8 -mx-2 sm:-mx-4">
              <img
                src={src}
                alt={`${entry.title} 配图 ${imgIdx + 1}`}
                className="w-full h-auto block"
                loading="lazy"
                referrerPolicy="no-referrer"
                style={{ borderRadius: '2px' }}
              />
            </figure>
          )
        }
        return (
          <p key={i} className="whitespace-pre-line">
            {part}
          </p>
        )
      })}
    </>
  )
}

export function JournalDetail() {
  const { slug = '' } = useParams()
  const [index, setIndex] = useState<JournalIndexEntry[]>([])
  const [entry, setEntry] = useState<ResolvedJournalEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setLoadError(null)

    const cachedIndex = getCachedJournalIndex()
    if (cachedIndex.length > 0) setIndex(cachedIndex)

    const cachedEntry = getCachedJournalEntry(slug)
    if (cachedEntry && isMounted) {
      setEntry(cachedEntry)
      setLoading(false)
    }

    fetchLatestJournalIndex()
      .then((fresh) => {
        if (isMounted) setIndex(fresh)
      })
      .catch(() => {
        // Silent fail on index refresh; cached version (if any) keeps prev/next working.
      })

    fetchJournalEntryBySlug(slug)
      .then((fresh) => {
        if (isMounted) setEntry(fresh)
      })
      .catch(() => {
        if (isMounted && !cachedEntry) setLoadError('日志详情加载失败,请稍后重试。')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [slug])

  useEffect(() => {
    const previousTitle = document.title
    const descriptionMeta = ensureMetaByName('description')
    const twitterTitleMeta = ensureMetaByName('twitter:title')
    const twitterDescriptionMeta = ensureMetaByName('twitter:description')
    const ogTitleMeta = ensureMetaByProperty('og:title')
    const ogDescriptionMeta = ensureMetaByProperty('og:description')
    const ogUrlMeta = ensureMetaByProperty('og:url')
    const canonicalLink = ensureCanonical()
    const previousDescription = descriptionMeta?.getAttribute('content') ?? ''
    const previousTwitterTitle = twitterTitleMeta?.getAttribute('content') ?? ''
    const previousTwitterDescription = twitterDescriptionMeta?.getAttribute('content') ?? ''
    const previousOgTitle = ogTitleMeta?.getAttribute('content') ?? ''
    const previousOgDescription = ogDescriptionMeta?.getAttribute('content') ?? ''
    const previousOgUrl = ogUrlMeta?.getAttribute('content') ?? ''
    const previousCanonical = canonicalLink?.getAttribute('href') ?? ''

    if (entry) {
      const cleanTitle = getDisplayJournalTitle(entry)
      const pageTitle = `${cleanTitle} · 日志 · 方鑫三个金`
      const pageDescription = entry.summary || '一人公司日志详情页'
      const pageUrl = `https://fxin.cc/journal/${entry.slug}`

      document.title = pageTitle
      descriptionMeta?.setAttribute('content', pageDescription)
      twitterTitleMeta?.setAttribute('content', pageTitle)
      twitterDescriptionMeta?.setAttribute('content', pageDescription)
      ogTitleMeta?.setAttribute('content', pageTitle)
      ogDescriptionMeta?.setAttribute('content', pageDescription)
      ogUrlMeta?.setAttribute('content', pageUrl)
      canonicalLink?.setAttribute('href', pageUrl)
    } else if (!loading && !loadError) {
      const notFoundTitle = '日志未找到 · 方鑫三个金'
      const notFoundDescription = '未找到对应日志详情。'
      const notFoundUrl = `https://fxin.cc/journal/${slug}`

      document.title = notFoundTitle
      descriptionMeta?.setAttribute('content', notFoundDescription)
      twitterTitleMeta?.setAttribute('content', notFoundTitle)
      twitterDescriptionMeta?.setAttribute('content', notFoundDescription)
      ogTitleMeta?.setAttribute('content', notFoundTitle)
      ogDescriptionMeta?.setAttribute('content', notFoundDescription)
      ogUrlMeta?.setAttribute('content', notFoundUrl)
      canonicalLink?.setAttribute('href', notFoundUrl)
    }

    return () => {
      document.title = previousTitle
      descriptionMeta?.setAttribute('content', previousDescription)
      twitterTitleMeta?.setAttribute('content', previousTwitterTitle)
      twitterDescriptionMeta?.setAttribute('content', previousTwitterDescription)
      ogTitleMeta?.setAttribute('content', previousOgTitle)
      ogDescriptionMeta?.setAttribute('content', previousOgDescription)
      ogUrlMeta?.setAttribute('content', previousOgUrl)
      canonicalLink?.setAttribute('href', previousCanonical)
    }
  }, [entry, loading, loadError, slug])

  const currentIndexEntry = entry ? findJournalIndexBySlug(index, entry.slug) : null
  const currentIndexPos = currentIndexEntry ? index.indexOf(currentIndexEntry) : -1
  // Index is sorted newest -> oldest. So `prev` (newer) lives at index-1, `next` (older) at index+1.
  const newerEntry = currentIndexPos > 0 ? index[currentIndexPos - 1] : null
  const olderEntry =
    currentIndexPos >= 0 && currentIndexPos < index.length - 1 ? index[currentIndexPos + 1] : null

  return (
    <article className="reading-column py-10 sm:py-14 md:py-16">
      <Link
        to="/journal"
        className="inline-block text-xs mb-8 sm:mb-10"
        style={{ color: 'var(--color-text-3)' }}
      >
        ← 返回日志列表
      </Link>

      {loading && !entry ? (
        <div aria-busy="true" aria-live="polite">
          <div className="skeleton-line" style={{ width: '5rem', height: '0.7rem' }} />
          <div className="skeleton-line" style={{ width: '70%', height: '1.6rem', marginTop: '0.5rem' }} />
          <div style={{ marginTop: '2rem' }}>
            <div className="skeleton-line" style={{ width: '100%' }} />
            <div className="skeleton-line" style={{ width: '95%' }} />
            <div className="skeleton-line" style={{ width: '90%' }} />
          </div>
        </div>
      ) : loadError ? (
        <div className="text-center py-10">
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-2)' }}>{loadError}</p>
          <Link to="/journal" className="text-sm underline underline-offset-4" style={{ color: 'var(--color-text)' }}>
            返回日志列表
          </Link>
        </div>
      ) : !entry ? (
        <div className="text-center py-10">
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-2)' }}>未找到对应日志。</p>
          <Link to="/journal" className="text-sm underline underline-offset-4" style={{ color: 'var(--color-text)' }}>
            返回日志列表
          </Link>
        </div>
      ) : (
        <>
          <header>
            <span
              className="block text-xs mb-3"
              style={{ color: 'var(--color-text-3)', letterSpacing: '0.1em' }}
            >
              {getJournalMetaLine(entry)}
            </span>
            <h1
              className="m-0 mb-4 sm:mb-5 font-semibold leading-tight"
              style={{
                color: 'var(--color-text)',
                fontSize: 'clamp(1.5rem, 4vw, 2rem)',
              }}
            >
              {getDisplayJournalTitle(entry)}
            </h1>
            {entry.summary && (
              <p
                className="m-0 text-base sm:text-lg leading-relaxed"
                style={{ color: 'var(--color-text-2)' }}
              >
                {entry.summary}
              </p>
            )}
            {entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-5 text-xs" style={{ color: 'var(--color-text-3)' }}>
                {entry.tags.map((tag) => (
                  <span key={tag}>#{tag}</span>
                ))}
              </div>
            )}
          </header>

          <hr
            className="my-8 sm:my-10 border-0"
            style={{ borderTop: '1px solid var(--color-divider)' }}
          />

          <div className="prose-zh">
            <EntryBody entry={entry} />
          </div>

          {(newerEntry || olderEntry) && (
            <nav
              className="mt-14 sm:mt-16 pt-8 grid gap-3 sm:grid-cols-2"
              style={{ borderTop: '1px solid var(--color-divider)' }}
            >
              {newerEntry ? (
                <Link
                  to={`/journal/${newerEntry.slug}`}
                  className="block group"
                >
                  <span className="block text-xs mb-1" style={{ color: 'var(--color-text-3)' }}>← 更新一篇</span>
                  <span
                    className="block text-sm leading-snug group-hover:underline underline-offset-4"
                    style={{ color: 'var(--color-text)' }}
                  >
                    {newerEntry.displayTitle ?? getDisplayJournalTitle(newerEntry)}
                  </span>
                </Link>
              ) : (
                <span />
              )}
              {olderEntry && (
                <Link
                  to={`/journal/${olderEntry.slug}`}
                  className="block group sm:text-right"
                >
                  <span className="block text-xs mb-1" style={{ color: 'var(--color-text-3)' }}>更早一篇 →</span>
                  <span
                    className="block text-sm leading-snug group-hover:underline underline-offset-4"
                    style={{ color: 'var(--color-text)' }}
                  >
                    {olderEntry.displayTitle ?? getDisplayJournalTitle(olderEntry)}
                  </span>
                </Link>
              )}
            </nav>
          )}
        </>
      )}
    </article>
  )
}
