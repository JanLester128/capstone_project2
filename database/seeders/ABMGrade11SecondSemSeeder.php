<?php

namespace Database\Seeders;

use App\Models\Subject;
use App\Models\Strand;

use Illuminate\Database\Seeder;

class ABMGrade11SecondSemSeeder extends Seeder
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
                'Subject_name' => 'Reading and Writing',
                'Subject_code' => 'READ_WRITE_ABM',
                'Semester' => '2',
                'year_level' => 11,
                'strand_id' => $abm->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Pagbasa at Pagsusuri ng Iba\'t ibang Teksto Tungo sa Pananaliksik',
                'Subject_code' => 'PAGBASA_FIL_ABM',
                'Semester' => '2',
                'year_level' => 11,
                'strand_id' => $abm->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Statistics and Probability',
                'Subject_code' => 'STAT_PROB_ABM',
                'Semester' => '2',
                'year_level' => 11,
                'strand_id' => $abm->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Physical Science',
                'Subject_code' => 'PHYS_SCI_ABM',
                'Semester' => '2',
                'year_level' => 11,
                'strand_id' => $abm->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Introduction to the Philosophy of the Human Person/Pambungad sa Pilosopiya ng Tao',
                'Subject_code' => 'INTRO_PHIL_ABM',
                'Semester' => '2',
                'year_level' => 11,
                'strand_id' => $abm->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Physical Education and Health',
                'Subject_code' => 'PE_HEALTH_ABM_2',
                'Semester' => '2',
                'year_level' => 11,
                'strand_id' => $abm->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Practical Research 1',
                'Subject_code' => 'PRAC_RES_1_ABM',
                'Semester' => '2',
                'year_level' => 11,
                'strand_id' => $abm->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Principles of Marketing',
                'Subject_code' => 'PRIN_MARKETING',
                'Semester' => '2',
                'year_level' => 11,
                'strand_id' => $abm->id,
                'PREREQUISITES' => 'Organization and Management',
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Fundamentals of Accountancy, Business and Management 1',
                'Subject_code' => 'FABM_1',
                'Semester' => '2',
                'year_level' => 11,
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

        $this->command->info('ABM Grade 11 Second Semester subjects seeded successfully.');
    }
}
