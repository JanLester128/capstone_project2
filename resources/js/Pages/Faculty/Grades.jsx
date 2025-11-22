import { Head, router } from '@inertiajs/react'
import { useEffect, useMemo, useState } from 'react'
import FacultySidebar from '../Auth/Faculty_sidebar'

const FALLBACK_STATUSES = ['Draft', 'Pending', 'Approved', 'Rejected']
const STORAGE_KEY = 'facultyGradesSelectedClassId'

// Function to convert 24-hour time to 12-hour format
const formatTimeTo12Hour = (time24) => {
  if (!time24) return ''
  const [hours, minutes] = time24.split(':')
  const hour = parseInt(hours, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${hour12}:${minutes} ${ampm}`
}

// Function to format ISO timestamp to readable time
const formatScheduleTime = (timeString) => {
  if (!timeString) return ''
  
  // Check if it's an ISO timestamp (contains 'T' and 'Z' or timezone)
  if (timeString.includes('T')) {
    try {
      const date = new Date(timeString)
      const hours = date.getHours()
      const minutes = date.getMinutes().toString().padStart(2, '0')
      const ampm = hours >= 12 ? 'PM' : 'AM'
      const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
      return `${hour12}:${minutes} ${ampm}`
    } catch (e) {
      // If parsing fails, try to extract time from string
      const timeMatch = timeString.match(/(\d{2}):(\d{2})/)
      if (timeMatch) {
        const hours = parseInt(timeMatch[1], 10)
        const minutes = timeMatch[2]
        const ampm = hours >= 12 ? 'PM' : 'AM'
        const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
        return `${hour12}:${minutes} ${ampm}`
      }
      return timeString
    }
  }
  
  // If it's already in HH:MM format, use formatTimeTo12Hour
  return formatTimeTo12Hour(timeString)
}

const formatNumberValue = (value) => {
  if (value === null || value === undefined) return ''
  return value === '' ? '' : Number(value).toString()
}

const normalizeNumberForPayload = (value) => {
  if (value === '' || value === null || value === undefined) return null
  return Number(value)
}

export default function FacultyGrades({ user = {}, classes = [], gradeStatuses = [], flash = {}, activeSchoolYear, activeSemester }) {
  const statusOptions = useMemo(() => (gradeStatuses?.length ? gradeStatuses : FALLBACK_STATUSES), [gradeStatuses])

  const [selectedClassId, setSelectedClassId] = useState(() => {
    if (typeof window !== 'undefined') {
      const storedId = window.localStorage.getItem(STORAGE_KEY)
      if (storedId) {
        return Number(storedId)
      }
    }
    return classes[0]?.id || null
  })
  const [gradeForm, setGradeForm] = useState({})
  const [statusFilter, setStatusFilter] = useState('all')
  const [saving, setSaving] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState({})

  useEffect(() => {
    if (!classes.length) {
      setSelectedClassId(null)
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(STORAGE_KEY)
      }
      return
    }

    setSelectedClassId((current) => {
      if (current && classes.some((cls) => cls.id === current)) {
        return current
      }
      return classes[0].id
    })
  }, [classes])

  useEffect(() => {
    if (selectedClassId && typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, String(selectedClassId))
    }
  }, [selectedClassId])

  const selectedClass = useMemo(
    () => classes.find((cls) => cls.id === selectedClassId) || null,
    [classes, selectedClassId]
  )

  // Determine which quarters to show based on semester
  const semesterType = useMemo(() => {
    if (!selectedClass) return null
    if (selectedClass.is_summer) return 'summer'
    const semester = selectedClass.semester || ''
    const semesterLower = semester.toLowerCase()
    if (semesterLower.includes('1st') || semesterLower.includes('first')) return '1st'
    if (semesterLower.includes('2nd') || semesterLower.includes('second')) return '2nd'
    return null
  }, [selectedClass])

  const shouldShowQuarter = (quarter) => {
    if (!semesterType) return true // Show all if unknown
    if (semesterType === 'summer') return false
    if (semesterType === '1st') {
      return quarter === 'first_quarter' || quarter === 'second_quarter'
    }
    if (semesterType === '2nd') {
      return quarter === 'third_quarter' || quarter === 'fourth_quarter'
    }
    return true
  }

  useEffect(() => {
    if (!selectedClass) {
      setGradeForm({})
      setSelectedStudents({})
      return
    }

    const nextForm = {}
    const nextSelected = {}
    selectedClass.students.forEach((student) => {
      nextForm[student.student_personal_info_id] = {
        student_personal_info_id: student.student_personal_info_id,
        first_quarter: formatNumberValue(student.grades?.first_quarter),
        second_quarter: formatNumberValue(student.grades?.second_quarter),
        third_quarter: formatNumberValue(student.grades?.third_quarter),
        fourth_quarter: formatNumberValue(student.grades?.fourth_quarter),
        summer_grade: formatNumberValue(student.grades?.summer_grade),
        semester_grade: formatNumberValue(student.grades?.semester_grade),
        remarks: student.grades?.remarks || '',
      }
      if (student.can_edit !== false) {
        nextSelected[student.student_personal_info_id] = true
      }
    })
    setGradeForm(nextForm)
    setSelectedStudents(nextSelected)
  }, [selectedClass])

  const filteredStudents = useMemo(() => {
    if (!selectedClass) return []
    if (statusFilter === 'all') return selectedClass.students

    return selectedClass.students.filter((student) => {
      const currentStatus = student.grades?.status || 'Draft'
      return currentStatus === statusFilter
    })
  }, [selectedClass, statusFilter])

  const handleGradeChange = (studentId, field, value) => {
    setGradeForm((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { student_personal_info_id: studentId }),
        [field]: value,
      },
    }))
  }

  const toggleStudentSelection = (studentId, checked) => {
    setSelectedStudents((prev) => ({
      ...prev,
      [studentId]: checked,
    }))
  }

  const toggleAllStudents = (checked) => {
    if (!selectedClass) return
    const next = {}
    selectedClass.students.forEach((student) => {
      if (student.can_edit !== false) {
        next[student.student_personal_info_id] = checked
      }
    })
    setSelectedStudents(next)
  }

  const selectedIds = Object.entries(selectedStudents)
    .filter(([, isSelected]) => isSelected)
    .map(([id]) => Number(id))

  const submitGrades = (action = 'save') => {
    if (!selectedClass || saving) return

    if (!selectedIds.length) {
      alert('Please select at least one student before continuing.')
      return
    }

    // Filter out students with submitted/approved grades
    const editableStudentIds = selectedIds.filter((studentId) => {
      const student = selectedClass.students.find(s => s.student_personal_info_id === studentId)
      return student && student.can_edit !== false
    })

    if (!editableStudentIds.length) {
      alert('Selected students have grades that are already submitted or approved. Please select students with draft or rejected grades.')
      return
    }

    const payload = editableStudentIds.map((studentId) => {
      const grade = gradeForm[studentId] || { student_personal_info_id: studentId }
      return {
        student_personal_info_id: grade.student_personal_info_id,
        first_quarter: normalizeNumberForPayload(grade.first_quarter),
        second_quarter: normalizeNumberForPayload(grade.second_quarter),
        third_quarter: normalizeNumberForPayload(grade.third_quarter),
        fourth_quarter: normalizeNumberForPayload(grade.fourth_quarter),
        summer_grade: normalizeNumberForPayload(grade.summer_grade),
        semester_grade: normalizeNumberForPayload(grade.semester_grade),
        remarks: grade.remarks || null,
      }
    })

    setSaving(true)
    router.post(
      `/faculty/classes/${selectedClass.id}/grades`,
      { grades: payload, action },
      {
        preserveScroll: true,
        onFinish: () => setSaving(false),
      }
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Head title="Grades - Faculty" />

      <FacultySidebar user={user} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Grades Management</h1>
              <p className="text-gray-600 mt-1">Enter and submit grades for your assigned classes</p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <label htmlFor="classSelect" className="text-sm font-medium text-gray-600">
                Select Class
              </label>
              <div className="relative">
                <select
                  id="classSelect"
                  value={selectedClassId || ''}
                  onChange={(e) => setSelectedClassId(Number(e.target.value))}
                  className="appearance-none bg-white rounded-md border-2 border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-sm px-4 py-2.5 pr-10 cursor-pointer hover:border-gray-400 transition-colors min-w-[250px]"
                  disabled={classes.length === 0}
                >
                  {classes.length === 0 ? (
                    <option value="">No classes available</option>
                  ) : (
                    classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.subject?.name || 'Subject'} • {cls.section?.name || 'Section'}
                      </option>
                    ))
                  )}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {flash?.success && (
            <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
              {flash.success}
            </div>
          )}

          {!classes.length && (
            <div className="bg-white rounded-lg border border-dashed border-gray-300 py-16 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No active classes found</h3>
              <p className="text-gray-600 mb-2">
                Once you are assigned to an active class for the current semester, you will be able to enter grades here.
              </p>
              {(!activeSchoolYear || !activeSemester) && (
                <p className="text-sm text-amber-600 mt-2">
                  Note: No active school year or semester is currently set. Please contact the registrar to set up an active school year and semester.
                </p>
              )}
            </div>
          )}

          {selectedClass && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                submitGrades('save')
              }}
              className="space-y-6"
            >
              <section className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                <div className="flex flex-wrap gap-6 text-sm text-gray-700">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Subject</p>
                    <p className="font-semibold text-gray-900">
                      {selectedClass.subject?.name}{' '}
                      {selectedClass.subject?.code && (
                        <span className="text-gray-500 font-normal">({selectedClass.subject.code})</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Section</p>
                    <p className="font-semibold text-gray-900">
                      {selectedClass.section?.name} • Grade {selectedClass.section?.year_level}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Schedule</p>
                    <p className="font-semibold text-gray-900">
                      {selectedClass.schedule?.day || 'TBD'} •{' '}
                      {selectedClass.schedule?.start_time
                        ? `${formatScheduleTime(selectedClass.schedule.start_time)} - ${selectedClass.schedule?.end_time ? formatScheduleTime(selectedClass.schedule.end_time) : 'TBD'}`
                        : 'Time TBD'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Term</p>
                    <p className="font-semibold text-gray-900">
                      {selectedClass.semester || 'Semester TBD'} • {selectedClass.school_year || 'School Year TBD'}
                    </p>
                  </div>
                </div>
              </section>

              <section className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 px-5 py-4">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {selectedClass.students.length} student{selectedClass.students.length === 1 ? '' : 's'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedClass.is_summer 
                        ? 'Enter summer grade (final grade = (summer grade + original failed grade) / 2)'
                        : 'Enter quarterly grades, remarks, and status per student.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="inline-flex items-center text-sm text-gray-600">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-2"
                        checked={
                          selectedClass.students.filter((student) => student.can_edit !== false).every(
                            (student) => selectedStudents[student.student_personal_info_id]
                          ) && Object.keys(selectedStudents).length > 0
                        }
                        onChange={(e) => toggleAllStudents(e.target.checked)}
                      />
                      Select all editable students
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                    >
                      <option value="all">All statuses</option>
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <p className="text-sm text-gray-500">
                      Selected: <span className="font-semibold">{selectedIds.length}</span>
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 w-10">Select</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Student</th>
                        {selectedClass.is_summer ? (
                          <>
                            <th className="px-4 py-3 text-center font-semibold text-gray-700">Original Failed Grade</th>
                            <th className="px-4 py-3 text-center font-semibold text-gray-700">Summer Grade</th>
                            <th className="px-4 py-3 text-center font-semibold text-gray-700">Final Grade</th>
                          </>
                        ) : (
                          <>
                            {shouldShowQuarter('first_quarter') && (
                              <th className="px-4 py-3 text-center font-semibold text-gray-700">Q1</th>
                            )}
                            {shouldShowQuarter('second_quarter') && (
                              <th className="px-4 py-3 text-center font-semibold text-gray-700">Q2</th>
                            )}
                            {shouldShowQuarter('third_quarter') && (
                              <th className="px-4 py-3 text-center font-semibold text-gray-700">Q3</th>
                            )}
                            {shouldShowQuarter('fourth_quarter') && (
                              <th className="px-4 py-3 text-center font-semibold text-gray-700">Q4</th>
                            )}
                            <th className="px-4 py-3 text-center font-semibold text-gray-700">Semester</th>
                          </>
                        )}
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 w-48">Remarks</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 w-48">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {filteredStudents.length === 0 && (
                        <tr>
                          <td 
                            colSpan={
                              selectedClass.is_summer 
                                ? 6 
                                : 3 + 
                                  (shouldShowQuarter('first_quarter') ? 1 : 0) +
                                  (shouldShowQuarter('second_quarter') ? 1 : 0) +
                                  (shouldShowQuarter('third_quarter') ? 1 : 0) +
                                  (shouldShowQuarter('fourth_quarter') ? 1 : 0) + 
                                  1 // Semester column
                            } 
                            className="px-4 py-8 text-center text-gray-500"
                          >
                            No students match this filter.
                          </td>
                        </tr>
                      )}
                      {filteredStudents.map((student) => {
                        const studentGrade = gradeForm[student.student_personal_info_id] || {
                          student_personal_info_id: student.student_personal_info_id,
                        }
                        const currentStatus = student.grades?.status || 'Draft'
                        const canEdit = student.can_edit !== false
                        const statusColor =
                          currentStatus === 'Approved'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : currentStatus === 'Pending'
                              ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                              : currentStatus === 'Rejected'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-gray-50 text-gray-600 border-gray-200'
                        return (
                          <tr key={student.student_personal_info_id}>
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                disabled={!canEdit}
                                checked={!!selectedStudents[student.student_personal_info_id]}
                                onChange={(e) => toggleStudentSelection(student.student_personal_info_id, e.target.checked)}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900">{student.name}</div>
                              <div className="text-xs text-gray-500">
                                LRN: {student.lrn || ''} • Grade {student.grade_level || ''}
                              </div>
                            </td>
                            {selectedClass.is_summer ? (
                              <>
                                <td className="px-2 py-3 text-center">
                                  <div className="text-sm text-gray-600 font-medium">
                                    {student.original_failed_grade !== null && student.original_failed_grade !== undefined
                                      ? parseFloat(student.original_failed_grade).toFixed(2)
                                      : '--'}
                                  </div>
                                </td>
                                <td className="px-2 py-3 text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={studentGrade.summer_grade ?? ''}
                                    onChange={(e) => handleGradeChange(student.student_personal_info_id, 'summer_grade', e.target.value)}
                                    disabled={!canEdit}
                                    className={`w-20 rounded-md border-gray-300 text-center text-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                                      !canEdit ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                                    }`}
                                    placeholder="Grade"
                                  />
                                </td>
                                <td className="px-2 py-3 text-center">
                                  <div className="text-sm text-gray-900 font-semibold">
                                    {studentGrade.summer_grade && student.original_failed_grade !== null && student.original_failed_grade !== undefined
                                      ? ((parseFloat(studentGrade.summer_grade) + parseFloat(student.original_failed_grade)) / 2).toFixed(2)
                                      : studentGrade.semester_grade !== null && studentGrade.semester_grade !== undefined
                                        ? parseFloat(studentGrade.semester_grade).toFixed(2)
                                        : '--'}
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                {shouldShowQuarter('first_quarter') && (
                                  <td className="px-2 py-3 text-center">
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="0.01"
                                      value={studentGrade.first_quarter ?? ''}
                                      onChange={(e) => handleGradeChange(student.student_personal_info_id, 'first_quarter', e.target.value)}
                                      disabled={!canEdit}
                                      className={`w-20 rounded-md border-gray-300 text-center text-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                                        !canEdit ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                                      }`}
                                    />
                                  </td>
                                )}
                                {shouldShowQuarter('second_quarter') && (
                                  <td className="px-2 py-3 text-center">
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="0.01"
                                      value={studentGrade.second_quarter ?? ''}
                                      onChange={(e) => handleGradeChange(student.student_personal_info_id, 'second_quarter', e.target.value)}
                                      disabled={!canEdit}
                                      className={`w-20 rounded-md border-gray-300 text-center text-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                                        !canEdit ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                                      }`}
                                    />
                                  </td>
                                )}
                                {shouldShowQuarter('third_quarter') && (
                                  <td className="px-2 py-3 text-center">
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="0.01"
                                      value={studentGrade.third_quarter ?? ''}
                                      onChange={(e) => handleGradeChange(student.student_personal_info_id, 'third_quarter', e.target.value)}
                                      disabled={!canEdit}
                                      className={`w-20 rounded-md border-gray-300 text-center text-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                                        !canEdit ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                                      }`}
                                    />
                                  </td>
                                )}
                                {shouldShowQuarter('fourth_quarter') && (
                                  <td className="px-2 py-3 text-center">
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="0.01"
                                      value={studentGrade.fourth_quarter ?? ''}
                                      onChange={(e) => handleGradeChange(student.student_personal_info_id, 'fourth_quarter', e.target.value)}
                                      disabled={!canEdit}
                                      className={`w-20 rounded-md border-gray-300 text-center text-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                                        !canEdit ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                                      }`}
                                    />
                                  </td>
                                )}
                                <td className="px-2 py-3 text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={studentGrade.semester_grade ?? ''}
                                    onChange={(e) => handleGradeChange(student.student_personal_info_id, 'semester_grade', e.target.value)}
                                    disabled={!canEdit}
                                    className={`w-20 rounded-md border-gray-300 text-center text-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                                      !canEdit ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                                    }`}
                                  />
                                </td>
                              </>
                            )}
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={studentGrade.remarks ?? ''}
                                disabled={!canEdit}
                                onChange={(e) =>
                                  handleGradeChange(student.student_personal_info_id, 'remarks', e.target.value)
                                }
                                className={`w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                                  !canEdit ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                                }`}
                                placeholder="Optional notes"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-1">
                                <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full border ${statusColor}`}>
                                  {currentStatus}
                                </span>
                                {student.grades?.approval_notes && (
                                  <p className="text-xs text-gray-500">{student.grades.approval_notes}</p>
                                )}
                                {!canEdit && (currentStatus === 'Pending' || currentStatus === 'Approved') && (
                                  <p className="text-xs text-gray-400">
                                    {currentStatus === 'Pending' ? 'Awaiting registrar approval' : 'Grade has been approved'}
                                  </p>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button
                  type="button"
                  disabled={saving || !selectedIds.length}
                  onClick={() => submitGrades('submit')}
                  className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-medium shadow-sm ${
                    saving || !selectedIds.length
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {saving ? 'Submitting...' : 'Submit for Approval'}
                </button>
                <button
                  type="submit"
                  disabled={saving || !selectedIds.length}
                  className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-medium shadow-sm ${
                    saving || !selectedIds.length
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {saving ? 'Saving...' : 'Save Draft'}
                </button>
              </div>
            </form>
          )}
        </main>
      </div>
    </div>
  )
}
