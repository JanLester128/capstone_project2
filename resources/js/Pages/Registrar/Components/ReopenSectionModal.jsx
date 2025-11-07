import { useState, useEffect } from 'react'
import { router } from '@inertiajs/react'

export default function ReopenSectionModal({ section, users = [], activeSchoolYear, onClose }) {
  const [formData, setFormData] = useState({
    max_capacity: section?.max_capacity || '',
    adviser_id: ''
  })
  const [errors, setErrors] = useState({})
  const [processing, setProcessing] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setProcessing(true)
    setErrors({})

    router.post(`/registrar/sections/${section.id}/reopen`, formData, {
      onSuccess: () => {
        onClose()
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

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }))
    }
  }

  // Filter users to only show Faculty users
  const facultyUsers = users.filter(user => user.Role === 'Faculty')

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
        
        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
          <div className="absolute right-0 top-0 pr-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
              <h3 className="text-base font-semibold leading-6 text-gray-900">
                Reopen Section
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Reopen <strong>{section?.section_name}</strong> for {activeSchoolYear ? `${activeSchoolYear.School_year_start}-${activeSchoolYear.School_year_end}` : 'the active school year'}.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {/* Capacity */}
                <div>
                  <label htmlFor="max_capacity" className="block text-sm font-medium leading-6 text-gray-900">
                    Maximum Capacity *
                  </label>
                  <input
                    type="number"
                    name="max_capacity"
                    id="max_capacity"
                    value={formData.max_capacity}
                    onChange={handleChange}
                    min="1"
                    max="50"
                    required
                    className={`mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${
                      errors.max_capacity ? 'ring-red-300' : 'ring-gray-300'
                    } placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6`}
                    placeholder="e.g., 40"
                  />
                  {errors.max_capacity && (
                    <p className="mt-1 text-sm text-red-600">{errors.max_capacity}</p>
                  )}
                </div>

                {/* Adviser */}
                <div>
                  <label htmlFor="adviser_id" className="block text-sm font-medium leading-6 text-gray-900">
                    Section Adviser
                  </label>
                  <select
                    name="adviser_id"
                    id="adviser_id"
                    value={formData.adviser_id}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${
                      errors.adviser_id ? 'ring-red-300' : 'ring-gray-300'
                    } focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6`}
                  >
                    <option value="">Select an adviser (optional)</option>
                    {facultyUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.FirstName} {user.MiddleName ? user.MiddleName + ' ' : ''}{user.LastName}
                      </option>
                    ))}
                  </select>
                  {errors.adviser_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.adviser_id}</p>
                  )}
                </div>

                {/* Read-only info */}
                <div className="bg-gray-50 p-3 rounded-md space-y-1 text-xs text-gray-600">
                  <p><strong>Section:</strong> {section?.section_name}</p>
                  <p><strong>Strand:</strong> {section?.strand?.Strand_name}</p>
                  <p><strong>Year Level:</strong> Grade {section?.year_level}</p>
                  <p><strong>Original School Year:</strong> {section?.school_year?.School_year_start}-{section?.school_year?.School_year_end}</p>
                </div>
                
                {/* General error display */}
                {errors.general && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-800">{errors.general}</p>
                  </div>
                )}

                {/* Form Actions */}
                <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex w-full justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? 'Reopening...' : 'Reopen Section'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

