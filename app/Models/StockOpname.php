<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

#[Fillable(['opname_number', 'status', 'notes', 'created_by'])]
class StockOpname extends Model
{
    use HasFactory;

    /**
     * Get the items (product lines) for this stock opname count.
     *
     * @return HasMany<StockOpnameItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(StockOpnameItem::class);
    }

    /**
     * Get the user who registered this stock opname count.
     *
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Complete the Stock Opname audit, reconciling actual stock discrepancies,
     * updating product stock counts, and recording a stock movement audit log.
     *
     * @throws \Exception
     */
    public function complete(): void
    {
        if ($this->status === 'completed') {
            throw new \Exception('This stock opname audit has already been completed.');
        }

        DB::transaction(function () {
            // Reconcile each item in the opname count
            foreach ($this->items as $item) {
                $product = $item->product;

                // Only make changes if there's a difference
                if ($item->difference !== 0) {
                    // Update actual product stock in warehouse database
                    $product->update([
                        'stock' => $item->actual_stock,
                    ]);

                    // Record a stock movement log of type 'opname_adjustment'
                    StockMovement::create([
                        'product_id' => $product->id,
                        'quantity' => $item->difference, // Positive or negative difference
                        'type' => 'opname_adjustment',
                        'reference_id' => $this->id,
                        'reference_type' => self::class,
                        'notes' => "Stock adjustment via opname count: {$this->opname_number}. Notes: {$item->notes}",
                        'user_id' => $this->created_by,
                    ]);
                }
            }

            // Set final completed status
            $this->update([
                'status' => 'completed',
            ]);
        });
    }
}
