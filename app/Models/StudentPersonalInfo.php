<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class StudentPersonalInfo extends Model
{
    use HasFactory;

    protected $table = 'student_personal_info';

    protected $fillable = [
        'lrn',
        'user_id',
        'school_year',
        'grade_level',
        'is_graded',
        'last_name',
        'first_name',
        'middle_name',
        'extension_name',
        'birthdate',
        'age',
        'sex',
        'place_of_birth',
        'religion',
        'current_sitio_street',
        'current_barangay',
        'current_municipality_city',
        'current_province',
        'current_zip_code',
        'current_country',
        'guardian_name',
        'guardian_contact_number',
        'guardian_address',
        'guardian_relationship',
        'last_grade_level_completed',
        'last_school_year_completed',
        'last_school_attended',
        'school_year_last_attended',
        'last_school_address',
        'last_school_type',
        'grade_level_completed',
        'semester',
        'psa_birth_certificate_photo',
        'report_card_photo',
        'is_verified',
        'verified_at',
        'verified_by',
        'student_status',
        'failed_subjects_count',
        'requires_strand_change',
        'recommended_strand_id',
        'academic_standing_notes',
    ];

    protected $casts = [
        'birthdate' => 'date',
        'is_graded' => 'boolean',
        'same_as_current_address' => 'boolean',
        'is_verified' => 'boolean',
        'verified_at' => 'datetime',
        'requires_strand_change' => 'boolean',
        // Removed array casts for medical_diagnosis, manifestations, learning_modalities
        // These are now VARCHAR fields that store comma-separated values
    ];

    protected $appends = [
        'psa_birth_certificate_photo_url',
        'report_card_photo_url',
    ];

    /**
     * Get the user that owns the student personal info.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }


    /**
     * Get the user who verified this student.
     */
    public function verifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    /**
     * Get the student's full name.
     */
    public function getFullNameAttribute(): string
    {
        $name = $this->first_name ?? '';
        if ($this->middle_name && trim($this->middle_name) !== '' && strtoupper(trim($this->middle_name)) !== 'N/A') {
            $name .= ' ' . $this->middle_name;
        }
        $name .= ' ' . ($this->last_name ?? '');
        if ($this->extension_name && trim($this->extension_name) !== '' && strtoupper(trim($this->extension_name)) !== 'N/A') {
            $name .= ' ' . $this->extension_name;
        }
        return trim($name);
    }

    public function getGradeLevelCompletedAttribute($value): ?string
    {
        if ($value !== null) {
            return $value;
        }

        return $this->attributes['last_grade_level_completed'] ?? null;
    }

    public function setGradeLevelCompletedAttribute($value): void
    {
        $this->attributes['grade_level_completed'] = $value;
        $this->attributes['last_grade_level_completed'] = $value;
    }

    public function getSchoolYearLastAttendedAttribute($value): ?string
    {
        if ($value !== null) {
            return $value;
        }

        return $this->attributes['last_school_year_completed'] ?? null;
    }

    public function setSchoolYearLastAttendedAttribute($value): void
    {
        $this->attributes['school_year_last_attended'] = $value;
        $this->attributes['last_school_year_completed'] = $value;
    }

    /**
     * Get the student's current address.
     */
    public function getCurrentAddressAttribute(): string
    {
        $address = [];
        if ($this->current_sitio_street) $address[] = $this->current_sitio_street;
        if ($this->current_barangay) $address[] = $this->current_barangay;
        if ($this->current_municipality_city) $address[] = $this->current_municipality_city;
        if ($this->current_province) $address[] = $this->current_province;
        if ($this->current_zip_code) $address[] = $this->current_zip_code;
        
        return implode(', ', $address);
    }

    /**
     * Get the student's permanent address.
     */
    public function getPermanentAddressAttribute(): string
    {
        if ($this->same_as_current_address) {
            return $this->getCurrentAddressAttribute();
        }

        $address = [];
        if ($this->permanent_house_no) $address[] = $this->permanent_house_no;
        if ($this->permanent_sitio_street) $address[] = $this->permanent_sitio_street;
        if ($this->permanent_barangay) $address[] = $this->permanent_barangay;
        if ($this->permanent_municipality_city) $address[] = $this->permanent_municipality_city;
        if ($this->permanent_province) $address[] = $this->permanent_province;
        if ($this->permanent_zip_code) $address[] = $this->permanent_zip_code;
        
        return implode(', ', $address);
    }

    /**
     * Scope for verified students.
     */
    public function scopeVerified($query)
    {
        return $query->where('is_verified', true);
    }

    /**
     * Scope for unverified students.
     */
    public function scopeUnverified($query)
    {
        return $query->where('is_verified', false);
    }

    /**
     * Get the strand preferences for this student.
     */
    public function strandPreferences()
    {
        return $this->hasMany(StudentStrandPreference::class)->ordered();
    }

    /**
     * Get the enrollments for this student.
     */
    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }

    /**
     * Get the grades for this student.
     */
    public function grades()
    {
        return $this->hasMany(Grade::class, 'student_personal_info_id');
    }

    /**
     * Get semester performances for this student.
     */

    /**
     * Get failed prerequisites for this student.
     */

    /**
     * Get the recommended strand if student requires strand change.
     */
    public function recommendedStrand()
    {
        return $this->belongsTo(Strand::class, 'recommended_strand_id');
    }

    /**
     * Check if student is on academic probation
     */
    public function isOnProbation(): bool
    {
        return $this->failed_subjects_count > 2 || $this->requires_strand_change;
    }

    /**
     * Check if student needs summer classes
     */
    public function needsSummerClasses(): bool
    {
        return $this->grades()->where('needs_summer_class', true)->exists();
    }

    /**
     * Get current semester performance
     */
    public function getCurrentSemesterPerformance(): ?array
    {
        // Calculate performance dynamically from grades instead of querying table
        // This method is kept for backward compatibility but now returns array
        // Callers should use GradeCalculationService instead
        return null;
    }

    /**
     * Generate a URL for a stored document if it exists.
     */
    private function buildDocumentRoute(?string $path, string $type): ?string
    {
        if (!$path) {
            return null;
        }

        if (!Storage::disk('public')->exists($path)) {
            return null;
        }

        return route('documents.student', [
            'studentPersonalInfo' => $this->id,
            'type' => $type,
        ]);
    }

    /**
     * Accessor for PSA birth certificate photo URL.
     */
    public function getPsaBirthCertificatePhotoUrlAttribute(): ?string
    {
        return $this->buildDocumentRoute($this->psa_birth_certificate_photo, 'psa');
    }

    /**
     * Accessor for report card photo URL.
     */
    public function getReportCardPhotoUrlAttribute(): ?string
    {
        return $this->buildDocumentRoute($this->report_card_photo, 'report-card');
    }

    /**
     * Get the latest enrollment for this student.
     */
    public function latestEnrollment()
    {
        return $this->hasOne(Enrollment::class)->latest('submitted_at');
    }
}
