<?php

namespace Database\Seeders;

use App\Models\Subject;
use App\Models\Strand;

use Illuminate\Database\Seeder;

class ABMGrade12FirstSemSeeder extends Seeder
{
    public function run(): void
    {
        $abm = Strand::where('Strand_code', 'ABM')->first();
        if (!$abm) {
            $this->command->error('ABM strand not found. Please run StrandsSeeder first.');
            return;
        }

        $subjects = [
            [
                'Subject_name' => 'Personal Development/Pansariling Kaunlaran',
                'Subject_code' => 'PERS_DEV_ABM',
                'Semester' => '1',
                'year_level' => 12,
                'strand_id' => $abm->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Understanding Culture, Society and Politics',
                'Subject_code' => 'UCSP_ABM',
                'Semester' => '1',
                'year_level' => 12,
                'strand_id' => $abm->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Physical Education and Health',
                'Subject_code' => 'PE_HEALTH_ABM_3',
                'Semester' => '1',
                'year_level' => 12,
                'strand_id' => $abm->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Practical Research 2',
                'Subject_code' => 'PRAC_RES_2_ABM',
                'Semester' => '1',
                'year_level' => 12,
                'strand_id' => $abm->id,
                'PREREQUISITES' => 'Practical Research 1, Statistics and Probability',
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'English for Academic and Professional Purposes',
                'Subject_code' => 'EAPP_ABM',
                'Semester' => '1',
                'year_level' => 12,
                'strand_id' => $abm->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Fundamentals of Accountancy, Business and Management 2',
                'Subject_code' => 'FABM_2',
                'Semester' => '1',
                'year_level' => 12,
                'strand_id' => $abm->id,
                'PREREQUISITES' => 'Fundamentals of Accountancy, Business and Management 1',
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Business Finance',
                'Subject_code' => 'BUS_FINANCE',
                'Semester' => '1',
                'year_level' => 12,
                'strand_id' => $abm->id,
                'PREREQUISITES' => 'Fundamentals of Accountancy, Business and Management 2',
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Applied Economics',
                'Subject_code' => 'APPLIED_ECON',
                'Semester' => '1',
                'year_level' => 12,
                'strand_id' => $abm->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
        ];

        foreach ($subjects as $subject) {
            Subject::updateOrCreate(
                [
                    'Subject_code' => $subject['Subject_code'],                ],
                $subject
            );
        }

        $this->command->info('ABM Grade 12 First Semester subjects seeded successfully.');
    }
}
