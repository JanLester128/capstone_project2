@php
	$name = trim(($user->FirstName ?? '').' '.($user->LastName ?? ''));
@endphp
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Password Reset Verification</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
	<table role="presentation" style="width: 100%; border-collapse: collapse;">
		<tr>
			<td style="padding: 40px 20px; text-align: center;">
				<table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
					<!-- Header with Gradient -->
					<tr>
						<td style="background: linear-gradient(135deg, #dc2626 0%, #9333ea 100%); padding: 40px 30px; text-align: center;">
							<h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">Password Reset Verification</h1>
						</td>
					</tr>
					<!-- Content -->
					<tr>
						<td style="padding: 40px 30px;">
							<p style="margin: 0 0 16px 0; color: #374151; font-size: 16px; line-height: 1.6;">Hi {{ $name ?: 'there' }},</p>
							@php
								// Ensure we're using the correct timezone for display
								$expirationTime = \Carbon\Carbon::parse($expiresAt);
								// Convert to app timezone if not already set
								$expirationTime = $expirationTime->setTimezone(config('app.timezone', 'Asia/Manila'));
								$formattedTime = $expirationTime->format('M d, Y h:i A');
							@endphp
							<p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">Use the One-Time Password (OTP) below to reset your password. This code is valid until <strong>{{ $formattedTime }}</strong>.</p>
							
							<!-- OTP Display Box -->
							<div style="background: linear-gradient(135deg, #dc2626 0%, #9333ea 100%); border-radius: 8px; padding: 24px; text-align: center; margin: 32px 0;">
								<p style="margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #ffffff; font-family: 'Courier New', monospace;">{{ $otp }}</p>
							</div>
							
							<p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">If you did not request this, you can safely ignore this email.</p>
						</td>
					</tr>
					<!-- Footer -->
					<tr>
						<td style="padding: 20px 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
							<p style="margin: 0; color: #6b7280; font-size: 14px;">Thanks,<br/><strong style="color: #374151;">{{ config('app.name') }}</strong></p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>


