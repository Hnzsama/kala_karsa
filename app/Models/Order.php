<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

#[Fillable([
    'order_number',
    'user_id',
    'status',
    'total_amount',
    'discount_amount',
    'admin_fee',
    'points_used',
    'points_earned',
    'user_coupon_id',
    'payment_method',
    'payment_channel_code',
    'payment_status',
    'payment_token',
    'payment_url',
    'customer_snapshot',
    'notes',
])]
class Order extends Model
{
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'total_amount' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'admin_fee' => 'decimal:2',
            'points_used' => 'integer',
            'points_earned' => 'integer',
            'customer_snapshot' => 'array',
        ];
    }

    /**
     * Complete order payment, update status, and award purchase points to member.
     *
     * @param string|null $paymentMethod
     * @throws \Exception
     */
    public function completePayment(?string $paymentMethod = null): void
    {
        if ($this->status === 'paid') {
            return;
        }

        DB::transaction(function () use ($paymentMethod) {
            $this->update([
                'status' => 'paid',
                'payment_status' => 'settlement',
                'payment_method' => $paymentMethod ?? $this->payment_method,
            ]);

            // Award points to the customer if they are a member
            $user = $this->user;
            if ($user && $user->isMember() && $this->points_earned > 0) {
                $user->addPoints($this->points_earned);
            }

            // Record a stock movement for each item as completed sale
            foreach ($this->items as $item) {
                $product = Product::query()->find($item->product_id);
                if ($product) {
                    // Deduct product catalog stock levels
                    $product->update([
                        'stock' => $product->stock - $item->quantity,
                    ]);

                    StockMovement::create([
                        'product_id' => $item->product_id,
                        'quantity' => -$item->quantity, // Deduction
                        'type' => 'purchase',
                        'reference_id' => $this->id,
                        'reference_type' => self::class,
                        'notes' => "Deduction for purchase order: {$this->order_number}",
                        'user_id' => $this->user_id,
                    ]);
                }
            }
        });
    }

    /**
     * Cancel the order, restoring any used membership points and active coupons.
     */
    public function cancelOrder(): void
    {
        if (in_array($this->status, ['cancelled', 'failed'])) {
            return;
        }

        DB::transaction(function () {
            // Restore any points spent by the customer member
            $user = $this->user;
            if ($user && $user->isMember() && $this->points_used > 0) {
                $user->addPoints($this->points_used);
            }

            // Restore the coupon to active if one was applied
            if ($this->user_coupon_id) {
                $userCoupon = UserCoupon::query()->find($this->user_coupon_id);
                if ($userCoupon) {
                    $userCoupon->update([
                        'used_at' => null,
                        'order_id' => null,
                        'status' => 'active',
                    ]);
                }
            }

            // Update order status
            $this->update([
                'status' => 'cancelled',
                'payment_status' => 'cancelled',
            ]);
        });
    }

    /**
     * Get the customer user who made this order.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get all purchased line items.
     *
     * @return HasMany<OrderItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Get the redeemed user coupon applied to this order.
     *
     * @return BelongsTo<UserCoupon, $this>
     */
    public function userCoupon(): BelongsTo
    {
        return $this->belongsTo(UserCoupon::class);
    }
}
