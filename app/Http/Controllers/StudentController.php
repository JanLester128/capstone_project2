<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Section;
use App\Models\ClassModel;
use App\Models\ClassDetail;
use App\Models\StudentPersonalInfo;
use App\Models\StudentStrandPreference;
use App\Models\Strand;
use App\Models\SchoolYear;
use App\Models\Semester;
use App\Models\Enrollment;
use App\Models\Grade;
use App\Models\Subject;
use App\Models\Curriculum;
use App\Models\AcademicRecord;
use App\Models\CreditedSubject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Illuminate\Support\Collection;

class StudentController extends Controller
{
    /**
     * Get enrollment status for the current student.
     */
    private function getEnrollmentStatus($student)
    {
        $activeSchoolYear = SchoolYear::where('is_active', true)->first();
        $enrollmentStatus = [
            'isOpen' => false,
            'message' => 'No active school year found',
            'canEnroll' => false,
            'schoolYear' => null,
            'isEnrolled' => false,
            'isReturningStudent' => false,
            'latestEnrollment' => null,
        ];

        if ($activeSchoolYear) {
            $enrollmentStatus['schoolYear'] = $activeSchoolYear;
            $enrollmentStatus['isOpen'] = $activeSchoolYear->enrollment_open && $activeSchoolYear->isEnrollmentOpen();
            
            // Check if student is already enrolled for this school year
            $studentInfo = $student->studentPersonalInfo;
            if ($studentInfo) {
                // Check if student has ANY previous enrolled records (making them a returning student)
                $hasPreviousEnrollment = Enrollment::where('student_personal_info_id', $studentInfo->id)
                    ->where('status', Enrollment::STATUS_ENROLLED)
                    ->exists();
                
                $enrollmentStatus['isReturningStudent'] = $hasPreviousEnrollment;

                // Get active semester to filter enrollment by current semester
                $activeSemester = $activeSchoolYear->semesters()->where('is_active', true)->first();
                
                $existingEnrollment = null;
                
                // Priority 1: Look for enrollment in active semester (if semester is defined)
                if ($activeSemester && $activeSchoolYear) {
                    $existingEnrollment = Enrollment::where('student_personal_info_id', $studentInfo->id)
                        ->where('school_year_id', $activeSchoolYear->id)
                        ->where('semester_id', $activeSemester->id)
                        ->orderByDesc('submitted_at')
                        ->first();
                }

                // Priority 2: Fall back to any enrollment for the school year (if no active semester)
                if (!$existingEnrollment && !$activeSemester && $activeSchoolYear) {
                    $existingEnrollment = Enrollment::where('student_personal_info_id', $studentInfo->id)
                        ->where('school_year_id', $activeSchoolYear->id)
                        ->orderByDesc('submitted_at')
                        ->first();
                }

                if ($existingEnrollment) {
                    $existingEnrollment->loadMissing([
                        'schoolYear',
                        'semester',
                        'assignedSection.strand',
                        'assignedStrand',
                        'creditedSubjects.subject',
                    ]);

                    $schedule = $existingEnrollment->canGenerateCor()
                        ? $existingEnrollment->toScheduleEntries()
                        : [];

                    // Mark credited subjects in schedule (approved credits only)
                    $creditedSubjectCodes = $existingEnrollment->creditedSubjects
                        ->whereNotNull('approved_by')
                        ->map(function ($credit) {
                            return $credit->subject?->Subject_code;
                        })
                        ->filter()
                        ->unique()
                        ->values()
                        ->all();
                    
                    // Add is_credited flag to schedule entries
                    $schedule = collect($schedule)->map(function ($row) use ($creditedSubjectCodes) {
                        $code = $row['subject_code'] ?? null;
                        if ($code && in_array($code, $creditedSubjectCodes)) {
                            $row['is_credited'] = true;
                        }
                        return $row;
                    })->values()->all();

                    // Append credited grades for the active term so they appear in the schedule list (with grade info)
                    $semesterCode = $this->mapSemesterToCode($existingEnrollment->semester?->semester_type);
                    $creditedGrades = Grade::with('subject')
                        ->where('student_personal_info_id', $existingEnrollment->student_personal_info_id)
                        ->where('status', Grade::STATUS_APPROVED)
                        ->where('is_credited', true)
                        ->where('school_year_id', $existingEnrollment->school_year_id)
                        ->when($semesterCode, function ($query) use ($semesterCode) {
                            $query->where('semester', $semesterCode);
                        })
                        ->get();

                    if ($creditedGrades->isNotEmpty()) {
                        $creditedScheduleEntries = $creditedGrades->map(function (Grade $grade) {
                            $subjectName = $grade->subject_name_snapshot
                                ?? $grade->subject?->Subject_name
                                ?? 'Credited Subject';
                            $subjectCode = $grade->subject_code_snapshot
                                ?? $grade->subject?->Subject_code;

                            return [
                                'id' => 'credit-grade-' . $grade->id,
                                'subject' => $subjectName,
                                'subject_code' => $subjectCode,
                                'section' => $grade->section_name_snapshot ?? 'Credited Subject',
                                'faculty' => 'Credited Grade',
                                'day' => 'Credited Subject',
                                'time' => null,
                                'start_time' => null,
                                'end_time' => null,
                                'is_credited' => true,
                                'quarter1' => $grade->first_quarter,
                                'quarter2' => $grade->second_quarter,
                                'final_grade' => $grade->semester_grade,
                                'remarks' => $grade->remarks,
                                'previous_school' => $grade->notes === 'Credited Subject' ? 'Credited' : null,
                            ];
                        })->all();

                        $schedule = array_merge($schedule, $creditedScheduleEntries);
                    }

                    $enrollmentStatus['isEnrolled'] = $existingEnrollment->status === Enrollment::STATUS_ENROLLED;
                    $enrollmentStatus['latestEnrollment'] = [
                        'id' => $existingEnrollment->id,
                        'status' => $existingEnrollment->status,
                        'status_text' => $existingEnrollment->status_text,
                        'school_year' => $existingEnrollment->schoolYear?->formatted,
                        'semester' => $existingEnrollment->semester?->semester_type,
                        'strand' => $existingEnrollment->assignedStrand?->Strand_name
                            ?? $existingEnrollment->assignedSection?->strand?->Strand_name,
                        'section' => $existingEnrollment->assignedSection?->section_name,
                        'can_edit' => $existingEnrollment->isEditable(),
                        'can_generate_cor' => $existingEnrollment->canGenerateCor(),
                        'schedule' => $schedule,
                    ];
                }
            }
            
            // RETURNING STUDENTS: Cannot use enrollment form - must be re-enrolled by registrar/coordinator in person
            // NEW STUDENTS: Can use enrollment form if open and not yet enrolled
            if ($enrollmentStatus['isReturningStudent']) {
                $enrollmentStatus['canEnroll'] = false; // Returning students CANNOT fill the form
                if ($enrollmentStatus['isEnrolled']) {
                    $enrollmentStatus['message'] = 'You are officially enrolled for ' . $activeSchoolYear->formatted;
                } else {
                    $enrollmentStatus['message'] = 'You are a returning student. Please visit the Registrar or Coordinator in person with your previous grades to be re-enrolled.';
                }
            } else {
                // New student logic
                $enrollmentStatus['canEnroll'] = $enrollmentStatus['isOpen']
                    && (!$enrollmentStatus['latestEnrollment']
                        || $enrollmentStatus['latestEnrollment']['can_edit']);
                
                if (!$activeSchoolYear->enrollment_open) {
                    $enrollmentStatus['message'] = 'Enrollment is currently closed for ' . $activeSchoolYear->formatted;
                } elseif (!$activeSchoolYear->isEnrollmentOpen()) {
                    $enrollmentStatus['message'] = $activeSchoolYear->enrollment_status;
                } elseif ($enrollmentStatus['isEnrolled']) {
                    $enrollmentStatus['message'] = 'You are officially enrolled for ' . $activeSchoolYear->formatted;
                } elseif (
                    $enrollmentStatus['latestEnrollment']
                    && !$enrollmentStatus['latestEnrollment']['can_edit']
                ) {
                    $enrollmentStatus['message'] = 'Your enrollment is being processed. You can no longer edit the form.';
                } else {
                    $enrollmentStatus['message'] = 'Enrollment is open for ' . $activeSchoolYear->formatted;
                }
            }
        }

        return $enrollmentStatus;
    }

