# Timezone and Date Formatting Guide

## Changes Made

### 1. Backend Configuration
- **File**: `config/app.php`
- **Change**: Updated timezone from `'UTC'` to `'Asia/Manila'`
- **Impact**: All PHP `now()`, `Carbon`, and date functions now use Manila time

### 2. Frontend Utility
- **File**: `resources/js/utils/dateFormatter.js` (NEW)
- **Purpose**: Centralized date/time formatting for Asia/Manila timezone
- **Functions**:
  - `formatDateLong(date)` → "July 15, 2002"
  - `formatDateMedium(date)` → "Jul 15, 2002"
  - `formatDateShort(date)` → "7/15/2002"
  - `formatDateTime(date)` → "July 15, 2002 at 3:30 PM"
  - `formatDateTimeMedium(date)` → "Jul 15, 2002, 3:30 PM"
  - `formatTime(date)` → "3:30 PM"
  - `formatTimeLong(date)` → "3:30:45 PM"
  - `formatRelativeTime(date)` → "2 hours ago"
  - `formatDateForInput(date)` → "2002-07-15" (for input fields)
  - `isToday(date)`, `isPast(date)`, `isFuture(date)` → boolean helpers

## Files That Need Updating

### High Priority (User-Facing Dates)

1. **Faculty/Enrollments.jsx** - Line 36-42
   - Replace `formatDate` function with import from dateFormatter
   
2. **Faculty/Dashboard.jsx** - Lines 42-53
   - Replace inline date formatting with dateFormatter functions
   
3. **Faculty/EnrollmentReports.jsx** - Line 212
   - Replace `toLocaleDateString()` with `formatDateMedium()`
   
4. **Registrar/Enrollments.jsx** - Line 36-42
   - Replace `formatDate` function with import from dateFormatter
   
5. **Registrar/ReEnrollStudents.jsx** - Line 17
   - Replace `toLocaleDateString()` with `formatDateMedium()`
   
6. **Registrar/GradeApprovals.jsx** - Line 186
   - Replace `toLocaleString()` with `formatDateTimeMedium()`
   
7. **Registrar/StudentVerification.jsx** - Lines 172, 252
   - Replace `toLocaleDateString()` with `formatDateMedium()`
   
8. **Registrar/SchoolYears.jsx** - Lines 487, 492
   - Replace `toLocaleDateString()` with `formatDateMedium()`
   
9. **Registrar/Components/SubjectCard.jsx** - Lines 136, 138
   - Replace `toLocaleDateString()` with `formatDateMedium()`

### Medium Priority (Forms and Internal Logic)

10. **Registrar/Components/SemesterForm.jsx** - Lines 26, 75, 79, 89, 91, 113, 117
    - Keep `toISOString().split('T')[0]` for input fields
    - Or use `formatDateForInput()` for consistency
    
11. **Students/EnrollmentForm.jsx** - Lines 152-153
    - Date calculation logic can stay as is (no display impact)

### Backend Date Formats (Already Using Asia/Manila)

The following backend files will automatically use Asia/Manila timezone after `config/app.php` change:

- `FacultyController.php` - Lines 1271, 1335, 1410, 1481
  - Currently using `now()->format('F d, Y g:i A')` ✅ (already correct format)
  
- `StudentController.php` - Line 1025
  - Currently using `format('M d, Y')` ✅ (already correct format)
  
- `RegistrarController.php` - Multiple lines
  - Using `format('Y-m-d')` for database storage ✅ (correct)

## Implementation Pattern

### Before:
```javascript
const date = new Date(value)
return date.toLocaleDateString()
```

### After:
```javascript
import { formatDateMedium } from '../../utils/dateFormatter'

return formatDateMedium(value)
```

### Before (with time):
```javascript
new Date(value).toLocaleString()
```

### After:
```javascript
import { formatDateTimeMedium } from '../../utils/dateFormatter'

formatDateTimeMedium(value)
```

## Testing Checklist

- [ ] Backend timezone is Asia/Manila
- [ ] PDF reports show Manila time
- [ ] Frontend dashboards show dates like "July 15, 2002"
- [ ] Enrollment dates are readable
- [ ] Grade approval timestamps show Manila time
- [ ] Student verification dates are readable
- [ ] School year dates display correctly
- [ ] Form inputs still work correctly

## Notes

- All date formatting now uses Asia/Manila timezone consistently
- The format "July 15, 2002" (full month name) is used for primary displays
- The format "Jul 15, 2002" (abbreviated) is used for compact displays
- Times show as "3:30 PM" (12-hour format with AM/PM)
- Database storage remains in standard formats (Y-m-d, Y-m-d H:i:s)

