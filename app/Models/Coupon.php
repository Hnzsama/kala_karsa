<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['code', 'name', 'description', 'discount_type', 'discount_value', 'points_required', 'min_purchase', 'expires_at', 'is_active'])]
class Coupon extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'discount_value' => 'decimal:2',
            'points_required' => 'integer',
            'min_purchase' => 'decimal:2',
            'expires_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Determine if a coupon can be redeemed or applied based on user profile and total order amount.
     */
    public function isValidForUser(User $user, float $purchaseAmount): bool
    {
        if (! $this->is_active) {
            return false;
        }

        if ($this->expires_at && $this->expires_at->isPast()) {
            return false;
        }

        if ($purchaseAmount < (float) $this->min_purchase) {
            return false;
        }

        return true;
    }

    /**
     * Get the user wallets holding this coupon.
     *
     * @return HasMany<UserCoupon, $this>
     */
    public function userCoupons(): HasMany
    {
        return $this->hasMany(UserCoupon::class);
    }
}