    /**
     * Display the student dashboard.
     */
    public function index()
    {
        /** @var User $user */
        $user = Auth::user();
        
        // Load student's personal info and related data
        $student = User::with([
                'studentPersonalInfo',
                'assignedStrand',
            ])
            ->find($user->id);

        // Get enrollment status information
        $enrollmentStatus = $this->getEnrollmentStatus($student);
        $studentInfo = $student?->studentPersonalInfo;
        $latestEnrollment = $enrollmentStatus['latestEnrollment'] ?? null;
        $currentEnrollmentId = $latestEnrollment['id'] ?? null;

        $previousTerm = $studentInfo
            ? $this->buildPreviousTermSummary($studentInfo, $currentEnrollmentId)
            : null;

        $gradeRecords = $studentInfo && $previousTerm
            ? $this->buildGradeSnapshot($studentInfo, $previousTerm)
            : collect();

        $recommendations = $this->summarizeRecommendations($gradeRecords);

        return Inertia::render('Students/Dashboard', [
            'enrollmentStatus' => $enrollmentStatus,
            'currentEnrollment' => $latestEnrollment,
            'previousTerm' => $previousTerm,
            'grades' => $gradeRecords->values(),
            'recommendations' => $recommendations,
        ]);
    }

    public function profile()
    {
        $user = Auth::user();

        $student = User::with(['studentPersonalInfo'])->find($user->id);
        $enrollmentStatus = $this->getEnrollmentStatus($student);

        return Inertia::render('Students/Profile', [
            'student' => $student,
        ]);
    }

    /**
     * Show the student's current class schedule.
     */
    public function schedule()
    {
        /** @var User $user */
        $user = Auth::user();

        $student = User::with('studentPersonalInfo')->findOrFail($user->id);
        $enrollmentStatus = $this->getEnrollmentStatus($student);
        $currentEnrollment = $enrollmentStatus['latestEnrollment'] ?? null;
        $schedule = $currentEnrollment['schedule'] ?? [];

        return Inertia::render('Students/Schedule', [
            'schedule' => $schedule,
            'currentEnrollment' => $currentEnrollment,
            'enrollmentStatus' => $enrollmentStatus,
        ]);
    }

    /**
     * Show student's historical classes with grades.
     */
    public function classes()
    {
        /** @var User $user */
        $user = Auth::user();

        $student = User::with('studentPersonalInfo')->findOrFail($user->id);
        $enrollmentStatus = $this->getEnrollmentStatus($student);
        $studentInfo = $student->studentPersonalInfo;

        $classRecords = collect();

        if ($studentInfo) {
            $grades = Grade::with([
                    'subject',
                    'faculty',
                    'schoolYear',
                    'classModel.section.strand',
                ])
                ->where('student_personal_info_id', $studentInfo->id)
                ->where('status', Grade::STATUS_APPROVED)
                ->where(function ($query) {
                    $query->where('is_credited', false)
                        ->orWhereNull('is_credited');
                })
                ->orderBy('school_year_id')
                ->orderBy('semester')
                ->orderBy('subject_name_snapshot')
                ->get();

            $classRecords = $grades->groupBy(function ($grade) {
                $schoolYearLabel = $grade->school_year_label
                    ?? $grade->schoolYear?->formatted
                    ?? 'School Year N/A';
                $semesterLabel = $grade->semester_label
                    ?? $this->formatSemesterLabel($grade->semester);

                return $schoolYearLabel . '|' . $semesterLabel;
            })->map(function ($group) {
                /** @var Grade $first */
                $first = $group->first();
                $section = $first->classModel?->section;

                $schedule = $group->map(function (Grade $grade) {
                    $subjectName = $grade->subject_name_snapshot ?? $grade->subject?->Subject_name;
                    $subjectCode = $grade->subject_code_snapshot ?? $grade->subject?->Subject_code;
                    $facultyName = $grade->is_credited
                        ? 'Credited Grade'
                        : ($grade->faculty_name_snapshot
                            ?? trim((optional($grade->faculty)->FirstName ?? '') . ' ' . (optional($grade->faculty)->LastName ?? '')));

                    return [
                        'id' => $grade->id,
                        'subject' => $subjectName,
                        'subject_code' => $subjectCode,
                        'faculty' => $facultyName ?: null,
                        'first_quarter' => $grade->first_quarter,
                        'second_quarter' => $grade->second_quarter,
                        'third_quarter' => $grade->third_quarter,
                        'fourth_quarter' => $grade->fourth_quarter,
                        'original_failed_grade' => $grade->original_failed_grade,
                        'summer_grade' => $grade->summer_grade,
                        'final_grade' => $grade->semester_grade,
                        'remarks' => $grade->remarks,
                        'notes' => $grade->notes,
                        'is_credited' => (bool) $grade->is_credited,
                    ];
                })->values();

                return [
                    'id' => $first->school_year_id . '-' . ($first->semester ?? '1st'),
                    'school_year' => $first->school_year_label
                        ?? $first->schoolYear?->formatted
                        ?? 'School Year N/A',
                    'semester' => $first->semester_label
                        ?? $this->formatSemesterLabel($first->semester),
                    'grade_level' => $section?->grade_level
                        ?? $first->subject?->year_level,
                    'strand' => [
                        'name' => $section?->strand?->Strand_name,
                    ],
                    'section' => $section?->section_name,
                    'schedule' => $schedule,
                ];
            })->values();
        }

        return Inertia::render('Students/Classes', [
            'enrollments' => $classRecords,
            'enrollmentStatus' => $enrollmentStatus,
        ]);
    }

