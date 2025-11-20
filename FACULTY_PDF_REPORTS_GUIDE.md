# Faculty PDF Reports Generation Guide

## Overview
Comprehensive PDF generation system for faculty members to export various reports including schedules, student lists, grades, and advisory reports.

## ✅ Implemented Features

**ALL PDF REPORTS ARE CENTRALIZED IN: Faculty > Reports & Export Page**

### 1. **Faculty Schedule PDF**
- **Location**: Faculty > Reports & Export > **Schedule Tab**
- **Button**: "Download PDF" (Red button in header)
- **Route**: `/faculty/reports/schedule/pdf`
- **Contents**:
  - Faculty name
  - School year and semester
  - Complete class schedule table (Subject, Section, Strand, Day, Time)
  - Total classes count
  - Generated timestamp
- **Orientation**: Portrait

### 2. **Class Students List PDF**
- **Location**: Faculty > Reports & Export > **Class Reports Tab**
- **Access**: Select class from dropdown, click "Download Students List PDF"
- **Route**: `/faculty/reports/class/{classId}/students/pdf`
- **Contents**:
  - Faculty and subject information
  - Section and strand details
  - Complete student roster with LRN, Name, Grade Level
  - Total students count
  - Signature section (Faculty and Date)
- **Orientation**: Portrait

### 3. **Class Grades Report PDF**
- **Location**: Faculty > Reports & Export > **Class Reports Tab**
- **Access**: Select class from dropdown, click "Download Grades Report PDF"
- **Route**: `/faculty/reports/class/{classId}/grades/pdf`
- **Contents**:
  - Faculty and subject information
  - Section and strand details
  - Student grades table:
    - LRN, Student Name
    - 1st, 2nd, 3rd, 4th Quarter grades
    - Semester Final Grade
    - Remarks
  - Total students count
  - Signature section
  - **Note**: Shows only APPROVED grades
- **Orientation**: Landscape (for wider table)

### 4. **Class Advisory Report PDF**
- **Location**: Faculty > Reports & Export > **Advisory Tab**
- **Access**: Per section PDF button
- **Route**: `/faculty/reports/section/{sectionId}/advisory/pdf`
- **Contents**:
  - Adviser information
  - Section, strand, grade level details
  - **Student Roster Section**:
    - Complete list with LRN, Name, Grade Level
  - **Subjects Assigned Section**:
    - Subject code, name
    - Assigned faculty
    - Schedule (day and time)
  - Summary counts (total students, total subjects)
  - Signature section (Adviser, Coordinator, Principal)
- **Orientation**: Portrait

## 📁 File Structure

### Backend (PHP/Laravel)
```
app/Http/Controllers/
└── FacultyController.php
    ├── downloadSchedulePdf()           // Faculty schedule
    ├── downloadClassStudentsPdf()      // Student list per class
    ├── downloadClassGradesPdf()        // Grades per class
    └── downloadAdvisoryPdf()           // Advisory section report

routes/web.php
    ├── /faculty/reports/schedule/pdf
    ├── /faculty/reports/class/{class}/students/pdf
    ├── /faculty/reports/class/{class}/grades/pdf
    └── /faculty/reports/section/{section}/advisory/pdf
```

### PDF Templates (Blade Views)
```
resources/views/pdf/faculty/
├── schedule.blade.php           // Faculty schedule template
├── class-students.blade.php     // Students list template
├── class-grades.blade.php       // Grades report template
└── advisory-report.blade.php    // Advisory report template
```

### Frontend (React/Inertia)
```
resources/js/Pages/Faculty/
├── Reports.jsx                  // Main reports page with PDF buttons
└── Grades.jsx                   // Grades page with export buttons
```

## 🎨 PDF Styling Features

