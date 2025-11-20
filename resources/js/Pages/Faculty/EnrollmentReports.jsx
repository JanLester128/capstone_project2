import { Head, router, Link } from '@inertiajs/react'
import FacultySidebar from '../Auth/Faculty_sidebar'
import { formatDateMedium } from '../../utils/dateFormatter'
import { useState, useMemo, useEffect, useRef } from 'react'

export default function EnrollmentReports({ 
  stats = {}, 
  recentEnrollments = [], 
  user,
  strands = [],
  schoolYears = [],
  semesters = [],
  activeSchoolYear = null,
  activeSemester = null,
  filters = {}
}) {
  const [selectedStrand, setSelectedStrand] = useState(filters.strand_id || '')
  const [selectedSchoolYear, setSelectedSchoolYear] = useState(filters.school_year_id || activeSchoolYear?.id || '')
  const [selectedSemester, setSelectedSemester] = useState(filters.semester_id || activeSemester?.id || '')
  const [selectedStatus, setSelectedStatus] = useState(filters.status || '')
  const isInitialMount = useRef(true)

  // Filter semesters based on selected school year
  const filteredSemesters = useMemo(() => {
    if (!selectedSchoolYear) return semesters
    return semesters.filter(s => s.school_year_id == selectedSchoolYear)
  }, [selectedSchoolYear, semesters])

  // Auto-apply filters when dropdowns change (with debounce to prevent too many requests)
  useEffect(() => {
    // Skip initial render to avoid unnecessary request
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams()
      if (selectedStrand) params.append('strand_id', selectedStrand)
      if (selectedSchoolYear) params.append('school_year_id', selectedSchoolYear)
      if (selectedSemester) params.append('semester_id', selectedSemester)
      if (selectedStatus) params.append('status', selectedStatus)
      
      // Use replace to avoid adding to history on every filter change
      router.get(`/faculty/enrollment-reports?${params.toString()}`, {}, {
        preserveState: true,
        preserveScroll: true,
        replace: true,
      })
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [selectedStrand, selectedSchoolYear, selectedSemester, selectedStatus])

  const getStatusColor = (status) => {
    switch (status) {
      case 'pre_enrolled': return 'bg-amber-100 text-amber-800'
      case 'recommended': return 'bg-blue-100 text-blue-800'
      case 'enrolled': return 'bg-blue-100 text-blue-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleReset = () => {
    setSelectedStrand('')
    setSelectedSchoolYear(activeSchoolYear?.id || '')
    setSelectedSemester(activeSemester?.id || '')
    setSelectedStatus('')
  }

  const handleGenerateReport = () => {
    // Generate report URL with current filters
    const params = new URLSearchParams()
    if (selectedStrand) params.append('strand_id', selectedStrand)
    if (selectedSchoolYear) params.append('school_year_id', selectedSchoolYear)
    if (selectedSemester) params.append('semester_id', selectedSemester)
    if (selectedStatus) params.append('status', selectedStatus)
    
    // Open export route in new window
    window.open(`/faculty/enrollment-reports/export?${params.toString()}`, '_blank')
  }

  const getSelectedStrandName = () => {
    if (!selectedStrand) return 'All Strands'
    const strand = strands.find(s => s.id == selectedStrand)
    return strand ? strand.name : 'All Strands'
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <FacultySidebar user={user} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Head title="Enrollment Reports - Faculty" />
        
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Enrollment Reports</h1>
              <p className="text-sm text-gray-600 mt-1">
                View and generate enrollment statistics and reports
              </p>
            </div>
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
              <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-blue-700">Coordinator Mode</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Filter Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Filter Reports</h2>
              <p className="text-sm text-gray-500 mt-1">Filters are applied automatically when you change the dropdowns</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Strand Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Strand
                </label>
                <select
                  value={selectedStrand}
                  onChange={(e) => setSelectedStrand(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                >
                  <option value="">All Strands</option>
                  {strands.map((strand) => (
                    <option key={strand.id} value={strand.id}>
                      {strand.name} ({strand.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* School Year Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  School Year
                </label>
                <select
                  value={selectedSchoolYear}
                  onChange={(e) => {
                    setSelectedSchoolYear(e.target.value)
                    setSelectedSemester('') // Reset semester when school year changes
                  }}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                >
                  <option value="">All School Years</option>
                  {schoolYears.map((sy) => (
                    <option key={sy.id} value={sy.id}>
                      {sy.formatted}
                    </option>
                  ))}
                </select>
              </div>

              {/* Semester Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Semester
                </label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                  disabled={!selectedSchoolYear}
                >
                  <option value="">All Semesters</option>
                  {filteredSemesters.map((semester) => (
                    <option key={semester.id} value={semester.id}>
                      {semester.semester_type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="pre_enrolled">Pre-Enrolled</option>
                  <option value="recommended">Recommended</option>
                  <option value="enrolled">Enrolled</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={handleReset}
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset Filters
              </button>
              <button
                onClick={handleGenerateReport}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Generate Report
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.total || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Awaiting Coordinator</p>
                  <p className="text-2xl font-semibold text-amber-600">{stats.pre_enrolled || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Awaiting Registrar</p>
                  <p className="text-2xl font-semibold text-blue-600">{stats.recommended || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Enrolled</p>
                  <p className="text-2xl font-semibold text-blue-600">{stats.enrolled || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Returned</p>
                  <p className="text-2xl font-semibold text-red-600">{stats.rejected || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Enrollments Table */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">
                Enrollment Records ({recentEnrollments.length})
                {selectedStrand && (
                  <span className="ml-2 text-sm font-normal text-gray-600">
                    - {getSelectedStrandName()}
                  </span>
                )}
              </h2>
            </div>
            
            {recentEnrollments.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 text-gray-400">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No enrollments found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {selectedStrand || selectedSchoolYear || selectedSemester || selectedStatus
                    ? 'Try adjusting your filters to see more results.'
                    : 'There are currently no enrollment records to display.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Strand
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        School Year
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Processed By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentEnrollments.map((enrollment) => (
                      <tr key={enrollment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-700">
                                  {enrollment.student_personal_info?.user?.FirstName?.[0]}
                                  {enrollment.student_personal_info?.user?.LastName?.[0]}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {enrollment.student_personal_info?.user?.FirstName} {enrollment.student_personal_info?.user?.LastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {enrollment.student_personal_info?.user?.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {enrollment.assigned_strand?.name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {enrollment.assigned_strand?.code || ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {enrollment.school_year?.School_year_start}-{enrollment.school_year?.School_year_end}
                          </div>
                          <div className="text-sm text-gray-500">
                            {enrollment.semester?.semester_type}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(enrollment.status)}`}>
                            {enrollment.status_text ?? enrollment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {enrollment.enrolled_by ? 
                            `${enrollment.enrolled_by.FirstName} ${enrollment.enrolled_by.LastName}` : 
                            'Not processed'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDateMedium(enrollment.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {enrollment.status === 'enrolled' ? (
                            <a
                              href={`/enrollments/${enrollment.id}/cor`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                              View / Print COR
                            </a>
                          ) : (
                            <span className="text-xs text-gray-300"></span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
