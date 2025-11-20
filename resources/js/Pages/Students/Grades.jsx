import { Head } from '@inertiajs/react'
import { useState } from 'react'
import StudentSidebar from '../Auth/Student_sidebar'

export default function Grades({ 
  grades = [], 
  groupedGrades = [], 
  enrollmentStatus, 
  semesterPerformance = null,
  studentInfo = null,
  activeSchoolYear = null,
  activeSemester = null
}) {
  // Default to active semester if available, otherwise first grouped grade or 'All'
  const getDefaultSemester = () => {
    if (activeSemester && activeSchoolYear) {
      const activeLabel = `${activeSchoolYear.formatted} - ${activeSemester.semester_type}`
      // Check if this label exists in groupedGrades
      const exists = groupedGrades.some(g => g.label === activeLabel)
      if (exists) return activeLabel
    }
    return groupedGrades[0]?.label || 'All'
  }
  
  const [selectedSemester, setSelectedSemester] = useState(getDefaultSemester())

  // Helper function to safely format grades
  const formatGrade = (grade) => {
    if (grade === null || grade === undefined) return '--'
    const numGrade = parseFloat(grade)
    if (isNaN(numGrade)) return '--'
    // Display one decimal place for 1.0–5.0 scale, else two decimals
    return numGrade > 0 && numGrade <= 5 ? numGrade.toFixed(1) : numGrade.toFixed(2)
  }

  // Only color red if failing; otherwise keep black
  const isFailing = (grade, remarks) => {
    if (remarks === 'Failed') return true
    const n = parseFloat(grade)
    if (isNaN(n)) return false
    return n <= 5 ? n > 3.0 : n < 75
  }
  const getNumberClass = (grade, remarks) => {
    if (grade === null || grade === undefined || grade === '--') return 'text-gray-900'
    return isFailing(grade, remarks) ? 'text-red-600' : 'text-gray-900'
  }

  const getRemarksColor = (remarks) => {
    if (remarks === 'Passed') return 'text-green-700 font-semibold'
    if (remarks === 'Failed') return 'text-red-700 font-semibold'
    if (remarks === 'Incomplete') return 'text-yellow-700 font-semibold'
    return 'text-gray-700'
  }

  const calculateSemesterAverage = (semesterGrades) => {
    const validGrades = semesterGrades.filter(g => {
      const grade = parseFloat(g.final_grade)
      return !isNaN(grade) && grade !== null
    })
    if (validGrades.length === 0) return null
    const sum = validGrades.reduce((acc, g) => acc + parseFloat(g.final_grade), 0)
    return (sum / validGrades.length).toFixed(2)
  }

  const displayGrades = selectedSemester === 'All' 
    ? grades 
    : groupedGrades.find(g => g.label === selectedSemester)?.grades || []

  // Check if a grade is from summer semester
  const isSummerGrade = (g) => g.semester === 'Summer' || g.semester === 'summer'

  // Quarter helpers based on semester
  const getQ1 = (g) => {
    if (isSummerGrade(g)) return g.original_failed_grade
    return g.semester === '2nd' ? g.third_quarter : g.first_quarter
  }
  const getQ2 = (g) => {
    if (isSummerGrade(g)) return g.summer_grade
    return g.semester === '2nd' ? g.fourth_quarter : g.second_quarter
  }
  const getCumulative = (g) => {
    // For summer grades, use the final_grade directly (already calculated)
    if (isSummerGrade(g)) {
      return g.final_grade ?? null
    }
    // For regular semesters, calculate from quarters
    const mid = parseFloat(getQ1(g))
    const fin = parseFloat(getQ2(g))
    const validMid = !isNaN(mid)
    const validFin = !isNaN(fin)
    if (validMid && validFin) return ((mid + fin) / 2).toFixed(mid <= 5 && fin <= 5 ? 1 : 2)
    // Fallback to provided final_grade if available
    return g.final_grade ?? null
  }

  const currentSemester = selectedSemester !== 'All' 
    ? groupedGrades.find(g => g.label === selectedSemester)
    : null

  const semesterAverage = currentSemester ? calculateSemesterAverage(currentSemester.grades) : null
  const passedCount = displayGrades.filter(g => g.remarks === 'Passed').length
  const failedCount = displayGrades.filter(g => g.remarks === 'Failed').length

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <StudentSidebar enrollmentStatus={enrollmentStatus} />
      <div className="flex-1">
        <Head title="My Grades" />

        <div className="py-6 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">My Grades</h1>
            <p className="mt-2 text-sm text-gray-600">
              View your academic performance across all semesters
            </p>
          </div>

          {/* Student Info Header (compact, like sample image) */}
          <div className="bg-white border border-gray-200 rounded-lg mb-4">
            <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-sm">
                <p className="text-gray-500">Student ID Number</p>
                <p className="font-semibold text-gray-900">{studentInfo?.lrn || '--'}</p>
              </div>
              <div className="text-sm md:text-right">
                <p className="text-gray-500">Student Name</p>
                <p className="font-semibold text-gray-900">{studentInfo?.name || 'Student'}</p>
              </div>
            </div>
            <div className="border-t border-gray-100 px-6 py-3 text-sm flex flex-wrap items-center justify-between gap-3">
              <p className="text-gray-700">
                <span className="font-medium">Year Level:</span>{' '}
                {enrollmentStatus?.latestEnrollment?.grade_level || '--'}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Semester:</span>{' '}
                {selectedSemester === 'All'
                  ? 'All'
                  : (displayGrades[0]?.semester || '--')}
              </p>
            </div>
          </div>

          {/* Academic Standing Alerts */}
          {semesterPerformance?.requires_summer && (
            <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Summer Classes Required</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>You need to take summer classes for failed subjects. Please contact the registrar's office.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {semesterPerformance?.requires_strand_change && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Strand Change Required</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>Based on your semester performance, you will be re-enrolled in the {semesterPerformance.recommended_strand} strand.</p>
                    <p className="mt-1">Please contact the registrar's office for guidance on your next enrollment.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Summary Stats */}
          {currentSemester && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">Total Subjects</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{displayGrades.length}</p>
                  </div>
                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">Semester Average</p>
                    <p className={`text-2xl font-bold mt-1 ${getNumberClass(semesterAverage, parseFloat(semesterAverage) < 75 ? 'Failed' : 'Passed')}`}>
                      {semesterAverage || '--'}
                    </p>
                  </div>
                  <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">Passed</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{passedCount}</p>
                  </div>
                  <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">Failed</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">{failedCount}</p>
                  </div>
                  <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Semester Filter */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedSemester('All')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  selectedSemester === 'All'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                All Semesters
              </button>
              {groupedGrades.map((group) => (
                <button
                  key={group.label}
                  onClick={() => setSelectedSemester(group.label)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    selectedSemester === group.label
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {group.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grades Table - Report Card Style */}
          {displayGrades.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No grades available</h3>
              <p className="mt-1 text-sm text-gray-500">
                {activeSemester && activeSchoolYear
                  ? `No grades available for ${activeSemester.semester_type} of ${activeSchoolYear.formatted}. Grades will appear here once they are submitted and approved.`
                  : 'Grades will appear here once they are submitted and approved.'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Grades Table (simple layout like sample) */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Subject Instructor</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Subject Code</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Descriptive Title</th>
                      <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                        {isSummerGrade(displayGrades[0]) 
                          ? 'Original Failed Grade' 
                          : (displayGrades[0]?.semester === '2nd' ? '3rd Quarter' : '1st Quarter')}
                      </th>
                      <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                        {isSummerGrade(displayGrades[0])
                          ? 'Summer Grade'
                          : (displayGrades[0]?.semester === '2nd' ? '4th Quarter' : '2nd Quarter')}
                      </th>
                      <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Final Grade</th>
                      <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {displayGrades.map((grade, index) => (
                      <tr key={grade.id || index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-900">{grade.teacher || 'TBD'}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{grade.subject_code || '--'}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{grade.subject}</td>
                        <td className={`px-6 py-4 text-center text-sm font-bold ${getNumberClass(getQ1(grade), grade.remarks)}`}>
                          {formatGrade(getQ1(grade))}
                        </td>
                        <td className={`px-6 py-4 text-center text-sm font-bold ${getNumberClass(getQ2(grade), grade.remarks)}`}>
                          {formatGrade(getQ2(grade))}
                        </td>
                        <td className={`px-6 py-4 text-center text-sm font-bold ${getNumberClass(getCumulative(grade), grade.remarks)}`}>
                          {formatGrade(getCumulative(grade))}
                        </td>
                        <td className={`px-6 py-4 text-center text-sm font-semibold ${getRemarksColor(grade.remarks)}`}>
                          {grade.remarks || '--'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Additional Notes */}
              {displayGrades.some(g => g.failed_prerequisites) && (
                <div className="bg-orange-50 border-t border-orange-200 px-6 py-4">
                  <h4 className="text-sm font-semibold text-orange-800 mb-2">⚠️ Prerequisites Notice:</h4>
                  <ul className="text-sm text-orange-700 space-y-1">
                    {displayGrades
                      .filter(g => g.failed_prerequisites)
                      .map((g, i) => (
                        <li key={i}>
                          <span className="font-medium">{g.subject}</span> failure blocks: {g.failed_prerequisites}
                        </li>
                      ))
                    }
                  </ul>
                </div>
              )}

              {/* Summer Grade Notes */}
              {displayGrades.some(g => isSummerGrade(g) && g.notes) && (
                <div className="bg-blue-50 border-t border-blue-200 px-6 py-4">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">📝 Summer Class Notes:</h4>
                  <ul className="text-sm text-blue-700 space-y-2">
                    {displayGrades
                      .filter(g => isSummerGrade(g) && g.notes)
                      .map((g, i) => (
                        <li key={i}>
                          <span className="font-medium">{g.subject}:</span> {g.notes}
                        </li>
                      ))
                    }
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
