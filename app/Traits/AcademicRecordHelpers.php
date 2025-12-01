<?php

namespace App\Traits;

use App\Models\AcademicRecord;
use App\Models\ClassDetail;
use App\Models\Curriculum;
use App\Models\Enrollment;
use App\Models\StudentPersonalInfo;
use App\Models\Subject;
use Illuminate\Support\Collection;

trait AcademicRecordHelpers
{
    protected function quartersForSemester(string $semesterKey): array
    {
        return match ($semesterKey) {
            '2' => [3, 4],
            default => [1, 2],
        };
    }

    protected function normalizeSemesterKey(?string $value): string
    {
        if (is_numeric($value)) {
            return ((int) $value) === 2 ? '2' : '1';
        }

        $normalized = strtolower(trim($value ?? ''));

        if (str_contains($normalized, 'summer')) {
            return 'summer';
        }

        if (str_contains($normalized, '2nd') || str_contains($normalized, 'second')) {
            return '2';
        }

        if (str_contains($normalized, '1st') || str_contains($normalized, 'first')) {
            return '1';
        }

        return in_array($normalized, ['2', 'two'], true) ? '2' : '1';
    }

    protected function buildStudentProfile(StudentPersonalInfo $studentInfo, ?Enrollment $enrollment = null): array
    {
        $section = $enrollment?->assignedSection;
        $adviser = $section?->adviser;

        return [
            'last_name' => $studentInfo->last_name,
            'first_name' => $studentInfo->first_name,
            'middle_name' => $studentInfo->middle_name,
            'extension_name' => $studentInfo->extension_name,
            'lrn' => $studentInfo->lrn,
            'birthdate' => $studentInfo->birthdate?->format('F d, Y'),
            'sex' => $studentInfo->sex,
            'grade_level' => $section?->year_level ?? $studentInfo->grade_level,
            'strand' => $enrollment?->assignedStrand?->Strand_name
                ?? $section?->strand?->Strand_name,
            'strand_code' => $enrollment?->assignedStrand?->Strand_code
                ?? $section?->strand?->Strand_code,
            'section' => $section?->section_name,
            'adviser' => $adviser?->full_name,
            'school_year' => $enrollment?->schoolYear?->formatted,
        ];
    }

    protected function formatCurriculum(?Curriculum $curriculum): ?array
    {
        if (!$curriculum) {
            return null;
        }

        return [
            'id' => $curriculum->id,
            'code' => $curriculum->curriculum_code,
            'name' => $curriculum->name,
            'track' => $curriculum->track,
            'effective_sy' => $curriculum->effective_sy,
            'is_active' => (bool) $curriculum->is_active,
        ];
    }

    protected function buildSubjectsFromCurriculum(Curriculum $curriculum, ?int $strandId = null): Collection
    {
        $subjectsQuery = Subject::with(['strand', 'curriculum'])
            ->where('curriculum_id', $curriculum->id)
            ->orderBy('year_level')
            ->orderBy('Semester')
            ->orderBy('Subject_name');

        if ($strandId) {
            $subjectsQuery->where(function ($query) use ($strandId) {
                $query->where('strand_id', $strandId)
                    ->orWhereNull('strand_id');
            });
        }

        return $subjectsQuery->get();
    }

    protected function buildSubjectsFromAssignedClasses(Enrollment $enrollment, Curriculum $curriculum, ?int $strandId = null): Collection
    {
        $enrollment->loadMissing([
            'classDetails.class.subject',
            'classDetails.class.section',
            'classDetails.class.semester',
            'classDetails.classRecord',
            'assignedSection',
            'semester',
        ]);

        $classDetails = $enrollment->classDetails;

        $assignedSubjects = $classDetails->map(function (ClassDetail $detail) use ($enrollment) {
            $class = $detail->class;
            $subject = $class?->subject;

            if (!$subject) {
                return null;
            }

            $classRecord = $detail->classRecord;
            $section = $class?->section;
            $semesterType = $class?->semester?->semester_type
                ?? $enrollment->semester?->semester_type
                ?? $subject->Semester;

            $yearLevel = $section?->year_level
                ?? $enrollment->assignedSection?->year_level
                ?? $subject->year_level;

            return (object) [
                'Id' => $subject->Id,
                'Subject_name' => $classRecord?->subject_name ?? $subject->Subject_name,
                'Subject_code' => $classRecord?->subject_code ?? $subject->Subject_code,
                'PREREQUISITES' => $subject->PREREQUISITES,
                'CO-REQUISITES' => $subject->{'CO-REQUISITES'} ?? $subject->getAttribute('CO-REQUISITES'),
                'Semester' => $semesterType,
                'year_level' => $yearLevel,
            ];
        })->filter()->unique(function ($subject) {
            return $subject->Id ?? ($subject->Subject_code ?? spl_object_hash($subject));
        })->values();

        if ($assignedSubjects->isEmpty()) {
            return $this->buildSubjectsFromAcademicRecords($enrollment, $curriculum, $strandId);
        }

        $fallbackSubjects = $this->buildSubjectsFromAcademicRecords($enrollment, $curriculum, $strandId);
        $existingKeys = $assignedSubjects->map(function ($subject) {
            return $subject->Id ?? $subject->Subject_code;
        })->filter()->all();

        $merged = $assignedSubjects->values();

        $fallbackSubjects->each(function ($subject) use (&$merged, $existingKeys) {
            $key = $subject->Id ?? $subject->Subject_code;
            if ($key && in_array($key, $existingKeys, true)) {
                return;
            }

            $merged->push($subject);
        });

        return $merged->sortBy([
            ['year_level', 'asc'],
            ['Semester', 'asc'],
            ['Subject_name', 'asc'],
        ])->values();
    }

    protected function buildSubjectsFromAcademicRecords(Enrollment $enrollment, Curriculum $curriculum, ?int $strandId = null): Collection
    {
        $enrollment->loadMissing('academicRecords');

        $stored = $enrollment->academicRecords
            ->sortBy('sort_order')
            ->map(function (AcademicRecord $record) {
                return (object) [
                    'Id' => $record->subject_id,
                    'Subject_name' => $record->subject_name,
                    'Subject_code' => $record->subject_code,
                    'PREREQUISITES' => $record->prerequisites,
                    'CO-REQUISITES' => $record->corequisites,
                    'Semester' => $record->semester ?? $record->semester_label,
                    'year_level' => $record->year_level,
                ];
            })
            ->filter(fn ($subject) => !empty($subject->Subject_name));

        if ($stored->isEmpty()) {
            return $this->buildSubjectsFromCurriculum($curriculum, $strandId);
        }

        return $stored->values();
    }
}
