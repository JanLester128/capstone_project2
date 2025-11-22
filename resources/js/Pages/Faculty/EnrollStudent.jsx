import React, { useState, useMemo, useEffect } from 'react'
import { Head, router, usePage } from '@inertiajs/react'
import FacultySidebar from '../Auth/Faculty_sidebar'
import axios from 'axios'

const formatTimeTo12Hour = (time24) => {
  if (!time24) return ''
  const [hours, minutes] = time24.split(':')
  const hour = parseInt(hours, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${hour12}:${minutes} ${ampm}`
}

export default function EnrollStudent ({
  student,
  currentTermEnrollment = null,
  latestEnrollment,
  failedGrades = [],
  hasFailedPrerequisites = false,
  needsSummerClasses = false,
  canReEnrollToSameStrand = true,
  warnings = [],
  activeSchoolYear,
  activeSemester,
  strands = [],
  sections = [],
  user
}) {
  const { flash } = usePage().props

  const [formData, setFormData] = useState({
    assigned_strand_id:
      canReEnrollToSameStrand && latestEnrollment?.assigned_strand?.id
        ? latestEnrollment.assigned_strand.id.toString()
        : '',
    assigned_section_id:
      canReEnrollToSameStrand && latestEnrollment?.assigned_section?.id
        ? latestEnrollment.assigned_section.id.toString()
        : ''
  })
  const [formErrors, setFormErrors] = useState({})
  const [processing, setProcessing] = useState(false)
  const [previewSchedule, setPreviewSchedule] = useState([])
  const [loadingPreview, setLoadingPreview] = useState(false)

  const filteredSections = useMemo(() => {
    if (!formData.assigned_strand_id) return []
    const parsedStrandId = parseInt(formData.assigned_strand_id, 10)
    return sections.filter((section) => section.strand_id === parsedStrandId)
  }, [formData.assigned_strand_id, sections])

  useEffect(() => {
    if (formData.assigned_section_id && activeSchoolYear && activeSemester) {
      setLoadingPreview(true)
      axios
        .get(`/api/sections/${formData.assigned_section_id}/schedule-preview`, {
          params: {
            school_year_id: activeSchoolYear.id,
            semester_id: activeSemester.id
          }
        })
        .then((response) => {
          setPreviewSchedule(response.data.classes || [])
        })
        .catch(() => {
          setPreviewSchedule([])
        })
        .finally(() => {
          setLoadingPreview(false)
        })
    } else {
      setPreviewSchedule([])
    }
  }, [formData.assigned_section_id, activeSchoolYear, activeSemester])

  const validateForm = () => {
    const errors = {}
    if (!formData.assigned_strand_id) errors.assigned_strand_id = 'Please select a strand'
    if (!formData.assigned_section_id) errors.assigned_section_id = 'Please select a section'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!validateForm()) return
    if (!activeSchoolYear || !activeSemester) {
      alert('No active school year or semester found.')
      return
    }

    setProcessing(true)
    router.post(
      '/faculty/enrollments/re-enroll-auto',
      {
        student_info_id: student.id,
        school_year_id: activeSchoolYear.id,
        semester_id: activeSemester.id,
        assigned_strand_id: formData.assigned_strand_id,
        assigned_section_id: formData.assigned_section_id
      },
      {
        onSuccess: () => {
          window.location.reload()
        },
        onError: (errors) => {
          if (errors.message) {
            alert(errors.message)
          }
          setFormErrors(errors)
        },
        onFinish: () => setProcessing(false)
      }
    )
  }

  const stripos = (haystack, needle) => {
    return haystack?.toLowerCase().includes(needle?.toLowerCase())
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Head title={`Enroll ${student.name} - Coordinator`} />
      <FacultySidebar user={user} />

      <div className="flex flex-1 flex-col overflow-hidden">
        {(flash?.success || flash?.error) && (
          <div className="px-6 pt-4">
            {flash?.success && (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                {flash.success}
              </div>
            )}
            {flash?.error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414-1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                {flash.error}
              </div>
            )}
          </div>
        )}

        <header className="border-b border-gray-200 bg-white px-6 py-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <a
                  href="/faculty/re-enroll-students"
                  className="inline-flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  title="Back to Re-Enroll Students"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </a>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Enroll Student</h1>
                  <p className="text-sm text-gray-600 mt-1">Assign strand and section for re-enrollment</p>
                </div>
              </div>
            </div>
            {activeSchoolYear && activeSemester && (
              <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2">
                <p className="text-xs font-semibold text-indigo-600 uppercase">Target Term</p>
                <p className="text-sm font-bold text-indigo-900">
                  {activeSchoolYear.label} • {activeSemester.label}
                </p>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-hidden">
          <div className="h-full flex">
            <div className="w-1/2 overflow-y-auto border-r border-gray-200 p-6">
              <div className="max-w-2xl space-y-6">
                {currentTermEnrollment && (
                  <div className='bg-green-50 border border-green-200 rounded-xl p-6'>
                    <div className='flex items-start gap-4'>
                      <div className="flex-shrink-0">
                        <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className='text-lg font-bold text-green-900 mb-1'>Student Already Enrolled</h3>
                        <p className='text-sm text-green-800'>
                          This student is already enrolled for the current term ({activeSchoolYear?.label} • {activeSemester?.label}).
                          View the COR on the right side.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Student Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">Name</p>
                      <p className="text-sm font-medium text-gray-900">{student.name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">LRN</p>
                      <p className="text-sm font-medium text-gray-900">{student.lrn || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">Email</p>
                      <p className="text-sm font-medium text-gray-900">{student.email}</p>
                    </div>
                    {latestEnrollment && (
                      <>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase">Previous Strand</p>
                          <p className="text-sm font-medium text-gray-900">
                            {latestEnrollment.assigned_strand.Strand_code} - {latestEnrollment.assigned_strand.Strand_name}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase">Previous Section</p>
                          <p className="text-sm font-medium text-gray-900">
                            {latestEnrollment.assigned_section.section_name}
                            {latestEnrollment.assigned_section.year_level && ` (Grade ${latestEnrollment.assigned_section.year_level})`}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase">Previous Term</p>
                          <p className="text-sm font-medium text-gray-900">
                            {latestEnrollment.school_year.label} • {latestEnrollment.semester.label}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {warnings.length > 0 && (
                  <div className="space-y-3">
                    {warnings.map((warning, idx) => (
                      <div
                        key={idx}
                        className={`rounded-lg border p-4 flex items-start gap-3 ${
                          hasFailedPrerequisites || !canReEnrollToSameStrand
                            ? 'border-red-300 bg-red-50 text-red-800'
                            : 'border-amber-300 bg-amber-50 text-amber-800'
                        }`}
                      >
                        <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{warning}</p>
                          {failedGrades.length > 0 && idx === 0 && (
                            <div className="mt-3 text-xs">
                              <p className="font-bold mb-2">Failed Subjects:</p>
                              <ul className="space-y-1">
                                {failedGrades.map((grade, gIdx) => (
                                  <li key={gIdx} className="flex items-center gap-2">
                                    <span className="inline-block w-2 h-2 bg-current rounded-full"></span>
                                    <span>
                                      {grade.subject_code} - {grade.subject_name} ({grade.grade})
                                      {grade.is_prerequisite && (
                                        <span className="ml-2 font-bold">[Prerequisite]</span>
                                      )}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!currentTermEnrollment && (
                  <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Strand & Section Assignment</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Strand <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.assigned_strand_id}
                          onChange={(e) => {
                            setFormData({ ...formData, assigned_strand_id: e.target.value, assigned_section_id: '' })
                            setFormErrors((prev) => ({ ...prev, assigned_strand_id: undefined }))
                          }}
                          className={`w-full rounded-lg border ${
                            formErrors.assigned_strand_id ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          } px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500`}
                        >
                          <option value="">Select strand...</option>
                          {strands.map((strand) => {
                            const isSTEM = stripos(strand.Strand_code, 'STEM')
                            const isCurrentStrand = latestEnrollment?.assigned_strand?.id === strand.id
                            const disabled = isSTEM && isCurrentStrand && !canReEnrollToSameStrand
                            return (
                              <option key={strand.id} value={strand.id} disabled={disabled}>
                                {strand.Strand_code} - {strand.Strand_name}
                                {disabled ? ' (Not available - must change strand)' : ''}
                              </option>
                            )
                          })}
                        </select>
                        {formErrors.assigned_strand_id && (
                          <p className="mt-1 text-xs text-red-600">{formErrors.assigned_strand_id}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Section <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.assigned_section_id}
                          onChange={(e) => {
                            setFormData({ ...formData, assigned_section_id: e.target.value })
                            setFormErrors((prev) => ({ ...prev, assigned_section_id: undefined }))
                          }}
                          disabled={!formData.assigned_strand_id}
                          className={`w-full rounded-lg border ${
                            formErrors.assigned_section_id ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          } px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-100`}
                        >
                          <option value="">
                            {!formData.assigned_strand_id
                              ? 'Select strand first...'
                              : filteredSections.length === 0
                                ? 'No sections available'
                                : 'Select section...'}
                          </option>
                          {filteredSections.map((section) => (
                            <option key={section.id} value={section.id}>
                              {section.section_name}
                              {section.year_level ? ` (Grade ${section.year_level})` : ''}
                            </option>
                          ))}
                        </select>
                        {formErrors.assigned_section_id && (
                          <p className="mt-1 text-xs text-red-600">{formErrors.assigned_section_id}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                      <a
                        href="/faculty/re-enroll-students"
                        className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </a>
                      <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                      >
                        {processing ? (
                          <>
                            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            Enrolling...
                          </>
                        ) : (
                          <>
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Confirm Enrollment
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            <div className="w-1/2 overflow-y-auto bg-gray-50">
              {currentTermEnrollment ? (
                <div className="relative h-full flex flex-col">
                  <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 0 1 2-2h6l4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4Z" />
                      </svg>
                      Certificate of Registration
                    </h2>
                    <a
                      href={`/enrollments/${currentTermEnrollment.id}/cor`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Open in New Tab
                    </a>
                  </div>
                  <iframe
                    src={`/enrollments/${currentTermEnrollment.id}/cor`}
                    className="flex-1 w-full border-0"
                    title="Certificate of Registration"
                  />
                </div>
              ) : (
                <div className="p-6">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      Schedule Preview
                    </h2>

                    {loadingPreview ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <svg
                            className="w-8 h-8 animate-spin text-indigo-600"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          <p className="text-sm text-gray-600">Loading schedule...</p>
                        </div>
                      </div>
                    ) : previewSchedule.length > 0 ? (
                      <div className="space-y-4">
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-4">
                          <p className="text-sm text-indigo-800">
                            <strong>Note:</strong> This is a preview of the schedule for the selected section. Confirm enrollment to finalize.
                          </p>
                        </div>

                        {Object.entries(
                          previewSchedule.reduce((acc, cls) => {
                            const day = cls.day_of_week
                            if (!acc[day]) acc[day] = []
                            acc[day].push(cls)
                            return acc
                          }, {})
                        )
                          .sort(([dayA], [dayB]) => {
                            const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
                            return dayOrder.indexOf(dayA) - dayOrder.indexOf(dayB)
                          })
                          .map(([day, classes]) => (
                            <div key={day} className="border-l-4 border-indigo-500 pl-4">
                              <h3 className="font-semibold text-gray-900 mb-2">{day}</h3>
                              <div className="space-y-2">
                                {classes
                                  .sort((a, b) => a.start_time.localeCompare(b.start_time))
                                  .map((cls, idx) => (
                                    <div key={idx} className="bg-gray-50 rounded-md p-3 border border-gray-200">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <p className="font-medium text-gray-900">{cls.subject_name}</p>
                                          <p className="text-xs text-gray-600">{cls.subject_code}</p>
                                          <p className="text-sm text-gray-700 mt-1">
                                            <span className="inline-flex items-center gap-1">
                                              <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  strokeWidth={2}
                                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                                />
                                              </svg>
                                              {cls.faculty_name}
                                            </span>
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-sm font-semibold text-indigo-600">
                                            {formatTimeTo12Hour(cls.start_time)} - {formatTimeTo12Hour(cls.end_time)}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <svg
                          className="w-16 h-16 text-gray-400 mx-auto mb-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                        <h3 className="text-base font-semibold text-gray-700 mb-2">No Schedule Yet</h3>
                        <p className="text-sm text-gray-500 max-w-md mx-auto">
                          {formData.assigned_section_id
                            ? 'No classes have been scheduled for this section yet.'
                            : 'Select a strand and section to preview the class schedule.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
