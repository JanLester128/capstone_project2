import { Head, router, Link } from '@inertiajs/react'
import { useState, useEffect, useMemo } from 'react'
import RegistrarSidebar from '../Auth/Registrar_sidebar'
import { formatDateTimeMedium } from '../../utils/dateFormatter'

export default function ApprovedGrades({ grades, filters = {}, schoolYears = [], subjects = [], strands = [] }) {
  const [searchQuery, setSearchQuery] = useState(filters.search || '')
  const [selectedSchoolYear, setSelectedSchoolYear] = useState(filters.school_year_id || '')
  const [selectedSemester, setSelectedSemester] = useState(filters.semester || '')
  const [selectedSubject, setSelectedSubject] = useState(filters.subject_id || '')
  const [selectedStrand, setSelectedStrand] = useState(filters.strand_id || '')

  // Remove duplicate subjects based on subject ID
  const uniqueSubjects = useMemo(() => {
    const seen = new Set()
    return subjects.filter(subject => {
      if (seen.has(subject.id)) {
        return false
      }
      seen.add(subject.id)
      return true
    })
  }, [subjects])

  // Auto-apply filters when they change (with debounce for search)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      router.get('/registrar/grades/approved', {
        search: searchQuery,
        school_year_id: selectedSchoolYear,
        semester: selectedSemester,
        subject_id: selectedSubject,
        strand_id: selectedStrand,
      }, {
        preserveState: true,
        preserveScroll: true,
      })
    }, searchQuery ? 500 : 0) // Debounce search by 500ms, apply other filters immediately

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedSchoolYear, selectedSemester, selectedSubject, selectedStrand])

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedSchoolYear('')
    setSelectedSemester('')
    setSelectedSubject('')
    setSelectedStrand('')
    router.get('/registrar/grades/approved')
  }

  // Determine which quarters to show based on semester
  const shouldShowQuarter = (quarter, semester) => {
    if (!semester) return true // Show all if no semester filter
    const sem = String(semester).toLowerCase()
    if (sem === '1st' || sem === '1') {
      return quarter === 'Q1' || quarter === 'Q2'
    } else if (sem === '2nd' || sem === '2') {
      return quarter === 'Q3' || quarter === 'Q4'
    }
    return true // Show all for Summer or other
  }

  const getStatusBadge = (remarks) => {
    if (remarks === 'Passed') {
      return 'bg-green-50 text-green-700 border border-green-200'
    } else if (remarks === 'Failed') {
      return 'bg-red-50 text-red-700 border border-red-200'
    } else if (remarks === 'Incomplete') {
      return 'bg-yellow-50 text-yellow-700 border border-yellow-200'
    }
    return 'bg-gray-50 text-gray-600 border border-gray-200'
  }

  const formatGrade = (grade) => {
    if (grade === null || grade === undefined) return '--'
    return Number(grade).toFixed(2)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Head title="Approved Grades - Registrar" />
      <RegistrarSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <a
                href="/registrar/grades/approvals"
                className="inline-flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                title="Back to Grade Approvals"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm font-medium">Back</span>
              </a>
              <div className="border-l border-gray-300 h-8"></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Student Grades</h1>
                <p className="text-sm text-gray-600 mt-1">
                  View all approved grades • {grades.total} total records
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Filters */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Search */}
            <input
              type="text"
              placeholder="Search by student name or LRN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />

            {/* School Year Filter */}
            <select
              value={selectedSchoolYear}
              onChange={(e) => setSelectedSchoolYear(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All School Years</option>
              {schoolYears.map((sy) => (
                <option key={sy.id} value={sy.id}>
                  {sy.School_year_start}-{sy.School_year_end}
                </option>
              ))}
            </select>

            {/* Semester Filter */}
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Semesters</option>
              <option value="1st">1st Semester</option>
              <option value="2nd">2nd Semester</option>
              <option value="Summer">Summer</option>
            </select>

            {/* Strand Filter */}
            <select
              value={selectedStrand}
              onChange={(e) => setSelectedStrand(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Strands</option>
              {strands.map((strand) => (
                <option key={strand.id} value={strand.id}>
                  {strand.Strand_name}
                </option>
              ))}
            </select>

            {/* Subject Filter */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Subjects</option>
              {uniqueSubjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.Subject_code} - {subject.Subject_name}
                </option>
              ))}
            </select>

            {/* Clear Button */}
            <button
              onClick={clearFilters}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Grades Table */}
        <main className="flex-1 overflow-y-auto p-6">
          {grades.data.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-10 text-center text-gray-500">
              No approved grades found.
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Student
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Subject
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Section
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Term
                      </th>
                      {shouldShowQuarter('Q1', selectedSemester) && (
                        <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Q1
                        </th>
                      )}
                      {shouldShowQuarter('Q2', selectedSemester) && (
                        <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Q2
                        </th>
                      )}
                      {shouldShowQuarter('Q3', selectedSemester) && (
                        <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Q3
                        </th>
                      )}
                      {shouldShowQuarter('Q4', selectedSemester) && (
                        <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Q4
                        </th>
                      )}
                      <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Final
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Remarks
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Approved By
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {grades.data.map((grade) => (
                      <tr key={grade.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{grade.student.name}</p>
                            <p className="text-xs text-gray-500">LRN: {grade.student.lrn}</p>
                            <p className="text-xs text-gray-500">Grade {grade.student.grade_level}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{grade.subject}</p>
                            <p className="text-xs text-gray-500">{grade.subject_code}</p>
                            <p className="text-xs text-gray-500">{grade.class.faculty}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm text-gray-900">{grade.class.section}</p>
                            {grade.class.strand && (
                              <p className="text-xs text-gray-500">{grade.class.strand}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm text-gray-900">{grade.school_year}</p>
                            <p className="text-xs text-gray-500">{grade.semester} Semester</p>
                          </div>
                        </td>
                        {shouldShowQuarter('Q1', selectedSemester) && (
                          <td className="px-4 py-3 text-center text-sm text-gray-900">
                            {formatGrade(grade.first_quarter)}
                          </td>
                        )}
                        {shouldShowQuarter('Q2', selectedSemester) && (
                          <td className="px-4 py-3 text-center text-sm text-gray-900">
                            {formatGrade(grade.second_quarter)}
                          </td>
                        )}
                        {shouldShowQuarter('Q3', selectedSemester) && (
                          <td className="px-4 py-3 text-center text-sm text-gray-900">
                            {formatGrade(grade.third_quarter)}
                          </td>
                        )}
                        {shouldShowQuarter('Q4', selectedSemester) && (
                          <td className="px-4 py-3 text-center text-sm text-gray-900">
                            {formatGrade(grade.fourth_quarter)}
                          </td>
                        )}
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-semibold text-gray-900">
                            {formatGrade(grade.semester_grade)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(grade.remarks)}`}>
                            {grade.remarks}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm text-gray-900">{grade.approved_by}</p>
                            <p className="text-xs text-gray-500">
                              {formatDateTimeMedium(grade.approved_at)}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/registrar/grades/${grade.id}/edit`}
                            className="inline-flex items-center px-3 py-1.5 border border-indigo-200 text-indigo-700 text-sm font-medium rounded-md hover:bg-indigo-50 transition-colors"
                          >
                            Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {grades.last_page > 1 && (
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                  <div className="flex-1 flex justify-between sm:hidden">
                    {grades.prev_page_url && (
                      <button
                        onClick={() => router.get(grades.prev_page_url)}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Previous
                      </button>
                    )}
                    {grades.next_page_url && (
                      <button
                        onClick={() => router.get(grades.next_page_url)}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Next
                      </button>
                    )}
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{grades.from}</span> to{' '}
                        <span className="font-medium">{grades.to}</span> of{' '}
                        <span className="font-medium">{grades.total}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        {grades.links.map((link, index) => (
                          <button
                            key={index}
                            onClick={() => link.url && router.get(link.url)}
                            disabled={!link.url}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              link.active
                                ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                : link.url
                                ? 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                            }`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                          />
                        ))}
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

