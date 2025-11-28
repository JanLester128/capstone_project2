<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Grade extends Model
{
    use HasFactory;

    public const STATUS_DRAFT = 'Draft';
    public const STATUS_PENDING = 'Pending';
    public const STATUS_APPROVED = 'Approved';
    public const STATUS_REJECTED = 'Rejected';

    protected $fillable = [
        'student_personal_info_id',
        'subject_id',
        'faculty_id',
        'school_year_id',
        'class_id',
        'semester',
        'original_failed_grade',
        'summer_grade',
        'first_quarter',
        'second_quarter',
        'third_quarter',
        'fourth_quarter',
        'semester_grade',
        'remarks',
        'status',
        'submitted_for_approval_at',
        'submitted_by',
        'approved_by',
        'approved_at',
        'approval_notes',
        'needs_summer_class',
        'is_prerequisite_failed',
        'failed_prerequisites',
        'semester_average',
        'auto_calculated',
        'notes',
        'is_credited',
        'credited_subject_id',
        // Snapshot fields for data integrity
        'subject_name_snapshot',
        'subject_code_snapshot',
        'class_section_snapshot',
        'faculty_name_snapshot',
        'semester_label',
        'school_year_label',
        'is_locked',
        'locked_at',
        'locked_by',
    ];

    protected $casts = [
        'original_failed_grade' => 'decimal:2',
        'summer_grade' => 'decimal:2',
        'first_quarter' => 'decimal:2',
        'second_quarter' => 'decimal:2',
        'third_quarter' => 'decimal:2',
        'fourth_quarter' => 'decimal:2',
        'semester_grade' => 'decimal:2',
        'semester_average' => 'decimal:2',
        'submitted_for_approval_at' => 'datetime',
        'approved_at' => 'datetime',
        'locked_at' => 'datetime',
        'needs_summer_class' => 'boolean',
        'is_prerequisite_failed' => 'boolean',
        'auto_calculated' => 'boolean',
        'is_locked' => 'boolean',
        'is_credited' => 'boolean',
    ];

    /**
     * Get the available statuses.
     */
    public static function statusOptions(): array
    {
        return [
            self::STATUS_DRAFT,
            self::STATUS_PENDING,
            self::STATUS_APPROVED,
            self::STATUS_REJECTED,
        ];
    }

    /**
     * Student (personal info) relationship.
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(StudentPersonalInfo::class, 'student_personal_info_id');
    }

    /**
     * Subject relationship.
     */
    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class, 'subject_id', 'Id');
    }

    /**
     * Faculty relationship.
     */
    public function faculty(): BelongsTo
    {
        return $this->belongsTo(User::class, 'faculty_id');
    }

    /**
     * School year relationship.
     */
    public function schoolYear(): BelongsTo
    {
        return $this->belongsTo(SchoolYear::class, 'school_year_id');
    }

    /**
     * Class relationship.
     */
    public function classModel(): BelongsTo
    {
        return $this->belongsTo(ClassModel::class, 'class_id', 'Id');
    }

    public function submittedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function approvedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Check if grade is passing
     */
    public function isPassing(): bool
    {
        return $this->semester_grade >= 75 && $this->remarks === 'Passed';
    }

    /**
     * Check if grade is failing
     */
    public function isFailing(): bool
    {
        return $this->semester_grade < 75 || $this->remarks === 'Failed';
    }

    /**
     * Get grade status color
     */
    public function getStatusColorAttribute(): string
    {
        return match($this->remarks) {
            'Passed' => 'green',
            'Failed' => 'red',
            'Incomplete' => 'yellow',
            'Conditional' => 'blue',
            default => 'gray'
        };
    }

    /**
     * Calculate semester grade from quarters
     */
    public function calculateSemesterGrade(): float
    {
        $quarters = array_filter([
            $this->first_quarter,
            $this->second_quarter,
            $this->third_quarter,
            $this->fourth_quarter,
        ]);

        if (empty($quarters)) {
            return 0;
        }

        return round(array_sum($quarters) / count($quarters), 2);
    }

    /**
     * Lock this grade to prevent further modifications
     */
    public function lock(?int $userId = null): void
    {
        if (!$this->is_locked) {
            $this->is_locked = true;
            $this->locked_at = now();
            $this->locked_by = $userId ?? auth()->id();
            $this->save();
        }
    }

    /**
     * Unlock this grade so authorized staff can make adjustments
     */
    public function unlock(): void
    {
        if ($this->is_locked) {
            $this->is_locked = false;
            $this->locked_at = null;
            $this->locked_by = null;
            $this->save();
        }
    }

    /**
     * Check if grade is immutable (locked or approved)
     */
    public function isImmutable(): bool
    {
        return $this->is_locked || 
               ($this->status === self::STATUS_APPROVED && $this->approved_at !== null);
    }

    /**
     * Store snapshot of current subject/class data
     */
    public function captureSnapshot(): void
    {
        if (!$this->subject_name_snapshot) {
            $this->subject_name_snapshot = $this->subject?->Subject_name;
            $this->subject_code_snapshot = $this->subject?->Subject_code;
        }

        if (!$this->class_section_snapshot && $this->classModel) {
            $this->class_section_snapshot = $this->classModel->section?->section_name;
        }

        if (!$this->faculty_name_snapshot && $this->faculty) {
            $this->faculty_name_snapshot = trim(
                ($this->faculty->FirstName ?? '') . ' ' . ($this->faculty->LastName ?? '')
            );
        }

        if (!$this->semester_label) {
            $this->semester_label = $this->semester . ' Semester';
        }

        if (!$this->school_year_label && $this->schoolYear) {
            $this->school_year_label = $this->schoolYear->formatted;
        }

        $this->save();
    }

    /**
     * Get subject name (prefers snapshot for historical accuracy)
     */
    public function getSubjectNameAttribute(): ?string
    {
        return $this->subject_name_snapshot ?? $this->subject?->Subject_name;
    }

    /**
     * Get subject code (prefers snapshot for historical accuracy)
     */
    public function getSubjectCodeAttribute(): ?string
    {
        return $this->subject_code_snapshot ?? $this->subject?->Subject_code;
    }

    /**
     * Relationship to locked by user
     */
    public function lockedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'locked_by');
    }

    public function creditedSubject(): BelongsTo
    {
        return $this->belongsTo(CreditedSubject::class, 'credited_subject_id');
    }
}


