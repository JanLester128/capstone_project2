import React, { useMemo, useState } from 'react'
import { Head, router, usePage, Link } from '@inertiajs/react'
import FacultySidebar from '../Auth/Faculty_sidebar'
import { formatDateMedium } from '../../utils/dateFormatter'

export default function ReEnrollStudents({
  enrolledStudents = [],
  activeSchoolYear = null,
  activeSemester = null,
  strands = [],
  sections = [],
  user = {},
  flash = {},
}) {
  const pageProps = usePage()?.props || {}
  const flashMessages = flash || pageProps.flash || {}

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStudents, setSelectedStudents] = useState([])
  const [expandedStudent, setExpandedStudent] = useState(null)
  const [bulkProcessing, setBulkProcessing] = useState(false)
  const safeEnrolledStudents = Array.isArray(enrolledStudents) ? enrolledStudents : []

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return safeEnrolledStudents
    const query = searchQuery.toLowerCase().trim()
    return safeEnrolledStudents.filter((student) => {
      const name = (student.user?.name || '').toLowerCase()
      const lrn = student.lrn ? String(student.lrn).toLowerCase() : ''
      const email = (student.user?.email || '').toLowerCase()
      return name.includes(query) || lrn.includes(query) || email.includes(query)
    })
  }, [safeEnrolledStudents, searchQuery])

  const handleExpandStudent = (student) => {
    if (expandedStudent?.id === student.id) {
      setExpandedStudent(null)
    } else {
      setExpandedStudent(student)
    }
  }

  const handleBulkReEnroll = () => {
    if (selectedStudents.length === 0) {
      alert('Please select at least one student to re-enroll.')
      return
    }
    if (!activeSchoolYear || !activeSemester) {
      alert('No active school year or semester found. Please activate one first.')
      return
    }

    // Check if any selected students have issues
    const studentsWithIssues = selectedStudents.filter(id => {
      const student = filteredStudents.find(s => s.id === id)
      return student && (student.has_failed_prerequisites || student.needs_summer_classes)
    })

    if (studentsWithIssues.length > 0) {
      if (!confirm(`${studentsWithIssues.length} student(s) have academic issues (failed grades/prerequisites). Bulk re-enrollment will use their previous strand/section. Continue?`)) {
        return
      }
    }

    if (confirm(`Are you sure you want to re-enroll ${selectedStudents.length} student(s) for the current term?`)) {
      setBulkProcessing(true)
      router.post(
        '/faculty/enrollments/re-enroll-bulk',
        {
          student_info_ids: selectedStudents,
          school_year_id: activeSchoolYear.id,
          semester_id: activeSemester.id,
        },
        {
          onSuccess: () => setSelectedStudents([]),
          onError: (errors) => {
            console.error('Bulk re-enrollment error:', errors)
            alert(errors?.message || 'Failed to re-enroll students. Please try again.')
          },
          onFinish: () => setBulkProcessing(false),
        }
      )
    }
  }

  const toggleSelect = (studentId) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(filteredStudents.map((student) => student.id))
    }
  }

  const checkIfEnrolledInCurrentTerm = (student) => {
    if (!student.latest_enrollment || !activeSchoolYear || !activeSemester) return false
    return (
      student.latest_enrollment.school_year?.id === activeSchoolYear.id &&
      student.latest_enrollment.semester?.id === activeSemester.id
    )
  }

  const getStatusBadge = (student) => {
    if (student.is_enrolled_in_summer || student.academic_status === 'enrolled') {
      return 'bg-blue-100 text-blue-800 border-blue-300'
    }
    if (student.academic_status === 'critical') {
      return 'bg-red-100 text-red-800 border-red-300'
    }
    if (student.academic_status === 'warning') {
      return 'bg-amber-100 text-amber-800 border-amber-300'
    }
    return 'bg-green-100 text-green-800 border-green-300'
  }

  const getStatusLabel = (student) => {
    if (student.is_enrolled_in_summer || student.academic_status === 'enrolled') {
      return 'Enrolled in Summer'
    }
    if (student.academic_status === 'critical') {
      const isSTEM = student.latest_enrollment?.assigned_strand?.Strand_code?.toUpperCase().includes('STEM')
      if (isSTEM) return 'STEM - Must Change Strand'
      return 'Failed Prerequisites'
    }
    if (student.academic_status === 'warning') {
      const isSTEM = student.latest_enrollment?.assigned_strand?.Strand_code?.toUpperCase().includes('STEM')
      if (isSTEM) return 'STEM - Must Change Strand'
      return 'Needs Summer Classes'
    }
    return 'Good Standing'
  }

  const handleReEnrollStudent = (student) => {
    window.open(`/faculty/students/${student.id}/enroll?from=re-enroll`, '_blank')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Head title="Re-Enroll Students - Coordinator" />
      <FacultySidebar user={user} />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Flash Messages */}
        {(flashMessages?.success || flashMessages?.error) && (
          <div className="px-6 pt-4">
            {flashMessages?.success && (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {flashMessages.success}
              </div>
            )}
            {flashMessages?.error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {flashMessages.error}
              </div>
            )}
          </div>
        )}

        {/* Header */}
        <header className="border-b border-gray-200 bg-white px-6 py-5 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <Link
                href="/faculty/enrollments"
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors mb-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Re-Enroll Students</h1>
              <p className="text-sm text-gray-600 mt-1">
                Move returning students to the next term • Automatic prerequisite checking
              </p>
            </div>
            <div className="flex items-center gap-3">
              {activeSchoolYear && activeSemester && (
                <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2">
                  <p className="text-xs font-semibold text-indigo-600 uppercase">Target Term</p>
                  <p className="text-sm font-bold text-indigo-900">
                    {activeSchoolYear.label} • {activeSemester.label}
                  </p>
                </div>
              )}
              <div className="rounded-lg bg-gray-100 px-4 py-2">
                <p className="text-xs font-semibold text-gray-500 uppercase">Total</p>
                <p className="text-xl font-bold text-gray-900">{safeEnrolledStudents.length}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Search and Bulk Actions */}
        <div className="border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <svg
                  className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
                  />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, LRN, or email..."
                  className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {selectedStudents.length > 0 && (
              <button
                onClick={handleBulkReEnroll}
                disabled={bulkProcessing}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              >
                {bulkProcessing ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5z" />
                    </svg>
                    Bulk Re-enroll ({selectedStudents.length})
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {!activeSchoolYear || !activeSemester ? (
            <div className="flex h-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 p-12 text-center">
              <svg className="h-16 w-16 text-amber-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              <h3 className="text-xl font-bold text-amber-900 mb-2">No Active Term</h3>
              <p className="text-amber-700 max-w-md">
                Please activate a school year and semester before re-enrolling students.
              </p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
              <svg className="h-16 w-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {searchQuery ? 'No students found' : 'No enrolled students'}
              </h3>
              <p className="text-gray-600 max-w-md">
                {searchQuery
                  ? 'Try adjusting your search query.'
                  : 'There are no students ready for re-enrollment right now.'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                          onChange={toggleSelectAll}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Latest Term
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Strand / Section
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Terms
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredStudents.map((student) => {
                      const isExpanded = expandedStudent?.id === student.id
                      const isEnrolledInCurrentTerm = checkIfEnrolledInCurrentTerm(student)

                      return (
                        <React.Fragment key={student.id}>
                          <tr className={`hover:bg-gray-50 ${selectedStudents.includes(student.id) ? 'bg-indigo-50' : ''} ${isExpanded ? 'bg-blue-50' : ''}`}>
                            <td className="px-4 py-4">
                              <input
                                type="checkbox"
                                checked={selectedStudents.includes(student.id)}
                                onChange={() => toggleSelect(student.id)}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                            </td>
                            <td className="px-4 py-4">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{student.user?.name}</p>
                                <p className="text-xs text-gray-500">{student.user?.email}</p>
                                <p className="text-xs text-gray-400">LRN: {student.lrn || 'N/A'}</p>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              {student.latest_enrollment ? (
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {student.latest_enrollment.school_year?.label}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {student.latest_enrollment.semester?.label}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {formatDateMedium(student.latest_enrollment.processed_at)}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">No record</span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              {student.latest_enrollment ? (
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {student.latest_enrollment.assigned_strand?.Strand_code || 'N/A'}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {student.latest_enrollment.assigned_section?.section_name || 'N/A'}
                                  </p>
                                  {student.latest_enrollment.assigned_section?.year_level && (
                                    <p className="text-xs text-gray-400">
                                      Grade {student.latest_enrollment.assigned_section.year_level}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(student)}`}>
                                {student.academic_status === 'critical' && (
                                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                  </svg>
                                )}
                                {student.academic_status === 'warning' && (
                                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                )}
                                {student.academic_status === 'good' && (
                                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                )}
                                {getStatusLabel(student)}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                {student.enrollment_count || 0}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-right">
                              {isEnrolledInCurrentTerm ? (
                                <a
                                  href={`/enrollments/${student.latest_enrollment.id}/cor`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-green-700"
                                >
                                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M4 4a2 2 0 0 1 2-2h6l4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4Z" />
                                  </svg>
                                  Print COR
                                </a>
                              ) : (
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleExpandStudent(student)}
                                    disabled={bulkProcessing}
                                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                                      isExpanded 
                                        ? 'bg-gray-600 text-white hover:bg-gray-700' 
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                    }`}
                                  >
                                    {isExpanded ? (
                                      <>
                                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Cancel
                                      </>
                                    ) : (
                                      <>
                                        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5z" />
                                        </svg>
                                        View Details
                                      </>
                                    )}
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>

                          {/* Expanded Row - Warnings and Action */}
                          {isExpanded && !isEnrolledInCurrentTerm && (
                            <tr>
                              <td colSpan="7" className="px-4 py-4 bg-blue-50 border-t-2 border-blue-200">
                                <div className="max-w-4xl mx-auto">
                                  {/* Warnings */}
                                  {student.warnings && student.warnings.length > 0 && (
                                    <div className="mb-4 space-y-2">
                                      {student.warnings.map((warning, idx) => (
                                        <div key={idx} className={`rounded-lg border p-3 text-sm flex items-start gap-2 ${
                                          student.academic_status === 'critical' 
                                            ? 'border-red-300 bg-red-50 text-red-800' 
                                            : 'border-amber-300 bg-amber-50 text-amber-800'
                                        }`}>
                                          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                          </svg>
                                          <div className="flex-1">
                                            <p className="font-semibold">{warning}</p>
                                            {student.failed_grades && student.failed_grades.length > 0 && idx === 0 && (
                                              <div className="mt-2 text-xs">
                                                <p className="font-semibold mb-1">Failed Subjects:</p>
                                                <ul className="list-disc list-inside space-y-0.5">
                                                  {student.failed_grades.map((grade, gIdx) => (
                                                    <li key={gIdx}>
                                                      {grade.subject_code} - {grade.subject_name} ({grade.grade})
                                                      {grade.is_prerequisite && <span className="ml-1 text-red-900 font-bold">[Prerequisite]</span>}
                                                    </li>
                                                  ))}
                                                </ul>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  <div className="mt-6 rounded-lg border border-white/70 bg-white p-4 shadow-sm">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                                      Complete Enrollment in Registrar View
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                      Use the registrar enrollment workspace to assign a strand/section, review the student's
                                      COR, and finalize re-enrollment. This opens the same screen used by the registrar team so
                                      you can follow the full workflow.
                                    </p>
                                    <div className="mt-4 flex flex-wrap items-center gap-3 justify-end">
                                      <button
                                        onClick={() => handleReEnrollStudent(student)}
                                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
                                      >
                                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M4 4a2 2 0 0 1 2-2h6l4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4Z" />
                                        </svg>
                                        Open Enrollment Page
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

