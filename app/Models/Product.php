<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['category_id', 'name', 'slug', 'sku', 'description', 'cover', 'price', 'stock', 'metadata', 'is_active'])]
class Product extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The accessors to append to the model's array form.
     *
     * @var array<int, string>
     */
    protected $appends = [
        'cover_url',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'stock' => 'integer',
            'metadata' => 'array',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Scope a query to only include active products.
     *
     * @param Builder<Product> $query
     * @return Builder<Product>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope a query to filter by a key-value pair inside the metadata JSON column.
     * Useful for searching specific properties like category, brand, size, etc.
     *
     * @param Builder<Product> $query
     * @param string $key
     * @param mixed $value
     * @return Builder<Product>
     */
    public function scopeSearchMetadata(Builder $query, string $key, mixed $value): Builder
    {
        return $query->where("metadata->{$key}", $value);
    }

    /**
     * Scope a query to perform a full-text or broad search on name, description, SKU, and metadata.
     *
     * @param Builder<Product> $query
     * @param string $search
     * @return Builder<Product>
     */
    public function scopeSearch(Builder $query, string $search): Builder
    {
        return $query->where(function (Builder $q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
                ->orWhere('sku', 'like', "%{$search}%")
                ->orWhere('description', 'like', "%{$search}%")
                ->orWhere('metadata', 'like', "%{$search}%");
        });
    }

    /**
     * Get all stock movements for this product.
     *
     * @return HasMany<StockMovement, $this>
     */
    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    /**
     * Get all stock opname lines for this product.
     *
     * @return HasMany<StockOpnameItem, $this>
     */
    public function stockOpnameItems(): HasMany
    {
        return $this->hasMany(StockOpnameItem::class);
    }

    /**
     * Get all order line items for this product.
     *
     * @return HasMany<OrderItem, $this>
     */
    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Get all reviews for this product.
     *
     * @return HasMany<Review, $this>
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    /**
     * Get the category that owns the product.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Category, $this>
     */
    public function category(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get the URL for the product's cover.
     *
     * @return string
     */
    public function getCoverUrlAttribute(): string
    {
        if ($this->cover && filter_var($this->cover, FILTER_VALIDATE_URL)) {
            return $this->cover;
        }

        if ($this->cover) {
            return asset('storage/' . $this->cover);
        }

        // Return a premium, beautiful fallback shoe placeholder
        return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop';
    }
}
