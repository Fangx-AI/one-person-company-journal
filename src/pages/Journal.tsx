import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import type { JournalIndexEntry } from '../types/journal'
import {
  fetchLatestJournalIndex,
  getCachedJournalIndex,
} from '../utils/journalLoader'
import { getDisplayJournalTitle } from '../utils/journal'
import { formatJournalDate, formatJournalDay, getJournalMetaLine } from '../utils/journalDates'
import {
  formatWeekLabel,
  getJournalWeekNumber,
  shouldShowWeekLabel,
} from '../utils/journalWeeks'

function ListSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="list-row">
          <div className="skeleton-line" style={{ width: '4rem' }} />
          <div className="skeleton-line" style={{ width: `${60 + ((i * 7) % 30)}%` }} />
        </div>
      ))}
    </div>
  )
}

export function Journal() {
  const [entries, setEntries] = useState<JournalIndexEntry[]>(() => getCachedJournalIndex())
  const [loading, setLoading] = useState(entries.length === 0)
  const [loadError, setLoadError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const cached = getCachedJournalIndex()
    if (cached.length > 0) {
      setEntries(cached)
      setLoading(false)
    } else {
      setLoading(true)
    }

    try {
      const fresh = await fetchLatestJournalIndex()
      setEntries(fresh)
      setLoadError(null)
    } catch {
      if (cached.length === 0) {
        setLoadError('日志加载失败,请检查网络后重试。')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const previousTitle = document.title
    document.title = '日志 · 方鑫三个金'
    void load()
    return () => {
      document.title = previousTitle
    }
  }, [load])

  return (
    <div className="reading-column py-12 sm:py-16 md:py-20">
      <h1 className="page-title">日志</h1>
      <div className="page-divider" />
      <p className="page-intro">
        一人公司创业的日常记录。没有美化、没有包装,
        把每一天的所做、所想、所踩的坑都写下来。
      </p>

      {loading && entries.length === 0 ? (
        <ListSkeleton />
      ) : loadError && entries.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-2)' }}>
            {loadError}
          </p>
          <button
            type="button"
            onClick={() => void load()}
            className="text-sm underline underline-offset-4"
            style={{ color: 'var(--color-text)' }}
          >
            重新加载
          </button>
        </div>
      ) : (
        <div>
          {entries.map((entry, i) => {
            const weekNumber = getJournalWeekNumber(entry.day)
            return (
              <div key={`${entry.day}-${entry.slug}-${i}`}>
                {weekNumber !== null && shouldShowWeekLabel(entries, i) && (
                  <div className="section-label">— {formatWeekLabel(weekNumber)} —</div>
                )}
                <div className="list-row journal-list-row">
                  <span className="list-row__meta journal-list-row__day">{formatJournalDay(entry.day)}</span>
                  <Link to={`/journal/${entry.slug}`} className="list-row__title">
                    {/*
                      Always derive the display title client-side from the raw
                      `title`. Earlier we used `entry.displayTitle ?? fallback`,
                      but that meant any stale CDN edge serving an older JSON
                      (without the displayTitle field, or with a stale value)
                      would surface a raw boilerplate title to users. Recomputing
                      here is ~1ms for 62 entries and bypasses the entire
                      server-precomputation cache layer.
                    */}
                    {getDisplayJournalTitle(entry)}
                  </Link>
                  <span className="journal-list-row__mobile-meta">{getJournalMetaLine(entry)}</span>
                  {entry.publishedAt && (
                    <time className="journal-list-row__date" dateTime={entry.publishedAt}>
                      {formatJournalDate(entry.publishedAt)}
                    </time>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <style>{`
        .journal-list-row {
          grid-template-columns: minmax(72px, max-content) minmax(0, 1fr) max-content;
        }
        .journal-list-row__date {
          color: var(--color-text-3);
          font-family: var(--font-sans-zh);
          font-size: 14px;
          font-variant-numeric: tabular-nums;
          letter-spacing: 0.02em;
          white-space: nowrap;
        }
        .journal-list-row__mobile-meta {
          display: none;
        }
        .journal-list-row .list-row__title {
          min-width: 0;
          overflow-wrap: anywhere;
        }

        @media (max-width: 640px) {
          .journal-list-row {
            grid-template-columns: 1fr;
            gap: 0.15rem;
            align-items: start;
            width: calc(100vw - 30px);
            max-width: 100%;
          }
          .journal-list-row__day {
            display: none;
          }
          .journal-list-row__date {
            display: none;
          }
          .journal-list-row__mobile-meta {
            display: block;
            color: var(--color-text-3);
            font-family: var(--font-sans-zh);
            font-size: 13px;
            font-variant-numeric: tabular-nums;
            line-height: 1.4;
          }
          .journal-list-row .list-row__title {
            order: 1;
            display: block;
            width: 100%;
            max-width: 100%;
            white-space: normal !important;
            overflow-wrap: anywhere !important;
            word-break: break-all !important;
          }
          .journal-list-row__mobile-meta {
            order: 2;
          }
        }
      `}</style>
    </div>
  )
}
