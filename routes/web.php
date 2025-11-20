<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Session;
use App\Http\Controllers\RegistrarController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\FacultyController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\StudentDocumentController;
use App\Http\Controllers\EnrollmentCorController;
use App\Http\Controllers\PasswordResetController;
use App\Models\Section;
use App\Models\StudentPersonalInfo;         
use App\Models\User;            
use Illuminate\Support\Facades\DB;              
// Root route - redirect authenticated users to their dashboard
Route::get('/', function () {
    return Inertia::render('Auth/Login');
})->middleware('guest')->name('login');

// Explicit GET route for /login - redirect authenticated users
Route::get('/login', function () {
    return Inertia::render('Auth/Login');
})->middleware('guest');

// Handle login submission
Route::post('/login', function (Request $request) {
    $credentials = $request->validate([
        'email' => ['required', 'string'],
        'password' => ['required', 'string'],
        'remember' => ['nullable', 'boolean'],
    ]);

    $remember = (bool) ($credentials['remember'] ?? false);
    $loginField = $credentials['email'];
    $password = $credentials['password'];

    // Check if login field is LRN or email
    $user = null;
    if (is_numeric($loginField) && strlen($loginField) == 12) {
        // It's an LRN - find user by LRN
        $studentInfo = \App\Models\StudentPersonalInfo::where('lrn', $loginField)->first();
        if ($studentInfo) {
            $user = \App\Models\User::find($studentInfo->user_id);
        }
    } else {
        // It's an email - find user by email
        $user = \App\Models\User::where('email', $loginField)->first();
    }

    // Attempt authentication
    if (!$user || !Hash::check($password, $user->password)) {
        return back()->withErrors([
            'email' => 'The provided credentials do not match our records.',
        ])->onlyInput('email');
    }

    // Log the user in
    Auth::login($user, $remember);

    $request->session()->regenerate();

    // Store session information for authenticated user
    $user = Auth::user();
    
    // Check if student is verified
    if ($user->Role === 'Student') {
        $studentInfo = \App\Models\StudentPersonalInfo::where('user_id', $user->id)->first();
        if (!$studentInfo || !$studentInfo->is_verified) {
            Auth::logout();
            return back()->withErrors([
                'email' => 'Your account is pending verification. Please wait for the registrar to verify your account.',
            ])->onlyInput('email');
        }
    }
    
    Session::put('authenticated_user_id', $user->id);
    Session::put('authenticated_user_role', $user->Role);
    Session::put('authenticated_user_email', $user->email);
    Session::put('login_timestamp', now());

    // Redirect based on role if available
    if ($user && $user->Role === 'Registrar') {
        return redirect('/registrar');
    }
    if ($user && $user->Role === 'Faculty') {
        return redirect('/faculty');
    }
    if ($user && $user->Role === 'Student') {
        return redirect('/student/dashboard');
    }
    return redirect('/');
});

// Logout
Route::post('/logout', function (Request $request) {
    // Clear all session data related to authentication
    Session::forget('authenticated_user_id');
    Session::forget('authenticated_user_role');
    Session::forget('authenticated_user_email');
    Session::forget('login_timestamp');
    
    // Clear any password change session flags
    $userId = Auth::id();
    if ($userId) {
        Session::forget('session_regenerated_for_user_' . $userId);
    }
    
    Auth::logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();
    
    return redirect()->route('login');
});

// Password change routes
Route::get('/password/change', [AuthController::class, 'showPasswordChange'])->name('password.change')->middleware('auth');
Route::post('/password/change', [AuthController::class, 'updatePassword'])->name('password.update')->middleware('auth');

// Password reset (guest) - OTP flow
Route::middleware('guest')->group(function () {
	Route::get('/password/forgot', function () {
		return Inertia::render('Auth/ForgotPassword');
	})->name('password.forgot');
	Route::get('/password/verify-otp', function () {
		return Inertia::render('Auth/VerifyOtp');
	})->name('password.verify-otp');
	Route::get('/password/reset', function () {
		return Inertia::render('Auth/ResetPassword');
	})->name('password.reset');

	Route::post('/password/forgot', [PasswordResetController::class, 'requestOtp'])->name('password.forgot.send');
	Route::post('/password/verify-otp', [PasswordResetController::class, 'verifyOtp'])->name('password.verify-otp.submit');
	Route::post('/password/reset', [PasswordResetController::class, 'resetPassword'])->name('password.reset.submit');
});

