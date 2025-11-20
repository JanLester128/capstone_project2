<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Section;
use App\Models\ClassModel;
use App\Models\StudentPersonalInfo;
use App\Models\StudentStrandPreference;
use App\Models\Strand;
use App\Models\SchoolYear;
use App\Models\Semester;
use App\Models\Enrollment;
use App\Models\Grade;
use App\Models\Subject;
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
                if ($activeSemester) {
                    $existingEnrollment = Enrollment::where('student_personal_info_id', $studentInfo->id)
                        ->where('school_year_id', $activeSchoolYear->id)
                        ->where('semester_id', $activeSemester->id)
                        ->orderByDesc('submitted_at')
                        ->first();
                }
                
                // Priority 2: Fall back to any enrollment for the school year (if no active semester)
                if (!$existingEnrollment && !$activeSemester) {
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

    /**
     * Display the student's classes.
     */
    public function classes()
    {
        $user = Auth::user();

        $student = User::with(['studentPersonalInfo'])->find($user->id);
        $enrollmentStatus = $this->getEnrollmentStatus($student);

        $studentInfo = $student?->studentPersonalInfo;
        $enrollments = collect();

        if ($studentInfo) {
            $enrollments = Enrollment::with([
                'schoolYear',
                'semester',
                'assignedSection.strand',
                'assignedSection.adviser',
                'assignedStrand',
                'creditedSubjects.subject',
            ])
            ->where('student_personal_info_id', $studentInfo->id)
            ->where('status', Enrollment::STATUS_ENROLLED)
            ->orderByDesc('processed_at')
            ->orderByDesc('submitted_at')
            ->get()
            ->map(function (Enrollment $enrollment) {
                $schedule = $enrollment->toScheduleEntries();
                $section = $enrollment->assignedSection;
                $strand = $section?->strand ?? $enrollment->assignedStrand;
                $adviser = $section?->adviser;

                // Attach grades for the same term (match by subject code)
                $semesterCode = $this->mapSemesterToCode($enrollment->semester?->semester_type);
                $gradesForTerm = Grade::with('subject')
                    ->where('student_personal_info_id', $enrollment->student_personal_info_id)
                    ->where('school_year_id', $enrollment->school_year_id)
                    ->where('semester', $semesterCode)
                    ->where('status', Grade::STATUS_APPROVED)
                    ->get()
                    ->mapWithKeys(function (Grade $grade) {
                        $code = $grade->subject_code_snapshot ?? $grade->subject?->Subject_code;
                        return [$code => [
                            'first_quarter' => $grade->first_quarter,
                            'second_quarter' => $grade->second_quarter,
                            'third_quarter' => $grade->third_quarter,
                            'fourth_quarter' => $grade->fourth_quarter,
                            'original_failed_grade' => $grade->original_failed_grade,
                            'summer_grade' => $grade->summer_grade,
                            'final_grade' => $grade->semester_grade,
                            'remarks' => $grade->remarks,
                            'notes' => $grade->notes,
                        ]];
                    });

                // Build credited subjects map by subject_code (approved credits only)
                $creditedSubjectsMap = $enrollment->creditedSubjects
                    ->whereNotNull('approved_by')
                    ->mapWithKeys(function ($credit) use ($enrollment) {
                        $subject = $credit->subject;
                        $code = $subject?->Subject_code ?? null;
                        if (!$code) {
                            return [];
                        }
                        
                        $semesterLabel = $enrollment->semester?->semester_type;
                        $semesterCode = $this->mapSemesterToCode($semesterLabel); // '1st' or '2nd'

                        // Map credited quarters into grade components based on semester
                        $first = null;
                        $second = null;
                        $third = null;
                        $fourth = null;

                        if ($semesterCode === '1st') {
                            $first = $credit->quarter1;
                            $second = $credit->quarter2;
                        } elseif ($semesterCode === '2nd') {
                            $third = $credit->quarter1;
                            $fourth = $credit->quarter2;
                        }

                        return [$code => [
                            'first_quarter' => $first,
                            'second_quarter' => $second,
                            'third_quarter' => $third,
                            'fourth_quarter' => $fourth,
                            'final_grade' => $credit->credited_grade,
                            'remarks' => $credit->remarks ? ('CREDITED - ' . $credit->remarks) : 'CREDITED',
                            'is_credited' => true,
                        ]];
                    });

                // Merge grade info and credited subjects into schedule rows
                $schedule = collect($schedule)->map(function ($row) use ($gradesForTerm, $creditedSubjectsMap) {
                    $code = $row['subject_code'] ?? null;
                    
                    // First, try to merge regular grades
                    $g = $code ? ($gradesForTerm[$code] ?? null) : null;
                    if ($g) {
                        $row = array_merge($row, $g);
                    }
                    
                    // Then, check if this subject is credited and merge credited data
                    $credited = $code ? ($creditedSubjectsMap[$code] ?? null) : null;
                    if ($credited) {
                        // Merge credited grades (they take precedence if no regular grades)
                        if (!$g || !$row['first_quarter']) {
                            $row['first_quarter'] = $credited['first_quarter'];
                        }
                        if (!$g || !$row['second_quarter']) {
                            $row['second_quarter'] = $credited['second_quarter'];
                        }
                        if (!$g || !$row['third_quarter']) {
                            $row['third_quarter'] = $credited['third_quarter'];
                        }
                        if (!$g || !$row['fourth_quarter']) {
                            $row['fourth_quarter'] = $credited['fourth_quarter'];
                        }
                        if (!$g || !$row['final_grade']) {
                            $row['final_grade'] = $credited['final_grade'];
                        }
                        // Always mark as credited and use credited remarks
                        $row['is_credited'] = true;
                        $row['remarks'] = $credited['remarks'];
                    }
                    
                    return $row;
                })->values()->all();

                return [
                    'id' => $enrollment->id,
                    'status' => $enrollment->status,
                    'status_text' => $enrollment->status_text,
                    'school_year' => $enrollment->schoolYear?->formatted,
                    'semester' => $enrollment->semester?->semester_type,
                    'strand' => [
                        'name' => $strand?->Strand_name,
                        'code' => $strand?->Strand_code,
                    ],
                    'section' => $section?->section_name,
                    'adviser' => $adviser ? trim(($adviser->FirstName ?? '') . ' ' . ($adviser->LastName ?? '')) : null,
                    'processed_at' => optional($enrollment->processed_at)->toDateTimeString(),
                    'submitted_at' => optional($enrollment->submitted_at)->toDateTimeString(),
                    'schedule' => $schedule,
                ];
            })
            ->values();
        }

        return Inertia::render('Students/Classes', [
            'enrollments' => $enrollments,
            'enrollmentStatus' => $enrollmentStatus,
        ]);
    }

    /**
     * Display the student's schedule.
     */
    public function schedule()
    {
        $user = Auth::user();
        $student = User::with(['studentPersonalInfo'])->find($user->id);
        $enrollmentStatus = $this->getEnrollmentStatus($student);

        $studentInfo = $student?->studentPersonalInfo;
        $activeSchoolYear = $enrollmentStatus['schoolYear'] ?? null;

        $currentEnrollment = null;
        $schedule = [];

        if ($studentInfo) {
            $enrollmentQuery = Enrollment::with([
                'schoolYear',
                'semester',
                'assignedSection.strand',
                'assignedSection.adviser',
                'assignedStrand',
                'creditedSubjects.subject',
            ])
            ->where('student_personal_info_id', $studentInfo->id)
            ->where('status', Enrollment::STATUS_ENROLLED)
            ->orderByDesc('processed_at')
            ->orderByDesc('submitted_at');

            if ($activeSchoolYear) {
                // Get active semester if available
                $activeSemester = $activeSchoolYear->semesters()->where('is_active', true)->first();
                
                $enrollmentsForYear = (clone $enrollmentQuery)
                    ->where('school_year_id', $activeSchoolYear->id)
                    ->get();

                // Priority 1: Try to find enrollment for active semester (STRICT - only show if enrolled for current semester)
                if ($activeSemester) {
                    $currentEnrollment = $enrollmentsForYear->firstWhere('semester_id', $activeSemester->id);
                } else {
                    // Priority 2: No active semester defined, fall back to any enrolled enrollment in this school year
                    $currentEnrollment = $enrollmentsForYear->firstWhere('status', 'enrolled')
                        ?? $enrollmentsForYear->first();
                }
            } else {
                // Priority 3: No active school year, fall back to latest overall enrollment
                $currentEnrollment = $enrollmentQuery->first();
            }

            if ($currentEnrollment) {
                $schedule = $currentEnrollment->toScheduleEntries();
                
                // Mark credited subjects in schedule (approved credits only)
                $creditedSubjectCodes = $currentEnrollment->creditedSubjects
                    ->whereNotNull('approved_by')
                    ->map(function ($credit) {
                        return $credit->subject?->Subject_code;
                    })
                    ->filter()
                    ->unique()
                    ->values()
                    ->all();
                
                // Get class IDs from schedule entries
                $classIds = collect($schedule)->pluck('id')->filter()->unique()->all();
                
                // Get classmates for each class (excluding current student)
                $classmatesByClass = [];
                if (!empty($classIds) && $studentInfo && $currentEnrollment) {
                    // Get all class details for these classes in the same school year and semester
                    $allClassDetails = \App\Models\ClassDetail::whereIn('class_id', $classIds)
                        ->whereHas('enrollment', function ($q) use ($currentEnrollment) {
                            $q->where('school_year_id', $currentEnrollment->school_year_id)
                              ->where('semester_id', $currentEnrollment->semester_id)
                              ->where('status', Enrollment::STATUS_ENROLLED);
                        })
                        ->with(['enrollment.studentPersonalInfo'])
                        ->get();
                    
                    // Group by class_id
                    $classDetailsByClass = $allClassDetails->groupBy('class_id');
                    
                    // Process each class
                    foreach ($classIds as $classId) {
                        $classDetails = $classDetailsByClass->get($classId, collect());
                        
                        $classmates = $classDetails
                            ->map(function ($detail) use ($studentInfo) {
                                $enrollment = $detail->enrollment;
                                $classmateInfo = $enrollment?->studentPersonalInfo;
                                
                                // Skip current student
                                if ($classmateInfo && $classmateInfo->id === $studentInfo->id) {
                                    return null;
                                }
                                
                                if (!$classmateInfo) {
                                    return null;
                                }
                                
                                return [
                                    'id' => $classmateInfo->id,
                                    'name' => $classmateInfo->full_name ?? trim(($classmateInfo->first_name ?? '') . ' ' . ($classmateInfo->last_name ?? '')),
                                    'lrn' => $classmateInfo->lrn,
                                ];
                            })
                            ->filter()
                            ->unique('id')
                            ->values()
                            ->all();
                        
                        $classmatesByClass[$classId] = $classmates;
                    }
                }
                
                // Add is_credited flag and classmates to schedule entries
                $schedule = collect($schedule)->map(function ($row) use ($creditedSubjectCodes, $classmatesByClass) {
                    $code = $row['subject_code'] ?? null;
                    if ($code && in_array($code, $creditedSubjectCodes)) {
                        $row['is_credited'] = true;
                    }
                    
                    // Add classmates for this class
                    $classId = $row['id'] ?? null;
                    if ($classId && isset($classmatesByClass[$classId])) {
                        $row['classmates'] = $classmatesByClass[$classId];
                        $row['classmates_count'] = count($classmatesByClass[$classId]);
                    } else {
                        $row['classmates'] = [];
                        $row['classmates_count'] = 0;
                    }
                    
                    return $row;
                })->values()->all();
            }
        }

        $currentEnrollmentSummary = null;

        if ($currentEnrollment) {
            $section = $currentEnrollment->assignedSection;
            $strand = $section?->strand ?? $currentEnrollment->assignedStrand;
            $adviser = $section?->adviser;

            $currentEnrollmentSummary = [
                'id' => $currentEnrollment->id,
                'status' => $currentEnrollment->status,
                'status_text' => $currentEnrollment->status_text,
                'school_year' => $currentEnrollment->schoolYear?->formatted,
                'semester' => $currentEnrollment->semester?->semester_type,
                'strand' => $strand?->Strand_name,
                'strand_code' => $strand?->Strand_code,
                'section' => $section?->section_name,
                'adviser' => $adviser ? trim(($adviser->FirstName ?? '') . ' ' . ($adviser->LastName ?? '')) : null,
                'processed_at' => optional($currentEnrollment->processed_at)->toDateTimeString(),
            ];
        }

        return Inertia::render('Students/Schedule', [
            'schedule' => $schedule,
            'currentEnrollment' => $currentEnrollmentSummary,
            'enrollmentStatus' => $enrollmentStatus,
        ]);
    }

    /**
     * Display the student's grades.
     */
    public function grades()
    {
        $user = Auth::user();
        $student = User::with(['studentPersonalInfo', 'assignedStrand'])->find($user->id);
        $enrollmentStatus = $this->getEnrollmentStatus($student);

        // Get active school year and semester (same as schedule page)
        $activeSchoolYear = SchoolYear::where('is_active', true)->first();
        $activeSemester = $activeSchoolYear ? 
            Semester::where('school_year_id', $activeSchoolYear->id)
                   ->where('is_active', true)
                   ->first() : null;

        $studentInfo = $student?->studentPersonalInfo;
        $grades = collect();
        $semesterPerformance = null;

        if ($studentInfo) {
            // Get all approved grades (not filtered by active semester)
            // This allows viewing previous semesters while defaulting to active semester
            $grades = Grade::with([
                'subject',
                'classModel.faculty',
                'classModel.semester',
                'schoolYear',
            ])
                ->where('student_personal_info_id', $studentInfo->id)
                ->where('status', Grade::STATUS_APPROVED)
                ->orderBy('school_year_id', 'desc')
                ->orderByRaw("FIELD(semester, '1st', '2nd', 'Summer')")
                ->orderBy('approved_at', 'desc')
                ->get()
                ->map(function (Grade $grade) {
                    $class = $grade->classModel;
                    $faculty = $class?->faculty;
                    $isSummer = ($grade->semester === 'Summer');

                    // For summer grades, use semester_grade directly (already calculated)
                    // For regular semesters, calculate from quarters or use semester_grade
                    if ($isSummer && $grade->semester_grade !== null) {
                        $final = $grade->semester_grade;
                    } else {
                        $final = $grade->semester_grade ?? $this->averageGradeComponents([
                            $grade->first_quarter,
                            $grade->second_quarter,
                            $grade->third_quarter,
                            $grade->fourth_quarter,
                        ]);
                    }

                    $passed = $final !== null ? $final >= 75 : ($grade->remarks !== 'Failed');

                    return [
                        'id' => $grade->id,
                        'subject' => $grade->subject?->Subject_name ?? 'Subject',
                        'subject_code' => $grade->subject?->Subject_code,
                        'teacher' => $faculty ? trim(($faculty->FirstName ?? '') . ' ' . ($faculty->LastName ?? '')) : 'TBD',
                        'semester' => $grade->semester ?? $class?->semester?->semester_type ?? 'Semester',
                        'school_year' => $grade->schoolYear?->formatted ?? '',
                        'first_quarter' => $grade->first_quarter,
                        'second_quarter' => $grade->second_quarter,
                        'third_quarter' => $grade->third_quarter,
                        'fourth_quarter' => $grade->fourth_quarter,
                        'original_failed_grade' => $grade->original_failed_grade,
                        'summer_grade' => $grade->summer_grade,
                        'final_grade' => $final ? round($final, 2) : null,
                        'remarks' => $grade->remarks ?? ($passed ? 'Passed' : 'Failed'),
                        'status' => $passed ? 'Passed' : 'Failed',
                        'needs_summer_class' => $grade->needs_summer_class ?? false,
                        'is_prerequisite_failed' => $grade->is_prerequisite_failed ?? false,
                        'failed_prerequisites' => $grade->failed_prerequisites,
                        'notes' => $grade->notes,
                    ];
                });

            // Calculate current semester performance dynamically from grades
            $semesterPerformance = null;
            if ($activeSchoolYear && $activeSemester) {
                $semesterCode = $this->mapSemesterToCode($activeSemester->semester_type);
                $currentGrades = Grade::where('student_personal_info_id', $studentInfo->id)
                    ->where('school_year_id', $activeSchoolYear->id)
                    ->where('semester', $semesterCode)
                    ->where('status', Grade::STATUS_APPROVED)
                    ->get();
                
                if ($currentGrades->isNotEmpty()) {
                    $totalSubjects = $currentGrades->count();
                    $passedSubjects = $currentGrades->where('remarks', 'Passed')->count();
                    $failedSubjects = $currentGrades->where('remarks', 'Failed')->count();
                    $semesterAverage = $currentGrades->avg('semester_grade');
                    
                    // Get current enrollment for strand info
                    $currentEnrollment = Enrollment::where('student_personal_info_id', $studentInfo->id)
                        ->where('school_year_id', $activeSchoolYear->id)
                        ->where('status', Enrollment::STATUS_ENROLLED)
                        ->with(['assignedStrand'])
                        ->first();
                    
                    $strand = $currentEnrollment?->assignedStrand;
                    $isStem = $strand && $strand->Strand_code === 'STEM';
                    
                    $requiresSummer = false;
                    $requiresStrandChange = false;
                    $recommendedStrand = null;
                    
                    // Check for failed prerequisite subjects (for STEM: < 85, for others: < 75)
                    $failedPrerequisiteGrades = $currentGrades->filter(function ($grade) use ($isStem) {
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
                        $recommendedStrand = Strand::whereIn('Strand_code', ['TVL', 'HUMSS'])
                            ->where('Is_active', true)
                            ->first();
                        } else {
                            // No failed prerequisites, but check for failed non-prerequisites
                            $failedNonPrerequisite = $currentGrades->filter(function ($grade) {
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
                        if ($failedSubjects > 0) {
                            $requiresSummer = true;
                            $requiresStrandChange = false; // No strand transfer for other strands
                        }
                    }
                    
                    $status = 'Completed';
                    if ($semesterAverage < 75 || $failedSubjects > 0) {
                        $status = 'Failed';
                    } elseif ($requiresSummer) {
                        $status = 'Conditional';
                    }
                    
                    $semesterPerformance = [
                        'semester_average' => round($semesterAverage, 2),
                        'total_subjects' => $totalSubjects,
                        'passed_subjects' => $passedSubjects,
                        'failed_subjects' => $failedSubjects,
                        'status' => $status,
                        'requires_summer' => $requiresSummer,
                        'requires_strand_change' => $requiresStrandChange,
                        'semester' => $activeSemester->semester_type,
                        'school_year' => $activeSchoolYear->formatted,
                        'current_strand' => $strand?->Strand_name,
                        'recommended_strand' => $recommendedStrand?->Strand_name,
                    ];
                }
            }
        }

        // Group grades by semester and school year
        $groupedGrades = $grades->groupBy(function ($grade) {
            return $grade['school_year'] . ' - ' . $grade['semester'];
        })->map(function ($semesterGrades, $key) {
            return [
                'label' => $key,
                'grades' => $semesterGrades->values(),
            ];
        })->values();

        return Inertia::render('Students/Grades', [
            'grades' => $grades->values(),
            'groupedGrades' => $groupedGrades,
            'enrollmentStatus' => $enrollmentStatus,
            'semesterPerformance' => $semesterPerformance,
            'studentInfo' => $studentInfo ? [
                'name' => $studentInfo->full_name,
                'lrn' => $studentInfo->lrn,
                'failed_subjects_count' => $studentInfo->failed_subjects_count,
                'requires_strand_change' => $studentInfo->requires_strand_change,
            ] : null,
            'activeSchoolYear' => $activeSchoolYear ? [
                'id' => $activeSchoolYear->id,
                'formatted' => $activeSchoolYear->formatted,
            ] : null,
            'activeSemester' => $activeSemester ? [
                'id' => $activeSemester->id,
                'semester_type' => $activeSemester->semester_type,
            ] : null,
        ]);
    }

    /**
     * Display student profile.
     */
    public function profile()
    {
        $user = Auth::user();
        
        $student = User::with([
            'studentPersonalInfo',
            'assignedStrand',
            'studentPersonalInfo.enrollments.assignedStrand',
            'studentPersonalInfo.enrollments.assignedSection.strand',
        ])
            ->find($user->id);

        // Get active school year and semester
        $activeSchoolYear = SchoolYear::where('is_active', true)->first();
        $activeSemester = null;
        
        if ($activeSchoolYear) {
            $activeSemester = $activeSchoolYear->semesters()->where('is_active', true)->first();
        }

        // Get enrollment status (this already loads enrollment relationships)
        $enrollmentStatus = $this->getEnrollmentStatus($student);

        return Inertia::render('Students/Profile', [
            'student' => $student,
            'activeSchoolYear' => $activeSchoolYear,
            'activeSemester' => $activeSemester,
            'enrollmentStatus' => $enrollmentStatus,
        ]);
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
            'guardian_contact_number' => 'required|string|max:100',
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
        $availableSubjects = Subject::orderBy('Subject_name')
            ->when($activeSchoolYear, function ($q) use ($activeSchoolYear) {
                $q->where('school_year_id', $activeSchoolYear->id);
            })
            ->when($activeSemester, function ($q) use ($activeSemester) {
                $q->where('semester_id', $activeSemester->id);
            })
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
            
            // Transferee Information (only if student is transferee)
            'subjects_for_credit' => 'nullable|array',
            'subjects_for_credit.*' => 'exists:subjects,Id',
            
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

            $activeSemester = $activeSchoolYear->semesters()->where('is_active', true)->first();

            $existingEnrollment = Enrollment::where('student_personal_info_id', $studentInfo->id)
                ->where('school_year_id', $activeSchoolYear->id)
                ->lockForUpdate()
                ->first();

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
                $enrollment = Enrollment::create(array_merge($enrollmentData, [
                    'student_personal_info_id' => $studentInfo->id,
                    'school_year_id' => $activeSchoolYear->id,
                ]));
            }
            
            // Persist subjects for credit if transferee: create placeholder credited_subjects with null grade
            if ($isTransferee && !empty($validated['subjects_for_credit'])) {
                $subjectIds = array_unique(array_map('intval', $validated['subjects_for_credit']));
                
                foreach ($subjectIds as $subjectId) {
                    // Create if not exists
                    \App\Models\CreditedSubject::firstOrCreate(
                        [
                            'enrollment_id' => $enrollment->id,
                            'subject_id' => $subjectId,
                        ],
                        [
                            'student_personal_info_id' => $studentInfo->id,
                            'previous_school' => $studentInfo->previous_school ?? $studentInfo->last_school_attended ?? null,
                            'credited_grade' => null,
                            'remarks' => null,
                            'credited_by' => null,
                            'credited_at' => null,
                        ]
                    );
                }
            }

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

