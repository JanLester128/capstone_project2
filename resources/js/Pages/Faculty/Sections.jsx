import { Head, Link } from '@inertiajs/react'
import FacultySidebar from '../Auth/Faculty_sidebar'

export default function FacultySections({ sections = [], activeSchoolYear, activeSemester, user = {}, flash = {} }) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Head title="My Sections - Faculty" />
      
      <FacultySidebar user={user} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Advisory Sections</h1>
              <p className="text-gray-600 mt-1">
                Manage sections where you serve as adviser
                {activeSchoolYear && activeSemester && (
                  <span className="ml-2 text-sm">
                    • {activeSchoolYear.School_year_start}-{activeSchoolYear.School_year_end} • {activeSemester.semester_type}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-700">
                {sections.length} Section{sections.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {sections.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No advisory sections</h3>
              <p className="mt-1 text-sm text-gray-500">
                You are not currently assigned as an adviser to any sections for this semester.
              </p>
              {(!activeSchoolYear || !activeSemester) && (
                <p className="text-sm text-amber-600 mt-2">
                  Note: No active school year or semester is currently set. Please contact the registrar to set up an active school year and semester.
                </p>
              )}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sections.map((section) => (
                <div key={section.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Section Header */}
                  <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {section.section_name}
                      </h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Advisory
                      </span>
                    </div>
                    {section.strand && (
                      <p className="text-sm text-gray-600 mt-1">
                        {section.strand.Strand_name} ({section.strand.Strand_code})
                      </p>
                    )}
                  </div>

                  {/* Section Details */}
                  <div className="px-6 py-4">
                    <div className="space-y-3">
                      {/* School Year & Semester */}
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>
                          {section.school_year?.School_year_start}-{section.school_year?.School_year_end}
                          {section.semester && ` • ${section.semester.semester_type}`}
                        </span>
                      </div>

                      {/* Number of Classes */}
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span>
                          {section.classes?.length || 0} Subject{(section.classes?.length || 0) !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Number of Students */}
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                        <span>
                          {section.students?.length || 0} Student{(section.students?.length || 0) !== 1 ? 's' : ''} Enrolled
                        </span>
                      </div>

                      {/* Subjects List */}
                      {section.classes && section.classes.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Subjects:</p>
                          <div className="flex flex-wrap gap-1">
                            {section.classes.slice(0, 3).map((classItem, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700"
                              >
                                {classItem.subject?.Subject_name || 'Unknown Subject'}
                              </span>
                            ))}
                            {section.classes.length > 3 && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-200 text-gray-600">
                                +{section.classes.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Students List (if any) */}
                  {section.students && section.students.length > 0 && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                      <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                        Enrolled Students ({section.students.length})
                      </h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {section.students.slice(0, 5).map((student) => (
                          <div key={student.id || student.enrollment_id} className="flex items-center justify-between text-sm bg-white rounded-md px-3 py-2 border border-gray-200">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{student.name}</p>
                              <p className="text-xs text-gray-500">LRN: {student.lrn || ''}</p>
                            </div>
                            {student.strand && (
                              <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                {student.strand.code}
                              </span>
                            )}
                          </div>
                        ))}
                        {section.students.length > 5 && (
                          <p className="text-xs text-gray-500 text-center pt-2">
                            +{section.students.length - 5} more student{section.students.length - 5 !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Section Actions */}
                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-xs text-gray-500">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        Advisory Role
                      </div>
                      <Link
                        href={`/faculty/students/${section.id}`}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
