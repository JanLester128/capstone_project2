<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
	/**
	 * Run the migrations.
	 */
	public function up(): void
	{
		Schema::create('password_otps', function (Blueprint $table) {
			$table->id();
			$table->unsignedBigInteger('user_id')->nullable();
			$table->string('email')->index();
			$table->string('otp_code', 6);
			$table->dateTime('expires_at');
			$table->dateTime('consumed_at')->nullable();
			$table->unsignedTinyInteger('attempts')->default(0);
			$table->string('ip_address', 45)->nullable();
			$table->timestamps();

			$table->index(['email', 'otp_code']);
			$table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
		});
	}

	/**
	 * Reverse the migrations.
	 */
	public function down(): void
	{
		Schema::dropIfExists('password_otps');
	}
};


