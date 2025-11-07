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
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'FirstName')) {
                $table->string('FirstName')->nullable();
            }
            if (!Schema::hasColumn('users', 'MiddleName')) {
                $table->string('MiddleName')->nullable();
            }
            if (!Schema::hasColumn('users', 'LastName')) {
                $table->string('LastName')->nullable();
            }
            if (!Schema::hasColumn('users', 'Password_change_required')) {
                $table->boolean('Password_change_required')->default(false);
            }
            if (!Schema::hasColumn('users', 'is_coordinator')) {
                $table->boolean('is_coordinator')->default(false);
            }
            if (!Schema::hasColumn('users', 'is_disabled')) {
                $table->boolean('is_disabled')->default(false);
            }
            if (!Schema::hasColumn('users', 'Role')) {
                $table->enum('Role', ['Registrar', 'Faculty', 'Student'])->nullable();
            }
            if (!Schema::hasColumn('users', 'assigned_strand_id')) {
                $table->unsignedBigInteger('assigned_strand_id')->nullable();
                // Add foreign key constraint
                $table->foreign('assigned_strand_id')->references('id')->on('strands')->nullOnDelete();
            }

            if (Schema::hasColumn('users', 'name')) {
                $table->dropColumn('name');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'FirstName')) {
                $table->dropColumn('FirstName');
            }
            if (Schema::hasColumn('users', 'MiddleName')) {
                $table->dropColumn('MiddleName');
            }
            if (Schema::hasColumn('users', 'LastName')) {
                $table->dropColumn('LastName');
            }
            if (Schema::hasColumn('users', 'Password_change_required')) {
                $table->dropColumn('Password_change_required');
            }
            if (Schema::hasColumn('users', 'is_coordinator')) {
                $table->dropColumn('is_coordinator');
            }
            if (Schema::hasColumn('users', 'is_disabled')) {
                $table->dropColumn('is_disabled');
            }
            if (Schema::hasColumn('users', 'Role')) {
                $table->dropColumn('Role');
            }
            if (Schema::hasColumn('users', 'assigned_strand_id')) {
                $table->dropForeign(['assigned_strand_id']);
                $table->dropColumn('assigned_strand_id');
            }

            if (!Schema::hasColumn('users', 'name')) {
                $table->string('name')->nullable();
            }
        });
    }
};


