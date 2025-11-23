import { useState, useEffect } from 'react'
import { router } from '@inertiajs/react'
import Swal from 'sweetalert2'

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
  const [selectedSection, setSelectedSection] = useState(null)

  // Days of the week options
  const daysOfWeek = [
    'Monday',
    'Tuesday', 
    'Wednesday',
    'Thursday',
    'Friday'
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
      // Normalize time format to H:i (remove seconds if present)
      const normalizeTime = (time) => {
        if (!time) return ''
        // If time has seconds (e.g., "07:00:00"), remove them
        return time.length > 5 ? time.substring(0, 5) : time
      }
      
      setFormData({
        Section_id: classData.Section_id || '',
        faculty_id: classData.faculty_id || '',
        school_year_id: classData.school_year_id || '',
        Semester_id: classData.Semester_id || '',
        subject_id: classData.subject_id || '',
        day_of_week: classData.day_of_week || '',
        start_time: normalizeTime(classData.start_time),
        endtime: normalizeTime(classData.endtime),
        is_active: classData.is_active ?? true
      })
      
      // Set selected section for editing
      const section = sections.find(s => s.id === classData.Section_id)
      setSelectedSection(section || null)
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
      setSelectedSection(null)
    }
    setErrors({})
  }, [classData, activeSchoolYear, activeSemester, isOpen, sections])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Handle section change to update available subjects
    if (name === 'Section_id') {
      const section = sections.find(s => s.id === parseInt(value))
      setSelectedSection(section || null)
      
      // Clear subject selection when section changes
      setFormData(prev => ({
        ...prev,
        Section_id: value,
        subject_id: '' // Reset subject when section changes
      }))
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }))
    }
  }

  // Filter subjects based on selected section's grade level and strand
  const getFilteredSubjects = () => {
    if (!selectedSection || !subjects) {
      return subjects || []
    }
    
    // Get the strand_id from the selected section
    const sectionStrandId = selectedSection.strand?.id || selectedSection.strand_id
    
    // Filter subjects that match both the selected section's year_level AND strand_id
    return subjects.filter(subject => {
      const matchesYearLevel = subject.year_level === selectedSection.year_level
      const subjectStrandId = subject.strand?.id || subject.strand_id
      const matchesStrand = !sectionStrandId || !subjectStrandId || subjectStrandId === sectionStrandId
      
      return matchesYearLevel && matchesStrand
    })
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

    // Validate grade level and strand matching
    if (formData.Section_id && formData.subject_id && selectedSection) {
      const selectedSubject = subjects.find(s => s.Id === parseInt(formData.subject_id))
      if (selectedSubject) {
        if (selectedSubject.year_level !== selectedSection.year_level) {
          newErrors.subject_id = `Subject must be for Grade ${selectedSection.year_level} to match the selected section`
        }
        
        // Check strand matching
        const sectionStrandId = selectedSection.strand?.id || selectedSection.strand_id
        const subjectStrandId = selectedSubject.strand?.id || selectedSubject.strand_id
        if (sectionStrandId && subjectStrandId && subjectStrandId !== sectionStrandId) {
          newErrors.subject_id = `Subject must belong to the same strand as the selected section`
        }
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
      onError: (serverErrors) => {
        // Preserve all form data - do NOT reset anything
        const updatedErrors = { ...serverErrors }
        let conflictMessage = null
        let conflictFields = []

        // Handle general/schedule conflicts
        if (serverErrors.schedule_conflict) {
          updatedErrors.general = serverErrors.schedule_conflict
          conflictMessage = serverErrors.schedule_conflict
          // Schedule conflicts usually involve faculty_id, day_of_week, start_time, or endtime
          if (!conflictFields.includes('faculty_id')) conflictFields.push('faculty_id')
          if (!conflictFields.includes('day_of_week')) conflictFields.push('day_of_week')
          if (!conflictFields.includes('start_time')) conflictFields.push('start_time')
          if (!conflictFields.includes('endtime')) conflictFields.push('endtime')
        }

        // Handle subject_id conflicts (duplicate subject, same day, etc.)
        if (serverErrors.subject_id) {
          // Keep the field-specific error, but also show as general note
          if (!updatedErrors.general) {
            updatedErrors.general = serverErrors.subject_id
          }
          if (!conflictMessage) {
            conflictMessage = serverErrors.subject_id
          }
          if (!conflictFields.includes('subject_id')) conflictFields.push('subject_id')
          // If it's a same-day conflict, also highlight day_of_week
          if (typeof serverErrors.subject_id === 'string' && serverErrors.subject_id.toLowerCase().includes('same day')) {
            if (!conflictFields.includes('day_of_week')) conflictFields.push('day_of_week')
          }
        }

        // Handle faculty_id conflicts (load limit, etc.)
        if (serverErrors.faculty_id) {
          // Keep the field-specific error, but also show as general note
          if (!updatedErrors.general) {
            updatedErrors.general = serverErrors.faculty_id
          }
          if (!conflictMessage) {
            conflictMessage = serverErrors.faculty_id
          }
          if (!conflictFields.includes('faculty_id')) conflictFields.push('faculty_id')
        }

        // Handle Section_id conflicts
        if (serverErrors.Section_id && typeof serverErrors.Section_id === 'string' && serverErrors.Section_id.toLowerCase().includes('conflict')) {
          if (!conflictMessage) {
            conflictMessage = serverErrors.Section_id
          }
          if (!conflictFields.includes('Section_id')) conflictFields.push('Section_id')
        }

        setErrors(updatedErrors)

        // Show SweetAlert for conflicts with guidance on what to change
        if (conflictMessage) {
          const fieldsToChange = conflictFields.length > 0 
            ? `<p class="mt-2 text-sm"><strong>Please review and change:</strong> ${conflictFields.map(f => f.replace('_', ' ')).join(', ')}</p>`
            : ''
          
          Swal.fire({
            icon: 'error',
            title: 'Conflict Detected',
            html: `<div class="text-left">
              <p class="mb-2"><strong>Cannot create/update class due to the following conflict:</strong></p>
              <p class="text-gray-700">${conflictMessage}</p>
              ${fieldsToChange}
              <p class="mt-3 text-xs text-gray-500">Your form data has been preserved. Please adjust the highlighted fields above.</p>
            </div>`,
            confirmButtonText: 'OK',
            confirmButtonColor: '#dc2626',
            width: '550px',
            customClass: {
              popup: 'rounded-lg',
              title: 'text-lg font-semibold',
              htmlContainer: 'text-sm'
            }
          }).then(() => {
            // Scroll to first error field after closing alert
            if (conflictFields.length > 0) {
              const firstErrorField = document.getElementById(conflictFields[0])
              if (firstErrorField) {
                firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' })
                firstErrorField.focus()
              }
            }
          })
        }
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
            <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4 shadow-sm">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-semibold text-red-800 mb-1">Conflict Detected</h3>
                  <p className="text-sm text-red-700">{errors.general}</p>
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
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                errors.Section_id ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : 'border-gray-300'
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
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                errors.faculty_id ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : 'border-gray-300'
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
                {selectedSection && (
                  <span className="text-xs text-gray-500 ml-2">
                    (Grade {selectedSection.year_level} {selectedSection.strand?.Strand_name ? `- ${selectedSection.strand.Strand_name}` : ''} subjects only)
                  </span>
                )}
              </label>
              <select
                id="subject_id"
                name="subject_id"
                value={formData.subject_id}
                onChange={handleChange}
                disabled={!selectedSection}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  errors.subject_id ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : 'border-gray-300'
                } ${!selectedSection ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              >
                <option value="">
                  {!selectedSection ? 'Select a section first' : 'Select Subject'}
                </option>
                {selectedSection && getFilteredSubjects().length > 0 ? (
                  getFilteredSubjects().map((subject, index) => (
                    <option key={subject.Id || `subject-${index}`} value={subject.Id}>
                      {subject.Subject_name} ({subject.Subject_code}) - Grade {subject.year_level}
                    </option>
                  ))
                ) : selectedSection ? (
                  <option value="" disabled>No Grade {selectedSection.year_level} subjects available</option>
                ) : null}
              </select>
              {errors.subject_id && (
                <p className="mt-1 text-sm text-red-600">{errors.subject_id}</p>
              )}
              {!selectedSection && (
                <p className="mt-1 text-sm text-gray-500">Please select a section first to see available subjects.</p>
              )}
              {selectedSection && getFilteredSubjects().length === 0 && (
                <p className="mt-1 text-sm text-amber-600">
                  No Grade {selectedSection.year_level} {selectedSection.strand?.Strand_name ? `${selectedSection.strand.Strand_name} ` : ''}subjects available for the selected semester. 
                  Please add subjects for Grade {selectedSection.year_level} {selectedSection.strand?.Strand_name ? `in ${selectedSection.strand.Strand_name} strand ` : ''}first.
                </p>
              )}
              {selectedSection && getFilteredSubjects().length > 0 && (
                <p className="mt-1 text-sm text-green-600">
                  Showing {getFilteredSubjects().length} Grade {selectedSection.year_level} {selectedSection.strand?.Strand_name ? `${selectedSection.strand.Strand_name} ` : ''}subject(s)
                </p>
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
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  errors.day_of_week ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : 'border-gray-300'
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
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  errors.start_time ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : 'border-gray-300'
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
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  errors.endtime ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : 'border-gray-300'
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
