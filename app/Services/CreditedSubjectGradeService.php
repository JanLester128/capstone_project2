<?php

namespace App\Services;

use App\Models\CreditedSubject;
use App\Models\Grade;

class CreditedSubjectGradeService
{
    /**
     * Create or update the Grade record for the given credited subject.
     */
    public function syncGrade(CreditedSubject $credit): void
    {
        $credit->loadMissing(['enrollment.schoolYear', 'enrollment.semester', 'subject']);

        if (!$credit->credited_grade || !$credit->approved_by || !$credit->enrollment) {
            $this->deleteGrade($credit);
            return;
        }

        $semesterCode = $this->mapSemester($credit->enrollment->semester?->semester_type);

        $grade = Grade::firstOrNew([
            'student_personal_info_id' => $credit->student_personal_info_id,
            'subject_id' => $credit->subject_id,
            'school_year_id' => $credit->enrollment->school_year_id,
            'semester' => $semesterCode,
            'is_credited' => true,
            'credited_subject_id' => $credit->id,
        ]);

        $firstQuarter = null;
        $secondQuarter = null;
        $thirdQuarter = null;
        $fourthQuarter = null;
        $summerGrade = null;

        switch ($semesterCode) {
            case '2nd':
                $thirdQuarter = $credit->quarter1;
                $fourthQuarter = $credit->quarter2;
                break;
            case 'Summer':
                $summerGrade = $credit->credited_grade;
                break;
            default:
                $firstQuarter = $credit->quarter1;
                $secondQuarter = $credit->quarter2;
                break;
        }

        $grade->fill([
            'faculty_id' => null,
            'class_id' => null,
            'submitted_by' => $credit->credited_by,
            'submitted_for_approval_at' => $credit->credited_at,
            'approved_by' => $credit->approved_by,
            'approved_at' => $credit->credited_at ?? now(),
            'status' => Grade::STATUS_APPROVED,
            'first_quarter' => $firstQuarter,
            'second_quarter' => $secondQuarter,
            'third_quarter' => $thirdQuarter,
            'fourth_quarter' => $fourthQuarter,
            'summer_grade' => $summerGrade,
            'semester_grade' => $credit->credited_grade,
            'remarks' => $credit->remarks ?? ($credit->credited_grade >= 75 ? 'Passed' : 'Failed'),
            'notes' => 'Credited Subject',
            'semester_label' => $this->formatSemesterLabel($semesterCode),
            'school_year_label' => $credit->enrollment->schoolYear?->formatted,
            'is_credited' => true,
            'credited_subject_id' => $credit->id,
        ]);

        $grade->subject_name_snapshot = $grade->subject_name_snapshot
            ?? $credit->subject?->Subject_name;
        $grade->subject_code_snapshot = $grade->subject_code_snapshot
            ?? $credit->subject?->Subject_code;

        $grade->save();
    }

    /**
     * Remove the Grade entry associated with the credited subject (if any).
     */
    public function deleteGrade(CreditedSubject $credit): void
    {
        $credit->loadMissing('enrollment.semester');
        if (!$credit->enrollment) {
            return;
        }

        $semesterCode = $this->mapSemester($credit->enrollment->semester?->semester_type);

        Grade::where('student_personal_info_id', $credit->student_personal_info_id)
            ->where('subject_id', $credit->subject_id)
            ->where('school_year_id', $credit->enrollment->school_year_id)
            ->where('semester', $semesterCode)
            ->where('is_credited', true)
            ->where('credited_subject_id', $credit->id)
            ->delete();
    }

    private function mapSemester(?string $label): string
    {
        if (!$label) {
            return '1st';
        }

        $normalized = strtolower($label);
        if (str_contains($normalized, '2')) {
            return '2nd';
        }

        if (str_contains($normalized, 'summer')) {
            return 'Summer';
        }

        return '1st';
    }

    private function formatSemesterLabel(string $code): string
    {
        return match ($code) {
            '2nd' => '2nd Semester',
            'Summer' => 'Summer',
            default => '1st Semester',
        };
    }
}
