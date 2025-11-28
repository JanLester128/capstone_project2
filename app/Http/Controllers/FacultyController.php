<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Section;
use App\Models\ClassModel;
use App\Models\Subject;
use App\Models\SchoolYear;
use App\Models\Semester;
use App\Models\Enrollment;
use App\Models\ClassDetail;
use App\Models\Strand;
use App\Models\Grade;
use App\Models\StudentPersonalInfo;
use App\Services\GradeCalculationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf as PDF;

class FacultyController extends Controller
{
    /**
     * Get active school year and semester for filtering faculty data.
     * Also provides access to all semesters for historical data access.
     */
    private function getActiveFilters()
    {
        $activeSchoolYear = SchoolYear::where('is_active', true)->first();
        $activeSemester = null;
        $allSemesters = collect();
        
        if ($activeSchoolYear) {
            $activeSemester = Semester::where('school_year_id', $activeSchoolYear->id)
                ->where('is_active', true)
                ->first();
                
            // Get all semesters for this school year (for historical access)
            $allSemesters = Semester::where('school_year_id', $activeSchoolYear->id)
                ->orderBy('semester_type')
                ->get();
        }
        
        return [
            'activeSchoolYear' => $activeSchoolYear,
            'activeSemester' => $activeSemester,
            'allSemesters' => $allSemesters
        ];
    }


    /**
     * Get data for a specific semester (allows access to previous semester data).
     * This demonstrates how previous semester data remains accessible.
     */
    public function getSemesterData(Request $request)
    {
        $user = Auth::user();
        $semesterId = $request->input('semester_id');
        
        if (!$semesterId) {
            return response()->json(['error' => 'Semester ID required'], 400);
        }
        
        $semester = Semester::find($semesterId);
        if (!$semester) {
            return response()->json(['error' => 'Semester not found'], 404);
        }
        
        // Get faculty's classes for the specific semester
        $classes = ClassModel::with(['section', 'subject', 'semester', 'schoolYear'])
            ->where('faculty_id', $user->id)
            ->where('school_year_id', $semester->school_year_id)
            ->where('Semester_id', $semester->id)
            ->where('is_active', true)
            ->get();
            
        // Get faculty's advised sections for the specific semester
        $sections = Section::with(['strand', 'schoolYear', 'semester'])
            ->where('adviser_id', $user->id)
            ->where('school_year_id', $semester->school_year_id)
            ->where('semester_id', $semester->id)
            ->get();
        
        return response()->json([
            'semester' => $semester,
            'classes' => $classes,
            'sections' => $sections,
            'message' => "Data for {$semester->semester_type} - {$semester->schoolYear->School_year_start}-{$semester->schoolYear->School_year_end}"
        ]);
    }

    /**
     * Display the faculty dashboard.
     * Only shows data from active school year and active semester.
     */
    public function index()
    {
        $user = Auth::user();
        $filters = $this->getActiveFilters();
        
        // Load faculty's classes and advised sections
        $faculty = User::with([
            'classes.section', 
            'classes.subject', 
            'classes.semester',
            'advisedSections.strand',
            'advisedSections.schoolYear'
        ])->find($user->id);

        // Get active classes filtered by active school year and semester
        $classesQuery = ClassModel::with(['section', 'subject', 'semester', 'schoolYear'])
            ->where('faculty_id', $user->id)
            ->where('is_active', true);
            
        // Filter by active school year
        if ($filters['activeSchoolYear']) {
            $classesQuery->where('school_year_id', $filters['activeSchoolYear']->id);
        }
        
        // Filter by active semester
        if ($filters['activeSemester']) {
            $classesQuery->where('Semester_id', $filters['activeSemester']->id);
        }
        
        $classes = $classesQuery->get();
        
        // Get class IDs for analytics
        $classIds = $classes->pluck('Id')->toArray();
        
        // Get analytics data
        $analytics = $this->getFacultyAnalytics($user->id, $classIds, $filters);
        
        $classes = $classes->map(function ($class) use ($analytics) {
            $classId = $class->Id;
            $studentCount = $analytics['students_per_class'][$classId] ?? 0;
            $pendingGrades = $analytics['pending_grades_per_class'][$classId] ?? 0;
            
            return [
                'id' => $class->Id,
                'subject_name' => $class->subject->Subject_name ?? 'Unknown Subject',
                'section_name' => $class->section->section_name ?? 'Unknown Section',
                'time_schedule' => $class->start_time && $class->end_time 
                    ? date('g:i A', strtotime($class->start_time)) . ' - ' . date('g:i A', strtotime($class->end_time))
                    : 'Time TBD',
                'has_class_today' => $this->hasClassToday($class),
                'status' => $this->getClassStatus($class),
                'pending_grades' => $pendingGrades,
                'student_count' => $studentCount,
            ];
        });

        // Get all students from faculty's classes
        $students = collect();
        foreach ($classes as $class) {
            // This would typically come from a students table or enrollment system
            // For now, we'll use a placeholder count
        }

        // Recent activities (placeholder data)
        $recentActivities = [
            [
                'title' => 'Grades Updated',
                'description' => 'Updated grades for Mathematics - Grade 11 STEM',
                'time' => '2 hours ago'
            ],
            [
                'title' => 'Attendance Recorded',
                'description' => 'Recorded attendance for English - Grade 12 ABM',
                'time' => '1 day ago'
            ]
        ];

        return Inertia::render('Faculty/Dashboard', [
            'faculty' => $faculty,
            'classes' => $classes,
            'students' => [], // Placeholder
            'recentActivities' => $recentActivities,
            'activeSchoolYear' => $filters['activeSchoolYear'],
            'activeSemester' => $filters['activeSemester'],
            'allSemesters' => $filters['allSemesters'], // For historical access
            'user' => $user, // Pass user data for sidebar
            'analytics' => $analytics,
        ]);
    }

    /**
     * Get analytics data for faculty dashboard
     */
    private function getFacultyAnalytics($facultyId, $classIds, $filters)
    {
        if (empty($classIds)) {
            return [
                'total_students' => 0,
                'students_per_class' => [],
                'pending_grades_per_class' => [],
                'subject_distribution' => [],
                'section_distribution' => [],
                'grade_completion' => [
                    'completed' => 0,
                    'pending' => 0,
                ],
            ];
        }

        // Get total students across all classes
        $totalStudents = ClassDetail::whereIn('class_id', $classIds)
            ->distinct()
            ->count('student_id');

        // Get students per class
        $studentsPerClass = [];
        foreach ($classIds as $classId) {
            $count = ClassDetail::where('class_id', $classId)
                ->distinct()
                ->count('student_id');
            $studentsPerClass[$classId] = $count;
        }

        // Get subject distribution
        $subjectDistribution = ClassModel::whereIn('Id', $classIds)
            ->with('subject')
            ->get()
            ->groupBy(function ($class) {
                return $class->subject->Subject_name ?? 'Unknown';
            })
            ->map(function ($classes) {
                $totalStudents = 0;
                foreach ($classes as $class) {
                    $totalStudents += ClassDetail::where('class_id', $class->Id)
                        ->distinct()
                        ->count('student_id');
                }
                return $totalStudents;
            })
            ->toArray();

        // Get section distribution
        $sectionDistribution = ClassModel::whereIn('Id', $classIds)
            ->with('section')
            ->get()
            ->groupBy(function ($class) {
                return $class->section->section_name ?? 'Unknown';
            })
            ->map(function ($classes) {
                $totalStudents = 0;
                foreach ($classes as $class) {
                    $totalStudents += ClassDetail::where('class_id', $class->Id)
                        ->distinct()
                        ->count('student_id');
                }
                return $totalStudents;
            })
            ->toArray();

        // Get pending grades per class
        $pendingGradesPerClass = [];
        foreach ($classIds as $classId) {
            $class = ClassModel::find($classId);
            if (!$class || !$class->subject) {
                continue;
            }

            $studentIds = ClassDetail::where('class_id', $classId)
                ->pluck('student_id')
                ->toArray();

            if (empty($studentIds)) {
                $pendingGradesPerClass[$classId] = 0;
                continue;
            }

            // Get student personal info IDs
            $studentPersonalInfoIds = StudentPersonalInfo::whereIn('user_id', $studentIds)
                ->pluck('id')
                ->toArray();

            if (empty($studentPersonalInfoIds)) {
                $pendingGradesPerClass[$classId] = count($studentIds);
                continue;
            }

            // Count students with completed grades for this subject
            $semesterValue = $filters['activeSemester'] ? 
                ($filters['activeSemester']->semester_type === '1st Semester' ? '1st' : '2nd') : null;

            $gradesQuery = Grade::whereIn('student_personal_info_id', $studentPersonalInfoIds)
                ->where('subject_id', $class->subject->Id)
                ->when($filters['activeSchoolYear'], function ($query) use ($filters) {
                    return $query->where('school_year_id', $filters['activeSchoolYear']->id);
                })
                ->when($semesterValue, function ($query) use ($semesterValue) {
                    return $query->where('semester', $semesterValue);
                });

            // Check if grades are completed (both quarters filled)
            $gradesCount = (clone $gradesQuery)
                ->whereNotNull('first_quarter')
                ->whereNotNull('second_quarter')
                ->count();

            $totalStudentsInClass = count($studentIds);
            $pendingGradesPerClass[$classId] = max(0, $totalStudentsInClass - $gradesCount);
        }

        // Get grade completion stats
        $allStudentIds = ClassDetail::whereIn('class_id', $classIds)
            ->distinct()
            ->pluck('student_id')
            ->toArray();

        $studentPersonalInfoIds = StudentPersonalInfo::whereIn('user_id', $allStudentIds)
            ->pluck('id')
            ->toArray();

        $subjectIds = ClassModel::whereIn('Id', $classIds)
            ->pluck('subject_id')
            ->toArray();

        $semesterValue = $filters['activeSemester'] ? 
            ($filters['activeSemester']->semester_type === '1st Semester' ? '1st' : '2nd') : null;

        // Count completed grades (both quarters filled)
        $completedGrades = Grade::whereIn('student_personal_info_id', $studentPersonalInfoIds)
            ->whereIn('subject_id', $subjectIds)
            ->when($filters['activeSchoolYear'], function ($query) use ($filters) {
                return $query->where('school_year_id', $filters['activeSchoolYear']->id);
            })
            ->when($semesterValue, function ($query) use ($semesterValue) {
                return $query->where('semester', $semesterValue);
            })
            ->whereNotNull('first_quarter')
            ->whereNotNull('second_quarter')
            ->count();

        // Calculate total expected grades (students × subjects)
        $totalExpectedGrades = count($studentPersonalInfoIds) * count($subjectIds);
        $pendingGrades = max(0, $totalExpectedGrades - $completedGrades);

        return [
            'total_students' => $totalStudents,
            'students_per_class' => $studentsPerClass,
            'pending_grades_per_class' => $pendingGradesPerClass,
            'subject_distribution' => $subjectDistribution,
            'section_distribution' => $sectionDistribution,
            'grade_completion' => [
                'completed' => $completedGrades,
                'pending' => $pendingGrades,
            ],
        ];
    }

    /**
     * Check if class has session today.
     */
    private function hasClassToday($class)
    {
        if (!$class->day_of_week) {
            return false;
        }

        $today = date('N'); // 1 (Monday) to 7 (Sunday)
        $todayName = date('l'); // Full day name (Monday, Tuesday, etc.)
        
        // Map day names to numbers
        $dayMap = [
            'Monday' => 1,
            'Tuesday' => 2,
            'Wednesday' => 3,
            'Thursday' => 4,
            'Friday' => 5,
            'Saturday' => 6,
            'Sunday' => 7,
        ];
        
        $dayOfWeek = $class->day_of_week;
        
        // Handle range format (e.g., "Monday - Thursday")
        if (strpos($dayOfWeek, ' - ') !== false) {
            $parts = explode(' - ', $dayOfWeek);
            $startDay = trim($parts[0]);
            $endDay = trim($parts[1] ?? $startDay);
            
            $startNum = $dayMap[$startDay] ?? null;
            $endNum = $dayMap[$endDay] ?? null;
            
            if ($startNum && $endNum) {
                // Handle wrap-around (e.g., Friday - Monday)
                if ($startNum > $endNum) {
                    return $today >= $startNum || $today <= $endNum;
                }
                return $today >= $startNum && $today <= $endNum;
            }
        }
        
        // Handle comma-separated days (e.g., "Monday,Wednesday,Friday")
        if (strpos($dayOfWeek, ',') !== false) {
            $days = array_map('trim', explode(',', $dayOfWeek));
            foreach ($days as $day) {
                $dayNum = $dayMap[$day] ?? null;
                if ($dayNum === $today) {
                    return true;
                }
            }
            return false;
        }
        
        // Handle single day
        $dayNum = $dayMap[trim($dayOfWeek)] ?? null;
        return $dayNum === $today;
    }

    /**
     * Get current class status.
     */
    private function getClassStatus($class)
    {
        if (!$this->hasClassToday($class)) {
            return 'scheduled';
        }

        $now = date('H:i:s');
        $startTime = $class->start_time;
        $endTime = $class->endtime ?? $class->end_time; // Support both field names

        if ($startTime && $endTime) {
            // Convert to time format for comparison
            $startTimeStr = is_string($startTime) ? $startTime : $startTime->format('H:i:s');
            $endTimeStr = is_string($endTime) ? $endTime : $endTime->format('H:i:s');
            
            if ($now >= $startTimeStr && $now <= $endTimeStr) {
                return 'ongoing';
            } elseif ($now > $endTimeStr) {
                return 'completed';
            }
        }

        return 'scheduled';
    }

    /**
     * Display faculty's classes.
     * Only shows classes from active school year and active semester.
     */
    public function classes()
    {
        $user = Auth::user();
        $filters = $this->getActiveFilters();

        $classesQuery = ClassModel::with([
            'section', 
            'subject', 
            'semester', 
            'schoolYear',
            'section.enrollments' => function ($query) use ($filters) {
                $query->where('status', Enrollment::STATUS_ENROLLED)
                    ->with([
                        'studentPersonalInfo.user',
                        'studentPersonalInfo:id,user_id,lrn,first_name,middle_name,last_name,extension_name',
                    ]);
                    
                // Filter by active school year if available
                if ($filters['activeSchoolYear']) {
                    $query->where('school_year_id', $filters['activeSchoolYear']->id);
                }
                
                // Filter by active semester if available
                if ($filters['activeSemester']) {
                    $query->where('semester_id', $filters['activeSemester']->id);
                }
            }
        ])
            ->where('faculty_id', $user->id)
            ->where('is_active', true);
            
        // Filter by active school year if available
        if ($filters['activeSchoolYear']) {
            $classesQuery->where('school_year_id', $filters['activeSchoolYear']->id);
        }
        
        // Filter by active semester if available
        if ($filters['activeSemester']) {
            $classesQuery->where('Semester_id', $filters['activeSemester']->id);
        }
        
        $classes = $classesQuery->get()
            ->map(function ($class) {
                $classArray = $class->toArray();
                
                // Ensure id is available (ClassModel uses 'Id' as primary key)
                if (!isset($classArray['id']) && isset($classArray['Id'])) {
                    $classArray['id'] = $classArray['Id'];
                }
                
                // Get students from section enrollments
                $students = $class->section?->enrollments ?? collect();
                
                $classArray['students'] = $students->map(function ($enrollment) {
                    $studentInfo = $enrollment->studentPersonalInfo;
                    $studentUser = $studentInfo?->user;
                    
                    return [
                        'id' => $enrollment->id,
                        'enrollment_id' => $enrollment->id,
                        'lrn' => $studentInfo?->lrn,
                        'name' => $studentInfo?->full_name,
                        'email' => $studentUser?->email,
                        'grade_level' => $studentInfo?->grade_level,
                    ];
                })->values();
                
                $classArray['student_count'] = $students->count();
                
                return $classArray;
            });

        return Inertia::render('Faculty/Classes', [
            'classes' => $classes,
            'activeSchoolYear' => $filters['activeSchoolYear'],
            'activeSemester' => $filters['activeSemester'],
            'allSemesters' => $filters['allSemesters'], // For historical access
            'user' => $user, // Pass user data for sidebar
        ]);
    }

