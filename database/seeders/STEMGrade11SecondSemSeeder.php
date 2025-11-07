<?php

namespace Database\Seeders;

use App\Models\Subject;
use App\Models\Strand;

use Illuminate\Database\Seeder;

class STEMGrade11SecondSemSeeder extends Seeder
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
                'Subject_name' => 'Reading and Writing',
                'Subject_code' => 'READ_WRITE',
                'Semester' => '2',
                'year_level' => 11,
                'strand_id' => $stem->id,
                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Pagbasa at Pagsusuri ng Iba\'t ibang Teksto Tungo sa Pananaliksik',
                'Subject_code' => 'PAGBASA_FIL',
                'Semester' => '2',
                'year_level' => 11,
                'strand_id' => $stem->id,
                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Statistics and Probability',
                'Subject_code' => 'STAT_PROB',
                'Semester' => '2',
                'year_level' => 11,
                'strand_id' => $stem->id,
                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Disaster Readiness and Risk Reduction',
                'Subject_code' => 'DRRR',
                'Semester' => '2',
                'year_level' => 11,
                'strand_id' => $stem->id,
                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Introduction to the Philosophy of the Human Person/Pambungad sa Pilosopiya ng Tao',
                'Subject_code' => 'INTRO_PHIL',
                'Semester' => '2',
                'year_level' => 11,
                'strand_id' => $stem->id,
                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Physical Education and Health',
                'Subject_code' => 'PE_HEALTH_2',
                'Semester' => '2',
                'year_level' => 11,
                'strand_id' => $stem->id,
                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Practical Research 1',
                'Subject_code' => 'PRAC_RES_1',
                'Semester' => '2',
                'year_level' => 11,
                'strand_id' => $stem->id,
                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Basic Calculus',
                'Subject_code' => 'BASIC_CALC',
                'Semester' => '2',
                'year_level' => 11,
                'strand_id' => $stem->id,                'PREREQUISITES' => 'Pre-calculus',
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'General Chemistry 2',
                'Subject_code' => 'GEN_CHEM_2',
                'Semester' => '2',
                'year_level' => 11,
                'strand_id' => $stem->id,                'PREREQUISITES' => 'General Chemistry 1',
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

        $this->command->info('STEM Grade 11 Second Semester subjects seeded successfully.');
    }
}
