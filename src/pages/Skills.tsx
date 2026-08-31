import { useEffect, useState } from 'react'
import { ExternalLink } from '../icons'
import type { SkillEntry, SkillStatus } from '../types/skill'

declare const __BUILD_STAMP__: string

const BUILD_STAMP = typeof __BUILD_STAMP__ !== 'undefined' ? __BUILD_STAMP__ : 'dev'

const STATUS_LABELS: Record<SkillStatus, string> = {
  public: '公开',
  personal: '自用',
  experiment: '实验中',
}

const STATUS_ORDER: SkillStatus[] = ['public', 'experiment', 'personal']

export function Skills() {
  const [entries, setEntries] = useState<SkillEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Skill · 方鑫三个金'

    async function load() {
      try {
        const response = await fetch(`/data/skills.json?v=${BUILD_STAMP}`, { cache: 'no-cache' })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = (await response.json()) as SkillEntry[]
        setEntries(Array.isArray(data) ? data : [])
        setLoadError(null)
      } catch {
        setLoadError('Skill 列表加载失败，请稍后重试。')
      } finally {
        setLoading(false)
      }
    }

    void load()
    return () => {
      document.title = previousTitle
    }
  }, [])

  const groups = STATUS_ORDER.map((status) => ({
    status,
    entries: entries.filter((entry) => entry.status === status),
  })).filter((group) => group.entries.length > 0)

  return (
    <div className="reading-column py-12 sm:py-16 md:py-20">
      <h1 className="page-title">Skill</h1>
      <div className="page-divider" />
      <p className="page-intro skill-intro">
        把反复做的事，写成可复用的能力。
        <br />
        这里记录我做过、正在使用和持续迭代的 Skill。
      </p>

      {loading ? (
        <div aria-busy="true" aria-live="polite">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="list-row">
              <div className="skeleton-line" style={{ width: '5rem' }} />
              <div className="skeleton-line" style={{ width: `${62 + ((index * 7) % 24)}%` }} />
            </div>
          ))}
        </div>
      ) : loadError ? (
        <p className="skill-message">{loadError}</p>
      ) : (
        <div className="skill-groups">
          {groups.map((group) => (
            <section key={group.status} className="skill-group" aria-labelledby={`skill-${group.status}`}>
              <div className="skill-group__heading">
                <h2 id={`skill-${group.status}`}>{STATUS_LABELS[group.status]}</h2>
                <span>{group.entries.length}</span>
              </div>
              <ul className="skill-list">
                {group.entries.map((entry) => (
                  <li key={entry.id} className="skill-row">
                    <span className="skill-row__category">{entry.category}</span>
                    <div className="skill-row__body">
                      {entry.url ? (
                        <a
                          href={entry.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="skill-row__title"
                        >
                          <span>{entry.name}</span>
                          <ExternalLink className="skill-row__icon" aria-hidden="true" />
                        </a>
                      ) : (
                        <h3 className="skill-row__title">{entry.name}</h3>
                      )}
                      <p>{entry.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <style>{`
        .skill-intro {
          max-width: 31em;
          margin-left: auto;
          margin-right: auto;
        }
        .skill-message {
          margin: 0;
          text-align: center;
          color: var(--color-text-2);
          font-size: 15px;
        }
        .skill-groups {
          display: grid;
          gap: 52px;
        }
        .skill-group__heading {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          padding-bottom: 9px;
          border-bottom: 1px solid var(--color-divider-strong);
        }
        .skill-group__heading h2 {
          margin: 0;
          color: var(--color-text);
          font-family: var(--font-sans-zh);
          font-size: 15px;
          font-weight: 500;
        }
        .skill-group__heading span {
          color: var(--color-text-3);
          font-family: var(--font-sans-zh);
          font-size: 13px;
        }
        .skill-list {
          margin: 0;
          padding: 0;
          list-style: none;
        }
        .skill-row {
          display: grid;
          grid-template-columns: 112px minmax(0, 1fr);
          gap: 20px;
          padding: 18px 0 20px;
          border-bottom: 1px solid var(--color-divider);
        }
        .skill-row__category {
          padding-top: 4px;
          color: var(--color-text-3);
          font-family: var(--font-sans-zh);
          font-size: 13px;
          line-height: 1.5;
        }
        .skill-row__body {
          min-width: 0;
        }
        .skill-row__title {
          display: inline-flex;
          align-items: baseline;
          gap: 0.35rem;
          margin: 0;
          color: var(--color-text);
          font-size: 18px;
          font-weight: 600;
          line-height: 1.45;
          text-decoration: none;
          border-bottom: 1px solid transparent;
        }
        a.skill-row__title:hover,
        a.skill-row__title:focus-visible {
          border-bottom-color: var(--color-text);
        }
        .skill-row__icon {
          width: 0.78em;
          height: 0.78em;
          flex: 0 0 auto;
          color: var(--color-text-3);
        }
        .skill-row__body p {
          margin: 7px 0 0;
          color: var(--color-text-2);
          font-size: 15px;
          line-height: 1.75;
        }
        @media (min-width: 600px) {
          .skill-row__title {
            font-size: 19px;
          }
        }
        @media (max-width: 560px) {
          .skill-groups {
            gap: 42px;
          }
          .skill-row {
            grid-template-columns: 1fr;
            gap: 4px;
          }
          .skill-row__category {
            padding-top: 0;
          }
        }
      `}</style>
    </div>
  )
}