    /**
     * Display the grades management workspace for faculty.
     */
    public function grades()
    {
        $user = Auth::user();
        $filters = $this->getActiveFilters();

        $classQuery = ClassModel::with([
                'section.enrollments' => function ($query) use ($filters) {
                    $query->where('status', Enrollment::STATUS_ENROLLED)
                        ->with([
                            'studentPersonalInfo' => function ($q) {
                                $q->select(
                                    'id',
                                    'user_id',
                                    'lrn',
                                    'first_name',
                                    'middle_name',
                                    'last_name',
                                    'extension_name',
                                    'grade_level'
                                );
                            },
                            'studentPersonalInfo.user:id,FirstName,MiddleName,LastName,email',
                            'studentPersonalInfo.grades' => function ($q) use ($filters) {
                                $q->where('status', Grade::STATUS_APPROVED)
                                    ->when($filters['activeSchoolYear'], fn ($query) => $query->where('school_year_id', $filters['activeSchoolYear']->id));
                            },
                        ]);
                },
                'section.strand',
                'subject',
                'semester',
                'schoolYear',
            ])
            ->where('faculty_id', $user->id)
            ->where('is_active', true)
            ->when($filters['activeSchoolYear'], fn ($query) => $query->where('school_year_id', $filters['activeSchoolYear']->id))
            ->when($filters['activeSemester'], fn ($query) => $query->where('Semester_id', $filters['activeSemester']->id))
            ->orderBy('day_of_week')
            ->orderBy('start_time');

        $classModels = $classQuery->get()
            ->unique(function ($class) {
                return $this->getClassSubjectSectionKey($class);
            })
            ->values();

        $classes = $classModels
            ->map(function (ClassModel $class) use ($filters) {
                $activeSchoolYear = $filters['activeSchoolYear'];
                $activeSemester = $filters['activeSemester'];

                $isSummer = $class->semester?->semester_type === 'Summer';
                $semesterLabel = strtolower($class->semester?->semester_type ?? '');
                $isSecondSemester = str_contains($semesterLabel, '2nd');

                return [
                    'id' => $class->Id ?? $class->id,
                    'subject' => [
                        'id' => $class->subject?->Id,
                        'name' => $class->subject?->Subject_name,
                        'code' => $class->subject?->Subject_code,
                    ],
                    'section' => [
                        'id' => $class->section?->id,
                        'name' => $class->section?->section_name ?? $class->section?->SectionName,
                        'year_level' => $class->section?->year_level,
                    ],
                    'strand' => $class->section?->strand?->Strand_code,
                    'semester' => $class->semester?->semester_type,
                    'school_year' => $class->schoolYear?->formatted,
                    'schedule' => [
                        'day' => $class->day_of_week,
                        'start_time' => $class->start_time,
                        'end_time' => $class->end_time ?? $class->endtime,
                    ],
                    'is_summer' => $isSummer,
                    'students' => $class->section?->enrollments->map(function ($enrollment) use ($class, $isSummer, $isSecondSemester) {
                        $studentInfo = $enrollment->studentPersonalInfo;
                        $studentUser = $studentInfo?->user;

                        $grade = Grade::where('class_id', $class->Id)
                            ->where('student_personal_info_id', $studentInfo?->id)
                            ->orderByDesc('updated_at')
                            ->first();

                        if (!$grade) {
                            $grade = Grade::where('is_credited', true)
                                ->where('subject_id', $class->subject_id)
                                ->where('student_personal_info_id', $studentInfo?->id)
                                ->orderByDesc('updated_at')
                                ->first();
                        }

                        $isCredited = (bool) ($grade?->is_credited);

                        $isApproved = $grade && $grade->status === Grade::STATUS_APPROVED;
                        $isLocked = $grade?->is_locked;
                        $hasRecordedScores = $grade && (
                            $grade->first_quarter !== null ||
                            $grade->second_quarter !== null ||
                            $grade->third_quarter !== null ||
                            $grade->fourth_quarter !== null ||
                            $grade->summer_grade !== null ||
                            $grade->semester_grade !== null
                        );

                        $thirdQuarter = $isSummer ? null : $grade?->third_quarter;
                        $fourthQuarter = $isSummer ? null : $grade?->fourth_quarter;

                        // Backfill credited 2nd semester grades that were stored in Q1/Q2 before sync fix
                        if ($isCredited && $isSecondSemester && !$isSummer && $grade) {
                            if ($thirdQuarter === null && $grade->first_quarter !== null) {
                                $thirdQuarter = $grade->first_quarter;
                            }
                            if ($fourthQuarter === null && $grade->second_quarter !== null) {
                                $fourthQuarter = $grade->second_quarter;
                            }
                        }

                        $displayStatus = $grade?->status ?? Grade::STATUS_DRAFT;
                        if ($isApproved && !$hasRecordedScores) {
                            $displayStatus = Grade::STATUS_DRAFT;
                        }
                        $statusDisplay = $isCredited ? 'Credited' : $displayStatus;

                        return [
                            'student_personal_info_id' => $studentInfo?->id,
                            'lrn' => $studentInfo?->lrn,
                            'name' => $studentInfo?->full_name,
                            'email' => $studentUser?->email,
                            'grade_level' => $studentInfo?->grade_level,
                            'can_edit' => $isCredited ? false : (!$grade || (!$isApproved && !$isLocked) || ($isApproved && !$hasRecordedScores)),
                            'grades' => [
                                'first_quarter' => $isSummer ? null : $grade?->first_quarter,
                                'second_quarter' => $isSummer ? null : $grade?->second_quarter,
                                'third_quarter' => $thirdQuarter,
                                'fourth_quarter' => $fourthQuarter,
                                'semester_grade' => $grade?->semester_grade,
                                'summer_grade' => $grade?->summer_grade,
                                'original_failed_grade' => $grade?->original_failed_grade,
                                'remarks' => $grade?->remarks,
                                'status' => $displayStatus,
                                'status_display' => $statusDisplay,
                                'approval_notes' => $grade?->approval_notes,
                                'is_credited' => $isCredited,
                            ],
                        ];
                    })->values() ?? collect(),
                ];
            });

        $gradeStatuses = Grade::statusOptions();

        return Inertia::render('Faculty/Grades', [
            'user' => $user,
            'classes' => $classes,
            'gradeStatuses' => $gradeStatuses,
            'activeSchoolYear' => $filters['activeSchoolYear'],
            'activeSemester' => $filters['activeSemester'],
        ]);
    }

    /**
     * Build a unique key for a class based on section and subject.
     */
    private function getClassSubjectSectionKey($class): string
    {
        $subjectId = $class->subject?->Id ?? $class->subject_id ?? 'subject';
        $sectionId = $class->section?->id ?? $class->Section_id ?? 'section';
        return $sectionId . '|' . $subjectId;
    }

    private const DAY_ORDER = [
        'monday' => 1,
        'tuesday' => 2,
        'wednesday' => 3,
        'thursday' => 4,
        'friday' => 5,
        'saturday' => 6,
        'sunday' => 7,
    ];

    private const DAY_NAME_MAP = [
        'mon' => 'Monday',
        'monday' => 'Monday',
        'tue' => 'Tuesday',
        'tues' => 'Tuesday',
        'tuesday' => 'Tuesday',
        'wed' => 'Wednesday',
        'weds' => 'Wednesday',
        'wednesday' => 'Wednesday',
        'thu' => 'Thursday',
        'thur' => 'Thursday',
        'thurs' => 'Thursday',
        'thursday' => 'Thursday',
        'fri' => 'Friday',
        'friday' => 'Friday',
        'sat' => 'Saturday',
        'saturday' => 'Saturday',
        'sun' => 'Sunday',
        'sunday' => 'Sunday',
    ];

    private function formatClassSchedules(Collection $classes): Collection
    {
        $grouped = [];

        foreach ($classes as $class) {
            $startTime = $this->normalizeTimeValue($class->start_time ?? $class->Start_time ?? null);
            $endTime = $this->normalizeTimeValue($class->end_time ?? $class->endtime ?? null);

            $keyParts = [
                $class->Section_id ?? $class->section?->id ?? 'section',
                $class->subject_id ?? $class->subject?->Id ?? 'subject',
                $startTime ?? 'start',
                $endTime ?? 'end',
                $class->Semester_id ?? $class->semester?->id ?? 'semester',
                $class->school_year_id ?? $class->schoolYear?->id ?? 'sy',
            ];

            $key = implode('|', $keyParts);

            if (!isset($grouped[$key])) {
                $grouped[$key] = [
                    'id' => $class->Id ?? $class->id,
                    'subject' => $class->subject?->Subject_name ?? 'Unnamed Subject',
                    'subject_code' => $class->subject?->Subject_code,
                    'section' => $class->section?->section_name ?? $class->section?->SectionName,
                    'strand' => $class->section?->strand?->Strand_name,
                    'strand_code' => $class->section?->strand?->Strand_code,
                    'start_time' => $startTime,
                    'end_time' => $endTime,
                    'semester' => $class->semester?->semester_type,
                    'school_year' => $class->schoolYear?->formatted,
                    'day_tokens' => [],
                ];
            }

            $grouped[$key]['day_tokens'] = array_merge(
                $grouped[$key]['day_tokens'],
                $this->extractDayTokens($class->day_of_week)
            );
        }

        return collect($grouped)->map(function (array $class) {
            $days = collect($class['day_tokens'])
                ->map(fn ($day) => $this->normalizeDayToken($day))
                ->filter()
                ->unique()
                ->values()
                ->all();

            $sortedDays = $this->sortDayTokens($days);
            $class['day_tokens'] = $sortedDays;
            $class['day_of_week'] = $this->formatDayLabel($sortedDays);

            return $class;
        });
    }

    private function summarizeClassesByDay(Collection $classes): Collection
    {
        return $classes
            ->flatMap(function ($class) {
                $days = $class['day_tokens'] ?? [];
                return empty($days) ? ['Unscheduled'] : $days;
            })
            ->groupBy(fn ($day) => $day)
            ->map(fn ($group, $day) => ['day' => $day, 'count' => $group->count()])
            ->sortByDesc('count');
    }

    private function extractDayTokens(?string $expression): array
    {
        if (!$expression) {
            return [];
        }

        $expression = trim($expression);
        if ($expression === '') {
            return [];
        }

        // Handle comma-separated values first
        if (str_contains($expression, ',')) {
            return collect(explode(',', $expression))
                ->map(fn ($part) => trim($part))
                ->filter()
                ->flatMap(fn ($part) => $this->extractDayTokens($part))
                ->values()
                ->all();
        }

        // Handle range indicators (e.g., Monday-Friday or Monday - Friday or Monday to Friday)
        if (preg_match('/\bto\b|-/i', $expression)) {
            $delimiters = [' to ', '-', ' – '];
            foreach ($delimiters as $delimiter) {
                if (stripos($expression, $delimiter) !== false) {
                    [$start, $end] = array_pad(array_map('trim', explode($delimiter, $expression)), 2, null);
                    return $this->expandDayRange($start, $end);
                }
            }
        }

        $normalized = $this->normalizeDayToken($expression);
        return $normalized ? [$normalized] : [];
    }

    private function expandDayRange(?string $start, ?string $end): array
    {
        $startDay = $this->normalizeDayToken($start);
        $endDay = $this->normalizeDayToken($end);

        if (!$startDay || !$endDay) {
            return array_filter([$startDay, $endDay]);
        }

        $startNum = self::DAY_ORDER[strtolower($startDay)] ?? null;
        $endNum = self::DAY_ORDER[strtolower($endDay)] ?? null;

        if (!$startNum || !$endNum) {
            return [$startDay, $endDay];
        }

        $days = [];
        $current = $startNum;
        while (true) {
            $days[] = array_search($current, self::DAY_ORDER, true);
            if ($current === $endNum) {
                break;
            }
            $current = $current === 7 ? 1 : $current + 1;
        }

        return collect($days)
            ->map(fn ($key) => $this->normalizeDayToken($key))
            ->filter()
            ->values()
            ->all();
    }

    private function normalizeDayToken(?string $day): ?string
    {
        if (!$day) {
            return null;
        }

        $key = strtolower(trim($day));
        return self::DAY_NAME_MAP[$key] ?? null;
    }

    private function sortDayTokens(array $days): array
    {
        return collect($days)
            ->unique()
            ->sortBy(fn ($day) => self::DAY_ORDER[strtolower($day)] ?? 999)
            ->values()
            ->all();
    }

    private function formatDayLabel(array $days): string
    {
        if (empty($days)) {
            return 'Unscheduled';
        }

        $ordered = $this->sortDayTokens($days);
        $segments = [];
        $rangeStart = $ordered[0];
        $prevDay = $rangeStart;

        $flushRange = function () use (&$segments, &$rangeStart, &$prevDay) {
            $startNum = self::DAY_ORDER[strtolower($rangeStart)] ?? null;
            $endNum = self::DAY_ORDER[strtolower($prevDay)] ?? null;

            if ($startNum !== null && $endNum !== null && $endNum > $startNum) {
                $segments[] = $rangeStart . '-' . $prevDay;
            } else {
                $segments[] = $rangeStart;
            }
        };

        for ($i = 1, $len = count($ordered); $i < $len; $i++) {
            $current = $ordered[$i];
            $prevNum = self::DAY_ORDER[strtolower($prevDay)] ?? null;
            $currentNum = self::DAY_ORDER[strtolower($current)] ?? null;

            if ($prevNum !== null && $currentNum === $prevNum + 1) {
                $prevDay = $current;
                continue;
            }

            $flushRange();
            $rangeStart = $current;
            $prevDay = $current;
        }

        $flushRange();

        return implode(', ', $segments);
    }

    private function normalizeTimeValue($value): ?string
    {
        if (!$value) {
            return null;
        }

        if ($value instanceof Carbon) {
            return $value->format('H:i');
        }

        $string = trim((string) $value);
        if ($string === '') {
            return null;
        }

        return substr($string, 0, 5);
    }

    /**
     * Display faculty's schedule.
     * Only shows schedule from active school year and active semester.
     */
    public function schedule()
    {
        $user = Auth::user();
        $filters = $this->getActiveFilters();
        
        $classesQuery = ClassModel::with(['section', 'subject', 'semester'])
            ->where('faculty_id', $user->id)
            ->where('is_active', true);
            
        // Filter by active school year
        if ($filters['activeSchoolYear']) {
            $classesQuery->where('school_year_id', $filters['activeSchoolYear']->id);
        }
        
        // Filter by active semester
        if ($filters['activeSemester']) {
            $classesQuery->where('Semester_id', $filters['activeSemester']->id);
        }
        
        $classes = $classesQuery->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get();

        return Inertia::render('Faculty/Schedule', [
            'classes' => $classes,
            'activeSchoolYear' => $filters['activeSchoolYear'],
            'activeSemester' => $filters['activeSemester'],
            'allSemesters' => $filters['allSemesters'], // For historical access
        ]);
    }

    /**
     * Display sections where faculty is an adviser.
     * Only shows sections from active school year and active semester.
     * When semester changes, data resets but previous semester data remains accessible.
     */
    public function sections()
    {
        $user = Auth::user();
        $filters = $this->getActiveFilters();

        $sectionsQuery = Section::with([
            'strand', 
            'schoolYear', 
            'semester', 
            'classes.subject',
            'classes.faculty',
            'enrollments' => function ($query) use ($filters) {
                $query->where('status', Enrollment::STATUS_ENROLLED)
                    ->with([
                        'studentPersonalInfo.user',
                        'studentPersonalInfo:id,user_id,lrn,first_name,middle_name,last_name,extension_name',
                        'assignedStrand',
                    ]);
                    
                // Filter by active school year if available
                if ($filters['activeSchoolYear']) {
                    $query->where('school_year_id', $filters['activeSchoolYear']->id);
                }
                
                // Filter by active semester if available
                if ($filters['activeSemester']) {
                    $query->where('semester_id', $filters['activeSemester']->id);
                }
            }
        ])
            ->where('adviser_id', $user->id);
            
        // Filter by active school year if available
        if ($filters['activeSchoolYear']) {
            $sectionsQuery->where('school_year_id', $filters['activeSchoolYear']->id);
        }
        
        // Filter by active semester if available
        if ($filters['activeSemester']) {
            $sectionsQuery->where('semester_id', $filters['activeSemester']->id);
        }
        
        $sections = $sectionsQuery->get()
            ->map(function ($section) {
                $sectionArray = $section->toArray();
                
                $sectionArray['classes'] = $section->classes
                    ->unique(function ($class) {
                        return $this->getClassSubjectSectionKey($class);
                    })
                    ->values()
                    ->map(function ($class) {
                        return $class->toArray();
                    });
                
                // Transform enrollments to include student data
                $sectionArray['students'] = $section->enrollments->map(function ($enrollment) {
                    $studentInfo = $enrollment->studentPersonalInfo;
                    $studentUser = $studentInfo?->user;
                    
                    return [
                        'id' => $enrollment->id,
                        'enrollment_id' => $enrollment->id,
                        'lrn' => $studentInfo?->lrn,
                        'name' => $studentInfo?->full_name,
                        'email' => $studentUser?->email,
                        'grade_level' => $studentInfo?->grade_level,
                        'strand' => $enrollment->assignedStrand ? [
                            'code' => $enrollment->assignedStrand->Strand_code,
                            'name' => $enrollment->assignedStrand->Strand_name,
                        ] : null,
                        'status' => $enrollment->status,
                    ];
                })->values();
                
                return $sectionArray;
            });

        return Inertia::render('Faculty/Sections', [
            'sections' => $sections,
            'activeSchoolYear' => $filters['activeSchoolYear'],
            'activeSemester' => $filters['activeSemester'],
            'allSemesters' => $filters['allSemesters'], // For historical access
            'user' => $user, // Pass user data for sidebar
        ]);
    }

    /**
     * Simple reporting view for faculty schedule/advisory summaries.
     */
    public function reports()
    {
        $user = Auth::user();
        $filters = $this->getActiveFilters();

        $classQuery = ClassModel::with([
            'section.strand',
            'subject',
            'semester',
            'schoolYear',
        ])
            ->where('faculty_id', $user->id)
            ->where('is_active', true)
            ->when($filters['activeSchoolYear'], fn ($query) => $query->where('school_year_id', $filters['activeSchoolYear']->id))
            ->when($filters['activeSemester'], fn ($query) => $query->where('Semester_id', $filters['activeSemester']->id));

        $classModels = $classQuery->get();
        $classCollection = $this->formatClassSchedules($classModels);
        $classes = $classCollection->values()->all();

        $sectionQuery = Section::with([
            'strand',
            'schoolYear',
            'semester',
            'classes.subject',
            'enrollments.studentPersonalInfo',
        ])
            ->where('adviser_id', $user->id)
            ->when($filters['activeSchoolYear'], fn ($query) => $query->where('school_year_id', $filters['activeSchoolYear']->id))
            ->when($filters['activeSemester'], fn ($query) => $query->where('semester_id', $filters['activeSemester']->id));

        $sectionModels = $sectionQuery->get();

        $sections = $sectionModels->map(function ($section) {
            $uniqueSubjects = $section->classes
                ->filter(fn ($class) => $class->subject)
                ->unique(function ($class) {
                    return $class->subject?->Id
                        ?? $class->subject_id
                        ?? $class->subject?->Subject_code
                        ?? $class->subject?->Subject_name
                        ?? $class->Id;
                })
                ->map(fn ($class) => $class->subject?->Subject_name ?? 'Unnamed Subject')
                ->values();

            return [
                'id' => $section->id,
                'name' => $section->section_name ?? $section->SectionName,
                'strand' => $section->strand?->Strand_name,
                'school_year' => $section->schoolYear?->formatted,
                'semester' => $section->semester?->semester_type,
                'student_count' => $section->enrollments->count(),
                'students' => $section->enrollments->map(fn ($enrollment) => $enrollment->studentPersonalInfo?->full_name)->filter()->values(),
                'subjects' => $uniqueSubjects,
            ];
        });

        $classesByDay = $this->summarizeClassesByDay($classCollection)->values()->all();

        $advisoryStudentTotal = $sectionModels->sum(fn ($section) => $section->enrollments->count());

        $reportAnalytics = [
            'total_classes' => $classCollection->count(),
            'total_sections' => $sectionModels->count(),
            'total_advisee_students' => $advisoryStudentTotal,
            'unique_strands' => $classCollection->pluck('strand_code')->filter()->unique()->count(),
            'classes_by_day' => $classesByDay,
        ];

        return Inertia::render('Faculty/Reports', [
            'classes' => $classes,
            'sections' => $sections,
            'activeSchoolYear' => $filters['activeSchoolYear'],
            'activeSemester' => $filters['activeSemester'],
            'allSemesters' => $filters['allSemesters'],
            'user' => $user,
            'analytics' => $reportAnalytics,
        ]);
    }

