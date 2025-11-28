import { Head } from '@inertiajs/react'
import StudentSidebar from '../Auth/Student_sidebar'
import { useState } from 'react'

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'To Be Announced']

export default function Schedule({ schedule = [], currentEnrollment = null, enrollmentStatus = {} }) {
  const [view, setView] = useState('list')
  const groupedSchedule = groupScheduleByDay(schedule)
  const listSchedule = dedupeForList(schedule)
  const totalSubjects = listSchedule.length
  
  // Get unique subjects with classmates
  const subjectsWithClassmates = schedule
    .filter(item => item.classmates && item.classmates.length > 0)
    .reduce((acc, item) => {
      const key = item.subject_code || item.subject || item.id
      if (!acc[key]) {
        acc[key] = {
          subject: item.subject || 'Unknown Subject',
          subject_code: item.subject_code,
          classmates: item.classmates || [],
          is_credited: item.is_credited || false,
        }
      }
      return acc
    }, {})
  
  const hasClassmates = Object.keys(subjectsWithClassmates).length > 0

  const formatHeader = () => {
    if (!currentEnrollment) return 'Class Schedule'
    return `${currentEnrollment.school_year || ''} ${currentEnrollment.semester || ''}`
  }

  const formatTime = (item) => {
    // Prefer backend-formatted range (already 12-hour with am/pm)
    if (item.time) return item.time
    if (item.start_time && item.end_time) return `${to12Hour(item.start_time)} – ${to12Hour(item.end_time)}`
    return ''
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <StudentSidebar enrollmentStatus={enrollmentStatus} />
      <div className="flex-1">
        <Head title="Class Schedule" />

        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Centered header like sample */}
            <div className="bg-white border border-gray-200 rounded-lg mb-4">
              <div className="px-6 py-6 text-center">
                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">{formatHeader()}</h1>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-4">
              <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-md p-1">
                <button
                  onClick={() => setView('list')}
                  className={`px-5 py-2 text-sm rounded ${view === 'list' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  List
                </button>
                <button
                  onClick={() => setView('timetable')}
                  className={`px-5 py-2 text-sm rounded ${view === 'timetable' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  Timetable
                </button>
                {hasClassmates && (
                  <button
                    onClick={() => setView('classmates')}
                    className={`px-5 py-2 text-sm rounded ${view === 'classmates' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    Classmates
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              <SummaryItem label="School Year" value={currentEnrollment?.school_year || ''} />
              <SummaryItem label="Semester" value={currentEnrollment?.semester || ''} />
              <SummaryItem
                label="Strand & Section"
                value={
                  currentEnrollment
                    ? [currentEnrollment.strand_code, currentEnrollment.section].filter(Boolean).join(' • ') || ''
                    : ''
                }
              />
              <SummaryItem label="Subjects Scheduled" value={totalSubjects} />
              <SummaryItem label="Adviser" value={currentEnrollment?.adviser || 'To be assigned'} />
            </div>

            

            {view === 'list' ? (
            listSchedule.length > 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">Class List</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Subject</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Day</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Time</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Section</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Instructor</th>
                        </tr>
                      </thead>
                          <tbody className="divide-y divide-gray-100 bg-white">
                        {listSchedule.map((item, idx) => (
                          <tr key={`${item.id}-${idx}`}>
                            <td className="px-6 py-3 text-sm text-gray-900">
                              <div className="font-medium text-gray-900">
                                {item.subject || ''}
                                {item.is_credited && (
                                  <span className="ml-1 text-xs font-semibold text-indigo-600">(Credited)</span>
                                )}
                              </div>
                              {item.is_credited && (
                                <div className="mt-1 text-xs text-gray-600 space-x-3">
                                  <span>Q1: {formatGradeValue(item.quarter1)}</span>
                                  <span>Q2: {formatGradeValue(item.quarter2)}</span>
                                  <span className="font-semibold text-indigo-700">Final: {formatGradeValue(item.final_grade)}</span>
                                  {item.remarks && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                                      {item.remarks}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-3 text-sm text-gray-700">{item.day || ''}</td>
                            <td className="px-6 py-3 text-sm text-gray-700">{formatTime(item)}</td>
                            <td className="px-6 py-3 text-sm text-gray-700">{item.section || ''}</td>
                            <td className="px-6 py-3 text-sm text-gray-700">{item.faculty || item.instructor || ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="mt-8 bg-white border border-gray-200 rounded-lg shadow-sm p-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="mt-4 text-lg font-semibold text-gray-900">No schedule available</h2>
                  <p className="mt-2 text-sm text-gray-600">
                    Once the registrar completes your enrollment and class assignments, your schedule will appear here.
                  </p>
                </div>
              )
            ) : view === 'classmates' ? (
              <ClassmatesList schedule={schedule} />
            ) : schedule.length > 0 ? (
              <TimetableGrid schedule={schedule} />
            ) : (
              <div className="mt-8 bg-white border border-gray-200 rounded-lg shadow-sm p-10 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="mt-4 text-lg font-semibold text-gray-900">No schedule available</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Once the registrar completes your enrollment and class assignments, your schedule will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


function formatGradeValue(value) {
  if (value === null || value === undefined || value === '') return '—'
  const num = Number(value)
  if (Number.isNaN(num)) return value
  return Number.isInteger(num) ? num.toString() : num.toFixed(2)
}

function SummaryItem({ label, value }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-base font-semibold text-gray-900 break-words">{value ?? ''}</p>
    </div>
  )
}


function to12Hour(value) {
  if (!value) return ''
  const [rawHour, rawMinute] = String(value).split(':')
  const hour = parseInt(rawHour, 10)
  const minute = rawMinute ?? '00'
  if (Number.isNaN(hour)) return value
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const displayHour = ((hour + 11) % 12) + 1 // 0->12, 13->1
  return `${displayHour}:${minute}${suffix}`
}

function dedupeForList(entries) {
  if (!entries || entries.length === 0) return []
  
  // Group by subject (using subject_code or subject as key)
  const grouped = {}
  entries.forEach((item) => {
    const isCredited = !!item.is_credited
    const baseKey = item.subject_code || item.subject || item.id
    const key = isCredited ? `credit-${baseKey}` : baseKey
    if (!grouped[key]) {
      grouped[key] = {
        ...item,
        days: []
      }
    }
    // Collect all days for this subject
    if (item.day && !grouped[key].days.includes(item.day)) {
      grouped[key].days.push(item.day)
    }
  })
  
  // Sort days and format them nicely
  return Object.values(grouped).map(item => {
    // Sort days by day order
    const sortedDays = item.days.sort((a, b) => dayPosition(a) - dayPosition(b))
    
    // Format days nicely
    if (sortedDays.length === 0) {
      item.day = 'To Be Announced'
    } else if (sortedDays.length === 1) {
      item.day = sortedDays[0]
    } else if (areConsecutiveDays(sortedDays)) {
      // If consecutive, use "Monday - Friday" format
      item.day = `${sortedDays[0]} - ${sortedDays[sortedDays.length - 1]}`
    } else {
      // If not consecutive, use comma-separated format
      item.day = sortedDays.join(', ')
    }
    
    return item
  })
}

// Helper function to check if days are consecutive
function areConsecutiveDays(days) {
  if (days.length <= 1) return false
  
  const positions = days.map(d => dayPosition(d))
  for (let i = 1; i < positions.length; i++) {
    if (positions[i] !== positions[i - 1] + 1) {
      return false
    }
  }
  return true
}

// Convert 24-hour time to 12-hour format with AM/PM
function to12HourFormat(time24) {
  if (!time24) return ''
  const [hour, minute] = time24.split(':').map(Number)
  if (isNaN(hour) || isNaN(minute)) return time24
  
  const period = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour)
  return `${hour12}:${minute.toString().padStart(2, '0')}${period}`
}

// Generate time slots from 7:30 AM to 5:00 PM in 30-minute intervals
function generateTimeSlots() {
  const slots = []
  for (let hour = 7; hour <= 17; hour++) {
    for (let minute of [0, 30]) {
      // Skip 7:00 - start from 7:30
      if (hour === 7 && minute === 0) continue
      // Stop at 5:00 PM (17:00) - last slot is 4:30pm - 5:00pm
      if (hour === 17 && minute === 30) break
      
      const startHour = hour
      const startMinute = minute
      const endMinute = minute === 0 ? 30 : 0
      const endHour = minute === 0 ? hour : hour + 1
      
      // Don't create slot if end time exceeds 5:00 PM
      if (endHour > 17 || (endHour === 17 && endMinute > 0)) {
        break
      }
      
      // Store in 24-hour format for matching (internal)
      const formatTime24 = (h, m) => `${h}:${m.toString().padStart(2, '0')}`
      const start24 = formatTime24(startHour, startMinute)
      const end24 = formatTime24(endHour, endMinute)
      
      // Display in 12-hour format (label)
      const start12 = to12HourFormat(start24)
      const end12 = to12HourFormat(end24)
      
      slots.push({
        start: start24, // Keep 24-hour for internal matching
        end: end24,
        label: `${start12} - ${end12}` // Display in 12-hour format
      })
    }
  }
  return slots
}

// Get color for subject (cycle through predefined colors)
const SUBJECT_COLORS = [
  'bg-emerald-400 text-emerald-900',
  'bg-amber-400 text-amber-900',
  'bg-lime-400 text-lime-900',
  'bg-cyan-400 text-cyan-900',
  'bg-pink-400 text-pink-900',
  'bg-violet-400 text-violet-900',
  'bg-orange-400 text-orange-900',
  'bg-teal-400 text-teal-900',
]

function getSubjectColor(index) {
  return SUBJECT_COLORS[index % SUBJECT_COLORS.length]
}

// Calculate row span based on time duration
function calculateRowSpan(startTime, endTime) {
  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM
  const duration = endMinutes - startMinutes
  return Math.ceil(duration / 30) // Each slot is 30 minutes
}

// Find which row a class starts at
function findStartRow(startTime, timeSlots) {
  if (!startTime) return -1
  
  // Normalize time format (handle both "8:00" and "08:00")
  const normalizeTime = (time) => {
    if (!time) return null
    const parts = String(time).split(':')
    if (parts.length !== 2) return null
    const hour = parseInt(parts[0], 10)
    const minute = parseInt(parts[1], 10)
    if (isNaN(hour) || isNaN(minute)) return null
    return `${hour}:${minute.toString().padStart(2, '0')}`
  }
  
  const normalizedStartTime = normalizeTime(startTime)
  if (!normalizedStartTime) return -1
  
  // Find the slot that matches or is closest (round down to nearest 30 minutes)
  const [startH, startM] = normalizedStartTime.split(':').map(Number)
  const startMinutes = startH * 60 + startM
  
  // Round down to nearest 30-minute slot
  const roundedMinutes = Math.floor(startMinutes / 30) * 30
  const roundedHour = Math.floor(roundedMinutes / 60)
  const roundedMin = roundedMinutes % 60
  const roundedTime = `${roundedHour}:${roundedMin.toString().padStart(2, '0')}`
  
  return timeSlots.findIndex(slot => slot.start === roundedTime)
}

function TimetableGrid({ schedule }) {
  const timeSlots = generateTimeSlots()
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] // Removed Saturday and Sunday
  
  // Group schedule by day and organize by time
  // Always initialize all days to ensure balanced grid
  const scheduleArray = schedule || []
  const scheduleByDay = {}
  daysOfWeek.forEach(day => {
    scheduleByDay[day] = scheduleArray.filter(item => item && item.day === day)
  })
  
  // Create a unique color map for subjects (same subject = same color across all days)
  // Handle empty schedule gracefully
  const uniqueSubjects = [...new Set(scheduleArray.map(item => item.subject_code || item.subject).filter(Boolean))]
  const subjectColorMap = {}
  uniqueSubjects.forEach((subject, index) => {
    subjectColorMap[subject] = getSubjectColor(index)
  })
  
  // Always display the grid structure, even if empty
  return (
    <div className="mt-4 bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse table-fixed" style={{ minWidth: '1200px' }}>
          <thead>
            <tr>
              <th className="border border-gray-300 bg-gray-50 p-2 text-xs font-bold text-center text-gray-700" style={{ width: '120px' }}>
                Time
              </th>
              {daysOfWeek.map(day => (
                <th key={day} className="border border-gray-300 bg-gray-50 p-2 text-xs font-bold text-center text-gray-700" style={{ width: '20%' }}>
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((slot, slotIndex) => (
              <tr key={slotIndex} style={{ height: '40px', minHeight: '40px' }}>
                <td className="border border-gray-300 bg-gray-50 p-1 text-xs text-center font-medium text-gray-700">
                  {slot.label}
                </td>
                {daysOfWeek.map(day => {
                  // Find if there's a class at this time slot for this day
                  const classAtSlot = scheduleByDay[day]?.find(item => {
                    if (!item.start_time) return false
                    const classStartRow = findStartRow(item.start_time, timeSlots)
                    return classStartRow === slotIndex
                  })
                  
                  if (classAtSlot) {
                    const rowSpan = calculateRowSpan(classAtSlot.start_time, classAtSlot.end_time)
                    // Use subject_code first, then fall back to subject name for color consistency
                    const subjectKey = classAtSlot.subject_code || classAtSlot.subject || 'unknown'
                    const colorClass = subjectColorMap[subjectKey] || 'bg-gray-400 text-gray-900'
                    
                    return (
                      <td
                        key={day}
                        rowSpan={rowSpan}
                        className={`border border-gray-300 p-2 text-center align-middle ${colorClass}`}
                        style={{ minHeight: '40px' }}
                      >
                        <div className="text-xs font-semibold leading-tight">
                          {classAtSlot.subject || 'Subject'}
                        </div>
                        {classAtSlot.section && (
                          <div className="text-xs mt-1">
                            {classAtSlot.section}
                          </div>
                        )}
                        {classAtSlot.faculty && (
                          <div className="text-xs mt-1">
                            {classAtSlot.faculty}
                          </div>
                        )}
                      </td>
                    )
                  }
                  
                  // Check if this cell is part of a class that spans multiple rows
                  const isSpanned = scheduleByDay[day]?.some(item => {
                    if (!item.start_time) return false
                    const classStartRow = findStartRow(item.start_time, timeSlots)
                    if (classStartRow === -1) return false
                    const classEndRow = classStartRow + calculateRowSpan(item.start_time, item.end_time)
                    return classStartRow < slotIndex && slotIndex < classEndRow
                  })
                  
                  if (isSpanned) {
                    return null // This cell is covered by a rowspan
                  }
                  
                  // Always render empty cells to maintain grid structure
                  return (
                    <td 
                      key={day} 
                      className="border border-gray-300 bg-white"
                      style={{ 
                        minHeight: '40px', 
                        height: '40px',
                        width: '20%',
                        padding: '8px'
                      }}
                    >
                      {/* Empty cell - maintains grid balance */}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DaySchedule({ day, entries }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">{day}</h2>
        <span className="text-xs text-gray-500">{entries.length} subject{entries.length === 1 ? '' : 's'}</span>
      </div>
      <div className="px-6 py-4 space-y-4">
        {entries.map((item) => (
          <div
            key={`${day}-${item.id}`}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          >
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {item.subject || 'Subject TBA'}
                {item.is_credited && (
                  <span className="ml-1 text-xs font-semibold text-indigo-600">(Credited)</span>
                )}
              </p>
              <p className="text-xs text-gray-500">
                {item.faculty || 'Faculty TBA'}
              </p>
              {item.section && (
                <p className="text-xs text-gray-500">
                  Section {item.section}
                </p>
              )}
            </div>
            <div className="text-sm text-gray-700 text-right sm:min-w-[160px]">
              <p className="font-medium">{item.time || 'Time TBA'}</p>
              {item.subject_code && (
                <p className="text-xs text-gray-500">Code: {item.subject_code}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


function groupScheduleByDay(entries) {
  if (!entries || entries.length === 0) {
    return []
  }

  const buckets = entries.reduce((acc, entry) => {
    const key = entry.day && entry.day.trim() !== '' ? entry.day : 'To Be Announced'
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(entry)
    return acc
  }, {})

  return Object.keys(buckets)
    .sort((a, b) => dayPosition(a) - dayPosition(b))
    .map((day) => ({
      day,
      entries: buckets[day].sort((a, b) => normalizeTime(a.start_time) - normalizeTime(b.start_time)),
    }))
}


function normalizeTime(value) {
  if (!value) return Number.POSITIVE_INFINITY
  const [hours, minutes] = value.split(':').map((part) => parseInt(part, 10))
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return Number.POSITIVE_INFINITY
  }
  return hours * 60 + minutes
}


function dayPosition(day) {
  const normalized = (day || '').toLowerCase()
  const idx = DAY_ORDER.findIndex(d => d.toLowerCase() === normalized)
  if (idx >= 0) return idx
  return DAY_ORDER.length + 1
}

// Component for displaying classmates list
function ClassmatesList({ schedule }) {
  // Get unique subjects with classmates
  const subjectsWithClassmates = schedule
    .filter(item => item.classmates && item.classmates.length > 0)
    .reduce((acc, item) => {
      const key = item.subject_code || item.subject || item.id
      if (!acc[key]) {
        acc[key] = {
          subject: item.subject || 'Unknown Subject',
          subject_code: item.subject_code,
          classmates: item.classmates || [],
          is_credited: item.is_credited || false,
        }
      }
      return acc
    }, {})

  const subjectsList = Object.values(subjectsWithClassmates)

  if (subjectsList.length === 0) {
    return null
  }

  return (
    <div className="mt-6 bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">Classmates by Subject</h2>
        <p className="text-sm text-gray-500 mt-1">View your classmates for each subject</p>
      </div>
      <div className="divide-y divide-gray-200">
        {subjectsList.map((subjectData, idx) => (
          <div key={idx} className="px-6 py-4">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-base font-semibold text-gray-900">
                {subjectData.subject}
              </h3>
              {subjectData.is_credited && (
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                  Credited
                </span>
              )}
              <span className="text-sm text-gray-500">
                ({subjectData.classmates.length} {subjectData.classmates.length === 1 ? 'classmate' : 'classmates'})
              </span>
            </div>
            <ul className="space-y-2">
              {subjectData.classmates.map((classmate) => (
                <li
                  key={classmate.id}
                  className="flex items-center gap-3 py-2 px-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-semibold text-blue-600">
                      {classmate.name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {classmate.name || 'Unknown'}
                    </p>
                    {classmate.lrn && (
                      <p className="text-xs text-gray-500">LRN: {classmate.lrn}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
