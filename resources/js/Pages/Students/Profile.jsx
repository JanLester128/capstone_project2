import { useState, useEffect, useMemo } from 'react'
import { Head, useForm } from '@inertiajs/react'
import StudentSidebar from '../Auth/Student_sidebar'

// Deduplicate subjects that appear on multiple days
function deduplicateSubjects(schedule) {
  if (!schedule || schedule.length === 0) return []
  
  const grouped = {}
  schedule.forEach((item) => {
    const key = item.subject_code || item.subject || item.id
    if (!grouped[key]) {
      grouped[key] = { ...item }
    }
  })
  
  return Object.values(grouped)
}

export default function Profile({ student, activeSchoolYear, activeSemester, enrollmentStatus }) {
  const [isEditing, setIsEditing] = useState(false)

  // Deduplicate enrolled subjects
  const enrolledSubjects = useMemo(() => {
    return deduplicateSubjects(enrollmentStatus?.latestEnrollment?.schedule || [])
  }, [enrollmentStatus?.latestEnrollment?.schedule])

  const { data, setData, post, processing, errors, reset } = useForm({
    FirstName: student?.FirstName || '',
    MiddleName: student?.MiddleName || '',
    LastName: student?.LastName || '',
    email: student?.email || '',
    profile_photo: null,
  })

  useEffect(() => {
    if (!isEditing && student) {
      setData({
        FirstName: student.FirstName || '',
        MiddleName: student.MiddleName || '',
        LastName: student.LastName || '',
        email: student.email || '',
        profile_photo: null,
      })
    }
  }, [student, isEditing, setData])

  const gradeLabel = student?.studentPersonalInfo?.grade_level
    ? `Grade ${student.studentPersonalInfo.grade_level} Student`
    : 'Student'

  const accountStatus = student?.is_disabled ? 'Disabled' : 'Active'
  // Check if student is enrolled - if enrolled, show "Enrolled", otherwise check verification status
  const verificationStatus = enrollmentStatus?.isEnrolled 
    ? 'Enrolled' 
    : (student?.studentPersonalInfo?.is_verified ? 'Verified' : 'Pending Verification')

  function handleSubmit(e) {
    e.preventDefault()
    post('/student/profile', {
      forceFormData: true,
      preserveScroll: false,
      onSuccess: () => {
        setIsEditing(false)
      },
      onError: () => {
        // Keep form open on error
      }
    })
  }

  function cancelEdit() {
    reset()
    setIsEditing(false)
  }

  const studentId = student?.id ? `2024-${student.id.toString().padStart(4, '0')}` : 'Not Provided'
  const schoolYearLabel = activeSchoolYear
    ? `${activeSchoolYear.School_year_start}-${activeSchoolYear.School_year_end}`
    : 'Not Available'
  const semesterLabel = activeSemester ? activeSemester.semester_type : 'Not Available'
  // Get strand from enrollment if enrolled, otherwise from assignedStrand
  const strandLabel = enrollmentStatus?.latestEnrollment?.strand 
    || student?.assignedStrand?.Strand_name 
    || 'Not Assigned'

  return (
    <div className="flex min-h-screen bg-gray-50">
      <StudentSidebar enrollmentStatus={enrollmentStatus} />
      <div className="flex-1 p-6">
        <Head title="Profile - ONSTS" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
            <p className="text-gray-600 mt-1">Manage your account information</p>
          </div>

          {isEditing ? (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={cancelEdit}
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={processing}
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {processing ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Profile
            </button>
          )}
        </div>

        <div className="bg-white border rounded-lg shadow-sm">
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:gap-6 gap-4">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-indigo-100 flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-indigo-500 to-indigo-600">
                {student?.profile_photo ? (
                  <img
                    src={`/storage/${student.profile_photo}`}
                    alt={`${student?.FirstName ?? ''} ${student?.LastName ?? ''}`.trim() || 'Student Avatar'}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-white">
                    {student?.FirstName?.[0] || 'S'}{student?.LastName?.[0] || 'T'}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-semibold text-gray-900 truncate">
                  {student?.FirstName} {student?.MiddleName} {student?.LastName}
                </h2>
                <p className="text-sm text-gray-600 mt-1">{student?.email}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                    {gradeLabel}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    {accountStatus}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    verificationStatus === 'Enrolled' 
                      ? 'bg-blue-100 text-blue-700' 
                      : verificationStatus === 'Verified' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {verificationStatus}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 border-t border-gray-100 pt-6">
              <InfoStat label="Student ID" value={studentId} />
              <InfoStat label="School Year" value={schoolYearLabel} />
              <InfoStat label="Semester" value={semesterLabel} />
              <InfoStat label="Strand" value={strandLabel} />
            </div>

            <div className="mt-8 border-t border-gray-100 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>

              {isEditing ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormInput
                      id="FirstName"
                      label="First Name *"
                      value={data.FirstName}
                      onChange={(e) => setData('FirstName', e.target.value)}
                      error={errors.FirstName}
                      required
                    />
                    <FormInput
                      id="MiddleName"
                      label="Middle Name"
                      value={data.MiddleName}
                      onChange={(e) => setData('MiddleName', e.target.value)}
                      error={errors.MiddleName}
                    />
                    <FormInput
                      id="LastName"
                      label="Last Name *"
                      value={data.LastName}
                      onChange={(e) => setData('LastName', e.target.value)}
                      error={errors.LastName}
                      required
                    />
                  </div>

                  <FormInput
                    id="email"
                    type="email"
                    label="Email Address *"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    error={errors.email}
                    required
                  />

                  <div>
                    <label htmlFor="profile_photo" className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Photo
                    </label>
                    <input
                      id="profile_photo"
                      type="file"
                      accept="image/jpeg,image/png,image/jpg,image/gif"
                      onChange={(e) => setData('profile_photo', e.target.files[0])}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">Maximum file size: 10MB. Supported formats: JPEG, PNG, JPG, GIF.</p>
                    {errors.profile_photo && (
                      <p className="mt-1 text-sm text-red-600">{errors.profile_photo}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">LRN (Learner Reference Number)</p>
                    <p className="text-sm text-gray-900 whitespace-pre-line">
                      {(() => {
                        const lrn = student?.studentPersonalInfo?.lrn || student?.student_personal_info?.lrn;
                        if (lrn && String(lrn).trim() !== '' && String(lrn).trim().toUpperCase() !== 'N/A') {
                          return String(lrn).trim();
                        }
                        return '';
                      })()}
                    </p>
                  </div>
                  <DisplayField label="First Name" value={student?.FirstName} />
                  <DisplayField label="Middle Name" value={student?.MiddleName} />
                  <DisplayField label="Last Name" value={student?.LastName} />
                  <DisplayField label="Email" value={student?.email} />
                  <DisplayField label="Role" value={student?.Role || 'Student'} />
                  <DisplayField label="Account Status" value={accountStatus} />
                </div>
              )}
            </div>

            {/* Academic Information removed per request (LRN moved to Personal Information). */}
            {/* Latest Enrollment section removed per request. */}

            {/* Enrolled Subjects - from latest enrollment schedule */}
            {enrolledSubjects.length > 0 && (
              <div className="mt-8 border-t border-gray-100 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Enrolled Subjects</h3>
                <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide w-12">#</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Subject</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Instructor</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {enrolledSubjects.map((row, idx) => (
                        <tr key={`${row.id}-${idx}`}>
                          <td className="px-4 py-3 text-sm text-gray-700">{idx + 1}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {row.subject || ''}
                            {row.is_credited && (
                              <span className="ml-1 text-xs font-semibold text-indigo-600">(Credited)</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{row.faculty || ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoStat({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-lg border border-gray-100 p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="mt-2 text-sm font-semibold text-gray-900 truncate">{value || 'Not provided'}</p>
    </div>
  )
}

function DisplayField({ label, value, fallback = '' }) {
  // Handle LRN and other fields - show value if it exists and is not "N/A"
  let displayValue = '';
  if (value !== null && value !== undefined && value !== '') {
    const stringValue = String(value).trim();
    if (stringValue !== '' && stringValue !== 'N/A' && stringValue !== 'n/a') {
      displayValue = stringValue;
    }
  }
  // Only use fallback if displayValue is still empty
  if (!displayValue && fallback) {
    displayValue = fallback;
  }
  return (
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-sm text-gray-900 whitespace-pre-line">{displayValue}</p>
    </div>
  )
}

function FormInput({ id, label, value, onChange, error, type = 'text', required = false }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
          error ? 'border-red-300' : 'border-gray-300'
        }`}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}
