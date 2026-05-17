<?php

use App\Models\Coupon;
use App\Models\Product;
use App\Models\User;
use App\Models\UserCoupon;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\StockMovement;
use App\Models\StockOpname;
use App\Services\TransactionService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Seed standard roles and Spatie permissions
    $this->seed(RolesAndPermissionsSeeder::class);

    // Create users with appropriate roles for testing
    $this->admin = User::factory()->create();
    $this->admin->assignRole('admin');

    $this->owner = User::factory()->create();
    $this->owner->assignRole('owner');

    $this->customer = User::factory()->create();
    $this->customer->assignRole('customer');
});

// ==========================================
// 1. ROLE-BASED ACCESS CONTROL TESTS
// ==========================================

test('customer is forbidden from managing catalog products', function () {
    $product = Product::factory()->create([
        'name' => 'Original Sneaker',
        'price' => 150000,
        'stock' => 10,
    ]);

    $this->actingAs($this->customer)
        ->post(route('products.store'), [
            'name' => 'New Sneaker',
            'sku' => 'SNK-100',
            'price' => 100000,
            'stock' => 10,
        ])
        ->assertForbidden();

    $this->actingAs($this->customer)
        ->delete(route('products.destroy', $product->id))
        ->assertForbidden();
});

test('owner can read but is forbidden from modifying products', function () {
    $product = Product::factory()->create([
        'name' => 'Original Sneaker',
        'price' => 150000,
        'stock' => 10,
    ]);

    // Can read
    $this->actingAs($this->owner)
        ->get(route('products.index'))
        ->assertSuccessful();

    // Cannot write
    $this->actingAs($this->owner)
        ->post(route('products.store'), [
            'name' => 'New Sneaker',
            'sku' => 'SNK-100',
            'price' => 100000,
            'stock' => 10,
        ])
        ->assertForbidden();

    // Cannot delete
    $this->actingAs($this->owner)
        ->delete(route('products.destroy', $product->id))
        ->assertForbidden();
});

test('admin can manage catalog products', function () {
    $this->actingAs($this->admin)
        ->post(route('products.store'), [
            'name' => 'Elite Boots',
            'sku' => 'BTS-777',
            'price' => 250000,
            'stock' => 20,
            'is_active' => true,
        ])
        ->assertRedirect(route('products.index'));

    $this->assertDatabaseHas('products', [
        'sku' => 'BTS-777',
        'price' => 250000,
    ]);
});

test('product cover accessor handles file upload paths and default fallbacks', function () {
    // 1. Check fallback when cover is null
    $p1 = Product::factory()->create(['cover' => null]);
    expect($p1->cover_url)->toBe('https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop');

    // 2. Check when cover is an absolute URL
    $p2 = Product::factory()->create(['cover' => 'https://example.com/custom-sneaker.jpg']);
    expect($p2->cover_url)->toBe('https://example.com/custom-sneaker.jpg');

    // 3. Check when cover is a local uploaded path
    $p3 = Product::factory()->create(['cover' => 'covers/sneaker-1.jpg']);
    expect($p3->cover_url)->toBe(asset('storage/covers/sneaker-1.jpg'));
});

// ==========================================
// 2. MEMBERSHIP REGISTRATION & POINT WALLET
// ==========================================

test('customer can register as a store member and earns active status', function () {
    $this->customer->refresh();
    expect($this->customer->isMember())->toBeFalse();
    expect($this->customer->member_status)->toBe('non-member');

    $this->actingAs($this->customer)
        ->post(route('membership.register'), [
            'phone_number' => '081234567890',
        ])
        ->assertRedirect();

    $this->customer->refresh();

    expect($this->customer->isMember())->toBeTrue();
    expect($this->customer->member_status)->toBe('active');
    expect($this->customer->phone_number)->toBe('081234567890');
});

// ==========================================
// 3. POINTS EXCHANGE FOR COUPON REWARDS
// ==========================================

