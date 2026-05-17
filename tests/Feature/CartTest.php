<?php

use App\Models\CartItem;
use App\Models\Product;
use App\Models\User;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

it('prevents guests from adding items to cart', function () {
    $product = Product::factory()->create(['stock' => 10]);

    $response = $this->postJson(route('cart.add'), [
        'product_id' => $product->id,
        'quantity' => 1,
    ]);

    $response->assertStatus(401);
});

it('allows authenticated users to add items to persistent database cart', function () {
    $user = User::factory()->create();
    $product = Product::factory()->create([
        'name' => 'Premium Shirt',
        'stock' => 5,
    ]);

    $response = $this->actingAs($user)->post(route('cart.add'), [
        'product_id' => $product->id,
        'quantity' => 2,
    ]);

    $response->assertStatus(302); // Redirect back
    $this->assertDatabaseHas('cart_items', [
        'user_id' => $user->id,
        'product_id' => $product->id,
        'quantity' => 2,
    ]);
});

it('increments quantity when adding same product multiple times', function () {
    $user = User::factory()->create();
    $product = Product::factory()->create([
        'stock' => 10,
    ]);

    // First add
    $this->actingAs($user)->post(route('cart.add'), [
        'product_id' => $product->id,
        'quantity' => 2,
    ]);

    // Second add
    $this->actingAs($user)->post(route('cart.add'), [
        'product_id' => $product->id,
        'quantity' => 3,
    ]);

    $this->assertDatabaseHas('cart_items', [
        'user_id' => $user->id,
        'product_id' => $product->id,
        'quantity' => 5,
    ]);
});

it('caps quantity to available stock when adding or updating', function () {
    $user = User::factory()->create();
    $product = Product::factory()->create([
        'stock' => 3,
    ]);

    // Try to add 5 items
    $this->actingAs($user)->post(route('cart.add'), [
        'product_id' => $product->id,
        'quantity' => 5,
    ]);

    $this->assertDatabaseHas('cart_items', [
        'user_id' => $user->id,
        'product_id' => $product->id,
        'quantity' => 3, // Capped to stock
    ]);
});

it('allows authenticated users to update cart item quantity', function () {
    $user = User::factory()->create();
    $product = Product::factory()->create(['stock' => 10]);
    
    $cartItem = CartItem::create([
        'user_id' => $user->id,
        'product_id' => $product->id,
        'quantity' => 2,
    ]);

    $response = $this->actingAs($user)->patch(route('cart.update', $cartItem->id), [
        'quantity' => 5,
    ]);

    $response->assertStatus(302);
    $this->assertDatabaseHas('cart_items', [
        'id' => $cartItem->id,
        'quantity' => 5,
    ]);
});

it('allows authenticated users to remove items from cart', function () {
    $user = User::factory()->create();
    $product = Product::factory()->create();
    
    $cartItem = CartItem::create([
        'user_id' => $user->id,
        'product_id' => $product->id,
        'quantity' => 1,
    ]);

    $response = $this->actingAs($user)->delete(route('cart.remove', $cartItem->id));

    $response->assertStatus(302);
    $this->assertDatabaseMissing('cart_items', [
        'id' => $cartItem->id,
    ]);
});

it('passes persistent cart items to the welcome view', function () {
    $user = User::factory()->create();
    $product = Product::factory()->create(['name' => 'Exclusive Cap']);
    
    CartItem::create([
        'user_id' => $user->id,
        'product_id' => $product->id,
        'quantity' => 1,
    ]);

    $response = $this->actingAs($user)->get(route('home'));

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->component('welcome')
        ->has('cartItems', 1)
        ->where('cartItems.0.product.name', 'Exclusive Cap')
    );
});
