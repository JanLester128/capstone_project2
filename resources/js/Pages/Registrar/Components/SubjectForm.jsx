import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';

const mapSemesterTypeToNumber = (semesterType = '') => {
  if (!semesterType) return '';
  const normalized = semesterType.toLowerCase();
  if (normalized.includes('1st') || normalized === '1') return '1';
  if (normalized.includes('2nd') || normalized === '2') return '2';
  return '';
};

// Subject templates organized by strand, year level, and semester
const subjectsByStrandAndYear = {
  // STEM Strand
  'STEM': {
    11: {
      1: [
        { code: 'STEM11-1', name: 'Pre-Calculus', prerequisites: '', corequisites: '' },
        { code: 'STEM11-2', name: 'General Biology 1', prerequisites: '', corequisites: '' },
        { code: 'STEM11-3', name: 'General Chemistry 1', prerequisites: '', corequisites: '' },
        { code: 'STEM11-4', name: 'General Physics 1', prerequisites: '', corequisites: '' },
      ],
      2: [
        { code: 'STEM11-5', name: 'Basic Calculus', prerequisites: 'Pre-Calculus', corequisites: '' },
        { code: 'STEM11-6', name: 'General Biology 2', prerequisites: 'General Biology 1', corequisites: '' },
        { code: 'STEM11-7', name: 'General Chemistry 2', prerequisites: 'General Chemistry 1', corequisites: '' },
      ]
    },
    12: {
      1: [
        { code: 'STEM12-1', name: 'Calculus 1', prerequisites: 'Basic Calculus', corequisites: '' },
        { code: 'STEM12-2', name: 'General Physics 2', prerequisites: 'General Physics 1', corequisites: '' },
        { code: 'STEM12-3', name: 'Research in Daily Life', prerequisites: '', corequisites: '' },
      ],
      2: [
        { code: 'STEM12-4', name: 'Calculus 2', prerequisites: 'Calculus 1', corequisites: '' },
        { code: 'STEM12-5', name: 'Research Project', prerequisites: 'Research in Daily Life', corequisites: '' },
      ]
    }
  },
  
  // ABM Strand
  'ABM': {
    11: {
      1: [
        { code: 'ABM11-1', name: 'Business Math', prerequisites: '', corequisites: '' },
        { code: 'ABM11-2', name: 'Fundamentals of Accountancy, Business and Management 1', prerequisites: '', corequisites: '' },
      ],
      2: [
        { code: 'ABM11-3', name: 'Fundamentals of Accountancy, Business and Management 2', 
          prerequisites: 'Fundamentals of Accountancy, Business and Management 1', corequisites: '' },
        { code: 'ABM11-4', name: 'Business Finance', prerequisites: 'Business Math', corequisites: '' },
      ]
    },
    12: {
      1: [
        { code: 'ABM12-1', name: 'Business Ethics and Social Responsibility', prerequisites: '', corequisites: '' },
        { code: 'ABM12-2', name: 'Business Marketing', prerequisites: '', corequisites: '' },
      ],
      2: [
        { code: 'ABM12-3', name: 'Applied Economics', prerequisites: '', corequisites: '' },
        { code: 'ABM12-4', name: 'Business Enterprise Simulation', 
          prerequisites: 'Fundamentals of Accountancy, Business and Management 2', corequisites: '' },
      ]
    }
  },
  
  // HUMSS Strand
  'HUMSS': {
    11: {
      1: [
        { code: 'HUMSS11-1', name: 'Introduction to World Religions and Belief Systems', prerequisites: '', corequisites: '' },
        { code: 'HUMSS11-2', name: 'Creative Writing', prerequisites: '', corequisites: '' },
      ],
      2: [
        { code: 'HUMSS11-3', name: 'Creative Nonfiction', prerequisites: 'Creative Writing', corequisites: '' },
        { code: 'HUMSS11-4', name: 'Disciplines and Ideas in the Social Sciences', prerequisites: '', corequisites: '' },
      ]
    },
    12: {
      1: [
        { code: 'HUMSS12-1', name: 'Trends, Networks, and Critical Thinking in the 21st Century', 
          prerequisites: 'Disciplines and Ideas in the Social Sciences', corequisites: '' },
        { code: 'HUMSS12-2', name: 'Philippine Politics and Governance', prerequisites: '', corequisites: '' },
      ],
      2: [
        { code: 'HUMSS12-3', name: 'Community Engagement, Solidarity, and Citizenship', 
          prerequisites: 'Philippine Politics and Governance', corequisites: '' },
        { code: 'HUMSS12-4', name: 'Disaster Readiness and Risk Reduction', prerequisites: '', corequisites: '' },
      ]
    }
  },
  
  // ICT Strand (TVL Track)
  'ICT': {
    11: {
      1: [
        { code: 'ICT11-1', name: 'Computer Systems Servicing NC II', prerequisites: '', corequisites: '' },
        { code: 'ICT11-2', name: 'Programming (Java)', prerequisites: '', corequisites: '' },
      ],
      2: [
        { code: 'ICT11-3', name: 'Web Development', prerequisites: '', corequisites: '' },
        { code: 'ICT11-4', name: 'Animation', prerequisites: '', corequisites: '' },
      ]
    },
    12: {
      1: [
        { code: 'ICT12-1', name: 'Mobile App Development', prerequisites: 'Programming (Java)', corequisites: '' },
        { code: 'ICT12-2', name: '3D Animation', prerequisites: 'Animation', corequisites: '' },
      ],
      2: [
        { code: 'ICT12-3', name: 'Work Immersion / Research / Career Advocacy / Culminating Activity', 
          prerequisites: '', corequisites: 'All major subjects' },
      ]
    }
  },
  
  // GAS (General Academic Strand)
  'GAS': {
    11: {
      1: [
        { code: 'GAS11-1', name: 'Oral Communication', prerequisites: '', corequisites: '' },
        { code: 'GAS11-2', name: 'General Mathematics', prerequisites: '', corequisites: '' },
        { code: 'GAS11-3', name: 'Earth and Life Science', prerequisites: '', corequisites: '' },
      ],
      2: [
        { code: 'GAS11-4', name: 'Reading and Writing Skills', prerequisites: 'Oral Communication', corequisites: '' },
        { code: 'GAS11-5', name: 'Statistics and Probability', prerequisites: 'General Mathematics', corequisites: '' },
        { code: 'GAS11-6', name: 'Physical Science', prerequisites: 'Earth and Life Science', corequisites: '' },
      ]
    },
    12: {
      1: [
        { code: 'GAS12-1', name: '21st Century Literature from the Philippines and the World', 
          prerequisites: 'Reading and Writing Skills', corequisites: '' },
        { code: 'GAS12-2', name: 'Introduction to the Philosophy of the Human Person', prerequisites: '', corequisites: '' },
      ],
      2: [
        { code: 'GAS12-3', name: 'Contemporary Philippine Arts from the Regions', prerequisites: '', corequisites: '' },
        { code: 'GAS12-4', name: 'Work Immersion / Research / Career Advocacy / Culminating Activity', 
          prerequisites: '', corequisites: 'All major subjects' },
      ]
    }
  }
};