    private function formatSemesterLabel(?string $semester): string
    {
        if (!$semester) {
            return '1st Semester';
        }

        $normalized = strtolower($semester);

        if (str_contains($normalized, '2')) {
            return '2nd Semester';
        }

        if (str_contains($normalized, 'summer')) {
            return 'Summer';
        }

        return '1st Semester';
    }

    /**
     * Show student's approved grades grouped by term.
     */
    public function grades()
    {
        /** @var User $user */
        $user = Auth::user();

        $student = User::with('studentPersonalInfo')->findOrFail($user->id);
        $enrollmentStatus = $this->getEnrollmentStatus($student);
        $studentInfo = $student->studentPersonalInfo;

        $activeSchoolYear = SchoolYear::where('is_active', true)->first();
        $activeSemester = $activeSchoolYear
            ? Semester::where('school_year_id', $activeSchoolYear->id)
                ->where('is_active', true)
                ->first()
            : null;

        $gradesQuery = Grade::with(['subject', 'faculty', 'schoolYear'])
            ->where('student_personal_info_id', $studentInfo?->id)
            ->where('status', Grade::STATUS_APPROVED)
            ->where(function ($query) {
                $query->where('is_credited', false)
                    ->orWhereNull('is_credited');
            })
            ->orderBy('school_year_id')
            ->orderBy('semester');

        $gradeItems = $studentInfo
            ? $gradesQuery->get()->map(function (Grade $grade) {
                $subject = $grade->subject;
                $faculty = $grade->faculty;
                $schoolYearLabel = $grade->school_year_label
                    ?? $grade->schoolYear?->formatted
                    ?? 'School Year N/A';
                $semesterCode = $grade->semester_label
                    ?? $this->mapSemesterToCode($grade->semester)
                    ?? '1st';
                $semesterDisplay = $semesterCode === 'Summer'
                    ? 'Summer'
                    : ($semesterCode === '2nd' ? '2nd Semester' : '1st Semester');

                $teacherName = $grade->is_credited
                    ? 'Credited Grade'
                    : ($grade->faculty_name_snapshot
                        ?? trim(($faculty->FirstName ?? '') . ' ' . ($faculty->LastName ?? '')));

                return [
                    'id' => $grade->id,
                    'subject' => $subject?->Subject_name ?? $grade->subject_name_snapshot ?? 'Subject',
                    'subject_code' => $subject?->Subject_code ?? $grade->subject_code_snapshot,
                    'teacher' => $teacherName ?: 'TBD',
                    'first_quarter' => $grade->first_quarter,
                    'second_quarter' => $grade->second_quarter,
                    'third_quarter' => $grade->third_quarter,
                    'fourth_quarter' => $grade->fourth_quarter,
                    'original_failed_grade' => $grade->original_failed_grade,
                    'summer_grade' => $grade->summer_grade,
                    'final_grade' => $grade->semester_grade,
                    'remarks' => $grade->remarks,
                    'semester' => $semesterCode,
                    'semester_display' => $semesterDisplay,
                    'school_year' => $schoolYearLabel,
                    'failed_prerequisites' => $grade->failed_prerequisites,
                    'notes' => $grade->notes,
                    'is_credited' => (bool) $grade->is_credited,
                ];
            })
            : collect();

        $groupedGrades = $gradeItems->groupBy(function ($item) {
            return $item['school_year'] . ' - ' . $item['semester_display'];
        })->map(function ($group, $label) {
            return [
                'label' => $label,
                'grades' => $group->values(),
            ];
        })->values();

        $studentInfoPayload = $studentInfo ? [
            'lrn' => $studentInfo->lrn,
            'name' => trim(($studentInfo->first_name ?? '') . ' ' . ($studentInfo->last_name ?? '')),
        ] : null;

        return Inertia::render('Students/Grades', [
            'grades' => $gradeItems->values(),
            'groupedGrades' => $groupedGrades,
            'enrollmentStatus' => $enrollmentStatus,
            'semesterPerformance' => null,
            'studentInfo' => $studentInfoPayload,
            'activeSchoolYear' => $activeSchoolYear
                ? ['id' => $activeSchoolYear->id, 'formatted' => $activeSchoolYear->formatted]
                : null,
            'activeSemester' => $activeSemester
                ? ['id' => $activeSemester->id, 'semester_type' => $activeSemester->semester_type]
                : null,
        ]);
    }

