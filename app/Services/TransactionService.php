<?php

namespace App\Services;

use App\Models\Order;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TransactionService
{
    /**
     * The Midtrans server key.
     */
    private string $serverKey;

    /**
     * Whether running in production mode.
     */
    private bool $isProduction;

    /**
     * Initialize the transaction service configuration.
     */
    public function __construct()
    {
        $this->serverKey = (string) config('services.midtrans.server_key');
        $this->isProduction = (bool) config('services.midtrans.is_production');
    }

    /**
     * Get the target Midtrans Snap API endpoint URL.
     */
    public function getSnapBaseUrl(): string
    {
        return $this->isProduction
            ? 'https://app.midtrans.com/snap/v1/transactions'
            : 'https://app.sandbox.midtrans.com/snap/v1/transactions';
    }

    /**
     * Request a new Snap checkout payment token and redirection URL from Midtrans.
     *
     * @param Order $order
     * @return array{token: string, redirect_url: string}
     * @throws \Exception
     */
    public function createSnapTransaction(Order $order): array
    {
        $url = $this->getSnapBaseUrl();

        // Build item rows from snapped order line items with exact rounding
        $itemDetails = [];
        $calculatedGrossAmount = 0;

        foreach ($order->items as $item) {
            $snap = $item->product_snapshot;
            $price = (int) round($item->price);
            $qty = (int) $item->quantity;
            $itemDetails[] = [
                'id' => (string) $item->product_id,
                'price' => $price,
                'quantity' => $qty,
                'name' => substr($snap['name'] ?? 'Product Item', 0, 50),
            ];
            $calculatedGrossAmount += $price * $qty;
        }

        // Add discount as a negative price item line if active
        if ((float) $order->discount_amount > 0) {
            $discountPrice = -(int) round($order->discount_amount);
            $itemDetails[] = [
                'id' => 'DISCOUNT',
                'price' => $discountPrice,
                'quantity' => 1,
                'name' => 'Redeemed Promo Coupon Discount',
            ];
            $calculatedGrossAmount += $discountPrice;
        }

        // Add administrative fee as a positive price item line if present
        if ((float) $order->admin_fee > 0) {
            $adminFeePrice = (int) round($order->admin_fee);
            $itemDetails[] = [
                'id' => 'ADMIN_FEE',
                'price' => $adminFeePrice,
                'quantity' => 1,
                'name' => 'Biaya Layanan Admin',
            ];
            $calculatedGrossAmount += $adminFeePrice;
        }

        $customer = $order->customer_snapshot;

        $customerDetails = [
            'first_name' => substr($customer['name'] ?? 'Customer', 0, 50),
        ];

        if (! empty($customer['email'])) {
            $customerDetails['email'] = $customer['email'];
        }

        if (! empty($customer['phone_number'])) {
            $customerDetails['phone'] = $customer['phone_number'];
        }

        // Formulate snap transaction parameters
        $payload = [
            'transaction_details' => [
                'order_id' => $order->order_number,
                'gross_amount' => $calculatedGrossAmount,
            ],
            'item_details' => $itemDetails,
            'customer_details' => $customerDetails,
            'credit_card' => [
                'secure' => (bool) config('services.midtrans.is_3ds', true),
            ],
            'callbacks' => [
                'finish' => route('orders.show', ['id' => $order->id]),
            ],
        ];

        // Restrict / lock Midtrans Snap popup to selected payment channel
        if ($order->payment_channel_code) {
            $code = $order->payment_channel_code;
            $midtransPayments = [];

            if ($code === 'bca_va') {
                $midtransPayments = ['bca_va'];
            } elseif ($code === 'briva') {
                $midtransPayments = ['bri_va'];
            } elseif ($code === 'bni_va') {
                $midtransPayments = ['bni_va'];
            } elseif ($code === 'mandiri_va') {
                $midtransPayments = ['echannel'];
            } elseif ($code === 'permata_va') {
                $midtransPayments = ['permata_va'];
            } elseif (in_array($code, ['cimb_va', 'danamon_va', 'bsi_va', 'other_va'])) {
                $midtransPayments = ['other_va'];
            } elseif ($code === 'gopay') {
                $midtransPayments = ['gopay'];
            } elseif ($code === 'shopeepay') {
                $midtransPayments = ['shopeepay'];
            } elseif ($code === 'qris' || $code === 'dana') {
                $midtransPayments = ['qris', 'gopay'];
            } elseif ($code === 'credit_card') {
                $midtransPayments = ['credit_card'];
            } elseif ($code === 'indomaret') {
                $midtransPayments = ['indomaret'];
            } elseif ($code === 'alfamart') {
                $midtransPayments = ['alfamart'];
            } elseif ($code === 'akulaku') {
                $midtransPayments = ['akulaku'];
            } elseif ($code === 'kredivo') {
                $midtransPayments = ['kredivo'];
            }

            if (! empty($midtransPayments)) {
                $payload['enabled_payments'] = $midtransPayments;
            }
        }

        // Send request using Laravel standard Http client
        $response = Http::withHeaders([
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
            'X-Override-Notification' => route('payment.callback'),
        ])
        ->withBasicAuth($this->serverKey, '')
        ->post($url, $payload);

        if ($response->failed()) {
            Log::error('Midtrans API Snap request failure', [
                'order_id' => $order->order_number,
                'status' => $response->status(),
                'body' => $response->body(),
                'payload' => $payload,
            ]);

            throw new \Exception('Failed to generate transaction payment token from Midtrans: ' . $response->body());
        }

        $data = $response->json();

        return [
            'token' => $data['token'] ?? '',
            'redirect_url' => $data['redirect_url'] ?? '',
        ];
    }

    /**
     * Mathematically verify that the incoming callback notification payload is from Midtrans
     * and has not been altered or spoofed, using SHA512 hash validation.
     *
     * @param array<string, mixed> $payload
     * @return bool
     */
    public function verifyWebhookSignature(array $payload): bool
    {
        $signatureKey = $payload['signature_key'] ?? '';
        $orderId = $payload['order_id'] ?? '';
        $statusCode = $payload['status_code'] ?? '';
        $grossAmount = $payload['gross_amount'] ?? '';

        if (empty($signatureKey) || empty($orderId) || empty($statusCode) || empty($grossAmount)) {
            return false;
        }

        // Midtrans SHA512 Signature payload combination
        $input = $orderId . $statusCode . $grossAmount . $this->serverKey;
        $hash = hash('sha512', $input);

        return hash_equals($hash, $signatureKey);
    }
}
