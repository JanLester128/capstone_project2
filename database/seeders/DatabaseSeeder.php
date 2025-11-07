<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
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

        // Seed Strands
        $this->call([
            StrandsSeeder::class,
        ]);

        // Note: School Years should be created manually through the web interface
        // Subjects should be added manually or via bulk import after creating a school year
        
        // Note: Subject seeders are available but not called by default.
        // To seed subjects for testing, uncomment the seeder calls below:
        /*
        $this->call([
            STEMGrade11FirstSemSeeder::class,
            STEMGrade11SecondSemSeeder::class,
            STEMGrade12FirstSemSeeder::class,
            STEMGrade12SecondSemSeeder::class,
            TVLGrade11FirstSemSeeder::class,
            TVLGrade11SecondSemSeeder::class,
            TVLGrade12FirstSemSeeder::class,
            TVLGrade12SecondSemSeeder::class,
            HUMSSGrade11FirstSemSeeder::class,
            HUMSSGrade11SecondSemSeeder::class,
            HUMSSGrade12FirstSemSeeder::class,
            HUMSSGrade12SecondSemSeeder::class,
            ABMGrade11FirstSemSeeder::class,
            ABMGrade11SecondSemSeeder::class,
            ABMGrade12FirstSemSeeder::class,
            ABMGrade12SecondSemSeeder::class,
        ]);
        */
    }
}