import { Head, Link, useForm } from '@inertiajs/react'
import RegistrarLayout from './Layout'
import { formatDateTimeMedium } from '../../utils/dateFormatter'

const formatNumberDisplay = (value) => {
  if (value === null || value === undefined || value === '') return '--'
  const num = Number(value)
  if (Number.isNaN(num)) return '--'
  return num.toFixed(2)
}

const numberOrEmpty = (value) => (value === null || value === undefined ? '' : value)

export default function EditApprovedGrade({ grade }) {
  const {
    data,
    setData,
    put,
    processing,
    errors,
    reset,
  } = useForm({
    first_quarter: numberOrEmpty(grade.first_quarter),
    second_quarter: numberOrEmpty(grade.second_quarter),
    third_quarter: numberOrEmpty(grade.third_quarter),
    fourth_quarter: numberOrEmpty(grade.fourth_quarter),
    summer_grade: numberOrEmpty(grade.summer_grade),
    semester_grade: numberOrEmpty(grade.semester_grade),
    needs_summer_class: grade.needs_summer_class || false,
    is_prerequisite_failed: grade.is_prerequisite_failed || false,
  })

  const handleNumberChange = (field, value) => {
    setData(field, value === '' ? '' : Number(value))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    put(`/registrar/grades/${grade.id}`)
  }

  const renderInput = (label, field, placeholder) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={field}>
        {label}
      </label>
      <input
        id={field}
        type="number"
        step="0.01"
        min="0"
        max="100"
        value={data[field]}
        onChange={(e) => handleNumberChange(field, e.target.value)}
        className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors[field] ? 'border-red-300' : 'border-gray-300'}`}
        placeholder={placeholder}
      />
      {errors[field] && <p className="mt-1 text-sm text-red-600">{errors[field]}</p>}
    </div>
  )

  return (
    <RegistrarLayout>
      <Head title="Edit Approved Grade - Registrar" />
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Edit Approved Grade</h1>
              <p className="text-sm text-gray-600 mt-1">
                Update grade details for {grade.student.name} • {grade.subject.name}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/registrar/grades/approved"
                className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => reset()}
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={processing}
                className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {processing ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <section className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100">
              <p className="text-xs font-semibold uppercase text-gray-500 mb-2">Student & Subject</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Student</p>
                  <p className="font-semibold text-gray-900">{grade.student.name}</p>
                  <p className="text-gray-500 text-xs">LRN: {grade.student.lrn || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Subject</p>
                  <p className="font-semibold text-gray-900">{grade.subject.code} • {grade.subject.name}</p>
                  <p className="text-gray-500 text-xs">Faculty: {grade.class.faculty || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Term</p>
                  <p className="font-semibold text-gray-900">{grade.school_year}</p>
                  <p className="text-gray-500 text-xs">Semester: {grade.semester}</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Approved By</p>
                <p className="font-semibold text-gray-900">{grade.approved_by}</p>
              </div>
              <div>
                <p className="text-gray-500">Last Approved At</p>
                <p className="font-semibold text-gray-900">{formatDateTimeMedium(grade.approved_at)}</p>
              </div>
              <div>
                <p className="text-gray-500">Original Failed Grade</p>
                <p className="font-semibold text-gray-900">{formatNumberDisplay(grade.original_failed_grade)}</p>
              </div>
              <div>
                <p className="text-gray-500">Current Remarks (auto)</p>
                <p className="font-semibold text-gray-900">{grade.remarks || '—'}</p>
              </div>
            </div>
          </section>

          <section className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Grade Breakdown</h2>
              <p className="text-sm text-gray-500">Update the quarterly and semester grades as needed.</p>
            </div>
            <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {renderInput('First Quarter', 'first_quarter', 'e.g. 85')}
              {renderInput('Second Quarter', 'second_quarter', 'e.g. 90')}
              {renderInput('Third Quarter', 'third_quarter', 'e.g. 88')}
              {renderInput('Fourth Quarter', 'fourth_quarter', 'e.g. 91')}
              {renderInput('Summer Grade', 'summer_grade', 'Only for summer')} 
              {renderInput('Semester Grade (Final)', 'semester_grade', 'Auto if left blank')}
            </div>
          </section>

          <section className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Academic Standing</h2>
                <p className="text-sm text-gray-500">Adjust registrar-level requirements.</p>
              </div>
            </div>
            <div className="px-6 py-6 space-y-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <label className="inline-flex items-center text-sm text-gray-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    checked={data.needs_summer_class}
                    onChange={(e) => setData('needs_summer_class', e.target.checked)}
                  />
                  <span className="ml-2">Needs summer class</span>
                </label>
                <label className="inline-flex items-center text-sm text-gray-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    checked={data.is_prerequisite_failed}
                    onChange={(e) => setData('is_prerequisite_failed', e.target.checked)}
                  />
                  <span className="ml-2">Prerequisite failed</span>
                </label>
              </div>
              {(errors.needs_summer_class || errors.is_prerequisite_failed) && (
                <p className="text-sm text-red-600">
                  {errors.needs_summer_class || errors.is_prerequisite_failed}
                </p>
              )}
            </div>
          </section>
        </main>
      </form>
    </RegistrarLayout>
  )
}
