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
        Schema::table('enrollments', function (Blueprint $table) {
            $table->foreignId('assigned_strand_id')->nullable()->constrained('strands')->nullOnDelete();
            $table->foreignId('assigned_section_id')->nullable()->constrained('sections')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropForeign(['assigned_strand_id']);
            $table->dropForeign(['assigned_section_id']);
            $table->dropColumn(['assigned_strand_id', 'assigned_section_id']);
        });
    }
};
