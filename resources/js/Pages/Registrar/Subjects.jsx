import { useState, useEffect } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import SubjectForm from './Components/SubjectForm'
import Breadcrumb from './Components/Breadcrumb'
import Swal from 'sweetalert2'
import RegistrarLayout from './Layout'

export default function Subjects({ subjects = [], strands = [], semesters = [], activeSchoolYear, activeSemester, hasActiveStrands = true, flash = {} }) {
  const [showForm, setShowForm] = useState(false)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [showBulkCreate, setShowBulkCreate] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingSubject, setEditingSubject] = useState(null)
  const [archivingSubject, setArchivingSubject] = useState(null)
  const [openMenuId, setOpenMenuId] = useState(null)

  // Only display subjects that have been manually added to the database
  // Subjects are passed from the backend and only include those created by the registrar
  const displaySubjects = subjects || []

  const handleFormClose = () => {
    setShowForm(false)
    setEditingSubject(null)
  }

  const handleEdit = (subject) => {
    setEditingSubject(subject)
    setShowForm(true)
    setOpenMenuId(null)
  }

  const handleArchive = (subject) => {
    setOpenMenuId(null)
    
    Swal.fire({
      title: 'Archive Subject?',
      text: `Are you sure you want to archive "${subject.Subject_name}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Archive',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        setArchivingSubject(subject.Id)
        router.delete(`/registrar/subjects/${subject.Id}`, {
          onSuccess: () => {
            setArchivingSubject(null)
            Swal.fire({
              title: 'Archived!',
              text: 'Subject has been archived successfully.',
              icon: 'success',
              confirmButtonText: 'OK',
              confirmButtonColor: '#10b981'
            })
          },
          onError: (errors) => {
            Swal.fire({
              title: 'Archive Failed',
              text: errors.message || 'Failed to archive subject. It may be assigned to classes.',
              icon: 'error',
              confirmButtonText: 'OK',
              confirmButtonColor: '#dc2626'
            })
            setArchivingSubject(null)
          }
        })
      }
    })
  }

  const toggleMenu = (subjectId, e) => {
    e?.stopPropagation()
    setOpenMenuId(openMenuId === subjectId ? null : subjectId)
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuId !== null) {
        setOpenMenuId(null)
      }
    }

    if (openMenuId !== null) {
      document.addEventListener('click', handleClickOutside)
      return () => {
        document.removeEventListener('click', handleClickOutside)
      }
    }
  }, [openMenuId])

  // Filter subjects based on search term
  // Only filter subjects that exist in the database (displaySubjects)
  const filteredSubjects = displaySubjects.filter(subject =>
    subject.Subject_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.Subject_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.strand?.Strand_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Group subjects by year level first, then by strand
  // Only groups subjects that have been manually added to the database
  const groupedByYear = filteredSubjects.reduce((groups, subject) => {
    const strandName = subject.strand?.Strand_name || 'Unknown Strand'
    const yearLevel = subject.year_level || 'Unknown Year'
    const semester = subject.Semester || 'Unknown Semester'
    
    if (!groups[yearLevel]) {
      groups[yearLevel] = {}
    }
    if (!groups[yearLevel][strandName]) {
      groups[yearLevel][strandName] = {
        strandName,
        yearLevel,
        semesters: {}
      }
    }
    if (!groups[yearLevel][strandName].semesters[semester]) {
      groups[yearLevel][strandName].semesters[semester] = []
    }
    
    groups[yearLevel][strandName].semesters[semester].push(subject)
    return groups
  }, {})

  const breadcrumbItems = [
    { href: '/registrar', label: 'Dashboard' },
    { href: '/registrar/subjects', label: 'Subjects' }
  ]

  return (
    <RegistrarLayout>
      <Head title="Registrar • Subjects" />

      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <Breadcrumb items={breadcrumbItems} />
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Subjects</h1>
              <p className="mt-1 text-sm text-gray-600">Manage curriculum subjects and their details</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/registrar"
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Flash messages */}
          {flash.success && (
            <div className="mb-6 rounded-md bg-green-50 p-4">
              <div className="text-sm text-green-800">{flash.success}</div>
            </div>
          )}
          {flash.error && (
            <div className="mb-6 rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">{flash.error}</div>
            </div>
          )}

          {/* Warning if no active strands */}
          {!hasActiveStrands && (
            <div className="mb-6 rounded-md bg-yellow-50 border border-yellow-200 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">No Active Strands</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>You cannot add subjects until at least one strand is activated for the current semester. Please activate a strand first.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons - Consolidated Design */}
          <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              {/* Primary Action Button with Dropdown */}
              <div className="relative inline-block">
            <button
              onClick={() => setShowForm(true)}
                  disabled={!hasActiveStrands}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    hasActiveStrands
                      ? 'text-white bg-[#000825] hover:bg-[#1a1f3a] focus:ring-[#000825]/50'
                      : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                  }`}
                  title={!hasActiveStrands ? 'No active strands. Please activate at least one strand first.' : ''}
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Subject
            </button>
              </div>
            
              {/* Secondary Actions - Grouped */}
              <div className="flex items-center gap-2 border-l border-gray-300 pl-3">
            <button
              onClick={() => setShowBulkImport(true)}
                  disabled={!hasActiveStrands}
                  className={`inline-flex items-center px-3 py-2 border text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    hasActiveStrands
                      ? 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50 focus:ring-[#000825]/50'
                      : 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed'
                  }`}
                  title={!hasActiveStrands ? 'No active strands. Please activate at least one strand first.' : ''}
            >
                  <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              Bulk Import
            </button>

                <button
                  onClick={() => setShowBulkCreate(true)}
                  disabled={!hasActiveStrands}
                  className={`inline-flex items-center px-3 py-2 border text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    hasActiveStrands
                      ? 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50 focus:ring-[#000825]/50'
                      : 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed'
                  }`}
                  title={!hasActiveStrands ? 'No active strands. Please activate at least one strand first.' : ''}
                >
                  <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Bulk Create
                </button>
              </div>
            </div>

            {/* Subject Count */}
            <div className="text-sm text-gray-500 font-medium">
              {displaySubjects.length > 0 ? (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-100 text-gray-700">
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  {displaySubjects.length} {displaySubjects.length === 1 ? 'Subject' : 'Subjects'}
                </span>
              ) : (
                <span className="text-gray-400">No subjects added yet</span>
              )}
            </div>
          </div>

          {/* Empty state when no subjects - only shows when no subjects are in database */}
          {displaySubjects.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No subjects added</h3>
              <p className="mt-1 text-sm text-gray-500">
                Use the buttons above to add your first subject or import multiple subjects at once.
              </p>
            </div>
          )}

          {/* Search bar and subjects display - only shows when subjects exist in database */}
          {displaySubjects.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Added Subjects ({filteredSubjects.length} of {displaySubjects.length})</h3>
                
                {/* Search bar */}
                <div className="relative max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search subjects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[#000825]/50 focus:border-[#000825] sm:text-sm"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Grouped subjects by year level - Grade 11 first, then Grade 12 */}
              {Object.keys(groupedByYear).length > 0 ? (
                <div className="space-y-8">
                  {/* Grade 11 Section */}
                  {groupedByYear['11'] && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Grade 11 Subjects</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(groupedByYear['11']).map(([strandName, cardData]) => 
                          // Create separate cards for 1st and 2nd semester
                          Object.entries(cardData.semesters).map(([semester, subjectList]) => (
                            <div key={`grade-11-${strandName}-sem-${semester}`} className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
                              {/* Strand and Semester Header */}
                              <div className={`px-4 py-3 rounded-t-lg ${
                                semester === '1' 
                                  ? 'bg-gradient-to-r from-blue-500 to-cyan-600' 
                                  : 'bg-gradient-to-r from-purple-500 to-pink-600'
                              }`}>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="text-base font-medium text-white">{cardData.strandName}</h4>
                                    <p className="text-sm text-white/90 mt-1">Grade {cardData.yearLevel}</p>
                                  </div>
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    semester === '1'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-purple-100 text-purple-800'
                                  }`}>
                                    {semester === '1' ? '1st Semester' : '2nd Semester'}
                                  </span>
                                </div>
                                <div className="mt-2 text-xs text-white/80">
                                  {subjectList.length} {subjectList.length === 1 ? 'subject' : 'subjects'}
                                </div>
                              </div>
                              
                              {/* Subjects List */}
                              <div className="p-4 flex-1">
                                {subjectList.length > 0 ? (
                                  <div className="space-y-2">
                                    {subjectList.map((subject) => (
                                      <div key={subject.Id} className="bg-gray-50 rounded px-3 py-2 text-sm border border-gray-200 hover:border-gray-300 transition">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                          <div className="flex-1">
                                            <div className="font-medium text-gray-900">
                                              {subject.Subject_name}
                                            </div>
                                            <div className="text-gray-600 font-mono text-xs mt-1">
                                              {subject.Subject_code}
                                            </div>
                                          </div>
                                          <div className="relative flex items-center flex-shrink-0">
                                            <button
                                              onClick={(e) => toggleMenu(subject.Id, e)}
                                              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                                              title="More options"
                                            >
                                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                              </svg>
                                            </button>
                                            
                                            {/* Dropdown Menu */}
                                            {openMenuId === subject.Id && (
                                              <div className="absolute right-0 top-8 z-10 w-40 bg-white rounded-md shadow-lg border border-gray-200 py-1">
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleEdit(subject)
                                                  }}
                                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                                >
                                                  <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                  </svg>
                                                  Edit
                                                </button>
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleArchive(subject)
                                                  }}
                                                  disabled={archivingSubject === subject.Id}
                                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                  {archivingSubject === subject.Id ? (
                                                    <>
                                                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                                      </svg>
                                                      Archiving...
                                                    </>
                                                  ) : (
                                                    <>
                                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                                      </svg>
                                                      Archive
                                                    </>
                                                  )}
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        {/* Prerequisites */}
                                        {subject.PREREQUISITES && (
                                          <div className="mt-2 pt-2 border-t border-gray-300">
                                            <div className="flex items-start gap-1">
                                              <svg className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                              </svg>
                                              <div className="flex-1">
                                                <span className="text-gray-600 font-medium text-xs">Prerequisites:</span>
                                                <p className="text-gray-700 text-xs mt-0.5">{subject.PREREQUISITES}</p>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                        {/* Co-requisites */}
                                        {subject['CO-REQUISITES'] && (
                                          <div className={`${subject.PREREQUISITES ? 'mt-2' : 'mt-2 pt-2 border-t border-gray-300'}`}>
                                            <div className="flex items-start gap-1">
                                              <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                              </svg>
                                              <div className="flex-1">
                                                <span className="text-gray-600 font-medium text-xs">Co-requisites:</span>
                                                <p className="text-gray-700 text-xs mt-0.5">{subject['CO-REQUISITES']}</p>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-4 text-gray-500 text-sm">
                                    No subjects for this semester
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Grade 12 Section */}
                  {groupedByYear['12'] && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Grade 12 Subjects</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(groupedByYear['12']).map(([strandName, cardData]) => 
                          // Create separate cards for 1st and 2nd semester
                          Object.entries(cardData.semesters).map(([semester, subjectList]) => (
                            <div key={`grade-12-${strandName}-sem-${semester}`} className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
                              {/* Strand and Semester Header */}
                              <div className={`px-4 py-3 rounded-t-lg ${
                                semester === '1' 
                                  ? 'bg-gradient-to-r from-blue-500 to-cyan-600' 
                                  : 'bg-gradient-to-r from-purple-500 to-pink-600'
                              }`}>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="text-base font-medium text-white">{cardData.strandName}</h4>
                                    <p className="text-sm text-white/90 mt-1">Grade {cardData.yearLevel}</p>
                                  </div>
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    semester === '1'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-purple-100 text-purple-800'
                                  }`}>
                                    {semester === '1' ? '1st Semester' : '2nd Semester'}
                                  </span>
                                </div>
                                <div className="mt-2 text-xs text-white/80">
                                  {subjectList.length} {subjectList.length === 1 ? 'subject' : 'subjects'}
                                </div>
                              </div>
                              
                              {/* Subjects List */}
                              <div className="p-4 flex-1">
                                {subjectList.length > 0 ? (
                                  <div className="space-y-2">
                                    {subjectList.map((subject) => (
                                      <div key={subject.Id} className="bg-gray-50 rounded px-3 py-2 text-sm border border-gray-200 hover:border-gray-300 transition">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                          <div className="flex-1">
                                            <div className="font-medium text-gray-900">
                                              {subject.Subject_name}
                                            </div>
                                            <div className="text-gray-600 font-mono text-xs mt-1">
                                              {subject.Subject_code}
                                            </div>
                                          </div>
                                          <div className="relative flex items-center flex-shrink-0">
                                            <button
                                              onClick={(e) => toggleMenu(subject.Id, e)}
                                              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                                              title="More options"
                                            >
                                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                              </svg>
                                            </button>
                                            
                                            {/* Dropdown Menu */}
                                            {openMenuId === subject.Id && (
                                              <div className="absolute right-0 top-8 z-10 w-40 bg-white rounded-md shadow-lg border border-gray-200 py-1">
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleEdit(subject)
                                                  }}
                                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                                >
                                                  <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                  </svg>
                                                  Edit
                                                </button>
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleArchive(subject)
                                                  }}
                                                  disabled={archivingSubject === subject.Id}
                                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                  {archivingSubject === subject.Id ? (
                                                    <>
                                                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                                      </svg>
                                                      Archiving...
                                                    </>
                                                  ) : (
                                                    <>
                                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                                      </svg>
                                                      Archive
                                                    </>
                                                  )}
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        {/* Prerequisites */}
                                        {subject.PREREQUISITES && (
                                          <div className="mt-2 pt-2 border-t border-gray-300">
                                            <div className="flex items-start gap-1">
                                              <svg className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                              </svg>
                                              <div className="flex-1">
                                                <span className="text-gray-600 font-medium text-xs">Prerequisites:</span>
                                                <p className="text-gray-700 text-xs mt-0.5">{subject.PREREQUISITES}</p>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                        {/* Co-requisites */}
                                        {subject['CO-REQUISITES'] && (
                                          <div className={`${subject.PREREQUISITES ? 'mt-2' : 'mt-2 pt-2 border-t border-gray-300'}`}>
                                            <div className="flex items-start gap-1">
                                              <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                              </svg>
                                              <div className="flex-1">
                                                <span className="text-gray-600 font-medium text-xs">Co-requisites:</span>
                                                <p className="text-gray-700 text-xs mt-0.5">{subject['CO-REQUISITES']}</p>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-4 text-gray-500 text-sm">
                                    No subjects for this semester
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-8 text-center">
                  <p className="text-gray-500">
                    {searchTerm ? `No subjects found matching "${searchTerm}"` : 'No subjects found'}
                  </p>
                </div>
              )}
            </div>
          )}

      </main>

      {/* Subject Form Modal */}
      {showForm && (
        <SubjectForm
          subject={editingSubject}
          strands={strands}
          semesters={semesters}
          activeSemester={activeSemester}
          onClose={handleFormClose}
        />
      )}

      {/* Bulk Import Modal */}
      {showBulkImport && (
        <BulkImportModal
          strands={strands}
          activeSemester={activeSemester}
          onClose={() => setShowBulkImport(false)}
        />
      )}

      {/* Bulk Create Form (on page, not modal) */}
      {showBulkCreate && (
        <BulkCreateSubjectsForm
          strands={strands}
          activeSemester={activeSemester}
          hasActiveStrands={hasActiveStrands}
          onClose={() => setShowBulkCreate(false)}
        />
      )}
    </RegistrarLayout>
  )
}

// Bulk Create Subjects Form Component (on page, not modal)
function BulkCreateSubjectsForm({ strands, activeSemester, hasActiveStrands, onClose }) {
  const [subjects, setSubjects] = useState([
    { Subject_name: '', Subject_code: '', year_level: '', strand_id: '', PREREQUISITES: '', 'CO-REQUISITES': '' }
  ])
  const [errors, setErrors] = useState({})
  const [processing, setProcessing] = useState(false)

  const addSubjectRow = () => {
    if (subjects.length < 20) {
      setSubjects([...subjects, { Subject_name: '', Subject_code: '', year_level: '', strand_id: '', PREREQUISITES: '', 'CO-REQUISITES': '' }])
    }
  }

  const removeSubjectRow = (index) => {
    if (subjects.length > 1) {
      const newSubjects = subjects.filter((_, i) => i !== index)
      setSubjects(newSubjects)
      // Clear errors for removed row
      const newErrors = { ...errors }
      Object.keys(newErrors).forEach(key => {
        if (key.startsWith(`subjects.${index}.`)) {
          delete newErrors[key]
        } else if (key.startsWith(`subjects.${index + 1}.`)) {
          // Renumber errors for rows after removed one
          const newKey = key.replace(`subjects.${index + 1}.`, `subjects.${index}.`)
          newErrors[newKey] = newErrors[key]
          delete newErrors[key]
        }
      })
      setErrors(newErrors)
    }
  }

  const updateSubject = (index, field, value) => {
    const newSubjects = [...subjects]
    newSubjects[index] = { ...newSubjects[index], [field]: value }
    setSubjects(newSubjects)
    // Clear error for this field
    if (errors[`subjects.${index}.${field}`]) {
      const newErrors = { ...errors }
      delete newErrors[`subjects.${index}.${field}`]
      setErrors(newErrors)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!hasActiveStrands) {
      Swal.fire({
        title: 'No Active Strands',
        text: 'Please activate at least one strand first.',
        icon: 'warning',
        confirmButtonText: 'OK',
        confirmButtonColor: '#f59e0b'
      })
      return
    }

    // Validate all subjects
    const newErrors = {}
    const validSubjects = []

    subjects.forEach((subject, index) => {
      // Skip empty rows
      if (!subject.Subject_name && !subject.Subject_code && !subject.strand_id) {
        return
      }

      // Validate required fields
      if (!subject.Subject_name) {
        newErrors[`subjects.${index}.Subject_name`] = 'Subject name is required'
      }
      if (!subject.Subject_code) {
        newErrors[`subjects.${index}.Subject_code`] = 'Subject code is required'
      }
      if (!subject.year_level) {
        newErrors[`subjects.${index}.year_level`] = 'Year level is required'
      }
      if (!subject.strand_id) {
        newErrors[`subjects.${index}.strand_id`] = 'Strand is required'
      }

      // Check for duplicate codes in the form
      const duplicateIndex = validSubjects.findIndex(s => s.Subject_code === subject.Subject_code && subject.Subject_code)
      if (duplicateIndex !== -1) {
        newErrors[`subjects.${index}.Subject_code`] = 'Duplicate subject code in this form'
      }

      if (!newErrors[`subjects.${index}.Subject_name`] && 
          !newErrors[`subjects.${index}.Subject_code`] && 
          !newErrors[`subjects.${index}.year_level`] && 
          !newErrors[`subjects.${index}.strand_id`]) {
        validSubjects.push(subject)
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    if (validSubjects.length === 0) {
      Swal.fire({
        title: 'No Subjects to Create',
        text: 'Please fill in at least one subject.',
        icon: 'info',
        confirmButtonText: 'OK',
        confirmButtonColor: '#3b82f6'
      })
      return
    }

    setProcessing(true)
    setErrors({})

    router.post('/registrar/subjects/bulk', {
      subjects: validSubjects
    }, {
      onSuccess: () => {
        setSubjects([{ Subject_name: '', Subject_code: '', year_level: '', strand_id: '', PREREQUISITES: '', 'CO-REQUISITES': '' }])
        setErrors({})
        onClose()
        window.location.reload()
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

  return (
    <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Bulk Create Subjects</h3>
          <p className="text-sm text-gray-500 mt-1">
            Add multiple subjects at once. Fill in at least one subject to create.
            {activeSemester && (
              <span className="ml-2 text-blue-600 font-medium">Active: {activeSemester.semester_type}</span>
            )}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {subjects.map((subject, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-gray-700">Subject {index + 1}</h4>
                {subjects.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSubjectRow(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Subject Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    value={subject.Subject_name}
                    onChange={(e) => updateSubject(index, 'Subject_name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md text-sm ${
                      errors[`subjects.${index}.Subject_name`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Oral Communication"
                  />
                  {errors[`subjects.${index}.Subject_name`] && (
                    <p className="mt-1 text-xs text-red-600">{errors[`subjects.${index}.Subject_name`]}</p>
                  )}
                </div>

                {/* Subject Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject Code *
                  </label>
                  <input
                    type="text"
                    value={subject.Subject_code}
                    onChange={(e) => updateSubject(index, 'Subject_code', e.target.value.toUpperCase())}
                    className={`w-full px-3 py-2 border rounded-md text-sm font-mono ${
                      errors[`subjects.${index}.Subject_code`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="e.g., ORAL_COMM"
                  />
                  {errors[`subjects.${index}.Subject_code`] && (
                    <p className="mt-1 text-xs text-red-600">{errors[`subjects.${index}.Subject_code`]}</p>
                  )}
                </div>

                {/* Year Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year Level *
                  </label>
                  <select
                    value={subject.year_level}
                    onChange={(e) => updateSubject(index, 'year_level', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md text-sm ${
                      errors[`subjects.${index}.year_level`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select...</option>
                    <option value="11">Grade 11</option>
                    <option value="12">Grade 12</option>
                  </select>
                  {errors[`subjects.${index}.year_level`] && (
                    <p className="mt-1 text-xs text-red-600">{errors[`subjects.${index}.year_level`]}</p>
                  )}
                </div>

                {/* Strand */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Strand *
                  </label>
                  <select
                    value={subject.strand_id}
                    onChange={(e) => updateSubject(index, 'strand_id', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md text-sm ${
                      errors[`subjects.${index}.strand_id`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select...</option>
                    {strands.map(strand => (
                      <option key={strand.id} value={strand.id}>
                        {strand.Strand_name}
                      </option>
                    ))}
                  </select>
                  {errors[`subjects.${index}.strand_id`] && (
                    <p className="mt-1 text-xs text-red-600">{errors[`subjects.${index}.strand_id`]}</p>
                  )}
                </div>

                {/* Prerequisites */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prerequisites
                  </label>
                  <input
                    type="text"
                    value={subject.PREREQUISITES}
                    onChange={(e) => updateSubject(index, 'PREREQUISITES', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="e.g., Pre-calculus, Basic Calculus"
                  />
                </div>

                {/* Co-requisites */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Co-requisites
                  </label>
                  <input
                    type="text"
                    value={subject['CO-REQUISITES']}
                    onChange={(e) => updateSubject(index, 'CO-REQUISITES', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="e.g., Subject A, Subject B"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={addSubjectRow}
            disabled={subjects.length >= 20}
            className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium ${
              subjects.length >= 20
                ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                : 'text-gray-700 bg-white hover:bg-gray-50'
            }`}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Subject Row ({subjects.length}/20)
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing || !hasActiveStrands}
              className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
                processing || !hasActiveStrands
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {processing ? 'Creating...' : `Create ${subjects.filter(s => s.Subject_name || s.Subject_code).length} Subject(s)`}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

// Bulk Import Modal Component
function BulkImportModal({ strands, activeSemester, onClose }) {
  const [selectedStrand, setSelectedStrand] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  // Removed selectedSemester - will use activeSemester automatically
  const [importing, setImporting] = useState(false)

  const handleImport = () => {
    if (!selectedStrand || !selectedYear) {
      Swal.fire({
        title: 'Missing Selection',
        text: 'Please select strand and year level',
        icon: 'warning',
        confirmButtonText: 'OK',
        confirmButtonColor: '#f59e0b'
      })
      return
    }

    if (!activeSemester) {
      Swal.fire({
        title: 'No Active Semester',
        text: 'Please activate a semester first.',
        icon: 'warning',
        confirmButtonText: 'OK',
        confirmButtonColor: '#f59e0b'
      })
      return
    }

    setImporting(true)
    
    router.post('/registrar/subjects/bulk-import', {
      strand_id: selectedStrand,
      year_level: selectedYear,
      // Removed semester from request - backend will use active semester automatically
    }, {
      onSuccess: (page) => {
        // Check if there's a success message in the response
        const message = page.props.flash?.success || 'Subjects imported successfully!'
        Swal.fire({
          title: 'Import Successful!',
          text: message,
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#10b981'
        }).then(() => {
          onClose()
          window.location.reload() // Refresh to show new subjects
        })
      },
      onError: (errors) => {
        console.error('Import errors:', errors)
        const message = errors.message || 'Import failed. Please try again.'
        Swal.fire({
          title: 'Import Failed',
          text: message,
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#dc2626'
        })
        setImporting(false)
      },
      onFinish: () => {
        setImporting(false)
      }
    })
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
                Bulk Import Subjects
                {activeSemester && (
                  <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    {activeSemester.semester_type}
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Import all subjects for a specific strand and year level for the currently active semester.
              </p>

              <div className="space-y-4">
                {/* Strand Selection */}
                <div>
                  <label htmlFor="strand" className="block text-sm font-medium leading-6 text-gray-900">
                    Strand *
                  </label>
                  <select
                    id="strand"
                    value={selectedStrand}
                    onChange={(e) => setSelectedStrand(e.target.value)}
                    className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  >
                    <option value="">Select a strand</option>
                    {strands.map((strand) => (
                      <option key={strand.id} value={strand.id}>
                        {strand.Strand_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Year Level */}
                <div>
                  <label htmlFor="year" className="block text-sm font-medium leading-6 text-gray-900">
                    Year Level *
                  </label>
                  <select
                    id="year"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  >
                    <option value="">Select year level</option>
                    <option value="11">Grade 11</option>
                    <option value="12">Grade 12</option>
                  </select>
                </div>

              </div>

              {/* Form Actions */}
              <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 sm:mt-0 sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={importing || !selectedStrand || !selectedYear || !activeSemester}
                  className="inline-flex w-full justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importing ? 'Importing...' : 'Import Subjects'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

