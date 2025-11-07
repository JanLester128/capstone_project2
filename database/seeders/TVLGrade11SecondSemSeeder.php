<?php

namespace Database\Seeders;

use App\Models\Subject;
use App\Models\Strand;

use Illuminate\Database\Seeder;

class TVLGrade11SecondSemSeeder extends Seeder
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
                'Subject_name' => 'Reading and Writing',
                'Subject_code' => 'READ_WRITE_TVL',
                'Semester' => '2',
                'year_level' => 11,
                'strand_id' => $tvl->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Pagbasa at Pagsusuri ng Iba\'t ibang Teksto Tungo sa Pananaliksik',
                'Subject_code' => 'PAGBASA_FIL_TVL',
                'Semester' => '2',
                'year_level' => 11,
                'strand_id' => $tvl->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Statistics and Probability',
                'Subject_code' => 'STAT_PROB_TVL',
                'Semester' => '2',
                'year_level' => 11,
                'strand_id' => $tvl->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Physical Science',
                'Subject_code' => 'PHYS_SCI',
                'Semester' => '2',
                'year_level' => 11,
                'strand_id' => $tvl->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Introduction to the Philosophy of the Human Person/Pambungad sa Pilosopiya ng Tao',
                'Subject_code' => 'INTRO_PHIL_TVL',
                'Semester' => '2',
                'year_level' => 11,
                'strand_id' => $tvl->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Physical Education and Health',
                'Subject_code' => 'PE_HEALTH_TVL_2',
                'Semester' => '2',
                'year_level' => 11,
                'strand_id' => $tvl->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Practical Research 1',
                'Subject_code' => 'PRAC_RES_1_TVL',
                'Semester' => '2',
                'year_level' => 11,
                'strand_id' => $tvl->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'TVL Course',
                'Subject_code' => 'TVL_COURSE_2',
                'Semester' => '2',
                'year_level' => 11,
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

        $this->command->info('TVL Grade 11 Second Semester subjects seeded successfully.');
    }
}
