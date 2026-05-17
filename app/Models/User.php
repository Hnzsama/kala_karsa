<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Concerns\HasTeams;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Permission\Traits\HasRoles;

#[Fillable(['name', 'email', 'password', 'current_team_id', 'phone_number', 'member_status', 'member_points'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;
    use HasRoles, HasTeams {
        HasTeams::teams insteadof HasRoles;
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'member_points' => 'integer',
        ];
    }

    /**
     * Register customer as an active store member.
     */
    public function registerAsMember(string $phoneNumber): void
    {
        $this->update([
            'phone_number' => $phoneNumber,
            'member_status' => 'active',
        ]);
    }

    /**
     * Determine if user is an active member.
     */
    public function isMember(): bool
    {
        return $this->member_status === 'active';
    }

    /**
     * Add membership rewards points.
     */
    public function addPoints(int $points): void
    {
        if ($this->isMember()) {
            $this->increment('member_points', $points);
        }
    }

    /**
     * Deduct membership points (e.g. for coupon exchanges).
     */
    public function deductPoints(int $points): void
    {
        if ($this->isMember() && $this->member_points >= $points) {
            $this->decrement('member_points', $points);
        }
    }

    /**
     * Get the user's orders.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<Order, $this>
     */
    public function orders(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Get the user's redeemed coupons.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<UserCoupon, $this>
     */
    public function userCoupons(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(UserCoupon::class);
    }

    /**
     * Get the user's reviews.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<Review, $this>
     */
    public function reviews(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Review::class);
    }

    /**
     * Get the user's persisted shopping cart items.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<CartItem, $this>
     */
    public function cartItems(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(CartItem::class);
    }
}
