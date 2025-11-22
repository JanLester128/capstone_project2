import { useState, useEffect } from 'react'
import { Link, router, usePage } from '@inertiajs/react'
import { registrarNav } from '../Registrar/navConfig'
import sessionManager from '../../utils/sessionManager'
import { useSidebar } from '../../contexts/SidebarContext'

export default function RegistrarSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { url } = usePage()
  const { isCollapsed, toggleSidebar } = useSidebar()

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

  function onLogout(e) {
    e.preventDefault()
    setShowLogoutConfirm(true)
  }

  function confirmLogout() {
    setIsLoggingOut(true)
    sessionManager.handleUserLogout()
    router.post('/logout', {}, {
      onFinish: () => setIsLoggingOut(false)
    })
  }

  function cancelLogout() {
    setShowLogoutConfirm(false)
    setIsLoggingOut(false)
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
        return 'text-blue-600'
      case 'academic_setup':
        return 'text-green-600'
      case 'people':
        return 'text-orange-600'
      case 'reports':
        return 'text-purple-600'
      default:
        return 'text-gray-700'
    }
  }

  // Render a navigation item
  function renderNavItem(item, isCollapsed = false, category = null) {
    const active = isActive(item.href)
    const activeStyles = active ? 'bg-[#000825] text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'
    const iconCircle = active ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-500'
    
    if (isCollapsed) {
      return (
        <div key={item.href} className="relative group">
          <Link
            href={item.href}
            className={
              (active
                ? 'text-white'
                : 'text-gray-700 hover:bg-gray-50') +
              ' flex items-center justify-center px-2 py-1.5 text-sm transition-colors rounded-md'
            }
            style={active ? { backgroundColor: '#000825' } : {}}
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
        className={`${activeStyles} flex items-center gap-2 px-2.5 py-1.5 text-sm transition-colors rounded-lg border border-transparent`}
        aria-current={active ? 'page' : undefined}
        style={active ? { borderColor: '#000825' } : {}}
      >
        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs ${iconCircle}`}>
          {item.icon ? getIcon(item.icon, 'w-4 h-4') : item.label.charAt(0)}
        </span>
        <span className="font-medium truncate">{item.label}</span>
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
        <div className={`px-2 py-0.5 text-[10px] font-semibold ${categoryColor} uppercase tracking-wider`}>
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
      <aside
        className={`bg-white border-r border-gray-200 shadow-sm transition-all duration-300 ${
          isCollapsed ? 'w-16' : 'w-64'
        } md:fixed md:inset-y-0 md:left-0 md:z-40 md:h-screen flex-shrink-0`}
        style={{ overflow: 'hidden' }}
      >
      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between px-3 py-2 border-b bg-[#000825] relative overflow-hidden">
        {/* Decorative Translucent White Circles */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -translate-x-1/4 -translate-y-1/4"></div>
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/20 rounded-full blur-2xl translate-x-1/4 translate-y-1/4"></div>
        <div className="flex items-center gap-2 relative z-10">
          <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shadow-md p-1">
            <img
              src="/onsts.png"
              alt="ONSTS Logo"
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <span className="font-bold text-white text-xs">ONSTS</span>
            <p className="text-[10px] text-white/90">Registrar Portal</p>
          </div>
        </div>
        <button
          type="button"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((o) => !o)}
          className="inline-flex items-center rounded-lg text-white px-3 py-1.5 text-xs font-medium relative z-10"
          style={{ backgroundColor: '#1a1f3a' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2a2f4a'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1a1f3a'}
        >
          {mobileOpen ? 'Close' : 'Menu'}
        </button>
      </div>

      {/* Desktop nav */}
      <nav
        className={`hidden md:flex flex-col h-full ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Logo and School Info */}
        <div className="p-2 text-white flex-shrink-0 relative" style={{ backgroundColor: '#000825' }}>
          {/* Decorative Translucent White Circles */}
          <div className="absolute top-0 left-0 w-48 h-48 bg-white/15 rounded-full blur-2xl -translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/15 rounded-full blur-2xl translate-x-1/3 translate-y-1/3 pointer-events-none"></div>
          
          <div className="flex items-center gap-2 pr-8 relative z-10">
            <div className="h-9 w-9 rounded-full bg-white flex items-center justify-center shadow-lg p-1 flex-shrink-0">
              <img
                src="/onsts.png"
                alt="ONSTS Logo"
                className="h-full w-full object-contain"
              />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <h2 className="text-[9px] font-bold leading-tight">
                  OPOL NATIONAL SECONDARY TECHNICAL SCHOOL
                </h2>
                <p className="text-[8px] text-white/90">Student Management System</p>
              </div>
            )}
          </div>
          
          {/* Collapse Toggle Button - Top Right, White Hamburger Menu Style */}
          <button
            onClick={toggleSidebar}
            className={`absolute w-7 h-7 flex items-center justify-center transition-all duration-300 z-[9999] group hover:bg-white/15 rounded ${
              isCollapsed ? 'bottom-2 left-1/2 -translate-x-1/2' : 'top-2 right-2'
            }`}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {/* Red vertical line indicator */}
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-red-600"></div>
            
            {/* Hamburger menu icon - White */}
            <div className="flex flex-col gap-1 items-center">
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-white"></div>
                <div className="w-3 h-0.5 bg-white rounded"></div>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-white"></div>
                <div className="w-3 h-0.5 bg-white rounded"></div>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-white"></div>
                <div className="w-3 h-0.5 bg-white rounded"></div>
              </div>
            </div>
          </button>
        </div>

        {/* Navigation Items */}
        <div
          className="flex-1 px-3 py-4 space-y-4 overflow-y-auto sidebar-nav"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {filteredNav.map((item) => {
            // Handle main dashboard item
            if (item.category === 'main') {
              return renderNavItem(item, isCollapsed, null)
            }
            // Handle category sections
            if (item.category && item.items) {
              return renderCategory(item, isCollapsed)
            }
            return null
          })}
        </div>

      </nav>

      {/* Mobile flyout */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          ></div>
          <nav
            id="registrar-mobile-nav"
            className="absolute inset-y-0 left-0 w-72 max-w-full bg-white shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <img src="/onsts.png" alt="ONSTS Logo" className="h-6 w-6 object-contain" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Registrar Portal</p>
                  <p className="text-xs text-gray-500">Navigation</p>
                </div>
              </div>
              <button
                type="button"
                className="p-2 rounded-full hover:bg-gray-100"
                onClick={() => setMobileOpen(false)}
                aria-label="Close sidebar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {filteredNav.map((item) => {
                if (item.category === 'main') {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`${active ? 'bg-[#000825] text-white shadow-md' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'} flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all`}
                    >
                      {item.label}
                    </Link>
                  )
                }

                if (item.category && item.items) {
                  return (
                    <div key={item.category} className="space-y-2">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
                        {item.categoryLabel}
                      </p>
                      <div className="space-y-1">
                        {item.items.map((subItem) => {
                          const active = isActive(subItem.href)
                          return (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              onClick={() => setMobileOpen(false)}
                              className={`${active ? 'bg-[#000825] text-white shadow-md' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'} flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all`}
                            >
                              {subItem.label}
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )
                }
                return null
              })}
            </div>
          </nav>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Confirm Logout</h3>
                <p className="text-sm text-gray-600 mt-1">Are you sure you want to logout?</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelLogout}
                disabled={isLoggingOut}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                disabled={isLoggingOut}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoggingOut && (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                )}
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
      <div
        className={`hidden md:block ${isCollapsed ? 'w-16' : 'w-64'}`}
        aria-hidden="true"
      />
    </>
  )
}
