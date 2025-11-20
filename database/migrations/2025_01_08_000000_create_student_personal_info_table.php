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
        Schema::create('student_personal_info', function (Blueprint $table) {
            $table->id();
            $table->string('lrn', 100)->unique(); // Learner Reference Number
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();

            // School Information
            $table->string('school_year', 100)->default('2025-2026');
            $table->string('grade_level', 100)->nullable();
            $table->boolean('is_graded')->nullable();
            $table->enum('student_status', ['new', 'continuing', 'transferee'])->default('new');
            
            // Grade calculation fields (from add_grade_calculation_fields)
            $table->decimal('current_semester_average', 5, 2)->nullable();
            $table->integer('failed_subjects_count')->default(0);
            $table->boolean('requires_strand_change')->default(false);
            $table->string('recommended_strand_id')->nullable();

            // Personal Information
            $table->string('last_name', 100);
            $table->string('first_name', 100);
            $table->string('middle_name', 100)->nullable();
            $table->string('extension_name', 100)->nullable(); // Jr., III, etc.
            $table->date('birthdate')->nullable();
            $table->integer('age')->nullable();
            $table->enum('sex', ['Male', 'Female'])->nullable();
            $table->string('place_of_birth', 100)->nullable();
            $table->string('religion', 100)->nullable();

            // Current Address
            $table->string('current_sitio_street', 100)->nullable();
            $table->string('current_barangay', 100)->nullable();
            $table->string('current_municipality_city', 100)->nullable();
            $table->string('current_province', 100)->nullable();
            $table->string('current_country', 100)->default('Philippines');

            // Parent / Guardian Information
            $table->string('guardian_name', 150)->nullable();
            $table->string('guardian_contact_number', 100)->nullable();
            $table->string('guardian_address', 100)->nullable();
            $table->string('guardian_relationship', 100)->nullable();

            // Supporting Documents
            $table->string('psa_birth_certificate_photo', 100)->nullable();
            $table->string('report_card_photo', 100)->nullable();

            // For Returning Learners
            $table->string('last_grade_level_completed', 100)->nullable();
            $table->string('last_school_year_completed', 100)->nullable();
            $table->string('last_school_attended', 100)->nullable();
            $table->string('school_year_last_attended', 100)->nullable();
            $table->string('last_school_address', 100)->nullable();
            $table->string('last_school_type', 100)->nullable();
            $table->string('grade_level_completed', 100)->nullable();

            // Senior High School Information
            $table->enum('semester', ['1st', '2nd'])->default('1st');

            // Account Status
            $table->boolean('is_verified')->default(false);
            $table->timestamp('verified_at')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_personal_info');
    }
};
