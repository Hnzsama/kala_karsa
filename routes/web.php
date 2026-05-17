<?php

use App\Http\Controllers\Teams\TeamInvitationController;
use App\Http\Controllers\DashboardController;
use App\Http\Middleware\EnsureTeamMembership;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::get('/', function () {
    $products = \App\Models\Product::query()
        ->with(['category', 'reviews'])
        ->where('is_active', true)
        ->latest()
        ->get();

    $categories = \App\Models\Category::query()
        ->withCount(['products' => function ($query) {
            $query->where('is_active', true);
        }])
        ->get();

    $userCoupons = [];
    $cartItems = [];
    if (Auth::check()) {
        $userCoupons = \App\Models\UserCoupon::query()
            ->with('coupon')
            ->where('user_id', Auth::id())
            ->where('status', 'active')
            ->get();

        $cartItems = \App\Models\CartItem::query()
            ->with('product.category')
            ->where('user_id', Auth::id())
            ->get();
    }

    return inertia('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
        'products' => $products,
        'categories' => $categories,
        'userCoupons' => $userCoupons,
        'cartItems' => $cartItems,
    ]);
})->name('home');

Route::prefix('{current_team}')
    ->middleware(['auth', 'verified', EnsureTeamMembership::class])
    ->group(function () {
        Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    });

Route::middleware(['auth'])->group(function () {
    Route::get('invitations/{invitation}/accept', [TeamInvitationController::class, 'accept'])->name('invitations.accept');
});

require __DIR__.'/settings.php';

// ==========================================
// E-COMMERCE CORE SUITE ROUTES
// ==========================================
use App\Http\Controllers\MembershipController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\StockController;
use App\Http\Controllers\CouponController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\Admin\PaymentChannelController;

// Midtrans Payment Webhook Callback (Exclude CSRF Verification)
Route::post('payment/callback', [OrderController::class, 'callback'])
    ->name('payment.callback');

Route::middleware(['auth', 'verified'])->group(function () {
    // 1. Catalog Products (Authenticated Users)
    Route::get('products', [ProductController::class, 'index'])->name('products.index');
    Route::get('products/{product}', [ProductController::class, 'show'])->name('products.show');

    // 2. Customer Member Actions
    Route::get('membership', [MembershipController::class, 'index'])->name('membership.index');
    Route::post('membership/register', [MembershipController::class, 'register'])->name('membership.register');
    
    Route::get('coupons', [CouponController::class, 'index'])->name('coupons.index');
    Route::post('coupons/{id}/redeem', [CouponController::class, 'redeem'])->name('coupons.redeem');

    Route::get('orders', [OrderController::class, 'index'])->name('orders.index');
    Route::get('orders/{id}', [OrderController::class, 'show'])->name('orders.show');
    Route::post('orders/checkout', [OrderController::class, 'checkout'])->name('orders.checkout');

    // Checkout page
    Route::get('checkout', [CheckoutController::class, 'index'])->name('checkout.index');

    // Persistent Shopping Cart Actions
    Route::post('cart', [\App\Http\Controllers\CartController::class, 'add'])->name('cart.add');
    Route::patch('cart/{id}', [\App\Http\Controllers\CartController::class, 'update'])->name('cart.update');
    Route::delete('cart/{id}', [\App\Http\Controllers\CartController::class, 'remove'])->name('cart.remove');

    Route::post('reviews', [ReviewController::class, 'store'])->name('reviews.store');

    // 3. Admin & Owner Dashboard Operations
    Route::middleware(['role:admin|owner'])->group(function () {
        // Read stock/opname history
        Route::get('stock/movements', [StockController::class, 'movements'])->name('stock.movements');
        Route::get('stock/opnames', [StockController::class, 'opnameIndex'])->name('stock.opname.index');
        Route::get('stock/opnames/{id}', [StockController::class, 'showOpname'])->name('stock.opname.show');
        
        // Review list & replies
        Route::get('reviews', [ReviewController::class, 'index'])->name('reviews.index');

        // Admin Payment Channels
        Route::get('admin/payment-channels', [PaymentChannelController::class, 'index'])->name('admin.payment-channels.index');
        Route::put('admin/payment-channels/{paymentChannel}', [PaymentChannelController::class, 'update'])->name('admin.payment-channels.update');
    });

    Route::middleware(['role:admin'])->group(function () {
        // Admin Product CRUD
        Route::post('products', [ProductController::class, 'store'])->name('products.store');
        Route::put('products/{product}', [ProductController::class, 'update'])->name('products.update');
        Route::delete('products/{product}', [ProductController::class, 'destroy'])->name('products.destroy');

        // Admin Stock Adjustments & Opname Count Reconciliation
        Route::post('stock/opnames', [StockController::class, 'storeOpname'])->name('stock.opname.store');
        Route::post('stock/opnames/{id}/complete', [StockController::class, 'completeOpname'])->name('stock.opname.complete');
        Route::post('stock/adjust', [StockController::class, 'adjustStock'])->name('stock.adjust');

        // Admin Coupons CRUD
        Route::post('coupons', [CouponController::class, 'store'])->name('coupons.store');
        Route::delete('coupons/{id}', [CouponController::class, 'destroy'])->name('coupons.destroy');

        // Admin Review replies
        Route::post('reviews/{id}/reply', [ReviewController::class, 'reply'])->name('reviews.reply');
    });
});

