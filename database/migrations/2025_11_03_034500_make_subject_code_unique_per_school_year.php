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
        Schema::table('subjects', function (Blueprint $table) {
            // Drop the old unique constraint on Subject_code
            // MySQL creates constraint name as: table_name_column_name_unique
            try {
                $table->dropUnique(['Subject_code']);
            } catch (\Exception $e) {
                // If constraint doesn't exist or has different name, try alternative names
                try {
                    $table->dropUnique('subjects_subject_code_unique');
                } catch (\Exception $e2) {
                    // If still fails, check if constraint exists using raw SQL
                    $constraintExists = \DB::select(
                        "SELECT CONSTRAINT_NAME 
                         FROM information_schema.TABLE_CONSTRAINTS 
                         WHERE TABLE_SCHEMA = DATABASE() 
                         AND TABLE_NAME = 'subjects' 
                         AND CONSTRAINT_TYPE = 'UNIQUE' 
                         AND CONSTRAINT_NAME LIKE '%subject_code%'"
                    );
                    
                    if (!empty($constraintExists)) {
                        \DB::statement("ALTER TABLE `subjects` DROP INDEX `{$constraintExists[0]->CONSTRAINT_NAME}`");
                    }
                }
            }
            
            // Add composite unique constraint on Subject_code and school_year_id
            // This allows the same Subject_code for different school years
            $table->unique(['Subject_code', 'school_year_id'], 'subjects_code_school_year_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            // Drop the composite unique constraint
            $table->dropUnique('subjects_code_school_year_unique');
            
            // Restore the old unique constraint on Subject_code only
            $table->unique('Subject_code');
        });
    }
};

