import { Head, Link } from '@inertiajs/react'
import FacultySidebar from '../Auth/Faculty_sidebar'

const getInitials = (name = '') => {
  if (!name) return '??'
  const parts = name.trim().split(/\s+/)
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')
}

export default function CoordinatorStudentEnrollments({ student, enrollments = [], user = {} }) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <FacultySidebar user={user} />
      <div className="flex-1 lg:ml-0">
        <Head title={`${student.name} - Enrollments`} />

        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="mx-auto max-w-4xl px-6 py-8">
            {/* Header */}
            <div className="mb-6">
              <Link
                href="/faculty/enrollments"
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Enrollments
              </Link>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xl font-semibold">
                  {getInitials(student.name)}
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">{student.name}</h1>
                  <p className="text-sm text-gray-500">{student.email}</p>
                  {student.lrn && (
                    <p className="text-xs text-gray-400 mt-1">LRN: {student.lrn}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Enrollments List */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">Select Semester to View COR</h2>
                <p className="text-sm text-gray-500 mt-1">Choose which semester's Certificate of Registration you want to view</p>
              </div>

              {enrollments.length === 0 ? (
                <div className="p-12 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-300" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z" />
                  </svg>
                  <h3 className="mt-4 text-base font-semibold text-gray-900">No Enrollments Found</h3>
                  <p className="mt-2 text-sm text-gray-500">This student has no enrollment records.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {enrollments.map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className="px-6 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-900">
                                  {enrollment.school_year?.label || 'N/A'}
                                </span>
                                {enrollment.semester && (
                                  <>
                                    <span className="text-gray-400">•</span>
                                    <span className="text-sm text-gray-600">
                                      {enrollment.semester.label}
                                    </span>
                                  </>
                                )}
                              </div>
                              <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
                                {enrollment.strand && (
                                  <span>
                                    {enrollment.strand.code} - {enrollment.strand.name}
                                  </span>
                                )}
                                {enrollment.section && (
                                  <span>Section: {enrollment.section.name}</span>
                                )}
                              </div>
                              {enrollment.submitted_at && (
                                <p className="text-xs text-gray-400 mt-1">
                                  Enrolled: {new Date(enrollment.submitted_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                            enrollment.status === 'enrolled'
                              ? 'bg-blue-100 text-blue-800'
                              : enrollment.status === 'pre_enrolled'
                              ? 'bg-amber-100 text-amber-800'
                              : enrollment.status === 'recommended'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {enrollment.status === 'enrolled' ? 'Enrolled' :
                             enrollment.status === 'pre_enrolled' ? 'Pre-Enrolled' :
                             enrollment.status === 'recommended' ? 'Recommended' :
                             enrollment.status}
                          </span>
                          <a
                            href={`/enrollments/${enrollment.id}/cor`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500 transition-colors"
                          >
                            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M4 4a2 2 0 0 1 2-2h6l4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4Z" />
                            </svg>
                            View COR
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

