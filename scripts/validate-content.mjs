import { access, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = process.cwd()
const journalPath = resolve(root, 'public/data/journal-entries.json')
const resourcesPath = resolve(root, 'public/data/resources.json')
const repostsPath = resolve(root, 'public/data/reposts.json')
const skillsPath = resolve(root, 'public/data/skills.json')

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

async function readJson(path) {
  const raw = await readFile(path, 'utf8')
  return JSON.parse(raw)
}

async function readOptionalJson(path) {
  try {
    await access(path)
  } catch {
    return null
  }
  return readJson(path)
}

function isPrivateIpv4(hostname) {
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return false
  const [a, b] = hostname.split('.').map(Number)
  if (a === 10) return true
  if (a === 127) return true
  if (a === 192 && b === 168) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 169 && b === 254) return true
  return false
}

function isBlockedHost(hostname) {
  const lower = hostname.toLowerCase()
  return (
    lower === 'localhost' ||
    lower === '0.0.0.0' ||
    lower === '::1' ||
    lower.endsWith('.local') ||
    isPrivateIpv4(lower)
  )
}

function validateUrlValue(value, fieldName) {
  if (value.startsWith('/')) return

  let parsed
  try {
    parsed = new URL(value)
  } catch {
    throw new Error(`${fieldName} 不是合法 URL`)
  }

  assert(parsed.protocol === 'http:' || parsed.protocol === 'https:', `${fieldName} 只能使用 http/https`)
  assert(!isBlockedHost(parsed.hostname), `${fieldName} 不能使用 localhost 或内网地址`)
}

function validateJournal(entries) {
  assert(Array.isArray(entries), 'journal-entries.json 必须是数组')
  assert(entries.length > 0, 'journal-entries.json 不能为空')

  for (const [index, entry] of entries.entries()) {
    const prefix = `journal[${index}]`
    assert(entry && typeof entry === 'object', `${prefix} 必须是对象`)
    assert(typeof entry.title === 'string' && entry.title.trim().length > 0, `${prefix}.title 必填`)
    if (entry.slug !== undefined) {
      assert(typeof entry.slug === 'string', `${prefix}.slug 必须是字符串`)
      assert(entry.slug.trim().length > 0, `${prefix}.slug 不能为空字符串`)
      assert(/^[a-z0-9-]+$/i.test(entry.slug), `${prefix}.slug 只能包含字母、数字和连字符`)
    }
    assert(typeof entry.summary === 'string', `${prefix}.summary 必须是字符串`)
    assert(typeof entry.content === 'string', `${prefix}.content 必须是字符串`)
    assert(Array.isArray(entry.tags), `${prefix}.tags 必须是数组`)
    if (entry.publishedAt !== undefined) {
      assert(typeof entry.publishedAt === 'string', `${prefix}.publishedAt 必须是字符串`)
      assert(/^\d{4}-\d{2}-\d{2}$/.test(entry.publishedAt), `${prefix}.publishedAt 必须是 YYYY-MM-DD`)
      assert(!Number.isNaN(new Date(`${entry.publishedAt}T00:00:00+08:00`).getTime()), `${prefix}.publishedAt 不是合法日期`)
    }
    if (entry.cover) {
      assert(typeof entry.cover === 'string', `${prefix}.cover 必须是字符串`)
      validateUrlValue(entry.cover, `${prefix}.cover`)
    }
    if (entry.images) {
      assert(Array.isArray(entry.images), `${prefix}.images 必须是数组`)
      for (const [imgIndex, imageUrl] of entry.images.entries()) {
        assert(typeof imageUrl === 'string', `${prefix}.images[${imgIndex}] 必须是字符串`)
        validateUrlValue(imageUrl, `${prefix}.images[${imgIndex}]`)
      }
    }
  }
}

function validateResources(resources) {
  assert(Array.isArray(resources), 'resources.json 必须是数组')
  assert(resources.length > 0, 'resources.json 不能为空')

  for (const [index, resource] of resources.entries()) {
    const prefix = `resources[${index}]`
    assert(resource && typeof resource === 'object', `${prefix} 必须是对象`)
    assert(typeof resource.id === 'number', `${prefix}.id 必须是数字`)
    assert(typeof resource.category === 'string' && resource.category.trim().length > 0, `${prefix}.category 必填`)
    assert(typeof resource.title === 'string' && resource.title.trim().length > 0, `${prefix}.title 必填`)
    assert(typeof resource.description === 'string', `${prefix}.description 必须是字符串`)
    assert(typeof resource.content === 'string', `${prefix}.content 必须是字符串`)
    assert(Array.isArray(resource.links), `${prefix}.links 必须是数组`)
    if (resource.image) {
      assert(typeof resource.image === 'string', `${prefix}.image 必须是字符串`)
      validateUrlValue(resource.image, `${prefix}.image`)
    }

    for (const [linkIndex, link] of resource.links.entries()) {
      const linkPrefix = `${prefix}.links[${linkIndex}]`
      assert(link && typeof link === 'object', `${linkPrefix} 必须是对象`)
      assert(typeof link.label === 'string' && link.label.trim().length > 0, `${linkPrefix}.label 必填`)
      assert(typeof link.url === 'string', `${linkPrefix}.url 必须是字符串`)
      validateUrlValue(link.url, `${linkPrefix}.url`)
      assert(link.type === 'download' || link.type === 'link', `${linkPrefix}.type 只能是 download 或 link`)
    }
  }
}

