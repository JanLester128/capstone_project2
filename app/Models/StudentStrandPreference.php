<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentStrandPreference extends Model
{
    protected $fillable = [
        'student_personal_info_id',
        'strand_id',
        'preference_order',
    ];

    protected $casts = [
        'preference_order' => 'integer',
    ];

    /**
     * Get the student personal info that owns this preference.
     */
    public function studentPersonalInfo(): BelongsTo
    {
        return $this->belongsTo(StudentPersonalInfo::class);
    }

    /**
     * Get the strand for this preference.
     */
    public function strand(): BelongsTo
    {
        return $this->belongsTo(Strand::class);
    }

    /**
     * Scope to get preferences ordered by preference order.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('preference_order');
    }

    /**
     * Get preference order as text.
     */
    public function getPreferenceTextAttribute(): string
    {
        return match($this->preference_order) {
            1 => 'First Choice',
            2 => 'Second Choice',
            3 => 'Third Choice',
            default => 'Choice ' . $this->preference_order,
        };
    }
}
