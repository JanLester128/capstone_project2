import { Head } from '@inertiajs/react'
import FacultySidebar from '../Auth/Faculty_sidebar'

export default function FacultyAttendance({ flash = {} }) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Head title="Attendance - Faculty" />
      
      <FacultySidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
              <p className="text-gray-600 mt-1">Track and manage student attendance</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Attendance Management</h3>
            <p className="text-gray-600">This feature is coming soon. You'll be able to track and manage student attendance here.</p>
          </div>
        </main>
      </div>
    </div>
  )
}
