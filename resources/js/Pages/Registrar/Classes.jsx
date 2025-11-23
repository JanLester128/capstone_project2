import { useState, useEffect } from 'react'
import { Head, router, useForm } from '@inertiajs/react'
import RegistrarSidebar from '../Auth/Registrar_sidebar'
import Breadcrumb from './Components/Breadcrumb'
import Swal from 'sweetalert2'

// Function to convert 24-hour time to 12-hour format
const formatTimeTo12Hour = (time24) => {
  if (!time24) return ''
  
  // Normalize the time string - remove any extra characters and ensure proper format
  let timeStr = String(time24).trim()
  
  // If time doesn't have a colon, try to parse it differently
  if (!timeStr.includes(':')) {
    // If it's a 4-digit number like "2013", treat it as "20:13"
    if (timeStr.length === 4 && /^\d{4}$/.test(timeStr)) {
      timeStr = `${timeStr.substring(0, 2)}:${timeStr.substring(2, 4)}`
    } else {
      return time24 // Return as-is if we can't parse it
    }
  }
  
  // Split by colon and ensure we have both parts
  const parts = timeStr.split(':')
  if (parts.length < 2) {
    return time24 // Return as-is if invalid format
  }
  
  const hours = parts[0]
  const minutes = parts[1] || '00' // Default to '00' if minutes are missing
  
  const hour = parseInt(hours, 10)
  if (isNaN(hour) || hour < 0 || hour > 23) {
    return time24 // Return as-is if invalid hour
  }
  
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  
  // Ensure minutes are properly formatted (2 digits)
  const minutesFormatted = minutes.padStart(2, '0')
  
  return `${hour12}:${minutesFormatted} ${ampm}`
}

