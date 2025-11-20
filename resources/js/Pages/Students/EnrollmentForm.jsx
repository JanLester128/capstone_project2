import { useMemo, useState, useEffect } from 'react'
import { Head, useForm, usePage } from '@inertiajs/react'
import StudentSidebar from '../Auth/Student_sidebar'

// Lightweight selector for transferee subjects, uses subjects passed from page props
function TransfereeSubjectsSelector({ value, onChange, subjects, selectedStrandId, selectedSemester, selectedYearLevel }) {
  // Filter by selected strand (first preference/assigned target), selected semester, and year level, then dedupe by subject code
  const filteredByStrand = (subjects ?? []).filter(s => {
    if (!selectedStrandId) return true
    const sid = s.strand_id ?? s.strandId
    return String(sid) === String(selectedStrandId)
  })
  const semesterNorm = String(selectedSemester || '').toLowerCase()
  const filtered = filteredByStrand.filter(s => {
    if (!semesterNorm) return true
    const semField = (s.Semester ?? s.semester ?? '').toString().toLowerCase()
    // Accept both numeric and text forms
    if (semesterNorm.startsWith('1')) {
      return semField === '1' || semField === '1st'
    }
    if (semesterNorm.startsWith('2')) {
      return semField === '2' || semField === '2nd'
    }
    return true
  })
  const filteredByYear = (filtered ?? []).filter(s => {
    if (!selectedYearLevel) return true
    const yl = Number(s.year_level ?? s.yearLevel ?? 0)
    return Number(selectedYearLevel) === yl
  })
  const deduped = Array.from(new Map(filteredByYear.map(s => {
    const code = (s.Subject_code ?? s.code ?? '').toString()
    return [code, s]
  })).values())

  const mapped = deduped.map(s => ({
    id: s.Id ?? s.id,
    name: s.Subject_name ?? s.name,
    code: s.Subject_code ?? s.code,
    strand_id: s.strand_id ?? s.strandId,
  }))

  const toggle = (id) => {
    const idStr = String(id)
    if (value.includes(idStr) || value.includes(id)) {
      onChange(value.filter(v => String(v) !== idStr))
    } else {
      onChange([...value, idStr])
    }
  }

  if (!mapped.length) {
    return (
      <div className="rounded border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
        No subject catalog available yet. You can still proceed; registrar will handle crediting.
      </div>
    )
  }

  return (
    <div className="max-h-48 overflow-auto rounded border border-gray-200">
      {mapped.map((s) => {
        const idStr = String(s.id)
        const checked = value.map(String).includes(idStr)
        return (
          <label key={idStr} className="flex items-center justify-between px-3 py-2 border-b last:border-b-0 hover:bg-gray-50">
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">{s.name}</div>
              <div className="text-xs text-gray-500">{s.code}</div>
            </div>
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(idStr)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300"
            />
          </label>
        )
      })}
    </div>
  )
}

const STEP_FIELDS = {
  1: [
    'semester',
    'strand_preferences',
  ],
  2: [
    'psa_birth_certificate_photo',
    'report_card_photo',
    'subjects_for_credit',
  ],
}

const FIELD_TO_STEP = Object.entries(STEP_FIELDS).reduce((acc, [step, fields]) => {
  fields.forEach((field) => {
    acc[field] = Number(step)
  })
  return acc
}, {})

const STEP_VALIDATION_RULES = {
  1: [
    { field: 'semester', message: 'Semester selection is required.' },
    { field: 'strand_preferences.0', message: 'Please choose at least one strand preference.' },
  ],
  2: [
    // Document validation handled by required attribute
  ],
}

const getFieldValue = (data, field) => {
  if (field.startsWith('strand_preferences')) {
    const [, index] = field.split('.')
    return data.strand_preferences?.[Number(index)] ?? ''
  }

  return data[field]
}

