<?php

namespace Database\Seeders;

use App\Models\Subject;
use App\Models\Strand;

use Illuminate\Database\Seeder;

class STEMGrade12SecondSemSeeder extends Seeder
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
                'Subject_name' => 'Media and Information Literacy',
                'Subject_code' => 'MIL',
                'Semester' => '2',
                'year_level' => 12,
                'strand_id' => $stem->id,                
                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Contemporary Philippine Arts from the regions',
                'Subject_code' => 'CPAR',
                'Semester' => '2',
                'year_level' => 12,
                'strand_id' => $stem->id,                
                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Physical Education and Health',
                'Subject_code' => 'PE_HEALTH_4',
                'Semester' => '2',
                'year_level' => 12,
                'strand_id' => $stem->id,                
                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Inquiries, Investigations and Immersion',
                'Subject_code' => 'III',
                'Semester' => '2',
                'year_level' => 12,
                'strand_id' => $stem->id,                
                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Entrepreneurship',
                'Subject_code' => 'ENTREP',
                'Semester' => '2',
                'year_level' => 12,
                'strand_id' => $stem->id,                
                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Filipino sa Piling Larang',
                'Subject_code' => 'FIL_LARANG',
                'Semester' => '2',
                'year_level' => 12,
                'strand_id' => $stem->id,                
                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'General Biology 2',
                'Subject_code' => 'GEN_BIO_2',
                'Semester' => '2',
                'year_level' => 12,
                'strand_id' => $stem->id,
                'PREREQUISITES' => 'General Biology 1',
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'General Physics 2',
                'Subject_code' => 'GEN_PHYS_2',
                'Semester' => '2',
                'year_level' => 12,
                'strand_id' => $stem->id,
                'PREREQUISITES' => 'General Physics 1',
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Research/Capstone Project/Work Immersion',
                'Subject_code' => 'CAPSTONE',
                'Semester' => '2',
                'year_level' => 12,
                'strand_id' => $stem->id,                
                'PREREQUISITES' => null,
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

        $this->command->info('STEM Grade 12 Second Semester subjects seeded successfully.');
    }
}
