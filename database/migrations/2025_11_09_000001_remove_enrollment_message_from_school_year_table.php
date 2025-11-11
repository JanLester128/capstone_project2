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
        Schema::table('school_year', function (Blueprint $table) {
            $table->dropColumn('enrollment_message');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('school_year', function (Blueprint $table) {
            $table->text('enrollment_message')->nullable()->after('enrollment_end_date');
        });
    }
};
