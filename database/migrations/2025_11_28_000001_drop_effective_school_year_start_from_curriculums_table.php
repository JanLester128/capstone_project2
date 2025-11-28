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
        if (!Schema::hasTable('curriculums')) {
            return;
        }

        Schema::table('curriculums', function (Blueprint $table) {
            if (Schema::hasColumn('curriculums', 'effective_school_year_start')) {
                $table->dropColumn('effective_school_year_start');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('curriculums')) {
            return;
        }

        Schema::table('curriculums', function (Blueprint $table) {
            if (!Schema::hasColumn('curriculums', 'effective_school_year_start')) {
                $table->unsignedSmallInteger('effective_school_year_start')->nullable()->after('effective_sy');
            }
        });
    }
};
