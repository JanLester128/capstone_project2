import { Head, Link } from '@inertiajs/react'
import StudentSidebar from '../Auth/Student_sidebar'

const STATUS_CONFIG = {
  pre_enrolled: {
    tone: 'pending',
    title: 'Enrollment Submitted',
    subtitle: 'Your enrollment form was sent to the coordinator for review.',
    badge: 'Pending Coordinator Review',
    badgeColor: 'bg-amber-100 text-amber-800',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    iconPath: 'M12 6v6l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    nextSteps: [
      'Wait for the coordinator to review and recommend your enrollment.',
      'Keep an eye on your dashboard for updates or requested corrections.',
      'Prepare any supporting documents in case the coordinator reaches out.',
    ],
  },
  recommended: {
    tone: 'pending',
    title: 'Coordinator Recommendation Sent',
    subtitle: 'Your coordinator endorsed your enrollment to the registrar.',
    badge: 'Awaiting Registrar Approval',
    badgeColor: 'bg-blue-100 text-blue-800',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    nextSteps: [
      'The registrar is finalizing your enrollment details.',
      'You will be notified once the registrar approves or requests changes.',
      'Monitor the dashboard for approval and COR availability.',
    ],
  },
  enrolled: {
    tone: 'completed',
    title: 'You Are Already Enrolled',
    subtitle: 'Your enrollment for the current school year is complete.',
    badge: 'Enrolled',
    badgeColor: 'bg-green-100 text-green-800',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    iconPath: 'M5 13l4 4L19 7',
    nextSteps: [
      'Download your Certificate of Registration when available.',
      'Review your class schedule in the My Classes page.',
      'Contact the registrar only if you need changes.',
    ],
  },
  default: {
    tone: 'closed',
    title: 'Enrollment is Currently Closed',
    subtitle: 'Student enrollment for the current academic year.',
    badge: 'Closed',
    badgeColor: 'bg-red-100 text-red-800',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z',
    nextSteps: [
      'Contact the registrar\'s office for enrollment information.',
      'Check back later when enrollment opens.',
      'Monitor announcements for enrollment updates.',
    ],
  },
}

export default function EnrollmentClosed({ enrollmentStatus }) {
  const latestStatus = enrollmentStatus?.latestEnrollment?.status
  const statusConfig = STATUS_CONFIG[latestStatus] ?? STATUS_CONFIG.default

  const toneClass = (() => {
    switch (statusConfig.tone) {
      case 'pending':
        return { panel: 'bg-amber-50 border border-amber-200', text: 'text-amber-800' }
      case 'approved':
        return { panel: 'bg-green-50 border border-green-200', text: 'text-green-800' }
      case 'completed':
        return { panel: 'bg-blue-50 border border-blue-200', text: 'text-blue-800' }
      default:
        return { panel: 'bg-red-50 border border-red-200', text: 'text-red-800' }
    }
  })()

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <StudentSidebar enrollmentStatus={enrollmentStatus} />
      <div className="flex-1">
        <Head title="Enrollment Status" />

        <div className="py-6">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Enrollment</h1>
              <p className="mt-1 text-sm text-gray-600">
                Track your enrollment progress for the active school year.
              </p>
            </div>

            {/* Enrollment Status Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-8 text-center">
                <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full ${statusConfig.iconBg} mb-6`}>
                  <svg className={`h-8 w-8 ${statusConfig.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={statusConfig.iconPath} />
                  </svg>
                </div>

                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {statusConfig.title}
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  {statusConfig.subtitle}
                </p>

                {enrollmentStatus?.schoolYear && (
                  <div className="mb-6">
                    <p className="text-lg text-gray-700 mb-2">
                      School Year: {enrollmentStatus.schoolYear.School_year_start}-{enrollmentStatus.schoolYear.School_year_end}
                    </p>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig.badgeColor}`}>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {statusConfig.badge}
                    </div>
                  </div>
                )}

                {enrollmentStatus?.message && (
                  <div className={`${toneClass.panel} rounded-lg p-4 mb-6`}>
                    <p className={`${toneClass.text} text-sm`}>{enrollmentStatus.message}</p>
                  </div>
                )}

                {latestStatus === 'enrolled' && enrollmentStatus?.latestEnrollment?.schedule?.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                    <h4 className="text-sm font-semibold text-blue-800 mb-2">
                      Assigned Class Schedule
                    </h4>
                    <ul className="space-y-2 text-sm text-blue-700">
                      {enrollmentStatus.latestEnrollment.schedule.map((item, index) => (
                        <li key={`${item.time}-${item.subject}-${index}`} className="border border-blue-100 rounded-md px-3 py-2 bg-white">
                          <div className="font-medium text-blue-900">{item.subject}</div>
                          <div>{item.day ? `${item.day} • ${item.time}` : item.time}</div>
                          {item.section && <div>Section: {item.section}</div>}
                          {item.faculty && <div>Faculty: {item.faculty}</div>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="text-sm text-gray-600 mb-6">
                  <p className="mb-2">
                    <strong>What to do next:</strong>
                  </p>
                  <ul className="text-left max-w-md mx-auto space-y-1">
                    {statusConfig.nextSteps.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
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
                  <strong>Registrar&apos;s Office:</strong> Visit the registrar during business hours for assistance.
                </p>
                <p>
                  <strong>Contact Information:</strong> Check the school&apos;s official channels for contact details.
                </p>
                <p>
                  <strong>Enrollment Updates:</strong> Announcements will appear on your dashboard and email.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
