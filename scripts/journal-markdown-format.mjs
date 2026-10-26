// Presentation only: never write back to journal-entries.json. Exact anchors make
// reviewed layouts fail visibly if a later content edit invalidates a boundary.
const range = (kind, first, last, extra = {}) => ({ kind, first, last, ...extra })
const list = (first, last) => range('list', first, last)
const quote = (first, last) => range('quote', first, last)
const h2 = (...titles) => Object.fromEntries(titles.map((title) => [title, 2]))

const numberedSections = new Set([
  13, 25, 72, 73, 85, 88, 89, 90, 93, 98, 114, 117, 122, 136,
  141, 146, 147, 152, 154, 158, 159, 161, 167, 173, 174, 183, 189, 191, 193, 196,
].map((day) => `day-${day}`))

export const articleLayouts = {
  'day-187': { headings: h2('先说结论：这场访谈到底在讲什么？', '怎么看待这场访谈？') },
  'day-173': { headings: {
    '1、打开 TypeSafe 控制台。': 3,
    '2、使用 Google 账号，或按页面提示使用邮箱完成注册、登录。当前登录页也提供邮箱验证码入口。': 3,
    '3、登录后打开 Playground 在线试验区，先在网页里测试。': 3,
    '4、需要接入自己的程序时，再到 API Keys 页面 创建密钥。API key 可以理解为程序调用服务的凭证。': 3,
  } },
  'day-166': { headings: {
    ...h2('到底是在研究什么', 'AI在里面干了什么', '更巧的是，数学成绩正在下降', '我为什么会对这件事有感觉'),
  } },
  'day-162': { headings: h2('先说 Bun 的迁移', 'Tab 和空格，其实是一种旧时代的“个人风格”', '手工不是指每一行都手写', 'AI 时代，真正的手艺是什么') },
  'day-160': { headings: {
    ...h2('它到底改了什么', '同一个问题，答案为什么应该不同', '这个 Skill 的具体流程', '真正值得看的，是它做了评测', '它的本质，其实就是一份 Markdown'),
    '第一步，识别对象': 3, '第二步，先搞懂原材料': 3, '第三步，搭一座熟悉的桥': 3, '第四步，落到“这和你有什么关系”': 3,
  } },
  'day-133': { headings: h2('先别急着站队', '比被抄更危险的是没人知道你', '什么该藏，什么该讲', '公开构建不是发流水账') },
  'day-130': { headings: h2('这趟行程最先打破的是抽象感', '最让他们意外的，是“实习生”不是实习生', '中国实验室的“氛围”，和美国不太一样', '算力不够，是事实，不是口号', '产品化比很多人想象得早', '机器人是这趟行程里最不虚的部分', '不能只用领先和落后来理解这件事') },
  'day-126': { headings: h2('做了一个私人生活管家', '完成了小报童文章 FDE', '拍了中转站搭建的手稿视频', '把游戏彻底删除了') },
  'day-116': { headings: h2('OpenAI：还没上市，员工已经先套现了', 'SK 海力士：内存厂员工也被 AI 改命了', '三星：芯片员工平均奖金也到了百万人民币级别', '连劳资谈判都被 AI 改写了', 'AI 不是一个行业，而是一条吸金链', '最危险的误判') },
  'day-94': { headings: h2('我把所有自媒体业务摊开，跟你坦诚聊聊', '公众号，是我深度复盘的地方', '抖音，我准备把形式彻底换一下', '小报童，我想把最好的都放在这', '副业，我现在手里有五件事') },
  'day-86': { headings: h2('一个小观察', '今天核心工作：把网站的分销功能全部做完并测试通过', '另外还完成了两件事', '再分享一个信息差：小米Token大放送') },
  'day-75': { headings: {
    ...h2('今日内容产出', '三个网站深度优化', '短视频复盘：两条视频，两种结局'),
    '个人网站': 3, '埃隆之书网站': 3, 'PPT Agent 网站': 3,
    '第一条视频：GPT-Image-2 科普': 3, '第二条视频：吐槽 Anthropic': 3,
  } },
  'week-9': { headings: h2('主业带来的厌恶与成长动力', '本周数据与真实感受', '内容输出的真实困境', '下周计划：专注研究马尔科夫宿命论', '最后的坚持') },
  'day-197': {
    headings: {
      'Codeg 是什么？': 2, '我准备怎么使用？': 2, '我给总指挥的提示词': 2,
      '多 Agent 不等于自动变强': 2, '下一步': 2,
    },
    ranges: [
      list('DeepSeek DSH', 'Codex'),
      list('查看和管理不同 Agent 的对话', '查看每个子任务的执行过程和结果'),
      list('Codex：负责任务拆解、协调、代码审查、最终验收和结果汇总', 'DeepSeek DSH：负责明确、可拆分的开发任务，以及高频执行和批量处理'),
      list('每个 Agent 只负责自己被分配的模块', '最终代码统一交给总指挥检查、测试和合并'),
      quote('我准备让 Codex、Claude Code 和 DeepSeek DSH 协同开发这个项目。', '未经确认，不要修改任务范围之外的代码，也不要删除其他 Agent 或用户已有的修改。'),
      list('谁负责什么', '最终由谁检查和合并'),
      list('需求由我提出', '最终结果统一检查和合并'),
    ],
  },
  'day-196': {
    headings: {
      '为什么要做这本白皮书？': 3, '“打磨”主要在做什么？': 3, '这本白皮书适合谁？': 3,
      '1. 数字核验': 4, '2. 调整结构': 4, '3. 补充覆盖': 4, '4. 建立更新机制': 4,
      '写在最后': 2,
    },
    captions: ['GEO 全球行业白皮书', 'GEO 分发项目'],
    ranges: [
      list('打磨 GEO 白皮书', '准备 GEO 系列课程'),
      list('海外 AI 搜索入口：ChatGPT 周活约 12 亿、Google AI Overviews 月活超过 25 亿', '2027—2028 年趋势判断'),
      list('品牌方：先把事实库做准、做一致，不要轻易为“保证排第一”付费', '投资人：重点关注监测层整合和 AI 交易层'),
      list('平台分发的稳定性', '数据观测的可靠性'),
      list('GEO 是什么', '2026 年国内外有哪些主要入口'),
      list('海外 GEO 是一门什么生意', '行业里的钱流向了哪里'),
      list('如何建立问题集', '不同平台的分发规则'),
      list('为什么“AI 排名”是一个伪概念', 'GEO 月报应该怎么写'),
      list('3·15 曝光事件', '强监管行业的注意事项'),
      list('GEO 的商业模式', '普通人如何用 90 天进入这个行业'),
    ],
  },
  'day-188': {
    headings: {
      '普通人用 AI 有什么用？': 2, '【实战部分】': 2,
      '方法一：豆包 + 飞书多维表格': 3, '方法二：Hermes': 3,
      '提示词 ①：建档 + 每日记录（【Claude 起草】）': 4,
      '提示词 ②：修仙升级系统（【Claude 起草】）': 4,
      '怎么开始？': 4, '两种方法怎么选？': 2,
    },
    ranges: [
      quote('你现在是我的私人健康管家。请帮我在飞书多维表格里建立并长期维护我的个人健康档案。', '现在请先根据我的基本情况，把表格建好，然后告诉我第一天该怎么开始记录。'),
      quote('请在我已有的健康档案基础上，加一套「修仙升级系统」，让我把每天的健康习惯当成修炼。', '数据必须如实记录，奖励规则不能因为我求情而放水。'),
      quote('你是一名耐心的技术助理。请带我在这台电脑上从零搭建 Hermes Agent（Nous Research 出品的开源 AI 智能体，官网：https://hermes-agent.nousresearch.com/），把它变成我的私人健康助理。我不懂编程，请每一步都用大白话告诉我在做什么，执行任何安装命令前先跟我确认。', '遇到报错先自己排查，解决不了再用大白话告诉我原因和下一步怎么做。'),
    ],
  },
  'day-178': {
    ranges: [quote('“Audit and organize all Codex chats/tasks associated with this project folder. Execute the cleanup, not just recommendations.', '最后给我一张表：原标题 | 新标题 | 归档还是保留 | 原因。')],
  },
  'day-170': { headings: { '安装之前，先看这里': 2, '不用一下装齐，按你的工作选': 2 } },
  'day-167': { headings: { '我觉得 Image 2.5 的核心升级': 2 } },
  'day-158': {
    ranges: [
      list('总粉丝：23,361', '已连接平台：5 个'),
      list('快速同步：每天点一下，更新最近作品、粉丝、评论。', '数据口径：比如抖音粉丝数，网页端可能比手机端慢，所以我直接标成“网页口径”，不再假装它是实时准确数据。'),
      list('元数据：比如 C2PA / Content Credentials。', '模型专用水印：比如 Google DeepMind 的 SynthID。'),
      list('人物不做大幅度动作，保持站姿或慢动作。', '背景尽量留白，把注意力集中在人物轮廓和墨迹流动上。'),
      quote('请帮我整理当前桌面（Desktop）文件夹。', '5. 整理完后告诉我移动了哪些文件，并给出最终的文件夹结构。'),
      quote('先不要移动文件。请先扫描并给出整理计划，等我确认后再执行。', '先不要移动文件。请先扫描并给出整理计划，等我确认后再执行。'),
    ],
  },
  'day-25': {
    headings: {
      '事情是这样的': 2, '封号原因：我根本不该这么用': 2, '最痛的领悟': 2,
      '这不是个例': 2, '开发者最容易踩的 5 个合规坑': 2,
      '系统没死，只是换个活法': 2, '我的选择': 2, '正确的做法是什么？': 2, '写在最后': 2,
      '方向一：微信服务号': 3, '方向二：独立 App': 3, '方向三：微信小程序': 3,
      '方向四：Web 应用': 3, '第一步：选对平台': 3, '第二步：通读平台规范': 3, '第三步：合规性自检清单': 3,
    },
    numberedLevel: 3,
    ranges: [
      list('多用户自动开通：新用户发第一条消息，系统自动在几秒内创建专属 AI Agent', '并发安全：文件锁、原子写入，30 个用户同时用也不会串数据'),
      range('table', '平台', '诱导分享裂变', { columns: 3, rows: 5 }),
      list('开发成本比 App 低', '支持订阅消息（需要用户主动订阅）'),
      list('❌ 企业微信 → 内部工具，不能拉外部用户', '✅ Web 应用 → 最快上线'),
      list('禁止行为清单', '用户数据规范'),
    ],
  },
  'week-8': {
    headings: { '一、新网站项目开发': 3, '二、《AI小白100讲》视频专栏': 3, '三、公众号、口播视频日常更新。': 3 },
  },
}

