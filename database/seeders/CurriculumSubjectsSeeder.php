<?php

namespace Database\Seeders;

use App\Models\Subject;
use App\Models\Curriculum;
use App\Models\Strand;
use App\Models\SchoolYear;
use App\Models\Semester;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CurriculumSubjectsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the 2025-2026 school year
        $schoolYear = SchoolYear::firstOrCreate(
            [
                'School_year_start' => 2025,
                'School_year_end' => 2026,
            ],
            [
                'is_active' => true,
                'enabled' => true,
                'enrollment_open' => true,
                'enrollment_start_date' => '2025-06-01',
                'enrollment_end_date' => '2025-08-31',
            ]
        );

        // Ensure semesters exist for this school year
        $firstSemester = Semester::firstOrCreate(
            [
                'school_year_id' => $schoolYear->id,
                'semester_type' => '1st Semester',
            ],
            [
                'start_date' => '2025-06-01',
                'end_date' => '2025-10-15',
                'is_active' => true,
            ]
        );

        $secondSemester = Semester::firstOrCreate(
            [
                'school_year_id' => $schoolYear->id,
                'semester_type' => '2nd Semester',
            ],
            [
                'start_date' => '2025-11-01',
                'end_date' => '2026-03-15',
                'is_active' => true,
            ]
        );

        // Get all strands
        $strands = Strand::all();
        
        if ($strands->isEmpty()) {
            $this->command->error('Please seed Strands table first!');
            return;
        }

        // Define subjects for each strand
        $subjectsByStrand = [
            'STEM' => [
                '11' => [
                    '1' => [
                        ['code' => 'STEM11-1', 'name' => 'Pre-Calculus'],
                        ['code' => 'STEM11-2', 'name' => 'General Biology 1'],
                        ['code' => 'STEM11-3', 'name' => 'General Chemistry 1'],
                        ['code' => 'STEM11-4', 'name' => 'General Physics 1'],
                    ],
                    '2' => [
                        ['code' => 'STEM11-5', 'name' => 'Basic Calculus', 'prerequisites' => 'STEM11-1'],
                        ['code' => 'STEM11-6', 'name' => 'General Biology 2', 'prerequisites' => 'STEM11-2'],
                        ['code' => 'STEM11-7', 'name' => 'General Chemistry 2', 'prerequisites' => 'STEM11-3'],
                        ['code' => 'STEM11-8', 'name' => 'General Physics 2', 'prerequisites' => 'STEM11-4'],
                    ]
                ],
                '12' => [
                    '1' => [
                        ['code' => 'STEM12-1', 'name' => 'Calculus 1', 'prerequisites' => 'STEM11-5'],
                        ['code' => 'STEM12-2', 'name' => 'Research in Daily Life'],
                        ['code' => 'STEM12-3', 'name' => 'Advanced Mathematics'],
                    ],
                    '2' => [
                        ['code' => 'STEM12-4', 'name' => 'Calculus 2', 'prerequisites' => 'STEM12-1'],
                        ['code' => 'STEM12-5', 'name' => 'Research Project', 'prerequisites' => 'STEM12-2'],
                    ]
                ]
            ],
            // Add other strands (ABM, HUMSS, GAS, etc.) with similar structure
            'ABM' => [
                '11' => [
                    '1' => [
                        ['code' => 'ABM11-1', 'name' => 'Fundamentals of ABM 1'],
                        ['code' => 'ABM11-2', 'name' => 'Business Math'],
                        ['code' => 'ABM11-3', 'name' => 'Business Ethics'],
                    ],
                    '2' => [
                        ['code' => 'ABM11-4', 'name' => 'Fundamentals of ABM 2', 'prerequisites' => 'ABM11-1'],
                        ['code' => 'ABM11-5', 'name' => 'Business Finance'],
                    ]
                ],
                // ... continue for grade 12
            ]
            // Add other strands as needed
        ];

        // Create or update subjects for each strand
        foreach ($strands as $strand) {
            $strandCode = $strand->code;
            
            // Skip if no subjects defined for this strand
            if (!isset($subjectsByStrand[$strandCode])) {
                continue;
            }

            // Find or create curriculum for this strand and school year
            $curriculum = Curriculum::firstOrCreate(
                [
                    'curriculum_code' => 'CURR-' . $strandCode . '-2025',
                    'effective_sy' => '2025-2026',
                ],
                [
                    'name' => $strand->name . ' Curriculum 2025-2026',
                    'track' => 'Academic',
                    'strand_id' => $strand->id,
                    'is_active' => true,
                ]
            );

            // Process subjects for each grade and semester
            foreach ($subjectsByStrand[$strandCode] as $gradeLevel => $semesters) {
                foreach ($semesters as $semesterNumber => $subjects) {
                    $semester = $semesterNumber == 1 ? $firstSemester : $secondSemester;
                    
                    foreach ($subjects as $subjectData) {
                        // Create or update subject
                        $subject = Subject::updateOrCreate(
                            [
                                'Subject_code' => $subjectData['code'],
                                'school_year_id' => $schoolYear->id,
                                'semester_id' => $semester->id,
                            ],
                            [
                                'Subject_name' => $subjectData['name'],
                                'Semester' => $semesterNumber,
                                'year_level' => $gradeLevel,
                                'strand_id' => $strand->id,
                                'PREREQUISITES' => $subjectData['prerequisites'] ?? null,
                                'CO-REQUISITES' => $subjectData['corequisites'] ?? null,
                            ]
                        );

                        // Attach subject to curriculum if not already attached
                        if (!$subject->curriculums()->where('curriculum_id', $curriculum->id)->exists()) {
                            $subject->curriculums()->attach($curriculum->id);
                        }
                    }
                }
            }
        }

        $this->command->info('Curriculum subjects seeded successfully!');
    }
}
