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
        // Rename table if it exists (for existing installations)
        if (Schema::hasTable('enrollment_schedule_snapshots')) {
            Schema::rename('enrollment_schedule_snapshots', 'class_records');
        }
        
        // Update column sizes from default 255 to 100 if table exists
        if (Schema::hasTable('class_records')) {
            // Use raw SQL to modify column sizes
            \Illuminate\Support\Facades\DB::statement('ALTER TABLE class_records MODIFY subject_name VARCHAR(100) NOT NULL');
            \Illuminate\Support\Facades\DB::statement('ALTER TABLE class_records MODIFY subject_code VARCHAR(100) NOT NULL');
            \Illuminate\Support\Facades\DB::statement('ALTER TABLE class_records MODIFY faculty_name VARCHAR(100) NULL');
            \Illuminate\Support\Facades\DB::statement('ALTER TABLE class_records MODIFY section_name VARCHAR(100) NOT NULL');
            \Illuminate\Support\Facades\DB::statement('ALTER TABLE class_records MODIFY day_of_week VARCHAR(100) NOT NULL');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('class_records')) {
            Schema::rename('class_records', 'enrollment_schedule_snapshots');
        }
    }
};
