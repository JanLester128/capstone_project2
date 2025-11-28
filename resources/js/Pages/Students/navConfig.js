export const getStudentNav = (enrollmentStatus) => {
  const stage = enrollmentStatus?.latestEnrollment?.status
  const isEnrolled = stage === 'enrolled'
  const canEnroll = Boolean(enrollmentStatus?.canEnroll)

  let enrollmentLabel = 'Enroll'
  let enrollmentStatusTag = enrollmentStatus?.isOpen ? 'open' : 'closed'
  let enrollmentDisabled = !canEnroll
  let enrollmentNote = ''

  if (stage === 'pre_enrolled') {
    enrollmentLabel = 'Enrollment (Pending Coordinator Review)'
    enrollmentStatusTag = 'pending'
    enrollmentDisabled = true
    enrollmentNote = 'Submitted. Waiting for coordinator review.'
  } else if (stage === 'recommended') {
    enrollmentLabel = 'Enrollment (Pending Registrar Approval)'
    enrollmentStatusTag = 'pending'
    enrollmentDisabled = true
    enrollmentNote = 'Coordinator recommended you. Registrar will finalize.'
  } else if (isEnrolled) {
    enrollmentLabel = 'Enrollment (Completed)'
    enrollmentStatusTag = 'completed'
    enrollmentDisabled = true
    enrollmentNote = 'You are officially enrolled.'
  } else if (!canEnroll) {
    enrollmentLabel = enrollmentStatus?.isOpen ? 'Enrollment (Locked)' : 'Enrollment Closed'
    enrollmentNote = enrollmentStatus?.message ?? ''
  }

  const items = [
    { href: '/student/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { href: '/student/classes', label: 'My Classes', icon: 'classes' },
    { href: '/student/schedule', label: 'Class', icon: 'schedule' },
    { href: '/student/grades', label: 'Grades', icon: 'grades' },
    { href: '/student/academic-record', label: 'Academic Record', icon: 'grades' },
    {
      href: '/student/enrollment',
      label: enrollmentLabel,
      disabled: enrollmentDisabled,
      status: enrollmentStatusTag,
      note: enrollmentNote,
      icon: 'enrollment',
    },
  ]

  return items
}

// Fallback for components that don't pass enrollment status
export const studentNav = [
  { href: '/student/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/student/classes', label: 'My Classes', icon: 'classes' },
  { href: '/student/schedule', label: 'Class', icon: 'schedule' },
  { href: '/student/grades', label: 'Grades', icon: 'grades' },
  { href: '/student/academic-record', label: 'Academic Record', icon: 'grades' },
  { href: '/student/enrollment', label: 'Enroll', icon: 'enrollment' },
]
