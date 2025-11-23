import { useState } from 'react'
import { useForm } from '@inertiajs/react'

function getPasswordStrength(password = '') {
  if (!password) {
    return { label: '', color: 'bg-gray-200', width: '0%' }
  }

  let strength = 0
  if (password.length >= 8) strength++
  if (password.length >= 12) strength++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
  if (/\d/.test(password)) strength++
  if (/[^a-zA-Z\d]/.test(password)) strength++

  if (strength <= 2) return { label: 'Weak', color: 'bg-red-500', width: '40%' }
  if (strength === 3) return { label: 'Fair', color: 'bg-yellow-500', width: '60%' }
  if (strength === 4) return { label: 'Good', color: 'bg-blue-500', width: '80%' }
  return { label: 'Strong', color: 'bg-green-500', width: '100%' }
}

export default function ProfileChangePasswordCard({ className = '' }) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [statusMessage, setStatusMessage] = useState(null)

  const { data, setData, post, processing, errors, reset } = useForm({
    password: '',
    password_confirmation: ''
  })

  const passwordStrength = getPasswordStrength(data.password)
  const passwordsMatch =
    !!data.password &&
    !!data.password_confirmation &&
    data.password === data.password_confirmation

  const handleSubmit = (e) => {
    e.preventDefault()
    setStatusMessage(null)

    post('/password/change', {
      preserveScroll: true,
      onSuccess: () => {
        setStatusMessage('Password updated successfully.')
        reset()
      }
    })
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setData(name, value)
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
      <div className="px-6 py-5 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
        <p className="text-sm text-gray-500 mt-1">
          Update your account password. Choose a strong, unique combination.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
        {statusMessage && (
          <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg p-3">
            {statusMessage}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            New Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={data.password}
              onChange={handleChange}
              required
              className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.password ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter a strong password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 pr-4 text-gray-400 hover:text-gray-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-600">{errors.password}</p>
          )}
          {data.password && (
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Password strength</span>
                <span className="font-semibold text-gray-700">{passwordStrength.label}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${passwordStrength.color}`}
                  style={{ width: passwordStrength.width }}
                ></div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700">
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="password_confirmation"
              name="password_confirmation"
              type={showConfirmation ? 'text' : 'password'}
              value={data.password_confirmation}
              onChange={handleChange}
              required
              className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.password_confirmation
                  ? 'border-red-300'
                  : passwordsMatch && data.password_confirmation
                  ? 'border-green-300'
                  : 'border-gray-300'
              }`}
              placeholder="Re-enter password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmation((prev) => !prev)}
              className="absolute inset-y-0 right-0 pr-4 text-gray-400 hover:text-gray-600"
              aria-label={showConfirmation ? 'Hide password' : 'Show password'}
            >
              {showConfirmation ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.password_confirmation && (
            <p className="text-sm text-red-600">{errors.password_confirmation}</p>
          )}
          {passwordsMatch && data.password_confirmation && (
            <p className="text-sm text-green-600">Passwords match</p>
          )}
        </div>

        <button
          type="submit"
          disabled={processing || !passwordsMatch || !data.password}
          className="w-full inline-flex justify-center items-center px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? 'Updating password...' : 'Update Password'}
        </button>
      </form>
    </div>
  )
}
