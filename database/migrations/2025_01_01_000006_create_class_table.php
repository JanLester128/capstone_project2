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
        Schema::create('class', function (Blueprint $table) {
            $table->id('Id');
            $table->foreignId('Section_id')->constrained('sections')->cascadeOnDelete();
            $table->foreignId('faculty_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('school_year_id')->constrained('school_year')->cascadeOnDelete();
            $table->foreignId('Semester_id')->constrained('semester')->cascadeOnDelete();
            $table->string('day_of_week', 100);
            $table->time('start_time');
            $table->time('endtime');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('class');
    }
};

