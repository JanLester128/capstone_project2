# Database Schema Documentation
## Complete Table Structure and Explanations

---

## Core System Tables

### 1. **users** (0001_01_01_000000_create_users_table.php)
**Purpose:** Central authentication and user management table

**Fields:**
- `id` - Primary key
- `FirstName` - User's first name
- `MiddleName` - User's middle name (optional)
- `LastName` - User's last name
- `email` - Unique email for login
- `password` - Encrypted password
- `Role` - User role (Student, Faculty, Registrar)
- `assigned_strand_id` - FK to strands (for faculty assignment)
- `is_coordinator` - Boolean flag for coordinator privileges
- `is_disabled` - Boolean to disable account access
- `must_change_password` - Forces password change on next login
- `profile_photo` - Path to profile photo
- `remember_token` - For "remember me" functionality
- `timestamps` - created_at, updated_at

**Relationships:**
- Has one `student_personal_info`
- Has many `enrollments` (as enrolled_by)
- Has many `grades` (as approved_by)
- Belongs to `strand` (assigned_strand_id)

**Usage:** All system users authenticate through this table. Role determines access level and features.

---

### 2. **cache** (0001_01_01_000001_create_cache_table.php)
**Purpose:** Laravel's cache storage for performance optimization

**Fields:**
- `key` - Cache key (unique)
- `value` - Cached data
- `expiration` - When cache expires

**Usage:** Stores temporary data to speed up application performance. Managed automatically by Laravel.

---

### 3. **cache_locks** (0001_01_01_000001_create_cache_table.php)
**Purpose:** Prevents race conditions in cached operations

**Fields:**
- `key` - Lock identifier
- `owner` - Process owning the lock
- `expiration` - Lock expiration time

**Usage:** Ensures atomic operations when multiple processes access the same cache.

---

### 4. **jobs** (0001_01_01_000002_create_jobs_table.php)
**Purpose:** Queue system for background job processing

**Tables:**
- `jobs` - Pending jobs
- `job_batches` - Batch job tracking
- `failed_jobs` - Failed job records for debugging

**Usage:** Handles email sending, report generation, and other async tasks.

---

### 5. **sessions** (2025_10_20_032254_create_sessions_table.php)
**Purpose:** Stores user session data

**Fields:**
- `id` - Session identifier
- `user_id` - FK to users (nullable)
- `ip_address` - User's IP
- `user_agent` - Browser information
- `payload` - Session data
- `last_activity` - Timestamp of last activity

**Usage:** Tracks logged-in users and their session state.

---

## Academic Structure Tables

### 6. **strands** (2025_01_01_000001_create_strands_table.php)
**Purpose:** Senior High School academic tracks

**Fields:**
- `id` - Primary key
- `Strand_code` - Short code (STEM, HUMSS, ABM, TVL)
- `Strand_name` - Full strand name
- `Is_active` - Whether strand is currently accepting students
- `timestamps`

**Relationships:**
- Has many `subjects`
- Has many `sections`
- Has many `school_years` (through pivot)
- Has many `semesters` (through pivot)

**Usage:** Defines available academic tracks. Students choose strand preferences during enrollment.

**Common Values:**
- STEM - Science, Technology, Engineering, Mathematics
- HUMSS - Humanities and Social Sciences
- ABM - Accountancy, Business and Management
- TVL - Technical-Vocational-Livelihood

---

### 7. **school_year** (2025_01_01_000002_create_school_year_table.php)
**Purpose:** Academic year periods

**Fields:**
- `id` - Primary key
- `School_year_start` - Starting year (e.g., 2024)
- `School_year_end` - Ending year (e.g., 2025)
- `is_active` - Currently active school year (only one can be active)
- `enrollment_open` - Whether enrollment is accepting submissions
- `enrollment_start_date` - When enrollment opens
- `enrollment_end_date` - When enrollment closes
- `enabled` - Whether year is visible in system
- `timestamps`

