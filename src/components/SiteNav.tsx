import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Menu, X } from '../icons'

const NAV_ITEMS = [
  { label: '主页', to: '/' },
  { label: '日志', to: '/journal' },
  { label: 'Skill', to: '/skills' },
  { label: '产品', to: '/products' },
  { label: '联系', to: '/about' },
]

export function SiteNav() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (typeof document === 'undefined') return
    const original = document.body.style.overflow
    if (open) document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [open])

  return (
    <header
      className="ui-sans"
      style={{
        background: 'var(--color-surface-soft)',
        borderBottom: '1px solid var(--color-divider)',
        padding: '20px 0',
      }}
    >
      <div
        className="mx-auto flex items-center justify-between"
        style={{ maxWidth: '800px', padding: '0 15px' }}
      >
        {/* Mobile: just show hamburger; desktop: nav fully right-aligned to match reference site. */}
        <span className="md:hidden text-sm" style={{ color: 'var(--color-text)' }}>
          方鑫三个金
        </span>
        <span className="hidden md:block" />

        <nav className="hidden md:flex items-center justify-end gap-5" style={{ fontSize: '18px' }}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}
              style={{
                color: 'var(--color-text)',
                textDecoration: 'none',
                paddingBottom: '2px',
              }}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          className="md:hidden inline-flex items-center justify-center w-9 h-9 -mr-2"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? '关闭菜单' : '打开菜单'}
          aria-expanded={open}
          style={{ color: 'var(--color-text)' }}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <nav
          className="md:hidden ui-sans"
          style={{
            borderTop: '1px solid var(--color-divider)',
            background: 'var(--color-surface-soft)',
            padding: '8px 15px 14px',
          }}
        >
          <div className="mx-auto flex flex-col" style={{ maxWidth: '800px' }}>
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}
                style={{
                  color: 'var(--color-text)',
                  padding: '10px 0',
                  fontSize: '16px',
                  textDecoration: 'none',
                }}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}

      <style>{`
        .nav-link {
          border-bottom: 2px solid transparent;
          transition: border-color 150ms ease, color 150ms ease;
        }
        .nav-link:hover,
        .nav-link--active {
          border-bottom-color: var(--color-divider-strong);
        }
      `}</style>
    </header>
  )
}
