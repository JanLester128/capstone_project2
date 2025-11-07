<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Section extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'section_name',
        'SectionName',
        'year_level',
        'strand_id',
        'adviser_id',
        'max_capacity',
        'school_year_id',
        'semester_id',
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
            'year_level' => 'integer',
            'max_capacity' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get the strand that this section belongs to.
     */
    public function strand(): BelongsTo
    {
        return $this->belongsTo(Strand::class, 'strand_id');
    }

    /**
     * Get the adviser (user) for this section.
     */
    public function adviser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'adviser_id');
    }

    /**
     * Get the school year that this section belongs to.
     */
    public function schoolYear(): BelongsTo
    {
        return $this->belongsTo(SchoolYear::class, 'school_year_id');
    }

    /**
     * Get the semester that this section belongs to.
     */
    public function semester(): BelongsTo
    {
        return $this->belongsTo(Semester::class, 'semester_id');
    }

    /**
     * Get the classes for this section.
     */
    public function classes(): HasMany
    {
        return $this->hasMany(ClassModel::class, 'Section_id');
    }

    /**
     * Accessor for SectionName to maintain compatibility with frontend.
     * Safely handles both possible column names.
     */
    public function getSectionNameAttribute()
    {
        // Check if we're trying to access SectionName (avoid recursion)
        if (array_key_exists('SectionName', $this->attributes)) {
            return $this->attributes['SectionName'];
        }
        
        // Check if section_name exists
        if (array_key_exists('section_name', $this->attributes)) {
            return $this->attributes['section_name'];
        }
        
        // Return null if neither exists
        return null;
    }
}

