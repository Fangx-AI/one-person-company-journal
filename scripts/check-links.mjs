import { access, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const args = process.argv.slice(2)
const strictMode = args.includes('--strict')
const timeoutArgIndex = args.indexOf('--timeout')
const timeoutMs =
  timeoutArgIndex >= 0 && Number.isFinite(Number(args[timeoutArgIndex + 1]))
    ? Math.max(1000, Number(args[timeoutArgIndex + 1]))
    : 8000

function isHttpUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value)
}

async function readJson(path) {
  const raw = await readFile(path, 'utf8')
  return JSON.parse(raw)
}

async function readOptionalJson(path) {
  try {
    await access(path)
  } catch {
    return []
  }
  return readJson(path)
}

function collectUrls(journalEntries, resources) {
  const collected = []

  for (const [index, entry] of journalEntries.entries()) {
    if (isHttpUrl(entry?.cover)) {
      collected.push({ url: entry.cover, source: `journal[${index}].cover` })
    }
    if (Array.isArray(entry?.images)) {
      for (const [imgIndex, imageUrl] of entry.images.entries()) {
        if (isHttpUrl(imageUrl)) {
          collected.push({ url: imageUrl, source: `journal[${index}].images[${imgIndex}]` })
        }
      }
    }
  }

  for (const [index, resource] of resources.entries()) {
    if (isHttpUrl(resource?.image)) {
      collected.push({ url: resource.image, source: `resources[${index}].image` })
    }
    if (Array.isArray(resource?.links)) {
      for (const [linkIndex, link] of resource.links.entries()) {
        if (isHttpUrl(link?.url)) {
          collected.push({ url: link.url, source: `resources[${index}].links[${linkIndex}].url` })
        }
      }
    }
  }

  const dedup = new Map()
  for (const item of collected) {
    if (!dedup.has(item.url)) {
      dedup.set(item.url, item)
    }
  }
  return Array.from(dedup.values())
}

async function probeUrl(url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const headResponse = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
    })

    if (headResponse.status === 405 || headResponse.status === 501) {
      const getResponse = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
      })
      return { status: getResponse.status, ok: getResponse.ok, finalUrl: getResponse.url, method: 'GET' }
    }

    return {
      status: headResponse.status,
      ok: headResponse.ok,
      finalUrl: headResponse.url,
      method: 'HEAD',
    }
  } catch (error) {
    return {
      status: 0,
      ok: false,
      finalUrl: url,
      method: 'HEAD',
      error: error instanceof Error ? error.message : String(error),
    }
  } finally {
    clearTimeout(timer)
  }
}

async function main() {
  const journalPath = resolve(process.cwd(), 'public/data/journal-entries.json')
  const resourcesPath = resolve(process.cwd(), 'public/data/resources.json')
  const [journalEntries, resources] = await Promise.all([readJson(journalPath), readOptionalJson(resourcesPath)])

  const urls = collectUrls(journalEntries, resources)
  console.log(`待检查外链：${urls.length} 个，超时：${timeoutMs}ms`)

  const failures = []
  for (const [index, item] of urls.entries()) {
    const result = await probeUrl(item.url)
    const progress = `[${index + 1}/${urls.length}]`
    if (result.ok) {
      console.log(`${progress} OK ${result.status} ${item.url}`)
    } else {
      console.log(`${progress} FAIL ${result.status} ${item.url}`)
      failures.push({ ...item, ...result })
    }
  }

  if (failures.length === 0) {
    console.log('外链检查通过：未发现失败链接。')
    return
  }

  console.log(`发现失败链接：${failures.length} 个`)
  for (const failure of failures) {
    const reason = failure.error ? `，错误：${failure.error}` : ''
    console.log(`- ${failure.source} -> ${failure.url}（状态码：${failure.status}${reason}）`)
  }

  if (strictMode) {
    process.exitCode = 1
  } else {
    console.log('提示：如需在 CI 或发布流程中失败退出，请使用 --strict 参数。')
  }
}

main().catch((error) => {
  console.error(`外链检查执行失败：${error.message}`)
  process.exitCode = 1
})
