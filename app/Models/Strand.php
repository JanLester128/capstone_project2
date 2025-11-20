<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Strand extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'Strand_code',
        'Strand_name',
        'Is_active',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'Is_active' => 'boolean',
        ];
    }

    /**
     * Get the users assigned to this strand.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'assigned_strand_id');
    }

    /**
     * Get the sections for this strand.
     */
    public function sections(): HasMany
    {
        return $this->hasMany(Section::class, 'strand_id');
    }

    /**
     * Get the subjects for this strand.
     */
    public function subjects(): HasMany
    {
        return $this->hasMany(Subject::class, 'strand_id');
    }

    /**
     * Get the school years where this strand is active.
     */
    public function schoolYears(): BelongsToMany
    {
        return $this->belongsToMany(SchoolYear::class, 'strand_school_year')
            ->withPivot('is_active')
            ->withTimestamps();
    }

    /**
     * Get the semesters where this strand is active.
     */
    public function semesters(): BelongsToMany
    {
        return $this->belongsToMany(Semester::class, 'strand_semester')
            ->withPivot('is_active')
            ->withTimestamps();
    }
}

