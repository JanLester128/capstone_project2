import { useState, useEffect } from 'react'
import { Link, usePage } from '@inertiajs/react'
import { registrarNav } from '../Registrar/navConfig'
import { useSidebar } from '../../contexts/SidebarContext'

export default function RegistrarSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { url } = usePage()
  const { isCollapsed, toggleSidebar } = useSidebar()
  const palette = {
    navy: '#182978',
    teal: '#6688cc',
    sand: '#acbfe6'
  }
  const sidebarWidthClass = isCollapsed ? 'w-20 md:w-16' : 'w-64'

  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = originalOverflow || ''
    }
    return () => {
      document.body.style.overflow = originalOverflow || ''
    }
  }, [mobileOpen])

  function isActive(href) {
    if (!url) return false
    if (href === '/registrar') {
      return url === '/registrar'
    }
    return url.startsWith(href)
  }

  const handleNavClick = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches) {
      return
    }
    setMobileOpen(false)
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
      case 'verify':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'enrollment':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      case 'grades':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      case 'calendar':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )
      case 'strands':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        )
      case 'subjects':
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
      case 'students':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        )
      case 'faculty':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-2.91 0-5.63-.392-8.36-1.245M21 13.255v-2.51A23.93 23.93 0 0012 8c-2.91 0-5.63.392-8.36 1.245m0 0A23.998 23.998 0 003 12c0 2.22.892 4.207 2.34 5.709M3 13.255A23.93 23.93 0 0112 15c2.91 0 5.63-.392 8.36-1.245M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )
      case 'profile':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        )
      case 'reports':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        )
      default:
        return null
    }
  }

  // Get color class based on category
  function getCategoryColor(category) {
    switch(category) {
      case 'student_management':
        return 'text-sky-200'
      case 'academic_setup':
        return 'text-emerald-200'
      case 'people':
        return 'text-amber-200'
      case 'reports':
        return 'text-indigo-200'
      default:
        return 'text-white/60'
    }
  }

  // Render a navigation item
  function renderNavItem(item, isCollapsed = false, category = null) {
    const active = isActive(item.href)
    
    if (isCollapsed) {
      return (
        <div key={item.href} className="relative group">
          <Link
            href={item.href}
            onClick={handleNavClick}
            className={`${active ? '' : 'text-white/80 hover:bg-white/10'} flex items-center justify-center rounded-md p-2 text-sm transition`}
            style={active ? { backgroundColor: palette.sand, color: palette.navy } : {}}
            aria-current={active ? 'page' : undefined}
            title={item.label}
          >
            {item.icon ? getIcon(item.icon, "w-5 h-5") : (
              <span className={active ? 'font-semibold' : 'font-normal'}>
                {item.label.charAt(0).toUpperCase()}
              </span>
            )}
          </Link>
          {/* Tooltip */}
          <div className="absolute left-full ml-2 top-0 z-50 hidden group-hover:block pointer-events-none">
            <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap shadow-lg">
              {item.label}
            </div>
          </div>
        </div>
      )
    }
    
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={handleNavClick}
        className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] transition-colors ${active ? 'font-semibold' : 'text-white/80 hover:bg-white/5'}`}
        style={active ? { backgroundColor: palette.sand, color: palette.navy } : {}}
        aria-current={active ? 'page' : undefined}
      >
        {item.icon && <span className="text-white/70">{getIcon(item.icon, 'w-4 h-4')}</span>}
        <span className="truncate">{item.label}</span>
      </Link>
    )
  }

  // Render a category section (always expanded, no dropdown)
  function renderCategory(categoryItem, isCollapsed = false) {
    const hasActiveItem = categoryItem.items.some(item => isActive(item.href))
    const categoryColor = getCategoryColor(categoryItem.category)

    if (isCollapsed) {
      // Collapsed view - show category items with icons
      return (
        <div 
          key={categoryItem.category} 
          className="mb-1 space-y-0.5"
        >
          {categoryItem.items.map(item => renderNavItem(item, true, categoryItem.category))}
        </div>
      )
    }

    // Expanded view - always show items (no dropdown)
    return (
      <div key={categoryItem.category} className="mb-2">
        <div className={`px-2 py-0.5 text-[9px] font-semibold ${categoryColor} uppercase tracking-wider`}>
          {categoryItem.categoryLabel}
        </div>
        <div className="mt-0.5 space-y-0.5">
          {categoryItem.items.map(item => renderNavItem(item, false, categoryItem.category))}
        </div>
      </div>
    )
  }

  // Filter nav - show all items
  const filteredNav = registrarNav.filter(Boolean)

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
                <p className="text-sm font-semibold">Registrar Portal</p>
                <span className="text-[10px] text-white/60">Student Management</span>
              </div>
            )}
            <button
              type="button"
              onClick={toggleSidebar}
              className={`hidden md:inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 p-2 text-white hover:bg-white/15 absolute top-1/2 -translate-y-1/2 shadow ${isCollapsed ? 'right-2' : 'right-3'}`}
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

          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {filteredNav.map((item) => {
              if (item.category === 'main') {
                return renderNavItem(item, isCollapsed, null)
              }
              if (item.category && item.items) {
                return renderCategory(item, isCollapsed)
              }
              return null
            })}
          </div>

          <div className="px-4 py-4 border-t border-white/10 text-xs text-white/60">
            Sign out through the profile dropdown in the dashboard header.
          </div>
        </div>
      </aside>

      {/* No additional spacer; sidebar becomes part of layout on md+ */}
    </>
  )
}
