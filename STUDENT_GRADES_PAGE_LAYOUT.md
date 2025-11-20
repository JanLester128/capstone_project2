# Student Grades Page - Layout Documentation

## Overview
Beautiful, modern card-based grades display with semester filtering and intelligent column display.

## Features

### 🎯 **Smart Column Display**
- **1st Semester subjects**: Shows `1st Quarter`, `2nd Quarter`, `Final Grade`, `Remarks`
- **2nd Semester subjects**: Shows `3rd Quarter`, `4th Quarter`, `Final Grade`, `Remarks`
- **All Semesters view**: Shows all available quarters for each subject

### 📊 **Key Components**

#### 1. Academic Alerts (Top)
- **Summer Class Required**: Yellow alert banner
- **Strand Change Required**: Red alert banner (for STEM students with failed semester)

#### 2. Summary Statistics (When semester selected)
```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Total        │ Semester     │ Passed       │ Failed       │
│ Subjects     │ Average      │ Subjects     │ Subjects     │
│   12         │   85.50      │    10        │     2        │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

#### 3. Semester Filter Buttons
```
[All Semesters] [2023-2024 - 1st] [2023-2024 - 2nd] [2024-2025 - 1st]
```

#### 4. Grade Cards (Main Display)

Each subject displayed as a card:

```
┌─────────────────────────────────────────────────────────────┐
│ 📘 GENERAL MATHEMATICS                        [✓ Passed]     │
│    MATH101 • Teacher: Juan Dela Cruz                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │1st Qtr   │ │2nd Qtr   │ │Final Grd │ │ Remarks  │       │
│  │  88.00   │ │  92.00   │ │  90.00   │ │ Passed   │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 🎨 **Color Coding**

**Grades:**
- 90+: Green (Excellent)
- 85-89: Blue (Very Good)
- 75-84: Yellow (Satisfactory)
- Below 75: Red (Failed)

**Remarks:**
- Passed: Green badge
- Failed: Red badge
- Incomplete: Yellow badge

### 📱 **Responsive Design**
- Mobile: Stacked grade boxes (2 columns)
- Tablet: 4 columns
- Desktop: 6 columns for full grade display

## Data Structure

### Backend (StudentController)
```php
return [
    'grades' => [
        [
            'id' => 1,
            'subject' => 'General Mathematics',
            'subject_code' => 'MATH101',
            'teacher' => 'Juan Dela Cruz',
            'semester' => '1st',
            'school_year' => '2023-2024',
            'first_quarter' => 88.00,
            'second_quarter' => 92.00,
            'third_quarter' => null,
            'fourth_quarter' => null,
            'final_grade' => 90.00,
            'remarks' => 'Passed',
            'needs_summer_class' => false,
            'is_prerequisite_failed' => false,
        ],
        // ... more grades
    ],
    'groupedGrades' => [
        [
            'label' => '2023-2024 - 1st',
            'grades' => [...],
        ],
        // ... more semesters
    ],
    'semesterPerformance' => [
        'semester_average' => 85.50,
        'total_subjects' => 12,
        'passed_subjects' => 10,
        'failed_subjects' => 2,
        'requires_summer' => true,
        'requires_strand_change' => false,
    ],
];
```

### Frontend (React Component)
```jsx
<Grades 
    grades={grades}
    groupedGrades={groupedGrades}
    enrollmentStatus={enrollmentStatus}
    semesterPerformance={semesterPerformance}
    studentInfo={studentInfo}
/>
```

## User Experience Flow

1. **Page Load**
   - Shows all grades by default OR first semester group
   - Summary stats displayed if single semester selected
   - Academic alerts shown at top if applicable

2. **Semester Selection**
   - Click semester button to filter grades
   - Stats update automatically
   - Only relevant quarters shown per semester

3. **Grade Card Display**
   - **1st Semester**: Shows Q1, Q2, Final, Remarks
   - **2nd Semester**: Shows Q3, Q4, Final, Remarks
   - **All View**: Shows all available quarters

4. **Visual Feedback**
   - Color-coded grades for quick assessment
   - Hover effects on cards
   - Clear pass/fail indicators
   - Warning badges for summer classes

## Special Features

### Summer Class Indicator
```
┌─────────────────────────────────────────────┐
│ 📘 CALCULUS                    [✗ Failed]   │
│ [🔔 Summer Class Required]                  │
├─────────────────────────────────────────────┤
│ ... grade boxes ...                          │
│ ⚠️ This failure blocks: Pre-Calculus 2      │
└─────────────────────────────────────────────┘
```

### Prerequisite Warning
When a failed subject blocks other subjects, an orange warning appears at the bottom of the card showing which subjects are blocked.

### Empty State
```
┌─────────────────────────────────────────┐
│          📄                             │
│    No grades available                  │
│  Grades will appear once submitted      │
└─────────────────────────────────────────┘
```

## Accessibility
- Semantic HTML structure
- Clear labels and descriptions
- Keyboard navigation support
- Screen reader friendly
- Color contrast WCAG AA compliant

## Mobile Optimization
- Touch-friendly buttons (min 44px)
- Responsive grid system
- Stacked layout on small screens
- No horizontal scroll
- Optimized font sizes

## Performance
- Efficient filtering (client-side)
- Lazy loading for large datasets
- Optimized re-renders
- Cached calculations

## Future Enhancements
- [ ] Print/Download transcript
- [ ] Grade history graph
- [ ] Comparison with class average
- [ ] Progress tracking
- [ ] Export to PDF

