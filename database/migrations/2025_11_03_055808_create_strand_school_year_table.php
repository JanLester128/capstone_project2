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
        Schema::create('strand_school_year', function (Blueprint $table) {
            $table->id();
            $table->foreignId('strand_id')->constrained('strands')->cascadeOnDelete();
            $table->foreignId('school_year_id')->constrained('school_year')->cascadeOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // Ensure unique combination of strand and school year
            $table->unique(['strand_id', 'school_year_id'], 'strand_school_year_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('strand_school_year');
    }
};
