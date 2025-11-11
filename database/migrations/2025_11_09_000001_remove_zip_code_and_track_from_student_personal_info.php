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
        Schema::table('student_personal_info', function (Blueprint $table) {
            // Remove zip code fields
            $table->dropColumn(['current_zip_code', 'permanent_zip_code']);
            
            // Remove track field
            $table->dropColumn('track');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_personal_info', function (Blueprint $table) {
            // Add back zip code fields
            $table->string('current_zip_code')->nullable();
            $table->string('permanent_zip_code')->nullable();
            
            // Add back track field
            $table->string('track')->nullable();
        });
    }
};
