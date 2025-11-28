import React from 'react'
import { Head, Link } from '@inertiajs/react'
import RegistrarLayout from './Layout'

export default function CreditedSubjects({ enrollments = [] }) {
  return (
    <RegistrarLayout>
      <Head title="Credit Subject (Transferees)" />

      <div className="py-4 lg:py-6">
        <div className="max-w-full mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
          <div className="mb-4 lg:mb-6">
            <Link
              href="/registrar/enrollment"
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors mb-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Link>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Credit Subject</h1>
            <p className="mt-1 text-xs lg:text-sm text-gray-600">
              Select a transferee student to manage their credited subjects and grades.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow border">
            <div className="px-4 py-3 border-b">
              <h2 className="text-sm font-semibold text-gray-800">Transferee Enrollments</h2>
            </div>

            {enrollments.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500">
                No transferee enrollments found.
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {enrollments.map((enrollment) => {
                  const creditedCount = enrollment.credited_subjects?.length || 0
                  const approvedCount = enrollment.credited_subjects?.filter((c) => c.approved_by)?.length || 0

                  return (
                    <Link
                      key={enrollment.id}
                      href={`/registrar/credited-subjects/${enrollment.id}`}
                      className="block p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{enrollment.student?.name}</div>
                              <div className="text-xs text-gray-600 mt-0.5">{enrollment.student?.email}</div>
                              <div className="text-xs text-gray-600 mt-0.5">LRN: {enrollment.student?.lrn}</div>
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                            {enrollment.assigned_strand?.code && (
                              <span className="inline-flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                {enrollment.assigned_strand.code}
                              </span>
                            )}
                            {enrollment.school_year && (
                              <span className="inline-flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {enrollment.school_year}
                              </span>
                            )}
                            {enrollment.semester && <span>{enrollment.semester}</span>}
                            {enrollment.previous_school && (
                              <span className="inline-flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                Prev: {enrollment.previous_school}
                              </span>
                            )}
                          </div>
                          {creditedCount > 0 && (
                            <div className="mt-2 flex items-center gap-4 text-xs">
                              <span className="text-gray-600">
                                Credited Subjects: <span className="font-medium text-gray-900">{creditedCount}</span>
                              </span>
                              {approvedCount > 0 && (
                                <span className="text-green-600">
                                  Approved: <span className="font-medium">{approvedCount}</span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
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
    </RegistrarLayout>
  )
}
