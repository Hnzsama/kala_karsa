<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use App\Models\Coupon;
use App\Models\UserCoupon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

it('renders the welcome page for guests with seeded products and categories', function () {
    // 1. Arrange: Create category and products
    $category = Category::factory()->create([
        'name' => 'Fashion',
        'slug' => 'fashion',
    ]);

    $product = Product::factory()->create([
        'category_id' => $category->id,
        'name' => 'Fancy Shoes',
        'price' => 150000,
        'is_active' => true,
    ]);

    // 2. Act: Visit welcome page
    $response = $this->get(route('home'));

    // 3. Assert
    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->component('welcome')
        ->has('products', 1)
        ->has('categories', 1)
        ->has('userCoupons', 0)
        ->where('products.0.name', 'Fancy Shoes')
        ->where('categories.0.slug', 'fashion')
    );
});

it('renders the welcome page for logged in customers and shows their coupons', function () {
    // 1. Arrange: Create a customer user
    $customer = User::factory()->create([
        'name' => 'Dewi',
        'email' => 'dewi@example.com',
        'member_status' => 'silver',
    ]);

    // Create coupon
    $coupon = Coupon::create([
        'code' => 'DISC50',
        'name' => 'Diskon 50% Gede-Gedean',
        'discount_type' => 'percentage',
        'discount_value' => 50,
        'min_purchase' => 100000,
        'points_required' => 5,
        'expires_at' => now()->addDays(7),
        'is_active' => true,
    ]);

    // Link coupon to customer
    $userCoupon = UserCoupon::create([
        'user_id' => $customer->id,
        'coupon_id' => $coupon->id,
        'redeemed_at' => now(),
        'status' => 'active',
    ]);

    // 2. Act: Log in and visit welcome page
    $response = $this->actingAs($customer)->get(route('home'));

    // 3. Assert
    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->component('welcome')
        ->has('userCoupons', 1)
        ->where('userCoupons.0.coupon.code', 'DISC50')
    );
});

it('redirects guests to login during checkout', function () {
    // Act
    $response = $this->postJson('/orders/checkout', [
        'cart' => [
            ['product_id' => 1, 'quantity' => 1]
        ]
    ]);

    // Assert: Unauthenticated
    $response->assertStatus(401);
});
