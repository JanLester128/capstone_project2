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
        Schema::create('student_strand_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_personal_info_id')->constrained('student_personal_info')->onDelete('cascade');
            $table->foreignId('strand_id')->constrained('strands')->onDelete('cascade');
            $table->integer('preference_order')->comment('1 = first choice, 2 = second choice, 3 = third choice');
            $table->timestamps();
            
            // Ensure unique combination of student and strand
            $table->unique(['student_personal_info_id', 'strand_id'], 'student_strand_unique');
            
            // Ensure unique preference order per student
            $table->unique(['student_personal_info_id', 'preference_order'], 'student_preference_order_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_strand_preferences');
    }
};
