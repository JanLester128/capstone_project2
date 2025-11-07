<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserSession
{
    /**
     * Handle an incoming request.
     * This middleware ensures that authenticated users maintain their session
     * and prevents session conflicts in the same browser.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // If user is authenticated, ensure session consistency
        if (Auth::check()) {
            $user = Auth::user();
            
            // Store user session information
            Session::put('authenticated_user_id', $user->id);
            Session::put('authenticated_user_role', $user->Role);
            Session::put('authenticated_user_email', $user->email);
            
            // Regenerate session ID for security (but keep session data)
            if (!Session::has('session_regenerated_for_user_' . $user->id)) {
                Session::regenerate(false); // false = keep session data
                Session::put('session_regenerated_for_user_' . $user->id, true);
            }
        }
        
        return $next($request);
    }
}
