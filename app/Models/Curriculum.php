<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Curriculum extends Model
{
    use HasFactory;

    protected $table = 'curriculums';

    protected $fillable = [
        'curriculum_code',
        'name',
        'track',
        'strand_id',
        'effective_sy',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function strand(): BelongsTo
    {
        return $this->belongsTo(Strand::class, 'strand_id');
    }

    public function subjects(): HasMany
    {
        return $this->hasMany(Subject::class);
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    public function creditedSubjects(): HasMany
    {
        return $this->hasMany(CreditedSubject::class);
    }
}