export default function SubjectForm({ 
  subject = null, 
  strands = [], 
  semesters = [], 
  activeSemester = null, 
  curriculums = [], 
  lockedCurriculumId = null,
  defaultStrandId = null,
  defaultYearLevel = null,
  defaultSemesterType = null,
  defaultSemesterId = null,
  readOnlyStrandYear = false,
  onClose,
  onSuccess
}) {
  const isEditing = !!subject;
  const [selectedStrand, setSelectedStrand] = useState(subject?.strand_id?.toString() || defaultStrandId?.toString() || '');
  const [selectedYear, setSelectedYear] = useState(subject?.year_level?.toString() || defaultYearLevel?.toString() || '');
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [formData, setFormData] = useState({
    Subject_name: subject?.Subject_name || '',
    Subject_code: subject?.Subject_code || '',
    PREREQUISITES: subject?.PREREQUISITES || '',
    'CO-REQUISITES': subject?.['CO-REQUISITES'] || '',
    curriculum_id: subject?.curriculum_id?.toString() || lockedCurriculumId?.toString() || '',
    semester_id: subject?.semester_id?.toString() || defaultSemesterId?.toString() || '',
    Semester: subject?.Semester?.toString() || mapSemesterTypeToNumber(defaultSemesterType)
  });
  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);
  const lockedCurriculum = curriculums.find(c => c.id?.toString() === (lockedCurriculumId?.toString() || ''));
  const resolvedCurriculumId = formData.curriculum_id || lockedCurriculumId?.toString() || '';

  useEffect(() => {
    const derivedStrandId = curriculums.find(c => c.id?.toString() === resolvedCurriculumId)?.strand_id?.toString()
      || defaultStrandId?.toString()
      || '';

    if (derivedStrandId && derivedStrandId !== selectedStrand) {
      setSelectedStrand(derivedStrandId);
    }
  }, [resolvedCurriculumId, curriculums, defaultStrandId, selectedStrand]);

  const currentStrand = strands.find((strand) => strand.id?.toString() === selectedStrand);
  const isYearLocked = readOnlyStrandYear;
  const isSemesterLocked = false;
  const buildSubjectEntry = (overrides = {}) => ({
    id: overrides.id || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    Subject_name: '',
    Subject_code: '',
    PREREQUISITES: '',
    corequisites: '',
    ...overrides
  });
  const [subjectEntries, setSubjectEntries] = useState(() => {
    if (isEditing && subject) {
      return [buildSubjectEntry({
        id: 'existing-subject-entry',
        Subject_name: subject.Subject_name || '',
        Subject_code: subject.Subject_code || '',
        PREREQUISITES: subject.PREREQUISITES || '',
        corequisites: subject['CO-REQUISITES'] || ''
      })];
    }
    return [buildSubjectEntry()];
  });
  const [entryErrors, setEntryErrors] = useState({});
  const csrfToken = typeof document !== 'undefined'
    ? document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
    : null;

  const addSubjectEntry = () => {
    setSubjectEntries(prev => [...prev, buildSubjectEntry()]);
    setEntryErrors({});
  };

  const removeSubjectEntry = (id) => {
    setSubjectEntries(prev => prev.filter(entry => entry.id !== id));
    setEntryErrors(prev => {
      const { [id]: removed, ...rest } = prev;
      return rest;
    });
  };

  const updateSubjectEntry = (id, field, value) => {
    setSubjectEntries(prev => prev.map(entry =>
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
    setEntryErrors(prev => {
      if (!prev[id]) return prev;
      const updated = { ...prev };
      updated[id] = { ...updated[id], [field]: undefined };
      return updated;
    });
  };

  const formatValidationErrors = (errorBag = {}) => {
    const formatted = {};
    Object.entries(errorBag).forEach(([key, value]) => {
      formatted[key] = Array.isArray(value) ? value[0] : value;
    });
    return formatted;
  };

  const showSuccessToast = (message) => {
    if (typeof window !== 'undefined' && window.Swal) {
      window.Swal.fire({
        title: message,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    }
  };

  const submitSingleSubject = async (entry, basePayload) => {
    if (!csrfToken) {
      throw new Error('Missing CSRF token. Please refresh and try again.');
    }

    const payload = {
      ...basePayload,
      Subject_name: entry.Subject_name,
      Subject_code: entry.Subject_code,
      PREREQUISITES: entry.PREREQUISITES || '',
      'CO-REQUISITES': entry.corequisites || ''
    };

    const response = await fetch('/registrar/subjects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': csrfToken
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      if (response.status === 422) {
        const data = await response.json();
        const entryKeys = ['Subject_name', 'Subject_code', 'PREREQUISITES', 'CO-REQUISITES'];
        const hasEntrySpecificError = Object.keys(data.errors || {}).some(key => entryKeys.includes(key));
        throw {
          type: 'validation',
          entryId: hasEntrySpecificError ? entry.id : null,
          errors: data.errors || {}
        };
      }

      throw new Error('Failed to save subject. Please try again.');
    }
  };

  const reloadCurrentPage = () => new Promise((resolve) => {
    router.reload({
      preserveScroll: true,
      onFinish: () => resolve()
    });
  });
  
  // Determine available semesters
  const semesterOptions = semesters.length > 0
    ? semesters
    : (activeSemester ? [activeSemester] : []);

  const getSemesterNumber = (semesterType) => {
    if (!semesterType) return '';
    if (semesterType.includes('1st')) return '1';
    if (semesterType.includes('2nd')) return '2';
    return '';
  };

  // Get semester number from selected semester or active semester fallback
  const activeSemesterNumber = formData.Semester || getSemesterNumber(activeSemester?.semester_type);

  useEffect(() => {
    if (formData.semester_id || semesterOptions.length !== 1) return;
    const defaultSemester = semesterOptions[0];
    if (!defaultSemester) return;
    setFormData(prev => ({
      ...prev,
      semester_id: defaultSemester.id?.toString() || '',
      Semester: getSemesterNumber(defaultSemester.semester_type)
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semesterOptions]);

  // Update available subjects when strand, year, or active semester changes
  useEffect(() => {
    if (selectedStrand && selectedYear && activeSemesterNumber) {
      const strandCode = strands.find(s => s.id.toString() === selectedStrand)?.Strand_code;
      const semesterNum = parseInt(activeSemesterNumber);
      
      if (strandCode && 
          subjectsByStrandAndYear[strandCode] && 
          subjectsByStrandAndYear[strandCode][parseInt(selectedYear)] &&
          subjectsByStrandAndYear[strandCode][parseInt(selectedYear)][semesterNum]) {
        setAvailableSubjects(subjectsByStrandAndYear[strandCode][parseInt(selectedYear)][semesterNum]);
      } else {
        setAvailableSubjects([]);
      }
    } else {
      setAvailableSubjects([]);
    }
    setSelectedSubject(null);
  }, [selectedStrand, selectedYear, activeSemesterNumber, strands]);

  const handleSubjectSelect = (e) => {
    const selectedIndex = e.target.value;
    if (selectedIndex === '') {
      setSelectedSubject(null);
      setFormData(prev => ({
        ...prev,
        Subject_name: '',
        Subject_code: ''
      }));
      return;
    }
    
    const subject = availableSubjects[selectedIndex];
    setSelectedSubject(subject);
    setFormData(prev => ({
      ...prev,
      Subject_name: subject.name,
      Subject_code: subject.code,
      PREREQUISITES: subject.prerequisites || '',
      'CO-REQUISITES': subject.corequisites || ''
    }));
  };

  const handleSemesterChange = (e) => {
    const selectedId = e.target.value;
    const semester = semesterOptions.find(s => s.id?.toString() === selectedId);
    setFormData(prev => ({
      ...prev,
      semester_id: selectedId,
      Semester: getSemesterNumber(semester?.semester_type)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedStrand) {
      setErrors(prev => ({ ...prev, strand: 'The selected curriculum does not have an assigned strand.' }));
      return;
    }

    if (!selectedYear) {
      setErrors(prev => ({ ...prev, year_level: 'Please select a year level' }));
      return;
    }
    
    const numericCurriculumId = resolvedCurriculumId ? parseInt(resolvedCurriculumId) : null;

    // Require curriculum selection when creating new subject
    if (!isEditing && !numericCurriculumId) {
      setErrors({ ...errors, curriculum_id: 'Please select a curriculum' });
      return;
    }

    if (!formData.semester_id) {
      setErrors({ ...errors, semester_id: 'Please select a semester' });
      return;
    }

    if (isEditing) {
      if (!numericCurriculumId) {
        setErrors(prev => ({ ...prev, curriculum_id: 'Missing curriculum context. Please close and reopen the form.' }));
        return;
      }

      if (!formData.Subject_name || !formData.Subject_code) {
        setErrors({ 
          ...errors,
          Subject_name: !formData.Subject_name ? 'Subject name is required' : '',
          Subject_code: !formData.Subject_code ? 'Subject code is required' : ''
        });
        return;
      }

      setProcessing(true);
      setErrors({});

      const submitData = {
        Subject_name: formData.Subject_name,
        Subject_code: formData.Subject_code,
        Semester: formData.Semester,
        year_level: parseInt(selectedYear),
        strand_id: parseInt(selectedStrand),
        semester_id: parseInt(formData.semester_id),
        curriculum_id: numericCurriculumId,
        PREREQUISITES: formData.PREREQUISITES,
        'CO-REQUISITES': formData['CO-REQUISITES']
      };

      router.put(`/registrar/subjects/${subject.id}`, submitData, {
        onSuccess: () => {
          setProcessing(false);
          if (onClose) onClose();
          if (onSuccess) onSuccess();
        },
        onError: (err) => {
          setErrors(err);
          setProcessing(false);
        }
      });
      return;
    }

    // multi-entry validation
    const entryValidation = {};
    let hasEntryErrors = false;
    subjectEntries.forEach((entry) => {
      const entryError = {};
      if (!entry.Subject_name) {
        entryError.Subject_name = 'Subject name is required';
        hasEntryErrors = true;
      }
      if (!entry.Subject_code) {
        entryError.Subject_code = 'Subject code is required';
        hasEntryErrors = true;
      }
      if (Object.keys(entryError).length > 0) {
        entryValidation[entry.id] = entryError;
      }
    });

    if (hasEntryErrors) {
      setEntryErrors(entryValidation);
      return;
    }

    setProcessing(true);
    setErrors({});
    setEntryErrors({});

    const basePayload = {
      Semester: formData.Semester,
      year_level: parseInt(selectedYear),
      strand_id: parseInt(selectedStrand),
      semester_id: parseInt(formData.semester_id),
      curriculum_id: numericCurriculumId,
    };

    try {
      for (const entry of subjectEntries) {
        await submitSingleSubject(entry, basePayload);
      }

      showSuccessToast('Subjects added successfully');
      setSubjectEntries([buildSubjectEntry()]);
      await reloadCurrentPage();
      if (onClose) onClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      if (error.type === 'validation') {
        const formatted = formatValidationErrors(error.errors);
        if (error.entryId) {
          setEntryErrors(prev => ({
            ...prev,
            [error.entryId]: {
              ...prev[error.entryId],
              ...formatted
            }
          }));
        } else {
          setErrors(formatted);
        }
      } else {
        setErrors({ form: error.message || 'Failed to save subjects.' });
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-2xl shadow-xl w-full max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium text-gray-900">
          {isEditing ? 'Edit Subject' : 'Add New Subject'}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Step 1: Year Level */}
          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-2 flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900">Step 1: Year Level</h4>
              <span className="text-[11px] text-gray-500">Strand auto-selected from the curriculum.</span>
            </div>
            <div className="space-y-4">
              <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 px-3 py-2 text-sm text-indigo-900">
                <p className="font-semibold">Assigned Strand</p>
                <p>
                  {currentStrand?.Strand_name || 'No strand assigned to this curriculum.'}
                </p>
                {errors.strand && (
                  <p className="mt-1 text-xs text-red-600">{errors.strand}</p>
                )}
              </div>

              {/* Year Level */}
              <div>
                <label htmlFor="year" className="block text-xs font-medium text-gray-700 mb-0.5">
                  Year Level <span className="text-red-500">*</span>
                </label>
                <select
                  id="year"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  disabled={isYearLocked}
                  className={`w-full rounded-md border px-2 py-1.5 text-sm ${
                    errors.year_level ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  } ${isYearLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                >
                  <option value="">Select year level</option>
                  <option value="11">Grade 11</option>
                  <option value="12">Grade 12</option>
                </select>
                {errors.year_level && (
                  <p className="mt-0.5 text-xs text-red-600">{errors.year_level}</p>
                )}
              </div>
            </div>
          </div> {/* End of Step 1 */}
          
          {/* Step 2: Subject Details */}
          <div className="block">
            <div className="bg-blue-50/80 border border-blue-100 p-4 rounded-xl h-full max-h-[70vh] overflow-y-auto pr-1">
              <h4 className="text-sm font-medium text-gray-900 mb-3 border-b border-blue-100 pb-2">
                {isEditing ? 'Subject Details' : 'Step 2: Subject Details'}
              </h4>

              {/* Curriculum Selector */}
              {!isEditing && (
                <div className="mb-2">
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">
                    Curriculum <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.curriculum_id || lockedCurriculumId?.toString() || ''}
                    onChange={(e) => setFormData({ ...formData, curriculum_id: e.target.value })}
                    className={`w-full rounded-md border px-2 py-1.5 text-sm ${
                      errors.curriculum_id ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Curriculum</option>
                    {curriculums
                      .filter((curriculum) => curriculum.is_active || curriculum.id?.toString() === lockedCurriculumId?.toString())
                      .map((curriculum) => (
                        <option key={curriculum.id} value={curriculum.id}>
                          {curriculum.name} ({curriculum.curriculum_code})
                        </option>
                      ))}
                  </select>
                  {lockedCurriculumId && (
                    <p className="mt-1 text-[11px] text-gray-500">Pre-selected based on the context you opened the form from, but you can change it if needed.</p>
                  )}
                  {errors.curriculum_id && (
                    <p className="mt-1 text-xs text-red-600">{errors.curriculum_id}</p>
                  )}
                </div>
              )}

              {/* Semester Selector */}
              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Semester <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.semester_id}
                  onChange={handleSemesterChange}
                  className={`w-full rounded-md border px-2 py-1.5 text-sm ${
                    errors.semester_id ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  } ${isSemesterLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  disabled={isSemesterLocked}
                >
                  <option value="">Select Semester</option>
                  {semesterOptions.map((semester) => (
                    <option key={semester.id} value={semester.id}>
                      {semester.semester_type || `Semester ${getSemesterNumber(semester.semester_type)}`}
                      {semester.is_active ? ' (Active)' : ''}
                    </option>
                  ))}
                </select>
                {errors.semester_id && (
                  <p className="mt-1 text-xs text-red-600">{errors.semester_id}</p>
                )}
              </div>

              {isEditing ? (
                <>
                  <div className="mb-2">
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">
                      Subject Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.Subject_name}
                      onChange={(e) => setFormData({ ...formData, Subject_name: e.target.value })}
                      className={`w-full rounded-md border px-2 py-1.5 text-sm ${
                        errors.Subject_name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Enter subject name"
                      required
                    />
                    {errors.Subject_name && (
                      <p className="mt-1 text-xs text-red-600">{errors.Subject_name}</p>
                    )}
                  </div>

                  <div className="mb-2">
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">
                      Subject Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.Subject_code}
                      onChange={(e) => setFormData({ ...formData, Subject_code: e.target.value })}
                      className={`w-full rounded-md border px-2 py-1.5 text-sm ${
                        errors.Subject_code ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Enter subject code"
                      required
                    />
                  </div>

                  <div className="mb-2">
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">
                      Prerequisites
                    </label>
                    <input
                      type="text"
                      value={formData.PREREQUISITES}
                      onChange={(e) => setFormData({ ...formData, PREREQUISITES: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                      placeholder="Enter prerequisites (comma separated)"
                    />
                  </div>

                  <div className="mb-2">
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">
                      Co-requisites
                    </label>
                    <input
                      type="text"
                      value={formData['CO-REQUISITES']}
                      onChange={(e) => setFormData({ ...formData, 'CO-REQUISITES': e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                      placeholder="Enter co-requisites (comma separated)"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">Subject Entries</p>
                      <p className="text-[11px] text-gray-500">Use the + button to add multiple subjects. Each one will be saved sequentially.</p>
                    </div>
                    <button
                      type="button"
                      onClick={addSubjectEntry}
                      className="inline-flex items-center rounded-full border border-indigo-500 text-indigo-600 px-3 py-1 text-xs font-semibold hover:bg-indigo-50"
                      disabled={processing}
                    >
                      <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Subject
                    </button>
                  </div>

                  <div className="space-y-3">
                    {subjectEntries.map((entry, index) => (
                      <div key={entry.id} className="bg-white rounded-lg border border-gray-200 shadow-sm">
                        <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                          <div className="text-sm font-semibold text-gray-900">Subject #{index + 1}</div>
                          {subjectEntries.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSubjectEntry(entry.id)}
                              className="inline-flex items-center text-xs font-semibold text-red-600 hover:text-red-800"
                              disabled={processing}
                            >
                              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 6L6 18M6 6l12 12" />
                              </svg>
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="p-3 space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                                Subject Name <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={entry.Subject_name}
                                onChange={(e) => updateSubjectEntry(entry.id, 'Subject_name', e.target.value)}
                                className={`w-full rounded-md border px-2 py-1.5 text-sm ${
                                  entryErrors[entry.id]?.Subject_name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                }`}
                                placeholder="Enter subject name"
                                disabled={processing}
                              />
                              {entryErrors[entry.id]?.Subject_name && (
                                <p className="mt-1 text-xs text-red-600">{entryErrors[entry.id]?.Subject_name}</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                                Subject Code <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={entry.Subject_code}
                                onChange={(e) => updateSubjectEntry(entry.id, 'Subject_code', e.target.value)}
                                className={`w-full rounded-md border px-2 py-1.5 text-sm ${
                                  entryErrors[entry.id]?.Subject_code ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                }`}
                                placeholder="Enter subject code"
                                disabled={processing}
                              />
                              {entryErrors[entry.id]?.Subject_code && (
                                <p className="mt-1 text-xs text-red-600">{entryErrors[entry.id]?.Subject_code}</p>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                                Prerequisites
                              </label>
                              <input
                                type="text"
                                value={entry.PREREQUISITES}
                                onChange={(e) => updateSubjectEntry(entry.id, 'PREREQUISITES', e.target.value)}
                                className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                                placeholder="Enter prerequisites (comma separated)"
                                disabled={processing}
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                                Co-requisites
                              </label>
                              <input
                                type="text"
                                value={entry.corequisites}
                                onChange={(e) => updateSubjectEntry(entry.id, 'corequisites', e.target.value)}
                                className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                                placeholder="Enter co-requisites (comma separated)"
                                disabled={processing}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 mt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={processing}
            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? 'Saving...' : isEditing ? 'Update' : 'Add'}
          </button>
        </div>
      </form>
    </div>
  );
}
