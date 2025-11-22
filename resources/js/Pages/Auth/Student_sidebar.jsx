import { useState } from 'react'
import { Link, usePage } from '@inertiajs/react'
import { getStudentNav, studentNav } from '../Students/navConfig'
import { useSidebar } from '../../contexts/SidebarContext'

export default function StudentSidebar({ enrollmentStatus }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { url } = usePage()
  const { isCollapsed, toggleSidebar } = useSidebar()
  const palette = {
    navy: '#182978',
    teal: '#6688cc',
    sand: '#acbfe6'
  }
  const sidebarWidthClass = isCollapsed ? 'w-20 md:w-16' : 'w-64'

  const nav = enrollmentStatus ? getStudentNav(enrollmentStatus) : studentNav

  const handleNavClick = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches) {
      return
    }
    setMobileOpen(false)
  }

  function isActive(href) {
    if (!url) return false
    if (href === '/student/dashboard') {
      return url === '/student/dashboard'
    }
    return url.startsWith(href)
  }

  // Get icon component based on icon type
  function getIcon(iconType, className = 'w-5 h-5') {
    const iconClass = className
    switch (iconType) {
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
              className="flex items-center justify-center rounded-md px-2 py-1.5 text-sm text-white/40 cursor-not-allowed border border-white/10"
              title={item.note || item.label}
            >
              {item.icon ? getIcon(item.icon, 'w-5 h-5') : (
                <span>{item.label.charAt(0).toUpperCase()}</span>
              )}
            </div>
          ) : (
            <Link
              href={item.href}
              onClick={handleNavClick}
              className={`${active ? '' : 'text-white/80 hover:bg-white/10'} flex items-center justify-center rounded-md p-2 text-sm transition`}
              style={active ? { backgroundColor: palette.sand, color: palette.navy } : {}}
              aria-current={active ? 'page' : undefined}
              title={item.label}
            >
              {item.icon ? getIcon(item.icon, 'w-5 h-5') : (
                <span className={active ? 'font-semibold' : 'font-normal'}>
                  {item.label.charAt(0).toUpperCase()}
                </span>
              )}
            </Link>
          )}
          {!item.disabled && (
            <div className="absolute left-full ml-2 top-0 z-50 hidden group-hover:block pointer-events-none">
              <div className="bg-black/80 text-white text-xs rounded py-1 px-2 whitespace-nowrap shadow-lg">
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
            className="group flex items-center justify-between rounded-md border border-white/10 px-3 py-2 text-sm font-medium text-white/40 cursor-not-allowed"
            title={item.note || undefined}
          >
            <div className="flex items-center gap-2 flex-1">
              {item.icon && <span className="text-white/40">{getIcon(item.icon, 'w-4 h-4')}</span>}
              <div className="flex-1">
                <span>{item.label}</span>
                {item.note && (
                  <p className="mt-1 text-xs text-white/50 leading-tight">
                    {item.note}
                  </p>
                )}
              </div>
            </div>
            <span className={`text-[10px] ${item.status === 'pending' ? 'text-amber-400' : 'text-red-400'}`}>
              {item.status === 'pending' ? '⧗' : '✕'}
            </span>
          </div>
        ) : (
          <Link
            href={item.href}
            onClick={handleNavClick}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${active ? 'font-semibold' : 'text-white/80 hover:bg-white/5'}`}
            style={active ? { backgroundColor: palette.sand, color: palette.navy } : {}}
            aria-current={active ? 'page' : undefined}
          >
            {item.icon && <span className="text-white/70">{getIcon(item.icon, 'w-4 h-4')}</span>}
            <span>{item.label}</span>
            {item.status === 'closed' && !active && <span className="text-[10px] text-red-400 ml-auto">✕</span>}
            {item.status === 'open' && !active && <span className="text-[10px] text-green-400 ml-auto">●</span>}
          </Link>
        )}
      </div>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-lg"
        style={{ backgroundColor: palette.teal }}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        Menu
      </button>

      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:z-auto md:static`}
      >
        <div
          className={`flex h-full flex-col shadow-2xl ${sidebarWidthClass}`}
          style={{ backgroundColor: palette.navy }}
        >
          <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10 relative">
            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow shrink-0" aria-hidden>
              <img src="/onsts.png" alt="ONSTS Logo" className="h-8 w-8 object-contain" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 text-white">
                <p className="text-xs uppercase tracking-[0.2em] text-white/70">ONSTS</p>
                <p className="text-sm font-semibold">Student Portal</p>
              </div>
            )}
            <button
              type="button"
              onClick={toggleSidebar}
              className="hidden md:inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 p-2 text-white hover:bg-white/15 absolute right-3 top-1/2 -translate-y-1/2 shadow"
            >
              {isCollapsed ? (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              )}
            </button>
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center rounded-full border border-white/20 p-2 text-white/80 hover:bg-white/10"
              onClick={() => setMobileOpen(false)}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {nav.map(item => renderNavItem(item, isCollapsed))}
          </div>

          <div className="px-4 py-4 border-t border-white/10 text-xs text-white/60">
            Sign out via the profile menu in the dashboard header.
          </div>
        </div>
      </aside>

      {/* Desktop spacer removed; aside switches to relative layout on md+ */}
    </>
  )
}
