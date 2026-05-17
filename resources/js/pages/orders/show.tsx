import React, { useEffect } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, CreditCard, Calendar, User as UserIcon, Tag, Coins, AlertCircle, ShoppingBag, ArrowUpRight, CheckCircle2, ShieldAlert, Lock, MapPin, Receipt, ExternalLink, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface OrderItem {
  id: number;
  product_id: number | null;
  quantity: number;
  price: number;
  product_snapshot: {
    name: string;
    sku: string;
    price: number;
    metadata?: any;
  };
}

interface Order {
  id: number;
  order_number: string;
  user_id: number;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  total_amount: number;
  discount_amount: number;
  points_used: number;
  points_earned: number;
  payment_method: string | null;
  payment_status: 'pending' | 'settlement' | 'challenge' | 'failure' | 'deny';
  payment_token: string | null;
  payment_url: string | null;
  customer_snapshot: {
    name: string;
    email: string;
    phone_number: string;
    member_status: string;
  };
  notes: string | null;
  created_at: string;
  items: OrderItem[];
  user_coupon?: {
    id: number;
    coupon?: {
      id: number;
      code: string;
      name: string;
    };
  } | null;
}

interface OrderShowProps {
  order: Order;
  autoPay?: boolean;
}

export default function OrderShow({ order, autoPay = false }: OrderShowProps) {
  const page = usePage();
  const user = (page.props as any).auth?.user;
  const roles = user?.roles || [];
  const isAdmin = roles.includes('admin') || roles.includes('owner');

  useEffect(() => {
    if (autoPay && order.payment_url) {
      window.location.href = order.payment_url;
    }
  }, [autoPay, order.payment_url]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('print') === 'true') {
      const timer = setTimeout(() => {
        window.print();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'settlement':
      case 'paid':
        return (
          <Badge className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30 hover:bg-emerald-50 font-bold px-3 py-1 flex items-center gap-1.5 w-fit text-xs">
            <CheckCircle2 className="h-4 w-4" />
            Lunas (Settlement)
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/30 hover:bg-amber-50 font-bold px-3 py-1 flex items-center gap-1.5 w-fit text-xs animate-pulse">
            <AlertCircle className="h-4 w-4" />
            Menunggu Pembayaran
          </Badge>
        );
      case 'failure':
      case 'failed':
      case 'deny':
        return (
          <Badge className="bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/30 hover:bg-rose-50 font-bold px-3 py-1 flex items-center gap-1.5 w-fit text-xs">
            <ShieldAlert className="h-4 w-4" />
            Gagal / Ditolak
          </Badge>
        );
      case 'cancel':
      case 'cancelled':
        return (
          <Badge className="bg-neutral-100 dark:bg-neutral-900 text-neutral-500 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 font-bold px-3 py-1 flex items-center gap-1.5 w-fit text-xs">
            <Lock className="h-4 w-4" />
            Dibatalkan
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="capitalize text-xs px-3 py-1">
            {status}
          </Badge>
        );
    }
  };

  // Calculations
  const subtotal = order.items.reduce((acc, item) => acc + (parseFloat(item.price as any) * item.quantity), 0);

  return (
    <>
      <Head title={`Invoice #${order.order_number}`} />

      <div className="flex flex-col gap-6 p-6 w-full print:p-0 print:gap-4 print:bg-white print:text-black">
        {/* Back Link */}
        <div className="print:hidden">
          <Link
            href="/orders"
            className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-50 transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            Kembali ke Daftar Pesanan
          </Link>
        </div>

        {/* Professional Brand Invoice Header (Visible on print & beautifully styled on screen) */}
        <div className="flex flex-row justify-between items-center gap-6 pb-6 border-b border-neutral-200 dark:border-neutral-800 print:border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0 print:border-neutral-200">
              <img 
                src="/favicon.svg" 
                alt="Kala Karsa Bakery Logo" 
                className="h-8 w-8 object-contain"
              />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black tracking-tight text-neutral-900 dark:text-neutral-50 print:text-black">
                Kala Karsa Bakery
              </h2>
              <p className="text-[10px] md:text-xs text-neutral-500 dark:text-neutral-400 print:text-neutral-600 font-medium">
                Aneka Roti Manis & Kue Kering Premium
              </p>
            </div>
          </div>
          <div className="text-[10px] md:text-xs text-neutral-500 dark:text-neutral-400 print:text-neutral-600 font-semibold text-right space-y-0.5">
            <div>Jl. Senopati No. 45, Jakarta Selatan</div>
            <div>hello@kalakarsabakery.com | +62 812-3456-7890</div>
            <div className="font-mono text-[9px] md:text-[10px] text-neutral-400 print:text-neutral-500">www.kalakarsabakery.com</div>
          </div>
        </div>

        {/* Invoice Title & Status Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-5 print:border-neutral-200">
          <div className="space-y-1">
            <div className="text-xs uppercase font-bold tracking-widest text-neutral-400">Bukti Pembelian (Invoice)</div>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <span className="font-mono text-xl font-black tracking-tight text-neutral-900 dark:text-neutral-50 bg-neutral-100 dark:bg-neutral-900 border border-dashed border-neutral-300 dark:border-neutral-700 px-3 py-0.5 rounded-lg print:bg-neutral-50 print:text-black print:border-neutral-250">
                #{order.order_number}
              </span>
              {getPaymentStatusBadge(order.payment_status || order.status)}
            </div>
          </div>

          <div className="flex items-center gap-4 self-end sm:self-center">
            <div className="text-xs font-mono text-neutral-500 text-right">
              <div>Tanggal Transaksi:</div>
              <div className="font-bold text-neutral-800 dark:text-neutral-200 print:text-black mt-0.5">
                {new Date(order.created_at).toLocaleString('id-ID', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>

            <Button
              onClick={() => window.print()}
              className="print:hidden h-10 gap-2 cursor-pointer bg-neutral-900 dark:bg-neutral-50 text-neutral-50 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 font-bold border border-neutral-300 dark:border-neutral-700 shadow-sm"
            >
              <Printer className="h-4 w-4" />
              Cetak Invoice
            </Button>
          </div>
        </div>

        {/* PAYMENT GATEWAY REDIRECT BANNER */}
        {order.payment_status === 'pending' && order.payment_url && (
          <div className="print:hidden relative rounded-2xl border border-amber-100 dark:border-amber-950 bg-amber-50/40 dark:bg-amber-950/10 p-5 overflow-hidden shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3.5 max-w-xl">
              <div className="p-2.5 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 shrink-0">
                <CreditCard className="h-5 w-5 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-amber-800 dark:text-amber-400">Pembayaran Tertunda (Invoice Pending)</h4>
                <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-500">
                  Pembayaran pesanan ini menggunakan gerbang pembayaran aman Midtrans Snap. Silakan klik tombol di samping untuk melunasi pesanan Anda.
                </p>
              </div>
            </div>
            
            <a 
              href={order.payment_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="shrink-0"
            >
              <Button className="w-full sm:w-auto h-10 cursor-pointer bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold gap-2">
                Bayar Sekarang
                <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
          </div>
        )}

        {/* PAYMENT SUCCESS BANNER */}
        {(order.payment_status === 'settlement' || order.status === 'paid') && (
          <div className="print:hidden relative rounded-2xl border border-emerald-100 dark:border-emerald-950 bg-emerald-50/40 dark:bg-emerald-950/10 p-5 overflow-hidden shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3.5 max-w-xl">
              <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 shrink-0">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-400">Pembayaran Berhasil (Payment Success)</h4>
                <p className="text-xs leading-relaxed text-emerald-700 dark:text-emerald-500">
                  Terima kasih! Pembayaran Anda telah kami terima dengan sukses. Pesanan Anda kini sedang kami proses.
                </p>
              </div>
            </div>
            
            <Link href="/orders" className="shrink-0">
              <Button className="w-full sm:w-auto h-10 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2">
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Pesanan Saya
              </Button>
            </Link>
          </div>
        )}

        {/* Customer & Transaction details grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
          {/* Customer Snapshot */}
          <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 shadow-sm space-y-4 print:shadow-none print:bg-white print:border-neutral-200 print:text-black">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5 print:text-neutral-500">
              <UserIcon className="h-4 w-4" />
              Detail Pembeli (Snapshot)
            </h3>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between border-b border-neutral-100 dark:border-neutral-900 pb-2 print:border-neutral-200">
                <span className="text-neutral-400 print:text-neutral-500">Nama Lengkap</span>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200 print:text-black">{order.customer_snapshot?.name || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 dark:border-neutral-900 pb-2 print:border-neutral-200">
                <span className="text-neutral-400 print:text-neutral-500">Email</span>
                <span className="font-mono text-xs font-semibold text-neutral-800 dark:text-neutral-200 print:text-black">{order.customer_snapshot?.email || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 dark:border-neutral-900 pb-2 print:border-neutral-200">
                <span className="text-neutral-400 print:text-neutral-500">No. Telepon</span>
                <span className="font-mono text-xs font-semibold text-neutral-800 dark:text-neutral-200 print:text-black">{order.customer_snapshot?.phone_number || '-'}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-neutral-400 print:text-neutral-500">Status Loyalty</span>
                {order.customer_snapshot?.member_status === 'active' ? (
                  <Badge className="bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900 font-semibold text-[10px] print:bg-white print:text-black print:border-neutral-300">
                    Member Aktif
                  </Badge>
                ) : (
                  <Badge className="bg-neutral-100 dark:bg-neutral-900 text-neutral-400 border border-neutral-200 dark:border-neutral-800 text-[10px] print:bg-white print:text-black print:border-neutral-300">
                    Bukan Member
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Transaction metadata */}
          <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 shadow-sm space-y-4 print:shadow-none print:bg-white print:border-neutral-200 print:text-black">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5 print:text-neutral-500">
              <Receipt className="h-4 w-4" />
              Detail Pembayaran & Poin
            </h3>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between border-b border-neutral-100 dark:border-neutral-900 pb-2 print:border-neutral-200">
                <span className="text-neutral-400 print:text-neutral-500">Metode Bayar</span>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200 print:text-black capitalize">
                  {order.payment_method ? order.payment_method.replace(/_/g, ' ') : 'Midtrans snap'}
                </span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 dark:border-neutral-900 pb-2 print:border-neutral-200">
                <span className="text-neutral-400 print:text-neutral-500">Kupon Diterapkan</span>
                {order.user_coupon?.coupon ? (
                  <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 border border-dashed border-indigo-200 dark:border-indigo-900 rounded-lg print:bg-white print:text-black print:border-neutral-300">
                    {order.user_coupon.coupon.code}
                  </span>
                ) : (
                  <span className="text-neutral-400 italic print:text-neutral-500">Tidak ada</span>
                )}
              </div>
              <div className="flex justify-between border-b border-neutral-100 dark:border-neutral-900 pb-2 print:border-neutral-200">
                <span className="text-neutral-400 print:text-neutral-500">Poin Belanja Didapat</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 print:text-black">
                  <Coins className="h-3.5 w-3.5" />
                  +{order.points_earned} Poin
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-neutral-400 print:text-neutral-500">Poin Ditukarkan</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 print:text-black">
                  <Tag className="h-3.5 w-3.5" />
                  {order.points_used} Poin
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Purchased line items table */}
        <div className="overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-neutral-900/50 shadow-sm print:shadow-none print:border-neutral-200 print:bg-white">
          <Table>
            <TableHeader className="bg-neutral-50 dark:bg-neutral-900/80 border-b border-neutral-100 dark:border-neutral-800 print:bg-neutral-50 print:border-neutral-200">
              <TableRow>
                <TableHead className="py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 print:text-black">Nama Produk</TableHead>
                <TableHead className="py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 text-right print:text-black">Harga Satuan</TableHead>
                <TableHead className="py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 text-center print:text-black">Jumlah</TableHead>
                <TableHead className="py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 text-right print:text-black">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-neutral-100 dark:divide-neutral-800 print:divide-neutral-200">
              {order.items.map((item) => {
                const itemSub = parseFloat(item.price as any) * item.quantity;
                return (
                  <TableRow 
                    key={item.id} 
                    className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-colors print:bg-white"
                  >
                    <TableCell className="py-3.5 px-4">
                      <div className="font-semibold text-neutral-900 dark:text-neutral-50 print:text-black">
                        {item.product_snapshot?.name || 'Produk'}
                      </div>
                      <div className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500 print:text-neutral-600">
                        {item.product_snapshot?.sku || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-right text-sm text-neutral-650 dark:text-neutral-400 whitespace-nowrap print:text-black">
                      {formatRupiah(item.price)}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-center text-sm font-semibold text-neutral-900 dark:text-neutral-100 print:text-black">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-right text-sm font-bold text-neutral-950 dark:text-neutral-50 whitespace-nowrap print:text-black">
                      {formatRupiah(itemSub)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Invoice Summary Notes & Financial Calculation Card */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start print:grid-cols-12 print:gap-4">
          
          {/* Notes column */}
          <div className="md:col-span-7 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/10 text-xs text-neutral-550 dark:text-neutral-400 print:bg-white print:border-neutral-200 print:text-black">
            <strong className="text-neutral-700 dark:text-neutral-300 print:text-black block mb-1">Catatan Pesanan:</strong>
            {order.notes || <span className="text-neutral-300 dark:text-neutral-700 italic print:text-neutral-500">Tidak ada catatan khusus dari pembeli.</span>}
          </div>

          {/* Financial summary card */}
          <div className="md:col-span-5 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 shadow-sm space-y-3 print:shadow-none print:bg-white print:border-neutral-200 print:text-black">
            <div className="flex justify-between text-xs text-neutral-400 print:text-neutral-600">
              <span>Subtotal Belanja</span>
              <span className="font-semibold text-neutral-800 dark:text-neutral-200 print:text-black">{formatRupiah(subtotal)}</span>
            </div>
            
            {parseFloat(order.discount_amount as any) > 0 && (
              <div className="flex justify-between text-xs text-rose-500 font-semibold print:text-black">
                <span>Diskon Kupon</span>
                <span>-{formatRupiah(order.discount_amount)}</span>
              </div>
            )}
            
            <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3 flex justify-between items-baseline print:border-neutral-200">
              <span className="text-sm font-bold text-neutral-900 dark:text-neutral-50 print:text-black">Total Pembayaran</span>
              <span className="text-lg font-black text-indigo-650 dark:text-indigo-400 print:text-black">{formatRupiah(order.total_amount)}</span>
            </div>
          </div>

        </div>

        {/* Action Button at the Bottom */}
        <div className="print:hidden flex justify-center border-t border-neutral-100 dark:border-neutral-800 pt-6 mt-2">
          <Link href="/orders">
            <Button variant="outline" className="gap-2 font-bold px-6 border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900 cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Halaman Pesanan Saya
            </Button>
          </Link>
        </div>

      </div>
    </>
  );
}

OrderShow.layout = {
  breadcrumbs: [
    {
      title: 'Dashboard',
      href: '/dashboard',
    },
    {
      title: 'Pesanan',
      href: '/orders',
    },
    {
      title: 'Detail Invoice',
      href: '#',
    },
  ],
};
