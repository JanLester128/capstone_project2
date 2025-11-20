<?php

namespace App\Http\Controllers;

use App\Models\StudentPersonalInfo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class StudentDocumentController extends Controller
{
    /**
     * Display a stored student document with access control.
     */
    public function show(Request $request, StudentPersonalInfo $studentPersonalInfo, string $type)
    {
        $user = $request->user();

        if (!$this->canViewDocument($user, $studentPersonalInfo)) {
            abort(403, 'You are not authorized to view this document.');
        }

        // Load user relationship if needed for profile photo
        if ($type === 'profile-photo') {
            $studentPersonalInfo->load('user');
        }

        $path = match ($type) {
            'psa' => $studentPersonalInfo->psa_birth_certificate_photo,
            'report-card' => $studentPersonalInfo->report_card_photo,
            'profile-photo' => $studentPersonalInfo->user->profile_photo ?? null,
            default => null,
        };

        if (!$path || !Storage::disk('public')->exists($path)) {
            abort(404);
        }

        $absolutePath = Storage::disk('public')->path($path);
        $mime = Storage::disk('public')->mimeType($path) ?? 'application/octet-stream';

        return response()->file($absolutePath, [
            'Content-Type' => $mime,
            'Content-Disposition' => 'inline; filename="' . basename($path) . '"',
        ]);
    }

    /**
     * Validate user permissions for viewing a student document.
     */
    private function canViewDocument($user, StudentPersonalInfo $studentPersonalInfo): bool
    {
        if (!$user) {
            return false;
        }

        if ($user->Role === 'Registrar') {
            return true;
        }

        if ($user->Role === 'Faculty') {
            return $user->is_coordinator;
        }

        if ($user->Role === 'Student') {
            return $studentPersonalInfo->user_id === $user->id;
        }

        return false;
    }
}


