<?php

namespace App\Http\Controllers;

use App\Models\CartItem;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CartController extends Controller
{
    /**
     * Add a product to the persistent cart.
     */
    public function add(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'quantity' => ['nullable', 'integer', 'min:1'],
        ]);

        $user = $request->user();
        $product = Product::findOrFail($validated['product_id']);
        $qtyToAdd = $validated['quantity'] ?? 1;

        if ($product->stock <= 0) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Produk ini sedang habis stok.']);
            return redirect()->back();
        }

        // Upsert the cart item
        $cartItem = CartItem::firstOrNew([
            'user_id' => $user->id,
            'product_id' => $product->id,
        ]);

        $newQty = ($cartItem->exists ? $cartItem->quantity : 0) + $qtyToAdd;

        // Cap at product stock
        if ($newQty > $product->stock) {
            $newQty = $product->stock;
        }

        $cartItem->quantity = $newQty;
        $cartItem->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => "{$product->name} berhasil ditambahkan ke keranjang."]);
        return redirect()->back();
    }

    /**
     * Update the quantity of a cart item.
     */
    public function update(Request $request, int $id): RedirectResponse
    {
        $validated = $request->validate([
            'quantity' => ['required', 'integer', 'min:1'],
        ]);

        $user = $request->user();
        $cartItem = CartItem::where('user_id', $user->id)->findOrFail($id);
        $product = $cartItem->product;

        $newQty = $validated['quantity'];

        if ($newQty > $product->stock) {
            $newQty = $product->stock;
        }

        $cartItem->update([
            'quantity' => $newQty,
        ]);

        return redirect()->back();
    }

    /**
     * Remove a product from the persistent cart.
     */
    public function remove(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();
        $cartItem = CartItem::where('user_id', $user->id)->findOrFail($id);
        $productName = $cartItem->product->name;
        
        $cartItem->delete();

        Inertia::flash('toast', ['type' => 'info', 'message' => "{$productName} telah dihapus dari keranjang."]);
        return redirect()->back();
    }
}
