import { useState } from 'react'
import { Head, router } from '@inertiajs/react'
import RegistrarSidebar from '../Auth/Registrar_sidebar'

export default function Enrollments({ enrollments = [] }) {
  const [processing, setProcessing] = useState(null)
  const [filter, setFilter] = useState('all')

  const handleStatusUpdate = (enrollmentId, status) => {
    setProcessing(enrollmentId)
    
    router.put(`/registrar/enrollments/${enrollmentId}/status`, {
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'enrolled': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredEnrollments = enrollments.filter(enrollment => {
    if (filter === 'all') return true
    return enrollment.status === filter
  })

  const statusCounts = {
    all: enrollments.length,
    pending: enrollments.filter(e => e.status === 'pending').length,
    approved: enrollments.filter(e => e.status === 'approved').length,
    rejected: enrollments.filter(e => e.status === 'rejected').length,
    enrolled: enrollments.filter(e => e.status === 'enrolled').length,
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <RegistrarSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Head title="Student Enrollments - Registrar" />
        
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Student Enrollments</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage all student enrollment applications
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Total: <span className="font-semibold">{enrollments.length}</span> applications
              </div>
            </div>
          </div>
        </header>

        {/* Filters */}
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex space-x-1">
            {[
              { key: 'all', label: 'All', count: statusCounts.all },
              { key: 'pending', label: 'Pending', count: statusCounts.pending },
              { key: 'approved', label: 'Approved', count: statusCounts.approved },
              { key: 'enrolled', label: 'Enrolled', count: statusCounts.enrolled },
              { key: 'rejected', label: 'Rejected', count: statusCounts.rejected },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-3 py-2 text-sm font-medium rounded-md transition ${
                  filter === tab.key
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {filteredEnrollments.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No {filter === 'all' ? '' : filter} enrollments
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter === 'all' 
                  ? 'There are currently no enrollment applications.'
                  : `There are no ${filter} enrollment applications.`
                }
              </p>
            </div>
          ) : (
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)} Enrollments ({filteredEnrollments.length})
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
                        School Year
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Processed By
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
                    {filteredEnrollments.map((enrollment) => (
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {enrollment.enrolled_by ? (
                            <div>
                              <div className="text-sm text-gray-900">
                                {enrollment.enrolled_by.FirstName} {enrollment.enrolled_by.LastName}
                              </div>
                              <div className="text-xs text-gray-500">
                                {enrollment.processed_at ? new Date(enrollment.processed_at).toLocaleDateString() : ''}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">Not processed</span>
                          )}
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
                          {enrollment.status === 'approved' && (
                            <button
                              onClick={() => handleStatusUpdate(enrollment.id, 'enrolled')}
                              disabled={processing === enrollment.id}
                              className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                            >
                              {processing === enrollment.id ? 'Processing...' : 'Enroll'}
                            </button>
                          )}
                          {(enrollment.status === 'rejected' || enrollment.status === 'enrolled') && (
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
    </div>
  )
}
