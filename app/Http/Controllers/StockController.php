<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\StockMovement;
use App\Models\StockOpname;
use App\Models\StockOpnameItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class StockController extends Controller
{
    /**
     * Display a listing of stock movements (Audit Ledger).
     */
    public function movements(Request $request): Response
    {
        if (! $request->user()->can('view all data')) {
            abort(403, 'Unauthorized action.');
        }

        $query = StockMovement::with(['product', 'user']);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('notes', 'like', "%{$search}%")
                  ->orWhere('type', 'like', "%{$search}%")
                  ->orWhereHas('product', function ($pq) use ($search) {
                      $pq->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%");
                  })
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        $movements = $query->latest()->paginate(15)->withQueryString();

        $products = Product::query()
            ->select(['id', 'name', 'sku', 'stock'])
            ->orderBy('name')
            ->get();

        return Inertia::render('stock/movements', [
            'movements' => $movements,
            'products' => $products,
            'filters' => [
                'search' => $request->input('search', ''),
            ],
        ]);
    }

    /**
     * Display a listing of stock opname records.
     */
    public function opnameIndex(Request $request): Response
    {
        if (! $request->user()->can('view all data')) {
            abort(403, 'Unauthorized action.');
        }

        $query = StockOpname::with(['creator']);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('opname_number', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%")
                  ->orWhereHas('creator', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        $opnames = $query->latest()->paginate(15)->withQueryString();

        $products = Product::query()
            ->select(['id', 'name', 'sku', 'stock'])
            ->orderBy('name')
            ->get();

        return Inertia::render('stock/opname_index', [
            'opnames' => $opnames,
            'products' => $products,
            'filters' => [
                'search' => $request->input('search', ''),
            ],
        ]);
    }

    /**
     * Create and start a new Stock Opname count in draft status (Admin Only).
     */
    public function storeOpname(Request $request): RedirectResponse
    {
        if (! $request->user()->can('manage inventory')) {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.actual_stock' => ['required', 'integer', 'min:0'],
        ]);

        $opname = DB::transaction(function () use ($validated) {
            $number = 'SO-' . date('Ymd') . '-' . strtoupper(bin2hex(random_bytes(2)));

            // 1. Create Opname parent
            $opname = StockOpname::create([
                'opname_number' => $number,
                'status' => 'draft',
                'notes' => $validated['notes'] ?? null,
                'created_by' => Auth::id(),
            ]);

            // 2. Add each item comparison line
            foreach ($validated['items'] as $item) {
                $product = Product::findOrFail($item['product_id']);
                $systemStock = $product->stock;
                $actualStock = (int) $item['actual_stock'];
                $difference = $actualStock - $systemStock;

                StockOpnameItem::create([
                    'stock_opname_id' => $opname->id,
                    'product_id' => $product->id,
                    'system_stock' => $systemStock,
                    'actual_stock' => $actualStock,
                    'difference' => $difference,
                    'notes' => $item['notes'] ?? null,
                ]);
            }

            return $opname;
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __("Stock Opname draft {$opname->opname_number} registered.")]);

        return redirect()->route('stock.opname.show', $opname->id);
    }

    /**
     * Display details of a specific stock opname count.
     */
    public function showOpname(Request $request, int $id): Response
    {
        if (! $request->user()->can('view all data')) {
            abort(403, 'Unauthorized action.');
        }

        $opname = StockOpname::with(['creator', 'items.product'])->findOrFail($id);

        return Inertia::render('stock/opname_show', [
            'opname' => $opname,
        ]);
    }

    /**
     * Submit and complete a stock opname audit (Admin Only).
     * Reconciles stock in catalogs and records stock movement logs.
     */
    public function completeOpname(Request $request, int $id): RedirectResponse
    {
        if (! $request->user()->can('manage inventory')) {
            abort(403, 'Unauthorized action.');
        }

        $opname = StockOpname::findOrFail($id);

        try {
            $opname->complete();
            Inertia::flash('toast', ['type' => 'success', 'message' => __('Stock Opname completed and catalog stock reconciled successfully.')]);
        } catch (\Exception $e) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $e->getMessage()]);
        }

        return redirect()->back();
    }

    /**
     * Process a simple one-off stock adjustment (e.g. Restock or Damaged goods) directly (Admin Only).
     */
    public function adjustStock(Request $request): RedirectResponse
    {
        if (! $request->user()->can('manage inventory')) {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'quantity' => ['required', 'integer', 'not_in:0'], // Positive to restock, negative to deduct
            'type' => ['required', 'string', 'in:restock,damaged,return'],
            'notes' => ['nullable', 'string', 'max:255'],
        ]);

        DB::transaction(function () use ($validated) {
            $product = Product::findOrFail($validated['product_id']);
            
            // Adjust catalog stock
            $product->update([
                'stock' => $product->stock + $validated['quantity'],
            ]);

            // Log movement
            StockMovement::create([
                'product_id' => $product->id,
                'quantity' => $validated['quantity'],
                'type' => $validated['type'],
                'notes' => $validated['notes'] ?? 'Manual one-off adjustment.',
                'user_id' => Auth::id(),
            ]);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Stock manual adjustment recorded successfully.')]);

        return redirect()->back();
    }
}
