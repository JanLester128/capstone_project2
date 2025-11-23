<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Section;
use App\Models\Subject;
use App\Models\Strand;
use App\Models\SchoolYear;
use App\Models\Semester;
use App\Models\ClassModel;
use App\Models\ClassDetail;
use App\Models\CreditedSubject;
use App\Models\StudentPersonalInfo;
use App\Models\Enrollment;
use App\Models\Grade;
use App\Mail\FacultyAccountCreated;
use App\Mail\StudentApprovalNotification;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf as PDF;
use App\Support\NotificationCounts;

class RegistrarController extends Controller
{
    /**
     * Display the registrar dashboard.
     */
    public function index()
    {
        /** @var User|null $user */
        $user = Auth::user();
        $registrar = $user ? User::find($user->id) : null;
        
        $activeSchoolYear = SchoolYear::where('is_active', true)->first();
        $activeSemester = $activeSchoolYear ? 
            Semester::where('school_year_id', $activeSchoolYear->id)
                   ->where('is_active', true)
                   ->first() : null;
        
        // Get analytics data for charts
        $analytics = $this->getAnalyticsData($activeSchoolYear, $activeSemester);
        
        $stats = [
            'students' => $analytics['total_students'],
            'faculty' => $analytics['total_faculty'],
            'sections' => ($activeSchoolYear && $activeSemester) 
                ? Section::where('school_year_id', $activeSchoolYear->id)
                         ->where('semester_id', $activeSemester->id)
                         ->count()
                : 0,
            'subjects' => ($activeSchoolYear && $activeSemester) 
                ? Subject::where('school_year_id', $activeSchoolYear->id)
                         ->where('semester_id', $activeSemester->id)
                         ->count()
                : 0,
            'classes' => ($activeSchoolYear && $activeSemester) 
                ? ClassModel::where('school_year_id', $activeSchoolYear->id)
                           ->where('Semester_id', $activeSemester->id)
                           ->count()
                : 0,
            'strands' => $activeSemester
                ? DB::table('strand_semester')
                    ->where('semester_id', $activeSemester->id)
                    ->where('is_active', true)
                    ->count()
                : ($activeSchoolYear
                    ? DB::table('strand_school_year')
                        ->where('school_year_id', $activeSchoolYear->id)
                        ->where('is_active', true)
                        ->count()
                    : 0),
            'active_school_year' => $activeSchoolYear,
            'active_semester' => $activeSemester,
        ];

        $notifications = NotificationCounts::forRegistrar();

        return Inertia::render('Registrar/Dashboard', [
            'stats' => $stats,
            'registrar' => $registrar,
            'analytics' => $analytics,
            'notifications' => $notifications,
        ]);
    }

    /**
     * Get analytics data for dashboard charts
     */
    private function getAnalyticsData($activeSchoolYear, $activeSemester)
    {
        $enrollmentsBase = DB::table('enrollments')
            ->where('enrollments.status', 'enrolled')
            ->when($activeSchoolYear, function ($query) use ($activeSchoolYear) {
                $query->where('enrollments.school_year_id', $activeSchoolYear->id);
            })
            ->when($activeSemester, function ($query) use ($activeSemester) {
                $query->where('enrollments.semester_id', $activeSemester->id);
            });

        $totalStudents = (clone $enrollmentsBase)->count();

        $genderStats = (clone $enrollmentsBase)
            ->join('student_personal_info', 'enrollments.student_personal_info_id', '=', 'student_personal_info.id')
            ->select('student_personal_info.sex', DB::raw('count(*) as count'))
            ->groupBy('student_personal_info.sex')
            ->get();

        $maleCount = $genderStats->where('sex', 'Male')->first()->count ?? 0;
        $femaleCount = $genderStats->where('sex', 'Female')->first()->count ?? 0;

        $strandEnrollment = (clone $enrollmentsBase)
            ->leftJoin('strands', 'enrollments.assigned_strand_id', '=', 'strands.id')
            ->whereNotNull('enrollments.assigned_strand_id')
            ->select('strands.Strand_name', DB::raw('count(*) as count'))
            ->groupBy('strands.id', 'strands.Strand_name')
            ->get();

        $gradeDistribution = (clone $enrollmentsBase)
            ->join('student_personal_info', 'enrollments.student_personal_info_id', '=', 'student_personal_info.id')
            ->select('student_personal_info.grade_level', DB::raw('count(*) as count'))
            ->groupBy('student_personal_info.grade_level')
            ->get();

        $totalFaculty = User::where('Role', 'Faculty')->count();

        return [
            'total_students' => $totalStudents,
            'total_faculty' => $totalFaculty,
            'gender_distribution' => [
                'male' => $maleCount,
                'female' => $femaleCount,
            ],
            'strand_enrollment' => $strandEnrollment->map(function ($item) {
                return [
                    'strand' => $item->Strand_name ?? 'Unassigned',
                    'count' => $item->count,
                ];
            })->toArray(),
            'grade_distribution' => $gradeDistribution->map(function ($item) {
                return [
                    'grade' => $item->grade_level ? "Grade {$item->grade_level}" : 'Not Set',
                    'count' => $item->count,
                ];
            })->toArray(),
        ];
    }

    /**
     * Display all users.
     */
    public function users(Request $request)
    {
        $role = $request->query('role', 'all');
        $query = User::query();

        if ($role !== 'all') {
            $query->where('Role', $role);
        }

        $users = $query->with(['assignedStrand'])
            ->paginate(15);

        return Inertia::render('Registrar/Users', [
            'users' => $users,
            'role' => $role,
        ]);
    }

    /**
     * Show form for creating a new user.
     */
    public function createUser()
    {
        $strands = Strand::where('Is_active', true)->get();

        return Inertia::render('Registrar/CreateUser', [
            'strands' => $strands,
        ]);
    }

    /**
     * Store a newly created user.
     */
    public function storeUser(Request $request)
    {
        $validated = $request->validate([
            'FirstName' => 'required|string|max:255',
            'MiddleName' => 'nullable|string|max:255',
            'LastName' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'Role' => 'required|in:Registrar,Faculty,Student',
            'assigned_strand_id' => 'nullable|exists:strands,id',
            'is_coordinator' => 'boolean',
            'is_disabled' => 'boolean',
            'must_change_password' => 'boolean',
        ]);

        $validated['password'] = Hash::make($validated['password']);

        User::create($validated);

        return redirect()->route('registrar.users')
            ->with('success', 'User created successfully.');
    }

    /**
     * Show form for editing a user.
     */
    public function editUser(User $user)
    {
        $strands = Strand::where('Is_active', true)->get();
        $user->load('assignedStrand');

        return Inertia::render('Registrar/EditUser', [
            'user' => $user,
            'strands' => $strands,
        ]);
    }

