import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { SiteNav } from './SiteNav'
import { SiteFooter } from './SiteFooter'

declare global {
  interface Window {
    pangu?: {
      spacingPage: () => void
      spacingElementById?: (id: string) => void
    }
  }
}

/**
 * Run pangu on article content without touching navigation and other UI text.
 * Called after every route transition, with a small delay so React has
 * finished committing the new DOM.
 */
function runPanguSoon() {
  if (typeof window === 'undefined') return
  // Two passes: one quickly (most cases), one a beat later (lazy chunks).
  const apply = () => {
    try {
      window.pangu?.spacingElementById?.('site-main')
    } catch {
      // pangu not loaded yet; the post-load 600ms timeout below catches it.
    }
  }
  setTimeout(apply, 80)
  setTimeout(apply, 600)
}

export function SiteLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    runPanguSoon()
  }, [location.pathname])

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
      <SiteNav />
      <main id="site-main" className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
