import { useState, useMemo, useEffect } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import Breadcrumb from './Components/Breadcrumb'
import RegistrarLayout from './Layout'
import SubjectForm from './Components/SubjectForm'
import Swal from 'sweetalert2'

// Main Subjects Component

export default function Subjects({ subjects = [], strands = [], semesters = [], curriculums = [], activeSchoolYear, activeSemester, hasActiveStrands = true, flash = {} }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [subjectModal, setSubjectModal] = useState({ open: false, subject: null })
  const [archivingSubject, setArchivingSubject] = useState(null)
  const displaySubjects = subjects || []

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

  const sortedGrades = useMemo(() => {
    const gradeKeys = Object.keys(groupedByYear)
    const numeric = gradeKeys.filter((grade) => !Number.isNaN(parseInt(grade)))
    const nonNumeric = gradeKeys.filter((grade) => Number.isNaN(parseInt(grade)))
    numeric.sort((a, b) => parseInt(a) - parseInt(b))
    nonNumeric.sort()
    return [...numeric, ...nonNumeric]
  }, [groupedByYear])

  const getGradeSubjectTotal = (grade) => {
    const gradeGroup = groupedByYear[grade]
    if (!gradeGroup) return 0
    return Object.values(gradeGroup).reduce((strandSum, strand) => {
      return strandSum + Object.values(strand.semesters).reduce((semesterSum, list) => semesterSum + list.length, 0)
    }, 0)
  }

  const [activeGrade, setActiveGrade] = useState(() => sortedGrades[0] || null)
  const [activeStrand, setActiveStrand] = useState(() => {
    const firstGrade = sortedGrades[0]
    if (!firstGrade) return null
    const strandKeys = Object.keys(groupedByYear[firstGrade] || {})
    return strandKeys[0] || null
  })

  useEffect(() => {
    if (sortedGrades.length === 0) {
      setActiveGrade(null)
      setActiveStrand(null)
      return
    }
    if (!activeGrade || !sortedGrades.includes(activeGrade)) {
      setActiveGrade(sortedGrades[0])
    }
  }, [sortedGrades, activeGrade])

  useEffect(() => {
    if (!activeGrade) {
      setActiveStrand(null)
      return
    }
    const strandKeys = Object.keys(groupedByYear[activeGrade] || {})
    if (strandKeys.length === 0) {
      setActiveStrand(null)
      return
    }
    if (!activeStrand || !strandKeys.includes(activeStrand)) {
      setActiveStrand(strandKeys[0])
    }
  }, [activeGrade, groupedByYear, activeStrand])

  const strandEntries = useMemo(() => {
    if (!activeGrade) return []
    return Object.entries(groupedByYear[activeGrade] || {})
  }, [activeGrade, groupedByYear])

  const activeStrandData = activeGrade ? groupedByYear[activeGrade]?.[activeStrand] : null

  const getTotalSubjectsForStrand = (group) => {
    if (!group) return 0
    return Object.values(group.semesters).reduce((count, list) => count + list.length, 0)
  }

  const semesterLabel = (key) => {
    if (key === '1' || key === 1) return '1st Semester'
    if (key === '2' || key === 2) return '2nd Semester'
    if (!key || key === 'Unknown Semester') return 'Unassigned Semester'
    return key
  }

  const gradeLabel = (grade) => {
    if (!grade || grade === 'Unknown Year') return 'Unassigned'
    if (Number.isNaN(parseInt(grade))) return grade
    return `Grade ${grade}`
  }

  const openEditSubject = (subject) => {
    setSubjectModal({ open: true, subject })
  }

  const closeSubjectModal = () => setSubjectModal({ open: false, subject: null })

  const refreshSubjects = () => {
    router.reload({ preserveScroll: true, only: ['subjects'] })
  }

  const handleArchiveSubject = (subject) => {
    const subjectId = subject.Id || subject.id
    if (!subjectId) return

    Swal.fire({
      title: 'Archive Subject?',
      text: `Are you sure you want to archive "${subject.Subject_name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Archive'
    }).then((result) => {
      if (!result.isConfirmed) return
      setArchivingSubject(subjectId)
      router.delete(`/registrar/subjects/${subjectId}`, {
        preserveScroll: true,
        onSuccess: () => {
          setArchivingSubject(null)
          Swal.fire({ title: 'Archived!', icon: 'success', timer: 1500, showConfirmButton: false })
          refreshSubjects()
        },
        onError: () => {
          setArchivingSubject(null)
          Swal.fire({ title: 'Archive failed', text: 'Unable to archive this subject.', icon: 'error' })
        }
      })
    })
  }

  const breadcrumbItems = [
    { href: '/registrar', label: 'Dashboard' },
    { href: '/registrar/subjects', label: 'Subjects' }
  ]

  return (
    <RegistrarLayout>
      <Head title="Subjects" />
      <Breadcrumb
        links={[
          { label: 'Dashboard', href: '/registrar/dashboard' },
          { label: 'Subjects', href: '/registrar/subjects' }
        ]}
      />

      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Subjects</h1>
              <p className="mt-1 text-sm text-gray-500">Manage subjects for the current school year</p>
            </div>
            <Link
              href="/registrar"
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
          </div>

          {flash.success && (
            <div className="mb-6 rounded-md bg-green-50 p-4 text-sm text-green-800">{flash.success}</div>
          )}
          {flash.error && (
            <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-800">{flash.error}</div>
          )}

          {!hasActiveStrands && (
            <div className="mb-6 rounded-md bg-yellow-50 border border-yellow-200 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-semibold text-yellow-800">No Active Strands</h3>
                  <p className="mt-1 text-sm text-yellow-700">
                    You cannot add subjects until at least one strand is activated for the current semester. Please activate a strand first.
                  </p>
                </div>
              </div>
            </div>
          )}

          {displaySubjects.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <p className="text-gray-500 mt-4">No subjects added yet</p>
              <p className="text-xs text-gray-400 mt-1">Use the Curriculums page to start adding strands and subjects.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="px-6 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Subjects Overview</p>
                    <h2 className="text-xl font-semibold text-gray-900">Subjects by Grade Level</h2>
                    <p className="text-sm text-gray-500 mt-1">Showing {filteredSubjects.length} of {displaySubjects.length} subjects</p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Search subjects..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          <svg
                            className="h-4 w-4 text-gray-400 hover:text-gray-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                    <Link
                      href="/registrar/curriculums"
                      className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
                    >
                      Manage Subjects
                    </Link>
                  </div>
                </div>
                <div className="px-6 pb-6">
                  {sortedGrades.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No grades available.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {sortedGrades.map((grade) => (
                        <button
                          key={grade}
                          type="button"
                          onClick={() => setActiveGrade(grade)}
                          className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
                            activeGrade === grade
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-gray-100 text-gray-600 border-transparent hover:border-indigo-200 hover:bg-white'
                          }`}
                        >
                          {gradeLabel(grade)}
                          <span className="ml-1 inline-flex items-center justify-center text-[11px] font-semibold bg-white/50 text-gray-700 rounded-full px-1.5">
                            {getGradeSubjectTotal(grade)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="text-[11px] text-gray-400 mt-2">Select a grade level to view its strands and subjects.</p>
                  {activeGrade && strandEntries.length > 1 && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Strands in {gradeLabel(activeGrade)}</p>
                      <div className="flex flex-wrap gap-2">
                        {strandEntries.map(([strandName, strandData]) => (
                          <button
                            key={strandName}
                            type="button"
                            onClick={() => setActiveStrand(strandName)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium border transition ${
                              activeStrand === strandName
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-200'
                            }`}
                          >
                            <span>{strandName}</span>
                            <span className="ml-2 text-xs text-gray-500">{getTotalSubjectsForStrand(strandData)} subj.</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                {!activeGrade || !activeStrandData ? (
                  <div className="px-6 py-12 text-center text-sm text-gray-500">
                    {sortedGrades.length === 0
                      ? 'No subjects available yet.'
                      : 'Select a grade and strand to view its subjects.'}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    <div className="px-6 py-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold">{gradeLabel(activeGrade)}</p>
                        <h3 className="text-lg font-semibold text-gray-900">{activeStrand}</h3>
                        <p className="text-sm text-gray-500">
                          {getTotalSubjectsForStrand(activeStrandData)} subject{getTotalSubjectsForStrand(activeStrandData) === 1 ? '' : 's'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                          <svg
                            className="w-4 h-4 mr-1.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                            />
                          </svg>
                        </span>
                        <Link
                          href="/registrar/curriculums"
                          className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-medium"
                        >
                          + Add via Curriculums
                        </Link>
                      </div>
                    </div>

                    {Object.entries(activeStrandData.semesters)
                      .sort(([a], [b]) => {
                        const order = { '1': 1, '2': 2, Summer: 3 }
                        return (order[a] || 99) - (order[b] || 99)
                      })
                      .map(([semesterKey, subjectList]) => (
                        <div key={`${activeStrand}-${semesterKey}`} className="px-6 py-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  semesterKey === '1'
                                    ? 'bg-blue-100 text-blue-700'
                                    : semesterKey === '2'
                                      ? 'bg-purple-100 text-purple-700'
                                      : 'bg-amber-100 text-amber-700'
                                }`}
                              >
                                {semesterLabel(semesterKey)}
                              </span>
                              <span className="text-sm text-gray-500">
                                {subjectList.length} subject{subjectList.length === 1 ? '' : 's'}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {subjectList.map((subject) => (
                              <div
                                key={subject.Id || subject.id}
                                className={`flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-4 py-3 border border-gray-200 rounded-lg ${
                                  subject.deleted_at ? 'bg-gray-50' : 'bg-white'
                                }`}
                              >
                                <div className="flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-semibold text-gray-900">{subject.Subject_name}</p>
                                    <span
                                      className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ${
                                        subject.deleted_at ? 'bg-gray-200 text-gray-700' : 'bg-green-100 text-green-700'
                                      }`}
                                    >
                                      {subject.deleted_at ? 'Archived' : 'Active'}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500 font-mono mt-0.5">{subject.Subject_code}</div>
                                  {subject.curriculum && (
                                    <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                                      <svg
                                        className="w-3 h-3"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M12 6v12m-6-6h12"
                                        />
                                      </svg>
                                      {subject.curriculum.curriculum_code || subject.curriculum.name}
                                    </div>
                                  )}
                                  {(subject.PREREQUISITES || subject['CO-REQUISITES']) && (
                                    <div className="mt-2 flex flex-wrap gap-4 text-[11px] text-gray-600">
                                      {subject.PREREQUISITES && (
                                        <span>
                                          <span className="font-semibold text-gray-700">Pre:</span> {subject.PREREQUISITES}
                                        </span>
                                      )}
                                      {subject['CO-REQUISITES'] && (
                                        <span>
                                          <span className="font-semibold text-gray-700">Co:</span> {subject['CO-REQUISITES']}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => openEditSubject(subject)}
                                    className="inline-flex items-center gap-1 rounded-md border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                      />
                                    </svg>
                                    Edit
                                  </button>
                                  {!subject.deleted_at && (
                                    <button
                                      type="button"
                                      onClick={() => handleArchiveSubject(subject)}
                                      disabled={archivingSubject === (subject.Id || subject.id)}
                                      className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                                    >
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                      </svg>
                                      {archivingSubject === (subject.Id || subject.id) ? 'Archiving…' : 'Archive'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {subjectModal.open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <SubjectForm
              subject={subjectModal.subject}
              strands={strands}
              semesters={semesters}
              activeSemester={activeSemester}
              curriculums={curriculums}
              onClose={closeSubjectModal}
              onSuccess={() => {
                closeSubjectModal()
                refreshSubjects()
              }}
            />
          </div>
        </div>
      )}
    </RegistrarLayout>
  )
}
