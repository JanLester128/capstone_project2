<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_personal_info_id')
                ->constrained('student_personal_info')
                ->cascadeOnDelete();
            $table->foreignId('subject_id')
                ->constrained('subjects', 'Id')
                ->cascadeOnDelete();
            
            // Snapshot fields (from add_data_integrity_fields)
            $table->string('subject_name_snapshot', 100)->nullable();
            $table->string('subject_code_snapshot', 100)->nullable();
            
            $table->foreignId('faculty_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->foreignId('school_year_id')
                ->constrained('school_year')
                ->cascadeOnDelete();
            $table->foreignId('class_id')
                ->nullable()
                ->constrained('class', 'Id')
                ->nullOnDelete();
            
            // More snapshot fields
            $table->string('class_section_snapshot', 100)->nullable();
            $table->string('faculty_name_snapshot', 100)->nullable();
            
            $table->enum('semester', ['1st', '2nd', 'Summer']);
            $table->string('semester_label', 100)->nullable();
            $table->string('school_year_label', 100)->nullable();
            
            $table->decimal('original_failed_grade', 5, 2)->nullable();
            $table->decimal('summer_grade', 5, 2)->nullable();
            $table->decimal('first_quarter', 5, 2)->nullable();
            $table->decimal('second_quarter', 5, 2)->nullable();
            $table->decimal('third_quarter', 5, 2)->nullable();
            $table->decimal('fourth_quarter', 5, 2)->nullable();
            $table->decimal('semester_grade', 5, 2)->nullable();
            $table->decimal('semester_average', 5, 2)->nullable();
            $table->enum('remarks', ['Passed', 'Failed', 'Incomplete', 'Conditional'])->nullable();
            
            // Grade calculation fields (from add_grade_calculation_fields)
            $table->boolean('needs_summer_class')->default(false);
            $table->boolean('is_prerequisite_failed')->default(false);
            $table->text('failed_prerequisites')->nullable();
            $table->boolean('auto_calculated')->default(false);
            
            // Data integrity fields (from add_data_integrity_fields)
            $table->boolean('is_locked')->default(false);
            $table->timestamp('locked_at')->nullable();
            $table->foreignId('locked_by')->nullable()->constrained('users')->nullOnDelete();
            
            // Approval workflow (from add_grade_approval_fields, approval_notes removed)
            $table->enum('status', ['Pending', 'Approved', 'Rejected'])->default('Pending');
            $table->timestamp('submitted_for_approval_at')->nullable();
            $table->foreignId('submitted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            
            $table->timestamps();

            $table->index(['student_personal_info_id', 'school_year_id', 'semester'], 'grades_student_sy_semester_idx');
            $table->index(['student_personal_info_id', 'school_year_id', 'semester', 'is_locked'], 'grades_student_sy_sem_locked_idx');
        });
        
        // Add soft deletes to protect master data (from add_data_integrity_fields)
        Schema::table('subjects', function (Blueprint $table) {
            $table->softDeletes();
            $table->index('deleted_at');
        });

        Schema::table('class', function (Blueprint $table) {
            $table->softDeletes();
            $table->index('deleted_at');
        });

        Schema::table('sections', function (Blueprint $table) {
            $table->softDeletes();
            $table->index('deleted_at');
        });

        Schema::table('strands', function (Blueprint $table) {
            $table->softDeletes();
            $table->index('deleted_at');
        });

        Schema::table('school_year', function (Blueprint $table) {
            $table->softDeletes();
            $table->index('deleted_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('school_year', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('strands', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('sections', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('class', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('subjects', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::dropIfExists('grades');
    }
};
