import { useState, useEffect } from 'react'
import { Head, useForm, router } from '@inertiajs/react'
import FacultySidebar from '../Auth/Faculty_sidebar'

export default function Profile({ faculty, user, flash = {} }) {
  const [isEditing, setIsEditing] = useState(false)
  
  const { data, setData, post, processing, errors, reset } = useForm({
    FirstName: faculty?.FirstName || '',
    MiddleName: faculty?.MiddleName || '',
    LastName: faculty?.LastName || '',
    email: faculty?.email || '',
    profile_photo: null,
  })

  // Ensure form data is synchronized with faculty/user prop on initial load
  useEffect(() => {
    if ((faculty || user) && !isEditing) {
      setData({
        FirstName: faculty?.FirstName || user?.FirstName || '',
        MiddleName: faculty?.MiddleName || user?.MiddleName || '',
        LastName: faculty?.LastName || user?.LastName || '',
        email: faculty?.email || user?.email || '',
        profile_photo: null, // Always null for file input
      })
    }
  }, [faculty, user, isEditing])

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Use POST with _method for file uploads (Inertia requirement)
    post('/faculty/profile', {
      _method: 'PUT',
      onSuccess: (page) => {
        setIsEditing(false)
        reset('profile_photo')
        // Update form data with new values from server
        if (page.props.faculty || page.props.user) {
          const updatedData = page.props.faculty || page.props.user
          setData({
            FirstName: updatedData?.FirstName || '',
            MiddleName: updatedData?.MiddleName || '',
            LastName: updatedData?.LastName || '',
            email: updatedData?.email || '',
            profile_photo: null,
          })
        }
      },
      onError: (errors) => {
        // Keep form open on error
      }
    })
  }

  const handleCancel = () => {
    setIsEditing(false)
    reset()
    setData({
      FirstName: faculty?.FirstName || user?.FirstName || '',
      MiddleName: faculty?.MiddleName || user?.MiddleName || '',
      LastName: faculty?.LastName || user?.LastName || '',
      email: faculty?.email || user?.email || '',
      profile_photo: null,
    })
  }

  // Get profile photo from user or faculty
  const profilePhoto = user?.profile_photo || faculty?.profile_photo

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

        {/* Flash Messages */}
        {flash.success && (
          <div className="mx-6 mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-green-800 font-medium">{flash.success}</p>
            </div>
          </div>
        )}

        {flash.error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800 font-medium">{flash.error}</p>
            </div>
          </div>
        )}

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
                {/* Profile Header */}
                <div className="flex items-center space-x-6 mb-8">
                  <div className="relative">
                    <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center">
                      {profilePhoto ? (
                        <img
                          src={`/storage/${profilePhoto}`}
                          alt="Profile"
                          className="w-24 h-24 rounded-full object-cover"
                        />
                      ) : (
                        <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {faculty?.FirstName || user?.FirstName} {faculty?.MiddleName || user?.MiddleName} {faculty?.LastName || user?.LastName}
                    </h2>
                    <p className="text-gray-600">{faculty?.email || user?.email}</p>
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {user?.is_coordinator ? 'Coordinator' : 'Faculty'}
                      </span>
                    </div>
                  </div>
                </div>

                {isEditing ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Profile Photo Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Profile Photo
                      </label>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg,image/gif"
                        onChange={(e) => setData('profile_photo', e.target.files[0])}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {errors.profile_photo && (
                        <p className="mt-1 text-sm text-red-600">{errors.profile_photo}</p>
                      )}
                      <p className="mt-1 text-sm text-gray-500">
                        Maximum file size: 10MB. Supported formats: JPEG, PNG, JPG, GIF
                      </p>
                    </div>
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
                    
                    {/* Form Actions */}
                    <div className="flex items-center justify-end gap-3 pt-6 border-t">
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={processing}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {processing && (
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        )}
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
