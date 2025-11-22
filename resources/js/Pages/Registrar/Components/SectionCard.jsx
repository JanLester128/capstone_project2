import { useState, useEffect, useRef } from 'react'
import { router } from '@inertiajs/react'

export default function SectionCard({ section, onEdit, onToggle, faculty = [] }) {
  const [showAdviserDropdown, setShowAdviserDropdown] = useState(false)
  const [updatingAdviser, setUpdatingAdviser] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowAdviserDropdown(false)
      }
    }

    if (showAdviserDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showAdviserDropdown])

  const handleAdviserUpdate = (adviserId) => {
    setUpdatingAdviser(true)
    router.put(`/registrar/sections/${section.id}/adviser`, {
      adviser_id: adviserId || null
    }, {
      onFinish: () => {
        setUpdatingAdviser(false)
        setShowAdviserDropdown(false)
      }
    })
  }

  const getGradeLevelBadge = (gradeLevel) => {
    const colors = {
      '11': 'bg-blue-100 text-blue-800',
      '12': 'bg-green-100 text-green-800'
    }
    return colors[gradeLevel] || 'bg-gray-100 text-gray-800'
  }

  const getCapacityStatus = (current, max) => {
    const percentage = (current / max) * 100
    if (percentage >= 90) return 'text-red-600'
    if (percentage >= 75) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all duration-200">
      <div className="p-4">
        <div className="flex items-center justify-between">
          {/* Main Section Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Section Avatar */}
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold text-sm ${
              (section.is_active !== false) 
                ? 'bg-gradient-to-br from-indigo-500 to-indigo-600' 
                : 'bg-gradient-to-br from-gray-400 to-gray-500'
            }`}>
              {section.section_name.substring(0, 2).toUpperCase()}
            </div>

            {/* Section Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 truncate">
                  {section.section_name}
                </h3>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getGradeLevelBadge(section.year_level || section.grade_level)}`}>
                  Grade {section.year_level || section.grade_level}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  (section.is_active !== false) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {(section.is_active !== false) ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              {/* Simplified Info */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="truncate">{section.strand?.Strand_name || 'No strand'}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="truncate">
                    {section.adviser ? (
                      `${section.adviser.FirstName} ${section.adviser.LastName}`
                    ) : (
                      <span className="text-gray-400 italic">No adviser</span>
                    )}
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className={`font-medium ${getCapacityStatus(section.current_students || 0, section.max_capacity || section.capacity)}`}>
                    {section.current_students || 0}/{section.max_capacity || section.capacity}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 ml-4">
            {/* Adviser Dropdown */}
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setShowAdviserDropdown(!showAdviserDropdown)}
                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Change adviser"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
                  
                  {/* Dropdown */}
                  {showAdviserDropdown && (
                    <div className="absolute left-0 top-full mt-1 z-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-64">
                      <div className="px-3 py-2 text-xs font-semibold text-gray-700 border-b border-gray-100">
                        Change Adviser
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        <button
                          onClick={() => handleAdviserUpdate(null)}
                          disabled={updatingAdviser}
                          className="w-full px-3 py-2 text-xs text-left hover:bg-gray-50 flex items-center space-x-2 disabled:opacity-50"
                        >
                          <span className="text-gray-400 italic">None</span>
                        </button>
                        {faculty.map((member) => (
                          <button
                            key={member.id}
                            onClick={() => handleAdviserUpdate(member.id)}
                            disabled={updatingAdviser}
                            className={`w-full px-3 py-2 text-xs text-left hover:bg-indigo-50 flex items-center space-x-2 disabled:opacity-50 ${
                              section.adviser_id === member.id ? 'bg-indigo-100 text-indigo-900 font-medium' : 'text-gray-700'
                            }`}
                          >
                            <span>{member.FirstName} {member.MiddleName ? member.MiddleName + ' ' : ''}{member.LastName}</span>
                            {section.adviser_id === member.id && (
                              <svg className="w-3 h-3 text-indigo-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                      {updatingAdviser && (
                        <div className="px-3 py-2 text-xs text-center text-gray-500 border-t border-gray-100">
                          Updating...
                        </div>
                      )}
                    </div>
                  )}
                </div>
            
            <button
              onClick={() => onEdit(section)}
              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Edit section"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            
            <button
              onClick={() => onToggle(section.id)}
              className={`p-2 rounded-lg transition-colors ${
                (section.is_active !== false) 
                  ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50' 
                  : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
              }`}
              title={(section.is_active !== false) ? "Disable section" : "Enable section"}
            >
              {(section.is_active !== false) ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
