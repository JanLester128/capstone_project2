<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed Registrar account
        User::updateOrCreate(
            ['email' => 'Registrar@gmail.com'],
            [
                'FirstName' => 'Registrar',
                'MiddleName' => null,
                'LastName' => 'Account',
                'password' => Hash::make('Registrar123'),
                'Role' => 'Registrar',
                'is_coordinator' => false,
                'is_disabled' => false,
                'must_change_password' => false,
                'assigned_strand_id' => null,
            ]
        );

        // Seed other required data (dynamic data such as school years will be created via UI)
        $this->call([
            StrandsSeeder::class,
        ]);
    }
}