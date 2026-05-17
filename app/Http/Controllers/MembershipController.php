<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class MembershipController extends Controller
{
    /**
     * Show the membership registration page.
     */
    public function index(Request $request): Response
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        return Inertia::render('membership/index', [
            'isMember' => $user->isMember(),
            'memberPoints' => $user->member_points,
            'phoneNumber' => $user->phone_number,
        ]);
    }

    /**
     * Register the authenticated customer as a member of the store.
     */
    public function register(Request $request): RedirectResponse
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        if ($user->isMember()) {
            Inertia::flash('toast', ['type' => 'warning', 'message' => __('You are already a registered store member.')]);
            return redirect()->back();
        }

        $validated = $request->validate([
            'phone_number' => ['required', 'string', 'min:8', 'max:16'],
        ]);

        $user->registerAsMember($validated['phone_number']);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Congratulations! You are now a registered store member and can collect points.')]);

        return redirect()->back();
    }
}
