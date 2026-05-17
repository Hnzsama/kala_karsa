<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['code', 'name', 'type', 'fee_flat', 'fee_percent', 'is_active'])]
class PaymentChannel extends Model
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
            'fee_flat' => 'decimal:2',
            'fee_percent' => 'float',
            'is_active' => 'boolean',
        ];
    }
}
