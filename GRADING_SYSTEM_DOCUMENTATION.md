# Grading and Academic Management System Documentation

## Overview
This system automatically calculates grades, determines academic standing, handles prerequisite failures, and manages STEM strand changes for students with failed semesters.

## Key Features

### 1. Automatic Grade Calculation
- **Semester Grade**: Automatically calculated as the average of quarterly grades (1st, 2nd, 3rd, 4th quarters)
- **Remarks Determination**:
  - `Passed`: Semester grade >= 75
  - `Failed`: Semester grade < 75
  - `Incomplete`: No grades submitted

### 2. Prerequisite Checking
When a student fails a subject that has prerequisites:
- System automatically identifies subjects blocked by the failure
- Creates `FailedPrerequisite` records
- Flags the grade as `needs_summer_class = true`
- Stores list of blocked subjects in `failed_prerequisites` field

### 3. Summer Class Requirements
Students are flagged for summer classes when:
- They fail any subject (grade < 75)
- They fail a subject that blocks other subjects (prerequisites)

### 4. STEM Strand Change Policy
**Automatic Detection**: When a STEM student's semester average < 75:
- System flags `requires_strand_change = true`
- Recommends alternative strands (TVL or HUMSS)
- Sets enrollment status to `is_on_probation = true`
- Student must re-enroll in recommended strand for next semester

### 5. Semester Performance Tracking
The `semester_performance` table tracks:
- Semester average
- Total/passed/failed subjects count
- Requires summer classes flag
- Requires strand change flag (for STEM)
- Completion status

## Database Schema

### New Tables

#### `semester_performance`
```sql
- student_personal_info_id (FK)
- school_year_id (FK)
- enrollment_id (FK)
- semester (1st, 2nd, Summer)
- strand_id (FK)
- semester_average (decimal 2)
- total_subjects (int)
- passed_subjects (int)
- failed_subjects (int)
- status (In Progress, Completed, Failed, Conditional)
- requires_summer (boolean)
- requires_strand_change (boolean)
- recommended_strand_id (FK)
- notes (text)
- completed_at (timestamp)
```

####`failed_prerequisites`
```sql
- student_personal_info_id (FK)
- failed_subject_id (FK to subjects)
- blocked_subject_id (FK to subjects)
- grade_id (FK)
- semester (1st, 2nd, Summer)
- school_year_id (FK)
- resolved (boolean)
- resolved_at (timestamp)
- resolution_notes (text)
```

### Enhanced Existing Tables

#### `grades` table - New fields:
- `needs_summer_class` (boolean) - Student must take summer class
- `is_prerequisite_failed` (boolean) - Blocks other subjects
- `failed_prerequisites` (text) - List of blocked subjects
- `semester_average` (decimal) - For summer grade replacement
- `auto_calculated` (boolean) - Was grade auto-calculated

#### `student_personal_info` table - New fields:
- `current_semester_average` (decimal)
- `failed_subjects_count` (int)
- `requires_strand_change` (boolean)
- `recommended_strand_id` (FK to strands)
- `academic_standing_notes` (text)

#### `enrollments` table - New fields:
- `is_on_probation` (boolean)
- `requires_summer_classes` (boolean)
- `summer_subjects_needed` (text)

## Services

### `GradeCalculationService`

#### Methods:

**`calculateSemesterGrade(Grade $grade): float`**
- Calculates average of quarterly grades
- Returns rounded value (2 decimal places)

**`determineRemarks(float $semesterGrade): string`**
- Returns: 'Passed', 'Failed', or 'Incomplete'
- Passing grade: >= 75

**`autoCalculateGrade(Grade $grade): Grade`**
- Auto-calculates semester grade if not set
- Determines remarks
- Checks prerequisites
- Sets `auto_calculated = true`

**`checkPrerequisites(Grade $grade): void`**
- Finds subjects blocked by failed grade
- Creates FailedPrerequisite records
- Sets flags on grade

**`calculateSemesterPerformance(...): SemesterPerformance`**
- Calculates student's overall semester performance
- Determines if summer classes needed
- For STEM: Checks if strand change required
- Updates student_personal_info with current status

**`processSemesterEnd(int $schoolYearId, string $semester): Collection`**
- Processes all students at semester end
- Auto-calculates all approved grades
- Generates performance reports
- Identifies students needing summer/strand change

**`getStudentsRequiringSummer(...): Collection`**
- Returns students who need summer classes
- Includes failed subjects list

**`getStemStudentsRequiringChange(...): Collection`**
- Returns STEM students with failed semester
- Includes recommended strands

**`initiateStrandChange(...): bool`**
- Initiates strand change process
- Updates student notes
- Marks enrollment as on probation

## Controllers

### `GradeProcessingController`

Routes:
- `GET /registrar/grade-processing` - View semester processing page
- `POST /registrar/grade-processing/semester-end` - Process all students
- `POST /registrar/grade-processing/student/{student}` - Process individual student
- `GET /registrar/summer-class-students` - View students needing summer
- `GET /registrar/stem-strand-change` - View STEM students needing change
- `POST /registrar/stem-strand-change/{student}` - Process strand change

