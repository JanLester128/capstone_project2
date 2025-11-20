<?php

namespace App\Console\Commands;

use App\Models\ClassDetail;
use App\Models\ClassRecord;
use Illuminate\Console\Command;

class BackfillClassDetailSnapshots extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'enrollment:backfill-snapshots';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Backfill class record data for existing ClassDetail records into the normalized class_records table';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting backfill of ClassDetail records to class_records table...');

        $classDetails = ClassDetail::with(['class.subject', 'class.section', 'class.faculty'])
            ->whereDoesntHave('classRecord')
            ->get();

        $bar = $this->output->createProgressBar($classDetails->count());
        $bar->start();

        $updated = 0;
        foreach ($classDetails as $classDetail) {
            $class = $classDetail->class;
            
            if ($class) {
                $class->loadMissing(['subject', 'section', 'faculty']);
                
                ClassRecord::updateOrCreate(
                    [
                        'class_detail_id' => $classDetail->id,
                    ],
                    [
                        'subject_name' => $class->subject?->Subject_name ?? '',
                        'subject_code' => $class->subject?->Subject_code ?? '',
                        'faculty_name' => trim(($class->faculty?->FirstName ?? '') . ' ' . ($class->faculty?->LastName ?? '')),
                        'section_name' => $class->section?->section_name ?? '',
                        'day_of_week' => $class->day_of_week ?? '',
                        'start_time' => $class->start_time,
                        'end_time' => $class->endtime ?? $class->end_time,
                    ]
                );
                
                $updated++;
            }
            
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Successfully created {$updated} ClassRecord records.");

        return Command::SUCCESS;
    }
}
