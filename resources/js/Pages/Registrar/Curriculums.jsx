import { Head, useForm, router } from '@inertiajs/react'
import { useEffect, useMemo, useState } from 'react'
import Swal from 'sweetalert2'
import RegistrarLayout from './Layout'
import Breadcrumb from './Components/Breadcrumb'
import SubjectForm from './Components/SubjectForm'

const initialForm = {
  curriculum_code: '',
  name: '',
  track: '',
  strand_id: '',
  effective_sy: '',
  is_active: true
}

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' }
]

const formatYearLabel = (year) => {
  if (!year || year === 'No School Year') {
    return 'Unassigned School Year'
  }
  return year
}

const semesterOrder = {
  '1': 1,
  '2': 2,
  Summer: 3
}

const getSemesterLabel = (key) => {
  if (key === '1' || key === 1) return '1st Semester'
  if (key === '2' || key === 2) return '2nd Semester'
  if (!key || key === 'Unknown') return 'Unassigned Semester'
  return typeof key === 'string' ? key : `${key}`
}

const formatYearLevelLabel = (yearLevel) => {
  if (!yearLevel || yearLevel === 'Unknown') return 'Unassigned Year Level'
  if (!Number.isNaN(Number(yearLevel))) return `Grade ${yearLevel}`
  return yearLevel
}

const buildStrandYearCombos = (curriculum) => {
  const grouped = curriculum.subjects_grouped || {}
  const combos = []

  Object.entries(grouped).forEach(([strandName, years]) => {
    Object.entries(years || {}).forEach(([yearLevel, semesters]) => {
      const semesterEntries = Object.entries(semesters || {})
        .map(([semesterKey, subjects]) => ({
          semesterKey,
          semesterLabel: getSemesterLabel(semesterKey),
          semesterId: subjects?.[0]?.semester_id || null,
          semesterType: subjects?.[0]?.semester_type || getSemesterLabel(semesterKey),
          subjects: subjects || []
        }))
        .sort((a, b) => (semesterOrder[a.semesterKey] || 99) - (semesterOrder[b.semesterKey] || 99))

      const flattenedSubjects = semesterEntries.flatMap((entry) => entry.subjects)

      combos.push({
        key: `${strandName}-${yearLevel}`,
        strandName,
        yearLevel,
        strandId: flattenedSubjects?.[0]?.strand_id || null,
        totalSubjects: flattenedSubjects.length,
        semesters: semesterEntries
      })
    })
  })

  return combos.sort((a, b) => {
    const strandCompare = (a.strandName || '').localeCompare(b.strandName || '')
    if (strandCompare !== 0) return strandCompare
    const aYear = Number(a.yearLevel)
    const bYear = Number(b.yearLevel)
    if (!Number.isNaN(aYear) && !Number.isNaN(bYear)) {
      return aYear - bYear
    }
    return (a.yearLevel || '').localeCompare(b.yearLevel || '')
  })
}

