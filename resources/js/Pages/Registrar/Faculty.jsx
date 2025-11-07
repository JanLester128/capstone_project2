import { useState } from 'react'
import { Head, router } from '@inertiajs/react'
import RegistrarSidebar from '../Auth/Registrar_sidebar'
import Breadcrumb from './Components/Breadcrumb'

export default function Faculty({ faculty = [], flash = {} }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingFaculty, setEditingFaculty] = useState(null)
  const [formData, setFormData] = useState({
    FirstName: '',
    MiddleName: '',
    LastName: '',
    email: ''
  })
  const [processing, setProcessing] = useState(false)
  const [errors, setErrors] = useState({})

  // HCI Principle 7: Flexibility and efficiency of use - Search functionality
  const filteredFaculty = faculty.filter(member =>
    member.FirstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.LastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleFormSubmit = (e) => {
    e.preventDefault()
    setProcessing(true)
    setErrors({})

    const url = editingFaculty 
      ? `/registrar/faculty/${editingFaculty.id}` 
      : '/registrar/faculty'
    
    const method = editingFaculty ? 'put' : 'post'

    router[method](url, formData, {
      onSuccess: () => {
        resetForm()
      },
      onError: (errors) => {
        setErrors(errors)
        setProcessing(false)
      },
      onFinish: () => {
        setProcessing(false)
      }
    })
  }

  const handleEdit = (member) => {
    setEditingFaculty(member)
    setFormData({
      FirstName: member.FirstName || '',
      MiddleName: member.MiddleName || '',
      LastName: member.LastName || '',
      email: member.email || ''
    })
    setShowForm(true)
  }

  const handleDelete = (member) => {
    if (confirm(`Are you sure you want to delete ${member.FirstName} ${member.LastName}?`)) {
      router.delete(`/registrar/faculty/${member.id}`)
    }
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingFaculty(null)
    setFormData({
      FirstName: '',
      MiddleName: '',
      LastName: '',
      email: ''
    })
    setErrors({})
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Head title="Faculty Management" />
      
      <RegistrarSidebar />

      <div className="flex-1 flex flex-col">
        {/* Flash Messages - HCI Principle 1: Visibility of system status */}
        {flash.success && (
          <div className="bg-green-50 border border-green-200 p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="ml-3 text-sm font-medium text-green-800">{flash.success}</p>
            </div>
          </div>
        )}

        {flash.error && (
          <div className="bg-red-50 border border-red-200 p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="ml-3 text-sm font-medium text-red-800">{flash.error}</p>
            </div>
          </div>
        )}

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 w-full">
          {/* Header - HCI Principle 6: Recognition rather than recall */}
          <div className="mb-8">
            <Breadcrumb 
              items={[
                { label: 'Dashboard', href: '/registrar' },
                { label: 'Faculty Management', href: '/registrar/faculty', current: true }
              ]} 
            />
            <div className="flex items-center justify-between mt-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Faculty Management</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Manage faculty members and their information
                </p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Faculty
              </button>
            </div>
          </div>

          {/* Search and Stats - HCI Principle 7: Flexibility and efficiency */}
          <div className="mb-6 flex items-center justify-between">
            <div className="relative max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search faculty members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div className="text-sm text-gray-500">
              Showing {filteredFaculty.length} of {faculty.length} faculty members
            </div>
          </div>

          {/* Faculty List - Enhanced List Design with HCI Principles */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* List Header */}
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">Faculty Members</h3>
                <span className="text-xs text-gray-500">{filteredFaculty.length} members</span>
              </div>
            </div>

            {/* Faculty List Items */}
            <div className="divide-y divide-gray-200">
              {filteredFaculty.map((member, index) => (
                <div key={member.id} className="group hover:bg-gray-50 transition-colors duration-150">
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      {/* Left Section - Avatar and Info */}
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        {/* Avatar with Status */}
                        <div className="relative flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center ring-2 ring-white shadow-sm">
                            <span className="text-sm font-semibold text-indigo-700">
                              {member.FirstName?.charAt(0)}{member.LastName?.charAt(0)}
                            </span>
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-400 border-2 border-white rounded-full"></div>
                        </div>

                        {/* Name and Primary Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                              {member.FirstName} {member.MiddleName ? member.MiddleName + ' ' : ''}{member.LastName}
                            </h3>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <svg className="w-2 h-2 mr-1" fill="currentColor" viewBox="0 0 8 8">
                                <circle cx={4} cy={4} r={3} />
                              </svg>
                              Active
                            </span>
                          </div>
                          
                          {/* Contact Info */}
                          <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <svg className="w-3 h-3 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <span className="truncate max-w-xs" title={member.email}>{member.email}</span>
                            </div>
                            <div className="flex items-center">
                              <svg className="w-3 h-3 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              <span>Academic Department</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Section - Metadata and Actions */}
                      <div className="flex items-center space-x-6">
                        {/* Metadata */}
                        <div className="hidden sm:flex flex-col items-end text-xs text-gray-500 space-y-1">
                          <div className="flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>Joined {new Date(member.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}</span>
                          </div>
                          <div className="flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Active today</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleEdit(member)}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-150"
                            title="Edit faculty member"
                            aria-label={`Edit ${member.FirstName} ${member.LastName}`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(member)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-150"
                            title="Delete faculty member"
                            aria-label={`Delete ${member.FirstName} ${member.LastName}`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Mobile Metadata - Only visible on small screens */}
                    <div className="mt-3 sm:hidden flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>Joined {new Date(member.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}</span>
                        </div>
                        <div className="flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Active today</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Empty State - HCI Principle 10: Help and documentation */}
          {filteredFaculty.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No faculty members found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? `No faculty members match "${searchTerm}"` : 'Get started by adding your first faculty member.'}
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Faculty Form Modal - HCI Principle 8: Aesthetic and minimalist design */}
      {showForm && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                {editingFaculty ? 'Edit Faculty Member' : 'Add New Faculty Member'}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Faculty Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="FirstName" className="block text-sm font-medium text-gray-700">
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="FirstName"
                      value={formData.FirstName}
                      onChange={(e) => setFormData({...formData, FirstName: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    />
                    {errors.FirstName && (
                      <p className="mt-1 text-sm text-red-600">{errors.FirstName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="MiddleName" className="block text-sm font-medium text-gray-700">
                      Middle Name
                    </label>
                    <input
                      type="text"
                      id="MiddleName"
                      value={formData.MiddleName}
                      onChange={(e) => setFormData({...formData, MiddleName: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    {errors.MiddleName && (
                      <p className="mt-1 text-sm text-red-600">{errors.MiddleName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="LastName" className="block text-sm font-medium text-gray-700">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      id="LastName"
                      value={formData.LastName}
                      onChange={(e) => setFormData({...formData, LastName: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    />
                    {errors.LastName && (
                      <p className="mt-1 text-sm text-red-600">{errors.LastName}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="faculty@school.edu.ph"
                    required
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
              </div>

              {/* Password Information */}
              {!editingFaculty && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h5 className="text-sm font-medium text-blue-900 mb-1">Automatic Password Generation</h5>
                      <p className="text-sm text-blue-800">
                        A secure password will be automatically generated and sent to the faculty member's email address. 
                        They will be required to change this password on their first login for security.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {processing ? 'Saving...' : (editingFaculty ? 'Update Faculty' : 'Add Faculty')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
