import { useState } from 'react'
import { Head, useForm, router } from '@inertiajs/react'
import FacultySidebar from '../Auth/Faculty_sidebar'

export default function Profile({ faculty, user }) {
  const [isEditing, setIsEditing] = useState(false)
  
  const { data, setData, put, processing, errors, reset } = useForm({
    FirstName: faculty?.FirstName || '',
    MiddleName: faculty?.MiddleName || '',
    LastName: faculty?.LastName || '',
    email: faculty?.email || '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    put('/faculty/profile', {
      onSuccess: () => {
        setIsEditing(false)
        reset()
      }
    })
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <FacultySidebar user={user} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Head title="Profile - Faculty" />
        
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage your account settings and preferences
              </p>
            </div>
            <div className="flex items-center gap-2">
              {user?.is_coordinator && (
                <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-blue-700">Coordinator</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Coordinator Status Display Only */}
            {user?.is_coordinator && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Coordinator Status
                    </h3>
                    <p className="text-sm text-blue-700">
                      You have been assigned coordinator privileges by the registrar. You can access enrollment management features.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Information */}
            <div className="bg-white shadow-sm rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Update your personal information and contact details
                    </p>
                  </div>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>
              
              <div className="px-6 py-4">
                {isEditing ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={data.FirstName}
                          onChange={(e) => setData('FirstName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                        {errors.FirstName && <p className="mt-1 text-sm text-red-600">{errors.FirstName}</p>}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Middle Name
                        </label>
                        <input
                          type="text"
                          value={data.MiddleName}
                          onChange={(e) => setData('MiddleName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.MiddleName && <p className="mt-1 text-sm text-red-600">{errors.MiddleName}</p>}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={data.LastName}
                          onChange={(e) => setData('LastName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                        {errors.LastName && <p className="mt-1 text-sm text-red-600">{errors.LastName}</p>}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={data.email}
                          onChange={(e) => setData('email', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false)
                          reset()
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={processing}
                        className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {processing ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">First Name</label>
                        <p className="mt-1 text-sm text-gray-900">{faculty?.FirstName || 'Not provided'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Middle Name</label>
                        <p className="mt-1 text-sm text-gray-900">{faculty?.MiddleName || 'Not provided'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Last Name</label>
                        <p className="mt-1 text-sm text-gray-900">{faculty?.LastName || 'Not provided'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email Address</label>
                        <p className="mt-1 text-sm text-gray-900">{faculty?.email || 'Not provided'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Role</label>
                        <p className="mt-1 text-sm text-gray-900">Faculty</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Assigned Strand</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {faculty?.assigned_strand?.Strand_name || 'Not assigned'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
