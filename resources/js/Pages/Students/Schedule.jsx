import { Head } from '@inertiajs/react'
import StudentSidebar from '../Auth/Student_sidebar'

// Updated for navigation fix
export default function Schedule({ classes = [] }) {
  const timeSlots = [
    '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
  ]

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

  // TODO: Process classes data to create schedule object
  const schedule = {}

  const getSubjectColor = (subject) => {
    const colors = {
      'Mathematics': 'bg-blue-100 text-blue-800 border-l-4 border-blue-500',
      'Science': 'bg-green-100 text-green-800 border-l-4 border-green-500',
      'English': 'bg-purple-100 text-purple-800 border-l-4 border-purple-500',
      'Filipino': 'bg-red-100 text-red-800 border-l-4 border-red-500',
      'History': 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500',
      'Physical Education': 'bg-orange-100 text-orange-800 border-l-4 border-orange-500'
    }
    return colors[subject] || 'bg-gray-100 text-gray-800 border-l-4 border-gray-500'
  }

  const getCurrentDay = () => {
    const today = new Date()
    return days[today.getDay() - 1] // Monday = 0, Sunday = 6 (adjust for Monday start)
  }

  const getCurrentTime = () => {
    const now = new Date()
    return now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const isCurrentTimeSlot = (day, time) => {
    if (day !== getCurrentDay()) return false
    
    const currentTime = new Date()
    const [timeStr, period] = time.split(' ')
    const [hours, minutes] = timeStr.split(':')
    let hour24 = parseInt(hours)
    
    if (period === 'PM' && hour24 !== 12) hour24 += 12
    if (period === 'AM' && hour24 === 12) hour24 = 0
    
    const slotTime = new Date()
    slotTime.setHours(hour24, parseInt(minutes || 0), 0, 0)
    
    const nextSlotTime = new Date(slotTime)
    nextSlotTime.setHours(nextSlotTime.getHours() + 1)
    
    return currentTime >= slotTime && currentTime < nextSlotTime
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <StudentSidebar />
      <div className="flex-1">
        <Head title="My Schedule" />
      
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
            <p className="mt-1 text-sm text-gray-600">
              Your weekly class schedule for the current semester
            </p>
          </div>

          {/* Current Status */}
          <div className="mb-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold mb-2">Current Status</h2>
                <p className="text-blue-100">
                  {getCurrentDay()}, {new Date().toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })} • {getCurrentTime()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-100">Next Class</p>
                <p className="text-lg font-semibold">Mathematics</p>
                <p className="text-sm text-blue-100">in 30 minutes</p>
              </div>
            </div>
          </div>

          {/* Schedule Grid */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Time
                    </th>
                    {days.map((day) => (
                      <th key={day} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">
                          {day}
                          {day === getCurrentDay() && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Today
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {timeSlots.map((time) => (
                    <tr key={time} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {time}
                      </td>
                      {days.map((day) => {
                        const classInfo = schedule[day]?.[time]
                        const isCurrentSlot = isCurrentTimeSlot(day, time)
                        
                        return (
                          <td key={`${day}-${time}`} className="px-6 py-4 whitespace-nowrap">
                            {classInfo ? (
                              <div className={`p-3 rounded-lg ${getSubjectColor(classInfo.subject)} ${isCurrentSlot ? 'ring-2 ring-blue-400 ring-opacity-75' : ''}`}>
                                <div className="font-medium text-sm">{classInfo.subject}</div>
                                <div className="text-xs opacity-75">{classInfo.teacher}</div>
                                <div className="text-xs opacity-75">Room {classInfo.room}</div>
                                {classInfo.duration > 1 && (
                                  <div className="text-xs opacity-75 mt-1">
                                    {classInfo.duration}h duration
                                  </div>
                                )}
                                {isCurrentSlot && (
                                  <div className="text-xs font-medium mt-1 flex items-center">
                                    <div className="w-2 h-2 bg-current rounded-full mr-1 animate-pulse"></div>
                                    Now
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="h-16 flex items-center justify-center text-gray-300">
                                {isCurrentSlot && (
                                  <div className="text-xs text-gray-500 flex items-center">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-1 animate-pulse"></div>
                                    Free Time
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Today's Classes Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Classes</h2>
            <div className="space-y-3">
              {classes.length > 0 ? (
                classes.slice(0, 3).map((classItem, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="text-sm font-medium text-gray-900">{classItem.time || 'TBA'}</div>
                      <div className="text-sm text-gray-600">{classItem.subject || 'Subject'}</div>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>{classItem.teacher || 'Teacher'}</span>
                      <span>•</span>
                      <span>{classItem.room || 'Room'}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No classes scheduled for today.</p>
              )}
            </div>
          </div>

          {/* Schedule Summary */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Today's Classes */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Today's Classes</h3>
              </div>
              <div className="p-6">
                {classes.length > 0 ? (
                  <div className="space-y-3">
                    {classes.map((classItem) => (
                      <div key={classItem.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{classItem.subject}</p>
                          <p className="text-sm text-gray-500">{classItem.teacher} • Room {classItem.room}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{classItem.time}</p>
                          <p className="text-xs text-gray-500">{classItem.duration}h</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No classes scheduled for today</p>
                )}
              </div>
            </div>

            {/* Weekly Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Weekly Summary</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Total Classes This Week</span>
                    <span className="text-sm font-medium text-gray-900">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Total Hours</span>
                    <span className="text-sm font-medium text-gray-900">15 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Busiest Day</span>
                    <span className="text-sm font-medium text-gray-900">Monday</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Free Periods</span>
                    <span className="text-sm font-medium text-gray-900">8</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Subject Legend</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries({
                'Mathematics': 'bg-blue-100 text-blue-800 border-blue-500',
                'Science': 'bg-green-100 text-green-800 border-green-500',
                'English': 'bg-purple-100 text-purple-800 border-purple-500',
                'Filipino': 'bg-red-100 text-red-800 border-red-500',
                'History': 'bg-yellow-100 text-yellow-800 border-yellow-500',
                'Physical Education': 'bg-orange-100 text-orange-800 border-orange-500'
              }).map(([subject, colorClass]) => (
                <div key={subject} className={`p-2 rounded border-l-4 ${colorClass}`}>
                  <p className="text-xs font-medium">{subject}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
