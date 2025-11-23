<?php

namespace App\Support;

use App\Models\CreditedSubject;
use App\Models\Enrollment;
use App\Models\Grade;
use App\Models\SchoolYear;
use App\Models\Semester;
use App\Models\StudentPersonalInfo;

class NotificationCounts
{
    public static function forRegistrar(): array
    {
        $activeSchoolYear = SchoolYear::where('is_active', true)->first();
        $activeSemester = $activeSchoolYear
            ? Semester::where('school_year_id', $activeSchoolYear->id)
                ->where('is_active', true)
                ->first()
            : null;

        $newEnrollmentsCount = Enrollment::whereIn('status', [
            Enrollment::STATUS_PRE_ENROLLED,
            Enrollment::STATUS_RECOMMENDED,
        ])->count();

        $reEnrollmentsCount = 0;
        if ($activeSchoolYear && $activeSemester) {
            $previousSemester = Semester::where('school_year_id', $activeSchoolYear->id)
                ->where('id', '!=', $activeSemester->id)
                ->orderBy('semester_type', 'desc')
                ->first();

            if ($previousSemester) {
                $reEnrollmentsCount = Enrollment::where('status', Enrollment::STATUS_ENROLLED)
                    ->where('school_year_id', $activeSchoolYear->id)
                    ->where('semester_id', $previousSemester->id)
                    ->whereDoesntHave('classDetails', function ($query) use ($activeSemester) {
                        $query->whereHas('class', function ($q) use ($activeSemester) {
                            $q->where('Semester_id', $activeSemester->id);
                        });
                    })
                    ->count();
            }
        }

        $transfereeCreditsCount = CreditedSubject::whereNull('approved_by')
            ->whereHas('enrollment', function ($query) {
                $query->where('is_transferee', true);
            })
            ->count();

        $unverifiedStudentsCount = StudentPersonalInfo::where('is_verified', false)
            ->whereHas('user', function ($query) {
                $query->where('Role', 'Student');
            })
            ->count();

        $pendingGradesCount = Grade::whereNull('approved_at')->count();

        $total = $newEnrollmentsCount
            + $reEnrollmentsCount
            + $transfereeCreditsCount
            + $unverifiedStudentsCount
            + $pendingGradesCount;

        return [
            'new_enrollments' => $newEnrollmentsCount,
            're_enrollments' => $reEnrollmentsCount,
            'transferee_credits' => $transfereeCreditsCount,
            'unverified_students' => $unverifiedStudentsCount,
            'pending_grades' => $pendingGradesCount,
            'total' => $total,
        ];
    }

    public static function empty(): array
    {
        return [
            'new_enrollments' => 0,
            're_enrollments' => 0,
            'transferee_credits' => 0,
            'unverified_students' => 0,
            'pending_grades' => 0,
            'total' => 0,
        ];
    }
}