function validateReposts(reposts) {
  assert(Array.isArray(reposts), 'reposts.json 必须是数组')

  const ids = new Set()
  for (const [index, repost] of reposts.entries()) {
    const prefix = `reposts[${index}]`
    assert(repost && typeof repost === 'object', `${prefix} 必须是对象`)
    assert(typeof repost.id === 'string' && repost.id.trim().length > 0, `${prefix}.id 必填`)
    assert(!ids.has(repost.id), `${prefix}.id 不能重复`)
    ids.add(repost.id)
    assert(/^[a-z0-9-]+$/i.test(repost.id), `${prefix}.id 只能包含字母、数字和连字符`)
    assert(typeof repost.title === 'string' && repost.title.trim().length > 0, `${prefix}.title 必填`)
    assert(typeof repost.url === 'string', `${prefix}.url 必须是字符串`)
    validateUrlValue(repost.url, `${prefix}.url`)

    if (repost.source !== undefined) assert(typeof repost.source === 'string', `${prefix}.source 必须是字符串`)
    if (repost.author !== undefined) assert(typeof repost.author === 'string', `${prefix}.author 必须是字符串`)
    if (repost.note !== undefined) assert(typeof repost.note === 'string', `${prefix}.note 必须是字符串`)
    if (repost.publishedAt !== undefined) {
      assert(typeof repost.publishedAt === 'string', `${prefix}.publishedAt 必须是字符串`)
      assert(!Number.isNaN(new Date(repost.publishedAt).getTime()), `${prefix}.publishedAt 不是合法日期`)
    }
    if (repost.tags !== undefined) {
      assert(Array.isArray(repost.tags), `${prefix}.tags 必须是数组`)
      for (const [tagIndex, tag] of repost.tags.entries()) {
        assert(typeof tag === 'string' && tag.trim().length > 0, `${prefix}.tags[${tagIndex}] 必须是非空字符串`)
      }
    }
  }
}

function validateSkills(skills) {
  assert(Array.isArray(skills), 'skills.json 必须是数组')
  assert(skills.length > 0, 'skills.json 不能为空')

  const ids = new Set()
  const statuses = new Set(['public', 'personal', 'experiment'])
  for (const [index, skill] of skills.entries()) {
    const prefix = `skills[${index}]`
    assert(skill && typeof skill === 'object', `${prefix} 必须是对象`)
    assert(typeof skill.id === 'string' && /^[a-z0-9-]+$/i.test(skill.id), `${prefix}.id 格式不正确`)
    assert(!ids.has(skill.id), `${prefix}.id 不能重复`)
    ids.add(skill.id)
    assert(typeof skill.name === 'string' && skill.name.trim().length > 0, `${prefix}.name 必填`)
    assert(typeof skill.description === 'string' && skill.description.trim().length > 0, `${prefix}.description 必填`)
    assert(typeof skill.category === 'string' && skill.category.trim().length > 0, `${prefix}.category 必填`)
    assert(statuses.has(skill.status), `${prefix}.status 必须是 public、personal 或 experiment`)
    if (skill.url !== undefined) {
      assert(typeof skill.url === 'string', `${prefix}.url 必须是字符串`)
      validateUrlValue(skill.url, `${prefix}.url`)
    }
    if (skill.status === 'public') {
      assert(typeof skill.url === 'string' && skill.url.length > 0, `${prefix} 公开 Skill 必须提供 url`)
    }
  }
}

async function main() {
  const [journalEntries, resources, reposts, skills] = await Promise.all([
    readJson(journalPath),
    readOptionalJson(resourcesPath),
    readOptionalJson(repostsPath),
    readOptionalJson(skillsPath),
  ])

  validateJournal(journalEntries)
  if (resources) validateResources(resources)
  if (reposts) validateReposts(reposts)
  if (skills) validateSkills(skills)

  const resourceText = resources ? `，${resources.length} 个历史资源` : ''
  const repostText = reposts ? `，${reposts.length} 条转载` : ''
  const skillText = skills ? `，${skills.length} 个 Skill` : ''
  console.log(`内容校验通过：${journalEntries.length} 篇实录${resourceText}${repostText}${skillText}。`)
}

main().catch((error) => {
  console.error(`内容校验失败：${error.message}`)
  process.exitCode = 1
})