**Relationships:**
- Has many `semesters`
- Has many `sections`
- Has many `subjects`
- Has many `classes`
- Has many `enrollments`

**Usage:** Organizes academic calendar. Only one school year can be active at a time.

---

### 8. **semester** (2025_01_01_000003_create_semester_table.php)
**Purpose:** Academic term divisions within a school year

**Fields:**
- `id` - Primary key
- `school_year_id` - FK to school_year
- `semester_type` - "1st Semester", "2nd Semester", or "Summer"
- `start_date` - Semester start date
- `end_date` - Semester end date
- `is_active` - Currently active semester
- `timestamps`

**Relationships:**
- Belongs to `school_year`
- Has many `subjects`
- Has many `sections`
- Has many `classes`
- Has many `enrollments`

**Usage:** Divides school year into terms. Each school year typically has 2 main semesters + summer.

**Important:** Only one semester per school year can be active at a time.

---

### 9. **subjects** (2025_01_01_000004_create_subjects_table.php)
**Purpose:** Course subjects offered per strand and semester

**Fields:**
- `Id` - Primary key
- `Subject_name` - Full subject name
- `Subject_code` - Unique code (e.g., GEN_MATH)
- `Semester` - "1" or "2" (for backward compatibility)
- `year_level` - Grade level (11 or 12)
- `strand_id` - FK to strands
- `school_year_id` - FK to school_year
- `semester_id` - FK to semester
- `PREREQUISITES` - Comma-separated prerequisite subjects
- `CO-REQUISITES` - Comma-separated co-requisite subjects
- `timestamps`

**Relationships:**
- Belongs to `strand`
- Belongs to `school_year`
- Belongs to `semester`
- Has many `classes`

**Usage:** Defines curriculum. Subjects are tied to specific school year and semester.

**Unique Constraint:** (Subject_code, school_year_id, semester_id)

---

### 10. **sections** (2025_01_01_000005_create_sections_table.php)
**Purpose:** Student class groupings

**Fields:**
- `id` - Primary key
- `section_name` - Section name (e.g., "Einstein", "Newton")
- `year_level` - Grade level (11 or 12)
- `strand_id` - FK to strands
- `max_capacity` - Maximum number of students (1-50)
- `school_year_id` - FK to school_year
- `semester_id` - FK to semester
- `adviser_id` - FK to users (faculty)
- `is_active` - Whether section accepts enrollments
- `timestamps`

**Relationships:**
- Belongs to `strand`
- Belongs to `school_year`
- Belongs to `semester`
- Belongs to `adviser` (user)
- Has many `classes`
- Has many `enrollments`

**Usage:** Groups students by strand and grade level. Each section has a faculty adviser.

**Unique Constraint:** (section_name, school_year_id, semester_id)

---

### 11. **class** (2025_01_01_000006_create_class_table.php)
**Purpose:** Subject-section-faculty-schedule assignments (the actual classes)

**Fields:**
- `Id` - Primary key
- `Section_id` - FK to sections
- `faculty_id` - FK to users (teacher)
- `subject_id` - FK to subjects
- `school_year_id` - FK to school_year
- `Semester_id` - FK to semester
- `day_of_week` - Day class meets (Monday-Friday)
- `start_time` - Class start time
- `endtime` - Class end time
- `is_active` - Whether class is currently running
- `timestamps`

**Relationships:**
- Belongs to `section`
- Belongs to `faculty` (user)
- Belongs to `subject`
- Belongs to `school_year`
- Belongs to `semester`
- Has many `class_details` (student enrollments in this class)
- Has many `grades`

**Usage:** Creates the actual class schedule. Links sections, subjects, faculty, and time slots.

**Constraints:**
- Faculty cannot have more than 5 active classes per semester
- No scheduling conflicts for faculty

---

## Student Management Tables

### 12. **student_personal_info** (2025_01_08_000000 + updates)
**Purpose:** Complete student demographic and personal information

