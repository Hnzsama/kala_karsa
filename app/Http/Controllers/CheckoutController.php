<?php

namespace App\Http\Controllers;

use App\Models\CartItem;
use App\Models\PaymentChannel;
use App\Models\UserCoupon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutController extends Controller
{
    /**
     * Render the checkout page with cart items and payment channel options.
     */
    public function index(Request $request): Response|\Illuminate\Http\RedirectResponse
    {
        $user = $request->user();
        if (! $user) {
            return redirect()->route('login');
        }

        if ($user->hasRole('admin') || $user->hasRole('owner')) {
            return redirect()->to('/dashboard')->with('toast', [
                'type' => 'error',
                'message' => 'Admin dan Owner tidak diperbolehkan untuk membeli barang.',
            ]);
        }

        // Get user cart items
        $cartItems = CartItem::query()
            ->where('user_id', $user->id)
            ->with('product')
            ->get();

        if ($cartItems->isEmpty()) {
            return redirect()->to('/')->with('toast', [
                'type' => 'warning',
                'message' => 'Keranjang belanja Anda kosong.',
            ]);
        }

        // Get active coupons for the user
        $userCoupons = UserCoupon::query()
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->with('coupon')
            ->get();

        // Get all active payment channels
        $paymentChannels = PaymentChannel::query()
            ->where('is_active', true)
            ->get();

        return Inertia::render('checkout', [
            'cartItems' => $cartItems,
            'userCoupons' => $userCoupons,
            'paymentChannels' => $paymentChannels,
        ]);
    }
}
