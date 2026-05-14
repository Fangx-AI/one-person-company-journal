const command = process.argv[2]
const args = process.argv.slice(3)

function getArg(name, fallback = '') {
  const index = args.indexOf(`--${name}`)
  if (index === -1) return fallback
  return args[index + 1] ?? fallback
}

function printUsage() {
  console.log(`
用法：
  npm run content:tool -- journal-template --day 95
  npm run content:tool -- help
`)
}

function getJournalTemplate(dayInput) {
  const day = dayInput ? Number(dayInput) : ''
  return {
    day: Number.isFinite(day) && day > 0 ? day : '',
    slug: Number.isFinite(day) && day > 0 ? `day-${day}` : '',
    title: '',
    summary: '',
    content: '',
    tags: ['日志'],
    cover: '',
    images: [],
  }
}

async function run() {
  if (!command || command === 'help') {
    printUsage()
    return
  }

  if (command === 'journal-template') {
    const day = getArg('day')
    const template = getJournalTemplate(day)
    console.log(JSON.stringify(template, null, 2))
    return
  }

  console.error(`未知命令: ${command}`)
  printUsage()
  process.exitCode = 1
}

run().catch((error) => {
  console.error(`执行失败: ${error.message}`)
  process.exitCode = 1
})
