import { useState } from 'react'
import { Head, Link, router, usePage } from '@inertiajs/react'
import RegistrarSidebar from '../Auth/Registrar_sidebar'
import SectionForm from './Components/SectionForm'
import SectionList from './Components/SectionList'
import ReopenSectionModal from './Components/ReopenSectionModal'
import Breadcrumb from './Components/Breadcrumb'

export default function Sections({ sections = [], previousSections = [], strands = [], schoolYears = [], activeSchoolYear = null, users = [], flash = {} }) {
  const [showForm, setShowForm] = useState(false)
  const [editingSection, setEditingSection] = useState(null)
  const [reopeningSection, setReopeningSection] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSections, setSelectedSections] = useState([])
  const [bulkReopenMode, setBulkReopenMode] = useState(false)

  const filteredSections = sections.filter(section =>
    section.section_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.strand?.Strand_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleEdit = (section) => {
    setEditingSection(section)
    setShowForm(true)
  }

  const handleDelete = (sectionId) => {
    if (confirm('Are you sure you want to delete this section?')) {
      router.delete(`/registrar/sections/${sectionId}`)
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingSection(null)
  }

  const handleBulkReopen = () => {
    if (selectedSections.length === 0) {
      alert('Please select at least one section to reopen.')
      return
    }

    if (confirm(`Are you sure you want to reopen ${selectedSections.length} sections? They will use their original capacity and no adviser will be assigned.`)) {
      router.post('/registrar/sections/reopen-bulk', {
        section_ids: selectedSections
      }, {
        onSuccess: () => {
          setSelectedSections([])
          setBulkReopenMode(false)
        },
        onError: (errors) => {
          console.error('Bulk reopen failed:', errors)
        }
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <RegistrarSidebar />
      <div className="flex-1 flex flex-col">
        <Head title="Registrar • Sections" />

        <header className="bg-white shadow">
          <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
            {/* Breadcrumb */}
            <Breadcrumb 
              items={[
                { href: '/registrar', label: 'Dashboard' },
                { href: '/registrar/sections', label: 'Sections' }
              ]} 
            />
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Sections</h1>
                <p className="mt-1 text-sm text-gray-600">Manage class sections and their assignments</p>
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
                {previousSections && previousSections.length > 0 && (
                  <>
                    <button
                      onClick={() => {
                        const el = document.getElementById('previous-sections');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-indigo-700 border border-indigo-200 shadow-sm hover:bg-indigo-50"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Reopen Sections
                    </button>
                    <button
                      onClick={() => setBulkReopenMode(!bulkReopenMode)}
                      className={`inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm ${
                        bulkReopenMode 
                          ? 'bg-green-600 text-white hover:bg-green-500' 
                          : 'bg-white text-green-700 border border-green-200 hover:bg-green-50'
                      }`}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {bulkReopenMode ? 'Cancel Bulk' : 'Bulk Reopen'}
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Add Section
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

          {/* Search and filters */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search sections by name or strand..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 text-base rounded-lg border-0 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-base sm:leading-6"
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
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-md">
                <span className="font-medium">{filteredSections.length}</span> of <span className="font-medium">{sections.length}</span> sections
              </div>
            </div>
          </div>

          {/* Sections for Active School Year */}
          {activeSchoolYear && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Sections for {activeSchoolYear.School_year_start}-{activeSchoolYear.School_year_end}
                </h2>
                <span className="text-sm text-gray-500">{sections.length} {sections.length === 1 ? 'section' : 'sections'}</span>
              </div>
              <SectionList
                sections={filteredSections}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          )}

          {/* Empty state */}
          {(!activeSchoolYear || sections.length === 0) && (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="mt-2 text-sm font-semibold text-gray-900">
                {!activeSchoolYear ? 'No active school year' : 'No sections'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {!activeSchoolYear 
                  ? 'Please activate a school year first to manage sections.' 
                  : `Get started by creating a new section for ${activeSchoolYear.School_year_start}-${activeSchoolYear.School_year_end}.`}
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                >
                  Add Section
                </button>
              </div>
            </div>
          )}

          {/* Previous Sections - Available for Reopening */}
          {previousSections && previousSections.length > 0 && (
            <div id="previous-sections" className="mt-10 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Previous Sections - Available to Reopen</h2>
                <div className="flex items-center gap-4">
                  {bulkReopenMode && selectedSections.length > 0 && (
                    <button
                      onClick={handleBulkReopen}
                      className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
                    >
                      Reopen {selectedSections.length} Sections
                    </button>
                  )}
                  <span className="text-sm text-gray-500">{previousSections.length} sections available</span>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  These sections from previous school years can be reopened for {activeSchoolYear ? `${activeSchoolYear.School_year_start}-${activeSchoolYear.School_year_end}` : 'the active school year'}. 
                  {bulkReopenMode ? 'Select sections to reopen in bulk.' : 'Click "Reopen" to set capacity and adviser.'}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {previousSections.map((section) => (
                  <div key={section.id} className={`bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition ${
                    bulkReopenMode && selectedSections.includes(section.id) 
                      ? 'border-green-300 bg-green-50' 
                      : 'border-gray-200'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {bulkReopenMode && (
                          <div className="mb-2">
                            <input
                              type="checkbox"
                              id={`section-${section.id}`}
                              checked={selectedSections.includes(section.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedSections([...selectedSections, section.id])
                                } else {
                                  setSelectedSections(selectedSections.filter(id => id !== section.id))
                                }
                              }}
                              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            />
                            <label htmlFor={`section-${section.id}`} className="ml-2 text-sm text-gray-700">
                              Select for bulk reopen
                            </label>
                          </div>
                        )}
                        <h3 className="text-sm font-semibold text-gray-900">{section.section_name}</h3>
                        <p className="mt-1 text-xs text-gray-500">
                          {section.strand?.Strand_name} • Grade {section.year_level}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          From {section.school_year?.School_year_start}-{section.school_year?.School_year_end}
                        </p>
                      </div>
                    </div>
                    {!bulkReopenMode && (
                      <button
                        onClick={() => setReopeningSection(section)}
                        className="mt-3 w-full inline-flex items-center justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Reopen
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Section Form Modal */}
      {showForm && (
        <SectionForm
          section={editingSection}
          strands={strands}
          schoolYears={schoolYears}
          faculty={users}
          onClose={handleFormClose}
        />
      )}

      {/* Reopen Section Modal - Only for active school year */}
      {reopeningSection && activeSchoolYear && (
        <ReopenSectionModal
          section={reopeningSection}
          users={users}
          activeSchoolYear={activeSchoolYear}
          onClose={() => setReopeningSection(null)}
        />
      )}
    </div>
  )
}
