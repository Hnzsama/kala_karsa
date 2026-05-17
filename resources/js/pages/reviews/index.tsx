import React, { useState, useEffect } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { Star, MessageSquare, Search, Eye, AlertCircle, ShoppingBag, ArrowRight, User as UserIcon, Calendar, CheckCircle2, Pencil, Coins, Sparkles, Filter, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
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

interface Review {
  id: number;
  product_id: number;
  user_id: number;
  order_item_id: number;
  rating: number;
  comment: string;
  reply: string | null;
  created_at: string;
  product?: {
    id: number;
    name: string;
    sku: string;
  };
  user?: {
    id: number;
    name: string;
    email: string;
    member_status: string;
  };
}

interface ReviewsIndexProps {
  reviews: {
    data: Review[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
  };
  filters: {
    search: string;
    rating: string;
    status: string;
  };
}

export default function ReviewsIndex({ reviews, filters }: ReviewsIndexProps) {
  const page = usePage();
  const user = (page.props as any).auth?.user;

  const [searchVal, setSearchVal] = useState(filters?.search || '');
  const [ratingVal, setRatingVal] = useState(filters?.rating || 'all');
  const [statusVal, setStatusVal] = useState(filters?.status || 'all');

  // Reply Dialog State
  const [replyTarget, setReplyTarget] = useState<Review | null>(null);

  // Form for submitting merchant reply
  const { data, setData, post, processing, errors, reset } = useForm({
    reply: '',
  });

  // Debounced search & filtering logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const currentParams = {
        search: searchVal,
        rating: ratingVal === 'all' ? '' : ratingVal,
        status: statusVal === 'all' ? '' : statusVal,
      };

      const hasChanged =
        (filters?.search || '') !== searchVal ||
        (filters?.rating || 'all') !== ratingVal ||
        (filters?.status || 'all') !== statusVal;

      if (hasChanged) {
        router.get(
          route('reviews.index'),
          currentParams,
          { preserveState: true, replace: true }
        );
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchVal, ratingVal, statusVal]);

  const handleOpenReplyDialog = (review: Review) => {
    setReplyTarget(review);
    setData('reply', review.reply || '');
  };

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyTarget) return;

    post(route('reviews.reply', replyTarget.id), {
      onSuccess: () => {
        setReplyTarget(null);
        reset();
        toast.success('Balasan ulasan berhasil disimpan!');
      },
      onError: (errs) => {
        const firstErr = Object.values(errs)[0];
        toast.error(firstErr || 'Gagal menyimpan balasan');
      }
    });
  };

  // Summary stats
  const averageRating = reviews.data.length > 0
    ? (reviews.data.reduce((acc, r) => acc + r.rating, 0) / reviews.data.length).toFixed(1)
    : '5.0';

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "h-3.5 w-3.5",
              star <= rating
                ? "text-amber-400 fill-amber-400"
                : "text-neutral-200 dark:text-neutral-700"
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <Head title="Kelola Ulasan & Kritik Pelanggan" />

      <div className="flex flex-col gap-6 p-6 w-full">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
              <Star className="h-6 w-6 text-neutral-500 fill-neutral-500/10" />
              Ulasan & Kritik Pelanggan
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Dengar masukan pelanggan, jawab kritik secara langsung, dan pantau performa produk e-commerce Kala Karsa Bakery.
            </p>
          </div>
        </div>

        {/* Core Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 shadow-sm flex items-center gap-3.5 relative overflow-hidden">
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-500 border border-amber-100 dark:border-amber-900/40">
              <Star className="h-5 w-5 fill-amber-500/10" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Rata-rata Penilaian</div>
              <div className="text-2xl font-black text-neutral-800 dark:text-neutral-100 mt-0.5 flex items-baseline gap-1">
                {averageRating}
                <span className="text-xs font-semibold text-neutral-400">/ 5.0</span>
              </div>
            </div>
            <Sparkles className="absolute right-3 top-3 h-5 w-5 text-amber-400/20 animate-spin" />
          </div>

          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 shadow-sm flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Total Semua Ulasan</div>
              <div className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mt-0.5">
                {reviews.total} Ulasan
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 shadow-sm flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Belum Anda Jawab</div>
              <div className="text-2xl font-bold text-neutral-850 dark:text-neutral-100 mt-0.5 flex items-center gap-1.5">
                {reviews.data.filter(r => !r.reply).length}
                {reviews.data.filter(r => !r.reply).length > 0 && (
                  <Badge className="bg-rose-500 text-neutral-50 border-transparent text-[9px] font-bold py-0 px-1.5 animate-pulse">Butuh Jawaban</Badge>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Search and Filters grid */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-neutral-50 dark:bg-neutral-900/20 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800/80">

          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari kata kunci, nama pembeli, atau produk..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="pl-9 h-9 bg-white dark:bg-neutral-950"
            />
          </div>

          {/* Rating filter */}
          <div className="w-full sm:w-[160px] flex flex-col gap-1.5">
            <Select value={ratingVal} onValueChange={setRatingVal}>
              <SelectTrigger className="h-9 border border-neutral-200 dark:border-neutral-850 bg-white dark:bg-neutral-950 px-3 text-xs font-semibold cursor-pointer">
                <SelectValue placeholder="Pilih Rating" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                <SelectItem value="all" className="cursor-pointer text-xs">Semua Rating</SelectItem>
                <SelectItem value="5" className="cursor-pointer text-xs">⭐⭐⭐⭐⭐ (5 Bintang)</SelectItem>
                <SelectItem value="4" className="cursor-pointer text-xs">⭐⭐⭐⭐ (4 Bintang)</SelectItem>
                <SelectItem value="3" className="cursor-pointer text-xs">⭐⭐⭐ (3 Bintang)</SelectItem>
                <SelectItem value="2" className="cursor-pointer text-xs">⭐⭐ (2 Bintang)</SelectItem>
                <SelectItem value="1" className="cursor-pointer text-xs">⭐ (1 Bintang)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status filter */}
          <div className="w-full sm:w-[160px] flex flex-col gap-1.5">
            <Select value={statusVal} onValueChange={setStatusVal}>
              <SelectTrigger className="h-9 border border-neutral-200 dark:border-neutral-850 bg-white dark:bg-neutral-950 px-3 text-xs font-semibold cursor-pointer">
                <SelectValue placeholder="Pilih Status" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                <SelectItem value="all" className="cursor-pointer text-xs">Semua Status</SelectItem>
                <SelectItem value="pending" className="cursor-pointer text-xs">Menunggu Jawaban</SelectItem>
                <SelectItem value="replied" className="cursor-pointer text-xs">Sudah Dijawab</SelectItem>
              </SelectContent>
            </Select>
          </div>

        </div>

        {/* Reviews Cards Feed */}
        <div className="space-y-4">
          {reviews.data.length > 0 ? (
            reviews.data.map((review) => {
              return (
                <div
                  key={review.id}
                  className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 shadow-sm space-y-4 hover:shadow-md transition-all group relative overflow-hidden"
                >

                  {/* Left decorative color border on negative review */}
                  {review.rating <= 2 && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500" />
                  )}

                  {/* Header Row: User Info, stars, and date */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 flex items-center justify-center font-bold border border-neutral-200 dark:border-neutral-700">
                        {review.user?.name ? review.user.name.charAt(0).toUpperCase() : <UserIcon className="h-4 w-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-neutral-900 dark:text-neutral-50">
                            {review.user?.name || 'Konsumen Anonim'}
                          </span>
                          {review.user?.member_status === 'active' && (
                            <Badge className="bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900 text-[9px] font-bold leading-none py-0.5">
                              Loyal Member
                            </Badge>
                          )}
                        </div>
                        <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                          {review.user?.email || '-'}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:items-end gap-1">
                      {renderStars(review.rating)}
                      <div className="text-[10px] text-neutral-400 flex items-center gap-1 font-mono">
                        <Calendar className="h-3 w-3 shrink-0" />
                        {new Date(review.created_at).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Product Tag */}
                  {review.product && (
                    <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900/60 w-fit px-2.5 py-1 rounded-lg border border-neutral-200/50 dark:border-neutral-800">
                      <ShoppingBag className="h-3.5 w-3.5 text-neutral-400" />
                      Produk:
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">{review.product.name}</span>
                      <span className="text-[10px] font-mono text-neutral-400">({review.product.sku})</span>
                    </div>
                  )}

                  {/* Critique comment */}
                  <div className="text-sm text-neutral-750 dark:text-neutral-300 leading-relaxed font-medium bg-neutral-50/30 dark:bg-neutral-950/20 p-3 rounded-lg border border-dashed border-neutral-200/50 dark:border-neutral-800">
                    "{review.comment}"
                  </div>

                  {/* Two-Way Interaction Reply Bubble */}
                  {review.reply ? (
                    <div className="pl-6 border-l-2 border-neutral-200 dark:border-neutral-800 mt-2">
                      <div className="relative p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 text-xs leading-relaxed text-neutral-700 dark:text-neutral-300 flex flex-col gap-2">
                        {/* Visual accent speech triangle */}
                        <div className="absolute left-[-6px] top-4 w-3 h-3 bg-neutral-50 dark:bg-neutral-900 border-l border-b border-neutral-200 dark:border-neutral-800 rotate-45" />

                        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-1.5">
                          <span className="font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-1">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            Balasan Merchant (Toko):
                          </span>

                          <button
                            onClick={() => handleOpenReplyDialog(review)}
                            className="inline-flex items-center gap-1 font-bold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 cursor-pointer"
                          >
                            <Pencil className="h-3 w-3" />
                            Edit Balasan
                          </button>
                        </div>

                        <p className="italic font-medium text-neutral-600 dark:text-neutral-400">
                          "{review.reply}"
                        </p>
                      </div>
                    </div>
                  ) : (
                    // Button to reply
                    <div className="flex justify-end pt-1">
                      <Button
                        onClick={() => handleOpenReplyDialog(review)}
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs font-semibold gap-1.5 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900"
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-neutral-400" />
                        Balas Ulasan
                      </Button>
                    </div>
                  )}

                </div>
              );
            })
          ) : (
            <div className="py-16 border rounded-xl border-dashed border-neutral-200 dark:border-neutral-800 text-center text-neutral-400">
              <Star className="h-8 w-8 mx-auto mb-2 text-neutral-300 animate-bounce" />
              Tidak ditemukan ulasan atau ulasan sesuai filter Anda.
            </div>
          )}
        </div>

        {/* Dynamic Pagination footer */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-2">
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            Menampilkan {reviews.data.length} dari {reviews.total} ulasan konsumen
          </div>

          {reviews.last_page > 1 && (
            <div className="flex items-center justify-center gap-1.5">
              {reviews.links.map((link, idx) => {
                if (!link.url) return null;

                let cleanLabel = link.label;
                if (cleanLabel.includes('Previous') || cleanLabel.includes('laquo')) {
                  cleanLabel = 'Sebelumnya';
                } else if (cleanLabel.includes('Next') || cleanLabel.includes('raquo')) {
                  cleanLabel = 'Selanjutnya';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => router.get(link.url!, {}, { preserveState: true })}
                    className={`h-9 px-3 py-2 text-xs rounded-lg border font-medium transition-all cursor-pointer ${link.active
                        ? 'bg-neutral-900 text-neutral-50 border-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 dark:border-neutral-100 shadow-sm'
                        : 'bg-white text-neutral-700 border-neutral-200 dark:bg-neutral-900 dark:text-neutral-300 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                      }`}
                  >
                    {cleanLabel}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ==================== MERCHANT REPLY DIALOG ==================== */}
      <Dialog open={replyTarget !== null} onOpenChange={(open) => !open && setReplyTarget(null)}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-neutral-950 p-6 border border-neutral-200 dark:border-neutral-800 rounded-xl">
          <DialogHeader className="pb-3 border-b border-neutral-100 dark:border-neutral-900">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-neutral-900 dark:text-neutral-50">
              <MessageSquare className="h-5 w-5 text-neutral-500" />
              {replyTarget?.reply ? 'Ubah Balasan Ulasan' : 'Balas Kritik & Ulasan'}
            </DialogTitle>
            <DialogDescription className="text-sm pt-2">
              Berikan respon merchant yang sopan dan profesional atas masukan dari konsumen.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitReply} className="space-y-4 py-4">

            {/* Customer Critique Snippet */}
            {replyTarget && (
              <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200/50 dark:border-neutral-800 text-xs">
                <div className="flex justify-between items-center gap-2 mb-1.5">
                  <span className="font-bold text-neutral-850 dark:text-neutral-200">{replyTarget.user?.name}</span>
                  {renderStars(replyTarget.rating)}
                </div>
                <p className="text-neutral-500 dark:text-neutral-400 italic">
                  "{replyTarget.comment}"
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="reply" className="text-sm font-semibold">Tulis Respon Anda</Label>
              <textarea
                id="reply"
                placeholder="Terima kasih atas masukannya, kami akan terus meningkatkan kualitas layanan kami..."
                value={data.reply}
                onChange={(e) => setData('reply', e.target.value)}
                className="border-input placeholder:text-muted-foreground flex min-h-[100px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
              />
              {errors.reply && <div className="text-xs text-rose-500 mt-1">{errors.reply}</div>}
            </div>

            <DialogFooter className="pt-3 border-t border-neutral-100 dark:border-neutral-900 gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={processing}
                onClick={() => setReplyTarget(null)}
                className="cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={processing}
                className="cursor-pointer bg-neutral-900 dark:bg-neutral-50 hover:bg-neutral-800 dark:hover:bg-neutral-100 text-neutral-50 dark:text-neutral-900 font-semibold"
              >
                {processing ? 'Menyimpan...' : 'Kirim Balasan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

ReviewsIndex.layout = {
  breadcrumbs: [
    {
      title: 'Dashboard',
      href: '/dashboard',
    },
    {
      title: 'Ulasan & Kritik',
      href: '/reviews',
    },
  ],
};
