// Organized navigation with categories
export const facultyNav = [
  { 
    href: '/faculty', 
    label: 'Dashboard',
    category: 'main',
    icon: 'dashboard'
  },
  
  // Teaching & Management Section
  {
    category: 'teaching',
    categoryLabel: 'Teaching & Management',
    items: [
      { 
        href: '/faculty/classes', 
        label: 'My Classes',
        icon: 'classes'
      },
      { 
        href: '/faculty/students', 
        label: 'Students',
        icon: 'students'
      },
      { 
        href: '/faculty/grades', 
        label: 'Grades',
        icon: 'grades'
      },
    ]
  },
  
  // Reports Section (at the bottom)
  {
    category: 'reports',
    categoryLabel: 'Reports',
    items: [
      { 
        href: '/faculty/reports', 
        label: 'Reports',
        icon: 'reports'
      },
    ]
  }
]

// Coordinator Navigation (shown only for coordinators)
export const coordinatorNav = [
  {
    category: 'coordinator',
    categoryLabel: 'Coordinator Functions',
    items: [
      { 
        href: '/faculty/enrollments', 
        label: 'Manage Enroll',
        icon: 'enrollment'
      },
      { 
        href: '/faculty/coordinator-students', 
        label: 'Student Profile',
        icon: 'students'
      },
      { 
        href: '/faculty/credited-subjects', 
        label: 'Credited Subjects',
        icon: 'subjects'
      },
      { 
        href: '/faculty/enrollment-reports', 
        label: 'Enrollment Reports',
        icon: 'reports'
      },
    ]
  }
]
