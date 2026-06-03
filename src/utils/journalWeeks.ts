export interface JournalWeekEntry {
  day: number | string
}

const CHINESE_DIGITS = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九']

function formatChineseNumber(value: number) {
  if (value <= 0) return String(value)
  if (value < 10) return CHINESE_DIGITS[value]
  if (value === 10) return '十'
  if (value < 20) return `十${CHINESE_DIGITS[value % 10]}`
  if (value < 100) {
    const tens = Math.floor(value / 10)
    const ones = value % 10
    return `${CHINESE_DIGITS[tens]}十${ones ? CHINESE_DIGITS[ones] : ''}`
  }
  return String(value)
}

export function getJournalWeekNumber(day: number | string) {
  if (typeof day === 'number') return Math.ceil(day / 7)

  const week = String(day).trim().match(/^W(\d+)$/i)
  if (week) return Number(week[1])

  return null
}

export function formatWeekLabel(weekNumber: number) {
  return `第${formatChineseNumber(weekNumber)}周`
}

export function shouldShowWeekLabel(entries: JournalWeekEntry[], index: number) {
  const current = entries[index]
  if (!current) return false

  const currentWeek = getJournalWeekNumber(current.day)
  if (currentWeek === null) return false

  if (index === 0) return true

  const previousWeek = getJournalWeekNumber(entries[index - 1]?.day)
  return previousWeek !== currentWeek
}
