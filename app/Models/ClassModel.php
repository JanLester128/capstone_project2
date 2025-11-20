<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ClassModel extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'class';

    /**
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'Id';

    /**
     * Get the route key for the model.
     *
     * @return string
     */
    public function getRouteKeyName()
    {
        return 'Id';
    }

    /**
     * Get the value of the model's route key.
     *
     * @return mixed
     */
    public function getRouteKey()
    {
        return $this->getAttribute($this->getRouteKeyName());
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'Section_id',
        'faculty_id',
        'school_year_id',
        'Semester_id',
        'subject_id',
        'day_of_week',
        'start_time',
        'endtime',
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
            'start_time' => 'datetime:H:i',
            'endtime' => 'datetime:H:i',
        ];
    }

    /**
     * Get the section that this class belongs to.
     */
    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class, 'Section_id', 'id');
    }

    /**
     * Get the faculty member (user) teaching this class.
     */
    public function faculty(): BelongsTo
    {
        return $this->belongsTo(User::class, 'faculty_id');
    }

    /**
     * Get the school year that this class belongs to.
     */
    public function schoolYear(): BelongsTo
    {
        return $this->belongsTo(SchoolYear::class, 'school_year_id');
    }

    /**
     * Get the semester that this class belongs to.
     */
    public function semester(): BelongsTo
    {
        return $this->belongsTo(Semester::class, 'Semester_id');
    }

    /**
     * Get the subject that this class teaches.
     */
    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class, 'subject_id', 'Id');
    }

}

