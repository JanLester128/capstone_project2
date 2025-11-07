<?php

namespace Database\Seeders;

use App\Models\Subject;
use App\Models\Strand;

use Illuminate\Database\Seeder;

class TVLGrade12SecondSemSeeder extends Seeder
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
                'Subject_name' => 'Media and Information Literacy',
                'Subject_code' => 'MIL_TVL',
                'Semester' => '2',
                'year_level' => 12,
                'strand_id' => $tvl->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Contemporary Philippine Arts from the regions',
                'Subject_code' => 'CPAR_TVL',
                'Semester' => '2',
                'year_level' => 12,
                'strand_id' => $tvl->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Physical Education and Health',
                'Subject_code' => 'PE_HEALTH_TVL_4',
                'Semester' => '2',
                'year_level' => 12,
                'strand_id' => $tvl->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Inquiries, Investigations and Immersion',
                'Subject_code' => 'III_TVL',
                'Semester' => '2',
                'year_level' => 12,
                'strand_id' => $tvl->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Entrepreneurship',
                'Subject_code' => 'ENTREP_TVL',
                'Semester' => '2',
                'year_level' => 12,
                'strand_id' => $tvl->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Filipino sa Piling Larang',
                'Subject_code' => 'FIL_LARANG_TVL',
                'Semester' => '2',
                'year_level' => 12,
                'strand_id' => $tvl->id,                'PREREQUISITES' => null,
                'CO-REQUISITES' => null,
            ],
            [
                'Subject_name' => 'Work Immersion',
                'Subject_code' => 'WORK_IMMERSION',
                'Semester' => '2',
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

        $this->command->info('TVL Grade 12 Second Semester subjects seeded successfully.');
    }
}
