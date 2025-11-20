import { useMemo, useState, useRef, useEffect } from 'react'
import { Head, router, useForm, Link } from '@inertiajs/react'
import FacultySidebar from '../Auth/Faculty_sidebar'
import { formatDateMedium, formatDateTimeMedium } from '../../utils/dateFormatter'

const STATUS_META = {
  pre_enrolled: {
    label: 'Awaiting Coordinator',
    badge: 'bg-amber-100 text-amber-800',
    filter: 'Awaiting Coordinator',
  },
  recommended: {
    label: 'Awaiting Registrar',
    badge: 'bg-blue-100 text-blue-800',
    filter: 'Awaiting Registrar',
  },
  enrolled: {
    label: 'Enrolled',
    badge: 'bg-blue-100 text-blue-800',
    filter: 'Enrolled',
  },
  rejected: {
    label: 'Returned / Needs Revision',
    badge: 'bg-red-100 text-red-800',
    filter: 'Returned',
  },
}

const statusStyles = {
  pre_enrolled: STATUS_META.pre_enrolled.badge,
  recommended: STATUS_META.recommended.badge,
  enrolled: STATUS_META.enrolled.badge,
  rejected: STATUS_META.rejected.badge,
  default: 'bg-gray-100 text-gray-800',
}

const formatDate = (value, withTime = false) => {
  return withTime ? formatDateTimeMedium(value) : formatDateMedium(value)
}

const getInitials = (name = '') => {
  if (!name) return '??'
  const parts = name.trim().split(/\s+/)
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')
}

