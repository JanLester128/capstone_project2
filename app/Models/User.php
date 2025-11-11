<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'FirstName',
        'MiddleName',
        'LastName',
        'email',
        'password',
        'must_change_password',
        'is_coordinator',
        'is_disabled',
        'Role',
        'assigned_strand_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'must_change_password' => 'boolean',
            'is_coordinator' => 'boolean',
            'is_disabled' => 'boolean',
            'password' => 'hashed',
        ];
    }

    /**
     * Get the assigned strand for the user.
     */
    public function assignedStrand(): BelongsTo
    {
        return $this->belongsTo(Strand::class, 'assigned_strand_id');
    }

    /**
     * Get the sections where this user is an adviser.
     */
    public function advisedSections(): HasMany
    {
        return $this->hasMany(Section::class, 'adviser_id');
    }

    /**
     * Get the classes where this user is a faculty member.
     */
    public function classes(): HasMany
    {
        return $this->hasMany(ClassModel::class, 'faculty_id');
    }

    /**
     * Get the student personal information.
     */
    public function studentPersonalInfo()
    {
        return $this->hasOne(StudentPersonalInfo::class);
    }

    /**
     * Get the full name of the user.
     */
    public function getFullNameAttribute(): string
    {
        $middleName = $this->MiddleName ? ' ' . $this->MiddleName . ' ' : ' ';
        return $this->FirstName . $middleName . $this->LastName;
    }
}
