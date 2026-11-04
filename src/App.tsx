import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import { Home } from './pages/Home'
import { Journal } from './pages/Journal'
import { JournalDetail } from './pages/JournalDetail'
import { Skills } from './pages/Skills'
import { Products } from './pages/Products'
import { About } from './pages/About'
import { SiteLayout } from './components/SiteLayout'
import type { PrerenderedJournalData } from './utils/journalLoader'
import type { JournalIndexEntry } from './types/journal'
import type { SkillEntry } from './types/skill'

export interface PrerenderedSiteData {
  journalIndex?: JournalIndexEntry[]
  skills?: SkillEntry[]
}

declare global {
  interface Window {
    __PRERENDERED_SITE_DATA__?: PrerenderedSiteData
  }
}

function NotFound() {
  return (
    <div className="reading-column py-24 sm:py-32 text-center">
      <h1 className="text-5xl sm:text-6xl font-semibold m-0 mb-3" style={{ color: 'var(--color-text)' }}>
        404
      </h1>
      <p className="text-base mb-8" style={{ color: 'var(--color-text-2)' }}>
        这个页面好像不存在
      </p>
      <Link
        to="/"
        className="text-sm underline underline-offset-4"
        style={{ color: 'var(--color-text)' }}
      >
        返回首页 →
      </Link>
    </div>
  )
}

export function AppRoutes({
  prerenderData,
  siteData,
}: {
  prerenderData?: PrerenderedJournalData
  siteData?: PrerenderedSiteData
} = {}) {
  return (
    <SiteLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/journal" element={<Journal initialEntries={siteData?.journalIndex} />} />
        <Route path="/journal/:slug" element={<JournalDetail prerenderData={prerenderData} />} />
        <Route path="/skills" element={<Skills initialEntries={siteData?.skills} />} />
        <Route path="/reposts" element={<Navigate to="/skills" replace />} />
        <Route path="/products" element={<Products />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </SiteLayout>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes siteData={window.__PRERENDERED_SITE_DATA__} />
    </BrowserRouter>
  )
}

export default App
