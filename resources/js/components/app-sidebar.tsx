import { Link, usePage } from '@inertiajs/react';
import { BookOpen, FolderGit2, LayoutGrid, ShoppingBag, ClipboardList, Ticket, Star, Users, Receipt, CreditCard } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

export function AppSidebar() {
    const page = usePage();
    const props = page.props as any;
    const dashboardUrl = props.currentTeam
        ? dashboard(props.currentTeam.slug)
        : '/';

    const user = props.auth?.user as any;
    const roles = user?.roles || [];

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboardUrl,
            icon: LayoutGrid,
        },
    ];

    // Dynamic menu rendering based on Spatie roles
    if (roles.includes('admin')) {
        mainNavItems.push(
            {
                title: 'Kelola Produk',
                href: '/products',
                icon: ShoppingBag,
            },
            {
                title: 'Kelola Pesanan',
                href: '/orders',
                icon: Receipt,
            },
            {
                title: 'Log Mutasi Stok',
                href: '/stock/movements',
                icon: ClipboardList,
            },
            {
                title: 'Stock Opname',
                href: '/stock/opnames',
                icon: ClipboardList,
            },
            {
                title: 'Kelola Kupon',
                href: '/coupons',
                icon: Ticket,
            },
            {
                title: 'Ulasan & Kritik',
                href: '/reviews',
                icon: Star,
            },
            {
                title: 'Metode Pembayaran',
                href: '/admin/payment-channels',
                icon: CreditCard,
            }
        );
    } else if (roles.includes('owner')) {
        mainNavItems.push(
            {
                title: 'Daftar Produk',
                href: '/products',
                icon: ShoppingBag,
            },
            {
                title: 'Daftar Pesanan',
                href: '/orders',
                icon: Receipt,
            },
            {
                title: 'Log Mutasi Stok',
                href: '/stock/movements',
                icon: ClipboardList,
            },
            {
                title: 'Stock Opname',
                href: '/stock/opnames',
                icon: ClipboardList,
            },
            {
                title: 'Daftar Kupon',
                href: '/coupons',
                icon: Ticket,
            },
            {
                title: 'Metode Pembayaran',
                href: '/admin/payment-channels',
                icon: CreditCard,
            }
        );
    } else {
        // Customer / Standard Member
        mainNavItems.push(
            {
                title: 'Belanja Sekarang',
                href: '/',
                icon: ShoppingBag,
            },
            {
                title: 'Pesanan Saya',
                href: '/orders',
                icon: Receipt,
            },
            {
                title: 'Kupon Promo',
                href: '/coupons',
                icon: Ticket,
            },
            {
                title: 'Keanggotaan (Member)',
                href: '/membership',
                icon: Users,
            }
        );
    }

    const footerNavItems: NavItem[] = [
        // {
        //     title: 'Repository',
        //     href: 'https://github.com/laravel/react-starter-kit',
        //     icon: FolderGit2,
        // },
        // {
        //     title: 'Documentation',
        //     href: 'https://laravel.com/docs/starter-kits#react',
        //     icon: BookOpen,
        // },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboardUrl} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
