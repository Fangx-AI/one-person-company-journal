const fs = require('fs');

const ARTICLE_URL = process.argv[2];
const ARTICLE_DAY = parseInt(process.argv[3]) || null;
const ARTICLE_DAY_LABEL = process.argv[4] || null;

if (!ARTICLE_URL) {
  console.error('Usage: node add_article.cjs <url> [day_number] [day_label]');
  process.exit(1);
}

function extractContentWithImages(html) {
  const contentMatch = html.match(/id="js_content"[^>]*>([\s\S]*?)<\/div>\s*<script/);
  if (!contentMatch) return { text: '', images: [] };
  const rawHtml = contentMatch[1];
  const images = [];
  let processed = rawHtml.replace(/<img[^>]*data-src="([^"]+)"[^>]*>/gi, (match, src) => {
    const url = src.replace(/&amp;/g, '&');
    const idx = images.length;
    images.push(url);
    return `\n\n[IMG:${idx}]\n\n`;
  });
  processed = processed
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/section>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return { text: processed, images };
}

function extractTitle(html) {
  const m = html.match(/<h1[^>]*class="rich_media_title"[^>]*>([\s\S]*?)<\/h1>/);
  if (m) return m[1].replace(/<[^>]+>/g, '').trim();
  const m2 = html.match(/<title>(.*?)<\/title>/);
  if (m2) return m2[1].trim();
  return '';
}

function extractCover(html) {
  const m = html.match(/var\s+msg_cdn_url\s*=\s*"([^"]+)"/);
  if (m) return m[1];
  const m2 = html.match(/twitter:image[^>]*content="([^"]+)"/);
  if (m2) return m2[1];
  return '';
}

function extractShortTitle(title) {
  let t = title
    .replace(/^(一人公司|独舟一人公司|方鑫一人公司)(创业日志|创业周报)?\s*[·\u00B7\s]*[Dd]ay\s*\d+\s*[|\uff5c:：]?\s*/i, '')
    .replace(/^(开发日志)[Dd]ay\s*\d+\s*[——|\uff5c:：]+\s*/i, '')
    .trim();
  if (!t || t === title) {
    t = title.replace(/^.*?[Dd]ay\s*\d+\s*[|\uff5c:：·\u00B7]\s*/i, '').trim();
  }
  if (!t) t = title;
  return t;
}

function extractSummary(text, maxLen = 80) {
  if (!text) return '';
  const clean = text.replace(/\[IMG:\d+\]/g, '').trim();
  const lines = clean.split('\n').filter(l => l.trim().length > 10);
  if (lines.length > 0) {
    let s = lines[0].trim();
    if (s.length > maxLen) s = s.substring(0, maxLen) + '…';
    return s;
  }
  return '';
}

function autoTag(title, content) {
  const tags = [];
  const text = (title || '') + ' ' + (content || '').substring(0, 500);
  if (/DeskFlow/i.test(text)) tags.push('DeskFlow');
  if (/AI/i.test(text) && tags.length < 3) tags.push('AI');
  if (/自媒体|视频|口播|抖音|小红书/.test(text) && tags.length < 3) tags.push('自媒体');
  if (/服务器|部署|上线/.test(text) && tags.length < 3) tags.push('技术');
  if (/思考|感悟|心态|方向|孤独|成长/.test(text) && tags.length < 3) tags.push('思考');
  if (/工具|效率|自动化/.test(text) && tags.length < 3) tags.push('工具');
  if (/学习|读书/.test(text) && tags.length < 3) tags.push('学习');
  if (/开发|编程|代码/.test(text) && tags.length < 3) tags.push('开发');
  if (/周报/.test(title)) tags.push('周报');
  if (tags.length === 0) tags.push('日志');
  return tags.slice(0, 3);
}

async function main() {
  console.log(`Fetching: ${ARTICLE_URL}`);
  const resp = await fetch(ARTICLE_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html',
    }
  });
  const html = await resp.text();

  const fullTitle = extractTitle(html);
  const { text, images } = extractContentWithImages(html);
  const cover = extractCover(html);

  if (!text) {
    console.error('Failed to extract content. WeChat may be blocking.');
    console.log('HTML preview:', html.substring(0, 500));
    process.exit(1);
  }

  const dayNum = ARTICLE_DAY || (() => {
    const m = fullTitle.match(/[Dd]ay\s*(\d+)/i);
    return m ? parseInt(m[1]) : null;
  })();

  const dayLabel = ARTICLE_DAY_LABEL || ((() => {
    const m2 = fullTitle.match(/周报\s*[|\uff5c]?\s*[Nn]o\.?\s*(\d+)/i);
    return m2 ? 'W' + m2[1] : null;
  })() || dayNum);

  const entry = {
    day: dayLabel,
    title: extractShortTitle(fullTitle),
    summary: extractSummary(text),
    content: text,
    tags: autoTag(fullTitle, text),
  };
  if (cover) entry.cover = cover;
  if (images.length > 0) entry.images = images;

  console.log(`Title: ${fullTitle}`);
  console.log(`Short title: ${entry.title}`);
  console.log(`Day: ${entry.day}`);
  console.log(`Content: ${text.length} chars`);
  console.log(`Images: ${images.length}`);
  console.log(`Tags: ${entry.tags.join(', ')}`);

  const jsonPath = 'public/data/journal-entries.json';
  const entries = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  const existingIdx = entries.findIndex(e => e.day === entry.day);
  if (existingIdx >= 0) {
    entries[existingIdx] = entry;
    console.log(`Updated existing entry at index ${existingIdx}`);
  } else {
    entries.unshift(entry);
    console.log(`Added new entry at top`);
  }

  fs.writeFileSync(jsonPath, JSON.stringify(entries, null, 0));
  console.log(`Saved ${entries.length} entries to ${jsonPath}`);
  console.log(`File size: ${(fs.statSync(jsonPath).size / 1024).toFixed(1)} KB`);
}

main().catch(console.error);
