<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CreditedSubject extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_personal_info_id',
        'enrollment_id',
        'subject_id',
        'previous_school',
        'quarter1',
        'quarter2',
        'credited_grade',
        'remarks',
        'credited_by',
        'approved_by',
        'credited_at',
    ];

    protected $casts = [
        'quarter1' => 'decimal:2',
        'quarter2' => 'decimal:2',
        'credited_grade' => 'decimal:2',
        'credited_at' => 'datetime',
    ];

    /**
     * Get the student personal info that owns the credited subject.
     */
    public function studentPersonalInfo(): BelongsTo
    {
        return $this->belongsTo(StudentPersonalInfo::class);
    }

    /**
     * Get the enrollment that owns the credited subject.
     */
    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class);
    }

    /**
     * Get the subject that was credited.
     */
    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class, 'subject_id', 'Id');
    }

    /**
     * Get the user who credited the subject (coordinator or registrar).
     */
    public function creditedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'credited_by');
    }

    /**
     * Get the user who approved the credited subject (registrar).
     */
    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Check if the credited grade is passing.
     */
    public function isPassing(): bool
    {
        return $this->credited_grade >= 75;
    }
}

