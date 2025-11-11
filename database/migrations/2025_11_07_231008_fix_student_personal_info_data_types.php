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
            // Change JSON fields to VARCHAR(100)
            $table->string('medical_diagnosis', 100)->nullable()->change();
            $table->string('manifestations', 100)->nullable()->change();
            $table->string('learning_modalities', 100)->nullable()->change();
            
            // Change VARCHAR(255) fields to VARCHAR(100)
            $table->string('lrn', 100)->change();
            $table->string('school_year', 100)->change();
            $table->string('grade_level', 100)->change();
            $table->string('psa_birth_certificate_no', 100)->nullable()->change();
            $table->string('last_name', 100)->change();
            $table->string('first_name', 100)->change();
            $table->string('middle_name', 100)->nullable()->change();
            $table->string('extension_name', 100)->nullable()->change();
            $table->string('place_of_birth', 100)->change();
            $table->string('religion', 100)->nullable()->change();
            $table->string('mother_tongue', 100)->nullable()->change();
            $table->string('4ps_household_id', 100)->nullable()->change();
            
            // Current Address fields
            $table->string('current_house_no', 100)->nullable()->change();
            $table->string('current_sitio_street', 100)->nullable()->change();
            $table->string('current_barangay', 100)->nullable()->change();
            $table->string('current_municipality_city', 100)->nullable()->change();
            $table->string('current_province', 100)->nullable()->change();
            $table->string('current_country', 100)->change();
            $table->string('current_zip_code', 100)->nullable()->change();
            
            // Permanent Address fields
            $table->string('permanent_house_no', 100)->nullable()->change();
            $table->string('permanent_sitio_street', 100)->nullable()->change();
            $table->string('permanent_barangay', 100)->nullable()->change();
            $table->string('permanent_municipality_city', 100)->nullable()->change();
            $table->string('permanent_province', 100)->nullable()->change();
            $table->string('permanent_country', 100)->nullable()->change();
            $table->string('permanent_zip_code', 100)->nullable()->change();
            
            // Parents Information
            $table->string('father_last_name', 100)->nullable()->change();
            $table->string('father_first_name', 100)->nullable()->change();
            $table->string('father_middle_name', 100)->nullable()->change();
            $table->string('father_contact_number', 100)->nullable()->change();
            $table->string('mother_last_name', 100)->nullable()->change();
            $table->string('mother_first_name', 100)->nullable()->change();
            $table->string('mother_middle_name', 100)->nullable()->change();
            $table->string('mother_contact_number', 100)->nullable()->change();
            $table->string('guardian_last_name', 100)->nullable()->change();
            $table->string('guardian_first_name', 100)->nullable()->change();
            $table->string('guardian_middle_name', 100)->nullable()->change();
            $table->string('guardian_contact_number', 100)->nullable()->change();
            
            // Previous School Information
            $table->string('last_grade_level_completed', 100)->nullable()->change();
            $table->string('last_school_year_completed', 100)->nullable()->change();
            $table->string('last_school_attended', 100)->nullable()->change();
            $table->string('last_school_id', 100)->nullable()->change();
            
            // Senior High School Information
            $table->string('track', 100)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_personal_info', function (Blueprint $table) {
            // Revert JSON fields back to JSON
            $table->json('medical_diagnosis')->nullable()->change();
            $table->json('manifestations')->nullable()->change();
            $table->json('learning_modalities')->nullable()->change();
            
            // Revert VARCHAR(100) fields back to VARCHAR(255)
            $table->string('lrn')->change();
            $table->string('school_year')->change();
            $table->string('grade_level')->change();
            $table->string('psa_birth_certificate_no')->nullable()->change();
            $table->string('last_name')->change();
            $table->string('first_name')->change();
            $table->string('middle_name')->nullable()->change();
            $table->string('extension_name')->nullable()->change();
            $table->string('place_of_birth')->change();
            $table->string('religion')->nullable()->change();
            $table->string('mother_tongue')->nullable()->change();
            $table->string('4ps_household_id')->nullable()->change();
            
            // Current Address fields
            $table->string('current_house_no')->nullable()->change();
            $table->string('current_sitio_street')->nullable()->change();
            $table->string('current_barangay')->nullable()->change();
            $table->string('current_municipality_city')->nullable()->change();
            $table->string('current_province')->nullable()->change();
            $table->string('current_country')->change();
            $table->string('current_zip_code')->nullable()->change();
            
            // Permanent Address fields
            $table->string('permanent_house_no')->nullable()->change();
            $table->string('permanent_sitio_street')->nullable()->change();
            $table->string('permanent_barangay')->nullable()->change();
            $table->string('permanent_municipality_city')->nullable()->change();
            $table->string('permanent_province')->nullable()->change();
            $table->string('permanent_country')->nullable()->change();
            $table->string('permanent_zip_code')->nullable()->change();
            
            // Parents Information
            $table->string('father_last_name')->nullable()->change();
            $table->string('father_first_name')->nullable()->change();
            $table->string('father_middle_name')->nullable()->change();
            $table->string('father_contact_number')->nullable()->change();
            $table->string('mother_last_name')->nullable()->change();
            $table->string('mother_first_name')->nullable()->change();
            $table->string('mother_middle_name')->nullable()->change();
            $table->string('mother_contact_number')->nullable()->change();
            $table->string('guardian_last_name')->nullable()->change();
            $table->string('guardian_first_name')->nullable()->change();
            $table->string('guardian_middle_name')->nullable()->change();
            $table->string('guardian_contact_number')->nullable()->change();
            
            // Previous School Information
            $table->string('last_grade_level_completed')->nullable()->change();
            $table->string('last_school_year_completed')->nullable()->change();
            $table->string('last_school_attended')->nullable()->change();
            $table->string('last_school_id')->nullable()->change();
            
            // Senior High School Information
            $table->string('track')->nullable()->change();
        });
    }
};
