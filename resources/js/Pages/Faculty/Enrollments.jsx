import { useState } from 'react'
import { Head, router } from '@inertiajs/react'
import FacultySidebar from '../Auth/Faculty_sidebar'

export default function Enrollments({ enrollments = [], strands = [], user }) {
  const [processing, setProcessing] = useState(null)
  const [selectedEnrollment, setSelectedEnrollment] = useState(null)
  const [assignmentData, setAssignmentData] = useState({
    assigned_strand_id: '',
    assigned_section_id: '',
    notes: ''
  })

  const handleStatusUpdate = (enrollmentId, status) => {
    if (status === 'approved') {
      // For approval, open assignment modal
      const enrollment = enrollments.find(e => e.id === enrollmentId)
      setSelectedEnrollment(enrollment)
      
      // Pre-select first choice strand if available
      const firstChoice = enrollment.student_personal_info?.strand_preferences?.[0]
      if (firstChoice) {
        setAssignmentData(prev => ({
          ...prev,
          assigned_strand_id: firstChoice.strand.id.toString(),
          assigned_section_id: ''
        }))
      }
    } else {
      // For rejection, proceed directly
      setProcessing(enrollmentId)
      
      router.put(`/faculty/enrollments/${enrollmentId}/status`, {
        status: status,
      }, {
        onFinish: () => setProcessing(null),
        onSuccess: () => {
          // Success message will be handled by the backend
        },
        onError: (errors) => {
          console.error('Error updating enrollment:', errors)
        }
      })
    }
  }

  const handleApprovalSubmit = () => {
    if (!assignmentData.assigned_strand_id || !assignmentData.assigned_section_id) {
      alert('Please select both strand and section before approving.')
      return
    }

    setProcessing(selectedEnrollment.id)
    
    router.put(`/faculty/enrollments/${selectedEnrollment.id}/status`, {
      status: 'approved',
      assigned_strand_id: assignmentData.assigned_strand_id,
      assigned_section_id: assignmentData.assigned_section_id,
      notes: assignmentData.notes
    }, {
      onFinish: () => {
        setProcessing(null)
        setSelectedEnrollment(null)
        setAssignmentData({ assigned_strand_id: '', assigned_section_id: '', notes: '' })
      },
      onSuccess: () => {
        // Success message will be handled by the backend
      },
      onError: (errors) => {
        console.error('Error updating enrollment:', errors)
      }
    })
  }

  const getAvailableSections = () => {
    if (!assignmentData.assigned_strand_id) return []
    const selectedStrand = strands.find(s => s.id.toString() === assignmentData.assigned_strand_id)
    return selectedStrand?.sections || []
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'enrolled': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <FacultySidebar user={user} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Head title="Pending Enrollments - Faculty" />
        
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Pending Enrollments</h1>
              <p className="text-sm text-gray-600 mt-1">
                Review and process student enrollment applications
              </p>
            </div>
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
              <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-blue-700">Coordinator Mode</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {enrollments.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No pending enrollments</h3>
              <p className="mt-1 text-sm text-gray-500">
                There are currently no student enrollment applications to review.
              </p>
            </div>
          ) : (
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Enrollment Applications ({enrollments.length})
                </h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Strand Preferences
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        School Year
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {enrollments.map((enrollment) => (
                      <tr key={enrollment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-700">
                                  {enrollment.student_personal_info?.user?.FirstName?.[0]}
                                  {enrollment.student_personal_info?.user?.LastName?.[0]}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {enrollment.student_personal_info?.user?.FirstName} {enrollment.student_personal_info?.user?.LastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {enrollment.student_personal_info?.user?.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            {enrollment.student_personal_info?.strand_preferences?.map((pref, index) => (
                              <div key={index} className="flex items-center text-xs">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium mr-2 ${
                                  index === 0 ? 'bg-green-100 text-green-800' : 
                                  index === 1 ? 'bg-blue-100 text-blue-800' : 
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {index + 1}
                                </span>
                                <span className="text-gray-900">{pref.strand?.Strand_name}</span>
                              </div>
                            )) || <span className="text-gray-400 text-xs">No preferences</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {enrollment.school_year?.School_year_start}-{enrollment.school_year?.School_year_end}
                          </div>
                          <div className="text-sm text-gray-500">
                            {enrollment.semester?.semester_type}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(enrollment.submitted_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(enrollment.status)}`}>
                            {enrollment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          {enrollment.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(enrollment.id, 'approved')}
                                disabled={processing === enrollment.id}
                                className="text-green-600 hover:text-green-900 disabled:opacity-50"
                              >
                                {processing === enrollment.id ? 'Processing...' : 'Approve'}
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(enrollment.id, 'rejected')}
                                disabled={processing === enrollment.id}
                                className="text-red-600 hover:text-red-900 disabled:opacity-50"
                              >
                                {processing === enrollment.id ? 'Processing...' : 'Reject'}
                              </button>
                            </>
                          )}
                          {enrollment.status !== 'pending' && (
                            <span className="text-gray-400">No actions available</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Assignment Modal */}
      {selectedEnrollment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-lg bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Approve Enrollment - Assign Strand & Section
              </h3>
              <button
                onClick={() => {
                  setSelectedEnrollment(null)
                  setAssignmentData({ assigned_strand_id: '', assigned_section_id: '', notes: '' })
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-2">Student Information</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">Name:</span> {selectedEnrollment.student_personal_info?.user?.FirstName} {selectedEnrollment.student_personal_info?.user?.LastName}
                </p>
                <p className="text-sm mt-1">
                  <span className="font-medium">Email:</span> {selectedEnrollment.student_personal_info?.user?.email}
                </p>
                <div className="mt-2">
                  <span className="font-medium text-sm">Strand Preferences:</span>
                  <div className="mt-1 space-y-1">
                    {selectedEnrollment.student_personal_info?.strand_preferences?.map((pref, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mr-2 ${
                          index === 0 ? 'bg-green-100 text-green-800' : 
                          index === 1 ? 'bg-blue-100 text-blue-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {index === 0 ? '1st Choice' : index === 1 ? '2nd Choice' : '3rd Choice'}
                        </span>
                        <span>{pref.strand?.Strand_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign Strand <span className="text-red-500">*</span>
                </label>
                <select
                  value={assignmentData.assigned_strand_id}
                  onChange={(e) => setAssignmentData(prev => ({
                    ...prev,
                    assigned_strand_id: e.target.value,
                    assigned_section_id: '' // Reset section when strand changes
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a strand...</option>
                  {strands.map(strand => (
                    <option key={strand.id} value={strand.id}>
                      {strand.Strand_name} ({strand.Strand_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign Section <span className="text-red-500">*</span>
                </label>
                <select
                  value={assignmentData.assigned_section_id}
                  onChange={(e) => setAssignmentData(prev => ({
                    ...prev,
                    assigned_section_id: e.target.value
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={!assignmentData.assigned_strand_id}
                >
                  <option value="">Select a section...</option>
                  {getAvailableSections().map(section => (
                    <option key={section.id} value={section.id}>
                      {section.section_name}
                    </option>
                  ))}
                </select>
                {!assignmentData.assigned_strand_id && (
                  <p className="text-sm text-gray-500 mt-1">Please select a strand first</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={assignmentData.notes}
                  onChange={(e) => setAssignmentData(prev => ({
                    ...prev,
                    notes: e.target.value
                  }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add any notes about the assignment..."
                  maxLength={500}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setSelectedEnrollment(null)
                  setAssignmentData({ assigned_strand_id: '', assigned_section_id: '', notes: '' })
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                disabled={processing === selectedEnrollment?.id}
              >
                Cancel
              </button>
              <button
                onClick={handleApprovalSubmit}
                disabled={processing === selectedEnrollment?.id || !assignmentData.assigned_strand_id || !assignmentData.assigned_section_id}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing === selectedEnrollment?.id ? 'Processing...' : 'Approve & Assign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
