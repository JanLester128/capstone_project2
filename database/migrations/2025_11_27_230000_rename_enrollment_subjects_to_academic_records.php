<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('enrollment_subjects') && !Schema::hasTable('academic_records')) {
            Schema::rename('enrollment_subjects', 'academic_records');
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('academic_records') && !Schema::hasTable('enrollment_subjects')) {
            Schema::rename('academic_records', 'enrollment_subjects');
        }
    }
};
