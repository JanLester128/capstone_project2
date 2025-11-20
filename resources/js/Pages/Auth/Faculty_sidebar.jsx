import { useState } from 'react'
import { Link, router, usePage } from '@inertiajs/react'
import { facultyNav, coordinatorNav } from '../Faculty/navConfig'
import sessionManager from '../../utils/sessionManager'
import { useSidebar } from '../../contexts/SidebarContext'

export default function FacultySidebar({ user }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { url } = usePage()
  const { isCollapsed, toggleSidebar } = useSidebar()

  // Combine regular faculty nav with coordinator nav if user is coordinator
  const nav = user?.is_coordinator ? [...facultyNav, ...coordinatorNav] : facultyNav

  function isActive(href) {
    if (!url) return false
    if (href === '/faculty') {
      return url === '/faculty'
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
            className={
              (active
                ? 'bg-purple-50 text-purple-700'
                : `${categoryColor} hover:bg-gray-50`) +
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
        className={
          (active
            ? 'bg-purple-50 text-purple-700 font-semibold'
            : 'text-gray-900 hover:bg-gray-50') +
          ' flex items-center gap-2 px-2 py-1.5 text-sm transition-colors rounded-md'
        }
        aria-current={active ? 'page' : undefined}
      >
        {item.icon && <span className="text-gray-600">{getIcon(item.icon, "w-4 h-4")}</span>}
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
        <div className={`px-2 py-1 text-xs font-semibold ${categoryColor} uppercase tracking-wider`}>
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
            <p className="text-[10px] text-gray-600">Faculty Portal</p>
          </div>
        </div>
        <button
          type="button"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((o) => !o)}
          className="inline-flex items-center rounded-lg bg-gradient-to-r from-red-500 to-purple-600 text-white px-3 py-1.5 text-xs font-medium"
        >
          {mobileOpen ? 'Close' : 'Menu'}
        </button>
      </div>

      {/* Desktop nav */}
      <nav className={`hidden md:flex flex-col h-screen sticky top-0 relative z-10 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}>
        {/* Logo and School Info */}
        <div className="p-3 bg-gradient-to-r from-red-600 to-purple-600 text-white flex-shrink-0 relative">
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
                <p className="text-[9px] text-red-100">Student Management System</p>
                {user?.is_coordinator && (
                  <div className="mt-0.5 flex items-center gap-1">
                    <div className="h-1 w-1 bg-white rounded-full"></div>
                    <span className="text-[8px] text-red-100">Coordinator</span>
                  </div>
                )}
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

        {/* Navigation Items - Compact spacing to fit all items */}
        <div className="flex-1 p-2 space-y-0.5 overflow-y-auto sidebar-nav" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
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
        <nav id="faculty-mobile-nav" className="md:hidden bg-white border-b shadow-lg">
          <div className="p-3 space-y-2 max-h-[80vh] overflow-y-auto">
            {filteredNav.map((item) => {
              if (item.category === 'main') {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={
                      (active 
                        ? 'bg-gradient-to-r from-red-500 to-purple-600 text-white shadow-md' 
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100') +
                      ' flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all'
                    }
                  >
                    <span>{item.label}</span>
                  </Link>
                )
              }
              
              if (item.category && item.items) {
                return (
                  <div key={item.category} className="space-y-1.5">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider px-2">
                      {item.categoryLabel}
                    </div>
                    <div className="pl-4 space-y-1">
                      {item.items.map((subItem) => {
                        const active = isActive(subItem.href)
                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            onClick={() => setMobileOpen(false)}
                            className={
                              (active 
                                ? 'bg-gradient-to-r from-red-500 to-purple-600 text-white shadow-md' 
                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100') +
                              ' flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-all'
                            }
                          >
                            <span>{subItem.label}</span>
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
  )
}
