import { useState } from 'react'
import { Link, router, usePage } from '@inertiajs/react'
import { getStudentNav, studentNav } from '../Students/navConfig'
import sessionManager from '../../utils/sessionManager'
import { useSidebar } from '../../contexts/SidebarContext'

export default function StudentSidebar({ enrollmentStatus }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { url } = usePage()
  const { isCollapsed, toggleSidebar } = useSidebar()

  const nav = enrollmentStatus ? getStudentNav(enrollmentStatus) : studentNav

  function isActive(href) {
    if (!url) return false
    if (href === '/student/dashboard') {
      return url === '/student/dashboard'
    }
    return url.startsWith(href)
  }

  function onLogout(e) {
    e.preventDefault()
    sessionManager.handleUserLogout()
    router.post('/logout')
  }

  // Get icon component based on icon type
  function getIcon(iconType, className = "w-5 h-5") {
    const iconClass = className
    switch(iconType) {
      case 'dashboard':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        )
      case 'classes':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        )
      case 'schedule':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'grades':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      case 'enrollment':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      case 'profile':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        )
      default:
        return null
    }
  }

  // Render a navigation item
  function renderNavItem(item, isCollapsed = false) {
    const active = isActive(item.href)
    
    if (isCollapsed) {
      return (
        <div key={item.href} className="relative group">
          {item.disabled ? (
            <div
              className="flex items-center justify-center px-2 py-1.5 text-sm text-gray-400 cursor-not-allowed rounded-md"
              title={item.note || item.label}
            >
              {item.icon ? getIcon(item.icon, "w-5 h-5") : (
                <span>{item.label.charAt(0).toUpperCase()}</span>
              )}
            </div>
          ) : (
            <Link
              href={item.href}
              className={
                (active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50') +
                ' flex items-center justify-center px-2 py-1.5 text-sm transition-colors rounded-md'
              }
              aria-current={active ? 'page' : undefined}
              title={item.label}
            >
              {item.icon ? getIcon(item.icon, "w-5 h-5") : (
                <span className={active ? 'font-semibold' : 'font-normal'}>
                  {item.label.charAt(0).toUpperCase()}
                </span>
              )}
            </Link>
          )}
          {/* Tooltip */}
          {!item.disabled && (
            <div className="absolute left-full ml-2 top-0 z-50 hidden group-hover:block pointer-events-none">
              <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap shadow-lg">
                {item.label}
              </div>
            </div>
          )}
        </div>
      )
    }
    
    return (
      <div key={item.href}>
        {item.disabled ? (
          <div
            className="group flex items-center justify-between rounded-md border px-3 py-2 text-sm font-medium text-gray-400 border-gray-200 cursor-not-allowed"
            title={item.note || undefined}
          >
            <div className="flex items-center gap-2 flex-1">
              {item.icon && <span className="text-gray-400">{getIcon(item.icon, "w-4 h-4")}</span>}
              <div className="flex-1">
                <span>{item.label}</span>
                {item.note && (
                  <p className="mt-1 text-xs text-gray-500 leading-tight">
                    {item.note}
                  </p>
                )}
              </div>
            </div>
            <span className={`text-[10px] ${item.status === 'pending' ? 'text-amber-500' : 'text-red-500'}`}>
              {item.status === 'pending' ? '⧗' : '✕'}
            </span>
          </div>
        ) : (
          <Link
            href={item.href}
            className={
              (active
                ? 'bg-blue-50 text-blue-700 font-semibold'
                : 'text-gray-900 hover:bg-gray-50') +
              ' flex items-center gap-2 px-2 py-1.5 text-sm transition-colors rounded-md'
            }
            aria-current={active ? 'page' : undefined}
          >
            {item.icon && <span className="text-gray-600">{getIcon(item.icon, "w-4 h-4")}</span>}
            <span>{item.label}</span>
            {item.status === 'closed' && !active && <span className="text-[10px] text-red-500 ml-auto">✕</span>}
            {item.status === 'open' && !active && <span className="text-[10px] text-green-500 ml-auto">●</span>}
          </Link>
        )}
      </div>
    )
  }

  return (
    <aside className={`bg-white border-r border-gray-200 shadow-sm transition-all duration-300 flex-shrink-0 relative ${
      isCollapsed ? 'w-16' : 'w-64'
    }`} style={{ overflowX: 'visible' }}>
      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between px-3 py-2 border-b bg-white">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shadow-md p-1">
            <img
              src="/onsts.png"
              alt="ONSTS Logo"
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <span className="font-bold text-gray-900 text-xs">ONSTS</span>
            <p className="text-[10px] text-gray-600">Student Portal</p>
          </div>
        </div>
        <button
          type="button"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((o) => !o)}
          className="inline-flex items-center rounded-lg bg-blue-600 text-white px-3 py-1.5 text-xs font-medium"
        >
          {mobileOpen ? 'Close' : 'Menu'}
        </button>
      </div>

      {/* Desktop nav */}
      <nav className={`hidden md:flex flex-col h-screen sticky top-0 relative z-10 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}>
        {/* Logo and School Info */}
        <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex-shrink-0 relative">
          <div className="flex items-center gap-2 pr-8">
            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-lg p-1.5 flex-shrink-0">
              <img
                src="/onsts.png"
                alt="ONSTS Logo"
                className="h-full w-full object-contain"
              />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <h2 className="text-[10px] font-bold leading-tight">
                  OPOL NATIONAL SECONDARY TECHNICAL SCHOOL
                </h2>
                <p className="text-[9px] text-blue-100">Student Management System</p>
              </div>
            )}
          </div>
          {/* Collapse Toggle Button - At the edge of sidebar */}
          <button
            onClick={toggleSidebar}
            className={`absolute top-1/2 -translate-y-1/2 bg-white text-gray-700 hover:bg-gray-100 rounded-full p-1.5 shadow-lg transition-all duration-300 z-20 ${
              isCollapsed ? '-right-3' : '-right-5'
            }`}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 p-2 space-y-0.5 overflow-y-auto sidebar-nav" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {nav.map((item) => renderNavItem(item, isCollapsed))}
        </div>
      </nav>

      {/* Mobile flyout */}
      {mobileOpen && (
        <nav id="student-mobile-nav" className="md:hidden bg-white border-b shadow-lg">
          <div className="p-3 space-y-2 max-h-[80vh] overflow-y-auto">
            {nav.map((item) => {
              const active = isActive(item.href)
              if (item.disabled) {
                return (
                  <div
                    key={item.href}
                    className="flex items-start justify-between rounded-md px-3 py-2 text-sm text-gray-400 cursor-not-allowed"
                    title={item.note || undefined}
                  >
                    <div className="flex-1">
                      <span>{item.label}</span>
                      {item.note && (
                        <p className="mt-1 text-xs text-gray-500 leading-tight">
                          {item.note}
                        </p>
                      )}
                    </div>
                    <span className={`text-[10px] ${item.status === 'pending' ? 'text-amber-500' : 'text-red-500'}`}>
                      {item.status === 'pending' ? '⧗' : '✕'}
                    </span>
                  </div>
                )
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={(active ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50') + ' flex items-center justify-between rounded-md px-3 py-2 text-sm'}
                  aria-current={active ? 'page' : undefined}
                >
                  <span>{item.label}</span>
                  {item.status === 'closed' && !active && <span className="text-[10px] text-red-500">✕</span>}
                  {item.status === 'open' && !active && <span className="text-[10px] text-green-500">●</span>}
                </Link>
              )
            })}
          </div>
        </nav>
      )}
    </aside>
  )
}
