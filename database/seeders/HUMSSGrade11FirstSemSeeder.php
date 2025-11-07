<?php

namespace Database\Seeders;

use App\Models\Subject;
use App\Models\Strand;

use Illuminate\Database\Seeder;

class HUMSSGrade11FirstSemSeeder extends Seeder
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
                'Subject_name' => 'Oral Communication',
                'Subject_code' => 'ORAL_COMM_HUMSS',
                'Semester' => '1',
                'year_level' => 11,
                'strand_id' => $humss->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Komunikasyon at Pananaliksik sa Wika at Kulturang Pilipino',
                'Subject_code' => 'KOMUN_FIL_HUMSS',
                'Semester' => '1',
                'year_level' => 11,
                'strand_id' => $humss->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'General Mathematics',
                'Subject_code' => 'GEN_MATH_HUMSS',
                'Semester' => '1',
                'year_level' => 11,
                'strand_id' => $humss->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Earth and Life Science',
                'Subject_code' => 'EARTH_LIFE_SCI_HUMSS',
                'Semester' => '1',
                'year_level' => 11,
                'strand_id' => $humss->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => '21st Century Literature from the Philippines and the World',
                'Subject_code' => '21ST_LIT_HUMSS',
                'Semester' => '1',
                'year_level' => 11,
                'strand_id' => $humss->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Physical Education and Health',
                'Subject_code' => 'PE_HEALTH_HUMSS_1',
                'Semester' => '1',
                'year_level' => 11,
                'strand_id' => $humss->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Empowerment Technologies',
                'Subject_code' => 'EMPTECH_HUMSS',
                'Semester' => '1',
                'year_level' => 11,
                'strand_id' => $humss->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Introduction to the World Religions and Belief Systems',
                'Subject_code' => 'WORLD_REL',
                'Semester' => '1',
                'year_level' => 11,
                'strand_id' => $humss->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Disciplines and Ideas in the Social Sciences',
                'Subject_code' => 'DISS',
                'Semester' => '1',
                'year_level' => 11,
                'strand_id' => $humss->id,                'PREREQUISITES' => null,
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

        $this->command->info('HUMSS Grade 11 First Semester subjects seeded successfully.');
    }
}
