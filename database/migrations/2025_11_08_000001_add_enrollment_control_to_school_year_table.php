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
            $table->boolean('enrollment_open')->default(false)->after('is_active');
            $table->date('enrollment_start_date')->nullable()->after('enrollment_open');
            $table->date('enrollment_end_date')->nullable()->after('enrollment_start_date');
            $table->text('enrollment_message')->nullable()->after('enrollment_end_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('school_year', function (Blueprint $table) {
            $table->dropColumn([
                'enrollment_open',
                'enrollment_start_date', 
                'enrollment_end_date',
                'enrollment_message'
            ]);
        });
    }
};