export default function Classes({ 
  classes = [], 
  sections = [], 
  faculty = [], 
  facultyLoads = {}, // Current faculty loads (faculty_id => load_count)
  semesters = [], 
  schoolYears = [], 
  subjects = [],
  activeSchoolYear,
  activeSemester,
  previousSemester = null,
  flash = {},
  errors: serverErrors = {}
}) {
  // Debug: Log sections to console for troubleshooting
  useEffect(() => {
    if (sections && sections.length > 0) {
      console.log('Sections loaded:', sections.length, sections)
    } else {
      console.warn('No sections available. Active SY:', activeSchoolYear?.id, 'Active Sem:', activeSemester?.id)
    }
  }, [sections, activeSchoolYear, activeSemester])
  const [showBulkForm, setShowBulkForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSemester, setFilterSemester] = useState('')
  const [filterSection, setFilterSection] = useState('')
  const [filterFaculty, setFilterFaculty] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [conflictErrors, setConflictErrors] = useState({})
  const [expandedSections, setExpandedSections] = useState({})
  const [sharedSectionId, setSharedSectionId] = useState('') // Shared section for time slot copying
  const [isTimeSlotMode, setIsTimeSlotMode] = useState(false) // Track if we're in time slot copy mode
  
  // Start with 1 card by default
  const [bulkClasses, setBulkClasses] = useState([
    { id: 1, Section_id: '', faculty_id: '', school_year_id: activeSchoolYear?.id || '', Semester_id: activeSemester?.id || '', subject_id: '', day_of_week: '', start_time: '', endtime: '', is_active: true },
  ])

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/registrar' },
    { label: 'Classes', href: '/registrar/classes', current: true }
  ]

  // Days of the week options
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

  // Predefined time slot pairs
  const predefinedTimeSlots = [
    { id: 'slot1', start: '08:30', end: '10:30', label: '8:30 AM - 10:30 AM' },
    { id: 'slot2', start: '11:00', end: '12:30', label: '11:00 AM - 12:30 PM' },
    { id: 'slot3', start: '13:30', end: '15:30', label: '1:30 PM - 3:30 PM' },
    { id: 'slot4', start: '15:30', end: '16:30', label: '3:30 PM - 4:30 PM' }
  ]

  // Time slots (kept for backward compatibility if needed)
  const timeSlots = [
    '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'
  ]

  // Update shared section (applies to all time slots in time slot mode)
  const handleSharedSectionChange = (sectionId) => {
    setSharedSectionId(sectionId)
    // Apply section to all bulk classes
    setBulkClasses(prev => prev.map(cls => ({
      ...cls,
      Section_id: sectionId,
      subject_id: '' // Reset subject when section changes
    })))
  }

  // Handle time slot selection
  const handleTimeSlotChange = (index, timeSlotId) => {
    const selectedSlot = predefinedTimeSlots.find(slot => slot.id === timeSlotId)
    if (selectedSlot) {
      setBulkClasses(prev => {
        const updated = [...prev]
        updated[index] = {
          ...updated[index],
          start_time: selectedSlot.start,
          endtime: selectedSlot.end
        }
        return updated
      })
      
      // Clear conflict errors for time fields
      setConflictErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[`classes.${index}.start_time`]
        delete newErrors[`classes.${index}.endtime`]
        return newErrors
      })
    } else {
      // Clear times if "Select Time Slot" is selected
      setBulkClasses(prev => {
        const updated = [...prev]
        updated[index] = {
          ...updated[index],
          start_time: '',
          endtime: ''
        }
        return updated
      })
    }
  }

  // Get selected time slot ID for a class
  const getSelectedTimeSlotId = (startTime, endTime) => {
    const slot = predefinedTimeSlots.find(slot => slot.start === startTime && slot.end === endTime)
    return slot ? slot.id : ''
  }

  // Normalize time to HH:MM format
  const normalizeTimeInput = (time) => {
    if (!time) return ''
    let timeStr = String(time).trim()
    
    // Remove seconds if present (e.g., "07:00:00" -> "07:00")
    if (timeStr.length > 5 && timeStr.includes(':')) {
      timeStr = timeStr.substring(0, 5)
    }
    
    // Handle cases like "2013" -> "20:13"
    if (!timeStr.includes(':') && timeStr.length === 4 && /^\d{4}$/.test(timeStr)) {
      timeStr = `${timeStr.substring(0, 2)}:${timeStr.substring(2, 4)}`
    }
    
    // Validate format: should be HH:MM
    if (!/^\d{1,2}:\d{2}$/.test(timeStr)) {
      return time // Return original if invalid, let validation catch it
    }
    
    // Ensure proper format (pad hours if needed)
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours, 10)
    const min = parseInt(minutes, 10)
    
    if (isNaN(hour) || isNaN(min) || hour < 0 || hour > 23 || min < 0 || min > 59) {
      return time // Return original if invalid
    }
    
    // Return in HH:MM format
    return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`
  }

  // Update bulk class data
  const handleBulkChange = (index, field, value) => {
    setBulkClasses(prev => {
      const updated = [...prev]
      
      // Normalize time fields
      if (field === 'start_time' || field === 'endtime') {
        updated[index] = { ...updated[index], [field]: normalizeTimeInput(value) }
      } else {
      updated[index] = { ...updated[index], [field]: value }
      }
      
      // If section changes in normal mode, get filtered subjects for that section
      if (field === 'Section_id' && !isTimeSlotMode) {
        updated[index].subject_id = '' // Reset subject when section changes
      }
      
      // If subject changes in time slot mode, ensure section is set
      if (field === 'subject_id' && isTimeSlotMode && !updated[index].Section_id && sharedSectionId) {
        updated[index].Section_id = sharedSectionId
      }
      
      // Validate time logic when both times are set
      if ((field === 'start_time' || field === 'endtime') && updated[index].start_time && updated[index].endtime) {
        const start = updated[index].start_time
        const end = updated[index].endtime
        if (start >= end) {
          // Clear the error when user changes the time
          setConflictErrors(prev => {
            const newErrors = { ...prev }
            delete newErrors[`classes.${index}.start_time`]
            delete newErrors[`classes.${index}.endtime`]
            return newErrors
          })
        }
      }
      
      return updated
    })
    
    // Clear error for this field
    if (conflictErrors[`classes.${index}.${field}`]) {
      setConflictErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[`classes.${index}.${field}`]
        return newErrors
      })
    }
  }

  // Get filtered subjects based on section
  const getFilteredSubjects = (sectionId) => {
    if (!sectionId || !subjects) return []
    
    const section = sections.find(s => s.id === parseInt(sectionId))
    if (!section) return []
    
    const sectionStrandId = section.strand?.id || section.strand_id
    
    return subjects.filter(subject => {
      const matchesYearLevel = subject.year_level === section.year_level
      const subjectStrandId = subject.strand?.id || subject.strand_id
      const matchesStrand = !sectionStrandId || !subjectStrandId || subjectStrandId === sectionStrandId
      
      return matchesYearLevel && matchesStrand
    })
  }

  // Copy time slots from previous semester (only schedule, not faculty/subject)
  const handleCopyTimeSlots = () => {
    if (!previousSemester) {
      Swal.fire({
        icon: 'info',
        title: 'No Previous Semester',
        text: 'No previous semester found to copy time slots from.',
        confirmButtonColor: '#4f46e5'
      })
      return
    }

    Swal.fire({
      title: 'Copy Time Slots from Previous Semester?',
      html: `<div class="text-left">
        <p>This will copy only the <strong>schedule structure</strong> (day, start time, end time) from <strong>${previousSemester.semester_type} Semester</strong>.</p>
        <p class="mt-2 text-sm text-gray-600">You will need to assign <strong>Section</strong>, <strong>Faculty</strong>, and <strong>Subject</strong> for each time slot manually.</p>
      </div>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Copy Time Slots',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280'
    }).then((result) => {
      if (result.isConfirmed) {
        // Show loading
        Swal.fire({
          title: 'Loading Time Slots...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading()
          }
        })

        // Fetch time slots from API
        fetch('/registrar/classes/time-slots-from-previous-semester')
          .then(response => response.json())
          .then(data => {
            if (data.success && data.timeSlots && data.timeSlots.length > 0) {
              // Open bulk form if not already open
              if (!showBulkForm) {
                setShowBulkForm(true)
              }

              // Normalize time format to H:i (remove seconds if present)
              const normalizeTime = (time) => {
                if (!time) return ''
                
                // Convert to string and trim
                let timeStr = String(time).trim()
                
                // If time has seconds (e.g., "07:00:00"), remove them
                if (timeStr.length > 5 && timeStr.includes(':')) {
                  timeStr = timeStr.substring(0, 5)
                }
                
                // Ensure proper format: if it's missing colon, try to add it
                // Handle cases like "2013" -> "20:13"
                if (!timeStr.includes(':') && timeStr.length === 4 && /^\d{4}$/.test(timeStr)) {
                  timeStr = `${timeStr.substring(0, 2)}:${timeStr.substring(2, 4)}`
                }
                
                // Validate format: should be HH:MM
                if (!/^\d{1,2}:\d{2}$/.test(timeStr)) {
                  console.warn('Invalid time format:', time, '-> normalized to:', timeStr)
                  return '' // Return empty if invalid
                }
                
                return timeStr
              }

              // Create class cards for each time slot (up to 5)
              const maxSlots = Math.min(data.timeSlots.length, 5)
              const currentMaxId = bulkClasses.length > 0 ? Math.max(...bulkClasses.map(c => c.id || 0), 0) : 0
              const newClasses = data.timeSlots.slice(0, maxSlots).map((slot, index) => ({
                id: currentMaxId + index + 1,
                Section_id: '', // Will be set from shared section
                faculty_id: '',
                school_year_id: activeSchoolYear?.id || '',
                Semester_id: activeSemester?.id || '',
                subject_id: '',
                day_of_week: slot.day_of_week,
                start_time: normalizeTime(slot.start_time),
                endtime: normalizeTime(slot.endtime),
                is_active: true
              }))

              // Replace existing bulk classes and enable time slot mode
              setBulkClasses(newClasses)
              setIsTimeSlotMode(true)
              setSharedSectionId('') // Reset shared section

              Swal.fire({
                icon: 'success',
                title: 'Time Slots Copied',
                html: `<div class="text-left">
                  <p>Successfully loaded <strong>${maxSlots}</strong> time slot(s) from ${data.previousSemester}.</p>
                  <p class="mt-2 text-sm text-gray-600">Please select a <strong>Section</strong> for all time slots, then assign <strong>Faculty</strong> and <strong>Subject</strong> for each.</p>
                </div>`,
                confirmButtonColor: '#10b981'
              })
            } else {
              Swal.fire({
                icon: 'info',
                title: 'No Time Slots Found',
                text: data.message || 'No time slots found in the previous semester.',
                confirmButtonColor: '#4f46e5'
              })
            }
          })
          .catch(error => {
            Swal.fire({
              icon: 'error',
              title: 'Failed to Load Time Slots',
              text: 'An error occurred while loading time slots. Please try again.',
              confirmButtonColor: '#dc2626'
            })
          })
      }
    })
  }

  // Calculate current faculty loads including new assignments
  const calculateFacultyLoadsWithNew = () => {
    const loads = { ...facultyLoads } // Start with existing loads
    
    // Count unique sections per faculty in the form
    const facultySections = {}
    bulkClasses.forEach(cls => {
      if (cls.faculty_id && cls.Section_id) {
        // Normalize faculty_id to string for consistency
        const facultyId = String(cls.faculty_id)
        if (!facultySections[facultyId]) {
          facultySections[facultyId] = new Set()
        }
        facultySections[facultyId].add(cls.Section_id)
      }
    })
    
    // Add new loads to existing loads
    // Note: We assume sections in the form are new (not already counted in facultyLoads)
    // This is because facultyLoads only counts existing classes, not form entries
    Object.entries(facultySections).forEach(([facultyId, sections]) => {
      // Check both string and number keys for existing load
      const existingLoad = loads[facultyId] || loads[Number(facultyId)] || 0
      const newLoad = sections.size
      loads[facultyId] = existingLoad + newLoad
    })
    
    return loads
  }

  // Check for conflicts before submission
  const checkConflicts = (classesToCheck) => {
    const conflicts = {}
    
    // Check for duplicate classes (same faculty, section, subject, day, time)
    classesToCheck.forEach((cls, index) => {
      if (!cls.Section_id || !cls.faculty_id || !cls.subject_id || !cls.day_of_week || !cls.start_time || !cls.endtime) {
        return // Skip incomplete classes
      }
      
      // Check against other classes in the form
      classesToCheck.forEach((otherCls, otherIndex) => {
        if (index === otherIndex) return
        
        if (otherCls.Section_id && otherCls.faculty_id && otherCls.subject_id && otherCls.day_of_week && otherCls.start_time && otherCls.endtime) {
          // Check for exact duplicate
          if (
            cls.Section_id === otherCls.Section_id &&
            cls.faculty_id === otherCls.faculty_id &&
            cls.subject_id === otherCls.subject_id &&
            cls.day_of_week === otherCls.day_of_week &&
            cls.start_time === otherCls.start_time &&
            cls.endtime === otherCls.endtime
          ) {
            conflicts[`classes.${index}.subject_id`] = 'This class is a duplicate of another class in the form.'
            conflicts[`classes.${otherIndex}.subject_id`] = 'This class is a duplicate of another class in the form.'
          }
          
          // Check for time overlap (same faculty, same day, overlapping times)
          if (
            cls.faculty_id === otherCls.faculty_id &&
            cls.day_of_week === otherCls.day_of_week &&
            cls.start_time && cls.endtime && otherCls.start_time && otherCls.endtime
          ) {
            const clsStart = cls.start_time
            const clsEnd = cls.endtime
            const otherStart = otherCls.start_time
            const otherEnd = otherCls.endtime
            
            // Check if times overlap
            if (
              (clsStart < otherEnd && clsEnd > otherStart) ||
              (clsStart === otherStart && clsEnd === otherEnd)
            ) {
              if (!conflicts[`classes.${index}.start_time`]) {
                conflicts[`classes.${index}.start_time`] = 'Time conflict: Faculty has another class at this time.'
              }
              if (!conflicts[`classes.${otherIndex}.start_time`]) {
                conflicts[`classes.${otherIndex}.start_time`] = 'Time conflict: Faculty has another class at this time.'
              }
            }
          }
        }
      })
    })
    
    return conflicts
  }

  // Submit bulk classes
  const handleBulkSubmit = () => {
    // In time slot mode, ensure all classes have the shared section ID
    let classesToSubmit = [...bulkClasses]
    if (isTimeSlotMode && sharedSectionId) {
      classesToSubmit = classesToSubmit.map(cls => ({
        ...cls,
        Section_id: sharedSectionId
      }))
    }

    // Filter out empty classes (those without required fields)
    const validClasses = classesToSubmit.filter(cls => 
      cls.Section_id && cls.faculty_id && cls.subject_id && cls.day_of_week && cls.start_time && cls.endtime
    )

    // In time slot mode, validate that shared section is selected
    if (isTimeSlotMode && !sharedSectionId) {
      Swal.fire({
        icon: 'warning',
        title: 'Section Required',
        text: 'Please select a Section for all time slots.',
        confirmButtonColor: '#4f46e5'
      })
      return
    }

    if (validClasses.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Classes to Create',
        text: isTimeSlotMode 
          ? 'Please fill in Faculty and Subject for at least one time slot.'
          : 'Please fill in at least one complete class form.',
        confirmButtonColor: '#4f46e5'
      })
      return
    }

    // Check for conflicts BEFORE submitting
    const conflicts = checkConflicts(validClasses)
    if (Object.keys(conflicts).length > 0) {
      setConflictErrors(conflicts)
      
      const errorMessages = Object.entries(conflicts).map(([key, message]) => {
        const match = key.match(/classes\.(\d+)\.(.+)/)
        if (match) {
          const index = parseInt(match[1])
          const field = match[2].replace(/_/g, ' ')
          return `<li class="text-left"><strong>Class ${index + 1}, ${field}:</strong> ${message}</li>`
        }
        return `<li class="text-left">${message}</li>`
      })
      
      Swal.fire({
        icon: 'error',
        title: 'Conflicts Detected',
        html: `<div class="text-left">
          <p class="mb-3 font-semibold">Please fix the following conflicts before submitting:</p>
          <ul class="list-disc list-inside space-y-1 text-sm text-gray-700">${errorMessages.join('')}</ul>
          <p class="mt-4 text-xs text-gray-500">Your form data has been preserved. Please fix the errors and try again.</p>
        </div>`,
        confirmButtonText: 'Fix Errors',
        confirmButtonColor: '#dc2626',
        width: '600px'
      })
      return // DO NOT SUBMIT if conflicts exist
    }

    // Check faculty loads (unique sections per faculty)
    const newFacultyLoads = calculateFacultyLoadsWithNew()
    const exceededFaculty = Object.entries(newFacultyLoads).find(([id, count]) => count > 5)
    if (exceededFaculty) {
      const facultyMember = faculty.find(f => f.id === parseInt(exceededFaculty[0]) || String(f.id) === exceededFaculty[0])
      const facultyName = facultyMember ? `${facultyMember.FirstName} ${facultyMember.LastName}` : 'Faculty member'
      // Check both string and number keys
      const facultyIdKey = exceededFaculty[0]
      const currentLoad = facultyLoads[facultyIdKey] || facultyLoads[Number(facultyIdKey)] || 0
      const newLoad = exceededFaculty[1] - currentLoad
      
      Swal.fire({
        icon: 'error',
        title: 'Load Limit Exceeded',
        html: `<div class="text-left">
          <p><strong>${facultyName}</strong> currently has <strong>${currentLoad} load(s)</strong>.</p>
          <p class="mt-2">Adding these classes would give them <strong>${exceededFaculty[1]} loads</strong>.</p>
          <p class="mt-2 text-gray-600">Maximum load per faculty is <strong>5 sections</strong>.</p>
          <p class="mt-2 text-sm text-gray-500">Please reduce the number of sections or assign to different faculty members.</p>
        </div>`,
        confirmButtonColor: '#dc2626'
      })
      return
    }

    // Validate time format and logic
    const timeErrors = {}
    validClasses.forEach((cls, index) => {
      const startTime = normalizeTimeInput(cls.start_time)
      const endTime = normalizeTimeInput(cls.endtime)
      
      // Check if time format is valid
      if (!startTime || !/^\d{2}:\d{2}$/.test(startTime)) {
        timeErrors[`classes.${index}.start_time`] = 'Invalid start time format. Use HH:MM format (e.g., 07:00).'
      }
      
      if (!endTime || !/^\d{2}:\d{2}$/.test(endTime)) {
        timeErrors[`classes.${index}.endtime`] = 'Invalid end time format. Use HH:MM format (e.g., 17:00).'
      }
      
      // Check time logic if both are valid
      if (startTime && endTime && /^\d{2}:\d{2}$/.test(startTime) && /^\d{2}:\d{2}$/.test(endTime)) {
        if (startTime >= endTime) {
          timeErrors[`classes.${index}.start_time`] = 'Start time must be before end time.'
        }
      }
    })
    
    if (Object.keys(timeErrors).length > 0) {
      setConflictErrors(timeErrors)
      Swal.fire({
        icon: 'error',
        title: 'Time Validation Errors',
        html: `<div class="text-left">
          <p class="mb-3 font-semibold">Please fix the following time errors:</p>
          <ul class="list-disc list-inside space-y-1 text-sm text-gray-700">
            ${Object.entries(timeErrors).map(([key, msg]) => {
              const match = key.match(/classes\.(\d+)\.(.+)/)
              if (match) {
                return `<li><strong>Class ${parseInt(match[1]) + 1}:</strong> ${msg}</li>`
              }
              return `<li>${msg}</li>`
            }).join('')}
          </ul>
        </div>`,
        confirmButtonColor: '#dc2626'
      })
      return
    }

    // Clear any previous errors
    setConflictErrors({})

    // Submit to backend
    router.post('/registrar/classes/bulk', { classes: validClasses }, {
      preserveScroll: false, // Changed to false to ensure page reloads and facultyLoads updates
      onSuccess: (page) => {
        // Reset form to 1 card
        setBulkClasses([
          { id: 1, Section_id: '', faculty_id: '', school_year_id: activeSchoolYear?.id || '', Semester_id: activeSemester?.id || '', subject_id: '', day_of_week: '', start_time: '', endtime: '', is_active: true },
        ])
        setConflictErrors({})
        setShowBulkForm(false)
        setIsTimeSlotMode(false)
        setSharedSectionId('')
        
        Swal.fire({
          icon: 'success',
          title: 'Classes Created!',
          text: `Successfully created ${validClasses.length} class(es).`,
          confirmButtonColor: '#10b981',
          timer: 2000
        })
      },
      onError: (errors) => {
        // Parse errors and map to specific fields
        setConflictErrors(errors)
        
        // Show detailed error message
        const errorMessages = Object.entries(errors).map(([key, message]) => {
          const match = key.match(/classes\.(\d+)\.(.+)/)
          if (match) {
            const index = parseInt(match[1])
            const field = match[2].replace(/_/g, ' ')
            return `<li class="text-left"><strong>Class ${index + 1}, ${field}:</strong> ${message}</li>`
          }
          return `<li class="text-left">${message}</li>`
        })
        
        Swal.fire({
          icon: 'error',
          title: 'Submission Failed',
          html: `<div class="text-left">
            <p class="mb-3 font-semibold">Please fix the following errors:</p>
            <ul class="list-disc list-inside space-y-1 text-sm text-gray-700">${errorMessages.join('')}</ul>
            <p class="mt-4 text-xs text-gray-500">Your form data has been preserved. Please fix the errors and try again.</p>
          </div>`,
          confirmButtonText: 'Fix Errors',
          confirmButtonColor: '#dc2626',
          width: '600px'
        })
      }
    })
  }

  const handleArchive = (classId, currentStatus) => {
    const action = currentStatus ? 'archive' : 'restore'
    const actionText = currentStatus ? 'archive (deactivate)' : 'restore (activate)'
    
    Swal.fire({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Class?`,
      text: `Are you sure you want to ${actionText} this class?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: currentStatus ? '#dc2626' : '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: `Yes, ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        router.put(`/registrar/classes/${classId}/toggle`, {}, {
          onSuccess: () => {
            Swal.fire({
              title: `${action.charAt(0).toUpperCase() + action.slice(1)}d!`,
              text: `Class has been ${action}d successfully.`,
              icon: 'success',
              confirmButtonText: 'OK',
              confirmButtonColor: '#10b981',
              timer: 2000
            })
          },
          onError: () => {
            Swal.fire({
              title: `${action.charAt(0).toUpperCase() + action.slice(1)} Failed`,
              text: `Failed to ${action} the class. Please try again.`,
              icon: 'error',
              confirmButtonText: 'OK',
              confirmButtonColor: '#dc2626'
            })
          }
        })
      }
    })
  }

  const toggleSection = (sectionName) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }))
  }

  // Calculate how many more cards can be added based on faculty loads
  const getMaxRemainingCards = () => {
    // If no classes yet, can add up to 5
    if (bulkClasses.length === 0) {
      return 5
    }
    
    // Count unique sections per faculty in current form
    const facultySections = {}
    bulkClasses.forEach(cls => {
      if (cls.faculty_id && cls.Section_id) {
        const facultyId = cls.faculty_id
        if (!facultySections[facultyId]) {
          facultySections[facultyId] = new Set()
        }
        facultySections[facultyId].add(cls.Section_id)
      }
    })
    
    // If no faculty with sections selected yet, can add up to 5 cards total
    if (Object.keys(facultySections).length === 0) {
      return 5 - bulkClasses.length
    }
    
    // Find the faculty with the least remaining capacity
    let minRemaining = 5 // Maximum allowed
    Object.entries(facultySections).forEach(([facultyId, sections]) => {
      // Check both string and number keys
      const currentLoad = facultyLoads[facultyId] || facultyLoads[Number(facultyId)] || 0
      const newLoad = sections.size
      const totalLoad = currentLoad + newLoad
      const remaining = 5 - totalLoad
      if (remaining < minRemaining) {
        minRemaining = remaining
      }
    })
    
    // Also check if we've reached max cards (5)
    const maxCardsRemaining = 5 - bulkClasses.length
    
    return Math.max(0, Math.min(minRemaining, maxCardsRemaining))
  }

  // Add a new class card (only if within faculty load limits)
  const addClassCard = () => {
    const maxRemaining = getMaxRemainingCards()
    const currentCount = bulkClasses.length
    
    if (currentCount >= 5) {
      Swal.fire({
        icon: 'info',
        title: 'Maximum Cards Reached',
        text: 'You can only create up to 5 classes at once.',
        confirmButtonColor: '#4f46e5'
      })
      return
    }
    
    if (maxRemaining <= 0 && currentCount > 0) {
      // Check if any faculty is at limit
      const facultySections = {}
      bulkClasses.forEach(cls => {
        if (cls.faculty_id && cls.Section_id) {
          const facultyId = cls.faculty_id
          if (!facultySections[facultyId]) {
            facultySections[facultyId] = new Set()
          }
          facultySections[facultyId].add(cls.Section_id)
        }
      })
      
      const atLimitFaculty = Object.entries(facultySections).find(([facultyId, sections]) => {
        // Check both string and number keys
        const currentLoad = facultyLoads[facultyId] || facultyLoads[Number(facultyId)] || 0
        const newLoad = sections.size
        return (currentLoad + newLoad) >= 5
      })
      
      if (atLimitFaculty) {
        const facultyMember = faculty.find(f => f.id === parseInt(atLimitFaculty[0]))
        const facultyName = facultyMember ? `${facultyMember.FirstName} ${facultyMember.LastName}` : 'Selected faculty'
        Swal.fire({
          icon: 'warning',
          title: 'Faculty Load Limit Reached',
          html: `<div class="text-left">
            <p><strong>${facultyName}</strong> has reached the maximum load of 5 sections.</p>
            <p class="mt-2 text-sm text-gray-600">Please select a different faculty or remove some classes before adding more.</p>
          </div>`,
          confirmButtonColor: '#4f46e5'
        })
        return
      }
    }
    
    // Add card up to the limit
    const cardsToAdd = Math.min(1, maxRemaining, 5 - currentCount)
    if (cardsToAdd > 0) {
      const newId = Math.max(...bulkClasses.map(c => c.id || 0), 0) + 1
      setBulkClasses(prev => [...prev, {
        id: newId,
        Section_id: '',
        faculty_id: '',
        school_year_id: activeSchoolYear?.id || '',
        Semester_id: activeSemester?.id || '',
        subject_id: '',
        day_of_week: '',
        start_time: '',
        endtime: '',
        is_active: true
      }])
    }
  }

  // Remove a class card
  const removeClassCard = (id) => {
    if (bulkClasses.length > 1) {
      setBulkClasses(prev => prev.filter(c => c.id !== id))
      // Also remove errors for this card
      setConflictErrors(prev => {
        const newErrors = { ...prev }
        Object.keys(newErrors).forEach(key => {
          if (key.startsWith(`classes.${bulkClasses.findIndex(c => c.id === id)}.`)) {
            delete newErrors[key]
          }
        })
        return newErrors
      })
    }
  }

  // Filter classes
  const filteredClasses = classes.filter(classItem => {
    const matchesSearch = 
      (classItem.section?.section_name || classItem.section?.SectionName)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classItem.faculty?.FirstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classItem.faculty?.LastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classItem.semester?.semester_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classItem.day_of_week?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesSemester = !filterSemester || classItem.Semester_id?.toString() === filterSemester
    const matchesSection = !filterSection || classItem.Section_id?.toString() === filterSection
    const matchesFaculty = !filterFaculty || classItem.faculty_id?.toString() === filterFaculty
    const matchesStatus = !filterStatus || 
      (filterStatus === 'active' && classItem.is_active) ||
      (filterStatus === 'inactive' && !classItem.is_active)

    return matchesSearch && matchesSemester && matchesSection && matchesFaculty && matchesStatus
  })

  // Helper function to consolidate consecutive days
  const consolidateDays = (days) => {
    if (!days || days.length === 0) return ''
    if (days.length === 1) return days[0]
    
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const sortedDays = [...days].sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b))
    
    // Check if days form a consecutive range
    let consecutive = true
    for (let i = 1; i < sortedDays.length; i++) {
      const prevIndex = dayOrder.indexOf(sortedDays[i - 1])
      const currIndex = dayOrder.indexOf(sortedDays[i])
      if (currIndex !== prevIndex + 1) {
        consecutive = false
        break
      }
    }
    
    if (consecutive && sortedDays.length > 1) {
      return `${sortedDays[0]} - ${sortedDays[sortedDays.length - 1]}`
    }
    
    return sortedDays.join(', ')
  }

  // Group classes by section, then consolidate by faculty, subject, and time
  const groupedClasses = filteredClasses.reduce((groups, classItem) => {
    const sectionName = `${classItem.section?.section_name || classItem.section?.SectionName || 'Unknown Section'} - ${classItem.section?.strand?.Strand_name || 'No Strand'}`
    if (!groups[sectionName]) {
      groups[sectionName] = []
    }
    
    // Check if there's already a class with same faculty, subject, start_time, and endtime
    const existingIndex = groups[sectionName].findIndex(existing => 
      existing.faculty_id === classItem.faculty_id &&
      existing.subject_id === classItem.subject_id &&
      existing.start_time === classItem.start_time &&
      existing.endtime === classItem.endtime &&
      existing.Section_id === classItem.Section_id
    )
    
    if (existingIndex >= 0) {
      // Merge days
      const existing = groups[sectionName][existingIndex]
      
      // Parse existing days
      let existingDays = []
      if (Array.isArray(existing.day_of_week)) {
        existingDays = existing.day_of_week
      } else if (existing.day_of_week) {
        if (existing.day_of_week.includes(' - ')) {
          // Handle "Monday - Friday" format
          const parts = existing.day_of_week.split(' - ')
          const startDay = parts[0].trim()
          const endDay = parts[1].trim()
          const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
          const startIndex = dayOrder.indexOf(startDay)
          const endIndex = dayOrder.indexOf(endDay)
          if (startIndex >= 0 && endIndex >= 0 && endIndex >= startIndex) {
            existingDays = dayOrder.slice(startIndex, endIndex + 1)
          } else {
            existingDays = [startDay, endDay]
          }
        } else if (existing.day_of_week.includes(',')) {
          existingDays = existing.day_of_week.split(',').map(d => d.trim())
        } else if (existing.day_of_week.toLowerCase().includes('to')) {
          // Handle "Monday to Friday" format
          const parts = existing.day_of_week.toLowerCase().split('to')
          const startDay = parts[0].trim()
          const endDay = parts[1].trim()
          const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
          const startIndex = dayOrder.findIndex(d => d.toLowerCase() === startDay)
          const endIndex = dayOrder.findIndex(d => d.toLowerCase() === endDay)
          if (startIndex >= 0 && endIndex >= 0 && endIndex >= startIndex) {
            existingDays = dayOrder.slice(startIndex, endIndex + 1)
          } else {
            existingDays = [existing.day_of_week]
          }
        } else {
          existingDays = [existing.day_of_week]
        }
      }
      
      // Parse new day
      let newDays = []
      if (classItem.day_of_week) {
        if (classItem.day_of_week.includes(' - ')) {
          const parts = classItem.day_of_week.split(' - ')
          const startDay = parts[0].trim()
          const endDay = parts[1].trim()
          const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
          const startIndex = dayOrder.indexOf(startDay)
          const endIndex = dayOrder.indexOf(endDay)
          if (startIndex >= 0 && endIndex >= 0 && endIndex >= startIndex) {
            newDays = dayOrder.slice(startIndex, endIndex + 1)
          } else {
            newDays = [startDay, endDay]
          }
        } else if (classItem.day_of_week.toLowerCase().includes('to')) {
          const parts = classItem.day_of_week.toLowerCase().split('to')
          const startDay = parts[0].trim()
          const endDay = parts[1].trim()
          const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
          const startIndex = dayOrder.findIndex(d => d.toLowerCase() === startDay)
          const endIndex = dayOrder.findIndex(d => d.toLowerCase() === endDay)
          if (startIndex >= 0 && endIndex >= 0 && endIndex >= startIndex) {
            newDays = dayOrder.slice(startIndex, endIndex + 1)
          } else {
            newDays = [classItem.day_of_week]
          }
        } else {
          newDays = [classItem.day_of_week]
        }
      }
      
      // Combine and consolidate
      const allDays = [...new Set([...existingDays, ...newDays])]
      existing.day_of_week = consolidateDays(allDays)
      existing._consolidated = true
      existing._originalDays = allDays
    } else {
      // Add new class - check if it already has a range format
      const dayStr = classItem.day_of_week || ''
      if (dayStr.includes(' - ') || dayStr.toLowerCase().includes('to')) {
        // Already in range format, keep as is
        groups[sectionName].push({
          ...classItem,
          _consolidated: false
        })
      } else {
        // Single day, add as is
        groups[sectionName].push({
          ...classItem,
          _consolidated: false
        })
      }
    }
    
    return groups
  }, {})

  // Sort sections and classes
  const sortedGroupedClasses = Object.keys(groupedClasses)
    .sort()
    .reduce((sorted, sectionName) => {
      sorted[sectionName] = groupedClasses[sectionName].sort((a, b) => {
        const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        
        // Get first day for comparison (for consolidated days like "Monday - Friday", use "Monday")
        const getFirstDay = (dayStr) => {
          if (!dayStr) return ''
          if (dayStr.includes(' - ')) {
            return dayStr.split(' - ')[0].trim()
          }
          if (dayStr.includes(',')) {
            return dayStr.split(',')[0].trim()
          }
          return dayStr.trim()
        }
        
        const aFirstDay = getFirstDay(a.day_of_week)
        const bFirstDay = getFirstDay(b.day_of_week)
        const dayComparison = dayOrder.indexOf(aFirstDay) - dayOrder.indexOf(bFirstDay)
        if (dayComparison !== 0) return dayComparison
        return a.start_time?.localeCompare(b.start_time) || 0
      })
      return sorted
    }, {})

  // Statistics
  const stats = {
    total: classes.length,
    active: classes.filter(c => c.is_active).length,
    inactive: classes.filter(c => !c.is_active).length,
    sections: new Set(classes.map(c => c.Section_id)).size,
    faculty: new Set(classes.map(c => c.faculty_id)).size
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <RegistrarSidebar />
      
      <div className="flex-1 p-6">
        <Head title="Classes Management - ONSTS" />
        
        <div className="mb-6">
          <Breadcrumb items={breadcrumbItems} />
          <div className="mt-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Classes Management</h1>
              <p className="text-gray-600 mt-1">Manage class schedules and assignments</p>
            </div>
          </div>
        </div>

        {/* Flash messages */}
        {flash.success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-green-800 font-medium">{flash.success}</p>
            </div>
          </div>
        )}

        {flash.error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800 font-medium">{flash.error}</p>
            </div>
          </div>
        )}

        {/* Enhanced Header with Key Metrics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* System Status - Nielsen Heuristic #1: Visibility of System Status */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  activeSchoolYear && activeSemester ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm font-medium text-gray-700">
                  {activeSchoolYear && activeSemester 
                    ? `${activeSchoolYear.School_year_start}-${activeSchoolYear.School_year_end} • ${activeSemester.semester_type}`
                    : 'No Active School Year/Semester'
                  }
                </span>
              </div>
            </div>
            
            {/* Essential Statistics - Reduced from 5 to 3 cards */}
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Classes</p>
                  <p className="text-xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-xl font-bold text-green-600">{stats.active}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Sections</p>
                  <p className="text-xl font-bold text-purple-600">{stats.sections}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Secondary metrics in smaller text */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-6 text-sm text-gray-600">
            <span>Inactive: <strong className="text-red-600">{stats.inactive}</strong></span>
            <span>Faculty Assigned: <strong className="text-orange-600">{stats.faculty}</strong></span>
            <span>Completion Rate: <strong className="text-indigo-600">{stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%</strong></span>
          </div>
        </div>

        {/* Enhanced Action Bar - Nielsen Heuristic #7: Flexibility and Efficiency */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowBulkForm(!showBulkForm)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-sm ${
                  showBulkForm
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {showBulkForm ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create Classes
                  </>
                )}
              </button>
              
              {previousSemester && activeSemester && activeSemester.semester_type === '2nd Semester' && (
                <button
                  onClick={handleCopyTimeSlots}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-sm bg-blue-600 hover:bg-blue-700 text-white"
                  title={`Copy time slots from ${previousSemester.semester_type} Semester`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Schedule
                </button>
              )}
            </div>
            
            {/* Help Text - Nielsen Heuristic #10: Help and Documentation */}
            <div className="text-sm text-gray-600">
              <span className="inline-flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Tip: Use bulk creation for multiple classes or copy from previous semester
              </span>
            </div>
          </div>
        </div>

        {/* Bulk Creation Form */}
        {showBulkForm && (
          <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {isTimeSlotMode ? 'Create Classes from Time Slots' : 'Create Classes'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {isTimeSlotMode 
                  ? `Assign Section, Faculty, and Subject for ${bulkClasses.length} time slot(s) (max 5 loads per faculty)`
                  : bulkClasses.length === 1 
                    ? 'Create a new class or click + to add more (up to 5 classes, max 5 loads per faculty)'
                    : `Creating ${bulkClasses.length} classes (up to 5 classes, max 5 loads per faculty)`
                }
              </p>
            </div>

            {/* Shared Section Selector (only in time slot mode) */}
            {isTimeSlotMode && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Section (applies to all time slots) *
                </label>
                <select
                  value={sharedSectionId}
                  onChange={(e) => handleSharedSectionChange(e.target.value)}
                  className="w-full md:w-1/2 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select Section</option>
                  {sections && sections.length > 0 ? (
                    sections.map(section => {
                      const sectionName = section.section_name || section.SectionName || 'Unnamed Section'
                      const strandName = section.strand?.Strand_name || section.strand?.Strand_name || 'No Strand'
                      return (
                    <option key={section.id} value={section.id}>
                          {sectionName} - {strandName}
                    </option>
                      )
                    })
                  ) : (
                    <option value="" disabled>No active sections available</option>
                  )}
                </select>
                <p className="mt-2 text-xs text-gray-600">
                  This section will be used for all time slots below. You can then assign different Faculty and Subject for each time slot.
                </p>
              </div>
            )}

            {!isTimeSlotMode && (
              <div className="mb-4 flex justify-end">
                <button
                  onClick={addClassCard}
                  disabled={bulkClasses.length >= 5 || getMaxRemainingCards() <= 0}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm ${
                    bulkClasses.length >= 5 || getMaxRemainingCards() <= 0
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                  title={
                    bulkClasses.length >= 5 
                      ? 'Maximum 5 classes at once'
                      : getMaxRemainingCards() <= 0
                        ? 'Selected faculty has reached load limit'
                        : `Add Class (${getMaxRemainingCards()} more available)`
                  }
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Class
                </button>
              </div>
            )}

            <div className="space-y-4">
              {bulkClasses.map((classData, index) => (
                <div key={classData.id} className={`bg-gradient-to-br rounded-lg border-2 p-4 ${
                  isTimeSlotMode 
                    ? 'from-blue-50 to-white border-blue-200' 
                    : 'from-gray-50 to-white border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-sm font-semibold ${isTimeSlotMode ? 'text-blue-600' : 'text-indigo-600'}`}>
                        {isTimeSlotMode ? `Time Slot ${index + 1}` : `Class ${index + 1}`}
                      </h3>
                      {conflictErrors[`classes.${index}`] && (
                        <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">Has Conflict</span>
                      )}
                    </div>
                    {bulkClasses.length > 1 && !isTimeSlotMode && (
                      <button
                        onClick={() => removeClassCard(classData.id)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Remove
                      </button>
                    )}
                  </div>
                  
                  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${isTimeSlotMode ? '3' : '4'} gap-3`}>
                    {/* Section - only show if NOT in time slot mode */}
                    {!isTimeSlotMode && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Section</label>
                        <select
                          value={classData.Section_id}
                          onChange={(e) => handleBulkChange(index, 'Section_id', e.target.value)}
                          className={`w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                            conflictErrors[`classes.${index}.Section_id`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Select Section</option>
                          {sections && sections.length > 0 ? (
                            sections.map(section => {
                              const sectionName = section.section_name || section.SectionName || 'Unnamed Section'
                              const strandName = section.strand?.Strand_name || section.strand?.Strand_name || 'No Strand'
                              return (
                            <option key={section.id} value={section.id}>
                                  {sectionName} - {strandName}
                            </option>
                              )
                            })
                          ) : (
                            <option value="" disabled>No active sections available</option>
                          )}
                        </select>
                        {conflictErrors[`classes.${index}.Section_id`] && (
                          <p className="mt-1 text-xs text-red-600">{conflictErrors[`classes.${index}.Section_id`]}</p>
                        )}
                      </div>
                    )}

                    {/* Faculty */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Faculty
                        {(() => {
                          if (!classData.faculty_id) return ''
                          // Ensure we check both string and number keys
                          const facultyIdKey = String(classData.faculty_id)
                          const currentLoad = facultyLoads[facultyIdKey] || facultyLoads[classData.faculty_id] || 0
                          // Count unique sections for this faculty in the form (excluding the current card if it doesn't have a section yet)
                          const formSections = new Set()
                          bulkClasses.forEach((c, idx) => {
                            // Only count if faculty matches AND section is selected
                            // Exclude current card if it doesn't have a section selected yet
                            if (String(c.faculty_id) === facultyIdKey && c.Section_id) {
                              // If this is the current card and it has a section, count it
                              // If this is another card, count it
                              formSections.add(c.Section_id)
                            }
                          })
                          const formLoad = formSections.size
                          const totalLoad = currentLoad + formLoad
                          return ` (${totalLoad}/5 loads)`
                        })()}
                      </label>
                      <select
                        value={classData.faculty_id}
                        onChange={(e) => handleBulkChange(index, 'faculty_id', e.target.value)}
                        className={`w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                          conflictErrors[`classes.${index}.faculty_id`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select Faculty</option>
                        {faculty.map(f => {
                          // Ensure we check both string and number keys
                          const facultyIdKey = String(f.id)
                          const currentLoad = facultyLoads[facultyIdKey] || facultyLoads[f.id] || 0
                          // Count unique sections this faculty has in the current form
                          const formSections = new Set()
                          bulkClasses.forEach(c => {
                            if (String(c.faculty_id) === facultyIdKey && c.Section_id) {
                              formSections.add(c.Section_id)
                            }
                          })
                          const formLoad = formSections.size
                          const totalLoad = currentLoad + formLoad
                          const isDisabled = totalLoad >= 5 && String(classData.faculty_id) !== facultyIdKey
                          
                          return (
                            <option 
                              key={f.id} 
                              value={f.id}
                              disabled={isDisabled}
                            >
                              {f.FirstName} {f.LastName} {totalLoad >= 5 ? `(Full - ${totalLoad}/5)` : `(${totalLoad}/5)`}
                          </option>
                          )
                        })}
                      </select>
                      {conflictErrors[`classes.${index}.faculty_id`] && (
                        <p className="mt-1 text-xs text-red-600">{conflictErrors[`classes.${index}.faculty_id`]}</p>
                      )}
                    </div>

                    {/* Subject */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Subject *</label>
                      <select
                        value={classData.subject_id}
                        onChange={(e) => handleBulkChange(index, 'subject_id', e.target.value)}
                        disabled={isTimeSlotMode ? !sharedSectionId : !classData.Section_id}
                        className={`w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                          conflictErrors[`classes.${index}.subject_id`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        } ${(isTimeSlotMode ? !sharedSectionId : !classData.Section_id) ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      >
                        <option value="">Select Subject</option>
                        {(isTimeSlotMode ? sharedSectionId : classData.Section_id) && getFilteredSubjects(isTimeSlotMode ? sharedSectionId : classData.Section_id).map(subject => (
                          <option key={subject.Id} value={subject.Id}>
                            {subject.Subject_name} ({subject.Subject_code})
                          </option>
                        ))}
                      </select>
                      {conflictErrors[`classes.${index}.subject_id`] && (
                        <p className="mt-1 text-xs text-red-600">{conflictErrors[`classes.${index}.subject_id`]}</p>
                      )}
                    </div>

                    {/* Day - read-only in time slot mode */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Day</label>
                      {isTimeSlotMode ? (
                        <div className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                          {classData.day_of_week || '—'}
                        </div>
                      ) : (
                        <select
                          value={classData.day_of_week}
                          onChange={(e) => handleBulkChange(index, 'day_of_week', e.target.value)}
                          className={`w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                            conflictErrors[`classes.${index}.day_of_week`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Select Day</option>
                          {daysOfWeek.map(day => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </select>
                      )}
                      {conflictErrors[`classes.${index}.day_of_week`] && (
                        <p className="mt-1 text-xs text-red-600">{conflictErrors[`classes.${index}.day_of_week`]}</p>
                      )}
                    </div>

                    {/* Time Slot - Single dropdown for predefined time slots */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Time Slot</label>
                      {isTimeSlotMode ? (
                        <div className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                          {classData.start_time && classData.endtime 
                            ? `${formatTimeTo12Hour(classData.start_time)} - ${formatTimeTo12Hour(classData.endtime)}`
                            : '—'}
                        </div>
                      ) : (
                        <select
                          value={getSelectedTimeSlotId(classData.start_time, classData.endtime)}
                          onChange={(e) => handleTimeSlotChange(index, e.target.value)}
                          className={`w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                            (conflictErrors[`classes.${index}.start_time`] || conflictErrors[`classes.${index}.endtime`]) 
                              ? 'border-red-500 bg-red-50' 
                              : 'border-gray-300'
                          }`}
                        >
                          <option value="">Select Time Slot</option>
                          {predefinedTimeSlots.map(slot => (
                            <option key={slot.id} value={slot.id}>{slot.label}</option>
                          ))}
                        </select>
                      )}
                      {(conflictErrors[`classes.${index}.start_time`] || conflictErrors[`classes.${index}.endtime`]) && (
                        <p className="mt-1 text-xs text-red-600">
                          {conflictErrors[`classes.${index}.start_time`] || conflictErrors[`classes.${index}.endtime`]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => {
                  setShowBulkForm(false)
                  setConflictErrors({})
                  setIsTimeSlotMode(false)
                  setSharedSectionId('')
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkSubmit}
                className="px-6 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Create Classes
              </button>
            </div>
          </div>
        )}

        {/* Enhanced Search and Filters - Nielsen Heuristic #6: Recognition vs Recall */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4">
            {/* Primary Search */}
            <div className="flex-1 lg:max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search Classes
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by section, faculty, or subject..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            
            {/* Filter Controls */}
            <div className="flex flex-wrap gap-3">
              <div className="min-w-[120px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
                <select
                  value={filterSemester}
                  onChange={(e) => setFilterSemester(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                >
                  <option value="">All</option>
                  {semesters.map(semester => (
                    <option key={semester.id} value={semester.id}>
                      {semester.semester_type}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="min-w-[140px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
                <select
                  value={filterSection}
                  onChange={(e) => setFilterSection(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                >
                  <option value="">All</option>
                  {sections.map(section => (
                    <option key={section.id} value={section.id}>
                      {section.section_name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="min-w-[100px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                >
                  <option value="">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              {/* Clear Filters */}
              {(searchTerm || filterSemester || filterSection || filterStatus) && (
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setFilterSemester('')
                      setFilterSection('')
                      setFilterStatus('')
                    }}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Results Summary */}
          {(searchTerm || filterSemester || filterSection || filterStatus) && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                Showing <strong>{filteredClasses.length}</strong> of <strong>{classes.length}</strong> classes
                {searchTerm && <span> matching "<strong>{searchTerm}</strong>"</span>}
              </p>
            </div>
          )}
        </div>

        {/* Classes List */}
        {Object.keys(sortedGroupedClasses).length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No classes found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new class.</p>
          </div>
        ) : (
          Object.entries(sortedGroupedClasses).map(([sectionName, sectionClasses]) => {
            const isExpanded = expandedSections[sectionName] !== false // Default to expanded
            
            return (
              <div key={sectionName} className="mb-4">
                <button
                  onClick={() => toggleSection(sectionName)}
                  className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 rounded-lg px-6 py-4 transition-all duration-200 shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {sectionName}
                      <span className="ml-3 text-sm font-normal bg-white/20 px-3 py-1 rounded-full">
                        {sectionClasses.length} {sectionClasses.length === 1 ? 'class' : 'classes'}
                      </span>
                  </h3>
                    <svg
                      className={`w-6 h-6 text-white transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                
                {isExpanded && (
                  <div className="bg-white rounded-b-lg shadow-sm border mt-1 overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faculty</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                    {sectionClasses.map(classItem => (
                          <tr key={classItem.Id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">
                                {classItem.subject?.Subject_name || 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {classItem.subject?.Subject_code || 'N/A'}
                            </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">
                                {classItem.faculty?.FirstName} {classItem.faculty?.LastName}
                            </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">{classItem.day_of_week}</div>
                              <div className="text-xs text-gray-500">
                                {formatTimeTo12Hour(classItem.start_time)} - {formatTimeTo12Hour(classItem.endtime)}
                            </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                classItem.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {classItem.is_active ? 'Active' : 'Archived'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-medium">
                              <button
                                onClick={() => handleArchive(classItem.Id, classItem.is_active)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                  classItem.is_active
                                    ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                                    : 'text-green-700 bg-green-50 hover:bg-green-100 border border-green-200'
                                }`}
                              >
                                {classItem.is_active ? (
                                  <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                    </svg>
                                    Archive
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Restore
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
            </div>
          )}
        </div>
            )
          })
        )}
      </div>
    </div>
  )
}