// Registrar area - protected routes
Route::middleware(['auth', 'role:Registrar'])->prefix('registrar')->name('registrar.')->group(function () {
    Route::get('/', [RegistrarController::class, 'index'])->name('dashboard');
    Route::get('/sections', [RegistrarController::class, 'sections'])->name('sections');
    Route::post('/sections', [RegistrarController::class, 'storeSection'])->name('sections.store');
    Route::post('/sections/{section}/reopen', [RegistrarController::class, 'reopenSection'])->name('sections.reopen-single');
    Route::post('/sections/reopen-bulk', [RegistrarController::class, 'reopenSections'])->name('sections.reopen-bulk');
    Route::put('/sections/{section}', [RegistrarController::class, 'updateSection'])->name('sections.update');
    Route::put('/sections/{section}/toggle', [RegistrarController::class, 'toggleSection'])->name('sections.toggle');
    Route::put('/sections/{section}/adviser', [RegistrarController::class, 'updateSectionAdviser'])->name('sections.update-adviser');
    Route::get('/subjects', [RegistrarController::class, 'subjects'])->name('subjects');
    Route::post('/subjects/bulk-import', [RegistrarController::class, 'bulkImportSubjects'])->name('subjects.bulk-import');
    Route::post('/subjects', [RegistrarController::class, 'storeSubject'])->name('subjects.store');
    Route::put('/subjects/{subject}', [RegistrarController::class, 'updateSubject'])->name('subjects.update');
    Route::delete('/subjects/{subject}', [RegistrarController::class, 'destroySubject'])->name('subjects.destroy');
    
    Route::get('/strands', [RegistrarController::class, 'strands'])->name('strands');
    Route::post('/strands', [RegistrarController::class, 'storeStrand'])->name('strands.store');
    Route::put('/strands/{strand}', [RegistrarController::class, 'updateStrand'])->name('strands.update');
    Route::put('/strands/{strand}/toggle', [RegistrarController::class, 'toggleStrand'])->name('strands.toggle');
    Route::post('/strands/activate-for-new-year', [RegistrarController::class, 'activateStrandsForNewYear'])->name('strands.activate-new-year');
    
    Route::get('/school-years', [RegistrarController::class, 'schoolYears'])->name('school-years');
    Route::post('/school-years', [RegistrarController::class, 'storeSchoolYear'])->name('school-years.store');
    Route::put('/school-years/{schoolYear}', [RegistrarController::class, 'updateSchoolYear'])->name('school-years.update');
    Route::put('/school-years/{schoolYear}/activate', [RegistrarController::class, 'activateSchoolYear'])->name('school-years.activate');
    Route::put('/school-years/{schoolYear}/toggle', [RegistrarController::class, 'toggleSchoolYear'])->name('school-years.toggle');
    
    // Enrollment control routes
    Route::put('/school-years/{schoolYear}/enrollment', [RegistrarController::class, 'updateEnrollmentControl'])->name('school-years.enrollment.update');
    Route::put('/school-years/{schoolYear}/enrollment/toggle', [RegistrarController::class, 'toggleEnrollment'])->name('school-years.enrollment.toggle');
    
    // Semester routes
    Route::post('/semesters', [RegistrarController::class, 'storeSemester'])->name('semesters.store');
    Route::put('/semesters/{semester}', [RegistrarController::class, 'updateSemester'])->name('semesters.update');
    Route::put('/semesters/{semester}/toggle', [RegistrarController::class, 'toggleSemester'])->name('semesters.toggle');
    Route::put('/semesters/{semester}/activate', [RegistrarController::class, 'activateSemester'])->name('semesters.activate');
    Route::delete('/semesters/{semester}', [RegistrarController::class, 'destroySemester'])->name('semesters.destroy');
    Route::get('/semesters/calculate-dates', [RegistrarController::class, 'getCalculatedSemesterDates'])->name('semesters.calculate-dates');
    
    // Semester rollover routes - strand activation is now automatic
    Route::post('/sections/reopen-for-semester', [RegistrarController::class, 'reopenSectionsForSemester'])->name('sections.reopen-semester');
    Route::post('/classes/reopen-for-semester', [RegistrarController::class, 'reopenClassesForSemester'])->name('classes.reopen-semester');
    Route::get('/classes/time-slots-from-previous-semester', [RegistrarController::class, 'getTimeSlotsFromPreviousSemester'])->name('classes.time-slots-from-previous-semester');
    
    // Classes routes
    Route::get('/classes', [RegistrarController::class, 'classes'])->name('classes');
    Route::post('/classes', [RegistrarController::class, 'storeClass'])->name('classes.store');
    Route::post('/classes/bulk', [RegistrarController::class, 'storeBulkClasses'])->name('classes.bulk');
    
    // Subjects routes
    Route::post('/subjects/bulk', [RegistrarController::class, 'storeBulkSubjects'])->name('subjects.bulk');
    Route::put('/classes/{class}', [RegistrarController::class, 'updateClass'])->name('classes.update');
    Route::put('/classes/{class}/toggle', [RegistrarController::class, 'toggleClass'])->name('classes.toggle');
    Route::delete('/classes/{class}', [RegistrarController::class, 'destroyClass'])->name('classes.destroy');
    
    // Faculty routes
    Route::get('/faculty', [RegistrarController::class, 'faculty'])->name('faculty');
    Route::post('/faculty', [RegistrarController::class, 'storeFaculty'])->name('faculty.store');
    Route::put('/faculty/{faculty}', [RegistrarController::class, 'updateFaculty'])->name('faculty.update');
    Route::put('/faculty/{faculty}/coordinator/toggle', [RegistrarController::class, 'toggleFacultyCoordinator'])->name('faculty.coordinator.toggle');
    Route::delete('/faculty/{faculty}', [RegistrarController::class, 'destroyFaculty'])->name('faculty.destroy');
    
    // Enrollment management
    Route::get('/enrollments', [RegistrarController::class, 'enrollments'])->name('enrollments');
    Route::get('/students/{student}/enrollments', [RegistrarController::class, 'studentEnrollments'])->name('students.enrollments');
    Route::put('/enrollments/{enrollment}/status', [RegistrarController::class, 'updateEnrollmentStatus'])->name('enrollments.update-status');
    Route::post('/enrollments/{enrollment}/assign', [RegistrarController::class, 'assignStrandSection'])->name('enrollments.assign');
    Route::post('/enrollments/{enrollment}/re-enroll', [RegistrarController::class, 'reEnrollStudent'])->name('enrollments.re-enroll');
    Route::post('/enrollments/returning-student', [RegistrarController::class, 'enrollReturningStudent'])->name('enrollments.enroll-returning');
    Route::get('/grades/approvals', [RegistrarController::class, 'gradeApprovals'])->name('grade-approvals');
    Route::put('/grades/{grade}/approval', [RegistrarController::class, 'updateGradeApproval'])->name('grades.update-approval');
    Route::put('/grades/approvals/bulk', [RegistrarController::class, 'bulkUpdateGradeApprovals'])->name('grades.bulk-update');
    Route::get('/grades/approved', [RegistrarController::class, 'approvedGrades'])->name('grades.approved');
    
    // Unified Enrollment hub
    Route::get('/enrollment', [RegistrarController::class, 'enrollmentHub'])->name('enrollment-hub');
    
    // Re-enrollment page and automatic re-enrollment
    Route::get('/re-enroll-students', [RegistrarController::class, 'reEnrollPage'])->name('re-enroll-students');
    Route::get('/students/{student}/enroll', [RegistrarController::class, 'showEnrollmentPage'])->name('students.enroll');
    Route::post('/enrollments/re-enroll-auto', [RegistrarController::class, 'reEnrollAuto'])->name('enrollments.re-enroll-auto');
    Route::post('/enrollments/re-enroll-bulk', [RegistrarController::class, 'reEnrollBulk'])->name('enrollments.re-enroll-bulk');
    
    Route::get('/profile', [RegistrarController::class, 'profile'])->name('profile');
    Route::put('/profile', [RegistrarController::class, 'updateProfile'])->name('profile.update');
    Route::post('/profile', [RegistrarController::class, 'updateProfile'])->name('profile.update.post');
    
    // Reports
    Route::get('/reports', [RegistrarController::class, 'reports'])->name('reports');
});

