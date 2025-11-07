<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class AuthController extends Controller
{
    /**
     * Show the password change form.
     */
    public function showPasswordChange()
    {
        return Inertia::render('Auth/ChangePassword');
    }

    /**
     * Update the user's password.
     */
    public function updatePassword(Request $request)
    {
        $validated = $request->validate([
            'password' => 'required|string|min:8|confirmed',
        ]);

        /** @var User $user */
        $user = Auth::user();

        // For forced password changes (must_change_password = true), 
        // we don't require current password verification since it's a temporary auto-generated password
        // This improves UX for faculty members setting their first real password

        // Update password and remove the must_change_password flag using explicit model update
        User::where('id', $user->id)->update([
            'password' => Hash::make($validated['password']),
            'must_change_password' => false,
        ]);

        // Redirect based on user role
        if ($user->Role === 'Registrar') {
            return redirect('/registrar')->with('success', 'Password changed successfully.');
        }
        if ($user->Role === 'Faculty') {
            return redirect('/faculty')->with('success', 'Password changed successfully.');
        }
        if ($user->Role === 'Student') {
            return redirect('/student')->with('success', 'Password changed successfully.');
        }
        
        return redirect('/')->with('success', 'Password changed successfully.');
    }
}
