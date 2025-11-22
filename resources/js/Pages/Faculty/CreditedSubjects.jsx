import React, { useMemo, useState } from 'react'
import { Head, Link } from '@inertiajs/react'
import FacultySidebar from '../Auth/Faculty_sidebar'

export default function CreditedSubjects({ enrollments = [], user }) {
  const [search, setSearch] = useState('')

  const metrics = useMemo(() => {
    const total = enrollments.length
    let totalCredits = 0
    let pending = 0
    let approved = 0
    enrollments.forEach((enrollment) => {
      const credits = enrollment.credited_subjects || []
      totalCredits += credits.length
      pending += credits.filter((c) => c.credited_by && !c.approved_by).length
      approved += credits.filter((c) => c.approved_by).length
    })
    const drafts = totalCredits - (pending + approved)
    return { total, totalCredits, pending, approved, drafts }
  }, [enrollments])

  const filteredEnrollments = useMemo(() => {
    if (!search.trim()) return enrollments
    const q = search.toLowerCase()
    return enrollments.filter((enrollment) => {
      const name = enrollment.student?.name?.toLowerCase() ?? ''
      const lrn = enrollment.student?.lrn?.toLowerCase() ?? ''
      const email = enrollment.student?.email?.toLowerCase() ?? ''
      return name.includes(q) || lrn.includes(q) || email.includes(q)
    })
  }, [search, enrollments])

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      <FacultySidebar user={user} />
      <div className="flex-1 lg:ml-0">
        <Head title="Credit Subject (Coordinator)" />

        <header className="relative overflow-hidden border-b border-gray-200 bg-gradient-to-r from-[#000825] via-[#14234f] to-[#1f2c6e] px-6 py-6 text-white">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -right-16 top-0 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          </div>
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <Link
                href="/faculty/enrollments"
                className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 hover:bg-white/20"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Coordinator Hub
              </Link>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Credit Subject (Transferees)</h1>
                <p className="mt-1 text-sm text-white/80 max-w-3xl">
                  Track transferee submissions, add pending credited subjects, and monitor what still needs registrar approval.
                  Coordinators can only submit entries—final approval remains with the registrar.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
              {[/* eslint-disable-next-line */
                { label: 'Transferees', value: metrics.total },
                { label: 'Credits Logged', value: metrics.totalCredits },
                { label: 'Pending Approval', value: metrics.pending },
                { label: 'Approved', value: metrics.approved },
              ].map((card) => (
                <div key={card.label} className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-xs uppercase tracking-wider text-white/70">{card.label}</p>
                  <p className="mt-1 text-2xl font-semibold text-white">{card.value}</p>
                </div>
              ))}
            </div>
          </div>
        </header>

        <div className="px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, LRN, or email..."
                className="w-full rounded-xl border border-gray-200 pl-11 pr-3 py-2.5 text-sm shadow-sm placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-gray-600">
              <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 font-medium">
                Pending entries turn amber until the registrar approves them.
              </span>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 pb-8">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="px-4 py-3 border-b">
              <h2 className="text-sm font-semibold text-gray-800">Transferee Enrollments</h2>
            </div>
            {filteredEnrollments.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                {search ? 'No transferees match your search.' : 'No transferee enrollments found.'}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredEnrollments.map((enrollment) => {
                  const creditedCount = enrollment.credited_subjects?.length || 0
                  const approvedCount = enrollment.credited_subjects?.filter((c) => c.approved_by)?.length || 0
                  const pendingCount = enrollment.credited_subjects?.filter((c) => c.credited_by && !c.approved_by)?.length || 0

                  return (
                    <Link
                      key={enrollment.id}
                      href={`/faculty/credited-subjects/${enrollment.id}`}
                      className="block p-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1">
                          <p className="text-base font-semibold text-gray-900">{enrollment.student?.name}</p>
                          <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-600">
                            <span>{enrollment.student?.email}</span>
                            {enrollment.student?.lrn && <span>LRN: {enrollment.student.lrn}</span>}
                            {enrollment.assigned_strand?.code && <span>Strand: {enrollment.assigned_strand.code}</span>}
                            {enrollment.school_year && <span>{enrollment.school_year}</span>}
                            {enrollment.semester && <span>{enrollment.semester}</span>}
                            {enrollment.previous_school && <span>Prev: {enrollment.previous_school}</span>}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs font-medium">
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-gray-800">
                            Credits: {creditedCount}
                          </span>
                          {pendingCount > 0 && (
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-amber-700">
                              Pending: {pendingCount}
                            </span>
                          )}
                          {approvedCount > 0 && (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-green-700">
                              Approved: {approvedCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
