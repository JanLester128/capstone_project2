<?php

namespace Database\Seeders;

use App\Models\Strand;
use Illuminate\Database\Seeder;

class StrandsSeeder extends Seeder
{
    public function run(): void
    {
        // Create Strands
        $strands = [
            ['Strand_code' => 'STEM', 'Strand_name' => 'Science, Technology, Engineering and Mathematics', 'Is_active' => true],
            ['Strand_code' => 'TVL', 'Strand_name' => 'Technical-Vocational-Livelihood', 'Is_active' => true],
            ['Strand_code' => 'HUMSS', 'Strand_name' => 'Humanities and Social Sciences', 'Is_active' => true],
            ['Strand_code' => 'ABM', 'Strand_name' => 'Accountancy, Business and Management', 'Is_active' => true],
        ];

        foreach ($strands as $strand) {
            Strand::updateOrCreate(
                ['Strand_code' => $strand['Strand_code']],
                $strand
            );
        }

        // Note: School Years and Semesters are now completely dynamic
        // Registrars will create them through the web interface as needed
        // No pre-seeded school years or semesters
    }
}
