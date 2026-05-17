<?php

namespace App\Http\Controllers;

use App\Models\Coupon;
use App\Models\UserCoupon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CouponController extends Controller
{
    /**
     * List all available promotional coupons (catalog and redeemed).
     */
    public function index(Request $request): Response
    {
        $query = Coupon::query();

        // Admin/Owner can see inactive coupons, customers only active ones
        $user = $request->user();
        if (! $user || ! ($user->can('view all data') || $user->hasRole('admin') || $user->hasRole('owner'))) {
            $query->where('is_active', true)->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            });
        }

        $coupons = $query->latest()->get();

        // Get customer's redeemed coupon wallet
        $myCoupons = [];
        if ($user) {
            $myCoupons = UserCoupon::with('coupon')
                ->where('user_id', $user->id)
                ->latest()
                ->get();
        }

        return Inertia::render('coupons/index', [
            'coupons' => $coupons,
            'myCoupons' => $myCoupons,
        ]);
    }

    /**
     * Create a promotional coupon (Admin Only).
     */
    public function store(Request $request): RedirectResponse
    {
        if (! $request->user()->can('manage coupons')) {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'code' => ['required', 'string', 'unique:coupons,code', 'max:50'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'discount_type' => ['required', 'string', 'in:percentage,fixed'],
            'discount_value' => ['required', 'numeric', 'min:0'],
            'points_required' => ['required', 'integer', 'min:0'],
            'min_purchase' => ['required', 'numeric', 'min:0'],
            'expires_at' => ['nullable', 'date', 'after:today'],
            'is_active' => ['boolean'],
        ]);

        Coupon::create($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Coupon created successfully.')]);

        return redirect()->back();
    }

    /**
     * Redeem rewards points to unlock a coupon (Customer Member Only).
     */
    public function redeem(Request $request, int $id): RedirectResponse
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        if (! $user || ! $user->isMember()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('Only active store members can redeem points for coupons.')]);
            return redirect()->back();
        }

        $coupon = Coupon::query()
            ->where([['is_active', '=', true]])
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->findOrFail($id);

        if ($user->member_points < $coupon->points_required) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('In sufficient rewards points to redeem this coupon.')]);
            return redirect()->back();
        }

        DB::transaction(function () use ($user, $coupon) {
            // Deduct points
            $user->deductPoints($coupon->points_required);

            // Add coupon to user's wallet
            UserCoupon::create([
                'user_id' => $user->id,
                'coupon_id' => $coupon->id,
                'redeemed_at' => now(),
                'status' => 'active',
            ]);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __("Coupon {$coupon->code} redeemed successfully! It is added to your wallet.")]);

        return redirect()->back();
    }

    /**
     * Delete a coupon (Admin Only).
     */
    public function destroy(Request $request, int $id): RedirectResponse
    {
        if (! $request->user()->can('manage coupons')) {
            abort(403, 'Unauthorized action.');
        }

        $coupon = Coupon::findOrFail($id);
        $coupon->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Coupon deleted successfully.')]);

        return redirect()->back();
    }
}
