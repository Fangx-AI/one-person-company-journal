import { useEffect } from 'react'

export function About() {
  useEffect(() => {
    const previousTitle = document.title
    document.title = '联系 · 方鑫三个金'
    return () => {
      document.title = previousTitle
    }
  }, [])

  return (
    <div className="reading-column py-12 sm:py-16 md:py-20">
      <h1 className="page-title">联系</h1>
      <div className="page-divider" />
      <p className="page-intro">
        想说的话、想问的事、想合作的项目,都可以从这里来。
      </p>

      <section className="prose-zh">
        <ul>
          <li>
            邮箱:{' '}
            <a href="mailto:953995271@qq.com">953995271@qq.com</a>
          </li>
          <li>
            微信号:
            <span style={{ color: 'var(--color-text-2)' }}> Morigest</span>
          </li>
          <li>
            微信公众号 / 抖音号:
            <span style={{ color: 'var(--color-text-2)' }}> 方鑫三个金</span>
          </li>
          <li>
            小报童专栏:{' '}
            <a
              href="https://xiaobot.net/p/DuzhouMoney?refer=70e80a00-8534-4603-a6dd-69d97e47dc9c"
              target="_blank"
              rel="noopener noreferrer"
            >
              AIGC 财富自由之路
            </a>
          </li>
          <li>
            产品:{' '}
            <a href="https://image2.fun" target="_blank" rel="noopener noreferrer">
              Image2.fun
            </a>
          </li>
        </ul>
      </section>
    </div>
  )
}