    /**
     * Show academic record (curriculum ladder) for the student.
     */
    public function academicRecord()
    {
        /** @var User $user */
        $user = Auth::user();
        $student = User::with('studentPersonalInfo')->findOrFail($user->id);
        $studentInfo = $student->studentPersonalInfo;

        if (!$studentInfo) {
            return redirect()->route('student.dashboard')
                ->with('error', 'Student profile not found. Please contact the registrar.');
        }

        $enrollmentStatus = $this->getEnrollmentStatus($student);

        $activeEnrollment = Enrollment::with([
                'curriculum',
                'assignedStrand',
                'assignedSection.strand',
                'assignedSection.adviser',
                'academicRecords',
            ])
            ->where('student_personal_info_id', $studentInfo->id)
            ->whereIn('status', [
                Enrollment::STATUS_ENROLLED,
                Enrollment::STATUS_PRE_ENROLLED,
                Enrollment::STATUS_RECOMMENDED,
            ])
            ->whereNotNull('curriculum_id')
            ->latest('processed_at')
            ->latest('submitted_at')
            ->first();

        if (!$activeEnrollment) {
            return Inertia::render('Students/AcademicRecord', [
                'enrollmentStatus' => $enrollmentStatus,
            ]);
        }

        $curriculum = $activeEnrollment->curriculum;
        $strandId = $activeEnrollment->assigned_strand_id
            ?? $activeEnrollment->assignedSection?->strand_id
            ?? null;

        if (!$curriculum) {
            return Inertia::render('Students/AcademicRecord', [
                'enrollmentStatus' => $enrollmentStatus,
                'record' => [],
                'curriculum' => null,
                'strand' => null,
                'summary' => null,
                'studentProfile' => $this->buildStudentProfile($studentInfo, $activeEnrollment),
                'infoMessage' => 'Curriculum information is missing for this enrollment.',
                'currentYearLevel' => $studentInfo->grade_level,
                'currentSemesterKey' => $this->normalizeSemesterKey($activeEnrollment->semester?->semester_type),
            ]);
        }

        if ($activeEnrollment->status !== Enrollment::STATUS_ENROLLED && $activeEnrollment->curriculum_id) {
            $activeEnrollment->loadMissing('academicRecords');

            if ($activeEnrollment->academicRecords->isEmpty()) {
                $activeEnrollment->syncAcademicRecords();
                $activeEnrollment->load('academicRecords');
            }
        }

        $useAssignedClasses = $activeEnrollment->status === Enrollment::STATUS_ENROLLED;

        $subjects = $useAssignedClasses
            ? $this->buildSubjectsFromAssignedClasses($activeEnrollment, $curriculum, $strandId)
            : $this->buildSubjectsFromAcademicRecords($activeEnrollment, $curriculum, $strandId);

        $currentYearLevel = $activeEnrollment->assignedSection?->year_level
            ?? $studentInfo->grade_level;
        $currentSemesterKey = $this->normalizeSemesterKey($activeEnrollment->semester?->semester_type);

        if ($subjects->isEmpty()) {
            return Inertia::render('Students/AcademicRecord', [
                'enrollmentStatus' => $enrollmentStatus,
                'record' => [],
                'curriculum' => $this->formatCurriculum($curriculum),
                'strand' => $activeEnrollment->assignedStrand?->only(['id', 'Strand_name', 'Strand_code'])
                    ?? $activeEnrollment->assignedSection?->strand?->only(['id', 'Strand_name', 'Strand_code']),
                'summary' => null,
                'studentProfile' => $this->buildStudentProfile($studentInfo, $activeEnrollment),
                'infoMessage' => 'Curriculum subjects are not yet configured for this strand.',
                'currentYearLevel' => $currentYearLevel,
                'currentSemesterKey' => $currentSemesterKey,
            ]);
        }

        $subjectIds = $subjects->pluck('Id');

        $gradeMap = Grade::where('student_personal_info_id', $studentInfo->id)
            ->whereIn('subject_id', $subjectIds)
            ->where('status', Grade::STATUS_APPROVED)
            ->get()
            ->keyBy('subject_id');

        $creditedMap = CreditedSubject::where('student_personal_info_id', $studentInfo->id)
            ->whereIn('subject_id', $subjectIds)
            ->whereNotNull('approved_by')
            ->get()
            ->keyBy('subject_id');

        $record = $subjects->groupBy('year_level')->map(function ($yearGroup, $yearLevel) use ($gradeMap, $creditedMap, $currentYearLevel, $currentSemesterKey) {
            $semesterGroups = $yearGroup->groupBy(function ($subject) {
                return $this->normalizeSemesterKey($subject->Semester);
            })->map(function ($semesterGroup, $semesterKey) use ($gradeMap, $creditedMap, $currentYearLevel, $currentSemesterKey, $yearLevel) {
                $quarterRange = $this->quartersForSemester($semesterKey);
                $quarterStatus = [];
                foreach ($quarterRange as $quarterIndex) {
                    $quarterStatus[$quarterIndex] = false;
                }

                $subjectsCollection = $semesterGroup->map(function ($subject) use (&$quarterStatus, $quarterRange, $gradeMap, $creditedMap, $currentYearLevel, $currentSemesterKey, $semesterKey, $yearLevel) {
                    $grade = $gradeMap->get($subject->Id);
                    $credited = $creditedMap->get($subject->Id);

                    $status = 'pending';
                    $finalScore = null;
                    $remarks = null;
                    $quarters = [];
                    foreach ($quarterRange as $quarterIndex) {
                        $quarters[$quarterIndex] = match ($quarterIndex) {
                            1 => $grade?->first_quarter,
                            2 => $grade?->second_quarter,
                            3 => $grade?->third_quarter,
                            4 => $grade?->fourth_quarter,
                            default => null,
                        };
                    }

                    if (($grade?->is_credited ?? false) && $credited) {
                        $mappedCreditedQuarters = [
                            $quarterRange[0] ?? null => $credited->quarter1,
                            $quarterRange[1] ?? null => $credited->quarter2,
                        ];

                        foreach ($mappedCreditedQuarters as $quarterKey => $value) {
                            if ($quarterKey === null) {
                                continue;
                            }

                            if ($value !== null && (!array_key_exists($quarterKey, $quarters) || $quarters[$quarterKey] === null)) {
                                $quarters[$quarterKey] = $value;
                            }
                        }
                    } elseif (!$grade && $credited) {
                        $mappedCreditedQuarters = [
                            $quarterRange[0] ?? null => $credited->quarter1,
                            $quarterRange[1] ?? null => $credited->quarter2,
                        ];

                        foreach ($mappedCreditedQuarters as $quarterKey => $value) {
                            if ($quarterKey === null) {
                                continue;
                            }

                            if ($value !== null) {
                                $quarters[$quarterKey] = $value;
                            }
                        }
                    }

                    foreach ($quarters as $quarterIndex => $value) {
                        if ($value !== null) {
                            $quarterStatus[$quarterIndex] = true;
                        }
                    }

                    if ($grade) {
                        $status = 'completed';
                        $finalScore = $grade->semester_grade ?? $grade->final_grade;
                        $remarks = $grade->remarks;
                    } elseif ($credited) {
                        $status = 'credited';
                        $finalScore = $credited->credited_grade;
                        $remarks = $credited->remarks ?? 'Credited';
                    } elseif ((int)$yearLevel === (int)$currentYearLevel && $semesterKey === $currentSemesterKey) {
                        $status = 'current';
                    }

                    return [
                        'id' => $subject->Id,
                        'name' => $subject->Subject_name,
                        'code' => $subject->Subject_code,
                        'prerequisites' => $subject->PREREQUISITES,
                        'corequisites' => $subject->{'CO-REQUISITES'},
                        'status' => $status,
                        'final_grade' => $finalScore,
                        'remarks' => $remarks,
                        'quarters' => $quarters,
                    ];
                });

                $subjects = $subjectsCollection->values();
                $finalGrades = $subjects->pluck('final_grade')->filter(function ($value) {
                    return $value !== null;
                });

                return [
                    'semester' => $semesterKey,
                    'subjects' => $subjects,
                    'quarter_status' => $quarterStatus,
                    'general_average' => $finalGrades->isNotEmpty()
                        ? round($finalGrades->avg(), 2)
                        : null,
                ];
            })->sortKeys();

            return [
                'year_level' => $yearLevel,
                'semesters' => $semesterGroups->values(),
            ];
        })->sortKeys()->values();

        $summary = [
            'totalSubjects' => $subjects->count(),
            'completed' => $record->flatMap(function ($year) {
                return $year['semesters']->flatMap(function ($sem) {
                    return $sem['subjects']->where('status', 'completed');
                });
            })->count(),
            'credited' => $record->flatMap(function ($year) {
                return $year['semesters']->flatMap(function ($sem) {
                    return $sem['subjects']->where('status', 'credited');
                });
            })->count(),
        ];

        return Inertia::render('Students/AcademicRecord', [
            'enrollmentStatus' => $enrollmentStatus,
            'record' => $record,
            'curriculum' => $this->formatCurriculum($curriculum),
            'strand' => $activeEnrollment->assignedStrand?->only(['id', 'Strand_name', 'Strand_code'])
                ?? $activeEnrollment->assignedSection?->strand?->only(['id', 'Strand_name', 'Strand_code']),
            'summary' => $summary,
            'studentProfile' => $this->buildStudentProfile($studentInfo, $activeEnrollment),
            'infoMessage' => null,
            'currentYearLevel' => $currentYearLevel,
            'currentSemesterKey' => $currentSemesterKey,
        ]);
    }

