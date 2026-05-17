<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('payment_channels', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('type'); // VIRTUAL_ACCOUNT, E_WALLET, QRIS, CARD, RETAIL_STORE
            $table->decimal('fee_flat', 12, 2)->default(0.00);
            $table->decimal('fee_percent', 5, 2)->default(0.00);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->string('payment_channel_code')->nullable()->after('payment_method');
            $table->decimal('admin_fee', 12, 2)->default(0.00)->after('discount_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['payment_channel_code', 'admin_fee']);
        });

        Schema::dropIfExists('payment_channels');
    }
};
