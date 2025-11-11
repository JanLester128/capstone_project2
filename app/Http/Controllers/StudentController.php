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
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

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
        ];

        if ($activeSchoolYear) {
            $enrollmentStatus['schoolYear'] = $activeSchoolYear;
            $enrollmentStatus['isOpen'] = $activeSchoolYear->enrollment_open && $activeSchoolYear->isEnrollmentOpen();
            
            // Check if student is already enrolled for this school year
            $studentInfo = $student->studentPersonalInfo;
            if ($studentInfo) {
                $existingEnrollment = Enrollment::where('student_personal_info_id', $studentInfo->id)
                    ->where('school_year_id', $activeSchoolYear->id)
                    ->first();
                $enrollmentStatus['isEnrolled'] = $existingEnrollment !== null;
            }
            
            // Set canEnroll based on enrollment status and whether student is already enrolled
            $enrollmentStatus['canEnroll'] = $enrollmentStatus['isOpen'] && !$enrollmentStatus['isEnrolled'];
            
            if (!$activeSchoolYear->enrollment_open) {
                $enrollmentStatus['message'] = 'Enrollment is currently closed for ' . $activeSchoolYear->formatted;
            } elseif (!$activeSchoolYear->isEnrollmentOpen()) {
                $enrollmentStatus['message'] = $activeSchoolYear->enrollment_status;
            } elseif ($enrollmentStatus['isEnrolled']) {
                $enrollmentStatus['message'] = 'You are already enrolled for ' . $activeSchoolYear->formatted;
            } else {
                $enrollmentStatus['message'] = 'Enrollment is open for ' . $activeSchoolYear->formatted;
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
        $student = User::with(['studentPersonalInfo'])
            ->find($user->id);

        // Get enrollment status information
        $enrollmentStatus = $this->getEnrollmentStatus($student);

        // TODO: Replace with actual data queries from database
        $upcomingClasses = [];
        $recentGrades = [];
        $announcements = [];
        $stats = [
            'totalSubjects' => 0,
            'averageGrade' => 0,
            'attendanceRate' => 0,
            'nextClass' => null,
        ];

        return Inertia::render('Students/Dashboard', [
            'student' => $student,
            'upcomingClasses' => $upcomingClasses,
            'recentGrades' => $recentGrades,
            'announcements' => $announcements,
            'stats' => $stats,
            'enrollmentStatus' => $enrollmentStatus,
        ]);
    }

    /**
     * Display the student's classes.
     */
    public function classes()
    {
        $user = Auth::user();
        
        // TODO: Implement actual class enrollment logic
        // For now, return empty array until student-section relationship is established
        $classes = [];

        return Inertia::render('Students/Classes', [
            'classes' => $classes,
        ]);
    }

    /**
     * Display the student's schedule.
     */
    public function schedule()
    {
        $user = Auth::user();
        
        // TODO: Implement actual schedule logic based on student's enrolled classes
        // For now, return empty array until student-class relationship is established
        $classes = [];

        return Inertia::render('Students/Schedule', [
            'classes' => $classes,
        ]);
    }

    /**
     * Display the student's grades.
     */
    public function grades()
    {
        $user = Auth::user();
        
        // TODO: Implement actual grades logic based on student's enrolled classes
        // For now, return empty array until student-grade relationship is established
        $grades = [];

        return Inertia::render('Students/Grades', [
            'grades' => $grades,
        ]);
    }

    /**
     * Display student profile.
     */
    public function profile()
    {
        $user = Auth::user();
        
        $student = User::with(['studentPersonalInfo'])
            ->find($user->id);

        // Get active school year and semester
        $activeSchoolYear = SchoolYear::where('is_active', true)->first();
        $activeSemester = null;
        
        if ($activeSchoolYear) {
            $activeSemester = $activeSchoolYear->semesters()->where('is_active', true)->first();
        }

        // Get enrollment status
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
            'profile_photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        // Update user basic info
        $user->update([
            'FirstName' => $validated['FirstName'],
            'MiddleName' => $validated['MiddleName'],
            'LastName' => $validated['LastName'],
            'email' => $validated['email'],
        ]);

        // Handle profile photo upload only
        $studentInfo = $user->studentPersonalInfo;
        if ($studentInfo && $request->hasFile('profile_photo')) {
            $file = $request->file('profile_photo');
            $filename = 'profile_' . $user->id . '_' . time() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('student_photos', $filename, 'public');
            
            // Update student personal info with profile photo path
            $studentInfo->update(['profile_photo' => $path]);
        }

        return redirect()->route('student.profile')
            ->with('success', 'Profile updated successfully.');
    }

    /**
     * Show student registration form.
     */
    public function showRegistrationForm()
    {
        $strands = Strand::where('Is_active', true)->get();
        
        return Inertia::render('Auth/StudentRegister', [
            'strands' => $strands,
        ]);
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
            'email' => 'required|email|unique:users,email',
            'lrn' => 'required|string|size:12|unique:student_personal_info,lrn',
            'password' => 'required|string|min:8|confirmed',
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

            // Create student personal info record - minimal data for registration
            StudentPersonalInfo::create([
                'user_id' => $user->id,
                'lrn' => $validated['lrn'],
                'school_year' => $currentSchoolYear,
                'grade_level' => '10', // Default grade level for registration
                'is_graded' => true, // Default value
                'first_name' => $validated['first_name'],
                'middle_name' => $validated['middle_name'],
                'last_name' => $validated['last_name'],
                'birthdate' => '2000-01-01', // Placeholder, will be updated during enrollment
                'age' => 18, // Placeholder, will be updated during enrollment
                'sex' => 'Male', // Placeholder, will be updated during enrollment
                'place_of_birth' => 'Philippines', // Placeholder, will be updated during enrollment
                'current_country' => 'Philippines', // Default country
                'same_as_current_address' => true, // Default value
                'is_4ps_beneficiary' => false, // Default value
                'is_sned_program' => false, // Default value
                'has_pwd_id' => false, // Default value
                'is_verified' => false,
            ]);

            DB::commit();

            return redirect()->route('login')
                ->with('success', 'Registration submitted successfully! Please wait for the Registrar to approve your account. You will receive an email notification once approved and can then login using your LRN or email.');

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

        return Inertia::render('Students/EnrollmentForm', [
            'strands' => $strands,
            'studentInfo' => $studentInfo,
            'strandPreferences' => $strandPreferences,
            'activeSchoolYear' => $activeSchoolYear,
            'enrollmentStatus' => $enrollmentStatus,
        ]);
    }

    /**
     * Store or update student enrollment information.
     */
    public function storeEnrollmentInfo(Request $request)
    {
        $user = Auth::user();
        
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
            // Basic Information
            'psa_birth_certificate_no' => 'nullable|string|max:100',
            'extension_name' => 'nullable|string|max:100',
            'birthdate' => 'required|date',
            'age' => 'required|integer|min:1|max:100',
            'sex' => 'required|in:Male,Female',
            'place_of_birth' => 'required|string|max:100',
            'religion' => 'nullable|string|max:100',
            'mother_tongue' => 'nullable|string|max:100',
            
            // 4Ps Information
            'is_4ps_beneficiary' => 'boolean',
            '4ps_household_id' => 'nullable|string|max:100',
            
            // Current Address
            'current_house_no' => 'nullable|string|max:100',
            'current_sitio_street' => 'nullable|string|max:100',
            'current_barangay' => 'nullable|string|max:100',
            'current_municipality_city' => 'nullable|string|max:100',
            'current_province' => 'nullable|string|max:100',
            
            // Parents Information
            'father_last_name' => 'nullable|string|max:100',
            'father_first_name' => 'nullable|string|max:100',
            'father_middle_name' => 'nullable|string|max:100',
            'father_contact_number' => 'nullable|string|max:100',
            'mother_last_name' => 'nullable|string|max:100',
            'mother_first_name' => 'nullable|string|max:100',
            'mother_middle_name' => 'nullable|string|max:100',
            'mother_contact_number' => 'nullable|string|max:100',
            'guardian_last_name' => 'nullable|string|max:100',
            'guardian_first_name' => 'nullable|string|max:100',
            'guardian_middle_name' => 'nullable|string|max:100',
            'guardian_contact_number' => 'nullable|string|max:100',
            
            // Special Needs
            'is_sned_program' => 'boolean',
            'medical_diagnosis' => 'nullable|string|max:100',
            'manifestations' => 'nullable|string|max:100',
            'has_pwd_id' => 'boolean',
            
            // Previous School
            'last_grade_level_completed' => 'nullable|string|max:100',
            'last_school_year_completed' => 'nullable|string|max:100',
            'last_school_attended' => 'nullable|string|max:100',
            'last_school_id' => 'nullable|string|max:100',
            
            // Senior High School
            'semester' => 'required|in:1st,2nd',
            
            // Learning Modalities
            'learning_modalities' => 'nullable|string|max:100',
            
            // Strand Preferences
            'strand_preferences' => 'required|array|min:1|max:3',
            'strand_preferences.*' => 'required|exists:strands,id|distinct',
            
            // Document Uploads
            'psa_birth_certificate_photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'report_card_photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        // Remove strand_preferences and photo uploads from validated data before saving to student_personal_info
        $strandPreferences = $validated['strand_preferences'];
        unset($validated['strand_preferences']);
        
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
        
        // Merge photo data with validated data
        $validated = array_merge($validated, $photoData);
        
        DB::beginTransaction();
        try {
            $studentInfo = StudentPersonalInfo::updateOrCreate(
                ['user_id' => $user->id],
                $validated
            );

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

            // Create enrollment record
            $activeSemester = $activeSchoolYear->semesters()->where('is_active', true)->first();
            
            // Check if enrollment already exists for this school year
            $existingEnrollment = Enrollment::where('student_personal_info_id', $studentInfo->id)
                ->where('school_year_id', $activeSchoolYear->id)
                ->first();

            if ($existingEnrollment) {
                // Update existing enrollment
                $existingEnrollment->update([
                    'semester_id' => $activeSemester?->id,
                    'status' => 'pending',
                    'submitted_at' => now(),
                    'processed_at' => null,
                    'enrolled_by' => null,
                ]);
            } else {
                // Create new enrollment
                Enrollment::create([
                    'student_personal_info_id' => $studentInfo->id,
                    'school_year_id' => $activeSchoolYear->id,
                    'semester_id' => $activeSemester?->id,
                    'status' => 'pending',
                    'submitted_at' => now(),
                ]);
            }

            DB::commit();

            return redirect()->route('student.enrollment')
                ->with('success', 'Enrollment information submitted successfully! Please wait for the registrar to review your enrollment.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to save enrollment information. Please try again.']);
        }
    }
}