    private function quartersForSemester(string $semesterKey): array
    {
        return match ($semesterKey) {
            '2' => [3, 4],
            default => [1, 2],
        };
    }

    private function normalizeSemesterKey(?string $value): string
    {
        if (is_numeric($value)) {
            return ((int)$value) === 2 ? '2' : '1';
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

    private function buildStudentProfile(StudentPersonalInfo $studentInfo, ?Enrollment $enrollment = null): array
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

    private function formatCurriculum(?Curriculum $curriculum): ?array
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

    private function buildSubjectsFromCurriculum(Curriculum $curriculum, ?int $strandId = null): Collection
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

    private function buildSubjectsFromAssignedClasses(Enrollment $enrollment, Curriculum $curriculum, ?int $strandId = null): Collection
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

    private function buildSubjectsFromAcademicRecords(Enrollment $enrollment, Curriculum $curriculum, ?int $strandId = null): Collection
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

    /**
     * Update student profile.
     */
    public function updateProfile(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();
        
        $validated = $request->validate([
            'FirstName' => 'required|string|max:100',
            'MiddleName' => 'nullable|string|max:100',
            'LastName' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'profile_photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:10240',
        ]);

        // Update user basic info
        $user->update([
            'FirstName' => $validated['FirstName'],
            'MiddleName' => $validated['MiddleName'],
            'LastName' => $validated['LastName'],
            'email' => $validated['email'],
        ]);

        // Handle profile photo upload - save to users table
        if ($request->hasFile('profile_photo')) {
            // Delete old profile photo if exists
            if ($user->profile_photo && Storage::disk('public')->exists($user->profile_photo)) {
                Storage::disk('public')->delete($user->profile_photo);
            }
            
            $file = $request->file('profile_photo');
            $filename = 'profile_' . $user->id . '_' . time() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('student_photos', $filename, 'public');
            
            // Log for debugging
            Log::info('Profile photo uploaded', [
                'user_id' => $user->id,
                'filename' => $filename,
                'path' => $path,
                'exists' => Storage::disk('public')->exists($path),
            ]);
            
            // Update user with profile photo path
            $user->update(['profile_photo' => $path]);
            
            // Verify the update
            $user->refresh();
            Log::info('Profile photo saved to database', [
                'user_id' => $user->id,
                'profile_photo' => $user->profile_photo,
            ]);
        }

        // Reload the student with updated relationships to ensure fresh data
        $user->load([
            'studentPersonalInfo',
            'assignedStrand',
            'studentPersonalInfo.enrollments.assignedStrand',
            'studentPersonalInfo.enrollments.assignedSection.strand',
        ]);

        return redirect()->route('student.profile')
            ->with('success', 'Profile updated successfully.');
    }

    /**
     * Show student registration form.
     */
    public function showRegistrationForm()
    {
        $strands = Strand::where('Is_active', true)->get();
        
        // Load Philippine address data
        $addressData = \App\Helpers\PhilippineAddressData::getAddressData();
        
        return Inertia::render('Auth/StudentRegister', [
            'strands' => $strands,
            'addressData' => $addressData,
        ]);
    }

    /**
     * Get municipalities for a province (API endpoint)
     */
    public function getMunicipalities(Request $request)
    {
        $province = $request->input('province');
        if (!$province) {
            return response()->json(['municipalities' => []]);
        }
        
        $municipalities = \App\Helpers\PhilippineAddressData::getMunicipalities($province);
        return response()->json(['municipalities' => $municipalities]);
    }

    /**
     * Get barangays for a municipality (API endpoint)
     */
    public function getBarangays(Request $request)
    {
        $province = $request->input('province');
        $municipality = $request->input('municipality');
        
        if (!$province || !$municipality) {
            return response()->json(['barangays' => []]);
        }
        
        $barangays = \App\Helpers\PhilippineAddressData::getBarangays($province, $municipality);
        return response()->json(['barangays' => $barangays]);
    }

    /**
     * Get zip code for address (API endpoint)
     */
    public function getZipCode(Request $request)
    {
        $province = $request->input('province');
        $municipality = $request->input('municipality');
        $barangay = $request->input('barangay');
        
        if (!$province) {
            return response()->json(['zip_code' => null]);
        }
        
        $zipCode = \App\Helpers\PhilippineAddressData::getZipCode($province, $municipality, $barangay);
        return response()->json(['zip_code' => $zipCode]);
    }

    /**
     * Handle student account creation.
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            'extension_name' => 'nullable|string|max:100',
            'birthdate' => 'required|date',
            'age' => 'required|integer|min:1|max:100',
            'sex' => 'required|in:Male,Female',
            'email' => 'required|email|unique:users,email',
            'lrn' => 'required|string|size:12|unique:student_personal_info,lrn',
            'password' => 'required|string|min:8|confirmed',
            // Personal Information
            'place_of_birth' => 'required|string|max:100',
            'religion' => 'nullable|string|max:100',
            'student_status' => 'required|in:new,continuing,transferee',
            // Address
            'current_sitio_street' => 'required|string|max:100',
            'current_barangay' => 'required|string|max:100',
            'current_municipality_city' => 'required|string|max:100',
            'current_province' => 'required|string|max:100',
            'current_zip_code' => 'required|string|max:10',
            // Guardian
            'guardian_name' => 'required|string|max:150',
            'guardian_contact_number' => 'required|digits:11',
            'guardian_address' => 'required|string|max:255',
            'guardian_relationship' => 'required|in:Mother,Father,Guardian,Relative,Other',
            // Previous School
            'last_school_attended' => 'required|string|max:100',
            'school_year_last_attended' => 'required|string|max:100',
            'last_school_address' => 'required|string|max:255',
            'last_school_type' => 'required|string|max:100',
            'grade_level_completed' => 'required|string|max:100',
            // Transferee
            'previous_school' => 'required_if:student_status,transferee|nullable|string|max:255',
        ], [
            // Custom error messages
            'email.unique' => 'This email address is already been taken. Please use a different email address.',
            'lrn.unique' => 'This LRN has already been taken. Please check your LRN or contact the registrar office.',
            'lrn.size' => 'LRN must be exactly 12 digits.',
            'password.confirmed' => 'Password confirmation does not match.',
            'password.min' => 'Password must be at least 8 characters long.',
            'first_name.required' => 'First name is required.',
            'last_name.required' => 'Last name is required.',
            'birthdate.required' => 'Birthdate is required.',
            'age.required' => 'Age is required.',
            'sex.required' => 'Sex is required.',
            'email.required' => 'Email address is required.',
            'email.email' => 'Please enter a valid email address.',
            'lrn.required' => 'LRN is required.',
            'place_of_birth.required' => 'Place of birth is required.',
            'student_status.required' => 'Student status is required.',
            'current_sitio_street.required' => 'Street address is required.',
            'current_barangay.required' => 'Barangay is required.',
            'current_municipality_city.required' => 'Municipality/City is required.',
            'current_province.required' => 'Province is required.',
            'current_zip_code.required' => 'ZIP code is required.',
            'guardian_name.required' => 'Guardian name is required.',
            'guardian_contact_number.required' => 'Guardian contact number is required.',
            'guardian_address.required' => 'Guardian address is required.',
            'guardian_contact_number.digits' => 'Guardian contact number must be exactly 11 digits.',
            'guardian_relationship.required' => 'Guardian relationship is required.',
            'last_school_attended.required' => 'Last school attended is required.',
            'school_year_last_attended.required' => 'School year last attended is required.',
            'last_school_address.required' => 'Last school address is required.',
            'last_school_type.required' => 'Last school type is required.',
            'grade_level_completed.required' => 'Grade level completed is required.',
            'previous_school.required_if' => 'Previous school is required for transferee students.',
        ]);

        try {
            DB::beginTransaction();

            // Create user account
            $user = User::create([
                'FirstName' => $validated['first_name'],
                'MiddleName' => $validated['middle_name'],
                'LastName' => $validated['last_name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'Role' => 'Student',
                'is_disabled' => false,
                'must_change_password' => false,
            ]);

            // Get the active school year or use default
            $activeSchoolYear = SchoolYear::where('is_active', true)->first();
            $currentSchoolYear = $activeSchoolYear 
                ? $activeSchoolYear->formatted 
                : '2025-2026';
            
            // Ensure we have a valid school year value
            if (empty($currentSchoolYear)) {
                $currentSchoolYear = '2025-2026';
            }

            // Create student personal info record with all registration data
            StudentPersonalInfo::create([
                'user_id' => $user->id,
                'lrn' => $validated['lrn'],
                'school_year' => $currentSchoolYear,
                'grade_level' => '10', // Default grade level for registration
                'is_graded' => true, // Default value
                'student_status' => $validated['student_status'],
                'first_name' => $validated['first_name'],
                'middle_name' => $validated['middle_name'],
                'last_name' => $validated['last_name'],
                'extension_name' => $validated['extension_name'] ?? null,
                'birthdate' => $validated['birthdate'],
                'age' => $validated['age'],
                'sex' => $validated['sex'],
                'place_of_birth' => $validated['place_of_birth'],
                'religion' => $validated['religion'] ?? null,
                'current_sitio_street' => $validated['current_sitio_street'],
                'current_barangay' => $validated['current_barangay'],
                'current_municipality_city' => $validated['current_municipality_city'],
                'current_province' => $validated['current_province'],
                'current_zip_code' => $validated['current_zip_code'],
                'current_country' => 'Philippines', // Default country
                'same_as_current_address' => true, // Default value
                'guardian_name' => $validated['guardian_name'],
                'guardian_contact_number' => $validated['guardian_contact_number'],
                'guardian_address' => $validated['guardian_address'],
                'guardian_relationship' => $validated['guardian_relationship'],
                'last_school_attended' => $validated['last_school_attended'],
                'school_year_last_attended' => $validated['school_year_last_attended'],
                'last_school_address' => $validated['last_school_address'],
                'last_school_type' => $validated['last_school_type'],
                'grade_level_completed' => $validated['grade_level_completed'],
                'is_verified' => false,
            ]);

            DB::commit();

            return redirect()->route('login')
                ->with('success', 'Account created successfully! Please wait for the Registrar to approve your account. You will receive an email notification once your account is approved. You can then login using your email or LRN.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Registration failed: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Registration failed. Please try again.'])->withInput();
        }
    }

    /**
     * Show student enrollment form.
     */
    public function showEnrollmentForm()
    {
        $user = Auth::user();
        
        // Load student data
        $student = User::with(['studentPersonalInfo'])
            ->find($user->id);
        
        // Get enrollment status
        $enrollmentStatus = $this->getEnrollmentStatus($student);
        
        // If enrollment is not available, show closed page
        if (!$enrollmentStatus['canEnroll']) {
            return Inertia::render('Students/EnrollmentClosed', [
                'enrollmentStatus' => $enrollmentStatus,
                'student' => $student,
            ]);
        }
        
        $activeSchoolYear = $enrollmentStatus['schoolYear'];
        
        $strands = Strand::where('Is_active', true)->get();
        $studentInfo = StudentPersonalInfo::where('user_id', $user->id)->first();
        
        // Get existing strand preferences if any
        $strandPreferences = [];
        if ($studentInfo) {
            $preferences = $studentInfo->strandPreferences()->with('strand')->get();
            foreach ($preferences as $preference) {
                $strandPreferences[$preference->preference_order] = $preference->strand_id;
            }
        }

        // Provide available subjects for transferee credit selection (optional; filtered later if needed)
        // Determine active semester (if any)
        $activeSemester = null;
        if ($activeSchoolYear) {
            $activeSemester = $activeSchoolYear->semesters()->where('is_active', true)->first();
        }

        // Provide available subjects filtered to active school year/semester when available
        $availableSubjects = Subject::orderBy('Subject_name');
        
        if ($activeSchoolYear) {
            $availableSubjects->where('school_year_id', $activeSchoolYear->id);
        }
        
        if ($activeSemester) {
            $availableSubjects->where('semester_id', $activeSemester->id);
        }
        
        $availableSubjects = $availableSubjects
            ->get(['Id', 'Subject_name', 'Subject_code', 'strand_id', 'year_level', 'semester_id', 'Semester', 'school_year_id']);

        return Inertia::render('Students/EnrollmentForm', [
            'strands' => $strands,
            'studentInfo' => $studentInfo,
            'strandPreferences' => $strandPreferences,
            'activeSchoolYear' => $activeSchoolYear,
            'enrollmentStatus' => $enrollmentStatus,
            'availableSubjects' => $availableSubjects,
        ]);
    }

    /**
     * Store or update student enrollment information.
     */
    public function storeEnrollmentInfo(Request $request)
    {
        $user = Auth::user();
        
        // Normalize strand preference array (drop blanks)
        $rawPreferences = collect($request->input('strand_preferences', []))
            ->filter(fn ($value) => !empty($value))
            ->values()
            ->all();
        $request->merge(['strand_preferences' => $rawPreferences]);

        // Load student data and check enrollment status
        $student = User::with(['studentPersonalInfo'])
            ->find($user->id);
        
        $enrollmentStatus = $this->getEnrollmentStatus($student);
        
        if (!$enrollmentStatus['canEnroll']) {
            return redirect()->route('student.dashboard')
                ->with('error', $enrollmentStatus['message']);
        }
        
        $activeSchoolYear = $enrollmentStatus['schoolYear'];
        
        $validated = $request->validate([
            // Senior High School
            'semester' => 'required|in:1st,2nd',
            
            // Strand Preferences
            'strand_preferences' => 'required|array|min:1|max:3',
            'strand_preferences.*' => 'required|exists:strands,id|distinct',
            
            // Note: subjects_for_credit removed - transferee subject crediting handled by coordinators/registrars
            
            // Document Uploads
            'psa_birth_certificate_photo' => 'nullable|file|mimes:jpeg,png,jpg,gif,pdf|max:10240',
            'report_card_photo' => 'nullable|file|mimes:jpeg,png,jpg,gif,pdf|max:10240',
        ]);

        // Get strand preferences
        $strandPreferences = $validated['strand_preferences'];
        
        // Handle photo uploads
        $photoData = [];
        
        // Handle PSA birth certificate photo
        if ($request->hasFile('psa_birth_certificate_photo')) {
            $file = $request->file('psa_birth_certificate_photo');
            $filename = 'psa_' . $user->id . '_' . time() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('student_documents', $filename, 'public');
            $photoData['psa_birth_certificate_photo'] = $path;
        }

        // Handle report card photo
        if ($request->hasFile('report_card_photo')) {
            $file = $request->file('report_card_photo');
            $filename = 'report_card_' . $user->id . '_' . time() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('student_documents', $filename, 'public');
            $photoData['report_card_photo'] = $path;
        }
        
        // Ensure student personal info exists and has LRN before proceeding
        $existingStudentInfo = StudentPersonalInfo::where('user_id', $user->id)->first();
        if (!$existingStudentInfo || empty($existingStudentInfo->lrn)) {
            return back()->withErrors([
                'error' => 'Your student record is incomplete (LRN missing). Please contact the registrar to complete your profile before submitting the enrollment form.',
            ]);
        }
        
        // Check if student is transferee
        $isTransferee = $existingStudentInfo->student_status === 'transferee';
        
        DB::beginTransaction();
        try {
            // Update student personal info with photo uploads only
            if (!empty($photoData)) {
                $existingStudentInfo->fill($photoData);
                $existingStudentInfo->save();
            }
            $studentInfo = $existingStudentInfo;

            // Delete existing strand preferences
            $studentInfo->strandPreferences()->delete();

            // Create new strand preferences
            foreach ($strandPreferences as $index => $strandId) {
                StudentStrandPreference::create([
                    'student_personal_info_id' => $studentInfo->id,
                    'strand_id' => $strandId,
                    'preference_order' => $index + 1, // 1-based indexing
                ]);
            }

            $activeSemester = $activeSchoolYear ? $activeSchoolYear->semesters()->where('is_active', true)->first() : null;

            $existingEnrollment = null;
            if ($activeSchoolYear) {
                $existingEnrollment = Enrollment::where('student_personal_info_id', $studentInfo->id)
                    ->where('school_year_id', $activeSchoolYear->id)
                    ->lockForUpdate()
                    ->first();
            }

            if ($existingEnrollment && !$existingEnrollment->isEditable()) {
                DB::rollBack();

                return redirect()->route('student.enrollment')
                    ->withErrors(['error' => 'You can no longer edit your enrollment because it is already under review.']);
            }

            $enrollmentData = [
                'semester_id' => $activeSemester?->id,
                'status' => Enrollment::STATUS_PRE_ENROLLED,
                'submitted_at' => now(),
                'processed_at' => null,
                'enrolled_by' => null,
                'approved_by' => null,
                'approved_at' => null,
                'confirmed_at' => null,
                'is_transferee' => $isTransferee,
            ];

            if ($existingEnrollment) {
                $existingEnrollment->update($enrollmentData);
                $enrollment = $existingEnrollment;
            } else {
                if (!$activeSchoolYear) {
                    throw new \Exception('No active school year found for enrollment creation');
                }
                $enrollment = Enrollment::create(array_merge($enrollmentData, [
                    'student_personal_info_id' => $studentInfo->id,
                    'school_year_id' => $activeSchoolYear->id,
                ]));
            }
            
            // Note: Subject crediting for transferees is now handled by coordinators/registrars
            // No automatic subject credit creation during student enrollment

            DB::commit();

            return redirect()->route('student.enrollment')
                ->with('success', 'Enrollment submitted successfully. Your coordinator will review it automatically.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Enrollment save failed', [
                'user_id' => $user->id ?? null,
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                // Minimal payload snapshot for debugging
                'student_status' => $request->input('student_status'),
                'is_transferee' => $request->boolean('is_transferee'),
                'previous_school' => $request->input('previous_school'),
                'strand_preferences' => $request->input('strand_preferences', []),
            ]);
            return back()->withErrors(['error' => 'Failed to save enrollment information. Please try again.']);
        }
    }

    /**
     * Request coordinator review for the active enrollment.
     */
    public function requestEnrollmentReview(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();
        $studentInfo = $user->studentPersonalInfo;

        if (!$studentInfo) {
            return redirect()->route('student.enrollment')->withErrors([
                'error' => 'Student information not found.',
            ]);
        }

        $activeSchoolYear = SchoolYear::where('is_active', true)->first();

        if (!$activeSchoolYear) {
            return redirect()->route('student.enrollment')->withErrors([
                'error' => 'No active school year. Please contact the registrar.',
            ]);
        }

        $enrollment = Enrollment::where('student_personal_info_id', $studentInfo->id)
            ->where('school_year_id', $activeSchoolYear->id)
            ->first();

        if (!$enrollment) {
            return redirect()->route('student.enrollment')->withErrors([
                'error' => 'Please complete the enrollment form before requesting review.',
            ]);
        }

        if (!$enrollment->isEditable()) {
            return redirect()->route('student.enrollment')->withErrors([
                'error' => 'Your enrollment is already under review.',
            ]);
        }

        $enrollment->update([
            'status' => Enrollment::STATUS_PRE_ENROLLED,
            'submitted_at' => now(),
        ]);

        return redirect()->route('student.enrollment')
            ->with('success', 'Coordinator review requested. Please wait for further updates.');
    }

    /**
     * Build summary of the previous completed enrollment for returning students.
     */
    private function buildPreviousTermSummary(StudentPersonalInfo $studentInfo, ?int $currentEnrollmentId = null): ?array
    {
        $previousEnrollment = $studentInfo->enrollments()
            ->with([
                'schoolYear',
                'semester',
                'assignedSection.strand',
                'assignedSection.adviser',
                'assignedStrand',
            ])
            ->where('status', Enrollment::STATUS_ENROLLED)
            ->when($currentEnrollmentId, fn ($query) => $query->where('id', '!=', $currentEnrollmentId))
            ->orderByDesc('processed_at')
            ->orderByDesc('submitted_at')
            ->first();

        if (!$previousEnrollment) {
            return null;
        }

        $strand = $previousEnrollment->assignedStrand ?? $previousEnrollment->assignedSection?->strand;
        $adviser = $previousEnrollment->assignedSection?->adviser;

        return [
            'id' => $previousEnrollment->id,
            'label' => trim(($previousEnrollment->schoolYear?->formatted ?? 'Previous Term') . ' • ' . ($previousEnrollment->semester?->semester_type ?? '')),
            'school_year_id' => $previousEnrollment->school_year_id,
            'semester_code' => $this->mapSemesterToCode($previousEnrollment->semester?->semester_type),
            'strand' => $strand?->Strand_name,
            'strand_code' => $strand?->Strand_code,
            'grade_level' => $studentInfo->grade_level,
            'adviser' => $adviser ? trim(($adviser->FirstName ?? '') . ' ' . ($adviser->LastName ?? '')) : null,
        ];
    }

    /**
     * Fetch grade records for the previous term and attach recommendations.
     */
    private function buildGradeSnapshot(StudentPersonalInfo $studentInfo, array $previousTerm): Collection
    {
        if (empty($previousTerm['school_year_id']) || empty($previousTerm['semester_code'])) {
            return collect();
        }

        $grades = Grade::with(['subject.strand'])
            ->where('student_personal_info_id', $studentInfo->id)
            ->where('school_year_id', $previousTerm['school_year_id'])
            ->where('semester', $previousTerm['semester_code'])
            ->get();

        $strandCode = $previousTerm['strand_code'] ?? null;

        return $grades->map(function (Grade $grade) use ($strandCode) {
            $subject = $grade->subject;
            $recommendation = $this->evaluateGradeRecommendation($grade, $strandCode);

            return [
                'id' => $grade->id,
                'subject' => [
                    'id' => $subject?->Id,
                    'name' => $subject?->Subject_name,
                    'code' => $subject?->Subject_code,
                    'prerequisites' => $subject?->prerequisites_array ?? [],
                ],
                'first_quarter' => $grade->first_quarter,
                'second_quarter' => $grade->second_quarter,
                'third_quarter' => $grade->third_quarter,
                'fourth_quarter' => $grade->fourth_quarter,
                'semester_grade' => $grade->semester_grade,
                'remarks' => $grade->remarks,
                'recommendation' => $recommendation,
            ];
        });
    }

    /**
     * Evaluate recommended action for a grade row.
     * 
     * RULES:
     * - STEM students: Prerequisites require 85+ to pass. If < 85, student must transfer strand.
     * - STEM students: Non-prerequisites with < 75 require summer class.
     * - Other strands: Any failed subject (< 75) requires summer class only.
     */
    private function evaluateGradeRecommendation(Grade $grade, ?string $strandCode): array
    {
        $subject = $grade->subject;
        $isStem = $strandCode && strtoupper($strandCode) === 'STEM';
        $hasPrerequisites = !empty($subject?->prerequisites_array);
        
        // Determine passing threshold based on strand and prerequisite status
        $passingThreshold = ($isStem && $hasPrerequisites) ? 85 : 75;
        $finalGrade = $grade->semester_grade ?? 0;
        $failed = ($grade->remarks === 'Failed') || ($finalGrade < $passingThreshold);

        if (!$failed) {
            return [
                'decision' => 'passed',
                'note' => 'Cleared',
            ];
        }

        // STEM STUDENT LOGIC
        if ($isStem) {
            if ($hasPrerequisites && $finalGrade < 85) {
                // Failed prerequisite (< 85) → Must transfer strand
            return [
                'decision' => 'transfer_strand',
                    'note' => 'STEM student failed prerequisite subject (< 85). Must transfer to another strand in the new semester.',
            ];
            } elseif (!$hasPrerequisites && $finalGrade < 75) {
                // Failed non-prerequisite (< 75) → Summer class
                return [
                    'decision' => 'summer_class',
                    'note' => 'Eligible for summer remedial class for this subject.',
                ];
            }
        } else {
            // OTHER STRANDS (HUMSS, ABM, TVL) LOGIC
            // Any failed subject (< 75) → Summer class only
            if ($finalGrade < 75) {
            return [
                    'decision' => 'summer_class',
                    'note' => 'Eligible for summer remedial class for this subject.',
            ];
            }
        }

        // Default fallback
        return [
            'decision' => 'summer_class',
            'note' => 'Eligible for summer remedial class for this subject.',
        ];
    }

    /**
     * Collect unique recommendation summaries for quick display.
     */
    private function summarizeRecommendations(Collection $grades): array
    {
        return $grades
            ->pluck('recommendation')
            ->filter(fn (?array $rec) => $rec && ($rec['decision'] ?? 'passed') !== 'passed')
            ->unique(fn ($rec) => $rec['decision'])
            ->map(fn ($rec) => [
                'code' => $rec['decision'],
                'message' => $rec['note'],
            ])
            ->values()
            ->all();
    }

    /**
     * Map semester type label to grade semester code.
     */
    private function mapSemesterToCode(?string $semesterType): string
    {
        return match ($semesterType) {
            '1st Semester' => '1st',
            '2nd Semester' => '2nd',
            'Summer' => 'Summer',
            default => '1st',
        };
    }
    private function averageGradeComponents(array $components): ?float
    {
        $values = collect($components)->filter(fn ($value) => $value !== null);

        if ($values->isEmpty()) {
            return null;
        }

        return $values->avg();
    }

    private function formatGradeComponent(?float $score, $approvedAt): array
    {
        return [
            'score' => $score ?? 0,
            'total' => 100,
            'weight' => 25,
            'date' => optional($approvedAt)->format('M d, Y'),
        ];
    }
}

