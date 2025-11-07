import { useState } from 'react'

export default function SubjectCard({ subject, onEdit, onDelete }) {
  const [showMenu, setShowMenu] = useState(false)

  const getYearLevelBadge = (yearLevel) => {
    const colors = {
      '11': 'bg-blue-100 text-blue-800',
      '12': 'bg-green-100 text-green-800'
    }
    return colors[yearLevel] || 'bg-gray-100 text-gray-800'
  }

  const getSemesterBadge = (semesterName) => {
    if (!semesterName) return 'bg-gray-100 text-gray-800'
    
    if (semesterName.toLowerCase().includes('1st') || semesterName.toLowerCase().includes('first')) {
      return 'bg-purple-100 text-purple-800'
    }
    if (semesterName.toLowerCase().includes('2nd') || semesterName.toLowerCase().includes('second')) {
      return 'bg-orange-100 text-orange-800'
    }
    return 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="relative bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      {/* Card Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {subject.Subject_name}
            </h3>
            <p className="text-sm text-gray-600 mt-1 font-mono">
              {subject.Subject_code}
            </p>
          </div>
          
          {/* Actions Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            
            {showMenu && (
              <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                <button
                  onClick={() => {
                    onEdit(subject)
                    setShowMenu(false)
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-md"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    onDelete(subject.Id)
                    setShowMenu(false)
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-md"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 space-y-3">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getYearLevelBadge(subject.year_level)}`}>
            Grade {subject.year_level}
          </span>
          {subject.semester && (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSemesterBadge(subject.semester.semester_name)}`}>
              {subject.semester.semester_name}
            </span>
          )}
        </div>

        {/* Strand Info */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Strand</span>
          <span className="text-sm font-medium text-gray-900">
            {subject.strand?.strand_name || 'No strand assigned'}
          </span>
        </div>

        {/* Prerequisites */}
        {subject.PREREQUISITES && (
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-semibold text-gray-700 mb-1">Prerequisites</h4>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {subject.PREREQUISITES}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Co-requisites */}
        {subject['CO-REQUISITES'] && (
          <div className={`pt-2 ${subject.PREREQUISITES ? '' : 'border-t border-gray-100'}`}>
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-semibold text-gray-700 mb-1">Co-requisites</h4>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {subject['CO-REQUISITES']}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div className="pt-2 border-t border-gray-100 text-xs text-gray-500">
          <div className="flex justify-between">
            <span>Created: {new Date(subject.created_at).toLocaleDateString()}</span>
            {subject.updated_at !== subject.created_at && (
              <span>Updated: {new Date(subject.updated_at).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowMenu(false)}
        ></div>
      )}
    </div>
  )
}
