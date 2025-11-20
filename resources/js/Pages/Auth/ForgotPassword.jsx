import React, { useEffect } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import Swal from 'sweetalert2';

export default function ForgotPassword() {
	const { flash } = usePage().props;
	const { data, setData, post, processing, errors } = useForm({
		email: '',
	});

	// Auto-populate email from URL parameter
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const emailParam = urlParams.get('email');
		if (emailParam) {
			setData('email', emailParam);
		}
	}, []);

	// Show success message with SweetAlert and redirect to verify OTP page
	useEffect(() => {
		if (flash?.success) {
			Swal.fire({
				icon: 'success',
				title: 'OTP Sent!',
				text: flash.success + ' Please check your email and enter the OTP below.',
				confirmButtonColor: '#2563eb',
				confirmButtonText: 'Go to Verify OTP',
				showCancelButton: true,
				cancelButtonText: 'Stay Here'
			}).then((result) => {
				if (result.isConfirmed) {
					// Redirect to verify OTP page with email pre-filled
					window.location.href = `/password/verify-otp?email=${encodeURIComponent(data.email)}`;
				}
			});
		}
	}, [flash?.success, data.email]);

	function submit(e) {
		e.preventDefault();
		post('/password/forgot', {
			onError: (errors) => {
				if (errors.email) {
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
			<Head title="Forgot Password">
				<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
			</Head>
			<div className="w-full max-w-md">
				{/* Card Container */}
				<div className="bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl border border-white/20 overflow-hidden">
					{/* Header Section */}
					<div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 px-6 py-8 text-center">
						<div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm mb-4">
							<svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
							</svg>
						</div>
						<h1 className="text-2xl font-bold text-white mb-2">Forgot Password</h1>
						<p className="text-sm text-blue-100">
							Enter your account email. We will send a 6-digit OTP to verify your identity.
						</p>
					</div>

					{/* Content Section */}
					<div className="px-6 py-6 space-y-6">
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
										<span>Sending OTP...</span>
									</>
								) : (
									<>
										<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
										</svg>
										<span>Send OTP</span>
									</>
								)}
							</button>
						</form>

						<div className="text-center pt-2 border-t border-gray-200">
							<Link 
								href={`/password/verify-otp${data.email ? `?email=${encodeURIComponent(data.email)}` : ''}`} 
								className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors"
							>
								Already have an OTP? Verify here
							</Link>
						</div>

						<div className="text-center">
							<Link href="/login" className="text-xs text-gray-500 hover:text-gray-700 transition-colors">
								← Back to Login
							</Link>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}


