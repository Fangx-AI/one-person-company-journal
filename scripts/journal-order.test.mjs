import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const indexPath = resolve(process.cwd(), 'public/data/journal-index.json')
const entries = JSON.parse(await readFile(indexPath, 'utf8'))

function position(slug) {
  const index = entries.findIndex((entry) => entry.slug === slug)
  assert.notEqual(index, -1, `${slug} must exist in journal-index.json`)
  return index
}

const day75 = position('day-75')
const week10 = position('week-10')
const week9 = position('week-9')
const week8 = position('week-8')
const day48 = position('day-48')

assert.ok(
  day75 < week10 && week10 < week9 && week9 < week8 && week8 < day48,
  'weekly recap entries must appear between day-75 and day-48 in newest-to-oldest journal order',
)

console.log('journal order tests passed')
