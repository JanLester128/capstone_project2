<?php

namespace Database\Seeders;

use App\Models\Subject;
use App\Models\Strand;

use Illuminate\Database\Seeder;

class TVLGrade12FirstSemSeeder extends Seeder
{
    public function run(): void
    {
        $tvl = Strand::where('Strand_code', 'TVL')->first();
        if (!$tvl) {
            $this->command->error('TVL strand not found. Please run StrandsSeeder first.');
            return;
        }

        $subjects = [
            [
                'Subject_name' => 'Personal Development/Pansariling Kaunlaran',
                'Subject_code' => 'PERS_DEV_TVL',
                'Semester' => '1',
                'year_level' => 12,
                'strand_id' => $tvl->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Understanding Culture, Society and Politics',
                'Subject_code' => 'UCSP_TVL',
                'Semester' => '1',
                'year_level' => 12,
                'strand_id' => $tvl->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Physical Education and Health',
                'Subject_code' => 'PE_HEALTH_TVL_3',
                'Semester' => '1',
                'year_level' => 12,
                'strand_id' => $tvl->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Practical Research 2',
                'Subject_code' => 'PRAC_RES_2_TVL',
                'Semester' => '1',
                'year_level' => 12,
                'strand_id' => $tvl->id,
                'PREREQUISITES' => 'Practical Research 1, Statistics and Probability',
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'English for Academic and Professional Purposes',
                'Subject_code' => 'EAPP_TVL',
                'Semester' => '1',
                'year_level' => 12,
                'strand_id' => $tvl->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'TVL Course',
                'Subject_code' => 'TVL_COURSE_3',
                'Semester' => '1',
                'year_level' => 12,
                'strand_id' => $tvl->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'TVL Course',
                'Subject_code' => 'TVL_COURSE_4',
                'Semester' => '1',
                'year_level' => 12,
                'strand_id' => $tvl->id,                'PREREQUISITES' => null,
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

        $this->command->info('TVL Grade 12 First Semester subjects seeded successfully.');
    }
}
