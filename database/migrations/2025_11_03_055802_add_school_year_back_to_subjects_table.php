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
        // Drop unique constraint on Subject_code first if it exists
        try {
            DB::statement("ALTER TABLE `subjects` DROP INDEX `subjects_subject_code_unique`");
        } catch (\Exception $e) {
            // Constraint might not exist
        }

        // Add school_year_id column back
        Schema::table('subjects', function (Blueprint $table) {
            $table->foreignId('school_year_id')->nullable()->after('strand_id')->constrained('school_year')->cascadeOnDelete();
        });

        // Backfill existing subjects to active school year (if any)
        $active = DB::table('school_year')->where('is_active', true)->first();
        if ($active) {
            DB::table('subjects')->whereNull('school_year_id')->update(['school_year_id' => $active->id]);
        }

        // Add composite unique constraint on (Subject_code, school_year_id)
        Schema::table('subjects', function (Blueprint $table) {
            $table->unique(['Subject_code', 'school_year_id'], 'subjects_code_school_year_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop composite unique constraint
        try {
            DB::statement("ALTER TABLE `subjects` DROP INDEX `subjects_code_school_year_unique`");
        } catch (\Exception $e) {
            // Might not exist
        }

        // Drop foreign key constraint
        $foreignKeys = DB::select(
            "SELECT CONSTRAINT_NAME 
             FROM information_schema.KEY_COLUMN_USAGE 
             WHERE TABLE_SCHEMA = DATABASE() 
             AND TABLE_NAME = 'subjects' 
             AND COLUMN_NAME = 'school_year_id' 
             AND REFERENCED_TABLE_NAME IS NOT NULL"
        );

        if (!empty($foreignKeys)) {
            foreach ($foreignKeys as $fk) {
                DB::statement("ALTER TABLE `subjects` DROP FOREIGN KEY `{$fk->CONSTRAINT_NAME}`");
            }
        }

        // Drop school_year_id column
        Schema::table('subjects', function (Blueprint $table) {
            $table->dropColumn('school_year_id');
        });

        // Restore unique constraint on Subject_code only
        Schema::table('subjects', function (Blueprint $table) {
            $table->unique('Subject_code');
        });
    }
};
