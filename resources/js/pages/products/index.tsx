import React, { useState, useMemo } from 'react';
import { Head, useForm, usePage, router, Link } from '@inertiajs/react';
import { Plus, Trash2, Edit2, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DataTable } from './data-table';
import { getColumns, Product } from './columns';

interface ProductsProps {
  products: {
    data: Product[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
    first_page_url: string;
    last_page_url: string;
    next_page_url: string | null;
    prev_page_url: string | null;
  };
  filters: {
    search: string;
    brand: string;
    category: string;
    size: string;
    color: string;
  };
}

export default function ProductsIndex({ products, filters }: ProductsProps) {
  const page = usePage();
  const user = (page.props as any).auth?.user;
  const roles = user?.roles || [];
  const isAdmin = roles.includes('admin');
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // 1. Inertia Form for Adding Product
  const addForm = useForm({
    name: '',
    sku: '',
    description: '',
    cover: null as File | null,
    price: '',
    stock: '',
    is_active: true,
    metadata: {
      brand: '',
      category: '',
      color: '',
      size: '',
    }
  });

  // 2. Inertia Form for Editing Product
  const editForm = useForm({
    _method: 'put', // Override for multipart/form-data support in PHP
    name: '',
    sku: '',
    description: '',
    cover: null as File | null,
    price: '',
    stock: '',
    is_active: true,
    metadata: {
      brand: '',
      category: '',
      color: '',
      size: '',
    }
  });

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    editForm.setData({
      _method: 'put',
      name: product.name,
      sku: product.sku,
      description: product.description || '',
      cover: null,
      price: product.price,
      stock: product.stock.toString(),
      is_active: product.is_active,
      metadata: {
        brand: product.metadata?.brand || '',
        category: product.metadata?.category || '',
        color: product.metadata?.color || '',
        size: product.metadata?.size || '',
      }
    });
    setIsEditOpen(true);
  };

