<?php

namespace App\Models;

use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use App\Models\ClassModel;
use App\Models\ClassDetail;
use App\Models\ClassRecord;
use App\Models\CreditedSubject;
use App\Models\Grade;
use App\Models\SchoolYear;
use App\Models\Section;
use App\Models\Semester;
use App\Models\Strand;
use App\Models\Subject;
use App\Models\User;

class Enrollment extends Model
{
    public const STATUS_PRE_ENROLLED = 'pre_enrolled';
    public const STATUS_RECOMMENDED = 'recommended';
    public const STATUS_ENROLLED = 'enrolled';
    public const STATUS_REJECTED = 'rejected';

    public const STATUS_TRANSITIONS = [
        self::STATUS_PRE_ENROLLED => [self::STATUS_RECOMMENDED, self::STATUS_REJECTED],
        self::STATUS_RECOMMENDED => [self::STATUS_ENROLLED, self::STATUS_PRE_ENROLLED, self::STATUS_REJECTED],
        self::STATUS_ENROLLED => [],
        self::STATUS_REJECTED => [self::STATUS_PRE_ENROLLED],
    ];
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'student_personal_info_id',
        'school_year_id',
        'semester_id',
        'status',
        'enrolled_by',
        'submitted_at',
        'processed_at',
        'assigned_strand_id',
        'assigned_section_id',
        'curriculum_id',
        'approved_by',
        'approved_at',
        'confirmed_at',
        'is_on_probation',
        'requires_summer_classes',
        'summer_subjects_needed',
        'is_transferee',
        'previous_school',
        // Locking fields for business logic
        'is_locked',
        'locked_at',
    ];

    protected static function booted(): void
    {
        static::saved(function (Enrollment $enrollment) {
            if (!$enrollment->curriculum_id) {
                $enrollment->academicRecords()->delete();
                return;
            }

            if (!in_array($enrollment->status, [
                self::STATUS_PRE_ENROLLED,
                self::STATUS_RECOMMENDED,
                self::STATUS_ENROLLED,
            ], true)) {
                return;
            }

            $needsRefresh = $enrollment->wasChanged([
                'curriculum_id',
                'assigned_strand_id',
            ]);

            if ($needsRefresh || !$enrollment->academicRecords()->exists()) {
                $enrollment->syncAcademicRecords();
            }
        });
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'submitted_at' => 'datetime',
            'processed_at' => 'datetime',
            'approved_at' => 'datetime',
            'confirmed_at' => 'datetime',
            'locked_at' => 'datetime',
            'is_on_probation' => 'boolean',
            'requires_summer_classes' => 'boolean',
            'is_locked' => 'boolean',
            'is_transferee' => 'boolean',
        ];
    }

    /**
     * Get the student personal info that owns the enrollment.
     */
    public function studentPersonalInfo(): BelongsTo
    {
        return $this->belongsTo(StudentPersonalInfo::class, 'student_personal_info_id');
    }

    /**
     * Get the school year for this enrollment.
     */
    public function schoolYear(): BelongsTo
    {
        return $this->belongsTo(SchoolYear::class, 'school_year_id');
    }

    /**
     * Get the semester for this enrollment.
     */
    public function semester(): BelongsTo
    {
        return $this->belongsTo(Semester::class, 'semester_id');
    }

    /**
     * Get the user (registrar) who processed the enrollment.
     */
    public function enrolledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'enrolled_by');
    }

    /**
     * Registrar who approved this enrollment for COR.
     */
    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Get the assigned strand for this enrollment.
     */
    public function assignedStrand(): BelongsTo
    {
        return $this->belongsTo(Strand::class, 'assigned_strand_id');
    }

    /**
     * Get the assigned section for this enrollment.
     */
    public function assignedSection(): BelongsTo
    {
        return $this->belongsTo(Section::class, 'assigned_section_id');
    }

    /**
     * Get the curriculum linked to this enrollment.
     */
    public function curriculum(): BelongsTo
    {
        return $this->belongsTo(Curriculum::class, 'curriculum_id');
    }

    /**
     * Get the class details associated with this enrollment.
     */
    public function classDetails(): HasMany
    {
        return $this->hasMany(ClassDetail::class, 'enrollment_id');
    }

    public function academicRecords(): HasMany
    {
        return $this->hasMany(AcademicRecord::class);
    }

    /**
     * Get the credited subjects for this enrollment.
     */
    public function creditedSubjects(): HasMany
    {
        return $this->hasMany(CreditedSubject::class, 'enrollment_id');
    }

    /**
     * Get the class records for this enrollment through class details.
     */
    public function classRecords()
    {
        return $this->hasManyThrough(
            ClassRecord::class,
            ClassDetail::class,
            'enrollment_id', // Foreign key on class_details table
            'class_detail_id', // Foreign key on class_records table
            'id', // Local key on enrollments table
            'id' // Local key on class_details table
        );
    }

    /**
     * Get the strand preferences from student_strand_preferences table.
     */
    public function getStrandPreferencesModelsAttribute()
    {
        return $this->studentPersonalInfo
            ->strandPreferences()
            ->with('strand')
            ->get()
            ->pluck('strand');
    }

    /**
     * Get the primary strand preference (first choice).
     */
    public function getPrimaryStrandAttribute()
    {
        $preferences = $this->studentPersonalInfo
            ->strandPreferences()
            ->with('strand')
            ->orderBy('preference_order')
            ->first();

        return $preferences ? $preferences->strand : null;
    }

    /**
     * Get strand preference IDs from student_strand_preferences table.
     */
    public function getStrandPreferenceIdsAttribute()
    {
        return $this->studentPersonalInfo
            ->strandPreferences()
            ->orderBy('preference_order')
            ->pluck('strand_id')
            ->toArray();
    }

    /**
     * Get the status badge color.
     */
    public function getStatusColorAttribute(): string
    {
        return match($this->status) {
            self::STATUS_PRE_ENROLLED => 'yellow',
            self::STATUS_RECOMMENDED => 'orange',
            self::STATUS_ENROLLED => 'blue',
            self::STATUS_REJECTED => 'red',
            default => 'gray',
        };
    }

    /**
     * Get the status display text.
     */
    public function getStatusTextAttribute(): string
    {
        return match($this->status) {
            self::STATUS_PRE_ENROLLED => 'Pre-Enrolled',
            self::STATUS_RECOMMENDED => 'Recommended',
            self::STATUS_ENROLLED => 'Enrolled',
            self::STATUS_REJECTED => 'Returned / Needs Revision',
            default => 'Unknown',
        };
    }

    /**
     * Determine whether the enrollment can be edited by the student.
     */
    public function isEditable(): bool
    {
        return in_array($this->status, [
            self::STATUS_REJECTED,
        ], true);
    }

    /**
     * Check if transferee has any credited subjects that need approval.
     */
    public function hasPendingCreditedSubjects(): bool
    {
        if (!$this->is_transferee) {
            return false;
        }

        $this->loadMissing('creditedSubjects');
        
        // If no credited subjects, no pending
        if ($this->creditedSubjects->isEmpty()) {
            return false;
        }

        // Check if any credited subject is missing grades or approval
        return $this->creditedSubjects->contains(function ($credit) {
            // Missing grades
            if ($credit->credited_grade === null || $credit->quarter1 === null || $credit->quarter2 === null) {
                return true;
            }
            // Missing approval (if submitted by coordinator, needs registrar approval)
            if ($credit->credited_by !== null && $credit->approved_by === null) {
                return true;
            }
            return false;
        });
    }

    /**
     * Check if all credited subjects are approved and ready.
     */
    public function allCreditedSubjectsApproved(): bool
    {
        if (!$this->is_transferee) {
            return true; // Non-transferees don't need this check
        }

        $this->loadMissing('creditedSubjects');
        
        // If no credited subjects, consider it approved
        if ($this->creditedSubjects->isEmpty()) {
            return true;
        }

        // All credited subjects must have grades and be approved
        return $this->creditedSubjects->every(function ($credit) {
            // Must have grades
            if ($credit->credited_grade === null || $credit->quarter1 === null || $credit->quarter2 === null) {
                return false;
            }
            // If submitted by coordinator, must be approved by registrar
            if ($credit->credited_by !== null && $credit->approved_by === null) {
                return false;
            }
            // If submitted directly by registrar, approved_by should be set
            // (or if no credited_by, it's considered approved if it has grades)
            return true;
        });
    }

    /**
     * Determine whether the COR can be generated by the student.
     */
    public function canGenerateCor(): bool
    {
        // Must be enrolled
        if (!in_array($this->status, [self::STATUS_ENROLLED], true)) {
            return false;
        }

        // For transferees, all credited subjects must be approved
        if ($this->is_transferee && !$this->allCreditedSubjectsApproved()) {
            return false;
        }

        return true;
    }

    /**
     * Get watermark text for COR based on status.
     */
    public function getCorWatermarkAttribute(): string
    {
        return match($this->status) {
            self::STATUS_PRE_ENROLLED => 'FOR REVIEW',
            self::STATUS_RECOMMENDED => 'FOR REGISTRAR APPROVAL',
            self::STATUS_ENROLLED => 'OFFICIAL COPY',
            default => 'FOR REFERENCE',
        };
    }

    /**
     * Scope to filter by status.
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to filter by school year.
     */
    public function scopeBySchoolYear($query, $schoolYearId)
    {
        return $query->where('school_year_id', $schoolYearId);
    }

    /**
     * Scope to get pending enrollments.
     */
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PRE_ENROLLED);
    }

    /**
     * Scope to get approved enrollments.
     */
    public function scopeApproved($query)
    {
        return $query->where('status', self::STATUS_ENROLLED);
    }

    /**
     * Copy the current curriculum subjects into academic_records for pending/recommended states.
     */
    public function syncAcademicRecords(): void
    {
        $this->loadMissing(['curriculum', 'assignedSection']);

        if (!$this->curriculum_id || !$this->curriculum) {
            $this->academicRecords()->delete();
            return;
        }

        $strandId = $this->assigned_strand_id
            ?? $this->assignedSection?->strand_id
            ?? null;

        $subjectsQuery = Subject::with('semester')
            ->where('curriculum_id', $this->curriculum_id)
            ->orderBy('year_level')
            ->orderBy('Semester')
            ->orderBy('Subject_name');

        if ($strandId) {
            $subjectsQuery->where(function ($query) use ($strandId) {
                $query->where('strand_id', $strandId)
                    ->orWhereNull('strand_id');
            });
        }

        $subjects = $subjectsQuery->get();

        DB::transaction(function () use ($subjects, $strandId) {
            $this->academicRecords()->delete();

            foreach ($subjects as $index => $subject) {
                $this->academicRecords()->create([
                    'curriculum_id' => $this->curriculum_id,
                    'strand_id' => $strandId,
                    'subject_id' => $subject->Id,
                    'subject_name' => $subject->Subject_name,
                    'subject_code' => $subject->Subject_code,
                    'year_level' => $subject->year_level,
                    'semester' => $subject->Semester,
                    'semester_label' => $subject->semester?->semester_type ?? $subject->Semester,
                    'prerequisites' => $subject->PREREQUISITES,
                    'corequisites' => $subject->{'CO-REQUISITES'} ?? $subject->getAttribute('CO-REQUISITES'),
                    'sort_order' => $index + 1,
                ]);
            }
        });
    }

    /**
     * Transform enrollment into structured array for review screens.
     */
    public function toReviewArray(): array
    {
        $this->loadMissing([
            'studentPersonalInfo.user',
            'studentPersonalInfo.strandPreferences.strand',
            'schoolYear',
            'semester',
            'enrolledBy',
            'assignedStrand',
            'assignedSection.strand',
            'approvedBy',
        ]);

        $studentInfo = $this->studentPersonalInfo;
        $studentUser = $studentInfo?->user;

        $strandPreferences = $studentInfo
            ? $studentInfo->strandPreferences
                ->map(function ($preference) {
                    return [
                        'id' => $preference->id,
                        'order' => $preference->preference_order,
                        'label' => $preference->preference_text,
                        'strand' => $preference->strand ? [
                            'id' => $preference->strand->id,
                            'code' => $preference->strand->Strand_code,
                            'name' => $preference->strand->Strand_name,
                        ] : null,
                    ];
                })
                ->values()
                ->all()
            : [];

        return [
            'id' => $this->id,
            'status' => $this->status,
            'status_text' => $this->status_text,
            'status_color' => $this->status_color,
            'submitted_at' => optional($this->submitted_at)?->toDateTimeString(),
            'processed_at' => optional($this->processed_at)?->toDateTimeString(),
            'approved_at' => optional($this->approved_at)?->toDateTimeString(),
            'processed_by' => $this->enrolledBy ? [
                'id' => $this->enrolledBy->id,
                'name' => trim(($this->enrolledBy->FirstName ?? '') . ' ' . ($this->enrolledBy->LastName ?? '')),
                'email' => $this->enrolledBy->email,
            ] : null,
            'approved_by' => $this->approvedBy ? [
                'id' => $this->approvedBy->id,
                'name' => trim(($this->approvedBy->FirstName ?? '') . ' ' . ($this->approvedBy->LastName ?? '')),
                'email' => $this->approvedBy->email,
            ] : null,
            'school_year' => [
                'id' => $this->schoolYear?->id,
                'label' => $this->schoolYear?->formatted,
            ],
            'semester' => [
                'id' => $this->semester?->id,
                'label' => $this->semester?->semester_type,
            ],
            'assigned_strand' => $this->assignedStrand ? [
                'id' => $this->assignedStrand->id,
                'code' => $this->assignedStrand->Strand_code,
                'name' => $this->assignedStrand->Strand_name,
            ] : null,
            'assigned_section' => $this->assignedSection ? [
                'id' => $this->assignedSection->id,
                'name' => $this->assignedSection->section_name,
                'strand_id' => $this->assignedSection->strand_id,
                'year_level' => $this->assignedSection->year_level,
            ] : null,
            'student' => [
                'id' => $studentUser?->id,
                'name' => $studentInfo?->full_name,
                'email' => $studentUser?->email,
                'lrn' => $studentInfo?->lrn,
                'grade_level' => $studentInfo?->grade_level,
                'profile_photo_url' => $studentInfo?->profile_photo_url,
                'psa_url' => $studentInfo?->psa_birth_certificate_photo_url,
                'report_card_url' => $studentInfo?->report_card_photo_url,
                'is_verified' => $studentInfo?->is_verified,
                'strand_preferences' => $strandPreferences,
            ],
        ];
    }

    /**
     * Build data structure for Certificate of Registration.
     */
    public function toCorArray(): array
    {
        $this->loadMissing([
            'studentPersonalInfo.user',
            'studentPersonalInfo.strandPreferences.strand',
            'assignedSection.strand',
            'assignedSection.adviser',
            'assignedSection.classes' => function ($query) {
                $query->with(['subject', 'section', 'faculty'])
                    ->where('is_active', true)
                    ->when($this->school_year_id, function ($q) {
                        return $q->where('school_year_id', $this->school_year_id);
                    })
                    ->when($this->semester_id, function ($q) {
                        return $q->where('Semester_id', $this->semester_id);
                    });
            },
            'schoolYear',
            'semester',
            'assignedStrand',
            'classDetails.class.subject',
            'classDetails.class.section',
            'classDetails.class.faculty',
        ]);

        $studentInfo = $this->studentPersonalInfo;
        $section = $this->assignedSection;
        $strand = $section?->strand ?? $this->assignedStrand;
        $classes = $this->resolveClasses();

        // Build schedule showing all classes sorted by day and time
        $dayOrder = [
            'Monday' => 1,
            'Tuesday' => 2,
            'Wednesday' => 3,
            'Thursday' => 4,
            'Friday' => 5,
            'Saturday' => 6,
            'Sunday' => 7,
        ];

        // Reload classes with all relationships if needed
        if ($classes->isNotEmpty()) {
            $classIds = $classes->pluck('Id')->all();
            $classes = ClassModel::with(['subject', 'section', 'faculty'])
                ->whereIn('Id', $classIds)
                ->where('is_active', true)
                ->get();
        }
        
        // Load class details with their class records
        $classDetails = $this->classDetails()->with('classRecord')->get();
        
        // Build schedule entries for all classes first
        $classEntries = $classes
            ->map(function ($class) use ($section, $dayOrder, $classDetails) {
                if (!$class) {
                    return null;
                }
                
                // Find the corresponding ClassDetail for this class
                $classDetail = $classDetails->firstWhere('class_id', $class->Id);
                
                // Get class record data if available
                $classRecord = $classDetail?->classRecord;
                
                // Use class record data if available, otherwise fall back to live data (for backward compatibility)
                $subjectName = $classRecord?->subject_name ?? $class->subject?->Subject_name ?? '';
                $sectionName = $classRecord?->section_name ?? $class->section?->section_name ?? $section?->section_name ?? '';
                $facultyName = $classRecord?->faculty_name;
                if (empty($facultyName)) {
                    $facultyName = trim(($class->faculty?->FirstName ?? '') . ' ' . ($class->faculty?->LastName ?? ''));
                }
                $dayOfWeek = $classRecord?->day_of_week ?? $class->day_of_week ?? '';
                $startTime = $classRecord?->start_time ?? $class->start_time;
                $endTime = $classRecord?->end_time ?? ($class->endtime ?? $class->end_time);
                
                return [
                    'type' => 'class',
                    'day' => $dayOfWeek,
                    'time' => $this->formatTimeRange($startTime, $endTime),
                    'subject' => $subjectName,
                    'section' => $sectionName,
                    'faculty' => $facultyName,
                    '_order' => ($dayOrder[$dayOfWeek] ?? PHP_INT_MAX) * 1000000 + $this->parseTimeRangeStart($this->formatTimeRange($startTime, $endTime)),
                ];
            })
            ->filter(fn ($item) => $item !== null);
        
        // Define fixed time slots based on the COR layout (matching the exact format from formatTimeRange)
        // Note: formatTimeRange uses 'g:ia' format which produces "7:00am" (no space, lowercase)
        $fixedTimeSlots = [
            ['time' => '7:00am – 7:30am', 'static' => true, 'subject' => 'Flag Ceremony (Monday Only)', 'day' => 'Monday'],
            ['time' => '8:30am – 10:30am', 'static' => false],
            ['time' => '11:00am – 12:30pm', 'static' => false],
            ['time' => '12:30pm – 1:30pm', 'static' => true, 'subject' => 'Lunch Break', 'day' => ''],
            ['time' => '1:30pm – 3:30pm', 'static' => false],
            ['time' => '3:30pm – 4:30pm', 'static' => false],
            ['time' => '4:30pm – 4:45pm', 'static' => true, 'subject' => 'Flag Lowering (Friday Only)', 'day' => 'Friday'],
        ];
        
        // Group classes by time slot and day for grid layout
        $classesByTimeAndDay = [];
        foreach ($classEntries as $classEntry) {
            $timeSlot = $classEntry['time'];
            $day = $classEntry['day'] ?? '';
            if (!isset($classesByTimeAndDay[$timeSlot])) {
                $classesByTimeAndDay[$timeSlot] = [];
            }
            if (!isset($classesByTimeAndDay[$timeSlot][$day])) {
                $classesByTimeAndDay[$timeSlot][$day] = [];
            }
            $classesByTimeAndDay[$timeSlot][$day][] = $classEntry;
        }
        
        // Build schedule grid with fixed time slots and dynamic classes organized by day
        $schedule = [];
        
        foreach ($fixedTimeSlots as $slot) {
            $timeSlot = $slot['time'];
            $scheduleRow = [
                'type' => $slot['static'] ? 'event' : 'class_row',
                'time' => $timeSlot,
                '_order' => $this->parseTimeRangeStart($timeSlot),
            ];
            
            if ($slot['static']) {
                // Static row spans all days
                $scheduleRow['subject'] = $slot['subject'];
                $scheduleRow['day'] = $slot['day'] ?? '';
                $scheduleRow['is_static'] = true;
            } else {
                // Class row - organize by day
                $dayOrder = ['Monday' => 1, 'Tuesday' => 2, 'Wednesday' => 3, 'Thursday' => 4, 'Friday' => 5];
                $scheduleRow['monday'] = $classesByTimeAndDay[$timeSlot]['Monday'] ?? [];
                $scheduleRow['tuesday'] = $classesByTimeAndDay[$timeSlot]['Tuesday'] ?? [];
                $scheduleRow['wednesday'] = $classesByTimeAndDay[$timeSlot]['Wednesday'] ?? [];
                $scheduleRow['thursday'] = $classesByTimeAndDay[$timeSlot]['Thursday'] ?? [];
                $scheduleRow['friday'] = $classesByTimeAndDay[$timeSlot]['Friday'] ?? [];
                $scheduleRow['is_static'] = false;
            }
            
            $schedule[] = $scheduleRow;
        }
        
        // Add any classes that don't match the fixed time slots
        $usedTimes = collect($fixedTimeSlots)->pluck('time')->all();
        $remainingClasses = $classEntries->reject(function ($entry) use ($usedTimes) {
            return in_array($entry['time'], $usedTimes);
        });
        
        // Group remaining classes by time slot
        $remainingByTime = $remainingClasses->groupBy('time');
        foreach ($remainingByTime as $timeSlot => $classes) {
            $dayOrder = ['Monday' => 1, 'Tuesday' => 2, 'Wednesday' => 3, 'Thursday' => 4, 'Friday' => 5];
            $scheduleRow = [
                'type' => 'class_row',
                'time' => $timeSlot,
                '_order' => $this->parseTimeRangeStart($timeSlot),
                'is_static' => false,
            ];
            
            $byDay = $classes->groupBy('day');
            $scheduleRow['monday'] = ($byDay['Monday'] ?? collect())->all();
            $scheduleRow['tuesday'] = ($byDay['Tuesday'] ?? collect())->all();
            $scheduleRow['wednesday'] = ($byDay['Wednesday'] ?? collect())->all();
            $scheduleRow['thursday'] = ($byDay['Thursday'] ?? collect())->all();
            $scheduleRow['friday'] = ($byDay['Friday'] ?? collect())->all();
            
            $schedule[] = $scheduleRow;
        }
        
        // Sort by order (time) and convert to array
        $schedule = collect($schedule)
            ->sortBy('_order')
            ->values()
            ->all();

        $adviser = $section?->adviser;
        $adviserName = $adviser
            ? trim(($adviser->FirstName ?? '') . ' ' . ($adviser->LastName ?? ''))
            : null;

        return [
            'student' => [
                'name' => $studentInfo?->full_name,
                'lrn' => $studentInfo?->lrn,
                'grade_level' => $studentInfo?->grade_level,
                'strand' => $strand?->Strand_name,
                'strand_code' => $strand?->Strand_code,
                'section' => $section?->section_name,
                'adviser' => $adviserName,
            ],
            'school_year' => $this->schoolYear?->formatted,
            'semester' => $this->semester?->semester_type,
            'date_enrolled' => optional($this->processed_at)->format('F d, Y'),
            'generated_at' => now()->toDateTimeString(),
            'status' => [
                'code' => $this->status,
                'label' => $this->status_text,
                'watermark' => $this->cor_watermark,
            ],
            'schedule' => $schedule,
        ];
    }

    /**
     * Transform enrollment into class schedule entries for student-facing views.
     */
    public function toScheduleEntries(): array
    {
        $this->loadMissing([
            'assignedSection.strand',
            'assignedSection.adviser',
            'assignedStrand',
        ]);

        $classes = $this->resolveClasses();

        if ($classes->isEmpty()) {
            return [];
        }

        $dayOrder = [
            'Monday' => 1,
            'Tuesday' => 2,
            'Wednesday' => 3,
            'Thursday' => 4,
            'Friday' => 5,
            'Saturday' => 6,
            'Sunday' => 7,
        ];

        // Load class details and class records
        $classDetails = $this->classDetails()->with('classRecord')->get();
        $classRecords = $this->classRecords()->get()->keyBy('class_detail_id');
        
        return $classes
            ->map(function (ClassModel $class) use ($classDetails, $classRecords) {
                // Find the corresponding ClassDetail for this class
                $classDetail = $classDetails->firstWhere('class_id', $class->Id);
                
                // Get class record data if available
                $classRecord = $classDetail ? $classRecords->get($classDetail->id) : null;
                
                // Use class record data if available, otherwise fall back to live data (for backward compatibility)
                $subjectName = $classRecord?->subject_name ?? $class?->subject?->Subject_name ?? '';
                $subjectCode = $classRecord?->subject_code ?? $class?->subject?->Subject_code ?? '';
                $facultyName = $classRecord?->faculty_name;
                if (empty($facultyName)) {
                    $facultyName = trim(($class?->faculty?->FirstName ?? '') . ' ' . ($class?->faculty?->LastName ?? ''));
                }
                $sectionName = $classRecord?->section_name ?? $class?->section?->section_name ?? $this->assignedSection?->section_name ?? '';
                $dayOfWeek = $classRecord?->day_of_week ?? $class?->day_of_week ?? '';
                $startTime = $classRecord?->start_time ?? $class?->start_time;
                $endTime = $classRecord?->end_time ?? ($class?->endtime ?? $class?->end_time);

                return [
                    'id' => $class->Id,
                    'subject' => $subjectName,
                    'subject_code' => $subjectCode,
                    'section' => $sectionName,
                    'faculty' => $facultyName !== '' ? $facultyName : null,
                    'day' => $dayOfWeek,
                    'time' => $this->formatTimeRange($startTime, $endTime),
                    'start_time' => $startTime ? Carbon::parse($startTime)->format('H:i') : null,
                    'end_time' => $endTime ? Carbon::parse($endTime)->format('H:i') : null,
                ];
            })
            ->sortBy(function (array $entry) use ($dayOrder) {
                $order = $dayOrder[$entry['day']] ?? PHP_INT_MAX;
                $time = $this->parseTimeRangeStart($entry['time'] ?? null);

                return ($order * 1_000_000_000) + $time;
            })
            ->values()
            ->all();
    }

    /**
     * Helper: build static schedule row.
     */
    private function corStaticRow(string $time, string $label, int $order): array
    {
        return [
            'type' => 'event',
            'time' => $time,
            'subject' => $label,
            'section' => '',
            'faculty' => '',
            '_order' => $order,
        ];
    }

    private function buildClassRow(string $timeSlot, $classes, $section, int $order): array
    {
        // Load class details with their class records
        $classDetails = $this->classDetails()->with('classRecord')->get();
        
        $match = $classes->first(function ($class) use ($timeSlot, $classDetails) {
            // Get class record data if available
            $classDetail = $classDetails->firstWhere('class_id', $class->Id);
            $classRecord = $classDetail?->classRecord;
            $startTime = $classRecord?->start_time ?? $class?->start_time;
            $endTime = $classRecord?->end_time ?? ($class?->endtime ?? $class?->end_time);
            return $this->formatTimeRange($startTime, $endTime) === $timeSlot;
        });

        if (!$match) {
            return [
                'type' => 'class',
                'time' => $timeSlot,
                'subject' => '',
                'section' => '',
                'faculty' => '',
                '_order' => $order,
            ];
        }

        // Get class record data if available
        $classDetail = $classDetails->firstWhere('class_id', $match->Id);
        $classRecord = $classDetail?->classRecord;
        
        $subjectName = $classRecord?->subject_name ?? $match?->subject?->Subject_name ?? '';
        $sectionName = $classRecord?->section_name ?? $match?->section?->section_name ?? $section?->section_name ?? '';
        $facultyName = $classRecord?->faculty_name;
        if (empty($facultyName)) {
            $facultyName = trim(($match?->faculty?->FirstName ?? '') . ' ' . ($match?->faculty?->LastName ?? ''));
        }

        return [
            'type' => 'class',
            'time' => $timeSlot,
            'subject' => $subjectName,
            'section' => $sectionName,
            'faculty' => $facultyName,
            '_order' => $order,
        ];
    }

    /**
     * Helper: format start/end time.
     */
    private function formatTimeRange($start, $end): string
    {
        $startFormatted = $this->formatTime($start);
        $endFormatted = $this->formatTime($end);

        if ($startFormatted && $endFormatted) {
            return "{$startFormatted} – {$endFormatted}";
        }

        return $startFormatted && $endFormatted
            ? "{$startFormatted} – {$endFormatted}"
            : ($startFormatted ?: ($endFormatted ?: 'TBA'));
    }

    /**
     * Helper: format time object or string into human-readable clock.
     */
    private function formatTime($time): ?string
    {
        if ($time instanceof CarbonInterface) {
            return $time->format('g:ia');
        }

        if ($time) {
            return Carbon::parse($time)->format('g:ia');
        }

        return null;
    }

    /**
     * Helper: parse the start time of a time range for sorting.
     */
    private function parseTimeRangeStart(?string $range): int
    {
        if (!$range) {
            return PHP_INT_MAX;
        }

        $parts = preg_split('/\s*–\s*/u', $range);

        if (empty($parts[0])) {
            return PHP_INT_MAX;
        }

        try {
            return Carbon::parse($parts[0])->timestamp;
        } catch (\Exception $e) {
            return PHP_INT_MAX;
        }
    }

    /**
     * Resolve the class schedule for this enrollment.
     */
    private function resolveClasses(): Collection
    {
        // Ensure related models are loaded
        $this->loadMissing(['assignedSection.strand', 'assignedStrand', 'creditedSubjects', 'studentPersonalInfo']);
        $section = $this->assignedSection;

        if (!$section || !$section->id) {
            return collect();
        }

        // First, try to get classes from ClassDetails (for enrolled students)
        // This is the most reliable source as it links specific classes to students
        $classDetails = $this->classDetails()
            ->with([
                'class' => function ($query) {
                    $query->with(['subject', 'section', 'faculty'])
                        ->where('is_active', true);
                }
            ])
            ->get();

        $classesFromDetails = $classDetails
            ->map(fn (ClassDetail $detail) => $detail->class)
            ->filter(fn ($class) => $class !== null);

        $classes = collect();

        if ($this->status === self::STATUS_ENROLLED) {
            // For enrolled students: merge ClassDetails with section classes to ensure new schedules appear
            $sectionClasses = ClassModel::with(['subject', 'section', 'faculty'])
                ->where('Section_id', $section->id)
                ->where('is_active', true);

            if ($this->school_year_id) {
                $sectionClasses->where('school_year_id', $this->school_year_id);
            }

            if ($this->semester_id) {
                $sectionClasses->where('Semester_id', $this->semester_id);
            }

            $sectionClasses = $sectionClasses->get();

            $classDetailIds = $classesFromDetails->pluck('Id')->all();
            $newClasses = $sectionClasses->reject(function ($class) use ($classDetailIds) {
                return in_array($class->Id, $classDetailIds);
            });

            $classes = $classesFromDetails->merge($newClasses);
        } elseif ($classesFromDetails->isNotEmpty()) {
            // For non-enrolled students, rely on ClassDetails if already available
            $classes = $classesFromDetails->values();
        } else {
            // If no ClassDetails found yet, get all classes for the assigned section directly
            $baseQuery = ClassModel::with(['subject', 'section', 'faculty'])
                ->where('Section_id', $section->id)
                ->where('is_active', true);

            // Strategy 1: Try exact match with school year and semester
            if ($this->school_year_id && $this->semester_id) {
                $classes = (clone $baseQuery)
                    ->where('school_year_id', $this->school_year_id)
                    ->where('Semester_id', $this->semester_id)
                    ->get();
            }

            // Strategy 2: Try with just school year
            if ($classes->isEmpty() && $this->school_year_id) {
                $classes = (clone $baseQuery)
                    ->where('school_year_id', $this->school_year_id)
                    ->get();
            }

            // Strategy 3: Try with just semester
            if ($classes->isEmpty() && $this->semester_id) {
                $classes = (clone $baseQuery)
                    ->where('Semester_id', $this->semester_id)
                    ->get();
            }

            // Strategy 4: Get all active classes for this section
            if ($classes->isEmpty()) {
                $classes = $baseQuery->get();
            }

            // Strategy 5: If still empty, try loading classes from section relationship directly
            if ($classes->isEmpty()) {
                $section->load(['classes' => function ($query) {
                    $query->with(['subject', 'section', 'faculty'])
                        ->where('is_active', true);
                }]);
                $classes = $section->classes ?? collect();
            }
        }

        // Determine current strand for filtering (section strand takes precedence)
        $currentStrandId = $section?->strand_id ?? $this->assigned_strand_id;

        // Exclude classes whose subjects have been credited (approved) for this enrollment
        $enrollmentCreditedSubjectIds = $this->creditedSubjects
            ->whereNotNull('approved_by')
            ->pluck('subject_id')
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();

        $studentCreditedSubjectIds = [];
        if ($this->student_personal_info_id) {
            $studentCreditedSubjectIds = CreditedSubject::where('student_personal_info_id', $this->student_personal_info_id)
                ->whereNotNull('approved_by')
                ->pluck('subject_id')
                ->filter()
                ->map(fn ($id) => (int) $id)
                ->unique()
                ->values()
                ->all();
        }

        $creditedSubjectIds = array_unique(array_merge($enrollmentCreditedSubjectIds, $studentCreditedSubjectIds));

        if (!empty($creditedSubjectIds) || $currentStrandId) {
            $classes = $classes->reject(function ($class) use ($creditedSubjectIds, $currentStrandId) {
                $subject = $class?->subject;
                $subjectId = $subject?->Id;

                // 1) Skip classes whose subject has already been credited
                if ($subjectId && in_array($subjectId, $creditedSubjectIds, true)) {
                    return true;
                }

                // 2) If we know the student's current strand, hide subjects explicitly tied to a different strand.
                // Core/general subjects are expected to have null strand_id and are always allowed.
                if ($currentStrandId && $subject && $subject->strand_id !== null && (int) $subject->strand_id !== (int) $currentStrandId) {
                    return true;
                }

                return false;
            });
        }

        return $classes->values();
    }

    /**
     * Check if this enrollment is eligible for re-enrollment.
     */
    public function canBeReEnrolled(): bool
    {
        return $this->status === self::STATUS_ENROLLED;
    }

    /**
     * Get the next term information for re-enrollment.
     * Returns: ['type' => 'next_semester|next_grade', 'school_year_id' => ..., 'semester_id' => ..., 'suggested_grade_level' => ...]
     */
    public function getNextTermInfo(): ?array
    {
        if (!$this->semester) {
            return null;
        }

        $currentSemester = $this->semester->semester_type;
        $currentGradeLevel = $this->assignedSection?->year_level;
        $currentSchoolYear = $this->schoolYear;

        // If current semester is "1st Semester", next term is "2nd Semester" in the same school year
        if ($currentSemester === '1st Semester') {
            $nextSemester = Semester::where('school_year_id', $this->school_year_id)
                ->where('semester_type', '2nd Semester')
                ->first();

            if ($nextSemester) {
                return [
                    'type' => 'next_semester',
                    'school_year_id' => $this->school_year_id,
                    'semester_id' => $nextSemester->id,
                    'suggested_grade_level' => $currentGradeLevel,
                    'description' => "Re-enroll to Grade {$currentGradeLevel} – 2nd Semester ({$currentSchoolYear?->formatted})",
                ];
            }
        }

        // If current semester is "2nd Semester" or no next semester found, next term is next grade in next school year's 1st semester
        if ($currentGradeLevel) {
            $nextGradeLevel = $currentGradeLevel + 1;
            
            // Find the next active school year
            $nextSchoolYear = SchoolYear::where('School_year_start', '>', $currentSchoolYear->School_year_start ?? 0)
                ->orderBy('School_year_start')
                ->first();

            if ($nextSchoolYear) {
                $firstSemester = Semester::where('school_year_id', $nextSchoolYear->id)
                    ->where('semester_type', '1st Semester')
                    ->first();

                if ($firstSemester && $nextGradeLevel <= 12) {
                    return [
                        'type' => 'next_grade',
                        'school_year_id' => $nextSchoolYear->id,
                        'semester_id' => $firstSemester->id,
                        'suggested_grade_level' => $nextGradeLevel,
                        'description' => "Promote to Grade {$nextGradeLevel} – 1st Semester ({$nextSchoolYear->formatted})",
                    ];
                }
            }
        }

        return null;
    }

    /**
     * Lock enrollment to prevent modifications (removed snapshot logic for normalization)
     * Historical data is preserved through soft deletes on related tables
     */
    public function freezeCOR(): void
    {
        // Simply lock the enrollment when it becomes enrolled
        // No need for snapshots as relationships preserve all data
        if ($this->status === self::STATUS_ENROLLED && !$this->is_locked) {
            $this->lockEnrollment();
        }
    }

    /**
     * Lock enrollment to prevent modifications
     */
    public function lockEnrollment(): void
    {
        if (!$this->is_locked && $this->status === self::STATUS_ENROLLED) {
            $this->is_locked = true;
            $this->locked_at = now();
            $this->save();
        }
    }

    /**
     * Get COR data (dynamically generated from relationships)
     * Historical data is preserved through soft deletes on related tables
     */
    public function getCORData(): array
    {
        return $this->toCorArray();
    }

    /**
     * Check if enrollment is immutable
     */
    public function isImmutable(): bool
    {
        return $this->is_locked || 
               ($this->status === self::STATUS_ENROLLED);
    }
}
