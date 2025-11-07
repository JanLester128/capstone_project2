<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class SchoolYear extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'school_year';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'School_year_start',
        'School_year_end',
        'is_active',
        'enabled',
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
            'enabled' => 'boolean',
        ];
    }

    /**
     * Get the sections for this school year.
     */
    public function sections(): HasMany
    {
        return $this->hasMany(Section::class, 'school_year_id');
    }

    /**
     * Get the classes for this school year.
     */
    public function classes(): HasMany
    {
        return $this->hasMany(ClassModel::class, 'school_year_id');
    }

    /**
     * Get the semesters for this school year.
     */
    public function semesters(): HasMany
    {
        return $this->hasMany(Semester::class, 'school_year_id');
    }

    /**
     * Get the subjects for this school year.
     */
    public function subjects(): HasMany
    {
        return $this->hasMany(Subject::class, 'school_year_id');
    }

    /**
     * Get the strands that are active for this school year.
     */
    public function strands(): BelongsToMany
    {
        return $this->belongsToMany(Strand::class, 'strand_school_year')
            ->withPivot('is_active')
            ->withTimestamps();
    }

    /**
     * Get the formatted school year string.
     */
    public function getFormattedAttribute(): string
    {
        return $this->School_year_start . '-' . $this->School_year_end;
    }
}

