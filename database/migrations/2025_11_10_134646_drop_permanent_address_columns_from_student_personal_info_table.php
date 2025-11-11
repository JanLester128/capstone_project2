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
        Schema::table('student_personal_info', function (Blueprint $table) {
            $table->dropColumn([
                'same_as_current_address',
                'permanent_house_no',
                'permanent_sitio_street',
                'permanent_barangay',
                'permanent_municipality_city',
                'permanent_province',
                'permanent_country'
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_personal_info', function (Blueprint $table) {
            $table->boolean('same_as_current_address')->default(true);
            $table->string('permanent_house_no')->nullable();
            $table->string('permanent_sitio_street')->nullable();
            $table->string('permanent_barangay')->nullable();
            $table->string('permanent_municipality_city')->nullable();
            $table->string('permanent_province')->nullable();
            $table->string('permanent_country')->nullable();
        });
    }
};
