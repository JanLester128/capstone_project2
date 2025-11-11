export const getStudentNav = (enrollmentStatus) => [
  { href: '/student/dashboard', label: 'Dashboard' },
  { href: '/student/classes', label: 'My Classes' },
  { href: '/student/schedule', label: 'Schedule' },
  { href: '/student/grades', label: 'Grades' },
  { 
    href: '/student/enrollment', 
    label: enrollmentStatus?.canEnroll ? 'Enroll' : 'Enroll (Closed)',
    disabled: !enrollmentStatus?.canEnroll,
    status: enrollmentStatus?.isOpen ? 'open' : 'closed'
  },
  { href: '/student/profile', label: 'Profile' },
]

// Fallback for components that don't pass enrollment status
export const studentNav = [
  { href: '/student/dashboard', label: 'Dashboard' },
  { href: '/student/classes', label: 'My Classes' },
  { href: '/student/schedule', label: 'Schedule' },
  { href: '/student/grades', label: 'Grades' },
  { href: '/student/enrollment', label: 'Enroll' },
  { href: '/student/profile', label: 'Profile' },
]
