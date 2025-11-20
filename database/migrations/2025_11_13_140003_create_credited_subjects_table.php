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
        Schema::create('credited_subjects', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('student_personal_info_id');
            $table->unsignedBigInteger('enrollment_id');
            $table->unsignedBigInteger('subject_id');
            $table->string('previous_school', 100)->nullable();
            $table->decimal('credited_grade', 5, 2)->nullable();
            $table->decimal('quarter1', 5, 2)->nullable();
            $table->decimal('quarter2', 5, 2)->nullable();
            $table->text('remarks')->nullable();
            $table->unsignedBigInteger('credited_by')->nullable();
            $table->timestamp('credited_at')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamps();

            $table->foreign('student_personal_info_id')
                ->references('id')
                ->on('student_personal_info')
                ->onDelete('cascade');
            
            $table->foreign('enrollment_id')
                ->references('id')
                ->on('enrollments')
                ->onDelete('cascade');
            
            $table->foreign('subject_id')
                ->references('Id')
                ->on('subjects')
                ->onDelete('cascade');
            
            $table->foreign('credited_by')
                ->references('id')
                ->on('users')
                ->onDelete('restrict');
            
            $table->foreign('approved_by')
                ->references('id')
                ->on('users')
                ->onDelete('set null');

            // Prevent duplicate credited subjects per enrollment
            $table->unique(['enrollment_id', 'subject_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('credited_subjects');
    }
};
