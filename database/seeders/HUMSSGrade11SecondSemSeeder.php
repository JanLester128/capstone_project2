<?php

namespace Database\Seeders;

use App\Models\Subject;
use App\Models\Strand;

use Illuminate\Database\Seeder;

class HUMSSGrade11SecondSemSeeder extends Seeder
{
    public function run(): void
    {
        $humss = Strand::where('Strand_code', 'HUMSS')->first();
        if (!$humss) {
            $this->command->error('HUMSS strand not found. Please run StrandsSeeder first.');
            return;
        }

        $subjects = [
            [
                'Subject_name' => 'Reading and Writing',
                'Subject_code' => 'READ_WRITE_HUMSS',
                'Semester' => '2',
                'year_level' => 11,
                'strand_id' => $humss->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Pagbasa at Pagsusuri ng Iba\'t ibang Teksto Tungo sa Pananaliksik',
                'Subject_code' => 'PAGBASA_FIL_HUMSS',
                'Semester' => '2',
                'year_level' => 11,
                'strand_id' => $humss->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Statistics and Probability',
                'Subject_code' => 'STAT_PROB_HUMSS',
                'Semester' => '2',
                'year_level' => 11,
                'strand_id' => $humss->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Physical Science',
                'Subject_code' => 'PHYS_SCI_HUMSS',
                'Semester' => '2',
                'year_level' => 11,
                'strand_id' => $humss->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Introduction to the Philosophy of the Human Person/Pambungad sa Pilosopiya ng Tao',
                'Subject_code' => 'INTRO_PHIL_HUMSS',
                'Semester' => '2',
                'year_level' => 11,
                'strand_id' => $humss->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Physical Education and Health',
                'Subject_code' => 'PE_HEALTH_HUMSS_2',
                'Semester' => '2',
                'year_level' => 11,
                'strand_id' => $humss->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Practical Research 1',
                'Subject_code' => 'PRAC_RES_1_HUMSS',
                'Semester' => '2',
                'year_level' => 11,
                'strand_id' => $humss->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Creative Writing/Malikhaing Pagsulat',
                'Subject_code' => 'CREATIVE_WRITING',
                'Semester' => '2',
                'year_level' => 11,
                'strand_id' => $humss->id,
                'PREREQUISITES' => '21st Century Literature from the Philippines and the World',
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Disciplines and Ideas in the Social Sciences',
                'Subject_code' => 'DISS_2',
                'Semester' => '2',
                'year_level' => 11,
                'strand_id' => $humss->id,
                'PREREQUISITES' => 'Disciplines and Ideas in the Social Sciences',
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

        $this->command->info('HUMSS Grade 11 Second Semester subjects seeded successfully.');
    }
}
