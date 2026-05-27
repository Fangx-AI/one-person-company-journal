import assert from 'node:assert/strict'
import {
  buildArticleMarkdown,
  buildReadme,
  imageExtensionFromUrl,
  localImagePath,
  readJournalEntries,
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

console.log('generate-github-docs tests passed')
