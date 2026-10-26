import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { buildBodyBlocks, renderBodyBlocks, sourceLines } from './journal-markdown-format.mjs'
import {
  buildArticleMarkdown,
  buildReadme,
  imageExtensionFromUrl,
  localImagePath,
  readJournalEntries,
  sortJournalEntries,
} from './generate-github-docs.mjs'

const sampleEntry = {
  day: 1,
  slug: 'day-1',
  title: '桌面代办清单DeskFlow',
  summary: '第一篇摘要',
  content: '第一段\n\n[IMG:0]\n\n第二段',
  images: ['https://example.com/a/b/c.png?wx_fmt=png&from=appmsg'],
}

assert.equal(imageExtensionFromUrl('https://example.com/a.jpg?x=1'), '.jpg')
assert.equal(imageExtensionFromUrl('https://example.com/a?wx_fmt=jpeg'), '.jpg')
assert.equal(imageExtensionFromUrl('https://example.com/a?wx_fmt=png'), '.png')
assert.equal(localImagePath(sampleEntry, 0, sampleEntry.images[0]), '../assets/day-1/image-1.png')

const markdown = buildArticleMarkdown(sampleEntry)
assert.match(markdown, /^# 桌面代办清单DeskFlow/)
assert.doesNotMatch(markdown, /https:\/\/fxin\.cc\/journal\/day-1/)
assert.match(markdown, /!\[桌面代办清单DeskFlow 图 1\]\(\.\.\/assets\/day-1\/image-1\.png\)/)
assert.doesNotMatch(markdown, /\[IMG:0\]/)

const entries = readJournalEntries()
const day103 = entries.find((entry) => entry.slug === 'day-103')
assert.ok(day103, 'day-103 fixture must exist in journal entries')

const readme = buildReadme([day103])
assert.match(readme, /^# 一人公司纪实/)
assert.match(readme, /\[No\.103 微信读书 Skill，AI 中转站 100 问与系统学习\]\(docs\/2026\/day-103\.md\)/)
assert.doesNotMatch(readme, /https:\/\/fxin\.cc\/journal\/day-103/)
assert.match(readme, /## 关于作者/)

const before = JSON.stringify(entries)
const allReadme = buildReadme(entries)
const archiveTargets = [...allReadme.matchAll(/\]\(docs\/2026\/([^)]*\.md)\)/g)].map((match) => match[1])
assert.deepEqual(new Set(archiveTargets), new Set(entries.map((entry) => `${entry.slug}.md`)), 'archive must retain every article target')
assert.equal(readFileSync('README.md', 'utf8'), allReadme, 'README must match the generator')

let imagesChecked = 0
for (const entry of entries) {
  const blocks = buildBodyBlocks(entry)
  assert.deepEqual(blocks.flatMap((block) => block.lines), sourceLines(entry.content), `${entry.slug}: layout must cover every source character in order`)
  const output = buildArticleMarkdown(entry, entries)
  assert.equal(readFileSync(`docs/2026/${entry.slug}.md`, 'utf8'), output, `${entry.slug}: generated file is stale`)
  assert.equal(buildArticleMarkdown(entry, entries), output, 'generation must be deterministic')
  assert.equal((output.match(/^# /gm) || []).length, 1, `${entry.slug}: only one article title`)
  assert.doesNotMatch(output, /\[IMG:\d+\]/, `${entry.slug}: unresolved image`)
  const expectedImages = [...entry.content.matchAll(/\[IMG:(\d+)\]/g)].map((match) => {
    const index = Number(match[1])
    const localPath = localImagePath(entry, index, entry.images[index])
    assert.ok(existsSync(path.resolve('docs/2026', localPath)), `${entry.slug}: missing local image ${index}`)
    return localPath
  })
  const actualImages = [...output.matchAll(/!\[[^\n]*?\]\((\.\.\/assets\/[^)]+)\)/g)].map((match) => match[1])
  assert.deepEqual(actualImages, expectedImages, `${entry.slug}: images must remain in source order`)
  imagesChecked += actualImages.length
  for (const match of output.matchAll(/\]\((day-\d+|week-\d+)\.md\)/g)) {
    assert.ok(entries.some((item) => item.slug === match[1]), `${entry.slug}: broken article navigation`)
  }
  for (const match of output.matchAll(/\]\(#(section-\d+)\)/g)) {
    assert.ok(output.includes(`<a id="${match[1]}"></a>`), `${entry.slug}: missing contents anchor`)
  }
}
assert.equal(JSON.stringify(entries), before, 'formatting must not mutate source data')

assert.doesNotMatch(markdown, /第一篇摘要/, 'a metadata summary must not be inserted into the body')
assert.doesNotMatch(markdown, /\d{4}-\d{2}-\d{2}/, 'missing publication dates must not be inferred')
const short = entries.find((entry) => entry.slug === 'day-195')
assert.doesNotMatch(buildArticleMarkdown(short), /本文目录|^## /m, 'short prose must stay short prose')
const ordered = sortJournalEntries(entries)
assert.ok(ordered.findIndex((entry) => entry.slug === 'day-75') < ordered.findIndex((entry) => entry.slug === 'week-10'))
assert.ok(ordered.findIndex((entry) => entry.slug === 'week-8') < ordered.findIndex((entry) => entry.slug === 'day-48'))
const promptEntry = entries.find((entry) => entry.slug === 'day-188')
const prompts = buildBodyBlocks(promptEntry).filter((block) => block.kind === 'quote')
assert.equal(prompts.length, 3, 'all three long prompts must have separate quote blocks')
assert.ok(prompts[0].lines.some((line) => line.startsWith('1. 「个人档案」表')))
assert.doesNotMatch(renderBodyBlocks(prompts), /^#{1,6} /m, 'prompt steps must not become article headings')
const tableEntry = entries.find((entry) => entry.slug === 'day-25')
assert.match(buildArticleMarkdown(tableEntry), /\| 平台 \| 定位 \| 常见误用 \|/)
assert.match(buildArticleMarkdown(tableEntry), /\| 小程序 \| 轻量应用 \| 诱导分享裂变 \|/)
assert.throws(() => buildBodyBlocks({ ...tableEntry, content: tableEntry.content.replace('诱导分享裂变', '已修改的单元格') }), /stale/, 'changed anchors must require review')
const numbered = { ...sampleEntry, slug: 'number-test', content: '1、第一项\n1、重复编号\n3. 跳过第二项\n1.2.3 是版本号', images: [] }
assert.match(buildArticleMarkdown(numbered), /\*\*1\*\*、第一项\n\n\*\*1\*\*、重复编号\n\n\*\*3\*\*\. 跳过第二项/)
assert.match(buildArticleMarkdown(numbered), /1\.2\.3 是版本号/)

console.log(`generate-github-docs tests passed: ${entries.length} articles, ${imagesChecked} images, complete archive and source coverage`)
