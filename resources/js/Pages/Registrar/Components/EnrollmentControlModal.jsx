import { useState } from 'react'
import { router } from '@inertiajs/react'

export default function EnrollmentControlModal({ schoolYear, onClose }) {
  // Helper function to format date for HTML input
  const formatDateForInput = (date) => {
    if (!date) return '';
    if (typeof date === 'string') {
      // If it's already a string, extract just the date part (YYYY-MM-DD)
      return date.split('T')[0];
    }
    return date;
  };

  const [formData, setFormData] = useState({
    enrollment_open: schoolYear?.enrollment_open || false,
    enrollment_start_date: formatDateForInput(schoolYear?.enrollment_start_date),
    enrollment_end_date: formatDateForInput(schoolYear?.enrollment_end_date),
  })
  const [processing, setProcessing] = useState(false)
  const [errors, setErrors] = useState({})

  const handleSubmit = (e) => {
    e.preventDefault()
    setProcessing(true)
    setErrors({})

    router.put(`/registrar/school-years/${schoolYear.id}/enrollment`, formData, {
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

  const handleToggleEnrollment = () => {
    setProcessing(true)
    
    router.put(`/registrar/school-years/${schoolYear.id}/enrollment/toggle`, {}, {
      onSuccess: () => {
        onClose()
      },
      onError: () => {
        setProcessing(false)
      },
      onFinish: () => {
        setProcessing(false)
      }
    })
  }

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Enrollment Control
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">
              {schoolYear.School_year_start}-{schoolYear.School_year_end}
            </h4>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Enrollment Status:</span>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  schoolYear.enrollment_open 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {schoolYear.enrollment_open ? 'Open' : 'Closed'}
                </span>
                <button
                  onClick={handleToggleEnrollment}
                  disabled={processing}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    schoolYear.enrollment_open
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  } disabled:opacity-50`}
                >
                  {schoolYear.enrollment_open ? 'Close' : 'Open'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.enrollment_open}
                onChange={(e) => setFormData({...formData, enrollment_open: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Enable enrollment for this school year
              </span>
            </label>
          </div>

          {formData.enrollment_open && (
            <>
              <div>
                <label htmlFor="enrollment_start_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Enrollment Start Date
                </label>
                <input
                  type="date"
                  id="enrollment_start_date"
                  value={formData.enrollment_start_date}
                  onChange={(e) => setFormData({...formData, enrollment_start_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Leave empty to allow enrollment immediately
                </p>
                {errors.enrollment_start_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.enrollment_start_date}</p>
                )}
              </div>

              <div>
                <label htmlFor="enrollment_end_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Enrollment End Date
                </label>
                <input
                  type="date"
                  id="enrollment_end_date"
                  value={formData.enrollment_end_date}
                  onChange={(e) => setFormData({...formData, enrollment_end_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Leave empty for no end date
                </p>
                {errors.enrollment_end_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.enrollment_end_date}</p>
                )}
              </div>

            </>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {processing ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
