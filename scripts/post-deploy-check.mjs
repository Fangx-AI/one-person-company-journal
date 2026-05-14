const baseUrl = (process.env.CHECK_BASE_URL || 'https://fxin.cc').replace(/\/+$/, '')
const timeoutMs = Number(process.env.CHECK_TIMEOUT_MS || 12000)

const checks = [
  { name: 'Homepage', path: '/', expectStatus: 200 },
  { name: 'Journal list', path: '/journal', expectStatus: 200 },
  { name: 'Journal detail sample', path: '/journal/day-72', expectStatus: 200 },
  { name: 'Products', path: '/products', expectStatus: 200 },
  { name: 'About', path: '/about', expectStatus: 200 },
  { name: 'Robots', path: '/robots.txt', expectStatus: 200 },
  { name: 'Sitemap', path: '/sitemap.xml', expectStatus: 200 },
  { name: 'Hero photo (webp)', path: '/images/hero-photo.webp', expectStatus: 200 },
  { name: 'Hero photo (jpg)', path: '/images/hero-photo.jpg', expectStatus: 200 },
]

function withTimeout(signal) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const abort = () => controller.abort()

  if (signal) {
    if (signal.aborted) abort()
    signal.addEventListener('abort', abort)
  }

  return {
    signal: controller.signal,
    clear: () => {
      clearTimeout(timer)
      if (signal) signal.removeEventListener('abort', abort)
    },
  }
}

async function fetchText(url) {
  const scope = withTimeout()
  try {
    const response = await fetch(url, { signal: scope.signal, redirect: 'follow' })
    const text = await response.text()
    return { response, text }
  } finally {
    scope.clear()
  }
}

async function run() {
  console.log(`部署后检查目标：${baseUrl}`)
  const failures = []

  for (const item of checks) {
    const url = `${baseUrl}${item.path}`
    try {
      const { response } = await fetchText(url)
      const ok = response.status === item.expectStatus
      console.log(`${ok ? 'OK  ' : 'FAIL'} [${item.name}] ${url} -> ${response.status}`)
      if (!ok) {
        failures.push(`${item.name} 状态码异常：${response.status}`)
      }
    } catch (error) {
      failures.push(`${item.name} 请求失败：${error instanceof Error ? error.message : String(error)}`)
      console.log(`FAIL [${item.name}] ${url} -> 请求失败`)
    }
  }

  try {
    const { text: robotsText } = await fetchText(`${baseUrl}/robots.txt`)
    const hasSitemap = /Sitemap:\s*https?:\/\/.+\/sitemap\.xml/i.test(robotsText)
    console.log(`${hasSitemap ? 'OK  ' : 'FAIL'} [Robots sitemap directive]`)
    if (!hasSitemap) failures.push('robots.txt 缺少 sitemap 声明')
  } catch {
    failures.push('无法读取 robots.txt 内容')
  }

  let homeHtml = ''
  try {
    const result = await fetchText(`${baseUrl}/`)
    homeHtml = result.text
    const hasCanonical = homeHtml.includes('rel="canonical" href="https://fxin.cc/"')
    const hasOgUrl = homeHtml.includes('property="og:url" content="https://fxin.cc/"')
    console.log(`${hasCanonical ? 'OK  ' : 'FAIL'} [Homepage canonical]`)
    console.log(`${hasOgUrl ? 'OK  ' : 'FAIL'} [Homepage og:url]`)
    if (!hasCanonical) failures.push('首页缺少 canonical 标签')
    if (!hasOgUrl) failures.push('首页缺少 og:url 标签')
  } catch {
    failures.push('无法读取首页 HTML 内容')
  }

  // Verify every <script>/<link> referenced by index.html actually returns 200.
  // SPA HTML always returns 200 even when its chunks are missing — checking the
  // chunks directly is the only way to catch "deploy missed a file" bugs.
  if (homeHtml) {
    const refRegex = /(?:href|src)\s*=\s*"(\/[^"]+\.(?:js|css))"/gi
    const refs = Array.from(new Set(Array.from(homeHtml.matchAll(refRegex), (m) => m[1])))
    console.log(`检查首页引用的 ${refs.length} 个 JS/CSS 资源是否在线：`)
    for (const ref of refs) {
      const url = `${baseUrl}${ref}`
      try {
        const { response } = await fetchText(url)
        const ok = response.status === 200
        console.log(`${ok ? 'OK  ' : 'FAIL'} [Asset] ${ref} -> ${response.status}`)
        if (!ok) failures.push(`资源 ${ref} 状态码异常：${response.status}`)
      } catch (error) {
        console.log(`FAIL [Asset] ${ref} -> 请求失败`)
        failures.push(`资源 ${ref} 请求失败：${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }

  if (failures.length > 0) {
    console.log('\n检查结果：存在问题')
    failures.forEach((failure) => console.log(`- ${failure}`))
    process.exitCode = 1
    return
  }

  console.log('\n检查结果：全部通过')
}

run().catch((error) => {
  console.error(`执行失败：${error.message}`)
  process.exitCode = 1
})
