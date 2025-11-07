import { useState, useEffect } from 'react'
import { router } from '@inertiajs/react'

export default function SectionForm({ section = null, strands = [], schoolYears = [], faculty = [], onClose }) {
  const [formData, setFormData] = useState({
    section_name: '',
    strand_id: '',
    grade_level: '',
    capacity: '',
    school_year_id: '',
    adviser_id: ''
  })
  const [errors, setErrors] = useState({})
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (section) {
      setFormData({
        section_name: section.section_name || '',
        strand_id: section.strand_id || '',
        grade_level: section.year_level || '', // Note: database uses year_level
        capacity: section.max_capacity || '', // Note: database uses max_capacity
        school_year_id: section.school_year_id || '',
        adviser_id: section.adviser_id || ''
      })
    }
  }, [section])

  const handleSubmit = (e) => {
    e.preventDefault()
    setProcessing(true)
    setErrors({})

    const url = section 
      ? `/registrar/sections/${section.id}` 
      : '/registrar/sections'
    
    const method = section ? 'put' : 'post'

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
                {section ? 'Edit Section' : 'Add New Section'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Section Name */}
                <div>
                  <label htmlFor="section_name" className="block text-sm font-medium leading-6 text-gray-900">
                    Section Name *
                  </label>
                  <input
                    type="text"
                    name="section_name"
                    id="section_name"
                    value={formData.section_name}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${
                      errors.section_name ? 'ring-red-300' : 'ring-gray-300'
                    } placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6`}
                    placeholder="e.g., 11-STEM-A"
                  />
                  {errors.section_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.section_name}</p>
                  )}
                </div>

                {/* Strand */}
                <div>
                  <label htmlFor="strand_id" className="block text-sm font-medium leading-6 text-gray-900">
                    Strand *
                  </label>
                  <select
                    name="strand_id"
                    id="strand_id"
                    value={formData.strand_id}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${
                      errors.strand_id ? 'ring-red-300' : 'ring-gray-300'
                    } focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6`}
                  >
                    <option value="">Select a strand</option>
                    {strands.map((strand) => (
                      <option key={strand.id} value={strand.id}>
                        {strand.Strand_name}
                      </option>
                    ))}
                  </select>
                  {errors.strand_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.strand_id}</p>
                  )}
                </div>

                {/* School Year */}
                <div>
                  <label htmlFor="school_year_id" className="block text-sm font-medium leading-6 text-gray-900">
                    School Year *
                  </label>
                  <select
                    name="school_year_id"
                    id="school_year_id"
                    value={formData.school_year_id}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${
                      errors.school_year_id ? 'ring-red-300' : 'ring-gray-300'
                    } focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6`}
                  >
                    <option value="">Select school year</option>
                    {schoolYears.length > 0 ? (
                      schoolYears.map((year) => (
                        <option key={year.id} value={year.id}>
                          {year.School_year_start}-{year.School_year_end}
                          {year.is_active && ' (Active)'}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No school years available</option>
                    )}
                  </select>
                  {schoolYears.length === 0 && (
                    <p className="mt-1 text-sm text-yellow-600">
                      Please create a school year first in the School Years page.
                    </p>
                  )}
                  {errors.school_year_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.school_year_id}</p>
                  )}
                </div>

                {/* Grade Level */}
                <div>
                  <label htmlFor="grade_level" className="block text-sm font-medium leading-6 text-gray-900">
                    Grade Level *
                  </label>
                  <select
                    name="grade_level"
                    id="grade_level"
                    value={formData.grade_level}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${
                      errors.grade_level ? 'ring-red-300' : 'ring-gray-300'
                    } focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6`}
                  >
                    <option value="">Select grade level</option>
                    <option value="11">Grade 11</option>
                    <option value="12">Grade 12</option>
                  </select>
                  {errors.grade_level && (
                    <p className="mt-1 text-sm text-red-600">{errors.grade_level}</p>
                  )}
                </div>

                {/* Capacity */}
                <div>
                  <label htmlFor="capacity" className="block text-sm font-medium leading-6 text-gray-900">
                    Capacity *
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    id="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    min="1"
                    max="50"
                    className={`mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${
                      errors.capacity ? 'ring-red-300' : 'ring-gray-300'
                    } placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6`}
                    placeholder="Maximum number of students"
                  />
                  {errors.capacity && (
                    <p className="mt-1 text-sm text-red-600">{errors.capacity}</p>
                  )}
                </div>

                {/* Assign Adviser */}
                <div>
                  <label htmlFor="adviser_id" className="block text-sm font-medium leading-6 text-gray-900">
                    Assign Adviser
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
                    {faculty.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.FirstName} {member.MiddleName ? member.MiddleName + ' ' : ''}{member.LastName}
                      </option>
                    ))}
                  </select>
                  {errors.adviser_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.adviser_id}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    The adviser will be responsible for this section's academic guidance and administrative tasks.
                  </p>
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
                    {processing ? 'Saving...' : (section ? 'Update Section' : 'Create Section')}
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
