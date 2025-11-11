import { Head, Link } from '@inertiajs/react'
import StudentSidebar from '../Auth/Student_sidebar'

export default function EnrollmentClosed({ enrollmentStatus, student }) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <StudentSidebar enrollmentStatus={enrollmentStatus} />
      <div className="flex-1">
        <Head title="Enrollment Closed" />
        
        <div className="py-6">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Enrollment</h1>
              <p className="mt-1 text-sm text-gray-600">
                Student enrollment for the current academic year
              </p>
            </div>

            {/* Enrollment Closed Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-8 text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                  <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Enrollment is Currently Closed
                </h2>
                
                {enrollmentStatus?.schoolYear && (
                  <div className="mb-6">
                    <p className="text-lg text-gray-700 mb-2">
                      School Year: {enrollmentStatus.schoolYear.School_year_start}-{enrollmentStatus.schoolYear.School_year_end}
                    </p>
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Closed
                    </div>
                  </div>
                )}
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-800 text-sm">
                    {enrollmentStatus?.message || 'Enrollment is not currently available.'}
                  </p>
                </div>

                {enrollmentStatus?.isEnrolled && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-center mb-2">
                      <svg className="h-5 w-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-blue-800 font-medium">Already Enrolled</span>
                    </div>
                    <p className="text-blue-700 text-sm">
                      You have already submitted your enrollment for this school year.
                    </p>
                  </div>
                )}

                <div className="text-sm text-gray-600 mb-6">
                  <p className="mb-2">
                    <strong>What to do next:</strong>
                  </p>
                  <ul className="text-left max-w-md mx-auto space-y-1">
                    <li>• Contact the registrar's office for enrollment information</li>
                    <li>• Check back later when enrollment opens</li>
                    <li>• Monitor announcements for enrollment updates</li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href="/student/dashboard"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Back to Dashboard
                  </Link>
                  
                  <Link
                    href="/student/profile"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    View Profile
                  </Link>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="mt-6 bg-gray-50 rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Need Help?</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>
                  <strong>Registrar's Office:</strong> Visit the registrar's office during business hours for enrollment assistance.
                </p>
                <p>
                  <strong>Contact Information:</strong> Check the school's official website or bulletin board for contact details.
                </p>
                <p>
                  <strong>Enrollment Updates:</strong> Important enrollment announcements will be posted on your dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