    /**
     * Update the specified user.
     */
    public function updateUser(Request $request, User $user)
    {
        $validated = $request->validate([
            'FirstName' => 'required|string|max:255',
            'MiddleName' => 'nullable|string|max:255',
            'LastName' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:8|confirmed',
            'Role' => 'required|in:Registrar,Faculty,Student',
            'assigned_strand_id' => 'nullable|exists:strands,id',
            'is_coordinator' => 'boolean',
            'is_disabled' => 'boolean',
            'must_change_password' => 'boolean',
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        return redirect()->route('registrar.users')
            ->with('success', 'User updated successfully.');
    }

    /**
     * Display all sections.
     */
    public function sections()
    {
        $activeSchoolYear = SchoolYear::where('is_active', true)->first();
        $activeSemester = $activeSchoolYear ? 
            Semester::where('school_year_id', $activeSchoolYear->id)
                   ->where('is_active', true)
                   ->first() : null;
        
        // Filter sections by active school year and semester, only show active sections
        $sections = Section::with(['strand', 'adviser', 'schoolYear', 'semester'])
            ->withCount([
                'enrollments as current_students' => function ($query) {
                    $query->where('status', Enrollment::STATUS_ENROLLED);
                },
            ])
            ->when($activeSchoolYear, function ($query) use ($activeSchoolYear) {
                return $query->where('school_year_id', $activeSchoolYear->id);
            })
            ->when($activeSemester, function ($query) use ($activeSemester) {
                return $query->where('semester_id', $activeSemester->id);
            });
            
        // Add is_active filter only if the column exists
        try {
            $sections = $sections->where('is_active', true)->get();
        } catch (\Exception $e) {
            // Fallback if is_active column doesn't exist yet
            if (str_contains($e->getMessage(), 'Unknown column') || str_contains($e->getMessage(), 'Column not found')) {
                $sections = $sections->get();
            } else {
                throw $e;
            }
        }
        
        // Get previous sections from other semesters/school years for reopening
        $previousSections = collect();
        if ($activeSchoolYear && $activeSemester) {
            // SIMPLIFIED APPROACH: Find sections that can be reopened for the current semester
            // 1. Get all sections from the same school year but different semesters
            // 2. Get all sections from different school years
            // 3. Filter by strand activation and duplicate check
            
            // Simplified approach: Get all sections that are NOT from the current semester
            $candidateSections = Section::with(['strand', 'schoolYear', 'semester'])
                ->where(function ($query) use ($activeSchoolYear, $activeSemester) {
                    $query->where('school_year_id', '!=', $activeSchoolYear->id) // Different school years
                          ->orWhere(function ($subQuery) use ($activeSchoolYear, $activeSemester) {
                              // Same school year but not current semester
                              $subQuery->where('school_year_id', $activeSchoolYear->id)
                                       ->where('semester_id', '!=', $activeSemester->id);
                          })
                          ->orWhere(function ($subQuery) use ($activeSchoolYear) {
                              // Same school year with NULL semester_id
                              $subQuery->where('school_year_id', $activeSchoolYear->id)
                                       ->whereNull('semester_id');
                          });
                })
                ->get();
            
            $previousSections = $candidateSections
                ->filter(function ($section) use ($activeSchoolYear, $activeSemester) {
                    // Check if strand is active for current semester
                    if ($section->strand_id) {
                        $strandActive = DB::table('strand_semester')
                            ->where('strand_id', $section->strand_id)
                            ->where('semester_id', $activeSemester->id)
                            ->where('is_active', true)
                            ->exists();
                        
                        if (!$strandActive) {
                            return false;
                        }
                    }
                    
                    // Check if section doesn't already exist in current semester
                    $alreadyExists = Section::where('section_name', $section->section_name)
                        ->where('school_year_id', $activeSchoolYear->id)
                        ->where('semester_id', $activeSemester->id)
                        ->exists();
                    
                    return !$alreadyExists;
                })
                ->groupBy('section_name')
                ->map(function ($sectionsWithSameName) {
                    // Return the most recent section with this name
                    return $sectionsWithSameName->sortByDesc(function ($section) {
                        return ($section->school_year_id * 1000) + ($section->semester_id ?? 0);
                    })->first();
                })
                ->values();
        }
        
        // Get strands that are active - prioritize semester, then school year, then general
        $strands = collect();
        
        if ($activeSemester) {
            $strands = Strand::whereHas('semesters', function ($query) use ($activeSemester) {
                $query->where('strand_semester.semester_id', $activeSemester->id)
                      ->where('strand_semester.is_active', true);
            })->get();
        }
        
        // If no strands found via semester relationship, fall back to school year relationship
        if ($strands->isEmpty() && $activeSchoolYear) {
            $strands = Strand::whereHas('schoolYears', function ($query) use ($activeSchoolYear) {
                $query->where('strand_school_year.school_year_id', $activeSchoolYear->id)
                      ->where('strand_school_year.is_active', true);
            })->get();
        }
        
        // If still no strands found, fall back to Is_active (for backward compatibility)
        if ($strands->isEmpty()) {
            $strands = Strand::where('Is_active', true)->get();
        }
        
        $schoolYears = SchoolYear::orderBy('School_year_start', 'desc')->get();
        $users = User::where('Role', 'Faculty')->get(['id', 'FirstName', 'MiddleName', 'LastName']);

        return Inertia::render('Registrar/Sections', [
            'sections' => $sections,
            'previousSections' => $previousSections,
            'strands' => $strands,
            'schoolYears' => $schoolYears,
            'activeSchoolYear' => $activeSchoolYear,
            'activeSemester' => $activeSemester,
            'users' => $users,
        ]);
    }

    /**
     * Store a newly created section.
     */
    public function storeSection(Request $request)
    {
        // Get active school year and semester if not provided
        $activeSchoolYear = SchoolYear::where('is_active', true)->first();
        $activeSemester = $activeSchoolYear ? 
            Semester::where('school_year_id', $activeSchoolYear->id)
                   ->where('is_active', true)
                   ->first() : null;
        
        $validated = $request->validate([
            'section_name' => [
                'required',
                'string',
                'max:255',
                function ($attribute, $value, $fail) use ($request, $activeSchoolYear, $activeSemester) {
                    $schoolYearId = $request->input('school_year_id') ?? ($activeSchoolYear ? $activeSchoolYear->id : null);
                    $semesterId = $request->input('semester_id') ?? ($activeSemester ? $activeSemester->id : null);
                    if ($schoolYearId && $semesterId && Section::where('section_name', $value)
                        ->where('school_year_id', $schoolYearId)
                        ->where('semester_id', $semesterId)
                        ->exists()) {
                        $fail('The section name already exists for this school year and semester.');
                    }
                },
            ],
            'strand_id' => 'required|exists:strands,id',
            'grade_level' => 'required|in:11,12',
            'capacity' => 'required|integer|min:1|max:50',
            'school_year_id' => 'nullable|exists:school_year,id',
            'adviser_id' => 'nullable|exists:users,id',
        ]);

        Log::info('Active school year and semester found', [
            'school_year' => $activeSchoolYear->School_year_start . '-' . $activeSchoolYear->School_year_end,
            'semester' => $activeSemester->semester_type
        ]);

        Log::info('Starting validation');

        // Use active school year and semester if not provided
        $schoolYearId = $validated['school_year_id'] ?? ($activeSchoolYear ? $activeSchoolYear->id : null);
        $semesterId = $activeSemester ? $activeSemester->id : null;
        
        if (!$schoolYearId) {
            return redirect()->route('registrar.strands')
                ->with('error', 'No active school year. Please activate a school year first.');
        }
        
        if (!$semesterId) {
            return redirect()->route('registrar.strands')
                ->with('error', 'No active semester. Please activate a semester first.');
        }

        if (!empty($validated['adviser_id'])) {
            $this->assertAdviserIsAvailable(
                (int) $validated['adviser_id'],
                $schoolYearId,
                $semesterId
            );
        }

        // Map the field names to match the database schema
        $sectionData = [
            'section_name' => $validated['section_name'],
            'strand_id' => $validated['strand_id'],
            'year_level' => $validated['grade_level'], // Map grade_level to year_level
            'max_capacity' => $validated['capacity'], // Map capacity to max_capacity
            'school_year_id' => $schoolYearId,
            'semester_id' => $semesterId, // Add semester assignment
            'adviser_id' => $validated['adviser_id'], // Add adviser assignment
            'is_active' => true,
        ];

        try {
            Section::create($sectionData);
            
            return redirect()->route('registrar.strands')
                ->with('success', "Section '{$validated['section_name']}' created successfully.");
                
        } catch (\Illuminate\Database\QueryException $e) {
            // Handle unique constraint violations
            if (str_contains($e->getMessage(), 'sections_name_school_year_unique') || 
                str_contains($e->getMessage(), 'Duplicate entry')) {
                return redirect()->route('registrar.strands')
                    ->with('error', "Section '{$validated['section_name']}' already exists for this school year.");
            }
            
            // Re-throw other database errors
            throw $e;
        }
    }

    /**
     * Update the specified section.
     */
    public function updateSection(Request $request, Section $section)
    {
        $validated = $request->validate([
            'section_name' => [
                'required',
                'string',
                'max:255',
                function ($attribute, $value, $fail) use ($request, $section) {
                    // Only check for duplicate if the name has actually changed
                    if ($value !== $section->section_name) {
                        $schoolYearId = $request->input('school_year_id') ?? $section->school_year_id;
                        $semesterId = $request->input('semester_id') ?? $section->semester_id;
                        
                        $query = Section::where('section_name', $value)
                            ->where('school_year_id', $schoolYearId)
                            ->where('id', '!=', $section->id);
                        
                        if ($semesterId) {
                            $query->where('semester_id', $semesterId);
                        }
                        
                        if ($query->exists()) {
                            $fail('The section name already exists for this school year.');
                        }
                    }
                },
            ],
            'strand_id' => 'required|exists:strands,id',
            'grade_level' => 'required|in:11,12',
            'capacity' => 'required|integer|min:1|max:50',
            'school_year_id' => 'required|exists:school_year,id',
            'semester_id' => 'nullable|exists:semester,id',
            'adviser_id' => 'nullable|exists:users,id',
        ]);

        $semesterId = $validated['semester_id'] ?? $section->semester_id;

        if (!empty($validated['adviser_id'])) {
            $this->assertAdviserIsAvailable(
                (int) $validated['adviser_id'],
                $validated['school_year_id'],
                $semesterId,
                $section->id
            );
        }

        // Map the field names to match the database schema
        $sectionData = [
            'section_name' => $validated['section_name'],
            'strand_id' => $validated['strand_id'],
            'year_level' => $validated['grade_level'], // Map grade_level to year_level
            'max_capacity' => $validated['capacity'], // Map capacity to max_capacity
            'school_year_id' => $validated['school_year_id'],
            'adviser_id' => $validated['adviser_id'], // Add adviser assignment
            'semester_id' => $semesterId,
        ];

        try {
            $section->update($sectionData);
            
            return redirect()->route('registrar.strands')
                ->with('success', "Section '{$validated['section_name']}' updated successfully.");
                
        } catch (\Illuminate\Database\QueryException $e) {
            // Handle unique constraint violations
            if (str_contains($e->getMessage(), 'sections_name_school_year_unique') || 
                str_contains($e->getMessage(), 'Duplicate entry')) {
                return redirect()->route('registrar.strands')
                    ->with('error', "Section '{$validated['section_name']}' already exists for this school year.");
            }
            
            // Re-throw other database errors
            throw $e;
        }
    }

    /**
     * Update only the adviser for a section (quick update).
     */
    public function updateSectionAdviser(Request $request, Section $section)
    {
        $validated = $request->validate([
            'adviser_id' => 'nullable|exists:users,id',
        ]);

        if (!empty($validated['adviser_id'])) {
            $this->assertAdviserIsAvailable(
                (int) $validated['adviser_id'],
                $section->school_year_id,
                $section->semester_id,
                $section->id
            );
        }

        $section->update(['adviser_id' => $validated['adviser_id']]);

        $adviserName = $validated['adviser_id'] 
            ? User::find($validated['adviser_id'])?->FirstName . ' ' . User::find($validated['adviser_id'])?->LastName
            : 'None';

        return redirect()->route('registrar.strands')
            ->with('success', "Adviser for section '{$section->section_name}' updated to {$adviserName}.");
    }

    /**
     * Toggle the active status of the specified section.
     */
    public function toggleSection(Section $section)
    {
        // Handle case where is_active might be null (treat as active by default)
        $currentStatus = $section->is_active ?? true;
        $newStatus = !$currentStatus;
        $action = $newStatus ? 'enabled' : 'disabled';
        
        $section->update(['is_active' => $newStatus]);

        return redirect()->route('registrar.strands')
            ->with('success', "Section '{$section->section_name}' has been {$action} successfully.");
    }

    /**
     * Ensure a faculty adviser is not already assigned to another active section
     * within the same school year and semester.
     */
    protected function assertAdviserIsAvailable(int $adviserId, int $schoolYearId, ?int $semesterId, ?int $ignoreSectionId = null): void
    {
        $query = Section::where('adviser_id', $adviserId)
            ->where('school_year_id', $schoolYearId)
            ->where('is_active', true);

        if ($semesterId !== null) {
            $query->where('semester_id', $semesterId);
        } else {
            $query->whereNull('semester_id');
        }

        if ($ignoreSectionId !== null) {
            $query->where('id', '!=', $ignoreSectionId);
        }

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'adviser_id' => 'The selected faculty member already advises another active section for this period.',
            ]);
        }
    }

    /**
     * Display all subjects.
     * IMPORTANT: Only shows subjects for the active school year and semester.
     * Subjects are tied to school years and semesters - each semester requires subjects to be added again.
     */
    public function subjects()
    {
        $activeSchoolYear = SchoolYear::where('is_active', true)->first();
        $activeSemester = $activeSchoolYear ? 
            Semester::where('school_year_id', $activeSchoolYear->id)
                   ->where('is_active', true)
                   ->first() : null;
        
        if (!$activeSchoolYear) {
            return Inertia::render('Registrar/Subjects', [
                'subjects' => collect(),
                'strands' => collect(),
                'semesters' => [],
                'activeSchoolYear' => null,
                'activeSemester' => null,
            ])->with('error', 'No active school year. Please activate a school year first.');
        }
        
        if (!$activeSemester) {
            return Inertia::render('Registrar/Subjects', [
                'subjects' => collect(),
                'strands' => collect(),
                'semesters' => [],
                'activeSchoolYear' => $activeSchoolYear,
                'activeSemester' => null,
            ])->with('error', 'No active semester. Please activate a semester first before managing subjects.');
        }
        
        // Only return subjects for the active school year and semester
        try {
            $subjects = Subject::with(['strand', 'schoolYear', 'semester'])
                ->where('school_year_id', $activeSchoolYear->id)
                ->when($activeSemester, function ($query) use ($activeSemester) {
                    return $query->where('semester_id', $activeSemester->id);
                })
                ->orderBy('year_level')
                ->orderBy('Semester')
                ->orderBy('Subject_name')
                ->get();
        } catch (\Exception $e) {
            // Fallback if semester_id column doesn't exist yet
            if (str_contains($e->getMessage(), 'Unknown column') || str_contains($e->getMessage(), 'Column not found')) {
                $subjects = Subject::with(['strand', 'schoolYear'])
                    ->where('school_year_id', $activeSchoolYear->id)
                    ->orderBy('year_level')
                    ->orderBy('Semester')
                    ->orderBy('Subject_name')
                    ->get();
            } else {
                throw $e;
            }
        }
        
        // Get strands that are active - prioritize semester, then school year, then general
        $strands = collect();
        
        if ($activeSemester) {
            $strands = Strand::whereHas('semesters', function ($query) use ($activeSemester) {
                $query->where('strand_semester.semester_id', $activeSemester->id)
                      ->where('strand_semester.is_active', true);
            })->get();
        }
        
        // If no strands found via semester relationship, fall back to school year relationship
        if ($strands->isEmpty() && $activeSchoolYear) {
            $strands = Strand::whereHas('schoolYears', function ($query) use ($activeSchoolYear) {
                $query->where('strand_school_year.school_year_id', $activeSchoolYear->id)
                      ->where('strand_school_year.is_active', true);
            })->get();
        }
        
        // If still no strands found, fall back to Is_active (for backward compatibility)
        if ($strands->isEmpty()) {
            $strands = Strand::where('Is_active', true)->get();
        }

        // Check if there are any active strands
        $hasActiveStrands = $strands->isNotEmpty();

        return Inertia::render('Registrar/Subjects', [
            'subjects' => $subjects,
            'strands' => $strands,
            'semesters' => [], // Empty array since we're using simple 1/2 values
            'activeSchoolYear' => $activeSchoolYear,
            'activeSemester' => $activeSemester,
            'hasActiveStrands' => $hasActiveStrands,
        ]);
    }

    /**
     * Store a newly created subject.
     * Subjects are tied to school years and semesters.
     */
    public function storeSubject(Request $request)
    {
        $activeSchoolYear = SchoolYear::where('is_active', true)->first();
        $activeSemester = $activeSchoolYear ? 
            Semester::where('school_year_id', $activeSchoolYear->id)
                   ->where('is_active', true)
                   ->first() : null;
        
        if (!$activeSchoolYear) {
            return redirect()->route('registrar.subjects')
                ->with('error', 'No active school year. Please activate a school year first.');
        }
        
        if (!$activeSemester) {
            return redirect()->route('registrar.subjects')
                ->with('error', 'No active semester. Please activate a semester first before adding subjects.');
        }

        // Check if there are any active strands
        $activeStrands = collect();
        $activeStrands = Strand::whereHas('semesters', function ($query) use ($activeSemester) {
            $query->where('strand_semester.semester_id', $activeSemester->id)
                  ->where('strand_semester.is_active', true);
        })->get();

        if ($activeStrands->isEmpty() && $activeSchoolYear) {
            $activeStrands = Strand::whereHas('schoolYears', function ($query) use ($activeSchoolYear) {
                $query->where('strand_school_year.school_year_id', $activeSchoolYear->id)
                      ->where('strand_school_year.is_active', true);
            })->get();
        }

        if ($activeStrands->isEmpty()) {
            $activeStrands = Strand::where('Is_active', true)->get();
        }

        if ($activeStrands->isEmpty()) {
            return redirect()->route('registrar.subjects')
                ->with('error', 'No active strands found. Please activate at least one strand before adding subjects.');
        }

        $validated = $request->validate([
            'Subject_name' => 'required|string|max:255',
            'Subject_code' => 'required|string|max:20',
            // Removed manual semester selection - will use active semester automatically
            'year_level' => 'required|integer|in:11,12',
            'strand_id' => 'required|integer|exists:strands,id',
            'PREREQUISITES' => 'nullable|string|max:500',
            'CO-REQUISITES' => 'nullable|string|max:500',
        ]);

        // Check uniqueness per school year and semester
        $exists = Subject::where('Subject_code', $validated['Subject_code'])
            ->where('school_year_id', $activeSchoolYear->id)
            ->where('semester_id', $activeSemester->id)
            ->exists();

        if ($exists) {
            return redirect()->route('registrar.subjects')
                ->with('error', "Subject code already exists for {$activeSemester->semester_type} of {$activeSchoolYear->School_year_start}-{$activeSchoolYear->School_year_end}.");
        }

        // Automatically assign active school year and semester
        $validated['school_year_id'] = $activeSchoolYear->id;
        $validated['semester_id'] = $activeSemester->id;
        
        // Set semester value based on active semester type for backward compatibility
        $validated['Semester'] = $activeSemester->semester_type === '1st Semester' ? '1' : '2';
        
        Subject::create($validated);

        return redirect()->route('registrar.subjects')
            ->with('success', "Subject created successfully for {$activeSemester->semester_type} of {$activeSchoolYear->School_year_start}-{$activeSchoolYear->School_year_end}.");
    }

    /**
     * Store multiple subjects at once (bulk creation).
     */
    public function storeBulkSubjects(Request $request)
    {
        $activeSchoolYear = SchoolYear::where('is_active', true)->first();
        $activeSemester = $activeSchoolYear ? 
            Semester::where('school_year_id', $activeSchoolYear->id)
                   ->where('is_active', true)
                   ->first() : null;
        
        if (!$activeSchoolYear) {
            return redirect()->route('registrar.subjects')
                ->with('error', 'No active school year. Please activate a school year first.');
        }
        
        if (!$activeSemester) {
            return redirect()->route('registrar.subjects')
                ->with('error', 'No active semester. Please activate a semester first before adding subjects.');
        }

        // Check if there are any active strands
        $activeStrands = collect();
        $activeStrands = Strand::whereHas('semesters', function ($query) use ($activeSemester) {
            $query->where('strand_semester.semester_id', $activeSemester->id)
                  ->where('strand_semester.is_active', true);
        })->get();

        if ($activeStrands->isEmpty() && $activeSchoolYear) {
            $activeStrands = Strand::whereHas('schoolYears', function ($query) use ($activeSchoolYear) {
                $query->where('strand_school_year.school_year_id', $activeSchoolYear->id)
                      ->where('strand_school_year.is_active', true);
            })->get();
        }

        if ($activeStrands->isEmpty()) {
            $activeStrands = Strand::where('Is_active', true)->get();
        }

        if ($activeStrands->isEmpty()) {
            return redirect()->route('registrar.subjects')
                ->with('error', 'No active strands found. Please activate at least one strand before adding subjects.');
        }

        $validated = $request->validate([
            'subjects' => 'required|array|min:1|max:20',
            'subjects.*.Subject_name' => 'required|string|max:255',
            'subjects.*.Subject_code' => 'required|string|max:20',
            'subjects.*.year_level' => 'required|integer|in:11,12',
            'subjects.*.strand_id' => 'required|integer|exists:strands,id',
            'subjects.*.PREREQUISITES' => 'nullable|string|max:500',
            'subjects.*.CO-REQUISITES' => 'nullable|string|max:500',
        ]);

        $subjects = $validated['subjects'];
        $errors = [];
        $createdCount = 0;
        $skippedCount = 0;

        // Process each subject
        foreach ($subjects as $index => $subjectData) {
            try {
                // Check uniqueness per school year and semester
                $exists = Subject::where('Subject_code', $subjectData['Subject_code'])
                    ->where('school_year_id', $activeSchoolYear->id)
                    ->where('semester_id', $activeSemester->id)
                    ->exists();

                if ($exists) {
                    $skippedCount++;
                    $errors["subjects.{$index}.Subject_code"] = "Subject code '{$subjectData['Subject_code']}' already exists for this semester.";
                    continue;
                }

                // Check if strand is active
                $strand = Strand::find($subjectData['strand_id']);
                if (!$strand || (!$strand->Is_active && !$activeStrands->contains('id', $strand->id))) {
                    $errors["subjects.{$index}.strand_id"] = "Selected strand is not active for this semester.";
                    continue;
                }

                // Create subject
                Subject::create([
                    'Subject_name' => $subjectData['Subject_name'],
                    'Subject_code' => $subjectData['Subject_code'],
                    'year_level' => $subjectData['year_level'],
                    'strand_id' => $subjectData['strand_id'],
                    'school_year_id' => $activeSchoolYear->id,
                    'semester_id' => $activeSemester->id,
                    'Semester' => $activeSemester->semester_type === '1st Semester' ? '1' : '2',
                    'PREREQUISITES' => $subjectData['PREREQUISITES'] ?? null,
                    'CO-REQUISITES' => $subjectData['CO-REQUISITES'] ?? null,
                ]);

                $createdCount++;
            } catch (\Exception $e) {
                $errors["subjects.{$index}.general"] = "Failed to create subject: " . $e->getMessage();
            }
        }

        if (!empty($errors)) {
            return back()->withErrors($errors)->withInput()
                ->with('warning', "Created {$createdCount} subject(s). {$skippedCount} skipped due to errors.");
        }

        return redirect()->route('registrar.subjects')
            ->with('success', "Successfully created {$createdCount} subject(s) for {$activeSemester->semester_type} of {$activeSchoolYear->School_year_start}-{$activeSchoolYear->School_year_end}.");
    }

    /**
     * Bulk import subjects for a specific strand, year level, and semester.
     */
    public function bulkImportSubjects(Request $request)
    {
        $activeSchoolYear = SchoolYear::where('is_active', true)->first();
        $activeSemester = $activeSchoolYear ? 
            Semester::where('school_year_id', $activeSchoolYear->id)
                   ->where('is_active', true)
                   ->first() : null;
        
        if (!$activeSchoolYear) {
            return redirect()->route('registrar.subjects')
                ->with('error', 'No active school year. Please activate a school year first.');
        }
        
        if (!$activeSemester) {
            return redirect()->route('registrar.subjects')
                ->with('error', 'No active semester. Please activate a semester first before bulk importing subjects.');
        }

        // Check if there are any active strands
        $activeStrands = collect();
        $activeStrands = Strand::whereHas('semesters', function ($query) use ($activeSemester) {
            $query->where('strand_semester.semester_id', $activeSemester->id)
                  ->where('strand_semester.is_active', true);
        })->get();

        if ($activeStrands->isEmpty() && $activeSchoolYear) {
            $activeStrands = Strand::whereHas('schoolYears', function ($query) use ($activeSchoolYear) {
                $query->where('strand_school_year.school_year_id', $activeSchoolYear->id)
                      ->where('strand_school_year.is_active', true);
            })->get();
        }

        if ($activeStrands->isEmpty()) {
            $activeStrands = Strand::where('Is_active', true)->get();
        }

        if ($activeStrands->isEmpty()) {
            return redirect()->route('registrar.subjects')
                ->with('error', 'No active strands found. Please activate at least one strand before bulk importing subjects.');
        }

        $validated = $request->validate([
            'strand_id' => 'required|integer|exists:strands,id',
            'year_level' => 'required|integer|in:11,12',
            // Removed manual semester selection - will use active semester automatically
        ]);

        $strand = Strand::find($validated['strand_id']);
        $strandCode = $strand->Strand_code;
        
        // Get semester number from active semester for predefined subjects lookup
        $activeSemesterNumber = $activeSemester->semester_type === '1st Semester' ? 1 : 2;
        
        // Get predefined subjects from SubjectForm component logic
        $subjectsByStrandAndYear = $this->getPredefinedSubjects();
        
        if (!isset($subjectsByStrandAndYear[$strandCode][$validated['year_level']][$activeSemesterNumber])) {
            return redirect()->route('registrar.subjects')
                ->with('error', "No subjects found for {$strandCode} Grade {$validated['year_level']} in {$activeSemester->semester_type}.");
        }

        $subjectsToImport = $subjectsByStrandAndYear[$strandCode][$validated['year_level']][$activeSemesterNumber];
        $importedCount = 0;

        foreach ($subjectsToImport as $subjectData) {
            // Check if subject already exists for this school year and semester
            $exists = Subject::where('Subject_code', $subjectData['code'])
                ->where('school_year_id', $activeSchoolYear->id)
                ->where('semester_id', $activeSemester->id)
                ->exists();

            if (!$exists) {
                try {
                    Subject::create([
                        'Subject_name' => $subjectData['name'],
                        'Subject_code' => $subjectData['code'],
                        'Semester' => (string)$activeSemesterNumber, // Use active semester number
                        'year_level' => $validated['year_level'],
                        'strand_id' => $validated['strand_id'],
                        'school_year_id' => $activeSchoolYear->id,
                        'semester_id' => $activeSemester->id,
                        'PREREQUISITES' => $subjectData['prerequisites'],
                        'CO-REQUISITES' => $subjectData['corequisites'],
                    ]);
                    $importedCount++;
                } catch (\Illuminate\Database\QueryException $e) {
                    // Skip duplicates silently (in case of race condition or constraint violation)
                    continue;
                }
            }
        }

        return redirect()->route('registrar.subjects')
            ->with('success', "Successfully imported {$importedCount} subjects for {$activeSemester->semester_type} of {$activeSchoolYear->School_year_start}-{$activeSchoolYear->School_year_end}.");
    }

    /**
     * Get predefined subjects array (same as in SubjectForm component).
     */
    private function getPredefinedSubjects()
    {
        return [
            'STEM' => [
                11 => [
                    1 => [
                        ['name' => 'Oral Communication', 'code' => 'ORAL_COMM', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Komunikasyon at Pananaliksik sa Wika at Kulturang Pilipino', 'code' => 'KOMUN_FIL', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'General Mathematics', 'code' => 'GEN_MATH', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Earth Science', 'code' => 'EARTH_SCI', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => '21st Century Literature from the Philippines and the World', 'code' => '21ST_LIT', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Physical Education and Health', 'code' => 'PE_HEALTH_1', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Pre-calculus', 'code' => 'PRE_CALC', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'General Chemistry 1', 'code' => 'GEN_CHEM_1', 'prerequisites' => null, 'corequisites' => null],
                    ],
                    2 => [
                        ['name' => 'Reading and Writing', 'code' => 'READ_WRITE', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Pagbasa at Pagsusuri ng Iba\'t ibang Teksto Tungo sa Pananaliksik', 'code' => 'PAGBASA_FIL', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Statistics and Probability', 'code' => 'STAT_PROB', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Disaster Readiness and Risk Reduction', 'code' => 'DRRR', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Introduction to the Philosophy of the Human Person/Pambungad sa Pilosopiya ng Tao', 'code' => 'INTRO_PHIL', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Physical Education and Health', 'code' => 'PE_HEALTH_2', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Practical Research 1', 'code' => 'PRAC_RES_1', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Basic Calculus', 'code' => 'BASIC_CALC', 'prerequisites' => 'Pre-calculus', 'corequisites' => null],
                        ['name' => 'General Chemistry 2', 'code' => 'GEN_CHEM_2', 'prerequisites' => 'General Chemistry 1', 'corequisites' => null],
                    ]
                ],
                12 => [
                    1 => [
                        ['name' => 'Personal Development/Pansariling Kaunlaran', 'code' => 'PERS_DEV', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Understanding Culture, Society and Politics', 'code' => 'UCSP', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Physical Education and Health', 'code' => 'PE_HEALTH_3', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Practical Research 2', 'code' => 'PRAC_RES_2', 'prerequisites' => 'Practical Research 1, Statistics and Probability', 'corequisites' => null],
                        ['name' => 'English for Academic and Professional Purposes', 'code' => 'EAPP', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'General Biology 1', 'code' => 'GEN_BIO_1', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'General Physics 1', 'code' => 'GEN_PHYS_1', 'prerequisites' => 'Pre-calculus, Basic Calculus', 'corequisites' => null],
                    ],
                    2 => [
                        ['name' => 'Media and Information Literacy', 'code' => 'MIL', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Contemporary Philippine Arts from the regions', 'code' => 'CPAR', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Physical Education and Health', 'code' => 'PE_HEALTH_4', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Inquiries, Investigations and Immersion', 'code' => 'III', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Entrepreneurship', 'code' => 'ENTREP', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Filipino sa Piling Larang', 'code' => 'FIL_LARANG', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'General Biology 2', 'code' => 'GEN_BIO_2', 'prerequisites' => 'General Biology 1', 'corequisites' => null],
                        ['name' => 'General Physics 2', 'code' => 'GEN_PHYS_2', 'prerequisites' => 'General Physics 1', 'corequisites' => null],
                        ['name' => 'Research/Capstone Project/Work Immersion', 'code' => 'CAPSTONE', 'prerequisites' => null, 'corequisites' => null],
                    ]
                ]
            ],
            'TVL' => [
                11 => [
                    1 => [
                        ['name' => 'Oral Communication', 'code' => 'ORAL_COMM_TVL', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Komunikasyon at Pananaliksik sa Wika at Kulturang Pilipino', 'code' => 'KOMUN_FIL_TVL', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'General Mathematics', 'code' => 'GEN_MATH_TVL', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Earth and Life Science', 'code' => 'EARTH_LIFE_SCI', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => '21st Century Literature from the Philippines and the World', 'code' => '21ST_LIT_TVL', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Physical Education and Health', 'code' => 'PE_HEALTH_TVL_1', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Technical Drafting', 'code' => 'TECH_DRAFT', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Entrepreneurship', 'code' => 'ENTREP_TVL', 'prerequisites' => null, 'corequisites' => null],
                    ],
                    2 => [
                        ['name' => 'Reading and Writing', 'code' => 'READ_WRITE_TVL', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Pagbasa at Pagsusuri ng Iba\'t ibang Teksto Tungo sa Pananaliksik', 'code' => 'PAGBASA_FIL_TVL', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Statistics and Probability', 'code' => 'STAT_PROB_TVL', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Physical Science', 'code' => 'PHYS_SCI', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Introduction to the Philosophy of the Human Person', 'code' => 'INTRO_PHIL_TVL', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Physical Education and Health', 'code' => 'PE_HEALTH_TVL_2', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Computer Programming', 'code' => 'COMP_PROG', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Computer Systems Servicing', 'code' => 'COMP_SYS_SERV', 'prerequisites' => null, 'corequisites' => null],
                    ]
                ],
                12 => [
                    1 => [
                        ['name' => 'Personal Development', 'code' => 'PERS_DEV_TVL', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Understanding Culture, Society and Politics', 'code' => 'UCSP_TVL', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Physical Education and Health', 'code' => 'PE_HEALTH_TVL_3', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Practical Research 2', 'code' => 'PRAC_RES_2_TVL', 'prerequisites' => 'Practical Research 1, Statistics and Probability', 'corequisites' => null],
                        ['name' => 'English for Academic and Professional Purposes', 'code' => 'EAPP_TVL', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Web Development', 'code' => 'WEB_DEV', 'prerequisites' => 'Computer Programming', 'corequisites' => null],
                        ['name' => 'Mobile Application Development', 'code' => 'MOBILE_DEV', 'prerequisites' => 'Computer Programming', 'corequisites' => null],
                    ],
                    2 => [
                        ['name' => 'Media and Information Literacy', 'code' => 'MIL_TVL', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Contemporary Philippine Arts from the regions', 'code' => 'CPAR_TVL', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Physical Education and Health', 'code' => 'PE_HEALTH_TVL_4', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Work Immersion', 'code' => 'WORK_IMMERSION', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Filipino sa Piling Larang', 'code' => 'FIL_LARANG_TVL', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Capstone Project', 'code' => 'CAPSTONE_TVL', 'prerequisites' => null, 'corequisites' => null],
                    ]
                ]
            ],
            'HUMSS' => [
                11 => [
                    1 => [
                        ['name' => 'Oral Communication', 'code' => 'ORAL_COMM_HUMSS', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Komunikasyon at Pananaliksik sa Wika at Kulturang Pilipino', 'code' => 'KOMUN_FIL_HUMSS', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'General Mathematics', 'code' => 'GEN_MATH_HUMSS', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Earth and Life Science', 'code' => 'EARTH_LIFE_SCI_HUMSS', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => '21st Century Literature from the Philippines and the World', 'code' => '21ST_LIT_HUMSS', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Physical Education and Health', 'code' => 'PE_HEALTH_HUMSS_1', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Introduction to World Religions and Belief Systems', 'code' => 'WORLD_REL', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Creative Writing', 'code' => 'CREATIVE_WRITE', 'prerequisites' => null, 'corequisites' => null],
                    ],
                    2 => [
                        ['name' => 'Reading and Writing', 'code' => 'READ_WRITE_HUMSS', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Pagbasa at Pagsusuri ng Iba\'t ibang Teksto Tungo sa Pananaliksik', 'code' => 'PAGBASA_FIL_HUMSS', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Statistics and Probability', 'code' => 'STAT_PROB_HUMSS', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Physical Science', 'code' => 'PHYS_SCI_HUMSS', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Introduction to the Philosophy of the Human Person', 'code' => 'INTRO_PHIL_HUMSS', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Physical Education and Health', 'code' => 'PE_HEALTH_HUMSS_2', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Creative Writing/Malikhaing Pagsulat', 'code' => 'CREATIVE_WRITING', 'prerequisites' => '21st Century Literature from the Philippines and the World', 'corequisites' => null],
                        ['name' => 'Disciplines and Ideas in the Social Sciences', 'code' => 'DISS_2', 'prerequisites' => 'Disciplines and Ideas in the Social Sciences', 'corequisites' => null],
                    ]
                ],
                12 => [
                    1 => [
                        ['name' => 'Personal Development', 'code' => 'PERS_DEV_HUMSS', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Understanding Culture, Society and Politics', 'code' => 'UCSP_HUMSS', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Physical Education and Health', 'code' => 'PE_HEALTH_HUMSS_3', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Practical Research 1', 'code' => 'PRAC_RES_1_HUMSS', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'English for Academic and Professional Purposes', 'code' => 'EAPP_HUMSS', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Philippine Politics and Governance', 'code' => 'PPG', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Trends, Networks and Critical Thinking in the 21st Century', 'code' => 'TRENDS_21ST', 'prerequisites' => 'Introduction to the Philosophy of the Human Person/Pambungad sa Pilosopiya ng Tao', 'corequisites' => null],
                        ['name' => 'Creative Non-Fiction', 'code' => 'CREATIVE_NONFIC', 'prerequisites' => 'Creative Writing/Malikhaing Pagsulat', 'corequisites' => null],
                    ],
                    2 => [
                        ['name' => 'Media and Information Literacy', 'code' => 'MIL_HUMSS', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Contemporary Philippine Arts from the regions', 'code' => 'CPAR_HUMSS', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Physical Education and Health', 'code' => 'PE_HEALTH_HUMSS_4', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Practical Research 2', 'code' => 'PRAC_RES_2_HUMSS', 'prerequisites' => 'Practical Research 1, Statistics and Probability', 'corequisites' => null],
                        ['name' => 'Filipino sa Piling Larang', 'code' => 'FIL_LARANG_HUMSS', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Community Engagement, Solidarity and Citizenship', 'code' => 'COMSCI', 'prerequisites' => 'Disciplines and Ideas in the Social Sciences, Disciplines and Ideas in the Applied Social Sciences, Philippine Politics and Governance', 'corequisites' => null],
                        ['name' => 'Work Immersion/Research/Career Advocacy/Culminating Activity', 'code' => 'WORK_RESEARCH_HUMSS', 'prerequisites' => null, 'corequisites' => null],
                    ]
                ]
            ],
            'ABM' => [
                11 => [
                    1 => [
                        ['name' => 'Oral Communication', 'code' => 'ORAL_COMM_ABM', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Komunikasyon at Pananaliksik sa Wika at Kulturang Pilipino', 'code' => 'KOMUN_FIL_ABM', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'General Mathematics', 'code' => 'GEN_MATH_ABM', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Earth and Life Science', 'code' => 'EARTH_LIFE_SCI_ABM', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => '21st Century Literature from the Philippines and the World', 'code' => '21ST_LIT_ABM', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Physical Education and Health', 'code' => 'PE_HEALTH_ABM_1', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Fundamentals of Accountancy, Business and Management 1', 'code' => 'FABM_1', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Business Ethics and Social Responsibility', 'code' => 'BESR', 'prerequisites' => null, 'corequisites' => null],
                    ],
                    2 => [
                        ['name' => 'Reading and Writing', 'code' => 'READ_WRITE_ABM', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Pagbasa at Pagsusuri ng Iba\'t ibang Teksto Tungo sa Pananaliksik', 'code' => 'PAGBASA_FIL_ABM', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Statistics and Probability', 'code' => 'STAT_PROB_ABM', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Physical Science', 'code' => 'PHYS_SCI_ABM', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Introduction to the Philosophy of the Human Person', 'code' => 'INTRO_PHIL_ABM', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Physical Education and Health', 'code' => 'PE_HEALTH_ABM_2', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Organization and Management', 'code' => 'ORG_MGMT', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Principles of Marketing', 'code' => 'PRIN_MARKETING', 'prerequisites' => 'Organization and Management', 'corequisites' => null],
                        ['name' => 'Fundamentals of Accountancy, Business and Management 1', 'code' => 'FABM_1', 'prerequisites' => null, 'corequisites' => null],
                    ]
                ],
                12 => [
                    1 => [
                        ['name' => 'Personal Development', 'code' => 'PERS_DEV_ABM', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Understanding Culture, Society and Politics', 'code' => 'UCSP_ABM', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Physical Education and Health', 'code' => 'PE_HEALTH_ABM_3', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Practical Research 2', 'code' => 'PRAC_RES_2_ABM', 'prerequisites' => 'Practical Research 1, Statistics and Probability', 'corequisites' => null],
                        ['name' => 'English for Academic and Professional Purposes', 'code' => 'EAPP_ABM', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Fundamentals of Accountancy, Business and Management 2', 'code' => 'FABM_2', 'prerequisites' => 'Fundamentals of Accountancy, Business and Management 1', 'corequisites' => null],
                        ['name' => 'Business Finance', 'code' => 'BUS_FINANCE', 'prerequisites' => 'Fundamentals of Accountancy, Business and Management 2', 'corequisites' => null],
                        ['name' => 'Applied Economics', 'code' => 'APPLIED_ECON', 'prerequisites' => null, 'corequisites' => null],
                    ],
                    2 => [
                        ['name' => 'Media and Information Literacy', 'code' => 'MIL_ABM', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Contemporary Philippine Arts from the regions', 'code' => 'CPAR_ABM', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Physical Education and Health', 'code' => 'PE_HEALTH_ABM_4', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Entrepreneurship', 'code' => 'ENTREP_ABM', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Filipino sa Piling Larang', 'code' => 'FIL_LARANG_ABM', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Business Ethics and Social Responsibility', 'code' => 'BUS_ETHICS', 'prerequisites' => 'Fundamentals of Accountancy, Business and Management 1, Fundamentals of Accountancy, Business and Management 2, Organization and Management', 'corequisites' => null],
                        ['name' => 'Business Enterprise Simulation/Work Immersion', 'code' => 'BUS_ENTERPRISE_SIM', 'prerequisites' => null, 'corequisites' => null],
                    ]
                ]
            ]
        ];
    }

    /**
     * Update the specified subject.
     */
    public function updateSubject(Request $request, Subject $subject)
    {
        $validated = $request->validate([
            'Subject_name' => 'required|string|max:255',
            'Subject_code' => 'required|string|max:20',
            'Semester' => 'required|in:1,2',
            'year_level' => 'required|in:11,12',
            'strand_id' => 'required|exists:strands,id',
            'PREREQUISITES' => 'nullable|string|max:500',
            'CO-REQUISITES' => 'nullable|string|max:500',
        ]);

        // Check uniqueness per school year (excluding current subject)
        $exists = Subject::where('Subject_code', $validated['Subject_code'])
            ->where('school_year_id', $subject->school_year_id)
            ->where('Id', '!=', $subject->Id)
            ->exists();

        if ($exists) {
            return redirect()->route('registrar.subjects')
                ->with('error', 'Subject code already exists for this school year.');
        }

        $subject->update($validated);

        return redirect()->route('registrar.subjects')
            ->with('success', 'Subject updated successfully.');
    }

    /**
     * Remove the specified subject.
     */
    public function destroySubject(Subject $subject)
    {
        // Check if subject is being used in classes
        if ($subject->classes()->count() > 0) {
            return redirect()->route('registrar.subjects')
                ->with('error', 'Cannot delete subject that is assigned to classes.');
        }

        $subject->delete();

        return redirect()->route('registrar.subjects')
            ->with('success', 'Subject deleted successfully.');
    }

    /**
     * Display all strands.
     * Shows which strands are active for the active school year and semester.
     */
    public function strands()
    {
        $activeSchoolYear = SchoolYear::where('is_active', true)->first();
        $activeSemester = $activeSchoolYear ? 
            Semester::where('school_year_id', $activeSchoolYear->id)
                   ->where('is_active', true)
                   ->first() : null;
        
        if (!$activeSchoolYear) {
            return Inertia::render('Registrar/Strands', [
                'strands' => collect(),
                'sections' => collect(),
                'previousSections' => collect(),
                'users' => collect(),
                'activeSchoolYear' => null,
                'activeSemester' => null,
            ])->with('error', 'No active school year. Please activate a school year first.');
        }
        
        // Get all strands with their activation status for the active school year and semester
        $strands = Strand::withCount([
            'sections' => function ($query) use ($activeSchoolYear, $activeSemester) {
                $query->where('school_year_id', $activeSchoolYear->id);
                if ($activeSemester) {
                    $query->where('semester_id', $activeSemester->id);
                }
            },
            'subjects' => function ($query) use ($activeSchoolYear, $activeSemester) {
                $query->where('school_year_id', $activeSchoolYear->id);
                if ($activeSemester) {
                    $query->where('semester_id', $activeSemester->id);
                }
            }
        ])->get()->map(function ($strand) use ($activeSchoolYear, $activeSemester) {
            // Check if strand is active for this school year
            $yearPivot = DB::table('strand_school_year')
                ->where('strand_id', $strand->id)
                ->where('school_year_id', $activeSchoolYear->id)
                ->first();
            
            $strand->is_active_for_year = $yearPivot ? (bool)$yearPivot->is_active : false;
            
            // Check if strand is active for this semester
            if ($activeSemester) {
                $semesterPivot = DB::table('strand_semester')
                    ->where('strand_id', $strand->id)
                    ->where('semester_id', $activeSemester->id)
                    ->first();
                
                $strand->is_active_for_semester = $semesterPivot ? (bool)$semesterPivot->is_active : false;
            } else {
                $strand->is_active_for_semester = false;
            }
            
            return $strand;
        });

        // Get current sections for active school year and semester (only active sections)
        $sections = Section::with(['strand', 'adviser', 'schoolYear', 'semester'])
            ->withCount([
                'enrollments as current_students' => function ($query) {
                    $query->where('status', Enrollment::STATUS_ENROLLED);
                },
            ])
            ->where('school_year_id', $activeSchoolYear->id);
            
        if ($activeSemester) {
            $sections = $sections->where('semester_id', $activeSemester->id);
        }
            
        // Add is_active filter only if the column exists
        try {
            $sections = $sections->where('is_active', true)->get();
        } catch (\Exception $e) {
            // Fallback if is_active column doesn't exist yet
            if (str_contains($e->getMessage(), 'Unknown column') || str_contains($e->getMessage(), 'Column not found')) {
                $sections = $sections->get();
            } else {
                throw $e;
            }
        }
        
        // Get previous sections from other school years AND different semesters for reopening
        // NOTE: We don't filter by is_active here because we want to show all sections available for reopening
        $previousSectionsQuery = Section::with(['strand', 'schoolYear', 'semester'])
            ->withCount([
                'enrollments as current_students' => function ($query) {
                    $query->where('status', Enrollment::STATUS_ENROLLED);
                },
            ]);
        
        if ($activeSemester) {
            // When there's an active semester, include sections from:
            // 1. Different school years
            // 2. Same school year but different semesters
            $previousSectionsQuery->where(function ($query) use ($activeSchoolYear, $activeSemester) {
                $query->where('school_year_id', '!=', $activeSchoolYear->id) // Different school years
                      ->orWhere(function ($subQuery) use ($activeSchoolYear, $activeSemester) {
                          // Same school year but different semester
                          $subQuery->where('school_year_id', $activeSchoolYear->id)
                                   ->where('semester_id', '!=', $activeSemester->id);
                      })
                      ->orWhere(function ($subQuery) use ($activeSchoolYear) {
                          // Same school year with NULL semester_id
                          $subQuery->where('school_year_id', $activeSchoolYear->id)
                                   ->whereNull('semester_id');
                      });
            });
        } else {
            // When no active semester, only show sections from different school years
            $previousSectionsQuery->where('school_year_id', '!=', $activeSchoolYear->id);
        }
        
        $previousSections = $previousSectionsQuery
            ->orderBy('school_year_id', 'desc')
            ->orderBy('semester_id', 'desc')
            ->get()
            ->filter(function ($section) use ($activeSchoolYear, $activeSemester) {
                // Only show sections from strands that are currently active for the semester
                if ($activeSemester && $section->strand_id) {
                    $strandActive = DB::table('strand_semester')
                        ->where('strand_id', $section->strand_id)
                        ->where('semester_id', $activeSemester->id)
                        ->where('is_active', true)
                        ->exists();
                    
                    if (!$strandActive) {
                        return false;
                    }
                }
                
                // Only show sections that don't already have an ACTIVE section with the same name in the current semester
                $existsQuery = Section::where('section_name', $section->section_name)
                    ->where('school_year_id', $activeSchoolYear->id);
                
                if ($activeSemester) {
                    $existsQuery->where('semester_id', $activeSemester->id);
                }
                
                // Only filter out if there's an ACTIVE section with the same name
                // This allows reopening sections even if a disabled section with the same name exists
                try {
                    $existsQuery->where('is_active', true);
                } catch (\Exception $e) {
                    // Fallback if is_active column doesn't exist - use the old logic
                }
                
                return !$existsQuery->exists();
            })
            ->groupBy('section_name')
            ->map(function ($sectionsWithSameName) {
                // For sections with the same name, only return the most recent one
                return $sectionsWithSameName->sortByDesc(function ($section) {
                    return ($section->school_year_id * 1000) + ($section->semester_id ?? 0);
                })->first();
            })
            ->values(); // Reset array keys

        // Get faculty users for section advisers
        $users = User::where('Role', 'Faculty')->get(['id', 'FirstName', 'MiddleName', 'LastName', 'Role']);

        return Inertia::render('Registrar/Strands', [
            'strands' => $strands,
            'sections' => $sections,
            'previousSections' => $previousSections,
            'users' => $users,
            'activeSchoolYear' => $activeSchoolYear,
            'activeSemester' => $activeSemester,
        ]);
    }

    /**
     * Store a newly created strand.
     */
    public function storeStrand(Request $request)
    {
        $validated = $request->validate([
            'Strand_code' => 'required|string|max:10|unique:strands,Strand_code',
            'Strand_name' => 'required|string|max:255',
            'Is_active' => 'boolean',
        ]);

        Strand::create($validated);

        return redirect()->route('registrar.strands')
            ->with('success', 'Strand created successfully.');
    }

    /**
     * Update the specified strand.
     */
    public function updateStrand(Request $request, Strand $strand)
    {
        $validated = $request->validate([
            'Strand_code' => 'required|string|max:10|unique:strands,Strand_code,' . $strand->id,
            'Strand_name' => 'required|string|max:255',
            'Is_active' => 'boolean',
        ]);

        $strand->update($validated);

        return redirect()->route('registrar.strands')
            ->with('success', 'Strand updated successfully.');
    }

    /**
     * Toggle the active status of the specified strand for the active school year.
     */
    public function toggleStrand(Strand $strand)
    {
        $activeSchoolYear = SchoolYear::where('is_active', true)->first();
        
        if (!$activeSchoolYear) {
            return redirect()->route('registrar.strands')
                ->with('error', 'No active school year. Please activate a school year first.');
        }

        // Check if relationship exists
        $pivot = DB::table('strand_school_year')
            ->where('strand_id', $strand->id)
            ->where('school_year_id', $activeSchoolYear->id)
            ->first();

        $newStatus = $pivot ? !(bool)$pivot->is_active : true;

        if ($pivot) {
            // Update existing relationship
            DB::table('strand_school_year')
                ->where('strand_id', $strand->id)
                ->where('school_year_id', $activeSchoolYear->id)
                ->update([
                    'is_active' => $newStatus,
                    'updated_at' => now(),
                ]);
        } else {
            // Create new relationship
            DB::table('strand_school_year')->insert([
                'strand_id' => $strand->id,
                'school_year_id' => $activeSchoolYear->id,
                'is_active' => $newStatus,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Also activate/deactivate this strand for any active semesters in this school year
        $activeSemesters = Semester::where('school_year_id', $activeSchoolYear->id)
            ->where('is_active', true)
            ->get();
            
        $semesterCount = 0;
        foreach ($activeSemesters as $activeSemester) {
            $semesterPivot = DB::table('strand_semester')
                ->where('strand_id', $strand->id)
                ->where('semester_id', $activeSemester->id)
                ->first();
                
            if ($semesterPivot) {
                // Update existing semester relationship
                DB::table('strand_semester')
                    ->where('strand_id', $strand->id)
                    ->where('semester_id', $activeSemester->id)
                    ->update([
                        'is_active' => $newStatus,
                        'updated_at' => now(),
                    ]);
            } else {
                // Create new semester relationship
                DB::table('strand_semester')->insert([
                    'strand_id' => $strand->id,
                    'semester_id' => $activeSemester->id,
                    'is_active' => $newStatus,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
            $semesterCount++;
        }

        $action = $newStatus ? 'activated' : 'deactivated';
        $semesterMessage = $semesterCount > 0 ? " and for {$semesterCount} active semester(s)" : "";
        
        return redirect()->route('registrar.strands')
            ->with('success', "Strand {$action} successfully for this school year{$semesterMessage}.");
    }

    /**
     * Display all school years.
     */
    public function schoolYears()
    {
        $schoolYears = SchoolYear::with(['semesters'])
            ->withCount(['sections', 'classes'])
            ->orderBy('School_year_start', 'desc')
            ->get();

        return Inertia::render('Registrar/SchoolYears', [
            'schoolYears' => $schoolYears,
        ]);
    }

    /**
     * Store a newly created school year.
     */
    public function storeSchoolYear(Request $request)
    {
        $validated = $request->validate([
            'School_year_start' => 'required|numeric|min:2020|max:2050',
            'School_year_end' => 'required|numeric|min:2021|max:2051',
            'is_active' => 'nullable|boolean',
        ]);

        // Ensure is_active defaults to false if not provided
        $validated['is_active'] = $validated['is_active'] ?? false;

        // Ensure end year is start year + 1
        if ((int)$validated['School_year_end'] !== (int)$validated['School_year_start'] + 1) {
            return redirect()->route('registrar.school-years')
                ->with('error', 'End year must be exactly one year after start year.');
        }

        // Check for duplicate school year
        $exists = SchoolYear::where('School_year_start', $validated['School_year_start'])
            ->where('School_year_end', $validated['School_year_end'])
            ->exists();

        if ($exists) {
            return redirect()->route('registrar.school-years')
                ->with('error', 'This school year already exists.');
        }

        // If setting as active, deactivate all others
        if ($validated['is_active']) {
            SchoolYear::where('is_active', true)->update(['is_active' => false]);
        }

        $schoolYear = SchoolYear::create($validated);

        // Automatically create semesters for the new school year
        $this->createAutomaticSemesters($schoolYear);

        return redirect()->route('registrar.school-years')
            ->with('success', 'School year created successfully with automatic semesters.');
    }

    /**
     * Update the specified school year.
     */
    public function updateSchoolYear(Request $request, SchoolYear $schoolYear)
    {
        $validated = $request->validate([
            'School_year_start' => 'required|numeric|min:2020|max:2050',
            'School_year_end' => 'required|numeric|min:2021|max:2051',
            'is_active' => 'nullable|boolean',
        ]);

        // Ensure is_active defaults to false if not provided
        $validated['is_active'] = $validated['is_active'] ?? false;

        // Ensure end year is start year + 1
        if ((int)$validated['School_year_end'] !== (int)$validated['School_year_start'] + 1) {
            return redirect()->route('registrar.school-years')
                ->with('error', 'End year must be exactly one year after start year.');
        }

        // If setting as active, deactivate all others
        if ($validated['is_active']) {
            SchoolYear::where('is_active', true)
                ->where('id', '!=', $schoolYear->id)
                ->update(['is_active' => false]);
        }

        $schoolYear->update($validated);

        return redirect()->route('registrar.school-years')
            ->with('success', 'School year updated successfully.');
    }

    /**
     * Set a school year as active.
     * NEW school years: Subjects and strands need to be added/activated again.
     * PREVIOUS school years: Shows existing data (sections, subjects, strands) for that year.
     */
    public function activateSchoolYear(SchoolYear $schoolYear)
    {
        if (!$schoolYear->enabled) {
            return redirect()->route('registrar.school-years')
                ->with('error', 'Cannot activate a disabled school year. Please enable it first.');
        }

        try {
            DB::beginTransaction();

            // Get the previously active school year before deactivating
            $previousSchoolYear = SchoolYear::where('is_active', true)->first();
            
            // Deactivate all other school years
            SchoolYear::where('is_active', true)->update(['is_active' => false]);
            
            // Deactivate all semesters from the previous school year
            if ($previousSchoolYear && $previousSchoolYear->id !== $schoolYear->id) {
                Semester::where('school_year_id', $previousSchoolYear->id)
                    ->update(['is_active' => false]);
            }
            
            // Activate the selected school year
            $schoolYear->update(['is_active' => true]);

            // Reset adviser assignments for sections under this school year
            Section::where('school_year_id', $schoolYear->id)
                ->update(['adviser_id' => null]);

            // Check if this is a NEW school year (no existing sections or subjects)
            $hasSections = Section::where('school_year_id', $schoolYear->id)->exists();
            $hasSubjects = Subject::where('school_year_id', $schoolYear->id)->exists();
            $isNewSchoolYear = !$hasSections && !$hasSubjects;

            if ($isNewSchoolYear) {
                // This is a NEW school year
                // Strands and subjects will need to be activated/added manually
                // No automatic reset needed - just mark as new

                DB::commit();

                $message = 'New school year activated successfully!';
                if ($previousSchoolYear && $previousSchoolYear->id !== $schoolYear->id) {
                    $message .= ' All semesters from the previous school year have been deactivated.';
                }
                $message .= ' Please:
                    1. Activate required strands for this school year
                    2. Add subjects for this school year
                    3. Create sections or reopen from previous year';
                
                return redirect()->route('registrar.school-years')
                    ->with('success', $message);
            } else {
                // This is a PREVIOUS school year being reactivated
                // All existing data (sections, subjects, strands) for this year will be visible
                DB::commit();

                $message = 'School year reactivated successfully!';
                if ($previousSchoolYear && $previousSchoolYear->id !== $schoolYear->id) {
                    $message .= ' All semesters from the previous school year have been deactivated.';
                }
                $message .= ' All existing data (sections, subjects, and strands) for this year is now visible.';
                
                return redirect()->route('registrar.school-years')
                    ->with('success', $message);
            }

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->route('registrar.school-years')
                ->with('error', 'Failed to activate school year: ' . $e->getMessage());
        }
    }

    /**
     * Toggle the enabled/disabled status of a school year.
     * Note: This is different from active/inactive. A school year can be disabled but not active.
     */
    public function toggleSchoolYear(SchoolYear $schoolYear)
    {
        // Prevent disabling the currently active school year
        if ($schoolYear->is_active && $schoolYear->enabled) {
            return redirect()->route('registrar.school-years')
                ->with('error', 'Cannot disable the active school year. Please set another year as active first.');
        }

        // Toggle the enabled status
        $newEnabledStatus = !$schoolYear->enabled;
        $action = $newEnabledStatus ? 'enabled' : 'disabled';
        
        $schoolYear->update(['enabled' => $newEnabledStatus]);

        if (!$newEnabledStatus) {
            Semester::where('school_year_id', $schoolYear->id)
                ->update(['is_active' => false]);
        }

        return redirect()->route('registrar.school-years')
            ->with('success', "School year {$schoolYear->School_year_start}-{$schoolYear->School_year_end} {$action} successfully.");
    }

    /**
     * Display all classes.
     * Only shows classes for active school year and active semester.
     * When semester changes, classes reset automatically.
     */
    public function classes()
    {
        // Get active school year and semester
        $activeSchoolYear = SchoolYear::where('is_active', true)->first();
        $activeSemester = $activeSchoolYear ? 
            Semester::where('school_year_id', $activeSchoolYear->id)
                   ->where('is_active', true)
                   ->first() : null;
        
        // Get classes for the active school year and semester only
        // Use left joins to ensure classes show even if relationships are missing
        $classes = ClassModel::with([
            'section.strand', 
            'faculty', 
            'semester', 
            'schoolYear',
            'subject'
        ])
        ->when($activeSchoolYear, function ($query) use ($activeSchoolYear) {
            return $query->where('school_year_id', $activeSchoolYear->id);
        })
        ->when($activeSemester, function ($query) use ($activeSemester) {
            return $query->where('Semester_id', $activeSemester->id);
        })
        ->orderBy('created_at', 'desc')
        ->get();
        
        // Debug logging to help identify issues
        Log::info('Classes query result', [
            'active_school_year_id' => $activeSchoolYear?->id,
            'active_semester_id' => $activeSemester?->id,
            'classes_count' => $classes->count(),
            'class_ids' => $classes->pluck('Id')->toArray(),
        ]);
        
        // Get active sections for the active school year AND semester only
        $sections = Section::with('strand')
            ->where('is_active', true)
            ->when($activeSchoolYear, function ($query) use ($activeSchoolYear) {
                return $query->where('school_year_id', $activeSchoolYear->id);
            })
            ->when($activeSemester, function ($query) use ($activeSemester) {
                return $query->where('semester_id', $activeSemester->id);
            })
            ->orderBy('section_name')
            ->get();
        
        // Format sections to ensure all fields are available for frontend
        $formattedSections = $sections->map(function ($section) {
            return [
                'id' => $section->id,
                'section_name' => $section->section_name ?? $section->SectionName ?? 'Unnamed Section',
                'SectionName' => $section->SectionName ?? $section->section_name ?? 'Unnamed Section',
                'year_level' => $section->year_level,
                'strand_id' => $section->strand_id,
                'strand' => $section->strand ? [
                    'id' => $section->strand->id,
                    'Strand_name' => $section->strand->Strand_name,
                    'Strand_code' => $section->strand->Strand_code,
                ] : null,
                'school_year_id' => $section->school_year_id,
                'semester_id' => $section->semester_id,
                'is_active' => $section->is_active,
            ];
        });
        
        // Debug: Log section count for troubleshooting
        Log::info('Sections query result', [
            'active_school_year_id' => $activeSchoolYear?->id,
            'active_semester_id' => $activeSemester?->id,
            'sections_count' => $sections->count(),
            'section_ids' => $sections->pluck('id')->toArray(),
            'section_names' => $sections->pluck('section_name')->toArray(),
        ]);
            
        $faculty = User::where('Role', 'Faculty')->get();
        
        // Calculate current faculty loads (unique sections per faculty) for the active semester
        $facultyLoads = [];
        if ($activeSchoolYear && $activeSemester) {
            $facultyClasses = ClassModel::where('school_year_id', $activeSchoolYear->id)
                ->where('Semester_id', $activeSemester->id)
                ->where('is_active', true)
                ->select('faculty_id', 'Section_id')
                ->get();
            
            foreach ($facultyClasses as $class) {
                if ($class->faculty_id) {
                    if (!isset($facultyLoads[$class->faculty_id])) {
                        $facultyLoads[$class->faculty_id] = [];
                    }
                    if (!in_array($class->Section_id, $facultyLoads[$class->faculty_id])) {
                        $facultyLoads[$class->faculty_id][] = $class->Section_id;
                    }
                }
            }
            
            // Convert to count format and ensure keys are strings for frontend consistency
            $facultyLoadsFormatted = [];
            foreach ($facultyLoads as $facultyId => $sections) {
                $facultyLoadsFormatted[(string)$facultyId] = count($sections);
            }
            $facultyLoads = $facultyLoadsFormatted;
        }
        
        // Get only active semesters for the active school year
        $semesters = Semester::with('schoolYear')
            ->when($activeSchoolYear, function ($query) use ($activeSchoolYear) {
                return $query->where('school_year_id', $activeSchoolYear->id)
                           ->where('is_active', true);
            })
            ->get();
            
        // Get only active school years
        $schoolYears = SchoolYear::where('is_active', true)
            ->orderBy('School_year_start', 'desc')
            ->get();
        
        // Get subjects for the active school year AND active semester only
        // This ensures subjects from 1st semester don't show in 2nd semester
        $subjects = Subject::with(['strand', 'semester'])
            ->when($activeSchoolYear, function ($query) use ($activeSchoolYear) {
                return $query->where('school_year_id', $activeSchoolYear->id);
            })
            ->when($activeSemester, function ($query) use ($activeSemester) {
                return $query->where('semester_id', $activeSemester->id);
            })
            ->get();

        // Find previous semester to check if classes can be copied
        // Priority: Always prefer 1st Semester if it exists, then 2nd Semester, then Summer
        $previousSemester = null;
        if ($activeSchoolYear && $activeSemester) {
            $previousSemester = Semester::where('school_year_id', $activeSchoolYear->id)
                ->where('id', '!=', $activeSemester->id)
                ->orderByRaw("
                    CASE 
                        WHEN semester_type = '1st Semester' THEN 1
                        WHEN semester_type = '2nd Semester' THEN 2
                        WHEN semester_type = 'Summer' THEN 3
                        ELSE 4
                    END ASC
                ")
                ->orderBy('start_date', 'asc')
                ->orderBy('id', 'asc')
                ->first();
        }

        // Format times to H:i format (remove seconds if present) for frontend
        $formattedClasses = $classes->map(function ($class) {
            $classArray = $class->toArray();
            
            // Normalize start_time to H:i format
            if (!empty($classArray['start_time'])) {
                $time = is_string($classArray['start_time']) 
                    ? $classArray['start_time'] 
                    : $class->start_time;
                if ($time) {
                    // Remove seconds if present (e.g., "07:00:00" -> "07:00")
                    $classArray['start_time'] = substr($time, 0, 5);
                }
            }
            
            // Normalize endtime to H:i format
            if (!empty($classArray['endtime'])) {
                $time = is_string($classArray['endtime']) 
                    ? $classArray['endtime'] 
                    : $class->endtime;
                if ($time) {
                    // Remove seconds if present (e.g., "07:00:00" -> "07:00")
                    $classArray['endtime'] = substr($time, 0, 5);
                }
            }
            
            return $classArray;
        });

        return Inertia::render('Registrar/Classes', [
            'classes' => $formattedClasses,
            'sections' => $formattedSections, // Use formatted sections
            'faculty' => $faculty,
            'facultyLoads' => $facultyLoads, // Pass current faculty loads
            'semesters' => $semesters,
            'schoolYears' => $schoolYears,
            'subjects' => $subjects,
            'activeSchoolYear' => $activeSchoolYear,
            'activeSemester' => $activeSemester,
            'previousSemester' => $previousSemester ? [
                'id' => $previousSemester->id,
                'semester_type' => $previousSemester->semester_type,
            ] : null,
        ]);
    }

    /**
     * Store a new class.
     */
    public function storeClass(Request $request)
    {
        // Normalize time formats before validation (remove seconds if present)
        $requestData = $request->all();
        if (isset($requestData['start_time']) && strlen($requestData['start_time']) > 5) {
            $requestData['start_time'] = substr($requestData['start_time'], 0, 5);
            $request->merge(['start_time' => $requestData['start_time']]);
        }
        if (isset($requestData['endtime']) && strlen($requestData['endtime']) > 5) {
            $requestData['endtime'] = substr($requestData['endtime'], 0, 5);
            $request->merge(['endtime' => $requestData['endtime']]);
        }

        // Add debug logging to help identify issues
        Log::info('Class creation attempt', [
            'request_data' => $request->all(),
            'user_id' => Auth::id()
        ]);

        $validated = $request->validate([
            'Section_id' => 'required|exists:sections,id',
            'faculty_id' => 'required|exists:users,id',
            'school_year_id' => 'required|exists:school_year,id',
            'Semester_id' => 'required|exists:semester,id',
            'subject_id' => 'required|exists:subjects,Id',
            'day_of_week' => 'required|string|max:100',
            'start_time' => 'required|date_format:H:i',
            'endtime' => 'required|date_format:H:i|after:start_time',
            'is_active' => 'boolean',
        ]);

        // Validate grade level and strand matching between section and subject
        $section = Section::with('strand')->find($validated['Section_id']);
        $subject = Subject::with('strand')->find($validated['subject_id']);
        
        if ($section && $subject) {
            // Check grade level matching
            if ($section->year_level !== $subject->year_level) {
                return back()->withErrors([
                    'subject_id' => "Subject grade level (Grade {$subject->year_level}) must match section grade level (Grade {$section->year_level})"
                ])->withInput();
            }
            
            // Check strand matching
            $sectionStrandId = $section->strand_id ?? $section->strand?->id;
            $subjectStrandId = $subject->strand_id ?? $subject->strand?->id;
            
            if ($sectionStrandId && $subjectStrandId && $sectionStrandId !== $subjectStrandId) {
                $sectionStrandName = $section->strand?->Strand_name ?? 'the selected strand';
                $subjectStrandName = $subject->strand?->Strand_name ?? 'a different strand';
                
                return back()->withErrors([
                    'subject_id' => "Subject belongs to {$subjectStrandName} strand, but section belongs to {$sectionStrandName} strand. Subjects must match the section's strand."
                ])->withInput();
            }
        }

        // Note: We allow the same subject to be scheduled multiple times per week on different days
        // The check for same subject on same day is done separately below
        
        // Check faculty load limit (5 loads maximum per semester)
        // 1 load = 1 section taught by a teacher
        // IMPORTANT: Faculty load is scoped per semester - when a new semester is activated,
        // the load automatically resets because we filter by Semester_id. Classes from previous
        // semesters do not count toward the current semester's load.
        // Count unique sections using a reliable method (get unique section IDs and count them)
        $uniqueSections = ClassModel::where('faculty_id', $validated['faculty_id'])
            ->where('school_year_id', $validated['school_year_id'])
            ->where('Semester_id', $validated['Semester_id'])
            ->where('is_active', true)
            ->pluck('Section_id')
            ->unique()
            ->count();

        $facultyLoadCount = $uniqueSections;

        // Check if the new section is already counted
        $hasExistingSection = ClassModel::where('faculty_id', $validated['faculty_id'])
            ->where('school_year_id', $validated['school_year_id'])
            ->where('Semester_id', $validated['Semester_id'])
            ->where('Section_id', $validated['Section_id'])
            ->where('is_active', true)
            ->exists();

        // If this is a new section for the faculty, check if adding it would exceed the limit
        if (!$hasExistingSection && $facultyLoadCount >= 5) {
            $faculty = User::find($validated['faculty_id']);
            $facultyName = $faculty ? trim(($faculty->FirstName ?? '') . ' ' . ($faculty->LastName ?? '')) : 'This faculty member';
            
            throw ValidationException::withMessages([
                'faculty_id' => "{$facultyName} has reached the maximum load of 5 sections for this semester. Please select another faculty member or remove one of their existing section assignments."
            ]);
        }

        // Check if same subject is already scheduled on the same day for this section
        if ($this->sectionHasSameSubjectOnSameDay(
            $validated['Section_id'],
            $validated['subject_id'],
            $validated['day_of_week'],
            $validated['school_year_id'],
            $validated['Semester_id']
        )) {
            $subject = Subject::find($validated['subject_id']);
            $subjectName = $subject ? $subject->Subject_name : 'This subject';
            throw ValidationException::withMessages([
                'subject_id' => "{$subjectName} is already scheduled on {$validated['day_of_week']} for this section in the current school year and semester.",
            ]);
        }

        // Check for scheduling conflicts
        if ($this->facultyHasScheduleConflict(
            $validated['faculty_id'],
            $validated['day_of_week'],
            $validated['start_time'],
            $validated['endtime'],
            $validated['school_year_id'],
            $validated['Semester_id']
        )) {
            throw ValidationException::withMessages([
                'schedule_conflict' => 'This faculty member already has a class scheduled during this time slot.'
            ]);
        }

        try {
            $class = ClassModel::create($validated);
            
            Log::info('Class created successfully', [
                'class_id' => $class->Id,
                'validated_data' => $validated
            ]);

            return redirect()->route('registrar.classes')
                ->with('success', 'Class created successfully.');
                
        } catch (\Exception $e) {
            Log::error('Class creation failed', [
                'error' => $e->getMessage(),
                'validated_data' => $validated
            ]);
            
            return back()->withErrors([
                'general' => 'Failed to create class. Please try again.'
            ])->withInput();
        }
    }

    /**
     * Store multiple classes at once (bulk creation).
     */
    public function storeBulkClasses(Request $request)
    {
        // Normalize time formats before validation (remove seconds if present)
        $requestData = $request->all();
        if (isset($requestData['classes']) && is_array($requestData['classes'])) {
            foreach ($requestData['classes'] as $index => $classData) {
                if (isset($classData['start_time']) && strlen($classData['start_time']) > 5) {
                    $requestData['classes'][$index]['start_time'] = substr($classData['start_time'], 0, 5);
                }
                if (isset($classData['endtime']) && strlen($classData['endtime']) > 5) {
                    $requestData['classes'][$index]['endtime'] = substr($classData['endtime'], 0, 5);
                }
            }
            $request->merge($requestData);
        }

        $request->validate([
            'classes' => 'required|array|min:1|max:5',
            'classes.*.Section_id' => 'required|exists:sections,id',
            'classes.*.faculty_id' => 'required|exists:users,id',
            'classes.*.school_year_id' => 'required|exists:school_year,id',
            'classes.*.Semester_id' => 'required|exists:semester,id',
            'classes.*.subject_id' => 'required|exists:subjects,Id',
            'classes.*.day_of_week' => 'required|string|max:100',
            'classes.*.start_time' => 'required|date_format:H:i',
            'classes.*.endtime' => 'required|date_format:H:i',
            'classes.*.is_active' => 'boolean',
        ]);

        $classes = $request->input('classes');
        $errors = [];
        $preparedClasses = [];

        // Validate faculty load limit across all submitted classes
        // 1 load = 1 section, so we count unique sections per faculty
        $facultyLoads = [];
        $facultySections = [];
        
        foreach ($classes as $classData) {
            $facultyId = $classData['faculty_id'];
            $schoolYearId = $classData['school_year_id'];
            $semesterId = $classData['Semester_id'];
            $sectionId = $classData['Section_id'];
            
            // Initialize faculty load tracking
            if (!isset($facultyLoads[$facultyId])) {
                // Count existing unique sections for this faculty
                $facultyLoads[$facultyId] = ClassModel::where('faculty_id', $facultyId)
                    ->where('school_year_id', $schoolYearId)
                    ->where('Semester_id', $semesterId)
                    ->where('is_active', true)
                    ->distinct()
                    ->count('Section_id');
                
                // Track existing sections
                $facultySections[$facultyId] = ClassModel::where('faculty_id', $facultyId)
                    ->where('school_year_id', $schoolYearId)
                    ->where('Semester_id', $semesterId)
                    ->where('is_active', true)
                    ->pluck('Section_id')
                    ->unique()
                    ->toArray();
            }
            
            // If this is a new section for the faculty, increment the load count
            if (!in_array($sectionId, $facultySections[$facultyId])) {
            $facultyLoads[$facultyId]++;
                $facultySections[$facultyId][] = $sectionId;
            }
            
            // Check if exceeds limit
            if ($facultyLoads[$facultyId] > 5) {
                $faculty = User::find($facultyId);
                $facultyName = $faculty ? trim(($faculty->FirstName ?? '') . ' ' . ($faculty->LastName ?? '')) : 'Faculty member';
                
                return back()->withErrors([
                    'general' => "{$facultyName} would exceed the maximum load of 5 sections. Please reduce the number of sections or assign to different faculty."
                ])->withInput();
            }
        }

        // Process each class (validate and stage payloads only)
        foreach ($classes as $index => $classData) {
            try {
                // Validate grade level and strand matching
                $section = Section::with('strand')->find($classData['Section_id']);
                $subject = Subject::with('strand')->find($classData['subject_id']);
                
                if ($section && $subject) {
                    // Check grade level matching
                    if ($section->year_level !== $subject->year_level) {
                        $errors["classes.{$index}.subject_id"] = "Grade level mismatch: Subject is for Grade {$subject->year_level} but section is Grade {$section->year_level}";
                        continue;
                    }
                    
                    // Check strand matching
                    $sectionStrandId = $section->strand_id ?? $section->strand?->id;
                    $subjectStrandId = $subject->strand_id ?? $subject->strand?->id;
                    
                    if ($sectionStrandId && $subjectStrandId && $sectionStrandId !== $subjectStrandId) {
                        $sectionStrandName = $section->strand?->Strand_name ?? 'the selected strand';
                        $subjectStrandName = $subject->strand?->Strand_name ?? 'a different strand';
                        
                        $errors["classes.{$index}.subject_id"] = "Strand mismatch: Subject is {$subjectStrandName} but section is {$sectionStrandName}";
                        continue;
                    }
                }

                // Note: We allow the same subject to be scheduled multiple times per week on different days
                // Only check for same subject on same day
                
                // Check same subject on same day
                if ($this->sectionHasSameSubjectOnSameDay(
                    $classData['Section_id'],
                    $classData['subject_id'],
                    $classData['day_of_week'],
                    $classData['school_year_id'],
                    $classData['Semester_id']
                )) {
                    $subjectName = $subject ? $subject->Subject_name : 'This subject';
                    $errors["classes.{$index}.day_of_week"] = "{$subjectName} is already scheduled on {$classData['day_of_week']} for this section";
                    continue;
                }

                // Check faculty schedule conflict
                if ($this->facultyHasScheduleConflict(
                    $classData['faculty_id'],
                    $classData['day_of_week'],
                    $classData['start_time'],
                    $classData['endtime'],
                    $classData['school_year_id'],
                    $classData['Semester_id']
                )) {
                    $faculty = User::find($classData['faculty_id']);
                    $facultyName = $faculty ? "{$faculty->FirstName} {$faculty->LastName}" : 'This faculty';
                    $errors["classes.{$index}.start_time"] = "{$facultyName} already has a class at this time on {$classData['day_of_week']}";
                    continue;
                }

                // Validate end time is after start time
                if ($classData['endtime'] <= $classData['start_time']) {
                    $errors["classes.{$index}.endtime"] = "End time must be after start time";
                    continue;
                }

                // Stage payload for later insertion
                $preparedClasses[] = [
                    'Section_id' => $classData['Section_id'],
                    'faculty_id' => $classData['faculty_id'],
                    'school_year_id' => $classData['school_year_id'],
                    'Semester_id' => $classData['Semester_id'],
                    'subject_id' => $classData['subject_id'],
                    'day_of_week' => $classData['day_of_week'],
                    'start_time' => $classData['start_time'],
                    'endtime' => $classData['endtime'],
                    'is_active' => $classData['is_active'] ?? true,
                ];

            } catch (\Exception $e) {
                Log::error("Bulk class creation error for class {$index}", [
                    'error' => $e->getMessage(),
                    'data' => $classData
                ]);
                $errors["classes.{$index}"] = "Failed to create class: " . $e->getMessage();
            }
        }

        // If there are errors, return them
        if (!empty($errors)) {
            return back()->withErrors($errors)->withInput();
        }

        $createdCount = 0;

        DB::beginTransaction();
        try {
            foreach ($preparedClasses as $payload) {
                ClassModel::create($payload);
                $createdCount++;
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Bulk class creation failed after staging validation', [
                'error' => $e->getMessage(),
            ]);

            return back()->withErrors([
                'general' => 'Failed to create classes due to an unexpected error. Please try again.'
            ])->withInput();
        }

        return redirect()->route('registrar.classes')
            ->with('success', "Successfully created {$createdCount} class(es).");
    }

    /**
     * Update an existing class.
     */
    public function updateClass(Request $request, ClassModel $class)
    {
        // Normalize time formats before validation (remove seconds if present)
        $requestData = $request->all();
        if (isset($requestData['start_time']) && strlen($requestData['start_time']) > 5) {
            $requestData['start_time'] = substr($requestData['start_time'], 0, 5);
            $request->merge(['start_time' => $requestData['start_time']]);
        }
        if (isset($requestData['endtime']) && strlen($requestData['endtime']) > 5) {
            $requestData['endtime'] = substr($requestData['endtime'], 0, 5);
            $request->merge(['endtime' => $requestData['endtime']]);
        }

        $validated = $request->validate([
            'Section_id' => 'required|exists:sections,id',
            'faculty_id' => 'required|exists:users,id',
            'school_year_id' => 'required|exists:school_year,id',
            'Semester_id' => 'required|exists:semester,id',
            'subject_id' => 'required|exists:subjects,Id',
            'day_of_week' => 'required|string|max:100',
            'start_time' => 'required|date_format:H:i',
            'endtime' => 'required|date_format:H:i|after:start_time',
            'is_active' => 'boolean',
        ]);

        // Validate grade level and strand matching between section and subject
        $section = Section::with('strand')->find($validated['Section_id']);
        $subject = Subject::with('strand')->find($validated['subject_id']);
        
        if ($section && $subject) {
            // Check grade level matching
            if ($section->year_level !== $subject->year_level) {
                return back()->withErrors([
                    'subject_id' => "Subject grade level (Grade {$subject->year_level}) must match section grade level (Grade {$section->year_level})"
                ])->withInput();
            }
            
            // Check strand matching
            $sectionStrandId = $section->strand_id ?? $section->strand?->id;
            $subjectStrandId = $subject->strand_id ?? $subject->strand?->id;
            
            if ($sectionStrandId && $subjectStrandId && $sectionStrandId !== $subjectStrandId) {
                $sectionStrandName = $section->strand?->Strand_name ?? 'the selected strand';
                $subjectStrandName = $subject->strand?->Strand_name ?? 'a different strand';
                
                return back()->withErrors([
                    'subject_id' => "Subject belongs to {$subjectStrandName} strand, but section belongs to {$sectionStrandName} strand. Subjects must match the section's strand."
                ])->withInput();
            }
        }

        // Note: We allow the same subject to be scheduled multiple times per week on different days
        // The check for same subject on same day is done separately below
        
        // Check faculty load limit (5 loads maximum per semester), excluding current class
        // 1 load = 1 section taught by a teacher
        $currentSectionId = $class->Section_id;
        $newSectionId = $validated['Section_id'];
        
        // Count unique sections for this faculty (excluding current class)
        $facultyLoadCount = ClassModel::where('faculty_id', $validated['faculty_id'])
            ->where('school_year_id', $validated['school_year_id'])
            ->where('Semester_id', $validated['Semester_id'])
            ->where('is_active', true)
            ->where('Id', '!=', $class->Id)
            ->distinct()
            ->count('Section_id');

        // Check if the new section is already counted (if changing to a different section)
        $hasExistingSection = false;
        if ($newSectionId !== $currentSectionId) {
            $hasExistingSection = ClassModel::where('faculty_id', $validated['faculty_id'])
                ->where('school_year_id', $validated['school_year_id'])
                ->where('Semester_id', $validated['Semester_id'])
                ->where('Section_id', $validated['Section_id'])
                ->where('is_active', true)
                ->where('Id', '!=', $class->Id)
                ->exists();
        }

        // If this is a new section for the faculty, check if it exceeds the limit
        if (!$hasExistingSection && $facultyLoadCount >= 5) {
            $faculty = User::find($validated['faculty_id']);
            $facultyName = $faculty ? trim(($faculty->FirstName ?? '') . ' ' . ($faculty->LastName ?? '')) : 'This faculty member';
            
            throw ValidationException::withMessages([
                'faculty_id' => "{$facultyName} has reached the maximum load of 5 sections for this semester. Please select another faculty member or remove one of their existing section assignments."
            ]);
        }

        // Check if same subject is already scheduled on the same day for this section (excluding current class)
        if ($this->sectionHasSameSubjectOnSameDay(
            $validated['Section_id'],
            $validated['subject_id'],
            $validated['day_of_week'],
            $validated['school_year_id'],
            $validated['Semester_id'],
            $class->Id
        )) {
            $subject = Subject::find($validated['subject_id']);
            $subjectName = $subject ? $subject->Subject_name : 'This subject';
            throw ValidationException::withMessages([
                'subject_id' => "{$subjectName} is already scheduled on {$validated['day_of_week']} for this section in the current school year and semester.",
            ]);
        }

        // Check for scheduling conflicts (excluding current class)
        if ($this->facultyHasScheduleConflict(
            $validated['faculty_id'],
            $validated['day_of_week'],
            $validated['start_time'],
            $validated['endtime'],
            $validated['school_year_id'],
            $validated['Semester_id'],
            $class->Id
        )) {
            throw ValidationException::withMessages([
                'schedule_conflict' => 'This faculty member already has a class scheduled during this time slot.'
            ]);
        }

        $class->update($validated);

        return redirect()->route('registrar.classes')
            ->with('success', 'Class updated successfully.');
    }

    /**
     * Determine if a faculty member already has a class that overlaps the supplied window.
     */
    private function facultyHasScheduleConflict(
        int $facultyId,
        string $dayOfWeek,
        string $startTime,
        string $endTime,
        int $schoolYearId,
        int $semesterId,
        ?int $ignoreClassId = null
    ): bool {
        return ClassModel::where('faculty_id', $facultyId)
            ->where('day_of_week', $dayOfWeek)
            ->where('school_year_id', $schoolYearId)
            ->where('Semester_id', $semesterId)
            ->when($ignoreClassId, fn ($query) => $query->where('Id', '!=', $ignoreClassId))
            ->where(function ($query) use ($startTime, $endTime) {
                $query->whereBetween('start_time', [$startTime, $endTime])
                    ->orWhereBetween('endtime', [$startTime, $endTime])
                    ->orWhere(function ($q) use ($startTime, $endTime) {
                        $q->where('start_time', '<=', $startTime)
                          ->where('endtime', '>=', $endTime);
                    })
                    ->orWhere(function ($q) use ($startTime, $endTime) {
                        $q->where('start_time', $startTime)
                          ->where('endtime', $endTime);
                    });
            })
            ->exists();
    }

    /**
     * Determine if a section already has this subject scheduled for the given
     * school year and semester.
     *
     * Once a subject is offered to a section in a term, it should not be
     * added again (prevents duplicate subject entries and same subject+time).
     */
    private function sectionHasSubjectConflict(
        int $sectionId,
        int $subjectId,
        int $schoolYearId,
        int $semesterId,
        ?int $ignoreClassId = null
    ): bool {
        return ClassModel::where('Section_id', $sectionId)
            ->where('subject_id', $subjectId)
            ->where('school_year_id', $schoolYearId)
            ->where('Semester_id', $semesterId)
            ->where('is_active', true)
            ->when($ignoreClassId, fn ($query) => $query->where('Id', '!=', $ignoreClassId))
            ->exists();
    }

    /**
     * Determine if a section already has this subject scheduled on the same day
     * for the given school year and semester.
     *
     * Prevents scheduling the same subject on the same day in the same section.
     */
    private function sectionHasSameSubjectOnSameDay(
        int $sectionId,
        int $subjectId,
        string $dayOfWeek,
        int $schoolYearId,
        int $semesterId,
        ?int $ignoreClassId = null
    ): bool {
        return ClassModel::where('Section_id', $sectionId)
            ->where('subject_id', $subjectId)
            ->where('day_of_week', $dayOfWeek)
            ->where('school_year_id', $schoolYearId)
            ->where('Semester_id', $semesterId)
            ->where('is_active', true)
            ->when($ignoreClassId, fn ($query) => $query->where('Id', '!=', $ignoreClassId))
            ->exists();
    }

    /**
     * Toggle class active status.
     */
    public function toggleClass(ClassModel $class)
    {
        $class->update(['is_active' => !$class->is_active]);

        $status = $class->is_active ? 'activated' : 'deactivated';
        
        return redirect()->route('registrar.classes')
            ->with('success', "Class {$status} successfully.");
    }

    /**
     * Delete a class.
     */
    public function destroyClass(ClassModel $class)
    {
        $class->delete();

        return redirect()->route('registrar.classes')
            ->with('success', 'Class deleted successfully.');
    }

    /**
     * Display registrar profile.
     */
    public function profile()
    {
        /** @var User|null $user */
        $user = Auth::user();
        
        if (!$user) {
            return redirect()->route('login');
        }
        
        $registrar = User::find($user->id);

        return Inertia::render('Registrar/Profile', [
            'registrar' => $registrar,
        ]);
    }

    /**
     * Update registrar profile.
     */
    public function updateProfile(Request $request)
    {
        /** @var User|null $user */
        $user = Auth::user();
        
        if (!$user) {
            return redirect()->route('login');
        }
        
        
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

        return redirect()->route('registrar.profile')
            ->with('success', 'Profile updated successfully.');
    }

    /**
     * Store a newly created semester for a school year.
     */
    public function storeSemester(Request $request)
    {
        $validated = $request->validate([
            'school_year_id' => 'required|exists:school_year,id',
            'semester_type' => 'required|in:1st Semester,2nd Semester,Summer',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after:start_date',
            'is_active' => 'boolean',
        ]);

        // Check if semester type already exists for this school year
        $exists = Semester::where('school_year_id', $validated['school_year_id'])
            ->where('semester_type', $validated['semester_type'])
            ->exists();

        if ($exists) {
            return redirect()->route('registrar.school-years')
                ->with('error', 'This semester type already exists for this school year.');
        }

        // Auto-calculate semester dates based on what's provided
        $schoolYear = SchoolYear::find($validated['school_year_id']);
        
        if (empty($validated['start_date']) && empty($validated['end_date'])) {
            // Both empty: Use default school year-based calculation
            $calculatedDates = $this->calculateSemesterDates($schoolYear, $validated['semester_type']);
            $validated['start_date'] = $calculatedDates['start_date'];
            $validated['end_date'] = $calculatedDates['end_date'];
        } elseif (!empty($validated['start_date']) && empty($validated['end_date'])) {
            // Start date provided, calculate end date (5 months later for regular semesters, 2 months for summer)
            $startDate = Carbon::parse($validated['start_date']);
            $monthsToAdd = $validated['semester_type'] === 'Summer' ? 2 : 5;
            $validated['end_date'] = $startDate->copy()->addMonths($monthsToAdd)->subDay()->format('Y-m-d');
        } elseif (empty($validated['start_date']) && !empty($validated['end_date'])) {
            // End date provided, calculate start date (5 months earlier for regular semesters, 2 months for summer)
            $endDate = Carbon::parse($validated['end_date']);
            $monthsToSubtract = $validated['semester_type'] === 'Summer' ? 2 : 5;
            $validated['start_date'] = $endDate->copy()->subMonths($monthsToSubtract)->addDay()->format('Y-m-d');
        }
        // If both dates are provided, use them as-is (no calculation needed)

        Semester::create($validated);

        return redirect()->route('registrar.school-years')
            ->with('success', 'Semester created successfully.');
    }

    /**
     * Automatically create semesters for a new school year with intelligent date calculation.
     */
    private function createAutomaticSemesters(SchoolYear $schoolYear)
    {
        // Get the most recent previous school year
        $previousSchoolYear = SchoolYear::where('School_year_start', '<', $schoolYear->School_year_start)
            ->orderBy('School_year_start', 'desc')
            ->first();

        if ($previousSchoolYear) {
            // Get the 2nd semester from the previous school year
            $previousSecondSemester = Semester::where('school_year_id', $previousSchoolYear->id)
                ->where('semester_type', '2nd Semester')
                ->first();

            if ($previousSecondSemester && $previousSecondSemester->end_date) {
                // Calculate dates based on previous school year's 2nd semester end date
                $this->createSemestersFromPreviousYear($schoolYear, $previousSecondSemester->end_date);
            } else {
                // Fallback to current date if no previous 2nd semester found
                $this->createSemestersFromCurrentDate($schoolYear);
            }
        } else {
            // This is the first school year, start from current date
            $this->createSemestersFromCurrentDate($schoolYear);
        }
    }

    /**
     * Create semesters based on previous school year's 2nd semester end date.
     */
    private function createSemestersFromPreviousYear(SchoolYear $schoolYear, $previousSecondSemesterEndDate)
    {
        $previousEndDate = Carbon::parse($previousSecondSemesterEndDate);
        
        // 1st semester starts 2 months after the previous 2nd semester ends (summer break)
        $firstSemesterStartDate = $previousEndDate->copy()->addMonths(2);
        $firstSemesterEndDate = $firstSemesterStartDate->copy()->addMonths(5)->subDay(); // 5 months for regular semester
        
        // 2nd semester starts 2 weeks after 1st semester ends
        $secondSemesterStartDate = $firstSemesterEndDate->copy()->addWeeks(2);
        $secondSemesterEndDate = $secondSemesterStartDate->copy()->addMonths(5)->subDay(); // 5 months for regular semester
        
        // Summer starts 1 week after 2nd semester ends (within the same school year)
        $summerStartDate = $secondSemesterEndDate->copy()->addWeek();
        $summerEndDate = $summerStartDate->copy()->addMonths(2)->subDay(); // 2 months for summer

        // Create the semesters in chronological order
        Semester::create([
            'school_year_id' => $schoolYear->id,
            'semester_type' => '1st Semester',
            'start_date' => $firstSemesterStartDate->format('Y-m-d'),
            'end_date' => $firstSemesterEndDate->format('Y-m-d'),
            'is_active' => true, // Set 1st semester as active by default
        ]);

        Semester::create([
            'school_year_id' => $schoolYear->id,
            'semester_type' => '2nd Semester',
            'start_date' => $secondSemesterStartDate->format('Y-m-d'),
            'end_date' => $secondSemesterEndDate->format('Y-m-d'),
            'is_active' => false,
        ]);

        Semester::create([
            'school_year_id' => $schoolYear->id,
            'semester_type' => 'Summer',
            'start_date' => $summerStartDate->format('Y-m-d'),
            'end_date' => $summerEndDate->format('Y-m-d'),
            'is_active' => false,
        ]);
    }

    /**
     * Create semesters starting from current date (for first school year or fallback).
     */
    private function createSemestersFromCurrentDate(SchoolYear $schoolYear)
    {
        $currentDate = Carbon::now();
        
        // 1st semester starts from current date
        $firstSemesterStartDate = $currentDate->copy();
        $firstSemesterEndDate = $firstSemesterStartDate->copy()->addMonths(5)->subDay();
        
        // 2nd semester starts 2 weeks after 1st semester ends
        $secondSemesterStartDate = $firstSemesterEndDate->copy()->addWeeks(2);
        $secondSemesterEndDate = $secondSemesterStartDate->copy()->addMonths(5)->subDay();
        
        // Summer starts 1 week after 2nd semester ends (within the same school year)
        $summerStartDate = $secondSemesterEndDate->copy()->addWeek();
        $summerEndDate = $summerStartDate->copy()->addMonths(2)->subDay(); // 2 months for summer

        // Create the semesters in chronological order
        Semester::create([
            'school_year_id' => $schoolYear->id,
            'semester_type' => '1st Semester',
            'start_date' => $firstSemesterStartDate->format('Y-m-d'),
            'end_date' => $firstSemesterEndDate->format('Y-m-d'),
            'is_active' => true, // Set 1st semester as active by default
        ]);

        Semester::create([
            'school_year_id' => $schoolYear->id,
            'semester_type' => '2nd Semester',
            'start_date' => $secondSemesterStartDate->format('Y-m-d'),
            'end_date' => $secondSemesterEndDate->format('Y-m-d'),
            'is_active' => false,
        ]);

        Semester::create([
            'school_year_id' => $schoolYear->id,
            'semester_type' => 'Summer',
            'start_date' => $summerStartDate->format('Y-m-d'),
            'end_date' => $summerEndDate->format('Y-m-d'),
            'is_active' => false,
        ]);
    }

    /**
     * Calculate semester dates based on school year and semester type.
     * Each semester is 5 months long.
     */
    private function calculateSemesterDates(SchoolYear $schoolYear, string $semesterType): array
    {
        // Start from the beginning of the school year (June)
        $schoolYearStart = Carbon::createFromFormat('Y', $schoolYear->School_year_start)->month(6)->day(1);
        
        switch ($semesterType) {
            case '1st Semester':
                // June to October (5 months)
                $startDate = $schoolYearStart->copy();
                $endDate = $startDate->copy()->addMonths(5)->subDay();
                break;
                
            case '2nd Semester':
                // November to March (5 months)
                $startDate = $schoolYearStart->copy()->addMonths(5);
                $endDate = $startDate->copy()->addMonths(5)->subDay();
                break;
                
            case 'Summer':
                // April to May (2 months for summer)
                $startDate = $schoolYearStart->copy()->addMonths(10);
                $endDate = $startDate->copy()->addMonths(2)->subDay();
                break;
                
            default:
                // Fallback to 5 months from school year start
                $startDate = $schoolYearStart->copy();
                $endDate = $startDate->copy()->addMonths(5)->subDay();
                break;
        }

        return [
            'start_date' => $startDate->format('Y-m-d'),
            'end_date' => $endDate->format('Y-m-d'),
        ];
    }

    /**
     * Update the specified semester.
     */
    public function updateSemester(Request $request, Semester $semester)
    {
        $validated = $request->validate([
            'semester_type' => 'required|in:1st Semester,2nd Semester,Summer',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after:start_date',
            'is_active' => 'boolean',
        ]);

        // Check if semester type already exists for this school year (excluding current)
        $exists = Semester::where('school_year_id', $semester->school_year_id)
            ->where('semester_type', $validated['semester_type'])
            ->where('id', '!=', $semester->id)
            ->exists();

        if ($exists) {
            return redirect()->route('registrar.school-years')
                ->with('error', 'This semester type already exists for this school year.');
        }

        $semester->update($validated);

        return redirect()->route('registrar.school-years')
            ->with('success', 'Semester updated successfully.');
    }

    /**
     * Toggle active status of the specified semester.
     */
    public function toggleSemester(Semester $semester)
    {
        $schoolYear = $semester->schoolYear;

        if (!$schoolYear || !$schoolYear->enabled) {
            return redirect()->route('registrar.school-years')
                ->with('error', 'Cannot modify semesters for a disabled school year. Please enable the school year first.');
        }

        $newStatus = !$semester->is_active;
        
        try {
            DB::beginTransaction();
            
            if ($newStatus) {
                // If activating this semester, deactivate all other semesters in the same school year
                Semester::where('school_year_id', $semester->school_year_id)
                    ->where('id', '!=', $semester->id)
                    ->update(['is_active' => false]);
            }
            
            // Update this semester's status
            $semester->update(['is_active' => $newStatus]);
            
            DB::commit();
            
            $action = $newStatus ? 'activated' : 'deactivated';
            $message = "Semester {$action} successfully.";
            
            if ($newStatus) {
                $message .= " Other semesters in this school year have been deactivated.";
            }
            
            return redirect()->route('registrar.school-years')
                ->with('success', $message);
                
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->route('registrar.school-years')
                ->with('error', 'Failed to toggle semester: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified semester (kept for backwards compatibility, but not used).
     */
    public function destroySemester(Semester $semester)
    {
        $semester->delete();

        return redirect()->route('registrar.school-years')
            ->with('success', 'Semester deleted successfully.');
    }

    /**
     * Get calculated semester dates for a given school year and semester type.
     * Used by frontend to show auto-calculated dates.
     */
    public function getCalculatedSemesterDates(Request $request)
    {
        $request->validate([
            'school_year_id' => 'required|exists:school_year,id',
            'semester_type' => 'required|in:1st Semester,2nd Semester,Summer',
        ]);

        $schoolYear = SchoolYear::find($request->school_year_id);
        $calculatedDates = $this->calculateSemesterDates($schoolYear, $request->semester_type);

        return response()->json($calculatedDates);
    }

    /**
     * Activate a semester and reset data (similar to school year rollover).
     * When a new semester opens:
     * 1. Deactivate all other semesters in the school year
     * 2. Reset strands (need manual reactivation for semester)
     * 3. Clear subjects and sections for the new semester
     */
    public function activateSemester(Semester $semester)
    {
        $schoolYear = $semester->schoolYear;

        if (!$schoolYear || !$schoolYear->enabled) {
            return redirect()->route('registrar.school-years')
                ->with('error', 'Cannot activate a semester for a disabled school year. Please enable the school year first.');
        }

        try {
            DB::beginTransaction();
            
            // Deactivate all other semesters in the same school year
            Semester::where('school_year_id', $semester->school_year_id)
                ->where('id', '!=', $semester->id)
                ->update(['is_active' => false]);
            
            // Activate the selected semester
            $semester->update(['is_active' => true]);
            
            // Auto-activate strands that were active in the previous semester
            $schoolYear = SchoolYear::find($semester->school_year_id);
            if ($schoolYear) {
                $allStrandIds = Strand::pluck('id');

                // Determine the baseline status for each strand (active/inactive)
                $previousSemester = Semester::where('school_year_id', $semester->school_year_id)
                    ->where('id', '!=', $semester->id)
                    ->orderBy('id', 'desc')
                    ->first();

                if ($previousSemester) {
                    $statusByStrand = DB::table('strand_semester')
                        ->where('semester_id', $previousSemester->id)
                        ->pluck('is_active', 'strand_id')
                        ->map(fn ($value) => (bool) $value);
                } else {
                    $statusByStrand = DB::table('strand_school_year')
                        ->where('school_year_id', $semester->school_year_id)
                        ->pluck('is_active', 'strand_id')
                        ->map(fn ($value) => (bool) $value);

                    if ($statusByStrand->isEmpty()) {
                        $statusByStrand = Strand::pluck('Is_active', 'id')
                            ->map(fn ($value) => (bool) $value);
                    }
                }

                // Reset existing records for the semester to avoid stale states
                DB::table('strand_semester')
                    ->where('semester_id', $semester->id)
                    ->delete();

                $timestamp = now();
                $records = [];

                foreach ($allStrandIds as $strandId) {
                    $isActive = (bool) ($statusByStrand[$strandId] ?? false);
                    $records[] = [
                        'strand_id' => $strandId,
                        'semester_id' => $semester->id,
                        'is_active' => $isActive,
                        'created_at' => $timestamp,
                        'updated_at' => $timestamp,
                    ];
                }

                if (!empty($records)) {
                    DB::table('strand_semester')->insert($records);
                }

                $activatedStrandCount = collect($records)->where('is_active', true)->count();
            } else {
                $activatedStrandCount = 0;
            }
            
            DB::commit();
            
            return redirect()->route('registrar.school-years')
                ->with('success', "Semester '{$semester->semester_type}' activated successfully. {$activatedStrandCount} strands have been automatically activated for this semester.");
                
        } catch (\Exception $e) {
            DB::rollBack();
            
            return redirect()->route('registrar.school-years')
                ->with('error', 'An error occurred while activating the semester. Please try again.');
        }
    }


    /**
     * Get unique time slots from previous semester for copying schedule structure.
     * Returns only day_of_week, start_time, and endtime (no faculty/subject).
     */
    public function getTimeSlotsFromPreviousSemester(Request $request)
    {
        $activeSchoolYear = SchoolYear::where('is_active', true)->first();
        $activeSemester = $activeSchoolYear ? 
            Semester::where('school_year_id', $activeSchoolYear->id)
                   ->where('is_active', true)
                   ->first() : null;
        
        if (!$activeSemester) {
            return response()->json([
                'success' => false,
                'message' => 'No active semester found.'
            ], 400);
        }

        // Find the previous semester (prefer 1st Semester)
        $previousSemester = Semester::where('school_year_id', $activeSchoolYear->id)
            ->where('id', '!=', $activeSemester->id)
            ->orderByRaw("
                CASE 
                    WHEN semester_type = '1st Semester' THEN 1
                    WHEN semester_type = '2nd Semester' THEN 2
                    WHEN semester_type = 'Summer' THEN 3
                    ELSE 4
                END ASC
            ")
            ->orderBy('start_date', 'asc')
            ->orderBy('id', 'asc')
            ->first();

        if (!$previousSemester) {
            return response()->json([
                'success' => false,
                'message' => 'No previous semester found to copy time slots from.'
            ], 404);
        }

        // Get unique time slot combinations from previous semester
        $timeSlots = ClassModel::where('school_year_id', $activeSchoolYear->id)
            ->where('Semester_id', $previousSemester->id)
            ->where('is_active', true)
            ->select('day_of_week', 'start_time', 'endtime')
            ->distinct()
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get()
            ->map(function ($class) {
                // Normalize time format to H:i (remove seconds if present)
                // Access raw attributes to avoid datetime casting issues
                $normalizeTime = function ($time, $rawValue = null) {
                    if (!$time && !$rawValue) return '';
                    
                    // Prefer raw value if available (avoids datetime casting issues)
                    $timeToProcess = $rawValue ?? $time;
                    
                    // Handle Carbon/datetime objects first
                    if ($timeToProcess instanceof \DateTime || $timeToProcess instanceof \Carbon\Carbon) {
                        return $timeToProcess->format('H:i');
                    }
                    
                    // Handle different time formats
                    $timeStr = is_string($timeToProcess) ? $timeToProcess : (string)$timeToProcess;
                    $timeStr = trim($timeStr);
                    
                    // Remove seconds if present (e.g., "07:00:00" -> "07:00")
                    if (strlen($timeStr) > 5 && strpos($timeStr, ':') !== false) {
                        $timeStr = substr($timeStr, 0, 5);
                    }
                    
                    // Validate format: should be HH:MM
                    if (!preg_match('/^\d{1,2}:\d{2}$/', $timeStr)) {
                        // Try to fix common issues
                        // If it's 4 digits without colon (e.g., "2013"), add colon
                        if (preg_match('/^\d{4}$/', $timeStr)) {
                            $timeStr = substr($timeStr, 0, 2) . ':' . substr($timeStr, 2, 2);
                        } else {
                            Log::warning('Invalid time format in getTimeSlotsFromPreviousSemester', [
                                'original' => $time,
                                'raw' => $rawValue,
                                'normalized' => $timeStr
                            ]);
                            return '';
                        }
                    }
                    
                    return $timeStr;
                };
                
                // Get raw values to avoid datetime casting issues
                $rawStartTime = $class->getRawOriginal('start_time');
                $rawEndTime = $class->getRawOriginal('endtime');
                
                return [
                    'day_of_week' => $class->day_of_week,
                    'start_time' => $normalizeTime($class->start_time, $rawStartTime),
                    'endtime' => $normalizeTime($class->endtime, $rawEndTime),
                ];
            })
            ->values();

        return response()->json([
            'success' => true,
            'timeSlots' => $timeSlots,
            'previousSemester' => $previousSemester->semester_type,
            'message' => "Found {$timeSlots->count()} unique time slot(s) from {$previousSemester->semester_type} semester."
        ]);
    }


    /**
     * Reopen classes from previous semester to active semester.
     */
    public function reopenClassesForSemester(Request $request)
    {
        $activeSchoolYear = SchoolYear::where('is_active', true)->first();
        $activeSemester = $activeSchoolYear ? 
            Semester::where('school_year_id', $activeSchoolYear->id)
                   ->where('is_active', true)
                   ->first() : null;
        
        if (!$activeSemester) {
            return redirect()->route('registrar.classes')
                ->with('error', 'No active semester. Please activate a semester first.');
        }

        $validated = $request->validate([
            'class_ids' => 'required|array',
            'class_ids.*' => 'exists:class,Id',
        ]);

        $reopenedCount = 0;
        $skippedClasses = [];
        $errorClasses = [];
        
        try {
            DB::beginTransaction();
            
            foreach ($validated['class_ids'] as $classId) {
                $originalClass = ClassModel::find($classId);
                
                if (!$originalClass) {
                    continue;
                }
                
                try {
                    // Check if class already exists for active semester with lock
                    $exists = ClassModel::where('Section_id', $originalClass->Section_id)
                        ->where('faculty_id', $originalClass->faculty_id)
                        ->where('subject_id', $originalClass->subject_id)
                        ->where('school_year_id', $activeSchoolYear->id)
                        ->where('Semester_id', $activeSemester->id)
                        ->where('day_of_week', $originalClass->day_of_week)
                        ->where('start_time', $originalClass->start_time)
                        ->exists();

                    if (!$exists) {
                        ClassModel::create([
                            'Section_id' => $originalClass->Section_id,
                            'faculty_id' => $originalClass->faculty_id,
                            'subject_id' => $originalClass->subject_id,
                            'school_year_id' => $activeSchoolYear->id,
                            'Semester_id' => $activeSemester->id,
                            'day_of_week' => $originalClass->day_of_week,
                            'start_time' => $originalClass->start_time,
                            'endtime' => $originalClass->endtime,
                            'is_active' => true,
                        ]);
                        $reopenedCount++;
                    } else {
                        $skippedClasses[] = "Class {$originalClass->Id}";
                    }
                } catch (\Illuminate\Database\QueryException $e) {
                    $errorClasses[] = "Class {$originalClass->Id}";
                }
            }
            
            DB::commit();
            
            // Build success message with details
            $message = "Successfully reopened {$reopenedCount} classes for the active semester.";
            
            if (!empty($skippedClasses)) {
                $skippedList = implode(', ', $skippedClasses);
                $message .= " Skipped {$skippedList} (already exists).";
            }
            
            if (!empty($errorClasses)) {
                $errorList = implode(', ', $errorClasses);
                $message .= " Failed to reopen {$errorList} due to errors.";
            }
            
            return redirect()->route('registrar.classes')
                ->with('success', $message);
                
        } catch (\Exception $e) {
            DB::rollBack();
            
            return redirect()->route('registrar.classes')
                ->with('error', 'An error occurred while reopening classes. Please try again.');
        }
    }

    /**
     * Reopen sections from previous semester to active semester.
     */
    public function reopenSectionsForSemester(Request $request)
    {
        $activeSchoolYear = SchoolYear::where('is_active', true)->first();
        $activeSemester = $activeSchoolYear ? 
            Semester::where('school_year_id', $activeSchoolYear->id)
                   ->where('is_active', true)
                   ->first() : null;
        
        if (!$activeSemester) {
            return redirect()->route('registrar.strands')
                ->with('error', 'No active semester. Please activate a semester first.');
        }

        $validated = $request->validate([
            'section_ids' => 'required|array',
            'section_ids.*' => 'exists:sections,id',
        ]);

        $reopenedCount = 0;
        $skippedSections = [];
        $errorSections = [];
        
        try {
            DB::beginTransaction();
            
            foreach ($validated['section_ids'] as $sectionId) {
                $originalSection = Section::find($sectionId);
                
                if (!$originalSection) {
                    continue;
                }
                
                try {
                    // Check if an ACTIVE section already exists for active semester with lock
                    $exists = Section::where('section_name', $originalSection->section_name)
                        ->where('school_year_id', $activeSchoolYear->id)
                        ->where('semester_id', $activeSemester->id)
                        ->where('is_active', true) // Only check for active sections to prevent duplicates
                        ->lockForUpdate()
                        ->exists();

                    if (!$exists) {
                        Section::create([
                            'section_name' => $originalSection->section_name,
                            'year_level' => $originalSection->year_level,
                            'strand_id' => $originalSection->strand_id,
                            'max_capacity' => $originalSection->max_capacity,
                            'school_year_id' => $activeSchoolYear->id,
                            'semester_id' => $activeSemester->id,
                            'adviser_id' => null, // Reset adviser for new semester (consistent with new year)
                            'is_active' => true,
                        ]);
                        $reopenedCount++;
                    } else {
                        $skippedSections[] = $originalSection->section_name;
                    }
                } catch (\Illuminate\Database\QueryException $e) {
                    // Handle unique constraint violations gracefully
                    if (str_contains($e->getMessage(), 'sections_name_school_year_unique') || 
                        str_contains($e->getMessage(), 'Duplicate entry')) {
                        $skippedSections[] = $originalSection->section_name;
                    } else {
                        $errorSections[] = $originalSection->section_name;
                    }
                }
            }
            
            DB::commit();
            
            // Build success message with details
            $message = "Successfully reopened {$reopenedCount} sections for the active semester.";
            
            if (!empty($skippedSections)) {
                $skippedList = implode(', ', $skippedSections);
                $message .= " Skipped {$skippedList} (already exists).";
            }
            
            if (!empty($errorSections)) {
                $errorList = implode(', ', $errorSections);
                $message .= " Failed to reopen {$errorList} due to errors.";
            }
            
            return redirect()->route('registrar.strands')
                ->with('success', $message);
                
        } catch (\Exception $e) {
            DB::rollBack();
            
            return redirect()->route('registrar.strands')
                ->with('error', 'An error occurred while reopening sections. Please try again.');
        }
    }


    /**
     * Reopen a single section from previous school year to active school year.
     * Only requires capacity and adviser to be set.
     */
    public function reopenSection(Request $request, Section $section)
    {
        
        $activeSchoolYear = SchoolYear::where('is_active', true)->first();
        $activeSemester = $activeSchoolYear ? 
            Semester::where('school_year_id', $activeSchoolYear->id)
                   ->where('is_active', true)
                   ->first() : null;
        
        if (!$activeSchoolYear) {
            return redirect()->route('registrar.strands')
                ->with('error', 'No active school year. Please activate a school year first.');
        }
        
        if (!$activeSemester) {
            return redirect()->route('registrar.strands')
                ->with('error', 'No active semester. Please activate a semester first.');
        }

        $validated = $request->validate([
            'max_capacity' => 'required|integer|min:1|max:50',
            'adviser_id' => 'nullable|integer',
        ]);

        if (!empty($validated['adviser_id'])) {
            $this->assertAdviserIsAvailable(
                (int) $validated['adviser_id'],
                $activeSchoolYear->id,
                $activeSemester->id
            );
        }

        try {
            DB::beginTransaction();
            
            // Double-check if an ACTIVE section already exists for active school year and semester (prevent race conditions)
            $existsQuery = Section::where('section_name', $section->section_name)
                ->where('school_year_id', $activeSchoolYear->id)
                ->where('semester_id', $activeSemester->id)
                ->lockForUpdate(); // Lock to prevent race conditions
            
            // Only check for active sections - allow reopening if only disabled sections exist
            try {
                $existsQuery->where('is_active', true);
            } catch (\Exception $e) {
                // Fallback if is_active column doesn't exist
            }
            
            $exists = $existsQuery->exists();

            if ($exists) {
                DB::rollBack();
                Log::warning('Section already exists', [
                    'section_name' => $section->section_name,
                    'school_year_id' => $activeSchoolYear->id,
                    'semester_id' => $activeSemester->id,
                    'semester_type' => $activeSemester->semester_type
                ]);
                return redirect()->route('registrar.strands')
                    ->with('error', "Section '{$section->section_name}' already exists for {$activeSemester->semester_type} of {$activeSchoolYear->School_year_start}-{$activeSchoolYear->School_year_end}.");
            }

            // Create new section with same details but for active school year and semester
            Section::create([
                'section_name' => $section->section_name,
                'year_level' => $section->year_level,
                'strand_id' => $section->strand_id,
                'max_capacity' => $validated['max_capacity'],
                'school_year_id' => $activeSchoolYear->id,
                'semester_id' => $activeSemester->id, // Add semester assignment
                'adviser_id' => $validated['adviser_id'] ?? null,
                'is_active' => true, // Ensure the reopened section is active
            ]);
            
            DB::commit();
            
            return redirect()->route('registrar.strands')
                ->with('success', "Section '{$section->section_name}' reopened successfully for the active school year.");
                
        } catch (\Illuminate\Database\QueryException $e) {
            DB::rollBack();
            
            // Check if it's a unique constraint violation
            if (str_contains($e->getMessage(), 'sections_name_school_year_unique') || 
                str_contains($e->getMessage(), 'Duplicate entry')) {
                return redirect()->route('registrar.strands')
                    ->with('error', "Section '{$section->section_name}' already exists for the active school year.");
            }
            
            // Re-throw other database errors
            throw $e;
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Section reopening failed with exception', [
                'section_id' => $section->id,
                'section_name' => $section->section_name,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return redirect()->route('registrar.strands')
                ->with('error', 'An error occurred while reopening the section. Please try again.');
        }
    }

    /**
     * Reopen sections from previous school year to active school year.
     * Only available for the active school year, not for viewing previous years.
     */
    public function reopenSections(Request $request)
    {
        $activeSchoolYear = SchoolYear::where('is_active', true)->first();
        $activeSemester = $activeSchoolYear ? 
            Semester::where('school_year_id', $activeSchoolYear->id)
                   ->where('is_active', true)
                   ->first() : null;
        
        if (!$activeSchoolYear) {
            return redirect()->route('registrar.strands')
                ->with('error', 'No active school year. Please activate a school year first.');
        }
        
        if (!$activeSemester) {
            return redirect()->route('registrar.strands')
                ->with('error', 'No active semester. Please activate a semester first.');
        }

        $validated = $request->validate([
            'section_ids' => 'required|array',
            'section_ids.*' => 'exists:sections,id',
        ]);

        $reopenedCount = 0;
        $skippedSections = [];
        $errorSections = [];
        
        try {
            DB::beginTransaction();
            
            foreach ($validated['section_ids'] as $sectionId) {
                $originalSection = Section::find($sectionId);
                
                if (!$originalSection) {
                    continue;
                }
                
                try {
                    // Check if an ACTIVE section already exists for active school year and semester with lock
                    $exists = Section::where('section_name', $originalSection->section_name)
                        ->where('school_year_id', $activeSchoolYear->id)
                        ->where('semester_id', $activeSemester->id)
                        ->where('is_active', true) // Only check for active sections to prevent duplicates
                        ->lockForUpdate()
                        ->exists();

                    if (!$exists) {
                        Section::create([
                            'section_name' => $originalSection->section_name,
                            'year_level' => $originalSection->year_level,
                            'strand_id' => $originalSection->strand_id,
                            'max_capacity' => $originalSection->max_capacity,
                            'school_year_id' => $activeSchoolYear->id,
                            'semester_id' => $activeSemester->id, // Add semester assignment
                            'adviser_id' => null, // Reset adviser for new year
                            'is_active' => true,
                        ]);
                        $reopenedCount++;
                    } else {
                        $skippedSections[] = $originalSection->section_name;
                    }
                } catch (\Illuminate\Database\QueryException $e) {
                    // Handle unique constraint violations gracefully
                    if (str_contains($e->getMessage(), 'sections_name_school_year_unique') || 
                        str_contains($e->getMessage(), 'Duplicate entry')) {
                        $skippedSections[] = $originalSection->section_name;
                    } else {
                        $errorSections[] = $originalSection->section_name;
                    }
                }
            }
            
            DB::commit();
            
            // Build success message with details
            $message = "Successfully reopened {$reopenedCount} sections for the active school year.";
            
            if (!empty($skippedSections)) {
                $skippedList = implode(', ', $skippedSections);
                $message .= " Skipped {$skippedList} (already exists).";
            }
            
            if (!empty($errorSections)) {
                $errorList = implode(', ', $errorSections);
                $message .= " Failed to reopen {$errorList} due to errors.";
            }
            
            return redirect()->route('registrar.strands')
                ->with('success', $message);
                
        } catch (\Exception $e) {
            DB::rollBack();
            
            return redirect()->route('registrar.strands')
                ->with('error', 'An error occurred while reopening sections. Please try again.');
        }
    }

    /**
     * Activate strands for the active school year.
     */
    public function activateStrandsForNewYear(Request $request)
    {
        $activeSchoolYear = SchoolYear::where('is_active', true)->first();
        
        if (!$activeSchoolYear) {
            return redirect()->route('registrar.strands')
                ->with('error', 'No active school year. Please activate a school year first.');
        }

        $validated = $request->validate([
            'strand_ids' => 'required|array',
            'strand_ids.*' => 'exists:strands,id',
        ]);

        foreach ($validated['strand_ids'] as $strandId) {
            // Check if relationship exists
            $pivot = DB::table('strand_school_year')
                ->where('strand_id', $strandId)
                ->where('school_year_id', $activeSchoolYear->id)
                ->first();

            if ($pivot) {
                // Update existing relationship
                DB::table('strand_school_year')
                    ->where('strand_id', $strandId)
                    ->where('school_year_id', $activeSchoolYear->id)
                    ->update(['is_active' => true, 'updated_at' => now()]);
            } else {
                // Create new relationship
                DB::table('strand_school_year')->insert([
                    'strand_id' => $strandId,
                    'school_year_id' => $activeSchoolYear->id,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
            
            // Also automatically activate this strand for any active semesters in this school year
            $activeSemesters = Semester::where('school_year_id', $activeSchoolYear->id)
                ->where('is_active', true)
                ->get();
                
            foreach ($activeSemesters as $activeSemester) {
                DB::table('strand_semester')->updateOrInsert(
                    [
                        'strand_id' => $strandId,
                        'semester_id' => $activeSemester->id,
                    ],
                    [
                        'is_active' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]
                );
            }
        }

        return redirect()->route('registrar.strands')
            ->with('success', 'Selected strands have been activated for the active school year.');
    }

    // Note: copySubjectsFromPreviousYear method removed - subjects are now static and not tied to school years


    /**
     * Log the current user out and redirect to login.
     */
    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect()->route('login');
    }

    /**
     * Display all faculty members.
     */
    public function faculty()
    {
        try {
            // Get faculty with eager loading - use select to avoid loading unnecessary data
            $facultyQuery = User::where('Role', 'Faculty')
                ->with(['assignedStrand' => function ($query) {
                    $query->select('id', 'Strand_code', 'Strand_name', 'Is_active');
                }])
                ->select('id', 'FirstName', 'MiddleName', 'LastName', 'email', 'Role', 'assigned_strand_id', 'is_coordinator', 'created_at', 'updated_at', 'last_seen_at', 'last_login_at')
                ->orderBy('LastName')
                ->orderBy('FirstName');

            $faculty = $facultyQuery->get()->map(function ($user) {
                try {
                    $lastSeen = $user->last_seen_at;
                    $isOnline = $lastSeen instanceof Carbon && $lastSeen->gt(now()->subMinutes(5));
                    $assignedStrand = null;
                    
                    // Safely access the relationship
                    $strand = $user->relationLoaded('assignedStrand') ? $user->assignedStrand : null;
                    
                    if ($strand && $strand instanceof Strand) {
                        $assignedStrand = [
                            'id' => $strand->id ?? null,
                            'Strand_code' => $strand->Strand_code ?? null,
                            'Strand_name' => $strand->Strand_name ?? null,
                            'Is_active' => $strand->Is_active ?? false,
                        ];
                    }

                    return [
                        'id' => $user->id ?? null,
                        'FirstName' => $user->FirstName ?? '',
                        'MiddleName' => $user->MiddleName ?? null,
                        'LastName' => $user->LastName ?? '',
                        'email' => $user->email ?? '',
                        'Role' => $user->Role ?? 'Faculty',
                        'assigned_strand_id' => $user->assigned_strand_id ?? null,
                        'is_coordinator' => (bool)($user->is_coordinator ?? false),
                        'created_at' => $user->created_at ? $user->created_at->toDateTimeString() : null,
                        'updated_at' => $user->updated_at ? $user->updated_at->toDateTimeString() : null,
                        'last_seen_at' => $lastSeen ? $lastSeen->toIso8601String() : null,
                        'last_login_at' => $user->last_login_at ? $user->last_login_at->toIso8601String() : null,
                        'is_online' => $isOnline,
                        'assignedStrand' => $assignedStrand,
                    ];
                } catch (\Exception $e) {
                    Log::warning('Error mapping faculty user', [
                        'user_id' => $user->id ?? null,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString(),
                    ]);
                    
                    // Return minimal safe data
                    return [
                        'id' => $user->id ?? null,
                        'FirstName' => $user->FirstName ?? '',
                        'MiddleName' => $user->MiddleName ?? null,
                        'LastName' => $user->LastName ?? '',
                        'email' => $user->email ?? '',
                        'Role' => 'Faculty',
                        'assigned_strand_id' => null,
                        'is_coordinator' => false,
                        'created_at' => null,
                        'updated_at' => null,
                        'assignedStrand' => null,
                    ];
                }
            })->filter(function ($user) {
                // Filter out any null users
                return $user['id'] !== null;
            });

            $strands = Strand::where('Is_active', true)
                ->select('id', 'Strand_code', 'Strand_name', 'Is_active')
                ->orderBy('Strand_code')
                ->get()
                ->map(function ($strand) {
                    return [
                        'id' => $strand->id,
                        'Strand_code' => $strand->Strand_code,
                        'Strand_name' => $strand->Strand_name,
                        'Is_active' => $strand->Is_active,
                    ];
                });

            return Inertia::render('Registrar/Faculty', [
                'faculty' => $faculty->values()->all(),
                'strands' => $strands->values()->all(),
            ]);
        } catch (\Exception $e) {
            Log::error('Error in faculty method', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // Try to get at least the strands even if faculty fails
            $strands = [];
            try {
                $strands = Strand::where('Is_active', true)
                    ->select('id', 'Strand_code', 'Strand_name', 'Is_active')
                    ->orderBy('Strand_code')
                    ->get()
                    ->map(function ($strand) {
                        return [
                            'id' => $strand->id,
                            'Strand_code' => $strand->Strand_code,
                            'Strand_name' => $strand->Strand_name,
                            'Is_active' => $strand->Is_active,
                        ];
                    });
            } catch (\Exception $strandError) {
                Log::error('Error loading strands in faculty error handler', [
                    'message' => $strandError->getMessage(),
                    'trace' => $strandError->getTraceAsString(),
                ]);
            }
            
            return Inertia::render('Registrar/Faculty', [
                'faculty' => [],
                'strands' => $strands->values()->all(),
                'error' => 'Failed to load faculty data. Please try again or contact support.'
            ]);
        }
    }

    /**
     * Store a newly created faculty member.
     */
    public function storeFaculty(Request $request)
    {
        $validated = $request->validate([
            'FirstName' => 'required|string|max:255',
            'MiddleName' => 'nullable|string|max:255',
            'LastName' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'assigned_strand_id' => 'nullable|exists:strands,id',
        ]);

        // Generate a random password
        $generatedPassword = $this->generateSecurePassword();
        
        // Create faculty member
        $facultyData = [
            'FirstName' => $validated['FirstName'],
            'MiddleName' => $validated['MiddleName'],
            'LastName' => $validated['LastName'],
            'email' => $validated['email'],
            'password' => Hash::make($generatedPassword),
            'Role' => 'Faculty',
            'assigned_strand_id' => $validated['assigned_strand_id'],
            'must_change_password' => true, // Flag to force password change on first login
        ];

        $faculty = User::create($facultyData);

        // Send email with login credentials
        try {
            // Check if mail is properly configured
            $mailDriver = config('mail.default');
            if ($mailDriver === 'log' || $mailDriver === 'array') {
                Log::warning("Faculty account created but mail driver is set to '{$mailDriver}'. Email not sent.", [
                    'faculty_id' => $faculty->id,
                    'email' => $faculty->email,
                    'mail_driver' => $mailDriver
                ]);
                
                return redirect()->route('registrar.faculty')
                    ->with('warning', "Faculty member '{$validated['FirstName']} {$validated['LastName']}' created successfully, but email could not be sent (mail driver is set to '{$mailDriver}'). Temporary password: {$generatedPassword} (Please share this securely with the faculty member)");
            }
            
            Mail::to($faculty->email)->send(new FacultyAccountCreated($faculty, $generatedPassword));
            
            Log::info("Faculty account created and email sent successfully", [
                'faculty_id' => $faculty->id,
                'email' => $faculty->email
            ]);
            
            return redirect()->route('registrar.faculty')
                ->with('success', "Faculty member '{$validated['FirstName']} {$validated['LastName']}' created successfully. Login credentials have been sent to {$faculty->email}.");
        } catch (\Exception $e) {
            // Log the actual error for debugging
            Log::error("Failed to send faculty account creation email", [
                'faculty_id' => $faculty->id,
                'email' => $faculty->email,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // If email fails, still show success but with password for manual sharing
            return redirect()->route('registrar.faculty')
                ->with('warning', "Faculty member '{$validated['FirstName']} {$validated['LastName']}' created successfully, but email could not be sent. Error: {$e->getMessage()}. Temporary password: {$generatedPassword} (Please share this securely with the faculty member)");
        }
    }

    /**
     * Generate a secure random password.
     */
    private function generateSecurePassword($length = 12)
    {
        $characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        $password = '';
        
        // Ensure at least one character from each type
        $password .= chr(rand(65, 90)); // Uppercase
        $password .= chr(rand(97, 122)); // Lowercase
        $password .= chr(rand(48, 57)); // Number
        $password .= '!@#$%^&*'[rand(0, 7)]; // Special character
        
        // Fill the rest randomly
        for ($i = 4; $i < $length; $i++) {
            $password .= $characters[rand(0, strlen($characters) - 1)];
        }
        
        // Shuffle the password
        return str_shuffle($password);
    }

    /**
     * Update the specified faculty member.
     */
    public function updateFaculty(Request $request, User $faculty)
    {
        // Ensure we're only updating faculty members
        if ($faculty->Role !== 'Faculty') {
            return redirect()->route('registrar.faculty')
                ->with('error', 'Invalid faculty member.');
        }

        $validated = $request->validate([
            'FirstName' => 'required|string|max:255',
            'MiddleName' => 'nullable|string|max:255',
            'LastName' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $faculty->id,
            'assigned_strand_id' => 'nullable|exists:strands,id',
        ]);

        $faculty->update($validated);

        return redirect()->route('registrar.faculty')
            ->with('success', "Faculty member '{$validated['FirstName']} {$validated['LastName']}' updated successfully.");
    }

    /**
     * Remove the specified faculty member.
     */
    public function destroyFaculty(User $faculty)
    {
        // Ensure we're only deleting faculty members
        if ($faculty->Role !== 'Faculty') {
            return redirect()->route('registrar.faculty')
                ->with('error', 'Invalid faculty member.');
        }

        // Check if faculty is assigned as adviser to any sections
        $assignedSections = Section::where('adviser_id', $faculty->id)->count();
        
        if ($assignedSections > 0) {
            return redirect()->route('registrar.faculty')
                ->with('error', "Cannot delete faculty member. They are currently assigned as adviser to {$assignedSections} section(s).");
        }

        $name = $faculty->FirstName . ' ' . $faculty->LastName;
        $faculty->delete();

        return redirect()->route('registrar.faculty')
            ->with('success', "Faculty member '{$name}' deleted successfully.");
    }

    /**
     * Toggle coordinator status for a faculty member.
     */
    public function toggleFacultyCoordinator(Request $request, User $faculty)
    {
        // Ensure the user is a faculty member
        if ($faculty->Role !== 'Faculty') {
            return redirect()->back()
                ->with('error', 'Only faculty members can be assigned coordinator privileges.');
        }

        $validated = $request->validate([
            'is_coordinator' => 'required|boolean',
        ]);

        $faculty->update([
            'is_coordinator' => $validated['is_coordinator']
        ]);

        $message = $validated['is_coordinator'] 
            ? "Coordinator privileges granted to {$faculty->FirstName} {$faculty->LastName}." 
            : "Coordinator privileges removed from {$faculty->FirstName} {$faculty->LastName}.";

        return redirect()->back()->with('success', $message);
    }

    /**
     * Display student verification page.
     */
    public function studentVerification()
    {
        $unverifiedStudents = StudentPersonalInfo::with(['user', 'latestEnrollment'])
            ->where('is_verified', false)
            ->orderBy('created_at', 'desc')
            ->get();

        $verifiedStudents = StudentPersonalInfo::with(['user', 'verifiedBy', 'latestEnrollment'])
            ->where('is_verified', true)
            ->orderBy('verified_at', 'desc')
            ->paginate(20);

        return Inertia::render('Registrar/StudentVerification', [
            'unverifiedStudents' => $unverifiedStudents,
            'verifiedStudents' => $verifiedStudents,
        ]);
    }

    /**
     * Verify a student account.
     */
    public function verifyStudent(Request $request, StudentPersonalInfo $student)
    {
        $validated = $request->validate([
            'action' => 'required|in:approve,reject',
            'reason' => 'nullable|string|max:500',
        ]);

        if ($validated['action'] === 'approve') {
            $student->update([
                'is_verified' => true,
                'verified_at' => now(),
                'verified_by' => Auth::id(),
            ]);

            // Enable the user account
            $student->user->update([
                'is_disabled' => false,
            ]);

            // Send approval email notification
            try {
                Mail::to($student->user->email)->send(new StudentApprovalNotification($student->user));
            } catch (\Exception $e) {
                Log::error('Failed to send student approval email: ' . $e->getMessage());
            }

            return redirect()->route('registrar.student-verification')
                ->with('success', "Student '{$student->full_name}' has been verified and approved. An email notification has been sent.");
        } else {
            // Reject - delete the student record and user account
            $name = $student->full_name;
            $student->user->delete(); // This will cascade delete the student info
            
            return redirect()->route('registrar.student-verification')
                ->with('success', "Student '{$name}' registration has been rejected and removed.");
        }
    }

    /**
     * Bulk approve multiple students.
     */
    public function bulkApproveStudents(Request $request)
    {
        try {
            // Log the incoming request for debugging
            Log::info('Bulk approve request received', [
                'all_input' => $request->all(),
                'student_ids_raw' => $request->input('student_ids'),
                'student_ids_type' => gettype($request->input('student_ids')),
            ]);

            // Get student_ids from request - handle both array and JSON string
            $studentIds = $request->input('student_ids', []);
            
            // If it's a JSON string, decode it
            if (is_string($studentIds)) {
                $studentIds = json_decode($studentIds, true) ?? [];
            }
            
            // Ensure it's an array
            if (!is_array($studentIds)) {
                $studentIds = [];
            }
            
            // Convert to integers and filter
            $studentIds = array_map('intval', $studentIds);
            $studentIds = array_filter($studentIds, fn($id) => $id > 0);
            $studentIds = array_values($studentIds); // Re-index array

            Log::info('Processed student IDs', [
                'count' => count($studentIds),
                'ids' => $studentIds,
            ]);

            if (empty($studentIds)) {
                Log::warning('Bulk approve: No valid student IDs provided');
                return back()->withErrors([
                    'student_ids' => 'Please select at least one student to approve.'
                ])->withInput();
            }

            // Validate with the processed IDs
            $validated = $request->validate([
                'student_ids' => 'required|array|min:1',
                'student_ids.*' => 'required|integer|exists:student_personal_info,id',
            ]);
            
            // Use the processed IDs instead of validated (which might have different format)
            $validated['student_ids'] = $studentIds;

            $approvedCount = 0;
            $failedCount = 0;
            $skippedCount = 0;
            $errors = [];

            foreach ($validated['student_ids'] as $studentId) {
                try {
                    $student = StudentPersonalInfo::with('user')->find($studentId);
                    
                    if (!$student) {
                        $failedCount++;
                        $errors[] = "Student ID {$studentId} not found.";
                        continue;
                    }

                    // Skip if already verified
                    if ($student->is_verified) {
                        $skippedCount++;
                        continue;
                    }

                    $student->update([
                        'is_verified' => true,
                        'verified_at' => now(),
                        'verified_by' => Auth::id(),
                    ]);

                    // Enable the user account
                    if ($student->user) {
                        $student->user->update([
                            'is_disabled' => false,
                        ]);

                        // Send approval email notification
                        try {
                            Mail::to($student->user->email)->send(new StudentApprovalNotification($student->user));
                        } catch (\Exception $e) {
                            Log::error('Failed to send student approval email: ' . $e->getMessage());
                            // Don't fail the approval if email fails
                        }
                    }

                    $approvedCount++;
                } catch (\Exception $e) {
                    $failedCount++;
                    $errors[] = "Failed to approve student ID {$studentId}: " . $e->getMessage();
                    Log::error('Bulk approve error for student ID ' . $studentId . ': ' . $e->getMessage());
                }
            }

            if ($approvedCount > 0) {
                $message = "Successfully approved {$approvedCount} student(s).";
                if ($skippedCount > 0) {
                    $message .= " {$skippedCount} student(s) were already verified.";
                }
                if ($failedCount > 0) {
                    $message .= " {$failedCount} student(s) failed to approve.";
                }
                return redirect()->route('registrar.student-verification')
                    ->with('success', $message);
            } else {
                $errorMessage = 'No students were approved.';
                if ($skippedCount > 0) {
                    $errorMessage .= " {$skippedCount} student(s) were already verified.";
                }
                if ($failedCount > 0) {
                    $errorMessage .= " {$failedCount} student(s) failed to approve.";
                }
                return back()->withErrors([
                    'general' => $errorMessage
                ])->withInput();
            }
        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            Log::error('Bulk approve general error: ' . $e->getMessage());
            return back()->withErrors([
                'general' => 'An error occurred while processing bulk approval. Please try again.'
            ])->withInput();
        }
    }

    /**
     * List all students (verified and submitted pre-enrollment).
     */
    public function students()
    {
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

        return Inertia::render('Registrar/Students', [
            'students' => $students,
        ]);
    }

    /**
     * Show comprehensive student details with 5 sections.
     */
    public function showStudentDetails(StudentPersonalInfo $student)
    {
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

        // Get all grades for the student
        $grades = Grade::with([
            'subject',
            'classModel.section',
            'schoolYear',
        ])
        ->where('student_personal_info_id', $student->id)
        ->orderBy('school_year_id', 'desc')
        ->orderByRaw("FIELD(semester, '1st', '2nd', 'Summer')")
        ->get()
        ->map(function ($grade) {
            return [
                'id' => $grade->id,
                'subject_name' => $grade->subject_name_snapshot ?? $grade->subject?->Subject_name,
                'subject_code' => $grade->subject_code_snapshot ?? $grade->subject?->Subject_code,
                'school_year' => $grade->schoolYear?->formatted ?? $grade->school_year_label,
                'semester' => $grade->semester_label ?? $grade->semester,
                'first_quarter' => $grade->first_quarter,
                'second_quarter' => $grade->second_quarter,
                'third_quarter' => $grade->third_quarter,
                'fourth_quarter' => $grade->fourth_quarter,
                'final_grade' => $grade->semester_grade,
                'remarks' => $grade->remarks,
                'status' => $grade->status,
            ];
        });

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

        return Inertia::render('Registrar/StudentDetails', [
            'student' => [
                'id' => $student->id,
                'lrn' => $filterNA($student->lrn),
                'full_name' => $student->full_name, // Already filtered in model
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
            'grades' => $grades,
            'classRecords' => $classRecords,
        ]);
    }

    /**
     * Map semester type to semester code.
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
     * Update enrollment control settings for a school year.
     */
    public function updateEnrollmentControl(Request $request, SchoolYear $schoolYear)
    {
        $validated = $request->validate([
            'enrollment_open' => 'required|boolean',
            'enrollment_start_date' => 'nullable|date|after_or_equal:today',
            'enrollment_end_date' => 'nullable|date|after:enrollment_start_date',
        ]);

        $schoolYear->update($validated);

        return redirect()->route('registrar.school-years')
            ->with('success', 'Enrollment control settings updated successfully.');
    }

    /**
     * Toggle enrollment status for a school year.
     */
    public function toggleEnrollment(SchoolYear $schoolYear)
    {
        $schoolYear->update([
            'enrollment_open' => !$schoolYear->enrollment_open
        ]);

        $status = $schoolYear->enrollment_open ? 'opened' : 'closed';
        
        return redirect()->route('registrar.school-years')
            ->with('success', "Enrollment has been {$status} for {$schoolYear->formatted}.");
    }

    /**
     * Display all student enrollments for registrar.
     */
    public function enrollments()
    {
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
            'approvedBy',
        ]);

        // Filter by active semester if available
        if ($activeSemester && $activeSchoolYear) {
            $enrollmentsQuery->where('school_year_id', $activeSchoolYear->id)
                ->where('semester_id', $activeSemester->id);
        }

        $enrollments = $enrollmentsQuery
        ->orderByRaw("FIELD(status, ?, ?, ?, ?) ASC", [
            Enrollment::STATUS_PRE_ENROLLED,
            Enrollment::STATUS_RECOMMENDED,
            Enrollment::STATUS_ENROLLED,
            Enrollment::STATUS_REJECTED,
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
            
            // Add next term info for enrolled students
            if ($enrollment->canBeReEnrolled()) {
                $reviewArray['next_term_info'] = $enrollment->getNextTermInfo();
            } else {
                $reviewArray['next_term_info'] = null;
            }
            
            // Transferee and credited subjects for UI
            $reviewArray['is_transferee'] = (bool) $enrollment->is_transferee;
            // Derive previous_school from first credited subject (normalized)
            $firstCredit = $enrollment->creditedSubjects->first();
            $reviewArray['previous_school'] = $firstCredit?->previous_school;
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
            
            // Add workflow status for transferees
            if ($enrollment->is_transferee) {
                $enrollment->loadMissing('creditedSubjects');
                $reviewArray['has_pending_credits'] = $enrollment->hasPendingCreditedSubjects();
                $reviewArray['all_credits_approved'] = $enrollment->allCreditedSubjectsApproved();
                $reviewArray['can_enroll'] = $enrollment->allCreditedSubjectsApproved();
                $reviewArray['can_print_cor'] = $enrollment->status === Enrollment::STATUS_ENROLLED && $enrollment->allCreditedSubjectsApproved();
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

        $activeStrands = Strand::where('Is_active', true)
            ->orderBy('Strand_name')
            ->get(['id', 'Strand_code', 'Strand_name']);

        $activeSections = Section::with([
            'strand:id,Strand_code,Strand_name',
            'adviser:id,FirstName,MiddleName,LastName'
        ])
            ->where('is_active', true)
            ->get(['id', 'section_name', 'strand_id', 'school_year_id', 'semester_id', 'adviser_id', 'is_active']);

        return Inertia::render('Registrar/Enrollments', [
            'enrollments' => $enrollments,
            'strands' => $activeStrands,
            'sections' => $activeSections,
        ]);
    }

    /**
     * Show all enrollments for a student to select which semester COR to view.
     */
    public function studentEnrollments($studentId)
    {
        $student = \App\Models\StudentPersonalInfo::with('user')->findOrFail($studentId);
        
        // Get all enrollments for this student, ordered by most recent first
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

        return Inertia::render('Registrar/StudentEnrollments', [
            'student' => [
                'id' => $student->id,
                'name' => $student->full_name ?: ($student->user->name ?? 'Unknown'),
                'email' => $student->user->email ?? '',
                'lrn' => $student->LRN ?? '',
            ],
            'enrollments' => $enrollments,
        ]);
    }

    /**
     * View pending grade submissions and approve or reject them.
     */
    public function gradeApprovals()
    {
        $pendingGrades = Grade::with([
            'student.user',
            'subject',
            'classModel.section',
            'classModel.faculty',
        ])
            ->whereIn('status', [Grade::STATUS_PENDING, Grade::STATUS_REJECTED])
            ->orderByDesc('submitted_for_approval_at')
            ->get()
            ->map(function (Grade $grade) {
                $student = $grade->student?->user;
                $class = $grade->classModel;

                return [
                    'id' => $grade->id,
                    'student' => [
                        'name' => trim(($student?->FirstName ?? '') . ' ' . ($student?->LastName ?? '')),
                        'lrn' => $grade->student?->lrn,
                    ],
                    'subject' => $grade->subject?->Subject_name ?? 'Unnamed Subject',
                    'class' => [
                        'section' => $class?->section?->section_name ?? $class?->section?->SectionName,
                        'strand' => $class?->section?->strand?->Strand_name,
                        'faculty' => $class?->faculty ? trim(($class->faculty->FirstName ?? '') . ' ' . ($class->faculty->LastName ?? '')) : null,
                        'schedule' => $class ? [
                            'day' => $class->day_of_week,
                            'start_time' => $class->start_time,
                            'end_time' => $class->end_time ?? $class->endtime,
                        ] : null,
                    ],
                    'first_quarter' => $grade->first_quarter,
                    'second_quarter' => $grade->second_quarter,
                    'third_quarter' => $grade->third_quarter,
                    'fourth_quarter' => $grade->fourth_quarter,
                    'semester_grade' => $grade->semester_grade,
                    'remarks' => $grade->remarks,
                    'status' => $grade->status,
                    'submitted_for_approval_at' => $grade->submitted_for_approval_at,
                    'breakdown' => [
                        'first_quarter' => $grade->first_quarter,
                        'second_quarter' => $grade->second_quarter,
                        'third_quarter' => $grade->third_quarter,
                        'fourth_quarter' => $grade->fourth_quarter,
                        'semester_grade' => $grade->semester_grade,
                    ],
                ];
            });

        return Inertia::render('Registrar/GradeApprovals', [
            'grades' => $pendingGrades,
        ]);
    }

    /**
     * Unified Enrollment hub page (links to enrollment and re-enrollment flows).
     */
    public function enrollmentHub()
    {
        $activeSchoolYear = SchoolYear::where('is_active', true)->first();
        $activeSemester = $activeSchoolYear
            ? Semester::where('school_year_id', $activeSchoolYear->id)->where('is_active', true)->first()
            : null;
        $isSummerSemester = $activeSemester && str_contains(strtolower($activeSemester->semester_type ?? ''), 'summer');

        // Pending indicators (scoped to active term when available)
        $unverifiedStudents = \App\Models\StudentPersonalInfo::where('is_verified', false)
            ->count();

        $pendingEnrollments = \App\Models\Enrollment::whereIn('status', [
            \App\Models\Enrollment::STATUS_PRE_ENROLLED,
            \App\Models\Enrollment::STATUS_RECOMMENDED,
        ])
        ->when($activeSchoolYear, function ($query) use ($activeSchoolYear) {
            return $query->where('school_year_id', $activeSchoolYear->id);
        })
        ->when($activeSemester, function ($query) use ($activeSemester) {
            return $query->where('semester_id', $activeSemester->id);
        })
        ->count();

        $pendingCredits = \App\Models\CreditedSubject::whereNull('credited_grade')
            ->whereHas('enrollment', function ($query) use ($activeSchoolYear, $activeSemester) {
                $query->when($activeSchoolYear, function ($q) use ($activeSchoolYear) {
                    $q->where('school_year_id', $activeSchoolYear->id);
                })
                ->when($activeSemester, function ($q) use ($activeSemester) {
                    $q->where('semester_id', $activeSemester->id);
                });
            })
            ->count();

        $pendingGradeApprovals = \App\Models\Grade::where('status', \App\Models\Grade::STATUS_PENDING)
            ->when($activeSchoolYear, function ($query) use ($activeSchoolYear) {
                return $query->where('school_year_id', $activeSchoolYear->id);
            })
            ->when($activeSemester, function ($query) use ($activeSemester) {
                $semesterCode = $this->mapSemesterToCode($activeSemester->semester_type ?? null);
                if ($semesterCode) {
                    $query->where('semester', $semesterCode);
                }
                return $query;
            })
            ->count();

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

        return Inertia::render('Registrar/Enrollment', [
            'activeSchoolYear' => $activeSchoolYear ? [
                'id' => $activeSchoolYear->id,
                'label' => $activeSchoolYear->School_year_start . '-' . $activeSchoolYear->School_year_end,
            ] : null,
            'activeSemester' => $activeSemester ? [
                'id' => $activeSemester->id,
                'label' => $activeSemester->semester_type,
            ] : null,
            // Provide quick links for convenience
            'links' => [
                'enrollments' => route('registrar.enrollments'),
                'reEnroll' => route('registrar.re-enroll-students'),
                'creditedSubjects' => route('registrar.credited-subjects'),
                'gradeApprovals' => route('registrar.grade-approvals'),
            ],
            'counts' => [
                'unverifiedStudents' => $unverifiedStudents,
                'pendingEnrollments' => $pendingEnrollments,
                'pendingCredits' => $pendingCredits,
                'pendingGradeApprovals' => $pendingGradeApprovals,
                'reEnrollments' => $reEnrollmentsCount,
            ],
        ]);
    }

    public function updateGradeApproval(Request $request, Grade $grade)
    {
        $validated = $request->validate([
            'decision' => 'required|in:approve,reject',
        ]);

        if ($grade->status !== Grade::STATUS_PENDING && $validated['decision'] === 'approve') {
            return redirect()->route('registrar.grade-approvals')
                ->withErrors(['error' => 'Only pending grades can be approved.']);
        }

        if ($validated['decision'] === 'approve') {
            // Auto-calculate semester grade and remarks
            $gradeService = app(\App\Services\GradeCalculationService::class);
            
            // Calculate semester grade if not set
            if (!$grade->semester_grade) {
                $grade->semester_grade = $gradeService->calculateSemesterGrade($grade);
            }
            
            // Determine remarks
            $grade->remarks = $gradeService->determineRemarks($grade->semester_grade);
            
            // Capture snapshot before approval (for data integrity)
            $grade->captureSnapshot();
            
            // Update status and approval info
            $grade->update([
                'status' => Grade::STATUS_APPROVED,
                'approved_by' => Auth::id(),
                'approved_at' => now(),
                'semester_grade' => $grade->semester_grade,
                'remarks' => $grade->remarks,
                'auto_calculated' => true,
            ]);
            
            // Lock grade to prevent future modifications
            $grade->lock(Auth::id());
            
            // Check prerequisites after approval
            $gradeService->checkPrerequisites($grade);
            
            $message = 'Grade approved successfully.';
        } else {
            $grade->update([
                'status' => Grade::STATUS_REJECTED,
                'approved_by' => Auth::id(),
                'approved_at' => now(),
            ]);
            $message = 'Grade rejected and returned to faculty.';
        }

        return redirect()->route('registrar.grade-approvals')->with('success', $message);
    }

    public function bulkUpdateGradeApprovals(Request $request)
    {
        $validated = $request->validate([
            'decision' => 'required|in:approve,reject',
            'grade_ids' => 'required|array|min:1',
            'grade_ids.*' => 'exists:grades,id',
        ]);

        $grades = Grade::whereIn('id', $validated['grade_ids'])->get();
        $decision = $validated['decision'];
        $updated = 0;
        $gradeService = app(\App\Services\GradeCalculationService::class);

        foreach ($grades as $grade) {
            if ($grade->status !== Grade::STATUS_PENDING && $decision === 'approve') {
                continue;
            }

            if ($decision === 'approve') {
                // Auto-calculate semester grade and remarks
                if (!$grade->semester_grade) {
                    $grade->semester_grade = $gradeService->calculateSemesterGrade($grade);
                }
                
                $grade->remarks = $gradeService->determineRemarks($grade->semester_grade);
                
                // Capture snapshot before approval
                $grade->captureSnapshot();
                
                $grade->update([
                    'status' => Grade::STATUS_APPROVED,
                    'approved_by' => Auth::id(),
                    'approved_at' => now(),
                    'semester_grade' => $grade->semester_grade,
                    'remarks' => $grade->remarks,
                    'auto_calculated' => true,
                ]);
                
                // Lock grade to prevent future modifications
                $grade->lock(Auth::id());
                
                // Check prerequisites after approval
                $gradeService->checkPrerequisites($grade);
            } else {
                $grade->update([
                    'status' => Grade::STATUS_REJECTED,
                    'approved_by' => Auth::id(),
                    'approved_at' => now(),
                ]);
            }

            $updated++;
        }

        if ($updated === 0) {
            return redirect()->route('registrar.grade-approvals')
                ->with('warning', 'No grades were updated. Only pending grades can be approved.');
        }

        $message = $decision === 'approve'
            ? "Approved {$updated} grade(s) successfully."
            : "Rejected {$updated} grade(s) successfully.";

        return redirect()->route('registrar.grade-approvals')->with('success', $message);
    }

    /**
     * View all approved grades for students.
     */
    public function approvedGrades(Request $request)
    {
        $query = Grade::with([
            'student.user',
            'subject',
            'classModel.section.strand',
            'classModel.faculty',
            'schoolYear',
            'approvedByUser',
        ])->where('status', Grade::STATUS_APPROVED);

        // Apply filters
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('student', function ($q2) use ($search) {
                    $q2->whereHas('user', function ($q3) use ($search) {
                        $q3->where('FirstName', 'like', "%{$search}%")
                            ->orWhere('LastName', 'like', "%{$search}%");
                    })->orWhere('lrn', 'like', "%{$search}%");
                });
            });
        }

        if ($request->filled('school_year_id')) {
            $query->where('school_year_id', $request->school_year_id);
        }

        if ($request->filled('semester')) {
            $query->where('semester', $request->semester);
        }

        if ($request->filled('subject_id')) {
            $query->where('subject_id', $request->subject_id);
        }

        if ($request->filled('strand_id')) {
            $query->whereHas('classModel.section', function ($q) use ($request) {
                $q->where('strand_id', $request->strand_id);
            });
        }

        $approvedGrades = $query
            ->orderByDesc('approved_at')
            ->orderBy('school_year_id', 'desc')
            ->orderByRaw("FIELD(semester, '1st', '2nd', 'Summer')")
            ->paginate(50)
            ->through(function (Grade $grade) {
                $student = $grade->student?->user;
                $class = $grade->classModel;

                return [
                    'id' => $grade->id,
                    'student' => [
                        'name' => trim(($student?->FirstName ?? '') . ' ' . ($student?->LastName ?? '')),
                        'lrn' => $grade->student?->lrn,
                        'grade_level' => $grade->student?->grade_level,
                    ],
                    'subject' => $grade->subject?->Subject_name ?? $grade->subject_name_snapshot ?? 'Unnamed Subject',
                    'subject_code' => $grade->subject?->Subject_code ?? $grade->subject_code_snapshot,
                    'class' => [
                        'section' => $class?->section?->section_name ?? $grade->class_section_snapshot,
                        'strand' => $class?->section?->strand?->Strand_name,
                        'faculty' => $class?->faculty ? trim(($class->faculty->FirstName ?? '') . ' ' . ($class->faculty->LastName ?? '')) : $grade->faculty_name_snapshot,
                    ],
                    'semester' => $grade->semester ?? $grade->semester_label,
                    'school_year' => $grade->schoolYear?->formatted ?? $grade->school_year_label,
                    'first_quarter' => $grade->first_quarter,
                    'second_quarter' => $grade->second_quarter,
                    'third_quarter' => $grade->third_quarter,
                    'fourth_quarter' => $grade->fourth_quarter,
                    'semester_grade' => $grade->semester_grade,
                    'remarks' => $grade->remarks,
                    'approved_by' => $grade->approvedByUser ? trim(($grade->approvedByUser->FirstName ?? '') . ' ' . ($grade->approvedByUser->LastName ?? '')) : 'System',
                    'approved_at' => $grade->approved_at,
                ];
            });

        // Get filter options - only show subjects and strands that have approved grades
        $schoolYears = \App\Models\SchoolYear::orderByDesc('School_year_start')->get();
        
        // Get distinct subject IDs from approved grades
        $subjectIds = Grade::where('status', Grade::STATUS_APPROVED)
            ->whereNotNull('subject_id')
            ->distinct()
            ->pluck('subject_id')
            ->filter()
            ->toArray();
        
        // Get subjects that have approved grades (including soft-deleted ones since they have historical grades)
        $subjects = \App\Models\Subject::withTrashed()
            ->whereIn('Id', $subjectIds)
            ->orderBy('Subject_name')
            ->get();
        
        // Get distinct strand IDs from approved grades through classModel->section
        $strandIds = Grade::where('status', Grade::STATUS_APPROVED)
            ->join('class', 'grades.class_id', '=', 'class.Id')
            ->join('sections', 'class.Section_id', '=', 'sections.id')
            ->whereNotNull('sections.strand_id')
            ->distinct()
            ->pluck('sections.strand_id')
            ->filter()
            ->toArray();
        
        // Get strands that have approved grades
        $strands = \App\Models\Strand::whereIn('id', $strandIds)
            ->orderBy('Strand_name')
            ->get();

        return Inertia::render('Registrar/ApprovedGrades', [
            'grades' => $approvedGrades,
            'filters' => $request->only(['search', 'school_year_id', 'semester', 'subject_id', 'strand_id']),
            'schoolYears' => $schoolYears,
            'subjects' => $subjects,
            'strands' => $strands,
        ]);
    }

    /**
     * Update enrollment status from registrar side.
     */
    public function updateEnrollmentStatus(Request $request, $enrollmentId)
    {
        $user = Auth::user();

        $enrollment = Enrollment::findOrFail($enrollmentId);

        $validated = $request->validate([
            'status' => 'required|in:rejected,enrolled',
            'assigned_strand_id' => 'nullable|exists:strands,id',
            'assigned_section_id' => 'nullable|exists:sections,id',
            'grade_level' => 'nullable|in:11,12',
            'notes' => 'nullable|string|max:500',
        ]);

        $currentStatus = $enrollment->status;

        switch ($validated['status']) {
            case Enrollment::STATUS_ENROLLED:
                if (!$validated['assigned_strand_id'] || !$validated['assigned_section_id']) {
                    throw ValidationException::withMessages([
                        'assigned_strand_id' => 'Please select a strand before enrolling.',
                        'assigned_section_id' => 'Please select a section before enrolling.',
                    ]);
                }

                $section = Section::find($validated['assigned_section_id']);
                if ($section && $section->strand_id !== (int) $validated['assigned_strand_id']) {
                    throw ValidationException::withMessages([
                        'assigned_section_id' => 'The selected section does not belong to the chosen strand.',
                    ]);
                }

                if (!in_array($currentStatus, [Enrollment::STATUS_RECOMMENDED, Enrollment::STATUS_PRE_ENROLLED], true)) {
                    throw ValidationException::withMessages([
                        'status' => 'Only recommended or pre-enrolled enrollments can be enrolled.',
                    ]);
                }

                // Block enrollment if transferee has pending credited subjects
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
                        
                        throw ValidationException::withMessages([
                            'status' => "Cannot enroll transferee yet. {$pendingCount} credited subject(s) still need grades and/or registrar approval. Please complete the credit subject process first.",
                        ]);
                    }
                    
                    // Ensure all credited subjects are approved
                    if (!$enrollment->allCreditedSubjectsApproved()) {
                        throw ValidationException::withMessages([
                            'status' => 'Cannot enroll transferee yet. All credited subjects must have approved grades before enrollment.',
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

                $this->createClassDetailsForEnrollment($enrollment, $user->id);

                $message = 'Student successfully enrolled.';
                break;

            case Enrollment::STATUS_REJECTED:
                $enrollment->update([
                    'status' => Enrollment::STATUS_REJECTED,
                    'assigned_strand_id' => null,
                    'assigned_section_id' => null,
                    'approved_by' => null,
                    'approved_at' => null,
                    'enrolled_by' => null,
                    'processed_at' => now(),
                ]);

                $message = 'Enrollment rejected and returned for revisions.';
                break;
            default:
                $message = 'Enrollment status updated.';
                break;
        }

        return redirect()->back()->with('success', $message);
    }

    /**
     * Assign strand and section for an enrollment directly from the COR view.
     */
    public function assignStrandSection(Request $request, Enrollment $enrollment)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'assigned_strand_id' => 'required|exists:strands,id',
            'assigned_section_id' => 'required|exists:sections,id',
            'grade_level' => 'required|in:11,12',
        ]);

        $section = Section::findOrFail($validated['assigned_section_id']);

        if ((int) $section->strand_id !== (int) $validated['assigned_strand_id']) {
            throw ValidationException::withMessages([
                'assigned_section_id' => 'The selected section does not belong to the chosen strand.',
            ]);
        }

        if ((int) $section->school_year_id !== (int) $enrollment->school_year_id) {
            throw ValidationException::withMessages([
                'assigned_section_id' => 'The section belongs to a different school year.',
            ]);
        }

        if ($enrollment->semester_id && $section->semester_id && (int) $section->semester_id !== (int) $enrollment->semester_id) {
            throw ValidationException::withMessages([
                'assigned_section_id' => 'The section belongs to a different semester.',
            ]);
        }

        DB::transaction(function () use ($enrollment, $user, $validated) {
            // Remove previous class assignments to avoid duplicates
            $enrollment->classDetails()->delete();

            $updateData = [
                'assigned_strand_id' => $validated['assigned_strand_id'],
                'assigned_section_id' => $validated['assigned_section_id'],
            ];

            if (in_array($enrollment->status, [
                Enrollment::STATUS_PRE_ENROLLED,
                Enrollment::STATUS_RECOMMENDED,
            ], true)) {
                // Block enrollment if transferee has pending credited subjects without grades
                if ($enrollment->is_transferee) {
                    $pendingCredits = \App\Models\CreditedSubject::where('enrollment_id', $enrollment->id)
                        ->whereNull('credited_grade')
                        ->count();
                    if ($pendingCredits > 0) {
                        throw ValidationException::withMessages([
                            'status' => 'Cannot enroll transferee yet. Please encode grades for all credited subjects first.',
                        ]);
                    }
                }
                $updateData['status'] = Enrollment::STATUS_ENROLLED;
                $updateData['enrolled_by'] = $user->id;
                $updateData['approved_by'] = $user->id;
                $updateData['approved_at'] = now();
                $updateData['processed_at'] = now();
            } elseif (!$enrollment->approved_by) {
                $updateData['approved_by'] = $user->id;
                $updateData['approved_at'] = now();
            }

            if (!array_key_exists('processed_at', $updateData)) {
                $updateData['processed_at'] = now();
            }

            $enrollment->update($updateData);

            // Update student's grade_level in student_personal_info
            if (isset($validated['grade_level']) && $enrollment->studentPersonalInfo) {
                $enrollment->studentPersonalInfo->update([
                    'grade_level' => $validated['grade_level'],
                ]);
            }

            $enrollment->refresh();

            $this->createClassDetailsForEnrollment($enrollment, $user->id);
        });

        return redirect()
            ->route('enrollments.cor', $enrollment)
            ->with('success', 'Strand and section assignment saved successfully.');
    }

    /**
     * Create class enrollment records for a student based on the assigned section.
     * 
     * @param Enrollment $enrollment The enrollment record
     * @param int $processedBy User ID who processed the enrollment
     * @param bool $isReEnrollment Whether this is a re-enrollment (moving to new semester/year)
     */
    /**
     * Expose class creation for failed subjects so other controllers can reuse the logic.
     */
    public function createFailedSubjectClassesForEnrollment(Enrollment $enrollment, \Illuminate\Support\Collection $failedGrades, int $createdBy): void
    {
        $this->createClassesForFailedSubjects($enrollment, $failedGrades, $createdBy);
    }

    /**
     * Create classes for failed subjects in summer semester if they don't exist.
     */
    private function createClassesForFailedSubjects(Enrollment $enrollment, \Illuminate\Support\Collection $failedGrades, int $createdBy): void
    {
        $section = $enrollment->assignedSection;
        if (!$section) {
            return;
        }

        $failedSubjectIds = $failedGrades->pluck('subject_id')->filter()->unique()->all();
        
        // Get existing classes for these subjects in this section/semester
        $existingClasses = ClassModel::where('Section_id', $section->id)
            ->where('school_year_id', $enrollment->school_year_id)
            ->where('Semester_id', $enrollment->semester_id)
            ->whereIn('subject_id', $failedSubjectIds)
            ->where('is_active', true)
            ->pluck('subject_id')
            ->all();

        // Find subjects that need classes created
        $subjectsToCreate = array_diff($failedSubjectIds, $existingClasses);
        
        Log::info('Creating classes for failed subjects in summer semester', [
            'enrollment_id' => $enrollment->id,
            'section_id' => $section->id,
            'total_failed_subjects' => count($failedSubjectIds),
            'existing_classes' => count($existingClasses),
            'subjects_to_create' => count($subjectsToCreate),
            'subject_ids' => $subjectsToCreate,
        ]);
        
        if (empty($subjectsToCreate)) {
            Log::info('All classes already exist for failed subjects', [
                'enrollment_id' => $enrollment->id,
                'existing_classes' => $existingClasses,
            ]);
            return; // All classes already exist
        }

        // Get section adviser as default faculty
        $defaultFacultyId = $section->adviser_id;
        
        // If no adviser, try to find a faculty teaching this subject in previous semesters
        if (!$defaultFacultyId) {
            $previousClass = ClassModel::whereIn('subject_id', $subjectsToCreate)
                ->where('is_active', true)
                ->latest('Id')
                ->first();
            
            if ($previousClass) {
                $defaultFacultyId = $previousClass->faculty_id;
            }
        }

        // If still no faculty, get first active faculty member
        if (!$defaultFacultyId) {
            $defaultFaculty = User::where('Role', 'Faculty')
                ->where('is_disabled', false)
                ->first();
            $defaultFacultyId = $defaultFaculty?->id;
        }

        if (!$defaultFacultyId) {
            Log::warning('Cannot create classes for failed subjects: No faculty available', [
                'enrollment_id' => $enrollment->id,
                'subjects' => $subjectsToCreate,
            ]);
            return;
        }

        // Default schedule: 1:30pm - 3:30pm for all summer classes (same time for all subjects)
        $defaultStartTime = '13:30';
        $defaultEndTime = '15:30';

        // Days of week for summer: Monday to Friday
        $summerDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

        // Create classes for each failed subject, distributing across Monday to Friday
        // All subjects use the same time slot (1:30pm - 3:30pm)
        $dayIndex = 0;
        $createdCount = 0;
        
        foreach ($subjectsToCreate as $subjectId) {
            $subject = Subject::find($subjectId);
            if (!$subject) {
                Log::warning('Subject not found when creating summer class', [
                    'subject_id' => $subjectId,
                    'enrollment_id' => $enrollment->id,
                ]);
                continue;
            }

            // Check if class already exists (double-check to avoid duplicates)
            $existing = ClassModel::where('Section_id', $section->id)
                ->where('subject_id', $subjectId)
                ->where('school_year_id', $enrollment->school_year_id)
                ->where('Semester_id', $enrollment->semester_id)
                ->where('is_active', true)
                ->exists();

            if ($existing) {
                Log::info('Class already exists for subject in summer semester', [
                    'subject_id' => $subjectId,
                    'section_id' => $section->id,
                    'enrollment_id' => $enrollment->id,
                ]);
                continue;
            }

            // Assign day: distribute subjects across Monday to Friday sequentially
            // If more than 5 subjects, cycle through days
            $assignedDay = $summerDays[$dayIndex % count($summerDays)];
            
            // Check for schedule conflicts with existing classes on this day
            // If conflict, try next available day (but keep same time slot)
            $finalDay = $assignedDay;
            $attempts = 0;
            $originalDayIndex = $dayIndex;
            
            while ($attempts < count($summerDays)) {
                $hasConflict = $this->facultyHasScheduleConflict(
                    $defaultFacultyId,
                    $finalDay,
                    $defaultStartTime,
                    $defaultEndTime,
                    $enrollment->school_year_id,
                    $enrollment->semester_id
                );
                
                if (!$hasConflict) {
                    break; // Found a day without conflict
                }
                
                // Try next day
                $attempts++;
                $nextDayIndex = ($originalDayIndex + $attempts) % count($summerDays);
                $finalDay = $summerDays[$nextDayIndex];
            }
            
            // Move to next day for next subject
            $dayIndex++;

            try {
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

                $createdCount++;
                Log::info('Auto-created class for failed subject in summer semester', [
                    'enrollment_id' => $enrollment->id,
                    'subject_id' => $subjectId,
                    'subject_name' => $subject->Subject_name ?? 'Unknown',
                    'subject_code' => $subject->Subject_code ?? 'Unknown',
                    'section_id' => $section->id,
                    'section_name' => $section->section_name ?? 'Unknown',
                    'faculty_id' => $defaultFacultyId,
                    'day' => $finalDay,
                    'time' => "{$defaultStartTime}-{$defaultEndTime}",
                    'created_count' => $createdCount,
                    'total_subjects' => count($subjectsToCreate),
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to auto-create class for failed subject', [
                    'enrollment_id' => $enrollment->id,
                    'subject_id' => $subjectId,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }

    /**
     * Expose class detail creation so other controllers can reuse the logic.
     */
    public function createClassDetailsSnapshotForEnrollment(Enrollment $enrollment, int $processedBy, bool $isReEnrollment = false, ?\Illuminate\Support\Collection $failedGrades = null): void
    {
        $this->createClassDetailsForEnrollment($enrollment, $processedBy, $isReEnrollment, $failedGrades);
    }

    private function createClassDetailsForEnrollment(Enrollment $enrollment, int $processedBy, bool $isReEnrollment = false, ?\Illuminate\Support\Collection $failedGrades = null): void
    {
        if (!$enrollment->assigned_section_id) {
            return;
        }

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
            
            Log::info('Filtering classes for summer semester', [
                'enrollment_id' => $enrollment->id,
                'total_classes_in_section' => $classes->count(),
                'failed_subject_ids' => $failedSubjectIds,
            ]);
            
            $classes = $classes->filter(function ($class) use ($failedSubjectIds) {
                $matches = in_array($class->subject_id, $failedSubjectIds);
                if (!$matches) {
                    Log::debug('Class filtered out (not a failed subject)', [
                        'class_id' => $class->Id,
                        'subject_id' => $class->subject_id,
                        'subject_name' => $class->subject?->Subject_name ?? 'Unknown',
                    ]);
                }
                return $matches;
            });
            
            Log::info('Classes after filtering for failed subjects', [
                'enrollment_id' => $enrollment->id,
                'filtered_classes_count' => $classes->count(),
                'class_subjects' => $classes->map(function ($c) {
                    return $c->subject?->Subject_name ?? 'Unknown';
                })->all(),
            ]);
        }

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
                    Log::warning('Student enrolled in subject without prerequisites', [
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
                    'enrolled_by' => $processedBy,
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
     * Re-enroll an enrolled student to the next semester or grade level.
     */
    public function reEnrollStudent(Request $request, Enrollment $enrollment)
    {
        $user = Auth::user();

        // Only allow re-enrollment for students who are currently enrolled
        if (!$enrollment->canBeReEnrolled()) {
            return back()->withErrors(['error' => 'This student cannot be re-enrolled. Only students with "enrolled" status are eligible.']);
        }

        $nextTermInfo = $enrollment->getNextTermInfo();
        
        if (!$nextTermInfo) {
            return back()->withErrors(['error' => 'Unable to determine the next term for re-enrollment. Please create the necessary school year/semester first.']);
        }

        $validated = $request->validate([
            'assigned_strand_id' => 'required|exists:strands,id',
            'assigned_section_id' => 'required|exists:sections,id',
        ]);

        // Validate that the section belongs to the correct strand, semester, and school year
        $section = Section::find($validated['assigned_section_id']);
        if (!$section) {
            return back()->withErrors(['error' => 'Selected section not found.']);
        }

        if ($section->strand_id !== (int) $validated['assigned_strand_id']) {
            return back()->withErrors(['assigned_section_id' => 'The selected section does not belong to the chosen strand.']);
        }

        if ($section->school_year_id !== $nextTermInfo['school_year_id'] || $section->semester_id !== $nextTermInfo['semester_id']) {
            return back()->withErrors(['assigned_section_id' => 'The selected section does not belong to the target school year/semester.']);
        }

        DB::beginTransaction();
        try {
            // Check if an enrollment already exists for this student in the target term
            $existingEnrollment = Enrollment::where('student_personal_info_id', $enrollment->student_personal_info_id)
                ->where('school_year_id', $nextTermInfo['school_year_id'])
                ->where('semester_id', $nextTermInfo['semester_id'])
                ->lockForUpdate()
                ->first();

            if ($existingEnrollment) {
                DB::rollBack();
                return back()->withErrors(['error' => 'This student is already enrolled for the target term.']);
            }

            // Create a new enrollment record for the next term
            $newEnrollment = Enrollment::create([
                'student_personal_info_id' => $enrollment->student_personal_info_id,
                'school_year_id' => $nextTermInfo['school_year_id'],
                'semester_id' => $nextTermInfo['semester_id'],
                'assigned_strand_id' => $validated['assigned_strand_id'],
                'assigned_section_id' => $validated['assigned_section_id'],
                'status' => Enrollment::STATUS_ENROLLED,
                'enrolled_by' => $user->id,
                'approved_by' => $user->id,
                'approved_at' => now(),
                'submitted_at' => now(),
                'processed_at' => now(),
                'confirmed_at' => now(),
            ]);

            // Create class details for the new enrollment (mark as re-enrollment)
            $this->createClassDetailsForEnrollment($newEnrollment, $user->id, true);

            // Update the user's grade level if promoting to next grade
            if ($nextTermInfo['type'] === 'next_grade') {
                $student = User::find($enrollment->studentPersonalInfo->user_id);
                if ($student) {
                    $student->update(['Grade_level' => $nextTermInfo['suggested_grade_level']]);
                }
            }

            DB::commit();

            return redirect()
                ->route('registrar.enrollments')
                ->with('success', "Student successfully re-enrolled: {$nextTermInfo['description']}");
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to re-enroll student: ' . $e->getMessage(), [
                'enrollment_id' => $enrollment->id,
                'user_id' => $user->id,
                'next_term' => $nextTermInfo,
            ]);
            return back()->withErrors(['error' => 'Failed to re-enroll student. Please try again.']);
        }
    }

    /**
     * Directly enroll a returning student (who came in person with grades).
     * This bypasses the enrollment form since they are returning students.
     */
    public function enrollReturningStudent(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'student_info_id' => 'required|exists:student_personal_info,id',
            'school_year_id' => 'required|exists:school_year,id',
            'semester_id' => 'required|exists:semester,id',
            'assigned_strand_id' => 'required|exists:strands,id',
            'assigned_section_id' => 'required|exists:sections,id',
        ]);

        // Validate that the section belongs to the correct strand, semester, and school year
        $section = Section::find($validated['assigned_section_id']);
        if (!$section) {
            return back()->withErrors(['error' => 'Selected section not found.']);
        }

        if ($section->strand_id !== (int) $validated['assigned_strand_id']) {
            return back()->withErrors(['assigned_section_id' => 'The selected section does not belong to the chosen strand.']);
        }

        if ($section->school_year_id !== (int) $validated['school_year_id'] || $section->semester_id !== (int) $validated['semester_id']) {
            return back()->withErrors(['assigned_section_id' => 'The selected section does not belong to the target school year/semester.']);
        }

        DB::beginTransaction();
        try {
            // Check if an enrollment already exists for this student in the target term
            $existingEnrollment = Enrollment::where('student_personal_info_id', $validated['student_info_id'])
                ->where('school_year_id', $validated['school_year_id'])
                ->where('semester_id', $validated['semester_id'])
                ->lockForUpdate()
                ->first();

            if ($existingEnrollment) {
                DB::rollBack();
                return back()->withErrors(['error' => 'This student is already enrolled for this term.']);
            }

            // Create a new enrollment record directly (no form submission needed)
            $newEnrollment = Enrollment::create([
                'student_personal_info_id' => $validated['student_info_id'],
                'school_year_id' => $validated['school_year_id'],
                'semester_id' => $validated['semester_id'],
                'assigned_strand_id' => $validated['assigned_strand_id'],
                'assigned_section_id' => $validated['assigned_section_id'],
                'status' => Enrollment::STATUS_ENROLLED,
                'enrolled_by' => $user->id,
                'approved_by' => $user->id,
                'approved_at' => now(),
                'submitted_at' => now(),
                'processed_at' => now(),
                'confirmed_at' => now(),
            ]);

            // Create class details for the new enrollment (mark as re-enrollment)
            $this->createClassDetailsForEnrollment($newEnrollment, $user->id, true);

            DB::commit();

            return redirect()
                ->route('registrar.enrollments')
                ->with('success', 'Returning student enrolled successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to enroll returning student: ' . $e->getMessage(), [
                'student_info_id' => $validated['student_info_id'],
                'user_id' => $user->id,
            ]);
            return back()->withErrors(['error' => 'Failed to enroll student. Please try again.']);
        }
    }

    /**
     * Display re-enrollment page with enrolled students.
     */
    public function reEnrollPage()
    {
        $activeSchoolYear = SchoolYear::where('is_active', true)->first();
        $activeSemester = Semester::where('is_active', true)->first();
        
        // Check if active semester is Summer
        $isSummerSemester = $activeSemester && 
            str_contains(strtolower($activeSemester->semester_type ?? ''), 'summer');

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
            
            // Check if student is already enrolled in the active summer semester
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
                
                // Check if current strand is STEM
                $isSTEM = stripos($latestEnrollment->assignedStrand?->Strand_code ?? '', 'STEM') !== false;
                
                foreach ($grades as $grade) {
                    $subject = $grade->subject;
                    $hasPrerequisites = $subject && !empty($subject->PREREQUISITES);
                    $finalGrade = $grade->semester_grade ?? 0;
                    
                    // Determine passing threshold based on strand and prerequisite status
                    $passingThreshold = ($isSTEM && $hasPrerequisites) ? 85 : 75;
                    $failed = ($finalGrade < $passingThreshold) || $grade->remarks === 'Failed';
                    
                    if ($failed) {
                        $hasFailedGrades = true;
                        $isPrerequisiteSubject = $hasPrerequisites;
                        
                        $failedGrades[] = [
                            'subject_name' => $grade->subject?->Subject_name ?? $grade->subject_name_snapshot,
                            'subject_code' => $grade->subject?->Subject_code ?? $grade->subject_code_snapshot,
                            'subject_id' => $grade->subject_id,
                            'grade' => $finalGrade,
                            'is_prerequisite' => $isPrerequisiteSubject,
                            'threshold' => $passingThreshold,
                        ];
                        
                        // For STEM: Check if failed prerequisite (< 85)
                        if ($isSTEM && $isPrerequisiteSubject && $finalGrade < 85) {
                            $hasFailedPrerequisites = true;
                        }
                    }
                }
                
                // For summer semester: only show students with failed grades
                if ($isSummerSemester && !$hasFailedGrades) {
                    return null; // Filter out students without failed grades
                }
                
                // Apply rules based on strand
                if ($isSTEM) {
                    // STEM STUDENT LOGIC
                        if ($hasFailedPrerequisites) {
                        // Failed prerequisite (< 85) → Must transfer strand, NO summer class
                        $canReEnrollToSameStrand = false;
                        $needsSummerClasses = false;
                        $warnings[] = 'STEM student failed prerequisite subject(s) (< 85). Must transfer to another strand in the new semester. Summer classes are NOT available for prerequisite failures.';
                    } elseif ($hasFailedGrades) {
                        // Failed non-prerequisite (< 75) → Summer class only
                        $canReEnrollToSameStrand = true;
                        $needsSummerClasses = true;
                        $warnings[] = 'STEM student has failed non-prerequisite subject(s) (< 75). Summer classes required before re-enrollment.';
                    }
                } else {
                    // OTHER STRANDS (HUMSS, ABM, TVL) LOGIC
                    // Any failed subject (< 75) → Summer class only
                    if ($hasFailedGrades) {
                        $needsSummerClasses = true;
                        $canReEnrollToSameStrand = true; // Can re-enroll to same strand after summer
                        $warnings[] = 'Student has failed subject(s) (< 75). Summer classes required before re-enrollment.';
                    }
                }
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
                'is_enrolled_in_summer' => $isEnrolledInActiveSummer,
                'can_reenroll_to_same_strand' => $canReEnrollToSameStrand,
                'warnings' => $warnings,
                'academic_status' => $isEnrolledInActiveSummer ? 'enrolled' : ($hasFailedPrerequisites ? 'critical' : ($needsSummerClasses ? 'warning' : 'good')),
            ];
        })
        ->filter(); // Remove null entries (students without failed grades in summer semester)

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

        return Inertia::render('Registrar/ReEnrollStudents', [
            'enrolledStudents' => $enrolledStudents,
            'activeSchoolYear' => $activeSchoolYear ? [
                'id' => $activeSchoolYear->id,
                'label' => $activeSchoolYear->School_year_start . '-' . $activeSchoolYear->School_year_end,
            ] : null,
            'activeSemester' => $activeSemester ? [
                'id' => $activeSemester->id,
                'label' => $activeSemester->semester_type,
            ] : null,
            'isSummerSemester' => $isSummerSemester,
            'strands' => $activeStrands,
            'sections' => $activeSections,
        ]);
    }

    /**
     * Re-enroll a student with optional strand and section assignment.
     */
    public function reEnrollAuto(Request $request)
    {
        $user = Auth::user();

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
            
            // Get the target semester
            $targetSemester = Semester::findOrFail($validated['semester_id']);
            $isSummerSemester = str_contains(strtolower($targetSemester->semester_type ?? ''), 'summer');
            
            // Get the latest enrolled enrollment
            $latestEnrollment = Enrollment::where('student_personal_info_id', $studentInfo->id)
                ->where('status', Enrollment::STATUS_ENROLLED)
                ->with(['assignedStrand', 'assignedSection'])
                ->latest('processed_at')
                ->first();

            if (!$latestEnrollment) {
                throw new \Exception('No previous enrollment found for this student.');
            }

            // For summer semester: verify student has failed grades
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
                        // Ensure grade has a valid subject_id
                        return $grade->subject_id !== null;
                    });
                
                if ($failedGrades->isEmpty()) {
                    throw new \Exception('Student has no failed grades. Only students with failed grades can enroll in summer semester.');
                }
                
                Log::info('Found failed grades for summer enrollment', [
                    'student_id' => $studentInfo->id,
                    'failed_grades_count' => $failedGrades->count(),
                    'subject_ids' => $failedGrades->pluck('subject_id')->all(),
                    'subject_names' => $failedGrades->map(function ($g) {
                        return $g->subject?->Subject_name ?? $g->subject_name_snapshot ?? 'Unknown';
                    })->all(),
                ]);
            }

            // Check if student is already enrolled for this term
            $existingEnrollment = Enrollment::where('student_personal_info_id', $studentInfo->id)
                ->where('school_year_id', $validated['school_year_id'])
                ->where('semester_id', $validated['semester_id'])
                ->first();

            if ($existingEnrollment) {
                throw new \Exception('Student is already enrolled for this term.');
            }

            // For summer semester: Handle STEM vs non-STEM logic
            $isSTEM = stripos($latestEnrollment->assignedStrand?->Strand_code ?? '', 'STEM') !== false;
            
            if ($isSummerSemester && $isSTEM) {
                // STEM students with failed grades: must be assigned to different strand
                if (!$validated['assigned_strand_id'] || $validated['assigned_strand_id'] == $latestEnrollment->assigned_strand_id) {
                    throw new \Exception('STEM students with failed grades must be assigned to a different strand for summer semester.');
                }
                
                // Verify the new strand is not STEM
                $newStrand = Strand::findOrFail($validated['assigned_strand_id']);
                if (stripos($newStrand->Strand_code ?? '', 'STEM') !== false) {
                    throw new \Exception('STEM students cannot continue in STEM strand. Please assign to a different strand (e.g., TVL or HUMSS).');
                }
            }

            // Use provided strand/section, or fall back to latest enrollment (for non-summer or non-STEM)
            $assignedStrandId = $validated['assigned_strand_id'] ?? $latestEnrollment->assigned_strand_id;
            $assignedSectionId = $validated['assigned_section_id'] ?? $latestEnrollment->assigned_section_id;

            // Validate the section if provided
            if ($assignedSectionId) {
                $section = Section::find($assignedSectionId);
                if (!$section) {
                    throw new \Exception('Selected section not found.');
                }

                // Validate section belongs to the correct strand
                if ($assignedStrandId && $section->strand_id !== (int) $assignedStrandId) {
                    throw new \Exception('The selected section does not belong to the chosen strand.');
                }

                // Validate section belongs to the correct term
                if ($section->school_year_id !== (int) $validated['school_year_id'] || 
                    $section->semester_id !== (int) $validated['semester_id']) {
                    throw new \Exception('The selected section does not belong to the target school year/semester.');
                }

                // Validate section is active
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

            // Load relationships needed for class creation
            $newEnrollment->load(['assignedSection', 'semester', 'schoolYear']);

            // Create class details if section is assigned
            if ($assignedSectionId) {
                // For summer semester: create classes for failed subjects if they don't exist
                if ($isSummerSemester && $failedGrades && $failedGrades->isNotEmpty()) {
                    $this->createClassesForFailedSubjects($newEnrollment, $failedGrades, $user->id);
                }
                
                // Create class details (enrollment records)
                $this->createClassDetailsForEnrollment($newEnrollment, $user->id, false, $isSummerSemester ? $failedGrades : null);
            }

            DB::commit();

            // Redirect back to enrollment page to show COR in split view
            return redirect()
                ->route('registrar.students.enroll', ['student' => $studentInfo->id])
                ->with('success', 'Student re-enrolled successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Auto re-enrollment failed: ' . $e->getMessage(), [
                'student_info_id' => $validated['student_info_id'] ?? null,
                'user_id' => $user->id,
            ]);
            return back()->withErrors(['message' => $e->getMessage()]);
        }
    }

    /**
     * Get schedule preview for a section (API endpoint for enrollment page).
     */
    public function getSectionSchedulePreview(Section $section)
    {
        $schoolYearId = request('school_year_id');
        $semesterId = request('semester_id');

        $classes = ClassModel::with(['subject', 'faculty'])
            ->where('Section_id', $section->id)
            ->where('school_year_id', $schoolYearId)
            ->where('Semester_id', $semesterId)
            ->where('is_active', true)
            ->get()
            ->map(function ($class) {
                return [
                    'id' => $class->Id,
                    'subject_name' => $class->subject?->Subject_name ?? 'Unknown Subject',
                    'subject_code' => $class->subject?->Subject_code ?? 'N/A',
                    'day_of_week' => $class->day_of_week,
                    'start_time' => \Carbon\Carbon::parse($class->start_time)->format('H:i'),
                    'end_time' => \Carbon\Carbon::parse($class->endtime)->format('H:i'),
                    'faculty_name' => $class->faculty 
                        ? trim(($class->faculty->FirstName ?? '') . ' ' . ($class->faculty->LastName ?? ''))
                        : 'TBA',
                ];
            });

        return response()->json([
            'classes' => $classes,
            'section' => [
                'id' => $section->id,
                'name' => $section->section_name,
            ]
        ]);
    }

    /**
     * Show enrollment page for a specific student (for re-enrollment with strand/section assignment).
     */
    public function showEnrollmentPage($studentId)
    {
        $student = StudentPersonalInfo::with(['user'])->findOrFail($studentId);
        
        // Get the latest enrollment
        $latestEnrollment = Enrollment::where('student_personal_info_id', $student->id)
            ->where('status', Enrollment::STATUS_ENROLLED)
            ->with(['schoolYear', 'semester', 'assignedStrand', 'assignedSection'])
            ->latest('processed_at')
            ->first();

        $activeSchoolYear = SchoolYear::where('is_active', true)->first();
        $activeSemester = Semester::where('is_active', true)->first();

        // Check if student is already enrolled for the current term
        $currentTermEnrollment = null;
        if ($activeSchoolYear && $activeSemester) {
            $currentTermEnrollment = Enrollment::where('student_personal_info_id', $student->id)
                ->where('school_year_id', $activeSchoolYear->id)
                ->where('semester_id', $activeSemester->id)
                ->where('status', Enrollment::STATUS_ENROLLED)
                ->first();
        }

        // Get academic status and failed grades
        $failedGrades = [];
        $hasFailedPrerequisites = false;
        $needsSummerClasses = false;
        $canReEnrollToSameStrand = true;
        $warnings = [];
        
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
                
                // Determine passing threshold based on strand and prerequisite status
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
                    
                    // For STEM: Check if failed prerequisite (< 85)
                    if ($isSTEM && $isPrerequisiteSubject && $finalGrade < 85) {
                        $hasFailedPrerequisites = true;
                    }
                }
            }
            
            // Apply rules based on strand
            if ($isSTEM) {
                // STEM STUDENT LOGIC
                    if ($hasFailedPrerequisites) {
                    // Failed prerequisite (< 85) → Must transfer strand, NO summer class
                    $canReEnrollToSameStrand = false;
                    $needsSummerClasses = false;
                    $warnings[] = 'STEM student failed prerequisite subject(s) (< 85). Must transfer to another strand in the new semester. Summer classes are NOT available for prerequisite failures.';
                } elseif (!empty($failedGrades)) {
                    // Failed non-prerequisite (< 75) → Summer class only
                    $canReEnrollToSameStrand = true;
                    $needsSummerClasses = true;
                    $warnings[] = 'STEM student has failed non-prerequisite subject(s) (< 75). Summer classes required before re-enrollment.';
                }
            } else {
                // OTHER STRANDS (HUMSS, ABM, TVL) LOGIC
                // Any failed subject (< 75) → Summer class only
                if (!empty($failedGrades)) {
                    $needsSummerClasses = true;
                    $canReEnrollToSameStrand = true; // Can re-enroll to same strand after summer
                    $warnings[] = 'Student has failed subject(s) (< 75). Summer classes required before re-enrollment.';
                }
            }
        }

        // Get available strands and sections for the active term
        $strands = Strand::where('Is_active', true)->get();
        
        $sections = Section::where('is_active', true)
            ->where('school_year_id', $activeSchoolYear?->id)
            ->where('semester_id', $activeSemester?->id)
            ->with('strand')
            ->get();

        return Inertia::render('Registrar/EnrollStudent', [
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
            'needsSummerClasses' => $needsSummerClasses,
            'canReEnrollToSameStrand' => $canReEnrollToSameStrand,
            'warnings' => $warnings,
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
        ]);
    }

    /**
     * Display credited subjects management page.
     */
    public function creditedSubjects()
    {
        $transfereeEnrollments = Enrollment::with([
            'studentPersonalInfo.user',
            'creditedSubjects.subject',
            'creditedSubjects.creditedBy',
            'creditedSubjects.approvedBy',
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
                        // Coordinator who submitted the credit
                        'credited_by' => $credited->creditedBy ? [
                            'name' => trim(($credited->creditedBy->FirstName ?? '') . ' ' . ($credited->creditedBy->LastName ?? '')),
                        ] : null,
                        // Registrar who approved it (if any)
                        'approved_by' => $credited->approvedBy ? [
                            'name' => trim(($credited->approvedBy->FirstName ?? '') . ' ' . ($credited->approvedBy->LastName ?? '')),
                        ] : null,
                        'credited_at' => $credited->credited_at?->format('M d, Y'),
                    ];
                })->values(),
            ];
        });
        
        // Get available subjects for crediting
        $activeSchoolYear = SchoolYear::where('is_active', true)->first();
        $activeSemester = $activeSchoolYear ? 
            Semester::where('school_year_id', $activeSchoolYear->id)
                   ->where('is_active', true)
                   ->first() : null;
        
        $subjects = Subject::with(['strand'])
            ->when($activeSchoolYear, function ($query) use ($activeSchoolYear) {
                return $query->where('school_year_id', $activeSchoolYear->id);
            })
            ->when($activeSemester, function ($query) use ($activeSemester) {
                return $query->where('semester_id', $activeSemester->id);
            })
            ->orderBy('Subject_name')
            ->get(['Id', 'Subject_name', 'Subject_code', 'strand_id', 'year_level', 'Semester', 'semester_id']);

        return Inertia::render('Registrar/CreditedSubjects', [
            'enrollments' => $transfereeEnrollments,
            'subjects' => $subjects,
        ]);
    }

    /**
     * Display credited subjects detail page for a specific enrollment.
     */
    public function creditedSubjectsDetail(Enrollment $enrollment)
    {
        if (!$enrollment->is_transferee) {
            return redirect()->route('registrar.credited-subjects')
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
                    'approved_by' => $credited->approved_by,
                    'approvedBy' => $credited->approvedBy ? [
                        'name' => trim(($credited->approvedBy->FirstName ?? '') . ' ' . ($credited->approvedBy->LastName ?? '')),
                    ] : null,
                    'credited_at' => $credited->credited_at?->format('M d, Y'),
                ];
            })->values(),
        ];
        
        // Get IDs of already credited subjects for this enrollment to exclude them
        $creditedSubjectIds = $enrollment->creditedSubjects->pluck('subject_id')->toArray();

        // Get available subjects for crediting - filter by enrollment's strand if available
        $subjects = Subject::select('Id', 'Subject_name', 'Subject_code', 'strand_id', 'year_level', 'Semester', 'semester_id')
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
            $subjects = Subject::select('Id', 'Subject_name', 'Subject_code', 'strand_id', 'year_level', 'Semester', 'semester_id')
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

        return Inertia::render('Registrar/CreditedSubjectsDetail', [
            'enrollment' => $enrollmentData,
            'subjects' => $subjects,
        ]);
    }

    /**
     * Store a credited subject for a transferee student.
     */
    public function storeCreditedSubject(Request $request)
    {
        $validated = $request->validate([
            'enrollment_id' => 'required|exists:enrollments,id',
            'subject_id' => 'required|exists:subjects,Id',
            'credited_grade' => 'nullable|numeric|min:0|max:100',
            'remarks' => 'nullable|string|max:500',
            'previous_school' => 'nullable|string|max:255',
            'quarter1' => 'nullable|numeric|min:0|max:100',
            'quarter2' => 'nullable|numeric|min:0|max:100',
        ]);

        $enrollment = Enrollment::with('studentPersonalInfo')->findOrFail($validated['enrollment_id']);

        if (!$enrollment->is_transferee) {
            return back()->withErrors(['error' => 'Only transferee students can have credited subjects.']);
        }

        // Auto-populate previous school from student registration data
        $previousSchool = $enrollment->studentPersonalInfo->last_school_attended ?? $validated['previous_school'] ?? null;

        // Check if subject already credited
        $existing = CreditedSubject::where('enrollment_id', $validated['enrollment_id'])
            ->where('subject_id', $validated['subject_id'])
            ->first();

        if ($existing) {
            return back()->withErrors(['error' => 'This subject has already been credited for this student.']);
        }

        // Compute average if quarters provided
        $avg = null;
        if (array_key_exists('quarter1', $validated) && array_key_exists('quarter2', $validated)) {
            $q1 = $validated['quarter1'];
            $q2 = $validated['quarter2'];
            if ($q1 !== null && $q2 !== null) {
                $avg = round(($q1 + $q2) / 2, 2);
            }
        }
        if ($validated['credited_grade'] !== null) {
            $avg = $validated['credited_grade'];
        }

        $credited = CreditedSubject::create([
            'student_personal_info_id' => $enrollment->student_personal_info_id,
            'enrollment_id' => $validated['enrollment_id'],
            'subject_id' => $validated['subject_id'],
            'previous_school' => $previousSchool,
            'quarter1' => $validated['quarter1'] ?? null,
            'quarter2' => $validated['quarter2'] ?? null,
            'credited_grade' => $avg,
            'remarks' => null, // auto-set below
            // Coordinator already stored in credited_by; registrar is the approver
            'approved_by' => $validated['credited_grade'] !== null ? Auth::id() : null,
            'credited_at' => $validated['credited_grade'] !== null ? now() : null,
        ]);

        // Auto remarks based on grade if provided
        if ($credited->credited_grade !== null) {
            $credited->remarks = $credited->credited_grade >= 75 ? 'Passed' : 'Failed';
            $credited->save();
        }

        return back()->with('success', 'Subject credited successfully.');
    }

    /**
     * Update a credited subject (Registrar approval/edit).
     */
    public function updateCreditedSubject(Request $request, CreditedSubject $creditedSubject)
    {
        Log::info('updateCreditedSubject called', [
            'credit_id' => $creditedSubject->id,
            'request_data' => $request->all(),
        ]);

        $validated = $request->validate([
            'credited_grade' => 'nullable|numeric|min:0|max:100',
            'remarks' => 'nullable|string|max:500',
            'quarter1' => 'nullable|numeric|min:0|max:100',
            'quarter2' => 'nullable|numeric|min:0|max:100',
        ]);

        Log::info('Validated data', ['validated' => $validated]);

        $update = [];
        if (array_key_exists('quarter1', $validated)) {
            $update['quarter1'] = $validated['quarter1'];
        }
        if (array_key_exists('quarter2', $validated)) {
            $update['quarter2'] = $validated['quarter2'];
        }
        // If quarters provided and both present, compute avg
        if (array_key_exists('quarter1', $validated) && array_key_exists('quarter2', $validated)
            && $validated['quarter1'] !== null && $validated['quarter2'] !== null) {
            $update['credited_grade'] = round(($validated['quarter1'] + $validated['quarter2']) / 2, 2);
            // Registrar approval
            $update['approved_by'] = Auth::id();
            $update['credited_at'] = now();
            $update['remarks'] = $update['credited_grade'] >= 75 ? 'Passed' : 'Failed';
        }
        if (array_key_exists('credited_grade', $validated)) {
            $update['credited_grade'] = $validated['credited_grade'];
            $update['approved_by'] = $validated['credited_grade'] !== null ? Auth::id() : null;
            $update['credited_at'] = $validated['credited_grade'] !== null ? now() : null;
            // Auto remarks
            $update['remarks'] = $validated['credited_grade'] !== null
                ? ($validated['credited_grade'] >= 75 ? 'Passed' : 'Failed')
                : null;
        }
        if (array_key_exists('remarks', $validated) && $validated['remarks'] !== null) {
            // Allow manual override if explicitly provided
            $update['remarks'] = $validated['remarks'];
        }

        Log::info('Update array', ['update' => $update]);

        if (!empty($update)) {
            $creditedSubject->update($update);
            Log::info('Credit updated', ['credit' => $creditedSubject->fresh()]);
        }

        return back()->with('success', 'Credited subject updated successfully.');
    }

    /**
     * Delete a credited subject.
     */
    public function destroyCreditedSubject($creditedSubjectId)
    {
        $creditedSubject = CreditedSubject::findOrFail($creditedSubjectId);
        $creditedSubject->delete();

        return back()->with('success', 'Credited subject removed successfully.');
    }

    /**
     * Bulk re-enroll multiple students.
     */
    public function reEnrollBulk(Request $request)
    {
        $user = Auth::user();

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
                
                // Get the latest enrolled enrollment
                $latestEnrollment = Enrollment::where('student_personal_info_id', $studentInfo->id)
                    ->where('status', Enrollment::STATUS_ENROLLED)
                    ->with(['assignedStrand', 'assignedSection'])
                    ->latest('processed_at')
                    ->first();

                if (!$latestEnrollment) {
                    throw new \Exception('No previous enrollment found.');
                }

                // Check if student is already enrolled for this term
                $existingEnrollment = Enrollment::where('student_personal_info_id', $studentInfo->id)
                    ->where('school_year_id', $validated['school_year_id'])
                    ->where('semester_id', $validated['semester_id'])
                    ->first();

                if ($existingEnrollment) {
                    throw new \Exception('Already enrolled for this term.');
                }

                // Use the same strand and section from latest enrollment
                $assignedStrandId = $latestEnrollment->assigned_strand_id;
                $assignedSectionId = $latestEnrollment->assigned_section_id;

                // Validate the section is still active and belongs to the term
                $section = Section::where('id', $assignedSectionId)
                    ->where('school_year_id', $validated['school_year_id'])
                    ->where('semester_id', $validated['semester_id'])
                    ->where('is_active', true)
                    ->first();

                if (!$section) {
                    throw new \Exception('Previous section not available for this term.');
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
                ]);

                // Create class details
                $this->createClassDetailsForEnrollment($newEnrollment, $user->id);

                DB::commit();
                $successCount++;
            } catch (\Exception $e) {
                DB::rollBack();
                $failedCount++;
                $studentName = trim(($studentInfo->user?->FirstName ?? '') . ' ' . ($studentInfo->user?->LastName ?? '')) ?: 'Unknown';
                $errors[] = $studentName . ': ' . $e->getMessage();
                Log::error('Bulk re-enrollment failed for student: ' . $studentInfoId, [
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
     * Display registrar reports and analytics.
     */
    public function reports()
    {
        $activeSchoolYear = SchoolYear::where('is_active', true)->first();
        $activeSemester = $activeSchoolYear ? 
            Semester::where('school_year_id', $activeSchoolYear->id)
                   ->where('is_active', true)
                   ->first() : null;

        // Get filter parameters
        $schoolYearId = request('school_year_id', $activeSchoolYear?->id);
        $semesterId = request('semester_id', $activeSemester?->id);
        $strandId = request('strand_id');

        // Get analytics data
        $analytics = $this->getAnalyticsData(
            $schoolYearId ? SchoolYear::find($schoolYearId) : $activeSchoolYear,
            $semesterId ? Semester::find($semesterId) : $activeSemester
        );

        // Enrollment statistics
        $enrollmentsBase = Enrollment::query()
            ->when($schoolYearId, function ($query) use ($schoolYearId) {
                $query->where('school_year_id', $schoolYearId);
            })
            ->when($semesterId, function ($query) use ($semesterId) {
                $query->where('semester_id', $semesterId);
            });

        $enrollmentStats = [
            'total' => (clone $enrollmentsBase)->count(),
            'pre_enrolled' => (clone $enrollmentsBase)->where('status', Enrollment::STATUS_PRE_ENROLLED)->count(),
            'recommended' => (clone $enrollmentsBase)->where('status', Enrollment::STATUS_RECOMMENDED)->count(),
            'enrolled' => (clone $enrollmentsBase)->where('status', Enrollment::STATUS_ENROLLED)->count(),
            'rejected' => (clone $enrollmentsBase)->where('status', Enrollment::STATUS_REJECTED)->count(),
        ];

        $enrollmentsBase = Enrollment::where('status', Enrollment::STATUS_ENROLLED)
            ->when($schoolYearId, fn($q) => $q->where('school_year_id', $schoolYearId))
            ->when($semesterId, fn($q) => $q->where('semester_id', $semesterId));

        // Overall statistics
        $totalStudents = (clone $enrollmentsBase)->count();

        $genderStats = (clone $enrollmentsBase)
            ->join('student_personal_info', 'enrollments.student_personal_info_id', '=', 'student_personal_info.id')
            ->select('student_personal_info.sex', DB::raw('count(*) as count'))
            ->groupBy('student_personal_info.sex')
            ->get();

        $maleCount = $genderStats->where('sex', 'Male')->first()->count ?? 0;
        $femaleCount = $genderStats->where('sex', 'Female')->first()->count ?? 0;

        $enrollmentByStrand = (clone $enrollmentsBase)
            ->leftJoin('strands', 'enrollments.assigned_strand_id', '=', 'strands.id')
            ->select('strands.Strand_name', 'strands.Strand_code', DB::raw('count(*) as count'))
            ->groupBy('strands.id', 'strands.Strand_name', 'strands.Strand_code')
            ->orderBy('count', 'desc')
            ->get()
            ->map(function ($item) {
                return [
                    'strand' => $item->Strand_name ?? 'Unassigned',
                    'code' => $item->Strand_code ?? 'N/A',
                    'count' => $item->count,
                ];
            });

        // By grade level
        $enrollmentByGrade = (clone $enrollmentsBase)
            ->join('student_personal_info', 'enrollments.student_personal_info_id', '=', 'student_personal_info.id')
            ->select('student_personal_info.grade_level', DB::raw('count(*) as count'))
            ->groupBy('student_personal_info.grade_level')
            ->orderBy('student_personal_info.grade_level')
            ->get()
            ->map(function ($item) {
                return [
                    'grade' => $item->grade_level ? "Grade {$item->grade_level}" : 'Not Set',
                    'count' => $item->count,
                ];
            });

        $data = [
            'total_students' => $totalStudents,
            'male_count' => $maleCount,
            'female_count' => $femaleCount,
        ];

        // Academic statistics
        $academicStats = [
            'sections' => $schoolYearId && $semesterId
                ? Section::where('school_year_id', $schoolYearId)
                         ->where('semester_id', $semesterId)
                         ->count()
                : 0,
            'subjects' => $schoolYearId && $semesterId
                ? Subject::where('school_year_id', $schoolYearId)
                         ->where('semester_id', $semesterId)
                         ->count()
                : 0,
            'classes' => $schoolYearId && $semesterId
                ? ClassModel::where('school_year_id', $schoolYearId)
                           ->where('Semester_id', $semesterId)
                           ->count()
                : 0,
            'strands' => $semesterId
                ? DB::table('strand_semester')
                    ->where('semester_id', $semesterId)
                    ->where('is_active', true)
                    ->count()
                : ($schoolYearId
                    ? DB::table('strand_school_year')
                        ->where('school_year_id', $schoolYearId)
                        ->where('is_active', true)
                        ->count()
                    : 0),
            'faculty' => User::where('Role', 'Faculty')->count(),
        ];

        // Grade statistics
        $gradeStats = [];
        if ($schoolYearId && $semesterId) {
            $semester = Semester::find($semesterId);
            if ($semester) {
                $semesterCode = $this->mapSemesterToCode($semester->semester_type);
                $gradesBase = Grade::query()
                    ->where('school_year_id', $schoolYearId)
                    ->where('semester', $semesterCode);

                $gradeStats = [
                    'total_grades' => (clone $gradesBase)->count(),
                    'approved' => (clone $gradesBase)->whereNotNull('approved_at')->count(),
                    'pending' => (clone $gradesBase)->whereNull('approved_at')->count(),
                ];
            }
        }

        // Get all school years and semesters for filters
        $schoolYears = SchoolYear::orderBy('School_year_start', 'desc')->get()->map(function ($sy) {
            return [
                'id' => $sy->id,
                'formatted' => $sy->formatted ?? ($sy->School_year_start . '-' . $sy->School_year_end),
            ];
        });

        $semesters = Semester::with('schoolYear')
            ->when($schoolYearId, function ($query) use ($schoolYearId) {
                $query->where('school_year_id', $schoolYearId);
            })
            ->orderBy('semester_type')
            ->get()
            ->map(function ($semester) {
                return [
                    'id' => $semester->id,
                    'semester_type' => $semester->semester_type,
                    'school_year_id' => $semester->school_year_id,
                ];
            });

        $strandOptions = Strand::orderBy('Strand_name')
            ->get(['id', 'Strand_name', 'Strand_code'])
            ->map(function ($strand) {
                return [
                    'id' => $strand->id,
                    'name' => $strand->Strand_name,
                    'code' => $strand->Strand_code,
                ];
            });

        // Faculty Load Analysis
        $facultyLoads = $this->calculateFacultyLoads($schoolYearId, $semesterId);

        return Inertia::render('Registrar/Reports', [
            'analytics' => $analytics,
            'enrollmentStats' => $enrollmentStats,
            'enrollmentByStrand' => $enrollmentByStrand,
            'enrollmentByGrade' => $enrollmentByGrade,
            'academicStats' => $academicStats,
            'gradeStats' => $gradeStats,
            'facultyLoads' => $facultyLoads,
            'strandOptions' => $strandOptions,
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
                'school_year_id' => $schoolYearId,
                'semester_id' => $semesterId,
                'strand_id' => request('strand_id'),
            ],
        ]);
    }

    /**
     * Calculate faculty loads based on sections taught.
     * 1 load = 1 section taught by a teacher
     * Weekly hours = sum of all class hours per section across the week
     */
    private function calculateFacultyLoads(?int $schoolYearId = null, ?int $semesterId = null): array
    {
        $query = ClassModel::with(['faculty', 'section', 'subject'])
            ->where('is_active', true);

        if ($schoolYearId) {
            $query->where('school_year_id', $schoolYearId);
        }

        if ($semesterId) {
            $query->where('Semester_id', $semesterId);
        }

        $classes = $query->get();

        // Group by faculty and section to calculate loads
        $facultyLoadData = [];
        
        foreach ($classes as $class) {
            if (!$class->faculty || !$class->section) {
                continue;
            }

            $facultyId = $class->faculty_id;
            $facultyName = trim(($class->faculty->FirstName ?? '') . ' ' . ($class->faculty->LastName ?? ''));
            $sectionId = $class->Section_id;
            $sectionName = $class->section->section_name ?? 'Unknown';
            $subjectName = $class->subject->Subject_name ?? 'Unknown';
            
            // Calculate hours for this class meeting
            $startTime = \Carbon\Carbon::parse($class->start_time);
            $endTime = \Carbon\Carbon::parse($class->endtime);
            $classHours = $startTime->diffInHours($endTime) + ($startTime->diffInMinutes($endTime) % 60) / 60;

            if (!isset($facultyLoadData[$facultyId])) {
                $facultyLoadData[$facultyId] = [
                    'faculty_id' => $facultyId,
                    'faculty_name' => $facultyName,
                    'faculty_email' => $class->faculty->email ?? '',
                    'sections' => [],
                    'unique_sections' => [],
                    'total_loads' => 0,
                    'total_weekly_hours' => 0,
                    'subjects' => [],
                ];
            }

            // Track unique sections (1 section = 1 load)
            if (!in_array($sectionId, $facultyLoadData[$facultyId]['unique_sections'])) {
                $facultyLoadData[$facultyId]['unique_sections'][] = $sectionId;
                $facultyLoadData[$facultyId]['total_loads']++;
            }

            // Track section details - accumulate hours across all class meetings for this section
            $sectionKey = $sectionId;
            if (!isset($facultyLoadData[$facultyId]['sections'][$sectionKey])) {
                $facultyLoadData[$facultyId]['sections'][$sectionKey] = [
                    'section_id' => $sectionId,
                    'section_name' => $sectionName,
                    'subjects' => [],
                    'class_meetings' => [],
                    'weekly_hours' => 0,
                ];
            }

            // Add class meeting details
            $facultyLoadData[$facultyId]['sections'][$sectionKey]['class_meetings'][] = [
                'subject' => $subjectName,
                'day' => $class->day_of_week,
                'time' => $class->start_time . ' - ' . $class->endtime,
                'hours' => round($classHours, 2),
            ];

            // Accumulate weekly hours for this section
            $facultyLoadData[$facultyId]['sections'][$sectionKey]['weekly_hours'] += $classHours;

            // Add subject to section (unique)
            if (!in_array($subjectName, $facultyLoadData[$facultyId]['sections'][$sectionKey]['subjects'])) {
                $facultyLoadData[$facultyId]['sections'][$sectionKey]['subjects'][] = $subjectName;
            }

            // Track unique subjects across all sections
            if (!in_array($subjectName, $facultyLoadData[$facultyId]['subjects'])) {
                $facultyLoadData[$facultyId]['subjects'][] = $subjectName;
            }
        }

        // Calculate total weekly hours per faculty and round section hours
        foreach ($facultyLoadData as $facultyId => &$data) {
            $totalWeeklyHours = 0;
            foreach ($data['sections'] as &$section) {
                $section['weekly_hours'] = round($section['weekly_hours'], 2);
                $totalWeeklyHours += $section['weekly_hours'];
            }
            $data['total_weekly_hours'] = round($totalWeeklyHours, 2);
            
            // Convert sections array to indexed array
            $data['sections'] = array_values($data['sections']);
            
            // Add status indicators
            $data['is_overloaded'] = $data['total_loads'] > 5;
            $data['is_underloaded'] = $data['total_loads'] < 5 && $data['total_weekly_hours'] < 20;
            $data['is_optimal'] = $data['total_loads'] <= 5 && $data['total_weekly_hours'] >= 20 && $data['total_weekly_hours'] <= 30;
            $data['status'] = $data['is_overloaded'] ? 'overloaded' : ($data['is_underloaded'] ? 'underloaded' : ($data['is_optimal'] ? 'optimal' : 'normal'));
        }

        // Sort by total loads (descending)
        usort($facultyLoadData, function ($a, $b) {
            return $b['total_loads'] <=> $a['total_loads'];
        });

        // Calculate summary statistics
        $facultyWithLoads = array_filter($facultyLoadData, fn($f) => $f['total_loads'] > 0);
        $summary = [
            'total_faculty' => count($facultyLoadData),
            'faculty_with_loads' => count($facultyWithLoads),
            'overloaded_faculty' => count(array_filter($facultyLoadData, fn($f) => $f['is_overloaded'])),
            'underloaded_faculty' => count(array_filter($facultyLoadData, fn($f) => $f['is_underloaded'])),
            'optimal_faculty' => count(array_filter($facultyLoadData, fn($f) => $f['is_optimal'])),
            'average_loads' => count($facultyWithLoads) > 0 
                ? round(array_sum(array_column($facultyWithLoads, 'total_loads')) / count($facultyWithLoads), 2)
                : 0,
            'average_weekly_hours' => count($facultyWithLoads) > 0
                ? round(array_sum(array_column($facultyWithLoads, 'total_weekly_hours')) / count($facultyWithLoads), 2)
                : 0,
        ];

        return [
            'faculty' => array_values($facultyLoadData),
            'summary' => $summary,
        ];
    }

    /**
     * Generate PDF for Faculty Loads Report
     */
    public function downloadFacultyLoadsPdf(Request $request)
    {
        $schoolYearId = $request->input('school_year_id');
        $semesterId = $request->input('semester_id');
        
        $activeSchoolYear = $schoolYearId ? SchoolYear::find($schoolYearId) : SchoolYear::where('is_active', true)->first();
        $activeSemester = $semesterId ? Semester::find($semesterId) : null;
        
        $facultyLoads = $this->calculateFacultyLoads($schoolYearId, $semesterId);
        
        $data = [
            'facultyLoads' => $facultyLoads,
            'school_year' => $activeSchoolYear?->formatted ?? 'All School Years',
            'semester' => $activeSemester?->semester_type ?? 'All Semesters',
            'generated_at' => now()->format('F d, Y g:i A'),
        ];
        
        $pdf = PDF::loadView('pdf.registrar.faculty-loads', $data);
        $filename = 'faculty-loads-report-' . now()->format('Y-m-d') . '.pdf';
        return $pdf->download($filename);
    }

    /**
     * Generate PDF for Subjects Report
     */
    public function downloadSubjectsPdf(Request $request)
    {
        $schoolYearId = $request->input('school_year_id');
        $semesterId = $request->input('semester_id');
        
        $activeSchoolYear = $schoolYearId ? SchoolYear::find($schoolYearId) : SchoolYear::where('is_active', true)->first();
        $activeSemester = $semesterId ? Semester::find($semesterId) : null;
        
        $subjectsQuery = Subject::with(['strand', 'semester', 'schoolYear'])
            ->when($schoolYearId, fn($q) => $q->where('school_year_id', $schoolYearId))
            ->when($semesterId, fn($q) => $q->where('semester_id', $semesterId))
            ->orderBy('Subject_name');
        
        $subjects = $subjectsQuery->get();
        
        $data = [
            'subjects' => $subjects,
            'school_year' => $activeSchoolYear?->formatted ?? 'All School Years',
            'semester' => $activeSemester?->semester_type ?? 'All Semesters',
            'total_subjects' => $subjects->count(),
            'generated_at' => now()->format('F d, Y g:i A'),
        ];
        
        $pdf = PDF::loadView('pdf.registrar.subjects', $data)->setPaper('a4', 'landscape');
        $filename = 'subjects-report-' . now()->format('Y-m-d') . '.pdf';
        return $pdf->download($filename);
    }

    /**
     * Generate PDF for Sections Report
     */
    public function downloadSectionsPdf(Request $request)
    {
        $schoolYearId = $request->input('school_year_id');
        $semesterId = $request->input('semester_id');
        
        $activeSchoolYear = $schoolYearId ? SchoolYear::find($schoolYearId) : SchoolYear::where('is_active', true)->first();
        $activeSemester = $semesterId ? Semester::find($semesterId) : null;
        
        $sectionsQuery = Section::with(['strand', 'adviser', 'schoolYear', 'semester'])
            ->when($schoolYearId, fn($q) => $q->where('school_year_id', $schoolYearId))
            ->when($semesterId, fn($q) => $q->where('semester_id', $semesterId))
            ->orderBy('section_name');
        
        $sections = $sectionsQuery->get()->map(function ($section) {
            $enrollmentCount = Enrollment::where('assigned_section_id', $section->id)
                ->where('status', Enrollment::STATUS_ENROLLED)
                ->count();
            
            return [
                'section_name' => $section->section_name,
                'strand' => $section->strand?->Strand_name ?? 'N/A',
                'adviser' => $section->adviser ? trim(($section->adviser->FirstName ?? '') . ' ' . ($section->adviser->LastName ?? '')) : 'N/A',
                'student_count' => $enrollmentCount,
                'is_active' => $section->is_active,
            ];
        });
        
        $data = [
            'sections' => $sections,
            'school_year' => $activeSchoolYear?->formatted ?? 'All School Years',
            'semester' => $activeSemester?->semester_type ?? 'All Semesters',
            'total_sections' => $sections->count(),
            'generated_at' => now()->format('F d, Y g:i A'),
        ];
        
        $pdf = PDF::loadView('pdf.registrar.sections', $data);
        $filename = 'sections-report-' . now()->format('Y-m-d') . '.pdf';
        return $pdf->download($filename);
    }

    /**
     * Generate PDF for Strands Report
     */
    public function downloadStrandsPdf(Request $request)
    {
        $schoolYearId = $request->input('school_year_id');
        $semesterId = $request->input('semester_id');
        $strandId = $request->input('strand_id');

        $activeSchoolYear = $schoolYearId ? SchoolYear::find($schoolYearId) : SchoolYear::where('is_active', true)->first();
        $activeSemester = $semesterId ? Semester::find($semesterId) : null;

        $strandQuery = Strand::query();

        if ($strandId) {
            $strandQuery->where('id', $strandId);
        }

        if ($semesterId) {
            $strandSemester = DB::table('strand_semester')
                ->where('semester_id', $semesterId)
                ->where('is_active', true)
                ->pluck('strand_id');

            $strandQuery->whereIn('id', $strandSemester);
        } elseif ($schoolYearId) {
            $strandSchoolYear = DB::table('strand_school_year')
                ->where('school_year_id', $schoolYearId)
                ->where('is_active', true)
                ->pluck('strand_id');

            $strandQuery->whereIn('id', $strandSchoolYear);
        } else {
            $strandQuery->where('Is_active', true);
        }

        $strands = $strandQuery->orderBy('Strand_code')->get();

        $strandsWithStats = $strands->map(function ($strand) use ($schoolYearId, $semesterId) {
            $enrollmentQuery = Enrollment::where('assigned_strand_id', $strand->id)
                ->where('status', Enrollment::STATUS_ENROLLED);

            if ($schoolYearId) {
                $enrollmentQuery->where('school_year_id', $schoolYearId);
            }

            if ($semesterId) {
                $enrollmentQuery->where('semester_id', $semesterId);
            }

            $studentCount = $enrollmentQuery->count();

            return [
                'strand_code' => $strand->Strand_code,
                'strand_name' => $strand->Strand_name,
                'student_count' => $studentCount,
                'is_active' => $strand->Is_active,
            ];
        });

        $strandFilter = $strandId ? ($strands->firstWhere('id', $strandId)?->Strand_name ?? 'Specific Strand') : 'All Strands';

        $data = [
            'strands' => $strandsWithStats,
            'school_year' => $activeSchoolYear?->formatted ?? 'All School Years',
            'semester' => $activeSemester?->semester_type ?? 'All Semesters',
            'total_strands' => $strandsWithStats->count(),
            'total_students' => $strandsWithStats->sum('student_count'),
            'strand_filter' => $strandFilter,
            'generated_at' => now()->format('F d, Y g:i A'),
        ];

        $pdf = PDF::loadView('pdf.registrar.strands', $data);
        $filename = 'strands-report-' . now()->format('Y-m-d') . '.pdf';
        return $pdf->download($filename);
    }

    /**
     * Generate PDF for Student Population Report
     */
    public function downloadStudentPopulationPdf(Request $request)
    {
        $schoolYearId = $request->input('school_year_id');
        $semesterId = $request->input('semester_id');
        
        $activeSchoolYear = $schoolYearId ? SchoolYear::find($schoolYearId) : SchoolYear::where('is_active', true)->first();
        $activeSemester = $semesterId ? Semester::find($semesterId) : null;
        
        $enrollmentsBase = Enrollment::where('status', Enrollment::STATUS_ENROLLED)
            ->when($schoolYearId, fn($q) => $q->where('school_year_id', $schoolYearId))
            ->when($semesterId, fn($q) => $q->where('semester_id', $semesterId));

        $totalStudents = (clone $enrollmentsBase)->count();

        $genderStats = (clone $enrollmentsBase)
            ->join('student_personal_info', 'enrollments.student_personal_info_id', '=', 'student_personal_info.id')
            ->select('student_personal_info.sex', DB::raw('count(*) as count'))
            ->groupBy('student_personal_info.sex')
            ->get();

        $maleCount = $genderStats->where('sex', 'Male')->first()->count ?? 0;
        $femaleCount = $genderStats->where('sex', 'Female')->first()->count ?? 0;

        $byStrand = (clone $enrollmentsBase)
            ->leftJoin('strands', 'enrollments.assigned_strand_id', '=', 'strands.id')
            ->select('strands.Strand_name', 'strands.Strand_code', DB::raw('count(*) as count'))
            ->groupBy('strands.id', 'strands.Strand_name', 'strands.Strand_code')
            ->orderBy('count', 'desc')
            ->get()
            ->map(function ($item) {
                return [
                    'strand' => $item->Strand_name ?? 'Unassigned',
                    'code' => $item->Strand_code ?? 'N/A',
                    'count' => $item->count,
                ];
            });

        $byGrade = (clone $enrollmentsBase)
            ->join('student_personal_info', 'enrollments.student_personal_info_id', '=', 'student_personal_info.id')
            ->select('student_personal_info.grade_level', DB::raw('count(*) as count'))
            ->groupBy('student_personal_info.grade_level')
            ->orderBy('student_personal_info.grade_level')
            ->get()
            ->map(function ($item) {
                return [
                    'grade' => $item->grade_level ? "Grade {$item->grade_level}" : 'Not Set',
                    'count' => $item->count,
                ];
            });

        $data = [
            'total_students' => $totalStudents,
            'male_count' => $maleCount,
            'female_count' => $femaleCount,
            'by_strand' => $byStrand,
            'by_grade' => $byGrade,
            'school_year' => $activeSchoolYear?->formatted ?? 'All School Years',
            'semester' => $activeSemester?->semester_type ?? 'All Semesters',
            'generated_at' => now()->format('F d, Y g:i A'),
        ];
        
        $pdf = PDF::loadView('pdf.registrar.student-population', $data);
        $filename = 'student-population-report-' . now()->format('Y-m-d') . '.pdf';
        return $pdf->download($filename);
    }

    /**
     * Generate PDF for Complete Analytics Report
     */
    public function downloadAnalyticsPdf(Request $request)
    {
        $schoolYearId = $request->input('school_year_id');
        $semesterId = $request->input('semester_id');
        
        $activeSchoolYear = $schoolYearId ? SchoolYear::find($schoolYearId) : SchoolYear::where('is_active', true)->first();
        $activeSemester = $semesterId ? Semester::find($semesterId) : null;
        
        // Get all analytics data
        $analytics = $this->getAnalyticsData(
            $schoolYearId ? SchoolYear::find($schoolYearId) : $activeSchoolYear,
            $semesterId ? Semester::find($semesterId) : $activeSemester
        );
        
        $enrollmentsBase = Enrollment::query()
            ->when($schoolYearId, function ($query) use ($schoolYearId) {
                $query->where('school_year_id', $schoolYearId);
            })
            ->when($semesterId, function ($query) use ($semesterId) {
                $query->where('semester_id', $semesterId);
            });
        
        $enrollmentStats = [
            'total' => (clone $enrollmentsBase)->count(),
            'pre_enrolled' => (clone $enrollmentsBase)->where('status', Enrollment::STATUS_PRE_ENROLLED)->count(),
            'recommended' => (clone $enrollmentsBase)->where('status', Enrollment::STATUS_RECOMMENDED)->count(),
            'enrolled' => (clone $enrollmentsBase)->where('status', Enrollment::STATUS_ENROLLED)->count(),
            'rejected' => (clone $enrollmentsBase)->where('status', Enrollment::STATUS_REJECTED)->count(),
        ];
        
        $enrollmentByStrand = (clone $enrollmentsBase)
            ->where('status', Enrollment::STATUS_ENROLLED)
            ->leftJoin('strands', 'enrollments.assigned_strand_id', '=', 'strands.id')
            ->select('strands.Strand_name', 'strands.Strand_code', DB::raw('count(*) as count'))
            ->groupBy('strands.id', 'strands.Strand_name', 'strands.Strand_code')
            ->orderBy('count', 'desc')
            ->get();
        
        $academicStats = [
            'sections' => $schoolYearId && $semesterId
                ? Section::where('school_year_id', $schoolYearId)
                         ->where('semester_id', $semesterId)
                         ->count()
                : 0,
            'subjects' => $schoolYearId && $semesterId
                ? Subject::where('school_year_id', $schoolYearId)
                         ->where('semester_id', $semesterId)
                         ->count()
                : 0,
            'classes' => $schoolYearId && $semesterId
                ? ClassModel::where('school_year_id', $schoolYearId)
                           ->where('Semester_id', $semesterId)
                           ->count()
                : 0,
            'faculty' => User::where('Role', 'Faculty')->count(),
        ];
        
        $facultyLoads = $this->calculateFacultyLoads($schoolYearId, $semesterId);
        
        $data = [
            'analytics' => $analytics,
            'enrollmentStats' => $enrollmentStats,
            'enrollmentByStrand' => $enrollmentByStrand,
            'academicStats' => $academicStats,
            'facultyLoads' => $facultyLoads,
            'school_year' => $activeSchoolYear?->formatted ?? 'All School Years',
            'semester' => $activeSemester?->semester_type ?? 'All Semesters',
            'generated_at' => now()->format('F d, Y g:i A'),
        ];
        
        $pdf = PDF::loadView('pdf.registrar.analytics', $data);
        $filename = 'complete-analytics-report-' . now()->format('Y-m-d') . '.pdf';
        return $pdf->download($filename);
    }
}


