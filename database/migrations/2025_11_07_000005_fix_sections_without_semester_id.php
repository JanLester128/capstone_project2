<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use App\Models\Section;
use App\Models\SchoolYear;
use App\Models\Semester;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Fix existing sections that have NULL semester_id by assigning them to the first semester of their school year.
     */
    public function up(): void
    {
        // Find all sections with NULL semester_id
        $sectionsWithoutSemester = Section::whereNull('semester_id')->get();
        
        foreach ($sectionsWithoutSemester as $section) {
            // Find the first semester for this section's school year
            $firstSemester = Semester::where('school_year_id', $section->school_year_id)
                ->where('semester_type', '1st Semester')
                ->first();
            
            if ($firstSemester) {
                // Assign the section to the first semester
                $section->update(['semester_id' => $firstSemester->id]);
                echo "Fixed section '{$section->section_name}' - assigned to 1st Semester\n";
            } else {
                // If no first semester exists, create one
                $schoolYear = SchoolYear::find($section->school_year_id);
                if ($schoolYear) {
                    $newSemester = Semester::create([
                        'school_year_id' => $schoolYear->id,
                        'semester_type' => '1st Semester',
                        'start_date' => null,
                        'end_date' => null,
                        'is_active' => $schoolYear->is_active ? true : false
                    ]);
                    
                    $section->update(['semester_id' => $newSemester->id]);
                    echo "Created 1st Semester for school year {$schoolYear->School_year_start}-{$schoolYear->School_year_end} and assigned section '{$section->section_name}'\n";
                }
            }
        }
        
        echo "Migration completed. Fixed " . $sectionsWithoutSemester->count() . " sections.\n";
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Set semester_id back to null for sections that were fixed
        // This is not recommended as it would break the system again
        echo "Reverse migration not recommended as it would break section visibility.\n";
    }
};