    /**
     * Display a specific section.
     * Ensures section belongs to active school year and semester.
     */
    public function showSection(Section $section)
    {
        $user = Auth::user();
        $filters = $this->getActiveFilters();
        $displaySemester = $filters['activeSemester'];
        $fallbackNotice = null;
        
        // Check if user is the adviser of this section
        if ($section->adviser_id !== $user->id) {
            abort(403, 'Unauthorized action.');
        }
        
        // Check if section belongs to active school year
        if ($filters['activeSchoolYear'] && $section->school_year_id !== $filters['activeSchoolYear']->id) {
            abort(404, 'Section not found in active school year.');
        }
        
        // Check if section belongs to active semester
        if ($filters['activeSemester'] && $section->semester_id !== $filters['activeSemester']->id) {
            abort(404, 'Section not found in active semester.');
        }

        $section->load([
            'strand', 
            'schoolYear', 
            'semester', 
            'classes.subject', 
            'classes.faculty',
            'enrollments' => function ($query) use ($filters) {
                $query->where('status', Enrollment::STATUS_ENROLLED)
                    ->with([
                        'studentPersonalInfo.user',
                        'studentPersonalInfo:id,user_id,lrn,first_name,middle_name,last_name,extension_name,grade_level',
                        'assignedStrand',
                    ]);
                    
                // Filter by active school year
                if ($filters['activeSchoolYear']) {
                    $query->where('school_year_id', $filters['activeSchoolYear']->id);
                }
                
                // Filter by active semester
                if ($filters['activeSemester']) {
                    $query->where('semester_id', $filters['activeSemester']->id);
                }
            }
        ]);

        // Transform section data for frontend
        $sectionData = $section->toArray();
        $sectionData['classes'] = $section->classes
            ->unique(function ($class) {
                return $this->getClassSubjectSectionKey($class);
            })
            ->values()
            ->map(function ($class) {
                return $class->toArray();
            });
        $sectionData['students'] = $section->enrollments->map(function ($enrollment) {
            $studentInfo = $enrollment->studentPersonalInfo;
            $studentUser = $studentInfo?->user;
            
            return [
                'id' => $enrollment->id,
                'enrollment_id' => $enrollment->id,
                'lrn' => $studentInfo?->lrn,
                'name' => $studentInfo?->full_name,
                'email' => $studentUser?->email,
                'grade_level' => $studentInfo?->grade_level,
                'strand' => $enrollment->assignedStrand ? [
                    'id' => $enrollment->assignedStrand->id,
                    'code' => $enrollment->assignedStrand->Strand_code,
                    'name' => $enrollment->assignedStrand->Strand_name,
                ] : null,
                'status' => $enrollment->status,
            ];
        })->values();

        return Inertia::render('Faculty/SectionDetail', [
            'section' => $sectionData,
            'activeSchoolYear' => $filters['activeSchoolYear'],
            'activeSemester' => $filters['activeSemester'],
            'allSemesters' => $filters['allSemesters'],
            'user' => $user,
        ]);
    }

    /**
     * Display a specific class with enrolled students.
     */
    public function showClass(ClassModel $class)
    {
        $user = Auth::user();
        $filters = $this->getActiveFilters();
        
        // Check if user is the faculty assigned to this class
        if ($class->faculty_id !== $user->id) {
            abort(403, 'Unauthorized action.');
        }
        
        // Check if class belongs to active school year
        if ($filters['activeSchoolYear'] && $class->school_year_id !== $filters['activeSchoolYear']->id) {
            abort(404, 'Class not found in active school year.');
        }
        
        // Check if class belongs to active semester
        if ($filters['activeSemester'] && $class->Semester_id !== $filters['activeSemester']->id) {
            abort(404, 'Class not found in active semester.');
        }

        $class->load([
            'section.strand',
            'section.schoolYear',
            'section.semester',
            'subject',
            'semester',
            'schoolYear',
            'faculty',
            'section.enrollments' => function ($query) use ($filters) {
                $query->where('status', Enrollment::STATUS_ENROLLED)
                    ->with([
                        'studentPersonalInfo.user',
                        'studentPersonalInfo:id,user_id,lrn,first_name,middle_name,last_name,extension_name,grade_level',
                        'assignedStrand',
                    ]);
                    
                // Filter by active school year
                if ($filters['activeSchoolYear']) {
                    $query->where('school_year_id', $filters['activeSchoolYear']->id);
                }
                
                // Filter by active semester
                if ($filters['activeSemester']) {
                    $query->where('semester_id', $filters['activeSemester']->id);
                }
            }
        ]);

        // Transform class data for frontend
        $classData = $class->toArray();
        
        // Ensure id is available (ClassModel uses 'Id' as primary key)
        if (!isset($classData['id']) && isset($classData['Id'])) {
            $classData['id'] = $classData['Id'];
        }
        
        // Get students from section enrollments
        $students = $class->section?->enrollments ?? collect();
        
        $classData['students'] = $students->map(function ($enrollment) {
            $studentInfo = $enrollment->studentPersonalInfo;
            $studentUser = $studentInfo?->user;
            
            return [
                'id' => $enrollment->id,
                'enrollment_id' => $enrollment->id,
                'lrn' => $studentInfo?->lrn,
                'name' => $studentInfo?->full_name,
                'email' => $studentUser?->email,
                'grade_level' => $studentInfo?->grade_level,
                'strand' => $enrollment->assignedStrand ? [
                    'id' => $enrollment->assignedStrand->id,
                    'code' => $enrollment->assignedStrand->Strand_code,
                    'name' => $enrollment->assignedStrand->Strand_name,
                ] : null,
            ];
        })->values();
        
        $classData['student_count'] = $students->count();
        
        // Format time for display
        $classData['time_display'] = $class->start_time && $class->end_time
            ? date('g:i A', strtotime($class->start_time)) . ' - ' . date('g:i A', strtotime($class->end_time))
            : 'Time TBD';
        
        // Format day of week
        $days = [
            'Monday' => 'Monday',
            'Tuesday' => 'Tuesday',
            'Wednesday' => 'Wednesday',
            'Thursday' => 'Thursday',
            'Friday' => 'Friday',
            'Saturday' => 'Saturday',
            'Sunday' => 'Sunday',
        ];
        $classData['day_display'] = $days[$class->day_of_week] ?? $class->day_of_week ?? 'TBD';

        return Inertia::render('Faculty/ClassDetail', [
            'class' => $classData,
            'activeSchoolYear' => $filters['activeSchoolYear'],
            'activeSemester' => $filters['activeSemester'],
            'allSemesters' => $filters['allSemesters'],
            'user' => $user,
        ]);
    }

    /**
     * Display faculty profile.
     */
    public function profile()
    {
        $user = Auth::user();
        
        $faculty = User::with(['assignedStrand'])
            ->find($user->id);

        return Inertia::render('Faculty/Profile', [
            'faculty' => $faculty,
            'user' => $user,
        ]);
    }

    /**
     * Update faculty profile.
     */
    public function updateProfile(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();
        
        $validated = $request->validate([
            'FirstName' => 'required|string|max:255',
            'MiddleName' => 'nullable|string|max:255',
            'LastName' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'profile_photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:10240',
        ]);

        // Handle profile photo upload
        if ($request->hasFile('profile_photo')) {
            // Delete old profile photo if exists
            if ($user->profile_photo && Storage::disk('public')->exists($user->profile_photo)) {
                Storage::disk('public')->delete($user->profile_photo);
            }
            
            // Store new profile photo
            $path = $request->file('profile_photo')->store('profile_photos', 'public');
            $validated['profile_photo'] = $path;
        } else {
            // Remove profile_photo from validated data if no file was uploaded
            unset($validated['profile_photo']);
        }

        $user->update($validated);

        return redirect()->route('faculty.profile')
            ->with('success', 'Profile updated successfully.');
    }


    /**
     * Display pending enrollments for coordinator.
     */
    /**
     * Enrollment hub page with card-based layout (similar to registrar enrollment page).
     */
    public function enrollmentHub()
    {
        $user = Auth::user();
        
        // Check if user is coordinator
        if (!$user->is_coordinator) {
            abort(403, 'Access denied. Coordinator privileges required.');
        }

        $activeSchoolYear = SchoolYear::where('is_active', true)->first();
        $activeSemester = $activeSchoolYear ?
            Semester::where('school_year_id', $activeSchoolYear->id)
                ->where('is_active', true)
                ->first() : null;
        $isSummerSemester = $activeSemester && str_contains(strtolower($activeSemester->semester_type ?? ''), 'summer');

        // Count pending enrollments (pre_enrolled and recommended)
        $pendingEnrollments = Enrollment::whereIn('status', [
            Enrollment::STATUS_PRE_ENROLLED,
            Enrollment::STATUS_RECOMMENDED,
        ])
        ->when($activeSchoolYear, function ($query) use ($activeSchoolYear) {
            return $query->where('school_year_id', $activeSchoolYear->id);
        })
        ->when($activeSemester, function ($query) use ($activeSemester) {
            return $query->where('semester_id', $activeSemester->id);
        })
        ->count();

        // Count students ready for re-enrollment
        $reEnrollmentsCount = 0;
        if ($activeSchoolYear && $activeSemester && !$isSummerSemester) {
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

        return Inertia::render('Faculty/EnrollmentHub', [
            'activeSchoolYear' => $activeSchoolYear ? [
                'id' => $activeSchoolYear->id,
                'label' => $activeSchoolYear->School_year_start . '-' . $activeSchoolYear->School_year_end,
            ] : null,
            'activeSemester' => $activeSemester ? [
                'id' => $activeSemester->id,
                'label' => $activeSemester->semester_type,
            ] : null,
            'links' => [
                'enrollments' => route('faculty.enrollments.manage'),
                'reEnroll' => route('faculty.re-enroll-students'),
            ],
            'counts' => [
                'pendingEnrollments' => $pendingEnrollments,
                'reEnrollments' => $reEnrollmentsCount,
            ],
            'user' => $user,
        ]);
    }

    /**
     * Display detailed enrollments page (for managing new enrollments).
     */
    public function enrollments()
    {
        $user = Auth::user();
        
        // Check if user is coordinator
        if (!$user->is_coordinator) {
            abort(403, 'Access denied. Coordinator privileges required.');
        }

        $activeSchoolYear = SchoolYear::where('is_active', true)->first();
        $activeSemester = $activeSchoolYear ?
            Semester::where('school_year_id', $activeSchoolYear->id)
                ->where('is_active', true)
                ->first() : null;

        // Get enrollments only for active semester
        $enrollmentsQuery = Enrollment::with([
            'studentPersonalInfo.user',
            'studentPersonalInfo.strandPreferences.strand',
            'schoolYear',
            'semester',
            'enrolledBy',
            'assignedStrand',
            'assignedSection.strand',
            'creditedSubjects.subject',
            'creditedSubjects.creditedBy',
            'creditedSubjects.approvedBy',
            'approvedBy',
        ]);

        // Filter by active semester if available
        if ($activeSemester && $activeSchoolYear) {
            $enrollmentsQuery->where('school_year_id', $activeSchoolYear->id)
                ->where('semester_id', $activeSemester->id);
        }

        $enrollments = $enrollmentsQuery
        ->whereIn('status', [
            Enrollment::STATUS_PRE_ENROLLED,
            Enrollment::STATUS_RECOMMENDED,
            Enrollment::STATUS_ENROLLED,
        ])
        ->orderByRaw("FIELD(status, ?, ?, ?) ASC", [
            Enrollment::STATUS_PRE_ENROLLED,
            Enrollment::STATUS_RECOMMENDED,
            Enrollment::STATUS_ENROLLED,
        ])
        ->orderByDesc('submitted_at')
        ->get()
        ->map(function (Enrollment $enrollment) {
            $reviewArray = $enrollment->toReviewArray();
            
            // Add student_personal_info_id for deduplication
            $reviewArray['student_personal_info_id'] = $enrollment->student_personal_info_id;
            
            // Check if this is a re-enrollment (student has previous enrolled records)
            $hasPreviousEnrollment = Enrollment::where('student_personal_info_id', $enrollment->student_personal_info_id)
                ->where('status', Enrollment::STATUS_ENROLLED)
                ->where('id', '!=', $enrollment->id) // Exclude current enrollment
                ->exists();
            
            $reviewArray['is_re_enrollment'] = $hasPreviousEnrollment;
            $reviewArray['has_previous_enrollment'] = $hasPreviousEnrollment;
            
            // Determine student type for display
            if ($enrollment->is_transferee) {
                $reviewArray['student_type'] = 'transferee';
                $reviewArray['student_type_label'] = 'Transferee';
                $reviewArray['student_type_color'] = 'blue';
            } elseif ($hasPreviousEnrollment) {
                $reviewArray['student_type'] = 'continuing';
                $reviewArray['student_type_label'] = 'Continuing';
                $reviewArray['student_type_color'] = 'green';
            } else {
                $reviewArray['student_type'] = 'new';
                $reviewArray['student_type_label'] = 'New Student';
                $reviewArray['student_type_color'] = 'purple';
            }
            
            // Add transferee workflow status
            if ($enrollment->is_transferee) {
                $enrollment->loadMissing('creditedSubjects');
                $reviewArray['is_transferee'] = true;
                $reviewArray['has_pending_credits'] = $enrollment->hasPendingCreditedSubjects();
                $reviewArray['all_credits_approved'] = $enrollment->allCreditedSubjectsApproved();
                $reviewArray['can_enroll'] = $enrollment->allCreditedSubjectsApproved();
                $reviewArray['can_print_cor'] = $enrollment->status === Enrollment::STATUS_ENROLLED && $enrollment->allCreditedSubjectsApproved();
                
                // Add credited subjects with approval status
                $reviewArray['credited_subjects'] = $enrollment->creditedSubjects
                    ->map(function ($c) {
                        return [
                            'id' => $c->id,
                            'subject_name' => $c->subject?->Subject_name,
                            'subject_code' => $c->subject?->Subject_code,
                            'subject_semester' => $c->subject?->Semester,
                            'quarter1' => $c->quarter1,
                            'quarter2' => $c->quarter2,
                            'previous_school' => $c->previous_school,
                            'credited_grade' => $c->credited_grade,
                            'remarks' => $c->remarks,
                            'credited_by' => $c->creditedBy ? trim(($c->creditedBy->FirstName ?? '') . ' ' . ($c->creditedBy->LastName ?? '')) : null,
                            'credited_at' => $c->credited_at ? $c->credited_at->format('M d, Y') : null,
                            'approved_by' => $c->approved_by,
                            'approved_by_name' => $c->approvedBy ? trim(($c->approvedBy->FirstName ?? '') . ' ' . ($c->approvedBy->LastName ?? '')) : null,
                            'is_approved' => $c->approved_by !== null,
                            'needs_approval' => $c->credited_by !== null && $c->approved_by === null,
                        ];
                    })
                    ->values();
            }
            
            return $reviewArray;
        });

        // Deduplicate: Keep only the most recent enrollment per student
        $enrollments = $enrollments->groupBy('student_personal_info_id')
            ->map(function ($studentEnrollments) {
                // Sort by submitted_at descending and take the first (most recent)
                return $studentEnrollments->sortByDesc('submitted_at')->first();
            })
            ->values();

        $pendingCount = $enrollments->where('status', Enrollment::STATUS_PRE_ENROLLED)->count();

        // Get active strands and sections for assignment
        $strands = Strand::where('Is_active', true)
            ->with(['sections' => function($query) {
                $query->where('is_active', true);
            }])
            ->orderBy('Strand_name')
            ->get();

        // Get active sections for assignment dropdowns
        $sections = \App\Models\Section::with('adviser:id,FirstName,MiddleName,LastName')
            ->where('is_active', true)
            ->orderBy('section_name')
            ->get(['id', 'section_name', 'strand_id', 'school_year_id', 'semester_id', 'adviser_id', 'is_active']);

        return Inertia::render('Faculty/Enrollments', [
            'enrollments' => $enrollments,
            'strands' => $strands,
            'sections' => $sections,
            'user' => $user, // Pass user data for sidebar
            'pendingCount' => $pendingCount,
        ]);
    }

    /**
     * Update enrollment status (approve/reject).
     */
    public function updateEnrollmentStatus(Request $request, $enrollmentId)
    {
        $user = Auth::user();
        
        // Check if user is coordinator
        if (!$user->is_coordinator) {
            abort(403, 'Access denied. Coordinator privileges required.');
        }

        $validated = $request->validate([
            'status' => 'required|in:enrolled,pre_enrolled,rejected',
            'assigned_strand_id' => 'nullable|exists:strands,id',
            'assigned_section_id' => 'nullable|exists:sections,id',
            'grade_level' => 'nullable|in:11,12',
        ]);

        $enrollment = Enrollment::findOrFail($enrollmentId);
        
        $currentStatus = $enrollment->status;

        switch ($validated['status']) {
            case Enrollment::STATUS_ENROLLED:
            if (!$validated['assigned_strand_id'] || !$validated['assigned_section_id']) {
                return redirect()->back()->withErrors([
                        'assigned_strand_id' => 'Please select a strand before enrolling.',
                        'assigned_section_id' => 'Please select a section before enrolling.',
                ]);
            }

                $section = \App\Models\Section::find($validated['assigned_section_id']);
                if ($section && $section->strand_id !== (int) $validated['assigned_strand_id']) {
                return redirect()->back()->withErrors([
                        'assigned_section_id' => 'The selected section does not belong to the chosen strand.',
                ]);
            }

                if (!in_array($currentStatus, [Enrollment::STATUS_RECOMMENDED, Enrollment::STATUS_PRE_ENROLLED], true)) {
                    return redirect()->back()->withErrors([
                        'status' => 'Only recommended or pre-enrolled enrollments can be enrolled.',
                    ]);
        }
        
        // Coordinators cannot enroll transferees until all credited subjects are approved
        // Flow: Credit Subject FIRST → THEN Enroll → THEN Print COR
        if ($enrollment->is_transferee) {
            $enrollment->loadMissing('creditedSubjects');
            
            if ($enrollment->hasPendingCreditedSubjects()) {
                $pendingCount = $enrollment->creditedSubjects->filter(function ($credit) {
                    return $credit->credited_grade === null 
                        || $credit->quarter1 === null 
                        || $credit->quarter2 === null
                        || ($credit->credited_by !== null && $credit->approved_by === null);
                })->count();
                
                // Instead of enrolling, set to recommended and inform coordinator
                $enrollment->update([
                    'status' => Enrollment::STATUS_RECOMMENDED,
                    'assigned_strand_id' => $validated['assigned_strand_id'],
                    'assigned_section_id' => $validated['assigned_section_id'],
                    'processed_at' => now(),
                ]);
                return redirect()->back()->withErrors([
                    'status' => "Transferee has {$pendingCount} credited subject(s) pending registrar approval. Status set to 'Recommended'. Please wait for registrar to approve credited subjects before enrollment.",
                ]);
            }
            
            // Ensure all credited subjects are approved
            if (!$enrollment->allCreditedSubjectsApproved()) {
                $enrollment->update([
                    'status' => Enrollment::STATUS_RECOMMENDED,
                    'assigned_strand_id' => $validated['assigned_strand_id'],
                    'assigned_section_id' => $validated['assigned_section_id'],
                    'processed_at' => now(),
                ]);
                return redirect()->back()->withErrors([
                    'status' => 'All credited subjects must be approved by registrar before enrollment can be completed.',
                ]);
            }
        }
        
        $enrollment->update([
                    'status' => Enrollment::STATUS_ENROLLED,
                    'assigned_strand_id' => $validated['assigned_strand_id'],
                    'assigned_section_id' => $validated['assigned_section_id'],
            'enrolled_by' => $user->id,
                    'approved_by' => $user->id,
                    'approved_at' => now(),
                    'processed_at' => now(),
                ]);

                // Update student's grade_level in student_personal_info
                if (isset($validated['grade_level']) && $enrollment->studentPersonalInfo) {
                    $enrollment->studentPersonalInfo->update([
                        'grade_level' => $validated['grade_level'],
                    ]);
                }

                $this->createClassDetailsForEnrollment($enrollment, $user->id, false);

                $message = 'Student successfully enrolled.';
                break;

            case Enrollment::STATUS_REJECTED:
                $enrollment->update([
                    'status' => Enrollment::STATUS_REJECTED,
                    'assigned_strand_id' => null,
                    'assigned_section_id' => null,
                    'processed_at' => now(),
                ]);

                $message = 'Enrollment rejected and returned for revisions.';
                break;

            case Enrollment::STATUS_PRE_ENROLLED:
                // Send back to student (pre-enrolled)
                $enrollment->update([
                    'status' => Enrollment::STATUS_PRE_ENROLLED,
                ]);

                $message = 'Enrollment returned to the student for updates.';
                break;

            default:
                $message = 'Enrollment status updated.';
                break;
        }

        return redirect()->back()->with('success', $message);
    }

    /**
     * Coordinator view of credited subjects (submits for registrar approval).
     */
    public function creditedSubjects()
    {
        $user = \Illuminate\Support\Facades\Auth::user();
        $activeSchoolYear = \App\Models\SchoolYear::where('is_active', true)->first();
        $activeSemester = $activeSchoolYear ?
            \App\Models\Semester::where('school_year_id', $activeSchoolYear->id)
                ->where('is_active', true)
                ->first() : null;

        $transfereeEnrollments = \App\Models\Enrollment::with([
            'studentPersonalInfo.user',
            'creditedSubjects.subject',
            'assignedStrand',
            'schoolYear',
            'semester'
        ])
            ->where('is_transferee', true)
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($enrollment) {
                $studentInfo = $enrollment->studentPersonalInfo;
                $studentUser = $studentInfo?->user;
                
                return [
                    'id' => $enrollment->id,
                    'student' => [
                        'name' => $studentInfo?->full_name,
                        'lrn' => $studentInfo?->lrn,
                        'email' => $studentUser?->email,
                    ],
                    'previous_school' => $enrollment->studentPersonalInfo->last_school_attended ?? optional($enrollment->creditedSubjects->first())->previous_school,
                    'assigned_strand' => [
                        'id' => $enrollment->assignedStrand?->id,
                        'code' => $enrollment->assignedStrand?->Strand_code,
                        'name' => $enrollment->assignedStrand?->Strand_name,
                    ],
                    'school_year' => $enrollment->schoolYear?->formatted,
                    'semester' => $enrollment->semester?->semester_type,
                    'status' => $enrollment->status,
                    'credited_subjects' => $enrollment->creditedSubjects->map(function ($credited) {
                        return [
                            'id' => $credited->id,
                            'subject_name' => $credited->subject?->Subject_name,
                            'subject_code' => $credited->subject?->Subject_code,
                            'subject_semester' => $credited->subject?->Semester,
                            'previous_school' => $credited->previous_school,
                            'quarter1' => $credited->quarter1,
                            'quarter2' => $credited->quarter2,
                            'credited_grade' => $credited->credited_grade,
                            'remarks' => $credited->remarks,
                            // For coordinator view, this flag indicates registrar approval
                            'is_approved' => $credited->approved_by !== null,
                            // Check if submitted (credited_by is set) - prevents editing once submitted
                            'is_submitted' => $credited->credited_by !== null,
                            'approved_by_name' => $credited->approvedBy
                                ? trim(($credited->approvedBy->FirstName ?? '') . ' ' . ($credited->approvedBy->LastName ?? ''))
                                : null,
                            'credited_at' => $credited->credited_at?->format('M d, Y'),
                        ];
                    })->values(),
                ];
            });
        
        $subjects = \App\Models\Subject::with(['strand'])
            ->when($activeSchoolYear, function ($query) use ($activeSchoolYear) {
                return $query->where('school_year_id', $activeSchoolYear->id);
            })
            ->when($activeSemester, function ($query) use ($activeSemester) {
                return $query->where('semester_id', $activeSemester->id);
            })
            ->orderBy('Subject_name')
            ->get(['Id', 'Subject_name', 'Subject_code', 'strand_id', 'year_level', 'Semester', 'semester_id']);

        return \Inertia\Inertia::render('Faculty/CreditedSubjects', [
            'enrollments' => $transfereeEnrollments,
            'user' => $user,
        ]);
    }

