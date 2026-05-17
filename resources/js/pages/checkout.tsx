import React, { useState, useMemo } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import { ArrowLeft, ShoppingBag, CreditCard, Ticket, ShieldCheck, HelpCircle, FileText, CheckCircle2, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  cover_url?: string;
  stock: number;
}

interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  product: Product;
}

interface Coupon {
  id: number;
  code: string;
  name: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase: number;
}

interface UserCoupon {
  id: number;
  coupon: Coupon;
  status: 'active' | 'used' | 'expired';
}

interface PaymentChannel {
  id: number;
  code: string;
  name: string;
  type: 'VIRTUAL_ACCOUNT' | 'E_WALLET' | 'QRIS' | 'CREDIT_CARD' | 'RETAIL' | 'PAY_LATER';
  fee_flat: number;
  fee_percent: number;
}

interface CheckoutProps {
  cartItems: CartItem[];
  userCoupons: UserCoupon[];
  paymentChannels: PaymentChannel[];
}

export default function Checkout({ cartItems, userCoupons, paymentChannels }: CheckoutProps) {
  const [selectedCouponId, setSelectedCouponId] = useState<number | null>(null);
  const [selectedChannelCode, setSelectedChannelCode] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isCouponDialogOpen, setIsCouponDialogOpen] = useState(false);

  // Compute Subtotal
  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  }, [cartItems]);

  // Find selected user coupon and calculate discount
  const activeUserCoupon = useMemo(() => {
    if (!selectedCouponId) return null;
    return userCoupons.find(uc => uc.id === selectedCouponId) || null;
  }, [selectedCouponId, userCoupons]);

  const discount = useMemo(() => {
    if (!activeUserCoupon) return 0;
    const coupon = activeUserCoupon.coupon;

    if (subtotal < coupon.min_purchase) {
      return 0;
    }

    if (coupon.discount_type === 'percentage') {
      const computed = subtotal * (coupon.discount_value / 100);
      return Math.min(computed, subtotal);
    }

    return Math.min(coupon.discount_value, subtotal);
  }, [activeUserCoupon, subtotal]);

  const netSubtotal = useMemo(() => {
    return Math.max(0, subtotal - discount);
  }, [subtotal, discount]);

  // Find selected payment channel and calculate administrative fee
  const selectedPaymentChannel = useMemo(() => {
    if (!selectedChannelCode) return null;
    return paymentChannels.find(pc => pc.code === selectedChannelCode) || null;
  }, [selectedChannelCode, paymentChannels]);

  const adminFee = useMemo(() => {
    if (!selectedPaymentChannel) return 0;
    const flat = Number(selectedPaymentChannel.fee_flat);
    const percent = Number(selectedPaymentChannel.fee_percent);

    const computedPercent = percent > 0 ? (netSubtotal * (percent / 100)) : 0;
    return flat + computedPercent;
  }, [selectedPaymentChannel, netSubtotal]);

  // Calculate final total
  const grandTotal = useMemo(() => {
    return netSubtotal + adminFee;
  }, [netSubtotal, adminFee]);

  // Group payment channels
  const groupedChannels = useMemo(() => {
    const groups: Record<string, { title: string; items: PaymentChannel[] }> = {
      VIRTUAL_ACCOUNT: { title: 'Transfer Virtual Account (Verifikasi Otomatis)', items: [] },
      E_WALLET: { title: 'E-Wallet & Dompet Digital', items: [] },
      QRIS: { title: 'QRIS (Semua Bank / OVO / GoPay / DANA)', items: [] },
      CREDIT_CARD: { title: 'Kartu Kredit / Debit', items: [] },
      RETAIL: { title: 'Ritel & Gerai Tunai', items: [] },
      PAY_LATER: { title: 'PayLater / Cicilan Tanpa Kartu', items: [] },
    };

    paymentChannels.forEach(channel => {
      if (groups[channel.type]) {
        groups[channel.type].items.push(channel);
      }
    });

    // Remove empty groups
    return Object.entries(groups).reduce((acc, [key, val]) => {
      if (val.items.length > 0) {
        acc[key] = val;
      }
      return acc;
    }, {} as Record<string, { title: string; items: PaymentChannel[] }>);
  }, [paymentChannels]);

  // Form Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePlaceOrder = () => {
    if (!selectedChannelCode) {
      toast.error('Silakan pilih metode pembayaran terlebih dahulu.');
      return;
    }

    const payload = {
      cart: cartItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
      })),
      payment_channel_code: selectedChannelCode,
      user_coupon_id: selectedCouponId,
      notes: notes || null,
    };

    setIsSubmitting(true);

    // Post order request to server backend
    router.post('/orders/checkout', payload, {
      onSuccess: () => {
        toast.success('Pemesanan berhasil dibuat! Mengalihkan ke pembayaran...');
      },
      onError: (errors) => {
        setIsSubmitting(false);
        const firstErr = Object.values(errors)[0];
        toast.error(firstErr || 'Terjadi kesalahan saat memproses pesanan.');
      },
      onFinish: () => {
        setIsSubmitting(false);
      }
    });
  };

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <>
      <Head title="Checkout Pembelian - Kala Karsa Bakery" />

      <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col gap-6">

          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Link href="/" className="p-2 rounded-lg bg-card border border-border hover:bg-muted transition-colors text-foreground">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">Checkout Pesanan</h1>
                <p className="text-xs text-muted-foreground mt-0.5">Selesaikan transaksi belanja Anda dengan aman</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left Main Form column */}
            <div className="lg:col-span-2 space-y-6">

              {/* Product Items Details Card */}
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                  Rincian Produk Dipesan
                </h2>

                <div className="divide-y divide-border">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-4 py-3.5 first:pt-0 last:pb-0">
                      <div className="h-16 w-16 rounded-lg bg-muted overflow-hidden border border-border shrink-0">
                        {item.product.cover_url ? (
                          <img src={item.product.cover_url} alt={item.product.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-xs font-bold text-muted-foreground">KALAKARSA</div>
                        )}
                      </div>

                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-sm font-semibold text-foreground line-clamp-1">{item.product.name}</h3>
                          <span className="text-[10px] text-muted-foreground font-mono mt-0.5 block">SKU: {item.product.sku}</span>
                        </div>

                        <div className="flex justify-between items-baseline mt-1">
                          <span className="text-xs text-muted-foreground">{formatRupiah(item.product.price)} &times; {item.quantity}</span>
                          <span className="text-xs font-bold text-foreground">{formatRupiah(item.product.price * item.quantity)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coupons Card */}
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3">
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-muted-foreground" />
                  Kupon Promo & Diskon Belanja
                </h2>

                <div className="flex items-center justify-between border border-border rounded-lg p-3 bg-muted">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Ticket className="h-4 w-4" />
                    </div>
                    <div>
                      {activeUserCoupon ? (
                        <>
                          <div className="text-xs font-bold text-foreground">Kupon Terpakai: <span className="font-mono text-primary font-black">{activeUserCoupon.coupon.code}</span></div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            Potongan {activeUserCoupon.coupon.discount_type === 'percentage' ? `${activeUserCoupon.coupon.discount_value}%` : formatRupiah(activeUserCoupon.coupon.discount_value)}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-xs font-bold text-foreground">Gunakan Kupon Belanja</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">Hemat belanja Anda dengan kupon aktif di dompet</div>
                        </>
                      )}
                    </div>
                  </div>

                  <Dialog open={isCouponDialogOpen} onOpenChange={setIsCouponDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 text-xs font-semibold cursor-pointer">
                        {activeUserCoupon ? 'Ganti Kupon' : 'Pilih Kupon'}
                      </Button>
                    </DialogTrigger>

                    <DialogContent className="sm:max-w-md bg-card text-foreground p-6 border border-border rounded-xl">
                      <DialogHeader className="pb-3 border-b border-border">
                        <DialogTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                          <Ticket className="h-4 w-4" />
                          Dompet Kupon Aktif Anda
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                          Pilih kupon diskon di bawah ini yang memenuhi syarat minimal pembelanjaan Anda.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-3 py-4 max-h-[300px] overflow-y-auto">
                        {userCoupons.length > 0 ? (
                          userCoupons.map((uc) => {
                            const isEligible = subtotal >= uc.coupon.min_purchase;
                            const isSelected = selectedCouponId === uc.id;

                            return (
                              <button
                                key={uc.id}
                                disabled={!isEligible}
                                onClick={() => {
                                  setSelectedCouponId(isSelected ? null : uc.id);
                                  setIsCouponDialogOpen(false);
                                  toast.success(isSelected ? 'Kupon dilepas' : `Kupon ${uc.coupon.code} diterapkan!`);
                                }}
                                className={cn(
                                  "w-full text-left p-3 rounded-lg border transition-all flex justify-between items-center gap-3",
                                  isSelected
                                    ? "bg-primary/10 border-primary"
                                    : isEligible
                                      ? "border-border hover:border-muted-foreground bg-card cursor-pointer"
                                      : "border-border opacity-50 cursor-not-allowed bg-muted"
                                )}
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                                      {uc.coupon.code}
                                    </span>
                                    <span className="text-xs font-semibold text-foreground">{uc.coupon.name}</span>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground">
                                    {uc.coupon.description || `Potongan ${uc.coupon.discount_type === 'percentage' ? `${uc.coupon.discount_value}%` : formatRupiah(uc.coupon.discount_value)}`}
                                  </p>
                                  {uc.coupon.min_purchase > 0 && (
                                    <span className="text-[9px] text-muted-foreground block">Min. Belanja: {formatRupiah(uc.coupon.min_purchase)}</span>
                                  )}
                                </div>

                                {isSelected ? (
                                  <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                                    <Check className="h-3 w-3" />
                                  </div>
                                ) : isEligible ? (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <span className="text-[9px] font-bold text-rose-500">Min. tidak cukup</span>
                                )}
                              </button>
                            );
                          })
                        ) : (
                          <div className="text-center py-6 text-xs text-muted-foreground">
                            <Ticket className="h-6 w-6 mx-auto opacity-50 mb-1" />
                            Anda tidak memiliki kupon belanja aktif saat ini.
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Payment Methods Card */}
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  Pilih Metode Pembayaran
                </h2>

                <div className="space-y-5">
                  {Object.entries(groupedChannels).map(([groupKey, group]) => (
                    <div key={groupKey} className="space-y-2">
                      <h3 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{group.title}</h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {group.items.map((channel) => {
                          const isSelected = selectedChannelCode === channel.code;

                          // Fee breakdown visualizer
                          let feeLabel = 'Tanpa Biaya Admin';
                          if (channel.fee_flat > 0 && channel.fee_percent > 0) {
                            feeLabel = `${formatRupiah(channel.fee_flat)} + ${channel.fee_percent}%`;
                          } else if (channel.fee_flat > 0) {
                            feeLabel = `+ ${formatRupiah(channel.fee_flat)}`;
                          } else if (channel.fee_percent > 0) {
                            feeLabel = `+ ${channel.fee_percent}% Biaya Admin`;
                          }

                          return (
                            <button
                              key={channel.id}
                              type="button"
                              onClick={() => setSelectedChannelCode(channel.code)}
                              className={cn(
                                "flex items-center justify-between p-3.5 rounded-lg border text-left transition-all cursor-pointer",
                                isSelected
                                  ? "bg-primary/15 border-primary shadow-sm"
                                  : "border-border hover:border-muted-foreground hover:bg-muted/50"
                              )}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className={cn(
                                  "h-4 w-4 rounded-full border flex items-center justify-center shrink-0",
                                  isSelected ? "border-primary text-primary" : "border-border"
                                )}>
                                  {isSelected && <span className="h-2 w-2 rounded-full bg-primary" />}
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-foreground">{channel.name}</div>
                                  <div className="text-[9px] text-muted-foreground font-medium mt-0.5">{feeLabel}</div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes Card */}
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-2">
                <Label htmlFor="notes" className="text-xs font-bold text-muted-foreground">Catatan Belanja Tambahan (Opsional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Contoh: Titipkan di pos satpam, bungkus kado, warna varian cadangan, dll."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[80px] text-xs resize-none"
                />
              </div>

            </div>

            {/* Right Summary Column */}
            <div className="space-y-6">

              {/* Grand Summary Pricing details */}
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm sticky top-6 space-y-4">
                <h2 className="text-sm font-bold text-foreground pb-2 border-b border-border">Ringkasan Pembelian</h2>

                <div className="space-y-3 text-xs">

                  {/* Subtotal */}
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Total Harga Barang ({cartItems.reduce((acc, item) => acc + item.quantity, 0)} item)</span>
                    <span className="font-semibold">{formatRupiah(subtotal)}</span>
                  </div>

                  {/* Promo Discount */}
                  {discount > 0 && (
                    <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-500 font-semibold">
                      <span className="flex items-center gap-1.5">Diskon Promo Kupon</span>
                      <span>- {formatRupiah(discount)}</span>
                    </div>
                  )}

                  {/* Service Admin Fee */}
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span className="flex items-center gap-1">
                      Biaya Layanan Admin
                    </span>
                    <span className="font-semibold">
                      {selectedPaymentChannel ? formatRupiah(adminFee) : 'Pilih Metode'}
                    </span>
                  </div>

                  {selectedPaymentChannel && (
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-2.5 text-[10px] text-primary">
                      Rincian Biaya Admin ({selectedPaymentChannel.name}):{' '}
                      <strong>{selectedPaymentChannel.fee_percent > 0 ? `${selectedPaymentChannel.fee_percent}%` : ''} {selectedPaymentChannel.fee_flat > 0 ? `+ ${formatRupiah(selectedPaymentChannel.fee_flat)}` : ''}</strong>
                    </div>
                  )}

                  <hr className="border-border my-1" />

                  {/* Grand Total */}
                  <div className="flex justify-between items-baseline pt-2">
                    <span className="text-sm font-black text-foreground">Total Tagihan Bayar</span>
                    <span className="text-lg font-black text-foreground">{formatRupiah(grandTotal)}</span>
                  </div>

                </div>

                {/* Info Safety badge */}
                <div className="flex gap-2 p-3 bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/30 rounded-lg text-[10px] text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>Transaksi Anda dienkripsi penuh dan diamankan secara resmi oleh Midtrans Payment Gateway.</p>
                </div>

                {/* Main Action Submit Button */}
                <Button
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting || !selectedChannelCode}
                  className="w-full h-11 text-xs cursor-pointer font-bold bg-primary hover:bg-primary/95 text-primary-foreground transition-colors shadow-sm gap-2 mt-2"
                >
                  {isSubmitting ? 'Memproses Transaksi...' : 'Bayar Sekarang'}
                </Button>
              </div>

            </div>

          </div>

        </div>
      </div>
    </>
  );
}
