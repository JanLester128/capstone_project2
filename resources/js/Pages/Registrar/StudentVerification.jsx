import { useState, useEffect } from 'react'
import { Head, useForm, router, usePage } from '@inertiajs/react'
import Swal from 'sweetalert2'
import { formatDateMedium } from '../../utils/dateFormatter'
import RegistrarLayout from './Layout'

export default function StudentVerification({ unverifiedStudents, verifiedStudents }) {
  const { flash } = usePage().props
  const [activeTab, setActiveTab] = useState('pending')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStudents, setSelectedStudents] = useState([])
  const [isBulkApproving, setIsBulkApproving] = useState(false)
  const detailValueClass = 'text-sm text-gray-900 break-words'

  // Show flash messages
  useEffect(() => {
    if (flash?.success) {
      Swal.fire('Success!', flash.success, 'success')
    }
    if (flash?.error) {
      Swal.fire('Error', flash.error, 'error')
    }
  }, [flash])

  const { data, setData, post, processing, reset } = useForm({
    action: '',
    reason: '',
  })

  // Removed bulkApproveForm - using router.post directly for more reliable submission

  function getLevelLabel(student) {
    // If transferee (from personal info or latest enrollment) or no explicit grade level yet, render blank
    const isTransferee =
      (student?.student_status && String(student.student_status).toLowerCase() === 'transferee') ||
      (student?.latest_enrollment && student.latest_enrollment.is_transferee);
    if (isTransferee || !student?.grade_level) {
      return ''
    }
    return `Grade ${student.grade_level}`
  }

  function handleViewStudent(student) {
    setSelectedStudent(student)
  }

  function handleApprove(student) {
    Swal.fire({
      title: 'Approve Student?',
      text: `Are you sure you want to approve ${student.full_name}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Approve',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        // Use router.post directly to ensure data is sent correctly
        router.post(`/registrar/students/${student.id}/verify`, {
          action: 'approve',
          reason: ''
        }, {
          onStart: () => {
            // Optionally show loading
          },
      onSuccess: () => {
            setSelectedStudent(null)
        reset()
            // Success message will come from backend flash message via useEffect
          },
          onError: (errors) => {
            console.error('Approve error:', errors)
            let errorMessage = 'Failed to approve student. Please try again.'
            if (errors?.action) {
              errorMessage = Array.isArray(errors.action) ? errors.action[0] : errors.action
            } else if (errors?.general) {
              errorMessage = errors.general
            } else if (errors?.message) {
              errorMessage = errors.message
            }
            Swal.fire('Error', errorMessage, 'error')
          }
        })
      }
    })
  }

  function handleReject(student) {
    Swal.fire({
      title: 'Reject Student?',
      text: `Are you sure you want to reject ${student.full_name}? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Reject',
      cancelButtonText: 'Cancel',
      input: 'textarea',
      inputPlaceholder: 'Reason for rejection (optional)',
      inputAttributes: {
        'aria-label': 'Reason for rejection'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        // Use router.post directly to ensure data is sent correctly
        router.post(`/registrar/students/${student.id}/verify`, {
          action: 'reject',
          reason: result.value || ''
        }, {
          onStart: () => {
            // Optionally show loading
          },
          onSuccess: () => {
        setSelectedStudent(null)
            reset()
            // Success message will come from backend flash message via useEffect
          },
          onError: (errors) => {
            console.error('Reject error:', errors)
            let errorMessage = 'Failed to reject student. Please try again.'
            if (errors?.action) {
              errorMessage = Array.isArray(errors.action) ? errors.action[0] : errors.action
            } else if (errors?.general) {
              errorMessage = errors.general
            } else if (errors?.message) {
              errorMessage = errors.message
            }
            Swal.fire('Error', errorMessage, 'error')
          }
        })
      }
    })
  }

  function handleBulkApprove() {
    // Capture current selected students to avoid closure issues
    const currentSelected = [...selectedStudents]
    
    if (currentSelected.length === 0) {
      Swal.fire('No Selection', 'Please select at least one student to approve.', 'warning')
      return
    }

    Swal.fire({
      title: 'Bulk Approve?',
      text: `Are you sure you want to approve ${currentSelected.length} student(s)?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Approve All',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        // Ensure student_ids are integers and filter out any invalid values
        const studentIds = currentSelected
          .map(id => parseInt(id))
          .filter(id => !isNaN(id) && id > 0)
        
        console.log('Submitting student IDs:', studentIds)
        
        if (studentIds.length === 0) {
          Swal.fire('Error', 'No valid student IDs selected.', 'error')
          return
        }

        setIsBulkApproving(true)

        // Submit using router.post directly
        router.post('/registrar/students/bulk-approve', {
          student_ids: studentIds
        }, {
          onSuccess: () => {
            setSelectedStudents([])
    setSelectedStudent(null)
            setIsBulkApproving(false)
            // Success message will come from backend flash message via useEffect
          },
          onError: (errors) => {
            console.error('Bulk approve errors:', errors)
            console.error('Submitted student IDs:', studentIds)
            setIsBulkApproving(false)
            // Get error message from validation errors or general error
            let errorMessage = 'Failed to approve students. Please try again.'
            if (errors?.general) {
              errorMessage = errors.general
            } else if (errors?.student_ids) {
              if (Array.isArray(errors.student_ids)) {
                errorMessage = errors.student_ids[0]
              } else {
                errorMessage = errors.student_ids
              }
            } else if (errors?.student_ids?.[0]) {
              errorMessage = errors.student_ids[0]
            }
            Swal.fire('Error', errorMessage, 'error')
          },
          onFinish: () => {
            setIsBulkApproving(false)
          }
        })
      }
    })
  }

  function handleSelectStudent(studentId) {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId)
      } else {
        return [...prev, studentId]
      }
    })
  }

  function handleSelectAll() {
    if (selectedStudents.length === filteredUnverifiedStudents.length) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(filteredUnverifiedStudents.map(s => s.id))
    }
  }

  // Filter students based on search term
  const filteredUnverifiedStudents = unverifiedStudents.filter(student =>
    student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.lrn?.includes(searchTerm) ||
    student.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const verifiedList = Array.isArray(verifiedStudents?.data) ? verifiedStudents.data : []

  const filteredVerifiedStudents = verifiedList.filter(student =>
    student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.lrn?.includes(searchTerm) ||
    student.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const showingPending = activeTab === 'pending'
  const studentsToDisplay = showingPending ? filteredUnverifiedStudents : filteredVerifiedStudents

  const notificationCount = unverifiedStudents?.length ?? 0

  return (
    <RegistrarLayout>
      <Head title="Registrar • Student Verification" />
      <main className="bg-gray-50">
        <div className="w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm text-gray-500">Manage student registration approvals</p>
              <h1 className="text-2xl font-semibold text-gray-900">Student Verification</h1>
            </div>
            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 self-start">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition ${showingPending ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Pending ({filteredUnverifiedStudents.length})
              </button>
              <button
                onClick={() => setActiveTab('verified')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition ${!showingPending ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Verified ({filteredVerifiedStudents.length})
              </button>
            </div>
          </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-gray-500">Pending</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{filteredUnverifiedStudents.length}</p>
                <p className="text-xs text-gray-500">Awaiting approval</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-gray-500">Verified</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{filteredVerifiedStudents.length}</p>
                <p className="text-xs text-gray-500">Approved students</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-gray-500">Selected</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{selectedStudents.length}</p>
                <p className="text-xs text-gray-500">Ready for bulk action</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-gray-500">Search</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{searchTerm ? 'Filtering' : 'All'}</p>
                <p className="text-xs text-gray-500">{searchTerm ? `Keyword: ${searchTerm}` : 'Showing all results'}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-md">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search by name, LRN, or email"
                  className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              {showingPending && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                  <p className="text-xs text-gray-500 sm:text-sm">Select students to enable bulk approve.</p>
                  <button
                    onClick={handleBulkApprove}
                    disabled={isBulkApproving || selectedStudents.length === 0}
                    className="inline-flex items-center justify-center rounded-lg border border-transparent bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isBulkApproving && (
                      <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    )}
                    Bulk Approve
                  </button>
                </div>
              )}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="bg-white rounded-lg shadow border border-gray-100 flex flex-col">
                {showingPending && filteredUnverifiedStudents.length > 0 && (
                  <div className="flex flex-col gap-2 border-b px-4 py-3 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedStudents.length === filteredUnverifiedStudents.length && filteredUnverifiedStudents.length > 0}
                        onChange={handleSelectAll}
                      />
                      <span>Select all</span>
                    </div>
                    <span className="text-xs text-gray-500">{selectedStudents.length} selected</span>
                  </div>
                )}

                {studentsToDisplay.length === 0 ? (
                  <div className="px-6 py-16 text-center text-sm text-gray-500">
                    <svg className="mx-auto mb-4 h-10 w-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h6" />
                    </svg>
                    {showingPending ? 'No pending students found.' : 'No verified students found.'}
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {studentsToDisplay.map(student => {
                      const initials = `${student.first_name?.[0] || ''}${student.last_name?.[0] || ''}`.trim() || 'NA'
                      const isSelected = selectedStudents.includes(student.id)
                      const isActive = selectedStudent?.id === student.id

                      return (
                        <li
                          key={student.id}
                          onClick={() => handleViewStudent(student)}
                          className={`p-4 flex flex-col gap-4 cursor-pointer transition hover:bg-gray-50 sm:flex-row sm:items-start ${isActive ? 'bg-blue-50/60' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            {showingPending && (
                              <input
                                type="checkbox"
                                onClick={e => e.stopPropagation()}
                                checked={isSelected}
                                onChange={() => handleSelectStudent(student.id)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            )}
                            <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${showingPending ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'} font-semibold`}>
                              {initials}
                            </div>
                          </div>
                          <div className="flex flex-1 flex-col gap-2">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                              <p className="text-base font-semibold text-gray-900 truncate">{student.full_name}</p>
                              {showingPending ? (
                                <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">Pending</span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">Verified</span>
                              )}
                            </div>
                            <div className="grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
                              <div className="flex items-center gap-1">
                                <svg className="h-4 w-4 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                <span className="font-medium text-gray-900">{student.lrn}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <svg className="h-4 w-4 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span className="text-gray-900 truncate">{student.user?.email || 'N/A'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <svg className="h-4 w-4 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10m-9 4h4m-6 4h8a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span>{formatDateMedium(student.created_at)}</span>
                              </div>
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation()
                                  handleViewStudent(student)
                                }}
                                className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                <span className="text-xs font-medium">View Details</span>
                              </button>
                            </div>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>

              <div className="bg-white rounded-lg shadow border border-gray-100 lg:sticky lg:top-6 self-start">
                {selectedStudent ? (
                  <div className="px-5 py-6 space-y-5 break-words">
                  <div className="flex items-center gap-4 border-b pb-4">
                    <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-xl font-semibold text-gray-700">
                      {selectedStudent.first_name?.[0]}{selectedStudent.last_name?.[0]}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{selectedStudent.full_name}</h2>
                      <p className="text-sm text-gray-500">{getLevelLabel(selectedStudent) || 'No level assigned yet'}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Personal Information</h3>
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                      <div>
                        <dt className="text-xs font-medium text-gray-500">LRN</dt>
                        <dd className={`${detailValueClass} font-mono`}>{selectedStudent.lrn}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500">Email</dt>
                        <dd className={detailValueClass}>{selectedStudent.user?.email || 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500">First Name</dt>
                        <dd className={detailValueClass}>{selectedStudent.first_name || 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500">Middle Name</dt>
                        <dd className={detailValueClass}>{selectedStudent.middle_name || 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500">Last Name</dt>
                        <dd className={detailValueClass}>{selectedStudent.last_name || 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500">Suffix</dt>
                        <dd className={detailValueClass}>{selectedStudent.suffix || 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500">Birthdate</dt>
                        <dd className={detailValueClass}>{selectedStudent.date_of_birth ? formatDateMedium(selectedStudent.date_of_birth) : 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500">Sex</dt>
                        <dd className={detailValueClass}>{selectedStudent.sex || 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500">Age</dt>
                        <dd className={detailValueClass}>{selectedStudent.age || 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500">Contact Number</dt>
                        <dd className={detailValueClass}>{selectedStudent.contact_number || 'N/A'}</dd>
                      </div>
                    </dl>
                  </div>

                  {(selectedStudent.address || selectedStudent.municipality || selectedStudent.barangay) && (
                    <div className="space-y-3 border-t pt-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Address</h3>
                      <dl className="space-y-3">
                        {selectedStudent.address && (
                          <div>
                            <dt className="text-xs font-medium text-gray-500">Street</dt>
                            <dd className={detailValueClass}>{selectedStudent.address}</dd>
                          </div>
                        )}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {selectedStudent.barangay && (
                            <div>
                              <dt className="text-xs font-medium text-gray-500">Barangay</dt>
                              <dd className={detailValueClass}>{selectedStudent.barangay}</dd>
                            </div>
                          )}
                          {selectedStudent.municipality && (
                            <div>
                              <dt className="text-xs font-medium text-gray-500">Municipality</dt>
                              <dd className={detailValueClass}>{selectedStudent.municipality}</dd>
                            </div>
                          )}
                          {selectedStudent.zip_code && (
                            <div>
                              <dt className="text-xs font-medium text-gray-500">Zip Code</dt>
                              <dd className={detailValueClass}>{selectedStudent.zip_code}</dd>
                            </div>
                          )}
                        </div>
                      </dl>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <dt className="text-xs font-medium text-gray-500">Registration Date</dt>
                    <dd className={detailValueClass}>{formatDateMedium(selectedStudent.created_at)}</dd>
                  </div>

                  {showingPending && (
                    <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row">
                      <button
                        onClick={() => handleApprove(selectedStudent)}
                        disabled={processing}
                        className="inline-flex flex-1 items-center justify-center rounded-lg border border-transparent bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Approve Student
                      </button>
                      <button
                        onClick={() => handleReject(selectedStudent)}
                        disabled={processing}
                        className="inline-flex flex-1 items-center justify-center rounded-lg border border-transparent bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Reject Student
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="px-6 py-16 text-center text-sm text-gray-500">
                  Select a student to view their details.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </RegistrarLayout>
  )
}