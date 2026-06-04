export interface JournalDateEntry {
  day: number | string
  publishedAt?: string
}

export function timestampToChinaDate(timestampSeconds: number) {
  if (!Number.isFinite(timestampSeconds) || timestampSeconds <= 0) return ''
  return new Date((timestampSeconds + 8 * 60 * 60) * 1000).toISOString().slice(0, 10)
}

export function formatJournalDate(value?: string) {
  if (!value) return ''
  const trimmed = value.trim()
  if (!trimmed) return ''
  const date = new Date(`${trimmed}T00:00:00+08:00`)
  if (Number.isNaN(date.getTime())) return ''
  return trimmed.slice(0, 10)
}

export function formatJournalDay(day: number | string) {
  if (typeof day === 'number') return `Day ${day}`
  const match = String(day).match(/^W(\d+)$/i)
  if (match) return `Week ${match[1]}`
  return String(day)
}

export function getJournalMetaLine(entry: JournalDateEntry) {
  const date = formatJournalDate(entry.publishedAt)
  return [formatJournalDay(entry.day), date].filter(Boolean).join(' · ')
}
