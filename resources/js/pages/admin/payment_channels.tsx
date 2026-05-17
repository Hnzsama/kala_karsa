import React, { useState, useMemo } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { update as updatePaymentChannel } from '@/actions/App/Http/Controllers/Admin/PaymentChannelController';
import { CreditCard, Edit2, ShieldCheck, ShieldAlert, CheckCircle, HelpCircle, Check, X, ToggleLeft, ToggleRight, Sparkles, Filter, Percent, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PaymentChannel {
  id: number;
  code: string;
  name: string;
  type: 'VIRTUAL_ACCOUNT' | 'E_WALLET' | 'QRIS' | 'CREDIT_CARD' | 'RETAIL' | 'PAY_LATER';
  fee_flat: number;
  fee_percent: number;
  is_active: boolean;
}

interface PaymentChannelsProps {
  paymentChannels: PaymentChannel[];
}

export default function PaymentChannels({ paymentChannels }: PaymentChannelsProps) {
  const [editingChannel, setEditingChannel] = useState<PaymentChannel | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Stats
  const stats = useMemo(() => {
    return {
      total: paymentChannels.length,
      active: paymentChannels.filter(c => c.is_active).length,
      vaCount: paymentChannels.filter(c => c.type === 'VIRTUAL_ACCOUNT').length,
      eWalletCount: paymentChannels.filter(c => c.type === 'E_WALLET' || c.type === 'QRIS').length,
    };
  }, [paymentChannels]);

  // Filtered payment channels
  const filteredChannels = useMemo(() => {
    return paymentChannels.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            c.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'ALL' || c.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [paymentChannels, searchQuery, typeFilter]);

  // Update Form
  const { data, setData, put, processing, errors, reset } = useForm({
    fee_flat: 0,
    fee_percent: 0,
    is_active: true,
  });

  const handleEditClick = (channel: PaymentChannel) => {
    setEditingChannel(channel);
    setData({
      fee_flat: Number(channel.fee_flat),
      fee_percent: Number(channel.fee_percent),
      is_active: Boolean(channel.is_active),
    });
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChannel) return;

    put(updatePaymentChannel(editingChannel.id).url, {
      onSuccess: () => {
        setEditingChannel(null);
        reset();
        toast.success(`Metode pembayaran ${editingChannel.name} berhasil diperbarui.`);
      },
      onError: (errs) => {
        const firstErr = Object.values(errs)[0];
        toast.error(firstErr || 'Gagal menyimpan perubahan.');
      }
    });
  };

  const handleToggleStatus = (channel: PaymentChannel) => {
    router.put(updatePaymentChannel(channel.id).url, {
      fee_flat: Number(channel.fee_flat),
      fee_percent: Number(channel.fee_percent),
      is_active: !channel.is_active,
    }, {
      onSuccess: () => {
        toast.success(`Status ${channel.name} berhasil diubah.`);
      },
      onError: (errs) => {
        const firstErr = Object.values(errs)[0];
        toast.error(firstErr || 'Gagal memperbarui status.');
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

  const getChannelBadge = (type: string) => {
    switch (type) {
      case 'VIRTUAL_ACCOUNT':
        return <Badge className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-150/40 font-semibold text-[10px]">Virtual Account</Badge>;
      case 'E_WALLET':
        return <Badge className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-150/40 font-semibold text-[10px]">E-Wallet</Badge>;
      case 'QRIS':
        return <Badge className="bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border border-teal-150/40 font-semibold text-[10px]">QRIS</Badge>;
      case 'CREDIT_CARD':
        return <Badge className="bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border border-violet-150/40 font-semibold text-[10px]">Kartu Kredit</Badge>;
      case 'RETAIL':
        return <Badge className="bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-150/40 font-semibold text-[10px]">Ritel Toko</Badge>;
      case 'PAY_LATER':
        return <Badge className="bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-150/40 font-semibold text-[10px]">Pay Later</Badge>;
      default:
        return <Badge className="bg-neutral-100 text-neutral-600 text-[10px]">{type}</Badge>;
    }
  };

  return (
    <>
      <Head title="Pengaturan Metode Pembayaran - Admin" />

      <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-neutral-500" />
              Metode Pembayaran & Biaya Admin
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Konfigurasi detail channel pembayaran Midtrans Snap, atur biaya flat maupun persentase admin, serta aktifkan opsi pembayaran.
            </p>
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-neutral-250 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 shadow-sm flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Total Metode</div>
              <div className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mt-0.5">{stats.total}</div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-neutral-250 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 shadow-sm flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Metode Aktif</div>
              <div className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mt-0.5">{stats.active}</div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-neutral-250 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 shadow-sm flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-900">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Transfer VA</div>
              <div className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mt-0.5">{stats.vaCount}</div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-neutral-250 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 shadow-sm flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-900">
              <Percent className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Dompet & QRIS</div>
              <div className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mt-0.5">{stats.eWalletCount}</div>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="w-full sm:max-w-xs relative">
            <Input
              type="text"
              placeholder="Cari metode pembayaran..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 text-xs w-full"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1 sm:pb-0">
            {['ALL', 'VIRTUAL_ACCOUNT', 'E_WALLET', 'QRIS', 'CREDIT_CARD', 'RETAIL', 'PAY_LATER'].map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
                  typeFilter === type
                    ? "bg-neutral-900 dark:bg-neutral-50 text-neutral-55 dark:text-neutral-950"
                    : "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-350"
                )}
              >
                {type === 'ALL' ? 'Semua Tipe' : 
                 type === 'VIRTUAL_ACCOUNT' ? 'Virtual Account' :
                 type === 'E_WALLET' ? 'E-Wallet' :
                 type === 'QRIS' ? 'QRIS' :
                 type === 'CREDIT_CARD' ? 'Kartu Kredit' :
                 type === 'RETAIL' ? 'Ritel Toko' : 'Pay Later'}
              </button>
            ))}
          </div>
        </div>

        {/* Channels Table */}
        <div className="overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-neutral-900/50 shadow-sm">
          <Table>
            <TableHeader className="bg-neutral-50 dark:bg-neutral-900/80 border-b border-neutral-100 dark:border-neutral-800">
              <TableRow>
                <TableHead className="py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400">Kode</TableHead>
                <TableHead className="py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400">Tipe</TableHead>
                <TableHead className="py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400">Nama Channel</TableHead>
                <TableHead className="py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 text-right">Admin Flat</TableHead>
                <TableHead className="py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 text-center">Admin Persentase</TableHead>
                <TableHead className="py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 text-center">Status Aktif</TableHead>
                <TableHead className="py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredChannels.length > 0 ? (
                filteredChannels.map((channel) => (
                  <TableRow key={channel.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-colors">
                    <TableCell className="py-3 px-4">
                      <span className="font-mono text-xs font-bold bg-neutral-100 dark:bg-neutral-900 px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-800">
                        {channel.code}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-4">{getChannelBadge(channel.type)}</TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">{channel.name}</div>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right font-semibold text-neutral-900 dark:text-neutral-50">
                      {channel.fee_flat > 0 ? formatRupiah(channel.fee_flat) : <span className="text-neutral-400">-</span>}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-center font-semibold text-neutral-900 dark:text-neutral-50">
                      {channel.fee_percent > 0 ? `${channel.fee_percent}%` : <span className="text-neutral-400">-</span>}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center">
                        <Switch
                          checked={channel.is_active}
                          onCheckedChange={() => handleToggleStatus(channel)}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClick(channel)}
                        className="h-8 w-8 text-neutral-400 hover:text-indigo-600 cursor-pointer"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-sm text-neutral-400">
                    <CreditCard className="h-8 w-8 mx-auto text-neutral-300 mb-2 animate-bounce" />
                    Metode pembayaran tidak ditemukan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Edit Modal */}
        <Dialog open={editingChannel !== null} onOpenChange={(open) => !open && setEditingChannel(null)}>
          <DialogContent className="sm:max-w-md bg-white dark:bg-neutral-950 p-6 border border-neutral-200 dark:border-neutral-800 rounded-xl">
            <DialogHeader className="pb-3 border-b border-neutral-100 dark:border-neutral-900">
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-neutral-500" />
                Edit Metode Pembayaran
              </DialogTitle>
              <DialogDescription className="text-xs">
                Ubah nominal biaya administrasi atau ubah status keaktifan metode pembayaran <strong>{editingChannel?.name}</strong>.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleUpdateSubmit} className="space-y-4 py-4">
              {/* Fee Flat */}
              <div className="space-y-1.5">
                <Label htmlFor="fee_flat" className="text-sm font-semibold">Biaya Flat (IDR)</Label>
                <Input
                  id="fee_flat"
                  type="number"
                  min="0"
                  value={data.fee_flat}
                  onChange={(e) => setData('fee_flat', Number(e.target.value))}
                  className="h-10 text-sm"
                  placeholder="Contoh: 4000"
                />
                {errors.fee_flat && <div className="text-xs text-rose-500 mt-1">{errors.fee_flat}</div>}
              </div>

              {/* Fee Percent */}
              <div className="space-y-1.5">
                <Label htmlFor="fee_percent" className="text-sm font-semibold">Biaya Persentase (%)</Label>
                <Input
                  id="fee_percent"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={data.fee_percent}
                  onChange={(e) => setData('fee_percent', Number(e.target.value))}
                  className="h-10 text-sm"
                  placeholder="Contoh: 2.0"
                />
                {errors.fee_percent && <div className="text-xs text-rose-500 mt-1">{errors.fee_percent}</div>}
              </div>

              {/* Is Active Status Switch */}
              <div className="flex items-center justify-between border border-neutral-150 dark:border-neutral-800 rounded-lg p-3">
                <div>
                  <Label htmlFor="is_active" className="text-sm font-semibold cursor-pointer">Aktifkan Metode Pembayaran</Label>
                  <p className="text-[10px] text-neutral-450 dark:text-neutral-400 mt-0.5">Tampilkan metode ini kepada pembeli saat checkout.</p>
                </div>
                <Switch
                  id="is_active"
                  checked={data.is_active}
                  onCheckedChange={(checked) => setData('is_active', checked)}
                />
              </div>

              <DialogFooter className="pt-3 border-t border-neutral-100 dark:border-neutral-900 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingChannel(null)}
                  className="cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={processing}
                  className="cursor-pointer bg-neutral-900 dark:bg-neutral-50 dark:text-neutral-900 font-semibold"
                >
                  Simpan Perubahan
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

      </div>
    </>
  );
}

PaymentChannels.layout = {
  breadcrumbs: [
    {
      title: 'Dashboard',
      href: '/dashboard',
    },
    {
      title: 'Metode Pembayaran',
      href: '/admin/payment-channels',
    },
  ],
};
