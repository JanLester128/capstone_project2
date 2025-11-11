import { useState } from 'react'
import { Head, useForm } from '@inertiajs/react'
import StudentSidebar from '../Auth/Student_sidebar'

// Updated for navigation fix
export default function EnrollmentForm({ strands, studentInfo, strandPreferences, activeSchoolYear, enrollmentStatus }) {
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 5

  // Mindanao provinces data
  const mindanaoProvinces = [
    'Agusan del Norte', 'Agusan del Sur', 'Basilan', 'Bukidnon', 'Camiguin',
    'Compostela Valley', 'Cotabato', 'Davao del Norte', 'Davao del Sur', 'Davao Occidental',
    'Davao Oriental', 'Dinagat Islands', 'Lanao del Norte', 'Lanao del Sur', 'Maguindanao',
    'Misamis Occidental', 'Misamis Oriental', 'North Cotabato', 'Sarangani', 'South Cotabato',
    'Sultan Kudarat', 'Sulu', 'Surigao del Norte', 'Surigao del Sur', 'Tawi-Tawi', 'Zamboanga del Norte',
    'Zamboanga del Sur', 'Zamboanga Sibugay'
  ]

  // Extension name options
  const extensionNameOptions = ['Jr.', 'Sr.', 'II', 'III', 'IV', 'V']

  // Calculate age from birthdate
  const calculateAge = (birthdate) => {
    if (!birthdate) return ''
    const today = new Date()
    const birth = new Date(birthdate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const { data, setData, post, processing, errors } = useForm({
    // Basic Information
    psa_birth_certificate_no: studentInfo?.psa_birth_certificate_no || '',
    extension_name: studentInfo?.extension_name || '',
    birthdate: studentInfo?.birthdate ? studentInfo.birthdate.split('T')[0] : '',
    age: studentInfo?.age || calculateAge(studentInfo?.birthdate) || '',
    sex: studentInfo?.sex || '',
    place_of_birth: studentInfo?.place_of_birth || '',
    religion: studentInfo?.religion || '',
    mother_tongue: studentInfo?.mother_tongue || '',
    
    // 4Ps Information
    is_4ps_beneficiary: studentInfo?.is_4ps_beneficiary || false,
    '4ps_household_id': studentInfo?.['4ps_household_id'] || '',
    
    // Current Address
    current_house_no: studentInfo?.current_house_no || '',
    current_sitio_street: studentInfo?.current_sitio_street || '',
    current_barangay: studentInfo?.current_barangay || '',
    current_municipality_city: studentInfo?.current_municipality_city || '',
    current_province: studentInfo?.current_province || '',
    
    
    // Parents Information
    father_last_name: studentInfo?.father_last_name || '',
    father_first_name: studentInfo?.father_first_name || '',
    father_middle_name: studentInfo?.father_middle_name || '',
    father_contact_number: studentInfo?.father_contact_number || '',
    father_occupation: studentInfo?.father_occupation || '',
    mother_last_name: studentInfo?.mother_last_name || '',
    mother_first_name: studentInfo?.mother_first_name || '',
    mother_middle_name: studentInfo?.mother_middle_name || '',
    mother_contact_number: studentInfo?.mother_contact_number || '',
    mother_occupation: studentInfo?.mother_occupation || '',
    
    // Guardian Information
    guardian_last_name: studentInfo?.guardian_last_name || '',
    guardian_first_name: studentInfo?.guardian_first_name || '',
    guardian_middle_name: studentInfo?.guardian_middle_name || '',
    guardian_contact_number: studentInfo?.guardian_contact_number || '',
    guardian_relationship: studentInfo?.guardian_relationship || '',
    guardian_occupation: studentInfo?.guardian_occupation || '',
    
    // Special Needs
    has_special_needs: studentInfo?.has_special_needs || false,
    medical_diagnosis: studentInfo?.medical_diagnosis || '',
    manifestations: studentInfo?.manifestations || '',
    
    // Previous School
    last_school_attended: studentInfo?.last_school_attended || '',
    school_year_last_attended: studentInfo?.school_year_last_attended || '',
    last_school_address: studentInfo?.last_school_address || '',
    last_school_type: studentInfo?.last_school_type || '',
    grade_level_completed: studentInfo?.grade_level_completed || '',
    
    // Senior High School
    semester: studentInfo?.semester || '1st',
    
    // Learning Modalities (convert from comma-separated string to array for UI)
    learning_modalities: studentInfo?.learning_modalities ? studentInfo.learning_modalities.split(',').filter(Boolean) : [],
    
    // Strand Preferences
    strand_preferences: [
      strandPreferences?.[1] || '',
      strandPreferences?.[2] || '',
      strandPreferences?.[3] || ''
    ],
    
    // Document Uploads
    psa_birth_certificate_photo: null,
    report_card_photo: null
  })

  // Handle birthdate change and auto-calculate age
  const handleBirthdateChange = (value) => {
    setData('birthdate', value)
    const calculatedAge = calculateAge(value)
    if (calculatedAge) {
      setData('age', calculatedAge)
    }
  }

  // Strand preference helper functions
  const handleStrandPreferenceChange = (index, value) => {
    const newPreferences = [...data.strand_preferences]
    newPreferences[index] = value
    setData('strand_preferences', newPreferences)
  }

  const addStrandPreference = () => {
    if (data.strand_preferences.length < 3) {
      setData('strand_preferences', [...data.strand_preferences, ''])
    }
  }

  const removeStrandPreference = (index) => {
    if (index > 0) {
      const newPreferences = data.strand_preferences.filter((_, i) => i !== index)
      setData('strand_preferences', newPreferences)
    }
  }

  // Helper function to render N/A option for inputs
  const renderNAOption = (fieldName, placeholder, type = 'text', options = null) => {
    const isNA = data[fieldName] === 'N/A'
    
    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id={`${fieldName}_na`}
            checked={isNA}
            onChange={(e) => {
              if (e.target.checked) {
                setData(fieldName, 'N/A')
              } else {
                setData(fieldName, '')
              }
            }}
            className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
          <label htmlFor={`${fieldName}_na`} className="text-sm text-gray-600">
            N/A (Not Applicable)
          </label>
        </div>
        
        {!isNA && (
          <>
            {options ? (
              <select
                value={data[fieldName]}
                onChange={(e) => setData(fieldName, e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              >
                <option value="">{placeholder}</option>
                {options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={type}
                value={data[fieldName]}
                onChange={(e) => setData(fieldName, e.target.value)}
                placeholder={placeholder}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
            )}
          </>
        )}
        
        {isNA && (
          <div className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 px-3 py-2 text-gray-500">
            N/A
          </div>
        )}
      </div>
    )
  }

  const medicalDiagnosisOptions = [
    'Attention Deficit Hyperactivity Disorder',
    'Autism Spectrum Disorder',
    'Cerebral Palsy',
    'Emotional-Behavior Disorder',
    'Hearing Impairment',
    'Intellectual Disability',
    'Learning Disability',
    'Multiple Disabilities',
    'Orthopedic/Physical Handicap',
    'Speech/Language Disorder',
    'Special Health Problem/Chronic Disease (Cancer)',
    'Special Health Problem/Chronic Disease (Non-Cancer)',
    'Visual Impairment (Blind)',
    'Visual Impairment (Low Vision)',
  ]

  const manifestationOptions = [
    'Difficulty in Applying Knowledge',
    'Difficulty in Communicating',
    'Difficulty in Displaying Interpersonal Behavior (Emotional and Behavioral)',
    'Difficulty in Hearing',
    'Difficulty in Mobility (Walking, Climbing and Grasping)',
    'Difficulty in Performing Adaptive Skills (Self-Care)',
    'Difficulty in Remembering, Concentrating, Paying Attention and Understanding',
    'Difficulty in Seeing',
  ]

  const learningModalityOptions = [
    'Blended (Combination)',
    'Homeschooling',
    'Modular (Print)',
    'Radio-Based Television',
    'Educational Television',
    'Modular (Digital)',
    'Online',
  ]


  function handleSubmit(e) {
    e.preventDefault()
    
    // Convert arrays to comma-separated strings for database storage
    const formData = {
      ...data,
      learning_modalities: data.learning_modalities.join(','),
    }
    
    post('/student/enrollment', {
      data: formData,
      forceFormData: true
    })
  }

  function nextStep() {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  function prevStep() {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  function handleCheckboxChange(field, value, checked) {
    const currentArray = data[field] || []
    if (checked) {
      setData(field, [...currentArray, value])
    } else {
      setData(field, currentArray.filter(item => item !== value))
    }
  }

  const stepTitles = [
    'Personal Information',
    'Address Information',
    'Family Information',
    'Educational Background',
    'Senior High School & Strand Preferences'
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <StudentSidebar enrollmentStatus={enrollmentStatus} />
      <div className="flex-1">
        <Head title="Student Personal Information" />
      
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Student Personal Information Form</h1>
                <p className="text-gray-600">Please fill out all required information to complete your enrollment.</p>
              </div>
              {activeSchoolYear && (
                <div className="text-right">
                  <div className="text-sm text-gray-500">School Year</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {activeSchoolYear.School_year_start}-{activeSchoolYear.School_year_end}
                  </div>
                </div>
              )}
            </div>
            
            
            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Step {currentStep} of {totalSteps}</span>
                <span>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                ></div>
              </div>
              <p className="mt-2 text-sm font-medium text-gray-700">{stepTitles[currentStep - 1]}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              
              {/* Step 1: Personal Information */}
              {currentStep === 1 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-3 mb-6">
                    Personal Information
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        PSA Birth Certificate No.
                      </label>
                      <input
                        type="text"
                        value={data.psa_birth_certificate_no}
                        onChange={(e) => setData('psa_birth_certificate_no', e.target.value)}
                        placeholder="Optional"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Extension Name (e.g., Jr., III)
                      </label>
                      {renderNAOption('extension_name', 'Select extension name', 'text', extensionNameOptions)}
                      {errors.extension_name && <p className="mt-1 text-sm text-red-600">{errors.extension_name}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Birthdate *
                      </label>
                      <input
                        type="date"
                        required
                        value={data.birthdate}
                        onChange={(e) => handleBirthdateChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {errors.birthdate && <p className="mt-1 text-sm text-red-600">{errors.birthdate}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Age * <span className="text-sm text-gray-500">(Auto-calculated from birthdate)</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="100"
                        value={data.age}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                      />
                      {errors.age && <p className="mt-1 text-sm text-red-600">{errors.age}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sex *
                      </label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="sex"
                            value="Female"
                            checked={data.sex === 'Female'}
                            onChange={(e) => setData('sex', e.target.value)}
                            className="mr-2"
                          />
                          Female
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="sex"
                            value="Male"
                            checked={data.sex === 'Male'}
                            onChange={(e) => setData('sex', e.target.value)}
                            className="mr-2"
                          />
                          Male
                        </label>
                      </div>
                      {errors.sex && <p className="mt-1 text-sm text-red-600">{errors.sex}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Place of Birth *
                      </label>
                      <input
                        type="text"
                        required
                        value={data.place_of_birth}
                        onChange={(e) => setData('place_of_birth', e.target.value)}
                        placeholder="Municipality/City"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {errors.place_of_birth && <p className="mt-1 text-sm text-red-600">{errors.place_of_birth}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Religion
                      </label>
                      {renderNAOption('religion', 'Enter your religion')}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mother Tongue
                      </label>
                      {renderNAOption('mother_tongue', 'Enter your mother tongue')}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Address Information */}
              {currentStep === 2 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-3 mb-6">
                    Address Information
                  </h2>

                  {/* 4Ps Section */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-3">4Ps Beneficiary Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={data.is_4ps_beneficiary}
                            onChange={(e) => setData('is_4ps_beneficiary', e.target.checked)}
                            className="mr-2"
                          />
                          Is your family a beneficiary of 4Ps?
                        </label>
                      </div>
                      {data.is_4ps_beneficiary && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">4Ps Household ID</label>
                          <input
                                value={data['4ps_household_id']}
                            onChange={(e) => setData('4ps_household_id', e.target.value)}
                                placeholder="Enter 4Ps Household ID"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Current Address */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Current Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">House No.</label>
                        <input
                            value={data.current_house_no}
                          onChange={(e) => setData('current_house_no', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Sitio/Street Name</label>
                        <input
                            value={data.current_sitio_street}
                          onChange={(e) => setData('current_sitio_street', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Barangay</label>
                        <input
                            value={data.current_barangay}
                          onChange={(e) => setData('current_barangay', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Municipality/City</label>
                        <input
                            value={data.current_municipality_city}
                          onChange={(e) => setData('current_municipality_city', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Province</label>
                        <select
                          value={data.current_province}
                          onChange={(e) => setData('current_province', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                          <option value="">Select Province</option>
                          {mindanaoProvinces.map((province) => (
                            <option key={province} value={province}>
                              {province}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* Step 3: Family Information */}
              {currentStep === 3 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-3 mb-6">
                    Family Information
                  </h2>
                  
                  {/* Parent's Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-3">Father's Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                        <input
                            type="text"
                            value={data.father_first_name}
                          onChange={(e) => setData('father_first_name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Middle Name</label>
                        <input
                            type="text"
                            value={data.father_middle_name}
                          onChange={(e) => setData('father_middle_name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                        <input
                            type="text"
                            value={data.father_last_name}
                          onChange={(e) => setData('father_last_name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                        {renderNAOption('father_contact_number', 'Enter father\'s contact number')}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Occupation</label>
                        {renderNAOption('father_occupation', 'Enter father\'s occupation')}
                      </div>
                    </div>
                  </div>

                  {/* Mother's Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-3">Mother's Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                        <input
                            type="text"
                            value={data.mother_first_name}
                          onChange={(e) => setData('mother_first_name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Middle Name</label>
                        <input
                            type="text"
                            value={data.mother_middle_name}
                          onChange={(e) => setData('mother_middle_name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                        <input
                            type="text"
                            value={data.mother_last_name}
                          onChange={(e) => setData('mother_last_name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                        <input
                            type="tel"
                            value={data.mother_contact_number}
                          onChange={(e) => setData('mother_contact_number', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Occupation</label>
                        <input
                            type="text"
                            value={data.mother_occupation}
                          onChange={(e) => setData('mother_occupation', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                      </div>
                    </div>
                  </div>

                  {/* Guardian Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-3">Guardian Information (if different from parents)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                        <input
                            type="text"
                            value={data.guardian_first_name}
                          onChange={(e) => setData('guardian_first_name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                        <input
                            type="text"
                            value={data.guardian_last_name}
                          onChange={(e) => setData('guardian_last_name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                        <input
                            value={data.guardian_contact_number}
                          onChange={(e) => setData('guardian_contact_number', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
                        <input
                            value={data.guardian_relationship}
                          onChange={(e) => setData('guardian_relationship', e.target.value)}
                            placeholder="e.g., Aunt, Uncle, Grandparent"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Educational Background */}
              {currentStep === 4 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-3 mb-6">
                    Educational Background
                  </h2>
                  
                  {/* Special Needs Education */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-3">Special Needs Education</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={data.has_special_needs}
                            onChange={(e) => setData('has_special_needs', e.target.checked)}
                            className="mr-2"
                          />
                          Does the student have special needs?
                        </label>
                      </div>
                      {data.has_special_needs && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Medical Diagnosis</label>
                            <input
                                    type="text"
                                    value={data.medical_diagnosis}
                              onChange={(e) => setData('medical_diagnosis', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Manifestations</label>
                            <input
                                    type="text"
                                    value={data.manifestations}
                              onChange={(e) => setData('manifestations', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Previous School Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-3">Previous School Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Last School Attended</label>
                        <input
                            type="text"
                            value={data.last_school_attended}
                            onChange={(e) => setData('last_school_attended', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">School Year Last Attended</label>
                        <input
                            type="text"
                            value={data.school_year_last_attended}
                          onChange={(e) => setData('school_year_last_attended', e.target.value)}
                            placeholder="e.g., 2023-2024"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">School Address</label>
                        <input
                            type="text"
                            value={data.last_school_address}
                          onChange={(e) => setData('last_school_address', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Grade Level Completed</label>
                        <input
                            value={data.grade_level_completed}
                          onChange={(e) => setData('grade_level_completed', e.target.value)}
                            placeholder="e.g., Grade 10"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Senior High School & Strand Preferences */}
              {currentStep === 5 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-3 mb-6">
                    Senior High School & Strand Preferences
                  </h2>
                  
                  {/* Semester Selection */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-3">Semester</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Semester *</label>
                      <select
                        value={data.semester}
                        onChange={(e) => setData('semester', e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="1st">1st Semester</option>
                        <option value="2nd">2nd Semester</option>
                      </select>
                      {errors.semester && <p className="mt-1 text-sm text-red-600">{errors.semester}</p>}
                    </div>
                  </div>

                  {/* Strand Preferences */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-3">Strand Preferences</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Select your preferred strands in order of preference (minimum 1, maximum 3). 
                      Your first choice will be prioritized during enrollment.
                    </p>
                    
                    {!strands || strands.length === 0 ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                        <p className="text-yellow-800 text-sm">
                          ⚠️ No active strands available. Please contact the registrar's office.
                        </p>
                      </div>
                    ) : (
                    
                    <div className="space-y-4">
                      {data.strand_preferences.map((preference, index) => (
                        <div key={index} className="flex items-center space-x-4">
                          <span className="text-sm font-medium text-gray-700 w-20">
                            {index === 0 ? '1st Choice' : index === 1 ? '2nd Choice' : '3rd Choice'}:
                          </span>
                          <select
                            value={preference}
                            onChange={(e) => handleStrandPreferenceChange(index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required={index === 0}
                          >
                            <option value="">Select a strand</option>
                            {strands?.filter(strand => 
                              !data.strand_preferences.includes(strand.id.toString()) || strand.id.toString() === preference
                            ).map(strand => (
                              <option key={strand.id} value={strand.id}>
                                {strand.Strand_name}
                              </option>
                            ))}
                          </select>
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => removeStrandPreference(index)}
                              className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                      
                      {data.strand_preferences.length < 3 && (
                        <button
                          type="button"
                          onClick={addStrandPreference}
                          className="flex items-center px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md"
                        >
                          <span className="mr-2">+</span>
                          Add another preference
                        </button>
                      )}
                    </div>
                    )}
                    {errors.strand_preferences && <p className="mt-2 text-sm text-red-600">{errors.strand_preferences}</p>}
                  </div>

                  {/* Document Uploads */}
                  <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-4">Required Documents</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          PSA Birth Certificate Photo *
                        </label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => setData('psa_birth_certificate_photo', e.target.files[0])}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                        {errors.psa_birth_certificate_photo && (
                          <p className="mt-1 text-sm text-red-600">{errors.psa_birth_certificate_photo}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                          Upload a clear photo or scan of your PSA Birth Certificate. Max size: 2MB.
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Report Card Photo *
                        </label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => setData('report_card_photo', e.target.files[0])}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                        {errors.report_card_photo && (
                          <p className="mt-1 text-sm text-red-600">{errors.report_card_photo}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                          Upload your most recent report card. Max size: 2MB.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {currentStep < totalSteps ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={processing}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {processing ? 'Submitting...' : 'Submit Enrollment'}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
      </div>
    </div>
  )
}
