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
            // Add semester_id foreign key for proper semester isolation
            $table->foreignId('semester_id')->nullable()->after('school_year_id')->constrained('semester')->cascadeOnDelete();
            
            // Keep the existing Semester column for backward compatibility during transition
            // We'll migrate data and then remove it in a separate migration
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->dropForeign(['semester_id']);
            $table->dropColumn('semester_id');
        });
    }
};
