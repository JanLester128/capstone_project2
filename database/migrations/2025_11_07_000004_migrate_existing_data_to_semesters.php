<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use App\Models\SchoolYear;
use App\Models\Semester;
use App\Models\Subject;
use App\Models\Section;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Migrate existing subjects and sections to have semester_id values.
     */
    public function up(): void
    {
        // Get all school years
        $schoolYears = SchoolYear::all();
        
        foreach ($schoolYears as $schoolYear) {
            // Create default semesters for each school year if they don't exist
            $firstSemester = Semester::firstOrCreate([
                'school_year_id' => $schoolYear->id,
                'semester_type' => '1st Semester'
            ], [
                'start_date' => null,
                'end_date' => null,
                'is_active' => $schoolYear->is_active ? true : false
            ]);
            
            $secondSemester = Semester::firstOrCreate([
                'school_year_id' => $schoolYear->id,
                'semester_type' => '2nd Semester'
            ], [
                'start_date' => null,
                'end_date' => null,
                'is_active' => false // Only first semester active by default
            ]);
            
            $summerSemester = Semester::firstOrCreate([
                'school_year_id' => $schoolYear->id,
                'semester_type' => 'Summer'
            ], [
                'start_date' => null,
                'end_date' => null,
                'is_active' => false // Summer semester inactive by default
            ]);
            
            // Migrate existing subjects
            $subjects = Subject::where('school_year_id', $schoolYear->id)
                              ->whereNull('semester_id')
                              ->get();
                              
            foreach ($subjects as $subject) {
                // Assign based on the existing Semester field (1 or 2)
                if ($subject->Semester == '1') {
                    $subject->semester_id = $firstSemester->id;
                } elseif ($subject->Semester == '2') {
                    $subject->semester_id = $secondSemester->id;
                } else {
                    // Default to first semester if unclear
                    $subject->semester_id = $firstSemester->id;
                }
                $subject->save();
            }
            
            // Migrate existing sections - assign all to first semester by default
            $sections = Section::where('school_year_id', $schoolYear->id)
                              ->whereNull('semester_id')
                              ->get();
                              
            foreach ($sections as $section) {
                $section->semester_id = $firstSemester->id;
                $section->save();
            }
            
            // Migrate existing classes - assign based on their current Semester_id if it matches a semester
            $classes = DB::table('class')
                        ->where('school_year_id', $schoolYear->id)
                        ->get();
                        
            foreach ($classes as $class) {
                // Check if the class's Semester_id matches our created semesters
                if ($class->Semester_id == $firstSemester->id || $class->Semester_id == $secondSemester->id) {
                    // Already correctly assigned, no need to update
                    continue;
                } else {
                    // If Semester_id doesn't match, assign to first semester by default
                    DB::table('class')
                        ->where('Id', $class->Id)
                        ->update(['Semester_id' => $firstSemester->id]);
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Set semester_id back to null for all records
        Subject::whereNotNull('semester_id')->update(['semester_id' => null]);
        Section::whereNotNull('semester_id')->update(['semester_id' => null]);
    }
};
