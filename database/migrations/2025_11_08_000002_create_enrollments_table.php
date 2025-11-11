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
            $table->json('strand_preferences')->nullable(); // Store strand preference IDs as JSON array
            $table->enum('status', ['pending', 'approved', 'rejected', 'enrolled'])->default('pending');
            $table->foreignId('enrolled_by')->nullable()->constrained('users')->nullOnDelete(); // Registrar who processed the enrollment
            $table->timestamp('submitted_at')->useCurrent();
            $table->timestamp('processed_at')->nullable();
            $table->text('remarks')->nullable(); // Optional remarks from registrar
            $table->timestamps();

            // Ensure one enrollment per student per school year
            $table->unique(['student_personal_info_id', 'school_year_id'], 'unique_student_school_year_enrollment');
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
