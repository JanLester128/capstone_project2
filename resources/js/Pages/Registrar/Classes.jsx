import { useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import RegistrarSidebar from '../Auth/Registrar_sidebar'
import ClassForm from './Components/ClassForm'
import Breadcrumb from './Components/Breadcrumb'

// Function to convert 24-hour time to 12-hour format
const formatTimeTo12Hour = (time24) => {
  if (!time24) return ''
  const [hours, minutes] = time24.split(':')
  const hour = parseInt(hours, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${hour12}:${minutes} ${ampm}`
}

export default function Classes({ 
  classes = [], 
  sections = [], 
  faculty = [], 
  semesters = [], 
  schoolYears = [], 
  subjects = [],
  activeSchoolYear,
  activeSemester,
  flash = {} 
}) {
  const [showForm, setShowForm] = useState(false)
  const [editingClass, setEditingClass] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSemester, setFilterSemester] = useState('')
  const [filterSection, setFilterSection] = useState('')
  const [filterFaculty, setFilterFaculty] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // HCI Principle 6: Recognition rather than recall - Clear breadcrumb navigation
  const breadcrumbItems = [
    { label: 'Dashboard', href: '/registrar' },
    { label: 'Classes', href: '/registrar/classes', current: true }
  ]

  const handleFormClose = () => {
    setShowForm(false)
    setEditingClass(null)
  }

  const handleEdit = (classItem) => {
    setEditingClass(classItem)
    setShowForm(true)
  }

  const handleDelete = (classId) => {
    if (confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
      router.delete(`/registrar/classes/${classId}`)
    }
  }

  const handleToggleStatus = (classId, currentStatus) => {
    const action = currentStatus ? 'deactivate' : 'activate'
    if (confirm(`Are you sure you want to ${action} this class?`)) {
      router.put(`/registrar/classes/${classId}/toggle`)
    }
  }

  // Filter classes based on search and filter criteria
  const filteredClasses = classes.filter(classItem => {
    const matchesSearch = 
      (classItem.section?.section_name || classItem.section?.SectionName)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classItem.faculty?.FirstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classItem.faculty?.LastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classItem.semester?.semester_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classItem.day_of_week?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesSemester = !filterSemester || classItem.Semester_id?.toString() === filterSemester
    const matchesSection = !filterSection || classItem.Section_id?.toString() === filterSection
    const matchesFaculty = !filterFaculty || classItem.faculty_id?.toString() === filterFaculty
    const matchesStatus = !filterStatus || 
      (filterStatus === 'active' && classItem.is_active) ||
      (filterStatus === 'inactive' && !classItem.is_active)

    return matchesSearch && matchesSemester && matchesSection && matchesFaculty && matchesStatus
  })

  // Group classes by section for better organization
  const groupedClasses = filteredClasses.reduce((groups, classItem) => {
    const sectionName = `${classItem.section?.section_name || classItem.section?.SectionName || 'Unknown Section'} - ${classItem.section?.strand?.Strand_name || 'No Strand'}`
    if (!groups[sectionName]) {
      groups[sectionName] = []
    }
    groups[sectionName].push(classItem)
    return groups
  }, {})

  // Sort sections alphabetically and sort classes within each section by time
  const sortedGroupedClasses = Object.keys(groupedClasses)
    .sort()
    .reduce((sorted, sectionName) => {
      sorted[sectionName] = groupedClasses[sectionName].sort((a, b) => {
        // Sort by day of week first, then by start time
        const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        const dayComparison = dayOrder.indexOf(a.day_of_week) - dayOrder.indexOf(b.day_of_week)
        if (dayComparison !== 0) return dayComparison
        return a.start_time?.localeCompare(b.start_time) || 0
      })
      return sorted
    }, {})

  // Statistics for dashboard overview
  const stats = {
    total: classes.length,
    active: classes.filter(c => c.is_active).length,
    inactive: classes.filter(c => !c.is_active).length,
    sections: new Set(classes.map(c => c.Section_id)).size,
    faculty: new Set(classes.map(c => c.faculty_id)).size
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <RegistrarSidebar />
      
      <div className="flex-1 p-6">
        <Head title="Classes Management - ONSTS" />
        
        {/* HCI Principle 1: Visibility of system status - Clear page header */}
        <div className="mb-6">
          <Breadcrumb items={breadcrumbItems} />
          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Classes Management</h1>
              <p className="text-gray-600 mt-1">Manage class schedules and assignments</p>
            </div>
            
            {/* HCI Principle 3: User control and freedom - Quick action button */}
            <button
              onClick={() => setShowForm(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add New Class
            </button>
          </div>
        </div>

        {/* HCI Principle 9: Help users recognize, diagnose, and recover from errors - Flash messages */}
        {flash.success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-green-800 font-medium">{flash.success}</p>
            </div>
          </div>
        )}

        {flash.error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800 font-medium">{flash.error}</p>
            </div>
          </div>
        )}

        {/* HCI Principle 1: Visibility of system status - Statistics cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Classes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Classes</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inactive Classes</p>
                <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sections</p>
                <p className="text-2xl font-bold text-purple-600">{stats.sections}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Faculty</p>
                <p className="text-2xl font-bold text-orange-600">{stats.faculty}</p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* HCI Principle 7: Flexibility and efficiency of use - Search and filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search Classes
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by section, faculty, semester..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Semester Filter */}
            <div>
              <label htmlFor="semester-filter" className="block text-sm font-medium text-gray-700 mb-2">
                Semester
              </label>
              <select
                id="semester-filter"
                value={filterSemester}
                onChange={(e) => setFilterSemester(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Semesters</option>
                {semesters.map(semester => (
                  <option key={semester.id} value={semester.id}>
                    {semester.SemesterName}
                  </option>
                ))}
              </select>
            </div>

            {/* Section Filter */}
            <div>
              <label htmlFor="section-filter" className="block text-sm font-medium text-gray-700 mb-2">
                Section
              </label>
              <select
                id="section-filter"
                value={filterSection}
                onChange={(e) => setFilterSection(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Sections</option>
                {sections.map(section => (
                  <option key={section.id} value={section.id}>
                    {section.SectionName}
                  </option>
                ))}
              </select>
            </div>

            {/* Faculty Filter */}
            <div>
              <label htmlFor="faculty-filter" className="block text-sm font-medium text-gray-700 mb-2">
                Faculty
              </label>
              <select
                id="faculty-filter"
                value={filterFaculty}
                onChange={(e) => setFilterFaculty(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Faculty</option>
                {faculty.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.FirstName} {f.LastName}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status-filter"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* HCI Principle 8: Aesthetic and minimalist design - Clean class listing */}
        <div className="bg-white rounded-lg shadow-sm border">
          {Object.keys(groupedClasses).length === 0 ? (
            <div className="p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || filterSemester || filterSection || filterFaculty || filterStatus
                  ? 'No classes match your current filters.'
                  : 'Get started by creating your first class.'}
              </p>
              {!searchTerm && !filterSemester && !filterSection && !filterFaculty && !filterStatus && (
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  Add First Class
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {Object.entries(sortedGroupedClasses).map(([sectionName, sectionClasses]) => (
                <div key={sectionName} className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {sectionName}
                    <span className="text-sm font-normal text-gray-500">({sectionClasses.length} classes)</span>
                  </h3>

                  {/* List Header */}
                  <div className="flex items-center space-x-4 px-4 py-2 bg-gray-50 rounded-lg mb-3 text-sm font-medium text-gray-700">
                    <div className="flex-1">Subject & Status</div>
                    <div className="text-center min-w-0 w-32">Faculty</div>
                    <div className="text-center min-w-0 w-32">Schedule</div>
                    <div className="w-8"></div> {/* Actions column */}
                  </div>
                  
                  <div className="space-y-3">
                    {sectionClasses.map(classItem => (
                      <div
                        key={classItem.Id}
                        className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-md ${
                          classItem.is_active 
                            ? 'border-green-200 bg-green-50' 
                            : 'border-red-200 bg-red-50'
                        }`}
                      >
                        {/* Class List Item */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 flex-1">
                            {/* Subject & Status */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-gray-900 truncate">
                                  {classItem.subject?.Subject_name || 'Unknown Subject'}
                                </h4>
                                <span className="text-sm text-gray-500">
                                  ({classItem.subject?.Subject_code || 'N/A'})
                                </span>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  classItem.is_active 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {classItem.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">
                                {classItem.semester?.semester_type || 'Unknown Semester'} • 
                                {classItem.schoolYear?.School_year_start}-{classItem.schoolYear?.School_year_end}
                              </p>
                            </div>

                            {/* Faculty */}
                            <div className="text-center min-w-0 w-32">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {classItem.faculty ? 
                                  `${classItem.faculty.FirstName} ${classItem.faculty.LastName}` : 
                                  'Not Assigned'
                                }
                              </p>
                              <p className="text-xs text-gray-500">Faculty</p>
                            </div>

                            {/* Schedule */}
                            <div className="text-center min-w-0 w-32">
                              <p className="text-sm font-medium text-gray-900">
                                {classItem.day_of_week}
                              </p>
                              <p className="text-xs text-gray-600">
                                {formatTimeTo12Hour(classItem.start_time)} - {formatTimeTo12Hour(classItem.endtime)}
                              </p>
                            </div>
                          </div>
                          
                          {/* Actions Dropdown */}
                          <div className="relative group">
                            <button className="p-1 rounded-full hover:bg-gray-200 transition-colors duration-200">
                              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                              </svg>
                            </button>
                            
                            <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                              <button
                                onClick={() => handleEdit(classItem)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit Class
                              </button>
                              
                              <button
                                onClick={() => handleToggleStatus(classItem.Id, classItem.is_active)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                {classItem.is_active ? (
                                  <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Activate
                                  </>
                                )}
                              </button>
                              
                              <div className="border-t my-1"></div>
                              
                              <button
                                onClick={() => handleDelete(classItem.Id)}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete Class
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Class Form Modal */}
        {showForm && (
          <ClassForm
            isOpen={showForm}
            onClose={handleFormClose}
            classData={editingClass}
            sections={sections}
            faculty={faculty}
            semesters={semesters}
            schoolYears={schoolYears}
            subjects={subjects}
            activeSchoolYear={activeSchoolYear}
            activeSemester={activeSemester}
          />
        )}
      </div>
    </div>
  )
}
