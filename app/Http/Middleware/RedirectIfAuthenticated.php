<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RedirectIfAuthenticated
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$guards): Response
    {
        $guards = empty($guards) ? [null] : $guards;

        foreach ($guards as $guard) {
            if (Auth::guard($guard)->check()) {
                $user = Auth::guard($guard)->user();
                
                // Redirect based on user role
                switch ($user->Role) {
                    case 'Registrar':
                        return redirect('/registrar');
                    case 'Faculty':
                        return redirect('/faculty');
                    case 'Student':
                        return redirect('/student');
                    default:
                        // If role is not recognized, logout and redirect to login
                        Auth::guard($guard)->logout();
                        return redirect('/login');
                }
            }
        }

        return $next($request);
    }
}
