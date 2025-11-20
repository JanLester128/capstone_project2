import React, { useMemo, useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import FacultySidebar from '../Auth/Faculty_sidebar';

export default function CreditedSubjects({ enrollments = [], subjects = [], user }) {
	const [selectedEnrollmentId, setSelectedEnrollmentId] = useState(null);
	const [showAddForm, setShowAddForm] = useState(false);
	const selectedEnrollment = useMemo(() => enrollments.find(e => e.id === selectedEnrollmentId) || null, [enrollments, selectedEnrollmentId]);

	return (
		<div className="min-h-screen bg-gray-50 lg:flex">
			<FacultySidebar user={user} />
			<div className="flex-1">
				<Head title="Credit Subject (Coordinator)" />
				<div className="py-4 lg:py-6">
					<div className="max-w-full mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
						<div className="mb-4">
							<h1 className="text-xl lg:text-2xl font-bold text-gray-900">Credit Subject</h1>
							<p className="mt-1 text-xs lg:text-sm text-gray-600">
								Select a transferee enrollment and submit credited subjects. Entries remain pending until the registrar approves them.
							</p>
						</div>
						<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
							<div className="lg:col-span-1 bg-white rounded-lg border">
								<div className="px-4 py-3 border-b">
									<h2 className="text-sm font-semibold text-gray-800">Transferee Enrollments</h2>
								</div>
								<div className="max-h-[28rem] overflow-y-auto divide-y">
									{enrollments.length === 0 && <div className="p-4 text-sm text-gray-500">No transferee enrollments found.</div>}
									{enrollments.map((e) => (
										<button key={e.id} onClick={() => setSelectedEnrollmentId(e.id)} className={`w-full text-left p-4 hover:bg-gray-50 ${selectedEnrollmentId === e.id ? 'bg-blue-50' : ''}`}>
											<div className="font-medium text-gray-900">{e.student?.name}</div>
											<div className="text-xs text-gray-600">{e.student?.email}</div>
											<div className="text-xs text-gray-600">LRN: {e.student?.lrn}</div>
											<div className="mt-1 text-xs text-gray-500">
												{e.assigned_strand?.code} • {e.school_year} • {e.semester}
											</div>
											{e.previous_school && <div className="mt-1 text-xs text-gray-500">Prev: {e.previous_school}</div>}
										</button>
									))}
								</div>
							</div>
							<div className="lg:col-span-2">
								{!selectedEnrollment ? (
									<div className="bg-white rounded-lg border p-6 text-sm text-gray-600">Select a transferee from the left.</div>
								) : (
									<EnrollmentCreditsPanel
										enrollment={selectedEnrollment}
										subjects={subjects}
										showAddForm={showAddForm}
										setShowAddForm={setShowAddForm}
									/>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function EnrollmentCreditsPanel({ enrollment, subjects, showAddForm, setShowAddForm }) {
	const [selectedSubjectId, setSelectedSubjectId] = useState('');
	const selectedSubject = useMemo(() => subjects.find(s => String(s.Id) === String(selectedSubjectId)), [subjects, selectedSubjectId]);
	const isSelectedFirstSem = useMemo(() => {
		if (!selectedSubject) return true;
		const sem = String(selectedSubject.Semester ?? selectedSubject.semester ?? '').toLowerCase();
		return sem === '1' || sem.includes('1st');
	}, [selectedSubject]);

	const { data, setData, post, processing, reset, errors } = useForm({
		enrollment_id: enrollment.id,
		subject_id: '',
		previous_school: enrollment.previous_school || '',
		quarter1: '',
		quarter2: '',
	});

	const existing = enrollment.credited_subjects || [];

	const submitCredit = (e) => {
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
			},
			preserveScroll: true,
		});
	};

	return (
		<div className="space-y-4">
			<div className="bg-white rounded-lg border">
				<div className="px-4 py-3 border-b flex items-center justify-between">
					<h2 className="text-sm font-semibold text-gray-800">Existing Credits</h2>
					<button
						type="button"
						onClick={() => setShowAddForm((v) => !v)}
						className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-indigo-500"
					>
						{showAddForm ? 'Close Credit Subject' : 'Add Credit Subject'}
					</button>
				</div>

				{showAddForm && (
					<form onSubmit={submitCredit} className="p-4 border-b border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50">
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
							<label className="block text-xs font-medium text-gray-700 mb-1">Previous School</label>
							<input
								type="text"
								value={data.previous_school}
								onChange={(e) => setData('previous_school', e.target.value)}
								className="w-full border rounded px-3 py-2 text-sm"
								placeholder="School name"
							/>
							{errors.previous_school && <p className="text-xs text-red-600 mt-1">{errors.previous_school}</p>}
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
								{processing ? 'Submitting...' : 'Save Credit Subject'}
							</button>
						</div>
					</form>
				)}

				<div className="px-4 py-3 border-b flex items-center justify-between">
					<h2 className="text-xs font-medium text-gray-600">Credited Subjects</h2>
				</div>
				{(existing || []).length === 0 ? (
					<div className="p-4 text-sm text-gray-600">No credited subjects yet.</div>
				) : (
					<div className="divide-y divide-gray-200">
						{existing.map((c) => (
							<CreditRow key={c.id} credit={c} />
						))}
					</div>
				)}
			</div>
		</div>
	);
}

function CreditRow({ credit }) {
	const [showGradeForm, setShowGradeForm] = useState(false);
	const isApproved = !!credit.is_approved;
	const isSubmitted = !!credit.is_submitted; // Check if submitted (credited_by is set)
	const canEdit = !isApproved && !isSubmitted; // Cannot edit if approved or submitted
	const form = useForm({ quarter1: credit.quarter1 ?? '', quarter2: credit.quarter2 ?? '', remarks: credit.remarks ?? '' });
	const avg = useMemo(() => {
		const q1 = parseFloat(form.data.quarter1);
		const q2 = parseFloat(form.data.quarter2);
		return Number.isFinite(q1) && Number.isFinite(q2) ? ((q1 + q2) / 2).toFixed(2) : (credit.credited_grade ?? '—');
	}, [form.data.quarter1, form.data.quarter2, credit.credited_grade]);

	const handleSave = (e) => {
		e.preventDefault();
		form.put(`/faculty/credited-subjects/${credit.id}`, { 
			preserveScroll: true,
			onSuccess: () => {
				setShowGradeForm(false);
			}
		});
	};

	return (
		<div className="px-4 py-3 hover:bg-gray-50">
			<div className="flex items-center justify-between">
				<div className="flex-1">
					<div className="font-medium text-gray-900 text-sm">
						{credit.subject_name}
						{isApproved && (
							<span className="ml-2 text-xs font-semibold text-green-600">(Approved)</span>
						)}
					</div>
					{credit.previous_school && (
						<div className="text-xs text-gray-500 mt-0.5">Prev: {credit.previous_school}</div>
					)}
				</div>
				<div className="ml-4">
					<button
						type="button"
						onClick={() => setShowGradeForm(!showGradeForm)}
						className={`px-4 py-2 rounded-md text-xs font-medium transition-colors ${
							canEdit 
								? 'bg-indigo-600 text-white hover:bg-indigo-700' 
								: 'bg-gray-400 text-white cursor-not-allowed'
						}`}
						disabled={!canEdit && !showGradeForm}
					>
						{showGradeForm ? 'Close' : canEdit ? 'View / Input Grades' : 'View Only (Submitted)'}
					</button>
				</div>
			</div>
			
			{showGradeForm && (
				<div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
					<form onSubmit={handleSave} className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
							<div>
								<label className="block text-xs font-medium text-gray-700 mb-1">Subject Code</label>
								<div className="text-sm text-gray-900 font-medium">{credit.subject_code}</div>
							</div>
							<div>
								<label className="block text-xs font-medium text-gray-700 mb-1">Q1/Q3</label>
								<input
									type="number"
									min="0"
									max="100"
									step="0.01"
									value={form.data.quarter1}
									onChange={(e) => form.setData('quarter1', e.target.value)}
									className={`w-full border rounded px-3 py-2 text-sm ${
										!canEdit ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
									}`}
									placeholder="Enter grade"
									disabled={!canEdit}
									readOnly={!canEdit}
								/>
							</div>
							<div>
								<label className="block text-xs font-medium text-gray-700 mb-1">Q2/Q4</label>
								<input
									type="number"
									min="0"
									max="100"
									step="0.01"
									value={form.data.quarter2}
									onChange={(e) => form.setData('quarter2', e.target.value)}
									className={`w-full border rounded px-3 py-2 text-sm ${
										!canEdit ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
									}`}
									placeholder="Enter grade"
									disabled={!canEdit}
									readOnly={!canEdit}
								/>
							</div>
							<div>
								<label className="block text-xs font-medium text-gray-700 mb-1">Average</label>
								<div className="text-sm font-medium text-gray-900 py-2">{avg}</div>
							</div>
						</div>
						<div>
							<label className="block text-xs font-medium text-gray-700 mb-1">Remarks</label>
							<div className="text-sm text-gray-700">
								{isApproved
									? (credit.remarks || 'CREDITED')
									: (avg !== '' && avg !== '—' ? (parseFloat(avg) >= 75 ? 'Passed' : 'Failed') : 'No Grades')}
							</div>
						</div>
						{isApproved && (
							<div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
								<span className="font-medium">Approved by Registrar</span>
								{credit.credited_at && (
									<span className="ml-2 text-gray-600">on {credit.credited_at}</span>
								)}
							</div>
						)}
						{isSubmitted && !isApproved && (
							<div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
								<span className="font-medium">Submitted - Pending Registrar Approval</span>
								<p className="mt-1 text-gray-600">This credit has been submitted and cannot be edited. Please wait for registrar approval.</p>
							</div>
						)}
						{canEdit && (
							<div className="flex justify-end">
								<button
									type="submit"
									disabled={form.processing}
									className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 text-xs font-medium"
								>
									{form.processing ? 'Saving...' : 'Save Grades (Pending Approval)'}
								</button>
							</div>
						)}
					</form>
				</div>
			)}
		</div>
	);
}


