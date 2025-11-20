<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Remove redundant enrollment_id and class_id fields from class_records table.
     * These can be derived from class_detail relationship, making the table truly normalized.
     */
    public function up(): void
    {
        Schema::table('class_records', function (Blueprint $table) {
            // Drop foreign keys first
            if (Schema::hasColumn('class_records', 'enrollment_id')) {
                $table->dropForeign(['enrollment_id']);
            }
            if (Schema::hasColumn('class_records', 'class_id')) {
                $table->dropForeign(['class_id']);
            }
            
            // Drop the columns
            if (Schema::hasColumn('class_records', 'enrollment_id')) {
                $table->dropColumn('enrollment_id');
            }
            if (Schema::hasColumn('class_records', 'class_id')) {
                $table->dropColumn('class_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('class_records', function (Blueprint $table) {
            $table->foreignId('enrollment_id')->constrained('enrollments')->cascadeOnDelete();
            $table->foreignId('class_id')->constrained('class')->cascadeOnDelete();
        });
    }
};
