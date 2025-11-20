<?php

namespace App\Http\Controllers;

use App\Mail\PasswordOtpMail;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Session;
use Inertia\Inertia;

class PasswordResetController extends Controller
{
	/**
	 * Request an OTP to be sent to the user's email.
	 */
	public function requestOtp(Request $request)
	{
		$validated = $request->validate([
			'email' => 'required|email:rfc,dns',
		]);

		$user = User::where('email', $validated['email'])->first();
		if (!$user) {
			// Do not reveal if email exists - return success message anyway
			return back()->with('success', 'If the email exists, an OTP has been sent to your email address.');
		}

		// Throttle: limit to 3 active OTPs per 30 minutes
		$recentCount = DB::table('password_otps')
			->where('email', $user->email)
			->where('created_at', '>=', now()->subMinutes(30))
			->count();
		if ($recentCount >= 3) {
			return back()->withErrors([
				'email' => 'Too many OTP requests. Please try again later.',
			])->withInput();
		}

		$otp = (string)random_int(100000, 999999);
		// Set expiration time with proper timezone (Asia/Manila)
		$expiresAt = \Carbon\Carbon::now(config('app.timezone', 'Asia/Manila'))->addMinutes(15);

		DB::table('password_otps')->insert([
			'user_id' => $user->id,
			'email' => $user->email,
			'otp_code' => $otp,
			'expires_at' => $expiresAt,
			'ip_address' => $request->ip(),
			'created_at' => now(),
			'updated_at' => now(),
		]);

		Mail::to($user->email)->send(new PasswordOtpMail($user, $otp, $expiresAt));

		return back()->with('success', 'If the email exists, an OTP has been sent to your email address.');
	}

	/**
	 * Verify a submitted OTP and return a short-lived reset token.
	 */
	public function verifyOtp(Request $request)
	{
		$validated = $request->validate([
			'email' => 'required|email:rfc,dns',
			'otp' => 'required|string|size:6',
		]);

		$record = DB::table('password_otps')
			->where('email', $validated['email'])
			->orderByDesc('id')
			->first();

		if (!$record) {
			return back()->withErrors([
				'otp' => 'Invalid or expired OTP.',
			])->withInput();
		}

		if ($record->consumed_at !== null) {
			return back()->withErrors([
				'otp' => 'This OTP has already been used.',
			])->withInput();
		}

		if (now()->greaterThan(CarbonImmutable::parse($record->expires_at))) {
			return back()->withErrors([
				'otp' => 'The OTP has expired.',
			])->withInput();
		}

		if ($record->attempts >= 5) {
			return back()->withErrors([
				'otp' => 'Too many attempts. Request a new OTP.',
			])->withInput();
		}

		if ($validated['otp'] !== $record->otp_code) {
			DB::table('password_otps')->where('id', $record->id)->update([
				'attempts' => $record->attempts + 1,
				'updated_at' => now(),
			]);
			return back()->withErrors([
				'otp' => 'Incorrect OTP.',
			])->withInput();
		}

		// Generate a short-lived reset token (signed) tied to this record
		$resetToken = Str::random(64);
		// Store token in the same record metadata fields
		DB::table('password_otps')->where('id', $record->id)->update([
			'otp_code' => $record->otp_code, // keep for audit
			'updated_at' => now(),
		]);

		// Return opaque token encoded with id to validate later
		$opaque = base64_encode(json_encode([
			'id' => $record->id,
			'email' => $record->email,
			'token' => $resetToken,
			'exp' => now()->addMinutes(15)->timestamp,
		]));

		// Store in cache for 15 minutes to validate during reset
		cache()->put('pwd_reset_token_'.$record->id, $resetToken, now()->addMinutes(15));

		// Store reset token and email in session for the reset password page
		Session::put('reset_token', $opaque);
		Session::put('email', $validated['email']);
		
		// Redirect to reset password page with success message
		return redirect()->route('password.reset')->with([
			'success' => 'OTP verified successfully. You may now reset your password.',
		]);
	}

	/**
	 * Reset password using a verified token.
	 */
	public function resetPassword(Request $request)
	{
		$validated = $request->validate([
			'reset_token' => 'required|string',
			'password' => 'required|string|min:8|confirmed',
		]);

		$payload = json_decode(base64_decode($validated['reset_token'] ?? ''), true);
		if (!$payload || !isset($payload['id'], $payload['email'], $payload['token'], $payload['exp'])) {
			throw ValidationException::withMessages([
				'reset_token' => 'Invalid reset token.',
			]);
		}

		// Get email from token payload (already verified in OTP step)
		$email = $payload['email'];

		if (now()->timestamp > (int)$payload['exp']) {
			throw ValidationException::withMessages([
				'reset_token' => 'Reset token has expired.',
			]);
		}

		$cached = cache()->get('pwd_reset_token_'.$payload['id']);
		if (!$cached || !hash_equals($cached, $payload['token'])) {
			throw ValidationException::withMessages([
				'reset_token' => 'Reset token is invalid or has been used.',
			]);
		}

		$user = User::where('email', $email)->first();
		if (!$user) {
			throw ValidationException::withMessages([
				'reset_token' => 'Invalid email address in reset token.',
			]);
		}

		$user->password = Hash::make($validated['password']);
		$user->must_change_password = false;
		$user->save();

		// Mark OTP as consumed and invalidate token
		DB::table('password_otps')->where('id', (int)$payload['id'])->update([
			'consumed_at' => now(),
			'updated_at' => now(),
		]);
		cache()->forget('pwd_reset_token_'.$payload['id']);
		
		// Clear session data
		Session::forget('reset_token');
		Session::forget('email');

		return redirect()->route('login')->with('success', 'Password has been reset successfully. You can now login with your new password.');
	}
}


