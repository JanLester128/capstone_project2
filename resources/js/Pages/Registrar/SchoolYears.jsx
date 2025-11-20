import { useState } from 'react'
import { Head, router } from '@inertiajs/react'
import RegistrarSidebar from '../Auth/Registrar_sidebar'
import Breadcrumb from './Components/Breadcrumb'
import SemesterForm from './Components/SemesterForm'
import EnrollmentControlModal from './Components/EnrollmentControlModal'
import { formatDateMedium } from '../../utils/dateFormatter'

export default function SchoolYears({ schoolYears = [], flash = {} }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingYear, setEditingYear] = useState(null)
  const [showSemesterForm, setShowSemesterForm] = useState(false)
  const [editingSemester, setEditingSemester] = useState(null)
  const [selectedSchoolYear, setSelectedSchoolYear] = useState(null)
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false)
  const [enrollmentSchoolYear, setEnrollmentSchoolYear] = useState(null)
  // Removed viewMode - using list format only
  const [sortBy, setSortBy] = useState('year_desc') // 'year_asc', 'year_desc', 'status'
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [formData, setFormData] = useState({
    School_year_start: '',
    School_year_end: '',
    is_active: false
  })
  const [processing, setProcessing] = useState(false)
  const [errors, setErrors] = useState({})

  // Enhanced filtering and sorting logic
  const filteredAndSortedYears = schoolYears
    .filter(year => {
      const yearString = `${year.School_year_start}-${year.School_year_end}`
      return yearString.includes(searchTerm)
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'year_asc':
          return a.School_year_start - b.School_year_start
        case 'year_desc':
          return b.School_year_start - a.School_year_start
        case 'status':
          if (a.is_active && !b.is_active) return -1
          if (!a.is_active && b.is_active) return 1
          if (a.enabled === false && b.enabled !== false) return 1
          if (a.enabled !== false && b.enabled === false) return -1
          return b.School_year_start - a.School_year_start
        default:
          return b.School_year_start - a.School_year_start
      }
    })

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedYears.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedYears = filteredAndSortedYears.slice(startIndex, startIndex + itemsPerPage)

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

  const handleEnrollmentControl = (year) => {
    setEnrollmentSchoolYear(year)
    setShowEnrollmentModal(true)
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

        <header className="bg-gradient-to-r from-white to-gray-50 shadow-sm border-b border-gray-200">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <Breadcrumb 
              items={[
                { label: 'Dashboard', href: '/registrar' },
                { label: 'School Years', href: '/registrar/school-years', current: true }
              ]} 
            />
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mt-6 gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-lg">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 6v6m-4-6h8m-8 0V9a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">School Years</h1>
                    <p className="text-sm text-gray-600 mt-1">
                      Manage academic school years, semesters, and set active periods
                    </p>
                  </div>
                </div>
                
                {/* Enhanced Active Year Display */}
                {activeYear && (
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-green-800">Active Year:</span>
                      </div>
                      <span className="text-sm font-semibold text-green-900">
                        {activeYear.School_year_start}-{activeYear.School_year_end}
                      </span>
                    </div>
                    
                    {/* Active Semester Display */}
                    {activeYear.semesters?.find(s => s.is_active) && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium text-blue-800">Active Semester:</span>
                        <span className="text-sm font-semibold text-blue-900">
                          {activeYear.semesters.find(s => s.is_active).semester_type}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Enhanced Stats Cards */}
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="flex flex-col items-center p-3 bg-green-50 border border-green-200 rounded-lg min-w-[80px]">
                    <div className="flex items-center gap-1 mb-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs font-medium text-green-700">Active</span>
                    </div>
                    <span className="text-lg font-bold text-green-900">
                      {schoolYears.filter(y => y.is_active).length}
                    </span>
                  </div>
                  
                  <div className="flex flex-col items-center p-3 bg-blue-50 border border-blue-200 rounded-lg min-w-[80px]">
                    <div className="flex items-center gap-1 mb-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-xs font-medium text-blue-700">Enabled</span>
                    </div>
                    <span className="text-lg font-bold text-blue-900">
                      {schoolYears.filter(y => y.enabled !== false && !y.is_active).length}
                    </span>
                  </div>
                  
                  <div className="flex flex-col items-center p-3 bg-red-50 border border-red-200 rounded-lg min-w-[80px]">
                    <div className="flex items-center gap-1 mb-1">
                      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      <span className="text-xs font-medium text-red-700">Disabled</span>
                    </div>
                    <span className="text-lg font-bold text-red-900">
                      {schoolYears.filter(y => y.enabled === false).length}
                    </span>
                  </div>
                </div>
                
                {/* Enhanced Primary Action Button */}
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:from-indigo-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transform transition-all duration-200 hover:scale-105 hover:shadow-xl border border-indigo-500"
                >
                  <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add School Year
                </button>
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
          {/* Enhanced Search, Filter, and View Controls */}
          <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Search Section */}
              <div className="flex-1 max-w-lg">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  Search School Years
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    id="search"
                    type="text"
                    placeholder="Search by year range (e.g., 2024-2025)..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setCurrentPage(1) // Reset to first page when searching
                    }}
                    className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors duration-200"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => {
                        setSearchTerm('')
                        setCurrentPage(1)
                      }}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              
              {/* Controls Section */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Sort Options */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="year_desc">Newest First</option>
                    <option value="year_asc">Oldest First</option>
                    <option value="status">By Status</option>
                  </select>
                </div>

                {/* Items Per Page */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Show:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                    className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                {/* Results Info */}
                <div className="text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg border">
                  <span className="font-medium">
                    {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAndSortedYears.length)}
                  </span>
                  <span className="text-gray-500"> of {filteredAndSortedYears.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* School Years List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      School Year
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Enrollment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statistics
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Semesters
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedYears.map((year) => (
                      <tr key={year.id} className={`hover:bg-gray-50 transition-colors duration-200 ${
                        year.is_active ? 'bg-green-50' : year.enabled === false ? 'bg-red-50 opacity-75' : ''
                      }`}>
                        {/* School Year Column */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`flex items-center justify-center w-10 h-10 rounded-lg mr-3 ${
                              year.is_active 
                                ? 'bg-green-200 text-green-700' 
                                : year.enabled === false
                                  ? 'bg-red-200 text-red-700'
                                  : 'bg-indigo-100 text-indigo-600'
                            }`}>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 6v6m-4-6h8m-8 0V9a2 2 0 012-2h4a2 2 0 012 2v2" />
                              </svg>
                            </div>
                            <div>
                              <div className="text-lg font-semibold text-gray-900">
                                {year.School_year_start}-{year.School_year_end}
                              </div>
                              {year.School_year_start === currentYear && (
                                <div className="text-xs text-blue-600 font-medium">Current Year</div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Status Column */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            {year.is_active && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 8 8">
                                  <circle cx={4} cy={4} r={3} />
                                </svg>
                                Active
                              </span>
                            )}
                            {year.enabled === false && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                <svg className="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                                </svg>
                                Disabled
                              </span>
                            )}
                            {!year.is_active && year.enabled !== false && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                Enabled
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Enrollment Column */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              year.enrollment_open
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : 'bg-red-100 text-red-800 border border-red-200'
                            }`}>
                              <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 8 8">
                                <circle cx={4} cy={4} r={3} />
                              </svg>
                              {year.enrollment_open ? 'Open' : 'Closed'}
                            </span>
                            {year.enrollment_start_date && (
                              <span className="text-xs text-gray-500">
                                From: {formatDateMedium(year.enrollment_start_date)}
                              </span>
                            )}
                            {year.enrollment_end_date && (
                              <span className="text-xs text-gray-500">
                                Until: {formatDateMedium(year.enrollment_end_date)}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Statistics Column */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              <span className="font-medium">{year.sections_count || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                              <span className="font-medium">{year.classes_count || 0}</span>
                            </div>
                          </div>
                        </td>

                        {/* Semesters Column */}
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {year.semesters && year.semesters.length > 0 ? (
                              year.semesters.map((semester) => (
                                <div key={semester.id} className="flex items-center gap-1">
                                  <span
                                    className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                                      semester.is_active 
                                        ? 'bg-green-100 text-green-800 border border-green-200' 
                                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                                    }`}
                                  >
                                    {semester.is_active && (
                                      <svg className="w-2 h-2 mr-1" fill="currentColor" viewBox="0 0 8 8">
                                        <circle cx={4} cy={4} r={3} />
                                      </svg>
                                    )}
                                    {semester.semester_type}
                                  </span>
                                  <button
                                    onClick={() => handleEditSemester(semester, year)}
                                    className="inline-flex items-center p-1 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded transition-colors duration-200"
                                    title="Edit semester"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleToggleSemester(semester)}
                                    className={`inline-flex items-center p-1 rounded transition-colors duration-200 ${
                                      semester.is_active 
                                        ? 'text-orange-600 hover:text-orange-900 hover:bg-orange-50' 
                                        : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                                    }`}
                                    title={semester.is_active ? 'Deactivate semester' : 'Activate semester'}
                                  >
                                    {semester.is_active ? (
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                                      </svg>
                                    ) : (
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                    )}
                                  </button>
                                </div>
                              ))
                            ) : (
                              <span className="text-xs text-gray-500 italic">No semesters</span>
                            )}
                          </div>
                        </td>

                        {/* Actions Column */}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEnrollmentControl(year)}
                              className={`inline-flex items-center px-3 py-1.5 text-xs font-medium border rounded-md transition-colors duration-200 ${
                                year.enrollment_open
                                  ? 'text-green-700 bg-green-50 border-green-200 hover:bg-green-100'
                                  : 'text-orange-700 bg-orange-50 border-orange-200 hover:bg-orange-100'
                              }`}
                              title="Enrollment Control"
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                              </svg>
                              Enroll
                            </button>
                            
                            <button
                              onClick={() => handleAddSemester(year)}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                              title="Add semester"
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              Add
                            </button>
                            
                            {!year.is_active && (
                              <button
                                onClick={() => handleSetActive(year)}
                                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                                title="Set active"
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Activate
                              </button>
                            )}
                            
                            <button
                              onClick={() => handleEdit(year)}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                              title="Edit"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between bg-white px-6 py-4 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center text-sm text-gray-700">
                <span>
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(startIndex + itemsPerPage, filteredAndSortedYears.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredAndSortedYears.length}</span> results
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                          currentPage === pageNum
                            ? 'bg-indigo-600 text-white'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Next
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {filteredAndSortedYears.length === 0 && (
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

      {/* Enrollment Control Modal */}
      {showEnrollmentModal && (
        <EnrollmentControlModal
          schoolYear={enrollmentSchoolYear}
          onClose={() => {
            setShowEnrollmentModal(false)
            setEnrollmentSchoolYear(null)
          }}
        />
      )}

    </div>
  )
}
