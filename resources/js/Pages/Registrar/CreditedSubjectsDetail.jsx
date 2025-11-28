import React, { useMemo, useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import RegistrarLayout from './Layout';

export default function CreditedSubjectsDetail({ enrollment = null, subjects = [] }) {
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

	const isTransferee = Boolean(enrollment?.is_transferee);
	const hasCreditedSubjects = Boolean(enrollment?.has_credited_subjects);
	const allCreditsApproved = Boolean(enrollment?.all_credits_approved);
	const canProceedToEnroll = Boolean(enrollment?.can_enroll);
	const statusAllowsEnrollment = ['pre_enrolled', 'recommended'].includes(enrollment?.status);
	const isAlreadyEnrolled = enrollment?.status === 'enrolled';

	const transfereeStatusMessage = (() => {
		if (!isTransferee) return '';
		if (isAlreadyEnrolled) {
			return 'Student is already enrolled. You can view the COR via the button on the right.';
		}
		if (canProceedToEnroll) {
			return '✓ All credited subjects are approved. You may proceed to enrollment now.';
		}
		if (!hasCreditedSubjects) {
			return 'Add at least one credited subject to unlock the enrollment step.';
		}
		if (!allCreditsApproved) {
			return 'Approve or complete grades for every credited subject before enrolling.';
		}
		if (!statusAllowsEnrollment) {
			return 'Enrollment can only proceed once the student is pre-enrolled or recommended.';
		}
		return 'Complete the crediting workflow to enable the enrollment action.';
	})();

	const createCredit = (e) => {
		e.preventDefault();
		post('/registrar/credited-subjects', {
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
			<RegistrarLayout>
				<Head title="Credit Subject - Not Found" />
				<div className="py-4 lg:py-6">
					<div className="max-w-full mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
						<div className="bg-white rounded-lg shadow border p-6 text-center">
							<p className="text-gray-600">Enrollment not found.</p>
							<Link
								href="/registrar/credited-subjects"
								className="mt-4 inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
							>
								<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
								</svg>
								Back to List
							</Link>
						</div>
					</div>
				</div>
			</RegistrarLayout>
		);
	}

	return (
		<RegistrarLayout>
			<Head title={`Credit Subject - ${enrollment.student?.name}`} />

			<div className="py-4 lg:py-6">
				<div className="max-w-full mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
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

					{isTransferee && (
						<div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
							<div className="flex flex-wrap items-center justify-between gap-3">
								<div>
									<p className="text-xs font-semibold uppercase tracking-wide text-amber-900">Transferee Workflow</p>
									<p className="text-sm text-amber-800">1) Credit Subjects → 2) Enroll → 3) Print COR</p>
								</div>
								<a
									href={enrollment?.cor_url}
									target="_blank"
									rel="noopener noreferrer"
									className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${canProceedToEnroll ? 'bg-indigo-600 text-white hover:bg-indigo-500 focus:ring-indigo-500' : 'border border-amber-200 bg-white text-amber-600 focus:ring-amber-400'}`}
									title={canProceedToEnroll ? 'Ready to proceed' : transfereeStatusMessage}
								>
									<svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
										<path d="M4 4a2 2 0 0 1 2-2h6l4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4Z" />
									</svg>
									{isAlreadyEnrolled ? 'View COR' : 'Proceed to Enroll'}
								</a>
							</div>
							<p className={`mt-3 text-sm ${canProceedToEnroll ? 'text-green-800' : 'text-amber-800'}`}>
								{transfereeStatusMessage}
							</p>
							<div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium">
								<span className={`inline-flex items-center rounded-full px-2.5 py-0.5 ${hasCreditedSubjects ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-white text-amber-800 border border-amber-200'}`}>
									{hasCreditedSubjects ? '✓ Subjects Credited' : 'Step 1 · Credit Subjects'}
								</span>
								<span className={`inline-flex items-center rounded-full px-2.5 py-0.5 ${allCreditsApproved ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-white text-amber-800 border border-amber-200'}`}>
									{allCreditsApproved ? '✓ Registrar Approved' : 'Step 2 · Await Approval'}
								</span>
								<span className={`inline-flex items-center rounded-full px-2.5 py-0.5 ${canProceedToEnroll ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-white text-gray-600 border border-gray-200'}`}>
									{canProceedToEnroll ? 'Ready to Enroll' : 'Step 3 · Proceed to Enroll'}
								</span>
							</div>
						</div>
					)}

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
										{processing ? 'Saving...' : 'Save Credit Subject'}
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
											<th className="px-3 py-2 text-left font-semibold text-gray-600">Credited By / Status</th>
											<th className="px-3 py-2 text-right font-semibold text-gray-600">Actions</th>
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
		</RegistrarLayout>
	);
}