### Updated `RegistrarController` Methods

**`updateGradeApproval()`**
- Now includes automatic calculation on approval
- Calculates semester grade if missing
- Determines remarks
- Checks prerequisites
- Sets auto_calculated flag

**`bulkUpdateGradeApprovals()`**
- Bulk approve with automatic calculations
- Same logic as single approval

## Workflow

### 1. Grade Submission & Approval
```
Faculty submits grades → 
Registrar approves → 
System auto-calculates:
  ├─ Semester grade (avg of quarters)
  ├─ Remarks (Passed/Failed)
  └─ Check prerequisites if failed
```

### 2. Semester End Processing
```
Registrar initiates semester end →
For each student:
  ├─ Calculate semester average
  ├─ Count passed/failed subjects
  ├─ Check if summer classes needed
  ├─ If STEM & failed: Flag for strand change
  └─ Create SemesterPerformance record
```

### 3. Summer Class Assignment
```
Student fails subject →
  ├─ Is prerequisite? → Block dependent subjects
  ├─ Mark needs_summer_class = true
  └─ Add to enrollment.summer_subjects_needed
```

### 4. STEM Strand Change Process
```
STEM student semester avg < 75 →
  ├─ Set requires_strand_change = true
  ├─ Recommend TVL or HUMSS strand
  ├─ Set enrollment.is_on_probation = true
  └─ For next enrollment:
      └─ Must enroll in recommended strand
```

## Usage Examples

### Process Semester End
```php
$gradeService = app(GradeCalculationService::class);
$results = $gradeService->processSemesterEnd($schoolYearId, '1st');
```

### Check Student's Semester Performance
```php
$performance = SemesterPerformance::where('student_personal_info_id', $studentId)
    ->where('school_year_id', $schoolYearId)
    ->where('semester', '1st')
    ->first();

if ($performance->requires_strand_change) {
    // STEM student failed - needs strand change
    $recommendedStrand = $performance->recommendedStrand;
}
```

### Get Students Needing Summer Classes
```php
$students = $gradeService->getStudentsRequiringSummer($schoolYearId, '1st');

foreach ($students as $student) {
    $failedSubjects = $student->grades->where('needs_summer_class', true);
}
```

### Initiate Strand Change
```php
$gradeService->initiateStrandChange(
    $studentId,
    $fromStrandId, // Current STEM strand
    $toStrandId,   // Recommended strand (TVL/HUMSS)
    'Failed semester average: 68.5'
);
```

## Frontend Integration

### Pages to Create:

1. **Registrar/GradeProcessing.jsx**
   - Semester end processing interface
   - Student statistics
   - Bulk process button

2. **Registrar/SummerClassStudents.jsx**
   - List of students needing summer
   - Failed subjects per student
   - Prerequisite blocking info

3. **Registrar/StemStrandChange.jsx**
   - STEM students requiring strand change
   - Current vs recommended strands
   - Approve strand change button

4. **Students/AcademicStanding.jsx**
   - Student view of their performance
   - Summer requirements
   - Strand change notifications (if applicable)

## Prerequisites Configuration

Subjects should have prerequisites defined in the `PREREQUISITES` field (comma-separated):

Example:
```
Subject: General Physics 1
PREREQUISITES: "Pre-calculus, Calculus"

Subject: Practical Research 2
PREREQUISITES: "Practical Research 1, Statistics and Probability"
```

## Business Rules Summary

1. **Passing Grade**: 75 or above
2. **Failed Grade**: Below 75
3. **Summer Classes**: Required for any failed subject
4. **Prerequisite Blocking**: Failing a prerequisite blocks dependent subjects
5. **STEM Strand Change**: Triggered when semester average < 75
6. **Academic Probation**: Failing 3+ subjects or requiring strand change
7. **Grade Calculation**: Average of all quarterly grades submitted
8. **Auto-Calculation**: Happens on registrar approval

## Migration Command

```bash
php artisan migrate
```

This will create:
- `semester_performance` table
- `failed_prerequisites` table
- Add fields to `grades`, `student_personal_info`, `enrollments` tables

## Testing Checklist

- [ ] Grade auto-calculation on approval
- [ ] Semester average calculation
- [ ] Prerequisite checking and blocking
- [ ] Summer class requirement detection
- [ ] STEM strand change detection (avg < 75)
- [ ] Semester end batch processing
- [ ] Failed prerequisite resolution
- [ ] Student notification system
- [ ] Registrar dashboard integration
- [ ] Student academic standing view

## Notes

- All calculations happen automatically on grade approval
- Registrar can manually trigger semester-end processing
- STEM policy is strictly enforced (auto-detection)
- Prerequisite relationships must be properly configured in subjects
- Summer grades replace original failed grades when entered
- Students on probation require special enrollment handling

