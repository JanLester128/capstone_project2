import { useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import RegistrarSidebar from '../Auth/Registrar_sidebar'
import SubjectForm from './Components/SubjectForm'
import Breadcrumb from './Components/Breadcrumb'

export default function Subjects({ subjects = [], strands = [], semesters = [], activeSchoolYear, flash = {} }) {
  const [showForm, setShowForm] = useState(false)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Only display subjects that have been manually added to the database
  // Subjects are passed from the backend and only include those created by the registrar
  const displaySubjects = subjects || []

  const handleFormClose = () => {
    setShowForm(false)
  }

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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <RegistrarSidebar />
      <div className="flex-1 flex flex-col">
        <Head title="Registrar • Subjects" />

        <header className="bg-white shadow">
          <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
            {/* Breadcrumb */}
            <Breadcrumb 
              items={[
                { href: '/registrar', label: 'Dashboard' },
                { href: '/registrar/subjects', label: 'Subjects' }
              ]} 
            />
            
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
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Add Subject
                </button>
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

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Subject
            </button>
            
            <button
              onClick={() => setShowBulkImport(true)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              Bulk Import
            </button>

            <div className="ml-auto text-sm text-gray-500">
              {displaySubjects.length > 0 ? `${displaySubjects.length} subjects added` : 'No subjects added yet'}
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
                Get started by adding your first subject or use bulk import to add multiple subjects at once.
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                >
                  Add Subject
                </button>
                <button
                  onClick={() => setShowBulkImport(true)}
                  className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  Bulk Import
                </button>
              </div>
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
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                                        <div className="font-medium text-gray-900 mb-1">
                                          {subject.Subject_name}
                                        </div>
                                        <div className="text-gray-600 font-mono text-xs mb-2">
                                          {subject.Subject_code}
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
                                        <div className="font-medium text-gray-900 mb-1">
                                          {subject.Subject_name}
                                        </div>
                                        <div className="text-gray-600 font-mono text-xs mb-2">
                                          {subject.Subject_code}
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
      </div>

      {/* Subject Form Modal */}
      {showForm && (
        <SubjectForm
          subject={null}
          strands={strands}
          semesters={semesters}
          onClose={handleFormClose}
        />
      )}

      {/* Bulk Import Modal */}
      {showBulkImport && (
        <BulkImportModal
          strands={strands}
          onClose={() => setShowBulkImport(false)}
        />
      )}
    </div>
  )
}

// Bulk Import Modal Component
function BulkImportModal({ strands, onClose }) {
  const [selectedStrand, setSelectedStrand] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('')
  const [importing, setImporting] = useState(false)

  const handleImport = () => {
    if (!selectedStrand || !selectedYear || !selectedSemester) {
      alert('Please select strand, year level, and semester')
      return
    }

    setImporting(true)
    
    router.post('/registrar/subjects/bulk-import', {
      strand_id: selectedStrand,
      year_level: selectedYear,
      semester: selectedSemester
    }, {
      onSuccess: (page) => {
        // Check if there's a success message in the response
        if (page.props.flash?.success) {
          alert(page.props.flash.success)
        } else {
          alert('Subjects imported successfully!')
        }
        onClose()
        window.location.reload() // Refresh to show new subjects
      },
      onError: (errors) => {
        console.error('Import errors:', errors)
        if (errors.message) {
          alert(errors.message)
        } else {
          alert('Import failed. Please try again.')
        }
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
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Import all subjects for a specific strand, year level, and semester from the curriculum database.
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

                {/* Semester */}
                <div>
                  <label htmlFor="semester" className="block text-sm font-medium leading-6 text-gray-900">
                    Semester *
                  </label>
                  <select
                    id="semester"
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  >
                    <option value="">Select semester</option>
                    <option value="1">1st Semester</option>
                    <option value="2">2nd Semester</option>
                  </select>
                </div>
              </div>

              {/* Form Actions */}
              <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={importing || !selectedStrand || !selectedYear || !selectedSemester}
                  className="inline-flex w-full justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
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
