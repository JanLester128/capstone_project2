import { useState, useEffect } from 'react'
import { Head, useForm, Link, router } from '@inertiajs/react'

export default function StudentRegister({ strands = [], addressData = {} }) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const totalSteps = 4

  // Get provinces from addressData
  const provinces = Object.keys(addressData || {})
  
  // State for cascading dropdowns
  const [municipalities, setMunicipalities] = useState([])
  const [barangays, setBarangays] = useState([])

  // Address data is loaded from props

  const guardianRelationshipOptions = [
    { value: 'Mother', label: 'Mother' },
    { value: 'Father', label: 'Father' },
    { value: 'Guardian', label: 'Legal Guardian' },
    { value: 'Relative', label: 'Relative (e.g., grandparent, sibling, aunt/uncle)' },
    { value: 'Other', label: 'Other' },
  ]

  const { data, setData, post, processing, errors, reset } = useForm({
    // Basic Info
    first_name: '',
    middle_name: '',
    last_name: '',
    extension_name: '',
    birthdate: '',
    age: '',
    sex: '',
    email: '',
    lrn: '',
    password: '',
    password_confirmation: '',
    // Personal Information
    place_of_birth: '',
    religion: '',
    student_status: 'new',
    // Address
    current_sitio_street: '',
    current_barangay: '',
    current_municipality_city: '',
    current_province: '',
    current_zip_code: '',
    // Guardian
    guardian_name: '',
    guardian_contact_number: '',
    guardian_address: '',
    guardian_relationship: '',
    // Previous School
    last_school_attended: '',
    school_year_last_attended: '',
    last_school_address: '',
    last_school_type: '',
    grade_level_completed: '',
    // Transferee
    previous_school: '',
  })

  const isTransferee = () => String(data.student_status || '').toLowerCase() === 'transferee'

  useEffect(() => {
    if (isTransferee() && data.previous_school && !data.last_school_attended) {
      setData('last_school_attended', data.previous_school)
    }
    // Clear previous_school if not a transferee to avoid validation errors
    if (!isTransferee() && data.previous_school) {
      setData('previous_school', '')
    }
  }, [data.student_status, data.previous_school])

  // Load municipalities when province changes
  useEffect(() => {
    if (data.current_province && addressData && addressData[data.current_province]) {
      const provinceData = addressData[data.current_province]
      
      // Check if municipalities exist
      if (provinceData && provinceData.municipalities) {
        const muniList = Object.keys(provinceData.municipalities)
        setMunicipalities(muniList)
        
        // Reset municipality and barangay when province changes
        if (data.current_municipality_city && !muniList.includes(data.current_municipality_city)) {
          setData('current_municipality_city', '')
          setData('current_barangay', '')
          setData('current_zip_code', '')
          setBarangays([])
        }
        
        // Auto-set zip code based on province (only if no municipality selected)
        if (!data.current_municipality_city && provinceData.zip_code) {
          setData('current_zip_code', provinceData.zip_code)
        }
      } else {
        setMunicipalities([])
        setBarangays([])
      }
    } else {
      setMunicipalities([])
      setBarangays([])
      if (!data.current_province) {
        setData('current_zip_code', '')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.current_province])

  // Load barangays when municipality changes
  useEffect(() => {
    if (data.current_province && data.current_municipality_city && addressData && addressData[data.current_province]) {
      const provinceData = addressData[data.current_province]
      
      // Check if municipalities exist
      if (provinceData && provinceData.municipalities) {
        const muniData = provinceData.municipalities[data.current_municipality_city]
        
        if (muniData && muniData.barangays) {
          // Get barangay names (keys) from the barangays object
          const brgyList = Object.keys(muniData.barangays)
          setBarangays(brgyList)
          
          // Reset barangay when municipality changes if current selection is invalid
          if (data.current_barangay && !brgyList.includes(data.current_barangay)) {
            setData('current_barangay', '')
          }
          
          // Auto-set zip code based on municipality (if barangay not selected yet)
          if (!data.current_barangay && muniData.zip_code) {
            setData('current_zip_code', muniData.zip_code)
          }
        } else {
          setBarangays([])
        }
      } else {
        setBarangays([])
      }
    } else {
      setBarangays([])
      // Reset zip code to province default if municipality is cleared
      if (!data.current_municipality_city && data.current_province && addressData && addressData[data.current_province]) {
        const provinceZip = addressData[data.current_province].zip_code
        if (provinceZip) {
          setData('current_zip_code', provinceZip)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.current_municipality_city, data.current_province])

  // Auto-set zip code when barangay changes
  useEffect(() => {
    if (data.current_province && data.current_municipality_city && data.current_barangay && addressData && addressData[data.current_province]) {
      const provinceData = addressData[data.current_province]
      
      if (provinceData && provinceData.municipalities) {
        const muniData = provinceData.municipalities[data.current_municipality_city]
        
        if (muniData && muniData.barangays) {
          // Get zip code for the specific barangay
          const brgyZipCode = muniData.barangays[data.current_barangay]
          
          if (brgyZipCode) {
            setData('current_zip_code', brgyZipCode)
          } else if (muniData.zip_code) {
            // Fallback to municipality zip code if barangay-specific zip not found
            setData('current_zip_code', muniData.zip_code)
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.current_barangay])

  function handleSubmit(e) {
    // Always prevent default form submission first
    if (e && e.preventDefault) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    // Only submit if we're on the last step and not already submitting
    // This ensures form only submits when user is on Step 4 and clicks "Create Account"
    if (currentStep !== totalSteps) {
      return
    }
    
    if (isSubmitting || processing) {
      return
    }
    
    // Validate required fields before submission
    const requiredFields = [
      'first_name', 'last_name', 'birthdate', 'age', 'sex', 'email', 'lrn', 
      'password', 'password_confirmation', 'place_of_birth', 'student_status',
      'current_sitio_street', 'current_barangay', 'current_municipality_city', 
      'current_province', 'current_zip_code', 'guardian_name', 
      'guardian_contact_number', 'guardian_address', 'guardian_relationship',
      'last_school_attended', 'school_year_last_attended', 'last_school_address',
      'last_school_type', 'grade_level_completed'
    ]
    
    const missingFields = requiredFields.filter(field => {
      const value = data[field]
      return !value || (typeof value === 'string' && value.trim() === '')
    })
    
    // Check conditional required field for transferees
    if (isTransferee() && (!data.previous_school || data.previous_school.trim() === '')) {
      missingFields.push('previous_school')
    }
    
    if (missingFields.length > 0) {
      alert(`Please fill in all required fields. Missing: ${missingFields.join(', ')}`)
      return
    }
    
    setIsSubmitting(true)
    
    // Submit the form using Inertia's useForm post method
    // This automatically prevents page refresh and uses AJAX
    try {
      post('/student/register', {
        preserveScroll: false,
        onSuccess: () => {
          // Redirect is handled by backend
          setIsSubmitting(false)
        },
        onFinish: () => {
          setIsSubmitting(false)
        },
        onError: (errors) => {
          setIsSubmitting(false)
          // Scroll to top to show errors
          setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }, 100)
        },
        onCancel: () => {
          setIsSubmitting(false)
        },
      })
    } catch (error) {
      setIsSubmitting(false)
      alert('An error occurred while submitting the form. Please try again.')
    }
  }

  function nextStep(e) {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    // Prevent navigation if form is submitting
    if (isSubmitting) {
      return
    }
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  function prevStep() {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Prevent Enter key from submitting form unless on last step
  function handleKeyDown(e) {
    if (e.key === 'Enter' && currentStep < totalSteps) {
    e.preventDefault()
      e.stopPropagation()
      // Don't do anything - let the Next button handle navigation
      return false
    }
  }

  const stepTitles = [
    'Account Information',
    'Personal Information',
    'Address & Guardian',
    'Educational Background'
  ]

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
                id={fieldName}
                name={fieldName}
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
                id={fieldName}
                name={fieldName}
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

  return (
    <>
      <Head title="Student Registration">
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 py-8 px-4" style={{fontFamily: 'Poppins, sans-serif'}}>
        <div className="max-w-3xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            {/* Logo */}
            <div className="mb-6 flex justify-center">
              <div className="h-20 w-20 rounded-full bg-white shadow-lg p-3 flex items-center justify-center">
                <img
                  src="/onsts.png"
                  alt="ONSTS Logo"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
            
            {/* Title with Gradient */}
            <h1 className="text-3xl font-bold mb-2">
              <span style={{ color: '#000825' }}>
                Opol National Secondary Technical School
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-lg text-gray-600 font-medium">
              Student Registration Portal
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-8">
              {/* Form Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Create your account</h2>
                <p className="text-sm text-gray-600">Fill in the details below to register your account.</p>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Step {currentStep} of {totalSteps}</span>
                  <span>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(currentStep / totalSteps) * 100}%`, backgroundColor: '#000825' }}
                  ></div>
                </div>
                <p className="mt-2 text-sm font-medium text-gray-700">{stepTitles[currentStep - 1]}</p>
              </div>

            <form 
              onSubmit={handleSubmit} 
              onKeyDown={handleKeyDown} 
              className="space-y-4" 
              noValidate
            >
              {/* Step 1: Account Information */}
              {currentStep === 1 && (
                <div className="space-y-4">
              {/* Name Fields */}
              <div className="space-y-3">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    autoComplete="given-name"
                    required
                    value={data.first_name}
                    onChange={(e) => setData('first_name', e.target.value)}
                    className={`w-full px-3 py-2 rounded border text-sm focus:outline-none focus:ring-1 focus:ring-[#000825]/50 transition-all duration-200 ${
                      errors.first_name 
                        ? 'border-red-300 bg-red-50 focus:border-red-500' 
                        : 'border-gray-300 bg-white focus:border-[#000825] hover:border-gray-400'
                    }`}
                    placeholder="First name"
                  />
                  {errors.first_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    id="last_name"
                    name="last_name"
                    type="text"
                    autoComplete="family-name"
                    required
                    value={data.last_name}
                    onChange={(e) => setData('last_name', e.target.value)}
                    className={`w-full px-3 py-2 rounded border text-sm focus:outline-none focus:ring-1 focus:ring-[#000825]/50 transition-all duration-200 ${
                      errors.last_name 
                        ? 'border-red-300 bg-red-50 focus:border-red-500' 
                        : 'border-gray-300 bg-white focus:border-[#000825] hover:border-gray-400'
                    }`}
                    placeholder="Last name"
                  />
                  {errors.last_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="middle_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Middle Name
                  </label>
                  <input
                    id="middle_name"
                    name="middle_name"
                    type="text"
                    autoComplete="additional-name"
                    value={data.middle_name}
                    onChange={(e) => setData('middle_name', e.target.value)}
                    className={`w-full px-3 py-2 rounded border text-sm focus:outline-none focus:ring-1 focus:ring-[#000825]/50 transition-all duration-200 ${
                      errors.middle_name 
                        ? 'border-red-300 bg-red-50 focus:border-red-500' 
                        : 'border-gray-300 bg-white focus:border-[#000825] hover:border-gray-400'
                    }`}
                    placeholder="Middle name (optional)"
                  />
                  {errors.middle_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.middle_name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="extension_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Extension Name (e.g., Jr., III)
                  </label>
                  <select
                    id="extension_name"
                    name="extension_name"
                    value={data.extension_name}
                    onChange={(e) => setData('extension_name', e.target.value)}
                    className={`w-full px-3 py-2 rounded border text-sm focus:outline-none focus:ring-1 focus:ring-[#000825]/50 transition-all duration-200 ${
                      errors.extension_name 
                        ? 'border-red-300 bg-red-50 focus:border-red-500' 
                        : 'border-gray-300 bg-white focus:border-[#000825] hover:border-gray-400'
                    }`}
                  >
                    <option value="">None</option>
                    <option value="Jr.">Jr.</option>
                    <option value="Sr.">Sr.</option>
                    <option value="II">II</option>
                    <option value="III">III</option>
                    <option value="IV">IV</option>
                    <option value="V">V</option>
                  </select>
                  {errors.extension_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.extension_name}</p>
                  )}
                </div>
              </div>

              {/* Personal Information */}
              <div className="space-y-3">
                <div>
                  <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700 mb-1">
                    Birthdate *
                  </label>
                  <input
                    id="birthdate"
                    name="birthdate"
                    type="date"
                    required
                    value={data.birthdate}
                    onChange={(e) => {
                      setData('birthdate', e.target.value)
                      // Auto-calculate age
                      if (e.target.value) {
                        const today = new Date()
                        const birth = new Date(e.target.value)
                        let age = today.getFullYear() - birth.getFullYear()
                        const monthDiff = today.getMonth() - birth.getMonth()
                        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                          age--
                        }
                        setData('age', age)
                      }
                    }}
                    className={`w-full px-3 py-2 rounded border text-sm focus:outline-none focus:ring-1 focus:ring-[#000825]/50 transition-all duration-200 ${
                      errors.birthdate 
                        ? 'border-red-300 bg-red-50 focus:border-red-500' 
                        : 'border-gray-300 bg-white focus:border-[#000825] hover:border-gray-400'
                    }`}
                  />
                  {errors.birthdate && (
                    <p className="mt-1 text-sm text-red-600">{errors.birthdate}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                    Age * <span className="text-xs text-gray-500">(Auto-calculated)</span>
                  </label>
                  <input
                    id="age"
                    name="age"
                    type="number"
                    required
                    min="1"
                    max="100"
                    value={data.age}
                    readOnly
                    className="w-full px-3 py-2 rounded border border-gray-300 bg-gray-50 text-gray-600 cursor-not-allowed text-sm"
                  />
                  {errors.age && (
                    <p className="mt-1 text-sm text-red-600">{errors.age}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="sex" className="block text-sm font-medium text-gray-700 mb-1">
                    Sex *
                  </label>
                  <div className="flex space-x-4 mt-2" role="radiogroup" aria-required="true">
                    <label className="flex items-center" htmlFor="sex_female">
                      <input
                        id="sex_female"
                        type="radio"
                        name="sex"
                        value="Female"
                        checked={data.sex === 'Female'}
                        onChange={(e) => setData('sex', e.target.value)}
                        className="mr-2"
                        required
                      />
                      Female
                    </label>
                    <label className="flex items-center" htmlFor="sex_male">
                      <input
                        id="sex_male"
                        type="radio"
                        name="sex"
                        value="Male"
                        checked={data.sex === 'Male'}
                        onChange={(e) => setData('sex', e.target.value)}
                        className="mr-2"
                        required
                      />
                      Male
                    </label>
                  </div>
                  {errors.sex && (
                    <p className="mt-1 text-sm text-red-600">{errors.sex}</p>
                  )}
                </div>
              </div>

              {/* Email and LRN Fields */}
              <div className="space-y-3">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    className={`w-full px-3 py-2 rounded border text-sm focus:outline-none focus:ring-1 focus:ring-[#000825]/50 transition-all duration-200 ${
                      errors.email 
                        ? 'border-red-300 bg-red-50 focus:border-red-500' 
                        : 'border-gray-300 bg-white focus:border-[#000825] hover:border-gray-400'
                    }`}
                    placeholder="Email address"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lrn" className="block text-sm font-medium text-gray-700 mb-1">
                    LRN *
                  </label>
                  <input
                    id="lrn"
                    name="lrn"
                    type="text"
                    autoComplete="off"
                    required
                    value={data.lrn}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 12)
                      setData('lrn', value)
                    }}
                    className={`w-full px-3 py-2 rounded border text-sm focus:outline-none focus:ring-1 focus:ring-[#000825]/50 transition-all duration-200 ${
                      errors.lrn 
                        ? 'border-red-300 bg-red-50 focus:border-red-500' 
                        : 'border-gray-300 bg-white focus:border-[#000825] hover:border-gray-400'
                    }`}
                    placeholder="12-digit LRN"
                    maxLength="12"
                  />
                  {errors.lrn && (
                    <p className="mt-1 text-sm text-red-600">{errors.lrn}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    From DepEd
                  </p>
                </div>
              </div>

              {/* Password Fields */}
              <div className="space-y-3">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={data.password}
                      onChange={(e) => setData('password', e.target.value)}
                      className={`w-full px-3 py-2 pr-10 rounded border text-sm focus:outline-none focus:ring-1 focus:ring-[#000825]/50 transition-all duration-200 ${
                        errors.password 
                          ? 'border-red-300 bg-red-50 focus:border-red-500' 
                          : 'border-gray-300 bg-white focus:border-[#000825] hover:border-gray-400'
                      }`}
                      placeholder="Create password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 px-2 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      {showPassword ? (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      id="password_confirmation"
                      name="password_confirmation"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={data.password_confirmation}
                      onChange={(e) => setData('password_confirmation', e.target.value)}
                      className={`w-full px-3 py-2 pr-10 rounded border text-sm focus:outline-none focus:ring-1 focus:ring-[#000825]/50 transition-all duration-200 ${
                        errors.password_confirmation 
                          ? 'border-red-300 bg-red-50 focus:border-red-500' 
                          : 'border-gray-300 bg-white focus:border-[#000825] hover:border-gray-400'
                      }`}
                      placeholder="Confirm password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 px-2 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      {showConfirmPassword ? (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.password_confirmation && (
                    <p className="mt-1 text-sm text-red-600">{errors.password_confirmation}</p>
                  )}
                </div>
              </div>
                </div>
              )}

              {/* Step 2: Personal Information */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                  
                  <div>
                    <label htmlFor="place_of_birth" className="block text-sm font-medium text-gray-700 mb-1">
                      Place of Birth *
                    </label>
                    <input
                      id="place_of_birth"
                      name="place_of_birth"
                      type="text"
                      required
                      value={data.place_of_birth}
                      onChange={(e) => setData('place_of_birth', e.target.value)}
                      placeholder="Municipality/City"
                      className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#000825]/50"
                    />
                    {errors.place_of_birth && (
                      <p className="mt-1 text-sm text-red-600">{errors.place_of_birth}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="religion" className="block text-sm font-medium text-gray-700 mb-1">
                      Religion
                    </label>
                    {renderNAOption('religion', 'Enter your religion')}
                  </div>

                  <div>
                    <label htmlFor="student_status" className="block text-sm font-medium text-gray-700 mb-1">
                      Student Status *
                    </label>
                    <select
                      id="student_status"
                      name="student_status"
                      value={data.student_status}
                      onChange={(e) => {
                        setData('student_status', e.target.value)
                      }}
                      required
                      className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#000825]/50"
                    >
                      <option value="new">New Student (incoming Grade 11)</option>
                      <option value="continuing">Continuing (Grade 11 - 2nd Sem / Grade 12)</option>
                      <option value="transferee">Transferee (coming from another school)</option>
                    </select>
                    {errors.student_status && (
                      <p className="mt-1 text-sm text-red-600">{errors.student_status}</p>
                    )}
                  </div>

                  {isTransferee() && (
                    <div>
                      <label htmlFor="previous_school" className="block text-sm font-medium text-gray-700 mb-1">
                        Previous School *
                      </label>
                      <input
                        id="previous_school"
                        name="previous_school"
                        type="text"
                        value={data.previous_school}
                        onChange={(e) => setData('previous_school', e.target.value)}
                        placeholder="School name where you previously studied"
                        className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#000825]/50"
                        required
                      />
                      {errors.previous_school && (
                        <p className="mt-1 text-sm text-red-600">{errors.previous_school}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Address & Guardian */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="current_sitio_street" className="block text-sm font-medium text-gray-700 mb-1">Sitio/Street Name *</label>
                      <input
                        id="current_sitio_street"
                        name="current_sitio_street"
                        value={data.current_sitio_street}
                        onChange={(e) => setData('current_sitio_street', e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#000825]/50"
                      />
                      {errors.current_sitio_street && (
                        <p className="mt-1 text-sm text-red-600">{errors.current_sitio_street}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="current_province" className="block text-sm font-medium text-gray-700 mb-1">Province *</label>
                      <select
                        id="current_province"
                        name="current_province"
                        value={data.current_province}
                        onChange={(e) => {
                          setData('current_province', e.target.value)
                          // Reset dependent fields
                          setData('current_municipality_city', '')
                          setData('current_barangay', '')
                          setData('current_zip_code', '')
                        }}
                        className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#000825]/50"
                        required
                      >
                        <option value="">Select Province</option>
                        {provinces.map((province) => (
                          <option key={province} value={province}>
                            {province}
                          </option>
                        ))}
                      </select>
                      {errors.current_province && (
                        <p className="mt-1 text-sm text-red-600">{errors.current_province}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="current_municipality_city" className="block text-sm font-medium text-gray-700 mb-1">Municipality/City *</label>
                      <select
                        id="current_municipality_city"
                        name="current_municipality_city"
                        value={data.current_municipality_city}
                        onChange={(e) => {
                          setData('current_municipality_city', e.target.value)
                          // Reset barangay when municipality changes
                          setData('current_barangay', '')
                        }}
                        className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#000825]/50"
                        disabled={!data.current_province}
                        required
                      >
                        <option value="">{data.current_province ? 'Select Municipality/City' : 'Select Province first'}</option>
                        {municipalities.map((municipality) => (
                          <option key={municipality} value={municipality}>
                            {municipality}
                          </option>
                        ))}
                      </select>
                      {errors.current_municipality_city && (
                        <p className="mt-1 text-sm text-red-600">{errors.current_municipality_city}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="current_barangay" className="block text-sm font-medium text-gray-700 mb-1">Barangay *</label>
                      <select
                        id="current_barangay"
                        name="current_barangay"
                        value={data.current_barangay}
                        onChange={(e) => setData('current_barangay', e.target.value)}
                        className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#000825]/50"
                        disabled={!data.current_municipality_city}
                        required
                      >
                        <option value="">{data.current_municipality_city ? 'Select Barangay' : 'Select Municipality/City first'}</option>
                        {barangays.map((barangay) => (
                          <option key={barangay} value={barangay}>
                            {barangay}
                          </option>
                        ))}
                      </select>
                      {errors.current_barangay && (
                        <p className="mt-1 text-sm text-red-600">{errors.current_barangay}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="current_zip_code" className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                      <input
                        id="current_zip_code"
                        name="current_zip_code"
                        type="text"
                        value={data.current_zip_code}
                        readOnly
                        className="w-full px-3 py-2 rounded border border-gray-300 bg-gray-50 text-gray-600 cursor-not-allowed"
                        placeholder="Auto-filled based on address"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Automatically set based on your selected address
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Parent / Guardian Information</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label htmlFor="guardian_name" className="block text-sm font-medium text-gray-700 mb-1">
                          Parent / Guardian Name *
                        </label>
                        <input
                          id="guardian_name"
                          name="guardian_name"
                          type="text"
                          value={data.guardian_name}
                          onChange={(e) => setData('guardian_name', e.target.value)}
                          required
                          placeholder="Full name of parent or guardian"
                          className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#000825]/50"
                        />
                        {errors.guardian_name && (
                          <p className="mt-1 text-sm text-red-600">{errors.guardian_name}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="guardian_contact_number" className="block text-sm font-medium text-gray-700 mb-1">
                          Contact Number *
                        </label>
                        <input
                          id="guardian_contact_number"
                          name="guardian_contact_number"
                          value={data.guardian_contact_number}
                          onChange={(e) => setData('guardian_contact_number', e.target.value)}
                          placeholder="09XXXXXXXXX"
                          required
                          className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#000825]/50"
                        />
                        {errors.guardian_contact_number && (
                          <p className="mt-1 text-sm text-red-600">{errors.guardian_contact_number}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="guardian_relationship" className="block text-sm font-medium text-gray-700 mb-1">
                          Relationship *
                        </label>
                        <select
                          id="guardian_relationship"
                          name="guardian_relationship"
                          value={data.guardian_relationship}
                          onChange={(e) => setData('guardian_relationship', e.target.value)}
                          required
                          className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#000825]/50"
                        >
                          <option value="">Select relationship</option>
                          {guardianRelationshipOptions.map(({ value, label }) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                        {errors.guardian_relationship && (
                          <p className="mt-1 text-sm text-red-600">{errors.guardian_relationship}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="guardian_address" className="block text-sm font-medium text-gray-700 mb-1">
                          Home Address *
                        </label>
                        <textarea
                          id="guardian_address"
                          name="guardian_address"
                          value={data.guardian_address}
                          onChange={(e) => setData('guardian_address', e.target.value)}
                          required
                          rows={3}
                          placeholder="House No., Street, Barangay, City / Municipality, Province"
                          className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#000825]/50"
                        />
                        {errors.guardian_address && (
                          <p className="mt-1 text-sm text-red-600">{errors.guardian_address}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Educational Background */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Educational Background</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="last_school_attended" className="block text-sm font-medium text-gray-700 mb-1">Last School Attended *</label>
                      <input
                        id="last_school_attended"
                        name="last_school_attended"
                        type="text"
                        value={data.last_school_attended}
                        onChange={(e) => setData('last_school_attended', e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#000825]/50"
                      />
                      {errors.last_school_attended && (
                        <p className="mt-1 text-sm text-red-600">{errors.last_school_attended}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="school_year_last_attended" className="block text-sm font-medium text-gray-700 mb-1">School Year Last Attended *</label>
                      <input
                        id="school_year_last_attended"
                        name="school_year_last_attended"
                        type="text"
                        value={data.school_year_last_attended}
                        onChange={(e) => setData('school_year_last_attended', e.target.value)}
                        placeholder="e.g., 2023-2024"
                        required
                        className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#000825]/50"
                      />
                      {errors.school_year_last_attended && (
                        <p className="mt-1 text-sm text-red-600">{errors.school_year_last_attended}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="last_school_address" className="block text-sm font-medium text-gray-700 mb-1">School Address *</label>
                      <input
                        id="last_school_address"
                        name="last_school_address"
                        type="text"
                        value={data.last_school_address}
                        onChange={(e) => setData('last_school_address', e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#000825]/50"
                      />
                      {errors.last_school_address && (
                        <p className="mt-1 text-sm text-red-600">{errors.last_school_address}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="grade_level_completed" className="block text-sm font-medium text-gray-700 mb-1">Grade Level Completed *</label>
                      <input
                        id="grade_level_completed"
                        name="grade_level_completed"
                        value={data.grade_level_completed}
                        onChange={(e) => setData('grade_level_completed', e.target.value)}
                        placeholder="e.g., Grade 10"
                        required
                        className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#000825]/50"
                      />
                      {errors.grade_level_completed && (
                        <p className="mt-1 text-sm text-red-600">{errors.grade_level_completed}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="last_school_type" className="block text-sm font-medium text-gray-700 mb-1">School Type *</label>
                      <select
                        id="last_school_type"
                        name="last_school_type"
                        value={data.last_school_type}
                        onChange={(e) => setData('last_school_type', e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#000825]/50"
                      >
                        <option value="">Select school type</option>
                        <option value="Private">Private</option>
                        <option value="Public">Public</option>
                      </select>
                      {errors.last_school_type && (
                        <p className="mt-1 text-sm text-red-600">{errors.last_school_type}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#000825]/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {currentStep === totalSteps ? (
              <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={processing || isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {(processing || isSubmitting) && (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                )}
                    {(processing || isSubmitting) ? 'Creating Account...' : 'Create Account'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      nextStep(e)
                    }}
                    className="px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#000825]/50"
                  style={{ backgroundColor: '#000825' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a1f3a'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#000825'}
                  >
                    Next
              </button>
                )}
              </div>

              {/* Back to Login */}
              <div className="text-center border-t border-gray-200 pt-4 mt-4">
                <p className="text-xs text-gray-600 mb-2">
                  Already have an account?
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center font-medium text-xs transition-colors duration-200 hover:underline"
                  style={{ color: '#000825' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#1a1f3a'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#000825'}
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 0a4 4 0 01-4 4H6a4 4 0 01-4-4V7a4 4 0 014-4h1m5 0a4 4 0 014 4v1" />
                  </svg>
                  Back to Login
                </Link>
              </div>

              {/* Information Notice */}
              <div className="rounded p-3" style={{ backgroundColor: '#f0f0f0', border: '1px solid #e0e0e0' }}>
                <div className="flex items-start">
                  <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#000825' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="text-xs font-medium mb-1" style={{ color: '#000825' }}>Account Verification Required</h4>
                    <p className="text-xs leading-relaxed" style={{ color: '#333' }}>
                      After creating your account, please wait for verification from the registrar's office. You will receive an email notification once approved.
                    </p>
                  </div>
                </div>
              </div>
            </form>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
