import React, { useEffect, useState } from 'react';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import Swal from 'sweetalert2';

export default function ResetPassword() {
	const { flash } = usePage().props;
	const [showPassword, setShowPassword] = useState(false);
	const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
	const { data, setData, post, processing, errors } = useForm({
		reset_token: '',
		password: '',
		password_confirmation: '',
	});

	// Auto-populate reset_token from flash (which comes from session via middleware)
	// Email is not needed - it's embedded in the reset token
	useEffect(() => {
		// Priority: flash.reset_token (from session) > sessionStorage > form data
		if (flash?.reset_token) {
			setData('reset_token', flash.reset_token);
		} else {
			// Also check sessionStorage as backup (from VerifyOtp page)
			const storedToken = sessionStorage.getItem('reset_token');
			if (storedToken) {
				setData('reset_token', storedToken);
			}
		}
	}, [flash?.reset_token]);

	// Show success message with SweetAlert only after password is actually reset
	// Don't show alert for OTP verification success - that's just informational
	useEffect(() => {
		// Only show success alert if it's about password reset (not OTP verification)
		if (flash?.success && flash.success.includes('Password has been reset')) {
			Swal.fire({
				icon: 'success',
				title: 'Password Reset Successful!',
				text: flash.success,
				confirmButtonColor: '#10b981',
				confirmButtonText: 'Go to Login'
			}).then(() => {
				router.visit('/login');
			});
		} else if (flash?.success && flash.success.includes('OTP verified')) {
			// Show a brief info message that OTP was verified, but don't redirect
			// User should now see the password reset form
			Swal.fire({
				icon: 'success',
				title: 'OTP Verified!',
				text: 'Please set your new password below.',
				confirmButtonColor: '#2563eb',
				timer: 3000,
				showConfirmButton: true
			});
		}
	}, [flash?.success]);

	function submit(e) {
		e.preventDefault();
		
		// Get reset_token from multiple sources (flash from session, form data, or sessionStorage)
		const tokenToSubmit = flash?.reset_token || data.reset_token || sessionStorage.getItem('reset_token');
		
		if (!tokenToSubmit) {
			Swal.fire({
				icon: 'error',
				title: 'Reset Token Missing',
				text: 'Please verify your OTP first to get a reset token. Redirecting to verify OTP page...',
				confirmButtonColor: '#dc2626'
			}).then(() => {
				router.visit('/password/verify-otp');
			});
			return;
		}
		
		// Ensure token is in form data before submitting
		if (!data.reset_token) {
			setData('reset_token', tokenToSubmit);
		}
		
		// Use router.post to explicitly include the token
		router.post('/password/reset', {
			reset_token: tokenToSubmit,
			password: data.password,
			password_confirmation: data.password_confirmation,
		}, {
			onError: (errors) => {
				const errorMessage = errors.reset_token || errors.password || 'An error occurred. Please try again.';
				Swal.fire({
					icon: 'error',
					title: 'Reset Failed',
					text: errorMessage,
					confirmButtonColor: '#dc2626'
				});
			},
		});
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4" style={{fontFamily: 'Poppins, sans-serif'}}>
			<Head title="Reset Password">
				<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
			</Head>
			<div className="w-full max-w-md">
				<div className="bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl border border-white/20 overflow-hidden">
					{/* Header Section */}
					<div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 px-6 py-8 text-center">
						<div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm mb-4">
							<svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
							</svg>
						</div>
						<h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
						<p className="text-sm text-blue-100">
							Set a new password for your account
						</p>
					</div>

					{/* Content Section */}
					<div className="px-6 py-6">
						<form onSubmit={submit} className="space-y-5">
							{/* Reset token is auto-filled, hidden from user */}
							{/* Email is embedded in the reset token, no need to send separately */}
							<input 
								type="hidden" 
								name="reset_token" 
								value={data.reset_token || flash?.reset_token || sessionStorage.getItem('reset_token') || ''} 
							/>
							{errors.reset_token && (
								<div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4">
									<p className="text-sm text-red-600 flex items-center gap-1">
										<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
										{errors.reset_token}
									</p>
								</div>
							)}

							<div>
								<label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
									New Password
								</label>
								<div className="relative">
									<input
										id="password"
										type={showPassword ? "text" : "password"}
										className={`w-full px-4 py-3 pl-12 pr-12 rounded-lg border-2 transition-all duration-200 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
											errors.password 
												? 'border-red-300 bg-red-50 focus:border-red-500' 
												: 'border-gray-200 bg-white focus:border-blue-500 hover:border-gray-300'
										}`}
										value={data.password}
										onChange={(e) => setData('password', e.target.value)}
										placeholder="Enter new password (min. 8 characters)"
										required
										minLength={8}
									/>
									<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
										<svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
										</svg>
									</div>
									<button
										type="button"
										onClick={() => setShowPassword(!showPassword)}
										className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
										tabIndex={-1}
									>
										{showPassword ? (
											<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
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
									<p className="mt-2 text-sm text-red-600 flex items-center gap-1">
										<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
										{errors.password}
									</p>
								)}
							</div>

							<div>
								<label htmlFor="password_confirmation" className="block text-sm font-semibold text-gray-700 mb-2">
									Confirm New Password
								</label>
								<div className="relative">
									<input
										id="password_confirmation"
										type={showPasswordConfirmation ? "text" : "password"}
										className={`w-full px-4 py-3 pl-12 pr-12 rounded-lg border-2 transition-all duration-200 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
											errors.password_confirmation 
												? 'border-red-300 bg-red-50 focus:border-red-500' 
												: 'border-gray-200 bg-white focus:border-blue-500 hover:border-gray-300'
										}`}
										value={data.password_confirmation}
										onChange={(e) => setData('password_confirmation', e.target.value)}
										placeholder="Confirm your new password"
										required
										minLength={8}
									/>
									<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
										<svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
										</svg>
									</div>
									<button
										type="button"
										onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
										className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
										tabIndex={-1}
									>
										{showPasswordConfirmation ? (
											<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
											</svg>
										) : (
											<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
											</svg>
										)}
									</button>
								</div>
							</div>

							<button
								type="submit"
								disabled={processing || !data.password || !data.password_confirmation || data.password !== data.password_confirmation}
								className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
							>
								{processing ? (
									<>
										<svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										<span>Resetting Password...</span>
									</>
								) : (
									<>
										<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
										</svg>
										<span>Reset Password</span>
									</>
								)}
							</button>
						</form>

						<div className="mt-6 text-center pt-4 border-t border-gray-200">
							<Link href="/login" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
								← Back to Login
							</Link>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}


