import { useState, useEffect } from 'react'
import { router } from '@inertiajs/react'
import axios from 'axios'

export default function SemesterForm({ semester = null, schoolYear, onClose }) {
  const [formData, setFormData] = useState({
    school_year_id: schoolYear?.id || '',
    semester_type: '',
    start_date: '',
    end_date: '',
    is_active: false
  })
  const [errors, setErrors] = useState({})
  const [processing, setProcessing] = useState(false)
  const [calculatedDates, setCalculatedDates] = useState(null)
  const [loadingDates, setLoadingDates] = useState(false)

  useEffect(() => {
    if (semester) {
      setFormData({
        school_year_id: semester.school_year_id || schoolYear?.id || '',
        semester_type: semester.semester_type || '',
        start_date: semester.start_date || '',
        end_date: semester.end_date || '',
        is_active: semester.is_active || false
      })
    }
  }, [semester, schoolYear])

  const handleSubmit = (e) => {
    e.preventDefault()
    setProcessing(true)
    setErrors({})

    const url = semester 
      ? `/registrar/semesters/${semester.id}` 
      : '/registrar/semesters'
    
    const method = semester ? 'put' : 'post'

    router[method](url, formData, {
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

  // Function to fetch calculated dates when semester type changes
  const fetchCalculatedDates = async (semesterType) => {
    if (!semesterType || !schoolYear?.id) return

    setLoadingDates(true)
    try {
      const response = await axios.get('/registrar/semesters/calculate-dates', {
        params: {
          school_year_id: schoolYear.id,
          semester_type: semesterType
        }
      })
      setCalculatedDates(response.data)
      
      // Auto-fill dates if they're empty
      if (!formData.start_date && !formData.end_date) {
        setFormData(prev => ({
          ...prev,
          start_date: response.data.start_date,
          end_date: response.data.end_date
        }))
      }
    } catch (error) {
      console.error('Error fetching calculated dates:', error)
    } finally {
      setLoadingDates(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Fetch calculated dates when semester type changes
    if (name === 'semester_type' && value) {
      fetchCalculatedDates(value)
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }))
    }
  }

  const useCalculatedDates = () => {
    if (calculatedDates) {
      setFormData(prev => ({
        ...prev,
        start_date: calculatedDates.start_date,
        end_date: calculatedDates.end_date
      }))
    }
  }

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
            <div className="mt-3 text-center sm:ml-0 sm:mt-0 sm:text-left w-full">
              <h3 className="text-base font-semibold leading-6 text-gray-900 mb-4">
                {semester ? 'Edit Semester' : 'Add New Semester'}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                School Year: {schoolYear?.School_year_start}-{schoolYear?.School_year_end}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Semester Type */}
                <div>
                  <label htmlFor="semester_type" className="block text-sm font-medium leading-6 text-gray-900">
                    Semester Type *
                  </label>
                  <select
                    name="semester_type"
                    id="semester_type"
                    value={formData.semester_type}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${
                      errors.semester_type ? 'ring-red-300' : 'ring-gray-300'
                    } focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6`}
                  >
                    <option value="">Select semester type</option>
                    <option value="1st Semester">1st Semester</option>
                    <option value="2nd Semester">2nd Semester</option>
                    <option value="Summer">Summer</option>
                  </select>
                  {errors.semester_type && (
                    <p className="mt-1 text-sm text-red-600">{errors.semester_type}</p>
                  )}
                </div>

                {/* Calculated Dates Display */}
                {calculatedDates && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-blue-900">
                        📅 Auto-calculated Dates (5 months)
                      </h4>
                      {loadingDates && (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                      )}
                    </div>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p><strong>Start:</strong> {new Date(calculatedDates.start_date).toLocaleDateString()}</p>
                      <p><strong>End:</strong> {new Date(calculatedDates.end_date).toLocaleDateString()}</p>
                    </div>
                    <button
                      type="button"
                      onClick={useCalculatedDates}
                      className="mt-2 text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                    >
                      Use These Dates
                    </button>
                  </div>
                )}

                {/* Start Date */}
                <div>
                  <label htmlFor="start_date" className="block text-sm font-medium leading-6 text-gray-900">
                    Start Date
                    <span className="text-xs text-gray-500 ml-1">(Auto-calculated if empty)</span>
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    id="start_date"
                    value={formData.start_date}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${
                      errors.start_date ? 'ring-red-300' : 'ring-gray-300'
                    } focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6`}
                  />
                  {errors.start_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>
                  )}
                </div>

                {/* End Date */}
                <div>
                  <label htmlFor="end_date" className="block text-sm font-medium leading-6 text-gray-900">
                    End Date
                    <span className="text-xs text-gray-500 ml-1">(Auto-calculated if empty)</span>
                  </label>
                  <input
                    type="date"
                    name="end_date"
                    id="end_date"
                    value={formData.end_date}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${
                      errors.end_date ? 'ring-red-300' : 'ring-gray-300'
                    } focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6`}
                  />
                  {errors.end_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>
                  )}
                </div>

                {/* Is Active */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-600 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                    Active Semester
                  </label>
                </div>

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
                    className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? 'Saving...' : (semester ? 'Update Semester' : 'Create Semester')}
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
