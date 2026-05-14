#!/usr/bin/env node
/**
 * Auto image optimizer.
 *
 * Scans `public/images/` (recursive) for PNG/JPG/JPEG files and produces a
 * sibling .webp version next to each original. Skips files whose .webp is
 * already up-to-date (mtime newer than source). Reports total bytes saved.
 *
 * Designed to run as part of `npm run check:release`, so contributors only
 * have to drop new PNG/JPG files into /public/images/ and never think about
 * compression again.
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')
const IMAGES_DIR = path.join(ROOT, 'public', 'images')

const RASTER_EXTS = new Set(['.png', '.jpg', '.jpeg'])
// Files containing these tokens skip optimization (e.g. social share assets
// served as PNG to maximize compatibility).
const SKIP_TOKENS = []
// Quality target. Lower = smaller file, higher visible artifacts. 80 is a
// safe default for photo-style covers; non-photo art tolerates 75.
const WEBP_QUALITY = 80

async function* walk(dir) {
  let entries
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch (err) {
    if (err.code === 'ENOENT') return
    throw err
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      yield* walk(full)
    } else if (entry.isFile()) {
      yield full
    }
  }
}

function shouldSkip(filename) {
  return SKIP_TOKENS.some((token) => filename.includes(token))
}

async function isUpToDate(srcPath, webpPath) {
  try {
    const [srcStat, webpStat] = await Promise.all([fs.stat(srcPath), fs.stat(webpPath)])
    return webpStat.mtimeMs >= srcStat.mtimeMs
  } catch {
    return false
  }
}

async function optimize() {
  let scanned = 0
  let converted = 0
  let skipped = 0
  let savedBytes = 0
  const startedAt = Date.now()

  for await (const file of walk(IMAGES_DIR)) {
    const ext = path.extname(file).toLowerCase()
    if (!RASTER_EXTS.has(ext)) continue
    if (shouldSkip(path.basename(file))) {
      skipped += 1
      continue
    }

    scanned += 1
    const webpPath = file.replace(/\.(png|jpe?g)$/i, '.webp')

    if (await isUpToDate(file, webpPath)) {
      skipped += 1
      continue
    }

    const srcStat = await fs.stat(file)
    try {
      await sharp(file)
        .webp({ quality: WEBP_QUALITY, effort: 5 })
        .toFile(webpPath)
    } catch (err) {
      console.error(`  ✗ ${path.relative(ROOT, file)} → ${err.message}`)
      continue
    }
    const webpStat = await fs.stat(webpPath)
    const delta = srcStat.size - webpStat.size
    savedBytes += delta
    converted += 1
    console.log(
      `  ✓ ${path.relative(ROOT, file)} (${(srcStat.size / 1024).toFixed(1)}KB) → ${path.relative(ROOT, webpPath)} (${(webpStat.size / 1024).toFixed(1)}KB, -${(delta / 1024).toFixed(1)}KB)`,
    )
  }

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(2)
  console.log('')
  console.log(`Scanned ${scanned} raster files in ${elapsed}s`)
  console.log(`  ${converted} converted, ${skipped} up-to-date / skipped`)
  console.log(`  saved ${(savedBytes / 1024).toFixed(1)}KB total`)

  if (converted === 0 && scanned === 0) {
    console.log('  (no source images found in public/images/)')
  }
}

optimize().catch((err) => {
  console.error('optimize-images failed:', err)
  process.exit(1)
})
