import { useState } from 'react'
import { Head, useForm } from '@inertiajs/react'
import RegistrarSidebar from '../Auth/Registrar_sidebar'

export default function StudentVerification({ unverifiedStudents, verifiedStudents }) {
  const [activeTab, setActiveTab] = useState('pending')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const { data, setData, post, processing, reset } = useForm({
    action: '',
    reason: '',
  })

  function handleVerification(student, action) {
    setSelectedStudent(student)
    setData('action', action)
    setShowModal(true)
  }

  function submitVerification(e) {
    e.preventDefault()
    post(`/registrar/students/${selectedStudent.id}/verify`, {
      onSuccess: () => {
        setShowModal(false)
        reset()
        setSelectedStudent(null)
      }
    })
  }

  function closeModal() {
    setShowModal(false)
    reset()
    setSelectedStudent(null)
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
                onClick={() => setActiveTab('pending')}
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
                onClick={() => setActiveTab('verified')}
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

          {/* Pending Verification Tab */}
          {activeTab === 'pending' && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Students Awaiting Verification
                </h3>
                
                {filteredUnverifiedStudents.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No pending verifications</h3>
                    <p className="mt-1 text-sm text-gray-500">All student registrations have been processed.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredUnverifiedStudents.map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center flex-1 min-w-0">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {student.first_name?.[0]}{student.last_name?.[0]}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4 flex-1 min-w-0">
                            <div className="flex items-center space-x-4">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {student.full_name}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  Grade {student.grade_level}
                                </p>
                              </div>
                              <div className="hidden sm:block text-sm text-gray-500 font-mono">
                                {student.lrn}
                              </div>
                              <div className="hidden md:block text-sm text-gray-500 truncate max-w-xs">
                                {student.user?.email}
                              </div>
                              <div className="hidden lg:block text-sm text-gray-500">
                                {new Date(student.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleVerification(student, 'approve')}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="hidden sm:inline">Approve</span>
                            <span className="sm:hidden">✓</span>
                          </button>
                          <button
                            onClick={() => handleVerification(student, 'reject')}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span className="hidden sm:inline">Reject</span>
                            <span className="sm:hidden">✕</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Verified Students Tab */}
          {activeTab === 'verified' && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Verified Students
                </h3>
                
                {filteredVerifiedStudents.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No verified students</h3>
                    <p className="mt-1 text-sm text-gray-500">Verified students will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredVerifiedStudents.map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center flex-1 min-w-0">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                          <div className="ml-4 flex-1 min-w-0">
                            <div className="flex items-center space-x-4">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {student.full_name}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  Grade {student.grade_level}
                                </p>
                              </div>
                              <div className="hidden sm:block text-sm text-gray-500 font-mono">
                                {student.lrn}
                              </div>
                              <div className="hidden md:block text-sm text-gray-500 truncate max-w-xs">
                                {student.user?.email}
                              </div>
                              <div className="hidden lg:block text-sm text-gray-500">
                                {new Date(student.verified_at).toLocaleDateString()}
                              </div>
                              <div className="hidden xl:block text-sm text-gray-500">
                                {student.verified_by?.FirstName} {student.verified_by?.LastName}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center ml-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Verified
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Verification Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative mx-auto p-4 lg:p-5 border w-full max-w-md shadow-lg rounded-lg bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-center mx-auto w-12 h-12 rounded-full bg-yellow-100">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="mt-2 px-3 lg:px-7 py-3">
                <h3 className="text-base lg:text-lg font-medium text-gray-900 text-center">
                  {data.action === 'approve' ? 'Approve Student' : 'Reject Student'}
                </h3>
                <p className="text-xs lg:text-sm text-gray-500 mt-2 text-center">
                  Are you sure you want to {data.action} the registration for{' '}
                  <span className="font-medium">{selectedStudent?.full_name}</span>?
                </p>
                
                {data.action === 'reject' && (
                  <div className="mt-4">
                    <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">
                      Reason for rejection (optional)
                    </label>
                    <textarea
                      value={data.reason}
                      onChange={(e) => setData('reason', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      rows="3"
                      placeholder="Enter reason for rejection..."
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center px-3 lg:px-4 py-3 space-x-2 lg:space-x-3">
                <button
                  onClick={closeModal}
                  className="flex-1 px-3 lg:px-4 py-2 bg-gray-300 text-gray-700 text-sm lg:text-base font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={submitVerification}
                  disabled={processing}
                  className={`flex-1 px-3 lg:px-4 py-2 text-white text-sm lg:text-base font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    data.action === 'approve'
                      ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                      : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                  } disabled:opacity-50`}
                >
                  {processing ? 'Processing...' : (data.action === 'approve' ? 'Approve' : 'Reject')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
