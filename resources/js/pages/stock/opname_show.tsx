import React, { useState } from 'react';
import { Head, usePage, Link, router } from '@inertiajs/react';
import { ClipboardList, ArrowLeft, ShieldAlert, Package, CheckCircle2, Lock, Calendar, User as UserIcon, RefreshCw, AlertTriangle, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
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

interface StockOpnameItem {
  id: number;
  product_id: number;
  system_stock: number;
  actual_stock: number;
  difference: number;
  notes: string | null;
  product?: {
    id: number;
    name: string;
    sku: string;
    cover_url?: string;
  };
}

interface StockOpname {
  id: number;
  opname_number: string;
  status: 'draft' | 'completed';
  notes: string | null;
  created_by: number;
  created_at: string;
  creator?: {
    id: number;
    name: string;
  };
  items: StockOpnameItem[];
}

interface OpnameShowProps {
  opname: StockOpname;
}

export default function StockOpnameShow({ opname }: OpnameShowProps) {
  const page = usePage();
  const user = (page.props as any).auth?.user;
  const roles = user?.roles || [];
  const isAdmin = roles.includes('admin');

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Metrics
  const totalItems = opname.items.length;
  const matchCount = opname.items.filter(item => item.difference === 0).length;
  const mismatchCount = totalItems - matchCount;
  
  // Calculate total gains / losses
  const totalGain = opname.items.reduce((acc, item) => item.difference > 0 ? acc + item.difference : acc, 0);
  const totalLoss = opname.items.reduce((acc, item) => item.difference < 0 ? acc + Math.abs(item.difference) : acc, 0);

  const handleCompleteOpname = () => {
    setIsProcessing(true);
    router.post(route('stock.opname.complete', opname.id), {}, {
      onSuccess: () => {
        setIsConfirmOpen(false);
        setIsProcessing(false);
        toast.success('Stok katalog berhasil direkonsiliasi dan disinkronisasi!');
      },
      onError: (errs) => {
        setIsProcessing(false);
        const firstErr = Object.values(errs)[0];
        toast.error(firstErr || 'Gagal merekonsiliasi stok');
      }
    });
  };

  return (
    <>
      <Head title={`Detail Stock Opname ${opname.opname_number}`} />

      <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
        {/* Back Link */}
        <div>
          <Link
            href={route('stock.opname.index')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-50 transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            Kembali ke Daftar Opname
          </Link>
        </div>

        {/* Title Block */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-2 py-0.5 rounded-lg">
                {opname.opname_number}
              </span>
              {opname.status === 'completed' ? (
                <Badge className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30 hover:bg-emerald-50 font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Selesai & Reconciled
                </Badge>
              ) : (
                <Badge className="bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/30 hover:bg-amber-50 font-medium flex items-center gap-1 animate-pulse">
                  <AlertTriangle className="h-3 w-3" />
                  Draft (Butuh Reconcile)
                </Badge>
              )}
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Rincian hasil pencocokan fisik barang dan status sinkronisasi sistem inventory.
            </p>
          </div>

          {opname.status === 'draft' && isAdmin && (
            <Button
              onClick={() => setIsConfirmOpen(true)}
              className="h-10 cursor-pointer bg-neutral-900 dark:bg-neutral-50 hover:bg-neutral-800 dark:hover:bg-neutral-100 text-neutral-50 dark:text-neutral-900 font-semibold gap-2 shadow-sm"
            >
              <RefreshCw className="h-4 w-4" />
              Selesaikan & Rekonsiliasi
            </Button>
          )}
        </div>

        {/* Audit Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 shadow-sm flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-500">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Tanggal Audit</div>
              <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 mt-0.5">
                {new Date(opname.created_at).toLocaleDateString('id-ID', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 shadow-sm flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-500">
              <UserIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Auditor Utama</div>
              <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 mt-0.5">
                {opname.creator?.name || 'Sistem'}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 shadow-sm flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-500">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Status Item</div>
              <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-100 mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span>{totalItems} item</span>
                <span className="text-neutral-300 dark:text-neutral-700">|</span>
                <span className="text-emerald-600 dark:text-emerald-400">{matchCount} Sesuai</span>
                {mismatchCount > 0 && (
                  <>
                    <span className="text-neutral-300 dark:text-neutral-700">|</span>
                    <span className="text-rose-600 dark:text-rose-400">{mismatchCount} Selisih</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 shadow-sm flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-500">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Akurasi / Mutasi</div>
              <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-100 mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span className="text-emerald-600 font-bold">+{totalGain} Gain</span>
                <span className="text-neutral-300 dark:text-neutral-700">|</span>
                <span className="text-rose-600 font-bold">-{totalLoss} Loss</span>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Notes Card */}
        {opname.notes && (
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/10 text-xs text-neutral-600 dark:text-neutral-400">
            <strong className="text-neutral-700 dark:text-neutral-300 block mb-1">Catatan Audit Sesi:</strong>
            {opname.notes}
          </div>
        )}

        {/* Comparison Line Items Table */}
        <div className="overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-neutral-900/50 shadow-sm">
          <Table>
            <TableHeader className="bg-neutral-50 dark:bg-neutral-900/80 border-b border-neutral-100 dark:border-neutral-800">
              <TableRow>
                <TableHead className="py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400">Produk</TableHead>
                <TableHead className="py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 text-center">Stok Catatan (Sistem)</TableHead>
                <TableHead className="py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 text-center">Stok Hitung (Fisik)</TableHead>
                <TableHead className="py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 text-center">Selisih Mutasi</TableHead>
                <TableHead className="py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 max-w-xs">Catatan Baris</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {opname.items.map((item) => (
                <TableRow
                  key={item.id}
                  className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-colors"
                >
                  <TableCell className="py-3.5 px-4">
                    {item.product ? (
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 overflow-hidden flex items-center justify-center shrink-0">
                          {item.product.cover_url ? (
                            <img
                              src={item.product.cover_url}
                              alt={item.product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="h-4 w-4 text-neutral-400" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-neutral-900 dark:text-neutral-50 line-clamp-1">
                            {item.product.name}
                          </div>
                          <div className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">
                            {item.product.sku}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Produk dihapus</span>
                    )}
                  </TableCell>
                  <TableCell className="py-3.5 px-4 text-center text-sm text-neutral-600 dark:text-neutral-400">
                    {item.system_stock} pcs
                  </TableCell>
                  <TableCell className="py-3.5 px-4 text-center text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    {item.actual_stock} pcs
                  </TableCell>
                  <TableCell className="py-3.5 px-4 text-center">
                    {item.difference === 0 ? (
                      <Badge className="bg-neutral-50 dark:bg-neutral-950/20 text-neutral-500 border border-neutral-200 dark:border-neutral-800/80 hover:bg-neutral-50 font-semibold text-[10px] py-0.5">
                        <Check className="h-3 w-3 mr-0.5 animate-in zoom-in duration-200" /> Stok Sesuai
                      </Badge>
                    ) : item.difference > 0 ? (
                      <Badge className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30 hover:bg-emerald-50 font-bold text-[10px] py-0.5">
                        +{item.difference} pcs (Gain)
                      </Badge>
                    ) : (
                      <Badge className="bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/30 hover:bg-rose-50 font-bold text-[10px] py-0.5">
                        {item.difference} pcs (Loss)
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-3.5 px-4 text-xs text-neutral-500 dark:text-neutral-400 max-w-xs truncate">
                    {item.notes || <span className="text-neutral-300 dark:text-neutral-700 italic">-</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Audit Status Stamp Lock Footer */}
        {opname.status === 'completed' && (
          <div className="p-4 rounded-xl border border-emerald-200/60 dark:border-emerald-800/30 bg-emerald-50/30 dark:bg-emerald-950/5 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <Lock className="h-4.5 w-4.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-400">Audit Selesai & Dikunci</h4>
                <p className="text-[10px] text-emerald-600/80 dark:text-emerald-500 mt-0.5">
                  Semua stok katalog telah diselaraskan dengan data fisik per-tanggal audit. Riwayat transaksi terkunci secara permanen.
                </p>
              </div>
            </div>
            <div className="text-right text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">
              SECURE LEDGER INTEGRITY APPROVED
            </div>
          </div>
        )}
      </div>

      {/* ==================== COMPLETE CONFIRMATION DIALOG ==================== */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-neutral-950 p-6 border border-neutral-200 dark:border-neutral-800 rounded-xl">
          <DialogHeader className="pb-3 border-b border-neutral-100 dark:border-neutral-900">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-neutral-900 dark:text-neutral-50">
              <ShieldAlert className="h-5 w-5 text-amber-500 animate-bounce" />
              Konfirmasi Sinkronisasi Stok Aktual
            </DialogTitle>
            <DialogDescription className="text-sm pt-2">
              Apakah Anda yakin ingin menyelesaikan pemeriksaan fisik ini? Tindakan ini akan:
            </DialogDescription>
          </DialogHeader>

          <div className="text-xs space-y-2 py-3 text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900/50 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-start gap-1.5">
              <span className="text-amber-500 font-bold">•</span>
              <span>Menyesuaikan stok katalog produk dengan jumlah fisik aktual secara otomatis.</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-amber-500 font-bold">•</span>
              <span>Mencatat selisih mutasi (loss/gain) ke dalam audit log pergerakan stok.</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-amber-500 font-bold">•</span>
              <span>Mengunci sesi opname ini secara permanen dari segala bentuk pengeditan.</span>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-neutral-100 dark:border-neutral-900 gap-2">
            <Button
              variant="outline"
              disabled={isProcessing}
              onClick={() => setIsConfirmOpen(false)}
              className="cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={isProcessing}
              onClick={handleCompleteOpname}
              className="cursor-pointer bg-neutral-900 dark:bg-neutral-50 hover:bg-neutral-800 dark:hover:bg-neutral-100 text-neutral-50 dark:text-neutral-900 font-semibold"
            >
              {isProcessing ? 'Memproses...' : 'Ya, Sesuaikan & Selesaikan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

StockOpnameShow.layout = {
  breadcrumbs: [
    {
      title: 'Dashboard',
      href: '/dashboard',
    },
    {
      title: 'Stock Opname',
      href: '/stock/opnames',
    },
    {
      title: 'Detail Audit',
      href: '#',
    },
  ],
};
