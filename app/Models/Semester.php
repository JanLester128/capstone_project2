<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Semester extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'semester';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'school_year_id',
        'semester_type',
        'start_date',
        'end_date',
        'is_active',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }

    /**
     * Get the school year that this semester belongs to.
     */
    public function schoolYear(): BelongsTo
    {
        return $this->belongsTo(SchoolYear::class, 'school_year_id');
    }

    /**
     * Get the subjects for this semester.
     */
    public function subjects(): HasMany
    {
        return $this->hasMany(Subject::class, 'semester_id');
    }

    /**
     * Get the sections for this semester.
     */
    public function sections(): HasMany
    {
        return $this->hasMany(Section::class, 'semester_id');
    }

    /**
     * Get the classes for this semester.
     */
    public function classes(): HasMany
    {
        return $this->hasMany(ClassModel::class, 'Semester_id');
    }

    /**
     * Get the strands that are active for this semester.
     */
    public function strands(): BelongsToMany
    {
        return $this->belongsToMany(Strand::class, 'strand_semester')
            ->withPivot('is_active')
            ->withTimestamps();
    }

    /**
     * Accessor for SemesterName to maintain compatibility with frontend.
     */
    public function getSemesterNameAttribute()
    {
        return $this->semester_type;
    }
}