**Fields:**
- `id` - Primary key
- `user_id` - FK to users (one-to-one)
- `lrn` - Learner Reference Number (unique, 12 digits)
- `first_name`, `middle_name`, `last_name`, `extension_name`
- `birthdate`, `age`, `sex`, `place_of_birth`
- `religion`
- `student_status` - "new", "continuing", "transferee"
- `grade_level` - Current grade (11 or 12)

**Address Fields:**
- Current address: house_no, sitio_street, barangay, municipality_city, province, country
- Permanent address: (optional, if different)
- `same_as_current_address` - Boolean flag

**Guardian Information:**
- `guardian_name`, `guardian_contact_number`, `guardian_address`, `guardian_relationship`

**Previous School:**
- `last_school_attended`, `school_year_last_attended`, `last_school_address`
- `last_school_type`, `grade_level_completed`, `last_school_id`

**Special Programs:**
- `is_sned_program` - Special Needs Education Program
- `has_pwd_id` - Person with Disability ID

**Documents:**
- `psa_birth_certificate_photo` - Path to PSA birth certificate
- `report_card_photo` - Path to report card
- `profile_photo` - Path to profile photo

**Academic Tracking:**
- `current_semester_average` - Current semester GPA
- `failed_subjects_count` - Number of failed subjects
- `requires_strand_change` - Flag for STEM students with failed prerequisites
- `recommended_strand_id` - Suggested strand if transfer needed

**Verification:**
- `is_verified` - Registrar has verified the account
- `verified_by` - FK to users (registrar)
- `verified_at` - Verification timestamp

**Timestamps:**
- `created_at`, `updated_at`

**Relationships:**
- Belongs to `user` (one-to-one)
- Has many `strand_preferences`
- Has many `enrollments`
- Has many `grades`
- Has many `credited_subjects`

**Usage:** Central repository for all student information required for enrollment and records.

---

### 13. **student_strand_preferences** (2025_11_07_230218)
**Purpose:** Tracks student's strand choices (1st, 2nd, 3rd preference)

**Fields:**
- `id` - Primary key
- `student_personal_info_id` - FK to student_personal_info
- `strand_id` - FK to strands
- `preference_order` - 1 (first choice), 2 (second), 3 (third)
- `preference_text` - Optional text explanation
- `timestamps`

**Relationships:**
- Belongs to `student_personal_info`
- Belongs to `strand`

**Usage:** Coordinators use preferences to assign students to strands during enrollment approval.

---

### 14. **enrollments** (2025_11_08_000002 + updates)
**Purpose:** Student enrollment records per school year/semester

**Fields:**
- `id` - Primary key
- `student_personal_info_id` - FK to student_personal_info
- `school_year_id` - FK to school_year
- `semester_id` - FK to semester
- `status` - Enrollment status (see below)
- `submitted_at` - When student submitted form
- `processed_at` - When registrar processed

**Assignment Fields:**
- `assigned_strand_id` - FK to strands (final assignment)
- `assigned_section_id` - FK to sections (final assignment)

**Approval Tracking:**
- `enrolled_by` - FK to users (who enrolled the student)
- `approved_by` - FK to users (registrar who approved)
- `approved_at` - Approval timestamp
- `confirmed_at` - Confirmation timestamp

**Academic Status:**
- `is_on_probation` - Academic probation flag
- `requires_summer_classes` - Needs summer remedial
- `summer_subjects_needed` - Text field listing subjects

**Transferee Information:**
- `is_transferee` - Boolean flag
- `previous_school` - Name of previous school

**Data Integrity (Snapshots):**
- `cor_data_snapshot` - JSON of Certificate of Registration
- `cor_generated_at` - When COR was generated
- `enrolled_subjects_snapshot` - JSON of enrolled subjects
- `section_name_snapshot` - Section name at time of enrollment
- `strand_name_snapshot` - Strand name at time of enrollment
- `grade_level_snapshot` - Grade level at time of enrollment
- `is_locked` - Prevents modifications
- `locked_at` - Lock timestamp

