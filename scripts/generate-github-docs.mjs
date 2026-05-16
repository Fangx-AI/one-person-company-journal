import { mkdir, rm, writeFile } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = process.cwd()
const entriesPath = path.join(rootDir, 'public', 'data', 'journal-entries.json')
const docsDir = path.join(rootDir, 'docs', '2026')
const assetsDir = path.join(rootDir, 'docs', 'assets')
const readmePath = path.join(rootDir, 'README.md')

const readmeTitleOverrides = new Map([
  ['day-94', 'No.94 一人公司大总结'],
  ['day-93', 'No.93 中转站合作邀请与自动化推广'],
  ['day-92', 'No.92 五一假期工作汇报'],
  ['day-90', 'No.90 极简主义、长期注意、我为什么不卖课'],
  ['day-89', 'No.89 合规性内容与个人网站改造'],
  ['day-88', 'No.88 孙哥入场中转站，Karpathy 深度访谈'],
  ['day-87', 'Day 87 网站 5 天破 2000 用户'],
  ['day-86', 'Day 86 我的信息源、分销系统优化、GitHub 观察'],
  ['day-85', 'Day 85 AI 对传统行业的冲击'],
  ['day-84', 'Day 84 强烈的使命感'],
  ['day-83', 'Day 83 个人 AI 生图网站正式上线'],
  ['day-82', 'Day 82 专注于问题'],
  ['day-81', 'Day 81 信息差与执行力'],
  ['day-75', 'Day 75 忽略情绪，持续做事'],
  ['day-73', 'Day 73 但行好事，莫问前程'],
  ['day-72', 'Day 72 拍视频、写文章、个人网站上线'],
  ['week-10', '周报 No.10 竭尽所能去提升自己的价值感'],
  ['week-9', '周报 No.9 极端的厌恶带来极端的成长'],
  ['week-8', '周报 No.8 改用周报形式更新'],
  ['day-48', 'Day 48 五条口播全平台上线'],
  ['day-47', 'Day 47 五条口播全网发布'],
  ['day-46', 'Day 46 个人网站迁移阿里云'],
  ['day-45', 'Day 45 飞书 AI 蜂群协同优化，个人网站上线'],
  ['day-44', 'Day 44 专注做事导致共情能力下降'],
  ['day-43', 'Day 43 飞书搭建 AI 蜂群'],
  ['day-42', 'Day 42 给用户带来价值感'],
  ['day-41', 'Day 41 公众号内容做减法'],
  ['day-40', 'Day 40 但行好事，莫问前程'],
  ['day-39', 'Day 39 一篇吃透 OpenClaw Skills'],
  ['day-38', 'Day 38 每天花三小时产出一篇深度文章'],
  ['day-37', 'Day 37 战略调整，垂直 OpenClaw 方向'],
  ['day-36', 'Day 36 小红书文章转图文，批量科普视频'],
  ['day-35', 'Day 35 调研批量带货视频'],
  ['day-34', 'Day 34 御己 App，AI 与正则识别的平衡'],
  ['day-33', 'Day 33 拍了五条短视频'],
  ['day-32', 'Day 32 技术工具选择，口播视频矩阵启动'],
  ['day-31', 'Day 31 隐私合规 6 件事'],
  ['day-30', 'Day 30 一人公司一个月小结'],
  ['day-29', 'Day 29 孤独是创业者的常态'],
  ['day-27', 'Day 27 Apple Developer 注册'],
  ['day-26', 'Day 26 累的像条狗'],
  ['day-25', 'Day 25 我的软件封禁记录'],
  ['day-23', 'Day 23 过年停更一天'],
  ['day-22', 'Day 22 深度研究 OpenClaw'],
  ['day-21', 'Day 21 OpenClaw 教程迭代'],
  ['day-20', 'Day 20 过年停更一天'],
  ['day-19', 'Day 19 关于服务器的选择问题'],
  ['day-17', 'Day 17 但行好事，莫问前程，保持良好心态'],
  ['day-16', 'Day 16 关于方向的思考'],
  ['day-15', 'Day 15 稳定工作'],
  ['day-14', 'Day 14 Chrome 插件提交审核，网站开发完成'],
  ['day-13', 'Day 13 深耕内容和工具收尾'],
  ['day-12', 'Day 12 从 AI 碎片化内耗到内容生产结构化闭环'],
  ['day-11', 'Day 11 解决 AI 对话繁琐问题'],
  ['day-10', 'Day 10 产品合规是一切的前提'],
  ['day-9', 'Day 9 国内独立开发者为什么这么难'],
  ['day-8', 'Day 8 加强学习'],
  ['day-7', 'Day 7 减负'],
  ['day-6', 'Day 6 主业间隙用 AI 造工具'],
  ['day-5', 'Day 5 DeskFlow 移动端开发攻坚'],
  ['day-3', 'Day 3 DeskFlow 优化收尾'],
  ['day-2', 'Day 2 DeskFlow v1.0.3 发布'],
  ['day-1', 'Day 1 桌面代办清单 DeskFlow'],
])

export function readJournalEntries() {
  return JSON.parse(readFileSync(entriesPath, 'utf8'))
}

