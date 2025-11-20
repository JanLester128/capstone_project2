import { Head, router } from '@inertiajs/react'
import FacultySidebar from '../Auth/Faculty_sidebar'
import { useMemo, useState } from 'react'
import { formatTime } from '../../utils/dateFormatter'

export default function FacultyReports({ classes = [], sections = [], activeSchoolYear, activeSemester, user = {} }) {
  const [view, setView] = useState('schedule')
  const [selectedClass, setSelectedClass] = useState(classes[0]?.id || null)
  
  const handleDownloadSchedulePdf = () => {
    window.open('/faculty/reports/schedule/pdf', '_blank')
  }
  
  const handleDownloadClassStudentsPdf = (classId) => {
    window.open(`/faculty/reports/class/${classId}/students/pdf`, '_blank')
  }
  
  const handleDownloadClassGradesPdf = (classId) => {
    window.open(`/faculty/reports/class/${classId}/grades/pdf`, '_blank')
  }
  
  const handleDownloadAdvisoryPdf = (sectionId) => {
    window.open(`/faculty/reports/section/${sectionId}/advisory/pdf`, '_blank')
  }

  const scheduleData = useMemo(
    () =>
      classes.map((cls) => {
        let displayTime = 'TBD'
        if (cls.start_time && cls.end_time) {
          // Format times properly - handle both time strings and datetime strings
          const startTime = cls.start_time.includes('T') 
            ? formatTime(cls.start_time) 
            : formatTime(`2000-01-01 ${cls.start_time}`)
          const endTime = cls.end_time.includes('T')
            ? formatTime(cls.end_time)
            : formatTime(`2000-01-01 ${cls.end_time}`)
          displayTime = `${startTime} - ${endTime}`
        }
        return {
          ...cls,
          displayTime,
        }
      }),
    [classes]
  )
  
  const currentClass = useMemo(
    () => classes.find((cls) => cls.id === selectedClass) || null,
    [classes, selectedClass]
  )

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Head title="Faculty Reports" />
      <FacultySidebar user={user} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reports &amp; Export</h1>
              <p className="text-gray-600 mt-1">
                Quick snapshot of your schedule and advisory sections
                {activeSchoolYear && activeSemester && (
                  <span className="ml-2 text-sm">
                    • {activeSchoolYear.School_year_start}-{activeSchoolYear.School_year_end} • {activeSemester.semester_type}
                  </span>
                )}
              </p>
            </div>
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                type="button"
                onClick={() => setView('schedule')}
                className={
                  (view === 'schedule'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50') +
                  ' px-4 py-2 text-sm font-medium border border-gray-200 rounded-l-md'
                }
              >
                Schedule
              </button>
              <button
                type="button"
                onClick={() => setView('classes')}
                className={
                  (view === 'classes'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50') +
                  ' px-4 py-2 text-sm font-medium border border-gray-200'
                }
              >
                Class Reports
              </button>
              <button
                type="button"
                onClick={() => setView('advisory')}
                className={
                  (view === 'advisory'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50') +
                  ' px-4 py-2 text-sm font-medium border border-gray-200 rounded-r-md'
                }
              >
                Advisory
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {view === 'schedule' ? (
            <section className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Class Schedule</h2>
                  <p className="text-sm text-gray-500">{scheduleData.length} classes</p>
                </div>
                <button
                  onClick={handleDownloadSchedulePdf}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Subject</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Section</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Strand</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Schedule</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Semester</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {scheduleData.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                          No classes assigned for the selected term.
                        </td>
                      </tr>
                    )}
                    {scheduleData.map((cls) => (
                      <tr key={cls.id}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{cls.subject}</p>
                          <p className="text-xs text-gray-500">{cls.subject_code}</p>
                        </td>
                        <td className="px-4 py-3">{cls.section || ''}</td>
                        <td className="px-4 py-3">{cls.strand || ''}</td>
                        <td className="px-4 py-3">
                          <p className="text-gray-900">{cls.day_of_week}</p>
                          <p className="text-xs text-gray-500">{cls.displayTime}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-gray-900">{cls.semester}</p>
                          <p className="text-xs text-gray-500">{cls.school_year}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : view === 'classes' ? (
            <section className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Class Reports - Generate PDFs</h2>
                <p className="text-sm text-gray-600 mb-4">Select a class to generate student lists or grades reports</p>
                
                {classes.length > 0 ? (
                  <div className="flex items-center gap-3 mb-4">
                    <label htmlFor="classReportSelect" className="text-sm font-medium text-gray-700">
                      Select Class:
                    </label>
                    <div className="relative flex-1 max-w-md">
                      <select
                        id="classReportSelect"
                        value={selectedClass || ''}
                        onChange={(e) => setSelectedClass(Number(e.target.value))}
                        className="appearance-none bg-white rounded-md border-2 border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-sm px-4 py-2.5 pr-10 cursor-pointer hover:border-gray-400 transition-colors w-full"
                      >
                        {classes.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.subject} • {cls.section} {cls.strand ? `• ${cls.strand}` : ''}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 py-4">No classes assigned for the current term.</p>
                )}
              </div>
              
              {currentClass && (
                <div className="p-6">
                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">Selected Class Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Subject</p>
                        <p className="font-medium text-gray-900">{currentClass.subject}</p>
                        <p className="text-xs text-gray-500">{currentClass.subject_code}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Section</p>
                        <p className="font-medium text-gray-900">{currentClass.section}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Strand</p>
                        <p className="font-medium text-gray-900">{currentClass.strand || ''}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Schedule</p>
                        <p className="font-medium text-gray-900">{currentClass.day_of_week}</p>
                        <p className="text-xs text-gray-500">{currentClass.displayTime}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-semibold text-gray-900 mb-2">Students List</h4>
                          <p className="text-sm text-gray-600 mb-4">
                            Generate a complete roster of students enrolled in this class with LRN, names, and grade levels.
                          </p>
                          <button
                            onClick={() => handleDownloadClassStudentsPdf(currentClass.id)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download Students List PDF
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-6 hover:border-red-300 transition">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-semibold text-gray-900 mb-2">Grades Report</h4>
                          <p className="text-sm text-gray-600 mb-4">
                            Generate a detailed grades report with all quarter grades, final grades, and remarks. Shows approved grades only.
                          </p>
                          <button
                            onClick={() => handleDownloadClassGradesPdf(currentClass.id)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download Grades Report PDF
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex gap-3">
                      <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Important Notes:</p>
                        <ul className="list-disc list-inside space-y-1 text-blue-700">
                          <li>PDFs will open in a new tab or download automatically</li>
                          <li>Grades reports show only approved grades</li>
                          <li>All reports are filtered by the current active semester</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          ) : (
            <section className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Advisory Sections</h2>
                  <p className="text-sm text-gray-500">{sections.length} sections</p>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {sections.length === 0 && (
                  <p className="px-6 py-8 text-center text-gray-500">No advisory sections for the selected term.</p>
                )}
                {sections.map((section) => (
                  <div key={section.id} className="p-6">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <p className="text-lg font-semibold text-gray-900">{section.name}</p>
                        <p className="text-sm text-gray-500">
                          {section.strand || 'No strand'}
                          {section.school_year && ` • ${section.school_year}`}
                          {section.semester && ` • ${section.semester}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Students</p>
                          <p className="text-xl font-semibold text-gray-900">{section.student_count}</p>
                        </div>
                        <button
                          onClick={() => handleDownloadAdvisoryPdf(section.id)}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition"
                          title="Download Advisory Report PDF"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          PDF
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border border-gray-200 rounded-lg p-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Students</p>
                        {section.students && section.students.length > 0 ? (
                          <ul className="text-sm text-gray-700 space-y-1">
                            {section.students.slice(0, 5).map((student, idx) => (
                              <li key={idx}>{student}</li>
                            ))}
                            {section.students.length > 5 && (
                              <li className="text-xs text-gray-500">
                                +{section.students.length - 5} more student{section.students.length - 5 !== 1 ? 's' : ''}
                              </li>
                            )}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-500">No students assigned.</p>
                        )}
                      </div>
                      <div className="border border-gray-200 rounded-lg p-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Subjects</p>
                        {section.subjects && section.subjects.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {section.subjects.map((subject, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100"
                              >
                                {subject}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No subjects assigned.</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}

