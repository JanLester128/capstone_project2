<?php

namespace App\Services;

use App\Models\Grade;
use App\Models\Subject;
use App\Models\StudentPersonalInfo;
use App\Models\Enrollment;
use App\Models\Strand;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GradeCalculationService
{
    /**
     * Calculate semester grade from quarterly grades
     */
    public function calculateSemesterGrade(Grade $grade): float
    {
        $quarters = array_filter([
            $grade->first_quarter,
            $grade->second_quarter,
            $grade->third_quarter,
            $grade->fourth_quarter,
        ]);

        if (empty($quarters)) {
            return 0;
        }

        return round(array_sum($quarters) / count($quarters), 2);
    }

    /**
     * Determine grade remarks based on semester grade
     */
    public function determineRemarks(float $semesterGrade): string
    {
        if ($semesterGrade >= 75) {
            return 'Passed';
        } elseif ($semesterGrade >= 60 && $semesterGrade < 75) {
            return 'Failed';
        } elseif ($semesterGrade > 0 && $semesterGrade < 60) {
            return 'Failed';
        } else {
            return 'Incomplete';
        }
    }

    /**
     * Auto-calculate and update grade
     */
    public function autoCalculateGrade(Grade $grade): Grade
    {
        if (!$grade->semester_grade) {
            $calculatedGrade = $this->calculateSemesterGrade($grade);
            $grade->semester_grade = $calculatedGrade;
        }

        $grade->remarks = $this->determineRemarks($grade->semester_grade);
        $grade->auto_calculated = true;

        // Check if grade is failed and has prerequisites
        if ($grade->remarks === 'Failed') {
            $this->checkPrerequisites($grade);
        }

        $grade->save();

        return $grade;
    }

    /**
     * Check if failed subject blocks other subjects due to prerequisites
     * Also checks if the failed subject's prerequisites were failed
     * 
     * RULES:
     * - STEM students: Prerequisites require 85+ to pass. If < 85, student must transfer strand.
     * - STEM students: Non-prerequisites with < 75 require summer class.
     * - Other strands: Any failed subject (< 75) requires summer class only.
     */
    public function checkPrerequisites(Grade $grade): void
    {
        $subject = Subject::with('strand')->find($grade->subject_id);
        
        if (!$subject || !$subject->strand) {
            return;
        }

        $isStem = $subject->strand->Strand_code === 'STEM';
        $finalGrade = $grade->semester_grade ?? 0;
        
        // Determine if this subject has prerequisites
        $hasPrerequisites = !empty($subject->PREREQUISITES);
        
        // For STEM: Prerequisites require 85+, non-prerequisites require 75+
        // For other strands: All subjects require 75+
        $passingThreshold = ($isStem && $hasPrerequisites) ? 85 : 75;
        $isPassing = $finalGrade >= $passingThreshold && $grade->remarks !== 'Failed';
        
        // Clear flags if passing
        if ($isPassing) {
            $grade->is_prerequisite_failed = false;
            $grade->failed_prerequisites = null;
            $grade->needs_summer_class = false;
            $grade->save();
            return;
        }

        // Student failed - determine the type of failure
        $isPrerequisiteSubject = $hasPrerequisites;
        $failedPrerequisites = [];

        // PART 1: Check if this failed subject's prerequisites were also failed
        if ($isPrerequisiteSubject && !empty($subject->PREREQUISITES)) {
            // Parse prerequisites - can be JSON array or comma-separated string
            $prerequisitesRaw = $subject->PREREQUISITES;
            $prerequisites = [];
            
            // Try JSON first
            $decoded = json_decode($prerequisitesRaw, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                $prerequisites = $decoded;
            } else {
                // Fall back to comma-separated
                $prerequisites = array_map('trim', explode(',', $prerequisitesRaw));
            }
            
            foreach ($prerequisites as $prereqName) {
                $prereqName = trim($prereqName);
                if (empty($prereqName)) {
                    continue;
                }
                
                // Find the prerequisite subject by name or code
                $prereqSubject = Subject::where('strand_id', $subject->strand_id)
                    ->where(function ($query) use ($prereqName) {
                        $query->where('Subject_name', $prereqName)
                              ->orWhere('Subject_code', $prereqName)
                              ->orWhere('Subject_name', 'like', '%' . $prereqName . '%')
                              ->orWhere('Subject_code', 'like', '%' . $prereqName . '%');
                    })
                    ->orderByRaw("CASE 
                        WHEN Subject_name = ? THEN 1 
                        WHEN Subject_code = ? THEN 2 
                        ELSE 3 
                    END", [$prereqName, $prereqName])
                    ->first();
                
                if ($prereqSubject) {
                    // Check if student failed this prerequisite
                    // For STEM: Check if < 85, for others: Check if < 75
                    $prereqThreshold = ($isStem) ? 85 : 75;
                    $prereqGrade = Grade::where('student_personal_info_id', $grade->student_personal_info_id)
                        ->where('subject_id', $prereqSubject->Id)
                        ->where('status', Grade::STATUS_APPROVED)
                        ->where(function ($query) use ($prereqThreshold) {
                            $query->where('remarks', 'Failed')
                                  ->orWhere('semester_grade', '<', $prereqThreshold);
                        })
                        ->orderByDesc('approved_at')
                        ->first();
                    
                    if ($prereqGrade) {
                        $failedPrerequisites[] = $prereqSubject->Subject_code;
                    }
                }
            }
        }

        // PART 2: Find all subjects that have this failed subject as a prerequisite
        $blockedSubjects = Subject::where('strand_id', $subject->strand_id)
            ->whereNotNull('PREREQUISITES')
            ->where('PREREQUISITES', '!=', '')
            ->where(function ($query) use ($subject) {
                $query->whereRaw('FIND_IN_SET(?, REPLACE(REPLACE(PREREQUISITES, " ", ""), ",", ","))', [$subject->Subject_name])
                      ->orWhereRaw('FIND_IN_SET(?, REPLACE(REPLACE(PREREQUISITES, " ", ""), ",", ","))', [$subject->Subject_code]);
            })
            ->get();

        // Determine the action based on strand and prerequisite status
        if ($isStem) {
            // STEM STUDENT LOGIC
            if ($isPrerequisiteSubject && $finalGrade < 85) {
                // Failed a prerequisite subject (< 85) → Requires strand transfer
                $grade->is_prerequisite_failed = true;
                $grade->needs_summer_class = false; // No summer class, must transfer
                if ($blockedSubjects->isNotEmpty()) {
                    $blockedCodes = $blockedSubjects->pluck('Subject_code')->join(', ');
                    $grade->failed_prerequisites = $blockedCodes;
                } else {
                    $grade->failed_prerequisites = $subject->Subject_code;
                }
            } elseif (!$isPrerequisiteSubject && $finalGrade < 75) {
                // Failed a non-prerequisite subject (< 75) → Summer class only
                $grade->is_prerequisite_failed = false;
                $grade->needs_summer_class = true;
                $grade->failed_prerequisites = null;
            } elseif ($isPrerequisiteSubject && $finalGrade >= 85) {
                // Passed prerequisite (>= 85) → Clear flags
                $grade->is_prerequisite_failed = false;
                $grade->needs_summer_class = false;
                $grade->failed_prerequisites = null;
            }
        } else {
            // OTHER STRANDS (HUMSS, ABM, TVL) LOGIC
            // Any failed subject (< 75) → Summer class only
            if ($finalGrade < 75) {
                $grade->is_prerequisite_failed = false; // Not a prerequisite failure for strand transfer
                $grade->needs_summer_class = true;
                if ($blockedSubjects->isNotEmpty()) {
                    $blockedCodes = $blockedSubjects->pluck('Subject_code')->join(', ');
                    $grade->failed_prerequisites = $blockedCodes; // Store for reference only
                } else {
                    $grade->failed_prerequisites = null;
                }
            }
        }

        // Add failed prerequisites info if any
        if (!empty($failedPrerequisites)) {
            $existing = $grade->failed_prerequisites ? $grade->failed_prerequisites . ', ' : '';
            $grade->failed_prerequisites = $existing . implode(', ', $failedPrerequisites);
        }

        $grade->save();
    }

    /**
     * Calculate semester performance for a student
     */
    public function calculateSemesterPerformance(
        int $studentPersonalInfoId,
        int $schoolYearId,
        string $semester,
        ?int $enrollmentId = null
    ): array {
        $grades = Grade::where('student_personal_info_id', $studentPersonalInfoId)
            ->where('school_year_id', $schoolYearId)
            ->where('semester', $semester)
            ->where('status', Grade::STATUS_APPROVED)
            ->get();

        $totalSubjects = $grades->count();
        $passedSubjects = $grades->where('remarks', 'Passed')->count();
        $failedSubjects = $grades->whereIn('remarks', ['Failed'])->count();

        // Calculate average
        $semesterAverage = $totalSubjects > 0 
            ? $grades->avg('semester_grade') 
            : 0;

        // Get student's current strand
        $student = StudentPersonalInfo::find($studentPersonalInfoId);
        $currentEnrollment = $enrollmentId 
            ? Enrollment::find($enrollmentId)
            : Enrollment::where('student_personal_info_id', $studentPersonalInfoId)
                ->where('school_year_id', $schoolYearId)
                ->where('status', Enrollment::STATUS_ENROLLED)
                ->first();

        $strandId = $currentEnrollment?->assigned_strand_id;
        $strand = $strandId ? Strand::find($strandId) : null;
        $isStem = $strand && $strand->Strand_code === 'STEM';
        
        $requiresSummer = false;
        $requiresStrandChange = false;
        $recommendedStrandId = null;

        // Check for failed prerequisite subjects (for STEM: < 85, for others: < 75)
        $failedPrerequisiteGrades = $grades->filter(function ($grade) use ($isStem) {
            if ($isStem) {
                // STEM: Check if subject has prerequisites and grade < 85
                $subject = $grade->subject;
                if ($subject && !empty($subject->PREREQUISITES)) {
                    return ($grade->semester_grade ?? 0) < 85 || $grade->remarks === 'Failed';
                }
            }
            return false;
        });

        // STEM STUDENT LOGIC
        if ($isStem) {
            // Check if any prerequisite subject was failed (< 85)
            $hasFailedPrerequisite = $failedPrerequisiteGrades->isNotEmpty();
            
            if ($hasFailedPrerequisite) {
                // Failed prerequisite → Must transfer strand
                $requiresStrandChange = true;
                $requiresSummer = false; // No summer class, must transfer
                // Recommend TVL or HUMSS as alternatives
                $recommendedStrandId = Strand::whereIn('Strand_code', ['TVL', 'HUMSS'])
                    ->where('Is_active', true)
                    ->first()?->id;
            } else {
                // No failed prerequisites, but check for failed non-prerequisites
                $failedNonPrerequisite = $grades->filter(function ($grade) {
                    $subject = $grade->subject;
                    $hasPrereq = $subject && !empty($subject->PREREQUISITES);
                    $failed = ($grade->semester_grade ?? 0) < 75 || $grade->remarks === 'Failed';
                    return !$hasPrereq && $failed;
                });
                
                if ($failedNonPrerequisite->isNotEmpty()) {
                    // Failed non-prerequisite → Summer class only
                    $requiresSummer = true;
                    $requiresStrandChange = false;
                }
            }
        } else {
            // OTHER STRANDS (HUMSS, ABM, TVL) LOGIC
            // Any failed subject (< 75) → Summer class only
            $failedSubjects = $grades->filter(function ($grade) {
                return ($grade->semester_grade ?? 0) < 75 || $grade->remarks === 'Failed';
            });
            
            if ($failedSubjects->isNotEmpty()) {
                $requiresSummer = true;
                $requiresStrandChange = false; // No strand transfer for other strands
            }
        }

        // Determine status
        $status = 'Completed';
        if ($semesterAverage < 75 || $failedSubjects > 0) {
            $status = 'Failed';
        } elseif ($requiresSummer) {
            $status = 'Conditional';
        }

        // Update student personal info
        if ($student) {
            $student->update([
                'failed_subjects_count' => $failedSubjects,
                'requires_strand_change' => $requiresStrandChange,
                'recommended_strand_id' => $recommendedStrandId,
            ]);
        }

        // Update enrollment status if needed
        if ($currentEnrollment) {
            $needsSummer = $grades->where('needs_summer_class', true)->count() > 0;
            $summerSubjects = $grades->where('needs_summer_class', true)
                ->pluck('subject.Subject_name')
                ->join(', ');

            $currentEnrollment->update([
                'requires_summer_classes' => $needsSummer,
                'summer_subjects_needed' => $summerSubjects ?: null,
                'is_on_probation' => $requiresStrandChange || ($failedSubjects > 2),
            ]);
        }

        // Return performance data as array (no longer stored in database)
        return [
            'student_personal_info_id' => $studentPersonalInfoId,
            'school_year_id' => $schoolYearId,
            'semester' => $semester,
            'enrollment_id' => $enrollmentId,
            'strand_id' => $strandId,
            'semester_average' => round($semesterAverage, 2),
            'total_subjects' => $totalSubjects,
            'passed_subjects' => $passedSubjects,
            'failed_subjects' => $failedSubjects,
            'status' => $status,
            'requires_summer' => $requiresSummer,
            'requires_strand_change' => $requiresStrandChange,
            'recommended_strand_id' => $recommendedStrandId,
        ];
    }

    /**
     * Process all grades for a semester end
     */
    public function processSemesterEnd(int $schoolYearId, string $semester): Collection
    {
        $results = collect();

        DB::transaction(function () use ($schoolYearId, $semester, &$results) {
            // Get all approved grades for this semester
            $grades = Grade::where('school_year_id', $schoolYearId)
                ->where('semester', $semester)
                ->where('status', Grade::STATUS_APPROVED)
                ->get();

            // Auto-calculate grades
            foreach ($grades as $grade) {
                $this->autoCalculateGrade($grade);
            }

            // Get unique students
            $studentIds = $grades->pluck('student_personal_info_id')->unique();

            // Calculate performance for each student
            foreach ($studentIds as $studentId) {
                $enrollment = Enrollment::where('student_personal_info_id', $studentId)
                    ->where('school_year_id', $schoolYearId)
                    ->where('status', Enrollment::STATUS_ENROLLED)
                    ->first();

                $performance = $this->calculateSemesterPerformance(
                    $studentId,
                    $schoolYearId,
                    $semester,
                    $enrollment?->id
                );

                $results->push($performance);
            }

            // After 2nd semester: Check for STEM students who transferred and recommend summer
            if ($semester === '2nd') {
                $this->recommendSummerForStemTransfers($schoolYearId);
            }
        });

        return $results;
    }

    /**
     * Recommend summer classes for STEM students who transferred to other strands
     * This runs after both semesters (1st and 2nd) are completed
     */
    private function recommendSummerForStemTransfers(int $schoolYearId): void
    {
        // Get all enrollments for this school year
        $enrollments = Enrollment::where('school_year_id', $schoolYearId)
            ->where('status', Enrollment::STATUS_ENROLLED)
            ->with(['assignedStrand', 'studentPersonalInfo'])
            ->get();

        foreach ($enrollments as $enrollment) {
            $currentStrand = $enrollment->assignedStrand;
            $studentInfo = $enrollment->studentPersonalInfo;
            
            // Check if student is currently in a non-STEM strand
            if (!$currentStrand || $currentStrand->Strand_code === 'STEM') {
                continue;
            }

            // Check if student was previously in STEM (check previous enrollments or semester performance)
            $wasInStem = false;
            
            // Check previous enrollments in the same school year
            $previousEnrollments = Enrollment::where('student_personal_info_id', $enrollment->student_personal_info_id)
                ->where('school_year_id', $schoolYearId)
                ->where('id', '!=', $enrollment->id)
                ->with('assignedStrand')
                ->get();
            
            foreach ($previousEnrollments as $prevEnrollment) {
                if ($prevEnrollment->assignedStrand && $prevEnrollment->assignedStrand->Strand_code === 'STEM') {
                    $wasInStem = true;
                    break;
                }
            }

            // Check previous grades to see if student was in STEM
            if (!$wasInStem) {
                // Check if student has any grades from STEM subjects in this school year
                $stemStrand = Strand::where('Strand_code', 'STEM')->where('Is_active', true)->first();
                if ($stemStrand) {
                    $stemGrades = Grade::where('student_personal_info_id', $enrollment->student_personal_info_id)
                        ->where('school_year_id', $schoolYearId)
                        ->whereHas('subject', function ($query) use ($stemStrand) {
                            $query->where('strand_id', $stemStrand->id);
                        })
                        ->exists();
                    
                    if ($stemGrades) {
                        $wasInStem = true;
                    }
                }
            }

            // If student was in STEM and transferred, mark all failed grades for summer
            if ($wasInStem) {
                $failedGrades = Grade::where('student_personal_info_id', $enrollment->student_personal_info_id)
                    ->where('school_year_id', $schoolYearId)
                    ->whereIn('semester', ['1st', '2nd'])
                    ->where('status', Grade::STATUS_APPROVED)
                    ->where(function ($query) {
                        $query->where('remarks', 'Failed')
                            ->orWhere('semester_grade', '<', 75);
                    })
                    ->get();

                foreach ($failedGrades as $grade) {
                    if (!$grade->needs_summer_class) {
                        $grade->needs_summer_class = true;
                        $grade->save();
                    }
                }
            }
        }
    }

    /**
     * Get students requiring summer classes
     */
    public function getStudentsRequiringSummer(int $schoolYearId, string $semester): Collection
    {
        return StudentPersonalInfo::whereHas('grades', function ($query) use ($schoolYearId, $semester) {
            $query->where('school_year_id', $schoolYearId)
                ->where('semester', $semester)
                ->where('needs_summer_class', true)
                ->where('status', Grade::STATUS_APPROVED);
        })->with([
            'grades' => function ($query) use ($schoolYearId, $semester) {
                $query->where('school_year_id', $schoolYearId)
                    ->where('semester', $semester)
                    ->where('needs_summer_class', true)
                    ->with('subject');
            },
            'user',
        ])->get();
    }

    /**
     * Get STEM students requiring strand change
     */
    public function getStemStudentsRequiringChange(int $schoolYearId, string $semester): Collection
    {
        // Calculate dynamically from grades instead of querying table
        $stemStrand = Strand::where('Strand_code', 'STEM')->where('Is_active', true)->first();
        if (!$stemStrand) {
            return collect();
        }
        
        // Get enrollments for STEM students in this school year
        $enrollments = Enrollment::where('school_year_id', $schoolYearId)
            ->where('assigned_strand_id', $stemStrand->id)
            ->where('status', Enrollment::STATUS_ENROLLED)
            ->with('studentPersonalInfo')
            ->get();
        
        $results = collect();
        foreach ($enrollments as $enrollment) {
            $performance = $this->calculateSemesterPerformance(
                $enrollment->student_personal_info_id,
                $schoolYearId,
                $semester,
                $enrollment->id
            );
            
            if ($performance['requires_strand_change']) {
                $results->push([
                    'student' => $enrollment->studentPersonalInfo,
                    'performance' => $performance,
                ]);
            }
        }
        
        return $results;
    }

    /**
     * Initiate strand change for STEM student
     */
    public function initiateStrandChange(
        int $studentPersonalInfoId,
        int $fromStrandId,
        int $toStrandId,
        string $reason
    ): bool {
        $student = StudentPersonalInfo::find($studentPersonalInfoId);
        
        if (!$student) {
            return false;
        }

        // Get current enrollment
        $currentEnrollment = Enrollment::where('student_personal_info_id', $studentPersonalInfoId)
            ->where('status', Enrollment::STATUS_ENROLLED)
            ->latest()
            ->first();

        if (!$currentEnrollment) {
            return false;
        }

        // Update student notes
        $student->update([
            'academic_standing_notes' => $reason,
            'requires_strand_change' => true,
            'recommended_strand_id' => $toStrandId,
        ]);

        // Mark as requiring new enrollment for next semester
        $currentEnrollment->update([
            'is_on_probation' => true,
        ]);

        Log::info("Strand change initiated for student {$studentPersonalInfoId} from strand {$fromStrandId} to {$toStrandId}");

        return true;
    }
}

