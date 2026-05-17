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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('pending'); // pending, paid, failed, cancelled
            $table->decimal('total_amount', 12, 2);
            $table->decimal('discount_amount', 12, 2)->default(0.00);
            $table->integer('points_used')->default(0);
            $table->integer('points_earned')->default(0);
            $table->unsignedBigInteger('user_coupon_id')->nullable(); // Foreign key to user_coupons (can't be hard constrained due to cycle or cascade null)
            $table->string('payment_method')->nullable();
            $table->string('payment_status')->default('pending'); // pending, settlement, challenge, failure, deny
            $table->string('payment_token')->nullable(); // Midtrans Snap token
            $table->string('payment_url')->nullable(); // Midtrans Snap redirect URL
            $table->json('customer_snapshot'); // snapshot of client: name, email, phone, member_status
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
