import React, { useEffect, useMemo, useRef, useState } from 'react'

export default function SubjectSearchInput({
  subjects = [],
  value = '',
  onChange = () => {},
  label = 'Subject',
  placeholder = 'Search subject name or code…',
  error = null,
}) {
  const containerRef = useRef(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const selectedSubject = useMemo(
    () => subjects.find((subject) => String(subject.Id) === String(value)),
    [subjects, value]
  )

  useEffect(() => {
    if (selectedSubject) {
      setSearchTerm(`${selectedSubject.Subject_name} (${selectedSubject.Subject_code})`)
    }
  }, [selectedSubject])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredSubjects = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    const list = query.length === 0
      ? subjects
      : subjects.filter((subject) => {
        const name = subject.Subject_name?.toLowerCase() ?? ''
        const code = subject.Subject_code?.toLowerCase() ?? ''
        const semester = String(subject.Semester ?? subject.semester ?? '').toLowerCase()
        return name.includes(query) || code.includes(query) || semester.includes(query)
      })

    return list.slice(0, 20)
  }, [searchTerm, subjects])

  const handleInputChange = (event) => {
    const nextValue = event.target.value
    setSearchTerm(nextValue)
    setIsOpen(true)
    setActiveIndex(0)

    if (value) {
      onChange('')
    }
  }

  const selectSubject = (subject) => {
    if (!subject) return
    onChange(String(subject.Id))
    setSearchTerm(`${subject.Subject_name} (${subject.Subject_code})`)
    setIsOpen(false)
  }

  const handleKeyDown = (event) => {
    if (!isOpen && ['ArrowDown', 'ArrowUp'].includes(event.key)) {
      setIsOpen(true)
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((prev) => (prev + 1) % Math.max(filteredSubjects.length, 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((prev) => (prev - 1 + Math.max(filteredSubjects.length, 1)) % Math.max(filteredSubjects.length, 1))
    } else if (event.key === 'Enter' && isOpen) {
      event.preventDefault()
      selectSubject(filteredSubjects[activeIndex])
    } else if (event.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full border rounded px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${error ? 'border-red-300' : 'border-gray-300'}`}
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('')
              setIsOpen(false)
              onChange('')
            }}
            className="text-gray-400 hover:text-gray-600"
            title="Clear selection"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <p className="mt-1 text-[11px] text-gray-500">Type a subject name, code, or semester to filter. Showing up to 20 matches.</p>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}

      {isOpen && (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
          {filteredSubjects.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">No subjects match “{searchTerm}”.</div>
          ) : (
            <ul role="listbox" className="max-h-60 overflow-y-auto text-sm">
              {filteredSubjects.map((subject, index) => {
                const isActive = index === activeIndex
                const semesterLabel = subject.Semester ?? subject.semester
                return (
                  <li
                    key={subject.Id}
                    role="option"
                    aria-selected={String(subject.Id) === String(value)}
                    className={`cursor-pointer px-3 py-2 flex flex-col gap-0.5 ${isActive ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                    onMouseDown={(event) => {
                      event.preventDefault()
                      selectSubject(subject)
                    }}
                    onMouseEnter={() => setActiveIndex(index)}
                  >
                    <span className="font-medium text-gray-900">{subject.Subject_name}</span>
                    <span className="text-xs text-gray-500 flex flex-wrap gap-2">
                      <span className="font-mono text-gray-700">{subject.Subject_code}</span>
                      {subject.year_level && <span>Grade {subject.year_level}</span>}
                      {semesterLabel && <span>{semesterLabel}</span>}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
