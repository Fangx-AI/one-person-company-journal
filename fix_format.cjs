const XLSX = require('xlsx');
const fs = require('fs');

const wb = XLSX.readFile('articles.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws);

const cols = Object.keys(data[0]);
const titleCol = cols.find(c => c.includes('\u6807\u9898'));
const contentCol = cols.find(c => c.includes('\u5185\u5bb9'));
const summaryCol = cols.find(c => c.includes('\u6458\u8981'));
const coverCol = cols.find(c => c.includes('\u5c01\u9762'));

function formatContent(raw) {
  if (!raw || raw.length < 20) return raw || '';

  let text = raw;

  // Add breaks before section headers
  text = text.replace(/([。！？～\n])(一、|二、|三、|四、|五、|六、)/g, '$1\n\n$2');
  text = text.replace(/([。！？～\n])(第一步|第二步|第三步|第四步|第五步|第六步)/g, '$1\n\n$2');
  
  // Add breaks before 纪实/思考/反思 markers
  text = text.replace(/([。！？～\n])(纪实\d|思考\d|反思\d|思考：|反思：)/g, '$1\n\n$2');
  text = text.replace(/([。！？～\n])(纪实 ?\d|思考 ?\d)/g, '$1\n\n$2');

  // Add breaks before emoji section markers
  text = text.replace(/([。！？～\n])([\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}✅❌✔️])/gu, '$1\n\n$2');
  
  // Add breaks before numbered markers like "1️⃣", "2️⃣"  
  text = text.replace(/([。！？～\n])([1-9]️⃣)/g, '$1\n\n$2');

  // Add breaks before "方式一", "方式二", "方向一" etc
  text = text.replace(/([。！？～\n])(方式[一二三四]|方向[一二三四])/g, '$1\n\n$2');

  // Add breaks before "死局一", "调整1" etc
  text = text.replace(/([。！？～\n])(死局[一二三四五]|调整[1-9])/g, '$1\n\n$2');

  // Add breaks before lines starting with "👉"
  text = text.replace(/([。！？～\n])(👉)/g, '$1\n\n$2');

  // Add breaks before "今日小结", "写在最后", "最后" section headers
  text = text.replace(/([。！？～])(今日小结|写在最后|核心总结|Day\d+小结|end$)/g, '$1\n\n$2');
  
  // Add breaks before "先说说", "再说说", "其他" transition phrases at start of new topics  
  text = text.replace(/([。！？～])(先说说|再说说|除此之外|不过|当然|但|所以从今天开始|从今天开始)/g, '$1\n\n$2');

  // Break long paragraphs: if a sentence ends with 。and next starts a new idea (>100 chars since last break)
  const lines = text.split('\n');
  const result = [];
  for (const line of lines) {
    if (line.length > 200) {
      // Split at sentence boundaries for very long paragraphs
      let parts = line.split(/(?<=[。！？])/);
      let currentPara = '';
      for (const part of parts) {
        currentPara += part;
        if (currentPara.length > 150) {
          result.push(currentPara.trim());
          currentPara = '';
        }
      }
      if (currentPara.trim()) result.push(currentPara.trim());
    } else {
      result.push(line);
    }
  }
  text = result.join('\n');

  // Clean up excessive newlines
  text = text.replace(/\n{3,}/g, '\n\n');
  
  return text.trim();
}

function extractDayNumber(title) {
  const m = title.match(/[Dd]ay\s*(\d+)/i);
  if (m) return parseInt(m[1]);
  const m2 = title.match(/周报\s*[|｜]?\s*[Nn]o\.?\s*(\d+)/i);
  if (m2) return 'week' + m2[1];
  return null;
}

function extractShortTitle(title) {
  let t = title
    .replace(/^(一人公司|独舟一人公司|方鑫一人公司)(创业日志|创业周报)?[·・\s]*[Dd]ay\s*\d+\s*[|｜:：]?\s*/i, '')
    .replace(/^(开发日志)[Dd]ay\s*\d+\s*[——|｜:：]+\s*/i, '')
    .trim();
  if (!t || t === title) {
    t = title.replace(/^.*?[Dd]ay\s*\d+\s*[|｜:：·・]\s*/i, '').trim();
  }
  if (!t) t = title;
  return t;
}

function extractSummary(content, maxLen = 80) {
  if (!content) return '';
  const lines = content.split('\n').filter(l => l.trim());
  const textLines = lines.slice(1).filter(l => l.trim().length > 10);
  if (textLines.length > 0) {
    let s = textLines[0].trim();
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
  if (/合规|封禁/.test(text) && tags.length < 3) tags.push('合规');
  if (/学习|读书/.test(text) && tags.length < 3) tags.push('学习');
  if (/开发|编程|代码/.test(text) && tags.length < 3) tags.push('开发');
  if (/周报/.test(title)) tags.push('周报');
  if (tags.length === 0) tags.push('日志');
  return tags.slice(0, 3);
}

function esc(str) {
  if (!str) return '';
  return str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
}
function escQ(str) {
  if (!str) return '';
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

// Process
const entries = [];
const seen = new Set();

data.forEach(row => {
  const title = row[titleCol] || '';
  const rawContent = row[contentCol] || '';
  const excelSummary = row[summaryCol] || '';
  const cover = row[coverCol] || '';
  
  let dayId = extractDayNumber(title);
  if (!dayId) return;
  
  let isWeekReport = typeof dayId === 'string' && dayId.startsWith('week');
  let weekNum = isWeekReport ? parseInt(dayId.replace('week', '')) : null;
  
  let key = isWeekReport ? dayId : 'day' + dayId;
  if (seen.has(key)) return;
  seen.add(key);
  
  const content = formatContent(rawContent);
  const shortTitle = extractShortTitle(title);
  const summary = extractSummary(content) || excelSummary || '点击查看详情…';
  const tags = autoTag(title, rawContent);
  
  entries.push({
    isWeekReport, weekNum,
    dayNum: isWeekReport ? null : dayId,
    dayLabel: isWeekReport ? `'W${weekNum}'` : `${dayId}`,
    title: shortTitle || title,
    summary: summary.length > 80 ? summary.substring(0, 80) + '…' : summary,
    content,
    tags,
    cover,
  });
});

entries.sort((a, b) => {
  if (a.isWeekReport && !b.isWeekReport) return -1;
  if (!a.isWeekReport && b.isWeekReport) return 1;
  if (a.isWeekReport && b.isWeekReport) return b.weekNum - a.weekNum;
  return b.dayNum - a.dayNum;
});

// Generate entries array
let entriesTs = '';
entries.forEach(e => {
  const tagsStr = e.tags.map(t => `'${t}'`).join(', ');
  entriesTs += `  {\n`;
  entriesTs += `    day: ${e.dayLabel},\n`;
  entriesTs += `    title: '${escQ(e.title)}',\n`;
  entriesTs += `    summary: '${escQ(e.summary)}',\n`;
  entriesTs += `    content: \`${esc(e.content)}\`,\n`;
  entriesTs += `    tags: [${tagsStr}],\n`;
  if (e.cover) {
    entriesTs += `    cover: '${escQ(e.cover)}',\n`;
  }
  entriesTs += `  },\n`;
});

fs.writeFileSync('journal_entries.txt', entriesTs, 'utf-8');
console.log(`Generated ${entries.length} formatted entries`);
console.log(`File size: ${(entriesTs.length / 1024).toFixed(1)} KB`);

// Show a sample of formatted content
const sample = entries.find(e => e.dayNum === 1);
if (sample) {
  console.log('\n--- Sample (Day 1) first 500 chars ---');
  console.log(sample.content.substring(0, 500));
}
