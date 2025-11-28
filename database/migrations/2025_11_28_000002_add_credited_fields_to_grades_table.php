<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('grades', function (Blueprint $table) {
            if (!Schema::hasColumn('grades', 'is_credited')) {
                $table->boolean('is_credited')->default(false)->after('notes');
            }

            if (!Schema::hasColumn('grades', 'credited_subject_id')) {
                $table->unsignedBigInteger('credited_subject_id')->nullable()->after('is_credited');
                $table->foreign('credited_subject_id')
                    ->references('id')
                    ->on('credited_subjects')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('grades', function (Blueprint $table) {
            if (Schema::hasColumn('grades', 'credited_subject_id')) {
                $table->dropForeign(['credited_subject_id']);
                $table->dropColumn('credited_subject_id');
            }

            if (Schema::hasColumn('grades', 'is_credited')) {
                $table->dropColumn('is_credited');
            }
        });
    }
};
