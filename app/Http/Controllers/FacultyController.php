<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Section;
use App\Models\ClassModel;
use App\Models\Subject;
use App\Models\SchoolYear;
use App\Models\Semester;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

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
        
        $classes = $classesQuery->get()
            ->map(function ($class) {
                return [
                    'id' => $class->id,
                    'subject_name' => $class->subject->Subject_name ?? 'Unknown Subject',
                    'section_name' => $class->section->section_name ?? 'Unknown Section',
                    'time_schedule' => $class->start_time && $class->end_time 
                        ? date('g:i A', strtotime($class->start_time)) . ' - ' . date('g:i A', strtotime($class->end_time))
                        : 'Time TBD',
                    'has_class_today' => $this->hasClassToday($class),
                    'status' => $this->getClassStatus($class),
                    'pending_grades' => rand(0, 5), // Placeholder - replace with actual pending grades count
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
        ]);
    }

    /**
     * Check if class has session today.
     */
    private function hasClassToday($class)
    {
        $today = date('N'); // 1 (Monday) to 7 (Sunday)
        
        // Convert day_of_week to match PHP's date('N') format
        $classDays = [];
        if ($class->monday) $classDays[] = 1;
        if ($class->tuesday) $classDays[] = 2;
        if ($class->wednesday) $classDays[] = 3;
        if ($class->thursday) $classDays[] = 4;
        if ($class->friday) $classDays[] = 5;
        if ($class->saturday) $classDays[] = 6;
        if ($class->sunday) $classDays[] = 7;
        
        return in_array($today, $classDays);
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
        $endTime = $class->end_time;

        if ($startTime && $endTime) {
            if ($now >= $startTime && $now <= $endTime) {
                return 'ongoing';
            } elseif ($now > $endTime) {
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

        return Inertia::render('Faculty/Classes', [
            'classes' => $classes,
            'activeSchoolYear' => $filters['activeSchoolYear'],
            'activeSemester' => $filters['activeSemester'],
            'allSemesters' => $filters['allSemesters'], // For historical access
        ]);
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
        
        $sectionsQuery = Section::with(['strand', 'schoolYear', 'semester', 'classes.subject'])
            ->where('adviser_id', $user->id);
            
        // Filter by active school year
        if ($filters['activeSchoolYear']) {
            $sectionsQuery->where('school_year_id', $filters['activeSchoolYear']->id);
        }
        
        // Filter by active semester - this ensures data resets when semester changes
        if ($filters['activeSemester']) {
            $sectionsQuery->where('semester_id', $filters['activeSemester']->id);
        }
        
        $sections = $sectionsQuery->get();

        return Inertia::render('Faculty/Sections', [
            'sections' => $sections,
            'activeSchoolYear' => $filters['activeSchoolYear'],
            'activeSemester' => $filters['activeSemester'],
            'allSemesters' => $filters['allSemesters'], // For historical access
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

        $section->load(['strand', 'schoolYear', 'semester', 'classes.subject', 'classes.faculty']);

        return Inertia::render('Faculty/SectionDetail', [
            'section' => $section,
            'activeSchoolYear' => $filters['activeSchoolYear'],
            'activeSemester' => $filters['activeSemester'],
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
        ]);

        $user->update($validated);

        return redirect()->route('faculty.profile')
            ->with('success', 'Profile updated successfully.');
    }
}

