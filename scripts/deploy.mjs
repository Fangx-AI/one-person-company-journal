#!/usr/bin/env node
import { execSync } from 'node:child_process'
import { existsSync, readFileSync, statSync, unlinkSync } from 'node:fs'
import path from 'node:path'

function loadLocalEnv() {
  for (const file of ['.env.local', '.env']) {
    if (!existsSync(file)) continue

    const content = readFileSync(file, 'utf8')
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue

      const eqIndex = trimmed.indexOf('=')
      if (eqIndex === -1) continue

      const key = trimmed.slice(0, eqIndex).trim()
      const value = trimmed
        .slice(eqIndex + 1)
        .trim()
        .replace(/^['"]|['"]$/g, '')

      if (key && process.env[key] === undefined) process.env[key] = value
    }
  }
}

function requiredEnv(name) {
  const value = process.env[name]
  if (!value) {
    console.error(`Missing required environment variable: ${name}`)
    process.exit(1)
  }
  return value
}

loadLocalEnv()

const REMOTE = requiredEnv('DEPLOY_REMOTE')
const REMOTE_DIR = requiredEnv('DEPLOY_REMOTE_DIR')
const LOCAL_DIST = process.env.DEPLOY_LOCAL_DIST || 'dist'
const TARBALL = 'dist-deploy.tar.gz'

function run(cmd, opts = {}) {
  console.log(`$ ${cmd}`)
  return execSync(cmd, { stdio: 'inherit', ...opts })
}

// ---------- 1. preflight: dist/ exists, all referenced assets present ----------
const indexPath = path.join(LOCAL_DIST, 'index.html')
if (!existsSync(indexPath)) {
  console.error(`× ${indexPath} 不存在。请先运行 npm run build。`)
  process.exit(1)
}

const html = readFileSync(indexPath, 'utf8')
const refRegex =
  /(?:href|src)\s*=\s*"(\/[^"]+\.(?:js|css|svg|png|webp|jpg|jpeg|woff2?|ico|json|mp4))"/gi
const refs = new Set()
for (const m of html.matchAll(refRegex)) refs.add(m[1])

const missing = []
for (const r of refs) {
  if (!existsSync(path.join(LOCAL_DIST, r))) missing.push(r)
}
if (missing.length) {
  console.error('× 本地 dist/ 中缺少 index.html 引用的资源：')
  missing.forEach((m) => console.error(`  - ${m}`))
  process.exit(1)
}
console.log(`✓ 校验通过：index.html 引用的 ${refs.size} 个资源在 dist/ 中都存在。`)

// ---------- 2. package whole dist/ into a tarball ----------
if (existsSync(TARBALL)) unlinkSync(TARBALL)
run(`tar -czf ${TARBALL} -C ${LOCAL_DIST} .`)
const sizeKB = (statSync(TARBALL).size / 1024).toFixed(1)
console.log(`✓ 打包完成：${TARBALL} (${sizeKB} KB)`)

// ---------- 3. upload to /tmp/ on server ----------
run(`scp ${TARBALL} ${REMOTE}:/tmp/`)

// ---------- 4. extract on server, fix perms, reload nginx ----------
// Each sudo invocation must EXACTLY match an entry in /etc/sudoers.d/admin-deploy.
// The sudoers file pins the tarball path to /tmp/dist-deploy.tar.gz, so we must
// use the literal name regardless of TARBALL constant changes.
const remoteCmd = [
  'set -e',
  `sudo -n /bin/tar -xzf /tmp/${TARBALL} -C ${REMOTE_DIR}`,
  `sudo -n /bin/chown -R www-data:www-data ${REMOTE_DIR}`,
  `sudo -n /usr/bin/find ${REMOTE_DIR} -type d -exec /bin/chmod 755 {} +`,
  `sudo -n /usr/bin/find ${REMOTE_DIR} -type f -exec /bin/chmod 644 {} +`,
  'sudo -n /usr/sbin/nginx -t',
  'sudo -n /usr/sbin/nginx -s reload',
  `rm -f /tmp/${TARBALL}`,
  'echo DEPLOY_OK',
].join(' && ')
run(`ssh ${REMOTE} "${remoteCmd}"`)

// ---------- 5. local cleanup ----------
unlinkSync(TARBALL)
console.log('✓ 部署完成。')