test('member can exchange accumulated rewards points for discount coupons', function () {
    // 1. Upgrade customer to member and give points
    $this->customer->registerAsMember('081234567890');
    $this->customer->addPoints(500);

    // 2. Create coupon reward template
    $coupon = Coupon::create([
        'code' => 'DISC50K',
        'name' => '50K Off Coupon',
        'discount_type' => 'fixed',
        'discount_value' => 50000,
        'points_required' => 200,
        'min_purchase' => 100000,
        'is_active' => true,
    ]);

    // 3. Redeem points
    $this->actingAs($this->customer)
        ->post(route('coupons.redeem', $coupon->id))
        ->assertRedirect();

    $this->customer->refresh();

    // Check points decreased and coupon added to wallet
    expect($this->customer->member_points)->toBe(300);
    $this->assertDatabaseHas('user_coupons', [
        'user_id' => $this->customer->id,
        'coupon_id' => $coupon->id,
        'status' => 'active',
    ]);
});

// ==========================================
// 4. CHECKOUT SNAPSHOTS & MIDTRANS INTEGRATION
// ==========================================

test('checkout creates order with historical snapshots and calls midtrans snap', function () {
    // Fake Midtrans HTTP Client response
    Http::fake([
        'app.sandbox.midtrans.com/snap/v1/transactions' => Http::response([
            'token' => 'snap-token-12345',
            'redirect_url' => 'https://app.sandbox.midtrans.com/snap/v1/redirect-12345',
        ], 201),
    ]);

    // Create a payment channel
    $channel = \App\Models\PaymentChannel::create([
        'code' => 'bca_va',
        'name' => 'BCA Virtual Account',
        'type' => 'VIRTUAL_ACCOUNT',
        'fee_flat' => 4000,
        'fee_percent' => 0,
        'is_active' => true,
    ]);

    // Upgrade customer and redeem coupon
    $this->customer->registerAsMember('081234567890');
    $this->customer->addPoints(100);

    $coupon = Coupon::create([
        'code' => 'PROMO10',
        'name' => '10% Discount',
        'discount_type' => 'percentage',
        'discount_value' => 10,
        'points_required' => 50,
        'min_purchase' => 50000,
        'is_active' => true,
    ]);

    $userCoupon = UserCoupon::create([
        'user_id' => $this->customer->id,
        'coupon_id' => $coupon->id,
        'redeemed_at' => now(),
        'status' => 'active',
    ]);

    // Create products in catalog
    $p1 = Product::factory()->create([
        'name' => 'Super Running Shoe',
        'sku' => 'RUN-001',
        'price' => 100000,
        'stock' => 10,
        'metadata' => ['brand' => 'Nike', 'color' => 'Blue'],
        'is_active' => true,
    ]);

    $response = $this->actingAs($this->customer)
        ->post(route('orders.checkout'), [
            'cart' => [
                ['product_id' => $p1->id, 'quantity' => 2],
            ],
            'user_coupon_id' => $userCoupon->id,
            'payment_channel_code' => 'bca_va',
            'notes' => 'Ship to main office.',
        ]);

    $order = Order::query()->latest()->first();
    $response->assertRedirect(route('orders.show', ['id' => $order->id]));

    // Assert order was recorded with discount and snapshot
    $order = Order::query()->latest()->first();
    expect($order)->not->toBeNull();
    expect((float) $order->total_amount)->toBe(184000.00); // 200,000 - 10% discount (20,000) + admin fee (4,000)
    expect((float) $order->discount_amount)->toBe(20000.00);
    expect((float) $order->admin_fee)->toBe(4000.00);
    expect($order->payment_channel_code)->toBe('bca_va');
    expect($order->payment_method)->toBe('BCA Virtual Account');
    expect($order->customer_snapshot)->toBe([
        'name' => $this->customer->name,
        'email' => $this->customer->email,
        'phone_number' => '081234567890',
        'member_status' => 'active',
    ]);

    // Check order items and catalog snapshots
    $item = OrderItem::query()->firstWhere('order_id', $order->id);
    expect($item)->not->toBeNull();
    expect($item->quantity)->toBe(2);
    expect((float) $item->price)->toBe(100000.00);
    
    expect($item->product_snapshot['name'])->toBe('Super Running Shoe');
    expect($item->product_snapshot['sku'])->toBe('RUN-001');
    expect((float) $item->product_snapshot['price'])->toBe(100000.00);
    expect($item->product_snapshot['metadata'])->toBe(['brand' => 'Nike', 'color' => 'Blue']);
});

