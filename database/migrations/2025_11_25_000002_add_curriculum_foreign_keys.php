<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            if (!Schema::hasColumn('subjects', 'curriculum_id')) {
                $table->foreignId('curriculum_id')
                    ->nullable()
                    ->after('strand_id')
                    ->constrained('curriculums')
                    ->nullOnDelete();
            }
        });

        Schema::table('enrollments', function (Blueprint $table) {
            if (!Schema::hasColumn('enrollments', 'curriculum_id')) {
                $table->foreignId('curriculum_id')
                    ->nullable()
                    ->after('assigned_section_id')
                    ->constrained('curriculums')
                    ->nullOnDelete();
            }
        });

        Schema::table('credited_subjects', function (Blueprint $table) {
            if (!Schema::hasColumn('credited_subjects', 'curriculum_id')) {
                $table->foreignId('curriculum_id')
                    ->nullable()
                    ->after('subject_id')
                    ->constrained('curriculums')
                    ->nullOnDelete();
            }
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('credited_subjects', function (Blueprint $table) {
            if (Schema::hasColumn('credited_subjects', 'curriculum_id')) {
                $table->dropConstrainedForeignId('curriculum_id');
            }
        });

        Schema::table('enrollments', function (Blueprint $table) {
            if (Schema::hasColumn('enrollments', 'curriculum_id')) {
                $table->dropConstrainedForeignId('curriculum_id');
            }
        });

        Schema::table('subjects', function (Blueprint $table) {
            if (Schema::hasColumn('subjects', 'curriculum_id')) {
                $table->dropConstrainedForeignId('curriculum_id');
            }
        });
    }
};
