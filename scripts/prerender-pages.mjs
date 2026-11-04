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
const skills = JSON.parse(await readFile(path.join(root, 'public/data/skills.json'), 'utf8'))
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

function withPageHead(html, metadata) {
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
    `<meta property="og:type" content="${entry ? 'article' : 'website'}" />`,
    `<meta property="og:url" content="${escapeAttribute(url)}" />`,
    `<meta name="twitter:title" content="${escapeAttribute(title)}" />`,
    `<meta name="twitter:description" content="${escapeAttribute(description)}" />`,
  ]
  if (publishedAt) {
    meta.push(`<meta property="article:published_time" content="${escapeAttribute(publishedAt)}" />`)
  }
  if (entry) {
    meta.push(`<script type="application/ld+json">${safeJson({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: titleFor(entry),
      description,
      datePublished: publishedAt || undefined,
      mainEntityOfPage: url,
      author: { '@type': 'Person', name: '方鑫' },
    })}</script>`)
  }
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
  async function renderPage(route, metadata, data = {}) {
    const markup = renderToString(createElement(StaticRouter, { location: route },
      createElement(AppRoutes, data)))
    if (!markup.includes('<h1')) throw new Error(`Page did not render a heading: ${route}`)
    const payload = [
      data.prerenderData && `window.__PRERENDERED_JOURNAL__=${safeJson(data.prerenderData)}`,
      data.siteData && `window.__PRERENDERED_SITE_DATA__=${safeJson(data.siteData)}`,
    ].filter(Boolean).join(';')
    const html = withPageHead(template, metadata).replace('<div id="root"></div>',
      `<div id="root" data-prerendered="true">${markup}</div>${payload ? `<script>${payload}</script>` : ''}`)
    if (!html.includes('data-prerendered="true"')) throw new Error('Built HTML root marker not found')
    if (route === '/') {
      await writeFile(path.join(dist, 'index.html'), html)
    } else {
      const pathname = route.slice(1)
      const output = path.join(dist, pathname)
      await mkdir(output, { recursive: true })
      await writeFile(path.join(output, 'index.html'), html)
      await writeFile(path.join(dist, `${pathname}.html`), html)
    }
    return html
  }

  const staticPages = [
    { route: '/', title: '方鑫三个金', description: '方鑫的一人公司公开记录：每天的所做、所想、所踩的坑都写下来，不包装，不美化。' },
    { route: '/journal', title: '日志 · 方鑫三个金', description: '一人公司创业的日常记录。没有美化、没有包装，把每一天的所做、所想、所踩的坑都写下来。', siteData: { journalIndex: index } },
    { route: '/skills', title: 'Skill · 方鑫三个金', description: '方鑫做过、正在使用和持续迭代的 Skill，把反复做的事写成可复用的能力。', siteData: { skills } },
    { route: '/products', title: '产品 · 方鑫三个金', description: '方鑫独立制作的产品与工具。' },
    { route: '/about', title: '联系 · 方鑫三个金', description: '与方鑫联系、交流或合作。' },
  ]
  for (const page of staticPages) {
    const html = await renderPage(page.route, {
      title: page.title,
      description: page.description,
      url: `${origin}${page.route}`,
    }, page.siteData ? { siteData: page.siteData } : {})
    if (page.route === '/journal' && !html.includes('day-200')) throw new Error('Journal index was not rendered')
    if (page.route === '/skills' && !html.includes('skill-row')) throw new Error('Skill list was not rendered')
  }
  for (const [position, item] of index.entries()) {
    const { slug } = item
    if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`Invalid journal slug: ${slug}`)
    const entry = JSON.parse(await readFile(path.join(root, 'public/data/journal', `${slug}.json`), 'utf8'))
    const adjacentIndex = index.slice(Math.max(0, position - 1), position + 2)
    const prerenderData = { slug, entry, index: adjacentIndex }
    const url = `${origin}/journal/${slug}`
    const title = `${titleFor(item)} · 日志 · 方鑫三个金`
    const description = entry.summary || '一人公司日志详情页'
    const html = await renderPage(`/journal/${slug}`,
      { title, description, url, publishedAt: entry.publishedAt, entry },
      { prerenderData })
    if (!html.includes('prose-zh')) {
      throw new Error(`Journal page did not render article content: ${slug}`)
    }
  }
  console.log(`Prerendered ${staticPages.length} site pages and ${index.length} journal articles into dist/`)
} finally {
  await vite.close()
}
