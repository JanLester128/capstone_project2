<?php

namespace Database\Seeders;

use App\Models\Subject;
use App\Models\Strand;

use Illuminate\Database\Seeder;

class HUMSSGrade12FirstSemSeeder extends Seeder
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
                'Subject_name' => 'Personal Development/Pansariling Kaunlaran',
                'Subject_code' => 'PERS_DEV_HUMSS',
                'Semester' => '1',
                'year_level' => 12,
                'strand_id' => $humss->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Understanding Culture, Society and Politics',
                'Subject_code' => 'UCSP_HUMSS',
                'Semester' => '1',
                'year_level' => 12,
                'strand_id' => $humss->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Physical Education and Health',
                'Subject_code' => 'PE_HEALTH_HUMSS_3',
                'Semester' => '1',
                'year_level' => 12,
                'strand_id' => $humss->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Practical Research 2',
                'Subject_code' => 'PRAC_RES_2_HUMSS',
                'Semester' => '1',
                'year_level' => 12,
                'strand_id' => $humss->id,                'PREREQUISITES' => 'Practical Research 1, Statistics and Probability',
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'English for Academic and Professional Purposes',
                'Subject_code' => 'EAPP_HUMSS',
                'Semester' => '1',
                'year_level' => 12,
                'strand_id' => $humss->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Philippine Politics & Governance',
                'Subject_code' => 'PPG',
                'Semester' => '1',
                'year_level' => 12,
                'strand_id' => $humss->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Trends, Networks and Critical Thinking in the 21st Century',
                'Subject_code' => 'TRENDS_21ST',
                'Semester' => '1',
                'year_level' => 12,
                'strand_id' => $humss->id,                'PREREQUISITES' => 'Introduction to the Philosophy of the Human Person/Pambungad sa Pilosopiya ng Tao',
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Creative Non-Fiction',
                'Subject_code' => 'CREATIVE_NONFIC',
                'Semester' => '1',
                'year_level' => 12,
                'strand_id' => $humss->id,                'PREREQUISITES' => 'Creative Writing/Malikhaing Pagsulat',
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

        $this->command->info('HUMSS Grade 12 First Semester subjects seeded successfully.');
    }
}
