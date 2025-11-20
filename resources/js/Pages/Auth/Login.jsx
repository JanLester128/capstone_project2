import { useEffect, useState } from 'react'
import { Head, useForm, usePage } from '@inertiajs/react'
import sessionManager from '../../utils/sessionManager'

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const { auth, flash } = usePage().props

  const { data, setData, post, processing, errors, reset } = useForm({
    email: '',
    password: '',
  })

  useEffect(() => {
    // Clear session state when on login page
    sessionManager.clearSessionState();
    return () => reset('password');
  }, [])

  useEffect(() => {
    // Show notification if there's a success message
    if (flash?.success) {
      setShowNotification(true)
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setShowNotification(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [flash])

  function handleSubmit(e) {
    e.preventDefault()
    setIsLoading(true)
    post('/login', {
      onFinish: () => setIsLoading(false)
    })
  }

  return (
    <>
      <Head title="Sign in">
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4 py-4" style={{fontFamily: 'Poppins, sans-serif'}}>
        <div className="w-full max-w-4xl bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden border border-white/20">
          <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[400px]">
            {/* Left panel: Logo + School name with gradient background */}
            <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-6 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 via-indigo-600/80 to-purple-600/90 rounded-l-2xl"></div>
              
              {/* Decorative Translucent White Circles */}
              <div className="absolute top-0 left-0 w-64 h-64 bg-white/15 rounded-full blur-3xl -translate-x-1/4 -translate-y-1/4"></div>
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/15 rounded-full blur-3xl translate-x-1/4 translate-y-1/4"></div>
              <div className="absolute top-1/2 left-1/4 w-40 h-40 bg-white/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-1/4 left-0 w-32 h-32 bg-white/12 rounded-full blur-2xl -translate-x-1/3"></div>
              
              <div className="relative max-w-xs text-center z-10">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-600/20 rounded-full blur-3xl scale-150"></div>
                  <div className="relative mx-auto h-20 w-20 bg-white rounded-full p-2 flex items-center justify-center shadow-xl">
                    <img
                      src="/onsts.png"
                      alt="OPOL NATIONAL SECONDARY TECHNICAL SCHOOL logo"
                      className="h-full w-full object-contain transform hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </div>
                
                <h1 className="text-lg font-bold tracking-wide leading-tight text-white mb-2">
                  OPOL NATIONAL SECONDARY TECHNICAL SCHOOL
                </h1>
                
                <div className="h-0.5 w-16 bg-white/60 mx-auto rounded-full mb-3"></div>
                
                <p className="text-white text-sm font-semibold mb-1">
                  Welcome to our Enrollment System
                </p>
                <p className="text-blue-100 text-xs font-medium">
                  Please sign in with your account to continue.
                </p>
              </div>
            </div>

            {/* Right panel: Login form with white background */}
            <div className="relative bg-white p-6 flex items-center justify-center">
              <div className="relative w-full max-w-sm z-10">
                <div className="bg-white rounded-xl p-5">
                  <div className="text-center mb-4">
                    <h2 className="text-lg font-bold text-gray-900 mb-1">Sign in to your account</h2>
                    <p className="text-xs text-gray-600 font-medium">Use the credentials provided by the registrar.</p>
                  </div>

                  {/* Success Notification */}
                  {showNotification && flash?.success && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start">
                        <svg className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-xs text-green-800 leading-tight">
                            {flash.success}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowNotification(false)}
                          className="ml-2 text-green-500 hover:text-green-700 focus:outline-none"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-3" noValidate>
                    <div>
                      <label htmlFor="email" className="block text-xs font-semibold text-gray-700 mb-1">
                        Email or LRN
                      </label>
                      <div className="relative">
                        <input
                          id="email"
                          type="text"
                          autoComplete="username"
                          required
                          value={data.email}
                          onChange={(e) => setData('email', e.target.value)}
                          className={`w-full px-3 py-2 rounded-lg border-2 transition-all duration-200 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                            errors.email 
                              ? 'border-red-300 bg-red-50 focus:border-red-500' 
                              : 'border-gray-200 bg-white focus:border-blue-500 hover:border-gray-300'
                          }`}
                          placeholder="Enter your email or LRN"
                          aria-invalid={!!errors.email}
                          aria-describedby={errors.email ? 'email-error' : 'email-help'}
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                          </svg>
                        </div>
                      </div>
                      {errors.email && (
                        <p id="email-error" className="mt-2 text-sm text-red-600 font-medium flex items-center gap-1">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {errors.email}
                        </p>
                      )}
                      {!errors.email && (
                        <p id="email-help" className="mt-1 text-xs text-gray-500">Enter your registered email address</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-xs font-semibold text-gray-700 mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          required
                          value={data.password}
                          onChange={(e) => setData('password', e.target.value)}
                          className={`w-full px-3 py-2 pr-10 rounded-lg border-2 transition-all duration-200 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                            errors.password 
                              ? 'border-red-300 bg-red-50 focus:border-red-500' 
                              : 'border-gray-200 bg-white focus:border-blue-500 hover:border-gray-300'
                          }`}
                          placeholder="••••••••"
                          aria-invalid={!!errors.password}
                          aria-describedby={errors.password ? 'password-error' : 'password-help'}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((s) => !s)}
                          className="absolute inset-y-0 right-0 px-3 flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 focus:outline-none focus:text-purple-600 transition-colors duration-200 rounded-r-lg"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? (
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      {errors.password && (
                        <p id="password-error" className="mt-2 text-sm text-red-600 font-medium flex items-center gap-1">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {errors.password}
                        </p>
                      )}
                      {!errors.password && (
                        <p id="password-help" className="mt-1 text-xs text-gray-500">Enter your secure password</p>
                      )}
                    </div>

                    <div className="flex items-center justify-end">
                      <a 
                        href={`/password/forgot${data.email ? `?email=${encodeURIComponent(data.email)}` : ''}`}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors duration-200 hover:underline focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-1 rounded px-1"
                      >
                        Forgot password?
                      </a>
                    </div>

                    <button
                      type="submit"
                      disabled={processing || isLoading}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                      aria-busy={processing || isLoading}
                    >
                      {(processing || isLoading) && (
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                        </svg>
                      )}
                      {(processing || isLoading) ? 'Signing in...' : 'Sign in'}
                    </button>

                    {/* Student Registration Link */}
                    <div className="text-center border-t border-gray-200 pt-3">
                      <p className="text-xs text-gray-600 mb-2">
                        New student? Create your account
                      </p>
                      <a
                        href="/student/register"
                        className="inline-flex items-center justify-center w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        Create Account
                      </a>
                    </div>

                    <div className="text-center mt-2">
                      <p className="text-xs text-gray-500 leading-relaxed">
                        By signing in, you agree to our{' '}
                        <a href="#" className="text-blue-600 hover:text-blue-800 font-medium hover:underline">acceptable use</a>
                        {' '}and{' '}
                        <a href="#" className="text-blue-600 hover:text-blue-800 font-medium hover:underline">privacy policies</a>.
                      </p>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}


