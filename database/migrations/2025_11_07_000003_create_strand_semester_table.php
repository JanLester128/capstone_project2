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
        Schema::create('strand_semester', function (Blueprint $table) {
            $table->id();
            $table->foreignId('strand_id')->constrained('strands')->cascadeOnDelete();
            $table->foreignId('semester_id')->constrained('semester')->cascadeOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // Ensure unique combination of strand and semester
            $table->unique(['strand_id', 'semester_id'], 'strand_semester_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('strand_semester');
    }
};
