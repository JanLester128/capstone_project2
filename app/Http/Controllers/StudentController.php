<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Section;
use App\Models\ClassModel;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StudentController extends Controller
{
    /**
     * Display the student dashboard.
     */
    public function index()
    {
        $user = auth()->user();
        
        // Load student's assigned strand, sections, and classes
        $student = User::with(['assignedStrand', 'classes.section', 'classes.faculty', 'classes.semester'])
            ->find($user->id);

        return Inertia::render('Student/Dashboard', [
            'student' => $student,
        ]);
    }

    /**
     * Display the student's classes.
     */
    public function classes()
    {
        $user = auth()->user();
        
        $classes = ClassModel::with(['section', 'faculty', 'semester', 'schoolYear'])
            ->whereHas('section', function ($query) use ($user) {
                // Get classes for sections the student belongs to
                // This assumes there's a relationship between students and sections
            })
            ->get();

        return Inertia::render('Student/Classes', [
            'classes' => $classes,
        ]);
    }

    /**
     * Display the student's schedule.
     */
    public function schedule()
    {
        $user = auth()->user();
        
        $classes = ClassModel::with(['section', 'faculty', 'subject', 'semester'])
            ->where('is_active', true)
            ->get();

        return Inertia::render('Student/Schedule', [
            'classes' => $classes,
        ]);
    }

    /**
     * Display student profile.
     */
    public function profile()
    {
        $user = auth()->user();
        
        $student = User::with(['assignedStrand'])
            ->find($user->id);

        return Inertia::render('Student/Profile', [
            'student' => $student,
        ]);
    }

    /**
     * Update student profile.
     */
    public function updateProfile(Request $request)
    {
        $user = auth()->user();
        
        $validated = $request->validate([
            'FirstName' => 'required|string|max:255',
            'MiddleName' => 'nullable|string|max:255',
            'LastName' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
        ]);

        $user->update($validated);

        return redirect()->route('student.profile')
            ->with('success', 'Profile updated successfully.');
    }
}

