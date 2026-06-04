import assert from 'node:assert/strict'
import {
  formatJournalDate,
  formatJournalDateRange,
  getJournalMetaLine,
  timestampToChinaDate,
} from '../src/utils/journalDates.ts'

assert.equal(timestampToChinaDate(1780501566), '2026-06-03')
assert.equal(formatJournalDate('2026-06-03'), '2026-06-03')
assert.equal(formatJournalDate(''), '')
assert.equal(formatJournalDate(undefined), '')
assert.equal(formatJournalDateRange(['2026-06-03', '2026-06-01', undefined, '2026-06-01']), '2026-06-01 至 2026-06-03')
assert.equal(formatJournalDateRange(['2026-05-29']), '2026-05-29')
assert.equal(formatJournalDateRange([]), '')

assert.equal(getJournalMetaLine({ day: 116, publishedAt: '2026-06-03' }), 'Day 116 · 2026-06-03')
assert.equal(getJournalMetaLine({ day: 114 }), 'Day 114')
assert.equal(getJournalMetaLine({ day: 'W10', publishedAt: '2026-05-10' }), 'Week 10 · 2026-05-10')

console.log('journal date tests passed')
