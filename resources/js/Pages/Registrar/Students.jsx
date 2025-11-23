import React, { useState } from 'react'
import { Head, Link } from '@inertiajs/react'
import RegistrarLayout from './Layout'

export default function Students({ students = [] }) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredStudents = students.filter(student => {
    const searchLower = searchTerm.toLowerCase();
    return (
      student.name?.toLowerCase().includes(searchLower) ||
      student.email?.toLowerCase().includes(searchLower) ||
      student.lrn?.toLowerCase().includes(searchLower) ||
      student.strand?.toLowerCase().includes(searchLower) ||
      student.section?.toLowerCase().includes(searchLower)
    )
  })

  const getStatusBadge = (status) => {
    const statusMap = {
      'enrolled': { color: 'bg-green-100 text-green-800 border-green-200', label: 'Enrolled' },
      'recommended': { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Recommended' },
      'pending': { color: 'bg-amber-100 text-amber-800 border-amber-200', label: 'Pending' },
      'rejected': { color: 'bg-red-100 text-red-800 border-red-200', label: 'Rejected' },
    };
    const statusInfo = statusMap[status] || statusMap['pending'];
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  return (
    <RegistrarLayout>
      <Head title="Students" />

      <main className="bg-gray-50 flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            View and manage all verified students who have submitted pre-enrollment.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by name, email, LRN, strand, or section..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-lg shadow border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">LRN</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                      {searchTerm ? 'No students found matching your search.' : 'No students found. Students will appear here once they verify their account and submit pre-enrollment.'}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{(student.name && student.name !== 'N/A') ? student.name : ''}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{(student.email && student.email !== 'N/A') ? student.email : ''}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-700">{(student.lrn && student.lrn !== 'N/A') ? student.lrn : ''}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getStatusBadge(student.enrollment_status)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/registrar/students/${student.id}/details`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredStudents.length} of {students.length} student(s)
        </div>
        </div>
      </main>
    </RegistrarLayout>
  )
}

