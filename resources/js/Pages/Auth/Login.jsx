import { useEffect, useState } from 'react'
import { Head, useForm, usePage } from '@inertiajs/react'
import sessionManager from '../../utils/sessionManager'

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { auth, flash } = usePage().props

  const { data, setData, post, processing, errors, reset } = useForm({
    email: '',
    password: '',
    remember: true,
  })

  useEffect(() => {
    // Clear session state when on login page
    sessionManager.clearSessionState();
    return () => reset('password');
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    setIsLoading(true)
    post('/login', {
      onFinish: () => setIsLoading(false)
    })
  }

  return (
    <>
      <Head title="Sign in" />
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
        body {
          font-family: 'Poppins', sans-serif;
        }
      `}</style>
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center px-4 py-6" style={{fontFamily: 'Poppins, sans-serif'}}>
        <div className="w-full max-w-5xl bg-white/95 backdrop-blur-sm shadow-2xl rounded-3xl overflow-hidden border border-white/20">
          <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[480px]">
            {/* Left panel: Logo + School name */}
            <div className="relative bg-gradient-to-br from-white via-blue-50/30 to-blue-100/50 p-8 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-blue-800/10 rounded-l-3xl"></div>
              <div className="relative max-w-sm text-center z-10">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-blue-600/20 rounded-full blur-3xl scale-150"></div>
                  <img
                    src="/onsts.png"
                    alt="OPOL NATIONAL SECONDARY TECHNICAL SCHOOL logo"
                    className="relative mx-auto h-28 w-28 object-contain drop-shadow-2xl transform hover:scale-105 transition-transform duration-300"
                  />
                </div>
                
                <h1 className="text-2xl font-bold tracking-wide leading-tight text-transparent bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 bg-clip-text mb-3">
                  OPOL NATIONAL SECONDARY TECHNICAL SCHOOL
                </h1>
                
                <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-blue-700 mx-auto rounded-full mb-4"></div>
                
                <p className="text-blue-700 text-base font-semibold mb-2">
                  Welcome to our Management System
                </p>
                <p className="text-blue-600 text-sm font-medium mb-6">
                  Please sign in with your account to continue.
                </p>
                
                <div className="flex items-center justify-center gap-6 text-sm text-blue-500">
                  <div className="flex items-center gap-2 bg-blue-50/50 px-3 py-2 rounded-full">
                    <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">Secure</span>
                  </div>
                  <div className="flex items-center gap-2 bg-blue-50/50 px-3 py-2 rounded-full">
                    <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="font-medium">Private</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right panel: Login form with gradient background */}
            <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-white p-8 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 via-blue-500/70 to-white/95 rounded-r-3xl"></div>
              <div className="relative w-full max-w-md z-10">
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-white/30">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-blue-800 mb-2">Sign in to your account</h2>
                    <p className="text-sm text-blue-600 font-medium">Use the credentials provided by the registrar.</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-blue-700 mb-2">
                        Email address
                      </label>
                      <div className="relative">
                        <input
                          id="email"
                          type="email"
                          autoComplete="email"
                          required
                          value={data.email}
                          onChange={(e) => setData('email', e.target.value)}
                          className={`w-full px-4 py-2.5 rounded-xl border-2 transition-all duration-200 font-medium placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 ${
                            errors.email 
                              ? 'border-red-300 bg-red-50 focus:border-red-500' 
                              : 'border-gray-200 bg-white/80 focus:border-blue-500 hover:border-gray-300'
                          }`}
                          placeholder="Email"
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
                        <p id="email-help" className="mt-1 text-xs text-blue-500">Enter your registered email address</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-sm font-semibold text-blue-700 mb-2">
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
                          className={`w-full px-4 py-2.5 pr-12 rounded-xl border-2 transition-all duration-200 font-medium placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 ${
                            errors.password 
                              ? 'border-red-300 bg-red-50 focus:border-red-500' 
                              : 'border-gray-200 bg-white/80 focus:border-blue-500 hover:border-gray-300'
                          }`}
                          placeholder="••••••••"
                          aria-invalid={!!errors.password}
                          aria-describedby={errors.password ? 'password-error' : 'password-help'}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((s) => !s)}
                          className="absolute inset-y-0 right-0 px-4 flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 focus:outline-none focus:text-blue-600 transition-colors duration-200 rounded-r-xl"
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
                        <p id="password-help" className="mt-1 text-xs text-blue-500">Enter your secure password</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-3 text-sm font-medium text-blue-700 cursor-pointer hover:text-blue-800 transition-colors">
                        <input
                          type="checkbox"
                          checked={data.remember}
                          onChange={(e) => setData('remember', e.target.checked)}
                          className="h-4 w-4 rounded-lg border-2 border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2 transition-all"
                        />
                        Remember me
                      </label>
                      <a 
                        href="#" 
                        className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors duration-200 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-1"
                      >
                        Forgot password?
                      </a>
                    </div>

                    <button
                      type="submit"
                      disabled={processing || isLoading}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2.5 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/50 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                      aria-busy={processing || isLoading}
                    >
                      {(processing || isLoading) && (
                        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                        </svg>
                      )}
                      {(processing || isLoading) ? 'Signing in...' : 'Sign in'}
                    </button>

                    <div className="text-center">
                      <p className="text-xs text-blue-500 leading-relaxed">
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


