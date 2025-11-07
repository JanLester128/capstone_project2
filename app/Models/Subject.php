<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Subject extends Model
{
    use HasFactory;

    /**
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'Id';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'Subject_name',
        'Subject_code',
        'Semester',
        'semester_id',
        'year_level',
        'strand_id',
        'school_year_id',
        'PREREQUISITES',
        'CO-REQUISITES',
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
        ];
    }

    /**
     * Get the semester that this subject belongs to.
     * Uses semester_id foreign key for proper semester isolation
     */
    public function semester(): BelongsTo
    {
        return $this->belongsTo(Semester::class, 'semester_id');
    }

    /**
     * Get the strand that this subject belongs to.
     */
    public function strand(): BelongsTo
    {
        return $this->belongsTo(Strand::class, 'strand_id');
    }

    /**
     * Get the school year that this subject belongs to.
     */
    public function schoolYear(): BelongsTo
    {
        return $this->belongsTo(SchoolYear::class, 'school_year_id');
    }

    /**
     * Get the prerequisites as an array.
     */
    public function getPrerequisitesArrayAttribute(): array
    {
        if (empty($this->PREREQUISITES)) {
            return [];
        }
        return json_decode($this->PREREQUISITES, true) ?? explode(',', $this->PREREQUISITES);
    }

    /**
     * Get the co-requisites as an array.
     */
    public function getCorequisitesArrayAttribute(): array
    {
        if (empty($this->{'CO-REQUISITES'})) {
            return [];
        }
        return json_decode($this->{'CO-REQUISITES'}, true) ?? explode(',', $this->{'CO-REQUISITES'});
    }
}

