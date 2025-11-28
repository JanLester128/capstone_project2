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
        Schema::create('academic_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('enrollment_id')
                ->constrained()
                ->cascadeOnDelete();
            $table->foreignId('curriculum_id')
                ->nullable()
                ->constrained('curriculums')
                ->nullOnDelete();
            $table->foreignId('strand_id')
                ->nullable()
                ->constrained('strands')
                ->nullOnDelete();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->string('subject_name');
            $table->string('subject_code')->nullable();
            $table->unsignedTinyInteger('year_level')->nullable();
            $table->string('semester')->nullable();
            $table->string('semester_label')->nullable();
            $table->text('prerequisites')->nullable();
            $table->text('corequisites')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->foreign('subject_id')
                ->references('Id')
                ->on('subjects')
                ->nullOnDelete();
            $table->index(['enrollment_id', 'sort_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('academic_records');
    }
};
