import { useState } from 'react'
import { Head, router } from '@inertiajs/react'
import RegistrarSidebar from '../Auth/Registrar_sidebar'
import Breadcrumb from './Components/Breadcrumb'
import SectionCard from './Components/SectionCard'
import SectionForm from './Components/SectionForm'
import ReopenSectionModal from './Components/ReopenSectionModal'

export default function Strands({ strands = [], sections = [], previousSections = [], users = [], activeSchoolYear, activeSemester, flash = {} }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingStrand, setEditingStrand] = useState(null)
  const [formData, setFormData] = useState({
    Strand_code: '',
    Strand_name: '',
    Is_active: true
  })
  const [processing, setProcessing] = useState(false)
  const [errors, setErrors] = useState({})
  
  // New state for sections management
  const [expandedStrands, setExpandedStrands] = useState(new Set())
  const [showSectionForm, setShowSectionForm] = useState(false)
  const [editingSection, setEditingSection] = useState(null)
  const [selectedStrandForSection, setSelectedStrandForSection] = useState(null)
  const [reopeningSection, setReopeningSection] = useState(null)
  const [selectedSections, setSelectedSections] = useState([])
  const [bulkReopenMode, setBulkReopenMode] = useState(false)

  // HCI Principle 1: Visibility of system status
  const filteredStrands = strands.filter(strand =>
    strand.Strand_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    strand.Strand_code?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleFormSubmit = (e) => {
    e.preventDefault()
    setProcessing(true)
    setErrors({})

    const url = editingStrand 
      ? `/registrar/strands/${editingStrand.id}`
      : '/registrar/strands'
    
    const method = editingStrand ? 'put' : 'post'

    router[method](url, formData, {
      onSuccess: () => {
        setShowForm(false)
        setEditingStrand(null)
        setFormData({ Strand_code: '', Strand_name: '', Is_active: true })
      },
      onError: (errors) => setErrors(errors),
      onFinish: () => setProcessing(false)
    })
  }

  const handleEdit = (strand) => {
    setEditingStrand(strand)
    setFormData({
      Strand_code: strand.Strand_code,
      Strand_name: strand.Strand_name,
      Is_active: strand.Is_active
    })
    setShowForm(true)
  }

  const handleDisable = (strand) => {
    // HCI Principle 5: Error prevention
    const action = strand.Is_active ? 'disable' : 'enable'
    if (confirm(`Are you sure you want to ${action} ${strand.Strand_name}?`)) {
      router.put(`/registrar/strands/${strand.id}/toggle`)
    }
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingStrand(null)
    setFormData({ Strand_code: '', Strand_name: '', Is_active: true })
    setErrors({})
  }

  // HCI Principle 3: User control and freedom - Expandable strands
  const toggleStrandExpansion = (strandId) => {
    const newExpanded = new Set(expandedStrands)
    if (newExpanded.has(strandId)) {
      newExpanded.delete(strandId)
    } else {
      newExpanded.add(strandId)
    }
    setExpandedStrands(newExpanded)
  }

  // Sections management functions
  const getSectionsForStrand = (strandId) => {
    return sections.filter(section => section.strand_id === strandId)
  }

  const getPreviousSectionsForStrand = (strandId) => {
    return previousSections.filter(section => section.strand_id === strandId)
  }

  const handleAddSection = (strand) => {
    setSelectedStrandForSection(strand)
    setEditingSection(null)
    setShowSectionForm(true)
  }

  const handleEditSection = (section) => {
    setEditingSection(section)
    setSelectedStrandForSection(strands.find(s => s.id === section.strand_id))
    setShowSectionForm(true)
  }

  const handleToggleSection = (sectionId) => {
    const section = sections.find(s => s.id === sectionId)
    const action = (section?.is_active !== false) ? 'disable' : 'enable'
    if (confirm(`Are you sure you want to ${action} this section?`)) {
      router.put(`/registrar/sections/${sectionId}/toggle`)
    }
  }

  const handleSectionFormClose = () => {
    setShowSectionForm(false)
    setEditingSection(null)
    setSelectedStrandForSection(null)
  }

  const handleBulkReopen = (strandId) => {
    const strandSections = selectedSections.filter(id => 
      previousSections.find(s => s.id === id && s.strand_id === strandId)
    )
  }


  return (
    <div className="min-h-screen bg-gray-50 flex">
      <RegistrarSidebar />
      <div className="flex-1 flex flex-col">
        <Head title="Registrar • Strands" />

        <header className="bg-white shadow">
          <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
            <Breadcrumb 
              items={[
                { label: 'Dashboard', href: '/registrar' },
                { label: 'Strands & Sections', href: '/registrar/strands', current: true }
              ]} 
            />
            <div className="flex items-center justify-between mt-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Academic Strands & Sections</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Manage Senior High School strands and their sections in one place
                </p>
                {activeSchoolYear && (
                  <div className="mt-2 space-y-1">
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active School Year: {activeSchoolYear.School_year_start}-{activeSchoolYear.School_year_end}
                    </div>
                    {activeSemester && (
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ml-2">
                        Active Semester: {activeSemester.semester_type}
                      </div>
                    )}
                  </div>
                )}
                {!activeSchoolYear && (
                  <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    No active school year
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Strand
              </button>
            </div>
          </div>
        </header>

        {/* HCI Principle 4: Consistency and standards */}
        {flash.success && (
          <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="ml-3 text-sm font-medium text-green-800">{flash.success}</p>
              </div>
            </div>
          </div>
        )}

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 w-full">
          {/* Search and filters - HCI Principle 7: Flexibility and efficiency */}
          <div className="mb-6 flex items-center justify-between">
            <div className="relative max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search strands and sections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-600">
                Showing {filteredStrands.length} of {strands.length} strands
              </p>
              {previousSections && previousSections.length > 0 && (
                <button
                  onClick={() => setBulkReopenMode(!bulkReopenMode)}
                  className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md ${
                    bulkReopenMode 
                      ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                      : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                  }`}
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {bulkReopenMode ? 'Cancel Bulk Reopen' : 'Bulk Reopen Mode'}
                </button>
              )}
            </div>
          </div>

          {/* Enhanced Strands with Sections - HCI Principle 6: Recognition rather than recall */}
          <div className="grid grid-cols-1 gap-6 w-full">
            {filteredStrands.map((strand) => {
              const strandSections = getSectionsForStrand(strand.id)
              const strandPreviousSections = getPreviousSectionsForStrand(strand.id)
              const isExpanded = expandedStrands.has(strand.id)
              
              return (
                <div key={strand.id} className={`bg-white rounded-xl shadow-sm border-2 transition-all duration-200 min-h-[200px] w-full max-w-full overflow-hidden ${
                  (activeSemester ? strand.is_active_for_semester : strand.is_active_for_year) ? 'border-green-200' : 'border-gray-200'
                } ${isExpanded ? 'shadow-lg' : 'hover:shadow-md'}`}>
                  
                  {/* Strand Header - HCI Principle 8: Aesthetic and minimalist design */}
                  <div className="p-6 w-full border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <button
                            onClick={() => toggleStrandExpansion(strand.id)}
                            className="flex items-center gap-2 hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
                          >
                            <svg className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            <h3 className="text-xl font-bold text-gray-900">{strand.Strand_code}</h3>
                          </button>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            (activeSemester ? strand.is_active_for_semester : strand.is_active_for_year)
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {(activeSemester ? strand.is_active_for_semester : strand.is_active_for_year) ? 'Active' : 'Inactive'}
                            {activeSemester && (
                              <span className="ml-1 text-xs opacity-75">
                                (Semester)
                              </span>
                            )}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">{strand.Strand_name}</p>
                        
                        {/* Quick Stats */}
                        {activeSchoolYear && (
                          <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              <span className="text-gray-600">Sections:</span>
                              <span className="font-semibold text-blue-600">{strandSections.length}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                              <span className="text-gray-600">Subjects:</span>
                              <span className="font-semibold text-purple-600">{strand.subjects_count || 0}</span>
                            </div>
                            {strandPreviousSections.length > 0 && (
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span className="text-gray-600">Available to reopen:</span>
                                <span className="font-semibold text-orange-600">{strandPreviousSections.length}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Strand Actions */}
                      <div className="flex items-center gap-2">
                        {(activeSemester ? strand.is_active_for_semester : strand.is_active_for_year) && (
                          <button
                            onClick={() => handleAddSection(strand)}
                            className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Section
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(strand)}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => router.put(`/registrar/strands/${strand.id}/toggle`)}
                          className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                            (activeSemester ? strand.is_active_for_semester : strand.is_active_for_year)
                              ? 'text-orange-600 bg-orange-50 hover:bg-orange-100 focus:ring-orange-500' 
                              : 'text-green-600 bg-green-50 hover:bg-green-100 focus:ring-green-500'
                          }`}
                        >
                          {(activeSemester ? strand.is_active_for_semester : strand.is_active_for_year) ? (
                            <>
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                              </svg>
                              Deactivate
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Activate
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Sections View - HCI Principle 7: Flexibility and efficiency of use */}
                  {isExpanded && (
                    <div className="p-6 bg-gray-50 w-full max-w-full overflow-hidden">
                      {/* Current Sections */}
                      {strandSections.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            Current Sections ({strandSections.length})
                          </h4>
                          <div className="space-y-3 w-full max-w-full">
                            {strandSections.map((section) => (
                              <SectionCard
                                key={section.id}
                                section={section}
                                onEdit={handleEditSection}
                                onToggle={handleToggleSection}
                                faculty={users}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Previous Sections Available for Reopening */}
                      {strandPreviousSections.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Available to Reopen ({strandPreviousSections.length})
                            </h4>
                            {bulkReopenMode && (
                              <button
                                onClick={() => handleBulkReopen(strand.id)}
                                className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                              >
                                Reopen Selected
                              </button>
                            )}
                          </div>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                            <p className="text-sm text-blue-800">
                              These sections from previous school years can be reopened for {activeSchoolYear ? `${activeSchoolYear.School_year_start}-${activeSchoolYear.School_year_end}` : 'the active school year'}.
                              {bulkReopenMode ? ' Select sections to reopen in bulk.' : ' Click "Reopen" to set capacity and adviser.'}
                            </p>
                          </div>
                          <div className="space-y-3 w-full max-w-full">
                            {strandPreviousSections.map((section) => (
                              <div key={section.id} className={`bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition ${
                                bulkReopenMode && selectedSections.includes(section.id) 
                                  ? 'border-green-300 bg-green-50' 
                                  : 'border-gray-200'
                              }`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                                    {bulkReopenMode && (
                                      <div className="flex items-center">
                                        <input
                                          type="checkbox"
                                          id={`section-${section.id}`}
                                          checked={selectedSections.includes(section.id)}
                                          onChange={() => handleSectionSelection(section.id)}
                                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor={`section-${section.id}`} className="sr-only">
                                          Select {section.section_name} for bulk reopen
                                        </label>
                                      </div>
                                    )}
                                    
                                    {/* Section Icon */}
                                    <div className="flex-shrink-0">
                                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                      </div>
                                    </div>

                                    {/* Section Details */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center space-x-2">
                                        <h5 className="text-sm font-semibold text-gray-900 truncate">{section.section_name}</h5>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                          Grade {section.year_level}
                                        </span>
                                      </div>
                                      <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                                        <span className="truncate">{section.strand?.Strand_name}</span>
                                        <span>From: {section.schoolYear?.School_year_start}-{section.schoolYear?.School_year_end}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Action Button */}
                                  {!bulkReopenMode && (
                                    <button
                                      onClick={() => setReopeningSection(section)}
                                      className="flex items-center px-3 py-1.5 text-xs bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors"
                                    >
                                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                      </svg>
                                      Reopen
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Empty State for Sections */}
                      {strandSections.length === 0 && strandPreviousSections.length === 0 && (
                        <div className="text-center py-8">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <h3 className="mt-2 text-sm font-medium text-gray-900">No sections yet</h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Get started by creating a section for this strand.
                          </p>
                          {strand.is_active_for_year && (
                            <div className="mt-6">
                              <button
                                onClick={() => handleAddSection(strand)}
                                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Add First Section
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer for collapsed cards to maintain consistent width visibility */}
                  {!isExpanded && (
                    <div className="px-6 py-3 bg-gray-50 w-full rounded-b-xl">
                      <div className="text-xs text-gray-500 text-center">
                        Click to expand and manage sections
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {!activeSchoolYear && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <svg className="mx-auto h-12 w-12 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No active school year</h3>
              <p className="mt-1 text-sm text-gray-500">
                Please activate a school year first to manage strands for that school year.
              </p>
              <div className="mt-4">
                <button
                  onClick={() => router.visit('/registrar/school-years')}
                  className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                >
                  Go to School Years
                </button>
              </div>
            </div>
          )}

          {activeSchoolYear && filteredStrands.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No strands found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? `No strands match "${searchTerm}"` : 'Get started by creating a new strand and activating it for this school year.'}
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Strand Form Modal - HCI Principle 8: Aesthetic and minimalist design */}
      {showForm && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingStrand ? 'Edit Strand' : 'Add New Strand'}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label htmlFor="strand_code" className="block text-sm font-medium text-gray-700">
                  Strand Code *
                </label>
                <input
                  type="text"
                  id="strand_code"
                  value={formData.Strand_code}
                  onChange={(e) => setFormData({...formData, Strand_code: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="e.g., STEM, ABM, HUMSS"
                  required
                />
                {errors.Strand_code && (
                  <p className="mt-1 text-sm text-red-600">{errors.Strand_code}</p>
                )}
              </div>

              <div>
                <label htmlFor="strand_name" className="block text-sm font-medium text-gray-700">
                  Strand Name *
                </label>
                <input
                  type="text"
                  id="strand_name"
                  value={formData.Strand_name}
                  onChange={(e) => setFormData({...formData, Strand_name: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Full strand name"
                  required
                />
                {errors.Strand_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.Strand_name}</p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.Is_active}
                  onChange={(e) => setFormData({...formData, Is_active: e.target.checked})}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  Active strand
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {processing ? 'Saving...' : (editingStrand ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Section Form Modal */}
      {showSectionForm && selectedStrandForSection && (
        <SectionForm
          section={editingSection}
          strands={[selectedStrandForSection]} // Only show the selected strand
          schoolYears={[activeSchoolYear]} // Only show active school year
          faculty={users} // Pass faculty users for adviser selection
          onClose={handleSectionFormClose}
        />
      )}

      {/* Reopen Section Modal */}
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