export default function Curriculums({ curriculums = [], strands = [], semesters = [], activeSemester = null, activeSchoolYear = null }) {
  const [editing, setEditing] = useState(null)
  const [showFormModal, setShowFormModal] = useState(false)
  const [selectedCombos, setSelectedCombos] = useState({})
  const [subjectModal, setSubjectModal] = useState({ open: false, subject: null, context: null })
  const [subjectMenu, setSubjectMenu] = useState({ subjectId: null, position: { x: 0, y: 0 } })
  const [archivingSubject, setArchivingSubject] = useState(null)
  const [groupModal, setGroupModal] = useState({ open: false, year: '', items: [] })
  const [activeCurriculumId, setActiveCurriculumId] = useState(null)
  const form = useForm(initialForm)

  const subjectsBackgroundStyle = {
    backgroundImage: 'url(/onsts.png)',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    backgroundSize: '220px',
    backgroundColor: 'rgba(255,255,255,0.9)',
    backgroundBlendMode: 'lighten'
  }

  const curriculumCombos = useMemo(() => {
    return curriculums.reduce((acc, curriculum) => {
      acc[curriculum.id] = buildStrandYearCombos(curriculum)
      return acc
    }, {})
  }, [curriculums])

  const activeCurriculums = useMemo(() => curriculums.filter((curriculum) => curriculum.is_active), [curriculums])

  useEffect(() => {
    setSelectedCombos((prev) => {
      const next = { ...prev }

      Object.keys(next).forEach((key) => {
        if (!curriculumCombos[key]) {
          delete next[key]
        }
      })

      Object.entries(curriculumCombos).forEach(([curriculumId, combos]) => {
        if (!combos.length) {
          delete next[curriculumId]
          return
        }

        if (!next[curriculumId] || !combos.some((combo) => combo.key === next[curriculumId])) {
          next[curriculumId] = combos[0].key
        }
      })

      return next
    })
  }, [curriculumCombos])

  useEffect(() => {
    if (!activeCurriculums.length) {
      if (activeCurriculumId !== null) {
        setActiveCurriculumId(null)
      }
      return
    }

    const exists = activeCurriculums.some((curriculum) => curriculum.id === activeCurriculumId)
    if (!exists && activeCurriculumId !== null) {
      setActiveCurriculumId(null)
    }
  }, [activeCurriculums, activeCurriculumId])

  const groupedCurriculums = useMemo(() => {
    if (!curriculums.length) return []

    const groups = curriculums.reduce((acc, curriculum) => {
      const key = curriculum.effective_sy || 'No School Year'
      acc[key] = acc[key] ? [...acc[key], curriculum] : [curriculum]
      return acc
    }, {})

    return Object.entries(groups)
      .sort((a, b) => (b[0] || '').localeCompare(a[0] || ''))
      .map(([year, items]) => ({
        year,
        items: items.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      }))
  }, [curriculums])
  const sortedCurriculums = useMemo(() => {
    return [...activeCurriculums].sort((a, b) => {
      const syA = a.effective_sy || ''
      const syB = b.effective_sy || ''
      const compareSy = syB.localeCompare(syA)
      if (compareSy !== 0) return compareSy
      return (a.name || '').localeCompare(b.name || '')
    })
  }, [activeCurriculums])

  const resetForm = () => {
    form.reset()
    form.setData(initialForm)
    form.clearErrors()
    setEditing(null)
  }

  const handleOpenModal = (payload = null) => {
    if (payload) {
      setEditing(payload)
      form.setData({
        curriculum_code: payload.curriculum_code || '',
        name: payload.name || '',
        track: payload.track || '',
        strand_id: payload.strand_id || '',
        effective_sy: payload.effective_sy || '',
        is_active: Boolean(payload.is_active)
      })
    } else {
      resetForm()
    }
    setShowFormModal(true)
  }

  const closeModal = () => {
    setShowFormModal(false)
    resetForm()
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const payload = {
      ...form.data,
      strand_id: form.data.strand_id || null,
    }

    const options = {
      preserveScroll: true,
      onSuccess: () => {
        Swal.fire({
          title: editing ? 'Curriculum updated' : 'Curriculum created',
          icon: 'success',
          timer: 1400,
          showConfirmButton: false
        })
        closeModal()
      }
    }

    if (editing) {
      form.put(`/registrar/curriculums/${editing.id}`, options)
    } else {
      form.post('/registrar/curriculums', options)
    }
  }

  const handleStatusSelect = (curriculum, value) => {
    const shouldActivate = value === 'active'
    if ((shouldActivate && curriculum.is_active) || (!shouldActivate && !curriculum.is_active)) {
      return
    }

    const effectiveYear = curriculum.effective_sy
    const yearLabel = effectiveYear ? `SY ${effectiveYear}` : 'this curriculum'
    const detailMessage = effectiveYear
      ? `This will ${shouldActivate ? 'activate' : 'deactivate'} all curriculums for ${yearLabel}.`
      : `This will ${shouldActivate ? 'activate' : 'deactivate'} this curriculum.`

    const actionTitle = shouldActivate ? `Enable ${yearLabel}` : `Disable ${yearLabel}`

    Swal.fire({
      title: actionTitle,
      text: `${detailMessage}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: shouldActivate ? '#16a34a' : '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Confirm'
    }).then((result) => {
      if (!result.isConfirmed) return

      router.put(`/registrar/curriculums/${curriculum.id}/toggle`, {}, {
        preserveScroll: true,
        onSuccess: () => {
          Swal.fire({
            title: 'Updated!',
            icon: 'success',
            timer: 1300,
            showConfirmButton: false
          })
        }
      })
    })
  }

  const refreshCurriculums = () => {
    router.reload({ preserveScroll: true, only: ['curriculums'] })
  }

  const selectedComboFor = (curriculumId) => {
    const combos = curriculumCombos[curriculumId] || []
    const selectedKey = selectedCombos[curriculumId]
    return combos.find((combo) => combo.key === selectedKey) || combos[0] || null
  }

  const handleComboSelect = (curriculumId, comboKey) => {
    setSelectedCombos((prev) => ({
      ...prev,
      [curriculumId]: comboKey
    }))
  }

  const handleCurriculumSelect = (curriculumId) => {
    setActiveCurriculumId(curriculumId)
  }

  const handleDelete = (curriculum) => {
    Swal.fire({
      title: 'Delete this curriculum?',
      text: `${curriculum.curriculum_code || 'No code'} • ${curriculum.name || 'Untitled curriculum'}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete'
    }).then((result) => {
      if (!result.isConfirmed) return

      router.delete(`/registrar/curriculums/${curriculum.id}`, {
        preserveScroll: true,
        onSuccess: () => {
          Swal.fire({
            title: 'Deleted!',
            icon: 'success',
            timer: 1300,
            showConfirmButton: false
          })
        }
      })
    })
  }

  const activeCurriculum = activeCurriculums.find((curriculum) => curriculum.id === activeCurriculumId) || null
  const activeCombos = activeCurriculum ? curriculumCombos[activeCurriculum.id] || [] : []
  const activeSelection = activeCurriculum ? selectedComboFor(activeCurriculum.id) : null
  const curriculumGroups = useMemo(() => {
    const map = new Map()
    curriculums.forEach((curriculum) => {
      const key = curriculum.effective_sy || 'No School Year'
      if (!map.has(key)) {
        map.set(key, [])
      }
      map.get(key).push(curriculum)
    })
    return Array.from(map.entries())
      .sort((a, b) => (b[0] || '').localeCompare(a[0] || ''))
      .map(([year, items]) => ({
        year,
        items: items.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      }))
  }, [curriculums])
  const activeYearLabel = useMemo(() => {
    if (!activeSchoolYear) return null
    if (typeof activeSchoolYear === 'string') return activeSchoolYear
    if (typeof activeSchoolYear === 'object') {
      const start = activeSchoolYear.School_year_start ?? activeSchoolYear.start ?? activeSchoolYear.year_start
      const end = activeSchoolYear.School_year_end ?? activeSchoolYear.end ?? activeSchoolYear.year_end
      if (start && end) {
        return `${start}-${end}`
      }
    }
    return null
  }, [activeSchoolYear])

  const openAddSubjectModal = (curriculum = null) => {
    const targetCurriculum = curriculum || activeCurriculum
    if (!targetCurriculum) return

    const selectedCombo = selectedComboFor(targetCurriculum.id)
    const defaultSemester = selectedCombo?.semesters?.[0]

    setSubjectModal({
      open: true,
      subject: null,
      context: {
        curriculumId: targetCurriculum.id,
        strandId: selectedCombo?.strandId || null,
        yearLevel: selectedCombo?.yearLevel || null,
        semesterId: defaultSemester?.semesterId || null,
        semesterType: defaultSemester?.semesterType || defaultSemester?.semesterLabel || null,
        lockStrandYear: false
      }
    })
  }

  const closeSubjectModal = () => {
    setSubjectModal({ open: false, subject: null, context: null })
  }

  const openEditSubject = (subject) => {
    if (!subject) return

    const normalized = {
      ...subject,
      Subject_name: subject.Subject_name ?? subject.name ?? '',
      Subject_code: subject.Subject_code ?? subject.code ?? '',
      PREREQUISITES: subject.PREREQUISITES ?? subject.prerequisites ?? '',
      ['CO-REQUISITES']: subject['CO-REQUISITES'] ?? subject.corequisites ?? '',
      Semester: subject.Semester ?? subject.semesterKey ?? mapSemesterTypeToNumber(subject.semester_type || ''),
    }

    setSubjectModal({
      open: true,
      subject: normalized,
      context: {
        curriculumId: subject.curriculum_id,
        strandId: subject.strand_id,
        yearLevel: subject.year_level,
        semesterId: subject.semester_id,
        semesterType: subject.semester_type,
        lockStrandYear: false,
      },
    })
  }

  const handleArchiveSubject = (subject) => {
    const subjectId = subject.id ?? subject.Id
    if (!subjectId) return

    Swal.fire({
      title: 'Archive subject?',
      text: `Are you sure you want to archive "${subject.name || subject.Subject_name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, archive',
    }).then((result) => {
      if (!result.isConfirmed) return
      setArchivingSubject(subjectId)
      router.delete(`/registrar/subjects/${subjectId}`, {
        preserveScroll: true,
        onSuccess: () => {
          setArchivingSubject(null)
          setSubjectMenu({ subjectId: null, position: { x: 0, y: 0 } })
          refreshCurriculums()
          Swal.fire({
            title: 'Subject archived',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
          })
        },
        onError: () => {
          setArchivingSubject(null)
          Swal.fire({ title: 'Archive failed', icon: 'error' })
        },
      })
    })
  }

  const openGroupModal = (year, items) => {
    setGroupModal({ open: true, year, items })
  }

  const closeGroupModal = () => {
    setGroupModal({ open: false, year: '', items: [] })
  }

  const summaryStats = useMemo(() => {
    const totalCurriculums = curriculums.length
    const activeCount = activeCurriculums.length
    const grouped = curriculumCombos
    const totalSubjects = Object.values(grouped).reduce((curriculumSum, combos = []) => {
      return curriculumSum + combos.reduce((comboSum, combo) => comboSum + (combo.totalSubjects || 0), 0)
    }, 0)

    return [
      {
        label: 'Total Curriculums',
        value: totalCurriculums,
        accent: 'text-sky-600'
      },
      {
        label: 'Active Curriculums',
        value: activeCount,
        accent: 'text-emerald-600'
      },
      {
        label: 'Mapped Subjects',
        value: totalSubjects,
        accent: 'text-indigo-600'
      }
    ]
  }, [curriculums.length, activeCurriculums.length, curriculumCombos])

  const emptyState = (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 px-6 py-12 text-center">
      <p className="text-sm text-gray-500">No curriculums yet.</p>
      <button
        type="button"
        onClick={() => handleOpenModal()}
        className="mt-3 inline-flex w-full max-w-[220px] items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
      >
        + Add Curriculum
      </button>
    </div>
  )

  return (
    <RegistrarLayout>
      <Head title="Curriculums" />

      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <Breadcrumb
            items={[
              { label: 'Dashboard', href: '/registrar' },
              { label: 'Curriculums', href: '/registrar/curriculums', current: true }
            ]}
          />

          <div className="rounded-3xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 p-6 text-white shadow-xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/80">Curriculum Management</p>
                <h1 className="text-3xl font-bold leading-tight sm:text-4xl">Shape the curriculum for every strand</h1>
                <p className="text-sm text-blue-100">
                  Activate school-year templates, manage strands, and keep subject line-ups aligned with active terms.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {activeYearLabel && (
                  <div className="flex items-center gap-2 rounded-2xl bg-white/95 px-4 py-2 text-sm font-semibold text-sky-700 shadow">
                    <span role="img" aria-label="calendar">📅</span>
                    <span>Active SY {activeYearLabel}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
              {summaryStats.map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
                  <p className="text-xs uppercase tracking-wide text-white/70">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.accent} drop-shadow`}>{stat.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[320px,minmax(0,1fr)]">
            <div className="rounded-3xl border border-indigo-100 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-indigo-50 px-6 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">Curriculum</p>
                  <h1 className="text-2xl font-bold text-gray-900">Activation Center</h1>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenModal()}
                  className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
                >
                  + Add Curriculum
                </button>
              </div>

              <div className="p-4">
                {curriculumGroups.length === 0 ? (
                  emptyState
                ) : (
                  <div className="divide-y divide-gray-100 overflow-x-auto rounded-2xl border border-gray-50">
                    {curriculumGroups.map(({ year, items }, index) => {
                      const primary = items[0]
                      const isActiveCard = items.some((item) => item.id === activeCurriculumId)
                      const totalActive = items.filter((item) => item.is_active).length
                      const yearLabel = year === 'No School Year' ? 'Unassigned School Year' : year
                      return (
                        <div
                          key={year}
                          className={`flex min-w-[280px] flex-col gap-3 px-4 py-5 transition sm:flex-row sm:items-center ${
                            isActiveCard ? 'bg-indigo-50/70' : 'hover:bg-gray-50'
                          }`}
                          onClick={() => handleCurriculumSelect(primary.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                              {index + 1}
                            </div>
                            <div>
                              <p className="truncate text-sm font-semibold text-gray-900">{yearLabel}</p>
                              <p className="text-xs text-gray-500">
                                {items.length} curriculum{items.length === 1 ? '' : 's'} • {totalActive} active
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-1 flex-wrap items-center gap-3 sm:justify-end">
                            <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-0.5 text-xs font-semibold text-gray-700">
                              {yearLabel}
                            </span>
                            <select
                              className={`rounded-md border px-3 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-200 ${
                                primary.is_active
                                  ? 'border-green-200 bg-green-50 text-green-700'
                                  : 'border-gray-300 bg-gray-50 text-gray-600'
                              }`}
                              value={primary.is_active ? 'active' : 'inactive'}
                              onClick={(event) => event.stopPropagation()}
                              onChange={(event) => {
                                event.stopPropagation()
                                handleStatusSelect(primary, event.target.value)
                              }}
                            >
                              {statusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                openGroupModal(yearLabel, items)
                              }}
                              className="inline-flex items-center gap-1 rounded-md bg-amber-400 px-3 py-1.5 text-xs font-semibold text-amber-900 shadow hover:bg-amber-500"
                            >
                              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path d="M4.5 12.5 3 17l4.5-1.5L15 8l-3.5-3.5-7 7Z" />
                              </svg>
                              <span className="text-white">Edit</span>
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-indigo-100 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-indigo-50 px-6 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">Subject</p>
                  <h2 className="text-2xl font-bold text-gray-900">Subject by Strand</h2>
                  <p className="text-xs text-gray-500">
                    {activeCurriculum
                      ? `${activeCurriculum.curriculum_code || 'No code'} • ${activeCurriculum.name || 'Untitled Curriculum'}`
                      : 'Select a curriculum to preview its subjects.'}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!activeCurriculum}
                  onClick={() => openAddSubjectModal(activeCurriculum)}
                  className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm ${
                    activeCurriculum ? 'bg-indigo-600 hover:bg-indigo-700' : 'cursor-not-allowed bg-gray-300'
                  }`}
                >
                  + Add Subject
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Curriculum</label>
                    <select
                      value={activeCurriculumId || ''}
                      onChange={(event) => {
                        const value = event.target.value
                        handleCurriculumSelect(value ? Number(value) : null)
                      }}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    >
                      <option value="">Select Curriculum</option>
                      {sortedCurriculums.length === 0 && <option value="" disabled>No curriculums available</option>}
                      {sortedCurriculums.map((curriculum) => (
                        <option key={curriculum.id} value={curriculum.id}>
                          {curriculum.curriculum_code || 'No code'} • {curriculum.name || 'Untitled Curriculum'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Year Level</label>
                    <select
                      value={(activeCurriculum && selectedCombos[activeCurriculum.id]) || ''}
                      onChange={(event) => activeCurriculum && handleComboSelect(activeCurriculum.id, event.target.value)}
                      disabled={!activeCurriculum || !activeCombos.length}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-gray-100"
                    >
                      {!activeCurriculum && <option value="">Select a curriculum first</option>}
                      {activeCurriculum && !activeCombos.length && <option value="">No strands found</option>}
                      {activeCombos.map((combo) => (
                        <option key={combo.key} value={combo.key}>
                          {formatYearLevelLabel(combo.yearLevel)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {!activeCurriculum ? (
                  <div
                    className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-indigo-200 text-sm text-gray-500"
                    style={subjectsBackgroundStyle}
                  >
                    Select a curriculum above to preview its subjects.
                  </div>
                ) : !activeCombos.length ? (
                  <div
                    className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-indigo-200 text-sm text-gray-500"
                    style={subjectsBackgroundStyle}
                  >
                    This curriculum doesn’t have strand/year entries yet. Use the “+ Add Subject” button to create the first one.
                  </div>
                ) : !activeSelection ? (
                  <div
                    className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-indigo-200 text-sm text-gray-500"
                    style={subjectsBackgroundStyle}
                  >
                    Choose a year level from the dropdown or click “+ Add Subject” to start filling it in.
                  </div>
                ) : (
                  <div className="rounded-2xl border border-indigo-100 bg-slate-50/70 p-4" style={subjectsBackgroundStyle}>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-50 pb-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{activeSelection.strandName}</p>
                        <p className="text-xs text-gray-500">{formatYearLevelLabel(activeSelection.yearLevel)}</p>
                      </div>
                      <span className="rounded-full border border-indigo-100 bg-white px-3 py-1 text-[11px] font-semibold text-indigo-600">
                        {activeSelection.totalSubjects || 0} Subject{activeSelection.totalSubjects === 1 ? '' : 's'}
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">
                      {activeSelection.semesters.map((semester) => (
                        <div key={`${activeSelection.key}-${semester.semesterKey}`} className="rounded-2xl border border-indigo-50 bg-white">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 px-4 py-3">
                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                semester.semesterKey === '1'
                                  ? 'bg-blue-100 text-blue-700'
                                  : semester.semesterKey === '2'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-amber-100 text-amber-700'
                              }`}>
                                {semester.semesterLabel}
                              </span>
                              <span>{semester.subjects.length} subject{semester.subjects.length === 1 ? '' : 's'}</span>
                            </div>
                          </div>

                          {semester.subjects.length ? (
                            <ul className="divide-y divide-indigo-50">
                              {semester.subjects.map((subject) => (
                                <li
                                  key={subject.id}
                                  className="flex flex-col gap-1 px-4 py-3 md:flex-row md:items-center md:justify-between"
                                >
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900">{subject.name || 'Untitled Subject'}</p>
                                    <p className="font-mono text-[11px] text-gray-500">{subject.code || 'No code'}</p>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="text-[11px] text-gray-500 md:text-right">
                                      {subject.prerequisites && (
                                        <p><span className="font-semibold text-gray-700">Pre:</span> {subject.prerequisites}</p>
                                      )}
                                      {subject.corequisites && (
                                        <p><span className="font-semibold text-gray-700">Co:</span> {subject.corequisites}</p>
                                      )}
                                    </div>
                                    <div className="relative">
                                      <button
                                        type="button"
                                        onClick={(event) => {
                                          event.stopPropagation()
                                          setSubjectMenu((prev) =>
                                            prev.subjectId === subject.id
                                              ? { subjectId: null, position: { x: 0, y: 0 } }
                                              : {
                                                  subjectId: subject.id,
                                                  position: {
                                                    x: event.clientX,
                                                    y: event.clientY,
                                                  },
                                                }
                                          )
                                        }}
                                        className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                      >
                                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                        </svg>
                                      </button>
                                      {subjectMenu.subjectId === subject.id && (
                                        <div className="absolute right-0 z-10 mt-2 w-36 rounded-md border border-gray-200 bg-white shadow-lg">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              openEditSubject(subject)
                                              setSubjectMenu({ subjectId: null, position: { x: 0, y: 0 } })
                                            }}
                                            className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                          >
                                            Edit subject
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleArchiveSubject(subject)}
                                            className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                          >
                                            Archive subject
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="px-4 py-8 text-center text-sm text-gray-500">No subjects yet for this semester.</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {subjectModal.open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
            <SubjectForm
              subject={subjectModal.subject}
              strands={strands}
              semesters={semesters}
              activeSemester={activeSemester}
              curriculums={curriculums}
              lockedCurriculumId={subjectModal.context?.curriculumId}
              defaultStrandId={subjectModal.context?.strandId}
              defaultYearLevel={subjectModal.context?.yearLevel}
              defaultSemesterId={subjectModal.context?.semesterId}
              defaultSemesterType={subjectModal.context?.semesterType}
              readOnlyStrandYear={Boolean(subjectModal.context?.lockStrandYear)}
              onClose={closeSubjectModal}
              onSuccess={() => {
                closeSubjectModal()
                refreshCurriculums()
              }}
            />
          </div>
        </div>
      )}

      {groupModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">School Year</p>
                <h2 className="text-xl font-semibold text-gray-900">{groupModal.year || 'Curriculums'}</h2>
                <p className="text-xs text-gray-500">{groupModal.items.length} curriculum{groupModal.items.length === 1 ? '' : 's'} in this year</p>
              </div>
              <button
                type="button"
                onClick={closeGroupModal}
                className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto divide-y divide-gray-100">
              {groupModal.items.map((curriculum) => (
                <div key={curriculum.id} className="flex flex-wrap items-center gap-3 px-6 py-4">
                  <div className="min-w-[150px] flex-1">
                    <p className="text-sm font-semibold text-gray-900">{curriculum.name || 'Untitled Curriculum'}</p>
                    <p className="text-xs text-gray-500">{curriculum.curriculum_code || 'No code'} • Track: {curriculum.track || 'N/A'}</p>
                    <p className="text-xs text-gray-500">Strand: {curriculum.strand?.Strand_name || 'All Strands'}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    curriculum.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {curriculum.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      closeGroupModal()
                      handleOpenModal(curriculum)
                    }}
                    className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow hover:bg-indigo-700"
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">{editing ? 'Update' : 'Create'}</p>
                <h2 className="text-xl font-semibold text-gray-900">{editing ? 'Edit Curriculum' : 'New Curriculum'}</h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                <span className="sr-only">Close modal</span>
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
              <div>
                <label className="block text-xs font-semibold text-gray-600">Curriculum Code</label>
                <input
                  type="text"
                  value={form.data.curriculum_code}
                  onChange={(event) => form.setData('curriculum_code', event.target.value)}
                  className={`mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 ${form.errors.curriculum_code ? 'border-red-400' : 'border-gray-300'}`}
                  placeholder="e.g., STEM-2025"
                />
                {form.errors.curriculum_code && (
                  <p className="mt-1 text-xs text-red-600">{form.errors.curriculum_code}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600">Curriculum Name</label>
                <input
                  type="text"
                  value={form.data.name}
                  onChange={(event) => form.setData('name', event.target.value)}
                  className={`mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 ${form.errors.name ? 'border-red-400' : 'border-gray-300'}`}
                  placeholder="e.g., First Curriculum"
                />
                {form.errors.name && (
                  <p className="mt-1 text-xs text-red-600">{form.errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600">Track</label>
                <input
                  type="text"
                  value={form.data.track}
                  onChange={(event) => form.setData('track', event.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="e.g., Academic"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600">Strand</label>
                <select
                  value={form.data.strand_id}
                  onChange={(event) => form.setData('strand_id', event.target.value)}
                  className={`mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 ${form.errors.strand_id ? 'border-red-400' : 'border-gray-300'}`}
                >
                  <option value="">All Strands</option>
                  {strands.map((strand) => (
                    <option key={strand.id} value={strand.id}>
                      {strand.Strand_name}
                    </option>
                  ))}
                </select>
                {form.errors.strand_id && (
                  <p className="mt-1 text-xs text-red-600">{form.errors.strand_id}</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-600">Effective School Year</label>
                  <input
                    type="text"
                    value={form.data.effective_sy}
                    onChange={(event) => form.setData('effective_sy', event.target.value)}
                    className={`mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 ${form.errors.effective_sy ? 'border-red-400' : 'border-gray-300'}`}
                    placeholder="2025-2026"
                  />
                  {form.errors.effective_sy && (
                    <p className="mt-1 text-xs text-red-600">{form.errors.effective_sy}</p>
                  )}
                </div>

              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600">Status</label>
                <select
                  value={form.data.is_active ? 'active' : 'inactive'}
                  onChange={(event) => form.setData('is_active', event.target.value === 'active')}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={form.processing}
                  className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {form.processing ? 'Saving...' : editing ? 'Update Curriculum' : 'Create Curriculum'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </RegistrarLayout>
  )
}
