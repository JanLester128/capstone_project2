<?php

namespace Database\Seeders;

use App\Models\Subject;
use App\Models\Strand;

use Illuminate\Database\Seeder;

class ABMGrade11FirstSemSeeder extends Seeder
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
                'Subject_name' => 'Oral Communication',
                'Subject_code' => 'ORAL_COMM_ABM',
                'Semester' => '1',
                'year_level' => 11,
                'strand_id' => $abm->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Komunikasyon at Pananaliksik sa Wika at Kulturang Pilipino',
                'Subject_code' => 'KOMUN_FIL_ABM',
                'Semester' => '1',
                'year_level' => 11,
                'strand_id' => $abm->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'General Mathematics',
                'Subject_code' => 'GEN_MATH_ABM',
                'Semester' => '1',
                'year_level' => 11,
                'strand_id' => $abm->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Earth and Life Science',
                'Subject_code' => 'EARTH_LIFE_SCI_ABM',
                'Semester' => '1',
                'year_level' => 11,
                'strand_id' => $abm->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => '21st Century Literature from the Philippines and the World',
                'Subject_code' => '21ST_LIT_ABM',
                'Semester' => '1',
                'year_level' => 11,
                'strand_id' => $abm->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Physical Education and Health',
                'Subject_code' => 'PE_HEALTH_ABM_1',
                'Semester' => '1',
                'year_level' => 11,
                'strand_id' => $abm->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Empowerment Technologies',
                'Subject_code' => 'EMPTECH_ABM',
                'Semester' => '1',
                'year_level' => 11,
                'strand_id' => $abm->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Organization and Management',
                'Subject_code' => 'ORG_MGMT',
                'Semester' => '1',
                'year_level' => 11,
                'strand_id' => $abm->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Business Math',
                'Subject_code' => 'BUS_MATH',
                'Semester' => '1',
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

        $this->command->info('ABM Grade 11 First Semester subjects seeded successfully.');
    }
}
