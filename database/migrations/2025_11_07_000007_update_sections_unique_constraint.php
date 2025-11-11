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
            // Drop the old constraint if it exists
            try {
                $table->dropUnique('sections_name_school_year_unique');
            } catch (\Exception $e) {
                // Constraint might not exist, continue
            }
            
            // Add the new constraint that includes semester_id
            if (Schema::hasColumn('sections', 'semester_id')) {
                $table->unique(['section_name', 'school_year_id', 'semester_id'], 'sections_name_school_year_semester_unique');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sections', function (Blueprint $table) {
            // Drop the semester-aware constraint
            try {
                $table->dropUnique('sections_name_school_year_semester_unique');
            } catch (\Exception $e) {
                // Constraint might not exist, continue
            }
            
            // Restore the old constraint
            $table->unique(['section_name', 'school_year_id'], 'sections_name_school_year_unique');
        });
    }
};
