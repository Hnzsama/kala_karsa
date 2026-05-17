import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import {
  TrendingUp,
  Coins,
  Users,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Calendar,
  QrCode,
  Ticket,
  Clock,
  Sparkles,
  ShoppingBag,
  BellRing,
  CreditCard
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { dashboard } from '@/routes';

interface StatsProps {
  // Admin stats
  totalRevenue?: number;
  totalOrders?: number;
  totalMembers?: number;
  totalProducts?: number;
  lowStockCount?: number;
  recentOrders?: Array<{
    id: number;
    order_number: string;
    customer_name: string;
    status: string;
    total_amount: number | string;
    created_at: string;
  }>;
  salesData?: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
  paymentData?: Array<{
    channel: string;
    count: number;
  }>;

  // Customer stats
  myPoints?: number;
  myTotalOrders?: number;
  myPendingOrders?: number;
  myCoupons?: number;
  myRecentOrders?: Array<{
    id: number;
    order_number: string;
    status: string;
    total_amount: number | string;
    created_at: string;
  }>;
}

export default function Dashboard() {
  const page = usePage();
  const user = (page.props as any).auth?.user as any;
  const roles = user?.roles || [];
  const isAdminOrOwner = roles.includes('admin') || roles.includes('owner');
  const roleName = roles.includes('admin') ? 'Administrator' : roles.includes('owner') ? 'Owner' : 'Pelanggan';

  const stats = ((page.props as any).stats as StatsProps) || {};

  // Formatter
  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(Number(val));
  };

  // Status styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return (
          <Badge className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30 hover:bg-emerald-50 font-semibold text-[10px]">
            Selesai
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/30 hover:bg-amber-50 font-semibold text-[10px] animate-pulse">
            Menunggu
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/30 hover:bg-rose-50 font-semibold text-[10px]">
            Batal
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px]">
            {status}
          </Badge>
        );
    }
  };

  // Barcode mockup generator for member cards
  const BarcodePattern = () => (
    <div className="flex items-center justify-center gap-1 h-9 w-full bg-white/80 dark:bg-zinc-900/50 rounded-lg p-1.5 border border-zinc-200/50 dark:border-zinc-800/30">
      {[2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 2, 1, 4, 2, 1, 3, 1, 2, 2, 1, 3, 1, 2, 1, 3].map((w, idx) => (
        <div
          key={idx}
          className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-xs"
          style={{ width: `${w}px` }}
        />
      ))}
    </div>
  );

  return (
    <>
      <Head title={`${roleName} Dashboard`} />

      <div className="flex-1 space-y-6 p-6 max-w-7xl mx-auto w-full">
        {/* Welcome Block */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800/70 pb-5">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              Selamat datang kembali, {user.name}!
              <Sparkles className="h-5 w-5 text-amber-500 fill-amber-500/20 animate-pulse" />
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Anda masuk sebagai <span className="font-semibold text-zinc-700 dark:text-zinc-300">{roleName}</span>. Berikut ringkasan aktivitas terbaru Anda hari ini.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-3 py-1 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400 border-zinc-200/60 dark:border-zinc-800 text-[11px] font-medium">
              <Calendar className="h-3 w-3 mr-1.5 text-zinc-400" />
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </Badge>
          </div>
        </div>

        {isAdminOrOwner ? (
          /* ======================================================== */
          /* ADMIN & OWNER DASHBOARD LAYOUT                          */
          /* ======================================================== */
          <div className="space-y-6">
            {/* Stats Overview Grid */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              {/* Total Revenue */}
              <Card className="relative overflow-hidden group hover:shadow-md transition-all border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Pendapatan</CardTitle>
                  <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                    <Coins className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 truncate">
                    {formatCurrency(stats.totalRevenue || 0)}
                  </div>
                  <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1.5 flex items-center gap-1">
                    <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                      <ArrowUpRight className="h-3.5 w-3.5" /> +12.4%
                    </span>
                    dari bulan lalu
                  </div>
                </CardContent>
              </Card>

              {/* Total Orders */}
              <Card className="relative overflow-hidden group hover:shadow-md transition-all border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Transaksi</CardTitle>
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 shrink-0 group-hover:scale-105 transition-transform">
                    <Receipt className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    {stats.totalOrders || 0}
                  </div>
                  <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1.5 flex items-center gap-1">
                    <span className="text-blue-600 font-semibold flex items-center gap-0.5">
                      <ArrowUpRight className="h-3.5 w-3.5" /> +8.2%
                    </span>
                    mutasi pesanan terekam
                  </div>
                </CardContent>
              </Card>

              {/* Total Members */}
              <Card className="relative overflow-hidden group hover:shadow-md transition-all border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Anggota Premium</CardTitle>
                  <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 shrink-0 group-hover:scale-105 transition-transform">
                    <Users className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    {stats.totalMembers || 0}
                  </div>
                  <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1.5 flex items-center gap-1">
                    <span className="text-purple-600 font-semibold flex items-center gap-0.5">
                      <ArrowUpRight className="h-3.5 w-3.5" /> +15.1%
                    </span>
                    loyalty member aktif
                  </div>
                </CardContent>
              </Card>

              {/* Stock status */}
              <Card className="relative overflow-hidden group hover:shadow-md transition-all border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Katalog Produk</CardTitle>
                  <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
                    <Package className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                    {stats.totalProducts || 0}
                    {stats.lowStockCount ? stats.lowStockCount > 0 && (
                      <Badge className="bg-rose-50 dark:bg-rose-950/30 text-rose-600 border border-rose-200/50 text-[9px] animate-pulse">
                        {stats.lowStockCount} Tipis
                      </Badge>
                    ) : null}
                  </div>
                  <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1.5 flex items-center gap-1">
                    Stok produk terdaftar aktif
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Custom Interactive Charts Block */}
            <div className="grid gap-6 md:grid-cols-3">
              {/* Sales Curve Line Area Chart */}
              <Card className="md:col-span-2 border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950/20">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-bold">Tren Penjualan Bulanan</CardTitle>
                    <CardDescription className="text-xs">Grafik arus penerimaan pendapatan terverifikasi (settled).</CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 text-[10px] flex items-center gap-1 border-none py-1 px-2.5">
                    <TrendingUp className="h-3.5 w-3.5" /> IDR Realtime
                  </Badge>
                </CardHeader>
                <CardContent className="pt-4">
                  <SalesAreaChart data={stats.salesData || []} formatCurrency={formatCurrency} />
                </CardContent>
              </Card>

              {/* Payment Methods Donut Chart */}
              <Card className="flex flex-col h-full border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950/20">
                <CardHeader>
                  <CardTitle className="text-base font-bold">Metode Pembayaran</CardTitle>
                  <CardDescription className="text-xs">Proporsi kanal transaksi pilihan pelanggan.</CardDescription>
                </CardHeader>
                <CardContent className="pt-2 flex-1 flex flex-col justify-between">
                  <PaymentDonutChart data={stats.paymentData || []} />
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders Ledger Table */}
            <Card className="border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950/20">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">Transaksi Penjualan Terbaru</CardTitle>
                  <CardDescription className="text-xs">Ledger log pemesanan dan checkout konsumen real-time.</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild className="text-xs font-semibold cursor-pointer">
                  <Link href="/orders">Lihat Semua</Link>
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-100 dark:border-zinc-800">
                    <TableRow>
                      <TableHead className="py-3 px-6 text-xs font-semibold text-zinc-500 dark:text-zinc-400">Order ID</TableHead>
                      <TableHead className="py-3 px-6 text-xs font-semibold text-zinc-500 dark:text-zinc-400">Customer</TableHead>
                      <TableHead className="py-3 px-6 text-xs font-semibold text-zinc-500 dark:text-zinc-400">Tanggal</TableHead>
                      <TableHead className="py-3 px-6 text-xs font-semibold text-zinc-500 dark:text-zinc-400 text-right">Nilai Transaksi</TableHead>
                      <TableHead className="py-3 px-6 text-xs font-semibold text-zinc-500 dark:text-zinc-400 text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
                    {stats.recentOrders && stats.recentOrders.length > 0 ? (
                      stats.recentOrders.map((ord) => (
                        <TableRow key={ord.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                          <TableCell className="py-3.5 px-6 text-xs font-mono font-bold text-zinc-800 dark:text-zinc-300">
                            {ord.order_number}
                          </TableCell>
                          <TableCell className="py-3.5 px-6 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                            {ord.customer_name}
                          </TableCell>
                          <TableCell className="py-3.5 px-6 text-xs text-zinc-500 dark:text-zinc-400">
                            {new Date(ord.created_at).toLocaleString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </TableCell>
                          <TableCell className="py-3.5 px-6 text-sm font-bold text-zinc-900 dark:text-zinc-50 text-right">
                            {formatCurrency(ord.total_amount)}
                          </TableCell>
                          <TableCell className="py-3.5 px-6 text-center">
                            {getStatusBadge(ord.status)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center text-sm text-zinc-400 italic">
                          Belum ada transaksi terekam saat ini.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* ======================================================== */
          /* CUSTOMER/MEMBER DASHBOARD LAYOUT                        */
          /* ======================================================== */
          <div className="grid gap-6 md:grid-cols-3">
            {/* Left: Quick Milestones Cards Grid */}
            <div className="md:col-span-2 space-y-6">
              <div className="grid gap-4 grid-cols-2">
                {/* Reward Points */}
                <Card className="relative overflow-hidden group hover:shadow-md transition-all border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950/20">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Loyalty Points</CardTitle>
                    <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-500 shrink-0 group-hover:scale-105 transition-transform">
                      <Sparkles className="h-4 w-4 fill-amber-500/25" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="text-xl md:text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
                      {stats.myPoints || 0} <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">pts</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1.5">
                      Tukarkan poin loyalty dengan kupon diskon menarik
                    </div>
                  </CardContent>
                </Card>

                {/* Total Orders */}
                <Card className="relative overflow-hidden group hover:shadow-md transition-all border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950/20">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Belanjaan</CardTitle>
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 shrink-0 group-hover:scale-105 transition-transform">
                      <ShoppingBag className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                      {stats.myTotalOrders || 0}
                    </div>
                    <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1.5 flex items-center gap-1">
                      {stats.myPendingOrders && stats.myPendingOrders > 0 ? (
                        <span className="text-amber-600 font-semibold flex items-center gap-0.5">
                          <Clock className="h-3 w-3 mr-0.5" /> {stats.myPendingOrders} Menunggu
                        </span>
                      ) : (
                        <span>Seluruh transaksi selesai diproses</span>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Available Coupons */}
                <Card className="relative overflow-hidden group hover:shadow-md transition-all border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950/20">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Kupon Saya</CardTitle>
                    <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 shrink-0 group-hover:scale-105 transition-transform">
                      <Ticket className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                      {stats.myCoupons || 0} <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">voucher</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1.5">
                      Kupon potongan harga siap digunakan di kasir
                    </div>
                  </CardContent>
                </Card>

                {/* Shopping shortcut */}
                <Card className="relative overflow-hidden group hover:shadow-md transition-all border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950/20">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Akses Belanja</CardTitle>
                    <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                      <ArrowUpRight className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <Button variant="default" size="sm" asChild className="w-full bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-zinc-50 dark:text-zinc-900 cursor-pointer text-xs font-semibold py-1">
                      <Link href="/">Mulai Belanja</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* My Recent Orders Table */}
              <Card className="border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950/20">
                <CardHeader>
                  <CardTitle className="text-base font-bold">Transaksi Belanja Terakhir Saya</CardTitle>
                  <CardDescription className="text-xs">Catatan pembelian pribadi Anda di toko.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-100 dark:border-zinc-800">
                      <TableRow>
                        <TableHead className="py-3 px-6 text-xs font-semibold text-zinc-500 dark:text-zinc-400">Order ID</TableHead>
                        <TableHead className="py-3 px-6 text-xs font-semibold text-zinc-500 dark:text-zinc-400">Tanggal</TableHead>
                        <TableHead className="py-3 px-6 text-xs font-semibold text-zinc-500 dark:text-zinc-400 text-right">Total Bayar</TableHead>
                        <TableHead className="py-3 px-6 text-xs font-semibold text-zinc-500 dark:text-zinc-400 text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
                      {stats.myRecentOrders && stats.myRecentOrders.length > 0 ? (
                        stats.myRecentOrders.map((ord) => (
                          <TableRow key={ord.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                            <TableCell className="py-3.5 px-6 text-xs font-mono font-bold text-zinc-800 dark:text-zinc-300">
                              {ord.order_number}
                            </TableCell>
                            <TableCell className="py-3.5 px-6 text-xs text-zinc-500 dark:text-zinc-400">
                              {new Date(ord.created_at).toLocaleDateString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </TableCell>
                            <TableCell className="py-3.5 px-6 text-sm font-bold text-zinc-900 dark:text-zinc-50 text-right">
                              {formatCurrency(ord.total_amount)}
                            </TableCell>
                            <TableCell className="py-3.5 px-6 text-center">
                              {getStatusBadge(ord.status)}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="py-8 text-center text-sm text-zinc-400 italic">
                            Anda belum pernah berbelanja sebelumnya.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Right: Gorgeous Virtual Member Card */}
            <div className="space-y-6">
              <Card className="border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950/20 overflow-hidden relative">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4 text-purple-500" />
                    Kartu Anggota Digital
                  </CardTitle>
                  <CardDescription className="text-xs">Gunakan kartu ini untuk memindai identitas loyalitas di kasir.</CardDescription>
                </CardHeader>
                <CardContent className="pt-2 flex flex-col items-center">
                  {/* Virtual Membership Card Layout */}
                  <div className="relative w-full aspect-[1.586/1] rounded-2xl p-5 text-white flex flex-col justify-between overflow-hidden shadow-lg border border-purple-500/20 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 dark:from-zinc-900 dark:via-purple-950/80 dark:to-zinc-900">
                    {/* Glowing effect inside card */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-6 translate-x-6 pointer-events-none" />

                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <div className="text-[10px] font-medium uppercase tracking-widest text-purple-200/80">Kala Karsa Bakery</div>
                        <div className="text-sm font-bold tracking-tight">VIP MEMBER</div>
                      </div>
                      <Badge className="bg-white/15 backdrop-blur-xs text-white border-none text-[8px] font-bold py-0.5 px-2.5">
                        ACTIVE
                      </Badge>
                    </div>

                    {/* Barcode & barcode number */}
                    <div className="space-y-1.5 w-full">
                      <BarcodePattern />
                      <div className="text-[9px] font-mono tracking-widest text-center text-purple-100/70 select-none">
                        MEMBER-{user.id.toString().padStart(6, '0')}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-end border-t border-white/10 pt-2.5">
                      <div className="space-y-0.5">
                        <div className="text-[8px] uppercase tracking-wider text-purple-200/70">Nama Anggota</div>
                        <div className="text-xs font-semibold tracking-wide truncate max-w-[150px]">{user.name}</div>
                      </div>
                      <div className="text-right space-y-0.5">
                        <div className="text-[8px] uppercase tracking-wider text-purple-200/70">Loyalty Poin</div>
                        <div className="text-xs font-bold text-amber-300 flex items-center gap-0.5 justify-end">
                          <Sparkles className="h-3 w-3 fill-amber-300/20" />
                          {stats.myPoints || 0} pts
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Loyalty tip */}
                  <div className="mt-5 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-800 text-[10px] text-zinc-500 dark:text-zinc-400 flex items-start gap-2">
                    <BellRing className="h-4.5 w-4.5 text-purple-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-zinc-700 dark:text-zinc-300 block mb-0.5">Info Anggota:</strong>
                      Tunjukkan barcode di atas kepada kasir fisik kala bertransaksi untuk otomatis mengumpulkan poin rewards belanjaan Anda (1 poin per kelipatan Rp 10.000).
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ======================================================== */
/* CUSTOM COMPONENT: Sales Curve Line Area Chart            */
/* ======================================================== */
interface ChartDataPoint {
  month: string;
  revenue: number;
  orders: number;
}

function SalesAreaChart({ data, formatCurrency }: { data: ChartDataPoint[]; formatCurrency: (val: number | string) => string }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const width = 600;
  const height = 240;
  const paddingX = 45;
  const paddingY = 30;

  const maxRevenue = Math.max(...data.map(d => Number(d.revenue)), 10000);
  const graphWidth = width - 2 * paddingX;
  const graphHeight = height - 2 * paddingY;

  // Compute dynamic slot and bar width
  const slotWidth = graphWidth / (data.length || 1);
  const barWidth = data.length === 1
    ? 48
    : Math.min(48, slotWidth * 0.55); // 55% of the column slot width, capped at 48px

  const points = data.map((d, i) => {
    const x = paddingX + i * slotWidth + (slotWidth - barWidth) / 2;
    const barHeight = (Number(d.revenue) / maxRevenue) * graphHeight;
    const y = height - paddingY - barHeight;
    return { x, y, barHeight, data: d };
  });

  const getBarPath = (x: number, y: number, w: number, h: number, revenue: number) => {
    if (revenue <= 0) {
      return '';
    }
    const activeH = Math.max(3, h);
    const activeY = height - paddingY - activeH;
    const r = Math.min(6, activeH, w / 2);
    return `M ${x} ${activeY + activeH} L ${x} ${activeY + r} A ${r} ${r} 0 0 1 ${x + r} ${activeY} L ${x + w - r} ${activeY} A ${r} ${r} 0 0 1 ${x + w} ${activeY + r} L ${x + w} ${activeY + activeH} Z`;
  };

  return (
    <div className="relative w-full overflow-hidden">
      {/* Tooltip Overlay */}
      {hoveredIdx !== null && points[hoveredIdx] && (
        <div
          className="absolute z-10 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 shadow-md text-[11px] space-y-1 backdrop-blur-xs pointer-events-none transition-all duration-150 animate-in fade-in zoom-in-95"
          style={{
            left: `${Math.min(points[hoveredIdx].x + barWidth / 2 - 60, width - 150)}px`,
            top: `${Math.max(points[hoveredIdx].y - 75, 5)}px`
          }}
        >
          <div className="font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
            {points[hoveredIdx].data.month}
          </div>
          <div className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">
            Omset: {formatCurrency(points[hoveredIdx].data.revenue)}
          </div>
          <div className="text-zinc-600 dark:text-zinc-300 font-medium">
            Transaksi: {points[hoveredIdx].data.orders} pesanan
          </div>
        </div>
      )}

      {/* SVG Canvas */}
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none overflow-visible">
        <defs>
          {/* Dynamic theme-compliant linear gradient for bars */}
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="barGradHover" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Horizontal thin grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = paddingY + ratio * (height - 2 * paddingY);
          return (
            <g key={idx}>
              <line
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="#e4e4e7"
                strokeWidth="0.8"
                strokeDasharray="4 4"
                className="dark:stroke-zinc-800/40"
              />
              <text
                x={paddingX - 8}
                y={y + 3.5}
                textAnchor="end"
                fontSize="9"
                className="fill-zinc-400 font-mono font-medium"
              >
                {new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(maxRevenue * (1 - ratio))}
              </text>
            </g>
          );
        })}

        {/* Bar Paths rendering */}
        {points.map((pt, idx) => {
          const isHovered = hoveredIdx === idx;
          const pathD = getBarPath(pt.x, pt.y, barWidth, pt.barHeight, pt.data.revenue);
          if (!pathD) {
            return null;
          }

          return (
            <path
              key={idx}
              d={pathD}
              fill={isHovered ? "url(#barGradHover)" : "url(#barGrad)"}
              className="transition-all duration-200 cursor-pointer animate-in fade-in slide-in-from-bottom-5"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          );
        })}

        {/* Data points glowing dots on top of the bars */}
        {points.map((pt, idx) => {
          const isHovered = hoveredIdx === idx;
          if (pt.data.revenue <= 0) {
            return null;
          }
          return (
            <g key={idx}>
              {isHovered && (
                <circle
                  cx={pt.x + barWidth / 2}
                  cy={pt.y}
                  r="7"
                  fill="var(--primary)"
                  fillOpacity="0.25"
                  className="animate-ping"
                />
              )}
              <circle
                cx={pt.x + barWidth / 2}
                cy={pt.y}
                r={isHovered ? 4 : 2.5}
                fill={isHovered ? "var(--primary-foreground)" : "var(--primary)"}
                stroke="var(--background)"
                strokeWidth="1.5"
                className="transition-all duration-150 cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            </g>
          );
        })}

        {/* Bottom Month Labels */}
        {points.map((pt, idx) => (
          <text
            key={idx}
            x={pt.x + barWidth / 2}
            y={height - 8}
            textAnchor="middle"
            fontSize="9"
            className="fill-zinc-400 font-medium"
          >
            {pt.data.month}
          </text>
        ))}

        {/* Invisible wide mouse-tracking overlay bars */}
        {points.map((pt, idx) => (
          <rect
            key={idx}
            x={pt.x - (slotWidth - barWidth) / 2}
            y={paddingY}
            width={slotWidth}
            height={height - 2 * paddingY}
            fill="transparent"
            className="cursor-pointer"
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
          />
        ))}
      </svg>
    </div>
  );
}

/* ======================================================== */
/* CUSTOM COMPONENT: Payment Methods Donut Chart            */
/* ======================================================== */
interface PaymentPoint {
  channel: string;
  count: number;
}

function PaymentDonutChart({ data }: { data: PaymentPoint[] }) {
  const totalCount = data.reduce((acc, d) => acc + d.count, 0) || 1;
  const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'];

  let accumulatedPercent = 0;
  const segments = data.map((d, idx) => {
    const percent = d.count / totalCount;
    const strokeDasharray = `${percent * 238.8} ${238.8 - percent * 238.8}`; // Radius 38 gives circumference ~238.8
    const strokeDashoffset = -accumulatedPercent * 238.8;
    accumulatedPercent += percent;
    return {
      ...d,
      percent,
      strokeDasharray,
      strokeDashoffset,
      color: colors[idx % colors.length]
    };
  });

  return (
    <div className="flex flex-col items-center justify-between h-full w-full space-y-6 pt-2 flex-1">
      {data.length > 0 ? (
        <>
          {/* Donut Circle SVG */}
          <div className="relative h-32 w-32 shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full select-none -rotate-90">
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="#e4e4e7"
                strokeWidth="6"
                className="dark:stroke-zinc-800/40"
              />

              {segments.map((seg, idx) => (
                <circle
                  key={idx}
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke={seg.color}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={seg.strokeDasharray}
                  strokeDashoffset={seg.strokeDashoffset}
                  className="transition-all duration-500 ease-in-out hover:stroke-[8px] cursor-pointer"
                />
              ))}
            </svg>

            {/* Center Summary Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-0.5 pointer-events-none">
              <span className="text-xl font-black text-zinc-800 dark:text-zinc-100">{totalCount}</span>
              <span className="text-[7.5px] uppercase tracking-widest font-bold text-zinc-400">Total Transaksi</span>
            </div>
          </div>

          {/* Color Indicators Legend Grid */}
          <div className="w-full grid grid-cols-2 gap-x-3 gap-y-2 text-[10px] text-zinc-500 dark:text-zinc-400 mt-auto">
            {segments.map((seg, idx) => (
              <div key={idx} className="flex items-center gap-1.5 min-w-0">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                <span className="font-semibold text-zinc-700 dark:text-zinc-300 truncate flex-1 min-w-0">
                  {seg.channel}
                </span>
                <span className="font-mono text-[9px] text-zinc-400 shrink-0">
                  {Math.round(seg.percent * 100)}%
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="h-36 w-full flex items-center justify-center text-xs text-zinc-400 italic">
          Data metode pembayaran belum terekam.
        </div>
      )}
    </div>
  );
}

Dashboard.layout = (props: { currentTeam?: { slug: string } | null }) => ({
  breadcrumbs: [
    {
      title: 'Dashboard',
      href: props.currentTeam ? dashboard(props.currentTeam.slug) : '/',
    },
  ],
});
