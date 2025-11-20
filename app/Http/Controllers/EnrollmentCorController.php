<?php

namespace App\Http\Controllers;

use App\Models\Enrollment;
use App\Models\Section;
use App\Models\Strand;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\View\View;

class EnrollmentCorController extends Controller
{
    /**
     * Display the Certificate of Registration for a given enrollment.
     */
    public function __invoke(Request $request, Enrollment $enrollment): View
    {
        $user = $request->user();

        if (!$this->canViewCor($user, $enrollment)) {
            abort(403, 'You are not authorized to view this certificate.');
        }

        $canAssign = $user && ($user->Role === 'Registrar' || ($user->Role === 'Faculty' && $user->is_coordinator));
        $isEnrolled = $enrollment->status === Enrollment::STATUS_ENROLLED;
        
        // For summer semester enrollments: ensure classes exist for failed subjects
        $enrollment->load(['semester', 'assignedSection']);
        $isSummerSemester = $enrollment->semester && 
            str_contains(strtolower($enrollment->semester->semester_type ?? ''), 'summer');
        
        if ($isSummerSemester && $isEnrolled && $enrollment->assigned_section_id) {
            // Check if classes exist for failed subjects
            $latestEnrollment = \App\Models\Enrollment::where('student_personal_info_id', $enrollment->student_personal_info_id)
                ->where('status', \App\Models\Enrollment::STATUS_ENROLLED)
                ->where('id', '!=', $enrollment->id)
                ->latest('processed_at')
                ->first();
            
            if ($latestEnrollment) {
                $failedGrades = \App\Models\Grade::where('student_personal_info_id', $enrollment->student_personal_info_id)
                    ->where('school_year_id', $latestEnrollment->school_year_id)
                    ->where('status', \App\Models\Grade::STATUS_APPROVED)
                    ->where(function ($query) {
                        $query->where('semester_grade', '<', 75)
                              ->orWhere('remarks', 'Failed');
                    })
                    ->with('subject')
                    ->get()
                    ->filter(function ($grade) {
                        return $grade->subject_id !== null;
                    });
                
                if ($failedGrades->isNotEmpty()) {
                    // Check if classes exist for these subjects
                    $failedSubjectIds = $failedGrades->pluck('subject_id')->unique()->all();
                    $existingClasses = \App\Models\ClassModel::where('Section_id', $enrollment->assigned_section_id)
                        ->where('school_year_id', $enrollment->school_year_id)
                        ->where('Semester_id', $enrollment->semester_id)
                        ->whereIn('subject_id', $failedSubjectIds)
                        ->where('is_active', true)
                        ->pluck('subject_id')
                        ->all();
                    
                    $missingSubjects = array_diff($failedSubjectIds, $existingClasses);
                    
                    // If classes are missing, create them and then create class details
                    if (!empty($missingSubjects) && $canAssign) {
                        // Reload enrollment to get fresh data
                        $enrollment->refresh();
                        $enrollment->load(['assignedSection', 'semester', 'schoolYear']);
                        
                        // Create missing classes using the same logic as reEnrollAuto
                        $registrarController = app(\App\Http\Controllers\RegistrarController::class);
                        $reflection = new \ReflectionClass($registrarController);
                        $createMethod = $reflection->getMethod('createClassesForFailedSubjects');
                        $createMethod->setAccessible(true);
                        $createMethod->invoke($registrarController, $enrollment, $failedGrades, $user->id);
                        
                        // Then create class details for all classes (including newly created ones)
                        $createDetailsMethod = $reflection->getMethod('createClassDetailsForEnrollment');
                        $createDetailsMethod->setAccessible(true);
                        $createDetailsMethod->invoke($registrarController, $enrollment, $user->id, false, $failedGrades);
                        
                        // Reload enrollment relationships after creating classes
                        $enrollment->refresh();
                    }
                }
            }
        }
        
        // Lock enrollment when enrolled (historical data preserved via soft deletes)
        if ($isEnrolled && !$enrollment->is_locked) {
            $enrollment->freezeCOR();
        }
        
        // Handle temporary section selection from query parameter (for preview before save)
        $tempSectionId = $request->query('section_id');
        $tempSection = null;
        $selectedSectionId = $enrollment->assigned_section_id;
        
        if ($tempSectionId && !$isEnrolled && $canAssign) {
            // Temporarily update enrollment for preview (don't save to database)
            // This allows classes to display when section is selected before form submission
            $tempSection = Section::with('strand')->find($tempSectionId);
            if ($tempSection) {
                // Only update if section belongs to same school year/semester
                if ($tempSection->school_year_id == $enrollment->school_year_id) {
                    if (!$enrollment->semester_id || !$tempSection->semester_id || $tempSection->semester_id == $enrollment->semester_id) {
                        $enrollment->assigned_section_id = $tempSectionId;
                        $selectedSectionId = $tempSectionId;
                        if (!$enrollment->assigned_strand_id) {
                            $enrollment->assigned_strand_id = $tempSection->strand_id;
                        }
                    }
                }
            }
        }

        $enrollment->load([
            'studentPersonalInfo.user',
            'studentPersonalInfo.strandPreferences.strand',
            'assignedStrand',
            'assignedSection.adviser',
            'assignedSection.strand',
            'assignedSection.classes' => function ($query) use ($enrollment) {
                $query->with(['subject', 'section', 'faculty'])
                    ->where('is_active', true)
                    ->when($enrollment->school_year_id, function ($q) use ($enrollment) {
                        return $q->where('school_year_id', $enrollment->school_year_id);
                    })
                    ->when($enrollment->semester_id, function ($q) use ($enrollment) {
                        return $q->where('Semester_id', $enrollment->semester_id);
                    });
            },
            'schoolYear',
            'semester',
            'classDetails.class.subject',
            'classDetails.class.section',
            'classDetails.class.faculty',
        ]);

        $cor = $enrollment->toCorArray();

        $showEnrollmentForm = $canAssign && !$isEnrolled; // Show form if registrar/coordinator and not enrolled
        $strands = collect();
        $sections = collect();

        if ($showEnrollmentForm) {
            $strands = Strand::where('Is_active', true)
                ->orderBy('Strand_name')
                ->get(['id', 'Strand_name', 'Strand_code']);

            $sections = Section::with('adviser:id,FirstName,MiddleName,LastName')
                ->where('school_year_id', $enrollment->school_year_id)
                ->when($enrollment->semester_id, function ($query) use ($enrollment) {
                    $query->where('semester_id', $enrollment->semester_id);
                })
                ->where('is_active', true)
                ->orderBy('section_name')
                ->get(['id', 'section_name', 'strand_id', 'adviser_id']);
        }

        $isIframe = $request->has('iframe') && $request->query('iframe') == '1';

        // Senior High Coordinator name
        $coordinatorName = 'Anadesi Lopex Buhisan';

        // Principal name - can be configured later via settings or database
        $principalName = null; // TODO: Add Principal name from settings or database

        // Get Registrar name (first registrar found)
        $registrar = User::where('Role', 'Registrar')
            ->where('is_disabled', false)
            ->first();
        $registrarName = null;
        if ($registrar) {
            $nameParts = array_filter([
                $registrar->FirstName ?? '',
                $registrar->MiddleName ?? '',
                $registrar->LastName ?? ''
            ]);
            $registrarName = trim(implode(' ', $nameParts));
        }

        return view('reports.cor', [
            'cor' => $cor,
            'logoPath' => asset('onsts.png'),
            'schoolName' => 'OPOL NATIONAL SECONDARY TECHNICAL SCHOOL',
            'schoolAddress' => 'Opol, Misamis Oriental',
            'generatedBy' => trim(($user->FirstName ?? '') . ' ' . ($user->LastName ?? '')),
            'canAssign' => $canAssign,
            'showEnrollmentForm' => $showEnrollmentForm,
            'isEnrolled' => $isEnrolled,
            'enrollmentModel' => $enrollment,
            'enrollmentStatus' => $enrollment->status,
            'strands' => $strands,
            'sections' => $sections,
            'selectedStrandId' => $enrollment->assigned_strand_id,
            'selectedSectionId' => $selectedSectionId ?? $enrollment->assigned_section_id,
            'selectedGradeLevel' => old('grade_level', $enrollment->studentPersonalInfo?->grade_level),
            'isIframe' => $isIframe,
            'principalName' => $principalName,
            'coordinatorName' => $coordinatorName,
            'registrarName' => $registrarName,
        ]);
    }

    /**
     * Determine whether the current user can view this enrollment COR.
     */
    private function canViewCor($user, Enrollment $enrollment): bool
    {
        if (!$user) {
            return false;
        }

        switch ($user->Role) {
            case 'Registrar':
                return true;
            case 'Faculty':
                if ($user->is_coordinator) {
                    return true;
                }

                $section = $enrollment->assignedSection;
                return $section && $section->adviser_id === $user->id;
            case 'Student':
                return $enrollment->studentPersonalInfo?->user_id === $user->id
                    && $enrollment->canGenerateCor();
            default:
                return false;
        }
    }
}