test('checkout succeeds when customer phone number is null or empty', function () {
    // Fake Midtrans HTTP Client response
    Http::fake([
        'app.sandbox.midtrans.com/snap/v1/transactions' => Http::response([
            'token' => 'snap-token-67890',
            'redirect_url' => 'https://app.sandbox.midtrans.com/snap/v1/redirect-67890',
        ], 201),
    ]);

    // Ensure payment channel exists (avoid duplicates)
    \App\Models\PaymentChannel::firstOrCreate(
        ['code' => 'bca_va'],
        [
            'name' => 'BCA Virtual Account',
            'type' => 'VIRTUAL_ACCOUNT',
            'fee_flat' => 4000,
            'fee_percent' => 0,
            'is_active' => true,
        ]
    );

    // Set phone number to null for customer
    $this->customer->update([
        'phone_number' => null,
    ]);

    // Create product
    $p1 = Product::factory()->create([
        'name' => 'Regular Cap',
        'sku' => 'CAP-001',
        'price' => 50000,
        'stock' => 5,
        'is_active' => true,
    ]);

    $response = $this->actingAs($this->customer)
        ->post(route('orders.checkout'), [
            'cart' => [
                ['product_id' => $p1->id, 'quantity' => 1],
            ],
            'payment_channel_code' => 'bca_va',
        ]);

    $order = Order::query()->latest()->first();
    $response->assertRedirect(route('orders.show', ['id' => $order->id]));

    // Assert order was recorded
    $order = Order::query()->latest()->first();
    expect($order)->not->toBeNull();
    expect($order->customer_snapshot['phone_number'])->toBeNull();
});

// ==========================================
// 5. PAYMENT NOTIFICATION WEBHOOK SIGNATURES
// ==========================================

test('midtrans callback with correct signature completes order and awards points', function () {
    $this->customer->registerAsMember('081234567890');

    $p1 = Product::factory()->create([
        'name' => 'Gamer Keyboard',
        'price' => 150000,
        'stock' => 10,
    ]);

    $order = Order::create([
        'order_number' => 'ORD-123',
        'user_id' => $this->customer->id,
        'status' => 'pending',
        'total_amount' => 150000,
        'discount_amount' => 0,
        'points_used' => 0,
        'points_earned' => 15, // 150,000 / 10,000 = 15 points
        'customer_snapshot' => [],
    ]);

    OrderItem::create([
        'order_id' => $order->id,
        'product_id' => $p1->id,
        'quantity' => 1,
        'price' => 150000,
        'product_snapshot' => [],
    ]);

    // Calculate valid SHA512 signature key for webhook
    $serverKey = config('services.midtrans.server_key', '');
    $signature = hash('sha512', 'ORD-123' . '200' . '150000' . $serverKey);

    $this->postJson(route('payment.callback'), [
        'order_id' => 'ORD-123',
        'status_code' => '200',
        'gross_amount' => '150000',
        'signature_key' => $signature,
        'transaction_status' => 'settlement',
        'payment_type' => 'gopay',
    ])
    ->assertSuccessful()
    ->assertJson(['status' => 'OK']);

    // Check order paid, stock decreased, and points awarded
    $order->refresh();
    $p1->refresh();
    $this->customer->refresh();

    expect($order->status)->toBe('paid');
    expect($order->payment_status)->toBe('settlement');
    expect($order->payment_method)->toBe('gopay');
    expect($p1->stock)->toBe(9);
    expect($this->customer->member_points)->toBe(15);

    // Assert a stock movement is added to ledger
    $this->assertDatabaseHas('stock_movements', [
        'product_id' => $p1->id,
        'quantity' => -1,
        'type' => 'purchase',
        'reference_id' => $order->id,
    ]);
});

// ==========================================
// 6. STOCK MOVEMENTS & OPNAME RECONCILIATIONS
// ==========================================

