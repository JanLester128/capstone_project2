import { useState } from 'react'
import { Head, router } from '@inertiajs/react'
import RegistrarSidebar from '../Auth/Registrar_sidebar'
import Breadcrumb from './Components/Breadcrumb'
import SemesterForm from './Components/SemesterForm'

export default function SchoolYears({ schoolYears = [], flash = {} }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingYear, setEditingYear] = useState(null)
  const [showSemesterForm, setShowSemesterForm] = useState(false)
  const [editingSemester, setEditingSemester] = useState(null)
  const [selectedSchoolYear, setSelectedSchoolYear] = useState(null)
  const [formData, setFormData] = useState({
    School_year_start: '',
    School_year_end: '',
    is_active: false
  })
  const [processing, setProcessing] = useState(false)
  const [errors, setErrors] = useState({})

  // HCI Principle 1: Visibility of system status
  const filteredYears = schoolYears.filter(year => {
    const yearString = `${year.School_year_start}-${year.School_year_end}`
    return yearString.includes(searchTerm)
  })

  const currentYear = new Date().getFullYear()
  const activeYear = schoolYears.find(year => year.is_active)

  const handleFormSubmit = (e) => {
    e.preventDefault()
    setProcessing(true)
    setErrors({})

    // HCI Principle 5: Error prevention - Validate year range
    const startYear = parseInt(formData.School_year_start)
    const endYear = parseInt(formData.School_year_end)
    
    if (endYear !== startYear + 1) {
      setErrors({ School_year_end: 'End year must be exactly one year after start year' })
      setProcessing(false)
      return
    }

    const url = editingYear 
      ? `/registrar/school-years/${editingYear.id}`
      : '/registrar/school-years'
    
    const method = editingYear ? 'put' : 'post'

    // Convert string values to numbers for backend
    const submitData = {
      ...formData,
      School_year_start: parseInt(formData.School_year_start),
      School_year_end: parseInt(formData.School_year_end)
    }

    router[method](url, submitData, {
      onSuccess: () => {
        setShowForm(false)
        setEditingYear(null)
        setFormData({ School_year_start: '', School_year_end: '', is_active: false })
      },
      onError: (errors) => setErrors(errors),
      onFinish: () => setProcessing(false)
    })
  }

  const handleEdit = (year) => {
    setEditingYear(year)
    setFormData({
      School_year_start: year.School_year_start.toString(),
      School_year_end: year.School_year_end.toString(),
      is_active: year.is_active
    })
    setShowForm(true)
  }

  const handleSetActive = (year) => {
    // HCI Principle 5: Error prevention
    if (year.is_active) return
    
    if (confirm(`Set ${year.School_year_start}-${year.School_year_end} as the active school year? 

This will:
• Deactivate the current active year
• Automatically reset data for the new academic year
• Deactivate all strands (you'll need to reactivate them)
• Require you to reopen sections and add subjects for the new year

Continue?`)) {
      router.put(`/registrar/school-years/${year.id}/activate`)
    }
  }

  const handleDisable = (year) => {
    // HCI Principle 5: Error prevention
    if (year.is_active && year.enabled !== false) {
      alert('Cannot disable the active school year. Please set another year as active first.')
      return
    }
    
    const action = year.enabled === false ? 'enable' : 'disable'
    if (confirm(`Are you sure you want to ${action} school year ${year.School_year_start}-${year.School_year_end}?`)) {
      router.put(`/registrar/school-years/${year.id}/toggle`)
    }
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingYear(null)
    setFormData({ School_year_start: '', School_year_end: '', is_active: false })
    setErrors({})
  }

  // Auto-calculate end year when start year changes
  const handleStartYearChange = (e) => {
    const startYear = e.target.value
    const endYear = startYear ? (parseInt(startYear) + 1).toString() : ''
    setFormData({
      ...formData,
      School_year_start: startYear,
      School_year_end: endYear
    })
  }

  // Semester management handlers
  const handleAddSemester = (schoolYear) => {
    setSelectedSchoolYear(schoolYear)
    setEditingSemester(null)
    setShowSemesterForm(true)
  }

  const handleEditSemester = (semester, schoolYear) => {
    setSelectedSchoolYear(schoolYear)
    setEditingSemester(semester)
    setShowSemesterForm(true)
  }

  const handleToggleSemester = (semester) => {
    const action = semester.is_active ? 'deactivate' : 'activate'
    if (confirm(`Are you sure you want to ${action} this semester?`)) {
      router.put(`/registrar/semesters/${semester.id}/toggle`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <RegistrarSidebar />
      <div className="flex-1 flex flex-col">
        <Head title="Registrar • School Years" />

        <header className="bg-white shadow">
          <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
            <Breadcrumb 
              items={[
                { label: 'Dashboard', href: '/registrar' },
                { label: 'School Years', href: '/registrar/school-years', current: true }
              ]} 
            />
            <div className="flex items-center justify-between mt-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">School Years</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Manage academic school years and set active periods
                </p>
                {activeYear && (
                  <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Current: {activeYear.School_year_start}-{activeYear.School_year_end}
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                {/* Enhanced Primary Action Button - HCI Principles 1, 4, 7 */}
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:from-indigo-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
                >
                  <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add School Year
                </button>
                
                {/* Quick Stats - HCI Principle 1: Visibility of system status */}
                <div className="hidden sm:flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>{schoolYears.filter(y => y.is_active).length} Active</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>{schoolYears.filter(y => y.enabled !== false && !y.is_active).length} Enabled</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span>{schoolYears.filter(y => y.enabled === false).length} Disabled</span>
                  </div>
                </div>
              </div>
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

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
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
                placeholder="Search school years..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <p className="text-sm text-gray-600">
              Showing {filteredYears.length} of {schoolYears.length} school years
            </p>
          </div>

          {/* Enhanced School Years Cards - HCI Principles 1, 6, 8: Visibility, Recognition, Aesthetic Design */}
          <div className="space-y-4">
            {filteredYears.map((year) => (
              <div key={year.id} className={`rounded-xl shadow-sm border-2 transition-all duration-200 hover:shadow-md ${
                year.is_active 
                  ? 'border-green-200 bg-green-50/30' 
                  : year.enabled === false
                    ? 'border-red-200 bg-red-50/20 opacity-75'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}>
                <div className="px-6 py-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {year.School_year_start}-{year.School_year_end}
                          </h3>
                          {year.is_active && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 8 8">
                                <circle cx={4} cy={4} r={3} />
                              </svg>
                              Active
                            </span>
                          )}
                          {year.School_year_start === currentYear && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Current Year
                            </span>
                          )}
                        </div>
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Sections:</span>
                            <span className="ml-1">{year.sections_count || 0}</span>
                          </div>
                          <div>
                            <span className="font-medium">Classes:</span>
                            <span className="ml-1">{year.classes_count || 0}</span>
                          </div>
                          <div>
                            <span className="font-medium">Semesters:</span>
                            <span className="ml-1">{year.semesters?.length || 0}</span>
                          </div>
                        </div>
                        
                        {/* Enhanced Semesters Section - HCI Principles 2, 6, 8 */}
                        {year.semesters && year.semesters.length > 0 && (
                          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-sm font-semibold text-gray-900 flex items-center">
                                <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 6v6m-4-6h8m-8 0V9a2 2 0 012-2h4a2 2 0 012 2v2" />
                                </svg>
                                Semesters ({year.semesters.length})
                              </h4>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                              {year.semesters.map((semester) => (
                                <div key={semester.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
                                        semester.is_active 
                                          ? 'bg-green-100 text-green-800 border border-green-200' 
                                          : 'bg-gray-100 text-gray-800 border border-gray-200'
                                      }`}>
                                        {semester.is_active && (
                                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 8 8">
                                            <circle cx={4} cy={4} r={3} />
                                          </svg>
                                        )}
                                        {semester.semester_type}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {/* Edit Semester Button */}
                                      <button
                                        onClick={() => handleEditSemester(semester, year)}
                                        className="inline-flex items-center p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-md transition-colors duration-200"
                                        title="Edit semester details"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                      </button>
                                      
                                      {/* Toggle Semester Status */}
                                      <button
                                        onClick={() => handleToggleSemester(semester)}
                                        className={`inline-flex items-center p-2 rounded-md transition-colors duration-200 ${
                                          semester.is_active 
                                            ? 'text-orange-600 hover:text-orange-900 hover:bg-orange-50' 
                                            : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                                        }`}
                                        title={semester.is_active ? 'Deactivate semester' : 'Activate semester'}
                                      >
                                        {semester.is_active ? (
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
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* No Semesters State - HCI Principle 9 */}
                        {(!year.semesters || year.semesters.length === 0) && (
                          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center">
                              <svg className="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className="text-sm text-blue-800">
                                No semesters configured. Click "Add Semester" to get started.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Properly Arranged Action Buttons - HCI Principles 1, 4, 6, 8 */}
                    <div className="flex flex-col lg:flex-row items-end lg:items-center gap-4 mt-6">
                      {/* Primary Action - Add Semester */}
                      <button
                        onClick={() => handleAddSemester(year)}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 min-w-[140px] justify-center"
                        title="Add new semester to this school year"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Semester
                      </button>
                      
                      {/* Secondary Actions Row */}
                      <div className="flex items-center gap-2">
                        {/* Set Active - Important Action */}
                        {!year.is_active && (
                          <button
                            onClick={() => handleSetActive(year)}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 min-w-[100px] justify-center"
                            title="Set this as the active school year"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Set Active
                          </button>
                        )}
                        
                        {/* Edit - Secondary Action */}
                        <button
                          onClick={() => handleEdit(year)}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                          title="Edit school year details"
                        >
                          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        
                        {/* Enable/Disable Status - Tertiary Action */}
                        <button
                          onClick={() => handleDisable(year)}
                          disabled={year.is_active && year.enabled !== false}
                          className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                            year.is_active && year.enabled !== false
                              ? 'text-gray-500 bg-gray-100 border border-gray-200 cursor-not-allowed' 
                              : year.enabled === false
                                ? 'text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                                : 'text-orange-700 bg-orange-50 border border-orange-200 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500'
                          }`}
                          title={
                            year.is_active && year.enabled !== false
                              ? 'Cannot disable active school year' 
                              : year.enabled === false
                                ? 'Enable this school year'
                                : 'Disable this school year'
                          }
                        >
                          {year.is_active && year.enabled !== false ? (
                            <>
                              <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Active
                            </>
                          ) : year.enabled === false ? (
                            <>
                              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Enable
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                              </svg>
                              Disable
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredYears.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 6v6m-4-6h8m-8 0V9a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No school years found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? `No school years match "${searchTerm}"` : 'Get started by creating a new school year.'}
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Modal Form - HCI Principle 8: Aesthetic and minimalist design */}
      {showForm && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingYear ? 'Edit School Year' : 'Add New School Year'}
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
                <label htmlFor="start_year" className="block text-sm font-medium text-gray-700">
                  Start Year *
                </label>
                <input
                  type="number"
                  id="start_year"
                  name="School_year_start"
                  min={currentYear - 5}
                  max={currentYear + 10}
                  value={formData.School_year_start}
                  onChange={handleStartYearChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder={currentYear.toString()}
                  required
                />
                {errors.School_year_start && (
                  <p className="mt-1 text-sm text-red-600">{errors.School_year_start}</p>
                )}
              </div>

              <div>
                <label htmlFor="end_year" className="block text-sm font-medium text-gray-700">
                  End Year *
                </label>
                <input
                  type="number"
                  id="end_year"
                  name="School_year_end"
                  value={formData.School_year_end}
                  readOnly
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm sm:text-sm"
                  placeholder="Auto-calculated"
                />
                <p className="mt-1 text-xs text-gray-500">
                  End year is automatically calculated as start year + 1
                </p>
                {errors.School_year_end && (
                  <p className="mt-1 text-sm text-red-600">{errors.School_year_end}</p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  Set as active school year
                </label>
              </div>
              
              {formData.is_active && activeYear && !editingYear && (
                <div className="rounded-md bg-yellow-50 p-4">
                  <div className="flex">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-800">
                        This will deactivate the current active year ({activeYear.School_year_start}-{activeYear.School_year_end})
                      </p>
                    </div>
                  </div>
                </div>
              )}

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
                  {processing ? 'Saving...' : (editingYear ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Semester Form Modal */}
      {showSemesterForm && (
        <SemesterForm
          semester={editingSemester}
          schoolYear={selectedSchoolYear}
          onClose={() => setShowSemesterForm(false)}
        />
      )}

    </div>
  )
}
