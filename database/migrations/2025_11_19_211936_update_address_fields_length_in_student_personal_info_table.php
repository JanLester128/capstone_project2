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
            // Update guardian_address from 100 to 255 characters to match validation
            $table->string('guardian_address', 255)->nullable()->change();
            
            // Update last_school_address from 100 to 255 characters to match validation
            $table->string('last_school_address', 255)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_personal_info', function (Blueprint $table) {
            // Revert guardian_address back to 100 characters
            $table->string('guardian_address', 100)->nullable()->change();
            
            // Revert last_school_address back to 100 characters
            $table->string('last_school_address', 100)->nullable()->change();
        });
    }
};