  // Submit handlers
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addForm.post('/products', {
      onSuccess: () => {
        addForm.reset();
        setIsAddOpen(false);
        toast.success('Produk berhasil ditambahkan!');
      },
      onError: (errors) => {
        const firstError = Object.values(errors)[0];
        toast.error(firstError as string || 'Terjadi kesalahan saat menambahkan produk.');
      }
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    
    // Must use POST with _method override for PHP multipart file parsing
    editForm.post(`/products/${selectedProduct.id}`, {
      onSuccess: () => {
        setIsEditOpen(false);
        setSelectedProduct(null);
        toast.success('Produk berhasil diperbarui!');
      },
      onError: (errors) => {
        const firstError = Object.values(errors)[0];
        toast.error(firstError as string || 'Terjadi kesalahan saat memperbarui produk.');
      }
    });
  };

  const handleDeleteConfirm = () => {
    if (!productToDelete) return;
    router.delete(`/products/${productToDelete.id}`, {
      onSuccess: () => {
        setIsDeleteOpen(false);
        setProductToDelete(null);
        toast.success('Produk berhasil dihapus!');
      },
      onError: () => {
        toast.error('Gagal menghapus produk.');
      }
    });
  };

  // Configure dynamic columns based on admin privileges
  const columns = useMemo(() => {
    return getColumns(
      (product) => handleEdit(product),
      (product) => {
        setProductToDelete(product);
        setIsDeleteOpen(true);
      }
    ).filter((col) => isAdmin || col.id !== 'actions');
  }, [isAdmin]);

  const productData = products?.data || [];

  const isManager = roles.includes('admin') || roles.includes('owner');

  return (
    <>
      <Head title={isManager ? "Kelola Produk" : "Katalog Produk"} />
      <div className="flex flex-col gap-6 p-6">
        
        {/* Sleek Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-sidebar-border/40 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-amber-500" />
              {isManager ? "Kelola Produk" : "Katalog Produk"}
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              {isManager ? 'Kelola katalog e-commerce, stok produk, dan metadata pencarian produk.' : 'Lihat katalog produk dan status stok penjualan.'}
            </p>
          </div>
          {isAdmin && (
            <Button onClick={() => setIsAddOpen(true)} variant="outline" className="h-9 cursor-pointer gap-2">
              <Plus className="h-4 w-4 text-neutral-500" />
              Tambah Produk
            </Button>
          )}
        </div>

        {/* TanStack Table UI */}
        <div className="flex flex-col gap-4">
          <DataTable
            columns={columns}
            data={productData}
            searchKey="name"
            searchPlaceholder="Cari nama produk..."
          />

          {/* Unified Footer: Row Indicator and Server Pagination */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-2">
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              Menampilkan {products.data.length} dari {products.total} produk
            </div>
            
            {products.last_page > 1 && (
              <div className="flex items-center justify-center gap-1.5">
                {products.links.map((link, idx) => {
                  if (!link.url) return null;
                  
                  // Intercept translation keys and convert to clean UI text
                  let cleanLabel = link.label;
                  if (cleanLabel === 'pagination.previous' || cleanLabel.includes('laquo') || cleanLabel.toLowerCase().includes('previous')) {
                    cleanLabel = 'Sebelumnya';
                  } else if (cleanLabel === 'pagination.next' || cleanLabel.includes('raquo') || cleanLabel.toLowerCase().includes('next')) {
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

        {/* ==================== ADD PRODUCT SHEET ==================== */}
        <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
          <SheetContent className="overflow-y-auto sm:max-w-md w-full bg-white dark:bg-neutral-950 p-6 flex flex-col h-full border-l border-neutral-200 dark:border-neutral-800">
            <SheetHeader className="p-0 pb-4 border-b border-neutral-100 dark:border-neutral-900">
              <SheetTitle className="text-xl font-bold flex items-center gap-2">
                <Plus className="h-5 w-5 text-neutral-500" />
                Tambah Produk Baru
              </SheetTitle>
              <SheetDescription>
                Isi detail produk di bawah ini untuk menambahkan produk baru ke katalog toko Anda.
              </SheetDescription>
            </SheetHeader>
            
            <form onSubmit={handleAddSubmit} className="flex-1 space-y-4 py-4 pr-1">
              <div className="space-y-1">
                <Label htmlFor="name">Nama Produk</Label>
                <Input
                  id="name"
                  required
                  placeholder="e.g. Nike Air Max Red"
                  value={addForm.data.name}
                  onChange={(e) => addForm.setData('name', e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="sku">SKU Produk (Unik)</Label>
                <Input
                  id="sku"
                  required
                  placeholder="e.g. NK-AMR-42"
                  value={addForm.data.sku}
                  onChange={(e) => addForm.setData('sku', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="price">Harga (Rupiah)</Label>
                  <Input
                    id="price"
                    type="number"
                    required
                    placeholder="e.g. 1500000"
                    value={addForm.data.price}
                    onChange={(e) => addForm.setData('price', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="stock">Stok Awal</Label>
                  <Input
                    id="stock"
                    type="number"
                    required
                    placeholder="e.g. 10"
                    value={addForm.data.stock}
                    onChange={(e) => addForm.setData('stock', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="description">Deskripsi</Label>
                <textarea
                  id="description"
                  placeholder="Detail deskripsi spesifikasi produk..."
                  className="flex min-h-20 w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-neutral-400 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-600 focus-visible:border-neutral-400 dark:focus-visible:border-neutral-600 disabled:cursor-not-allowed disabled:opacity-50"
                  value={addForm.data.description}
                  onChange={(e) => addForm.setData('description', e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="cover">Cover Image / Foto</Label>
                <div className="flex items-center gap-3 border border-dashed border-neutral-300 dark:border-neutral-800 rounded-md p-3">
                  <ImageIcon className="h-6 w-6 text-neutral-400" />
                  <Input
                    id="cover"
                    type="file"
                    accept="image/*"
                    onChange={(e) => addForm.setData('cover', e.target.files ? e.target.files[0] : null)}
                    className="border-none p-0 cursor-pointer h-auto"
                  />
                </div>
              </div>

              {/* High-Performance Metadata Filtering */}
              <div className="border-t border-neutral-100 dark:border-neutral-900 pt-4 space-y-3">
                <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-300">Spesifikasi Metadata (Pencarian)</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="brand">Brand / Merk</Label>
                    <Input
                      id="brand"
                      placeholder="e.g. Nike"
                      value={addForm.data.metadata.brand}
                      onChange={(e) => addForm.setData('metadata', { ...addForm.data.metadata, brand: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="category">Kategori</Label>
                    <Input
                      id="category"
                      placeholder="e.g. Sneaker"
                      value={addForm.data.metadata.category}
                      onChange={(e) => addForm.setData('metadata', { ...addForm.data.metadata, category: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="color">Warna</Label>
                    <Input
                      id="color"
                      placeholder="e.g. Merah"
                      value={addForm.data.metadata.color}
                      onChange={(e) => addForm.setData('metadata', { ...addForm.data.metadata, color: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="size">Ukuran (Size)</Label>
                    <Input
                      id="size"
                      placeholder="e.g. 42"
                      value={addForm.data.metadata.size}
                      onChange={(e) => addForm.setData('metadata', { ...addForm.data.metadata, size: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="is_active"
                  checked={addForm.data.is_active}
                  onCheckedChange={(checked) => addForm.setData('is_active', !!checked)}
                />
                <Label htmlFor="is_active" className="text-sm font-medium cursor-pointer">
                  Aktifkan produk di katalog penjualan
                </Label>
              </div>

              <SheetFooter className="pt-4 border-t border-neutral-100 dark:border-neutral-900 mt-auto">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="cursor-pointer">
                  Batal
                </Button>
                <Button type="submit" disabled={addForm.processing} className="cursor-pointer bg-neutral-900 dark:bg-neutral-50 dark:text-neutral-900 gap-2">
                  {addForm.processing && <Loader2 className="h-4 w-4 animate-spin" />}
                  Simpan Produk
                </Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>

        {/* ==================== EDIT PRODUCT SHEET ==================== */}
        <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
          <SheetContent className="overflow-y-auto sm:max-w-md w-full bg-white dark:bg-neutral-950 p-6 flex flex-col h-full border-l border-neutral-200 dark:border-neutral-800">
            <SheetHeader className="p-0 pb-4 border-b border-neutral-100 dark:border-neutral-900">
              <SheetTitle className="text-xl font-bold flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-neutral-500" />
                Edit Detail Produk
              </SheetTitle>
              <SheetDescription>
                Sesuaikan detail produk di bawah ini. Pastikan data cover, harga, dan stok tetap akurat.
              </SheetDescription>
            </SheetHeader>
            
            <form onSubmit={handleEditSubmit} className="flex-1 space-y-4 py-4 pr-1">
              <div className="space-y-1">
                <Label htmlFor="edit_name">Nama Produk</Label>
                <Input
                  id="edit_name"
                  required
                  value={editForm.data.name}
                  onChange={(e) => editForm.setData('name', e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit_sku">SKU Produk</Label>
                <Input
                  id="edit_sku"
                  required
                  value={editForm.data.sku}
                  onChange={(e) => editForm.setData('sku', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="edit_price">Harga (Rupiah)</Label>
                  <Input
                    id="edit_price"
                    type="number"
                    required
                    value={editForm.data.price}
                    onChange={(e) => editForm.setData('price', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit_stock">Stok</Label>
                  <Input
                    id="edit_stock"
                    type="number"
                    required
                    value={editForm.data.stock}
                    onChange={(e) => editForm.setData('stock', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit_description">Deskripsi</Label>
                <textarea
                  id="edit_description"
                  className="flex min-h-20 w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-neutral-400 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-600 focus-visible:border-neutral-400 dark:focus-visible:border-neutral-600 disabled:cursor-not-allowed disabled:opacity-50"
                  value={editForm.data.description}
                  onChange={(e) => editForm.setData('description', e.target.value)}
                />
              </div>

              {selectedProduct?.cover_url && (
                <div className="space-y-1">
                  <Label>Cover Saat Ini</Label>
                  <img
                    src={selectedProduct.cover_url}
                    alt={selectedProduct.name}
                    className="h-20 w-20 rounded-md object-cover border border-neutral-200"
                  />
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="edit_cover">Ganti Cover Image</Label>
                <div className="flex items-center gap-3 border border-dashed border-neutral-300 dark:border-neutral-800 rounded-md p-3">
                  <ImageIcon className="h-6 w-6 text-neutral-400" />
                  <Input
                    id="edit_cover"
                    type="file"
                    accept="image/*"
                    onChange={(e) => editForm.setData('cover', e.target.files ? e.target.files[0] : null)}
                    className="border-none p-0 cursor-pointer h-auto"
                  />
                </div>
              </div>

              {/* Metadata spec edit */}
              <div className="border-t border-neutral-100 dark:border-neutral-900 pt-4 space-y-3">
                <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-300">Spesifikasi Metadata</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="edit_brand">Brand / Merk</Label>
                    <Input
                      id="edit_brand"
                      value={editForm.data.metadata.brand}
                      onChange={(e) => editForm.setData('metadata', { ...editForm.data.metadata, brand: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit_category">Kategori</Label>
                    <Input
                      id="edit_category"
                      value={editForm.data.metadata.category}
                      onChange={(e) => editForm.setData('metadata', { ...editForm.data.metadata, category: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="edit_color">Warna</Label>
                    <Input
                      id="edit_color"
                      value={editForm.data.metadata.color}
                      onChange={(e) => editForm.setData('metadata', { ...editForm.data.metadata, color: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit_size">Ukuran (Size)</Label>
                    <Input
                      id="edit_size"
                      value={editForm.data.metadata.size}
                      onChange={(e) => editForm.setData('metadata', { ...editForm.data.metadata, size: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="edit_is_active"
                  checked={editForm.data.is_active}
                  onCheckedChange={(checked) => editForm.setData('is_active', !!checked)}
                />
                <Label htmlFor="edit_is_active" className="text-sm font-medium cursor-pointer">
                  Aktifkan produk di katalog penjualan
                </Label>
              </div>

              <SheetFooter className="pt-4 border-t border-neutral-100 dark:border-neutral-900 mt-auto">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="cursor-pointer">
                  Batal
                </Button>
                <Button type="submit" disabled={editForm.processing} className="cursor-pointer bg-neutral-900 dark:bg-neutral-50 dark:text-neutral-900 gap-2">
                  {editForm.processing && <Loader2 className="h-4 w-4 animate-spin" />}
                  Simpan Perubahan
                </Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>

        {/* ==================== DELETE DIALOG MODAL ==================== */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent className="max-w-md bg-white dark:bg-neutral-950 p-6 rounded-lg border border-neutral-200 dark:border-neutral-800">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2 text-red-600 dark:text-red-400">
                <Trash2 className="h-5 w-5" />
                Hapus Produk?
              </DialogTitle>
              <DialogDescription className="pt-2 text-sm text-neutral-500 dark:text-neutral-400">
                Apakah Anda yakin ingin menghapus produk <strong className="text-neutral-900 dark:text-neutral-200">"{productToDelete?.name}"</strong>? 
                Produk yang dihapus tidak akan ditampilkan lagi di katalog, namun data transaksi historis tetap diarsipkan.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-6 flex flex-row justify-end gap-3 border-t border-neutral-100 dark:border-neutral-900 pt-4">
              <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="cursor-pointer">
                Batal
              </Button>
              <Button onClick={handleDeleteConfirm} className="cursor-pointer bg-red-600 hover:bg-red-700 text-white gap-2">
                Hapus Produk
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </>
  );
}

ProductsIndex.layout = {
  breadcrumbs: [
    {
      title: 'Dashboard',
      href: '/dashboard',
    },
    {
      title: 'Kelola Produk',
      href: '/products',
    },
  ],
};
