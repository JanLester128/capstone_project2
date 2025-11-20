import React, { useEffect } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import Swal from 'sweetalert2';

export default function VerifyOtp() {
	const { flash } = usePage().props;
	const { data, setData, post, processing, errors } = useForm({
		email: '',
		otp: '',
	});

	// Auto-populate email from URL parameter or flash
	useEffect(() => {
		// First check URL parameter
		const urlParams = new URLSearchParams(window.location.search);
		const emailParam = urlParams.get('email');
		if (emailParam) {
			setData('email', emailParam);
		} else if (flash?.email) {
			setData('email', flash.email);
		}
		if (flash?.reset_token) {
			// Store reset token in sessionStorage for reset password page
			sessionStorage.setItem('reset_token', flash.reset_token);
		}
	}, [flash]);

	// Don't show alert here - let Inertia handle the redirect naturally
	// The backend will redirect to /password/reset with flash data
	// The ResetPassword page will handle showing the form

	function submit(e) {
		e.preventDefault();
		post('/password/verify-otp', {
			onError: (errors) => {
				if (errors.otp) {
					Swal.fire({
						icon: 'error',
						title: 'Verification Failed',
						text: errors.otp,
						confirmButtonColor: '#dc2626'
					});
				} else if (errors.email) {
					Swal.fire({
						icon: 'error',
						title: 'Error',
						text: errors.email,
						confirmButtonColor: '#dc2626'
					});
				}
			},
		});
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4" style={{fontFamily: 'Poppins, sans-serif'}}>
			<Head title="Verify OTP">
				<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
			</Head>
			<div className="w-full max-w-md">
				{/* Card Container */}
				<div className="bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl border border-white/20 overflow-hidden">
					{/* Header Section */}
					<div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 px-6 py-8 text-center">
						<div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm mb-4">
							<svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
							</svg>
						</div>
						<h1 className="text-2xl font-bold text-white mb-2">Verify OTP</h1>
						<p className="text-sm text-blue-100">
							Enter the 6-digit OTP sent to your email, then proceed to reset your password.
						</p>
					</div>

					{/* Content Section */}
					<div className="px-6 py-6 space-y-5">
						<form onSubmit={submit} className="space-y-5">
							<div>
								<label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
									Email Address
								</label>
								<div className="relative">
									<input
										id="email"
										type="email"
										className={`w-full px-4 py-3 pl-12 rounded-lg border-2 transition-all duration-200 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
											errors.email 
												? 'border-red-300 bg-red-50 focus:border-red-500' 
												: 'border-gray-200 bg-white focus:border-blue-500 hover:border-gray-300'
										}`}
										value={data.email}
										onChange={(e) => setData('email', e.target.value)}
										placeholder="Enter your email address"
										required
									/>
									<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
										<svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
										</svg>
									</div>
								</div>
								{errors.email && (
									<p className="mt-2 text-sm text-red-600 flex items-center gap-1">
										<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
										{errors.email}
									</p>
								)}
							</div>

							<div>
								<label htmlFor="otp" className="block text-sm font-semibold text-gray-700 mb-2">
									OTP Code <span className="text-xs text-gray-500 font-normal">(6 digits)</span>
								</label>
								<div className="relative">
									<input
										id="otp"
										type="text"
										inputMode="numeric"
										pattern="[0-9]*"
										maxLength={6}
										autoComplete="one-time-code"
										className={`w-full px-4 py-4 text-center rounded-lg border-2 transition-all duration-200 font-bold text-2xl tracking-[0.5em] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
											errors.otp 
												? 'border-red-300 bg-red-50 focus:border-red-500' 
												: 'border-blue-300 bg-blue-50 focus:border-blue-500 hover:border-blue-400'
										}`}
										value={data.otp}
										onChange={(e) => setData('otp', e.target.value.replace(/\D/g, '').slice(0, 6))}
										placeholder="000000"
										required
										autoFocus
									/>
									<div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
										<svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
										</svg>
									</div>
								</div>
								<p className="mt-2 text-xs text-gray-500 text-center">
									Enter the 6-digit code sent to your email
								</p>
								{errors.otp && (
									<p className="mt-2 text-sm text-red-600 flex items-center gap-1">
										<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
										{errors.otp}
									</p>
								)}
							</div>

							<button
								type="submit"
								disabled={processing}
								className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
							>
								{processing ? (
									<>
										<svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										<span>Verifying...</span>
									</>
								) : (
									<>
										<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
										<span>Verify OTP</span>
									</>
								)}
							</button>
						</form>

						<div className="text-center pt-2 border-t border-gray-200 space-y-2">
							<div>
								<Link href="/password/forgot" className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors">
									Resend OTP
								</Link>
							</div>
							<div>
								<Link href="/login" className="text-xs text-gray-500 hover:text-gray-700 transition-colors">
									← Back to Login
								</Link>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}