**Timestamps:**
- `created_at`, `updated_at`

**Relationships:**
- Belongs to `student_personal_info`
- Belongs to `school_year`
- Belongs to `semester`
- Belongs to `assigned_strand`
- Belongs to `assigned_section`
- Belongs to `enrolled_by` (user)
- Belongs to `approved_by` (user)
- Has many `class_details`
- Has many `credited_subjects`

**Status Values:**
- `pre_enrolled` - Student submitted form, awaiting coordinator review
- `recommended` - Coordinator recommended, awaiting registrar approval
- `enrolled` - Fully enrolled, can access classes and COR
- `rejected` - Returned for revisions

**Unique Constraint:** (student_personal_info_id, school_year_id, semester_id) - One enrollment per student per term

**Usage:** Core enrollment workflow. Tracks student progression through enrollment stages.

---

### 15. **class_details** (2025_11_11_142220 + update)
**Purpose:** Junction table linking students to specific classes

**Fields:**
- `id` - Primary key
- `class_id` - FK to class
- `student_id` - FK to users
- `enrollment_id` - FK to enrollments
- `enrolled_by` - FK to users (who enrolled student)
- `is_re_enrolled` - Flag for students moving to next semester/year
- `timestamps`

**Relationships:**
- Belongs to `class`
- Belongs to `student` (user)
- Belongs to `enrollment`
- Belongs to `enrolled_by` (user)

**Usage:** When a student is enrolled, class_details records are created for each class in their section. This determines which classes appear on their schedule and which subjects they'll be graded in.

---

## Grades and Assessment Tables

### 16. **grades** (2025_11_13_140000 + updates)
**Purpose:** Student academic performance records

**Fields:**
- `id` - Primary key
- `student_personal_info_id` - FK to student_personal_info
- `class_id` - FK to class
- `subject_id` - FK to subjects

**Snapshot Fields (Data Integrity):**
- `subject_name_snapshot` - Subject name at grading time
- `subject_code_snapshot` - Subject code at grading time
- `class_section_snapshot` - Section name at grading time
- `faculty_name_snapshot` - Faculty name at grading time

**Grade Components:**
- `first_quarter` - Q1 grade (0-100)
- `second_quarter` - Q2 grade (0-100)
- `third_quarter` - Q3 grade (0-100)
- `fourth_quarter` - Q4 grade (0-100)
- `semester_grade` - Final semester grade
- `semester_average` - Overall average
- `remarks` - PASSED, FAILED, INCOMPLETE, etc.

**Calculation Flags:**
- `auto_calculated` - Whether system calculated the grade
- `needs_summer_class` - Flag for failed subjects

**Submission Tracking:**
- `status` - Grade status (draft, pending, approved, rejected)
- `submitted_for_approval_at` - When faculty submitted
- `submitted_by` - FK to users (faculty)
- `approved_by` - FK to users (registrar)
- `approved_at` - Approval timestamp

**Data Integrity:**
- `is_locked` - Prevents modifications after approval
- `locked_at` - Lock timestamp
- `locked_by` - FK to users (who locked)
- `last_calculated_at` - Last auto-calculation time
- `calculation_metadata` - JSON of calculation details
- `grade_snapshot` - JSON snapshot before approval

**Timestamps:**
- `created_at`, `updated_at`

**Relationships:**
- Belongs to `student_personal_info`
- Belongs to `class`
- Belongs to `subject`
- Belongs to `submitted_by` (user/faculty)
- Belongs to `approved_by` (user/registrar)
- Belongs to `locked_by` (user)

**Status Flow:**
1. `draft` - Faculty is entering grades
2. `pending` - Faculty submitted for approval
3. `approved` - Registrar approved (locked)
4. `rejected` - Registrar rejected, back to draft

