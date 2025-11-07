<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => Auth::user() ? [
                    'id' => Auth::user()->id,
                    'FirstName' => Auth::user()->FirstName,
                    'MiddleName' => Auth::user()->MiddleName,
                    'LastName' => Auth::user()->LastName,
                    'email' => Auth::user()->email,
                    'Role' => Auth::user()->Role,
                    'must_change_password' => Auth::user()->must_change_password ?? false,
                ] : null,
                'check' => Auth::check(),
            ],
            'flash' => [
                'success' => Session::get('success'),
                'error' => Session::get('error'),
                'warning' => Session::get('warning'),
                'info' => Session::get('info'),
            ],
            'session' => [
                'id' => Session::getId(),
                'authenticated_user_id' => Session::get('authenticated_user_id'),
                'authenticated_user_role' => Session::get('authenticated_user_role'),
            ],
        ];
    }
}
