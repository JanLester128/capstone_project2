@php
	$name = trim(($user->FirstName ?? '').' '.($user->LastName ?? ''));
@endphp
Password Reset Verification

Hi {{ $name ?: 'there' }},

@php
	// Ensure we're using the correct timezone for display
	$expirationTime = \Carbon\Carbon::parse($expiresAt);
	// Convert to app timezone if not already set
	$expirationTime = $expirationTime->setTimezone(config('app.timezone', 'Asia/Manila'));
	$formattedTime = $expirationTime->format('M d, Y h:i A');
@endphp
Use the One-Time Password (OTP) below to reset your password.
This code is valid until {{ $formattedTime }}.

OTP: {{ $otp }}

If you did not request this, you can safely ignore this email.

Thanks,
{{ config('app.name') }}


