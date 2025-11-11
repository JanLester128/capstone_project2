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
        Schema::table('sections', function (Blueprint $table) {
            // Check if semester_id column exists before creating the constraint
            if (Schema::hasColumn('sections', 'semester_id')) {
                // Add unique constraint for section_name per school_year_id and semester_id
                // This allows same section names in different semesters of the same school year
                $table->unique(['section_name', 'school_year_id', 'semester_id'], 'sections_name_school_year_semester_unique');
            } else {
                // Fallback: Add unique constraint for section_name per school_year_id only
                // This will be updated later when semester_id is added
                $table->unique(['section_name', 'school_year_id'], 'sections_name_school_year_unique');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sections', function (Blueprint $table) {
            // Try to drop the semester-aware constraint first
            try {
                $table->dropUnique('sections_name_school_year_semester_unique');
            } catch (\Exception $e) {
                // If that fails, try to drop the old constraint
                try {
                    $table->dropUnique('sections_name_school_year_unique');
                } catch (\Exception $e2) {
                    // If both fail, ignore (constraint might not exist)
                }
            }
        });
    }
};
