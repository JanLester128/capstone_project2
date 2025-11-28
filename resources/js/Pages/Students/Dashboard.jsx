import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { TextPlugin } from 'gsap/TextPlugin'
import { Head, Link, router, usePage } from '@inertiajs/react'
import StudentSidebar from '../Auth/Student_sidebar'
import sessionManager from '../../utils/sessionManager'

const STATUS_META = {
  pre_enrolled: {
    label: 'Pre-Enrolled',
    badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    dot: 'bg-yellow-500',
    helper: 'You can still edit your pre-enrollment while the form is open.',
  },
  recommended: {
    label: 'Recommended (Awaiting Registrar)',
    badge: 'bg-orange-100 text-orange-800 border-orange-200',
    dot: 'bg-orange-500',
    helper: 'Coordinator has endorsed your enrollment. Await registrar approval.',
  },
  enrolled: {
    label: 'Enrolled',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    dot: 'bg-blue-500',
    helper: 'Enrollment confirmed. Welcome back!',
  },
  rejected: {
    label: 'Returned for Revision',
    badge: 'bg-red-100 text-red-800 border-red-200',
    dot: 'bg-red-500',
    helper: 'Please review the remarks and update your pre-enrollment form.',
  },
}

export default function StudentDashboard({
  enrollmentStatus = {},
  currentEnrollment = null,
  previousTerm = null,
  grades = [],
  recommendations = [],
}) {
  const { auth } = usePage().props
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const profileMenuRef = useRef(null)
  const typedTextRef = useRef(null)
  const cursorRef = useRef(null)
  const cn = (...classes) => classes.filter(Boolean).join(' ')
  const isReturning = Boolean(previousTerm)
  const stageKey = currentEnrollment?.status ?? (enrollmentStatus?.isOpen ? 'pre_enrolled' : 'pre_enrolled')
  const stageMeta = STATUS_META[stageKey] ?? STATUS_META.pre_enrolled
  const canGenerateCor = Boolean(currentEnrollment?.can_generate_cor)
  const corLink = canGenerateCor && currentEnrollment?.id ? `/enrollments/${currentEnrollment.id}/cor` : null
  const firstName = auth?.user?.FirstName ?? 'Student'
  const welcomeMessage = `Welcome ${firstName}`

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false)
      }
    }

    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [profileMenuOpen])

  useEffect(() => {
    if (!typedTextRef.current || !cursorRef.current) return

    gsap.registerPlugin(TextPlugin)

    const typingDuration = welcomeMessage.length * 0.075 // 75ms per character
    const deletingDuration = welcomeMessage.length * 0.05 // 50ms per character
    const pauseDuration = 1.5 // seconds

    const tl = gsap.timeline({ repeat: -1 })
    tl.set(typedTextRef.current, { text: '' })
      .to(typedTextRef.current, {
        text: welcomeMessage,
        duration: typingDuration,
        ease: 'none',
      })
      .to({}, { duration: pauseDuration })
      .to(typedTextRef.current, {
        text: '',
        duration: deletingDuration,
        ease: 'none',
      })
      .to({}, { duration: 0.2 })

    const cursorTween = gsap.to(cursorRef.current, {
      opacity: 0,
      duration: 0.25,
      repeat: -1,
      yoyo: true,
      ease: 'none',
    })

    return () => {
      tl.kill()
      cursorTween.kill()
    }
  }, [welcomeMessage])

  function handleLogout(e) {
    e.preventDefault()
    setProfileMenuOpen(false)
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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <StudentSidebar enrollmentStatus={enrollmentStatus} />
      <div className="flex-1">
        <Head title="Student Dashboard" />
        <header className="relative text-white shadow" style={{ backgroundColor: '#000825' }}>
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-[#000825] via-[#111946] to-[#1f2c6e] opacity-95" />
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/3 -translate-y-1/3" />
            <div className="absolute bottom-0 right-0 w-56 h-56 bg-white/10 rounded-full blur-3xl translate-x-1/4 translate-y-1/4" />
            <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-white/8 rounded-full blur-2xl" />
            <div className="absolute bottom-1/3 left-1/4 w-40 h-40 bg-white/6 rounded-full blur-2xl" />
          </div>
          <div className="relative max-w-6xl mx-auto px-6 py-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <img
                  src="/icon1.png"
                  alt="School emblem"
                  className="w-14 h-14 rounded-full border-2 border-white/40 shadow-lg object-contain bg-white/10"
                />
                <div>
                  <h1 className="text-2xl font-semibold flex items-center" aria-label={welcomeMessage}>
                    <span ref={typedTextRef}>{welcomeMessage}</span>
                    <span
                      ref={cursorRef}
                      className="ml-1 text-3xl leading-none text-white"
                      aria-hidden="true"
                    >
                      ·
                    </span>
                  </h1>
                  <p className="text-sm text-white/85">
                    {stageKey === 'enrolled' 
                      ? 'You are officially enrolled. Welcome back!'
                      : isReturning 
                        ? 'Returning student — see your previous term summary below.' 
                        : 'New student — complete and submit your enrollment form.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold', stageMeta.badge)}>
                  <span className={cn('h-2 w-2 rounded-full', stageMeta.dot)} />
                  {stageMeta.label}
                </span>
                {/* Profile Photo with Dropdown - Next to status badge */}
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center space-x-3 focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg p-1 transition-colors hover:bg-white/10"
                  >
                    <div className="flex flex-col items-end">
                      <p className="text-sm font-medium text-white">
                        {auth?.user?.FirstName} {auth?.user?.LastName}
                      </p>
                      <p className="text-xs text-white/80">{auth?.user?.email}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
                      {auth?.user?.profile_photo ? (
                        <img
                          src={`/storage/${auth.user.profile_photo}`}
                          alt="Profile"
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                    </div>
                  </button>
                  
                  {/* Dropdown Menu */}
                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <Link
                        href="/student/profile"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>Profile</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
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
            {stageKey !== 'enrolled' && (
              <p className="mt-4 text-xs text-white/80">
                Your re-enrollment is coordinated by your strand coordinator and registrar. Track decisions and downloadable documents here.
              </p>
            )}
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
          <section className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="px-6 py-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Enrollment Status</h2>
                <p className="text-sm text-gray-500">{stageMeta.helper}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {enrollmentStatus?.isReturningStudent && !currentEnrollment && (
                  <div className="inline-flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-4 py-2 text-xs font-medium text-blue-800">
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a1 1 0 0 0 0 2v3a1 1 0 0 0 1 1h1a1 1 0 1 0 0-2v-3a1 1 0 0 0-1-1H9Z" clipRule="evenodd" />
                    </svg>
                    Returning Student
                  </div>
                )}
                {stageKey !== 'enrolled' && (
                  <Link
                    href="/student/enrollment"
                    disabled={enrollmentStatus?.isReturningStudent && !currentEnrollment?.can_edit}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-semibold transition',
                      enrollmentStatus?.isReturningStudent && !currentEnrollment?.can_edit
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : currentEnrollment?.can_edit || enrollmentStatus?.canEnroll
                        ? 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                        : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                    )}
                  >
                    Edit Enrollment Form
                  </Link>
                )}
              </div>
            </div>
            <div className="px-6 py-6 space-y-4">
              <p className="text-sm text-gray-500">Your coordinator or registrar will update this status after reviewing your grades and eligibility. You will receive notifications for any required actions.</p>
              
              {enrollmentStatus?.isReturningStudent && !currentEnrollment && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <div className="flex items-start gap-3">
                    <svg className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a1 1 0 0 0 0 2v3a1 1 0 0 0 1 1h1a1 1 0 1 0 0-2v-3a1 1 0 0 0-1-1H9Z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-blue-900">Returning Student Notice</h4>
                      <p className="mt-1 text-sm text-blue-700">
                        You are a returning student. Please visit the <strong>Registrar or Coordinator in person</strong> with your previous grades to be re-enrolled for the new term. 
                        You do not need to fill out the enrollment form again.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {isReturning ? (
            <section className="bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="px-6 py-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Previous Term Summary</h3>
                  <p className="text-sm text-gray-500">
                    {previousTerm?.label ?? 'Most recent completed term'} • Strand: {previousTerm?.strand ?? ''} • Adviser: {previousTerm?.adviser ?? 'TBD'}
                  </p>
                </div>
                {recommendations?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {recommendations.map((rec) => (
                      <span key={rec.code} className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                        {rec.message}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-6 py-3 text-left">Subject</th>
                      <th className="px-3 py-3 text-center">Q1</th>
                      <th className="px-3 py-3 text-center">Q2</th>
                      <th className="px-3 py-3 text-center">Q3</th>
                      <th className="px-3 py-3 text-center">Q4</th>
                      <th className="px-3 py-3 text-center">Semester</th>
                      <th className="px-3 py-3 text-left">Prerequisite</th>
                      <th className="px-3 py-3 text-left">Remarks</th>
                      <th className="px-3 py-3 text-left">System Recommendation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {grades.map((row) => (
                      <tr key={row.id}>
                        <td className="px-6 py-4 font-semibold text-gray-900">{row.subject?.name}</td>
                        <td className="px-3 py-4 text-center">{row.first_quarter ?? ''}</td>
                        <td className="px-3 py-4 text-center">{row.second_quarter ?? ''}</td>
                        <td className="px-3 py-4 text-center">{row.third_quarter ?? ''}</td>
                        <td className="px-3 py-4 text-center">{row.fourth_quarter ?? ''}</td>
                        <td className="px-3 py-4 text-center font-semibold text-gray-900">{row.semester_grade ?? ''}</td>
                        <td className="px-3 py-4 text-sm text-gray-600">
                          {row.subject?.prerequisites?.length
                            ? row.subject.prerequisites.join(', ')
                            : 'None'}
                        </td>
                        <td className="px-3 py-4">
                          <span className={cn(
                            'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                            row.remarks === 'Failed'
                              ? 'bg-red-100 text-red-700'
                              : row.remarks === 'Passed'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                          )}>
                            {row.remarks ?? 'Pending'}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-600">{row.recommendation?.note ?? ''}</td>
                      </tr>
                    ))}
                    {grades.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-6 py-6 text-center text-sm text-gray-500">
                          No grade records found for the previous term.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          ) : (
            stageKey !== 'enrolled' && (
              <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900">New Student Enrollment</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Complete your enrollment form, upload the required documents, and submit. Your coordinator is notified automatically.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href="/student/enrollment"
                    className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
                  >
                    Open Enrollment Form
                  </Link>
                </div>
              </section>
            )
          )}
        </main>
      </div>
    </div>
  )
}
