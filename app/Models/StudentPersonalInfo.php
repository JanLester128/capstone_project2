<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
        'is_sned',
        'psa_birth_certificate_no',
        'last_name',
        'first_name',
        'middle_name',
        'extension_name',
        'birthdate',
        'age',
        'sex',
        'place_of_birth',
        'religion',
        'mother_tongue',
        'is_4ps_beneficiary',
        '4ps_household_id',
        'current_house_no',
        'current_sitio_street',
        'current_barangay',
        'current_municipality_city',
        'current_province',
        'current_country',
        'father_last_name',
        'father_first_name',
        'father_middle_name',
        'father_contact_number',
        'mother_last_name',
        'mother_first_name',
        'mother_middle_name',
        'mother_contact_number',
        'guardian_last_name',
        'guardian_first_name',
        'guardian_middle_name',
        'guardian_contact_number',
        'is_sned_program',
        'medical_diagnosis',
        'manifestations',
        'has_pwd_id',
        'last_grade_level_completed',
        'last_school_year_completed',
        'last_school_attended',
        'last_school_id',
        'semester',
        'learning_modalities',
        'profile_photo',
        'psa_birth_certificate_photo',
        'report_card_photo',
        'is_verified',
        'verified_at',
        'verified_by',
    ];

    protected $casts = [
        'birthdate' => 'date',
        'is_graded' => 'boolean',
        'is_sned' => 'boolean',
        'is_4ps_beneficiary' => 'boolean',
        'same_as_current_address' => 'boolean',
        'is_sned_program' => 'boolean',
        'has_pwd_id' => 'boolean',
        'is_verified' => 'boolean',
        'verified_at' => 'datetime',
        // Removed array casts for medical_diagnosis, manifestations, learning_modalities
        // These are now VARCHAR fields that store comma-separated values
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
        $name = $this->first_name;
        if ($this->middle_name) {
            $name .= ' ' . $this->middle_name;
        }
        $name .= ' ' . $this->last_name;
        if ($this->extension_name) {
            $name .= ' ' . $this->extension_name;
        }
        return $name;
    }

    /**
     * Get the student's current address.
     */
    public function getCurrentAddressAttribute(): string
    {
        $address = [];
        if ($this->current_house_no) $address[] = $this->current_house_no;
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
     * Get the latest enrollment for this student.
     */
    public function latestEnrollment()
    {
        return $this->hasOne(Enrollment::class)->latest('submitted_at');
    }
}
