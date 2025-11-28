import { Head } from '@inertiajs/react'
import StudentSidebar from '../Auth/Student_sidebar'

const statusStyles = {
  completed: 'bg-green-100 text-green-800 border-green-200',
  credited: 'bg-blue-100 text-blue-800 border-blue-200',
  pending: 'bg-gray-100 text-gray-600 border-gray-200',
  current: 'bg-amber-100 text-amber-800 border-amber-200'
}

const infoBlock = (label, value) => (
  <div className="space-y-1">
    <p className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold">{label}</p>
    <p className="text-sm font-semibold text-gray-900 min-h-[20px]">{value || '—'}</p>
  </div>
)

export default function AcademicRecord({
  enrollmentStatus,
  record = [],
  curriculum = null,
  strand = null,
  summary = null,
  studentProfile = null,
  infoMessage = null,
  currentYearLevel = null,
  currentSemesterKey = null
}) {
  const hasSubjects = record?.length > 0
  const profile = studentProfile || {}

  const renderStatusBadge = (status) => {
    const base = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border'
    const style = statusStyles[status] || statusStyles.pending
    const labelMap = {
      completed: 'Completed',
      credited: 'Credited',
      current: 'Enrolled / Current',
      pending: 'Pending'
    }
    const label = labelMap[status] || labelMap.pending
    return <span className={`${base} ${style}`}>{label}</span>
  }

  const renderQuarterValue = (subject, quarter) => {
    const value = subject?.quarters?.[quarter]
    if (value === null || value === undefined) {
      return <span className="text-xs text-gray-400">—</span>
    }
    return <span className="text-sm font-medium text-gray-900">{Number(value).toFixed(2)}</span>
  }

  const renderFinalScore = (subject) => {
    if (subject.final_grade === null || subject.final_grade === undefined) {
      return <span className="text-sm text-gray-400">—</span>
    }

    return (
      <div className="text-sm font-semibold text-gray-900">
        {Number(subject.final_grade).toFixed(2)}
        {subject.remarks && (
          <p className="text-xs text-gray-500 mt-0.5">{subject.remarks}</p>
        )}
      </div>
    )
  }

  const semesterQuarterLabels = (semesterKey) => (String(semesterKey) === '2' ? [3, 4] : [1, 2])

  const renderQuarterBadges = (semester) => {
    const quarters = semesterQuarterLabels(semester.semester)
    return (
      <div className="flex flex-wrap gap-2">
        {quarters.map((quarter) => {
          const isDone = semester.quarter_status?.[quarter]
          return (
            <span
              key={`${semester.semester}-quarter-${quarter}`}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${
                isDone
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 bg-gray-50 text-gray-500'
              }`}
            >
              <span>Quarter {quarter}</span>
              <span className="text-[11px] font-semibold">{isDone ? 'Graded' : 'Pending'}</span>
            </span>
          )
        })}
      </div>
    )
  }

  const renderSemesterCard = (yearLevel, semester, label) => {
    const quarterLabels = semester ? semesterQuarterLabels(semester.semester) : label.includes('Second') ? [3, 4] : [1, 2]
    const normalizedSemesterKey = semester ? String(semester.semester) : label.includes('Second') ? '2' : '1'
    const isCurrentTerm = (Number(yearLevel) === Number(currentYearLevel)) && String(currentSemesterKey || '1') === normalizedSemesterKey
    const sectionName = isCurrentTerm ? (profile.section || '—') : '—'
    const adviserName = isCurrentTerm ? (profile.adviser || '—') : '—'

    return (
      <div key={`${yearLevel}-${label}`} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-[#2F5597] px-6 py-3 text-white">
          <p className="text-[11px] uppercase tracking-[0.35em] text-blue-100">Academic Record</p>
          <div className="mt-1 flex flex-wrap items-center gap-4 text-sm">
            <span>Year Level: <strong>Grade {yearLevel ?? '—'}</strong></span>
            <span>Semester: <strong>{label}</strong></span>
            <span>Section: <strong>{sectionName}</strong></span>
            <span>Adviser: <strong>{adviserName}</strong></span>
          </div>
        </div>

        {!semester ? (
          <div className="px-6 py-5 text-sm text-gray-500">No records available for this semester yet.</div>
        ) : (
          <div className="px-6 py-5 space-y-4">
            <div className="flex flex-wrap gap-2">
              {quarterLabels.map((quarter) => {
                const isDone = semester.quarter_status?.[quarter]
                return (
                  <span
                    key={`${label}-quarter-${quarter}`}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                      isDone
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 bg-gray-50 text-gray-500'
                    }`}
                  >
                    <span>Quarter {quarter}</span>
                    <span className="text-[11px] font-normal">{isDone ? 'Graded' : 'Pending'}</span>
                  </span>
                )
              })}
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 text-[11px] uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="border border-slate-200 px-3 py-2 text-left">Subjects</th>
                    {quarterLabels.map((quarter) => (
                      <th key={`${label}-quarter-header-${quarter}`} className="border border-slate-200 px-3 py-2 text-center">
                        Quarterly Rating {quarter}
                      </th>
                    ))}
                    <th className="border border-slate-200 px-3 py-2 text-center">Final Rating</th>
                    <th className="border border-slate-200 px-3 py-2 text-left">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {semester.subjects.map((subject) => (
                    <tr key={subject.id} className="odd:bg-white even:bg-slate-50">
                      <td className="border border-slate-200 px-3 py-2 align-top">
                        <p className="text-sm font-semibold text-gray-900">{subject.name}</p>
                        <p className="text-xs text-gray-500 font-mono">{subject.code}</p>
                        <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-gray-500">
                          {subject.prerequisites && (
                            <span className="rounded bg-gray-100 px-2 py-0.5">Pre: {subject.prerequisites}</span>
                          )}
                          {subject.corequisites && (
                            <span className="rounded bg-gray-100 px-2 py-0.5">Co: {subject.corequisites}</span>
                          )}
                          {renderStatusBadge(subject.status)}
                        </div>
                      </td>
                      {quarterLabels.map((quarter) => (
                        <td key={`${subject.id}-q-${quarter}`} className="border border-slate-200 px-3 py-2 text-center align-middle">
                          {renderQuarterValue(subject, quarter)}
                        </td>
                      ))}
                      <td className="border border-slate-200 px-3 py-2 text-center align-middle">
                        {renderFinalScore(subject)}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 align-middle text-sm text-gray-700">
                        {subject.remarks || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-indigo-50 text-sm font-semibold text-indigo-900">
                    <td className="border border-slate-200 px-3 py-2">General Average</td>
                    {quarterLabels.map((quarter) => (
                      <td key={`avg-${label}-${quarter}`} className="border border-slate-200 px-3 py-2"></td>
                    ))}
                    <td className="border border-slate-200 px-3 py-2 text-center">
                      {semester.general_average ? Number(semester.general_average).toFixed(2) : '—'}
                    </td>
                    <td className="border border-slate-200 px-3 py-2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <StudentSidebar enrollmentStatus={enrollmentStatus} />
      <div className="flex-1">
        <Head title="Academic Record" />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Curriculum Overview</p>
                  <h1 className="text-2xl font-bold text-gray-900">Academic Record</h1>
                  <p className="text-sm text-gray-500">Complete listing of all Grade 11 & 12 subjects under your strand.</p>
                </div>
                {curriculum && (
                  <div className="min-w-[240px] bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                    <p className="text-xs uppercase tracking-widest text-indigo-500 font-semibold">Active Curriculum</p>
                    <p className="text-sm font-semibold text-indigo-900">{curriculum.code || curriculum.name}</p>
                    <p className="text-xs text-indigo-700">{curriculum.name}</p>
                    <p className="text-[11px] text-indigo-500 mt-1">Effective SY: {curriculum.effective_sy}</p>
                  </div>
                )}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500 font-semibold mb-3">Learner Information</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {infoBlock('Last Name', profile.last_name)}
                    {infoBlock('First Name', profile.first_name)}
                    {infoBlock('Middle Name', profile.middle_name)}
                    {infoBlock('Extension', profile.extension_name || 'N/A')}
                    {infoBlock('LRN', profile.lrn)}
                    {infoBlock('Birthdate', profile.birthdate)}
                    {infoBlock('Sex', profile.sex)}
                    {infoBlock('Strand', strand?.Strand_name || profile.strand || 'Not assigned')}
                  </div>
                </div>
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500 font-semibold mb-3">Current Assignment</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {infoBlock('Grade Level', profile.grade_level ?? '—')}
                    {infoBlock('Section', profile.section)}
                    {infoBlock('Adviser', profile.adviser)}
                    {infoBlock('School Year', profile.school_year)}
                    {infoBlock('Total Subjects', summary?.totalSubjects ?? 0)}
                    <div className="space-y-2">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500 font-semibold">Completion</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-100">
                          Completed: {summary?.completed ?? 0}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 border border-sky-100">
                          Credited: {summary?.credited ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {!hasSubjects && (
                <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                  {infoMessage || 'Curriculum subjects are not yet configured for your strand.'}
                </div>
              )}
            </div>

            {hasSubjects && (
              <div className="space-y-8">
                {record.map((year) => {
                  const semesterOrder = [
                    { key: '1', label: 'First Semester' },
                    { key: '2', label: 'Second Semester' }
                  ]

                  return (
                    <div key={year.year_level} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-gray-500 font-semibold">Grade Level</p>
                          <h2 className="text-2xl font-bold text-gray-900">Grade {year.year_level}</h2>
                        </div>
                      </div>

                      <div className="space-y-6">
                        {semesterOrder.map(({ key, label }) => {
                          const semesterData = year.semesters.find((semester) => String(semester.semester) === String(key))
                          return renderSemesterCard(year.year_level, semesterData, label)
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
