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
        'email' => ['required', 'email'],
        'password' => ['required', 'string'],
        'remember' => ['nullable', 'boolean'],
    ]);

    $remember = (bool) ($credentials['remember'] ?? false);
    unset($credentials['remember']);

    if (!Auth::attempt($credentials, $remember)) {
        return back()->withErrors([
            'email' => 'The provided credentials do not match our records.',
        ])->onlyInput('email');
    }

    $request->session()->regenerate();

    // Store session information for authenticated user
    $user = Auth::user();
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
        return redirect('/student');
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
    
    return redirect()->route('login')->with('success', 'You have been logged out successfully.');
});

// Password change routes
Route::get('/password/change', [AuthController::class, 'showPasswordChange'])->name('password.change')->middleware('auth');
Route::post('/password/change', [AuthController::class, 'updatePassword'])->name('password.update')->middleware('auth');

// Registrar area - protected routes
Route::middleware(['auth'])->prefix('registrar')->name('registrar.')->group(function () {
    Route::get('/', [RegistrarController::class, 'index'])->name('dashboard');
    Route::get('/sections', [RegistrarController::class, 'sections'])->name('sections');
    Route::post('/sections', [RegistrarController::class, 'storeSection'])->name('sections.store');
    Route::post('/sections/{section}/reopen', [RegistrarController::class, 'reopenSection'])->name('sections.reopen-single');
    Route::post('/sections/reopen-bulk', [RegistrarController::class, 'reopenSections'])->name('sections.reopen-bulk');
    Route::put('/sections/{section}', [RegistrarController::class, 'updateSection'])->name('sections.update');
    Route::put('/sections/{section}/toggle', [RegistrarController::class, 'toggleSection'])->name('sections.toggle');
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
    
    // Semester routes
    Route::post('/semesters', [RegistrarController::class, 'storeSemester'])->name('semesters.store');
    Route::put('/semesters/{semester}', [RegistrarController::class, 'updateSemester'])->name('semesters.update');
    Route::put('/semesters/{semester}/toggle', [RegistrarController::class, 'toggleSemester'])->name('semesters.toggle');
    Route::put('/semesters/{semester}/activate', [RegistrarController::class, 'activateSemester'])->name('semesters.activate');
    Route::delete('/semesters/{semester}', [RegistrarController::class, 'destroySemester'])->name('semesters.destroy');
    Route::get('/semesters/calculate-dates', [RegistrarController::class, 'getCalculatedSemesterDates'])->name('semesters.calculate-dates');
    
    // Semester rollover routes
    Route::post('/strands/activate-for-new-semester', [RegistrarController::class, 'activateStrandsForNewSemester'])->name('strands.activate-new-semester');
    Route::post('/sections/reopen-for-semester', [RegistrarController::class, 'reopenSectionsForSemester'])->name('sections.reopen-semester');
    Route::post('/classes/reopen-for-semester', [RegistrarController::class, 'reopenClassesForSemester'])->name('classes.reopen-semester');
    
    // Classes routes
    Route::get('/classes', [RegistrarController::class, 'classes'])->name('classes');
    Route::post('/classes', [RegistrarController::class, 'storeClass'])->name('classes.store');
    Route::put('/classes/{class}', [RegistrarController::class, 'updateClass'])->name('classes.update');
    Route::put('/classes/{class}/toggle', [RegistrarController::class, 'toggleClass'])->name('classes.toggle');
    Route::delete('/classes/{class}', [RegistrarController::class, 'destroyClass'])->name('classes.destroy');
    
    // Faculty routes
    Route::get('/faculty', [RegistrarController::class, 'faculty'])->name('faculty');
    Route::post('/faculty', [RegistrarController::class, 'storeFaculty'])->name('faculty.store');
    Route::put('/faculty/{faculty}', [RegistrarController::class, 'updateFaculty'])->name('faculty.update');
    Route::delete('/faculty/{faculty}', [RegistrarController::class, 'destroyFaculty'])->name('faculty.destroy');
    
    Route::get('/profile', [RegistrarController::class, 'profile'])->name('profile');
    Route::put('/profile', [RegistrarController::class, 'updateProfile'])->name('profile.update');
});

// Faculty area - protected routes
Route::middleware(['auth'])->prefix('faculty')->name('faculty.')->group(function () {
    Route::get('/', [FacultyController::class, 'index'])->name('dashboard');
    Route::get('/classes', [FacultyController::class, 'classes'])->name('classes');
    Route::get('/students', [FacultyController::class, 'sections'])->name('students');
    Route::get('/grades', function () {
        return Inertia::render('Faculty/Grades');
    })->name('grades');
    // Route::get('/attendance', function () {
    //     return Inertia::render('Faculty/Attendance');
    // })->name('attendance');
    // Route::get('/schedule', [FacultyController::class, 'schedule'])->name('schedule');
    Route::get('/profile', [FacultyController::class, 'profile'])->name('profile');
    Route::put('/profile', [FacultyController::class, 'updateProfile'])->name('profile.update');
    
    // Semester data access route (for accessing previous semester data)
    Route::get('/semester-data', [FacultyController::class, 'getSemesterData'])->name('semester-data');
});
