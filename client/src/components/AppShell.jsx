import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AppIcon } from './AppIcon'

const navItems = [
  { to: '/dashboard', label: 'Панель', icon: 'dashboard', end: true },
  { to: '/clients', label: 'Клиенты', icon: 'groups', end: true },
  { to: '/settings', label: 'Настройки', icon: 'settings', end: true },
]

const THEME_STORAGE_KEY = 'legal-crm-theme'

function getInitialTheme() {
  if (typeof window === 'undefined') {
    return 'light'
  }

  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

export function AppShell() {
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.style.colorScheme = theme
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  function toggleTheme() {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))
  }

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-transparent pb-24 text-on-surface lg:pb-0">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-sidebar border-r border-outline-variant bg-surface-bright px-4 py-6 lg:flex lg:flex-col">
        <div className="mb-8 px-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-on-primary">
              <AppIcon name="gavel" className="h-5 w-5" />
            </div>
            <h1 className="text-lg font-bold text-primary">Юр CRM</h1>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <AppIcon name={item.icon} className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 font-semibold text-on-primary shadow-lg shadow-primary/20 transition hover:opacity-90"
          >
            <AppIcon name="logout" className="h-5 w-5" />
            Выйти
          </button>
        </div>
      </aside>

      <div className="lg:ml-sidebar">
        <header className="sticky top-0 z-40 border-b border-outline-variant bg-surface-container-lowest backdrop-blur">
          <div className="mx-auto flex min-h-16 max-w-shell items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-on-primary">
                <AppIcon name="gavel" className="h-5 w-5" />
              </div>
              <p className="text-sm font-bold text-primary">Юр CRM</p>
            </div>

            <div className="ml-auto flex items-center gap-3">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant bg-surface-container-low text-on-surface transition hover:bg-surface-container"
                aria-label="Переключить тему"
              >
                <AppIcon name={theme === 'dark' ? 'sun' : 'moon'} className="h-5 w-5" />
              </button>

              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/10 bg-primary-fixed font-semibold text-primary">
                {(user?.email ?? 'AD').slice(0, 2).toUpperCase()}
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant bg-surface-container-low text-on-surface transition hover:bg-surface-container lg:hidden"
                aria-label="Выйти"
              >
                <AppIcon name="logout" className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-shell px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant bg-surface-container-lowest px-3 py-2 backdrop-blur lg:hidden">
        <div className="grid grid-cols-3 gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center rounded-2xl px-3 py-2 text-[11px] font-semibold transition ${
                  isActive ? 'bg-secondary-container text-primary' : 'text-on-surface-variant'
                }`
              }
            >
              <AppIcon name={item.icon} className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
