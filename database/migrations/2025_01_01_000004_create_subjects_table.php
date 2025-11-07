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
        Schema::create('subjects', function (Blueprint $table) {
            $table->id('Id');
            $table->string('Subject_name', 100);
            $table->string('Subject_code', 100)->unique();
            $table->integer('Semester')->default(1); // Changed from foreignId to integer (1 or 2)
            $table->integer('year_level');
            $table->foreignId('strand_id')->constrained('strands')->cascadeOnDelete();
            $table->text('PREREQUISITES')->nullable();
            $table->text('CO-REQUISITES')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subjects');
    }
};

