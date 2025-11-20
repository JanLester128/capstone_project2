<?php

namespace App\Http\Controllers;

use App\Models\Grade;
use App\Models\SchoolYear;
use App\Models\Semester;
use App\Models\StudentPersonalInfo;
use App\Services\GradeCalculationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class GradeProcessingController extends Controller
{
    protected GradeCalculationService $gradeService;

    public function __construct(GradeCalculationService $gradeService)
    {
        $this->gradeService = $gradeService;
    }

    /**
     * View semester end processing page
     */
    public function index(): Response
    {
        $activeSchoolYear = SchoolYear::where('is_active', true)->first();
        $activeSemester = $activeSchoolYear 
            ? Semester::where('school_year_id', $activeSchoolYear->id)
                ->where('is_active', true)
                ->first()
            : null;

        // Get all approved grades for current semester
        $approvedGrades = Grade::with(['student.user', 'subject', 'classModel.section'])
            ->when($activeSchoolYear, fn($q) => $q->where('school_year_id', $activeSchoolYear->id))
            ->when($activeSemester, fn($q) => $q->where('semester', $this->normalizeSemester($activeSemester->semester_type)))
            ->where('status', Grade::STATUS_APPROVED)
            ->get();

        // Group by student
        $studentStats = $approvedGrades->groupBy('student_personal_info_id')->map(function ($grades, $studentId) {
            $student = $grades->first()->student;
            $totalSubjects = $grades->count();
            $passedSubjects = $grades->where('remarks', 'Passed')->count();
            $failedSubjects = $grades->where('remarks', 'Failed')->count();
            $average = $grades->avg('semester_grade');

            return [
                'student_id' => $studentId,
                'student_name' => $student?->full_name,
                'lrn' => $student?->lrn,
                'total_subjects' => $totalSubjects,
                'passed' => $passedSubjects,
                'failed' => $failedSubjects,
                'average' => round($average, 2),
                'needs_calculation' => $grades->where('auto_calculated', false)->count() > 0,
                'needs_summer' => $grades->where('needs_summer_class', true)->count() > 0,
                'has_failed_prerequisites' => $grades->where('is_prerequisite_failed', true)->count() > 0,
            ];
        })->values();

        return Inertia::render('Registrar/GradeProcessing', [
            'activeSchoolYear' => $activeSchoolYear,
            'activeSemester' => $activeSemester,
            'studentStats' => $studentStats,
            'summary' => [
                'total_students' => $studentStats->count(),
                'needs_calculation' => $studentStats->where('needs_calculation', true)->count(),
                'needs_summer' => $studentStats->where('needs_summer', true)->count(),
                'failed_prerequisites' => $studentStats->where('has_failed_prerequisites', true)->count(),
            ],
        ]);
    }

    /**
     * Process semester end for all students
     */
    public function processSemesterEnd(Request $request)
    {
        $validated = $request->validate([
            'school_year_id' => 'required|exists:school_year,id',
            'semester' => 'required|in:1st,2nd,Summer',
        ]);

        $results = $this->gradeService->processSemesterEnd(
            $validated['school_year_id'],
            $validated['semester']
        );

        return redirect()->back()->with('success', "Semester processing completed for {$results->count()} students.");
    }

    /**
     * Calculate individual student grades
     */
    public function calculateStudentGrades(Request $request, StudentPersonalInfo $student)
    {
        $validated = $request->validate([
            'school_year_id' => 'required|exists:school_year,id',
            'semester' => 'required|in:1st,2nd,Summer',
        ]);

        $grades = Grade::where('student_personal_info_id', $student->id)
            ->where('school_year_id', $validated['school_year_id'])
            ->where('semester', $validated['semester'])
            ->where('status', Grade::STATUS_APPROVED)
            ->get();

        foreach ($grades as $grade) {
            $this->gradeService->autoCalculateGrade($grade);
        }

        $performance = $this->gradeService->calculateSemesterPerformance(
            $student->id,
            $validated['school_year_id'],
            $validated['semester']
        );

        return redirect()->back()->with('success', "Grades calculated successfully for {$student->full_name}");
    }

    /**
     * View students requiring summer classes
     */
    public function summerClassStudents(): Response
    {
        $activeSchoolYear = SchoolYear::where('is_active', true)->first();
        
        if (!$activeSchoolYear) {
            return Inertia::render('Registrar/SummerClassStudents', [
                'students' => collect(),
                'activeSchoolYear' => null,
            ]);
        }

        // Get most recent semester
        $lastSemester = Semester::where('school_year_id', $activeSchoolYear->id)
            ->orderByDesc('created_at')
            ->first();

        $students = $lastSemester 
            ? $this->gradeService->getStudentsRequiringSummer(
                $activeSchoolYear->id,
                $this->normalizeSemester($lastSemester->semester_type)
            )
            : collect();

        $formattedStudents = $students->map(function ($student) {
            $failedGrades = $student->grades->where('needs_summer_class', true);
            
            return [
                'id' => $student->id,
                'lrn' => $student->lrn,
                'name' => $student->full_name,
                'email' => $student->user?->email,
                'failed_subjects' => $failedGrades->map(fn($g) => [
                    'id' => $g->id,
                    'subject' => $g->subject?->Subject_name,
                    'subject_code' => $g->subject?->Subject_code,
                    'grade' => $g->semester_grade,
                    'is_prerequisite' => $g->is_prerequisite_failed,
                    'blocks_subjects' => $g->failed_prerequisites,
                ])->values(),
                'total_failed' => $failedGrades->count(),
            ];
        });

        return Inertia::render('Registrar/SummerClassStudents', [
            'students' => $formattedStudents,
            'activeSchoolYear' => $activeSchoolYear,
            'lastSemester' => $lastSemester,
        ]);
    }

    /**
     * View STEM students requiring strand change
     */
    public function stemStrandChangeStudents(): Response
    {
        $activeSchoolYear = SchoolYear::where('is_active', true)->first();
        
        if (!$activeSchoolYear) {
            return Inertia::render('Registrar/StemStrandChange', [
                'students' => collect(),
                'activeSchoolYear' => null,
            ]);
        }

        $lastSemester = Semester::where('school_year_id', $activeSchoolYear->id)
            ->orderByDesc('created_at')
            ->first();

        $students = $lastSemester 
            ? $this->gradeService->getStemStudentsRequiringChange(
                $activeSchoolYear->id,
                $this->normalizeSemester($lastSemester->semester_type)
            )
            : collect();

        $formattedStudents = $students->map(function ($performance) {
            return [
                'id' => $performance->student_personal_info_id,
                'lrn' => $performance->student?->lrn,
                'name' => $performance->student?->full_name,
                'email' => $performance->student?->user?->email,
                'current_strand' => $performance->strand?->Strand_name,
                'current_strand_code' => $performance->strand?->Strand_code,
                'recommended_strand' => $performance->recommendedStrand?->Strand_name,
                'recommended_strand_id' => $performance->recommended_strand_id,
                'semester_average' => $performance->semester_average,
                'failed_subjects' => $performance->failed_subjects,
                'total_subjects' => $performance->total_subjects,
                'enrollment_id' => $performance->enrollment_id,
            ];
        });

        return Inertia::render('Registrar/StemStrandChange', [
            'students' => $formattedStudents,
            'activeSchoolYear' => $activeSchoolYear,
            'lastSemester' => $lastSemester,
        ]);
    }

    /**
     * Process strand change for STEM student
     */
    public function processStrandChange(Request $request, StudentPersonalInfo $student)
    {
        $validated = $request->validate([
            'from_strand_id' => 'required|exists:strands,id',
            'to_strand_id' => 'required|exists:strands,id',
            'reason' => 'required|string|max:500',
        ]);

        $success = $this->gradeService->initiateStrandChange(
            $student->id,
            $validated['from_strand_id'],
            $validated['to_strand_id'],
            $validated['reason']
        );

        if ($success) {
            return redirect()->back()->with('success', 'Strand change initiated successfully.');
        }

        return redirect()->back()->withErrors(['error' => 'Failed to initiate strand change.']);
    }

    /**
     * Normalize semester type to match database enum
     */
    private function normalizeSemester(?string $semesterType): string
    {
        if (!$semesterType) {
            return '1st';
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

        return '1st';
    }
}

