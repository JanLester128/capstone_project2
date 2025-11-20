<?php

namespace App\Services;

use App\Models\Enrollment;
use App\Models\Grade;
use App\Models\StudentPersonalInfo;
use App\Models\Strand;
use App\Models\Subject;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ReEnrollmentEligibilityService
{
    const PASSING_GRADE = 75.0;
    const STEM_STRAND_CODE = 'STEM';

    /**
     * Evaluate re-enrollment eligibility for a student.
     * 
     * @param Enrollment $enrollment Current enrollment record
     * @return array ['eligible' => bool, 'reason' => string, 'action_required' => string, 'failed_subjects' => array]
     */
    public function evaluateReEnrollmentEligibility(Enrollment $enrollment): array
    {
        // Get all grades for this enrollment
        $grades = $this->getEnrollmentGrades($enrollment);

        if ($grades->isEmpty()) {
            return [
                'eligible' => true,
                'reason' => 'No grades recorded yet',
                'action_required' => null,
                'failed_subjects' => [],
                'requires_summer_class' => false,
                'requires_strand_change' => false,
            ];
        }

        // Check for incomplete/unapproved grades
        $incompleteGrades = $grades->filter(function ($grade) {
            return $grade->status !== Grade::STATUS_APPROVED;
        });

        if ($incompleteGrades->isNotEmpty()) {
            return [
                'eligible' => false,
                'reason' => 'Not all grades have been approved',
                'action_required' => 'Wait for all grades to be approved before re-enrollment',
                'failed_subjects' => [],
                'requires_summer_class' => false,
                'requires_strand_change' => false,
            ];
        }

        // Check for failed subjects
        $failedGrades = $grades->filter(function ($grade) {
            return $grade->semester_grade < self::PASSING_GRADE;
        });

        if ($failedGrades->isEmpty()) {
            return [
                'eligible' => true,
                'reason' => 'All subjects passed',
                'action_required' => null,
                'failed_subjects' => [],
                'requires_summer_class' => false,
                'requires_strand_change' => false,
            ];
        }

        // Get failed subjects with prerequisite information
        $failedSubjects = $this->getFailedSubjectsWithPrerequisites($failedGrades, $enrollment);

        // Check if student is STEM
        $isSTEM = $this->isSTEMStudent($enrollment);

        // Check if any failed subject is a prerequisite
        $hasFailedPrerequisite = $failedSubjects->contains(function ($subject) {
            return $subject['is_prerequisite'];
        });

        if ($isSTEM && $hasFailedPrerequisite) {
            // STEM students with failed prerequisites must transfer strands
            return [
                'eligible' => false,
                'reason' => 'STEM student with failed prerequisite subject(s)',
                'action_required' => 'Student must transfer to another strand (TVL, HUMSS, or ABM)',
                'failed_subjects' => $failedSubjects->all(),
                'requires_summer_class' => false,
                'requires_strand_change' => true,
            ];
        }

        // For other strands or non-prerequisite failures: summer class required
        return [
            'eligible' => true,
            'reason' => 'Failed subjects require summer class',
            'action_required' => 'Student must take summer classes for failed subjects',
            'failed_subjects' => $failedSubjects->all(),
            'requires_summer_class' => true,
            'requires_strand_change' => false,
        ];
    }

    /**
     * Get all grades for an enrollment.
     */
    private function getEnrollmentGrades(Enrollment $enrollment): Collection
    {
        // Get grades from class details
        return Grade::whereHas('classDetail', function ($query) use ($enrollment) {
            $query->where('enrollment_id', $enrollment->id);
        })
            ->with(['subject', 'classModel.subject'])
            ->get();
    }

    /**
     * Get failed subjects with prerequisite information.
     */
    private function getFailedSubjectsWithPrerequisites(Collection $failedGrades, Enrollment $enrollment): Collection
    {
        return $failedGrades->map(function ($grade) use ($enrollment) {
            $subject = $grade->subject ?? $grade->classModel?->subject;
            
            if (!$subject) {
                return null;
            }

            // Check if this subject is a prerequisite for other subjects
            $isPrerequisite = $this->isPrerequisiteSubject($subject, $enrollment);

            return [
                'grade_id' => $grade->id,
                'subject_id' => $subject->Id,
                'subject_name' => $subject->Subject_name,
                'subject_code' => $subject->Subject_code,
                'grade' => $grade->semester_grade,
                'is_prerequisite' => $isPrerequisite,
                'prerequisites' => $subject->PREREQUISITES,
            ];
        })->filter()->values();
    }

    /**
     * Check if a subject is a prerequisite for other subjects.
     */
    private function isPrerequisiteSubject(Subject $subject, Enrollment $enrollment): bool
    {
        // Get strand and year level
        $strandId = $enrollment->assigned_strand_id;
        $yearLevel = $enrollment->assignedSection?->year_level;

        if (!$strandId || !$yearLevel) {
            return false;
        }

        // Check if any subject in the next year level has this subject as a prerequisite
        $nextYearLevel = $yearLevel + 1;

        if ($nextYearLevel > 12) {
            return false;
        }

        // Search for subjects that list this subject in their prerequisites
        $subjectName = $subject->Subject_name;
        
        $dependentSubjects = Subject::where('strand_id', $strandId)
            ->where('year_level', $nextYearLevel)
            ->where(function ($query) use ($subjectName) {
                $query->where('PREREQUISITES', 'LIKE', '%' . $subjectName . '%')
                      ->orWhere('PREREQUISITES', 'LIKE', '%' . str_replace(' ', '%', $subjectName) . '%');
            })
            ->exists();

        return $dependentSubjects;
    }

    /**
     * Check if student is in STEM strand.
     */
    private function isSTEMStudent(Enrollment $enrollment): bool
    {
        $strand = $enrollment->assignedStrand;
        
        if (!$strand) {
            return false;
        }

        return $strand->Strand_code === self::STEM_STRAND_CODE;
    }

    /**
     * Get available strands for transfer (excluding current strand).
     */
    public function getAvailableTransferStrands(Enrollment $enrollment): Collection
    {
        $currentStrandId = $enrollment->assigned_strand_id;

        return Strand::where('Is_active', true)
            ->where('id', '!=', $currentStrandId)
            ->orderBy('Strand_name')
            ->get(['id', 'Strand_code', 'Strand_name']);
    }

    /**
     * Check semester-specific grade requirements.
     * 
     * @param Grade $grade
     * @param string $semesterType "1st Semester" or "2nd Semester"
     * @return bool Whether the grade has required components
     */
    public function hasRequiredGradeComponents(Grade $grade, string $semesterType): bool
    {
        if ($semesterType === '1st Semester') {
            // 1st semester requires 1st and 2nd quarter grades
            return $grade->first_quarter !== null && $grade->second_quarter !== null;
        } elseif ($semesterType === '2nd Semester') {
            // 2nd semester requires 3rd and 4th quarter grades
            return $grade->third_quarter !== null && $grade->fourth_quarter !== null;
        }

        return false;
    }

    /**
     * Calculate average grade for determining if student needs summer class.
     */
    public function calculateGradeAverage(Grade $grade, string $semesterType): ?float
    {
        $components = [];

        if ($semesterType === '1st Semester') {
            if ($grade->first_quarter !== null) {
                $components[] = $grade->first_quarter;
            }
            if ($grade->second_quarter !== null) {
                $components[] = $grade->second_quarter;
            }
        } elseif ($semesterType === '2nd Semester') {
            if ($grade->third_quarter !== null) {
                $components[] = $grade->third_quarter;
            }
            if ($grade->fourth_quarter !== null) {
                $components[] = $grade->fourth_quarter;
            }
        }

        if (empty($components)) {
            return null;
        }

        return array_sum($components) / count($components);
    }

    /**
     * Determine if a grade is passing.
     */
    public function isPassing(float $grade): bool
    {
        return $grade >= self::PASSING_GRADE;
    }
}

