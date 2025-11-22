import React, { useMemo, useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import FacultySidebar from '../Auth/Faculty_sidebar';

export default function CreditedSubjectsDetail({ enrollment = null, subjects = [], user }) {
	const [showAddForm, setShowAddForm] = useState(false);

	// Per-subject semester awareness for add form
	const [selectedSubjectId, setSelectedSubjectId] = useState('');
	const selectedSubject = useMemo(() => {
		return subjects.find(s => String(s.Id) === String(selectedSubjectId));
	}, [subjects, selectedSubjectId]);
	const isSelectedFirstSem = useMemo(() => {
		if (!selectedSubject) return true;
		const sem = String(selectedSubject.Semester ?? selectedSubject.semester ?? '').toLowerCase();
		return sem === '1' || sem.includes('1st');
	}, [selectedSubject]);

	const { data, setData, post, processing, reset, errors } = useForm({
		enrollment_id: enrollment?.id || '',
		subject_id: '',
		previous_school: enrollment?.previous_school || '',
		quarter1: '', // Q1 or Q3 depending on semester
		quarter2: '', // Q2 or Q4 depending on semester
	});

	const existing = enrollment?.credited_subjects || [];

	const createCredit = (e) => {
		e.preventDefault();
		post('/faculty/credited-subjects', {
			data: {
				enrollment_id: data.enrollment_id,
				subject_id: data.subject_id,
				previous_school: data.previous_school,
				quarter1: data.quarter1,
				quarter2: data.quarter2,
			},
			onSuccess: () => {
				reset({
					enrollment_id: enrollment.id,
					subject_id: '',
					previous_school: enrollment.previous_school || '',
					quarter1: '',
					quarter2: '',
				});
				setShowAddForm(false);
			},
			preserveScroll: true,
		});
	};

	if (!enrollment) {
		return (
			<div className="min-h-screen bg-gray-50 lg:flex">
				<FacultySidebar user={user} />
				<div className="flex-1 lg:ml-0">
					<Head title="Credit Subject - Not Found" />
					<div className="py-4 lg:py-6">
						<div className="max-w-full mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
							<div className="bg-white rounded-lg shadow border p-6 text-center">
								<p className="text-gray-600">Enrollment not found.</p>
								<Link
									href="/faculty/credited-subjects"
									className="mt-4 inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
								>
									Back to List
								</Link>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 lg:flex">
			<FacultySidebar user={user} />
			<div className="flex-1 lg:ml-0">
				<Head title={`Credit Subject - ${enrollment.student?.name}`} />

				<div className="py-4 lg:py-6">
					<div className="max-w-full mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
						<div className="mb-4 lg:mb-6">
							<Link
								href="/faculty/credited-subjects"
								className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors mb-2"
							>
								<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
								</svg>
								Back to List
							</Link>
							<h1 className="text-xl lg:text-2xl font-bold text-gray-900">Credit Subject</h1>
							<p className="mt-1 text-xs lg:text-sm text-gray-600">
								Manage credited subjects and grades for {enrollment.student?.name}. Entries remain pending until the registrar approves them.
							</p>
						</div>

						{/* Student Info Card */}
						<div className="bg-white rounded-lg shadow border p-4 mb-4">
							<div className="flex items-start justify-between">
								<div>
									<h2 className="text-lg font-semibold text-gray-900">{enrollment.student?.name}</h2>
									<div className="mt-1 space-y-1 text-sm text-gray-600">
										<div>Email: {enrollment.student?.email}</div>
										<div>LRN: {enrollment.student?.lrn}</div>
										{enrollment.assigned_strand?.code && (
											<div>Strand: {enrollment.assigned_strand.code} - {enrollment.assigned_strand.name}</div>
										)}
										{enrollment.school_year && enrollment.semester && (
											<div>{enrollment.school_year} • {enrollment.semester}</div>
										)}
										{enrollment.previous_school && (
											<div>Previous School: {enrollment.previous_school}</div>
										)}
									</div>
								</div>
							</div>
						</div>

						{/* Credits Management */}
						<div className="bg-white rounded-lg shadow border">
							<div className="px-4 py-3 border-b flex items-center justify-between">
								<h2 className="text-sm font-semibold text-gray-800">Credited Subjects</h2>
								<button
									type="button"
									onClick={() => setShowAddForm((v) => !v)}
									className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-indigo-500"
								>
									{showAddForm ? 'Close Form' : 'Add Credit Subject'}
								</button>
							</div>

							{showAddForm && (
								<form onSubmit={createCredit} className="p-4 border-b border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50">
									<div>
										<label className="block text-xs font-medium text-gray-700 mb-1">Subject</label>
										<select
											value={data.subject_id}
											onChange={(e) => { setData('subject_id', e.target.value); setSelectedSubjectId(e.target.value) }}
											className="w-full border rounded px-3 py-2 text-sm"
											required
										>
											<option value="">Select subject</option>
											{subjects.map((s) => (
												<option key={s.Id} value={s.Id}>
													{s.Subject_name} ({s.Subject_code})
												</option>
											))}
										</select>
										{errors.subject_id && <p className="text-xs text-red-600 mt-1">{errors.subject_id}</p>}
									</div>
									<div>
										<label className="block text-xs font-medium text-gray-700 mb-1">
											Previous School
											<span className="text-xs text-green-600 font-normal ml-1">(Auto-filled from registration)</span>
										</label>
										<input
											type="text"
											value={data.previous_school}
											onChange={(e) => setData('previous_school', e.target.value)}
											className="w-full border rounded px-3 py-2 text-sm bg-green-50 border-green-200"
											placeholder="School name"
											title="This field is automatically populated from the student's registration data"
										/>
										{errors.previous_school && <p className="text-xs text-red-600 mt-1">{errors.previous_school}</p>}
										{data.previous_school && (
											<p className="text-xs text-green-600 mt-1">✓ Automatically populated from student registration</p>
										)}
									</div>
									<div className="grid grid-cols-2 gap-2">
										<label className="block text-xs font-medium text-gray-700 col-span-2">
											{isSelectedFirstSem ? '1st & 2nd Quarter' : '3rd & 4th Quarter'}
										</label>
										<input
											type="number"
											min="0"
											max="100"
											step="0.01"
											value={data.quarter1}
											onChange={(e) => setData('quarter1', e.target.value)}
											className="border rounded px-3 py-2 text-sm"
											placeholder={isSelectedFirstSem ? 'Q1' : 'Q3'}
											required
										/>
										<input
											type="number"
											min="0"
											max="100"
											step="0.01"
											value={data.quarter2}
											onChange={(e) => setData('quarter2', e.target.value)}
											className="border rounded px-3 py-2 text-sm"
											placeholder={isSelectedFirstSem ? 'Q2' : 'Q4'}
											required
										/>
									</div>
									<div className="md:col-span-3 flex justify-end">
										<button
											type="submit"
											disabled={processing || !data.subject_id || data.quarter1 === '' || data.quarter2 === ''}
											className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 text-sm"
										>
											{processing ? 'Saving...' : 'Save Credit Subject (Pending Approval)'}
										</button>
									</div>
								</form>
							)}

							{existing.length === 0 ? (
								<div className="p-4 text-sm text-gray-600">No credited subjects yet.</div>
							) : (
								<div className="overflow-x-auto">
									<table className="min-w-full divide-y divide-gray-200 text-sm">
										<thead className="bg-gray-50">
											<tr>
												<th className="px-3 py-2 text-left font-semibold text-gray-600">Subject</th>
												<th className="px-3 py-2 text-left font-semibold text-gray-600">Code</th>
												<th className="px-3 py-2 text-left font-semibold text-gray-600">Q1/Q3</th>
												<th className="px-3 py-2 text-left font-semibold text-gray-600">Q2/Q4</th>
												<th className="px-3 py-2 text-left font-semibold text-gray-600">Avg</th>
												<th className="px-3 py-2 text-left font-semibold text-gray-600">Remarks</th>
												<th className="px-3 py-2 text-left font-semibold text-gray-600">Status</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-gray-200 bg-white">
											{existing.map((c) => (
												<CreditRow key={c.id} credit={c} />
											))}
										</tbody>
									</table>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function CreditRow({ credit }) {
	const avg = credit.credited_grade ?? '';
	const isApproved = !!credit.approved_by;
	const hasCoordinatorSubmission = !!credit.credited_by;

	return (
		<tr className="align-top">
			<td className="px-3 py-2">
				<div className="font-medium text-gray-900">{credit.subject_name}</div>
				<div className="text-xs text-gray-500">Prev School: {credit.previous_school || ''}</div>
			</td>
			<td className="px-3 py-2 text-gray-700">{credit.subject_code}</td>
			<td className="px-3 py-2">{credit.quarter1 ?? '—'}</td>
			<td className="px-3 py-2">{credit.quarter2 ?? '—'}</td>
			<td className="px-3 py-2">{avg || '—'}</td>
			<td className="px-3 py-2 text-sm">{credit.remarks || '—'}</td>
			<td className="px-3 py-2 text-gray-600 text-sm">
				{isApproved ? (
					<div className="text-xs flex flex-col">
						<span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700 border border-green-200">
							Approved by Registrar
						</span>
						{credit.credited_at && (
							<span className="mt-0.5 text-[10px] text-gray-500">on {credit.credited_at}</span>
						)}
					</div>
				) : hasCoordinatorSubmission ? (
					<div className="text-xs">
						<span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 border border-amber-200">
							Pending Registrar Approval
						</span>
					</div>
				) : (
					<div className="text-xs">
						<span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-600 border border-gray-200">
							Draft
						</span>
					</div>
				)}
			</td>
		</tr>
	);
}
