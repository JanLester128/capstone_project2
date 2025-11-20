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
        Schema::create('enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_personal_info_id')->constrained('student_personal_info')->cascadeOnDelete();
            $table->foreignId('school_year_id')->constrained('school_year')->cascadeOnDelete();
            $table->foreignId('semester_id')->nullable()->constrained('semester')->cascadeOnDelete();
            
            // Status and workflow
            $table->enum('status', ['pre_enrolled', 'recommended', 'enrolled', 'rejected'])->default('pre_enrolled');
            
            // Assignment fields
            $table->foreignId('assigned_strand_id')->nullable()->constrained('strands')->nullOnDelete();
            $table->foreignId('assigned_section_id')->nullable()->constrained('sections')->nullOnDelete();
            
            // Approval workflow (recommended_by/recommended_at were removed)
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('confirmed_at')->nullable();
            
            // Processing
            $table->foreignId('enrolled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('submitted_at')->useCurrent();
            $table->timestamp('processed_at')->nullable();
            
            // Grade calculation fields (from add_grade_calculation_fields)
            $table->boolean('is_on_probation')->default(false);
            $table->boolean('requires_summer_classes')->default(false);
            $table->text('summer_subjects_needed')->nullable();
            
            // Transferee
            $table->boolean('is_transferee')->default(false);
            
            // Data integrity (from add_data_integrity_fields)
            $table->boolean('is_locked')->default(false);
            $table->timestamp('locked_at')->nullable();
            
            $table->timestamps();

            // Unique constraint includes semester_id to allow multiple semesters per school year
            $table->unique(
                ['student_personal_info_id', 'school_year_id', 'semester_id'], 
                'unique_student_school_year_semester'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('enrollments');
    }
};
