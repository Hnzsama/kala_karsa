<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display a listing of the products.
     * Supports search and metadata JSON filters.
     */
    public function index(Request $request): Response
    {
        $query = Product::query();

        // 1. Authorization: Only Admins/Owners can see inactive products
        $user = $request->user();
        if (! $user || ! ($user->can('view all data') || $user->hasRole('admin') || $user->hasRole('owner'))) {
            $query->active();
        }

        // 2. Broad text search across Name, SKU, Description, and Metadata
        if ($request->filled('search')) {
            $query->search((string) $request->input('search'));
        }

        // 3. High-performance JSON metadata filtering (e.g. category, brand, size, color)
        $metadataFilters = ['brand', 'category', 'size', 'color', 'tags'];
        foreach ($metadataFilters as $filter) {
            if ($request->filled($filter)) {
                $query->searchMetadata($filter, $request->input($filter));
            }
        }

        $products = $query->latest()->paginate(12)->withQueryString();

        return Inertia::render('products/index', [
            'products' => $products,
            'filters' => $request->only(['search', 'brand', 'category', 'size', 'color']),
        ]);
    }

    /**
     * Store a newly created product in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        // Require admin permission to modify catalogs
        if (! $request->user()->can('manage catalog')) {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'sku' => ['required', 'string', 'unique:products,sku', 'max:100'],
            'description' => ['nullable', 'string'],
            'cover' => ['nullable'],
            'price' => ['required', 'numeric', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
            'metadata' => ['nullable', 'array'],
            'is_active' => ['boolean'],
        ]);

        $validated['slug'] = Str::slug($validated['name']) . '-' . Str::random(5);

        if ($request->hasFile('cover')) {
            $validated['cover'] = $request->file('cover')->store('covers', 'public');
        }

        Product::create($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Product created successfully.')]);

        return redirect()->route('products.index');
    }

    /**
     * Display the specified product.
     */
    public function show(Product $product): Response
    {
        return Inertia::render('products/show', [
            'product' => $product->load(['reviews.user']),
        ]);
    }

    /**
     * Update the specified product in storage.
     */
    public function update(Request $request, Product $product): RedirectResponse
    {
        // Require admin permission to modify catalogs
        if (! $request->user()->can('manage catalog')) {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'sku' => ['required', 'string', 'max:100', 'unique:products,sku,' . $product->id],
            'description' => ['nullable', 'string'],
            'cover' => ['nullable'],
            'price' => ['required', 'numeric', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
            'metadata' => ['nullable', 'array'],
            'is_active' => ['boolean'],
        ]);

        if ($request->hasFile('cover')) {
            // Delete old cover file if it exists and is local
            if ($product->cover && !filter_var($product->cover, FILTER_VALIDATE_URL)) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($product->cover);
            }
            $validated['cover'] = $request->file('cover')->store('covers', 'public');
        }

        $product->update($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Product updated successfully.')]);

        return redirect()->back();
    }

    /**
     * Remove the specified product from storage (soft deletes).
     */
    public function destroy(Request $request, Product $product): RedirectResponse
    {
        // Require admin permission to modify catalogs
        if (! $request->user()->can('manage catalog')) {
            abort(403, 'Unauthorized action.');
        }

        Product::query()->where('id', $product->id)->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Product deleted successfully.')]);

        return redirect()->route('products.index');
    }
}
