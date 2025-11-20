<?php

namespace Database\Seeders;

use App\Models\Subject;
use App\Models\Strand;

use Illuminate\Database\Seeder;

class STEMGrade12FirstSemSeeder extends Seeder
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
                'Subject_name' => 'Personal Development/Pansariling Kaunlaran',
                'Subject_code' => 'PERS_DEV',
                'Semester' => '1',
                'year_level' => 12,
                'strand_id' => $stem->id,
                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Understanding Culture, Society and Politics',
                'Subject_code' => 'UCSP',
                'Semester' => '1',
                'year_level' => 12,
                'strand_id' => $stem->id,
                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Physical Education and Health',
                'Subject_code' => 'PE_HEALTH_3',
                'Semester' => '1',
                'year_level' => 12,
                'strand_id' => $stem->id,
                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Practical Research 2',
                'Subject_code' => 'PRAC_RES_2',
                'Semester' => '1',
                'year_level' => 12,
                'strand_id' => $stem->id,
                'PREREQUISITES' => 'Practical Research 1, Statistics and Probability',
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'English for Academic and Professional Purposes',
                'Subject_code' => 'EAPP',
                'Semester' => '1',
                'year_level' => 12,
                'strand_id' => $stem->id,
                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'General Biology 1',
                'Subject_code' => 'GEN_BIO_1',
                'Semester' => '1',
                'year_level' => 12,
                'strand_id' => $stem->id,
                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'General Physics 1',
                'Subject_code' => 'GEN_PHYS_1',
                'Semester' => '1',
                'year_level' => 12,
                'strand_id' => $stem->id,
                'PREREQUISITES' => 'Pre-calculus, Basic Calculus',
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

        $this->command->info('STEM Grade 12 First Semester subjects seeded successfully.');
    }
}
