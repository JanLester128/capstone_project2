import { useEffect, useRef, useState } from 'react'
import { Link, router, usePage } from '@inertiajs/react'
import { facultyNav, coordinatorNav } from '../Faculty/navConfig'
import { useSidebar } from '../../contexts/SidebarContext'

export default function FacultySidebar({ user }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { url } = usePage()
  const { isCollapsed, toggleSidebar } = useSidebar()
  const navListRef = useRef(null)
  const palette = {
    navy: '#182978',
    teal: '#6688cc',
    sand: '#acbfe6'
  }
  const sidebarWidthClass = isCollapsed ? 'w-20 md:w-16' : 'w-64'

  // Combine regular faculty nav with coordinator nav if user is coordinator
  const nav = user?.is_coordinator ? [...facultyNav, ...coordinatorNav] : facultyNav

  useEffect(() => {
    if (navListRef.current) {
      navListRef.current.scrollTop = 0
    }
  }, [url])

  const handleNavClick = (event) => {
    if (typeof window !== 'undefined') {
      if (!window.matchMedia('(min-width: 768px)').matches) {
        setMobileOpen(false)
      }

      window.requestAnimationFrame(() => {
        if (event?.currentTarget instanceof HTMLElement) {
          event.currentTarget.blur()
        } else if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur()
        }
      })
    }
  }

  function isActive(href) {
    if (!url) return false
    if (href === '/faculty') {
      return url === '/faculty'
    }
    return url.startsWith(href)
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
      case 'students':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        )
      case 'grades':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      case 'reports':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      case 'enrollment':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      case 'subjects':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
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

  // Get color class based on category
  function getCategoryColor(category) {
    switch(category) {
      case 'teaching':
        return 'text-blue-600'
      case 'coordinator':
        return 'text-indigo-600'
      case 'reports':
        return 'text-green-600'
      case 'profile':
        return 'text-orange-600'
      default:
        return 'text-gray-700'
    }
  }

  // Render a navigation item
  function renderNavItem(item, isCollapsed = false, category = null) {
    const active = isActive(item.href)
    const categoryColor = category ? getCategoryColor(category) : 'text-purple-600'
    
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
          <div className="absolute left-full ml-2 top-0 z-50 hidden group-hover:block pointer-events-none">
            <div className="bg-black/80 text-white text-xs rounded py-1 px-2 whitespace-nowrap shadow-lg">
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
        className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${active ? 'font-semibold' : 'text-white/80 hover:bg-white/5'}`}
        style={active ? { backgroundColor: palette.sand, color: palette.navy } : {}}
        aria-current={active ? 'page' : undefined}
      >
        {item.icon && <span className="text-white/70">{getIcon(item.icon, "w-4 h-4")}</span>}
        <span>{item.label}</span>
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
        <div className="px-2 py-1 text-xs font-semibold text-white/60 uppercase tracking-wider">
          {categoryItem.categoryLabel}
        </div>
        <div className="mt-0.5 space-y-0.5">
          {categoryItem.items.map(item => renderNavItem(item, false, categoryItem.category))}
        </div>
      </div>
    )
  }

  // Filter nav - show all items
  const filteredNav = nav.filter(Boolean)

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
          className={`grid h-full shadow-2xl ${sidebarWidthClass}`}
          style={{ backgroundColor: palette.navy, gridTemplateRows: 'auto minmax(0,1fr) auto' }}
        >
          <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10 relative">
            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow shrink-0" aria-hidden>
              <img src="/onsts.png" alt="ONSTS Logo" className="h-8 w-8 object-contain" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 text-white">
                <p className="text-xs uppercase tracking-[0.2em] text-white/70">ONSTS</p>
                <p className="text-sm font-semibold">Faculty Portal</p>
                {user?.is_coordinator && (
                  <span className="text-[10px] uppercase tracking-wide text-white/60">Coordinator</span>
                )}
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

          <div
            ref={navListRef}
            className="overflow-y-auto px-3 py-4 pb-4 space-y-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
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

        </div>
      </aside>

      {/* Desktop spacer removed; aside switches to relative layout on md+ */}
    </>
  )
}