const collectStepErrors = (data, step) => {
  const rules = STEP_VALIDATION_RULES[step] ?? []
  return rules.reduce((acc, { field, message }) => {
    const value = getFieldValue(data, field)
    const isEmpty =
      value === undefined ||
      value === null ||
      (typeof value === 'string' && value.trim() === '') ||
      (Array.isArray(value) && value.length === 0)

    if (isEmpty) {
      acc[field] = message

      if (field.includes('.')) {
        const baseField = field.split('.')[0]
        if (!acc[baseField]) {
          acc[baseField] = message
        }
      }
    }

    return acc
  }, {})
}

// Updated for navigation fix
export default function EnrollmentForm({ strands, studentInfo, strandPreferences, activeSchoolYear, enrollmentStatus, availableSubjects }) {
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 2
  const canEdit = Boolean(enrollmentStatus?.latestEnrollment?.can_edit ?? enrollmentStatus?.canEnroll ?? true)
  const isLocked = !canEdit
  const isTransferee = String(studentInfo?.student_status || '').toLowerCase() === 'transferee'

  const { props } = usePage()
  const flash = props.flash || {}
  const pageErrors = props.errors || {}
  const [stepErrors, setStepErrors] = useState({})

  const { data, setData, post, processing, errors, transform } = useForm({
    // Senior High School
    semester: studentInfo?.semester || '1st',
    
    // Strand Preferences
    strand_preferences: [
      strandPreferences?.[1] || '',
      strandPreferences?.[2] || '',
      strandPreferences?.[3] || ''
    ],
    
    // Transferee fields (only shown if transferee and after strand selection)
    subjects_for_credit: [],
    
    // Document Uploads
    psa_birth_certificate_photo: null,
    report_card_photo: null
  })

  const generalError = errors.error ?? pageErrors.error ?? null
  const combinedError = generalError || flash.error || null

  const getFieldError = (field) => errors[field] ?? stepErrors[field] ?? null

  const clearStepError = (field) => {
    setStepErrors((prev) => {
      if (!prev[field] && !prev[field.split('.')[0]]) {
        return prev
      }

      const updated = { ...prev }
      delete updated[field]

      if (field.includes('.')) {
        delete updated[field.split('.')[0]]
      }

      return updated
    })
  }

  const strandPreferenceErrorMap = useMemo(() => {
    const mergedErrors = { ...stepErrors, ...errors }
    return Object.entries(mergedErrors).reduce((acc, [key, message]) => {
      const match = key.match(/^strand_preferences\.(\d+)/)
      if (match) {
        acc[parseInt(match[1], 10)] = message
      }
      return acc
    }, {})
  }, [errors, stepErrors])


  // Strand preference helper functions
  const handleStrandPreferenceChange = (index, value) => {
    const newPreferences = [...data.strand_preferences]
    newPreferences[index] = value
    setData('strand_preferences', newPreferences)
    clearStepError(`strand_preferences.${index}`)
    clearStepError('strand_preferences')
  }

  const addStrandPreference = () => {
    if (data.strand_preferences.length < 3) {
      setData('strand_preferences', [...data.strand_preferences, ''])
    }
  }

  const removeStrandPreference = (index) => {
    if (index > 0) {
      const newPreferences = data.strand_preferences.filter((_, i) => i !== index)
      setData('strand_preferences', newPreferences)
    }
  }

  const getStepForField = (fieldName) => {
    if (!fieldName || fieldName === 'error') {
      return currentStep
    }

    const normalizedField = fieldName.replace(/\.\d+$/, '')
    return FIELD_TO_STEP[normalizedField] ?? FIELD_TO_STEP[fieldName] ?? currentStep
  }


  function handleSubmit(e) {
    e.preventDefault()

    transform((original) => original)
    setStepErrors({})

    post('/student/enrollment', {
      forceFormData: true,
      onSuccess: () => {
        setCurrentStep(1)
      },
      onError: (formErrors) => {
        const firstFieldWithError = Object.keys(formErrors)[0]
        if (firstFieldWithError) {
          setCurrentStep(getStepForField(firstFieldWithError))
        }
      },
      onFinish: () => transform((value) => value),
    })
  }

  function nextStep() {
    if (currentStep < totalSteps) {
      const validationErrors = collectStepErrors(data, currentStep)
      if (Object.keys(validationErrors).length) {
        setStepErrors(validationErrors)
        return
      }

      setStepErrors({})
      setCurrentStep(currentStep + 1)
    }
  }

  function prevStep() {
    if (currentStep > 1) {
      setStepErrors({})
      setCurrentStep(currentStep - 1)
    }
  }

  const stepTitles = [
    'Strand Preferences & Semester',
    'Documents & Subject Credits'
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <StudentSidebar enrollmentStatus={enrollmentStatus} />
      <div className="flex-1">
        <Head title="Student Personal Information" />
      
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Student Personal Information Form</h1>
                <p className="text-gray-600">Please fill out all required information to complete your enrollment.</p>
              </div>
              <div className="text-right">
                {activeSchoolYear && (
                  <>
                    <div className="text-sm text-gray-500">School Year</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {activeSchoolYear.School_year_start}-{activeSchoolYear.School_year_end}
                    </div>
                  </>
                )}
                {enrollmentStatus?.latestEnrollment?.status_text && (
                  <span className="mt-2 inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600">
                    <span className="inline-block h-2 w-2 rounded-full bg-gray-400" />
                    {enrollmentStatus.latestEnrollment.status_text}
                  </span>
                )}
              </div>
            </div>

            {isLocked ? (
              <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                Your enrollment is currently under review. Please wait for feedback from your coordinator or registrar before making further changes.
              </div>
            ) : (
              <p className="mb-4 text-sm text-gray-600">
                Review your entries carefully before submitting. Your coordinator will automatically receive your pre-enrollment after submission.
              </p>
            )}

            {(flash.success || combinedError) && (
              <div className="mb-4 space-y-3">
                {flash.success && (
                  <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                    {flash.success}
                  </div>
                )}
                {combinedError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {combinedError}
                  </div>
                )}
              </div>
            )}

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Step {currentStep} of {totalSteps}</span>
                <span>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                ></div>
              </div>
              <p className="mt-2 text-sm font-medium text-gray-700">{stepTitles[currentStep - 1]}</p>
            </div>
          </div>

            <form onSubmit={handleSubmit}>
            <fieldset disabled={isLocked} className={isLocked ? 'opacity-75 pointer-events-none' : ''}>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                
                {/* Step 1: Strand Preferences & Semester */}
                {currentStep === 1 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-3 mb-6">
                    Senior High School & Strand Preferences
                  </h2>
                  
                  {/* Semester Selection */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-3">Semester</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Semester *</label>
                      <select
                        value={data.semester}
                        onChange={(e) => {
                          setData('semester', e.target.value)
                          clearStepError('semester')
                        }}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="1st">1st Semester</option>
                        <option value="2nd">2nd Semester</option>
                      </select>
                      {getFieldError('semester') && (
                        <p className="mt-1 text-sm text-red-600">{getFieldError('semester')}</p>
                      )}
                    </div>
                  </div>

                  {/* Strand Preferences */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-3">Strand Preferences</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Select your preferred strands in order of preference (minimum 1, maximum 3). 
                      Your first choice will be prioritized during enrollment.
                    </p>
                    
                    {!strands || strands.length === 0 ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                        <p className="text-yellow-800 text-sm">
                          ⚠️ No active strands available. Please contact the registrar's office.
                        </p>
                      </div>
                    ) : (
                    
                    <div className="space-y-4">
                      {data.strand_preferences.map((preference, index) => (
                        <div key={index} className="md:flex md:items-start md:space-x-4 space-y-2 md:space-y-0">
                          <span className="text-sm font-medium text-gray-700 w-24 shrink-0">
                            {index === 0 ? '1st Choice' : index === 1 ? '2nd Choice' : '3rd Choice'}:
                          </span>
                          <div className="flex-1">
                            <select
                              value={preference}
                              onChange={(e) => handleStrandPreferenceChange(index, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required={index === 0}
                            >
                              <option value="">Select a strand</option>
                              {strands?.filter(strand =>
                                !data.strand_preferences.includes(strand.id.toString()) || strand.id.toString() === preference
                              ).map(strand => (
                                <option key={strand.id} value={strand.id}>
                                  {strand.Strand_name}
                                </option>
                              ))}
                            </select>
                            {strandPreferenceErrorMap[index] && (
                              <p className="mt-1 text-sm text-red-600">{strandPreferenceErrorMap[index]}</p>
                            )}
                          </div>
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => removeStrandPreference(index)}
                              className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                      
                      {data.strand_preferences.length < 3 && (
                        <button
                          type="button"
                          onClick={addStrandPreference}
                          className="flex items-center px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md"
                        >
                          <span className="mr-2">+</span>
                          Add another preference
                        </button>
                      )}
                    </div>
                    )}
                    {getFieldError('strand_preferences') && (
                      <p className="mt-2 text-sm text-red-600">{getFieldError('strand_preferences')}</p>
                    )}
                  </div>
                </div>
                )}

                {/* Step 2: Documents & Subject Credits */}
                {currentStep === 2 && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-3 mb-6">
                      Documents & Subject Credits
                    </h2>

                    {/* Document Uploads */}
                    <div className="bg-yellow-50 p-4 rounded-lg mb-6">
                      <h3 className="font-medium text-gray-900 mb-4">Required Documents</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            PSA Birth Certificate Photo *
                          </label>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => setData('psa_birth_certificate_photo', e.target.files[0])}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required={!studentInfo?.psa_birth_certificate_photo}
                          />
                          {errors.psa_birth_certificate_photo && (
                            <p className="mt-1 text-sm text-red-600">{errors.psa_birth_certificate_photo}</p>
                          )}
                          <p className="mt-1 text-xs text-gray-500">
                            Upload a clear photo or scan of your PSA Birth Certificate. Max size: 10MB.
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Report Card Photo *
                          </label>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => setData('report_card_photo', e.target.files[0])}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required={!studentInfo?.report_card_photo}
                          />
                          {errors.report_card_photo && (
                            <p className="mt-1 text-sm text-red-600">{errors.report_card_photo}</p>
                          )}
                          <p className="mt-1 text-xs text-gray-500">
                            Upload your most recent report card. Max size: 10MB.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Transferee Subject Selection - Only show if transferee and after selecting 1st strand preference */}
                    {isTransferee && data.strand_preferences?.[0] && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-3">Subjects To Be Credited</h3>
                        <p className="text-sm text-gray-600 mb-3">
                          Select subjects from your <strong>1st choice strand</strong> that you want to credit. 
                          Only subjects from {strands?.find(s => s.id.toString() === data.strand_preferences[0]?.toString())?.Strand_name || 'your selected strand'} are shown.
                        </p>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Subjects To Be Credited (select all that apply)
                          </label>
                          <TransfereeSubjectsSelector
                            value={data.subjects_for_credit}
                            onChange={(ids) => setData('subjects_for_credit', ids)}
                            subjects={availableSubjects}
                            selectedStrandId={(data.strand_preferences?.[0] || '').toString()}
                            selectedSemester={data.semester}
                            selectedYearLevel={(Number(studentInfo?.grade_level_completed) === 10 ? 11 : (Number(studentInfo?.grade_level_completed) === 11 ? 12 : 11))}
                          />
                          {getFieldError('subjects_for_credit') && (
                            <p className="mt-1 text-sm text-red-600">{getFieldError('subjects_for_credit')}</p>
                          )}
                          <p className="mt-1 text-xs text-gray-600">
                            Selected subjects will be reviewed by the coordinator/registrar. Grades will be encoded in-person before final enrollment.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </fieldset>

            {!isLocked && (
              <p className="mt-4 text-sm text-gray-500">
                Tip: Double-check your information before requesting coordinator approval. You can revisit this form while your status is Pre-Enrolled.
              </p>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1 || isLocked}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={isLocked}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={processing || isLocked}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {processing ? 'Submitting...' : 'Submit Enrollment'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
      </div>
    </div>
  )
}
