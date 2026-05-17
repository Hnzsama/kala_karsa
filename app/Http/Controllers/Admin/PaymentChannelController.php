<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PaymentChannel;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PaymentChannelController extends Controller
{
    /**
     * Display a listing of all payment channels.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        if (! $user || ! ($user->hasRole('admin') || $user->hasRole('owner'))) {
            abort(403, 'Unauthorized action.');
        }

        $paymentChannels = PaymentChannel::query()
            ->orderBy('type', 'asc')
            ->orderBy('name', 'asc')
            ->get();

        return Inertia::render('admin/payment_channels', [
            'paymentChannels' => $paymentChannels,
        ]);
    }

    /**
     * Update the specified payment channel in storage.
     */
    public function update(Request $request, PaymentChannel $paymentChannel): RedirectResponse
    {
        $user = $request->user();
        if (! $user || ! ($user->hasRole('admin') || $user->hasRole('owner'))) {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'fee_flat' => 'required|numeric|min:0',
            'fee_percent' => 'required|numeric|min:0|max:100',
            'is_active' => 'required|boolean',
        ]);

        $paymentChannel->update($validated);

        return redirect()->back()->with('toast', [
            'type' => 'success',
            'message' => "Metode {$paymentChannel->name} berhasil diperbarui.",
        ]);
    }
}
