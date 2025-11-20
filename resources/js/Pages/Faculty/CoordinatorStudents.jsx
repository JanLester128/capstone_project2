import { Head, Link } from '@inertiajs/react'
import { useState, useMemo } from 'react'
import FacultySidebar from '../Auth/Faculty_sidebar'

export default function CoordinatorStudents({ students = [], user = {} }) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students
    const query = searchQuery.toLowerCase().trim()
    return students.filter((student) => {
      const name = (student.name || '').toLowerCase()
      const lrn = student.lrn ? String(student.lrn).toLowerCase() : ''
      const email = (student.email || '').toLowerCase()
      return name.includes(query) || lrn.includes(query) || email.includes(query)
    })
  }, [students, searchQuery])

  const getStatusBadge = (status) => {
    const statusStyles = {
      enrolled: 'bg-green-100 text-green-800',
      recommended: 'bg-blue-100 text-blue-800',
      pre_enrolled: 'bg-amber-100 text-amber-800',
      rejected: 'bg-red-100 text-red-800',
      pending: 'bg-gray-100 text-gray-800',
    }
    return statusStyles[status] || statusStyles.pending
  }

  const getInitials = (name = '') => {
    if (!name) return '??'
    const parts = name.trim().split(/\s+/)
    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Head title="Student Profile - Coordinator" />
      
      <FacultySidebar user={user} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Student Profile</h1>
              <p className="text-gray-600 mt-1">View student information, documents, credited subjects, and class records</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Search */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, LRN, or email..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[25%]">
                      Student
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[12%]">
                      LRN
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[20%]">
                      Email
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">
                      Grade Level
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[12%]">
                      Section
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[11%]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {searchQuery ? 'Try adjusting your search query.' : 'No students have submitted enrollments yet.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-indigo-600 font-medium text-sm">
                                {getInitials(student.name)}
                              </span>
                            </div>
                            <div className="ml-3 min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-900 truncate">{student.name || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-4">
                          <div className="text-sm text-gray-900 truncate">{student.lrn || '—'}</div>
                        </td>
                        <td className="px-3 py-4">
                          <div className="text-sm text-gray-500 truncate" title={student.email || '—'}>{student.email || '—'}</div>
                        </td>
                        <td className="px-3 py-4">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 whitespace-nowrap">
                            {student.grade_level ? `Grade ${student.grade_level}` : '—'}
                          </span>
                        </td>
                        <td className="px-3 py-4">
                          <div className="text-sm text-gray-900 truncate">{student.section || '—'}</div>
                        </td>
                        <td className="px-3 py-4">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full whitespace-nowrap ${getStatusBadge(student.enrollment_status)}`}>
                            {student.enrollment_status ? student.enrollment_status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Pending'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right text-sm font-medium">
                          <Link
                            href={`/faculty/coordinator-students/${student.id}`}
                            className="text-indigo-600 hover:text-indigo-900 whitespace-nowrap"
                          >
                            View Profile
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

