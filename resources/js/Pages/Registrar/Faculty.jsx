import React, { useState } from 'react'
import { Head, router } from '@inertiajs/react'
import Breadcrumb from './Components/Breadcrumb'
import RegistrarLayout from './Layout'

export default function Faculty({ faculty = [], strands = [], flash = {} }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingFaculty, setEditingFaculty] = useState(null)
  const [viewMode, setViewMode] = useState('grouped') // 'grouped' or 'list'
  const [selectedStrand, setSelectedStrand] = useState('all')
  const [formData, setFormData] = useState({
    FirstName: '',
    MiddleName: '',
    LastName: '',
    email: '',
    assigned_strand_id: ''
  })
  const [processing, setProcessing] = useState(false)
  const [coordinatorProcessing, setCoordinatorProcessing] = useState(null)
  const [errors, setErrors] = useState({})

  const getAssignedStrand = (member) => member?.assignedStrand ?? member?.assigned_strand ?? null

  // Enhanced filtering with strand support
  const filteredFaculty = faculty.filter(member => {
    const matchesSearch = member.FirstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.LastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStrand = selectedStrand === 'all' || 
      (selectedStrand === 'unassigned' && !member.assigned_strand_id) ||
      (member.assigned_strand_id && member.assigned_strand_id.toString() === selectedStrand)
    
    return matchesSearch && matchesStrand
  })

  // Group faculty by strands
  const groupedFaculty = React.useMemo(() => {
    const groups = {
      unassigned: []
    }
    
    // Initialize groups for each strand
    strands.forEach(strand => {
      groups[strand.id] = []
    })
    
    // Group faculty members
    filteredFaculty.forEach(member => {
      if (member.assigned_strand_id) {
        if (groups[member.assigned_strand_id]) {
          groups[member.assigned_strand_id].push(member)
        }
      } else {
        groups.unassigned.push(member)
      }
    })
    
    return groups
  }, [filteredFaculty, strands])

  const handleFormSubmit = (e) => {
    e.preventDefault()
    setProcessing(true)
    setErrors({})

    const url = editingFaculty 
      ? `/registrar/faculty/${editingFaculty.id}` 
      : '/registrar/faculty'
    
    const method = editingFaculty ? 'put' : 'post'

    router[method](url, formData, {
      onSuccess: () => {
        resetForm()
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

  const handleEdit = (member) => {
    setEditingFaculty(member)
    setFormData({
      FirstName: member.FirstName || '',
      MiddleName: member.MiddleName || '',
      LastName: member.LastName || '',
      email: member.email || '',
      assigned_strand_id: member.assigned_strand_id || ''
    })
    setShowForm(true)
  }

  const handleDelete = (member) => {
    if (confirm(`Are you sure you want to delete ${member.FirstName} ${member.LastName}?`)) {
      router.delete(`/registrar/faculty/${member.id}`)
    }
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingFaculty(null)
    setFormData({
      FirstName: '',
      MiddleName: '',
      LastName: '',
      email: '',
      assigned_strand_id: ''
    })
    setErrors({})
  }

  const handleCoordinatorToggle = (member) => {
    const action = member.is_coordinator ? 'Remove' : 'Grant';
    const newStatus = !member.is_coordinator;
    
    if (confirm(`${action} coordinator privileges for ${member.FirstName} ${member.LastName}?`)) {
      setCoordinatorProcessing(member.id);
      
      router.put(`/registrar/faculty/${member.id}/coordinator/toggle`, {
        is_coordinator: newStatus
      }, {
        onSuccess: () => {
          setCoordinatorProcessing(null);
          // Reload the page data to refresh the faculty list with updated coordinator status
          router.reload();
        },
        onError: () => {
          setCoordinatorProcessing(null);
        },
        onFinish: () => {
          setCoordinatorProcessing(null);
        }
      })
    }
  }

  return (
    <RegistrarLayout>
      <Head title="Faculty Management" />

      <div className="flex-1 flex flex-col">
        {/* Flash Messages - HCI Principle 1: Visibility of system status */}
        {flash.success && (
          <div className="bg-green-50 border border-green-200 p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="ml-3 text-sm font-medium text-green-800">{flash.success}</p>
            </div>
          </div>
        )}

        {flash.error && (
          <div className="bg-red-50 border border-red-200 p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="ml-3 text-sm font-medium text-red-800">{flash.error}</p>
            </div>
          </div>
        )}

        <main className="mx-auto max-w-7xl w-full px-3 py-6 sm:px-6 lg:px-8">
          {/* Header - HCI Principle 6: Recognition rather than recall */}
          <div className="mb-8">
            <Breadcrumb 
              items={[
                { label: 'Dashboard', href: '/registrar' },
                { label: 'Faculty Management', href: '/registrar/faculty', current: true }
              ]} 
            />
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mt-4">
              <div className="w-full md:w-auto">
                <h1 className="text-2xl font-bold text-gray-900">Faculty Management</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Manage faculty members and their information
                </p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full md:w-auto"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Faculty
              </button>
            </div>
          </div>

          {/* Enhanced Search and Controls */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="relative w-full lg:max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search faculty members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full lg:w-auto">
                {/* View Mode Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">View:</span>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('grouped')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-200 ${
                        viewMode === 'grouped' 
                          ? 'bg-white text-gray-900 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      By Strand
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-200 ${
                        viewMode === 'list' 
                          ? 'bg-white text-gray-900 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                      List
                    </button>
                  </div>
                </div>

                <div className="text-sm text-gray-500 text-center sm:text-left">
                  Showing {filteredFaculty.length} of {faculty.length} faculty members
                </div>
              </div>
            </div>

            {/* Strand Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <span className="text-sm font-medium text-gray-700">Filter by Strand:</span>
              <select
                value={selectedStrand}
                onChange={(e) => setSelectedStrand(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Strands</option>
                <option value="unassigned">Unassigned</option>
                {strands.map((strand) => (
                  <option key={strand.id} value={strand.id.toString()}>
                    {strand.Strand_code} - {strand.Strand_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Conditional View Rendering */}
          {viewMode === 'grouped' ? (
            /* Grouped by Strand View */
            <div className="space-y-6">
              {/* Active Strands */}
              {strands.map((strand) => {
                const strandFaculty = groupedFaculty[strand.id] || []
                if (strandFaculty.length === 0) return null
                
                return (
                  <div key={strand.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {/* Strand Header */}
                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-4 py-4 sm:px-6 border-b border-gray-200">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-lg">
                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {strand.Strand_code} - {strand.Strand_name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {strandFaculty.length} faculty member{strandFaculty.length !== 1 ? 's' : ''} assigned
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            Active Strand
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Faculty Members in this Strand */}
                    <div className="divide-y divide-gray-200">
                      {strandFaculty.map((member) => (
                        <div key={member.id} className="group hover:bg-gray-50 transition-colors duration-150">
                          <div className="px-4 py-4 sm:px-6">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                              {/* Faculty Info */}
                              <div className="flex items-center space-x-4 flex-1 min-w-0">
                                <div className="relative flex-shrink-0">
                                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center ring-2 ring-white shadow-sm">
                                    <span className="text-sm font-semibold text-indigo-700">
                                      {member.FirstName?.charAt(0)}{member.LastName?.charAt(0)}
                                    </span>
                                  </div>
                                  <div
                                    className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 border-2 border-white rounded-full ${member.is_online ? 'bg-green-400' : 'bg-gray-300'}`}
                                  ></div>
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-3">
                                    <h4 className="text-sm font-semibold text-gray-900 truncate">
                                      {member.FirstName} {member.MiddleName ? member.MiddleName + ' ' : ''}{member.LastName}
                                    </h4>
                                    <span
                                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${member.is_online ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
                                    >
                                      <svg className="w-2 h-2 mr-1" fill="currentColor" viewBox="0 0 8 8">
                                        <circle cx={4} cy={4} r={3} />
                                      </svg>
                                      {member.is_online ? 'Active' : 'Offline'}
                                    </span>
                                    {member.is_coordinator && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        <svg className="w-2 h-2 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        Coordinator
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="mt-1 flex items-center text-sm text-gray-500">
                                    <svg className="w-3 h-3 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <span className="truncate max-w-xs" title={member.email}>{member.email}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex flex-wrap items-center gap-2">
                                {/* Coordinator Toggle Button */}
                                <button
                                  onClick={() => handleCoordinatorToggle(member)}
                                  disabled={coordinatorProcessing === member.id}
                                  className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
                                    coordinatorProcessing === member.id
                                      ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                      : member.is_coordinator 
                                        ? 'text-white bg-blue-600 hover:bg-blue-700 shadow-sm' 
                                        : 'text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200'
                                  }`}
                                  title={
                                    coordinatorProcessing === member.id 
                                      ? 'Processing...' 
                                      : member.is_coordinator 
                                        ? 'Remove coordinator privileges' 
                                        : 'Grant coordinator privileges'
                                  }
                                >
                                  {coordinatorProcessing === member.id ? (
                                    <>
                                      <svg className="w-3 h-3 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                      Processing...
                                    </>
                                  ) : (
                                    <>
                                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                      </svg>
                                      {member.is_coordinator ? 'Faculty' : 'Make Coordinator'}
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => handleEdit(member)}
                                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-150"
                                  title="Edit faculty member"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDelete(member)}
                                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-150"
                                  title="Delete faculty member"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}

              {/* Unassigned Faculty */}
              {groupedFaculty.unassigned.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  {/* Unassigned Header */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-4 sm:px-6 border-b border-gray-200">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Unassigned Faculty</h3>
                          <p className="text-sm text-gray-600">
                            {groupedFaculty.unassigned.length} faculty member{groupedFaculty.unassigned.length !== 1 ? 's' : ''} without strand assignment
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Needs Assignment
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Unassigned Faculty Members */}
                  <div className="divide-y divide-gray-200">
                    {groupedFaculty.unassigned.map((member) => (
                      <div key={member.id} className="group hover:bg-gray-50 transition-colors duration-150">
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            {/* Faculty Info */}
                            <div className="flex items-center space-x-4 flex-1 min-w-0">
                              <div className="relative flex-shrink-0">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ring-2 ring-white shadow-sm">
                                  <span className="text-sm font-semibold text-gray-700">
                                    {member.FirstName?.charAt(0)}{member.LastName?.charAt(0)}
                                  </span>
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-yellow-400 border-2 border-white rounded-full"></div>
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-3">
                                  <h4 className="text-sm font-semibold text-gray-900 truncate">
                                    {member.FirstName} {member.MiddleName ? member.MiddleName + ' ' : ''}{member.LastName}
                                  </h4>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    <svg className="w-2 h-2 mr-1" fill="currentColor" viewBox="0 0 8 8">
                                      <circle cx={4} cy={4} r={3} />
                                    </svg>
                                    Unassigned
                                  </span>
                                  {member.is_coordinator && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      <svg className="w-2 h-2 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                      </svg>
                                      Coordinator
                                    </span>
                                  )}
                                </div>
                                
                                <div className="mt-1 flex items-center text-sm text-gray-500">
                                  <svg className="w-3 h-3 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  <span className="truncate max-w-xs" title={member.email}>{member.email}</span>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Coordinator Toggle Button */}
                              <button
                                onClick={() => handleCoordinatorToggle(member)}
                                disabled={coordinatorProcessing === member.id}
                                className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
                                  coordinatorProcessing === member.id
                                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                    : member.is_coordinator 
                                      ? 'text-white bg-blue-600 hover:bg-blue-700 shadow-sm' 
                                      : 'text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200'
                                }`}
                                title={
                                  coordinatorProcessing === member.id 
                                    ? 'Processing...' 
                                    : member.is_coordinator 
                                      ? 'Remove coordinator privileges' 
                                      : 'Grant coordinator privileges'
                                }
                              >
                                {coordinatorProcessing === member.id ? (
                                  <>
                                    <svg className="w-3 h-3 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    {member.is_coordinator ? 'Faculty' : 'Make Coordinator'}
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleEdit(member)}
                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-150"
                                title="Edit faculty member"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(member)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-150"
                                title="Delete faculty member"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Regular List View */
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* List Header */}
              <div className="bg-gray-50 px-4 py-3 sm:px-6 border-b border-gray-200">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-sm font-medium text-gray-900">Faculty Members</h3>
                  <span className="text-xs text-gray-500">{filteredFaculty.length} members</span>
                </div>
              </div>

              {/* Faculty List Items */}
              <div className="divide-y divide-gray-200">
                {filteredFaculty.map((member) => {
                  const strandInfo = getAssignedStrand(member)

                  return (
                  <div key={member.id} className="group hover:bg-gray-50 transition-colors duration-150">
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        {/* Left Section - Avatar and Info */}
                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                          {/* Avatar with Status */}
                          <div className="relative flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center ring-2 ring-white shadow-sm">
                              <span className="text-sm font-semibold text-indigo-700">
                                {member.FirstName?.charAt(0)}{member.LastName?.charAt(0)}
                              </span>
                            </div>
                            <div
                              className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 border-2 border-white rounded-full ${member.is_online ? 'bg-green-400' : 'bg-gray-300'}`}
                            ></div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3">
                              <h3 className="text-sm font-semibold text-gray-900 truncate">
                                {member.FirstName} {member.MiddleName ? member.MiddleName + ' ' : ''}{member.LastName}
                              </h3>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${member.is_online ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
                              >
                                <svg className="w-2 h-2 mr-1" fill="currentColor" viewBox="0 0 8 8">
                                  <circle cx={4} cy={4} r={3} />
                                </svg>
                                {member.is_online ? 'Active' : 'Offline'}
                              </span>
                            </div>
                            
                            {/* Contact Info and Strand Assignment */}
                            <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center">
                                <svg className="w-3 h-3 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span className="truncate max-w-xs" title={member.email}>{member.email}</span>
                              </div>
                              {strandInfo && (
                                <div className="flex items-center">
                                  <svg className="w-3 h-3 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                  </svg>
                                  <span className="font-medium text-indigo-600">
                                    {strandInfo.Strand_code} - {strandInfo.Strand_name}
                                  </span>
                                </div>
                              )}
                              {!strandInfo && (
                                <div className="flex items-center">
                                  <svg className="w-3 h-3 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                  </svg>
                                  <span className="text-gray-400 italic">No strand assigned</span>
                                </div>
                              )}
                              {member.is_coordinator && (
                                <div className="flex items-center">
                                  <svg className="w-3 h-3 mr-1 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                  </svg>
                                  <span className="font-medium text-blue-600">Coordinator</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right Section - Actions */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Coordinator Toggle Button - More Visible */}
                          <button
                            onClick={() => handleCoordinatorToggle(member)}
                            disabled={coordinatorProcessing === member.id}
                            className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
                              coordinatorProcessing === member.id
                                ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                : member.is_coordinator 
                                  ? 'text-white bg-blue-600 hover:bg-blue-700 shadow-sm' 
                                  : 'text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200'
                            }`}
                            title={
                              coordinatorProcessing === member.id 
                                ? 'Processing...' 
                                : member.is_coordinator 
                                  ? 'Remove coordinator privileges' 
                                  : 'Grant coordinator privileges'
                            }
                          >
                            {coordinatorProcessing === member.id ? (
                              <>
                                <svg className="w-3 h-3 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                {member.is_coordinator ? 'Faculty' : 'Make Coordinator'}
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleEdit(member)}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-150"
                            title="Edit faculty member"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(member)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-150"
                            title="Delete faculty member"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )})}
              </div>
            </div>
          )}

          {/* Empty State - HCI Principle 10: Help and documentation */}
          {filteredFaculty.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No faculty members found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? `No faculty members match "${searchTerm}"` : 'Get started by adding your first faculty member.'}
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Faculty Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 rounded-2xl shadow-2xl border border-gray-100 max-w-lg w-full">
            <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-indigo-500 font-semibold">
                  {editingFaculty ? 'Update Faculty' : 'New Faculty Member'}
                </p>
                <h3 className="text-xl font-bold text-gray-900 mt-1">
                  {editingFaculty ? 'Edit Faculty Member' : 'Add New Faculty Member'}
                </h3>
              </div>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600 rounded-full p-1.5 hover:bg-gray-100 transition"
                aria-label="Close faculty form"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 pt-5">
              <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-3 text-sm text-indigo-800 mb-5">
                Quickly invite new coordinators or faculty members. Emails are sent automatically with their temporary password.
              </div>
            </div>

            <form onSubmit={handleFormSubmit} className="px-6 pb-6 space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="FirstName" className="block text-xs font-semibold text-gray-600 tracking-wide">
                    First Name <span className="text-indigo-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="FirstName"
                    value={formData.FirstName}
                    onChange={(e) => setFormData({...formData, FirstName: e.target.value})}
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:bg-white"
                    required
                  />
                  {errors.FirstName && (
                    <p className="mt-1 text-xs text-red-600">{errors.FirstName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="LastName" className="block text-xs font-semibold text-gray-600 tracking-wide">
                    Last Name <span className="text-indigo-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="LastName"
                    value={formData.LastName}
                    onChange={(e) => setFormData({...formData, LastName: e.target.value})}
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:bg-white"
                    required
                  />
                  {errors.LastName && (
                    <p className="mt-1 text-xs text-red-600">{errors.LastName}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="MiddleName" className="block text-xs font-semibold text-gray-600 tracking-wide">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    id="MiddleName"
                    value={formData.MiddleName}
                    onChange={(e) => setFormData({...formData, MiddleName: e.target.value})}
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:bg-white"
                  />
                  {errors.MiddleName && (
                    <p className="mt-1 text-xs text-red-600">{errors.MiddleName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-gray-600 tracking-wide">
                    Email Address <span className="text-indigo-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:bg-white"
                    required
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="assigned_strand_id" className="block text-xs font-semibold text-gray-600 tracking-wide">
                  Assigned Strand
                </label>
                <div className="mt-1 relative">
                  <select
                    id="assigned_strand_id"
                    value={formData.assigned_strand_id}
                    onChange={(e) => setFormData({...formData, assigned_strand_id: e.target.value})}
                    className="block w-full rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:bg-white appearance-none"
                  >
                    <option value="">Select a strand (optional)</option>
                    {strands.map((strand) => (
                      <option key={strand.id} value={strand.id}>
                        {strand.Strand_code} - {strand.Strand_name}
                      </option>
                    ))}
                  </select>
                  <svg className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.094l3.71-3.864a.75.75 0 011.08 1.04l-4.25 4.43a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </div>
                {errors.assigned_strand_id && (
                  <p className="mt-1 text-xs text-red-600">{errors.assigned_strand_id}</p>
                )}
                <p className="mt-2 text-xs text-gray-500">
                  Assign this faculty member to a specific strand. This is optional and can be changed later.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  * Required fields
                </p>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processing}
                    className="flex-1 sm:flex-none px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {processing ? 'Saving...' : (editingFaculty ? 'Update' : 'Create')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </RegistrarLayout>
  )
}
