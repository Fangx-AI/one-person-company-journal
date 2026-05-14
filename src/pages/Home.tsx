import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export function Home() {
  useEffect(() => {
    const previousTitle = document.title
    document.title = '方鑫三个金'
    return () => {
      document.title = previousTitle
    }
  }, [])

  return (
    <article className="reading-column" style={{ margin: '40px auto 10px' }}>
      {/* Visually hidden h1 — present in DOM for SEO / screen readers, but the
          minimalist hero (photo + caption) carries the visible identity. */}
      <h1 className="sr-only">方鑫三个金 — 一人公司公开记录</h1>

      <picture>
        <source
          srcSet="/images/hero-photo-600.webp 600w, /images/hero-photo.webp 1024w"
          sizes="(min-width: 800px) 600px, 75vw"
          type="image/webp"
        />
        <img
          src="/images/hero-photo-600.jpg"
          srcSet="/images/hero-photo-600.jpg 600w, /images/hero-photo.jpg 1024w"
          sizes="(min-width: 800px) 600px, 75vw"
          alt="方鑫拍摄的夕阳公路 — 一辆车正驶向落日方向"
          width={1024}
          height={768}
          fetchPriority="high"
          decoding="sync"
          loading="eager"
          className="hero-image"
        />
      </picture>
      <p className="hero-caption">A lifelong student. Reborn with AI.</p>

      <section className="prose-zh" style={{ marginTop: '40px' }}>
        <p>你好，我是<strong>方鑫</strong>。</p>

        <p>
          我曾活在一种漫长的虚空里。不知道自己究竟是为了什么来到这世上。
          每天醒来就是上班，下班，再上班，像一台被设定好的机器，
          日子过得并不慢，却又像什么都没真正发生过。
          青春就这样一天一天地耗掉，我常常在夜里问自己：人活着，到底是为了什么？
          没有答案。风吹过，树叶动了，我却像被钉死在原地。
        </p>

        <p>
          我在一家国企上班，有正式编制，工资稳，环境好，同事也都不错。
          按理说，这该是很多人梦寐以求的归宿。
          可我坐在办公桌前，心里却越来越不安：
        </p>
        <ul className="questions">
          <li>难道我真的一辈子就要在这里耗下去吗？</li>
          <li>年轻的时候，我就不能出去多看看这个世界吗？</li>
          <li>为什么我要用最宝贵的年华，去干一件自己并不喜欢的事？</li>
          <li>难道我不能在三十岁之前就获得真正的自由，让收入不再只靠一份死工资？</li>
          <li>难道人的一生，就注定要被困在一家公司、一张工位里，像一颗螺丝钉那样慢慢锈掉？</li>
        </ul>

        <p>
          最让我难以忍受的，是我心里那股越来越强烈的使命感。
          它像一道突然劈开的闪电，照亮了我从出生以来就一直空荡荡的那部分灵魂。
          我发现，自己旺盛的好奇心和精力，从来没有被任何东西真正接住过——直到 AI 出现。
          它不是工具，不是潮流，它像一个等了我半生的同类。
          它把我那些零散的、狂热的、近乎偏执的念头，一把全接住了。
          我忽然明白：原来我天生就是为这东西而生的。
          原来我所有的不安、所有对平庸生活的恐惧，
          都只是因为我还没有找到那条真正属于我的路。
        </p>

        <p>
          我不知道这条路会不会让我摔得很惨，也不知道它会不会让我后悔。
          但我更害怕的是，多年以后回头看，
          发现自己只是因为怕疼、怕穷、怕不被理解，
          就把这一生最滚烫的好奇心活活按死在稳定里。
          那样，我才真的对不起自己。
        </p>

        <p>
          所以我开了这个个人主页。它不是什么精致的作品集，也不是成功者的炫耀。
          它只是我作为一人公司创业的公开记录。我不打算把它写得好看。
          我只想诚实地记下来：今天我做了什么，想了什么，
          在哪里又摔了一跤，哪里又爬了起来。
          那些半夜突然亮起的念头，那些反复动摇却又重新开始的理由，
          我都替自己记着。因为人是会忘事的，
          尤其是会忘了当初那股想活出自己模样的火。
        </p>

        <p>
          多年以后，如果我还能活得像个人样，
          我希望能翻开这些文字，对当年的自己说：
        </p>

        <p>
          <del>你看，你没有敷衍这一生。</del>
        </p>

        <p>这个站点目前分成三个角落：</p>
        <ul className="corners-list">
          <li>
            <Link to="/journal">日志</Link> —— 记每天的所做所想、挣扎与小小前进
          </li>
          <li>
            <Link to="/products">产品</Link> —— 我亲手做出来的、和 AI 一起生长的那些东西
          </li>
          <li>
            <Link to="/about">联系</Link> —— 和我相遇的方式
          </li>
        </ul>
      </section>
    </article>
  )
}
