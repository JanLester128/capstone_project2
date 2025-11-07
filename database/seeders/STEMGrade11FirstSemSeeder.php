<?php

namespace Database\Seeders;

use App\Models\Subject;
use App\Models\Strand;

use Illuminate\Database\Seeder;

class STEMGrade11FirstSemSeeder extends Seeder
{
    public function run(): void
    {
        $stem = Strand::where('Strand_code', 'STEM')->first();
        if (!$stem) {
            $this->command->error('STEM strand not found. Please run StrandsSeeder first.');
            return;
        }

        $subjects = [
            [
                'Subject_name' => 'Oral Communication',
                'Subject_code' => 'ORAL_COMM',
                'Semester' => '1',
                'year_level' => 11,
                'strand_id' => $stem->id,
                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Komunikasyon at Pananaliksik sa Wika at Kulturang Pilipino',
                'Subject_code' => 'KOMUN_FIL',
                'Semester' => '1',
                'year_level' => 11,
                'strand_id' => $stem->id,
                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'General Mathematics',
                'Subject_code' => 'GEN_MATH',
                'Semester' => '1',
                'year_level' => 11,
                'strand_id' => $stem->id,
                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Earth Science',
                'Subject_code' => 'EARTH_SCI',
                'Semester' => '1',
                'year_level' => 11,
                'strand_id' => $stem->id,
                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => '21st Century Literature from the Philippines and the World',
                'Subject_code' => '21ST_LIT',
                'Semester' => '1',
                'year_level' => 11,
                'strand_id' => $stem->id,
                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Physical Education and Health',
                'Subject_code' => 'PE_HEALTH_1',
                'Semester' => '1',
                'year_level' => 11,
                'strand_id' => $stem->id,
                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Pre-calculus',
                'Subject_code' => 'PRE_CALC',
                'Semester' => '1',
                'year_level' => 11,
                'strand_id' => $stem->id,
                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'General Chemistry 1',
                'Subject_code' => 'GEN_CHEM_1',
                'Semester' => '1',
                'year_level' => 11,
                'strand_id' => $stem->id,
                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
        ];

        foreach ($subjects as $subject) {
            Subject::updateOrCreate(
                [
                    'Subject_code' => $subject['Subject_code'],
                ],
                $subject
            );
        }

        $this->command->info('STEM Grade 11 First Semester subjects seeded successfully.');
    }
}
