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
        Schema::table('student_personal_info', function (Blueprint $table) {
            $table->string('profile_photo')->nullable()->after('learning_modalities');
            $table->string('psa_birth_certificate_photo')->nullable()->after('profile_photo');
            $table->string('report_card_photo')->nullable()->after('psa_birth_certificate_photo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_personal_info', function (Blueprint $table) {
            $table->dropColumn(['profile_photo', 'psa_birth_certificate_photo', 'report_card_photo']);
        });
    }
};
