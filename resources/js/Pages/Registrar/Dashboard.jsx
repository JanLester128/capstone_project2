import { useState, useEffect, useRef } from 'react'
import { Head, Link, router, usePage } from '@inertiajs/react'
import RegistrarSidebar from '../Auth/Registrar_sidebar'
import { registrarNav } from './navConfig'
import sessionManager from '../../utils/sessionManager'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

export default function Dashboard({ stats = {}, registrar = null, analytics = {}, notifications = {} }) {
  const { auth } = usePage().props
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const profileMenuRef = useRef(null)
  const notificationMenuRef = useRef(null)
  
  const {
    students = 0,
    faculty = 0,
    sections = 0,
    subjects = 0,
    strands = 0,
    active_school_year = null,
  } = stats

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false)
      }
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target)) {
        setNotificationMenuOpen(false)
      }
    }

    if (profileMenuOpen || notificationMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [profileMenuOpen, notificationMenuOpen])

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

  // Gender Distribution Chart Data
  const genderChartData = {
    labels: ['Male', 'Female'],
    datasets: [
      {
        data: [analytics.gender_distribution?.male || 0, analytics.gender_distribution?.female || 0],
        backgroundColor: ['#3B82F6', '#EC4899'],
        borderColor: ['#2563EB', '#DB2777'],
        borderWidth: 2,
      },
    ],
  }

  // Strand Enrollment Chart Data
  const strandChartData = {
    labels: analytics.strand_enrollment?.map(item => item.strand) || [],
    datasets: [
      {
        label: 'Students Enrolled',
        data: analytics.strand_enrollment?.map(item => item.count) || [],
        backgroundColor: [
          '#8B5CF6',
          '#10B981',
          '#F59E0B',
          '#EF4444',
          '#06B6D4',
          '#84CC16',
        ],
        borderColor: [
          '#7C3AED',
          '#059669',
          '#D97706',
          '#DC2626',
          '#0891B2',
          '#65A30D',
        ],
        borderWidth: 2,
      },
    ],
  }

  // Grade Distribution Chart Data
  const gradeChartData = {
    labels: analytics.grade_distribution?.map(item => item.grade) || [],
    datasets: [
      {
        label: 'Student Population',
        data: analytics.grade_distribution?.map(item => item.count) || [],
        backgroundColor: '#6366F1',
        borderColor: '#4F46E5',
        borderWidth: 2,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  }

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: false,
      },
    },
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <RegistrarSidebar />
      <div className="flex-1 flex flex-col">
      <Head title="Registrar • Dashboard" />

      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Registrar Dashboard</h1>
          
          <div className="flex items-center gap-4">
            {/* Notification Bell Icon */}
            <div className="relative" ref={notificationMenuRef}>
              <button
                onClick={() => setNotificationMenuOpen(!notificationMenuOpen)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                aria-label="Notifications"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {notifications.total > 0 && (
                  <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    {notifications.total > 99 ? '99+' : notifications.total}
                  </span>
                )}
              </button>
              
              {/* Notification Dropdown */}
              {notificationMenuOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                  </div>
                  <div className="py-2">
                    {notifications.total === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <p>No new notifications</p>
                      </div>
                    ) : (
                      <>
                        {notifications.new_enrollments > 0 && (
                          <Link
                            href="/registrar/enrollments?status=pre_enrolled,recommended"
                            onClick={() => setNotificationMenuOpen(false)}
                            className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
                          >
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">New Student Enrollments</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {notifications.new_enrollments} {notifications.new_enrollments === 1 ? 'student' : 'students'} waiting for review
                              </p>
                            </div>
                            <span className="flex-shrink-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
                              {notifications.new_enrollments}
                            </span>
                          </Link>
                        )}
                        {notifications.re_enrollments > 0 && (
                          <Link
                            href="/registrar/re-enroll-students"
                            onClick={() => setNotificationMenuOpen(false)}
                            className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
                          >
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">Re-Enrollment Requests</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {notifications.re_enrollments} {notifications.re_enrollments === 1 ? 'student' : 'students'} need re-enrollment
                              </p>
                            </div>
                            <span className="flex-shrink-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-green-600 rounded-full">
                              {notifications.re_enrollments}
                            </span>
                          </Link>
                        )}
                        {notifications.transferee_credits > 0 && (
                          <Link
                            href="/registrar/credited-subjects"
                            onClick={() => setNotificationMenuOpen(false)}
                            className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
                          >
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">Transferee Credit Subjects</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {notifications.transferee_credits} {notifications.transferee_credits === 1 ? 'subject' : 'subjects'} pending approval
                              </p>
                            </div>
                            <span className="flex-shrink-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-orange-600 rounded-full">
                              {notifications.transferee_credits}
                            </span>
                          </Link>
                        )}
                        {notifications.unverified_students > 0 && (
                          <Link
                            href="/registrar/student-verification"
                            onClick={() => setNotificationMenuOpen(false)}
                            className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
                          >
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">Student Account Verification</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {notifications.unverified_students} {notifications.unverified_students === 1 ? 'student' : 'students'} need account verification
                              </p>
                            </div>
                            <span className="flex-shrink-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-yellow-600 rounded-full">
                              {notifications.unverified_students}
                            </span>
                          </Link>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Profile Photo with Dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center space-x-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 rounded-lg p-1 transition-colors hover:bg-gray-50"
              >
                <div className="flex flex-col items-end">
                  <p className="text-sm font-medium text-gray-900">
                    {registrar?.FirstName} {registrar?.LastName}
                  </p>
                  <p className="text-xs text-gray-500">{registrar?.email}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  {registrar?.profile_photo ? (
                    <img
                      src={`/storage/${registrar.profile_photo}`}
                      alt="Profile"
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
              </button>
              
              {/* Dropdown Menu */}
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <Link
                    href="/registrar/profile"
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
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Status & visibility of system state */}
        <div className="mb-6 rounded-md bg-indigo-50 p-4 text-sm text-indigo-900">
          <p>
            Active School Year: <strong>{active_school_year ? `${active_school_year.School_year_start}-${active_school_year.School_year_end}` : 'Not set'}</strong>
          </p>
        </div>

        {/* KPI cards */}
        <section aria-labelledby="kpis" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { 
              label: 'Students', 
              value: students, 
              icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
              gradient: 'from-blue-500 to-blue-600',
              bgColor: 'bg-blue-50'
            },
            { 
              label: 'Faculty', 
              value: faculty,
              icon: 'M21 13.255A23.931 23.931 0 0112 15c-2.91 0-5.63-.392-8.36-1.245M21 13.255v-2.51A23.93 23.93 0 0012 8c-2.91 0-5.63.392-8.36 1.245m0 0A23.998 23.998 0 003 12c0 2.22.892 4.207 2.34 5.709M3 13.255A23.93 23.93 0 0112 15c2.91 0 5.63-.392 8.36-1.245M15 10a3 3 0 11-6 0 3 3 0 016 0z',
              gradient: 'from-green-500 to-green-600',
              bgColor: 'bg-green-50'
            },
            { 
              label: 'Sections', 
              value: sections,
              icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
              gradient: 'from-purple-500 to-purple-600',
              bgColor: 'bg-purple-50'
            },
            { 
              label: 'Subjects', 
              value: subjects,
              icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
              gradient: 'from-orange-500 to-orange-600',
              bgColor: 'bg-orange-50'
            },
            { 
              label: 'Strands', 
              value: strands,
              icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
              gradient: 'from-indigo-500 to-indigo-600',
              bgColor: 'bg-indigo-50'
            },
          ].map((k) => (
            <div key={k.label} className="relative overflow-hidden rounded-xl bg-white p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className={`absolute top-0 right-0 w-20 h-20 ${k.bgColor} rounded-full -mr-10 -mt-10 opacity-20`}></div>
              <div className="relative">
                <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${k.gradient} mb-4`}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={k.icon} />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">{k.label}</p>
                <p className="text-3xl font-bold text-gray-900">{k.value.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Analytics Snippet Section */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Analytics Overview</h2>
              <p className="text-sm text-gray-500 mt-1">Quick insights - View detailed reports in Reports & Analytics</p>
            </div>
            <Link
              href="/registrar/reports"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              View Full Reports
            </Link>
          </div>
          
          {/* Compact Analytics Cards */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Gender Distribution Snippet */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-white to-blue-50 p-6 shadow-lg border border-blue-100">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-200 rounded-full -mr-12 -mt-12 opacity-10"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Gender Distribution</h3>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <div className="h-48 mb-4">
                  <Doughnut data={genderChartData} options={doughnutOptions} />
                </div>
                <div className="flex items-center justify-center gap-4 pt-4 border-t border-blue-100">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm text-gray-600">Male: {analytics.gender_distribution?.male || 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                    <span className="text-sm text-gray-600">Female: {analytics.gender_distribution?.female || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Strand Enrollment Snippet */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-white to-purple-50 p-6 shadow-lg border border-purple-100">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-200 rounded-full -mr-12 -mt-12 opacity-10"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Strand Enrollment</h3>
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="h-48 mb-4">
                  <Doughnut data={strandChartData} options={doughnutOptions} />
                </div>
                <div className="text-center pt-4 border-t border-purple-100">
                  <p className="text-sm font-medium text-gray-600">
                    <span className="text-lg font-bold text-purple-600">{analytics.strand_enrollment?.length || 0}</span> active strands
                  </p>
                </div>
              </div>
            </div>

            {/* Grade Distribution Snippet */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-white to-indigo-50 p-6 shadow-lg border border-indigo-100">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-200 rounded-full -mr-12 -mt-12 opacity-10"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Grade Levels</h3>
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div className="h-48 mb-4">
                  <Bar data={gradeChartData} options={chartOptions} />
                </div>
                <div className="text-center pt-4 border-t border-indigo-100">
                  <p className="text-sm font-medium text-gray-600">
                    <span className="text-lg font-bold text-indigo-600">{analytics.grade_distribution?.length || 0}</span> grade levels
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick actions */}
        <section className="mt-10">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
            <p className="text-sm text-gray-500 mt-1">Common tasks and shortcuts</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { 
                href: '/registrar/users?role=Student', 
                title: 'Add Student', 
                desc: 'Create a new student account',
                icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
                gradient: 'from-blue-500 to-blue-600'
              },
              { 
                href: '/registrar/users?role=Faculty', 
                title: 'Add Faculty', 
                desc: 'Create a new faculty account',
                icon: 'M21 13.255A23.931 23.931 0 0112 15c-2.91 0-5.63-.392-8.36-1.245M21 13.255v-2.51A23.93 23.93 0 0012 8c-2.91 0-5.63.392-8.36 1.245m0 0A23.998 23.998 0 003 12c0 2.22.892 4.207 2.34 5.709M3 13.255A23.93 23.93 0 0112 15c2.91 0 5.63-.392 8.36-1.245M15 10a3 3 0 11-6 0 3 3 0 016 0z',
                gradient: 'from-green-500 to-green-600'
              },
              { 
                href: '/registrar/sections', 
                title: 'Create Section', 
                desc: 'Open sections manager',
                icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
                gradient: 'from-purple-500 to-purple-600'
              },
              { 
                href: '/registrar/subjects', 
                title: 'Add Subject', 
                desc: 'Manage subjects list',
                icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
                gradient: 'from-orange-500 to-orange-600'
              },
            ].map((a) => (
              <Link 
                key={a.title} 
                href={a.href} 
                className="group relative overflow-hidden rounded-xl bg-white p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${a.gradient} rounded-full -mr-12 -mt-12 opacity-10 group-hover:opacity-20 transition-opacity`}></div>
                <div className="relative">
                  <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${a.gradient} mb-4 group-hover:scale-110 transition-transform`}>
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={a.icon} />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">{a.title}</h3>
                  <p className="text-sm text-gray-600">{a.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
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
    </div>
  )
}


