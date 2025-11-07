export default function SectionCard({ section, onEdit, onToggle }) {

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
    <div className="relative bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 group">
      {/* List Layout */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          {/* Left Section - Main Info */}
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            {/* Section Icon */}
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center ring-2 ring-white shadow-sm">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>

            {/* Section Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3">
                <h3 className="text-sm font-semibold text-gray-900 truncate">
                  {section.section_name}
                </h3>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getGradeLevelBadge(section.year_level || section.grade_level)}`}>
                  Grade {section.year_level || section.grade_level}
                </span>
              </div>
              
              {/* Strand and Adviser Info */}
              <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <svg className="w-3 h-3 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="truncate">{section.strand?.Strand_name || 'No strand assigned'}</span>
                </div>
                {section.adviser && (
                  <div className="flex items-center">
                    <svg className="w-3 h-3 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="truncate">
                      Adviser: {section.adviser.FirstName} {section.adviser.MiddleName ? section.adviser.MiddleName + ' ' : ''}{section.adviser.LastName}
                    </span>
                  </div>
                )}
                {!section.adviser && (
                  <div className="flex items-center">
                    <svg className="w-3 h-3 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-gray-400 italic">No adviser assigned</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Section - Capacity and Actions */}
          <div className="flex items-center space-x-6">
            {/* Capacity Info */}
            <div className="hidden sm:flex flex-col items-end text-xs text-gray-500 space-y-1">
              <div className="flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className={`font-medium ${getCapacityStatus(section.current_students || 0, section.max_capacity || section.capacity)}`}>
                  {section.current_students || 0} / {section.max_capacity || section.capacity}
                </span>
              </div>
              <div className="w-16 bg-gray-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    ((section.current_students || 0) / (section.max_capacity || section.capacity)) * 100 >= 90
                      ? 'bg-red-500'
                      : ((section.current_students || 0) / (section.max_capacity || section.capacity)) * 100 >= 75
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{
                    width: `${Math.min(((section.current_students || 0) / (section.max_capacity || section.capacity)) * 100, 100)}%`
                  }}
                ></div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => onEdit(section)}
                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-150"
                title="Edit section"
                aria-label={`Edit section ${section.section_name}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => onToggle(section.id)}
                className={`p-2 rounded-lg transition-all duration-150 ${
                  (section.is_active !== false) 
                    ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50' 
                    : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                }`}
                title={(section.is_active !== false) ? "Disable section" : "Enable section"}
                aria-label={`${(section.is_active !== false) ? 'Disable' : 'Enable'} section ${section.section_name}`}
              >
                {(section.is_active !== false) ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
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

        {/* Mobile Capacity Info - Only visible on small screens */}
        <div className="mt-3 sm:hidden flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className={`font-medium ${getCapacityStatus(section.current_students || 0, section.max_capacity || section.capacity)}`}>
                Students: {section.current_students || 0} / {section.max_capacity || section.capacity}
              </span>
            </div>
          </div>
          <div className="w-20 bg-gray-200 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${
                ((section.current_students || 0) / (section.max_capacity || section.capacity)) * 100 >= 90
                  ? 'bg-red-500'
                  : ((section.current_students || 0) / (section.max_capacity || section.capacity)) * 100 >= 75
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{
                width: `${Math.min(((section.current_students || 0) / (section.max_capacity || section.capacity)) * 100, 100)}%`
              }}
            ></div>
          </div>
        </div>
      </div>

    </div>
  )
}
