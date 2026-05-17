import React, { useState, useEffect } from 'react';
import { Head, useForm, usePage, Link, router } from '@inertiajs/react';
import { ClipboardList, Plus, HelpCircle, Package, ArrowRight, Eye, ShieldAlert, CheckCircle2, Trash2, ChevronsUpDown, Check, Search } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

interface OpnameItemInput {
  product_id: number;
  name: string;
  sku: string;
  system_stock: number;
  actual_stock: number;
  notes?: string;
}

interface Opname {
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
}

interface OpnameIndexProps {
  opnames: {
    data: Opname[];
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

export default function StockOpnameIndex({ opnames, products, filters }: OpnameIndexProps) {
  const page = usePage();
  const user = (page.props as any).auth?.user;
  const roles = user?.roles || [];
  const isAdmin = roles.includes('admin');

  const [isOpen, setIsOpen] = useState(false);
  const [openProductSearch, setOpenProductSearch] = useState(false);
  const [searchVal, setSearchVal] = useState(filters?.search || '');
  
  // Local state for builder
  const [selectedProductId, setSelectedProductId] = useState('');
  const [actualInput, setActualInput] = useState('');
  const [itemNotesInput, setItemNotesInput] = useState('');
  const [draftItems, setDraftItems] = useState<OpnameItemInput[]>([]);

  // Debounced search logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if ((filters?.search || '') !== searchVal) {
        router.get(
          route('stock.opname.index'),
          { search: searchVal },
          { preserveState: true, replace: true }
        );
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchVal]);

  const { data, setData, processing, errors, reset } = useForm({
    notes: '',
  });

  const selectedProduct = products.find(p => p.id === parseInt(selectedProductId));

  const handleAddItem = () => {
    if (!selectedProduct) {
      toast.error('Silakan pilih produk');
      return;
    }
    if (!actualInput || parseInt(actualInput) < 0) {
      toast.error('Masukkan jumlah aktual fisik yang valid (minimal 0)');
      return;
    }

    // Check if already added
    if (draftItems.some(item => item.product_id === selectedProduct.id)) {
      toast.error('Produk ini sudah ada di dalam daftar opname');
      return;
    }

    const newItem: OpnameItemInput = {
      product_id: selectedProduct.id,
      name: selectedProduct.name,
      sku: selectedProduct.sku,
      system_stock: selectedProduct.stock,
      actual_stock: parseInt(actualInput),
      notes: itemNotesInput || undefined,
    };

    setDraftItems([...draftItems, newItem]);
    
    // Reset item inputs
    setSelectedProductId('');
    setActualInput('');
    setItemNotesInput('');
    toast.success(`${selectedProduct.name} ditambahkan ke daftar.`);
  };

  const handleRemoveItem = (index: number) => {
    const updated = [...draftItems];
    updated.splice(index, 1);
    setDraftItems(updated);
  };

  const handleSubmitOpname = (e: React.FormEvent) => {
    e.preventDefault();

    if (draftItems.length === 0) {
      toast.error('Daftar item opname masih kosong. Silakan tambahkan minimal satu produk.');
      return;
    }

    // Map items to request format
    const payloadItems = draftItems.map(item => ({
      product_id: item.product_id,
      actual_stock: item.actual_stock,
      notes: item.notes,
    }));

    // Post to backend
    router.post(route('stock.opname.store'), {
      notes: data.notes,
      items: payloadItems,
    }, {
      onSuccess: () => {
        setIsOpen(false);
        setDraftItems([]);
        reset();
        toast.success('Draft Stock Opname berhasil dibuat!');
      },
      onError: (errs) => {
        const firstErr = Object.values(errs)[0];
        toast.error(firstErr || 'Gagal membuat Stock Opname');
      }
    });
  };