export function sourceLines(content) {
  return content.replace(/(\[IMG:\d+\])/g, '\n$1\n').split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
}

export function buildBodyBlocks(entry) {
  const lines = sourceLines(entry.content)
  const layout = articleLayouts[entry.slug] || {}
  const ranges = new Map()
  const claimed = new Set()
  for (const spec of layout.ranges || []) {
    const start = lines.indexOf(spec.first)
    const end = lines.indexOf(spec.last, start)
    if (start < 0 || end < start || lines.lastIndexOf(spec.first) !== start) {
      throw new Error(`${entry.slug}: stale or ambiguous ${spec.kind} anchor: ${spec.first}`)
    }
    for (let i = start; i <= end; i++) {
      if (claimed.has(i)) throw new Error(`${entry.slug}: overlapping layout ranges`)
      claimed.add(i)
    }
    ranges.set(start, { ...spec, end })
  }
  for (const heading of Object.keys(layout.headings || {})) {
    if (!lines.includes(heading)) throw new Error(`${entry.slug}: stale heading: ${heading}`)
  }
  const hasChineseSections = lines.some((line) => /^[一二三四五六七八九十]+、/.test(line))
  const blocks = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const spec = ranges.get(i)
    if (spec) {
      const selected = lines.slice(i, spec.end + 1)
      if (spec.kind === 'table' && selected.length !== spec.rows * spec.columns) {
        throw new Error(`${entry.slug}: table dimensions no longer match its source`)
      }
      blocks.push({ ...spec, lines: selected })
      i = spec.end
      continue
    }
    // The legacy importer kept the isolated opening quotation mark. Include it
    // in the quotation, rather than silently deleting source punctuation.
    if (line === '“' && lines[i + 1] && !/^\[IMG:/.test(lines[i + 1])) {
      blocks.push({ kind: 'quote', lines: [line, lines[++i]] })
      continue
    }
    let level = layout.headings?.[line]
    if (!level && /^[一二三四五六七八九十]+、/.test(line) && line.length <= 65) level = 2
    if (!level && numberedSections.has(entry.slug) && /^\d{1,2}[.、]\s*[^\d]/.test(line) && line.length <= 65) {
      level = layout.numberedLevel || (hasChineseSections ? 3 : 2)
    }
    if (['day-170', 'day-187'].includes(entry.slug) && /^\d{2}｜/.test(line)) level = 2
    if (level) blocks.push({ kind: 'heading', level, lines: [line] })
    else if (/^\[IMG:\d+\]$/.test(line)) blocks.push({ kind: 'image', lines: [line] })
    else if (layout.captions?.includes(line) || (entry.slug === 'day-187' && /^原片截图 /.test(line)) || (entry.slug === 'day-167' && /^Image 2\.5 .*(?:肖像|原图|示例|字母 [GP])$/.test(line))) blocks.push({ kind: 'caption', lines: [line] })
    else if (/^\[[ xX]\]\s/.test(line)) blocks.push({ kind: 'check', lines: [line] })
    else if (/^(提示词[：:]|第[一二三四五六七八九十]+轮：)$/.test(line)) blocks.push({ kind: 'label', lines: [line] })
    else blocks.push({ kind: 'paragraph', lines: [line] })
  }
  return blocks
}

