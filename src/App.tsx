import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { Home } from './pages/Home'
import { SiteLayout } from './components/SiteLayout'

const Journal = lazy(() => import('./pages/Journal').then((m) => ({ default: m.Journal })))
const JournalDetail = lazy(() =>
  import('./pages/JournalDetail').then((m) => ({ default: m.JournalDetail })),
)
const Products = lazy(() => import('./pages/Products').then((m) => ({ default: m.Products })))
const About = lazy(() => import('./pages/About').then((m) => ({ default: m.About })))

// Minimal cream canvas while a route chunk loads. No spinner — chunks are tiny.
function LoadingFallback() {
  return <div className="min-h-[60vh]" style={{ background: 'var(--color-bg)' }} />
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

function App() {
  return (
    <BrowserRouter>
      <SiteLayout>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/journal/:slug" element={<JournalDetail />} />
            <Route path="/products" element={<Products />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </SiteLayout>
    </BrowserRouter>
  )
}

export default App
