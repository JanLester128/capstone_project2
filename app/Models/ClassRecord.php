<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClassRecord extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'class_records';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'class_detail_id',
        'subject_name',
        'subject_code',
        'faculty_name',
        'section_name',
        'day_of_week',
        'start_time',
        'end_time',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'start_time' => 'datetime:H:i',
            'end_time' => 'datetime:H:i',
        ];
    }

    /**
     * Get the class detail that this record belongs to.
     */
    public function classDetail(): BelongsTo
    {
        return $this->belongsTo(ClassDetail::class, 'class_detail_id');
    }

    /**
     * Get the enrollment through class detail.
     */
    public function enrollment()
    {
        return $this->hasOneThrough(
            Enrollment::class,
            ClassDetail::class,
            'id', // Foreign key on class_details table
            'id', // Foreign key on enrollments table
            'class_detail_id', // Local key on class_records table
            'enrollment_id' // Local key on class_details table
        );
    }

    /**
     * Get the class through class detail.
     */
    public function class()
    {
        return $this->hasOneThrough(
            ClassModel::class,
            ClassDetail::class,
            'id', // Foreign key on class_details table
            'Id', // Foreign key on class table
            'class_detail_id', // Local key on class_records table
            'class_id' // Local key on class_details table
        );
    }
}
