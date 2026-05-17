import React, { useState, useEffect } from 'react';
import { Head, useForm, usePage, Link, router } from '@inertiajs/react';
import { ArrowLeftRight, Plus, HelpCircle, Package, ArrowUpRight, ArrowDownRight, ClipboardList, ShieldAlert, ChevronsUpDown, Check, Search } from 'lucide-react';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

interface ProductItem {
  id: number;
  name: string;
  sku: string;
  stock: number;
}

interface Movement {
  id: number;
  product_id: number;
  quantity: number;
  type: 'restock' | 'damaged' | 'return' | 'sale' | 'opname_reconcile';
  notes: string | null;
  user_id: number;
  created_at: string;
  product?: {
    id: number;
    name: string;
    sku: string;
    cover_url?: string;
  };
  user?: {
    id: number;
    name: string;
  };
}

interface MovementsProps {
  movements: {
    data: Movement[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
  };
  products: ProductItem[];
  filters: {
    search: string;
  };
}

export default function StockMovementsIndex({ movements, products, filters }: MovementsProps) {
  const page = usePage();
  const user = (page.props as any).auth?.user;
  const roles = user?.roles || [];
  const isAdmin = roles.includes('admin');

  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [openProductSearch, setOpenProductSearch] = useState(false);
  const [searchVal, setSearchVal] = useState(filters?.search || '');

  // Debounced search logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if ((filters?.search || '') !== searchVal) {
        router.get(
          route('stock.movements'),
          { search: searchVal },
          { preserveState: true, replace: true }
        );
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchVal]);

  const { data, setData, post, processing, errors, reset } = useForm({
    product_id: '',
    quantity: '',
    type: 'restock',
    notes: '',
  });

  const handleSubmitAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!data.product_id) {
      toast.error('Silakan pilih produk terlebih dahulu');
      return;
    }
    if (!data.quantity || parseInt(data.quantity) === 0) {
      toast.error('Jumlah penyesuaian tidak boleh nol');
      return;
    }

    post(route('stock.adjust'), {
      onSuccess: () => {
        setIsAdjustOpen(false);
        reset();
        toast.success('Penyesuaian stok berhasil disimpan');
      },
      onError: (errs) => {
        const firstErr = Object.values(errs)[0];
        toast.error(firstErr || 'Gagal menyimpan penyesuaian stok');
      }
    });
  };

  const selectedProduct = products.find(p => p.id.toString() === data.product_id);

  const getMovementBadge = (type: string, quantity: number) => {
    const isPositive = quantity > 0;
    
    switch (type) {
      case 'restock':
        return (
          <Badge className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30 hover:bg-emerald-50 font-medium capitalize flex items-center gap-1 w-fit">
            <ArrowUpRight className="h-3 w-3" />
            Restock
          </Badge>
        );
      case 'damaged':
        return (
          <Badge className="bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/30 hover:bg-rose-50 font-medium capitalize flex items-center gap-1 w-fit">
            <ArrowDownRight className="h-3 w-3" />
            Rusak
          </Badge>
        );
      case 'return':
        return (
          <Badge className="bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 border border-sky-200/50 dark:border-sky-800/30 hover:bg-sky-50 font-medium capitalize flex items-center gap-1 w-fit">
            <ArrowUpRight className="h-3 w-3" />
            Retur
          </Badge>
        );
      case 'sale':
        return (
          <Badge className="bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/30 hover:bg-amber-50 font-medium capitalize flex items-center gap-1 w-fit">
            <ArrowDownRight className="h-3 w-3" />
            Penjualan
          </Badge>
        );
      case 'opname_reconcile':
        return (
          <Badge className="bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border border-purple-200/50 dark:border-purple-800/30 hover:bg-purple-50 font-medium capitalize flex items-center gap-1 w-fit">
            <ArrowLeftRight className="h-3 w-3" />
            Reconcile
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="capitalize flex items-center gap-1 w-fit">
            {type}
          </Badge>
        );
    }
  };

  return (
    <>
      <Head title="Riwayat Pergerakan Stok" />
      
      <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
              <ArrowLeftRight className="h-6 w-6 text-neutral-500" />
              Log Pergerakan Stok
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Audit ledger mutasi stok masuk, keluar, penjualan, rusak, dan rekonsiliasi opname produk.
            </p>
          </div>
          
          {isAdmin && (
            <Button 
              onClick={() => setIsAdjustOpen(true)}
              variant="outline" 
              className="h-10 gap-2 cursor-pointer hover:bg-neutral-50 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300"
            >
              <Plus className="h-4 w-4" />
              Penyesuaian Manual
            </Button>
          )}
        </div>

        {/* Sleek Search bar */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari produk, tipe, auditor, atau catatan..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {/* Ledger Table */}
        <div className="overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-neutral-900/50 shadow-sm">
          <Table>
            <TableHeader className="bg-neutral-50 dark:bg-neutral-900/80 border-b border-neutral-100 dark:border-neutral-800">
              <TableRow>
                <TableHead className="py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400">Tanggal</TableHead>
                <TableHead className="py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400">Produk</TableHead>
                <TableHead className="py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400">Tipe</TableHead>
                <TableHead className="py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 text-right">Mutasi</TableHead>
                <TableHead className="py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400">Auditor / User</TableHead>
                <TableHead className="py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 max-w-xs">Keterangan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {movements.data.length > 0 ? (
                movements.data.map((movement) => (
                  <TableRow 
                    key={movement.id} 
                    className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-colors"
                  >
                    <TableCell className="py-3.5 px-4 text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                      {new Date(movement.created_at).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell className="py-3.5 px-4">
                      {movement.product ? (
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 overflow-hidden flex items-center justify-center shrink-0">
                            {movement.product.cover_url ? (
                              <img 
                                src={movement.product.cover_url} 
                                alt={movement.product.name} 
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Package className="h-4 w-4 text-neutral-400" />
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-neutral-900 dark:text-neutral-50 line-clamp-1">
                              {movement.product.name}
                            </div>
                            <div className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">
                              {movement.product.sku}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Produk dihapus</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3.5 px-4">
                      {getMovementBadge(movement.type, movement.quantity)}
                    </TableCell>
                    <TableCell className={`py-3.5 px-4 text-sm font-semibold text-right whitespace-nowrap ${
                      movement.quantity > 0 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity} pcs
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                      {movement.user?.name || 'Sistem'}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-xs text-neutral-500 dark:text-neutral-400 max-w-xs truncate">
                      {movement.notes || <span className="text-neutral-300 dark:text-neutral-600 italic">Tidak ada catatan</span>}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-sm text-neutral-400">
                    <ClipboardList className="h-8 w-8 mx-auto text-neutral-300 mb-2" />
                    Belum ada log pergerakan stok terekam.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Dynamic unified footer with pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            Menampilkan {movements.data.length} dari {movements.total} log pergerakan
          </div>
          
          {movements.last_page > 1 && (
            <div className="flex items-center justify-center gap-1.5">
              {movements.links.map((link, idx) => {
                if (!link.url) return null;
                
                let cleanLabel = link.label;
                if (cleanLabel.includes('Previous') || cleanLabel.includes('laquo')) {
                  cleanLabel = 'Sebelumnya';
                } else if (cleanLabel.includes('Next') || cleanLabel.includes('raquo')) {
                  cleanLabel = 'Selanjutnya';
                }
                
                return (
                  <Link
                    key={idx}
                    href={link.url}
                    className={`h-9 px-3 py-2 text-xs rounded-lg border font-medium transition-all ${
                      link.active
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

      {/* ==================== ADJUSTMENT SHEET ==================== */}
      <Sheet open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-md w-full bg-white dark:bg-neutral-950 p-6 flex flex-col h-full border-l border-neutral-200 dark:border-neutral-800">
          <SheetHeader className="pb-4 border-b border-neutral-100 dark:border-neutral-900">
            <SheetTitle className="text-xl font-bold flex items-center gap-2">
              <Plus className="h-5 w-5 text-neutral-500" />
              Penyesuaian Stok Manual
            </SheetTitle>
            <SheetDescription>
              Masukkan kuantitas mutasi stok secara langsung. Gunakan angka positif untuk restock/masuk, dan angka negatif untuk pengurangan.
            </SheetDescription>
          </SheetHeader>
          
          <form onSubmit={handleSubmitAdjustment} className="flex-1 flex flex-col justify-between py-4 space-y-6">
            <div className="space-y-4">
              {/* Product Selection Combobox */}
              <div className="space-y-1.5 flex flex-col">
                <Label className="text-sm font-semibold">Produk Target</Label>
                <Popover open={openProductSearch} onOpenChange={setOpenProductSearch}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openProductSearch}
                      className="w-full h-10 justify-between font-normal border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 text-neutral-800 dark:text-neutral-200 text-left hover:bg-neutral-50 dark:hover:bg-neutral-900 cursor-pointer"
                    >
                      {selectedProduct ? (
                        <span className="truncate">
                          {selectedProduct.name} (SKU: {selectedProduct.sku})
                        </span>
                      ) : (
                        <span className="text-neutral-400">Cari & pilih produk target...</span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[380px] p-0 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800" align="start">
                    <Command>
                      <CommandInput placeholder="Ketik nama atau SKU produk..." />
                      <CommandList className="max-h-[200px]">
                        <CommandEmpty>Produk tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                          {products.map((prod) => (
                            <CommandItem
                              key={prod.id}
                              value={`${prod.name} ${prod.sku}`}
                              onSelect={() => {
                                setData('product_id', prod.id.toString());
                                setOpenProductSearch(false);
                              }}
                              className="cursor-pointer"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  data.product_id === prod.id.toString() ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">{prod.name}</span>
                                <span className="text-[10px] font-mono text-neutral-400">SKU: {prod.sku} | Stok: {prod.stock}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {errors.product_id && <div className="text-xs text-rose-500 mt-1">{errors.product_id}</div>}
              </div>

              {/* Kuantitas */}
              <div className="space-y-1.5">
                <Label htmlFor="quantity" className="text-sm font-semibold">Kuantitas Penyesuaian</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="Contoh: 15 untuk tambah, -5 untuk kurang"
                  value={data.quantity}
                  onChange={(e) => setData('quantity', e.target.value)}
                  className="h-10"
                />
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3 shrink-0 text-amber-500" />
                  Angka positif (+) restock barang, angka negatif (-) memotong stok katalog.
                </p>
                {errors.quantity && <div className="text-xs text-rose-500 mt-1">{errors.quantity}</div>}
              </div>

              {/* Adjustment Type - Static Select */}
              <div className="space-y-1.5 flex flex-col">
                <Label className="text-sm font-semibold">Tipe Penyesuaian</Label>
                <Select
                  value={data.type}
                  onValueChange={(val) => setData('type', val)}
                >
                  <SelectTrigger className="w-full h-10 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-800 dark:text-neutral-200 cursor-pointer">
                    <SelectValue placeholder="Pilih Tipe Penyesuaian" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                    <SelectItem value="restock" className="cursor-pointer">Restock (Penambahan Stok Baru)</SelectItem>
                    <SelectItem value="damaged" className="cursor-pointer">Damaged (Barang Cacat / Rusak / Hilang)</SelectItem>
                    <SelectItem value="return" className="cursor-pointer">Return (Barang Pengembalian Konsumen)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && <div className="text-xs text-rose-500 mt-1">{errors.type}</div>}
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-sm font-semibold">Catatan Audit</Label>
                <Input
                  id="notes"
                  type="text"
                  placeholder="Contoh: Barang rusak saat transit, atau stock-up bulanan"
                  value={data.notes}
                  onChange={(e) => setData('notes', e.target.value)}
                  className="h-10"
                />
                {errors.notes && <div className="text-xs text-rose-500 mt-1">{errors.notes}</div>}
              </div>
            </div>

            <SheetFooter className="pt-4 border-t border-neutral-100 dark:border-neutral-900 gap-2">
              <SheetClose asChild>
                <Button variant="outline" className="cursor-pointer">Batal</Button>
              </SheetClose>
              <Button 
                type="submit" 
                disabled={processing}
                className="cursor-pointer bg-neutral-900 dark:bg-neutral-50 text-neutral-50 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100"
              >
                Simpan Penyesuaian
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}

StockMovementsIndex.layout = {
  breadcrumbs: [
    {
      title: 'Dashboard',
      href: '/dashboard',
    },
    {
      title: 'Riwayat Stok',
      href: '/stock/movements',
    },
  ],
};
