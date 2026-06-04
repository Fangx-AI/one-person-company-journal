import { useEffect, useState } from 'react'
import { ExternalLink } from '../icons'
import type { RepostEntry } from '../types/repost'

declare const __BUILD_STAMP__: string

const BUILD_STAMP = typeof __BUILD_STAMP__ !== 'undefined' ? __BUILD_STAMP__ : 'dev'

function sortReposts(entries: RepostEntry[]) {
  return [...entries].sort((a, b) => {
    const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0
    const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0
    return bTime - aTime
  })
}

function formatDate(value?: string) {
  if (!value) return '未标日期'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export function Reposts() {
  const [entries, setEntries] = useState<RepostEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    const previousTitle = document.title
    document.title = '转载 · 方鑫三个金'

    async function load() {
      try {
        const response = await fetch(`/data/reposts.json?v=${BUILD_STAMP}`, {
          cache: 'no-cache',
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = (await response.json()) as RepostEntry[]
        setEntries(Array.isArray(data) ? sortReposts(data) : [])
        setLoadError(null)
      } catch {
        setLoadError('转载记录加载失败，请稍后重试。')
      } finally {
        setLoading(false)
      }
    }

    void load()
    return () => {
      document.title = previousTitle
    }
  }, [])

  return (
    <div className="reading-column py-12 sm:py-16 md:py-20">
      <h1 className="page-title">转载</h1>
      <div className="page-divider" />
      <p className="page-intro repost-intro">
        记录读到的好文章，留一个入口，
        <br className="sm:hidden" />
        也留一点当时的判断。
      </p>

      {loading ? (
        <div aria-busy="true" aria-live="polite">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="list-row">
              <div className="skeleton-line" style={{ width: '5rem' }} />
              <div className="skeleton-line" style={{ width: `${65 + ((i * 9) % 25)}%` }} />
            </div>
          ))}
        </div>
      ) : loadError ? (
        <p className="text-center text-sm" style={{ color: 'var(--color-text-2)' }}>
          {loadError}
        </p>
      ) : entries.length === 0 ? (
        <p className="text-center text-sm" style={{ color: 'var(--color-text-2)' }}>
          还没有转载记录。
        </p>
      ) : (
        <ul className="list-none p-0 m-0">
          {entries.map((entry, index) => (
            <li
              key={entry.id}
              className="repost-row"
              style={{ borderTop: index === 0 ? 'none' : '1px solid var(--color-divider)' }}
            >
              <span className="list-row__meta">{formatDate(entry.publishedAt)}</span>
              <div className="repost-row__body">
                <a
                  href={entry.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="repost-row__title"
                >
                  <span>{entry.title}</span>
                  <ExternalLink className="repost-row__icon" aria-hidden="true" />
                </a>
                {(entry.source || entry.author) && (
                  <p className="repost-row__source">
                    {[entry.source, entry.author].filter(Boolean).join(' · ')}
                  </p>
                )}
                {entry.note && <p className="repost-row__note">{entry.note}</p>}
                {entry.tags && entry.tags.length > 0 && (
                  <div className="repost-row__tags" aria-label="标签">
                    {entry.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <style>{`
        .repost-row {
          display: grid;
          grid-template-columns: minmax(92px, max-content) 1fr;
          gap: 1.25rem;
          align-items: baseline;
          padding: 14px 0 18px;
        }
        .repost-intro {
          max-width: 22em;
          margin-left: auto;
          margin-right: auto;
          overflow-wrap: anywhere;
        }
        .repost-row__body {
          min-width: 0;
        }
        .repost-row__title {
          display: inline-flex;
          align-items: baseline;
          gap: 0.35rem;
          color: var(--color-text);
          font-size: 17px;
          font-weight: 600;
          line-height: 1.5;
          text-decoration: none;
          border-bottom: 1px solid transparent;
        }
        .repost-row__title:hover,
        .repost-row__title:focus-visible {
          border-bottom-color: var(--color-text);
        }
        .repost-row__icon {
          width: 0.8em;
          height: 0.8em;
          color: var(--color-text-3);
          flex: 0 0 auto;
        }
        .repost-row__source,
        .repost-row__note {
          margin: 0.35rem 0 0;
          color: var(--color-text-2);
          font-size: 15px;
          line-height: 1.7;
        }
        .repost-row__tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
          margin-top: 0.6rem;
        }
        .repost-row__tags span {
          color: var(--color-text-3);
          font-family: var(--font-sans-zh);
          font-size: 13px;
        }
        .repost-row__tags span::before {
          content: "#";
        }

        @media (min-width: 600px) {
          .repost-row__title {
            font-size: 19px;
          }
        }

        @media (max-width: 520px) {
          .repost-row {
            grid-template-columns: 1fr;
            gap: 0.2rem;
          }
        }
      `}</style>
    </div>
  )
}
