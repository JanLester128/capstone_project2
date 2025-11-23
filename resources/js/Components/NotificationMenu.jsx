import { useState, useEffect, useRef } from 'react'
import { Link } from '@inertiajs/react'

const defaultCounts = {
  new_enrollments: 0,
  re_enrollments: 0,
  transferee_credits: 0,
  unverified_students: 0,
  pending_grades: 0,
  total: 0,
}

export default function NotificationMenu({ notifications = {} }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  const safeNotifications = { ...defaultCounts, ...notifications }
  const total = safeNotifications.total ?? 0

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const closeMenu = () => setOpen(false)

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        aria-label="Notifications"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {total > 0 && (
          <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {total > 99 ? '99+' : total}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
          </div>
          <div className="py-2">
            {total === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p>No new notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {safeNotifications.new_enrollments > 0 && (
                  <NotificationItem
                    count={safeNotifications.new_enrollments}
                    onClick={closeMenu}
                    href="/registrar/enrollments?status=pre_enrolled,recommended"
                    title="New Student Enrollments"
                    description={`${safeNotifications.new_enrollments} ${safeNotifications.new_enrollments === 1 ? 'student' : 'students'} waiting for review`}
                    iconBg="bg-blue-100"
                    iconColor="text-blue-600"
                    badgeColor="bg-blue-600"
                    iconPath="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                )}

                {safeNotifications.re_enrollments > 0 && (
                  <NotificationItem
                    count={safeNotifications.re_enrollments}
                    onClick={closeMenu}
                    href="/registrar/re-enroll-students"
                    title="Re-Enrollment Requests"
                    description={`${safeNotifications.re_enrollments} ${safeNotifications.re_enrollments === 1 ? 'student' : 'students'} need re-enrollment`}
                    iconBg="bg-green-100"
                    iconColor="text-green-600"
                    badgeColor="bg-green-600"
                    iconPath="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                )}

                {safeNotifications.transferee_credits > 0 && (
                  <NotificationItem
                    count={safeNotifications.transferee_credits}
                    onClick={closeMenu}
                    href="/registrar/credited-subjects"
                    title="Transferee Credit Subjects"
                    description={`${safeNotifications.transferee_credits} ${safeNotifications.transferee_credits === 1 ? 'subject' : 'subjects'} pending approval`}
                    iconBg="bg-orange-100"
                    iconColor="text-orange-600"
                    badgeColor="bg-orange-600"
                    iconPath="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                )}

                {safeNotifications.unverified_students > 0 && (
                  <NotificationItem
                    count={safeNotifications.unverified_students}
                    onClick={closeMenu}
                    href="/registrar/student-verification"
                    title="Student Account Verification"
                    description={`${safeNotifications.unverified_students} ${safeNotifications.unverified_students === 1 ? 'student needs' : 'students need'} account verification`}
                    iconBg="bg-yellow-100"
                    iconColor="text-yellow-600"
                    badgeColor="bg-yellow-600"
                    iconPath="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                )}

                {safeNotifications.pending_grades > 0 && (
                  <NotificationItem
                    count={safeNotifications.pending_grades}
                    onClick={closeMenu}
                    href="/registrar/grades/approvals"
                    title="Pending Grade Approvals"
                    description={`${safeNotifications.pending_grades} ${safeNotifications.pending_grades === 1 ? 'grade needs' : 'grades need'} approval`}
                    iconBg="bg-indigo-100"
                    iconColor="text-indigo-600"
                    badgeColor="bg-indigo-600"
                    iconPath="M9 12l2 2 4-4m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h4"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function NotificationItem({ count, href, title, description, iconBg, iconColor, badgeColor, iconPath, onClick }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
    >
      <div className={`flex-shrink-0 w-10 h-10 rounded-full ${iconBg} flex items-center justify-center`}>
        <svg className={`w-5 h-5 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </div>
      <span className={`flex-shrink-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white rounded-full ${badgeColor}`}>
        {count}
      </span>
    </Link>
  )
}
