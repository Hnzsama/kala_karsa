import React from 'react';
import { Head, useForm, usePage, Link } from '@inertiajs/react';
import {
  Users, CheckCircle2, Coins, Ticket, CreditCard, ArrowRight, Lock,
  ShieldCheck, AlertCircle, Phone, Sparkles, Gift, Award, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface MembershipProps {
  isMember: boolean;
  memberPoints: number;
  phoneNumber: string | null;
}

export default function MembershipIndex({ isMember, memberPoints, phoneNumber }: MembershipProps) {
  const page = usePage();
  const user = (page.props as any).auth?.user;

  // Form handling for registration
  const { data, setData, post, processing, errors } = useForm({
    phone_number: phoneNumber || '',
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    post('/membership/register', {
      onSuccess: () => {
        toast.success('Pendaftaran member berhasil! Selamat bergabung.');
      },
      onError: (errs) => {
        const firstErr = Object.values(errs)[0];
        toast.error(firstErr as string || 'Terjadi kesalahan saat pendaftaran.');
      }
    });
  };

  return (
    <>
      <Head title="Keanggotaan Member - Kala Karsa Bakery" />
      <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-6">

        {/* Header Section */}
        <div className="space-y-1.5 border-b border-neutral-100 dark:border-neutral-800 pb-5">
          <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
            <Award className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
            Program Keanggotaan Member
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Dapatkan poin rewards melimpah di setiap transaksi belanja dan tukarkan dengan kupon diskon eksklusif.
          </p>
        </div>

        {isMember ? (
          /* REGISTRATION SUCCESS / ACTIVE MEMBER PANEL */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* VIRTUAL MEMBER CARD (LEFT) */}
            <div className="lg:col-span-6 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-450 dark:text-neutral-400 flex items-center gap-1.5">
                <CreditCard className="h-4 w-4" />
                Kartu Loyalitas Virtual Anda
              </h2>

              {/* Holographic Glowing Glass Member Card */}
              <div className="relative aspect-[1.586/1] w-full rounded-2xl overflow-hidden shadow-2xl border border-neutral-700/30 bg-gradient-to-br from-indigo-950 via-slate-955 to-neutral-950 text-white p-6 flex flex-col justify-between group hover:shadow-indigo-500/10 transition-all duration-555">
                {/* Decorative background glow elements */}
                <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-indigo-500/15 blur-3xl group-hover:bg-indigo-500/25 transition-all duration-500" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-violet-500/10 blur-3xl group-hover:bg-violet-500/20 transition-all duration-500" />

                {/* Top Card Section */}
                <div className="flex justify-between items-start z-10">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black tracking-[0.2em] text-indigo-400/90 uppercase">Kala Karsa Bakery</span>
                    <h3 className="text-sm font-bold tracking-widest text-neutral-200 uppercase">LOYALTY MEMBER</h3>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold text-[9px] px-2 py-0.5 tracking-wider flex items-center gap-1">
                    <Sparkles className="h-3 w-3 animate-pulse shrink-0" />
                    MEMBER AKTIF
                  </Badge>
                </div>

                {/* Mid Card Section - Barcode & Member Number */}
                <div className="z-10 py-1 space-y-1 flex flex-col justify-center items-center">
                  {/* Simulated barcode */}
                  <div className="h-16 flex gap-1 items-end opacity-85 group-hover:opacity-100 transition-opacity">
                    {[2, 6, 4, 2, 8, 4, 2, 6, 4, 8, 2, 4, 6, 2, 4, 8, 2, 6, 2, 4, 8, 2, 6, 4].map((w, idx) => (
                      <div key={idx} className="bg-white" style={{ width: `${w}px`, height: '100%' }} />
                    ))}
                  </div>
                  <span className="font-mono text-[10px] tracking-[0.3em] text-neutral-400">
                    KK-{phoneNumber?.replace(/[^0-9]/g, '') || '00000000'}
                  </span>
                </div>

                {/* Bottom Card Section */}
                <div className="flex justify-between items-end z-10 border-t border-white/5 pt-3">
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase tracking-wider text-neutral-400">Nama Pemegang</span>
                    <p className="text-sm font-black tracking-wide text-neutral-100">{user?.name || '-'}</p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <span className="text-[9px] uppercase tracking-wider text-neutral-400">Dompet Poin</span>
                    <div className="flex items-center justify-end gap-1.5 text-amber-450 font-black text-lg">
                      <Coins className="h-4.5 w-4.5 text-amber-500 animate-bounce" />
                      {memberPoints} <span className="text-[10px] font-bold text-neutral-350">POIN</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BENEFITS & WALLET ACTIONS (RIGHT) */}
            <div className="lg:col-span-6 space-y-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-450 dark:text-neutral-400 flex items-center gap-1.5">
                <Gift className="h-4 w-4" />
                Status & Keuntungan Member Anda
              </h2>

              <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 shadow-sm space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 shrink-0 border border-amber-100/10">
                    <Coins className="h-6 w-6" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-250">Keseimbangan Poin Rewards</h3>
                    <p className="text-2xl font-black text-amber-600 dark:text-amber-400 flex items-baseline gap-1">
                      {memberPoints}
                      <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">Poin Aktif</span>
                    </p>
                    <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                      Anda mendapat 1 poin rewards untuk setiap kelipatan belanja senilai <strong>Rp 10.000</strong>. Kumpulkan poin sebanyak-banyaknya untuk ditukarkan dengan potongan belanja.
                    </p>
                  </div>
                </div>

                <div className="border-t border-neutral-100 dark:border-neutral-850 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-300">Tukarkan Poin dengan Diskon</span>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Redeem poin Anda di katalog kupon diskon.</p>
                  </div>
                  <Link href="/coupons" className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 cursor-pointer">
                      <Ticket className="h-4 w-4" />
                      Tukarkan Poin Sekarang
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Guidelines card */}
              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/10 space-y-3">
                <h4 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-indigo-500" />
                  Bagaimana Cara Memperoleh Poin?
                </h4>
                <ul className="space-y-2 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed list-inside list-disc pl-1">
                  <li>Lakukan pembelian produk apa saja melalui keranjang belanja Anda.</li>
                  <li>Setiap nilai transaksi bersih (setelah diskon kupon) kelipatan Rp 10.000 menghasilkan 1 poin rewards.</li>
                  <li>Poin otomatis masuk ke akun Anda setelah pembayaran diselesaikan (settlement).</li>
                  <li>Poin bersifat permanen dan dapat digunakan untuk menukar kupon reward kapan saja!</li>
                </ul>
              </div>
            </div>

          </div>
        ) : (
          /* REGISTRATION FORM PANEL (isMember === false) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

            {/* BENEFITS PROMOTION (LEFT) */}
            <div className="lg:col-span-7 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 shadow-sm flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <h2 className="text-lg font-black tracking-tight text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                  Keuntungan Eksklusif Member Kala Karsa Bakery
                </h2>
                <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                  Nikmati kemudahan berbelanja online dengan menjadi member loyalitas resmi kami. Program member ini 100% gratis tanpa biaya tahunan!
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">1 Poin / Rp 10.000 Belanja</span>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">Setiap pembelanjaan nominal bersih kelipatan Rp 10.000 otomatis mendapatkan 1 poin reward langsung ke dompet Anda.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Katalog Kupon Reward</span>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">Poin yang terkumpul dapat Anda tukarkan dengan kupon diskon potongan harga belanja eksklusif member.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Promo Menarik Lainnya</span>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">Nikmati status VIP, akses awal promo peluncuran produk, dan event rewards musiman hanya untuk member aktif.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 border-t border-neutral-100 dark:border-neutral-850 pt-4 text-xs text-neutral-500 dark:text-neutral-450">
                <ShieldCheck className="h-4 w-4 text-indigo-500 shrink-0" />
                Data keanggotaan Anda dijamin aman dan terenkripsi secara tertutup.
              </div>
            </div>

            {/* REGISTRATION FORM CARD (RIGHT) */}
            <div className="lg:col-span-5 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 shadow-sm flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-1.5">
                    <Phone className="h-4.5 w-4.5 text-indigo-650" />
                    Form Pendaftaran Member
                  </h3>
                  <p className="text-xs text-neutral-550 dark:text-neutral-450">
                    Masukkan nomor telepon aktif Anda untuk mendaftarkan akun sebagai member Kala Karsa Bakery.
                  </p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone_number" className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      Nomor Telepon
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4.5 w-4.5 text-neutral-400" />
                      <Input
                        id="phone_number"
                        type="tel"
                        placeholder="Contoh: 081234567890"
                        className="pl-10 h-10 border-neutral-200 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 dark:border-neutral-800"
                        value={data.phone_number}
                        onChange={(e) => setData('phone_number', e.target.value)}
                        required
                      />
                    </div>
                    {errors.phone_number && (
                      <p className="text-xs font-semibold text-rose-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        {errors.phone_number}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={processing}
                    className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 cursor-pointer shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-[0.98] transition-all"
                  >
                    {processing ? (
                      <span className="inline-block animate-spin border-2 border-white border-t-transparent rounded-full h-4 w-4 mr-1" />
                    ) : (
                      <Sparkles className="h-4 w-4 shrink-0 animate-pulse" />
                    )}
                    Daftar Sebagai Member Sekarang
                  </Button>
                </form>
              </div>

              <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/30 text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-450 border border-neutral-100 dark:border-neutral-850/30 flex gap-2">
                <Lock className="h-4 w-4 text-neutral-400 shrink-0 mt-0.5" />
                <span>Dengan mendaftar, Anda menyetujui syarat & ketentuan program loyalitas Kala Karsa Bakery untuk mengumpulkan dan menukarkan poin reward.</span>
              </div>
            </div>

          </div>
        )}

      </div>
    </>
  );
}

// breadcrumbs layout
MembershipIndex.layout = (props: any) => ({
  breadcrumbs: [
    {
      title: 'Program Member',
      href: '/membership',
    },
  ],
});
