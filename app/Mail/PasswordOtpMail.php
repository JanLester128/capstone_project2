<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PasswordOtpMail extends Mailable
{
	use Queueable, SerializesModels;

	public User $user;
	public string $otp;
	public $expiresAt;

	/**
	 * Create a new message instance.
	 */
	public function __construct(User $user, string $otp, $expiresAt)
	{
		$this->user = $user;
		$this->otp = $otp;
		$this->expiresAt = $expiresAt;
	}

	/**
	 * Build the message.
	 */
	public function build()
	{
		return $this->subject('Your Password Reset OTP')
			->view('emails.password-otp')
			->text('emails.password-otp-text')
			->with([
				'user' => $this->user,
				'otp' => $this->otp,
				'expiresAt' => $this->expiresAt,
			]);
	}
}