    /**
     * Display credited subjects detail page for a specific enrollment.
     */
    public function creditedSubjectsDetail(\App\Models\Enrollment $enrollment)
    {
        $user = \Illuminate\Support\Facades\Auth::user();
        if (!$user->is_coordinator) {
            abort(403, 'Access denied. Coordinator privileges required.');
        }

        if (!$enrollment->is_transferee) {
            return redirect()->route('faculty.credited-subjects')
                ->with('error', 'Only transferee students can have credited subjects.');
        }

        $enrollment->load([
            'studentPersonalInfo.user',
            'creditedSubjects.subject',
            'creditedSubjects.creditedBy',
            'creditedSubjects.approvedBy',
            'assignedStrand',
            'schoolYear',
            'semester'
        ]);

        $studentInfo = $enrollment->studentPersonalInfo;
        $studentUser = $studentInfo?->user;
        
        $enrollmentData = [
            'id' => $enrollment->id,
            'student' => [
                'name' => $studentInfo?->full_name,
                'lrn' => $studentInfo?->lrn,
                'email' => $studentUser?->email,
            ],
            'previous_school' => $enrollment->studentPersonalInfo->last_school_attended ?? $enrollment->previous_school,
            'assigned_strand' => [
                'id' => $enrollment->assignedStrand?->id,
                'code' => $enrollment->assignedStrand?->Strand_code,
                'name' => $enrollment->assignedStrand?->Strand_name,
            ],
            'school_year' => $enrollment->schoolYear?->formatted,
            'semester' => $enrollment->semester?->semester_type,
            'status' => $enrollment->status,
            'credited_subjects' => $enrollment->creditedSubjects->map(function ($credited) {
                return [
                    'id' => $credited->id,
                    'subject_name' => $credited->subject?->Subject_name,
                    'subject_code' => $credited->subject?->Subject_code,
                    'subject_semester' => $credited->subject?->Semester,
                    'quarter1' => $credited->quarter1,
                    'quarter2' => $credited->quarter2,
                    'credited_grade' => $credited->credited_grade,
                    'remarks' => $credited->remarks,
                    'previous_school' => $credited->previous_school,
                    'credited_by' => $credited->creditedBy ? [
                        'name' => trim(($credited->creditedBy->FirstName ?? '') . ' ' . ($credited->creditedBy->LastName ?? '')),
                    ] : null,
                    'approved_by' => $credited->approvedBy ? [
                        'name' => trim(($credited->approvedBy->FirstName ?? '') . ' ' . ($credited->approvedBy->LastName ?? '')),
                    ] : null,
                    'credited_at' => $credited->credited_at ? $credited->credited_at->format('M d, Y') : null,
                ];
            })->values(),
        ];

        // Get IDs of already credited subjects for this enrollment to exclude them
        $creditedSubjectIds = $enrollment->creditedSubjects->pluck('subject_id')->toArray();

        // Get available subjects for the enrollment's strand
        $subjects = \App\Models\Subject::select('Id', 'Subject_name', 'Subject_code', 'Semester')
            ->distinct()
            ->when($enrollment->assignedStrand, function ($query) use ($enrollment) {
                return $query->where('strand_id', $enrollment->assignedStrand->id);
            })
            ->when(!empty($creditedSubjectIds), function ($query) use ($creditedSubjectIds) {
                return $query->whereNotIn('Id', $creditedSubjectIds);
            })
            ->orderBy('Subject_name')
            ->orderBy('Subject_code')
            ->get();

        // Fallback: if no subjects found for the strand, load all subjects (excluding already credited)
        if ($subjects->isEmpty()) {
            $subjects = \App\Models\Subject::select('Id', 'Subject_name', 'Subject_code', 'Semester')
                ->distinct()
                ->when(!empty($creditedSubjectIds), function ($query) use ($creditedSubjectIds) {
                    return $query->whereNotIn('Id', $creditedSubjectIds);
                })
                ->orderBy('Subject_name')
                ->orderBy('Subject_code')
                ->get();
        }

        // Remove duplicates by subject name and code (in case there are duplicate subjects in database)
        $subjects = $subjects->unique(function ($subject) {
            return strtolower(trim($subject->Subject_name)) . '|' . strtolower(trim($subject->Subject_code));
        })->values();

        return \Inertia\Inertia::render('Faculty/CreditedSubjectsDetail', [
            'enrollment' => $enrollmentData,
            'subjects' => $subjects,
            'user' => $user,
        ]);
    }

    /**
     * Coordinator creates a credited subject (auto-approved, no registrar review).
     */
    public function storeCoordinatorCredit(\Illuminate\Http\Request $request)
    {
        $user = \Illuminate\Support\Facades\Auth::user();
        if (!$user->is_coordinator) {
            abort(403);
        }

        $validated = $request->validate([
            'enrollment_id' => 'required|exists:enrollments,id',
            'subject_id' => 'required|exists:subjects,Id',
            'previous_school' => 'nullable|string|max:255',
            'quarter1' => 'nullable|numeric|min:0|max:100',
            'quarter2' => 'nullable|numeric|min:0|max:100',
        ]);

        $enrollment = \App\Models\Enrollment::with('studentPersonalInfo')->findOrFail($validated['enrollment_id']);
        if (!$enrollment->is_transferee) {
            return back()->withErrors(['error' => 'Only transferee students can have credited subjects.']);
        }

        // Auto-populate previous school from student registration data
        $previousSchool = $enrollment->studentPersonalInfo->last_school_attended ?? $validated['previous_school'] ?? null;

        // prevent duplicates
        $exists = \App\Models\CreditedSubject::where('enrollment_id', $validated['enrollment_id'])
            ->where('subject_id', $validated['subject_id'])
            ->exists();
        if ($exists) {
            return back()->withErrors(['error' => 'This subject has already been credited for this student.']);
        }

        $avg = null;
        if (($validated['quarter1'] ?? null) !== null && ($validated['quarter2'] ?? null) !== null) {
            $avg = round((floatval($validated['quarter1']) + floatval($validated['quarter2'])) / 2, 2);
        }

        $remarks = $avg !== null ? ($avg >= 75 ? 'Passed' : 'Failed') : null;

        \App\Models\CreditedSubject::create([
            'student_personal_info_id' => $enrollment->student_personal_info_id,
            'enrollment_id' => $validated['enrollment_id'],
            'subject_id' => $validated['subject_id'],
            'previous_school' => $previousSchool,
            'quarter1' => $validated['quarter1'] ?? null,
            'quarter2' => $validated['quarter2'] ?? null,
            'credited_grade' => $avg,
            'remarks' => $remarks,
            'credited_by' => $user->id,
            'approved_by' => $user->id,
            'credited_at' => now(),
        ]);

        return back()->with('success', 'Subject credited successfully.');
    }

    /**
     * Coordinator updates a credited subject (auto-approved on save).
     */
    public function updateCoordinatorCredit(\Illuminate\Http\Request $request, \App\Models\CreditedSubject $creditedSubject)
    {
        $user = \Illuminate\Support\Facades\Auth::user();
        if (!$user->is_coordinator) {
            abort(403);
        }

        $validated = $request->validate([
            'quarter1' => 'nullable|numeric|min:0|max:100',
            'quarter2' => 'nullable|numeric|min:0|max:100',
        ]);

        $avg = null;
        if (($validated['quarter1'] ?? null) !== null && ($validated['quarter2'] ?? null) !== null) {
            $avg = round((floatval($validated['quarter1']) + floatval($validated['quarter2'])) / 2, 2);
        }

        $remarks = $avg !== null ? ($avg >= 75 ? 'Passed' : 'Failed') : null;

        $creditedSubject->update([
            'quarter1' => $validated['quarter1'] ?? null,
            'quarter2' => $validated['quarter2'] ?? null,
            'credited_grade' => $avg,
            'remarks' => $remarks,
            'credited_by' => $user->id,
            'approved_by' => $user->id,
            'credited_at' => now(),
        ]);

        return back()->with('success', 'Subject updated successfully.');
    }

