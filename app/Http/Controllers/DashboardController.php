<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Models\UserCoupon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Render the dashboard page with live analytics stats.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        if ($user->hasRole('admin') || $user->hasRole('owner')) {
            // 1. Admin/Owner stats
            $totalRevenue = Order::query()->where('status', 'paid')->sum('total_amount');
            $totalOrders = Order::query()->count();
            $totalMembers = User::query()->where('member_status', 'active')->count();
            $totalProducts = Product::query()->count();
            $lowStockCount = Product::query()->where('stock', '<=', 5)->count();

            // Recent Orders
            $recentOrders = Order::query()->with('user')
                ->latest()
                ->limit(5)
                ->get()
                ->map(function ($order) {
                    return [
                        'id' => $order->id,
                        'order_number' => $order->order_number,
                        'customer_name' => $order->user ? $order->user->name : ($order->customer_snapshot['name'] ?? 'Guest'),
                        'status' => $order->status,
                        'total_amount' => $order->total_amount,
                        'created_at' => $order->created_at->toISOString(),
                    ];
                });

            // Database-agnostic monthly sales data (last 6 months) grouped in PHP
            $sixMonthsAgo = now()->subMonths(6)->startOfMonth();
            
            $salesDataRaw = Order::query()
                ->where('status', 'paid')
                ->where('created_at', '>=', $sixMonthsAgo)
                ->orderBy('created_at', 'asc')
                ->get();

            $salesData = $salesDataRaw->groupBy(function ($order) {
                return $order->created_at->format('M Y');
            })->map(function ($orders, $month) {
                return [
                    'month' => $month,
                    'revenue' => (float) $orders->sum('total_amount'),
                    'orders' => $orders->count(),
                ];
            })->values();

            // If sales data is empty, populate some dummy elements or let it be empty
            if ($salesData->isEmpty()) {
                $salesData = collect([
                    ['month' => 'Jan 2026', 'revenue' => 0.0, 'orders' => 0],
                    ['month' => 'Feb 2026', 'revenue' => 0.0, 'orders' => 0],
                    ['month' => 'Mar 2026', 'revenue' => 0.0, 'orders' => 0],
                    ['month' => 'Apr 2026', 'revenue' => 0.0, 'orders' => 0],
                    ['month' => 'May 2026', 'revenue' => 0.0, 'orders' => 0],
                ]);
            }

            // Popular Payment Methods / Channels Chart Data
            $paymentDataRaw = Order::query()
                ->where('status', 'paid')
                ->get();

            $paymentData = $paymentDataRaw->groupBy('payment_method')
                ->map(function ($orders, $channel) {
                    $channelName = empty($channel) ? 'Lainnya' : match ($channel) {
                        'bank_transfer' => 'Bank Transfer',
                        'gopay' => 'GoPay',
                        'shopeepay' => 'ShopeePay',
                        'qris' => 'QRIS',
                        default => ucfirst(str_replace('_', ' ', $channel)),
                    };
                    return [
                        'channel' => $channelName,
                        'count' => $orders->count(),
                    ];
                })->values();

            return Inertia::render('dashboard', [
                'stats' => [
                    'totalRevenue' => (float) $totalRevenue,
                    'totalOrders' => $totalOrders,
                    'totalMembers' => $totalMembers,
                    'totalProducts' => $totalProducts,
                    'lowStockCount' => $lowStockCount,
                    'recentOrders' => $recentOrders,
                    'salesData' => $salesData,
                    'paymentData' => $paymentData,
                ],
            ]);
        }

        // 2. Customer/Member stats
        $myPoints = $user->member_points;
        $myTotalOrders = Order::query()->where('user_id', $user->id)->count();
        $myPendingOrders = Order::query()->where('user_id', $user->id)->where('status', 'pending')->count();
        $myCoupons = UserCoupon::query()->where('user_id', $user->id)->where('status', 'unused')->count();

        $myRecentOrders = Order::query()->where('user_id', $user->id)
            ->latest()
            ->limit(3)
            ->get()
            ->map(function ($order) {
                return [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'status' => $order->status,
                    'total_amount' => $order->total_amount,
                    'created_at' => $order->created_at->toISOString(),
                ];
            });

        return Inertia::render('dashboard', [
            'stats' => [
                'myPoints' => $myPoints,
                'myTotalOrders' => $myTotalOrders,
                'myPendingOrders' => $myPendingOrders,
                'myCoupons' => $myCoupons,
                'myRecentOrders' => $myRecentOrders,
            ],
        ]);
    }
}
