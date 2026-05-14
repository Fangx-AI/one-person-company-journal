import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const shouldWrite = process.argv.includes('--write')
const filePath = resolve(process.cwd(), 'public/data/journal-entries.json')

function slugifyText(input) {
  return String(input)
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function getBaseSlug(entry) {
  if (typeof entry.slug === 'string' && entry.slug.trim()) {
    return slugifyText(entry.slug)
  }

  if (typeof entry.day === 'number') {
    return `day-${entry.day}`
  }

  const dayLabel = String(entry.day ?? '').trim()
  const weekMatch = dayLabel.match(/^w(\d+)$/i)
  if (weekMatch) return `week-${weekMatch[1]}`

  const fromDay = slugifyText(dayLabel)
  if (fromDay) return fromDay

  const fromTitle = slugifyText(entry.title ?? '')
  if (fromTitle) return fromTitle

  return 'journal-entry'
}

function resolveSlugs(entries) {
  const slugCount = new Map()

  return entries.map((entry) => {
    const base = getBaseSlug(entry)
    const used = slugCount.get(base) ?? 0
    const slug = used === 0 ? base : `${base}-${used + 1}`
    slugCount.set(base, used + 1)

    return {
      ...entry,
      slug,
    }
  })
}

async function main() {
  const raw = await readFile(filePath, 'utf8')
  const entries = JSON.parse(raw)
  if (!Array.isArray(entries)) {
    throw new Error('journal-entries.json 必须是数组')
  }

  const withSlugs = resolveSlugs(entries)
  const addedCount = withSlugs.reduce((count, entry, index) => {
    return entries[index]?.slug ? count : count + 1
  }, 0)

  if (!shouldWrite) {
    console.log(`预览模式：共 ${entries.length} 条，新增 slug ${addedCount} 条。`)
    console.log('示例（前 5 条）：')
    withSlugs.slice(0, 5).forEach((entry, index) => {
      console.log(`${index + 1}. day=${entry.day} slug=${entry.slug}`)
    })
    console.log('如需写入，请执行：npm run content:add-slugs -- --write')
    return
  }

  await writeFile(filePath, JSON.stringify(withSlugs, null, 0), 'utf8')
  console.log(`写入完成：${entries.length} 条记录，补充 slug ${addedCount} 条。`)
}

main().catch((error) => {
  console.error(`执行失败：${error.message}`)
  process.exitCode = 1
})