    /**
     * Create class details for an approved enrollment.
     * 
     * @param Enrollment $enrollment The enrollment record
     * @param int $enrolledBy User ID who processed the enrollment
     * @param bool $isReEnrollment Whether this is a re-enrollment (moving to new semester/year)
     */
    private function createClassDetailsForEnrollment($enrollment, $enrolledBy, bool $isReEnrollment = false, ?\Illuminate\Support\Collection $failedGrades = null)
    {
        // Load student personal info if not loaded
        $enrollment->loadMissing('studentPersonalInfo');
        
        // Check if this is a summer semester
        $semester = $enrollment->semester;
        $isSummerSemester = $semester && str_contains(strtolower($semester->semester_type ?? ''), 'summer');
        
        // Check if student has previous enrollments to determine if this is a re-enrollment
        // If not explicitly set, check if student has previous enrolled records
        if (!$isReEnrollment) {
            $hasPreviousEnrollment = Enrollment::where('student_personal_info_id', $enrollment->student_personal_info_id)
                ->where('id', '!=', $enrollment->id)
                ->where('status', Enrollment::STATUS_ENROLLED)
                ->exists();
            
            $isReEnrollment = $hasPreviousEnrollment;
        }
        
        // Get all active classes for the assigned section
        // Match school year and semester if available
        $query = ClassModel::where('Section_id', $enrollment->assigned_section_id)
            ->where('is_active', true);
        
        if ($enrollment->school_year_id) {
            $query->where('school_year_id', $enrollment->school_year_id);
        }
        
        if ($enrollment->semester_id) {
            $query->where('Semester_id', $enrollment->semester_id);
        }

        $classes = $query->get();
        
        // For summer semester: filter to only classes for failed subjects
        if ($isSummerSemester && $failedGrades && $failedGrades->isNotEmpty()) {
            $failedSubjectIds = $failedGrades->pluck('subject_id')->filter()->unique()->all();
            $classes = $classes->filter(function ($class) use ($failedSubjectIds) {
                return in_array($class->subject_id, $failedSubjectIds);
            });
        }

        // Create class details for each class
        foreach ($classes as $class) {
            // Load relationships to get snapshot data
            $class->loadMissing(['subject', 'section', 'faculty']);
            
            // Check prerequisites for this subject (warning only, doesn't block enrollment)
            // This is informational - actual prerequisite enforcement happens during grade calculation
            $subject = $class->subject;
            if ($subject && !empty($subject->PREREQUISITES) && $isReEnrollment) {
                // Parse prerequisites
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
                
                // Check if student has passed all prerequisites
                $missingPrerequisites = [];
                $studentInfo = $enrollment->studentPersonalInfo;
                
                foreach ($prerequisites as $prereqName) {
                    $prereqName = trim($prereqName);
                    if (empty($prereqName)) {
                        continue;
                    }
                    
                    // Find prerequisite subject
                    $prereqSubject = Subject::where('strand_id', $subject->strand_id)
                        ->where(function ($query) use ($prereqName) {
                            $query->where('Subject_name', $prereqName)
                                  ->orWhere('Subject_code', $prereqName);
                        })
                        ->first();
                    
                    if ($prereqSubject) {
                        // Check if student has passed this prerequisite
                        // For STEM: need 85+, for others: need 75+
                        $strand = $subject->strand;
                        $isStem = $strand && $strand->Strand_code === 'STEM';
                        $passingThreshold = $isStem ? 85 : 75;
                        
                        $prereqGrade = Grade::where('student_personal_info_id', $studentInfo->id)
                            ->where('subject_id', $prereqSubject->Id)
                            ->where('status', Grade::STATUS_APPROVED)
                            ->where('semester_grade', '>=', $passingThreshold)
                            ->where('remarks', '!=', 'Failed')
                            ->exists();
                        
                        if (!$prereqGrade) {
                            $missingPrerequisites[] = $prereqSubject->Subject_name ?? $prereqSubject->Subject_code;
                        }
                    }
                }
                
                // Log warning if prerequisites are missing (but don't block enrollment)
                if (!empty($missingPrerequisites)) {
                    Log::warning('Student enrolled in subject without prerequisites (Coordinator)', [
                        'student_id' => $studentInfo->id,
                        'subject_id' => $subject->Id,
                        'subject_name' => $subject->Subject_name,
                        'missing_prerequisites' => $missingPrerequisites,
                        'enrollment_id' => $enrollment->id,
                    ]);
                }
            }
            
            // Snapshot the data at enrollment time to preserve it
            $subjectName = $class->subject?->Subject_name ?? '';
            $subjectCode = $class->subject?->Subject_code ?? '';
            $facultyName = trim(($class->faculty?->FirstName ?? '') . ' ' . ($class->faculty?->LastName ?? ''));
            $sectionName = $class->section?->section_name ?? '';
            $dayOfWeek = $class->day_of_week ?? '';
            $startTime = $class->start_time;
            $endTime = $class->endtime ?? $class->end_time;
            
            // Create or update ClassDetail
            $classDetail = ClassDetail::updateOrCreate(
                [
                    'class_id' => $class->Id,
                    'student_id' => $enrollment->studentPersonalInfo->user_id,
                    'enrollment_id' => $enrollment->id,
                ],
                [
                    'enrolled_by' => $enrolledBy,
                    'is_re_enrolled' => $isReEnrollment,
                ]
            );
            
            // Create or update class record in separate normalized table
            // Only store snapshot data - enrollment_id and class_id can be derived from class_detail
            \App\Models\ClassRecord::updateOrCreate(
                [
                    'class_detail_id' => $classDetail->id,
                ],
                [
                    'subject_name' => $subjectName,
                    'subject_code' => $subjectCode,
                    'faculty_name' => $facultyName,
                    'section_name' => $sectionName,
                    'day_of_week' => $dayOfWeek,
                    'start_time' => $startTime,
                    'end_time' => $endTime,
                ]
            );
        }
    }

    /**
     * Display enrollment reports for coordinator.
     */
    public function enrollmentReports()
    {
        $user = Auth::user();
        
        // Check if user is coordinator
        if (!$user->is_coordinator) {
            abort(403, 'Access denied. Coordinator privileges required.');
        }

        // Get filter parameters
        $strandId = request('strand_id');
        $schoolYearId = request('school_year_id');
        $semesterId = request('semester_id');
        $status = request('status'); // Optional status filter

        // Get active school year and semester for defaults
        $activeSchoolYear = SchoolYear::where('is_active', true)->first();
        $activeSemester = $activeSchoolYear ? 
            Semester::where('school_year_id', $activeSchoolYear->id)
                ->where('is_active', true)
                ->first() : null;

        // Build base query with filters
        $enrollmentsQuery = Enrollment::with([
            'studentPersonalInfo.user',
            'schoolYear',
            'semester',
            'enrolledBy',
            'assignedStrand',
        ]);

        // Apply filters
        if ($strandId) {
            $enrollmentsQuery->where('assigned_strand_id', $strandId);
        }

        if ($schoolYearId) {
            $enrollmentsQuery->where('school_year_id', $schoolYearId);
        } elseif ($activeSchoolYear) {
            // Default to active school year if not specified
            $enrollmentsQuery->where('school_year_id', $activeSchoolYear->id);
        }

        if ($semesterId) {
            $enrollmentsQuery->where('semester_id', $semesterId);
        } elseif ($activeSemester) {
            // Default to active semester if not specified
            $enrollmentsQuery->where('semester_id', $activeSemester->id);
        }

        if ($status) {
            $enrollmentsQuery->where('status', $status);
        }

        // Get enrollment statistics (with filters applied)
        $stats = [
            'total' => (clone $enrollmentsQuery)->count(),
            'pre_enrolled' => (clone $enrollmentsQuery)->where('status', Enrollment::STATUS_PRE_ENROLLED)->count(),
            'recommended' => (clone $enrollmentsQuery)->where('status', Enrollment::STATUS_RECOMMENDED)->count(),
            'enrolled' => (clone $enrollmentsQuery)->where('status', Enrollment::STATUS_ENROLLED)->count(),
            'rejected' => (clone $enrollmentsQuery)->where('status', Enrollment::STATUS_REJECTED)->count(),
        ];

        // Get filtered enrollments for the reports
        $enrollments = $enrollmentsQuery
            ->orderBy('created_at', 'desc')
            ->get();

        $recentEnrollments = $enrollments->map(function ($enrollment) {
                return [
                    'id' => $enrollment->id,
                    'student_personal_info' => [
                        'user' => [
                            'FirstName' => $enrollment->studentPersonalInfo?->user?->FirstName,
                            'LastName' => $enrollment->studentPersonalInfo?->user?->LastName,
                            'email' => $enrollment->studentPersonalInfo?->user?->email,
                        ],
                    ],
                    'school_year' => $enrollment->schoolYear ? [
                        'School_year_start' => $enrollment->schoolYear->School_year_start,
                        'School_year_end' => $enrollment->schoolYear->School_year_end,
                    ] : null,
                    'semester' => $enrollment->semester ? [
                        'semester_type' => $enrollment->semester->semester_type,
                    ] : null,
                    'enrolled_by' => $enrollment->enrolledBy ? [
                        'FirstName' => $enrollment->enrolledBy->FirstName,
                        'LastName' => $enrollment->enrolledBy->LastName,
                    ] : null,
                    'status' => $enrollment->status,
                    'status_text' => ucfirst(str_replace('_', ' ', $enrollment->status)),
                    'created_at' => $enrollment->created_at,
                    'assigned_strand' => $enrollment->assignedStrand ? [
                        'id' => $enrollment->assignedStrand->id,
                        'code' => $enrollment->assignedStrand->Strand_code,
                        'name' => $enrollment->assignedStrand->Strand_name,
                    ] : null,
                ];
            });

        $totalEnrollments = max($stats['total'], 1);
        $pendingTotal = $stats['pre_enrolled'] + $stats['recommended'];

        $topStrands = $enrollments->groupBy(function ($enrollment) {
                return $enrollment->assignedStrand?->Strand_name ?? 'Unassigned';
            })
            ->map->count()
            ->sortDesc()
            ->take(3)
            ->map(function ($count, $label) use ($enrollments) {
                $code = optional($enrollments->firstWhere(fn ($item) => ($item->assignedStrand?->Strand_name ?? 'Unassigned') === $label)->assignedStrand)->Strand_code;
                return [
                    'label' => $label,
                    'code' => $code,
                    'count' => $count,
                ];
            })
            ->values();

        $submissionTrend = $enrollments->groupBy(function ($enrollment) {
                return optional($enrollment->created_at)->format('M d');
            })
            ->map->count()
            ->sortKeys()
            ->toArray();

        $submissionTrend = array_slice($submissionTrend, -7, null, true);
        $submissionTrend = collect($submissionTrend)->map(fn ($count, $label) => [
            'label' => $label,
            'count' => $count,
        ])->values();

        $coordinatorActivity = $enrollments->filter(fn ($enrollment) => $enrollment->enrolledBy)
            ->groupBy(fn ($enrollment) => $enrollment->enrolledBy->id)
            ->map(function ($group) {
                $coordinator = $group->first()->enrolledBy;
                return [
                    'name' => trim(($coordinator->FirstName ?? '') . ' ' . ($coordinator->LastName ?? '')),
                    'count' => $group->count(),
                ];
            })
            ->sortByDesc('count')
            ->take(3)
            ->values();

        $reportAnalytics = [
            'acceptance_rate' => round(($stats['enrolled'] / $totalEnrollments) * 100, 1),
            'pending_vs_approved' => [
                'pending' => $pendingTotal,
                'approved' => $stats['enrolled'],
            ],
            'top_strands' => $topStrands,
            'submission_trend' => $submissionTrend,
            'coordinator_activity' => $coordinatorActivity,
        ];

        // Get all strands for filter dropdown
        $strands = Strand::orderBy('Strand_name')->get()->map(function ($strand) {
            return [
                'id' => $strand->id,
                'code' => $strand->Strand_code,
                'name' => $strand->Strand_name,
            ];
        });

        // Get all school years for filter dropdown
        $schoolYears = SchoolYear::orderBy('School_year_start', 'desc')->get()->map(function ($sy) {
            return [
                'id' => $sy->id,
                'formatted' => $sy->formatted ?? ($sy->School_year_start . '-' . $sy->School_year_end),
            ];
        });

        // Get all semesters for filter dropdown
        $semesters = Semester::with('schoolYear')
            ->orderBy('semester_type')
            ->get()
            ->map(function ($semester) {
                return [
                    'id' => $semester->id,
                    'semester_type' => $semester->semester_type,
                    'school_year_id' => $semester->school_year_id,
                ];
            });

        return Inertia::render('Faculty/EnrollmentReports', [
            'stats' => $stats,
            'recentEnrollments' => $recentEnrollments,
            'user' => $user,
            'strands' => $strands,
            'schoolYears' => $schoolYears,
            'semesters' => $semesters,
            'activeSchoolYear' => $activeSchoolYear ? [
                'id' => $activeSchoolYear->id,
                'formatted' => $activeSchoolYear->formatted ?? ($activeSchoolYear->School_year_start . '-' . $activeSchoolYear->School_year_end),
            ] : null,
            'activeSemester' => $activeSemester ? [
                'id' => $activeSemester->id,
                'semester_type' => $activeSemester->semester_type,
            ] : null,
            'filters' => [
                'strand_id' => $strandId,
                'school_year_id' => $schoolYearId ?? $activeSchoolYear?->id,
                'semester_id' => $semesterId ?? $activeSemester?->id,
                'status' => $status,
            ],
            'analytics' => $reportAnalytics,
        ]);
    }

    /**
     * Export enrollment reports as PDF.
     */
    public function exportEnrollmentReports(Request $request)
    {
        $user = Auth::user();
        
        // Check if user is coordinator
        if (!$user->is_coordinator) {
            abort(403, 'Access denied. Coordinator privileges required.');
        }

        // Get filter parameters
        $strandId = $request->get('strand_id');
        $schoolYearId = $request->get('school_year_id');
        $semesterId = $request->get('semester_id');
        $status = $request->get('status');

        // Get active school year and semester for defaults
        $activeSchoolYear = SchoolYear::where('is_active', true)->first();
        $activeSemester = $activeSchoolYear ? 
            Semester::where('school_year_id', $activeSchoolYear->id)
                ->where('is_active', true)
                ->first() : null;

        // Build base query with filters
        $enrollmentsQuery = Enrollment::with([
            'studentPersonalInfo.user',
            'schoolYear',
            'semester',
            'enrolledBy',
            'assignedStrand',
        ]);

        // Apply filters
        if ($strandId) {
            $enrollmentsQuery->where('assigned_strand_id', $strandId);
        }

        if ($schoolYearId) {
            $enrollmentsQuery->where('school_year_id', $schoolYearId);
        } elseif ($activeSchoolYear) {
            $enrollmentsQuery->where('school_year_id', $activeSchoolYear->id);
        }

        if ($semesterId) {
            $enrollmentsQuery->where('semester_id', $semesterId);
        } elseif ($activeSemester) {
            $enrollmentsQuery->where('semester_id', $activeSemester->id);
        }

        if ($status) {
            $enrollmentsQuery->where('status', $status);
        }

        // Get enrollment statistics
        $stats = [
            'total' => (clone $enrollmentsQuery)->count(),
            'pre_enrolled' => (clone $enrollmentsQuery)->where('status', Enrollment::STATUS_PRE_ENROLLED)->count(),
            'recommended' => (clone $enrollmentsQuery)->where('status', Enrollment::STATUS_RECOMMENDED)->count(),
            'enrolled' => (clone $enrollmentsQuery)->where('status', Enrollment::STATUS_ENROLLED)->count(),
            'rejected' => (clone $enrollmentsQuery)->where('status', Enrollment::STATUS_REJECTED)->count(),
        ];

        // Get filtered enrollments
        $enrollments = $enrollmentsQuery
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($enrollment) {
                return [
                    'student_name' => $enrollment->studentPersonalInfo?->full_name ?? 'N/A',
                    'lrn' => $enrollment->studentPersonalInfo?->lrn ?? 'N/A',
                    'email' => $enrollment->studentPersonalInfo?->user?->email ?? 'N/A',
                    'strand' => $enrollment->assignedStrand?->Strand_name ?? 'N/A',
                    'strand_code' => $enrollment->assignedStrand?->Strand_code ?? 'N/A',
                    'school_year' => $enrollment->schoolYear ? 
                        ($enrollment->schoolYear->School_year_start . '-' . $enrollment->schoolYear->School_year_end) : 'N/A',
                    'semester' => $enrollment->semester?->semester_type ?? 'N/A',
                    'status' => ucfirst(str_replace('_', ' ', $enrollment->status)),
                    'processed_by' => $enrollment->enrolledBy ? 
                        ($enrollment->enrolledBy->FirstName . ' ' . $enrollment->enrolledBy->LastName) : 'Not processed',
                    'date' => $enrollment->created_at?->format('M d, Y') ?? 'N/A',
                ];
            });

        // Get filter labels for report header
        $strandName = $strandId ? Strand::find($strandId)?->Strand_name : 'All Strands';
        $schoolYearLabel = $schoolYearId ? 
            SchoolYear::find($schoolYearId)?->formatted ?? 'All School Years' : 
            ($activeSchoolYear?->formatted ?? 'All School Years');
        $semesterLabel = $semesterId ? 
            Semester::find($semesterId)?->semester_type ?? 'All Semesters' : 
            ($activeSemester?->semester_type ?? 'All Semesters');
        $statusLabel = $status ? ucfirst(str_replace('_', ' ', $status)) : 'All Statuses';

        $data = [
            'enrollments' => $enrollments,
            'stats' => $stats,
            'filters' => [
                'strand' => $strandName,
                'school_year' => $schoolYearLabel,
                'semester' => $semesterLabel,
                'status' => $statusLabel,
            ],
            'generated_at' => now()->format('F d, Y h:i A'),
            'generated_by' => $user->FirstName . ' ' . $user->LastName,
        ];