// Faculty area - protected routes
Route::middleware(['auth', 'role:Faculty'])->prefix('faculty')->name('faculty.')->group(function () {
    Route::get('/', [FacultyController::class, 'index'])->name('dashboard');
    Route::get('/classes', [FacultyController::class, 'classes'])->name('classes');
    Route::get('/classes/{class}', [FacultyController::class, 'showClass'])->name('classes.show');
    Route::post('/classes/{class}/grades', [FacultyController::class, 'saveGrades'])->name('classes.grades.save');
    Route::get('/students', [FacultyController::class, 'sections'])->name('students');
    Route::get('/students/{section}', [FacultyController::class, 'showSection'])->name('sections.show');
    Route::get('/grades', [FacultyController::class, 'grades'])->name('grades');
    Route::get('/reports', [FacultyController::class, 'reports'])->name('reports');
    
    // PDF generation routes
    Route::get('/reports/schedule/pdf', [FacultyController::class, 'downloadSchedulePdf'])->name('reports.schedule.pdf');
    Route::get('/reports/class/{class}/students/pdf', [FacultyController::class, 'downloadClassStudentsPdf'])->name('reports.class.students.pdf');
    Route::get('/reports/class/{class}/grades/pdf', [FacultyController::class, 'downloadClassGradesPdf'])->name('reports.class.grades.pdf');
    Route::get('/reports/section/{section}/advisory/pdf', [FacultyController::class, 'downloadAdvisoryPdf'])->name('reports.section.advisory.pdf');
    Route::get('/profile', [FacultyController::class, 'profile'])->name('profile');
    Route::match(['put', 'post'], '/profile', [FacultyController::class, 'updateProfile'])->name('profile.update');
    
    // Coordinator functionality (coordinator status managed by registrar)
    Route::get('/enrollments', [FacultyController::class, 'enrollmentHub'])->name('enrollments');
    Route::get('/enrollments/manage', [FacultyController::class, 'enrollments'])->name('enrollments.manage');
    Route::put('/enrollments/{enrollment}/status', [FacultyController::class, 'updateEnrollmentStatus'])->name('enrollments.update-status');
    Route::post('/enrollments/{enrollment}/assign', [RegistrarController::class, 'assignStrandSection'])->name('enrollments.assign');
    Route::get('/enrollment-reports', [FacultyController::class, 'enrollmentReports'])->name('enrollment-reports');
    Route::get('/enrollment-reports/export', [FacultyController::class, 'exportEnrollmentReports'])->name('enrollment-reports.export');
    
    // Coordinator students management (semi profile view)
    Route::get('/coordinator-students', [FacultyController::class, 'coordinatorStudents'])->name('coordinator-students');
    Route::get('/coordinator-students/{student}', [FacultyController::class, 'showCoordinatorStudentDetails'])->name('coordinator-students.details');
    Route::get('/coordinator-students/{student}/enrollments', [FacultyController::class, 'coordinatorStudentEnrollments'])->name('coordinator-students.enrollments');
    
    // Semester data access route (for accessing previous semester data)
    Route::get('/semester-data', [FacultyController::class, 'getSemesterData'])->name('semester-data');
    
    // Coordinator credited subjects management (submits for registrar approval)
    Route::get('/credited-subjects', [FacultyController::class, 'creditedSubjects'])->name('credited-subjects');
    Route::post('/credited-subjects', [FacultyController::class, 'storeCoordinatorCredit'])->name('credited-subjects.store');
    Route::put('/credited-subjects/{creditedSubject}', [FacultyController::class, 'updateCoordinatorCredit'])->name('credited-subjects.update');
    
        // Coordinator re-enrollment
        Route::get('/re-enroll-students', [FacultyController::class, 'reEnrollPage'])->name('re-enroll-students');
        Route::post('/enrollments/re-enroll-auto', [FacultyController::class, 'reEnrollAuto'])->name('enrollments.re-enroll-auto');
        Route::post('/enrollments/re-enroll-bulk', [FacultyController::class, 'reEnrollBulk'])->name('enrollments.re-enroll-bulk');
});

