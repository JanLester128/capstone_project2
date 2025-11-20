import { useState, useEffect } from 'react'
import { Head, useForm, router, usePage } from '@inertiajs/react'
import RegistrarSidebar from '../Auth/Registrar_sidebar'
import { formatDateMedium } from '../../utils/dateFormatter'
import Swal from 'sweetalert2'

export default function StudentVerification({ unverifiedStudents, verifiedStudents }) {
  const { flash } = usePage().props
  const [activeTab, setActiveTab] = useState('pending')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStudents, setSelectedStudents] = useState([])
  const [isBulkApproving, setIsBulkApproving] = useState(false)

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
        setData('action', 'approve')
        post(`/registrar/students/${student.id}/verify`, {
          onSuccess: () => {
            setSelectedStudent(null)
            reset()
            Swal.fire('Approved!', 'Student has been verified and approved.', 'success')
          },
          onError: () => {
            Swal.fire('Error', 'Failed to approve student. Please try again.', 'error')
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
      },
      showCancelButton: true
    }).then((result) => {
      if (result.isConfirmed) {
        setData('action', 'reject')
        setData('reason', result.value || '')
        post(`/registrar/students/${student.id}/verify`, {
          onSuccess: () => {
            setSelectedStudent(null)
            reset()
            Swal.fire('Rejected!', 'Student registration has been rejected and removed.', 'success')
          },
          onError: () => {
            Swal.fire('Error', 'Failed to reject student. Please try again.', 'error')
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

  const filteredVerifiedStudents = verifiedStudents.data.filter(student =>
    student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.lrn?.includes(searchTerm) ||
    student.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      <RegistrarSidebar />
      <div className="flex-1 lg:ml-0">
        <Head title="Student Verification" />
      
      <div className="py-4 lg:py-6">
        <div className="max-w-full mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
          {/* Header */}
          <div className="mb-4 lg:mb-6">
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Student Account Verification</h1>
            <p className="mt-1 text-xs lg:text-sm text-gray-600">
              Review and verify student registrations based on their LRN and email information.
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-4 lg:mb-6">
            <div className="relative max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by name, LRN, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-4 lg:mb-6">
            <nav className="-mb-px flex space-x-4 lg:space-x-8 overflow-x-auto">
              <button
                onClick={() => {
                  setActiveTab('pending')
                  setSelectedStudent(null)
                  setSelectedStudents([])
                }}
                className={`py-2 px-2 lg:px-1 border-b-2 font-medium text-xs lg:text-sm whitespace-nowrap ${
                  activeTab === 'pending'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Pending Verification
                {filteredUnverifiedStudents.length > 0 && (
                  <span className="ml-1 lg:ml-2 bg-red-100 text-red-600 py-0.5 px-1.5 lg:px-2 rounded-full text-xs font-medium">
                    {filteredUnverifiedStudents.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  setActiveTab('verified')
                  setSelectedStudent(null)
                  setSelectedStudents([])
                }}
                className={`py-2 px-2 lg:px-1 border-b-2 font-medium text-xs lg:text-sm whitespace-nowrap ${
                  activeTab === 'verified'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Verified Students
              </button>
            </nav>
          </div>

          {/* Split View Container */}
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            {/* Left Side - List */}
            <div className={`${selectedStudent ? 'lg:w-1/2' : 'w-full'} bg-white shadow rounded-lg`}>
              <div className="px-4 py-5 sm:p-6">
                {/* Bulk Actions for Pending Tab */}
                {activeTab === 'pending' && filteredUnverifiedStudents.length > 0 && (
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedStudents.length === filteredUnverifiedStudents.length && filteredUnverifiedStudents.length > 0}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">
                        Select All ({selectedStudents.length} selected)
                      </span>
                    </div>
                    {selectedStudents.length > 0 && (
                      <button
                        onClick={handleBulkApprove}
                        disabled={isBulkApproving}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Bulk Approve ({selectedStudents.length})
                      </button>
                    )}
                  </div>
                )}

                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  {activeTab === 'pending' ? 'Students Awaiting Verification' : 'Verified Students'}
                </h3>
                
                {activeTab === 'pending' && filteredUnverifiedStudents.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No pending verifications</h3>
                    <p className="mt-1 text-sm text-gray-500">All student registrations have been processed.</p>
                  </div>
                ) : activeTab === 'verified' && filteredVerifiedStudents.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No verified students</h3>
                    <p className="mt-1 text-sm text-gray-500">Verified students will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {(activeTab === 'pending' ? filteredUnverifiedStudents : filteredVerifiedStudents).map((student) => (
                      <div 
                        key={student.id} 
                        className={`flex items-center justify-between p-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors ${
                          selectedStudent?.id === student.id ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                        onClick={() => handleViewStudent(student)}
                      >
                        <div className="flex items-center flex-1 min-w-0">
                          {/* Checkbox for bulk selection (pending tab only) */}
                          {activeTab === 'pending' && (
                            <input
                              type="checkbox"
                              checked={selectedStudents.includes(student.id)}
                              onChange={(e) => {
                                e.stopPropagation()
                                handleSelectStudent(student.id)
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                            />
                          )}
                          
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                              activeTab === 'pending' ? 'bg-gray-300' : 'bg-green-100'
                            }`}>
                              {activeTab === 'verified' ? (
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <span className="text-sm font-medium text-gray-700">
                                  {student.first_name?.[0]}{student.last_name?.[0]}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="ml-4 flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {student.full_name}
                            </p>
                            <p className="text-xs text-gray-500 font-mono">
                              LRN: {student.lrn}
                            </p>
                          </div>
                        </div>
                        {activeTab === 'pending' && (
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleViewStudent(student)
                              }}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              <span className="hidden sm:inline">View</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Details Card */}
            {selectedStudent && (
              <div className="lg:w-1/2 bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Student Details</h3>
                    <button
                      onClick={() => setSelectedStudent(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Profile Section */}
                    <div className="flex items-center space-x-4 pb-4 border-b">
                      <div className="flex-shrink-0 h-16 w-16">
                        <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-xl font-medium text-gray-700">
                            {selectedStudent.first_name?.[0]}{selectedStudent.last_name?.[0]}
                          </span>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{selectedStudent.full_name}</h4>
                        <p className="text-sm text-gray-500">{getLevelLabel(selectedStudent)}</p>
                      </div>
                    </div>

                    {/* Personal Information */}
                    <div className="space-y-3">
                      <h5 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Personal Information</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs font-medium text-gray-500">LRN</p>
                          <p className="text-sm text-gray-900 font-mono">{selectedStudent.lrn}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500">Email</p>
                          <p className="text-sm text-gray-900">{selectedStudent.user?.email || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500">First Name</p>
                          <p className="text-sm text-gray-900">{selectedStudent.first_name || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500">Middle Name</p>
                          <p className="text-sm text-gray-900">{selectedStudent.middle_name || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500">Last Name</p>
                          <p className="text-sm text-gray-900">{selectedStudent.last_name || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500">Suffix</p>
                          <p className="text-sm text-gray-900">{selectedStudent.suffix || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500">Date of Birth</p>
                          <p className="text-sm text-gray-900">{selectedStudent.date_of_birth ? formatDateMedium(selectedStudent.date_of_birth) : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500">Sex</p>
                          <p className="text-sm text-gray-900">{selectedStudent.sex || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500">Age</p>
                          <p className="text-sm text-gray-900">{selectedStudent.age || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500">Contact Number</p>
                          <p className="text-sm text-gray-900">{selectedStudent.contact_number || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Address Information */}
                    {(selectedStudent.address || selectedStudent.municipality || selectedStudent.barangay) && (
                      <div className="space-y-3 pt-4 border-t">
                        <h5 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Address</h5>
                        <div className="space-y-2">
                          {selectedStudent.address && (
                            <div>
                              <p className="text-xs font-medium text-gray-500">Street Address</p>
                              <p className="text-sm text-gray-900">{selectedStudent.address}</p>
                            </div>
                          )}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {selectedStudent.barangay && (
                              <div>
                                <p className="text-xs font-medium text-gray-500">Barangay</p>
                                <p className="text-sm text-gray-900">{selectedStudent.barangay}</p>
                              </div>
                            )}
                            {selectedStudent.municipality && (
                              <div>
                                <p className="text-xs font-medium text-gray-500">Municipality</p>
                                <p className="text-sm text-gray-900">{selectedStudent.municipality}</p>
                              </div>
                            )}
                            {selectedStudent.zip_code && (
                              <div>
                                <p className="text-xs font-medium text-gray-500">Zip Code</p>
                                <p className="text-sm text-gray-900">{selectedStudent.zip_code}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Registration Date */}
                    <div className="pt-4 border-t">
                      <p className="text-xs font-medium text-gray-500">Registration Date</p>
                      <p className="text-sm text-gray-900">{formatDateMedium(selectedStudent.created_at)}</p>
                    </div>

                    {/* Action Buttons (only for pending tab) */}
                    {activeTab === 'pending' && (
                      <div className="pt-4 border-t flex space-x-3">
                        <button
                          onClick={() => handleApprove(selectedStudent)}
                          disabled={processing}
                          className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(selectedStudent)}
                          disabled={processing}
                          className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
