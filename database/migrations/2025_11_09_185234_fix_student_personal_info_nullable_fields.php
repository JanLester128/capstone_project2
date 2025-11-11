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
            // Make sure these fields are properly nullable
            $table->string('grade_level')->nullable()->change();
            $table->boolean('is_graded')->nullable()->change();
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
        //
    }
};
