import { useState, useEffect } from 'react'
import { router } from '@inertiajs/react'

// Predefined subjects with their prerequisites and co-requisites
const subjectsByStrandAndYear = {
  'STEM': {
    11: {
      1: [
        { name: 'Oral Communication', code: 'ORAL_COMM', prerequisites: null, corequisites: null },
        { name: 'Komunikasyon at Pananaliksik sa Wika at Kulturang Pilipino', code: 'KOMUN_FIL', prerequisites: null, corequisites: null },
        { name: 'General Mathematics', code: 'GEN_MATH', prerequisites: null, corequisites: null },
        { name: 'Earth Science', code: 'EARTH_SCI', prerequisites: null, corequisites: null },
        { name: '21st Century Literature from the Philippines and the World', code: '21ST_LIT', prerequisites: null, corequisites: null },
        { name: 'Physical Education and Health', code: 'PE_HEALTH_1', prerequisites: null, corequisites: null },
        { name: 'Pre-calculus', code: 'PRE_CALC', prerequisites: null, corequisites: null },
        { name: 'General Chemistry 1', code: 'GEN_CHEM_1', prerequisites: null, corequisites: null },
      ],
      2: [
        { name: 'Reading and Writing', code: 'READ_WRITE', prerequisites: null, corequisites: null },
        { name: 'Pagbasa at Pagsusuri ng Iba\'t ibang Teksto Tungo sa Pananaliksik', code: 'PAGBASA_FIL', prerequisites: null, corequisites: null },
        { name: 'Statistics and Probability', code: 'STAT_PROB', prerequisites: null, corequisites: null },
        { name: 'Disaster Readiness and Risk Reduction', code: 'DRRR', prerequisites: null, corequisites: null },
        { name: 'Introduction to the Philosophy of the Human Person/Pambungad sa Pilosopiya ng Tao', code: 'INTRO_PHIL', prerequisites: null, corequisites: null },
        { name: 'Physical Education and Health', code: 'PE_HEALTH_2', prerequisites: null, corequisites: null },
        { name: 'Practical Research 1', code: 'PRAC_RES_1', prerequisites: null, corequisites: null },
        { name: 'Basic Calculus', code: 'BASIC_CALC', prerequisites: 'Pre-calculus', corequisites: null },
        { name: 'General Chemistry 2', code: 'GEN_CHEM_2', prerequisites: 'General Chemistry 1', corequisites: null },
      ]
    },
    12: {
      1: [
        { name: 'Personal Development/Pansariling Kaunlaran', code: 'PERS_DEV', prerequisites: null, corequisites: null },
        { name: 'Understanding Culture, Society and Politics', code: 'UCSP', prerequisites: null, corequisites: null },
        { name: 'Physical Education and Health', code: 'PE_HEALTH_3', prerequisites: null, corequisites: null },
        { name: 'Practical Research 2', code: 'PRAC_RES_2', prerequisites: 'Practical Research 1, Statistics and Probability', corequisites: null },
        { name: 'English for Academic and Professional Purposes', code: 'EAPP', prerequisites: null, corequisites: null },
        { name: 'General Biology 1', code: 'GEN_BIO_1', prerequisites: null, corequisites: null },
        { name: 'General Physics 1', code: 'GEN_PHYS_1', prerequisites: 'Pre-calculus; calculus', corequisites: null },
      ],
      2: [
        { name: 'Media and Information Literacy', code: 'MIL', prerequisites: null, corequisites: null },
        { name: 'Contemporary Philippine Arts from the regions', code: 'CPAR', prerequisites: null, corequisites: null },
        { name: 'Physical Education and Health', code: 'PE_HEALTH_4', prerequisites: null, corequisites: null },
        { name: 'Inquiries, Investigations and Immersion', code: 'III', prerequisites: null, corequisites: null },
        { name: 'Entrepreneurship', code: 'ENTREP', prerequisites: null, corequisites: null },
        { name: 'Filipino sa Piling Larang', code: 'FIL_LARANG', prerequisites: null, corequisites: null },
        { name: 'General Biology 2', code: 'GEN_BIO_2', prerequisites: 'General Biology 1', corequisites: null },
        { name: 'General Physics 2', code: 'GEN_PHYS_2', prerequisites: 'General Physics 1', corequisites: null },
        { name: 'Research/Capstone Project/Work Immersion', code: 'CAPSTONE', prerequisites: null, corequisites: null },
      ]
    }
  },
  'TVL': {
    11: {
      1: [
        { name: 'Oral Communication', code: 'ORAL_COMM_TVL', prerequisites: null, corequisites: null },
        { name: 'Komunikasyon at Pananaliksik sa Wika at Kulturang Pilipino', code: 'KOMUN_FIL_TVL', prerequisites: null, corequisites: null },
        { name: 'General Mathematics', code: 'GEN_MATH_TVL', prerequisites: null, corequisites: null },
        { name: 'Earth and Life Science', code: 'EARTH_LIFE_SCI', prerequisites: null, corequisites: null },
        { name: '21st Century Literature from the Philippines and the World', code: '21ST_LIT_TVL', prerequisites: null, corequisites: null },
        { name: 'Physical Education and Health', code: 'PE_HEALTH_TVL_1', prerequisites: null, corequisites: null },
        { name: 'Technical Drafting', code: 'TECH_DRAFT', prerequisites: null, corequisites: null },
        { name: 'Entrepreneurship', code: 'ENTREP_TVL', prerequisites: null, corequisites: null },
      ],
      2: [
        { name: 'Reading and Writing', code: 'READ_WRITE_TVL', prerequisites: null, corequisites: null },
        { name: 'Pagbasa at Pagsusuri ng Iba\'t ibang Teksto Tungo sa Pananaliksik', code: 'PAGBASA_FIL_TVL', prerequisites: null, corequisites: null },
        { name: 'Statistics and Probability', code: 'STAT_PROB_TVL', prerequisites: null, corequisites: null },
        { name: 'Physical Science', code: 'PHYS_SCI', prerequisites: null, corequisites: null },
        { name: 'Introduction to the Philosophy of the Human Person', code: 'INTRO_PHIL_TVL', prerequisites: null, corequisites: null },
        { name: 'Physical Education and Health', code: 'PE_HEALTH_TVL_2', prerequisites: null, corequisites: null },
        { name: 'Computer Programming', code: 'COMP_PROG', prerequisites: null, corequisites: null },
        { name: 'Computer Systems Servicing', code: 'COMP_SYS_SERV', prerequisites: null, corequisites: null },
      ]
    },
    12: {
      1: [
        { name: 'Personal Development', code: 'PERS_DEV_TVL', prerequisites: null, corequisites: null },
        { name: 'Understanding Culture, Society and Politics', code: 'UCSP_TVL', prerequisites: null, corequisites: null },
        { name: 'Physical Education and Health', code: 'PE_HEALTH_TVL_3', prerequisites: null, corequisites: null },
        { name: 'Practical Research 1', code: 'PRAC_RES_1_TVL', prerequisites: null, corequisites: null },
        { name: 'English for Academic and Professional Purposes', code: 'EAPP_TVL', prerequisites: null, corequisites: null },
        { name: 'Web Development', code: 'WEB_DEV', prerequisites: 'Computer Programming', corequisites: null },
        { name: 'Mobile Application Development', code: 'MOBILE_DEV', prerequisites: 'Computer Programming', corequisites: null },
      ],
      2: [
        { name: 'Media and Information Literacy', code: 'MIL_TVL', prerequisites: null, corequisites: null },
        { name: 'Contemporary Philippine Arts from the regions', code: 'CPAR_TVL', prerequisites: null, corequisites: null },
        { name: 'Physical Education and Health', code: 'PE_HEALTH_TVL_4', prerequisites: null, corequisites: null },
        { name: 'Work Immersion', code: 'WORK_IMMERSION', prerequisites: null, corequisites: null },
        { name: 'Filipino sa Piling Larang', code: 'FIL_LARANG_TVL', prerequisites: null, corequisites: null },
        { name: 'Capstone Project', code: 'CAPSTONE_TVL', prerequisites: null, corequisites: null },
      ]
    }
  },
  'HUMSS': {
    11: {
      1: [
        { name: 'Oral Communication', code: 'ORAL_COMM_HUMSS', prerequisites: null, corequisites: null },
        { name: 'Komunikasyon at Pananaliksik sa Wika at Kulturang Pilipino', code: 'KOMUN_FIL_HUMSS', prerequisites: null, corequisites: null },
        { name: 'General Mathematics', code: 'GEN_MATH_HUMSS', prerequisites: null, corequisites: null },
        { name: 'Earth and Life Science', code: 'EARTH_LIFE_SCI_HUMSS', prerequisites: null, corequisites: null },
        { name: '21st Century Literature from the Philippines and the World', code: '21ST_LIT_HUMSS', prerequisites: null, corequisites: null },
        { name: 'Physical Education and Health', code: 'PE_HEALTH_HUMSS_1', prerequisites: null, corequisites: null },
        { name: 'Introduction to World Religions and Belief Systems', code: 'WORLD_REL', prerequisites: null, corequisites: null },
        { name: 'Creative Writing', code: 'CREATIVE_WRITE', prerequisites: null, corequisites: null },
      ],
      2: [
        { name: 'Reading and Writing', code: 'READ_WRITE_HUMSS', prerequisites: null, corequisites: null },
        { name: 'Pagbasa at Pagsusuri ng Iba\'t ibang Teksto Tungo sa Pananaliksik', code: 'PAGBASA_FIL_HUMSS', prerequisites: null, corequisites: null },
        { name: 'Statistics and Probability', code: 'STAT_PROB_HUMSS', prerequisites: null, corequisites: null },
        { name: 'Physical Science', code: 'PHYS_SCI_HUMSS', prerequisites: null, corequisites: null },
        { name: 'Introduction to the Philosophy of the Human Person', code: 'INTRO_PHIL_HUMSS', prerequisites: null, corequisites: null },
        { name: 'Physical Education and Health', code: 'PE_HEALTH_HUMSS_2', prerequisites: null, corequisites: null },
        { name: 'Creative Nonfiction', code: 'CREATIVE_NONFIC', prerequisites: null, corequisites: null },
        { name: 'Disciplines and Ideas in the Social Sciences', code: 'DISS', prerequisites: null, corequisites: null },
      ]
    },
    12: {
      1: [
        { name: 'Personal Development', code: 'PERS_DEV_HUMSS', prerequisites: null, corequisites: null },
        { name: 'Understanding Culture, Society and Politics', code: 'UCSP_HUMSS', prerequisites: null, corequisites: null },
        { name: 'Physical Education and Health', code: 'PE_HEALTH_HUMSS_3', prerequisites: null, corequisites: null },
        { name: 'Practical Research 1', code: 'PRAC_RES_1_HUMSS', prerequisites: null, corequisites: null },
        { name: 'English for Academic and Professional Purposes', code: 'EAPP_HUMSS', prerequisites: null, corequisites: null },
        { name: 'Philippine Politics and Governance', code: 'PPG', prerequisites: null, corequisites: null },
        { name: 'Community Engagement, Solidarity and Citizenship', code: 'CESC', prerequisites: null, corequisites: null },
      ],
      2: [
        { name: 'Media and Information Literacy', code: 'MIL_HUMSS', prerequisites: null, corequisites: null },
        { name: 'Contemporary Philippine Arts from the regions', code: 'CPAR_HUMSS', prerequisites: null, corequisites: null },
        { name: 'Physical Education and Health', code: 'PE_HEALTH_HUMSS_4', prerequisites: null, corequisites: null },
        { name: 'Practical Research 2', code: 'PRAC_RES_2_HUMSS', prerequisites: 'Practical Research 1', corequisites: null },
        { name: 'Filipino sa Piling Larang', code: 'FIL_LARANG_HUMSS', prerequisites: null, corequisites: null },
        { name: 'Trends, Networks and Critical Thinking in the 21st Century Culture', code: 'TRENDS_21ST', prerequisites: null, corequisites: null },
        { name: 'Culminating Activity', code: 'CULMIN_ACT', prerequisites: null, corequisites: null },
      ]
    }
  },
  'ABM': {
    11: {
      1: [
        { name: 'Oral Communication', code: 'ORAL_COMM_ABM', prerequisites: null, corequisites: null },
        { name: 'Komunikasyon at Pananaliksik sa Wika at Kulturang Pilipino', code: 'KOMUN_FIL_ABM', prerequisites: null, corequisites: null },
        { name: 'General Mathematics', code: 'GEN_MATH_ABM', prerequisites: null, corequisites: null },
        { name: 'Earth and Life Science', code: 'EARTH_LIFE_SCI_ABM', prerequisites: null, corequisites: null },
        { name: '21st Century Literature from the Philippines and the World', code: '21ST_LIT_ABM', prerequisites: null, corequisites: null },
        { name: 'Physical Education and Health', code: 'PE_HEALTH_ABM_1', prerequisites: null, corequisites: null },
        { name: 'Fundamentals of Accountancy, Business and Management 1', code: 'FABM_1', prerequisites: null, corequisites: null },
        { name: 'Business Ethics and Social Responsibility', code: 'BESR', prerequisites: null, corequisites: null },
      ],
      2: [
        { name: 'Reading and Writing', code: 'READ_WRITE_ABM', prerequisites: null, corequisites: null },
        { name: 'Pagbasa at Pagsusuri ng Iba\'t ibang Teksto Tungo sa Pananaliksik', code: 'PAGBASA_FIL_ABM', prerequisites: null, corequisites: null },
        { name: 'Statistics and Probability', code: 'STAT_PROB_ABM', prerequisites: null, corequisites: null },
        { name: 'Physical Science', code: 'PHYS_SCI_ABM', prerequisites: null, corequisites: null },
        { name: 'Introduction to the Philosophy of the Human Person', code: 'INTRO_PHIL_ABM', prerequisites: null, corequisites: null },
        { name: 'Physical Education and Health', code: 'PE_HEALTH_ABM_2', prerequisites: null, corequisites: null },
        { name: 'Organization and Management', code: 'ORG_MGMT', prerequisites: null, corequisites: null },
        { name: 'Principles of Marketing', code: 'PRIN_MARKET', prerequisites: null, corequisites: null },
      ]
    },
    12: {
      1: [
        { name: 'Personal Development', code: 'PERS_DEV_ABM', prerequisites: null, corequisites: null },
        { name: 'Understanding Culture, Society and Politics', code: 'UCSP_ABM', prerequisites: null, corequisites: null },
        { name: 'Physical Education and Health', code: 'PE_HEALTH_ABM_3', prerequisites: null, corequisites: null },
        { name: 'Practical Research 2', code: 'PRAC_RES_2_ABM', prerequisites: 'Practical Research 1, Statistics and Probability', corequisites: null },
        { name: 'English for Academic and Professional Purposes', code: 'EAPP_ABM', prerequisites: null, corequisites: null },
        { name: 'Fundamentals of Accountancy, Business and Management 2', code: 'FABM_2', prerequisites: 'Fundamentals of Accountancy, Business and Management 1', corequisites: null },
        { name: 'Business Finance', code: 'BUS_FINANCE', prerequisites: 'Fundamentals of Accountancy, Business and Management 1', corequisites: null },
        { name: 'Applied Economics', code: 'APPLIED_ECON', prerequisites: null, corequisites: null },
      ],
      2: [
        { name: 'Media and Information Literacy', code: 'MIL_ABM', prerequisites: null, corequisites: null },
        { name: 'Contemporary Philippine Arts from the regions', code: 'CPAR_ABM', prerequisites: null, corequisites: null },
        { name: 'Physical Education and Health', code: 'PE_HEALTH_ABM_4', prerequisites: null, corequisites: null },
        { name: 'Entrepreneurship', code: 'ENTREP_ABM', prerequisites: null, corequisites: null },
        { name: 'Filipino sa Piling Larang', code: 'FIL_LARANG_ABM', prerequisites: null, corequisites: null },
        { name: 'Business Enterprise Simulation', code: 'BUS_ENT_SIM', prerequisites: null, corequisites: null },
        { name: 'Work Immersion/Research/Career Advocacy/Culminating Activity', code: 'WORK_IMMERSION_ABM', prerequisites: null, corequisites: null },
      ]
    }
  }
}