function preserveNumber(line) {
  // Avoid Markdown's automatic list renumbering (some historical entries repeat
  // or skip a number). The number itself is part of the author's original text.
  return line.replace(/^(\d{1,2})([.、])(?!\d)/, '**$1**$2')
}

export function renderBodyBlocks(blocks, { anchors = false } = {}) {
  let section = 0
  return blocks.map((block) => {
    const line = block.lines[0]
    switch (block.kind) {
      case 'heading': {
        const anchor = anchors && block.level === 2 ? `<a id="section-${++section}"></a>\n\n` : ''
        return `${anchor}${'#'.repeat(block.level)} ${line}`
      }
      case 'quote': {
        const lines = line === '“' ? [line + block.lines[1], ...block.lines.slice(2)] : block.lines
        return lines.map((text) => `> ${preserveNumber(text)}`).join('\n>\n')
      }
      case 'list': return block.lines.map((text) => `- ${preserveNumber(text)}`).join('\n')
      case 'check': return `- ${line}`
      case 'label': return `**${line}**`
      case 'caption': return `*${line}*`
      case 'table': {
        const rows = []
        for (let i = 0; i < block.lines.length; i += block.columns) {
          rows.push(`| ${block.lines.slice(i, i + block.columns).map((cell) => cell.replace(/\|/g, '\\|')).join(' | ')} |`)
        }
        rows.splice(1, 0, `| ${Array(block.columns).fill('---').join(' | ')} |`)
        return rows.join('\n')
      }
      default: return preserveNumber(line)
    }
  }).join('\n\n')
}
