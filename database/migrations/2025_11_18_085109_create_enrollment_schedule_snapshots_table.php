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
        Schema::create('class_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_detail_id')->constrained('class_details')->cascadeOnDelete();
            
            // Class record data preserved at enrollment time
            // These values are snapshots to prevent registrar updates from affecting enrolled students
            $table->string('subject_name', 100);
            $table->string('subject_code', 100);
            $table->string('faculty_name', 100)->nullable();
            $table->string('section_name', 100);
            $table->string('day_of_week', 100);
            $table->time('start_time');
            $table->time('end_time');
            
            $table->timestamps();

            // Ensure one record per class_detail
            $table->unique('class_detail_id', 'unique_class_detail_record');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('class_records');
    }
};
