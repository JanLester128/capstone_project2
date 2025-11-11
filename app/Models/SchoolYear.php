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
        'enrollment_open',
        'enrollment_start_date',
        'enrollment_end_date',
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
            'enrollment_open' => 'boolean',
            'enrollment_start_date' => 'date',
            'enrollment_end_date' => 'date',
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

    /**
     * Check if enrollment is currently open.
     */
    public function isEnrollmentOpen(): bool
    {
        if (!$this->enrollment_open) {
            return false;
        }

        $now = now()->toDateString();
        
        // If no dates are set, enrollment is open
        if (!$this->enrollment_start_date && !$this->enrollment_end_date) {
            return true;
        }

        // Check if current date is within enrollment period
        if ($this->enrollment_start_date && $now < $this->enrollment_start_date->toDateString()) {
            return false;
        }

        if ($this->enrollment_end_date && $now > $this->enrollment_end_date->toDateString()) {
            return false;
        }

        return true;
    }

    /**
     * Get enrollment status message.
     */
    public function getEnrollmentStatusAttribute(): string
    {
        if (!$this->enrollment_open) {
            return 'Enrollment is closed';
        }

        if (!$this->isEnrollmentOpen()) {
            $now = now()->toDateString();
            
            if ($this->enrollment_start_date && $now < $this->enrollment_start_date->toDateString()) {
                return 'Enrollment opens on ' . $this->enrollment_start_date->format('M d, Y');
            }
            
            if ($this->enrollment_end_date && $now > $this->enrollment_end_date->toDateString()) {
                return 'Enrollment closed on ' . $this->enrollment_end_date->format('M d, Y');
            }
        }

        return 'Enrollment is open';
    }

    /**
     * Get the enrollments for this school year.
     */
    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }

    /**
     * Get pending enrollments for this school year.
     */
    public function pendingEnrollments()
    {
        return $this->hasMany(Enrollment::class)->where('status', 'pending');
    }
}

