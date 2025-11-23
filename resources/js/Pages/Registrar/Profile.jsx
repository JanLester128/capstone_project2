import { useState, useEffect } from 'react'
import { Head, useForm } from '@inertiajs/react'
import RegistrarSidebar from '../Auth/Registrar_sidebar'
import Breadcrumb from './Components/Breadcrumb'
import ProfileChangePasswordCard from '../../Components/ProfileChangePasswordCard'

export default function Profile({ registrar, flash = {} }) {
  const [isEditing, setIsEditing] = useState(false)
  
  const { data, setData, post, processing, errors, reset } = useForm({
    FirstName: registrar?.FirstName || '',
    MiddleName: registrar?.MiddleName || '',
    LastName: registrar?.LastName || '',
    email: registrar?.email || '',
    profile_photo: null,
  })

  // Ensure form data is synchronized with registrar prop on initial load
  useEffect(() => {
    if (registrar && !isEditing) {
      setData({
        FirstName: registrar.FirstName || '',
        MiddleName: registrar.MiddleName || '',
        LastName: registrar.LastName || '',
        email: registrar.email || '',
        profile_photo: null, // Always null for file input
      })
    }
  }, [registrar, isEditing])

  // HCI Principle 6: Recognition rather than recall - Clear breadcrumb navigation
  const breadcrumbItems = [
    { label: 'Dashboard', href: '/registrar' },
    { label: 'Profile', href: '/registrar/profile', current: true }
  ]

  const handleSubmit = (e) => {
    e.preventDefault()
    
    
    // Use POST with _method for file uploads (Inertia requirement)
    post('/registrar/profile', {
      _method: 'PUT',
      onSuccess: (page) => {
        setIsEditing(false)
        reset('profile_photo')
        // Update form data with new values from server
        if (page.props.registrar) {
          setData({
            FirstName: page.props.registrar.FirstName || '',
            MiddleName: page.props.registrar.MiddleName || '',
            LastName: page.props.registrar.LastName || '',
            email: page.props.registrar.email || '',
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
      FirstName: registrar?.FirstName || '',
      MiddleName: registrar?.MiddleName || '',
      LastName: registrar?.LastName || '',
      email: registrar?.email || '',
      profile_photo: null,
    })
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <RegistrarSidebar />
      <div className="flex-1 flex flex-col">
        <Head title="Profile - ONSTS" />

        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Breadcrumb items={breadcrumbItems} />
              <div className="mt-4">
                <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
                <p className="text-sm text-gray-600 mt-1">Manage your account information</p>
              </div>
            </div>
            {isEditing ? (
              <button
                onClick={handleCancel}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg text-sm font-semibold shadow-sm hover:bg-gray-50"
              >
                Cancel
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold shadow-sm hover:bg-indigo-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Profile
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {flash.success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 text-sm">
                {flash.success}
              </div>
            )}

            {flash.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
                {flash.error}
              </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm xl:col-span-2">
                <div className="p-6 space-y-8">
                  <div className="flex items-center space-x-6">
                    <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center overflow-hidden">
                      {registrar?.profile_photo ? (
                        <img
                          src={`/storage/${registrar.profile_photo}`}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {registrar?.FirstName} {registrar?.MiddleName} {registrar?.LastName}
                      </h2>
                      <p className="text-gray-600">{registrar?.email}</p>
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          Registrar
                        </span>
                      </div>
                    </div>
                  </div>

                  {isEditing ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Profile Photo
                        </label>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/jpg,image/gif"
                          onChange={(e) => setData('profile_photo', e.target.files[0])}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        {errors.profile_photo && (
                          <p className="mt-1 text-sm text-red-600">{errors.profile_photo}</p>
                        )}
                        <p className="mt-1 text-sm text-gray-500">
                          Maximum file size: 10MB. Supported formats: JPEG, PNG, JPG, GIF
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label htmlFor="FirstName" className="block text-sm font-medium text-gray-700 mb-2">
                            First Name *
                          </label>
                          <input
                            type="text"
                            id="FirstName"
                            value={data.FirstName}
                            onChange={(e) => setData('FirstName', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                              errors.FirstName ? 'border-red-300' : 'border-gray-300'
                            }`}
                            required
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
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                              errors.MiddleName ? 'border-red-300' : 'border-gray-300'
                            }`}
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
                            value={data.LastName}
                            onChange={(e) => setData('LastName', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                              errors.LastName ? 'border-red-300' : 'border-gray-300'
                            }`}
                            required
                          />
                          {errors.LastName && (
                            <p className="mt-1 text-sm text-red-600">{errors.LastName}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          id="email"
                          value={data.email}
                          onChange={(e) => setData('email', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                            errors.email ? 'border-red-300' : 'border-gray-300'
                          }`}
                          required
                        />
                        {errors.email && (
                          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-6 border-t">
                        <button
                          type="button"
                          onClick={handleCancel}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={processing}
                          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {processing && (
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          )}
                          Save Changes
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            First Name
                          </label>
                          <p className="text-gray-900">{registrar?.FirstName}</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Middle Name
                          </label>
                          <p className="text-gray-900">{registrar?.MiddleName}</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Last Name
                          </label>
                          <p className="text-gray-900">{registrar?.LastName}</p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <p className="text-gray-900">{registrar?.email}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="p-6 space-y-8">
                  <h2 className="text-2xl font-bold text-gray-900">Account</h2>
                  <ProfileChangePasswordCard />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