**Grading Rules:**
- **1st Semester:** Only Q1 & Q2 required, semester_grade = (Q1 + Q2) / 2
- **2nd Semester:** Only Q3 & Q4 required, semester_grade = (Q3 + Q4) / 2
- **Passing Grade:** 75.0 or higher
- **Failed:** Below 75.0

**Unique Constraint:** (student_personal_info_id, class_id, subject_id)

---

### 17. **credited_subjects** (2025_11_13_140003)
**Purpose:** Track subjects credited to transferee students

**Fields:**
- `id` - Primary key
- `student_personal_info_id` - FK to student_personal_info
- `enrollment_id` - FK to enrollments
- `subject_id` - FK to subjects
- `previous_school` - Name of school where credit was earned
- `credited_grade` - Grade earned (0-100)
- `remarks` - Optional notes
- `credited_by` - FK to users (coordinator/registrar who credited)
- `credited_at` - When credit was granted
- `timestamps`

**Relationships:**
- Belongs to `student_personal_info`
- Belongs to `enrollment`
- Belongs to `subject`
- Belongs to `credited_by` (user)

**Usage:** When transferee students enroll, coordinator/registrar inputs grades for subjects completed at previous school. These count toward graduation requirements.

**Unique Constraint:** (enrollment_id, subject_id) - Can't credit same subject twice per enrollment

---

### 18. **semester_performance** (2025_11_13_140001)
**Purpose:** Track overall academic performance per semester

**Fields:**
- `id` - Primary key
- `student_personal_info_id` - FK to student_personal_info
- `school_year_id` - FK to school_year
- `enrollment_id` - FK to enrollments
- `semester` - "1st", "2nd", or "Summer"
- `strand_id` - FK to strands

**Performance Metrics:**
- `semester_average` - GPA for semester
- `total_subjects` - Number of subjects taken
- `passed_subjects` - Number passed
- `failed_subjects` - Number failed

**Status:**
- `status` - "In Progress", "Completed", "Failed", "Conditional"
- `requires_summer` - Needs summer classes
- `requires_strand_change` - Needs to transfer strand (STEM rule)
- `recommended_strand_id` - Suggested strand for transfer
- `completed_at` - When semester completed

**Timestamps:**
- `created_at`, `updated_at`

**Relationships:**
- Belongs to `student_personal_info`
- Belongs to `school_year`
- Belongs to `enrollment`
- Belongs to `strand`

**Unique Constraint:** (student_personal_info_id, school_year_id, semester)

**Usage:** Summary of student's academic standing each semester. Used for re-enrollment eligibility checks.

---

### 19. **failed_prerequisites** (2025_11_13_140001)
**Purpose:** Track prerequisite failures and their consequences

**Fields:**
- `id` - Primary key
- `student_personal_info_id` - FK to student_personal_info
- `failed_subject_id` - FK to subjects (the prerequisite that was failed)
- `blocked_subject_id` - FK to subjects (the subject now blocked)
- `grade_id` - FK to grades (the failing grade)
- `semester` - When failure occurred
- `school_year_id` - FK to school_year
- `resolved` - Whether issue is resolved
- `resolved_at` - Resolution timestamp
- `timestamps`

**Relationships:**
- Belongs to `student_personal_info`
- Belongs to `failed_subject` (subject)
- Belongs to `blocked_subject` (subject)
- Belongs to `grade`
- Belongs to `school_year`

**Usage:** When a student fails a prerequisite, this records which future subjects are now blocked. Important for STEM students who must transfer strands if they fail prerequisites.

**Example:** Student fails "Pre-calculus" (prerequisite) → "Basic Calculus" is now blocked.

---

## Relationship Tables (Pivot Tables)

### 20. **strand_school_year** (2025_11_03_055808)
**Purpose:** Track which strands are active for which school years

**Fields:**
- `id` - Primary key
- `strand_id` - FK to strands
- `school_year_id` - FK to school_year
- `is_active` - Whether strand accepts students this year
- `timestamps`

**Usage:** Controls which strands are available for enrollment each school year. New school years start with all strands inactive until registrar activates them.

