import React, { useState, useEffect } from 'react';
import { Head, usePage, Link, router } from '@inertiajs/react';
import { Receipt, Search, Eye, CreditCard, Calendar, Coins, User as UserIcon, Tag, AlertCircle, ShoppingBag, ArrowRight, Printer } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
  payment_url: string | null;
  customer_snapshot: {
    name: string;
    email: string;
    phone_number: string;
    member_status: string;
  };
  created_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

interface OrdersIndexProps {
  orders: {
    data: Order[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
  };
  filters: {
    search: string;
  };
}

export default function OrdersIndex({ orders, filters }: OrdersIndexProps) {
  const page = usePage();
  const user = (page.props as any).auth?.user;
  const roles = user?.roles || [];
  const isAdmin = roles.includes('admin') || roles.includes('owner');

  const [searchVal, setSearchVal] = useState(filters?.search || '');

  // Debounced search logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if ((filters?.search || '') !== searchVal) {
        router.get(
          '/orders',
          { search: searchVal },
          { preserveState: true, replace: true }
        );
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchVal]);

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
          <Badge className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30 hover:bg-emerald-50 font-medium">
            Lunas (Settlement)
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/30 hover:bg-amber-50 font-medium animate-pulse">
            Belum Bayar
          </Badge>
        );
      case 'failure':
      case 'failed':
      case 'deny':
        return (
          <Badge className="bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/30 hover:bg-rose-50 font-medium">
            Gagal / Ditolak
          </Badge>
        );
      case 'cancel':
      case 'cancelled':
        return (
          <Badge className="bg-neutral-100 dark:bg-neutral-900 text-neutral-500 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 font-medium">
            Dibatalkan
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="capitalize">
            {status}
          </Badge>
        );
    }
  };

  return (
    <>
      <Head title={isAdmin ? 'Daftar Semua Pesanan (Sales)' : 'Pesanan Belanja Saya'} />

      <div className="flex flex-col gap-6 p-6 w-full">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
              <Receipt className="h-6 w-6 text-neutral-500" />
              {isAdmin ? 'Manajemen Transaksi Penjualan' : 'Riwayat Pembelian Saya'}
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              {isAdmin
                ? 'Pantau invoice pesanan masuk dari konsumen, detail pembayaran Midtrans Snap, serta status pengiriman barang.'
                : 'Daftar belanja produk Kala Karsa Bakery, status pembayaran invoice, dan kode bayar Midtrans Snap Anda.'}
            </p>
          </div>
        </div>

        {/* Sleek Search bar */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isAdmin ? "Cari nomor order, nama, atau email pembeli..." : "Cari nomor order..."}
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {/* Orders Table */}
        <div className="overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-neutral-900/50 shadow-sm">
          <Table>
            <TableHeader className="bg-neutral-50 dark:bg-neutral-900/80 border-b border-neutral-100 dark:border-neutral-800">
              <TableRow>
                <TableHead className="py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400">No. Order</TableHead>
                <TableHead className="py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400">Tanggal Transaksi</TableHead>
                {isAdmin && (
                  <TableHead className="py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400">Konsumen</TableHead>
                )}
                <TableHead className="py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 text-right">Total Net</TableHead>
                <TableHead className="py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400">Metode Bayar</TableHead>
                <TableHead className="py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400">Status Pembayaran</TableHead>
                <TableHead className="py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {orders.data.length > 0 ? (
                orders.data.map((order) => {
                  return (
                    <TableRow
                      key={order.id}
                      className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-colors"
                    >
                      <TableCell className="py-3.5 px-4 font-mono text-xs font-bold tracking-wider text-neutral-900 dark:text-neutral-100">
                        {order.order_number}
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                        {new Date(order.created_at).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="py-3.5 px-4">
                          <div className="text-sm font-semibold text-neutral-950 dark:text-neutral-100">
                            {order.customer_snapshot?.name || order.user?.name || 'Konsumen'}
                          </div>
                          <div className="text-[10px] text-neutral-400 font-mono">
                            {order.customer_snapshot?.email || order.user?.email || '-'}
                          </div>
                        </TableCell>
                      )}
                      <TableCell className="py-3.5 px-4 text-sm font-bold text-right text-neutral-900 dark:text-neutral-50 whitespace-nowrap">
                        {formatRupiah(order.total_amount)}
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-xs font-medium text-neutral-600 dark:text-neutral-400 capitalize">
                        {order.payment_method ? (
                          <span className="flex items-center gap-1">
                            <CreditCard className="h-3 w-3 text-neutral-400" />
                            {order.payment_method.replace(/_/g, ' ')}
                          </span>
                        ) : (
                          <span className="text-neutral-300 dark:text-neutral-650 italic">Pending</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3.5 px-4">
                        {getPaymentStatusBadge(order.payment_status || order.status)}
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-3.5">
                          <Link
                            href={`/orders/${order.id}`}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-900 dark:text-neutral-50 hover:text-primary transition-colors cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Detail
                          </Link>
                          <a
                            href={`/orders/${order.id}?print=true`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50 transition-colors cursor-pointer"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            Cetak
                          </a>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 7 : 6} className="py-12 text-center text-sm text-neutral-400">
                    <ShoppingBag className="h-8 w-8 mx-auto text-neutral-300 mb-2 animate-bounce" />
                    Belum ada riwayat pesanan belanja terdaftar.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Dynamic Pagination footer */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            Menampilkan {orders.data.length} dari {orders.total} invoice pesanan
          </div>

          {orders.last_page > 1 && (
            <div className="flex items-center justify-center gap-1.5">
              {orders.links.map((link, idx) => {
                if (!link.url) return null;

                let cleanLabel = link.label;
                const lowerLabel = cleanLabel.toLowerCase();
                if (lowerLabel.includes('previous') || lowerLabel.includes('laquo') || lowerLabel.includes('before')) {
                  cleanLabel = 'Sebelumnya';
                } else if (lowerLabel.includes('next') || lowerLabel.includes('raquo')) {
                  cleanLabel = 'Selanjutnya';
                }

                return (
                  <Link
                    key={idx}
                    href={link.url}
                    className={`h-9 px-3 py-2 text-xs rounded-lg border font-medium transition-all ${link.active
                        ? 'bg-neutral-900 text-neutral-50 border-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 dark:border-neutral-100 shadow-sm'
                        : 'bg-white text-neutral-700 border-neutral-200 dark:bg-neutral-900 dark:text-neutral-300 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                      }`}
                  >
                    {cleanLabel}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

OrdersIndex.layout = {
  breadcrumbs: [
    {
      title: 'Dashboard',
      href: '/dashboard',
    },
    {
      title: 'Daftar Pesanan',
      href: '/orders',
    },
  ],
};