### Common Design Elements
- **Header**: School name (OPOL NATIONAL SECONDARY TECHNICAL SCHOOL)
- **Info Section**: Gray background box with key details
- **Tables**: 
  - Dark gray headers (#4a5568)
  - Alternating row colors for readability
  - Clean borders and spacing
- **Footer**: 
  - Generation timestamp
  - Official document note
- **Font**: Arial, professional sizing (9-11px)
- **Colors**: Professional blue/gray palette

### Specific Features
- **Landscape mode** for grades (wider data)
- **Portrait mode** for lists and schedules
- **Signature sections** with proper spacing
- **Summary boxes** with colored borders
- **Responsive tables** with appropriate column widths

## 🔒 Security Features

### Authorization Checks
1. **Faculty Ownership**:
   - Class PDFs: Verifies faculty owns the class
   - Advisory PDFs: Verifies faculty is the section adviser
   
2. **Active Semester Filtering**:
   - All data filtered by active school year/semester
   - Enrollment status verification (STATUS_ENROLLED)
   - Grade approval status (STATUS_APPROVED for grades)

3. **Authentication**:
   - All routes protected by `auth` and `role:Faculty` middleware

## 📊 Data Filtering Logic

### Schedule PDF
- Filters by active school year and semester
- Only shows active classes
- Ordered by day of week and start time

### Students List PDF
- Shows only enrolled students for the active term
- Includes LRN, full name, grade level

### Grades Report PDF
- **CRITICAL**: Shows only APPROVED grades
- Filters by active school year/semester
- Includes all quarter grades and final grade

### Advisory Report PDF
- Shows enrolled students in the section
- Lists all subjects assigned to the section
- Includes faculty assignments and schedules

## 🚀 How to Use

### For Faculty Members

**ALL REPORTS ARE NOW IN ONE PLACE: Faculty > Reports & Export**

#### 1. Export Schedule
```
1. Navigate to: Faculty > Reports & Export
2. Stay on "Schedule" tab (default)
3. Click "Download PDF" button (red, top right)
4. PDF opens in new tab / downloads automatically
```

#### 2. Export Student List (Per Class)
```
1. Navigate to: Faculty > Reports & Export
2. Click "Class Reports" tab
3. Select a class from dropdown
4. Click "Download Students List PDF" (blue button)
5. PDF generates with complete student roster
```

#### 3. Export Grades Report (Per Class)
```
1. Navigate to: Faculty > Reports & Export
2. Click "Class Reports" tab
3. Select a class from dropdown
4. Click "Download Grades Report PDF" (red button)
5. PDF generates with approved grades
6. Note: Only shows officially approved grades
```

#### 4. Export Advisory Report
```
1. Navigate to: Faculty > Reports & Export
2. Click "Advisory" tab
3. Find your advisory section
4. Click "PDF" button next to section (red)
5. PDF generates with complete advisory report
```

## 📦 Package Dependencies

### Installed Package
```bash
composer require barryvdh/laravel-dompdf
```

### Package Details
- **Name**: barryvdh/laravel-dompdf
- **Purpose**: HTML to PDF conversion
- **Features**: 
  - Blade template support
  - CSS styling
  - Landscape/Portrait orientation
  - Font customization

## 🎯 Key Implementation Notes

### Grade Filtering
```php
// Only approved grades shown in PDF
->where('status', Grade::STATUS_APPROVED)
```

### Semester Mapping
```php
// Automatically maps semester type to quarter grades
// 1st Semester → 1st & 2nd Quarter
// 2nd Semester → 3rd & 4th Quarter
```

### PDF Generation Pattern
```php
$pdf = Pdf::loadView('pdf.faculty.template', $data);
return $pdf->download('filename.pdf');

// For landscape orientation:
$pdf = Pdf::loadView('pdf.faculty.template', $data)
    ->setPaper('a4', 'landscape');
```

### Frontend Export Pattern
```javascript
const handleExport = (id) => {
  window.open(`/faculty/reports/type/${id}/pdf`, '_blank')
}
```

## 🔧 Maintenance & Troubleshooting

### Common Issues

1. **PDF Not Generating**
   - Check DomPDF is installed: `composer show | grep dompdf`
   - Verify routes are defined in web.php
   - Check faculty authentication and permissions

2. **Missing Data in PDF**
   - Verify active school year/semester is set
   - Check enrollment status (must be 'enrolled')
   - For grades: verify grades are approved

3. **Styling Issues**
   - Inline CSS required (no external stylesheets)
   - Use absolute units (px, pt)
   - Test in different browsers

### Testing Checklist
- ✅ Faculty can download schedule PDF
- ✅ Faculty can download student list for their classes
- ✅ Faculty can download grades for their classes (approved only)
- ✅ Advisers can download advisory report for their sections
- ✅ PDFs display correct school year/semester
- ✅ All tables are properly formatted
- ✅ Signatures sections appear correctly
- ✅ Authorization checks prevent unauthorized access

## 📈 Future Enhancements (Optional)

### Possible Additions
1. **Attendance Reports**: Daily/weekly attendance PDF
2. **Individual Student Report**: Complete student performance
3. **Comparison Reports**: Term-over-term analysis
4. **Custom Date Range**: Filter by specific date ranges
5. **Bulk Export**: Export all classes at once
6. **Email Integration**: Email PDFs directly to stakeholders

### Additional Features
- **Watermarks**: Add draft/official watermarks
- **Digital Signatures**: QR codes for verification
- **Charts/Graphs**: Visual grade distribution
- **Comments Section**: Faculty notes on student progress

## ✨ Summary

The faculty PDF generation system provides comprehensive reporting capabilities:

✅ **4 PDF Report Types** - Schedule, Students, Grades, Advisory
✅ **Multiple Access Points** - Reports page, Grades page
✅ **Professional Formatting** - Clean, printable layouts
✅ **Security Built-in** - Authorization and data filtering
✅ **Active Semester Aware** - Automatically filters current term
✅ **User-Friendly** - One-click PDF generation

Faculty members now have complete control over generating and printing their essential reports for official documentation, parent meetings, and administrative requirements.

---

**Implementation Date**: November 16, 2025
**Package Used**: barryvdh/laravel-dompdf
**Status**: ✅ Complete and Ready for Production

