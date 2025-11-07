<?php

namespace Database\Seeders;

use App\Models\Subject;
use App\Models\Strand;

use Illuminate\Database\Seeder;

class HUMSSGrade12SecondSemSeeder extends Seeder
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
                'Subject_name' => 'Media and Information Literacy',
                'Subject_code' => 'MIL_HUMSS',
                'Semester' => '2',
                'year_level' => 12,
                'strand_id' => $humss->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Contemporary Philippine Arts from the regions',
                'Subject_code' => 'CPAR_HUMSS',
                'Semester' => '2',
                'year_level' => 12,
                'strand_id' => $humss->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Physical Education and Health',
                'Subject_code' => 'PE_HEALTH_HUMSS_4',
                'Semester' => '2',
                'year_level' => 12,
                'strand_id' => $humss->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Inquiries, Investigations and Immersion',
                'Subject_code' => 'III_HUMSS',
                'Semester' => '2',
                'year_level' => 12,
                'strand_id' => $humss->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Entrepreneurship',
                'Subject_code' => 'ENTREP_HUMSS',
                'Semester' => '2',
                'year_level' => 12,
                'strand_id' => $humss->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Filipino sa Piling Larang',
                'Subject_code' => 'FIL_LARANG_HUMSS',
                'Semester' => '2',
                'year_level' => 12,
                'strand_id' => $humss->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Community Engagement, Solidarity and Citizenship',
                'Subject_code' => 'COMSCI',
                'Semester' => '2',
                'year_level' => 12,
                'strand_id' => $humss->id,                'PREREQUISITES' => 'Disciplines and Ideas in the Social Sciences, Disciplines and Ideas in the Applied Social Sciences, Philippine Politics and Governance',
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Work Immersion/Research/Career Advocacy/Culminating Activity',
                'Subject_code' => 'WORK_RESEARCH_HUMSS',
                'Semester' => '2',
                'year_level' => 12,
                'strand_id' => $humss->id,                'PREREQUISITES' => null,
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

        $this->command->info('HUMSS Grade 12 Second Semester subjects seeded successfully.');
    }
}
