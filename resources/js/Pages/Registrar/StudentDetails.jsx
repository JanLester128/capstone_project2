import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import RegistrarLayout from './Layout';

const statusStyles = {
  completed: 'bg-green-100 text-green-800 border-green-200',
  credited: 'bg-blue-100 text-blue-800 border-blue-200',
  pending: 'bg-gray-100 text-gray-600 border-gray-200',
  current: 'bg-amber-100 text-amber-800 border-amber-200',
};

const infoBlock = (label, value) => (
  <div className="space-y-1">
    <p className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold">{label}</p>
    <p className="text-sm font-semibold text-gray-900 min-h-[20px]">{value || '—'}</p>
  </div>
);

export default function StudentDetails({
  student,
  strandPreferences = [],
  documents = {},
  creditedSubjects = [],
  grades = [],
  classRecords = [],
  academicRecord = [],
  academicSummary = null,
  academicCurriculum = null,
  academicStudentProfile = null,
  academicInfoMessage = null,
  academicCurrentYearLevel = null,
  academicCurrentSemesterKey = null,
}) {
  const [activeTab, setActiveTab] = useState('profile');
  const [selectedDocument, setSelectedDocument] = useState(null);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setSelectedDocument(null);
      }
    };
    if (selectedDocument) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [selectedDocument]);

  const tabs = [
    { id: 'profile', label: 'Student Profile' },
    { id: 'documents', label: 'Documents' },
    { id: 'credited', label: 'Credited Subject' },
    { id: 'grades', label: 'Academic Record' },
    { id: 'classRecord', label: 'Class Record' },
  ];

  const formatGrade = (value) => {
    if (value === null || value === undefined) return '';
    const n = parseFloat(value);
    if (Number.isNaN(n)) return '';
    return n.toFixed(2);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const normalizeDocumentEntries = (docValue) => {
    if (!docValue) return [];
    if (Array.isArray(docValue)) return docValue;
    if (typeof docValue === 'object') return [docValue];
    return [];
  };

  const renderStatusBadge = (status) => {
    const base = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border';
    const style = statusStyles[status] || statusStyles.pending;
    const labelMap = {
      completed: 'Completed',
      credited: 'Credited',
      current: 'Enrolled / Current',
      pending: 'Pending',
    };
    const label = labelMap[status] || labelMap.pending;
    return <span className={`${base} ${style}`}>{label}</span>;
  };

  const renderQuarterValue = (subject, quarter) => {
    const value = subject?.quarters?.[quarter];
    if (value === null || value === undefined) {
      return <span className="text-xs text-gray-400">—</span>;
    }
    return <span className="text-sm font-medium text-gray-900">{Number(value).toFixed(2)}</span>;
  };

  const renderFinalScore = (subject) => {
    if (subject.final_grade === null || subject.final_grade === undefined) {
      return <span className="text-sm text-gray-400">—</span>;
    }

    return (
      <div className="text-sm font-semibold text-gray-900">
        {Number(subject.final_grade).toFixed(2)}
        {subject.remarks && (
          <p className="text-xs text-gray-500 mt-0.5">{subject.remarks}</p>
        )}
      </div>
    );
  };

  const semesterQuarterLabels = (semesterKey) => (String(semesterKey) === '2' ? [3, 4] : [1, 2]);

  const hasAcademicRecord = academicRecord && academicRecord.length > 0;
  const profile = academicStudentProfile || {};

  const renderSemesterCard = (yearLevel, semester, label) => {
    const quarterLabels = semester ? semesterQuarterLabels(semester.semester) : label.includes('Second') ? [3, 4] : [1, 2];
    const normalizedSemesterKey = semester ? String(semester.semester) : label.includes('Second') ? '2' : '1';
    const isCurrentTerm = (Number(yearLevel) === Number(academicCurrentYearLevel)) && String(academicCurrentSemesterKey || '1') === normalizedSemesterKey;
    const sectionName = isCurrentTerm ? (profile.section || '—') : '—';
    const adviserName = isCurrentTerm ? (profile.adviser || '—') : '—';

    return (
      <div key={`${yearLevel}-${label}`} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-[#2F5597] px-6 py-3 text-white">
          <p className="text-[11px] uppercase tracking-[0.35em] text-blue-100">Academic Record</p>
          <div className="mt-1 flex flex-wrap items-center gap-4 text-sm">
            <span>Year Level: <strong>Grade {yearLevel ?? '—'}</strong></span>
            <span>Semester: <strong>{label}</strong></span>
            <span>Section: <strong>{sectionName}</strong></span>
            <span>Adviser: <strong>{adviserName}</strong></span>
          </div>
        </div>

        {!semester ? (
          <div className="px-6 py-5 text-sm text-gray-500">No records available for this semester yet.</div>
        ) : (
          <div className="px-6 py-5 space-y-4">
            <div className="flex flex-wrap gap-2">
              {quarterLabels.map((quarter) => {
                const isDone = semester.quarter_status?.[quarter];
                return (
                  <span
                    key={`${label}-quarter-${quarter}`}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                      isDone
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 bg-gray-50 text-gray-500'
                    }`}
                  >
                    <span>Quarter {quarter}</span>
                    <span className="text-[11px] font-normal">{isDone ? 'Graded' : 'Pending'}</span>
                  </span>
                );
              })}
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 text-[11px] uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="border border-slate-200 px-3 py-2 text-left">Subjects</th>
                    {quarterLabels.map((quarter) => (
                      <th key={`${label}-quarter-header-${quarter}`} className="border border-slate-200 px-3 py-2 text-center">
                        Quarterly Rating {quarter}
                      </th>
                    ))}
                    <th className="border border-slate-200 px-3 py-2 text-center">Final Rating</th>
                    <th className="border border-slate-200 px-3 py-2 text-left">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {semester.subjects.map((subject) => (
                    <tr key={subject.id} className="odd:bg-white even:bg-slate-50">
                      <td className="border border-slate-200 px-3 py-2 align-top">
                        <p className="text-sm font-semibold text-gray-900">{subject.name}</p>
                        <p className="text-xs text-gray-500 font-mono">{subject.code}</p>
                        <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-gray-500">
                          {subject.prerequisites && (
                            <span className="rounded bg-gray-100 px-2 py-0.5">Pre: {subject.prerequisites}</span>
                          )}
                          {subject.corequisites && (
                            <span className="rounded bg-gray-100 px-2 py-0.5">Co: {subject.corequisites}</span>
                          )}
                          {renderStatusBadge(subject.status)}
                        </div>
                      </td>
                      {quarterLabels.map((quarter) => (
                        <td key={`${subject.id}-q-${quarter}`} className="border border-slate-200 px-3 py-2 text-center align-middle">
                          {renderQuarterValue(subject, quarter)}
                        </td>
                      ))}
                      <td className="border border-slate-200 px-3 py-2 text-center align-middle">
                        {renderFinalScore(subject)}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 align-middle text-sm text-gray-700">
                        {subject.remarks || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-indigo-50 text-sm font-semibold text-indigo-900">
                    <td className="border border-slate-200 px-3 py-2">General Average</td>
                    {quarterLabels.map((quarter) => (
                      <td key={`avg-${label}-${quarter}`} className="border border-slate-200 px-3 py-2"></td>
                    ))}
                    <td className="border border-slate-200 px-3 py-2 text-center">
                      {semester.general_average ? Number(semester.general_average).toFixed(2) : '—'}
                    </td>
                    <td className="border border-slate-200 px-3 py-2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <RegistrarLayout>
      <Head title={`Student Details - ${student.full_name}`} />

      <div className="py-4 lg:py-6">
        <div className="max-w-full mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
          {/* Header */}
          <div className="mb-4 lg:mb-6">
            <Link
              href="/registrar/students"
              className="text-sm text-indigo-600 hover:text-indigo-900 mb-2 inline-block"
            >
              ← Back to Students
            </Link>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">{student.full_name}</h1>
            <p className="mt-1 text-xs lg:text-sm text-gray-600">
              {student.lrn && `LRN: ${student.lrn}`}{student.lrn && student.email && ' | '}{student.email && `Email: ${student.email}`}
            </p>
            {academicCurriculum && (
              <p className="mt-0.5 text-xs lg:text-sm text-gray-500">
                Curriculum: <span className="font-medium text-gray-900">{academicCurriculum.code || academicCurriculum.name}</span>
                {academicCurriculum.name && academicCurriculum.code && ' – '}<span>{academicCurriculum.name}</span>
              </p>
            )}
          </div>

          {/* Tabs */}
          <div className="mb-4">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-lg shadow border">
            {/* Student Profile Tab */}
            {activeTab === 'profile' && (
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Student Profile</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <p className="text-sm text-gray-900">{student.full_name || ''}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-sm text-gray-900">{student.email || ''}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                    <p className="text-sm text-gray-900">{student.age || ''}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Birthdate</label>
                    <p className="text-sm text-gray-900">{formatDate(student.birthdate)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <p className="text-sm text-gray-900">{student.gender || ''}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                    <p className="text-sm text-gray-900">{student.section || ''}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Strand</label>
                    <p className="text-sm text-gray-900">{student.strand || ''}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
                    <p className="text-sm text-gray-900">{student.grade_level ? `Grade ${student.grade_level}` : ''}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <p className="text-sm text-gray-900">{student.address || ''}</p>
                  </div>

                  {strandPreferences.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Strand Preferences</h3>
                      <div className="space-y-2">
                        {strandPreferences.map((pref, idx) => (
                          <div key={pref.id} className="flex items-center gap-2 text-sm">
                            <span className="font-medium text-gray-700">{idx + 1}.</span>
                            <span className="text-gray-900">{pref.strand_name}</span>
                            <span className="text-gray-500">({pref.strand_code})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Documents</h2>
                {Object.keys(documents).length === 0 ? (
                  <p className="text-sm text-gray-500">No documents found.</p>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(documents).map(([docType, docValue]) => {
                      const docItems = normalizeDocumentEntries(docValue);

                      return (
                        <div key={docType} className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="bg-gray-50 px-4 py-3 border-b">
                            <h3 className="text-sm font-semibold text-gray-900">{docType}</h3>
                          </div>
                          <div className="overflow-x-auto">
                            {docItems.length === 0 ? (
                              <p className="px-4 py-4 text-sm text-gray-500">No upload for this document.</p>
                            ) : (
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Document</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">File</th>
                                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 uppercase">Date Uploaded</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {docItems.map((doc, idx) => (
                                    <tr key={idx}>
                                      <td className="px-4 py-2 text-sm text-gray-900">{doc.label || 'Document'}</td>
                                      <td className="px-4 py-2 text-sm text-gray-700">{doc.file_name || doc.filename || 'N/A'}</td>
                                      <td className="px-4 py-2 text-sm text-center text-gray-700">{formatDate(doc.date_uploaded || doc.created_at)}</td>
                                      <td className="px-4 py-2 text-sm text-center text-gray-700">
                                        <button
                                          onClick={() => setSelectedDocument(doc)}
                                          className="text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                          </svg>
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Credited Subject Tab */}
            {activeTab === 'credited' && (
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Credited Subject</h2>
                {creditedSubjects.length === 0 ? (
                  <p className="text-sm text-gray-500">No credited subjects found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Subject</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Code</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Grade Level</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Semester</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">School Year</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {creditedSubjects.map((subject) => (
                          <tr key={subject.id}>
                            <td className="px-4 py-3 text-sm text-gray-900">{subject.subject_name}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{subject.subject_code}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{subject.grade_level}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{subject.semester}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{subject.school_year}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Academic Record Tab */}
            {activeTab === 'grades' && (
              <div className="p-6 space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">Academic Record</h2>
                    <p className="text-sm text-gray-500">Complete listing of Grade 11 & 12 subjects under the student's strand.</p>
                  </div>
                  {academicCurriculum && (
                    <div className="min-w-[240px] bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                      <p className="text-xs uppercase tracking-widest text-indigo-500 font-semibold">Active Curriculum</p>
                      <p className="text-sm font-semibold text-indigo-900">{academicCurriculum.code || academicCurriculum.name}</p>
                      <p className="text-xs text-indigo-700">{academicCurriculum.name}</p>
                      <p className="text-[11px] text-indigo-500 mt-1">Effective SY: {academicCurriculum.effective_sy || '—'}</p>
                    </div>
                  )}
                </div>

                {profile && (
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500 font-semibold mb-3">Learner Information</p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {infoBlock('Last Name', profile.last_name)}
                        {infoBlock('First Name', profile.first_name)}
                        {infoBlock('Middle Name', profile.middle_name)}
                        {infoBlock('Extension', profile.extension_name || 'N/A')}
                        {infoBlock('LRN', profile.lrn)}
                        {infoBlock('Birthdate', profile.birthdate)}
                        {infoBlock('Sex', profile.sex)}
                        {infoBlock('Strand', profile.strand || 'Not assigned')}
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500 font-semibold mb-3">Current Assignment</p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {infoBlock('Grade Level', profile.grade_level ?? '—')}
                        {infoBlock('Section', profile.section)}
                        {infoBlock('Adviser', profile.adviser)}
                        {infoBlock('School Year', profile.school_year)}
                        {infoBlock('Total Subjects', academicSummary?.totalSubjects ?? 0)}
                        <div className="space-y-2">
                          <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500 font-semibold">Completion</p>
                          <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-100">
                              Completed: {academicSummary?.completed ?? 0}
                            </span>
                            <span className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 border border-sky-100">
                              Credited: {academicSummary?.credited ?? 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {!hasAcademicRecord && (
                  <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                    {academicInfoMessage || 'Curriculum subjects are not yet configured for this strand.'}
                  </div>
                )}

                {hasAcademicRecord && (
                  <div className="space-y-8">
                    {academicRecord.map((year) => {
                      const semesterOrder = [
                        { key: '1', label: 'First Semester' },
                        { key: '2', label: 'Second Semester' },
                      ];

                      return (
                        <div key={year.year_level} className="space-y-4">
                          <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-gray-500 font-semibold">Grade Level</p>
                            <h3 className="text-xl font-bold text-gray-900">Grade {year.year_level}</h3>
                          </div>

                          <div className="space-y-6">
                            {semesterOrder.map(({ key, label }) => {
                              const semesterData = year.semesters.find((semester) => String(semester.semester) === String(key));
                              return renderSemesterCard(year.year_level, semesterData, label);
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Class Record Tab */}
            {activeTab === 'classRecord' && (
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Class Record</h2>
                {classRecords.length === 0 ? (
                  <p className="text-sm text-gray-500">No class records found.</p>
                ) : (
                  <div className="space-y-6">
                    {classRecords.map((record, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3 border-b">
                          <h3 className="text-sm font-semibold text-gray-900">
                            {record.school_year} - {record.semester}
                          </h3>
                          <p className="text-xs text-gray-600 mt-1">
                            {record.strand}
                            {record.section && ` • Section: ${record.section}`}
                          </p>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Subject</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Code</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Instructor</th>
                                <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 uppercase">1st Quarter</th>
                                <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 uppercase">2nd Quarter</th>
                                <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 uppercase">Final Grade</th>
                                <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 uppercase">Remarks</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {record.schedule.length === 0 ? (
                                <tr>
                                  <td colSpan={7} className="px-4 py-4 text-center text-sm text-gray-500">
                                    No classes found for this term.
                                  </td>
                                </tr>
                              ) : (
                                record.schedule.map((item, itemIdx) => (
                                  <tr key={itemIdx}>
                                    <td className="px-4 py-2 text-sm text-gray-900">
                                      {item.subject || ''}
                                      {item.is_credited && (
                                        <span className="ml-1 text-xs font-semibold text-indigo-600">(Credited)</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-700">{item.subject_code || ''}</td>
                                    <td className="px-4 py-2 text-sm text-gray-700">{item.faculty || ''}</td>
                                    <td className="px-4 py-2 text-sm text-center text-gray-700">{formatGrade(item.first_quarter)}</td>
                                    <td className="px-4 py-2 text-sm text-center text-gray-700">{formatGrade(item.second_quarter)}</td>
                                    <td className="px-4 py-2 text-sm text-center text-gray-700 font-medium">{formatGrade(item.final_grade)}</td>
                                    <td className="px-4 py-2 text-sm text-center text-gray-700">{item.remarks || ''}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document Viewing Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSelectedDocument(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">{selectedDocument.label}</h3>
              <button
                onClick={() => setSelectedDocument(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
              <img
                src={selectedDocument.url}
                alt={selectedDocument.label}
                className="max-w-full h-auto mx-auto"
                onError={(e) => {
                  e.target.src = '';
                  e.target.alt = 'Document not found';
                  e.target.className = 'hidden';
                  e.target.parentElement.innerHTML = '<p class="text-center text-gray-500 py-8">Document not found or cannot be displayed.</p>';
                }}
              />
            </div>
          </div>
        </div>
      )}
    </RegistrarLayout>
  );
}