export default function SubjectForm({ subject = null, strands = [], semesters = [], activeSemester = null, onClose }) {
  const isEditing = !!subject
  const [selectedStrand, setSelectedStrand] = useState(subject?.strand_id?.toString() || '')
  const [selectedYear, setSelectedYear] = useState(subject?.year_level?.toString() || '')
  // Removed selectedSemester - will use activeSemester automatically
  const [availableSubjects, setAvailableSubjects] = useState([])
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [formData, setFormData] = useState({
    Subject_name: subject?.Subject_name || '',
    Subject_code: subject?.Subject_code || '',
    PREREQUISITES: subject?.PREREQUISITES || '',
    'CO-REQUISITES': subject?.['CO-REQUISITES'] || '',
  })
  const [errors, setErrors] = useState({})
  const [processing, setProcessing] = useState(false)
  
  // Get semester number from active semester
  const activeSemesterNumber = activeSemester?.semester_type === '1st Semester' ? '1' : '2'

  // Update available subjects when strand, year, or active semester changes
  useEffect(() => {
    if (selectedStrand && selectedYear && activeSemesterNumber) {
      const strandCode = strands.find(s => s.id.toString() === selectedStrand)?.Strand_code
      const semesterNum = parseInt(activeSemesterNumber)
      
      if (strandCode && subjectsByStrandAndYear[strandCode] && 
          subjectsByStrandAndYear[strandCode][parseInt(selectedYear)] &&
          subjectsByStrandAndYear[strandCode][parseInt(selectedYear)][semesterNum]) {
        setAvailableSubjects(subjectsByStrandAndYear[strandCode][parseInt(selectedYear)][semesterNum])
      } else {
        setAvailableSubjects([])
      }
    } else {
      setAvailableSubjects([])
    }
    setSelectedSubject(null)
  }, [selectedStrand, selectedYear, activeSemesterNumber, strands])

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Check if there are any strands available
    if (!strands || strands.length === 0) {
      setErrors({ strand: 'No active strands available. Please activate at least one strand first.' })
      return
    }
    
    if (isEditing) {
      // Edit mode - use form data directly
      if (!formData.Subject_name || !formData.Subject_code) {
        setErrors({ Subject_name: 'Subject name and code are required' })
        return
      }
    } else {
      // Add mode - require subject selection
      if (!selectedSubject) {
        setErrors({ subject: 'Please select a subject' })
        return
      }
    }

    setProcessing(true)
    setErrors({})

    const submitData = isEditing ? {
      Subject_name: formData.Subject_name,
      Subject_code: formData.Subject_code,
      Semester: activeSemesterNumber,
      year_level: parseInt(selectedYear),
      strand_id: parseInt(selectedStrand),
      PREREQUISITES: formData.PREREQUISITES || null,
      'CO-REQUISITES': formData['CO-REQUISITES'] || null,
    } : {
      Subject_name: selectedSubject.name,
      Subject_code: selectedSubject.code,
      // Removed Semester from form data - backend will use active semester automatically
      year_level: parseInt(selectedYear),
      strand_id: parseInt(selectedStrand),
      PREREQUISITES: selectedSubject.prerequisites || null,
      'CO-REQUISITES': selectedSubject.corequisites || null,
    }

    if (isEditing) {
      router.put(`/registrar/subjects/${subject.Id}`, submitData, {
        onSuccess: () => {
          onClose()
        },
        onError: (errors) => {
          setErrors(errors)
          setProcessing(false)
        },
        onFinish: () => {
          setProcessing(false)
        }
      })
    } else {
      router.post('/registrar/subjects', submitData, {
        onSuccess: () => {
          onClose()
        },
        onError: (errors) => {
          setErrors(errors)
          setProcessing(false)
        },
        onFinish: () => {
          setProcessing(false)
        }
      })
    }
  }

  const handleSubjectSelect = (e) => {
    const subjectIndex = parseInt(e.target.value)
    if (subjectIndex >= 0) {
      setSelectedSubject(availableSubjects[subjectIndex])
    } else {
      setSelectedSubject(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
        
        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
          <div className="absolute right-0 top-0 pr-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="mt-3 text-center sm:ml-0 sm:mt-0 sm:text-left w-full">
              <h3 className="text-base font-semibold leading-6 text-gray-900 mb-4">
                {isEditing ? 'Edit Subject' : 'Add Subject to Curriculum'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Step 1: Select Strand and Year (Semester is automatically set to active semester) */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    {isEditing ? 'Curriculum Details' : 'Step 1: Select Curriculum Details'}
                    {activeSemester && (
                      <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                        {activeSemester.semester_type}
                      </span>
                    )}
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Strand */}
                    <div>
                      <label htmlFor="strand" className="block text-sm font-medium leading-6 text-gray-900">
                        Strand *
                      </label>
                      <select
                        id="strand"
                        value={selectedStrand}
                        onChange={(e) => setSelectedStrand(e.target.value)}
                        disabled={isEditing}
                        className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">Select strand</option>
                        {strands.map((strand) => (
                          <option key={strand.id} value={strand.id}>
                            {strand.Strand_code} - {strand.strand_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Year Level */}
                    <div>
                      <label htmlFor="year" className="block text-sm font-medium leading-6 text-gray-900">
                        Year Level *
                      </label>
                      <select
                        id="year"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        disabled={isEditing}
                        className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">Select year</option>
                        <option value="11">Grade 11</option>
                        <option value="12">Grade 12</option>
                      </select>
                    </div>

                  </div>
                </div>

                {/* Edit Mode: Direct Form Fields */}
                {isEditing ? (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Subject Details</h4>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="Subject_name" className="block text-sm font-medium leading-6 text-gray-900">
                          Subject Name *
                        </label>
                        <input
                          type="text"
                          id="Subject_name"
                          value={formData.Subject_name}
                          onChange={(e) => setFormData({ ...formData, Subject_name: e.target.value })}
                          className={`mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${
                            errors.Subject_name ? 'ring-red-300' : 'ring-gray-300'
                          } focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6`}
                        />
                        {errors.Subject_name && (
                          <p className="mt-1 text-sm text-red-600">{errors.Subject_name}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="Subject_code" className="block text-sm font-medium leading-6 text-gray-900">
                          Subject Code *
                        </label>
                        <input
                          type="text"
                          id="Subject_code"
                          value={formData.Subject_code}
                          onChange={(e) => setFormData({ ...formData, Subject_code: e.target.value })}
                          className={`mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${
                            errors.Subject_code ? 'ring-red-300' : 'ring-gray-300'
                          } focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6`}
                        />
                        {errors.Subject_code && (
                          <p className="mt-1 text-sm text-red-600">{errors.Subject_code}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="PREREQUISITES" className="block text-sm font-medium leading-6 text-gray-900">
                          Prerequisites
                        </label>
                        <textarea
                          id="PREREQUISITES"
                          value={formData.PREREQUISITES}
                          onChange={(e) => setFormData({ ...formData, PREREQUISITES: e.target.value })}
                          rows={2}
                          className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        />
                      </div>
                      <div>
                        <label htmlFor="CO-REQUISITES" className="block text-sm font-medium leading-6 text-gray-900">
                          Co-requisites
                        </label>
                        <textarea
                          id="CO-REQUISITES"
                          value={formData['CO-REQUISITES']}
                          onChange={(e) => setFormData({ ...formData, 'CO-REQUISITES': e.target.value })}
                          rows={2}
                          className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Step 2: Select Subject */}
                    {availableSubjects.length > 0 && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Step 2: Select Subject</h4>
                        <div>
                          <label htmlFor="subject" className="block text-sm font-medium leading-6 text-gray-900">
                            Available Subjects *
                          </label>
                          <select
                            id="subject"
                            onChange={handleSubjectSelect}
                            className={`mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${
                              errors.subject ? 'ring-red-300' : 'ring-gray-300'
                            } focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6`}
                          >
                            <option value="">Select a subject</option>
                            {availableSubjects.map((subject, index) => (
                              <option key={index} value={index}>
                                {subject.name} ({subject.code})
                              </option>
                            ))}
                          </select>
                          {errors.subject && (
                            <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Step 3: Subject Details Preview */}
                    {selectedSubject && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Step 3: Subject Details</h4>
                        <div className="space-y-3">
                          <div>
                            <span className="text-sm font-medium text-gray-700">Subject Name:</span>
                            <span className="ml-2 text-sm text-gray-900">{selectedSubject.name}</span>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-700">Subject Code:</span>
                            <span className="ml-2 text-sm text-gray-900 font-mono">{selectedSubject.code}</span>
                          </div>
                          {selectedSubject.prerequisites && (
                            <div>
                              <span className="text-sm font-medium text-gray-700">Prerequisites:</span>
                              <div className="mt-1 p-2 bg-yellow-100 rounded text-sm text-yellow-800">
                                {selectedSubject.prerequisites}
                              </div>
                            </div>
                          )}
                          {selectedSubject.corequisites && (
                            <div>
                              <span className="text-sm font-medium text-gray-700">Co-requisites:</span>
                              <div className="mt-1 p-2 bg-blue-100 rounded text-sm text-blue-800">
                                {selectedSubject.corequisites}
                              </div>
                            </div>
                          )}
                          {!selectedSubject.prerequisites && !selectedSubject.corequisites && (
                            <div className="text-sm text-gray-500 italic">
                              No prerequisites or co-requisites required
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Form Actions */}
                <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processing || (!isEditing && !selectedSubject) || (isEditing && (!formData.Subject_name || !formData.Subject_code))}
                    className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? (isEditing ? 'Updating Subject...' : 'Adding Subject...') : (isEditing ? 'Update Subject' : 'Add Subject to Curriculum')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