function EnrollmentDetailModal({
  enrollment,
  onClose,
}) {
  if (!enrollment) return null

  const { student } = enrollment

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Enrollment Details</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close details"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 8.586 4.293 2.879A1 1 0 1 0 2.88 4.293L8.586 10l-5.707 5.707a1 1 0 1 0 1.414 1.414L10 11.414l5.707 5.707a1 1 0 0 0 1.414-1.414L11.414 10l5.707-5.707A1 1 0 1 0 15.707 2.88L10 8.586Z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Student Overview */}
          <section className="grid gap-6 md:grid-cols-3">
            <div className="flex items-center gap-4 md:col-span-2">
              <div className="h-14 w-14 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-lg font-semibold">
                {getInitials(student?.name)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{student?.name}</h3>
                <p className="text-sm text-gray-500">{student?.email}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  {student?.grade_level && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1">
                      <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.894 2.553a1 1 0 0 0-1.788 0l-7 14a1 1 0 0 0 .894 1.447h14a1 1 0 0 0 .894-1.447l-7-14Z" />
                      </svg>
                      Grade {student.grade_level}
                    </span>
                  )}
                  {enrollment.school_year?.label && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1">
                      <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6 2a1 1 0 0 0-1 1v1H4a2 2 0 0 0-2 2v1h16V6a2 2 0 0 0-2-2h-1V3a1 1 0 1 0-2 0v1H7V3a1 1 0 0 0-1-1ZM18 9H2v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9ZM7 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0Zm5 0a1 1 0 1 1 2 0 1 1 0 0 1-2 0Z" clipRule="evenodd" />
                      </svg>
                      SY {enrollment.school_year.label}
                    </span>
                  )}
                  {enrollment.semester?.label && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1">
                      <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 2a1 1 0 0 1 .894.553l7 14A1 1 0 0 1 17 18H3a1 1 0 0 1-.894-1.447l7-14A1 1 0 0 1 10 2Z" />
                      </svg>
                      {enrollment.semester.label}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Submission Timeline</h4>
              <dl className="mt-2 space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <dt>Submitted:</dt>
                  <dd className="font-medium text-gray-900">{formatDate(enrollment.submitted_at, true)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Status:</dt>
                  <dd>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyles[enrollment.status] ?? statusStyles.default}`}>
                      {enrollment.status_text}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-gray-400">Processed By</dt>
                  <dd className="mt-0.5">
                    {enrollment.processed_by ? (
                      <div className="text-sm text-gray-700">
                        <div className="font-medium text-gray-900">{enrollment.processed_by.name}</div>
                        <div className="text-xs text-gray-500">{enrollment.processed_by.email}</div>
                        <div className="text-xs text-gray-500 mt-0.5">on {formatDate(enrollment.processed_at, true)}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">Not yet processed</span>
                    )}
                  </dd>
                </div>
              </dl>
              {enrollment.status === 'enrolled' && (
                <div className="mt-4">
                  <a
                    href={`/enrollments/${enrollment.id}/cor`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    View / Print COR
                  </a>
                </div>
              )}
            </div>
          </section>

          {/* Strand Preferences */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900">Strand Preferences</h3>
            {student?.strand_preferences?.length ? (
              <ul className="mt-3 grid gap-3 md:grid-cols-3">
                {student.strand_preferences.map((preference) => (
                  <li key={preference.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                      {preference.label}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {preference.strand?.code ?? ''}
                    </p>
                    <p className="text-sm text-gray-500">
                      {preference.strand?.name ?? 'No strand assigned'}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                No strand preferences were submitted with this enrollment.
              </p>
            )}
          </section>

          {/* Transferee Credited Subjects (inline) */}
          {enrollment.is_transferee && (
            <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-amber-900">Credited Subjects (Transferee)</h3>
                <a
                  href="/faculty/credited-subjects"
                  className="inline-flex items-center rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-medium text-amber-800 shadow-sm hover:bg-amber-50"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View / Edit in Credited Subjects
                </a>
              </div>

              {/* Workflow Steps */}
              <div className="mb-4 p-3 bg-white rounded border border-amber-200">
                <p className="text-xs font-semibold text-amber-900 mb-2 uppercase tracking-wide">Transferee Enrollment Workflow:</p>
                <div className="flex items-center gap-2 text-xs">
                  <div className={`flex items-center gap-1 px-2 py-1 rounded ${enrollment.all_credits_approved ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                    <span>{enrollment.all_credits_approved ? '✓' : '1'}</span>
                    <span>Credit Subject</span>
                  </div>
                  <span className="text-gray-400">→</span>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded ${enrollment.status === 'enrolled' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    <span>{enrollment.status === 'enrolled' ? '✓' : '2'}</span>
                    <span>Enroll</span>
                  </div>
                  <span className="text-gray-400">→</span>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded ${enrollment.can_print_cor ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    <span>{enrollment.can_print_cor ? '✓' : '3'}</span>
                    <span>Print COR</span>
                  </div>
                </div>
              </div>

              {(!enrollment.credited_subjects || enrollment.credited_subjects.length === 0) ? (
                <p className="mt-2 text-sm text-amber-800">No credited subjects yet. Add them in the Credited Subjects page.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {enrollment.credited_subjects.map((c) => {
                    const hasGrades = (c.quarter1 !== null && c.quarter1 !== undefined && c.quarter1 !== '') || 
                                     (c.quarter2 !== null && c.quarter2 !== undefined && c.quarter2 !== '') ||
                                     (c.credited_grade !== null && c.credited_grade !== undefined && c.credited_grade !== '');
                    const isApproved = c.is_approved === true;
                    const isCredited = hasGrades || isApproved;
                    
                    return (
                      <div key={c.id} className="bg-white rounded border border-gray-200 px-4 py-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 text-sm">{c.subject_name}</div>
                            {c.previous_school && (
                              <div className="text-xs text-gray-500 mt-0.5">Prev: {c.previous_school}</div>
                            )}
                          </div>
                          {isCredited && (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 whitespace-nowrap">
                              ✓ Already Credited
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="mt-3 text-xs text-amber-700 font-medium">
                {enrollment.all_credits_approved 
                  ? '✓ All credited subjects are approved. Student can now be enrolled (requires Registrar approval).'
                  : enrollment.has_pending_credits
                    ? '⚠ Cannot enroll yet. Please complete credited subjects and wait for Registrar approval.'
                    : 'Note: Credit Subject FIRST → THEN Enroll (Registrar approval required) → THEN Print COR'}
              </p>
            </section>
          )}

          {/* Documents */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900">Submitted Documents</h3>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <DocumentCard
                title="PSA Birth Certificate"
                url={student?.psa_url}
                placeholder="No PSA birth certificate uploaded."
              />
              <DocumentCard
                title="Report Card"
                url={student?.report_card_url}
                placeholder="No report card uploaded."
              />
            </div>
          </section>

          {['pre_enrolled', 'recommended'].includes(enrollment.status) && (
            <section className="border-t border-gray-200 pt-6">
              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // Open COR page in new tab where assignment will happen
                    window.open(`/enrollments/${enrollment.id}/cor`, '_blank')
                  }}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Enroll
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

function DocumentCard({ title, url, placeholder }) {
  if (!url) {
    return (
      <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 text-center">
        <svg className="h-8 w-8 text-gray-300" viewBox="0 0 24 24" stroke="currentColor" fill="none">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z" />
        </svg>
        <p className="mt-2 text-sm text-gray-500">{placeholder}</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-4 py-2">
        <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
      </div>
      <div className="flex flex-col gap-3 p-4">
        <div className="h-48 w-full overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
          <img
            src={url}
            alt={title}
            className="h-full w-full object-contain"
          />
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          View Full Document
        </a>
      </div>
    </div>
  )
}

export default function Enrollments({
  enrollments = [],
  strands = [],
  sections = [],
  user = null,
}) {
  const [processing, setProcessing] = useState(null)
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('') // Search query for LRN or Name
  const [selectedEnrollment, setSelectedEnrollment] = useState(null)
  const [selectedEnrollmentForCor, setSelectedEnrollmentForCor] = useState(null) // For COR viewing
  const [corPanelCollapsed, setCorPanelCollapsed] = useState(true) // Toggle state for COR panel (default: collapsed)
  const [assignmentData, setAssignmentData] = useState({
    assigned_strand_id: '',
    assigned_section_id: '',
  })
  const [assignmentErrors, setAssignmentErrors] = useState({})
  const corIframeRef = useRef(null) // Ref for COR iframe to refresh it when section is selected

  // Listen for refresh messages from COR iframe
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'refreshCorIframe' && selectedEnrollmentForCor && event.data.enrollmentId === selectedEnrollmentForCor.id) {
        if (corIframeRef.current) {
          const url = new URL(corIframeRef.current.src);
          url.searchParams.set('section_id', event.data.sectionId);
          url.searchParams.set('refresh', Date.now().toString());
          corIframeRef.current.src = url.toString();
        }
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [selectedEnrollmentForCor])

  const statusCounts = useMemo(() => {
    return {
      all: enrollments.length,
      pre_enrolled: enrollments.filter((enrollment) => enrollment.status === 'pre_enrolled').length,
      recommended: enrollments.filter((enrollment) => enrollment.status === 'recommended').length,
      enrolled: enrollments.filter((enrollment) => enrollment.status === 'enrolled').length,
      rejected: enrollments.filter((enrollment) => enrollment.status === 'rejected').length,
      pending: enrollments.filter((enrollment) => enrollment.status === 'pre_enrolled').length, // Pending = pre_enrolled
    }
  }, [enrollments])

  const availableSections = useMemo(() => {
    if (!assignmentData.assigned_strand_id || !selectedEnrollment) return []
    return sections.filter((section) =>
      String(section.strand_id) === assignmentData.assigned_strand_id &&
      (selectedEnrollment.school_year?.id ? section.school_year_id === selectedEnrollment.school_year.id : true) &&
      (selectedEnrollment.semester?.id ? section.semester_id === selectedEnrollment.semester.id : true)
    )
  }, [assignmentData.assigned_strand_id, sections, selectedEnrollment])

  const filteredEnrollments = useMemo(() => {
    let filtered = enrollments

    // Filter by status
    if (filter === 'pending') {
      filtered = filtered.filter((enrollment) => enrollment.status === 'pre_enrolled')
    } else if (filter !== 'all') {
      filtered = filtered.filter((enrollment) => enrollment.status === filter)
    }

    // Filter by search query (LRN or Name)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter((enrollment) => {
        const studentName = (enrollment.student?.name || '').toLowerCase()
        const studentLrn = (enrollment.student?.lrn || '').toLowerCase()
        const studentEmail = (enrollment.student?.email || '').toLowerCase()
        return studentName.includes(query) || studentLrn.includes(query) || studentEmail.includes(query)
      })
    }

    return filtered
  }, [enrollments, filter, searchQuery])

  const currentFilterLabel = useMemo(() => {
    if (filter === 'all') return 'All'
    if (filter === 'pending') return 'Pending'
    return STATUS_META[filter]?.filter ?? STATUS_META[filter]?.label ?? filter.replace(/_/g, ' ')
  }, [filter])

  const openEnrollment = (enrollment) => {
    setSelectedEnrollment(enrollment)
    setAssignmentErrors({})

    const defaultStrandId =
      enrollment.assigned_strand?.id ??
      enrollment.student?.strand_preferences?.[0]?.strand?.id ??
      ''

    setAssignmentData({
      assigned_strand_id: defaultStrandId ? String(defaultStrandId) : '',
      assigned_section_id: enrollment.assigned_section?.id ? String(enrollment.assigned_section.id) : '',
    })
  }

  const openReviewModal = (enrollment) => {
    setSelectedEnrollment(enrollment)
    setAssignmentErrors({})

    const defaultStrandId =
      enrollment.assigned_strand?.id ??
      enrollment.student?.strand_preferences?.[0]?.strand?.id ??
      ''

    setAssignmentData({
      assigned_strand_id: defaultStrandId ? String(defaultStrandId) : '',
      assigned_section_id: '',
    })
  }

  const handleApprovalSubmit = () => {
    if (!selectedEnrollment) return

    if (!assignmentData.assigned_strand_id || !assignmentData.assigned_section_id) {
      setAssignmentErrors({
        general: 'Please choose both strand and section before approving.',
      })
      return
    }

    setProcessing(selectedEnrollment.id)
    router.put(
      `/faculty/enrollments/${selectedEnrollment.id}/status`,
      {
        status: 'enrolled',
        assigned_strand_id: assignmentData.assigned_strand_id,
        assigned_section_id: assignmentData.assigned_section_id,
      },
      {
        onError: (errors) => {
          setAssignmentErrors(errors)
        },
        onSuccess: () => {
          // Close modal and clear form
          setSelectedEnrollment(null)
          setAssignmentErrors({})
          setAssignmentData({ assigned_strand_id: '', assigned_section_id: '' })
        },
        onFinish: () => {
          setProcessing(null)
        },
      }
    )
  }

  const handleStatusUpdate = (enrollmentId, status) => {
    setProcessing(enrollmentId)
    router.put(`/faculty/enrollments/${enrollmentId}/status`, { status }, {
      onFinish: () => setProcessing(null),
      onError: (errors) => console.error('Error updating enrollment:', errors),
    })
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <FacultySidebar user={user} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Head title="Student Enrollments - Faculty Coordinator" />

        {/* Header */}
        <header className="border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/faculty/enrollments"
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </Link>
              <h1 className="text-2xl font-semibold text-gray-900">Student Enrollments</h1>
              {corPanelCollapsed && selectedEnrollmentForCor && (
                <button
                  onClick={() => setCorPanelCollapsed(false)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-indigo-500 transition-all"
                  aria-label="Expand COR panel"
                >
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 0 1 1.414 0l5 5a1 1 0 0 1 0 1.414l-5 5a1 1 0 0 1-1.414-1.414L8.586 10 4.293 5.707a1 1 0 0 1 0-1.414Z" clipRule="evenodd" />
                  </svg>
                  Show COR
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1 text-sm text-blue-700">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                Coordinator Mode
              </div>
              <div className="rounded-full bg-gray-100 px-4 py-1 text-sm text-gray-600">
                Total Applications: <span className="font-semibold text-gray-900">{statusCounts.all}</span>
              </div>
              {!corPanelCollapsed && (
                <button
                  onClick={() => setCorPanelCollapsed(true)}
                  className="hidden lg:flex items-center justify-center rounded-full border border-gray-300 h-7 w-7 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-all"
                  aria-label="Collapse COR panel"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Search and Filters */}
        <div className="border-b border-gray-200 bg-white px-6 py-3">
          <div className="flex flex-col gap-3">
            {/* Search Bar */}
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by LRN or Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full rounded-lg border-gray-300 pl-10 pr-3 py-2 text-sm placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'All', count: statusCounts.all },
                { key: 'pending', label: 'Pending', count: statusCounts.pending },
                { key: 'enrolled', label: STATUS_META.enrolled.filter, count: statusCounts.enrolled },
                { key: 'rejected', label: STATUS_META.rejected.filter, count: statusCounts.rejected },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                    filter === tab.key
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content - 2 Column Layout */}
        <main className="flex-1 overflow-hidden flex flex-col lg:flex-row relative">
          {/* Left Column - Student List */}
          <div className={`transition-all duration-300 flex flex-col overflow-hidden ${corPanelCollapsed ? 'w-full' : 'w-full lg:w-1/2'} ${!corPanelCollapsed ? 'border-r border-gray-200' : ''}`}>
            <div className="flex-1 overflow-y-auto p-6">
              {filteredEnrollments.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
                  <svg className="h-14 w-14 text-gray-300" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z" />
                  </svg>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">
                    No {filter === 'all' ? '' : currentFilterLabel + ' '}enrollments found
                  </h3>
                  <p className="mt-2 max-w-md text-sm text-gray-500">
                    {filter === 'all'
                      ? 'There are currently no enrollment applications to review.'
                      : `There are no enrollment applications with a status of "${currentFilterLabel}". Try selecting a different filter.`}
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Student
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                            School Year / Semester
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Strand / Section
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Status
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {filteredEnrollments.map((enrollment) => (
                          <tr
                            key={enrollment.id}
                            onClick={() => {
                              // For all statuses, show COR (COR view has assignment form for non-enrolled)
                              setSelectedEnrollmentForCor(enrollment)
                              setSelectedEnrollment(null) // Clear review modal
                              setCorPanelCollapsed(false) // Expand COR panel when viewing
                            }}
                            className={`cursor-pointer transition-colors ${
                              selectedEnrollmentForCor?.id === enrollment.id
                                ? 'bg-indigo-50 hover:bg-indigo-100'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700 flex-shrink-0">
                                  {getInitials(enrollment.student?.name)}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 truncate">
                                    {enrollment.student?.name}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">
                                    {enrollment.student?.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <div className="font-medium text-gray-900">{enrollment.school_year?.label ?? ''}</div>
                              <div className="text-xs text-gray-500">{enrollment.semester?.label ?? ''}</div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <div className="font-medium text-gray-900">
                                {enrollment.assigned_strand?.code
                                  ? `${enrollment.assigned_strand.code} - ${enrollment.assigned_strand.name}`
                                  : enrollment.student?.strand_preferences?.[0]?.strand?.code
                                  ? `Primary: ${enrollment.student.strand_preferences[0].strand.code}`
                                  : 'Not assigned'}
                              </div>
                              {enrollment.assigned_section && (
                                <div className="text-xs text-gray-500">{enrollment.assigned_section.name}</div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[enrollment.status] ?? statusStyles.default}`}>
                                {enrollment.status_text}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-2">
                                {enrollment.status !== 'enrolled' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      openReviewModal(enrollment)
                                    }}
                                    className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:border-indigo-500 hover:text-indigo-600"
                                  >
                                    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                      <path d="M10 3.5a6.5 6.5 0 0 1 5.184 10.42l1.648 1.647a1 1 0 0 1-1.414 1.415l-1.648-1.648A6.5 6.5 0 1 1 10 3.5Zm0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z" />
                                    </svg>
                                    Review
                                  </button>
                                )}
                                {enrollment.status === 'enrolled' ? (
                                  <Link
                                    href={`/faculty/coordinator-students/${enrollment.student_personal_info_id || enrollment.student?.id}/enrollments`}
                                    className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-white shadow-sm bg-blue-600 hover:bg-blue-500"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                      <path d="M4 4a2 2 0 0 1 2-2h6l4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4Z" />
                                    </svg>
                                    View
                                  </Link>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedEnrollmentForCor(enrollment)
                                      setSelectedEnrollment(null)
                                      setCorPanelCollapsed(false)
                                    }}
                                    className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-white shadow-sm bg-indigo-600 hover:bg-indigo-500"
                                  >
                                    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                      <path d="M4 4a2 2 0 0 1 2-2h6l4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4Z" />
                                    </svg>
                                    Enroll
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - COR Preview */}
          {!corPanelCollapsed && (
            <div className="w-full lg:w-7/12 flex flex-col overflow-hidden bg-gray-100" style={{ maxHeight: 'calc(100vh - 112px)' }}>
              {selectedEnrollmentForCor ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCorPanelCollapsed(true)}
                        className="lg:hidden rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                        aria-label="Collapse COR panel"
                      >
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M15.707 15.707a1 1 0 0 1-1.414 0l-5-5a1 1 0 0 1 0-1.414l5-5a1 1 0 1 1 1.414 1.414L11.414 10l4.293 4.293a1 1 0 0 1 0 1.414Z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <div>
                        <h2 className="text-sm font-semibold text-gray-900">Certificate of Registration</h2>
                        <p className="text-xs text-gray-500 mt-0.5">{selectedEnrollmentForCor.student?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={`/enrollments/${selectedEnrollmentForCor.id}/cor`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-500"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M4 4a2 2 0 0 1 2-2h6l4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4Z" />
                        </svg>
                        Open in New Tab
                      </a>
                      <button
                        onClick={() => setSelectedEnrollmentForCor(null)}
                        className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                        aria-label="Close COR"
                      >
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 8.586 4.293 2.879A1 1 0 1 0 2.88 4.293L8.586 10l-5.707 5.707a1 1 0 1 0 1.414 1.414L10 11.414l5.707 5.707a1 1 0 0 0 1.414-1.414L11.414 10l5.707-5.707A1 1 0 1 0 15.707 2.88L10 8.586Z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                <div className="flex-1 overflow-hidden bg-gray-50" style={{ minHeight: '100%' }}>
                  <iframe
                    ref={corIframeRef}
                    src={`/enrollments/${selectedEnrollmentForCor.id}/cor?iframe=1`}
                    className="w-full h-full border-0"
                    title="Certificate of Registration"
                    style={{ 
                      display: 'block',
                      width: '100%',
                      height: '100%'
                    }}
                    scrolling="yes"
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-12">
                <div className="text-center">
                  <svg className="mx-auto h-16 w-16 text-gray-300" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z" />
                  </svg>
                  <h3 className="mt-4 text-base font-semibold text-gray-900">No COR Selected</h3>
                  <p className="mt-2 text-sm text-gray-500 max-w-sm">
                    Select a student from the list on the left to view their Certificate of Registration.
                    <br />
                    <span className="text-xs text-gray-400 mt-1 block">
                      For pre-enrolled or recommended students, you can assign strand/section directly in the COR view.
                    </span>
                  </p>
                </div>
              </div>
            )}
            </div>
          )}
        </main>
      </div>

      {selectedEnrollment && ['pre_enrolled', 'recommended'].includes(selectedEnrollment.status) && (
        <EnrollmentDetailModal
          enrollment={selectedEnrollment}
          onClose={() => {
            setSelectedEnrollment(null)
          }}
        />
      )}

    </div>
  )
}

