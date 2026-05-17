<?php

namespace App\Http\Controllers;

use App\Models\OrderItem;
use App\Models\Review;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ReviewController extends Controller
{
    /**
     * List all customer critiques and ratings (Admin & Owner Only).
     */
    public function index(Request $request): Response
    {
        $query = Review::query()->with(['product', 'user']);

        // Search filtering: search by product name, customer name, comments or rating
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('comment', 'like', "%{$search}%")
                  ->orWhere('reply', 'like', "%{$search}%")
                  ->orWhereHas('product', function ($pq) use ($search) {
                      $pq->where('name', 'like', "%{$search}%");
                  })
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        // Rating filtering
        if ($request->filled('rating')) {
            $query->where('rating', $request->integer('rating'));
        }

        // Status filtering: replied or pending reply
        if ($request->filled('status')) {
            $status = $request->input('status');
            if ($status === 'replied') {
                $query->whereNotNull('reply');
            } elseif ($status === 'pending') {
                $query->whereNull('reply');
            }
        }

        $reviews = $query->latest()->paginate(15)->withQueryString();

        return Inertia::render('reviews/index', [
            'reviews' => $reviews,
            'filters' => [
                'search' => $request->input('search', ''),
                'rating' => $request->input('rating', ''),
                'status' => $request->input('status', ''),
            ],
        ]);
    }
    /**
     * Store a product critique review from a customer purchase.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = Auth::user();

        $validated = $request->validate([
            'order_item_id' => ['required', 'exists:order_items,id'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['required', 'string', 'min:5'],
        ]);

        // Validate that order exists, is paid, and belongs to this user
        $orderItem = OrderItem::query()
            ->with('order')
            ->whereHas('order', function ($q) use ($user) {
                $q->where([['user_id', '=', $user->id], ['status', '=', 'paid']]);
            })
            ->findOrFail($validated['order_item_id']);

        // Check if review already exists for this order item
        $existing = Review::query()->firstWhere('order_item_id', $orderItem->id);
        if ($existing) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('You have already submitted a review for this item.')]);
            return redirect()->back();
        }

        Review::create([
            'product_id' => $orderItem->product_id,
            'user_id' => $user->id,
            'order_item_id' => $orderItem->id,
            'rating' => (int) $validated['rating'],
            'comment' => $validated['comment'],
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Thank you for your feedback!')]);

        return redirect()->back();
    }

    /**
     * Submit an administrative merchant reply to a critique review (Admin/Owner Only).
     */
    public function reply(Request $request, int $id): RedirectResponse
    {
        if (! $request->user()->can('manage catalog')) {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'reply' => ['required', 'string', 'min:2'],
        ]);

        $review = Review::findOrFail($id);
        $review->update([
            'reply' => $validated['reply'],
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Reply submitted successfully.')]);

        return redirect()->back();
    }
}
