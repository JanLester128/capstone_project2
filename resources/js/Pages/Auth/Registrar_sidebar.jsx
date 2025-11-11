import { useState } from 'react'
import { Link, router, usePage } from '@inertiajs/react'
import { registrarNav } from '../Registrar/navConfig'
import sessionManager from '../../utils/sessionManager'

export default function RegistrarSidebar() {
  const [open, setOpen] = useState(false)
  const { url } = usePage()

  const nav = registrarNav

  function isActive(href) {
    // Safety check: ensure url is defined
    if (!url) return false
    
    // Exact match for dashboard to prevent it being active on sub-routes
    if (href === '/registrar') {
      return url === '/registrar'
    }
    // For other routes, use startsWith to handle sub-routes
    return url.startsWith(href)
  }

  function onLogout(e) {
    e.preventDefault()
    // Clear session state before logout
    sessionManager.handleUserLogout()
    router.post('/logout')
  }

  return (
    <aside className="bg-white border-r border-gray-200">
      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-3">
          <img
            src="/onsts.png"
            alt="ONSTS Logo"
            className="h-8 w-8 object-contain"
          />
          <div>
            <span className="font-semibold text-gray-900 text-sm">ONSTS</span>
            <p className="text-xs text-gray-500">Registrar</p>
          </div>
        </div>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="registrar-mobile-nav"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          {open ? 'Close' : 'Menu'}
        </button>
      </div>

      {/* Desktop nav */}
      <nav className="hidden md:block w-64 h-screen sticky top-0 p-4">
        {/* Logo and School Info */}
        <div className="mb-6 border-b pb-4">
          <div className="flex items-center gap-3 mb-3">
            <img
              src="/onsts.png"
              alt="OPOL NATIONAL SECONDARY TECHNICAL SCHOOL Logo"
              className="h-10 w-10 object-contain flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-xs font-bold text-gray-900 leading-tight mb-1">
                OPOL NATIONAL SECONDARY TECHNICAL SCHOOL
              </h2>
              <p className="text-xs text-gray-500">Management System</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full w-fit">
            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
            <span className="text-xs font-medium text-blue-700">Registrar</span>
          </div>
        </div>
        <ul className="space-y-1" role="list">
          {nav.map((n) => (
            <li key={n.href}>
              <Link
                href={n.href}
                className={
                  (isActive(n.href)
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-transparent') +
                  ' group flex items-center justify-between rounded-md border px-3 py-2 text-sm font-medium transition'
                }
                aria-current={isActive(n.href) ? 'page' : undefined}
              >
                <span>{n.label}</span>
                {isActive(n.href) && <span className="text-[10px] text-indigo-600">●</span>}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-6 border-t pt-4">
          <button
            onClick={onLogout}
            className="w-full rounded-md border px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            Sign out
          </button>
        </div>
      </nav>

      {/* Mobile flyout */}
      {open && (
        <nav id="registrar-mobile-nav" className="md:hidden p-4 space-y-1 border-b" role="dialog" aria-modal="true">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className={(isActive(n.href) ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50') + ' block rounded-md px-3 py-2 text-sm'}
              aria-current={isActive(n.href) ? 'page' : undefined}
            >
              {n.label}
            </Link>
          ))}
          <button onClick={onLogout} className="w-full rounded-md border px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
            Sign out
          </button>
        </nav>
      )}
    </aside>
  )
}


