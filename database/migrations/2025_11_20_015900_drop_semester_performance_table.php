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
        Schema::dropIfExists('semester_performance');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Note: If you need to recreate the table, use the original migration file
        // This down() method intentionally left empty as the table is no longer needed
    }
};
