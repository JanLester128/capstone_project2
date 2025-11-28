import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import RegistrarLayout from './Layout';

export default function StudentDetails({
  student,
  strandPreferences = [],
  documents = {},
  creditedSubjects = [],
  grades = [],
  classRecords = [],
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
    { id: 'grades', label: 'Grades' },
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

            {/* Grades Tab */}
            {activeTab === 'grades' && (
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Grades</h2>
                {grades.length === 0 ? (
                  <p className="text-sm text-gray-500">No grades found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Subject</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Code</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">1st Quarter</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">2nd Quarter</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">3rd Quarter</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">4th Quarter</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Final Grade</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Remarks</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">School Year</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Semester</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {grades.map((grade) => (
                          <tr key={grade.id}>
                            <td className="px-4 py-3 text-sm text-gray-900">{grade.subject_name}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{grade.subject_code}</td>
                            <td className="px-4 py-3 text-sm text-center text-gray-700">{formatGrade(grade.first_quarter)}</td>
                            <td className="px-4 py-3 text-sm text-center text-gray-700">{formatGrade(grade.second_quarter)}</td>
                            <td className="px-4 py-3 text-sm text-center text-gray-700">{formatGrade(grade.third_quarter)}</td>
                            <td className="px-4 py-3 text-sm text-center text-gray-700">{formatGrade(grade.fourth_quarter)}</td>
                            <td className="px-4 py-3 text-sm text-center text-gray-700 font-medium">{formatGrade(grade.final_grade)}</td>
                            <td className="px-4 py-3 text-sm text-center text-gray-700">{grade.remarks || ''}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{grade.school_year || ''}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{grade.semester || ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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

