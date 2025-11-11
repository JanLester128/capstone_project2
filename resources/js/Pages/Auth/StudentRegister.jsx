import { useState } from 'react'
import { Head, useForm, Link } from '@inertiajs/react'

export default function StudentRegister() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const { data, setData, post, processing, errors, reset } = useForm({
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    lrn: '',
    password: '',
    password_confirmation: '',
  })

  function handleSubmit(e) {
    e.preventDefault()
    post('/student/register')
  }

  return (
    <>
      <Head title="Student Registration">
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center px-4 py-4" style={{fontFamily: 'Poppins, sans-serif'}}>
        <div className="w-full max-w-lg bg-white/95 backdrop-blur-sm shadow-2xl rounded-xl overflow-hidden border border-white/20">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-center">
            <div className="relative mb-3">
              <img
                src="/onsts.png"
                alt="ONSTS Logo"
                className="mx-auto h-12 w-12 object-contain drop-shadow-xl"
              />
            </div>
            <h1 className="text-white text-lg font-bold mb-1">
              OPOL NATIONAL SECONDARY
            </h1>
            <h2 className="text-white text-lg font-bold mb-2">
              TECHNICAL SCHOOL
            </h2>
            <p className="text-blue-100 text-sm">
              Create your student account
            </p>
          </div>

          {/* Form Section */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Name Fields */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
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
                      className={`w-full px-3 py-2 rounded border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all duration-200 ${
                        errors.first_name 
                          ? 'border-red-300 bg-red-50 focus:border-red-500' 
                          : 'border-gray-300 bg-white focus:border-blue-500 hover:border-gray-400'
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
                      className={`w-full px-3 py-2 rounded border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all duration-200 ${
                        errors.last_name 
                          ? 'border-red-300 bg-red-50 focus:border-red-500' 
                          : 'border-gray-300 bg-white focus:border-blue-500 hover:border-gray-400'
                      }`}
                      placeholder="Last name"
                    />
                    {errors.last_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
                    )}
                  </div>
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
                    className={`w-full px-3 py-2 rounded border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all duration-200 ${
                      errors.middle_name 
                        ? 'border-red-300 bg-red-50 focus:border-red-500' 
                        : 'border-gray-300 bg-white focus:border-blue-500 hover:border-gray-400'
                    }`}
                    placeholder="Middle name (optional)"
                  />
                  {errors.middle_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.middle_name}</p>
                  )}
                </div>
              </div>

              {/* Email and LRN Fields */}
              <div className="grid grid-cols-2 gap-3">
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
                    className={`w-full px-3 py-2 rounded border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all duration-200 ${
                      errors.email 
                        ? 'border-red-300 bg-red-50 focus:border-red-500' 
                        : 'border-gray-300 bg-white focus:border-blue-500 hover:border-gray-400'
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
                    className={`w-full px-3 py-2 rounded border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all duration-200 ${
                      errors.lrn 
                        ? 'border-red-300 bg-red-50 focus:border-red-500' 
                        : 'border-gray-300 bg-white focus:border-blue-500 hover:border-gray-400'
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
                      className={`w-full px-3 py-2 pr-10 rounded border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all duration-200 ${
                        errors.password 
                          ? 'border-red-300 bg-red-50 focus:border-red-500' 
                          : 'border-gray-300 bg-white focus:border-blue-500 hover:border-gray-400'
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
                      className={`w-full px-3 py-2 pr-10 rounded border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all duration-200 ${
                        errors.password_confirmation 
                          ? 'border-red-300 bg-red-50 focus:border-red-500' 
                          : 'border-gray-300 bg-white focus:border-blue-500 hover:border-gray-400'
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={processing}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-4 rounded shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/50 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {processing && (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                )}
                {processing ? 'Creating Account...' : 'Create Account'}
              </button>

              {/* Back to Login */}
              <div className="text-center border-t border-gray-200 pt-4 mt-4">
                <p className="text-xs text-gray-600 mb-2">
                  Already have an account?
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center text-blue-600 hover:text-blue-700 font-medium text-xs transition-colors duration-200 hover:underline"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 0a4 4 0 01-4 4H6a4 4 0 01-4-4V7a4 4 0 014-4h1m5 0a4 4 0 014 4v1" />
                  </svg>
                  Back to Login
                </Link>
              </div>

              {/* Information Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <div className="flex items-start">
                  <svg className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="text-xs font-medium text-blue-900 mb-1">Account Verification Required</h4>
                    <p className="text-xs text-blue-800 leading-relaxed">
                      After creating your account, please wait for verification from the registrar's office. You will receive an email notification once approved.
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
