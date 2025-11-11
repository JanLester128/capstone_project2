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
            // Make enrollment-specific fields nullable
            $table->string('grade_level')->nullable()->default(null)->change();
            $table->boolean('is_graded')->nullable()->default(null)->change();
            $table->date('birthdate')->nullable()->change();
            $table->integer('age')->nullable()->change();
            $table->enum('sex', ['Male', 'Female'])->nullable()->change();
            $table->string('place_of_birth')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_personal_info', function (Blueprint $table) {
            // Revert back to non-nullable
            $table->string('grade_level')->default('10')->change();
            $table->boolean('is_graded')->default(true)->change();
            $table->date('birthdate')->change();
            $table->integer('age')->change();
            $table->enum('sex', ['Male', 'Female'])->change();
            $table->string('place_of_birth')->change();
        });
    }
};
