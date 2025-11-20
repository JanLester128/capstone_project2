import React from 'react'
import { Head, Link, usePage } from '@inertiajs/react'
import FacultySidebar from '../Auth/Faculty_sidebar'

export default function EnrollmentHub() {
	const { props } = usePage()
	const { activeSchoolYear, activeSemester, links, counts = {}, user = {} } = props

	return (
		<div className="min-h-screen bg-gray-50 flex">
			<FacultySidebar user={user} />
			<div className="flex-1 flex flex-col">
				<Head title="Coordinator • Enrollment" />
				<header className="bg-white shadow">
					<div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
						<h1 className="text-2xl font-bold tracking-tight text-gray-900">Enrollment</h1>
						<p className="mt-1 text-xs text-gray-600">
							{activeSchoolYear ? `School Year: ${activeSchoolYear.label}` : 'No active school year'}
							{activeSemester ? ` • ${activeSemester.label}` : ''}
						</p>
					</div>
				</header>

				<main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<Link
							href={links?.enrollments || '/faculty/enrollments/manage'}
							className="block rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition"
						>
							<div className="flex items-center justify-between">
								<h2 className="text-sm font-semibold text-gray-900">Process New/Current Enrollments</h2>
								<div className="flex items-center gap-2">
									{(counts?.pendingEnrollments || 0) > 0 && (
										<span className="inline-flex items-center justify-center min-w-[18px] h-4 px-1.5 rounded-full bg-red-600 text-white text-[10px]">
											{counts.pendingEnrollments}
										</span>
									)}
									<span className="text-[10px] text-purple-600">Go</span>
								</div>
							</div>
							<p className="mt-1 text-xs text-gray-600">
								Review pre-enrolled/recommended students and approve enrollment.
							</p>
						</Link>

						<Link
							href={links?.reEnroll || '/faculty/re-enroll-students'}
							className="block rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition"
						>
							<div className="flex items-center justify-between">
								<h2 className="text-sm font-semibold text-gray-900">Re-enroll Students</h2>
								<div className="flex items-center gap-2">
									{(counts?.reEnrollments || 0) > 0 && (
										<span className="inline-flex items-center justify-center min-w-[18px] h-4 px-1.5 rounded-full bg-red-600 text-white text-[10px]">
											{counts.reEnrollments}
										</span>
									)}
									<span className="text-[10px] text-purple-600">Go</span>
								</div>
							</div>
							<p className="mt-1 text-xs text-gray-600">
								Move enrolled students to the next term and assign strand/section.
							</p>
						</Link>
					</div>
				</main>
			</div>
		</div>
	)
}

