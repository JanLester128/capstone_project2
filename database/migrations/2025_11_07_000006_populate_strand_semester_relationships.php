<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use App\Models\Strand;
use App\Models\SchoolYear;
use App\Models\Semester;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Populate strand_semester table with initial relationships.
     */
    public function up(): void
    {
        // Get all active school years
        $activeSchoolYears = SchoolYear::where('is_active', true)->get();
        
        foreach ($activeSchoolYears as $schoolYear) {
            // Get all semesters for this school year
            $semesters = Semester::where('school_year_id', $schoolYear->id)->get();
            
            foreach ($semesters as $semester) {
                // Get strands that are active for this school year
                $activeStrandIds = DB::table('strand_school_year')
                    ->where('school_year_id', $schoolYear->id)
                    ->where('is_active', true)
                    ->pluck('strand_id');
                
                // If no strand_school_year relationships exist, use all active strands
                if ($activeStrandIds->isEmpty()) {
                    $activeStrandIds = Strand::where('Is_active', true)->pluck('id');
                }
                
                // Create strand_semester relationships
                foreach ($activeStrandIds as $strandId) {
                    // Check if relationship already exists
                    $exists = DB::table('strand_semester')
                        ->where('strand_id', $strandId)
                        ->where('semester_id', $semester->id)
                        ->exists();
                    
                    if (!$exists) {
                        DB::table('strand_semester')->insert([
                            'strand_id' => $strandId,
                            'semester_id' => $semester->id,
                            'is_active' => $semester->is_active ? true : false, // Match semester active status
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                        
                        echo "Created strand_semester relationship: Strand {$strandId} -> Semester {$semester->id} ({$semester->semester_type})\n";
                    }
                }
            }
        }
        
        echo "Migration completed. Populated strand_semester relationships.\n";
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove all strand_semester relationships created by this migration
        DB::table('strand_semester')->truncate();
        echo "Removed all strand_semester relationships.\n";
    }
};
