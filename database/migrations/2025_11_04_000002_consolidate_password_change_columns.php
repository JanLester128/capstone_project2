<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First, migrate any existing Password_change_required data to must_change_password
        if (Schema::hasColumn('users', 'Password_change_required')) {
            DB::statement('UPDATE users SET must_change_password = Password_change_required WHERE Password_change_required = 1');
            
            // Then drop the old column
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('Password_change_required');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate the old column if needed
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('Password_change_required')->default(false)->after('password');
        });
        
        // Migrate data back
        DB::statement('UPDATE users SET Password_change_required = must_change_password WHERE must_change_password = 1');
    }
};