test('admin can complete stock opname reconciling physical counts', function () {
    $p1 = Product::factory()->create([
        'name' => 'Warehouse Laptop',
        'price' => 5000000,
        'stock' => 10,
    ]);

    $p2 = Product::factory()->create([
        'name' => 'Warehouse Monitor',
        'price' => 2000000,
        'stock' => 5,
    ]);

    // Register opname draft via controller
    $this->actingAs($this->admin)
        ->post(route('stock.opname.store'), [
            'notes' => 'Annual physical count',
            'items' => [
                ['product_id' => $p1->id, 'actual_stock' => 8], // -2 discrepancy
                ['product_id' => $p2->id, 'actual_stock' => 7], // +2 discrepancy
            ],
        ])
        ->assertRedirect();

    $opname = StockOpname::query()->latest()->first();
    expect($opname)->not->toBeNull();
    expect($opname->status)->toBe('draft');

    // Complete the opname count to reconcile
    $this->actingAs($this->admin)
        ->post(route('stock.opname.complete', $opname->id))
        ->assertRedirect();

    $opname->refresh();
    $p1->refresh();
    $p2->refresh();

    expect($opname->status)->toBe('completed');
    expect($p1->stock)->toBe(8); // Reconciled to actual
    expect($p2->stock)->toBe(7); // Reconciled to actual

    // Validate audited movements
    $this->assertDatabaseHas('stock_movements', [
        'product_id' => $p1->id,
        'quantity' => -2,
        'type' => 'opname_adjustment',
        'reference_id' => $opname->id,
    ]);

    $this->assertDatabaseHas('stock_movements', [
        'product_id' => $p2->id,
        'quantity' => 2,
        'type' => 'opname_adjustment',
        'reference_id' => $opname->id,
    ]);
});

// ==========================================
// 7. INTERACTIVE REVIEWS & FEEDBACK TESTS
// ==========================================

test('admin and owner can view reviews list and write administrative merchant replies', function () {
    $product = Product::factory()->create(['name' => 'Review Laptop', 'price' => 1000000]);
    $order = Order::create([
        'order_number' => 'REV-ORD-11',
        'user_id' => $this->customer->id,
        'status' => 'paid',
        'total_amount' => 1000000,
        'discount_amount' => 0,
        'points_used' => 0,
        'points_earned' => 10,
        'customer_snapshot' => ['name' => $this->customer->name, 'email' => $this->customer->email]
    ]);
    
    $orderItem = OrderItem::create([
        'order_id' => $order->id,
        'product_id' => $product->id,
        'quantity' => 1,
        'price' => 1000000,
        'product_snapshot' => ['name' => $product->name, 'sku' => $product->sku, 'price' => $product->price]
    ]);

    // Create a review
    $review = \App\Models\Review::create([
        'product_id' => $product->id,
        'user_id' => $this->customer->id,
        'order_item_id' => $orderItem->id,
        'rating' => 4,
        'comment' => 'Barang sangat bagus dan berkualitas!',
    ]);

    // Admin can see the reviews index
    $this->actingAs($this->admin)
        ->get(route('reviews.index'))
        ->assertSuccessful();

    // Owner can also see the reviews index
    $this->actingAs($this->owner)
        ->get(route('reviews.index'))
        ->assertSuccessful();

    // Admin can write reply
    $this->actingAs($this->admin)
        ->post(route('reviews.reply', $review->id), [
            'reply' => 'Terima kasih atas masukannya, Kak! Kami senang Anda puas.',
        ])
        ->assertRedirect();

    $review->refresh();
    expect($review->reply)->toBe('Terima kasih atas masukannya, Kak! Kami senang Anda puas.');
});

test('customer can submit review for purchased items but is restricted from reviews management', function () {
    $product = Product::factory()->create(['name' => 'Review Laptop', 'price' => 1000000]);
    $order = Order::create([
        'order_number' => 'REV-ORD-12',
        'user_id' => $this->customer->id,
        'status' => 'paid',
        'total_amount' => 1000000,
        'discount_amount' => 0,
        'points_used' => 0,
        'points_earned' => 10,
        'customer_snapshot' => ['name' => $this->customer->name, 'email' => $this->customer->email]
    ]);
    
    $orderItem = OrderItem::create([
        'order_id' => $order->id,
        'product_id' => $product->id,
        'quantity' => 1,
        'price' => 1000000,
        'product_snapshot' => ['name' => $product->name, 'sku' => $product->sku, 'price' => $product->price]
    ]);

    // Customer should not access the reviews list dashboard
    $this->actingAs($this->customer)
        ->get(route('reviews.index'))
        ->assertForbidden();

    // Customer can submit feedback review
    $this->actingAs($this->customer)
        ->post(route('reviews.store'), [
            'order_item_id' => $orderItem->id,
            'rating' => 5,
            'comment' => 'Recommended product! Sangat cepat pengirimannya.',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('reviews', [
        'product_id' => $product->id,
        'user_id' => $this->customer->id,
        'rating' => 5,
        'comment' => 'Recommended product! Sangat cepat pengirimannya.',
    ]);
});

