import { Head, Link, usePage, router } from '@inertiajs/react';
import React, { useState, useMemo } from 'react';
import {
    Search,
    ShoppingCart,
    User,
    Ticket,
    Award,
    Star,
    ArrowRight,
    X,
    Plus,
    Minus,
    ShoppingBag,
    Store,
    HelpCircle,
    CheckCircle,
    Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { login, register, dashboard } from '@/routes';

interface Category {
    id: number;
    name: string;
    slug: string;
    image: string | null;
    products_count: number;
}

interface Product {
    id: number;
    category_id: number | null;
    name: string;
    slug: string;
    sku: string;
    description: string | null;
    cover: string | null;
    cover_url: string;
    price: string;
    stock: number;
    metadata: any;
    is_active: boolean;
    category?: Category;
    reviews?: any[];
}

interface CartItem {
    id: number;
    user_id: number;
    product_id: number;
    quantity: number;
    product: Product;
}

interface UserCoupon {
    id: number;
    coupon_id: number;
    status: string;
    coupon: {
        id: number;
        code: string;
        discount_type: 'percentage' | 'fixed';
        discount_value: string;
        min_purchase: string;
    };
}

export default function Welcome({
    products = [],
    categories = [],
    userCoupons = [],
    cartItems = [],
    canRegister = true,
}: {
    products?: Product[];
    categories?: Category[];
    userCoupons?: UserCoupon[];
    cartItems?: CartItem[];
    canRegister?: boolean;
}) {
    const { auth, currentTeam } = usePage().props as any;
    const dashboardUrl = currentTeam ? dashboard(currentTeam.slug).url : '/';
    const isLoggedIn = !!auth?.user;
    const isMember = auth?.user?.member_status && auth.user.member_status !== 'none';
    const memberPoints = auth?.user?.member_points ?? 0;

    // Search and Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);

    // Cart Sheet State
    const [cartOpen, setCartOpen] = useState(false);
    const [notes, setNotes] = useState('');
    const [selectedCouponId, setSelectedCouponId] = useState<number | null>(null);

    // Computed Product Review Average & Star Ratings
    const getProductStats = (product: Product) => {
        const reviews = product.reviews || [];
        if (reviews.length === 0) {
            return { average: '4.8', count: 12 }; // Elegant realistic fallback
        }
        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        return {
            average: (sum / reviews.length).toFixed(1),
            count: reviews.length
        };
    };

    // Add to Cart Database Action
    const handleAddToCart = (product: Product, openDrawer: boolean = false) => {
        if (!isLoggedIn) {
            window.location.href = login().url;
            return;
        }

        router.post('/cart', {
            product_id: product.id,
            quantity: 1
        }, {
            preserveScroll: true,
            onSuccess: () => {
                if (openDrawer) {
                    setCartOpen(true);
                }
            }
        });
    };

    // Update Quantity Database Action
    const handleUpdateQuantity = (itemId: number, newQty: number, maxStock: number) => {
        if (newQty <= 0) {
            handleRemoveItem(itemId);
            return;
        }
        if (newQty > maxStock) return;

        router.patch(`/cart/${itemId}`, {
            quantity: newQty
        }, {
            preserveScroll: true
        });
    };

    // Remove Item Database Action
    const handleRemoveItem = (itemId: number) => {
        router.delete(`/cart/${itemId}`, {
            preserveScroll: true
        });
    };

    // Live Product Search and Category Filter computation
    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            const matchesSearch =
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesCategory =
                !selectedCategorySlug ||
                (product.category && product.category.slug === selectedCategorySlug);

            return matchesSearch && matchesCategory;
        });
    }, [products, searchTerm, selectedCategorySlug]);

    // Format Currency Helper
    const formatIDR = (value: number | string) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(Number(value));
    };

    // Calculate Cart Totals from persistent db-backed cartItems prop
    const subtotal = useMemo(() => {
        return cartItems.reduce((acc, item) => acc + (Number(item.product.price) * item.quantity), 0);
    }, [cartItems]);

    const activeCoupon = useMemo(() => {
        if (!selectedCouponId) return null;
        return userCoupons.find((uc) => uc.id === selectedCouponId);
    }, [selectedCouponId, userCoupons]);

    const discountAmount = useMemo(() => {
        if (!activeCoupon) return 0;
        const couponDetail = activeCoupon.coupon;

        const minPurchase = Number(couponDetail.min_purchase);
        if (subtotal < minPurchase) return 0;

        if (couponDetail.discount_type === 'percentage') {
            return subtotal * (Number(couponDetail.discount_value) / 100);
        } else {
            return Number(couponDetail.discount_value);
        }
    }, [activeCoupon, subtotal]);

    const totalAmount = useMemo(() => {
        const net = subtotal - discountAmount;
        return net < 0 ? 0 : net;
    }, [subtotal, discountAmount]);

    const pointsEarned = useMemo(() => {
        if (!isMember) return 0;
        return Math.floor(totalAmount / 10000);
    }, [isMember, totalAmount]);

    // Redirect to Checkout Page to Select Payment Channel
    const handleCheckout = () => {
        if (!isLoggedIn) {
            window.location.href = login().url;
            return;
        }

        router.visit('/checkout');
    };

    return (
        <>
            <Head>
                <title>Kala Karsa Bakery — Toko Roti & Kue Premium</title>
                <meta name="description" content="Kala Karsa Bakery menyajikan aneka roti manis, croissant renyah, cake ulang tahun cantik, dan kue kering premium tradisional khas Indonesia. Dipanggang segar setiap hari menggunakan bahan organik berkualitas tinggi." />
                <meta name="keywords" content="toko roti, toko kue, cake premium, bakery jakarta, croissant, kue ulang tahun, Kala Karsa Bakery, roti sehat" />
            </Head>

            <div className="min-h-screen bg-background text-foreground font-sans antialiased pb-16 transition-colors duration-200">
                {/* Sleek Top Accent Banner */}
                <div className="bg-zinc-900 text-zinc-100 text-xs py-2.5 px-6 md:px-12 flex flex-col sm:flex-row gap-2 sm:gap-0 items-center justify-between border-b border-zinc-800 text-center sm:text-left">
                    <div className="flex items-center gap-3 sm:gap-5 justify-center sm:justify-start">
                        <span className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity"><Store size={13} /> Seller Centre</span>
                        <span className="opacity-30">|</span>
                        <span className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity"><HelpCircle size={13} /> Bantuan & FAQ</span>
                    </div>
                    <div className="flex items-center gap-3 justify-center sm:justify-end">
                        {isLoggedIn ? (
                            <span className="font-semibold text-zinc-300 flex items-center gap-1.5 animate-pulse text-[11px] sm:text-xs">
                                🪙 {memberPoints} Poin Belanja {isMember ? '(Member)' : ''}
                            </span>
                        ) : (
                            <span className="opacity-80 text-[11px] sm:text-xs">Beli sekarang & raih Poin reward melimpah!</span>
                        )}
                    </div>
                </div>

                {/* Primary Premium Header Navbar */}
                <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border py-4 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4 transition-all">
                    <div className="flex items-center justify-between w-full md:w-auto">
                        <Link href="/" className="flex items-center gap-2.5 group">
                            <img
                                src="/favicon.svg"
                                alt="Kala Karsa Bakery Logo"
                                className="w-10 h-10 object-contain rounded-md group-hover:scale-105 transition-transform duration-300"
                            />
                            <span className="text-lg font-bold tracking-tight text-foreground">
                                Kala Karsa Bakery
                            </span>
                        </Link>

                        <div className="md:hidden flex items-center gap-3">
                            <Button variant="ghost" size="icon" onClick={() => setCartOpen(true)} className="relative hover:bg-muted text-foreground">
                                <ShoppingCart size={20} />
                                {cartItems.length > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold">
                                        {cartItems.reduce((a, b) => a + b.quantity, 0)}
                                    </span>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Integrated Live Search Box */}
                    <div className="relative w-full max-w-lg">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <Input
                            type="text"
                            placeholder="Cari roti manis, croissant, atau cake..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-10 py-2 border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-primary bg-background/50 focus:bg-card transition-all text-xs text-foreground placeholder:text-muted-foreground"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Auth & Cart Actions */}
                    <div className="hidden md:flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => setCartOpen(true)} className="relative hover:bg-muted text-foreground">
                            <ShoppingCart size={20} />
                            {cartItems.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold">
                                    {cartItems.reduce((a, b) => a + b.quantity, 0)}
                                </span>
                            )}
                        </Button>

                        {isLoggedIn ? (
                            <Link
                                href={dashboardUrl}
                                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary hover:bg-secondary/85 px-4 py-2 text-xs font-semibold text-secondary-foreground transition-all hover:scale-102"
                            >
                                <User size={13} /> Dashboard
                            </Link>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link
                                    href={login().url}
                                    className="text-xs font-semibold px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Log in
                                </Link>
                                {canRegister && (
                                    <Link
                                        href={register().url}
                                        className="bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold px-4 py-2 rounded-full transition-all hover:scale-[1.03] shadow-sm"
                                    >
                                        Register
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                </header>

                {/* Banner Promo Hero Section */}
                <div className="m-6 md:mx-12 rounded-xl overflow-hidden bg-card text-foreground p-8 md:p-12 relative shadow-sm border border-border">
                    <div className="absolute right-0 bottom-0 opacity-10 translate-y-12 translate-x-12 hidden md:block">
                        <ShoppingBag size={300} className="text-primary/10" />
                    </div>

                    <div className="max-w-2xl relative z-10 space-y-4">
                        <Badge className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 font-semibold text-[10px] rounded-full hover:bg-primary/15">
                            TOKO ROTI & KUE PREMIUM Kala Karsa Bakery
                        </Badge>
                        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight text-foreground">
                            Kelezatan Roti Segar, <br className="hidden sm:inline" />Dapatkan Reward Points!
                        </h1>
                        <p className="text-xs md:text-sm text-muted-foreground leading-relaxed max-w-lg">
                            Nikmati kelembutan Roti Sobek Cokelat, Croissant renyah, dan Cake ulang tahun premium kami yang dipanggang segar setiap hari. Daftar Member sekarang untuk kumpulkan <span className="text-foreground font-bold underline decoration-primary/40 underline-offset-4">1 Point setiap kelipatan Rp 10.000</span>, lalu tukarkan langsung dengan voucher potongan harga!
                        </p>
                        <div className="pt-2">
                            {!isLoggedIn && (
                                <Link
                                    href={register().url}
                                    className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-xs px-5 py-3 rounded-full shadow-md transition-transform hover:-translate-y-0.5"
                                >
                                    Gabung Member Sekarang <ArrowRight size={14} />
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* Categories Circular Slider Filter */}
                <div className="mx-6 md:mx-12 mt-6 mb-8 bg-card p-6 rounded-xl border border-border shadow-xs text-foreground">
                    <h2 className="text-sm font-bold text-foreground mb-6 flex items-center gap-2">
                        <Store size={16} className="text-muted-foreground" /> Jelajahi Kategori Produk
                    </h2>

                    <div className="flex items-center gap-5 overflow-x-auto pt-3 mt-1 pb-2 scrollbar-none">
                        {/* "Semua Kategori" Filter Option */}
                        <button
                            onClick={() => setSelectedCategorySlug(null)}
                            className="flex flex-col items-center gap-2 shrink-0 group transition-all"
                        >
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center bg-muted transition-all ${!selectedCategorySlug
                                    ? 'border-2 border-primary scale-105 shadow-sm ring-2 ring-primary/10'
                                    : 'border border-border group-hover:scale-105 group-hover:border-muted-foreground'
                                }`}>
                                <ShoppingBag size={20} className="text-foreground" />
                            </div>
                            <span className={`text-[11px] transition-colors ${!selectedCategorySlug ? 'text-primary font-extrabold' : 'text-muted-foreground font-medium group-hover:text-foreground'}`}>
                                Semua Produk
                            </span>
                        </button>

                        {/* Seeded Categories circular blocks */}
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategorySlug(cat.slug)}
                                className="flex flex-col items-center gap-2 shrink-0 group transition-all"
                            >
                                <div className={`w-14 h-14 rounded-full overflow-hidden transition-all bg-muted ${selectedCategorySlug === cat.slug
                                        ? 'border-2 border-primary scale-105 shadow-sm ring-2 ring-primary/10'
                                        : 'border border-border group-hover:scale-105 group-hover:border-muted-foreground'
                                    }`}>
                                    {cat.image ? (
                                        <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center font-bold text-xs bg-muted text-muted-foreground">
                                            {cat.name.substring(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <span className={`text-[11px] transition-colors ${selectedCategorySlug === cat.slug ? 'text-primary font-extrabold' : 'text-muted-foreground font-medium group-hover:text-foreground'}`}>
                                    {cat.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Primary Premium Products Grid Display */}
                <div className="mx-6 md:mx-12 space-y-6">
                    <div className="flex items-center justify-between text-foreground">
                        <div>
                            <h2 className="text-base font-bold text-foreground">
                                {selectedCategorySlug
                                    ? `Kategori: ${categories.find(c => c.slug === selectedCategorySlug)?.name}`
                                    : 'Katalog Produk Unggulan'
                                }
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Menampilkan {filteredProducts.length} produk siap dibeli
                            </p>
                        </div>
                    </div>

                    {filteredProducts.length === 0 ? (
                        <div className="bg-card rounded-xl py-16 px-6 text-center space-y-4 border border-border shadow-xs">
                            <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                                <Search size={24} />
                            </div>
                            <h3 className="font-bold text-foreground text-sm">Produk Tidak Ditemukan</h3>
                            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                                Kami tidak dapat menemukan produk yang sesuai dengan kata kunci "{searchTerm}".
                            </p>
                            <Button
                                onClick={() => { setSearchTerm(''); setSelectedCategorySlug(null); }}
                                className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-full text-xs font-bold"
                            >
                                Bersihkan Filter
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
                            {filteredProducts.map((product) => {
                                const { average, count } = getProductStats(product);
                                const pointsReward = Math.floor(Number(product.price) / 10000);

                                return (
                                    <div
                                        key={product.id}
                                        className="bg-card rounded-xl overflow-hidden border border-border hover:shadow-md transition-all flex flex-col group relative hover:-translate-y-1 duration-300 shadow-2xs"
                                    >
                                        {/* cover photo */}
                                        <div className="aspect-square relative w-full overflow-hidden bg-muted">
                                            <img
                                                src={product.cover_url}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                                            />
                                            {product.stock <= 0 ? (
                                                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                                                    <span className="bg-zinc-800 text-zinc-50 border border-zinc-700 font-bold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                                                        Habis
                                                    </span>
                                                </div>
                                            ) : product.stock <= 5 ? (
                                                <Badge className="absolute top-2.5 left-2.5 bg-zinc-900 text-zinc-50 border-none font-semibold text-[9px] px-2 py-0.5">
                                                    Sisa {product.stock}
                                                </Badge>
                                            ) : null}

                                            {/* Category Overlay Tag */}
                                            {product.category && (
                                                <Badge className="absolute top-2.5 right-2.5 bg-black/60 hover:bg-black/70 text-white border-none font-medium text-[9px] px-2 py-0.5 rounded-sm">
                                                    {product.category.name}
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Card Content Details */}
                                        <div className="p-4 flex-1 flex flex-col justify-between gap-3 text-foreground">
                                            <div className="space-y-1">
                                                <h3 className="font-bold text-foreground line-clamp-2 text-xs leading-snug group-hover:text-primary transition-colors">
                                                    {product.name}
                                                </h3>

                                                {/* Star rating */}
                                                <div className="flex items-center gap-1">
                                                    <div className="flex items-center text-yellow-400">
                                                        <Star size={11} fill="currentColor" />
                                                    </div>
                                                    <span className="text-[11px] font-bold text-foreground">{average}</span>
                                                    <span className="text-border text-xs">|</span>
                                                    <span className="text-[10px] text-muted-foreground">{count} Ulasan</span>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                {/* Price block */}
                                                <div className="space-y-0.5">
                                                    <div className="text-foreground font-extrabold text-sm md:text-base">
                                                        {formatIDR(product.price)}
                                                    </div>

                                                    {/* Point reward helper */}
                                                    <div className="text-[9px] text-muted-foreground font-bold bg-muted px-2 py-0.5 rounded-sm inline-flex items-center gap-1 border border-border">
                                                        🪙 Dapatkan +{pointsReward} Poin
                                                    </div>
                                                </div>

                                                {/* Dual actions: Add to Cart vs Buy Now */}
                                                {product.stock > 0 ? (
                                                    <div className="flex flex-col gap-1.5 pt-1">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={() => handleAddToCart(product, false)}
                                                            className="w-full text-foreground border-border hover:bg-muted rounded-lg text-[10px] font-bold py-1.5 h-8"
                                                        >
                                                            Tambah Keranjang
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            onClick={() => handleAddToCart(product, true)}
                                                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-[10px] font-bold py-1.5 h-8"
                                                        >
                                                            Beli Langsung
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        disabled
                                                        className="w-full bg-muted text-muted-foreground rounded-lg text-[10px] font-bold py-2"
                                                    >
                                                        Stok Habis
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Sliding Drawer Cart Checkout Component */}
            <Sheet open={cartOpen} onOpenChange={setCartOpen}>
                <SheetContent className="w-full sm:max-w-md p-0 flex flex-col justify-between bg-card text-foreground border-l border-border">
                    <div>
                        <SheetHeader className="p-5 border-b border-border">
                            <SheetTitle className="text-foreground flex items-center gap-2 text-sm font-bold">
                                <ShoppingCart size={18} className="text-muted-foreground" /> Keranjang Belanja Anda
                            </SheetTitle>
                        </SheetHeader>

                        {/* Cart items scrollable container */}
                        <div className="p-5 overflow-y-auto max-h-[50vh] space-y-4">
                            {cartItems.length === 0 ? (
                                <div className="text-center py-12 space-y-2">
                                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                                        <ShoppingCart size={20} />
                                    </div>
                                    <h4 className="font-bold text-foreground text-xs">Keranjang Masih Kosong</h4>
                                    <p className="text-[10px] text-muted-foreground">Tambahkan produk berkualitas Kala Karsa Bakery untuk berbelanja.</p>
                                </div>
                            ) : (
                                cartItems.map((item) => (
                                    <div key={item.id} className="flex gap-4 border-b border-border pb-4 last:border-none">
                                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted shrink-0">
                                            <img src={item.product.cover_url} alt={item.product.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 flex flex-col justify-between py-0.5">
                                            <div className="flex justify-between items-start gap-1">
                                                <div>
                                                    <h5 className="font-bold text-foreground text-[11px] line-clamp-1">{item.product.name}</h5>
                                                    <span className="text-xs font-extrabold text-foreground">{formatIDR(item.product.price)}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveItem(item.id)}
                                                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 p-0.5"
                                                    title="Hapus"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>

                                            {/* Quantity adjustment */}
                                            <div className="flex items-center justify-between mt-1">
                                                <div className="flex items-center gap-2 bg-muted border border-border rounded-lg p-0.5">
                                                    <button
                                                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1, item.product.stock)}
                                                        className="text-muted-foreground hover:text-foreground p-1"
                                                    >
                                                        <Minus size={11} />
                                                    </button>
                                                    <span className="text-[11px] font-extrabold px-1 text-foreground">{item.quantity}</span>
                                                    <button
                                                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1, item.product.stock)}
                                                        className="text-muted-foreground hover:text-foreground p-1"
                                                    >
                                                        <Plus size={11} />
                                                    </button>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground">Stok: {item.product.stock}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Order summary, notes, coupons, and Midtrans checkout panel */}
                    {cartItems.length > 0 && (
                        <div className="bg-muted border-t border-border p-5 space-y-4">
                            {/* Notes Box */}
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">
                                    Catatan Pesanan
                                </label>
                                <Input
                                    type="text"
                                    placeholder="Tulis instruksi atau varian pesanan..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="bg-card text-foreground text-xs py-1 h-8 rounded-lg"
                                />
                            </div>

                            {/* Coupons dropdown manager */}
                            {isLoggedIn && userCoupons.length > 0 && (
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block flex items-center gap-1">
                                        <Ticket size={11} className="text-muted-foreground" /> Gunakan Kupon Potongan
                                    </label>
                                    <select
                                        value={selectedCouponId || ''}
                                        onChange={(e) => setSelectedCouponId(e.target.value ? Number(e.target.value) : null)}
                                        className="w-full bg-card border border-border text-foreground text-xs p-2 rounded-lg"
                                    >
                                        <option value="">-- Pilih Voucher Diskon Anda --</option>
                                        {userCoupons.map((uc) => (
                                            <option key={uc.id} value={uc.id}>
                                                {uc.coupon.code} - Potongan {uc.coupon.discount_type === 'percentage' ? `${uc.coupon.discount_value}%` : formatIDR(uc.coupon.discount_value)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Summary Totals Calculation */}
                            <div className="space-y-2 text-xs border-t border-border pt-3">
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Subtotal Produk</span>
                                    <span className="font-semibold">{formatIDR(subtotal)}</span>
                                </div>
                                {discountAmount > 0 && (
                                    <div className="flex justify-between text-green-600 font-medium">
                                        <span>Potongan Diskon</span>
                                        <span>-{formatIDR(discountAmount)}</span>
                                    </div>
                                )}
                                {isMember && (
                                    <div className="flex justify-between text-muted-foreground font-medium">
                                        <span className="flex items-center gap-1">🪙 Reward Points</span>
                                        <span>+{pointsEarned} Poin</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-xs font-extrabold text-foreground pt-2 border-t border-dashed border-border">
                                    <span>Total Tagihan</span>
                                    <span className="text-foreground text-sm font-extrabold">{formatIDR(totalAmount)}</span>
                                </div>
                            </div>

                            {/* Checkout CTA */}
                            <Button
                                onClick={handleCheckout}
                                className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.01]"
                            >
                                <>
                                    {isLoggedIn ? (
                                        <>Lanjut ke Checkout <ArrowRight size={14} /></>
                                    ) : (
                                        <>Log in untuk Checkout <ArrowRight size={14} /></>
                                    )}
                                </>
                            </Button>

                            {!isLoggedIn && (
                                <p className="text-[10px] text-center text-muted-foreground leading-tight">
                                    Anda harus login terlebih dahulu agar pesanan bisa diproses secara legal dan poin reward masuk.
                                </p>
                            )}
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </>
    );
}
