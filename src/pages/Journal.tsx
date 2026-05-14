import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import type { JournalIndexEntry } from '../types/journal'
import {
  fetchLatestJournalIndex,
  getCachedJournalIndex,
} from '../utils/journalLoader'
import { getDisplayJournalTitle } from '../utils/journal'

// Week milestones — preserved from the previous version. Each anchor day marks
// the START of a week section in the chronological list (newest -> oldest).
const milestones: { day: number | string; label: string }[] = [
  { day: 94, label: '第十四周' },
  { day: 87, label: '第十三周' },
  { day: 84, label: '第十二周' },
  { day: 75, label: '第十一周' },
  { day: 'W10', label: '第十周' },
  { day: 'W9', label: '第九周' },
  { day: 'W8', label: '第八周' },
  { day: 48, label: '第七周' },
  { day: 42, label: '第六周' },
  { day: 35, label: '第五周' },
  { day: 28, label: '第四周' },
  { day: 21, label: '第三周' },
  { day: 14, label: '第二周' },
  { day: 7, label: '第一周' },
]

function findMilestone(day: number | string) {
  return milestones.find((m) => m.day === day) ?? null
}

function formatDayBadge(day: number | string) {
  if (typeof day === 'number') return `Day ${day}`
  // String like "W10" -> "第十周回顾"
  const match = String(day).match(/^W(\d+)$/i)
  if (match) return `Week ${match[1]}`
  return String(day)
}

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
            const milestone = findMilestone(entry.day)
            return (
              <div key={`${entry.day}-${entry.slug}-${i}`}>
                {milestone && (
                  <div className="section-label">— {milestone.label} —</div>
                )}
                <div className="list-row">
                  <span className="list-row__meta">{formatDayBadge(entry.day)}</span>
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
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