export function imageExtensionFromUrl(url) {
  const parsed = new URL(url)
  const wxFormat = parsed.searchParams.get('wx_fmt')
  if (wxFormat) {
    const normalized = wxFormat.toLowerCase()
    if (normalized === 'jpeg') return '.jpg'
    if (normalized === 'jpg' || normalized === 'png' || normalized === 'webp' || normalized === 'gif') {
      return `.${normalized}`
    }
  }

  const ext = path.extname(parsed.pathname).toLowerCase()
  if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
    return ext === '.jpeg' ? '.jpg' : ext
  }

  return '.jpg'
}

export function localImagePath(entry, index, imageUrl) {
  return `../assets/${entry.slug}/image-${index + 1}${imageExtensionFromUrl(imageUrl)}`
}

export function displayTitle(entry) {
  const day = String(entry.day)
  if (day.startsWith('W')) {
    return entry.title
  }
  return entry.title
}

export function readmeTitle(entry) {
  if (readmeTitleOverrides.has(entry.slug)) {
    return readmeTitleOverrides.get(entry.slug)
  }

  const day = String(entry.day)
  const fallback = entry.title
    .replace(/方鑫一人公司(日报|纪实|创业日志|创业周报)?/g, '')
    .replace(/日拱一卒|Be Humble/g, '')
    .replace(/No\.?\s*\d+/gi, '')
    .replace(/Day[·\s-]*\d+/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
  const firstParts = fallback
    .split(/[|｜]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)
  const title = firstParts.join('，') || entry.title
  const prefix = day.startsWith('W') ? `周报 No.${day.slice(1)}` : Number(day) >= 88 ? `No.${day}` : `Day ${day}`
  return `${prefix} ${title}`
}

export function buildArticleMarkdown(entry) {
  let content = entry.content.trim()
  for (const [index, imageUrl] of (entry.images || []).entries()) {
    const imageMarkdown = `![${entry.title} 图 ${index + 1}](${localImagePath(entry, index, imageUrl)})`
    content = content.replace(`[IMG:${index}]`, imageMarkdown)
  }

  return [
    `# ${displayTitle(entry)}`,
    '',
    `> 原文：<https://fxin.cc/journal/${entry.slug}>`,
    '',
    entry.summary ? `> ${entry.summary}` : '',
    entry.summary ? '' : null,
    content,
    '',
  ]
    .filter((line) => line !== null)
    .join('\n')
}

export function buildReadme(entries) {
  const links = entries.map((entry) => `- [${readmeTitle(entry)}](docs/2026/${entry.slug}.md)`).join('\n')

  return `# 一人公司纪实

一个普通人从零开始做一人公司的公开记录。

目前已跑到月盈利 1-2 万元，继续记录从 0 到稳定现金流的过程。

这里不写成功学，只记录产品、内容、流量、销售、收入、踩坑与复盘。

## 2026

${links}

## 关于作者

**方鑫**，一人公司实践者，AI 产品与内容创业者。

| 平台 | 链接 |
| --- | --- |
| 🌐 官网 | [fxin.cc](https://fxin.cc) |
| 🧩 产品 | [Image2.fun](https://image2.fun) |
| ✉️ 邮箱 | [953995271@qq.com](mailto:953995271@qq.com) |
| 💬 微信 | \`Morigest\` |
| 📣 公众号 / 抖音 | 方鑫三个金 |
| 📚 小报童 | [AIGC 财富自由之路](https://xiaobot.net/p/DuzhouMoney?refer=70e80a00-8534-4603-a6dd-69d97e47dc9c) |

> 先做一个真实能跑起来的版本，再一点点把它变好。
`
}

async function downloadImage(url, outputPath) {
  if (existsSync(outputPath)) return

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 GitHubDocsGenerator/1.0',
      Referer: 'https://mp.weixin.qq.com/',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`)
  }

  await mkdir(path.dirname(outputPath), { recursive: true })
  const buffer = Buffer.from(await response.arrayBuffer())
  await writeFile(outputPath, buffer)
}

async function generate() {
  const entries = readJournalEntries()

  await mkdir(docsDir, { recursive: true })
  await mkdir(assetsDir, { recursive: true })

  for (const entry of entries) {
    await writeFile(path.join(docsDir, `${entry.slug}.md`), buildArticleMarkdown(entry), 'utf8')

    if (entry.images?.length) {
      await mkdir(path.join(assetsDir, entry.slug), { recursive: true })
      for (const [index, imageUrl] of entry.images.entries()) {
        const imagePath = path.join(rootDir, 'docs', localImagePath(entry, index, imageUrl).replace('../', ''))
        await downloadImage(imageUrl, imagePath)
      }
    }
  }

  await writeFile(readmePath, buildReadme(entries), 'utf8')

  const staleFiles = ['docs/README.md']
  for (const staleFile of staleFiles) {
    if (existsSync(path.join(rootDir, staleFile))) {
      await rm(path.join(rootDir, staleFile), { force: true })
    }
  }

  console.log(`Generated ${entries.length} GitHub markdown articles.`)
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  generate().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
