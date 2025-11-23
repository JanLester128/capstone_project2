import { Head, router } from '@inertiajs/react'
import { useEffect, useState } from 'react'
import { formatDateTimeMedium } from '../../utils/dateFormatter'
import RegistrarLayout from './Layout'

// Function to convert 24-hour time to 12-hour format
const formatTimeTo12Hour = (time24) => {
  if (!time24) return ''
  const [hours, minutes] = time24.split(':')
  const hour = parseInt(hours, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${hour12}:${minutes} ${ampm}`
}

export default function GradeApprovals({ grades = [], user = {} }) {
  const [processingId, setProcessingId] = useState(null)
  const [selectedGrades, setSelectedGrades] = useState({})

  useEffect(() => {
    const defaults = {}
    grades.forEach((grade) => {
      defaults[grade.id] = true
    })
    setSelectedGrades(defaults)
  }, [grades])

  const handleDecision = (gradeId, decision) => {
    setProcessingId(gradeId)
    router.put(
      `/registrar/grades/${gradeId}/approval`,
      { decision },
      {
        preserveScroll: true,
        onFinish: () => setProcessingId(null),
      }
    )
  }

  const handleBulkDecision = (decision) => {
    const selectedIds = Object.entries(selectedGrades)
      .filter(([, isSelected]) => isSelected)
      .map(([id]) => Number(id))

    if (!selectedIds.length) {
      alert('Please select at least one grade.')
      return
    }

    setProcessingId('bulk')
    router.put(
      '/registrar/grades/approvals/bulk',
      { decision, grade_ids: selectedIds },
      {
        preserveScroll: true,
        onFinish: () => setProcessingId(null),
      }
    )
  }

  const toggleGradeSelection = (gradeId, checked) => {
    setSelectedGrades((prev) => ({
      ...prev,
      [gradeId]: checked,
    }))
  }

  const toggleAllGrades = (checked) => {
    if (!checked) {
      setSelectedGrades({})
      return
    }
    const next = {}
    grades.forEach((grade) => {
      next[grade.id] = true
    })
    setSelectedGrades(next)
  }

  const selectedIds = Object.entries(selectedGrades)
    .filter(([, isSelected]) => isSelected)
    .map(([id]) => Number(id))

  const statusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-50 text-yellow-700 border border-yellow-200'
      case 'Rejected':
        return 'bg-red-50 text-red-700 border border-red-200'
      case 'Approved':
        return 'bg-green-50 text-green-700 border border-green-200'
      default:
        return 'bg-gray-50 text-gray-600 border border-gray-200'
    }
  }

  return (
    <RegistrarLayout>
      <Head title="Grade Approvals - Registrar" />
      <header className="bg-white border-b border-gray-200 shadow-sm px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Grade Approvals</h1>
            <p className="text-sm text-gray-600 mt-1">Review and approve grades submitted by faculty</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <a
              href="/registrar/grades/approved"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              View All Approved Grades
            </a>
            <label className="inline-flex items-center text-sm text-gray-600">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-2"
                checked={grades.length > 0 && selectedIds.length === grades.length}
                onChange={(e) => toggleAllGrades(e.target.checked)}
              />
              Select all ({selectedIds.length})
            </label>
            <button
              type="button"
              disabled={!selectedIds.length || processingId === 'bulk'}
              onClick={() => handleBulkDecision('reject')}
              className={`px-4 py-2 rounded-md text-sm font-medium border ${
                !selectedIds.length || processingId === 'bulk'
                  ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'border-red-200 text-red-700 hover:bg-red-50'
              }`}
            >
              Reject Selected
            </button>
            <button
              type="button"
              disabled={!selectedIds.length || processingId === 'bulk'}
              onClick={() => handleBulkDecision('approve')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                !selectedIds.length || processingId === 'bulk'
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              Approve Selected
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-4">
        {grades.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-10 text-center text-gray-500">
            No grades are waiting for approval.
          </div>
        ) : (
          grades.map((grade) => (
            <div key={grade.id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    checked={!!selectedGrades[grade.id]}
                    onChange={(e) => toggleGradeSelection(grade.id, e.target.checked)}
                  />
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{grade.subject}</p>
                    <p className="text-sm text-gray-500">
                      {grade.class.section || 'No section'}
                      {grade.class.strand && ` • ${grade.class.strand}`}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge(grade.status)}`}>
                  {grade.status}
                </span>
              </div>

              <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-xs uppercase text-gray-500 font-semibold mb-1">Student</p>
                  <p className="text-gray-900">{grade.student.name || 'Unnamed Student'}</p>
                  <p className="text-xs text-gray-500">LRN: {grade.student.lrn || ''}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500 font-semibold mb-1">Faculty</p>
                  <p className="text-gray-900">{grade.class.faculty || 'TBD'}</p>
                  <p className="text-xs text-gray-500">
                    {grade.class.schedule?.day} • {formatTimeTo12Hour(grade.class.schedule?.start_time)} - {formatTimeTo12Hour(grade.class.schedule?.end_time)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500 font-semibold mb-1">Grade Summary</p>
                  <p className="text-gray-900">{grade.semester_grade ? `${grade.semester_grade}%` : ''}</p>
                  <p className="text-xs text-gray-500">Remarks: {grade.remarks || ''}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500 font-semibold mb-1">Submitted</p>
                  <p className="text-gray-900">
                    {formatDateTimeMedium(grade.submitted_for_approval_at)}
                  </p>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-100">
                <p className="text-xs uppercase text-gray-500 font-semibold mb-3">Grade Breakdown</p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                  {[{
                    label: 'First Quarter', value: grade.breakdown?.first_quarter
                  }, {
                    label: 'Second Quarter', value: grade.breakdown?.second_quarter
                  }, {
                    label: 'Third Quarter', value: grade.breakdown?.third_quarter
                  }, {
                    label: 'Fourth Quarter', value: grade.breakdown?.fourth_quarter
                  }, {
                    label: 'Semester', value: grade.breakdown?.semester_grade
                  }].map((entry) => (
                    <div key={entry.label} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">{entry.label}</p>
                      <p className="text-lg font-semibold text-gray-900">{entry.value ?? ''}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50 rounded-b-lg">
                <button
                  type="button"
                  disabled={processingId === grade.id}
                  onClick={() => handleDecision(grade.id, 'reject')}
                  className="px-4 py-2 rounded-md text-sm font-medium border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  type="button"
                  disabled={processingId === grade.id}
                  onClick={() => handleDecision(grade.id, 'approve')}
                  className="px-4 py-2 rounded-md text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  Approve
                </button>
              </div>
            </div>
          ))
        )}
      </main>
    </RegistrarLayout>
  )
}
