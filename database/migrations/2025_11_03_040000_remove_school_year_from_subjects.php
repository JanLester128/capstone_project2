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
        // Drop the foreign key constraint first
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

        // Drop the unique constraint that includes school_year_id
        try {
            DB::statement("ALTER TABLE `subjects` DROP INDEX `subjects_code_school_year_unique`");
        } catch (\Exception $e) {
            // Constraint might not exist
        }

        // Drop the school_year_id column
        Schema::table('subjects', function (Blueprint $table) {
            $table->dropColumn('school_year_id');
        });

        // Restore unique constraint on Subject_code only (subjects are now static, one per code)
        Schema::table('subjects', function (Blueprint $table) {
            $table->unique('Subject_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            // Drop unique constraint on Subject_code
            try {
                $table->dropUnique(['Subject_code']);
            } catch (\Exception $e) {
                // Might not exist
            }

            // Add school_year_id column back
            $table->foreignId('school_year_id')->nullable()->constrained('school_year')->cascadeOnDelete();
        });

        // Restore composite unique constraint
        Schema::table('subjects', function (Blueprint $table) {
            $table->unique(['Subject_code', 'school_year_id'], 'subjects_code_school_year_unique');
        });
    }
};

