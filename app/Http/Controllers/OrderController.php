<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\UserCoupon;
use App\Models\PaymentChannel;
use App\Services\TransactionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    /**
     * The transaction service.
     */
    protected TransactionService $transactionService;

    /**
     * Inject the transaction service.
     */
    public function __construct(TransactionService $transactionService)
    {
        $this->transactionService = $transactionService;
    }

    /**
     * List orders (Customers see their own, Admins/Owners see all).
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $query = Order::query();

        if ($user->can('view all data')) {
            $query->with(['user']);
        } else {
            $query->where('user_id', $user->id);
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                  ->orWhere('customer_snapshot->name', 'like', "%{$search}%")
                  ->orWhere('customer_snapshot->email', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        $orders = $query->latest()->paginate(15)->withQueryString();

        return Inertia::render('orders/index', [
            'orders' => $orders,
            'filters' => [
                'search' => $request->input('search', ''),
            ],
        ]);
    }

    /**
     * Display a specific order details.
     */
    public function show(int $id): Response
    {
        $user = Auth::user();
        $order = Order::with(['items', 'userCoupon.coupon'])->findOrFail($id);

        // Authorization
        if (! $user->can('view all data') && $order->user_id !== $user->id) {
            abort(403, 'Unauthorized.');
        }

        return Inertia::render('orders/show', [
            'order' => $order,
            'autoPay' => (bool) session('auto_pay', false),
        ]);
    }

    /**
     * Place a checkout order and request payment token from Midtrans Snap.
     */
    public function checkout(Request $request): RedirectResponse
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        if ($user->hasRole('admin') || $user->hasRole('owner')) {
            return redirect()->to('/dashboard')->with('toast', [
                'type' => 'error',
                'message' => 'Admin dan Owner tidak diperbolehkan untuk membeli barang.',
            ]);
        }

        $validated = $request->validate([
            'cart' => ['required', 'array', 'min:1'],
            'cart.*.product_id' => ['required', 'exists:products,id'],
            'cart.*.quantity' => ['required', 'integer', 'min:1'],
            'user_coupon_id' => ['nullable', 'exists:user_coupons,id'],
            'payment_channel_code' => ['required', 'exists:payment_channels,code'],
            'notes' => ['nullable', 'string'],
        ]);

        try {
            $order = DB::transaction(function () use ($user, $validated) {
                // Load payment channel to compute exact fees
                $paymentChannel = PaymentChannel::where('code', $validated['payment_channel_code'])->firstOrFail();

                // 1. Calculate subtotal & Validate stock
                $subtotal = 0.00;
                $itemsToCreate = [];

                foreach ($validated['cart'] as $cartItem) {
                    $product = Product::findOrFail($cartItem['product_id']);
                    $qty = (int) $cartItem['quantity'];

                    if ($product->stock < $qty) {
                        throw new \Exception("Product {$product->name} is out of stock.");
                    }

                    $subtotal += (float) $product->price * $qty;
                    $itemsToCreate[] = [
                        'product' => $product,
                        'quantity' => $qty,
                        'price' => (float) $product->price,
                    ];
                }

                // 2. Validate and apply coupon if present
                $discount = 0.00;
                $userCouponId = $validated['user_coupon_id'] ?? null;
                $userCoupon = null;

                if ($userCouponId) {
                    $userCoupon = UserCoupon::query()
                        ->where('user_id', $user->id)
                        ->where('status', 'active')
                        ->findOrFail($userCouponId);

                    $coupon = $userCoupon->coupon;

                    if (! $coupon->isValidForUser($user, $subtotal)) {
                        throw new \Exception('Coupon cannot be applied to this transaction.');
                    }

                    // Calculate discount amount
                    if ($coupon->discount_type === 'percentage') {
                        $discount = $subtotal * ((float) $coupon->discount_value / 100);
                    } else {
                        $discount = (float) $coupon->discount_value;
                    }

                    // Cap discount at subtotal
                    if ($discount > $subtotal) {
                        $discount = $subtotal;
                    }

                    // Update coupon status
                    $userCoupon->update([
                        'status' => 'used',
                        'used_at' => now(),
                    ]);
                }

                // Calculate Net Subtotal and dynamic administrative fee
                $netSubtotal = $subtotal - $discount;
                $feePercentAmount = (float) $paymentChannel->fee_percent > 0 ? ($netSubtotal * ((float) $paymentChannel->fee_percent / 100)) : 0.00;
                $adminFee = (float) $paymentChannel->fee_flat + $feePercentAmount;

                // Total amount = Subtotal - Discount + Admin Fee
                $totalAmount = $netSubtotal + $adminFee;

                // 3. Points calculations: 1 point earned for every 10,000 IDR net spent (if member)
                $pointsEarned = 0;
                if ($user->isMember()) {
                    $pointsEarned = (int) floor($netSubtotal / 10000);
                }

                // 4. Create customer snapshot
                $customerSnapshot = [
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone_number' => $user->phone_number,
                    'member_status' => $user->member_status,
                ];

                $orderNumber = 'ORD-' . date('YmdHis') . '-' . rand(100, 999);

                // 5. Create Order
                $order = Order::create([
                    'order_number' => $orderNumber,
                    'user_id' => $user->id,
                    'status' => 'pending',
                    'total_amount' => $totalAmount,
                    'discount_amount' => $discount,
                    'admin_fee' => $adminFee,
                    'points_used' => $userCoupon ? $userCoupon->coupon->points_required : 0,
                    'points_earned' => $pointsEarned,
                    'user_coupon_id' => $userCouponId,
                    'payment_method' => $paymentChannel->name,
                    'payment_channel_code' => $paymentChannel->code,
                    'customer_snapshot' => $customerSnapshot,
                    'notes' => $validated['notes'] ?? null,
                ]);

                // 6. Link Order ID to user coupon
                if ($userCouponId) {
                    $userCoupon->update([
                        'order_id' => $order->id,
                    ]);
                }

                // 7. Create Order items and snapshots
                foreach ($itemsToCreate as $item) {
                    $product = $item['product'];

                    $productSnapshot = [
                        'name' => $product->name,
                        'sku' => $product->sku,
                        'price' => (float) $product->price,
                        'metadata' => $product->metadata,
                    ];

                    OrderItem::create([
                        'order_id' => $order->id,
                        'product_id' => $product->id,
                        'quantity' => $item['quantity'],
                        'price' => $item['price'],
                        'product_snapshot' => $productSnapshot,
                    ]);
                }

                // 7.5 Clear persistent database cart items
                \App\Models\CartItem::where('user_id', $user->id)->delete();

                return $order;
            });

            // 8. Contact Midtrans Snap for payment token and URL
            $snapData = $this->transactionService->createSnapTransaction($order);

            $order->update([
                'payment_token' => $snapData['token'],
                'payment_url' => $snapData['redirect_url'],
            ]);

            return redirect()->route('orders.show', ['id' => $order->id])->with('auto_pay', true);

        } catch (\Exception $e) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $e->getMessage()]);
            return redirect()->back();
        }
    }

    /**
     * Handle HTTP Webhook callback notifications from Midtrans.
     */
    public function callback(Request $request): JsonResponse
    {
        $payload = $request->all();

        // 1. Verify Midtrans secure signature key
        if (! $this->transactionService->verifyWebhookSignature($payload)) {
            Log::warning('Midtrans Webhook Callback Signature Mismatch', ['payload' => $payload]);
            return response()->json(['message' => 'Invalid signature.'], 400);
        }

        $orderNumber = $payload['order_id'] ?? '';
        $transactionStatus = $payload['transaction_status'] ?? '';
        $paymentType = $payload['payment_type'] ?? '';

        Log::info("Midtrans Callback received for order {$orderNumber}: {$transactionStatus}");

        $order = Order::query()->firstWhere('order_number', $orderNumber);

        if (! $order) {
            return response()->json(['message' => 'Order not found.'], 404);
        }

        // Map rich payment type with bank name if available
        $richPaymentMethod = $paymentType;
        if ($paymentType === 'bank_transfer' && isset($payload['va_numbers'][0]['bank'])) {
            $bank = strtoupper($payload['va_numbers'][0]['bank']);
            $richPaymentMethod = $bank . ' Virtual Account';
        } elseif ($paymentType === 'cstore' && isset($payload['store'])) {
            $richPaymentMethod = ucfirst($payload['store']);
        }

        // 2. Map status transitions
        if ($transactionStatus === 'capture' || $transactionStatus === 'settlement') {
            $order->completePayment($richPaymentMethod);
        } elseif (in_array($transactionStatus, ['deny', 'cancel', 'expire'])) {
            $order->cancelOrder();
        } elseif ($transactionStatus === 'pending') {
            $order->update([
                'payment_status' => 'pending',
            ]);
        }

        return response()->json(['status' => 'OK']);
    }
}
