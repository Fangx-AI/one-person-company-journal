import assert from 'node:assert/strict'
import {
  formatWeekLabel,
  getJournalWeekNumber,
  shouldShowWeekLabel,
} from '../src/utils/journalWeeks.ts'

assert.equal(getJournalWeekNumber(114), 17)
assert.equal(getJournalWeekNumber(112), 16)
assert.equal(getJournalWeekNumber(105), 15)
assert.equal(getJournalWeekNumber(98), 14)
assert.equal(getJournalWeekNumber('W10'), 10)

assert.equal(formatWeekLabel(17), '第十七周')
assert.equal(formatWeekLabel(16), '第十六周')
assert.equal(formatWeekLabel(15), '第十五周')

assert.equal(shouldShowWeekLabel([{ day: 114 }], 0), true)
assert.equal(shouldShowWeekLabel([{ day: 114 }, { day: 113 }], 1), false)
assert.equal(shouldShowWeekLabel([{ day: 113 }, { day: 112 }], 1), true)
assert.equal(shouldShowWeekLabel([{ day: 106 }, { day: 105 }], 1), true)
assert.equal(shouldShowWeekLabel([{ day: 99 }, { day: 98 }], 1), true)

console.log('journal week label tests passed')
