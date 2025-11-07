<?php

namespace Database\Seeders;

use App\Models\Subject;
use App\Models\Strand;

use Illuminate\Database\Seeder;

class TVLGrade11FirstSemSeeder extends Seeder
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
                'Subject_name' => 'Oral Communication',
                'Subject_code' => 'ORAL_COMM_TVL',
                'Semester' => '1',
                'year_level' => 11,
                'strand_id' => $tvl->id,
                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Komunikasyon at Pananaliksik sa Wika at Kulturang Pilipino',
                'Subject_code' => 'KOMUN_FIL_TVL',
                'Semester' => '1',
                'year_level' => 11,
                'strand_id' => $tvl->id,
                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'General Mathematics',
                'Subject_code' => 'GEN_MATH_TVL',
                'Semester' => '1',
                'year_level' => 11,
                'strand_id' => $tvl->id,
                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Earth and Life Science',
                'Subject_code' => 'EARTH_LIFE_SCI',
                'Semester' => '1',
                'year_level' => 11,
                'strand_id' => $tvl->id,
                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => '21st Century Literature from the Philippines and the World',
                'Subject_code' => '21ST_LIT_TVL',
                'Semester' => '1',
                'year_level' => 11,
                'strand_id' => $tvl->id,
                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Physical Education and Health',
                'Subject_code' => 'PE_HEALTH_TVL_1',
                'Semester' => '1',
                'year_level' => 11,
                'strand_id' => $tvl->id,
                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Empowerment Technologies',
                'Subject_code' => 'EMPTECH',
                'Semester' => '1',
                'year_level' => 11,
                'strand_id' => $tvl->id,
                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'TVL Course',
                'Subject_code' => 'TVL_COURSE_1',
                'Semester' => '1',
                'year_level' => 11,
                'strand_id' => $tvl->id,
                'PREREQUISITES' => null,
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

        $this->command->info('TVL Grade 11 First Semester subjects seeded successfully.');
    }
}
