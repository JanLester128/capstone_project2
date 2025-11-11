<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Enrollment extends Model
{
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
    ];

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
            'pending' => 'yellow',
            'approved' => 'green',
            'rejected' => 'red',
            'enrolled' => 'blue',
            default => 'gray'
        };
    }

    /**
     * Get the status display text.
     */
    public function getStatusTextAttribute(): string
    {
        return match($this->status) {
            'pending' => 'Pending Review',
            'approved' => 'Approved',
            'rejected' => 'Rejected',
            'enrolled' => 'Enrolled',
            default => 'Unknown'
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
        return $query->where('status', 'pending');
    }

    /**
     * Scope to get approved enrollments.
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }
}