// Student Registration Routes (Public)
Route::get('/student/register', [StudentController::class, 'showRegistrationForm'])->name('student.register');
Route::post('/student/register', [StudentController::class, 'register'])->name('student.register.store');

// Address Data API Routes (Public)
Route::get('/api/address/municipalities', [StudentController::class, 'getMunicipalities'])->name('api.address.municipalities');
Route::get('/api/address/barangays', [StudentController::class, 'getBarangays'])->name('api.address.barangays');
Route::get('/api/address/zip-code', [StudentController::class, 'getZipCode'])->name('api.address.zip-code');

// Student base route redirect
Route::get('/student', function () {
    return redirect('/student/dashboard');
})->middleware(['auth', 'role:Student']);

// Student Routes (Authenticated)
Route::prefix('student')->name('student.')->middleware(['auth', 'role:Student'])->group(function () {
    Route::get('/dashboard', [StudentController::class, 'index'])->name('dashboard');
    Route::get('/classes', [StudentController::class, 'classes'])->name('classes');
    Route::get('/schedule', [StudentController::class, 'schedule'])->name('schedule');
    Route::get('/grades', [StudentController::class, 'grades'])->name('grades');
    Route::get('/profile', [StudentController::class, 'profile'])->name('profile');
    Route::put('/profile', [StudentController::class, 'updateProfile'])->name('profile.update');
    Route::post('/profile', [StudentController::class, 'updateProfile'])->name('profile.update.post');
    Route::get('/enrollment', [StudentController::class, 'showEnrollmentForm'])->name('enrollment');
    Route::post('/enrollment', [StudentController::class, 'storeEnrollmentInfo'])->name('enrollment.store');
    Route::post('/enrollment/request-review', [StudentController::class, 'requestEnrollmentReview'])->name('enrollment.request-review');
});

