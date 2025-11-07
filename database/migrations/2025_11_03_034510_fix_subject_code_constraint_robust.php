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
        // Check if the composite unique constraint already exists
        $compositeConstraint = DB::select(
            "SELECT CONSTRAINT_NAME 
             FROM information_schema.TABLE_CONSTRAINTS 
             WHERE TABLE_SCHEMA = DATABASE() 
             AND TABLE_NAME = 'subjects' 
             AND CONSTRAINT_TYPE = 'UNIQUE' 
             AND CONSTRAINT_NAME = 'subjects_code_school_year_unique'"
        );

        // If the composite constraint already exists, this migration was already run
        // (likely by the previous migration file)
        if (!empty($compositeConstraint)) {
            // Migration already completed, nothing to do
            return;
        }

        // If we reach here, the composite constraint doesn't exist yet
        // First, check if school_year_id column exists
        if (!Schema::hasColumn('subjects', 'school_year_id')) {
            throw new \Exception('school_year_id column does not exist in subjects table. Please run the migration that adds it first.');
        }

        // Get the actual constraint name from the database
        $constraints = DB::select(
            "SELECT CONSTRAINT_NAME 
             FROM information_schema.TABLE_CONSTRAINTS 
             WHERE TABLE_SCHEMA = DATABASE() 
             AND TABLE_NAME = 'subjects' 
             AND CONSTRAINT_TYPE = 'UNIQUE' 
             AND (CONSTRAINT_NAME LIKE '%subject_code%' OR CONSTRAINT_NAME LIKE '%Subject_code%')
             AND CONSTRAINT_NAME != 'subjects_code_school_year_unique'"
        );

        // Drop existing unique constraint on Subject_code if it exists
        if (!empty($constraints)) {
            foreach ($constraints as $constraint) {
                try {
                    DB::statement("ALTER TABLE `subjects` DROP INDEX `{$constraint->CONSTRAINT_NAME}`");
                } catch (\Exception $e) {
                    // Constraint might have been dropped already, continue
                }
            }
        }

        // Also try dropping by column name (Laravel's default naming)
        try {
            Schema::table('subjects', function (Blueprint $table) {
                $table->dropUnique(['Subject_code']);
            });
        } catch (\Exception $e) {
            // Ignore if doesn't exist
        }

        // Add composite unique constraint on Subject_code and school_year_id
        // Only if it doesn't already exist
        $constraintExists = DB::select(
            "SELECT CONSTRAINT_NAME 
             FROM information_schema.TABLE_CONSTRAINTS 
             WHERE TABLE_SCHEMA = DATABASE() 
             AND TABLE_NAME = 'subjects' 
             AND CONSTRAINT_TYPE = 'UNIQUE' 
             AND CONSTRAINT_NAME = 'subjects_code_school_year_unique'"
        );

        if (empty($constraintExists)) {
            Schema::table('subjects', function (Blueprint $table) {
                $table->unique(['Subject_code', 'school_year_id'], 'subjects_code_school_year_unique');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            // Drop the composite unique constraint
            $table->dropUnique('subjects_code_school_year_unique');
        });
        
        // Restore the old unique constraint on Subject_code only
        Schema::table('subjects', function (Blueprint $table) {
            $table->unique('Subject_code');
        });
    }
};

