// Organized navigation with icons
export const registrarNav = [
  { 
    href: '/registrar', 
    label: 'Dashboard',
    category: 'main',
    icon: 'dashboard'
  },
  
  // Student Management Section
  {
    category: 'student_management',
    categoryLabel: 'Student Management',
    items: [
      { 
        href: '/registrar/student-verification', 
        label: 'Verify Students',
        badge: 'pending',
        icon: 'verify'
      },
      { 
        href: '/registrar/enrollment', 
        label: 'Enrollment',
        icon: 'enrollment'
      },
      { 
        href: '/registrar/grades/approvals',
        label: 'Grade Approvals',
        icon: 'grades'
      },
    ]
  },
  
  // Academic Setup Section
  {
    category: 'academic_setup',
    categoryLabel: 'Academic Setup',
    items: [
      { 
        href: '/registrar/school-years', 
        label: 'School Years',
        icon: 'calendar'
      },
      { 
        href: '/registrar/strands', 
        label: 'Strands & Sections',
        icon: 'strands'
      },
      { 
        href: '/registrar/subjects', 
        label: 'Subjects',
        icon: 'subjects'
      },
      { 
        href: '/registrar/classes', 
        label: 'Class Schedules',
        icon: 'schedule'
      },
    ]
  },
  
  // Faculty & Profile Section
  {
    category: 'people',
    categoryLabel: 'People & Profile',
    items: [
      { 
        href: '/registrar/students', 
        label: 'Students',
        icon: 'students'
      },
      { 
        href: '/registrar/faculty', 
        label: 'Faculty',
        icon: 'faculty'
      },
    ]
  },
  
  // Reports Section
  {
    category: 'reports',
    categoryLabel: 'Reports',
    items: [
      { 
        href: '/registrar/reports', 
        label: 'Reports & Analytics',
        icon: 'reports'
      },
    ]
  }
]

// Simple flat navigation for backwards compatibility
export const registrarNavFlat = [
  { href: '/registrar', label: 'Dashboard' },
  { href: '/registrar/student-verification', label: 'Student Verification' },
  { href: '/registrar/enrollments', label: 'Student Enrollments' },
  { href: '/registrar/grades/approvals', label: 'Grade Approvals' },
  { href: '/registrar/re-enroll-students', label: 'Re-Enroll Students' },
  { href: '/registrar/school-years', label: 'School Years' },
  { href: '/registrar/strands', label: 'Strands & Sections' },
  { href: '/registrar/subjects', label: 'Subjects' },
  { href: '/registrar/classes', label: 'Classes' },
  { href: '/registrar/faculty', label: 'Faculty' },
  { href: '/registrar/reports', label: 'Reports' },
]


