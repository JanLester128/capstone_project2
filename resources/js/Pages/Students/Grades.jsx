import { Head } from '@inertiajs/react'
import StudentSidebar from '../Auth/Student_sidebar'

// Updated for navigation fix
export default function Grades({ grades = [] }) {
  const getGradeColor = (grade) => {
    if (grade >= 90) return 'text-green-600 bg-green-100'
    if (grade >= 80) return 'text-blue-600 bg-blue-100'
    if (grade >= 75) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getStatusColor = (status) => {
    return status === 'Passed' 
      ? 'text-green-800 bg-green-100 border-green-200'
      : 'text-red-800 bg-red-100 border-red-200'
  }

  const calculateGPA = () => {
    const totalPoints = grades.reduce((sum, grade) => sum + (grade.finalGrade || 0), 0)
    return grades.length > 0 ? (totalPoints / grades.length).toFixed(2) : '0.00'
  }

  const getGradeEquivalent = (grade) => {
    if (grade >= 97) return 'A+'
    if (grade >= 94) return 'A'
    if (grade >= 90) return 'A-'
    if (grade >= 87) return 'B+'
    if (grade >= 84) return 'B'
    if (grade >= 80) return 'B-'
    if (grade >= 77) return 'C+'
    if (grade >= 74) return 'C'
    if (grade >= 70) return 'C-'
    return 'F'
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <StudentSidebar />
      <div className="flex-1">
        <Head title="My Grades" />
      
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">My Grades</h1>
            <p className="mt-1 text-sm text-gray-600">
              View your academic performance and grades for all subjects
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">GPA</p>
                  <p className="text-2xl font-bold text-gray-900">{calculateGPA()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Subjects</p>
                  <p className="text-2xl font-bold text-gray-900">{grades.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Highest Grade</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {grades.length > 0 ? Math.max(...grades.map(s => s.finalGrade || 0)).toFixed(1) : '0.0'}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Passed Subjects</p>
                  <p className="text-2xl font-semibold text-gray-900">{grades.filter(g => g.status === 'Passed').length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Grades by Subject */}
          <div className="space-y-6">
            {grades.length > 0 ? grades.map((subject) => (
              <div key={subject.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{subject.subject}</h3>
                      <p className="text-sm text-gray-500">{subject.teacher} • {subject.semester}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Final Grade</p>
                        <p className={`text-2xl font-bold px-3 py-1 rounded-full ${getGradeColor(subject.finalGrade || 0)}`}>
                          {subject.finalGrade || 0}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Letter Grade</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {getGradeEquivalent(subject.finalGrade || 0)}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(subject.status || 'Failed')}`}>
                        {subject.status || 'Failed'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Grade Breakdown */}
                {subject.grades && (
                  <div className="px-6 py-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Grade Breakdown</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(subject.grades).map(([assignment, details]) => (
                        <div key={assignment} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-sm font-medium text-gray-900">{assignment}</h5>
                            <span className={`text-sm font-semibold px-2 py-1 rounded ${getGradeColor(details.score)}`}>
                              {details.score}/{details.total}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Weight: {details.weight}%</span>
                            <span>{details.date}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No grades available</h3>
                <p className="mt-1 text-sm text-gray-500">Your grades will appear here once they are posted by your teachers.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
