<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Product;
use App\Models\Category;
use App\Models\Review;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Roles & Permissions Seeder
        $this->call(RolesAndPermissionsSeeder::class);

        // 2. Default Users
        User::whereIn('email', ['admin@kalakarsa.com', 'owner@kalakarsa.com', 'customer@kalakarsa.com'])->delete();

        // Admin
        $admin = User::factory()->create([
            'name' => 'Admin Kala Karsa Bakery',
            'email' => 'admin@kalakarsa.com',
            'password' => bcrypt('password123'),
        ]);
        $admin->assignRole('admin');

        // Owner
        $owner = User::factory()->create([
            'name' => 'Owner Kala Karsa Bakery',
            'email' => 'owner@kalakarsa.com',
            'password' => bcrypt('password123'),
        ]);
        $owner->assignRole('owner');

        // Customer
        $customer = User::factory()->create([
            'name' => 'Customer Kala Karsa Bakery',
            'email' => 'customer@kalakarsa.com',
            'password' => bcrypt('password123'),
        ]);
        $customer->assignRole('customer');

        // 3. E-commerce Categories - Premium Bakery & Cake Theme
        $categoriesData = [
            [
                'name' => 'Roti Manis & Gurih',
                'slug' => 'roti-manis-gurih',
                'image' => 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=300&auto=format&fit=crop',
            ],
            [
                'name' => 'Pastry & Croissant',
                'slug' => 'pastry-croissant',
                'image' => 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=300&auto=format&fit=crop',
            ],
            [
                'name' => 'Cake & Tart Ulang Tahun',
                'slug' => 'cake-tart',
                'image' => 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=300&auto=format&fit=crop',
            ],
            [
                'name' => 'Kue Kering Tradisional',
                'slug' => 'kue-kering',
                'image' => 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?q=80&w=300&auto=format&fit=crop',
            ],
            [
                'name' => 'Kue Basah & Jajanan Pasar',
                'slug' => 'kue-basah',
                'image' => 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?q=80&w=300&auto=format&fit=crop',
            ]
        ];

        $categories = [];
        foreach ($categoriesData as $data) {
            $categories[] = Category::firstOrCreate(['slug' => $data['slug']], $data);
        }

        // 4. Products Distributed Across Categories
        // We will seed 15 gorgeous premium bakery products
        $productCoverImages = [
            'roti-manis-gurih' => [
                'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?q=80&w=400&auto=format&fit=crop', // sweet bun
                'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?q=80&w=400&auto=format&fit=crop', // plain bread
                'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=400&auto=format&fit=crop', // savory bun
            ],
            'pastry-croissant' => [
                'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=400&auto=format&fit=crop', // croissant
                'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?q=80&w=400&auto=format&fit=crop', // pain au chocolate
                'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?q=80&w=400&auto=format&fit=crop', // almond croissant
            ],
            'cake-tart' => [
                'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=400&auto=format&fit=crop', // chocolate cake
                'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?q=80&w=400&auto=format&fit=crop', // red velvet (beautiful gourmet cake slice)
                'https://images.unsplash.com/photo-1565958011703-44f9829ba187?q=80&w=400&auto=format&fit=crop', // strawberry cake
            ],
            'kue-kering' => [
                'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?q=80&w=400&auto=format&fit=crop', // nastar
                'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?q=80&w=400&auto=format&fit=crop', // cookies (Kastengel Keju Edam Kraft)
                'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?q=80&w=400&auto=format&fit=crop', // powdered white dessert (Putri Salju Mede Almond)
            ],
            'kue-basah' => [
                'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?q=80&w=400&auto=format&fit=crop', // lumpur pandan
                'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=400&auto=format&fit=crop', // savory rolls (Risol Mayo Smoked Beef)
                'https://images.unsplash.com/photo-1587314168485-3236d6710814?q=80&w=400&auto=format&fit=crop', // lapis legit
            ]
        ];

        $productNames = [
            'roti-manis-gurih' => ['Roti Sobek Cokelat Klasik', 'Roti Sisir Mentega Wisman', 'Roti Daging Sapi Lada Hitam'],
            'pastry-croissant' => ['Butter Croissant Perancis', 'Pain au Chocolat Belgia', 'Almond Croissant Premium'],
            'cake-tart' => ['Double Chocolate Fudge Cake', 'Signature Red Velvet Cake', 'Japanese Strawberry Shortcake'],
            'kue-kering' => ['Nastar Selai Nanas Madu', 'Kastengel Keju Edam Kraft', 'Putri Salju Mede Almond'],
            'kue-basah' => ['Kue Lumpur Surga Pandan', 'Risol Mayo Smoked Beef', 'Lapis Legit Premium Mini']
        ];

        $productPrices = [
            'roti-manis-gurih' => [25000, 18000, 28000],
            'pastry-croissant' => [22000, 26000, 32000],
            'cake-tart' => [249000, 279000, 219000],
            'kue-kering' => [95000, 115000, 85000],
            'kue-basah' => [12000, 15000, 45000]
        ];

        foreach ($categories as $cat) {
            $slug = $cat->slug;
            for ($i = 0; $i < 3; $i++) {
                $name = $productNames[$slug][$i];
                $product = Product::factory()->create([
                    'category_id' => $cat->id,
                    'name' => $name,
                    'slug' => Str::slug($name) . '-' . Str::random(4),
                    'cover' => $productCoverImages[$slug][$i],
                    'price' => $productPrices[$slug][$i],
                    'stock' => rand(10, 45),
                    'is_active' => true,
                ]);

                // Mock a completed order and order item so the review is valid!
                $order = \App\Models\Order::create([
                    'user_id' => $customer->id,
                    'order_number' => 'ORD-' . strtoupper(Str::random(8)),
                    'status' => 'paid',
                    'payment_status' => 'settlement',
                    'total_amount' => $product->price,
                    'discount_amount' => 0.00,
                    'points_earned' => floor($product->price / 10000),
                    'customer_snapshot' => [
                        'name' => $customer->name,
                        'email' => $customer->email,
                        'phone' => '08123456789',
                        'member_status' => 'none',
                    ],
                ]);

                $orderItem = \App\Models\OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'quantity' => 1,
                    'price' => $product->price,
                    'product_snapshot' => [
                        'name' => $product->name,
                        'sku' => $product->sku,
                        'price' => $product->price,
                        'metadata' => $product->metadata,
                    ],
                ]);

                // 5. Seed reviews for this product
                $reviewerNames = ['Budi', 'Siti', 'Joko', 'Andi', 'Dewi'];
                $reviewComments = [
                    'Rotinya lembut banget, cokelatnya lumer di mulut! Rekomendasi banget.',
                    'Croissant-nya super flaky dan harum butter premium-nya kecium banget. Mantap!',
                    'Kastengel-nya renyah gurih keju asli, gak pelit kejunya. Packaging super aman.',
                    'Cake-nya cantik sekali dan rasa manisnya pas gak bikin eneg. Top bgt!',
                    'Risol mayo-nya lumer melimpah, isinya padat. Diterima dalam keadaan fresh.'
                ];

                $reviewCount = rand(2, 4);
                for ($j = 0; $j < $reviewCount; $j++) {
                    Review::create([
                        'product_id' => $product->id,
                        'user_id' => $customer->id,
                        'order_item_id' => $orderItem->id,
                        'rating' => rand(4, 5),
                        'comment' => $reviewComments[rand(0, 4)],
                        'reply' => rand(0, 1) ? 'Terima kasih telah berbelanja di Kala Karsa Bakery! Ditunggu pesanan berikutnya kak.' : null,
                    ]);
                }
            }
        }

        // ============================================
        // 🏦 VIRTUAL ACCOUNTS - Flat Fee IDR 4.000
        // ============================================
        $virtualAccounts = [
            ['code' => 'bca_va', 'name' => 'BCA Virtual Account', 'type' => 'VIRTUAL_ACCOUNT', 'fee_flat' => 4000, 'fee_percent' => 0],
            ['code' => 'briva', 'name' => 'BRI Virtual Account', 'type' => 'VIRTUAL_ACCOUNT', 'fee_flat' => 4000, 'fee_percent' => 0],
            ['code' => 'bni_va', 'name' => 'BNI Virtual Account', 'type' => 'VIRTUAL_ACCOUNT', 'fee_flat' => 4000, 'fee_percent' => 0],
            ['code' => 'mandiri_va', 'name' => 'Mandiri Bill Payment', 'type' => 'VIRTUAL_ACCOUNT', 'fee_flat' => 4000, 'fee_percent' => 0],
            ['code' => 'permata_va', 'name' => 'Permata Virtual Account', 'type' => 'VIRTUAL_ACCOUNT', 'fee_flat' => 4000, 'fee_percent' => 0],
            ['code' => 'cimb_va', 'name' => 'CIMB Virtual Account', 'type' => 'VIRTUAL_ACCOUNT', 'fee_flat' => 4000, 'fee_percent' => 0],
            ['code' => 'danamon_va', 'name' => 'Danamon Virtual Account', 'type' => 'VIRTUAL_ACCOUNT', 'fee_flat' => 4000, 'fee_percent' => 0],
            ['code' => 'bsi_va', 'name' => 'BSI Virtual Account', 'type' => 'VIRTUAL_ACCOUNT', 'fee_flat' => 4000, 'fee_percent' => 0],
            ['code' => 'other_va', 'name' => 'ATM Bersama / Prima / Alto', 'type' => 'VIRTUAL_ACCOUNT', 'fee_flat' => 4000, 'fee_percent' => 0],
        ];

        // ============================================
        // 💳 E-WALLETS - Percentage Fee
        // ============================================
        $ewallets = [
            ['code' => 'gopay', 'name' => 'GoPay', 'type' => 'E_WALLET', 'fee_flat' => 0, 'fee_percent' => 2.0],
            ['code' => 'shopeepay', 'name' => 'ShopeePay', 'type' => 'E_WALLET', 'fee_flat' => 0, 'fee_percent' => 2.0],
            ['code' => 'dana', 'name' => 'DANA', 'type' => 'E_WALLET', 'fee_flat' => 0, 'fee_percent' => 1.5],
        ];

        // ============================================
        // 📱 QRIS - Low Percentage Fee
        // ============================================
        $qris = [
            ['code' => 'qris', 'name' => 'QRIS', 'type' => 'QRIS', 'fee_flat' => 0, 'fee_percent' => 0.7],
        ];

        // ============================================
        // 💳 CREDIT/DEBIT CARDS - Mixed Fee
        // ============================================
        $cards = [
            ['code' => 'credit_card', 'name' => 'Visa / Mastercard / JCB / Amex', 'type' => 'CARD', 'fee_flat' => 2000, 'fee_percent' => 2.9],
        ];

        // ============================================
        // 🏪 RETAIL STORES - Flat Fee
        // ============================================
        $retailStores = [
            ['code' => 'indomaret', 'name' => 'Indomaret', 'type' => 'RETAIL_STORE', 'fee_flat' => 1000, 'fee_percent' => 0],
            ['code' => 'alfamart', 'name' => 'Alfamart / Alfamidi / Dan+Dan', 'type' => 'RETAIL_STORE', 'fee_flat' => 5000, 'fee_percent' => 0],
        ];

        // ============================================
        // 🛒 PAY LATER - Percentage Fee
        // ============================================
        $payLater = [
            ['code' => 'akulaku', 'name' => 'Akulaku PayLater', 'type' => 'E_WALLET', 'fee_flat' => 0, 'fee_percent' => 1.7],
            ['code' => 'kredivo', 'name' => 'Kredivo', 'type' => 'E_WALLET', 'fee_flat' => 0, 'fee_percent' => 2.0],
        ];

        // Merge all categories
        $allChannels = array_merge(
            $virtualAccounts,
            $ewallets,
            $qris,
            $cards,
            $retailStores,
            $payLater
        );

        // Seed to database
        foreach ($allChannels as $channel) {
            \App\Models\PaymentChannel::updateOrCreate(
                ['code' => $channel['code']],
                $channel
            );
        }
    }
}