function CreditRow({ credit }) {
	const initialAvg = credit.credited_grade ?? '';
	const { put, delete: destroy, processing, setData, data } = useForm({
		quarter1: credit.quarter1 ?? '',
		quarter2: credit.quarter2 ?? '',
		avg: initialAvg,
	});

	const isApproved = !!credit.approved_by;
	const hasCoordinatorSubmission = !!credit.credited_by;

	const isFirstSem = (() => {
		const sem = String(credit.subject_semester ?? '').toLowerCase();
		return sem === '1' || sem.includes('1st');
	})();

	const computedAvg = useMemo(() => {
		const q1 = parseFloat(data.quarter1);
		const q2 = parseFloat(data.quarter2);
		return Number.isFinite(q1) && Number.isFinite(q2) ? ((q1 + q2) / 2).toFixed(2) : (initialAvg || '');
	}, [data.quarter1, data.quarter2, initialAvg]);

	const computedRemarks = useMemo(() => {
		if (credit.remarks && String(credit.remarks).trim() !== '') {
			return credit.remarks;
		}

		const q1 = parseFloat(data.quarter1);
		const q2 = parseFloat(data.quarter2);
		const avgFromInputs = Number.isFinite(q1) && Number.isFinite(q2) ? (q1 + q2) / 2 : NaN;
		const gradeNum = credit.credited_grade !== null && credit.credited_grade !== undefined
			? parseFloat(credit.credited_grade)
			: NaN;

		const basis = Number.isFinite(gradeNum) ? gradeNum : avgFromInputs;
		if (!Number.isFinite(basis)) return '';
		return basis >= 75 ? 'Passed' : 'Failed';
	}, [credit.remarks, credit.credited_grade, data.quarter1, data.quarter2]);

	const update = () => {
		put(`/registrar/credited-subjects/${credit.id}`, {
			preserveScroll: true,
		});
	};

	const remove = () => {
		if (confirm('Are you sure you want to delete this credited subject?')) {
			destroy(`/registrar/credited-subjects/${credit.id}`, {
				preserveScroll: true,
			});
		}
	};

	return (
		<tr className="align-top">
			<td className="px-3 py-2">
				<div className="font-medium text-gray-900">{credit.subject_name}</div>
				<div className="text-xs text-gray-500">Prev School: {credit.previous_school || ''}</div>
			</td>
			<td className="px-3 py-2 text-gray-700">{credit.subject_code}</td>
			<td className="px-3 py-2">
				<input
					type="number"
					min="0"
					max="100"
					step="0.01"
					value={data.quarter1}
					onChange={(e) => setData('quarter1', e.target.value)}
					disabled={isApproved}
					className={`w-20 border rounded px-2 py-1 ${isApproved ? 'bg-gray-100' : ''}`}
					placeholder={isFirstSem ? 'Q1' : 'Q3'}
				/>
			</td>
			<td className="px-3 py-2">
				<input
					type="number"
					min="0"
					max="100"
					step="0.01"
					value={data.quarter2}
					onChange={(e) => setData('quarter2', e.target.value)}
					disabled={isApproved}
					className={`w-20 border rounded px-2 py-1 ${isApproved ? 'bg-gray-100' : ''}`}
					placeholder={isFirstSem ? 'Q2' : 'Q4'}
				/>
			</td>
			<td className="px-3 py-2">{computedAvg}</td>
			<td className="px-3 py-2 text-sm">{computedRemarks}</td>
			<td className="px-3 py-2 text-gray-600 text-sm">
				{hasCoordinatorSubmission && (
					<div className="text-xs mb-1">
						<span className="font-medium">Coordinator:</span>{' '}
						{credit.credited_by?.name || ''}
					</div>
				)}

				{isApproved ? (
					<div className="text-xs flex flex-col">
						<span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700 border border-green-200">
							Approved
						</span>
						{credit.credited_at && (
							<span className="mt-0.5 text-[10px] text-gray-500">on {credit.credited_at}</span>
						)}
					</div>
				) : hasCoordinatorSubmission ? (
					<div className="text-xs">
						<span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 border border-amber-200">
							Awaiting registrar approval
						</span>
					</div>
				) : (
					<div className="text-xs">
						<span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-600 border border-gray-200">
							Registrar draft
						</span>
					</div>
				)}
			</td>
			<td className="px-3 py-2 text-right">
				<div className="inline-flex items-center gap-2">
					{!isApproved && (
						<button
							onClick={update}
							disabled={processing}
							className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-xs"
						>
							{hasCoordinatorSubmission ? 'Approve' : 'Save'}
						</button>
					)}
					<button
						onClick={remove}
						disabled={processing || isApproved}
						className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-xs"
					>
						Delete
					</button>
				</div>
			</td>
		</tr>
	);
}

