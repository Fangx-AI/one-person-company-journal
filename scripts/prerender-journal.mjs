import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const index = JSON.parse(await readFile(path.join(root, 'public/data/journal-index.json'), 'utf8'))
const template = await readFile(path.join(dist, 'index.html'), 'utf8')
const origin = 'https://fxin.cc'

function escapeAttribute(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')
}

function titleFor(entry) {
  return entry.displayTitle || entry.title
}

function withArticleHead(html, metadata) {
  const { title, description, url, publishedAt, entry } = metadata
  const replacements = new Set(['description', 'twitter:title', 'twitter:description'])
  const properties = new Set(['og:title', 'og:description', 'og:url', 'og:type'])
  const cleaned = html
    .replace(/<title>[^<]*<\/title>/i, `<title>${escapeAttribute(title)}</title>`)
    .replace(/<meta\b[^>]*>/gi, (tag) => {
      const name = tag.match(/\bname="([^"]+)"/i)?.[1]
      const property = tag.match(/\bproperty="([^"]+)"/i)?.[1]
      return replacements.has(name) || properties.has(property) ? '' : tag
    })
    .replace(/<link\b[^>]*>/gi, (tag) => /\brel="canonical"/i.test(tag) ? '' : tag)

  const meta = [
    `<meta name="description" content="${escapeAttribute(description)}" />`,
    `<link rel="canonical" href="${escapeAttribute(url)}" />`,
    `<meta property="og:title" content="${escapeAttribute(title)}" />`,
    `<meta property="og:description" content="${escapeAttribute(description)}" />`,
    '<meta property="og:type" content="article" />',
    `<meta property="og:url" content="${escapeAttribute(url)}" />`,
    `<meta name="twitter:title" content="${escapeAttribute(title)}" />`,
    `<meta name="twitter:description" content="${escapeAttribute(description)}" />`,
  ]
  if (publishedAt) {
    meta.push(`<meta property="article:published_time" content="${escapeAttribute(publishedAt)}" />`)
  }
  meta.push(`<script type="application/ld+json">${safeJson({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: titleFor(entry),
    description,
    datePublished: publishedAt || undefined,
    mainEntityOfPage: url,
    author: { '@type': 'Person', name: '方鑫' },
  })}</script>`)
  return cleaned.replace('</head>', `    ${meta.join('\n    ')}\n  </head>`)
}

const vite = await createServer({
  configFile: path.join(root, 'vite.config.ts'),
  server: { middlewareMode: true },
  ssr: { noExternal: ['lucide-react'] },
  appType: 'custom',
  logLevel: 'error',
})

try {
  const { AppRoutes } = await vite.ssrLoadModule('/src/App.tsx')
  for (const [position, item] of index.entries()) {
    const { slug } = item
    if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`Invalid journal slug: ${slug}`)
    const entry = JSON.parse(await readFile(path.join(root, 'public/data/journal', `${slug}.json`), 'utf8'))
    const adjacentIndex = index.slice(Math.max(0, position - 1), position + 2)
    const prerenderData = { slug, entry, index: adjacentIndex }
    const url = `${origin}/journal/${slug}`
    const title = `${titleFor(item)} · 日志 · 方鑫三个金`
    const description = entry.summary || '一人公司日志详情页'
    const markup = renderToString(createElement(StaticRouter, { location: `/journal/${slug}` },
      createElement(AppRoutes, { prerenderData })))
    if (!markup.includes('<h1') || !markup.includes('prose-zh')) {
      throw new Error(`Journal page did not render article content: ${slug}`)
    }
    const html = withArticleHead(template, { title, description, url, publishedAt: entry.publishedAt, entry })
      .replace('<div id="root"></div>',
        `<div id="root" data-prerendered="true">${markup}</div><script>window.__PRERENDERED_JOURNAL__=${safeJson(prerenderData)}</script>`)
    if (!html.includes('data-prerendered="true"')) throw new Error('Built HTML root marker not found')
    const output = path.join(dist, 'journal', slug)
    await mkdir(output, { recursive: true })
    await writeFile(path.join(output, 'index.html'), html)
    await writeFile(path.join(dist, 'journal', `${slug}.html`), html)
  }
  console.log(`Prerendered ${index.length} journal pages into dist/journal/`)
} finally {
  await vite.close()
}
