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
            $table->string('lrn')->unique(); // Learner Reference Number
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            
            // School Information
            $table->string('school_year')->default('2025-2026');
            $table->string('grade_level')->default('10');
            $table->boolean('is_graded')->default(true);
            $table->boolean('is_sned')->default(false); // Special Needs Education
            
            // Personal Information
            $table->string('psa_birth_certificate_no')->nullable();
            $table->string('last_name');
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('extension_name')->nullable(); // Jr., III, etc.
            $table->date('birthdate');
            $table->integer('age');
            $table->enum('sex', ['Male', 'Female']);
            $table->string('place_of_birth');
            $table->string('religion')->nullable();
            $table->string('mother_tongue')->nullable();
            
            // 4Ps Information
            $table->boolean('is_4ps_beneficiary')->default(false);
            $table->string('4ps_household_id')->nullable();
            
            // Current Address
            $table->string('current_house_no')->nullable();
            $table->string('current_sitio_street')->nullable();
            $table->string('current_barangay')->nullable();
            $table->string('current_municipality_city')->nullable();
            $table->string('current_province')->nullable();
            $table->string('current_country')->default('Philippines');
            $table->string('current_zip_code')->nullable();
            
            // Permanent Address
            $table->boolean('same_as_current_address')->default(true);
            $table->string('permanent_house_no')->nullable();
            $table->string('permanent_sitio_street')->nullable();
            $table->string('permanent_barangay')->nullable();
            $table->string('permanent_municipality_city')->nullable();
            $table->string('permanent_province')->nullable();
            $table->string('permanent_country')->nullable();
            $table->string('permanent_zip_code')->nullable();
            
            // Father's Information
            $table->string('father_last_name')->nullable();
            $table->string('father_first_name')->nullable();
            $table->string('father_middle_name')->nullable();
            $table->string('father_contact_number')->nullable();
            
            // Mother's Information
            $table->string('mother_last_name')->nullable();
            $table->string('mother_first_name')->nullable();
            $table->string('mother_middle_name')->nullable();
            $table->string('mother_contact_number')->nullable();
            
            // Legal Guardian's Information
            $table->string('guardian_last_name')->nullable();
            $table->string('guardian_first_name')->nullable();
            $table->string('guardian_middle_name')->nullable();
            $table->string('guardian_contact_number')->nullable();
            
            // Special Needs Education Program
            $table->boolean('is_sned_program')->default(false);
            $table->json('medical_diagnosis')->nullable(); // Store array of diagnoses
            $table->json('manifestations')->nullable(); // Store array of manifestations
            $table->boolean('has_pwd_id')->default(false);
            
            // For Returning Learners
            $table->string('last_grade_level_completed')->nullable();
            $table->string('last_school_year_completed')->nullable();
            $table->string('last_school_attended')->nullable();
            $table->string('last_school_id')->nullable();
            
            // Senior High School Information
            $table->enum('semester', ['1st', '2nd'])->default('1st');
            $table->string('track')->nullable();
            $table->foreignId('strand_id')->nullable()->constrained('strands')->onDelete('set null');
            
            // Distance Learning Preferences
            $table->json('learning_modalities')->nullable(); // Store array of preferred modalities
            
            // Account Status
            $table->boolean('is_verified')->default(false);
            $table->timestamp('verified_at')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users')->onDelete('set null');
            
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
