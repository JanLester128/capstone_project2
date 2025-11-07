<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Section;
use App\Models\Subject;
use App\Models\Strand;
use App\Models\SchoolYear;
use App\Models\Semester;
use App\Models\ClassModel;
use App\Mail\FacultyAccountCreated;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class RegistrarController extends Controller
{
    /**
     * Display the registrar dashboard.
     */
    public function index()
    {
        $activeSchoolYear = SchoolYear::where('is_active', true)->first();
        $activeSemester = $activeSchoolYear ? 
            Semester::where('school_year_id', $activeSchoolYear->id)
                   ->where('is_active', true)
                   ->first() : null;
        
        $stats = [
            'students' => User::where('Role', 'Student')->count(),
            'faculty' => User::where('Role', 'Faculty')->count(),
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

        return Inertia::render('Registrar/Dashboard', [
            'stats' => $stats,
        ]);
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
            $previousSections = Section::with(['strand', 'schoolYear', 'semester'])
                ->where(function ($query) use ($activeSchoolYear, $activeSemester) {
                    // From different school years OR different semesters in same school year
                    $query->where('school_year_id', '!=', $activeSchoolYear->id)
                          ->orWhere(function ($subQuery) use ($activeSchoolYear, $activeSemester) {
                              $subQuery->where('school_year_id', $activeSchoolYear->id)
                                       ->where('semester_id', '!=', $activeSemester->id);
                          });
                })
                ->orderBy('school_year_id', 'desc')
                ->orderBy('semester_id', 'desc')
                ->get()
                ->filter(function ($section) use ($activeSchoolYear, $activeSemester) {
                    // Only show sections that don't already exist for the active school year and semester
                    return !Section::where('section_name', $section->section_name)
                        ->where('school_year_id', $activeSchoolYear->id)
                        ->where('semester_id', $activeSemester->id)
                        ->exists();
                })
                ->groupBy('section_name')
                ->map(function ($sectionsWithSameName) {
                    // For sections with the same name, only return the most recent one
                    return $sectionsWithSameName->sortByDesc(function ($section) {
                        return $section->school_year_id . '-' . $section->semester_id;
                    })->first();
                })
                ->values(); // Reset array keys
        }
        
        $strands = Strand::where('Is_active', true)->get();
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
                    $schoolYearId = $request->input('school_year_id') ?? ($activeSchoolYear?->id);
                    $semesterId = $request->input('semester_id') ?? ($activeSemester?->id);
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

        // Use active school year and semester if not provided
        $schoolYearId = $validated['school_year_id'] ?? ($activeSchoolYear?->id);
        $semesterId = $activeSemester?->id;
        
        if (!$schoolYearId) {
            return redirect()->route('registrar.strands')
                ->with('error', 'No active school year. Please activate a school year first.');
        }
        
        if (!$semesterId) {
            return redirect()->route('registrar.strands')
                ->with('error', 'No active semester. Please activate a semester first.');
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
                    $schoolYearId = $request->input('school_year_id') ?? $section->school_year_id;
                    if ($schoolYearId && Section::where('section_name', $value)
                        ->where('school_year_id', $schoolYearId)
                        ->where('id', '!=', $section->id)
                        ->exists()) {
                        $fail('The section name already exists for this school year.');
                    }
                },
            ],
            'strand_id' => 'required|exists:strands,id',
            'grade_level' => 'required|in:11,12',
            'capacity' => 'required|integer|min:1|max:50',
            'school_year_id' => 'required|exists:school_year,id',
            'adviser_id' => 'nullable|exists:users,id',
        ]);

        // Map the field names to match the database schema
        $sectionData = [
            'section_name' => $validated['section_name'],
            'strand_id' => $validated['strand_id'],
            'year_level' => $validated['grade_level'], // Map grade_level to year_level
            'max_capacity' => $validated['capacity'], // Map capacity to max_capacity
            'school_year_id' => $validated['school_year_id'],
            'adviser_id' => $validated['adviser_id'], // Add adviser assignment
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
        
        // Note: We allow operation without active semester for backward compatibility
        // In production, you may want to enforce semester requirement
        
        // Only return subjects for the active school year and semester
        $subjects = Subject::with(['strand', 'schoolYear', 'semester'])
            ->where('school_year_id', $activeSchoolYear->id)
            ->when($activeSemester, function ($query) use ($activeSemester) {
                return $query->where('semester_id', $activeSemester->id);
            })
            ->orderBy('year_level')
            ->orderBy('Semester')
            ->orderBy('Subject_name')
            ->get();
        
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

        return Inertia::render('Registrar/Subjects', [
            'subjects' => $subjects,
            'strands' => $strands,
            'semesters' => [], // Empty array since we're using simple 1/2 values
            'activeSchoolYear' => $activeSchoolYear,
            'activeSemester' => $activeSemester,
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
        
        // Note: We allow operation without active semester for backward compatibility
        // If no active semester, we'll skip semester-specific validation

        $validated = $request->validate([
            'Subject_name' => 'required|string|max:255',
            'Subject_code' => 'required|string|max:20',
            'Semester' => 'required|string|in:1,2',
            'year_level' => 'required|integer|in:11,12',
            'strand_id' => 'required|integer|exists:strands,id',
            'PREREQUISITES' => 'nullable|string|max:500',
            'CO-REQUISITES' => 'nullable|string|max:500',
        ]);

        // Check uniqueness per school year and semester (if semester exists)
        $existsQuery = Subject::where('Subject_code', $validated['Subject_code'])
            ->where('school_year_id', $activeSchoolYear->id);
            
        if ($activeSemester) {
            $existsQuery->where('semester_id', $activeSemester->id);
        }
        
        $exists = $existsQuery->exists();

        if ($exists) {
            return redirect()->route('registrar.subjects')
                ->with('error', 'Subject code already exists for this school year and semester.');
        }

        $validated['school_year_id'] = $activeSchoolYear->id;
        if ($activeSemester) {
            $validated['semester_id'] = $activeSemester->id;
        }
        Subject::create($validated);

        return redirect()->route('registrar.subjects')
            ->with('success', 'Subject created successfully.');
    }

    /**
     * Bulk import subjects for a specific strand, year level, and semester.
     */
    public function bulkImportSubjects(Request $request)
    {
        $validated = $request->validate([
            'strand_id' => 'required|integer|exists:strands,id',
            'year_level' => 'required|integer|in:11,12',
            'semester' => 'required|string|in:1,2',
        ]);

        $strand = Strand::find($validated['strand_id']);
        $strandCode = $strand->Strand_code;
        
        // Get predefined subjects from SubjectForm component logic
        $subjectsByStrandAndYear = $this->getPredefinedSubjects();
        
        if (!isset($subjectsByStrandAndYear[$strandCode][$validated['year_level']][$validated['semester']])) {
            return redirect()->route('registrar.subjects')
                ->with('error', 'No subjects found for this strand, year level, and semester combination.');
        }

        $subjectsToImport = $subjectsByStrandAndYear[$strandCode][$validated['year_level']][$validated['semester']];
        $importedCount = 0;

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
                ->with('error', 'No active semester. Please activate a semester first.');
        }

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
                        'Semester' => $validated['semester'],
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
            ->with('success', "Successfully imported {$importedCount} subjects.");
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
                        ['name' => 'General Physics 1', 'code' => 'GEN_PHYS_1', 'prerequisites' => 'Pre-calculus; calculus', 'corequisites' => null],
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
                        ['name' => 'Practical Research 1', 'code' => 'PRAC_RES_1_TVL', 'prerequisites' => null, 'corequisites' => null],
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
                        ['name' => 'Creative Nonfiction', 'code' => 'CREATIVE_NONFIC', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Disciplines and Ideas in the Social Sciences', 'code' => 'DISS', 'prerequisites' => null, 'corequisites' => null],
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
                        ['name' => 'Community Engagement, Solidarity and Citizenship', 'code' => 'CESC', 'prerequisites' => null, 'corequisites' => null],
                    ],
                    2 => [
                        ['name' => 'Media and Information Literacy', 'code' => 'MIL_HUMSS', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Contemporary Philippine Arts from the regions', 'code' => 'CPAR_HUMSS', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Physical Education and Health', 'code' => 'PE_HEALTH_HUMSS_4', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Practical Research 2', 'code' => 'PRAC_RES_2_HUMSS', 'prerequisites' => 'Practical Research 1', 'corequisites' => null],
                        ['name' => 'Filipino sa Piling Larang', 'code' => 'FIL_LARANG_HUMSS', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Trends, Networks and Critical Thinking in the 21st Century Culture', 'code' => 'TRENDS_21ST', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Culminating Activity', 'code' => 'CULMIN_ACT', 'prerequisites' => null, 'corequisites' => null],
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
                        ['name' => 'Principles of Marketing', 'code' => 'PRIN_MARKET', 'prerequisites' => null, 'corequisites' => null],
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
                        ['name' => 'Business Finance', 'code' => 'BUS_FINANCE', 'prerequisites' => 'Fundamentals of Accountancy, Business and Management 1', 'corequisites' => null],
                        ['name' => 'Applied Economics', 'code' => 'APPLIED_ECON', 'prerequisites' => null, 'corequisites' => null],
                    ],
                    2 => [
                        ['name' => 'Media and Information Literacy', 'code' => 'MIL_ABM', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Contemporary Philippine Arts from the regions', 'code' => 'CPAR_ABM', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Physical Education and Health', 'code' => 'PE_HEALTH_ABM_4', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Entrepreneurship', 'code' => 'ENTREP_ABM', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Filipino sa Piling Larang', 'code' => 'FIL_LARANG_ABM', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Business Enterprise Simulation', 'code' => 'BUS_ENT_SIM', 'prerequisites' => null, 'corequisites' => null],
                        ['name' => 'Work Immersion/Research/Career Advocacy/Culminating Activity', 'code' => 'WORK_IMMERSION_ABM', 'prerequisites' => null, 'corequisites' => null],
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
        
        // Get previous sections from other school years for reopening
        $previousSections = Section::with(['strand', 'schoolYear'])
            ->where('school_year_id', '!=', $activeSchoolYear->id)
            ->orderBy('school_year_id', 'desc')
            ->get()
            ->filter(function ($section) use ($activeSchoolYear) {
                // Only show sections that don't already exist for the active school year
                return !Section::where('section_name', $section->section_name)
                    ->where('school_year_id', $activeSchoolYear->id)
                    ->exists();
            })
            ->groupBy('section_name')
            ->map(function ($sectionsWithSameName) {
                // For sections with the same name, only return the most recent one
                return $sectionsWithSameName->sortByDesc('school_year_id')->first();
            })
            ->values(); // Reset array keys

        // Get faculty users for section advisers
        $users = User::where('Role', 'Faculty')->get(['id', 'FirstName', 'MiddleName', 'LastName']);

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
                ->update(['is_active' => $newStatus]);
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

        $action = $newStatus ? 'activated' : 'deactivated';
        return redirect()->route('registrar.strands')
            ->with('success', "Strand {$action} successfully for this school year.");
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

        SchoolYear::create($validated);

        return redirect()->route('registrar.school-years')
            ->with('success', 'School year created successfully.');
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
        try {
            DB::beginTransaction();

            // Deactivate all other school years
            SchoolYear::where('is_active', true)->update(['is_active' => false]);
            
            // Activate the selected school year
            $schoolYear->update(['is_active' => true]);

            // Check if this is a NEW school year (no existing sections or subjects)
            $hasSections = Section::where('school_year_id', $schoolYear->id)->exists();
            $hasSubjects = Subject::where('school_year_id', $schoolYear->id)->exists();
            $isNewSchoolYear = !$hasSections && !$hasSubjects;

            if ($isNewSchoolYear) {
                // This is a NEW school year
                // Strands and subjects will need to be activated/added manually
                // No automatic reset needed - just mark as new

                DB::commit();

                return redirect()->route('registrar.school-years')
                    ->with('success', 'New school year activated successfully! Please:
                    1. Activate required strands for this school year
                    2. Add subjects for this school year
                    3. Create sections or reopen from previous year');
            } else {
                // This is a PREVIOUS school year being reactivated
                // All existing data (sections, subjects, strands) for this year will be visible
                DB::commit();

                return redirect()->route('registrar.school-years')
                    ->with('success', 'School year reactivated successfully! All existing data (sections, subjects, and strands) for this year is now visible.');
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
        ->orderBy('created_at', 'desc')->get();
        
        // Get active sections for the active school year and semester
        $sections = Section::with('strand')
            ->when($activeSchoolYear, function ($query) use ($activeSchoolYear) {
                return $query->where('school_year_id', $activeSchoolYear->id)
                           ->where('is_active', true);
            })
            ->when($activeSemester, function ($query) use ($activeSemester) {
                return $query->where('semester_id', $activeSemester->id);
            })
            ->get();
            
        $faculty = User::where('Role', 'Faculty')->get();
        
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
        
        // Get subjects for the active school year and semester
        $subjects = Subject::with(['strand', 'semester'])
            ->when($activeSchoolYear, function ($query) use ($activeSchoolYear) {
                return $query->where('school_year_id', $activeSchoolYear->id);
            })
            ->when($activeSemester, function ($query) use ($activeSemester) {
                return $query->where('semester_id', $activeSemester->id);
            })
            ->get();

        return Inertia::render('Registrar/Classes', [
            'classes' => $classes,
            'sections' => $sections,
            'faculty' => $faculty,
            'semesters' => $semesters,
            'schoolYears' => $schoolYears,
            'subjects' => $subjects,
            'activeSchoolYear' => $activeSchoolYear,
            'activeSemester' => $activeSemester,
        ]);
    }

    /**
     * Store a new class.
     */
    public function storeClass(Request $request)
    {
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

        // Check for scheduling conflicts
        $conflict = ClassModel::where('faculty_id', $validated['faculty_id'])
            ->where('day_of_week', $validated['day_of_week'])
            ->where('school_year_id', $validated['school_year_id'])
            ->where('Semester_id', $validated['Semester_id'])
            ->where(function ($query) use ($validated) {
                $query->whereBetween('start_time', [$validated['start_time'], $validated['endtime']])
                      ->orWhereBetween('endtime', [$validated['start_time'], $validated['endtime']])
                      ->orWhere(function ($q) use ($validated) {
                          $q->where('start_time', '<=', $validated['start_time'])
                            ->where('endtime', '>=', $validated['endtime']);
                      });
            })
            ->exists();

        if ($conflict) {
            return back()->withErrors([
                'start_time' => 'This faculty member already has a class scheduled during this time.'
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
     * Update an existing class.
     */
    public function updateClass(Request $request, ClassModel $class)
    {
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

        // Check for scheduling conflicts (excluding current class)
        $conflict = ClassModel::where('faculty_id', $validated['faculty_id'])
            ->where('day_of_week', $validated['day_of_week'])
            ->where('school_year_id', $validated['school_year_id'])
            ->where('Semester_id', $validated['Semester_id'])
            ->where('Id', '!=', $class->Id)
            ->where(function ($query) use ($validated) {
                $query->whereBetween('start_time', [$validated['start_time'], $validated['endtime']])
                      ->orWhereBetween('endtime', [$validated['start_time'], $validated['endtime']])
                      ->orWhere(function ($q) use ($validated) {
                          $q->where('start_time', '<=', $validated['start_time'])
                            ->where('endtime', '>=', $validated['endtime']);
                      });
            })
            ->exists();

        if ($conflict) {
            return back()->withErrors([
                'start_time' => 'This faculty member already has a class scheduled during this time.'
            ]);
        }

        $class->update($validated);

        return redirect()->route('registrar.classes')
            ->with('success', 'Class updated successfully.');
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
        ]);

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

        // Auto-calculate semester dates if not provided (5 months per semester)
        if (empty($validated['start_date']) || empty($validated['end_date'])) {
            $schoolYear = SchoolYear::find($validated['school_year_id']);
            $calculatedDates = $this->calculateSemesterDates($schoolYear, $validated['semester_type']);
            
            $validated['start_date'] = $validated['start_date'] ?: $calculatedDates['start_date'];
            $validated['end_date'] = $validated['end_date'] ?: $calculatedDates['end_date'];
        }

        Semester::create($validated);

        return redirect()->route('registrar.school-years')
            ->with('success', 'Semester created successfully.');
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
        $newStatus = !$semester->is_active;
        $semester->update([
            'is_active' => $newStatus
        ]);

        $action = $newStatus ? 'activated' : 'deactivated';
        return redirect()->route('registrar.school-years')
            ->with('success', "Semester {$action} successfully.");
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
        try {
            DB::beginTransaction();
            
            // Deactivate all other semesters in the same school year
            Semester::where('school_year_id', $semester->school_year_id)
                ->where('id', '!=', $semester->id)
                ->update(['is_active' => false]);
            
            // Activate the selected semester
            $semester->update(['is_active' => true]);
            
            // Deactivate all strand-semester relationships for this semester
            // (Strands need to be manually reactivated for each semester)
            DB::table('strand_semester')
                ->where('semester_id', $semester->id)
                ->update(['is_active' => false]);
            
            DB::commit();
            
            return redirect()->route('registrar.school-years')
                ->with('success', "Semester '{$semester->semester_type}' activated successfully. All strands have been deactivated and need to be reactivated for this semester.");
                
        } catch (\Exception $e) {
            DB::rollBack();
            
            return redirect()->route('registrar.school-years')
                ->with('error', 'An error occurred while activating the semester. Please try again.');
        }
    }

    /**
     * Activate strands for the active semester.
     */
    public function activateStrandsForNewSemester(Request $request)
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
            'strand_ids' => 'required|array',
            'strand_ids.*' => 'exists:strands,id',
        ]);

        foreach ($validated['strand_ids'] as $strandId) {
            // Check if relationship exists
            $pivot = DB::table('strand_semester')
                ->where('strand_id', $strandId)
                ->where('semester_id', $activeSemester->id)
                ->first();

            if ($pivot) {
                // Update existing relationship
                DB::table('strand_semester')
                    ->where('strand_id', $strandId)
                    ->where('semester_id', $activeSemester->id)
                    ->update(['is_active' => true, 'updated_at' => now()]);
            } else {
                // Create new relationship
                DB::table('strand_semester')->insert([
                    'strand_id' => $strandId,
                    'semester_id' => $activeSemester->id,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        return redirect()->route('registrar.strands')
            ->with('success', 'Selected strands have been activated for the active semester.');
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
                        ->lockForUpdate()
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
                    // Check if section already exists for active semester with lock
                    $exists = Section::where('section_name', $originalSection->section_name)
                        ->where('school_year_id', $activeSchoolYear->id)
                        ->where('semester_id', $activeSemester->id)
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
                            'adviser_id' => $originalSection->adviser_id, // Keep same adviser
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
        
        if (!$activeSchoolYear) {
            return redirect()->route('registrar.strands')
                ->with('error', 'No active school year. Please activate a school year first.');
        }

        $validated = $request->validate([
            'max_capacity' => 'required|integer|min:1|max:50',
            'adviser_id' => 'nullable|exists:users,id',
        ]);

        try {
            DB::beginTransaction();
            
            // Double-check if section already exists for active school year (prevent race conditions)
            $exists = Section::where('section_name', $section->section_name)
                ->where('school_year_id', $activeSchoolYear->id)
                ->lockForUpdate() // Lock to prevent race conditions
                ->exists();

            if ($exists) {
                DB::rollBack();
                return redirect()->route('registrar.strands')
                    ->with('error', "Section '{$section->section_name}' already exists for the active school year.");
            }

            // Create new section with same details but for active school year
            Section::create([
                'section_name' => $section->section_name,
                'year_level' => $section->year_level,
                'strand_id' => $section->strand_id,
                'max_capacity' => $validated['max_capacity'],
                'school_year_id' => $activeSchoolYear->id,
                'adviser_id' => $validated['adviser_id'] ?? null,
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
        
        if (!$activeSchoolYear) {
            return redirect()->route('registrar.strands')
                ->with('error', 'No active school year. Please activate a school year first.');
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
                    // Check if section already exists for active school year with lock
                    $exists = Section::where('section_name', $originalSection->section_name)
                        ->where('school_year_id', $activeSchoolYear->id)
                        ->lockForUpdate()
                        ->exists();

                    if (!$exists) {
                        Section::create([
                            'section_name' => $originalSection->section_name,
                            'year_level' => $originalSection->year_level,
                            'strand_id' => $originalSection->strand_id,
                            'max_capacity' => $originalSection->max_capacity,
                            'school_year_id' => $activeSchoolYear->id,
                            'adviser_id' => null, // Reset adviser for new year
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
        $faculty = User::where('Role', 'Faculty')
            ->select('id', 'FirstName', 'MiddleName', 'LastName', 'email', 'Role', 'created_at', 'updated_at')
            ->orderBy('LastName')
            ->orderBy('FirstName')
            ->get();

        return Inertia::render('Registrar/Faculty', [
            'faculty' => $faculty,
        ]);
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
            'must_change_password' => true, // Flag to force password change on first login
        ];

        $faculty = User::create($facultyData);

        // Send email with login credentials
        try {
            Mail::to($faculty->email)->send(new FacultyAccountCreated($faculty, $generatedPassword));
            
            return redirect()->route('registrar.faculty')
                ->with('success', "Faculty member '{$validated['FirstName']} {$validated['LastName']}' created successfully. Login credentials have been sent to {$faculty->email}.");
        } catch (\Exception $e) {
            // If email fails, still show success but with password for manual sharing
            return redirect()->route('registrar.faculty')
                ->with('warning', "Faculty member '{$validated['FirstName']} {$validated['LastName']}' created successfully, but email could not be sent. Temporary password: {$generatedPassword} (Please share this securely with the faculty member)");
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
            'Department' => 'nullable|string|max:255',
            'Position' => 'nullable|string|max:255',
            'ContactNumber' => 'nullable|string|max:20',
            'Address' => 'nullable|string|max:500',
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
}

