import React, { useState } from 'react';
import { Head, useForm, usePage, Link, router } from '@inertiajs/react';
import { Ticket, Plus, HelpCircle, Package, ArrowRight, Eye, ShieldAlert, CheckCircle2, Trash2, ChevronsUpDown, Check, Search, Calendar, BadgePercent, Coins, AlertCircle, ShoppingBag, ArrowLeftRight, CheckCircle, Copy, Lock, Tag, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Coupon {
  id: number;
  code: string;
  name: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  points_required: number;
  min_purchase: number;
  expires_at: string | null;
  is_active: boolean;
}

interface UserCoupon {
  id: number;
  user_id: number;
  coupon_id: number;
  redeemed_at: string;
  used_at: string | null;
  status: 'active' | 'used' | 'expired';
  coupon?: Coupon;
}

interface CouponIndexProps {
  coupons: Coupon[];
  myCoupons: UserCoupon[];
}

export default function CouponsIndex({ coupons, myCoupons }: CouponIndexProps) {
  const page = usePage();
  const user = (page.props as any).auth?.user;
  const roles = user?.roles || [];
  const isAdmin = roles.includes('admin') || roles.includes('owner');
  const isMember = user?.member_status === 'active';
  const myPoints = user?.member_points || 0;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'available' | 'my-wallet'>('available');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Admin Confirm Delete Dialog
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Inertia Form for Creating Coupons
  const { data, setData, post, processing, errors, reset } = useForm({
    code: '',
    name: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    points_required: '0',
    min_purchase: '0',
    expires_at: '',
    is_active: true,
  });

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();

    post('/coupons', {
      onSuccess: () => {
        setIsCreateOpen(false);
        reset();
        toast.success('Kupon baru berhasil ditambahkan ke katalog!');
      },
      onError: (errs) => {
        const firstErr = Object.values(errs)[0];
        toast.error(firstErr || 'Gagal menyimpan kupon');
      }
    });
  };

  const handleRedeemCoupon = (coupon: Coupon) => {
    if (myPoints < coupon.points_required) {
      toast.error('Poin Anda tidak mencukupi untuk menukarkan kupon ini');
      return;
    }

    router.post(`/coupons/${coupon.id}/redeem`, {}, {
      onSuccess: () => {
        toast.success(`Berhasil menukarkan kupon ${coupon.code}!`);
      },
      onError: (errs) => {
        const firstErr = Object.values(errs)[0];
        toast.error(firstErr || 'Gagal menukarkan kupon');
      }
    });
  };

  const handleDeleteCoupon = () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    router.delete(`/coupons/${deleteTarget}`, {
      onSuccess: () => {
        setDeleteTarget(null);
        setIsDeleting(false);
        toast.success('Kupon berhasil dihapus dari sistem');
      },
      onError: (errs) => {
        setIsDeleting(false);
        const firstErr = Object.values(errs)[0];
        toast.error(firstErr || 'Gagal menghapus kupon');
      }
    });
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Kode promo ${code} disalin!`);
    setTimeout(() => setCopiedCode(null), 2000);
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
      <Head title="Kelola Kupon & Promo Keanggotaan" />

      <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">

        {/* ========================================================================= */}
        {/* ======================= VIEW 1: ADMIN & OWNER VIEW ======================= */}
        {/* ========================================================================= */}
        {isAdmin ? (
          <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-neutral-100 dark:border-neutral-800">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
                  <Ticket className="h-6 w-6 text-neutral-500" />
                  Manajemen Kupon & Promo
                </h1>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  Tambahkan kupon diskon katalog belanja, kelola kupon reward penukaran poin member, dan pantau status aktif promo.
                </p>
              </div>

              <Button
                onClick={() => setIsCreateOpen(true)}
                className="h-10 cursor-pointer bg-neutral-900 dark:bg-neutral-50 hover:bg-neutral-800 dark:hover:bg-neutral-100 text-neutral-50 dark:text-neutral-900 font-semibold gap-2 shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Tambah Kupon Baru
              </Button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 shadow-sm flex items-center gap-3.5">
                <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
                  <Tag className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Total Kupon Aktif</div>
                  <div className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mt-0.5">
                    {coupons.filter(c => c.is_active).length}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 shadow-sm flex items-center gap-3.5">
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900">
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Kupon Penukaran Poin</div>
                  <div className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mt-0.5">
                    {coupons.filter(c => c.points_required > 0).length}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 shadow-sm flex items-center gap-3.5">
                <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Kupon Expired Segera</div>
                  <div className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mt-0.5">
                    {coupons.filter(c => c.expires_at && new Date(c.expires_at) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length}
                  </div>
                </div>
              </div>
            </div>

            {/* Coupons Admin Table */}
            <div className="overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-neutral-900/50 shadow-sm">
              <Table>
                <TableHeader className="bg-neutral-50 dark:bg-neutral-900/80 border-b border-neutral-100 dark:border-neutral-800">
                  <TableRow>
                    <TableHead className="py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400">Kode Kupon</TableHead>
                    <TableHead className="py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400">Nama Kupon</TableHead>
                    <TableHead className="py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 text-right">Potongan Diskon</TableHead>
                    <TableHead className="py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 text-center">Tukar Poin</TableHead>
                    <TableHead className="py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 text-right">Min. Belanja</TableHead>
                    <TableHead className="py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400">Tanggal Valid</TableHead>
                    <TableHead className="py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400">Status</TableHead>
                    <TableHead className="py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {coupons.length > 0 ? (
                    coupons.map((coupon) => {
                      const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
                      return (
                        <TableRow key={coupon.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-colors">
                          <TableCell className="py-3 px-4">
                            <span className="font-mono text-xs font-bold tracking-wider bg-neutral-100 dark:bg-neutral-900 px-2.5 py-1 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg">
                              {coupon.code}
                            </span>
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">{coupon.name}</div>
                            <div className="text-xs text-neutral-400 dark:text-neutral-500 line-clamp-1">{coupon.description || '-'}</div>
                          </TableCell>
                          <TableCell className="py-3 px-4 text-right font-bold text-neutral-900 dark:text-neutral-50">
                            {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : formatRupiah(coupon.discount_value)}
                          </TableCell>
                          <TableCell className="py-3 px-4 text-center">
                            {coupon.points_required > 0 ? (
                              <Badge className="bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40 font-semibold text-[10px]">
                                {coupon.points_required} Poin
                              </Badge>
                            ) : (
                              <Badge className="bg-neutral-100 dark:bg-neutral-950 text-neutral-500 border border-neutral-200 dark:border-neutral-800 font-semibold text-[10px]">
                                Gratis
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-3 px-4 text-right text-xs text-neutral-600 dark:text-neutral-400">
                            {coupon.min_purchase > 0 ? formatRupiah(coupon.min_purchase) : '-'}
                          </TableCell>
                          <TableCell className="py-3 px-4 text-xs text-neutral-500 dark:text-neutral-400">
                            {coupon.expires_at ? (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 shrink-0" />
                                {new Date(coupon.expires_at).toLocaleDateString('id-ID', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </div>
                            ) : (
                              <span className="text-emerald-600 dark:text-emerald-500 font-medium">Selamanya</span>
                            )}
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            {isExpired ? (
                              <Badge className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/80">
                                Kedaluwarsa
                              </Badge>
                            ) : coupon.is_active ? (
                              <Badge className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30">
                                Aktif
                              </Badge>
                            ) : (
                              <Badge className="bg-neutral-100 dark:bg-neutral-950 text-neutral-400 border border-neutral-200 dark:border-neutral-850">
                                Nonaktif
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-3 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteTarget(coupon.id)}
                              className="h-8 w-8 text-neutral-400 hover:text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="py-12 text-center text-sm text-neutral-400">
                        <Ticket className="h-8 w-8 mx-auto text-neutral-300 mb-2 animate-bounce" />
                        Belum ada kupon diskon terekam di sistem.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        ) : (

          // =========================================================================
          // ======================= VIEW 2: CUSTOMER / MEMBER VIEW ==================
          // =========================================================================
          <>
            {/* Keanggotaan Member Status Check */}
            {!isMember ? (
              <div className="p-8 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 text-center max-w-2xl mx-auto space-y-4 my-8">
                <div className="h-12 w-12 rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                  <Lock className="h-6 w-6" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-50">Daftar Keanggotaan Kala Karsa Bakery</h2>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
                    Kupon promo penukaran poin rewards hanya dapat dinikmati oleh member aktif. Daftarkan nomor telepon Anda untuk langsung mulai mengumpulkan poin!
                  </p>
                </div>
                <div className="pt-2">
                  <Link href="/membership">
                    <Button className="cursor-pointer bg-neutral-900 dark:bg-neutral-50 hover:bg-neutral-800 dark:hover:bg-neutral-100 text-neutral-50 dark:text-neutral-900 font-semibold px-6 h-10 gap-2">
                      Daftar Member Sekarang
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* Member Points Dashboard Header */}
                <div className="relative rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-neutral-950 dark:via-neutral-950 dark:to-indigo-950/10 p-6 overflow-hidden shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  {/* Visual Background Accent */}
                  <div className="absolute right-0 top-0 h-40 w-40 bg-indigo-200/10 dark:bg-indigo-500/5 rounded-full blur-2xl" />

                  <div className="flex items-center gap-4 relative z-10">
                    <div className="h-14 w-14 rounded-2xl bg-indigo-600 text-neutral-50 flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0 animate-pulse">
                      <Coins className="h-7 w-7" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-indigo-600/80 dark:text-indigo-400 uppercase tracking-wider">Tabungan Poin Belanja</div>
                      <div className="text-3xl font-black text-neutral-900 dark:text-neutral-50 mt-1 flex items-baseline gap-1">
                        {myPoints}
                        <span className="text-xs font-semibold text-neutral-400">Poin</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 relative z-10 max-w-sm">
                    <div className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Cara Kumpulkan Poin:</div>
                    <p className="text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                      Setiap pembelanjaan nominal kelipatan di katalog e-commerce otomatis menghasilkan poin rewards yang terakumulasi langsung di akun Anda!
                    </p>
                  </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-2">
                  <button
                    onClick={() => setActiveTab('available')}
                    className={cn(
                      "px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer",
                      activeTab === 'available'
                        ? "border-neutral-900 dark:border-neutral-50 text-neutral-900 dark:text-neutral-50"
                        : "border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                    )}
                  >
                    Katalog Hadiah Kupon ({coupons.filter(c => c.is_active).length})
                  </button>
                  <button
                    onClick={() => setActiveTab('my-wallet')}
                    className={cn(
                      "px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer",
                      activeTab === 'my-wallet'
                        ? "border-neutral-900 dark:border-neutral-50 text-neutral-900 dark:text-neutral-50"
                        : "border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                    )}
                  >
                    Dompet Kupon Saya ({myCoupons.length})
                  </button>
                </div>

                {/* TAB CONTENT: AVAILABLE COUPONS */}
                {activeTab === 'available' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {coupons.filter(c => c.is_active).length > 0 ? (
                      coupons.filter(c => c.is_active).map((coupon) => {
                        const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
                        if (isExpired) return null;

                        const canClaim = myPoints >= coupon.points_required;

                        return (
                          <div
                            key={coupon.id}
                            className="relative flex rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 shadow-sm overflow-hidden hover:shadow-md transition-all group"
                          >
                            {/* Ticket left side cutout */}
                            <div className="w-[120px] bg-gradient-to-br from-indigo-600 to-purple-600 text-neutral-50 flex flex-col items-center justify-center p-4 border-r border-dashed border-neutral-200 dark:border-neutral-800 shrink-0 relative">
                              {/* Ticket Cutouts */}
                              <div className="absolute top-0 right-0 h-4 w-4 bg-neutral-50 dark:bg-neutral-950 rounded-full translate-x-1/2 -translate-y-1/2 z-10" />
                              <div className="absolute bottom-0 right-0 h-4 w-4 bg-neutral-50 dark:bg-neutral-950 rounded-full translate-x-1/2 translate-y-1/2 z-10" />

                              <BadgePercent className="h-6 w-6 opacity-80 mb-2" />
                              <div className="text-xl font-black tracking-tight">
                                {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : 'Diskon'}
                              </div>
                              <div className="text-[10px] font-bold uppercase tracking-wider opacity-90 mt-0.5">
                                {coupon.discount_type === 'fixed' ? 'Nominal' : 'Promo'}
                              </div>
                            </div>

                            {/* Ticket right side info */}
                            <div className="flex-1 p-4 flex flex-col justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                    {coupon.name}
                                  </h3>
                                  <span className="font-mono text-[10px] font-semibold text-neutral-400 uppercase">
                                    Code: {coupon.code}
                                  </span>
                                </div>
                                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2">
                                  {coupon.description || 'Gunakan potongan diskon spesial ke keranjang belanja Anda.'}
                                </p>
                              </div>

                              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="space-y-0.5">
                                  <div className="text-[10px] text-neutral-400">Minimal Belanja:</div>
                                  <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                                    {coupon.min_purchase > 0 ? formatRupiah(coupon.min_purchase) : 'Tidak ada'}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  {coupon.points_required > 0 ? (
                                    <Button
                                      onClick={() => handleRedeemCoupon(coupon)}
                                      disabled={!canClaim}
                                      className={cn(
                                        "h-8 text-[11px] font-bold cursor-pointer rounded-lg px-3.5",
                                        canClaim
                                          ? "bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold"
                                          : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border border-neutral-200 dark:border-neutral-800 cursor-not-allowed"
                                      )}
                                    >
                                      <Coins className="h-3.5 w-3.5 mr-1" />
                                      {coupon.points_required} Poin
                                    </Button>
                                  ) : (
                                    <Badge className="bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900 font-semibold">
                                      Gratis
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-span-2 py-12 border rounded-xl border-neutral-200 dark:border-neutral-800 text-center text-neutral-400">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
                        Belum ada penawaran kupon diskon aktif saat ini.
                      </div>
                    )}
                  </div>
                )}

                {/* TAB CONTENT: CLAIMED COUPONS */}
                {activeTab === 'my-wallet' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myCoupons.length > 0 ? (
                      myCoupons.map((claimed) => {
                        const coupon = claimed.coupon;
                        if (!coupon) return null;

                        const isUsed = claimed.status === 'used';
                        const isExpired = claimed.status === 'expired' || (coupon.expires_at && new Date(coupon.expires_at) < new Date());

                        return (
                          <div
                            key={claimed.id}
                            className={cn(
                              "relative flex rounded-xl border bg-white dark:bg-neutral-900/40 shadow-sm overflow-hidden",
                              isUsed || isExpired
                                ? "border-neutral-200 dark:border-neutral-800/80 opacity-60"
                                : "border-indigo-200 dark:border-indigo-900 shadow-indigo-50/50"
                            )}
                          >
                            {/* Left cutout */}
                            <div className={cn(
                              "w-[120px] text-neutral-50 flex flex-col items-center justify-center p-4 border-r border-dashed border-neutral-200 dark:border-neutral-800 shrink-0 relative",
                              isUsed || isExpired
                                ? "bg-neutral-400 dark:bg-neutral-800 text-neutral-200"
                                : "bg-gradient-to-br from-indigo-600 to-purple-600"
                            )}>
                              {/* Cutouts */}
                              <div className="absolute top-0 right-0 h-4 w-4 bg-neutral-50 dark:bg-neutral-950 rounded-full translate-x-1/2 -translate-y-1/2 z-10" />
                              <div className="absolute bottom-0 right-0 h-4 w-4 bg-neutral-50 dark:bg-neutral-950 rounded-full translate-x-1/2 translate-y-1/2 z-10" />

                              <BadgePercent className="h-6 w-6 opacity-80 mb-2" />
                              <div className="text-xl font-black tracking-tight">
                                {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : 'Diskon'}
                              </div>
                              <span className="text-[9px] uppercase tracking-widest font-semibold mt-1">
                                {isUsed ? 'Terpakai' : isExpired ? 'Expired' : 'KLAIMED'}
                              </span>
                            </div>

                            {/* Right info */}
                            <div className="flex-1 p-4 flex flex-col justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-50">
                                    {coupon.name}
                                  </h3>

                                  {isUsed ? (
                                    <Badge className="bg-neutral-100 text-neutral-500 border border-neutral-200 text-[9px] font-bold">Terpakai</Badge>
                                  ) : isExpired ? (
                                    <Badge className="bg-rose-50 text-rose-500 border border-rose-100 text-[9px] font-bold">Expired</Badge>
                                  ) : (
                                    <Badge className="bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900 text-[9px] font-bold animate-pulse">
                                      Aktif & Siap Pakai
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2">
                                  {coupon.description || 'Gunakan potongan diskon spesial ke keranjang belanja Anda.'}
                                </p>
                              </div>

                              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="space-y-0.5">
                                  <div className="text-[10px] text-neutral-400">Kode Kupon Anda:</div>
                                  <span className="font-mono text-xs font-black text-neutral-850 dark:text-neutral-150 tracking-wider">
                                    {coupon.code}
                                  </span>
                                </div>

                                {!isUsed && !isExpired && (
                                  <Button
                                    onClick={() => copyToClipboard(coupon.code)}
                                    size="sm"
                                    className="h-8 text-[11px] cursor-pointer font-bold bg-neutral-900 dark:bg-neutral-50 hover:bg-neutral-800 dark:hover:bg-neutral-100 text-neutral-50 dark:text-neutral-900 flex items-center gap-1.5"
                                  >
                                    {copiedCode === coupon.code ? (
                                      <>
                                        <CheckCircle className="h-3.5 w-3.5" />
                                        Tersalin
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="h-3.5 w-3.5" />
                                        Salin Kode
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-span-2 py-12 border rounded-xl border-dashed border-neutral-200 dark:border-neutral-800 text-center text-neutral-400">
                        <Ticket className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
                        Anda belum memiliki kupon yang ditukarkan. Tukarkan poin Anda sekarang!
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* ==================== CREATE COUPON SHEET ==================== */}
      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-md w-full bg-white dark:bg-neutral-950 p-6 flex flex-col h-full border-l border-neutral-200 dark:border-neutral-800">
          <SheetHeader className="pb-4 border-b border-neutral-100 dark:border-neutral-900">
            <SheetTitle className="text-xl font-bold flex items-center gap-2">
              <Ticket className="h-5 w-5 text-neutral-500 animate-in spin-in duration-300" />
              Buat Kupon Baru
            </SheetTitle>
            <SheetDescription>
              Buat voucher promosi gratis atau kupon khusus member yang bisa ditukarkan menggunakan poin belanja.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleCreateCoupon} className="flex-1 flex flex-col justify-between py-4 space-y-6">
            <div className="space-y-4">

              {/* Kode Kupon */}
              <div className="space-y-1.5">
                <Label htmlFor="code" className="text-sm font-semibold">Kode Kupon (Uppercase)</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="Contoh: KALAPROMO15"
                  value={data.code}
                  onChange={(e) => setData('code', e.target.value.toUpperCase())}
                  className="h-10 text-sm font-mono tracking-wider"
                />
                {errors.code && <div className="text-xs text-rose-500 mt-1">{errors.code}</div>}
              </div>

              {/* Nama Kupon */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-semibold">Nama Kupon</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Contoh: Diskon Bulanan Khusus Member"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  className="h-10 text-sm"
                />
                {errors.name && <div className="text-xs text-rose-500 mt-1">{errors.name}</div>}
              </div>

              {/* Deskripsi */}
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-sm font-semibold">Keterangan / Deskripsi</Label>
                <Input
                  id="description"
                  type="text"
                  placeholder="Contoh: Dapatkan diskon 15% maksimal Rp 50.000"
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  className="h-10 text-sm"
                />
                {errors.description && <div className="text-xs text-rose-500 mt-1">{errors.description}</div>}
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 flex flex-col">
                  <Label className="text-sm font-semibold">Tipe Diskon</Label>
                  <Select
                    value={data.discount_type}
                    onValueChange={(val) => setData('discount_type', val as any)}
                  >
                    <SelectTrigger className="w-full h-10 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 text-neutral-850 dark:text-neutral-150 cursor-pointer">
                      <SelectValue placeholder="Pilih Tipe" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                      <SelectItem value="percentage" className="cursor-pointer">Persentase (%)</SelectItem>
                      <SelectItem value="fixed" className="cursor-pointer">Nominal Tetap (Rp)</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.discount_type && <div className="text-xs text-rose-500 mt-1">{errors.discount_type}</div>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="discount_value" className="text-sm font-semibold">Nilai Diskon</Label>
                  <Input
                    id="discount_value"
                    type="number"
                    min="0"
                    placeholder={data.discount_type === 'percentage' ? '15%' : '20000'}
                    value={data.discount_value}
                    onChange={(e) => setData('discount_value', e.target.value)}
                    className="h-10 text-sm"
                  />
                  {errors.discount_value && <div className="text-xs text-rose-500 mt-1">{errors.discount_value}</div>}
                </div>
              </div>

              {/* Points Required & Min Purchase */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="points_required" className="text-sm font-semibold">Butuh Poin (Member)</Label>
                  <Input
                    id="points_required"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={data.points_required}
                    onChange={(e) => setData('points_required', e.target.value)}
                    className="h-10 text-sm"
                  />
                  <span className="text-[9px] text-muted-foreground">Isi 0 jika gratis</span>
                  {errors.points_required && <div className="text-xs text-rose-500 mt-1">{errors.points_required}</div>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="min_purchase" className="text-sm font-semibold">Min. Belanja (Rupiah)</Label>
                  <Input
                    id="min_purchase"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={data.min_purchase}
                    onChange={(e) => setData('min_purchase', e.target.value)}
                    className="h-10 text-sm"
                  />
                  <span className="text-[9px] text-muted-foreground">0 jika tanpa minimal</span>
                  {errors.min_purchase && <div className="text-xs text-rose-500 mt-1">{errors.min_purchase}</div>}
                </div>
              </div>

              {/* Expiry Date */}
              <div className="space-y-1.5">
                <Label htmlFor="expires_at" className="text-sm font-semibold">Tanggal Kedaluwarsa (Optional)</Label>
                <Input
                  id="expires_at"
                  type="date"
                  value={data.expires_at}
                  onChange={(e) => setData('expires_at', e.target.value)}
                  className="h-10 text-sm"
                />
                {errors.expires_at && <div className="text-xs text-rose-500 mt-1">{errors.expires_at}</div>}
              </div>

            </div>

            <SheetFooter className="pt-4 border-t border-neutral-100 dark:border-neutral-900 gap-2 shrink-0">
              <SheetClose asChild>
                <Button variant="outline" className="cursor-pointer">Batal</Button>
              </SheetClose>
              <Button
                type="submit"
                disabled={processing}
                className="cursor-pointer bg-neutral-900 dark:bg-neutral-50 hover:bg-neutral-800 dark:hover:bg-neutral-100 text-neutral-50 dark:text-neutral-900 font-semibold"
              >
                Buat Kupon
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* ==================== DELETE CONFIRMATION DIALOG ==================== */}
      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-neutral-950 p-6 border border-neutral-200 dark:border-neutral-800 rounded-xl">
          <DialogHeader className="pb-3 border-b border-neutral-100 dark:border-neutral-900">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-neutral-900 dark:text-neutral-50">
              <ShieldAlert className="h-5 w-5 text-rose-500 animate-bounce" />
              Hapus Kupon Diskon
            </DialogTitle>
            <DialogDescription className="text-sm pt-2">
              Apakah Anda yakin ingin menghapus kupon diskon ini secara permanen dari sistem?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-3 border-t border-neutral-100 dark:border-neutral-900 gap-2">
            <Button
              variant="outline"
              disabled={isDeleting}
              onClick={() => setDeleteTarget(null)}
              className="cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={isDeleting}
              onClick={handleDeleteCoupon}
              className="cursor-pointer bg-rose-600 hover:bg-rose-700 text-neutral-50 font-semibold"
            >
              {isDeleting ? 'Menghapus...' : 'Ya, Hapus Kupon'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

CouponsIndex.layout = {
  breadcrumbs: [
    {
      title: 'Dashboard',
      href: '/dashboard',
    },
    {
      title: 'Kupon Promo',
      href: '/coupons',
    },
  ],
};