Route::middleware('auth')->get('/enrollments/{enrollment}/cor', EnrollmentCorController::class)->name('enrollments.cor');

// API route for schedule preview (for enrollment page)
Route::middleware('auth')->get('/api/sections/{section}/schedule-preview', [RegistrarController::class, 'getSectionSchedulePreview']);

Route::middleware('auth')->get('/documents/student/{studentPersonalInfo}/{type}', [StudentDocumentController::class, 'show'])
    ->where('type', 'psa|report-card|profile-photo')
    ->name('documents.student');

// Additional Registrar Routes for Student Verification
Route::prefix('registrar')->name('registrar.')->middleware(['auth', 'role:Registrar'])->group(function () {
    Route::get('/student-verification', [RegistrarController::class, 'studentVerification'])->name('student-verification');
    Route::post('/students/{student}/verify', [RegistrarController::class, 'verifyStudent'])->name('students.verify');
    Route::post('/students/bulk-approve', [RegistrarController::class, 'bulkApproveStudents'])->name('students.bulk-approve');
    Route::get('/students', [RegistrarController::class, 'students'])->name('students');
    Route::get('/students/{student}/details', [RegistrarController::class, 'showStudentDetails'])->name('students.details');
    
    // Grade Processing & Semester End Routes
    Route::get('/grade-processing', [\App\Http\Controllers\GradeProcessingController::class, 'index'])->name('grade-processing');
    Route::post('/grade-processing/semester-end', [\App\Http\Controllers\GradeProcessingController::class, 'processSemesterEnd'])->name('grade-processing.semester-end');
    Route::post('/grade-processing/student/{student}', [\App\Http\Controllers\GradeProcessingController::class, 'calculateStudentGrades'])->name('grade-processing.student');
    
    // Summer Class Students
    Route::get('/summer-class-students', [\App\Http\Controllers\GradeProcessingController::class, 'summerClassStudents'])->name('summer-class-students');
    
    // STEM Strand Change
    Route::get('/stem-strand-change', [\App\Http\Controllers\GradeProcessingController::class, 'stemStrandChangeStudents'])->name('stem-strand-change');
    Route::post('/stem-strand-change/{student}', [\App\Http\Controllers\GradeProcessingController::class, 'processStrandChange'])->name('stem-strand-change.process');
    
    // Credited Subjects Management (for transferee students)
    Route::get('/credited-subjects', [RegistrarController::class, 'creditedSubjects'])->name('credited-subjects');
    Route::get('/credited-subjects/{enrollment}', [RegistrarController::class, 'creditedSubjectsDetail'])->name('credited-subjects.detail');
    Route::post('/credited-subjects', [RegistrarController::class, 'storeCreditedSubject'])->name('credited-subjects.store');
    Route::put('/credited-subjects/{creditedSubject}', [RegistrarController::class, 'updateCreditedSubject'])->name('credited-subjects.update');
    Route::delete('/credited-subjects/{creditedSubject}', [RegistrarController::class, 'destroyCreditedSubject'])->name('credited-subjects.destroy');
});
