import { useState, useEffect } from 'react'
import { router } from '@inertiajs/react'

export default function ClassForm({ 
  isOpen, 
  onClose, 
  classData = null, 
  sections = [], 
  faculty = [], 
  semesters = [], 
  schoolYears = [], 
  subjects = [],
  activeSchoolYear = null,
  activeSemester = null 
}) {
  const [formData, setFormData] = useState({
    Section_id: '',
    faculty_id: '',
    school_year_id: activeSchoolYear?.id || '',
    Semester_id: activeSemester?.id || '',
    subject_id: '',
    day_of_week: '',
    start_time: '',
    endtime: '',
    is_active: true
  })
  const [errors, setErrors] = useState({})
  const [processing, setProcessing] = useState(false)

  // Days of the week options
  const daysOfWeek = [
    'Monday',
    'Tuesday', 
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'
  ]

  // Time slots (common school hours)
  const timeSlots = [
    '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'
  ]

  // Function to convert 24-hour time to 12-hour format
  const formatTimeTo12Hour = (time24) => {
    const [hours, minutes] = time24.split(':')
    const hour = parseInt(hours, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${hour12}:${minutes} ${ampm}`
  }

  useEffect(() => {
    if (classData) {
      // Editing existing class
      setFormData({
        Section_id: classData.Section_id || '',
        faculty_id: classData.faculty_id || '',
        school_year_id: classData.school_year_id || '',
        Semester_id: classData.Semester_id || '',
        subject_id: classData.subject_id || '',
        day_of_week: classData.day_of_week || '',
        start_time: classData.start_time || '',
        endtime: classData.endtime || '',
        is_active: classData.is_active ?? true
      })
    } else {
      // Creating new class
      setFormData({
        Section_id: '',
        faculty_id: '',
        school_year_id: activeSchoolYear?.id || '',
        Semester_id: activeSemester?.id || '',
        subject_id: '',
        day_of_week: '',
        start_time: '',
        endtime: '',
        is_active: true
      })
    }
    setErrors({})
  }, [classData, activeSchoolYear, activeSemester, isOpen])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.Section_id) {
      newErrors.Section_id = 'Section is required'
    }
    if (!formData.faculty_id) {
      newErrors.faculty_id = 'Faculty is required'
    }
    if (!formData.school_year_id) {
      newErrors.school_year_id = 'School year is required'
    }
    if (!formData.Semester_id) {
      newErrors.Semester_id = 'Semester is required'
    }
    if (!formData.subject_id) {
      newErrors.subject_id = 'Subject is required'
    }
    if (!formData.day_of_week) {
      newErrors.day_of_week = 'Day of week is required'
    }
    if (!formData.start_time) {
      newErrors.start_time = 'Start time is required'
    }
    if (!formData.endtime) {
      newErrors.endtime = 'End time is required'
    }

    // Validate time logic
    if (formData.start_time && formData.endtime) {
      if (formData.start_time >= formData.endtime) {
        newErrors.endtime = 'End time must be after start time'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setProcessing(true)

    const url = classData 
      ? `/registrar/classes/${classData.Id}`
      : '/registrar/classes'
    
    const method = classData ? 'put' : 'post'

    router[method](url, formData, {
      onSuccess: () => {
        onClose()
        setFormData({
          Section_id: '',
          faculty_id: '',
          school_year_id: activeSchoolYear?.id || '',
          Semester_id: activeSemester?.id || '',
          subject_id: '',
          day_of_week: '',
          start_time: '',
          endtime: '',
          is_active: true
        })
      },
      onError: (errors) => {
        setErrors(errors)
      },
      onFinish: () => {
        setProcessing(false)
      }
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {classData ? 'Edit Class' : 'Add New Class'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* General Error Display */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{errors.general}</p>
                </div>
              </div>
            </div>
          )}
          {/* Section Selection */}
          <div>
            <label htmlFor="Section_id" className="block text-sm font-medium text-gray-700 mb-2">
              Section *
            </label>
            <select
              id="Section_id"
              name="Section_id"
              value={formData.Section_id}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.Section_id ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select Section</option>
              {sections && sections.length > 0 ? (
                sections.map((section, index) => (
                  <option key={section.id || `section-${index}`} value={section.id}>
                    {section.section_name || section.SectionName} - {section.strand?.Strand_name || 'No Strand'}
                  </option>
                ))
              ) : (
                <option value="" disabled>No sections available</option>
              )}
            </select>
            {errors.Section_id && (
              <p className="mt-1 text-sm text-red-600">{errors.Section_id}</p>
            )}
            {(!sections || sections.length === 0) && (
              <p className="mt-1 text-sm text-amber-600">No active sections available. Please create sections first.</p>
            )}
          </div>

          {/* Faculty Selection */}
          <div>
            <label htmlFor="faculty_id" className="block text-sm font-medium text-gray-700 mb-2">
              Faculty *
            </label>
            <select
              id="faculty_id"
              name="faculty_id"
              value={formData.faculty_id}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.faculty_id ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select Faculty</option>
              {faculty.map((f, index) => (
                <option key={f.id || `faculty-${index}`} value={f.id}>
                  {f.FirstName} {f.MiddleName ? f.MiddleName + ' ' : ''}{f.LastName}
                </option>
              ))}
            </select>
            {errors.faculty_id && (
              <p className="mt-1 text-sm text-red-600">{errors.faculty_id}</p>
            )}
          </div>

          {/* School Year and Semester Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* School Year Selection */}
            <div>
              <label htmlFor="school_year_id" className="block text-sm font-medium text-gray-700 mb-2">
                School Year *
              </label>
              <select
                id="school_year_id"
                name="school_year_id"
                value={formData.school_year_id}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.school_year_id ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select School Year</option>
                {schoolYears.map((sy, index) => (
                  <option key={sy.id || `schoolyear-${index}`} value={sy.id}>
                    {sy.School_year_start} - {sy.School_year_end}
                  </option>
                ))}
              </select>
              {errors.school_year_id && (
                <p className="mt-1 text-sm text-red-600">{errors.school_year_id}</p>
              )}
            </div>

            {/* Semester Selection */}
            <div>
              <label htmlFor="Semester_id" className="block text-sm font-medium text-gray-700 mb-2">
                Semester *
              </label>
              <select
                id="Semester_id"
                name="Semester_id"
                value={formData.Semester_id}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.Semester_id ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select Semester</option>
                {semesters.map((semester, index) => (
                  <option key={semester.id || `semester-${index}`} value={semester.id}>
                    {semester.semester_type}
                  </option>
                ))}
              </select>
              {errors.Semester_id && (
                <p className="mt-1 text-sm text-red-600">{errors.Semester_id}</p>
              )}
            </div>

            {/* Subject Selection */}
            <div>
              <label htmlFor="subject_id" className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <select
                id="subject_id"
                name="subject_id"
                value={formData.subject_id}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.subject_id ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select Subject</option>
                {subjects && subjects.length > 0 ? (
                  subjects.map((subject, index) => (
                    <option key={subject.Id || `subject-${index}`} value={subject.Id}>
                      {subject.Subject_name} ({subject.Subject_code})
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No subjects available</option>
                )}
              </select>
              {errors.subject_id && (
                <p className="mt-1 text-sm text-red-600">{errors.subject_id}</p>
              )}
              {(!subjects || subjects.length === 0) && (
                <p className="mt-1 text-sm text-amber-600">No subjects available. Please add subjects first.</p>
              )}
            </div>
          </div>

          {/* Schedule Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Day of Week */}
            <div>
              <label htmlFor="day_of_week" className="block text-sm font-medium text-gray-700 mb-2">
                Day of Week *
              </label>
              <select
                id="day_of_week"
                name="day_of_week"
                value={formData.day_of_week}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.day_of_week ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select Day</option>
                {daysOfWeek.map((day, index) => (
                  <option key={`day-${index}`} value={day}>
                    {day}
                  </option>
                ))}
              </select>
              {errors.day_of_week && (
                <p className="mt-1 text-sm text-red-600">{errors.day_of_week}</p>
              )}
            </div>

            {/* Start Time */}
            <div>
              <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-2">
                Start Time *
              </label>
              <select
                id="start_time"
                name="start_time"
                value={formData.start_time}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.start_time ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select Time</option>
                {timeSlots.map((time, index) => (
                  <option key={`start-time-${index}`} value={time}>
                    {formatTimeTo12Hour(time)}
                  </option>
                ))}
              </select>
              {errors.start_time && (
                <p className="mt-1 text-sm text-red-600">{errors.start_time}</p>
              )}
            </div>

            {/* End Time */}
            <div>
              <label htmlFor="endtime" className="block text-sm font-medium text-gray-700 mb-2">
                End Time *
              </label>
              <select
                id="endtime"
                name="endtime"
                value={formData.endtime}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.endtime ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select Time</option>
                {timeSlots.map((time, index) => (
                  <option key={`end-time-${index}`} value={time}>
                    {formatTimeTo12Hour(time)}
                  </option>
                ))}
              </select>
              {errors.endtime && (
                <p className="mt-1 text-sm text-red-600">{errors.endtime}</p>
              )}
            </div>
          </div>

          {/* Status Toggle */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Active Class</span>
            </label>
            <p className="mt-1 text-xs text-gray-500">
              Inactive classes will not appear in faculty schedules or student enrollment
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
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
              {processing ? 'Saving...' : (classData ? 'Update Class' : 'Create Class')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