  return (
    <>
      <Head title="Stock Opname & Rekonsiliasi" />

      <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
              <ClipboardList className="h-6 w-6 text-neutral-500" />
              Stock Opname & Rekonsiliasi
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Audit fisik berkala untuk mencocokkan stok aktual di gudang dengan catatan sistem.
            </p>
          </div>

          {isAdmin && (
            <Button
              onClick={() => setIsOpen(true)}
              variant="outline"
              className="h-10 gap-2 cursor-pointer hover:bg-neutral-50 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300"
            >
              <Plus className="h-4 w-4" />
              Mulai Stock Opname
            </Button>
          )}
        </div>

        {/* Sleek Search bar */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nomor opname, auditor, atau catatan..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {/* Opname Index Register Table */}
        <div className="overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-neutral-900/50 shadow-sm">
          <Table>
            <TableHeader className="bg-neutral-50 dark:bg-neutral-900/80 border-b border-neutral-100 dark:border-neutral-800">
              <TableRow>
                <TableHead className="py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400">No. Opname</TableHead>
                <TableHead className="py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400">Tanggal Mulai</TableHead>
                <TableHead className="py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400">Status</TableHead>
                <TableHead className="py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400">Auditor</TableHead>
                <TableHead className="py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 max-w-xs">Catatan</TableHead>
                <TableHead className="py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {opnames.data.length > 0 ? (
                opnames.data.map((opname) => (
                  <TableRow
                    key={opname.id}
                    className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-colors"
                  >
                    <TableCell className="py-3.5 px-4 font-mono text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                      {opname.opname_number}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-xs text-neutral-500 dark:text-neutral-400">
                      {new Date(opname.created_at).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell className="py-3.5 px-4">
                      {opname.status === 'completed' ? (
                        <Badge className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30 hover:bg-emerald-50 font-medium flex items-center gap-1 w-fit">
                          <CheckCircle2 className="h-3 w-3" />
                          Selesai
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/30 hover:bg-amber-50 font-medium flex items-center gap-1 w-fit">
                          <HelpCircle className="h-3 w-3" />
                          Draft (Belum Reconcile)
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                      {opname.creator?.name || 'Sistem'}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-xs text-neutral-500 dark:text-neutral-400 max-w-xs truncate">
                      {opname.notes || <span className="text-neutral-300 dark:text-neutral-600 italic">Tidak ada catatan</span>}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-right">
                      <Link
                        href={route('stock.opname.show', opname.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-900 dark:text-neutral-50 hover:underline cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Detail Audit
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-sm text-neutral-400">
                    <ClipboardList className="h-8 w-8 mx-auto text-neutral-300 mb-2" />
                    Belum ada riwayat stock opname terdaftar.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Dynamic Pagination footer */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            Menampilkan {opnames.data.length} dari {opnames.total} pemeriksaan opname
          </div>

          {opnames.last_page > 1 && (
            <div className="flex items-center justify-center gap-1.5">
              {opnames.links.map((link, idx) => {
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

      {/* ==================== CREATE OPNAME DIALOG ==================== */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto bg-white dark:bg-neutral-950 p-6 border border-neutral-200 dark:border-neutral-800 rounded-xl flex flex-col animate-in fade-in-50 duration-200">
          <DialogHeader className="pb-3 border-b border-neutral-100 dark:border-neutral-900 shrink-0">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-neutral-500" />
              Mulai Sesi Pemeriksaan Fisik (Stock Opname)
            </DialogTitle>
            <DialogDescription>
              Cari produk, input stok aktual fisik di gudang, dan masukkan ke dalam daftar pemeriksaan audit sebelum menyimpan sebagai Draft.
            </DialogDescription>
          </DialogHeader>

          {/* Sesi Builder List */}
          <div className="flex-1 py-4 space-y-4">
            {/* Parent Opname Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="opname_notes" className="text-xs font-semibold">Catatan Utama / Judul Sesi Audit</Label>
              <Input
                id="opname_notes"
                type="text"
                placeholder="Contoh: Opname Bulanan Gudang Utama - Mei 2026"
                value={data.notes}
                onChange={(e) => setData('notes', e.target.value)}
                className="h-10 text-sm"
              />
            </div>

            {/* Line Item Adder Card */}
            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Input Baris Item Audit
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                {/* Select Product Combobox */}
                <div className="md:col-span-6 space-y-1.5 flex flex-col">
                  <Label className="text-[10px] font-semibold text-neutral-500">Pilih Produk</Label>
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
                          <span className="text-neutral-400">Cari & pilih produk...</span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[320px] p-0 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800" align="start">
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
                                  setSelectedProductId(prod.id.toString());
                                  setOpenProductSearch(false);
                                }}
                                className="cursor-pointer"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedProductId === prod.id.toString() ? "opacity-100" : "opacity-0"
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
                </div>

                {/* Actual counted */}
                <div className="md:col-span-3 space-y-1.5">
                  <Label htmlFor="adder_actual" className="text-[10px] font-semibold text-neutral-500">Stok Aktual Fisik</Label>
                  <Input
                    id="adder_actual"
                    type="number"
                    min="0"
                    placeholder="Fisik nyata"
                    value={actualInput}
                    onChange={(e) => setActualInput(e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>

                {/* Add button */}
                <div className="md:col-span-3">
                  <Button
                    type="button"
                    onClick={handleAddItem}
                    className="w-full h-10 cursor-pointer bg-neutral-900 dark:bg-neutral-50 hover:bg-neutral-800 dark:hover:bg-neutral-100 text-neutral-50 dark:text-neutral-900"
                  >
                    + Masukkan
                  </Button>
                </div>
              </div>

              {/* Real-time Indicator if selected */}
              {selectedProduct && actualInput !== '' && (
                <div className="text-[11px] font-medium flex items-center gap-2 p-2 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 w-fit animate-in fade-in slide-in-from-top-1 duration-200">
                  <span>Stok Sistem: <strong>{selectedProduct.stock} pcs</strong></span>
                  <ArrowRight className="h-3 w-3 text-neutral-400" />
                  <span>Stok Aktual: <strong>{actualInput} pcs</strong></span>
                  <ArrowRight className="h-3 w-3 text-neutral-400" />
                  <span>Selisih: 
                    <strong className={`ml-1 ${
                      parseInt(actualInput) - selectedProduct.stock === 0 
                        ? 'text-neutral-500' 
                        : (parseInt(actualInput) - selectedProduct.stock > 0 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : 'text-rose-600 dark:text-rose-400')
                    }`}>
                      {parseInt(actualInput) - selectedProduct.stock > 0 ? `+${parseInt(actualInput) - selectedProduct.stock}` : parseInt(actualInput) - selectedProduct.stock} pcs
                    </strong>
                  </span>
                </div>
              )}
            </div>

            {/* List of Added Draft Items */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex justify-between items-center">
                <span>Daftar Item Audit yang Akan Disimpan ({draftItems.length} produk)</span>
                {draftItems.length > 0 && (
                  <button 
                    type="button" 
                    onClick={() => setDraftItems([])} 
                    className="text-[10px] text-rose-500 hover:underline cursor-pointer"
                  >
                    Hapus Semua
                  </button>
                )}
              </Label>
              
              <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden max-h-[220px] overflow-y-auto">
                <Table className="text-xs">
                  <TableHeader className="bg-neutral-50 dark:bg-neutral-900/60 border-b border-neutral-100 dark:border-neutral-800">
                    <TableRow>
                      <TableHead className="py-2.5 px-3 font-semibold text-neutral-600 dark:text-neutral-400">Produk</TableHead>
                      <TableHead className="py-2.5 px-3 font-semibold text-neutral-600 dark:text-neutral-400 text-center">Sistem</TableHead>
                      <TableHead className="py-2.5 px-3 font-semibold text-neutral-600 dark:text-neutral-400 text-center">Aktual</TableHead>
                      <TableHead className="py-2.5 px-3 font-semibold text-neutral-600 dark:text-neutral-400 text-center">Selisih</TableHead>
                      <TableHead className="py-2.5 px-3 font-semibold text-neutral-600 dark:text-neutral-400 text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {draftItems.length > 0 ? (
                      draftItems.map((item, idx) => {
                        const diff = item.actual_stock - item.system_stock;
                        return (
                          <TableRow key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/20">
                            <TableCell className="py-2 px-3">
                              <div className="font-semibold text-neutral-900 dark:text-neutral-100">{item.name}</div>
                              <div className="text-[9px] font-mono text-neutral-400">{item.sku}</div>
                            </TableCell>
                            <TableCell className="py-2 px-3 text-center text-neutral-600 dark:text-neutral-400">{item.system_stock} pcs</TableCell>
                            <TableCell className="py-2 px-3 text-center font-semibold text-neutral-900 dark:text-neutral-100">{item.actual_stock} pcs</TableCell>
                            <TableCell className={`py-2 px-3 text-center font-bold ${
                              diff === 0 
                                ? 'text-neutral-400' 
                                : (diff > 0 
                                  ? 'text-emerald-600 dark:text-emerald-400' 
                                  : 'text-rose-600 dark:text-rose-400')
                            }`}>
                              {diff > 0 ? `+${diff}` : diff}
                            </TableCell>
                            <TableCell className="py-2 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="text-neutral-400 hover:text-rose-600 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center text-neutral-400 italic">
                          Belum ada produk yang dimasukkan ke dalam daftar audit.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-neutral-100 dark:border-neutral-900 shrink-0 gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="cursor-pointer">
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleSubmitOpname}
              disabled={processing || draftItems.length === 0}
              className="cursor-pointer bg-neutral-900 dark:bg-neutral-50 hover:bg-neutral-800 dark:hover:bg-neutral-100 text-neutral-50 dark:text-neutral-900"
            >
              Simpan Sebagai Draft Opname
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

StockOpnameIndex.layout = {
  breadcrumbs: [
    {
      title: 'Dashboard',
      href: '/dashboard',
    },
    {
      title: 'Stock Opname',
      href: '/stock/opnames',
    },
  ],
};