---

### 21. **strand_semester** (2025_11_07_000003)
**Purpose:** Track which strands are active for which semesters

**Fields:**
- `id` - Primary key
- `strand_id` - FK to strands
- `semester_id` - FK to semester
- `is_active` - Whether strand accepts students this semester
- `timestamps`

**Usage:** Finer control than school year. When semester changes, strands need to be reactivated. Automatically inherits from school year settings when semester is activated.

---

## Special Purpose Tables

### 22. **Duplicate Migration (TO BE REMOVED)**
**File:** `2025_11_15_000000_remove_unused_notes_columns.php`

**Issue:** This is a duplicate of `2025_11_14_140501_remove_unused_notes_columns.php`

**Action Required:** Delete this file as the migration has already been executed.

---

## Database Rules and Constraints

### Enrollment Business Rules:
1. **One Active School Year** - Only one school year can have `is_active = true`
2. **One Active Semester per Year** - Only one semester per school year can be active
3. **One Enrollment per Term** - Student can only have one enrollment per school year/semester
4. **Strand Activation** - Strands must be active for school year AND semester to accept enrollments

### Grading Rules:
1. **Passing Grade** - 75.0 or above
2. **Semester-Based Grading:**
   - 1st Semester: Q1 + Q2 only
   - 2nd Semester: Q3 + Q4 only
3. **Grade Lock** - Approved grades are locked and cannot be modified
4. **Faculty Submission** - Faculty submits → Registrar approves
5. **STEM Prerequisite Rule** - STEM students who fail prerequisites must transfer strands

### Faculty Rules:
1. **Load Limit** - Maximum 5 active classes per semester
2. **No Schedule Conflicts** - Faculty cannot have overlapping class times
3. **Coordinator Status** - Registrar assigns coordinator privileges

### Re-enrollment Rules:
1. **Check Failed Subjects** - System checks grades before allowing re-enrollment
2. **STEM Transfer** - If STEM student failed prerequisite → must transfer strand
3. **Summer Classes** - Other strands with failures → flagged for summer class
4. **Prerequisite Blocking** - Failed prerequisites block dependent subjects

---

## Data Integrity Features

### Snapshots:
- **Grades** - Captures subject and faculty names at time of grading
- **Enrollments** - Captures COR data, section, and strand names
- **Purpose** - Prevents historical records from breaking if master data changes

### Locks:
- **Grades** - Locked after approval to prevent tampering
- **Enrollments** - Can be locked to freeze historical records

### Soft Deletes:
- Not implemented yet but planned for subjects, sections, and classes
- Prevents deletion of records with dependencies

---

## Summary Statistics

- **Total Tables:** 22 (including system tables)
- **Core Academic Tables:** 11
- **Student Management Tables:** 9
- **Relationship Tables:** 2
- **System Tables:** 5

**Key Relationships:**
- `users` → Central authentication
- `student_personal_info` → Student demographics
- `enrollments` → Enrollment workflow
- `class_details` → Student-class enrollment
- `grades` → Academic performance

**Workflow:**
1. Student registers → `users` + `student_personal_info` created
2. Registrar verifies → `is_verified = true`
3. Student enrolls → `enrollments` record created
4. Coordinator reviews → Status changes to `recommended`
5. Registrar assigns → `assigned_strand_id` and `assigned_section_id` set
6. Registrar enrolls → Status = `enrolled`, `class_details` created
7. Faculty teaches → Records attendance, submits grades
8. Faculty submits grades → `grades` status = `pending`
9. Registrar approves grades → `grades` status = `approved`, locked
10. System checks eligibility → `semester_performance` calculated
11. Re-enrollment → Checks prerequisites, triggers strand change if needed

---

## File to Delete
- ❌ `2025_11_15_000000_remove_unused_notes_columns.php` (duplicate)

This is a complete duplicate of `2025_11_14_140501_remove_unused_notes_columns.php` and should be removed to keep migrations clean.