        $pdf = PDF::loadView('pdf.faculty.enrollment-reports', $data);
        $filename = 'enrollment-reports-' . now()->format('Y-m-d') . '.pdf';
        return $pdf->download($filename);
    }

    /**
     * Display students list for coordinator (semi profile access).
     */
    public function coordinatorStudents()
    {
        $user = Auth::user();
        
        // Check if user is coordinator
        if (!$user->is_coordinator) {
            abort(403, 'Access denied. Coordinator privileges required.');
        }

        $students = StudentPersonalInfo::with([
            'user',
            'latestEnrollment.assignedSection',
            'latestEnrollment.assignedStrand',
            'latestEnrollment.schoolYear',
            'latestEnrollment.semester',
        ])
        ->whereHas('enrollments', function ($query) {
            $query->whereNotNull('submitted_at');
        })
        ->whereHas('user', function ($query) {
            $query->where('is_verified', true);
        })
        ->orderBy('created_at', 'desc')
        ->get()
        ->map(function ($student) {
            $latestEnrollment = $student->latestEnrollment;
            
            // Helper function to filter out N/A values
            $filterNA = function ($value) {
                if ($value === null || $value === 'N/A' || $value === 'n/a') {
                    return '';
                }
                return $value;
            };
            
            return [
                'id' => $student->id,
                'lrn' => $filterNA($student->lrn),
                'name' => $filterNA($student->full_name),
                'email' => $filterNA($student->user?->email),
                'age' => $student->age,
                'grade_level' => $filterNA($student->grade_level),
                'strand' => $filterNA($latestEnrollment?->assignedStrand?->Strand_name ?? $latestEnrollment?->assignedSection?->strand?->Strand_name),
                'section' => $filterNA($latestEnrollment?->assignedSection?->section_name),
                'enrollment_status' => $latestEnrollment?->status ?? 'pending',
                'submitted_at' => $filterNA($latestEnrollment?->submitted_at?->format('M d, Y')),
            ];
        });

        return Inertia::render('Faculty/CoordinatorStudents', [
            'students' => $students,
            'user' => $user,
        ]);
    }

    /**
     * Show coordinator student details (semi profile: Student Info, Documents, Credited Subjects, Class Record).
     */
    public function showCoordinatorStudentDetails(StudentPersonalInfo $student)
    {
        $user = Auth::user();
        
        // Check if user is coordinator
        if (!$user->is_coordinator) {
            abort(403, 'Access denied. Coordinator privileges required.');
        }

        $student->load([
            'user',
            'strandPreferences.strand',
            'enrollments' => function ($query) {
                $query->orderBy('submitted_at', 'desc');
            },
            'enrollments.assignedSection.strand',
            'enrollments.assignedStrand',
            'enrollments.schoolYear',
            'enrollments.semester',
            'enrollments.creditedSubjects.subject',
            'enrollments.creditedSubjects.approvedBy',
            'enrollments.creditedSubjects.creditedBy',
        ]);

        $latestEnrollment = $student->latestEnrollment;

        // Get all credited subjects
        $creditedSubjects = collect();
        foreach ($student->enrollments as $enrollment) {
            foreach ($enrollment->creditedSubjects as $credit) {
                $creditedSubjects->push([
                    'id' => $credit->id,
                    'subject_name' => $credit->subject?->Subject_name,
                    'subject_code' => $credit->subject?->Subject_code,
                    'previous_school' => $credit->previous_school,
                    'quarter1' => $credit->quarter1,
                    'quarter2' => $credit->quarter2,
                    'credited_grade' => $credit->credited_grade,
                    'remarks' => $credit->remarks,
                    'credited_by' => $credit->creditedBy ? trim(($credit->creditedBy->FirstName ?? '') . ' ' . ($credit->creditedBy->LastName ?? '')) : null,
                    'approved_by' => $credit->approvedBy ? trim(($credit->approvedBy->FirstName ?? '') . ' ' . ($credit->approvedBy->LastName ?? '')) : null,
                    'credited_at' => $credit->credited_at?->format('M d, Y'),
                    'school_year' => $enrollment->schoolYear?->formatted,
                    'semester' => $enrollment->semester?->semester_type,
                ]);
            }
        }

        // Get class records (schedule entries from enrollments)
        $classRecords = collect();
        foreach ($student->enrollments as $enrollment) {
            if ($enrollment->status === Enrollment::STATUS_ENROLLED) {
                $schedule = $enrollment->toScheduleEntries();
                $gradesForEnrollment = Grade::with('subject')
                    ->where('student_personal_info_id', $student->id)
                    ->where('school_year_id', $enrollment->school_year_id)
                    ->where('semester', $this->mapSemesterToCode($enrollment->semester?->semester_type))
                    ->where('status', Grade::STATUS_APPROVED)
                    ->get()
                    ->mapWithKeys(function ($grade) {
                        $code = $grade->subject_code_snapshot ?? $grade->subject?->Subject_code;
                        return [$code => [
                            'first_quarter' => $grade->first_quarter,
                            'second_quarter' => $grade->second_quarter,
                            'third_quarter' => $grade->third_quarter,
                            'fourth_quarter' => $grade->fourth_quarter,
                            'final_grade' => $grade->semester_grade,
                            'remarks' => $grade->remarks,
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
                        $semesterCode = $this->mapSemesterToCode($semesterLabel);

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

                // Merge grades and credited data into schedule entries
                $schedule = collect($schedule)->map(function ($row) use ($gradesForEnrollment, $creditedSubjectsMap) {
                    $code = $row['subject_code'] ?? null;
                    $g = $code ? ($gradesForEnrollment[$code] ?? null) : null;
                    if ($g) {
                        $row = array_merge($row, $g);
                    }

                    $credited = $code ? ($creditedSubjectsMap[$code] ?? null) : null;
                    if ($credited) {
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
                        $row['is_credited'] = true;
                        $row['remarks'] = $credited['remarks'];
                    }

                    return $row;
                })->values()->all();

                $classRecords->push([
                    'school_year' => $enrollment->schoolYear?->formatted,
                    'semester' => $enrollment->semester?->semester_type,
                    'strand' => $enrollment->assignedStrand?->Strand_name ?? $enrollment->assignedSection?->strand?->Strand_name,
                    'section' => $enrollment->assignedSection?->section_name,
                    'schedule' => $schedule,
                ]);
            }
        }

        // Get uploaded documents/images from student_personal_info (excluding profile photo)
        $documents = [
            'psa' => $student->psa_birth_certificate_photo,
            'report-card' => $student->report_card_photo,
        ];

        // Helper function to filter out N/A values
        $filterNA = function ($value) {
            if ($value === null || $value === 'N/A' || $value === 'n/a' || (is_string($value) && strtoupper(trim($value)) === 'N/A')) {
                return '';
            }
            return $value;
        };

        return Inertia::render('Faculty/CoordinatorStudentDetails', [
            'student' => [
                'id' => $student->id,
                'lrn' => $filterNA($student->lrn),
                'full_name' => $student->full_name,
                'first_name' => $filterNA($student->first_name),
                'middle_name' => $filterNA($student->middle_name),
                'last_name' => $filterNA($student->last_name),
                'email' => $filterNA($student->user?->email),
                'age' => $student->age,
                'birthdate' => $student->birthdate?->format('Y-m-d'),
                'gender' => $student->sex,
                'address' => $student->current_address,
                'section' => $latestEnrollment?->assignedSection?->section_name,
                'strand' => $latestEnrollment?->assignedStrand?->Strand_name ?? $latestEnrollment?->assignedSection?->strand?->Strand_name,
                'grade_level' => $student->grade_level,
            ],
            'strandPreferences' => $student->strandPreferences->map(function ($pref) {
                return [
                    'id' => $pref->id,
                    'strand_name' => $pref->strand?->Strand_name,
                    'strand_code' => $pref->strand?->Strand_code,
                    'preference_order' => $pref->preference_order,
                ];
            })->sortBy('preference_order')->values(),
            'documents' => $documents,
            'creditedSubjects' => $creditedSubjects,
            'classRecords' => $classRecords,
            'user' => $user,
        ]);
    }

    /**
     * Show all enrollments for a student to select which semester COR to view (coordinator version).
     */
    public function coordinatorStudentEnrollments($studentId)
    {
        $user = Auth::user();
        
        // Check if user is coordinator
        if (!$user->is_coordinator) {
            abort(403, 'Access denied. Coordinator privileges required.');
        }

        $student = StudentPersonalInfo::with('user')->findOrFail($studentId);
        
        // Get all enrollments for this student
        $enrollments = Enrollment::with([
            'schoolYear',
            'semester',
            'assignedStrand',
            'assignedSection',
        ])
        ->where('student_personal_info_id', $studentId)
        ->orderByDesc('submitted_at')
        ->get()
        ->map(function (Enrollment $enrollment) {
            return [
                'id' => $enrollment->id,
                'school_year' => $enrollment->schoolYear ? [
                    'id' => $enrollment->schoolYear->id,
                    'label' => $enrollment->schoolYear->formatted ?? $enrollment->schoolYear->year_start . '-' . $enrollment->schoolYear->year_end,
                ] : null,
                'semester' => $enrollment->semester ? [
                    'id' => $enrollment->semester->id,
                    'label' => $enrollment->semester->semester_type ?? 'Semester ' . $enrollment->semester->id,
                ] : null,
                'strand' => $enrollment->assignedStrand ? [
                    'code' => $enrollment->assignedStrand->Strand_code,
                    'name' => $enrollment->assignedStrand->Strand_name,
                ] : null,
                'section' => $enrollment->assignedSection ? [
                    'name' => $enrollment->assignedSection->section_name,
                ] : null,
                'status' => $enrollment->status,
                'submitted_at' => $enrollment->submitted_at?->format('Y-m-d H:i:s'),
            ];
        });

        return Inertia::render('Faculty/CoordinatorStudentEnrollments', [
            'student' => [
                'id' => $student->id,
                'name' => $student->full_name ?: ($student->user->name ?? 'Unknown'),
                'email' => $student->user->email ?? '',
                'lrn' => $student->lrn ?? '',
            ],
            'enrollments' => $enrollments,
            'user' => $user,
        ]);
    }

    /**
     * Map semester type to semester code (for coordinator use).
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

    /**
     * Display re-enrollment page for coordinator.
     */
    public function reEnrollPage()
    {
        $user = Auth::user();

        if (!$user->is_coordinator) {
            abort(403, 'Access denied. Coordinator privileges required.');
        }

        $activeSchoolYear = SchoolYear::where('is_active', true)->first();
        $activeSemester = Semester::where('is_active', true)->first();
        $isSummerSemester = $activeSemester && str_contains(strtolower($activeSemester->semester_type ?? ''), 'summer');

        // Get all students who have at least one enrolled record
        $enrolledStudents = StudentPersonalInfo::with([
            'user',
            'enrollments' => function ($query) {
                $query->where('status', Enrollment::STATUS_ENROLLED)
                    ->with(['schoolYear', 'semester', 'assignedStrand', 'assignedSection'])
                    ->latest('processed_at');
            },
        ])
        ->whereHas('enrollments', function ($query) {
            $query->where('status', Enrollment::STATUS_ENROLLED);
        })
        ->get()
        ->map(function ($student) use ($isSummerSemester, $activeSemester, $activeSchoolYear) {
            $latestEnrollment = $student->enrollments->first();
            $isEnrolledInActiveSummer = false;
            if ($isSummerSemester && $activeSemester && $activeSchoolYear && $latestEnrollment) {
                $isEnrolledInActiveSummer = $latestEnrollment->school_year_id === $activeSchoolYear->id
                    && $latestEnrollment->semester_id === $activeSemester->id
                    && $latestEnrollment->status === Enrollment::STATUS_ENROLLED;
            }
            
            // Get failed grades from latest enrollment
            $failedGrades = [];
            $hasFailedPrerequisites = false;
            $needsSummerClasses = false;
            $canReEnrollToSameStrand = true;
            $warnings = [];
            $hasFailedGrades = false;
            
            if ($latestEnrollment) {
                // Get grades for the latest enrollment term
                $grades = Grade::where('student_personal_info_id', $student->id)
                    ->where('school_year_id', $latestEnrollment->school_year_id)
                    ->where('status', Grade::STATUS_APPROVED)
                    ->with('subject')
                    ->get();
                
                foreach ($grades as $grade) {
                    $subject = $grade->subject;
                    $hasPrerequisites = $subject && !empty($subject->PREREQUISITES);
                    $finalGrade = $grade->semester_grade ?? 0;
                    $passingThreshold = $hasPrerequisites && stripos($latestEnrollment->assignedStrand?->Strand_code ?? '', 'STEM') !== false ? 85 : 75;
                    $failed = ($finalGrade < $passingThreshold) || $grade->remarks === 'Failed';

                    if ($failed) {
                        $hasFailedGrades = true;
                        $isPrerequisiteSubject = $grade->is_prerequisite_failed ?? ($hasPrerequisites);
                        $failedGrades[] = [
                            'subject_name' => $grade->subject?->Subject_name ?? $grade->subject_name_snapshot,
                            'subject_code' => $grade->subject?->Subject_code ?? $grade->subject_code_snapshot,
                            'grade' => $grade->semester_grade,
                            'is_prerequisite' => $isPrerequisiteSubject,
                        ];

                        if ($isPrerequisiteSubject) {
                            $hasFailedPrerequisites = true;
                        }

                        $needsSummerClasses = true;
                    }
                }

                $isSTEM = stripos($latestEnrollment->assignedStrand?->Strand_code ?? '', 'STEM') !== false;

                if ($isSTEM) {
                    if ($needsSummerClasses) {
                        $canReEnrollToSameStrand = false;
                        if ($hasFailedPrerequisites) {
                            $warnings[] = 'STEM student failed prerequisite subject(s) (< 85). Must transfer to another strand. Summer classes are NOT available for prerequisite failures.';
                        } else {
                            $warnings[] = 'STEM student has failed non-prerequisite subject(s). Must transfer to another strand for remediation.';
                        }
                    }
                } else {
                    if ($hasFailedPrerequisites) {
                        $warnings[] = 'Student has failed prerequisite subjects. Summer classes required before re-enrollment.';
                        $needsSummerClasses = true;
                    } elseif ($needsSummerClasses) {
                        $warnings[] = 'Student has failed subjects. Summer classes required before re-enrollment.';
                    }
                }
            }
            
            if ($isSummerSemester && !$hasFailedGrades) {
                return null; // Only show students who actually need summer remediation
            }
            
            return [
                'id' => $student->id,
                'lrn' => $student->lrn,
                'user' => [
                    'name' => trim(($student->user?->FirstName ?? '') . ' ' . ($student->user?->MiddleName ?? '') . ' ' . ($student->user?->LastName ?? '')),
                    'email' => $student->user?->email,
                ],
                'latest_enrollment' => $latestEnrollment ? [
                    'id' => $latestEnrollment->id,
                    'school_year' => [
                        'id' => $latestEnrollment->schoolYear?->id,
                        'label' => ($latestEnrollment->schoolYear?->School_year_start ?? '') . '-' . ($latestEnrollment->schoolYear?->School_year_end ?? ''),
                    ],
                    'semester' => [
                        'id' => $latestEnrollment->semester?->id,
                        'label' => $latestEnrollment->semester?->semester_type ?? '',
                    ],
                    'assigned_strand_id' => $latestEnrollment->assigned_strand_id,
                    'assigned_section_id' => $latestEnrollment->assigned_section_id,
                    'assigned_strand' => [
                        'Strand_name' => $latestEnrollment->assignedStrand?->Strand_name ?? '',
                        'Strand_code' => $latestEnrollment->assignedStrand?->Strand_code ?? '',
                    ],
                    'assigned_section' => [
                        'section_name' => $latestEnrollment->assignedSection?->section_name ?? '',
                        'year_level' => $latestEnrollment->assignedSection?->year_level ?? null,
                    ],
                    'processed_at' => $latestEnrollment->processed_at,
                ] : null,
                'enrollment_count' => $student->enrollments->count(),
                'failed_grades' => $failedGrades,
                'has_failed_prerequisites' => $hasFailedPrerequisites,
                'needs_summer_classes' => $isEnrolledInActiveSummer ? false : $needsSummerClasses,
                'can_reenroll_to_same_strand' => $canReEnrollToSameStrand,
                'warnings' => $warnings,
                'is_enrolled_in_summer' => $isEnrolledInActiveSummer,
                'academic_status' => $isEnrolledInActiveSummer ? 'enrolled' : ($hasFailedPrerequisites ? 'critical' : ($needsSummerClasses ? 'warning' : 'good')),
            ];
        })
        ->filter()
        ->values();

        // Get active strands and sections for assignment
        $activeStrands = Strand::where('Is_active', true)
            ->orderBy('Strand_name')
            ->get(['id', 'Strand_code', 'Strand_name']);

        $activeSections = Section::with([
            'strand:id,Strand_code,Strand_name',
            'adviser:id,FirstName,MiddleName,LastName'
        ])
            ->where('is_active', true)
            ->when($activeSchoolYear, function ($query) use ($activeSchoolYear) {
                $query->where('school_year_id', $activeSchoolYear->id);
            })
            ->when($activeSemester, function ($query) use ($activeSemester) {
                $query->where('semester_id', $activeSemester->id);
            })
            ->get(['id', 'section_name', 'strand_id', 'school_year_id', 'semester_id', 'adviser_id', 'year_level', 'is_active']);

        return Inertia::render('Faculty/ReEnrollStudents', [
            'enrolledStudents' => $enrolledStudents,
            'activeSchoolYear' => $activeSchoolYear ? [
                'id' => $activeSchoolYear->id,
                'label' => $activeSchoolYear->School_year_start . '-' . $activeSchoolYear->School_year_end,
            ] : null,
            'activeSemester' => $activeSemester ? [
                'id' => $activeSemester->id,
                'label' => $activeSemester->semester_type,
            ] : null,
            'strands' => $activeStrands,
            'sections' => $activeSections,
            'user' => $user,
            'isSummerSemester' => $isSummerSemester,
        ]);
    }

    /**
     * Coordinator version of the enrollment workspace used during re-enrollment.
     */
    public function showCoordinatorEnrollmentPage($studentId, Request $request)
    {
        $user = Auth::user();

        if (!$user->is_coordinator) {
            abort(403, 'Access denied. Coordinator privileges required.');
        }

        $student = StudentPersonalInfo::with('user')->findOrFail($studentId);

        $latestEnrollment = Enrollment::where('student_personal_info_id', $student->id)
            ->where('status', Enrollment::STATUS_ENROLLED)
            ->with(['schoolYear', 'semester', 'assignedStrand', 'assignedSection'])
            ->latest('processed_at')
            ->first();

        $activeSchoolYear = SchoolYear::where('is_active', true)->first();
        $activeSemester = Semester::where('is_active', true)->first();
        $isSummerSemester = $activeSemester && str_contains(strtolower($activeSemester->semester_type ?? ''), 'summer');

        $currentTermEnrollment = null;
        if ($activeSchoolYear && $activeSemester) {
            $currentTermEnrollment = Enrollment::where('student_personal_info_id', $student->id)
                ->where('school_year_id', $activeSchoolYear->id)
                ->where('semester_id', $activeSemester->id)
                ->where('status', Enrollment::STATUS_ENROLLED)
                ->first();
        }

        $failedGrades = [];
        $hasFailedPrerequisites = false;
        $needsSummerClasses = false;
        $canReEnrollToSameStrand = true;
        $warnings = [];
        $isEnrolledInActiveSummer = false;

        if ($latestEnrollment) {
            $grades = Grade::where('student_personal_info_id', $student->id)
                ->where('school_year_id', $latestEnrollment->school_year_id)
                ->where('status', Grade::STATUS_APPROVED)
                ->with('subject')
                ->get();

            $isSTEM = stripos($latestEnrollment->assignedStrand?->Strand_code ?? '', 'STEM') !== false;

            foreach ($grades as $grade) {
                $subject = $grade->subject;
                $hasPrerequisites = $subject && !empty($subject->PREREQUISITES);
                $finalGrade = $grade->semester_grade ?? 0;

                $passingThreshold = ($isSTEM && $hasPrerequisites) ? 85 : 75;
                $failed = ($finalGrade < $passingThreshold) || $grade->remarks === 'Failed';

                if ($failed) {
                    $isPrerequisiteSubject = $hasPrerequisites;

                    $failedGrades[] = [
                        'subject_name' => $grade->subject?->Subject_name ?? $grade->subject_name_snapshot,
                        'subject_code' => $grade->subject?->Subject_code ?? $grade->subject_code_snapshot,
                        'grade' => $finalGrade,
                        'is_prerequisite' => $isPrerequisiteSubject,
                        'threshold' => $passingThreshold,
                    ];

                    if ($isSTEM && $isPrerequisiteSubject && $finalGrade < 85) {
                        $hasFailedPrerequisites = true;
                    }
                }
            }

            if ($isSTEM) {
                if ($hasFailedPrerequisites) {
                    $canReEnrollToSameStrand = false;
                    $warnings[] = 'STEM student failed prerequisite subject(s) (< 85). Must transfer to another strand in the new semester. Summer classes are NOT available for prerequisite failures.';
                } elseif (!empty($failedGrades)) {
                    $needsSummerClasses = true;
                    $warnings[] = 'STEM student has failed non-prerequisite subject(s) (< 75). Summer classes required before re-enrollment.';
                }
            } else {
                if (!empty($failedGrades)) {
                    $needsSummerClasses = true;
                    $warnings[] = 'Student has failed subject(s) (< 75). Summer classes required before re-enrollment.';
                }
            }

            if ($isSummerSemester && $activeSchoolYear && $activeSemester && $latestEnrollment->school_year_id === $activeSchoolYear->id && $latestEnrollment->semester_id === $activeSemester->id && $latestEnrollment->status === Enrollment::STATUS_ENROLLED) {
                $isEnrolledInActiveSummer = true;
            }
        }

        if ($isSummerSemester && empty($failedGrades)) {
            return redirect()->route('faculty.re-enroll-students')->withErrors(['error' => 'Only students with failed grades can be processed during summer semester.']);
        }

        $strands = Strand::where('Is_active', true)->get();
        $sections = Section::where('is_active', true)
            ->when($activeSchoolYear, fn ($query) => $query->where('school_year_id', $activeSchoolYear->id))
            ->when($activeSemester, fn ($query) => $query->where('semester_id', $activeSemester->id))
            ->with('strand')
            ->get();

        return Inertia::render('Faculty/EnrollStudent', [
            'student' => [
                'id' => $student->id,
                'lrn' => $student->lrn,
                'name' => trim(($student->user?->FirstName ?? '') . ' ' . ($student->user?->MiddleName ?? '') . ' ' . ($student->user?->LastName ?? '')),
                'email' => $student->user?->email,
            ],
            'currentTermEnrollment' => $currentTermEnrollment ? [
                'id' => $currentTermEnrollment->id,
            ] : null,
            'latestEnrollment' => $latestEnrollment ? [
                'id' => $latestEnrollment->id,
                'school_year' => [
                    'id' => $latestEnrollment->schoolYear?->id,
                    'label' => ($latestEnrollment->schoolYear?->School_year_start ?? '') . '-' . ($latestEnrollment->schoolYear?->School_year_end ?? ''),
                ],
                'semester' => [
                    'id' => $latestEnrollment->semester?->id,
                    'label' => $latestEnrollment->semester?->semester_type ?? '',
                ],
                'assigned_strand' => [
                    'id' => $latestEnrollment->assigned_strand_id,
                    'Strand_name' => $latestEnrollment->assignedStrand?->Strand_name ?? '',
                    'Strand_code' => $latestEnrollment->assignedStrand?->Strand_code ?? '',
                ],
                'assigned_section' => [
                    'id' => $latestEnrollment->assigned_section_id,
                    'section_name' => $latestEnrollment->assignedSection?->section_name ?? '',
                    'year_level' => $latestEnrollment->assignedSection?->year_level ?? null,
                ],
            ] : null,
            'failedGrades' => $failedGrades,
            'hasFailedPrerequisites' => $hasFailedPrerequisites,
            'needsSummerClasses' => $isEnrolledInActiveSummer ? false : $needsSummerClasses,
            'canReEnrollToSameStrand' => $canReEnrollToSameStrand,
            'warnings' => $warnings,
            'isEnrolledInActiveSummer' => $isEnrolledInActiveSummer,
            'isSummerSemester' => $isSummerSemester,
            'activeSchoolYear' => $activeSchoolYear ? [
                'id' => $activeSchoolYear->id,
                'label' => $activeSchoolYear->School_year_start . '-' . $activeSchoolYear->School_year_end,
            ] : null,
            'activeSemester' => $activeSemester ? [
                'id' => $activeSemester->id,
                'label' => $activeSemester->semester_type,
            ] : null,
            'strands' => $strands,
            'sections' => $sections,
            'user' => $user,
        ]);
    }

    /**
     * Re-enroll a student with optional strand and section assignment (coordinator version).
     */
    public function reEnrollAuto(Request $request)
    {
        $user = Auth::user();
        
        // Check if user is coordinator
        if (!$user->is_coordinator) {
            abort(403, 'Access denied. Coordinator privileges required.');
        }

        $validated = $request->validate([
            'student_info_id' => 'required|exists:student_personal_info,id',
            'school_year_id' => 'required|exists:school_year,id',
            'semester_id' => 'required|exists:semester,id',
            'assigned_strand_id' => 'nullable|exists:strands,id',
            'assigned_section_id' => 'nullable|exists:sections,id',
        ]);

        DB::beginTransaction();
        try {
            $studentInfo = StudentPersonalInfo::findOrFail($validated['student_info_id']);
            
            // Get the latest enrolled enrollment
            $latestEnrollment = Enrollment::where('student_personal_info_id', $studentInfo->id)
                ->where('status', Enrollment::STATUS_ENROLLED)
                ->with(['assignedStrand', 'assignedSection'])
                ->latest('processed_at')
                ->first();

            if (!$latestEnrollment) {
                throw new \Exception('No previous enrollment found for this student.');
            }

            $targetSemester = Semester::findOrFail($validated['semester_id']);
            $isSummerSemester = str_contains(strtolower($targetSemester->semester_type ?? ''), 'summer');

            // Check if student is already enrolled for this term
            $existingEnrollment = Enrollment::where('student_personal_info_id', $studentInfo->id)
                ->where('school_year_id', $validated['school_year_id'])
                ->where('semester_id', $validated['semester_id'])
                ->first();

            if ($existingEnrollment) {
                throw new \Exception('Student is already enrolled for this term.');
            }

            $failedGrades = null;
            if ($isSummerSemester) {
                $failedGrades = Grade::where('student_personal_info_id', $studentInfo->id)
                    ->where('school_year_id', $latestEnrollment->school_year_id)
                    ->where('status', Grade::STATUS_APPROVED)
                    ->where(function ($query) {
                        $query->where('semester_grade', '<', 75)
                              ->orWhere('remarks', 'Failed');
                    })
                    ->with('subject')
                    ->get()
                    ->filter(function ($grade) {
                        return $grade->subject_id !== null;
                    });

                if ($failedGrades->isEmpty()) {
                    throw new \Exception('Student has no failed grades. Only students with failed grades can enroll in summer semester.');
                }
            }

            // Validate the section if provided
            $assignedStrandId = $validated['assigned_strand_id'] ?? $latestEnrollment->assigned_strand_id;
            $assignedSectionId = $validated['assigned_section_id'] ?? $latestEnrollment->assigned_section_id;

            if ($assignedSectionId) {
                $section = Section::find($assignedSectionId);
                if (!$section) {
                    throw new \Exception('Selected section not found.');
                }

                if ($assignedStrandId && $section->strand_id !== (int) $assignedStrandId) {
                    throw new \Exception('The selected section does not belong to the chosen strand.');
                }

                if ($section->school_year_id !== (int) $validated['school_year_id'] ||
                    $section->semester_id !== (int) $validated['semester_id']) {
                    throw new \Exception('The selected section does not belong to the target school year/semester.');
                }

                if (!$section->is_active) {
                    throw new \Exception('The selected section is not active.');
                }
            }

            // Create new enrollment
            $newEnrollment = Enrollment::create([
                'student_personal_info_id' => $studentInfo->id,
                'school_year_id' => $validated['school_year_id'],
                'semester_id' => $validated['semester_id'],
                'assigned_strand_id' => $assignedStrandId,
                'assigned_section_id' => $assignedSectionId,
                'status' => Enrollment::STATUS_ENROLLED,
                'enrolled_by' => $user->id,
                'approved_by' => $user->id,
                'approved_at' => now(),
                'submitted_at' => now(),
                'processed_at' => now(),
                'confirmed_at' => now(),
            ]);

            if ($assignedSectionId) {
                if ($isSummerSemester && $failedGrades && $failedGrades->isNotEmpty()) {
                    $this->createClassesForFailedSubjectsCoordinator($newEnrollment, $failedGrades, $user->id);
                    $this->createClassDetailsForEnrollment($newEnrollment, $user->id, true, $failedGrades);
                } else {
                    $this->createClassDetailsForEnrollment($newEnrollment, $user->id, true);
                }
            }

            DB::commit();

            return redirect()
                ->route('faculty.re-enroll-students')
                ->with('success', 'Student re-enrolled successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Coordinator auto re-enrollment failed: ' . $e->getMessage(), [
                'student_info_id' => $validated['student_info_id'] ?? null,
                'user_id' => $user->id,
            ]);
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Bulk re-enroll multiple students (coordinator version).
     */
    public function reEnrollBulk(Request $request)
    {
        $user = Auth::user();
        
        // Check if user is coordinator
        if (!$user->is_coordinator) {
            abort(403, 'Access denied. Coordinator privileges required.');
        }

        $validated = $request->validate([
            'student_info_ids' => 'required|array',
            'student_info_ids.*' => 'exists:student_personal_info,id',
            'school_year_id' => 'required|exists:school_year,id',
            'semester_id' => 'required|exists:semester,id',
        ]);

        $successCount = 0;
        $failedCount = 0;
        $errors = [];

        foreach ($validated['student_info_ids'] as $studentInfoId) {
            DB::beginTransaction();
            try {
                $studentInfo = StudentPersonalInfo::with('user')->findOrFail($studentInfoId);

                $latestEnrollment = Enrollment::where('student_personal_info_id', $studentInfo->id)
                    ->where('status', Enrollment::STATUS_ENROLLED)
                    ->with(['assignedStrand', 'assignedSection'])
                    ->latest('processed_at')
                    ->first();

                if (!$latestEnrollment) {
                    throw new \Exception('No previous enrollment found.');
                }

                $existingEnrollment = Enrollment::where('student_personal_info_id', $studentInfo->id)
                    ->where('school_year_id', $validated['school_year_id'])
                    ->where('semester_id', $validated['semester_id'])
                    ->first();

                if ($existingEnrollment) {
                    throw new \Exception('Already enrolled for this term.');
                }

                $assignedStrandId = $latestEnrollment->assigned_strand_id;
                $assignedSectionId = $latestEnrollment->assigned_section_id;

                $section = Section::where('id', $assignedSectionId)
                    ->where('school_year_id', $validated['school_year_id'])
                    ->where('semester_id', $validated['semester_id'])
                    ->where('is_active', true)
                    ->first();

                if (!$section) {
                    throw new \Exception('Previous section not available for this term.');
                }

                $targetSemester = Semester::findOrFail($validated['semester_id']);
                $isSummerSemester = str_contains(strtolower($targetSemester->semester_type ?? ''), 'summer');

                $failedGrades = null;
                if ($isSummerSemester) {
                    $failedGrades = Grade::where('student_personal_info_id', $studentInfo->id)
                        ->where('school_year_id', $latestEnrollment->school_year_id)
                        ->where('status', Grade::STATUS_APPROVED)
                        ->where(function ($query) {
                            $query->where('semester_grade', '<', 75)
                                  ->orWhere('remarks', 'Failed');
                        })
                        ->with('subject')
                        ->get()
                        ->filter(function ($grade) {
                            return $grade->subject_id !== null;
                        });

                    if ($failedGrades->isEmpty()) {
                        throw new \Exception('Student has no failed grades. Only students with failed grades can enroll in summer semester.');
                    }

                    $isSTEM = stripos($latestEnrollment->assignedStrand?->Strand_code ?? '', 'STEM') !== false;
                    if ($isSTEM) {
                        throw new \Exception('STEM students with failed grades must be reassigned individually for summer term.');
                    }
                }

                $newEnrollment = Enrollment::create([
                    'student_personal_info_id' => $studentInfo->id,
                    'school_year_id' => $validated['school_year_id'],
                    'semester_id' => $validated['semester_id'],
                    'assigned_strand_id' => $assignedStrandId,
                    'assigned_section_id' => $assignedSectionId,
                    'status' => Enrollment::STATUS_ENROLLED,
                    'enrolled_by' => $user->id,
                    'approved_by' => $user->id,
                    'approved_at' => now(),
                    'submitted_at' => now(),
                    'processed_at' => now(),
                    'confirmed_at' => now(),
                ]);

                if ($isSummerSemester && $failedGrades && $failedGrades->isNotEmpty()) {
                    $this->createClassesForFailedSubjectsCoordinator($newEnrollment, $failedGrades, $user->id);
                    $this->createClassDetailsForEnrollment($newEnrollment, $user->id, true, $failedGrades);
                } else {
                    $this->createClassDetailsForEnrollment($newEnrollment, $user->id, true);
                }

                DB::commit();
                $successCount++;
            } catch (\Exception $e) {
                DB::rollBack();
                $failedCount++;
                $studentName = trim(($studentInfo->user?->FirstName ?? '') . ' ' . ($studentInfo->user?->LastName ?? '')) ?: 'Unknown';
                $errors[] = $studentName . ': ' . $e->getMessage();
                Log::error('Coordinator bulk re-enrollment failed for student: ' . $studentInfoId, [
                    'error' => $e->getMessage(),
                    'user_id' => $user->id,
                ]);
            }
        }

        $message = "Re-enrollment complete. Success: {$successCount}, Failed: {$failedCount}";
        
        if ($failedCount > 0) {
            return back()->with('warning', $message)->with('errors_detail', $errors);
        }

        return back()->with('success', $message);
    }

    /**
     * Save grades for a specific class.
     */
    public function saveGrades(Request $request, ClassModel $class)
    {
        $user = Auth::user();

        if ($class->faculty_id !== $user->id) {
            abort(403, 'You are not authorized to submit grades for this class.');
        }

        $class->loadMissing([
            'section.enrollments' => function ($query) {
                $query->where('status', Enrollment::STATUS_ENROLLED)
                    ->select('id', 'student_personal_info_id', 'assigned_section_id', 'status');
            },
            'semester',
            'schoolYear',
            'subject',
        ]);

        $allowedStudentIds = $class->section?->enrollments?->pluck('student_personal_info_id')->filter()->unique() ?? collect();

        // Check if this is a summer semester
        $isSummerSemester = $class->semester && 
            str_contains(strtolower($class->semester->semester_type ?? ''), 'summer');

        $validated = $request->validate([
            'action' => 'nullable|in:save,submit',
            'grades' => 'required|array|min:1',
            'grades.*.student_personal_info_id' => 'required|integer|exists:student_personal_info,id',
            'grades.*.first_quarter' => 'nullable|numeric|min:0|max:100',
            'grades.*.second_quarter' => 'nullable|numeric|min:0|max:100',
            'grades.*.third_quarter' => 'nullable|numeric|min:0|max:100',
            'grades.*.fourth_quarter' => 'nullable|numeric|min:0|max:100',
            'grades.*.summer_grade' => 'nullable|numeric|min:0|max:100',
            'grades.*.semester_grade' => 'nullable|numeric|min:0|max:100',
            'grades.*.remarks' => 'nullable|string|max:255',
            'grades.*.notes' => 'nullable|string|max:1000',
        ]);

        $action = $validated['action'] ?? 'save';
        unset($validated['action']);
        $submittedAt = $action === 'submit' ? now() : null;

        foreach ($validated['grades'] as $gradeInput) {
            $studentInfoId = (int) $gradeInput['student_personal_info_id'];

            if (!$allowedStudentIds->contains($studentInfoId)) {
                return redirect()->back()->withErrors([
                    'grades' => 'One or more students are not assigned to this class.',
                ]);
            }

            $grade = Grade::where('class_id', $class->Id)
                ->where('student_personal_info_id', $studentInfoId)
                ->first();

            if ($grade && $grade->status === Grade::STATUS_APPROVED) {
                // Prevent overriding approved grades.
                continue;
            }

            // For summer semester: only summer_grade is input, calculate final as (summer_grade + original_failed_grade) / 2
            $summerGrade = $this->normalizeGradeValue($gradeInput['summer_grade'] ?? null);
            $semesterGrade = null;
            $originalFailedGrade = null;
            $notes = $gradeInput['notes'] ?? null;
            
            if ($isSummerSemester && $summerGrade !== null) {
                // Get the original failed grade for this subject from previous semester
                // Look for the most recent failed grade for this subject
                $originalFailedGrade = Grade::where('student_personal_info_id', $studentInfoId)
                    ->where('subject_id', $class->subject_id)
                    ->where(function ($query) {
                        $query->where('semester_grade', '<', 75)
                              ->orWhere('remarks', 'Failed');
                    })
                    ->where('status', Grade::STATUS_APPROVED)
                    ->where('semester', '!=', 'Summer') // Don't use another summer grade
                    ->orderByDesc('school_year_id')
                    ->orderByRaw("FIELD(semester, '2nd', '1st')")
                    ->first();
                
                if ($originalFailedGrade && $originalFailedGrade->semester_grade !== null) {
                    // Store original failed grade and summer grade
                    $originalFailedGradeValue = $originalFailedGrade->semester_grade;
                    
                    // Calculate: (summer_grade + original_failed_grade) / 2
                    $semesterGrade = round(($summerGrade + $originalFailedGradeValue) / 2, 2);
                    
                    // Add note indicating this is a summer class grade
                    if (empty($notes)) {
                        $notes = "Summer Class - Original Grade: {$originalFailedGradeValue}, Summer Grade: {$summerGrade}, Final: {$semesterGrade}";
                    }
                } else {
                    // Fallback: use summer grade as semester grade if original not found
                    $semesterGrade = $summerGrade;
                    if (empty($notes)) {
                        $notes = "Summer Class - Grade: {$summerGrade}";
                    }
                }
            } else {
                // Regular semester: use provided semester_grade or calculate from quarters
                $semesterGrade = $this->normalizeGradeValue($gradeInput['semester_grade'] ?? null);
            }

            $payload = [
                'student_personal_info_id' => $studentInfoId,
                'subject_id' => $class->subject_id,
                'faculty_id' => $user->id,
                'school_year_id' => $class->school_year_id,
                'class_id' => $class->Id,
                'semester' => $this->normalizeSemesterValue($class->semester?->semester_type),
                'first_quarter' => $isSummerSemester ? null : $this->normalizeGradeValue($gradeInput['first_quarter'] ?? null),
                'second_quarter' => $isSummerSemester ? null : $this->normalizeGradeValue($gradeInput['second_quarter'] ?? null),
                'third_quarter' => $isSummerSemester ? null : $this->normalizeGradeValue($gradeInput['third_quarter'] ?? null),
                'fourth_quarter' => $isSummerSemester ? null : $this->normalizeGradeValue($gradeInput['fourth_quarter'] ?? null),
                'summer_grade' => $summerGrade,
                'original_failed_grade' => $originalFailedGrade?->semester_grade,
                'semester_grade' => $semesterGrade,
                'remarks' => $gradeInput['remarks'] ?? null,
                'notes' => $notes,
            ];

            if ($action === 'submit') {
                $payload['status'] = Grade::STATUS_PENDING;
                $payload['submitted_for_approval_at'] = $submittedAt;
                $payload['submitted_by'] = $user->id;
                $payload['approved_by'] = null;
                $payload['approved_at'] = null;
            } else {
                if ($grade) {
                    $payload['status'] = $grade->status;
                } else {
                    $payload['status'] = Grade::STATUS_DRAFT;
                }
                // Preserve submission metadata if grade is already pending or rejected
                if ($grade) {
                    $payload['submitted_for_approval_at'] = $grade->submitted_for_approval_at;
                    $payload['submitted_by'] = $grade->submitted_by;
                    $payload['approved_by'] = $grade->approved_by;
                    $payload['approved_at'] = $grade->approved_at;
                }
            }

            $savedGrade = Grade::updateOrCreate(
                [
                    'class_id' => $class->Id,
                    'student_personal_info_id' => $studentInfoId,
                ],
                $payload
            );

            // After saving grade, check prerequisites if grade is failed
            // This ensures prerequisite flags (is_prerequisite_failed, needs_summer_class) are set correctly
            if ($savedGrade->semester_grade !== null) {
                // Auto-calculate remarks if not provided
                if (!$savedGrade->remarks) {
                    $savedGrade->remarks = $savedGrade->semester_grade >= 75 ? 'Passed' : 'Failed';
                }

                // Check prerequisites if grade is failed or below threshold
                if ($savedGrade->remarks === 'Failed' || $savedGrade->semester_grade < 75) {
                    $gradeService = app(GradeCalculationService::class);
                    $gradeService->checkPrerequisites($savedGrade);
                } elseif ($savedGrade->semester_grade >= 75) {
                    // Clear prerequisite flags if passing
                    $savedGrade->is_prerequisite_failed = false;
                    $savedGrade->needs_summer_class = false;
                    $savedGrade->failed_prerequisites = null;
                    $savedGrade->save();
                }
            }
        }

        $message = $action === 'submit'
            ? 'Grades submitted for registrar approval.'
            : 'Grades saved as draft.';

        return redirect()->route('faculty.grades')->with('success', $message);
    }

    /**
     * Normalize grade inputs to nullable floats.
     */
    private function normalizeGradeValue($value): ?float
    {
        if ($value === '' || $value === null) {
            return null;
        }

        return (float) $value;
    }

    /**
     * Normalize semester labels to match grade table enum.
     */
    private function normalizeSemesterValue(?string $semesterType): ?string
    {
        if (!$semesterType) {
            return null;
        }

        $lower = strtolower($semesterType);

        if (str_contains($lower, '1')) {
            return '1st';
        }

        if (str_contains($lower, '2')) {
            return '2nd';
        }

        if (str_contains($lower, 'summer')) {
            return 'Summer';
        }

        return $semesterType;
    }

    /**
     * Generate PDF for faculty schedule.
     */
    public function downloadSchedulePdf()
    {
        $user = Auth::user();
        $filters = $this->getActiveFilters();

        $rawClasses = ClassModel::with(['section.strand', 'subject', 'semester', 'schoolYear'])
            ->where('faculty_id', $user->id)
            ->where('is_active', true)
            ->when($filters['activeSchoolYear'], fn ($query) => $query->where('school_year_id', $filters['activeSchoolYear']->id))
            ->when($filters['activeSemester'], fn ($query) => $query->where('Semester_id', $filters['activeSemester']->id))
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get();

        $formattedClasses = $this->formatClassSchedules($rawClasses)
            ->map(function ($class) {
                $formatTime = static fn ($time) => $time ? date('g:i A', strtotime($time)) : '';

                return [
                    'subject' => $class['subject'] ?? 'Unnamed Subject',
                    'subject_code' => $class['subject_code'] ?? null,
                    'section' => $class['section'] ?? null,
                    'strand' => $class['strand'] ?? null,
                    'day_of_week' => $class['day_of_week'] ?? 'Unscheduled',
                    'start_time' => $formatTime($class['start_time'] ?? null),
                    'end_time' => $formatTime($class['end_time'] ?? null),
                    'semester' => $class['semester'] ?? null,
                    'school_year' => $class['school_year'] ?? null,
                ];
            })
            ->sortBy(['day_of_week', 'start_time'])
            ->values();

        $data = [
            'faculty_name' => $user->FirstName . ' ' . $user->LastName,
            'classes' => $formattedClasses,
            'school_year' => $filters['activeSchoolYear']?->formatted,
            'semester' => $filters['activeSemester']?->semester_type,
            'generated_at' => now()->format('F d, Y g:i A'),
        ];

        $pdf = PDF::loadView('pdf.faculty.schedule', $data);
        return $pdf->download('faculty-schedule-' . now()->format('Y-m-d') . '.pdf');
    }

    /**
     * Generate PDF for class students list.
     */
    public function downloadClassStudentsPdf(Request $request, ClassModel $class)
    {
        $user = Auth::user();
        
        if ($class->faculty_id !== $user->id) {
            abort(403, 'Unauthorized action.');
        }

        $filters = $this->getActiveFilters();
        
        $class->load([
            'section.strand',
            'section.schoolYear',
            'section.semester',
            'subject',
            'semester',
            'schoolYear',
            'section.enrollments' => function ($query) use ($filters) {
                $query->where('status', Enrollment::STATUS_ENROLLED)
                    ->with([
                        'studentPersonalInfo.user',
                        'studentPersonalInfo:id,user_id,lrn,first_name,middle_name,last_name,extension_name,grade_level',
                    ]);
                    
                if ($filters['activeSchoolYear']) {
                    $query->where('school_year_id', $filters['activeSchoolYear']->id);
                }
                
                if ($filters['activeSemester']) {
                    $query->where('semester_id', $filters['activeSemester']->id);
                }
            }
        ]);

        $students = $class->section?->enrollments->map(function ($enrollment, $index) {
            $studentInfo = $enrollment->studentPersonalInfo;
            return [
                'number' => $index + 1,
                'lrn' => $studentInfo?->lrn,
                'name' => $studentInfo?->full_name,
                'grade_level' => $studentInfo?->grade_level,
            ];
        }) ?? collect();

        $data = [
            'faculty_name' => $user->FirstName . ' ' . $user->LastName,
            'subject' => $class->subject?->Subject_name,
            'subject_code' => $class->subject?->Subject_code,
            'section' => $class->section?->section_name,
            'strand' => $class->section?->strand?->Strand_name,
            'school_year' => $class->schoolYear?->formatted,
            'semester' => $class->semester?->semester_type,
            'students' => $students,
            'total_students' => $students->count(),
            'generated_at' => now()->format('F d, Y g:i A'),
        ];

        $pdf = PDF::loadView('pdf.faculty.class-students', $data);
        $filename = 'class-students-' . str_replace(' ', '-', $class->subject?->Subject_code ?? 'list') . '-' . now()->format('Y-m-d') . '.pdf';
        return $pdf->download($filename);
    }

    /**
     * Generate PDF for class grades by subject.
     */
    public function downloadClassGradesPdf(Request $request, ClassModel $class)
    {
        $user = Auth::user();
        
        if ($class->faculty_id !== $user->id) {
            abort(403, 'Unauthorized action.');
        }

        $filters = $this->getActiveFilters();
        
        $class->load([
            'section.strand',
            'subject',
            'semester',
            'schoolYear',
            'section.enrollments' => function ($query) use ($filters) {
                $query->where('status', Enrollment::STATUS_ENROLLED)
                    ->with('studentPersonalInfo');
                    
                if ($filters['activeSchoolYear']) {
                    $query->where('school_year_id', $filters['activeSchoolYear']->id);
                }
                
                if ($filters['activeSemester']) {
                    $query->where('semester_id', $filters['activeSemester']->id);
                }
            }
        ]);

        $studentInfoIds = $class->section?->enrollments->pluck('student_personal_info_id')->filter() ?? collect();
        $semesterCode = $this->normalizeSemesterValue($class->semester?->semester_type);

        $grades = Grade::whereIn('student_personal_info_id', $studentInfoIds)
            ->where('subject_id', $class->subject_id)
            ->where('school_year_id', $class->school_year_id)
            ->when($semesterCode, fn ($query) => $query->where('semester', $semesterCode))
            ->where('status', Grade::STATUS_APPROVED)
            ->orderByRaw('class_id IS NULL') // prefer grades tied to this class
            ->orderByDesc('approved_at')
            ->get()
            ->groupBy('student_personal_info_id')
            ->map(function ($gradeGroup) {
                return $gradeGroup->first();
            });

        $students = $class->section?->enrollments->map(function ($enrollment, $index) use ($grades) {
            $studentInfo = $enrollment->studentPersonalInfo;
            $grade = $grades->get($enrollment->student_personal_info_id);
            
            return [
                'number' => $index + 1,
                'lrn' => $studentInfo?->lrn,
                'name' => $studentInfo?->full_name,
                'first_quarter' => $grade?->first_quarter ?? '—',
                'second_quarter' => $grade?->second_quarter ?? '—',
                'third_quarter' => $grade?->third_quarter ?? '—',
                'fourth_quarter' => $grade?->fourth_quarter ?? '—',
                'semester_grade' => $grade?->semester_grade ?? '—',
                'remarks' => $grade?->remarks ?? '—',
            ];
        }) ?? collect();

        $data = [
            'faculty_name' => $user->FirstName . ' ' . $user->LastName,
            'subject' => $class->subject?->Subject_name,
            'subject_code' => $class->subject?->Subject_code,
            'section' => $class->section?->section_name,
            'strand' => $class->section?->strand?->Strand_name,
            'school_year' => $class->schoolYear?->formatted,
            'semester' => $class->semester?->semester_type,
            'students' => $students,
            'total_students' => $students->count(),
            'generated_at' => now()->format('F d, Y g:i A'),
        ];

        $pdf = PDF::loadView('pdf.faculty.class-grades', $data)->setPaper('a4', 'landscape');
        $filename = 'class-grades-' . str_replace(' ', '-', $class->subject?->Subject_code ?? 'grades') . '-' . now()->format('Y-m-d') . '.pdf';
        return $pdf->download($filename);
    }

    /**
     * Generate PDF for advisory section report.
     */
    public function downloadAdvisoryPdf(Request $request, Section $section)
    {
        $user = Auth::user();
        
        if ($section->adviser_id !== $user->id) {
            abort(403, 'Unauthorized action.');
        }

        $filters = $this->getActiveFilters();

        $section->load([
            'strand', 
            'schoolYear', 
            'semester', 
            'classes.subject',
            'classes.faculty',
            'enrollments' => function ($query) use ($filters) {
                $query->where('status', Enrollment::STATUS_ENROLLED)
                    ->with('studentPersonalInfo');
                    
                if ($filters['activeSchoolYear']) {
                    $query->where('school_year_id', $filters['activeSchoolYear']->id);
                }
                
                if ($filters['activeSemester']) {
                    $query->where('semester_id', $filters['activeSemester']->id);
                }
            }
        ]);

        $students = $section->enrollments->map(function ($enrollment, $index) {
            $studentInfo = $enrollment->studentPersonalInfo;
            return [
                'number' => $index + 1,
                'lrn' => $studentInfo?->lrn,
                'name' => $studentInfo?->full_name,
                'grade_level' => $studentInfo?->grade_level,
            ];
        });

        $subjects = $section->classes->map(function ($class) {
            return [
                'code' => $class->subject?->Subject_code,
                'name' => $class->subject?->Subject_name,
                'faculty' => $class->faculty ? trim(($class->faculty->FirstName ?? '') . ' ' . ($class->faculty->LastName ?? '')) : 'TBA',
                'schedule' => $class->day_of_week . ' ' . ($class->start_time ? date('g:i A', strtotime($class->start_time)) : '') . '-' . ($class->end_time ? date('g:i A', strtotime($class->end_time)) : ''),
            ];
        });

        $data = [
            'adviser_name' => $user->FirstName . ' ' . $user->LastName,
            'section_name' => $section->section_name,
            'strand' => $section->strand?->Strand_name,
            'grade_level' => $section->year_level,
            'school_year' => $section->schoolYear?->formatted,
            'semester' => $section->semester?->semester_type,
            'students' => $students,
            'subjects' => $subjects,
            'total_students' => $students->count(),
            'total_subjects' => $subjects->count(),
            'generated_at' => now()->format('F d, Y g:i A'),
        ];

        $pdf = PDF::loadView('pdf.faculty.advisory-report', $data);
        $filename = 'advisory-report-' . str_replace(' ', '-', $section->section_name) . '-' . now()->format('Y-m-d') . '.pdf';
        return $pdf->download($filename);
    }

    /**
     * Create classes for failed subjects during summer semester (coordinator use).
     */
    private function createClassesForFailedSubjectsCoordinator(Enrollment $enrollment, \Illuminate\Support\Collection $failedGrades, int $createdBy): void
    {
        $section = $enrollment->assignedSection;
        if (!$section) {
            return;
        }

        $failedSubjectIds = $failedGrades->pluck('subject_id')->filter()->unique()->all();

        $existingClasses = ClassModel::where('Section_id', $section->id)
            ->where('school_year_id', $enrollment->school_year_id)
            ->where('Semester_id', $enrollment->semester_id)
            ->whereIn('subject_id', $failedSubjectIds)
            ->where('is_active', true)
            ->pluck('subject_id')
            ->all();

        $subjectsToCreate = array_diff($failedSubjectIds, $existingClasses);
        if (empty($subjectsToCreate)) {
            return;
        }

        $defaultFacultyId = $section->adviser_id;
        if (!$defaultFacultyId) {
            $previousClass = ClassModel::whereIn('subject_id', $subjectsToCreate)
                ->where('is_active', true)
                ->latest('Id')
                ->first();
            $defaultFacultyId = $previousClass?->faculty_id;
        }

        if (!$defaultFacultyId) {
            $defaultFaculty = User::where('Role', 'Faculty')->where('is_disabled', false)->first();
            $defaultFacultyId = $defaultFaculty?->id;
        }

        if (!$defaultFacultyId) {
            return;
        }

        $defaultStartTime = '13:30';
        $defaultEndTime = '15:30';
        $summerDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        $dayIndex = 0;

        foreach ($subjectsToCreate as $subjectId) {
            $subject = Subject::find($subjectId);
            if (!$subject) {
                continue;
            }

            $alreadyExists = ClassModel::where('Section_id', $section->id)
                ->where('subject_id', $subjectId)
                ->where('school_year_id', $enrollment->school_year_id)
                ->where('Semester_id', $enrollment->semester_id)
                ->where('is_active', true)
                ->exists();

            if ($alreadyExists) {
                continue;
            }

            $assignedDay = $summerDays[$dayIndex % count($summerDays)];
            $finalDay = $assignedDay;
            $attempts = 0;

            while ($attempts < count($summerDays)) {
                if (!$this->facultyHasScheduleConflictSimple($defaultFacultyId, $finalDay, $defaultStartTime, $defaultEndTime, $enrollment->school_year_id, $enrollment->semester_id)) {
                    break;
                }
                $attempts++;
                $nextDayIndex = ($dayIndex + $attempts) % count($summerDays);
                $finalDay = $summerDays[$nextDayIndex];
            }

            $dayIndex++;

            ClassModel::create([
                'Section_id' => $section->id,
                'faculty_id' => $defaultFacultyId,
                'school_year_id' => $enrollment->school_year_id,
                'Semester_id' => $enrollment->semester_id,
                'subject_id' => $subjectId,
                'day_of_week' => $finalDay,
                'start_time' => $defaultStartTime,
                'endtime' => $defaultEndTime,
                'is_active' => true,
            ]);
        }
    }

    private function facultyHasScheduleConflictSimple(int $facultyId, string $dayOfWeek, string $startTime, string $endTime, int $schoolYearId, int $semesterId): bool
    {
        $start = Carbon::parse($startTime);
        $end = Carbon::parse($endTime);

        return ClassModel::where('faculty_id', $facultyId)
            ->where('school_year_id', $schoolYearId)
            ->where('Semester_id', $semesterId)
            ->where('day_of_week', $dayOfWeek)
            ->where('is_active', true)
            ->where(function ($query) use ($start, $end) {
                $query->where(function ($q) use ($start, $end) {
                    $q->where('start_time', '<', $end->format('H:i'))
                      ->where('endtime', '>', $start->format('H:i'));
                });
            })
            ->exists();
    }
}

