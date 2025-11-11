import { useState } from 'react'
import { Head, useForm } from '@inertiajs/react'
import StudentSidebar from '../Auth/Student_sidebar'

// Updated for navigation fix
export default function Profile({ student, activeSchoolYear, activeSemester, enrollmentStatus }) {
  const [isEditing, setIsEditing] = useState(false)
  
  const { data, setData, post, processing, errors, reset } = useForm({
    FirstName: student?.FirstName || '',
    MiddleName: student?.MiddleName || '',
    LastName: student?.LastName || '',
    email: student?.email || '',
    profile_photo: null,
  })

  function handleSubmit(e) {
    e.preventDefault()
    post('/student/profile', {
      forceFormData: true,
      onSuccess: () => {
        setIsEditing(false)
      }
    })
  }

  function cancelEdit() {
    reset()
    setIsEditing(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <StudentSidebar enrollmentStatus={enrollmentStatus} />
      <div className="flex-1">
        <Head title="My Profile" />
      
      <div className="py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage your personal information and account settings
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center">
                  <div className="mx-auto h-24 w-24 rounded-full overflow-hidden mb-4 border-4 border-gray-200">
                    {student?.studentPersonalInfo?.profile_photo ? (
                      <img 
                        src={`/storage/${student.studentPersonalInfo.profile_photo}`}
                        alt={`${student?.FirstName} ${student?.LastName}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">
                          {student?.FirstName?.[0]}{student?.LastName?.[0]}
                        </span>
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {student?.FirstName} {student?.MiddleName} {student?.LastName}
                  </h3>
                  <p className="text-sm text-gray-500">{student?.email}</p>
                  <p className="text-sm text-blue-600 font-medium mt-1">Grade 10 Student</p>
                  
                  {/* Status Badge */}
                  <div className="mt-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Active Student
                    </span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Student ID</span>
                      <span className="font-medium text-gray-900">2024-{student?.id?.toString().padStart(4, '0')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">School Year</span>
                      <span className="font-medium text-gray-900">
                        {activeSchoolYear ? `${activeSchoolYear.School_year_start}-${activeSchoolYear.School_year_end}` : 'Not Available'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Semester</span>
                      <span className="font-medium text-gray-900">
                        {activeSemester ? activeSemester.semester_type : 'Not Available'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Strand</span>
                      <span className="font-medium text-gray-900">
                        {student?.studentPersonalInfo?.strand?.Strand_name || 'Not Assigned'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Information */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={cancelEdit}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={processing}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {processing ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  {isEditing ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="FirstName" className="block text-sm font-medium text-gray-700 mb-2">
                            First Name *
                          </label>
                          <input
                            type="text"
                            id="FirstName"
                            required
                            value={data.FirstName}
                            onChange={(e) => setData('FirstName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          {errors.FirstName && (
                            <p className="mt-1 text-sm text-red-600">{errors.FirstName}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="MiddleName" className="block text-sm font-medium text-gray-700 mb-2">
                            Middle Name
                          </label>
                          <input
                            type="text"
                            id="MiddleName"
                            value={data.MiddleName}
                            onChange={(e) => setData('MiddleName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          {errors.MiddleName && (
                            <p className="mt-1 text-sm text-red-600">{errors.MiddleName}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="LastName" className="block text-sm font-medium text-gray-700 mb-2">
                            Last Name *
                          </label>
                          <input
                            type="text"
                            id="LastName"
                            required
                            value={data.LastName}
                            onChange={(e) => setData('LastName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          {errors.LastName && (
                            <p className="mt-1 text-sm text-red-600">{errors.LastName}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address *
                          </label>
                          <input
                            type="email"
                            id="email"
                            required
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          {errors.email && (
                            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                          )}
                        </div>
                      </div>

                      {/* Profile Photo Upload Section */}
                      <div className="border-t border-gray-200 pt-6">
                        <h4 className="text-sm font-medium text-gray-900 mb-4">Profile Photo</h4>
                        <div>
                          <label htmlFor="profile_photo" className="block text-sm font-medium text-gray-700 mb-2">
                            Upload Profile Photo
                          </label>
                          <input
                            type="file"
                            id="profile_photo"
                            accept="image/jpeg,image/png,image/jpg,image/gif"
                            onChange={(e) => setData('profile_photo', e.target.files[0])}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <p className="mt-1 text-xs text-gray-500">Maximum file size: 2MB. Supported formats: JPEG, PNG, JPG, GIF</p>
                          {errors.profile_photo && (
                            <p className="mt-1 text-sm text-red-600">{errors.profile_photo}</p>
                          )}
                        </div>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">First Name</label>
                          <p className="text-sm text-gray-900">{student?.FirstName || 'Not provided'}</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Middle Name</label>
                          <p className="text-sm text-gray-900">{student?.MiddleName || 'Not provided'}</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Last Name</label>
                          <p className="text-sm text-gray-900">{student?.LastName || 'Not provided'}</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Email Address</label>
                          <p className="text-sm text-gray-900">{student?.email || 'Not provided'}</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Role</label>
                          <p className="text-sm text-gray-900">{student?.Role || 'Student'}</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Account Status</label>
                          <p className="text-sm text-gray-900">
                            {student?.is_disabled ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Disabled
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Active
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Information */}
              <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Academic Information</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">LRN (Learner Reference Number)</label>
                      <p className="text-sm text-gray-900">
                        {student?.studentPersonalInfo?.lrn || 'Not provided'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Grade Level</label>
                      <p className="text-sm text-gray-900">
                        {student?.studentPersonalInfo?.grade_level || 'Grade 10'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Assigned Strand</label>
                      <p className="text-sm text-gray-900">
                        {student?.studentPersonalInfo?.strand?.Strand_name || 'Not assigned yet'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Verification Status</label>
                      <p className="text-sm text-gray-900">
                        {student?.studentPersonalInfo?.is_verified ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Pending Verification
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {!student?.studentPersonalInfo?.is_verified && (
                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex">
                        <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <div>
                          <h4 className="text-sm font-medium text-yellow-800">Account Verification Pending</h4>
                          <p className="text-sm text-yellow-700 mt-1">
                            Your account is pending verification from the registrar's office. 
                            Please complete your personal information form to expedite the process.
                          </p>
                          <div className="mt-3">
                            <a
                              href="/student/personal-info"
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                            >
                              Complete Personal Info
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
