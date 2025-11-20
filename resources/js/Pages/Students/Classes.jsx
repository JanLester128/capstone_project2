import { Head } from '@inertiajs/react'
import StudentSidebar from '../Auth/Student_sidebar'
import { useMemo } from 'react'

// Deduplicate subjects that appear on multiple days
function deduplicateSubjects(schedule) {
  if (!schedule || schedule.length === 0) return []
  
  const grouped = {}
  schedule.forEach((item) => {
    const key = item.subject_code || item.subject || item.id
    if (!grouped[key]) {
      grouped[key] = { ...item }
    }
  })
  
  return Object.values(grouped)
}

export default function Classes({ enrollments = [], enrollmentStatus = {} }) {
  // Process enrollments to deduplicate subjects
  const processedEnrollments = useMemo(() => {
    return enrollments.map(enrollment => ({
      ...enrollment,
      schedule: deduplicateSubjects(enrollment.schedule || [])
    }))
  }, [enrollments])

  const totalSubjects = useMemo(() => {
    return processedEnrollments.reduce(
      (sum, enrollment) => sum + (enrollment.schedule?.length || 0),
      0
    )
  }, [processedEnrollments])
  // latestEnrollment is not required for the record layout

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <StudentSidebar enrollmentStatus={enrollmentStatus} />
      <div className="flex-1">
        <Head title="Class Record" />

        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Title */}
            <div className="bg-white border border-gray-200 rounded-lg mb-6">
              <div className="px-6 py-6 text-center">
                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-wide">
                  ENROLLMENT RECORD
                </h1>
              </div>
            </div>

            {/* Enrollment sections */}
            {processedEnrollments.length > 0 ? (
              <div className="space-y-6">
                {processedEnrollments.map((enrollment) => (
                  <div key={enrollment.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                      <h2 className="text-base md:text-lg font-semibold text-gray-900">
                        {(enrollment.grade_level ? `${enrollment.grade_level} | ` : '')}
                        {enrollment.school_year || ''} {enrollment.semester || ''}
                      </h2>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{enrollment.strand?.name || ''}</p>
                        {enrollment.section && (<p className="text-xs text-gray-500">Section {enrollment.section}</p>)}
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Instructor</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Subject Code</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Descriptive Title</th>
                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                              {quarterHeader(enrollment.semester, 1)}
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                              {quarterHeader(enrollment.semester, 2)}
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Final Grade</th>
                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {(enrollment.schedule || []).map((c, idx) => (
                            <ClassRecordRow key={`${c.id}-${idx}`} row={c} semesterLabel={enrollment.semester} />
                          ))}
                          {(enrollment.schedule || []).length === 0 && (
                            <tr>
                              <td colSpan={7} className="px-6 py-6 text-center text-sm text-gray-500">No classes for this term.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-10 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="mt-4 text-lg font-semibold text-gray-900">No class history yet</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Once you are officially assigned to a strand and section, your subjects will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function parseSemesterCode(label) {
  if (!label) return '1st'
  const l = String(label).toLowerCase()
  if (l.includes('2nd')) return '2nd'
  if (l.includes('summer')) return 'Summer'
  return '1st'
}

function quarterHeader(semesterLabel, index) {
  const sem = parseSemesterCode(semesterLabel)
  if (sem === 'Summer') {
    return index === 1 ? 'Original Failed Grade' : 'Summer Grade'
  }
  if (sem === '2nd') {
    return index === 1 ? '3rd Quarter' : '4th Quarter'
  }
  // default (1st semester)
  return index === 1 ? '1st Quarter' : '2nd Quarter'
}

function formatGradeValue(value) {
  if (value === null || value === undefined) return ''
  const n = parseFloat(value)
  if (Number.isNaN(n)) return ''
  return n > 0 && n <= 5 ? n.toFixed(1) : n.toFixed(2)
}

function deriveRemarks(grade) {
  if (grade === null || grade === undefined || grade === '' || grade === '—') return ''
  const n = parseFloat(grade)
  if (Number.isNaN(n)) return ''
  // Support 1.0–5.0 and 100 scales
  if (n <= 5) return n <= 3.0 ? 'PASSED' : 'FAILED'
  return n >= 75 ? 'PASSED' : 'FAILED'
}

function ClassRecordRow({ row, semesterLabel }) {
  const sem = parseSemesterCode(semesterLabel)
  const isSummer = sem === 'Summer'
  
  // For summer grades, use original_failed_grade and summer_grade
  // For regular semesters, use quarters
  const midterm = isSummer 
    ? row?.original_failed_grade 
    : (sem === '1st' ? row?.first_quarter : sem === '2nd' ? row?.third_quarter : null)
  const finalTerm = isSummer
    ? row?.summer_grade
    : (sem === '1st' ? row?.second_quarter : sem === '2nd' ? row?.fourth_quarter : null)
  const avg = (() => {
    // For summer grades, use final_grade directly (already calculated)
    if (isSummer) {
      return row?.final_grade ?? null
    }
    // For regular semesters, calculate from quarters
    const a = parseFloat(midterm)
    const b = parseFloat(finalTerm)
    if (!Number.isNaN(a) && !Number.isNaN(b)) return (a + b) / 2
    return row?.final_grade ?? null
  })()

  return (
    <tr>
      <td className="px-6 py-3 text-sm text-gray-900">{row?.faculty || ''}</td>
      <td className="px-6 py-3 text-sm text-gray-700">{row?.subject_code || ''}</td>
      <td className="px-6 py-3 text-sm text-gray-900">
        {row?.subject || ''}
        {row?.is_credited && (
          <span className="ml-1 text-xs font-semibold text-indigo-600">(Credited)</span>
        )}
        {isSummer && row?.notes && (
          <div className="mt-0.5 text-[10px] text-blue-500 italic">
            {row.notes.length > 50 ? row.notes.substring(0, 50) + '...' : row.notes}
          </div>
        )}
      </td>
      <td className="px-6 py-3 text-center text-sm text-gray-700">{formatGradeValue(midterm)}</td>
      <td className="px-6 py-3 text-center text-sm text-gray-700">{formatGradeValue(finalTerm)}</td>
      <td className="px-6 py-3 text-center text-sm text-gray-700">{formatGradeValue(avg)}</td>
      <td className="px-6 py-3 text-center text-sm text-gray-700">{row?.remarks || deriveRemarks(avg)}</td>
    </tr>
  )
}
