import { Head, router, Link } from '@inertiajs/react'
import { useState, useEffect, useMemo } from 'react'
import RegistrarLayout from './Layout'
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
    <RegistrarLayout>
      <Head title="Approved Grades - Registrar" />

      <div className="py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                href="/registrar/grades/approvals"
                className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Approvals
              </Link>
              <div className="border-l border-gray-300 h-8" />
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Registrar • Grades</p>
                <h1 className="text-2xl font-bold text-gray-900">Approved Grades</h1>
                <p className="text-sm text-gray-600">{grades.total} total records</p>
              </div>
            </div>
          </header>

          <div className="rounded-lg border border-gray-200 bg-white p-4">
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

          {grades.data.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
              No approved grades found.
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
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
                      <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Q1
                      </th>
                      <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Q2
                      </th>
                      <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Q3
                      </th>
                      <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Q4
                      </th>
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
                        <td className="px-4 py-3 text-center text-sm text-gray-900">
                          {formatGrade(grade.first_quarter)}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-900">
                          {formatGrade(grade.second_quarter)}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-900">
                          {formatGrade(grade.third_quarter)}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-900">
                          {formatGrade(grade.fourth_quarter)}
                        </td>
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
        </div>
      </div>
    </RegistrarLayout>
  )
}

