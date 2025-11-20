<?php

namespace Database\Seeders;

use App\Models\Subject;
use App\Models\Strand;

use Illuminate\Database\Seeder;

class ABMGrade12SecondSemSeeder extends Seeder
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
                'Subject_name' => 'Media and Information Literacy',
                'Subject_code' => 'MIL_ABM',
                'Semester' => '2',
                'year_level' => 12,
                'strand_id' => $abm->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Contemporary Philippine Arts from the regions',
                'Subject_code' => 'CPAR_ABM',
                'Semester' => '2',
                'year_level' => 12,
                'strand_id' => $abm->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Physical Education and Health',
                'Subject_code' => 'PE_HEALTH_ABM_4',
                'Semester' => '2',
                'year_level' => 12,
                'strand_id' => $abm->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Inquiries, Investigations and Immersion',
                'Subject_code' => 'III_ABM',
                'Semester' => '2',
                'year_level' => 12,
                'strand_id' => $abm->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Entrepreneurship',
                'Subject_code' => 'ENTREP_ABM',
                'Semester' => '2',
                'year_level' => 12,
                'strand_id' => $abm->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Filipino sa Piling Larang',
                'Subject_code' => 'FIL_LARANG_ABM',
                'Semester' => '2',
                'year_level' => 12,
                'strand_id' => $abm->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Business Ethics and Social Responsibility',
                'Subject_code' => 'BUS_ETHICS',
                'Semester' => '2',
                'year_level' => 12,
                'strand_id' => $abm->id,
                'PREREQUISITES' => 'Fundamentals of Accountancy, Business and Management 1, Fundamentals of Accountancy, Business and Management 2, Organization and Management',
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Business Enterprise Simulation/Work Immersion',
                'Subject_code' => 'BUS_ENTERPRISE_SIM',
                'Semester' => '2',
                'year_level' => 12,
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

        $this->command->info('ABM Grade 12 Second Semester subjects seeded successfully.');
    }
}
