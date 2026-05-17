# Technical Documentation & Architectural Blueprint — Kala Karsa Bakery

Selamat datang di Dokumentasi Teknis Aplikasi **Kala Karsa Bakery (E-Commerce Suite & POS)**. Dokumen ini disusun untuk menjelaskan arsitektur sistem, struktur database (DBML), analisis alur kerja (workflow), diagram permodelan data (DFD, Sequence, Activity), serta laporan pengujian komprehensif menggunakan framework **Pest PHP**.

---

## 1. Analisis `routes/web.php`

Routing pada Kala Karsa Bakery dirancang menggunakan Laravel 13 dengan memadukan **Inertia.js v3** untuk Single Page Application (SPA), serta pengelompokan middleware berbasis peran (*role-based access control*).

Berikut adalah struktur analisis routing yang didefinisikan dalam `routes/web.php`:

### A. Rute Publik (Public Routes)
* **`GET /` (home)**: Halaman landing utama pelanggan (`welcome`). Rute ini secara dinamis memuat katalog produk aktif beserta kategorinya. Jika user telah login, sistem otomatis menyuntikkan data keranjang belanja persistent (`cartItems`) dan kupon aktif milik user (`userCoupons`).
* **`POST payment/callback` (payment.callback)**: Endpoint webhook Midtrans untuk menerima notifikasi status pembayaran transaksi secara *asynchronous* dari gateway pembayaran. Rute ini dikecualikan dari verifikasi CSRF.

### B. Rute Konsumen Terautentikasi (Authenticated Customer Routes)
Di bawah naungan middleware `['auth', 'verified']`, rute ini dikhususkan untuk pelanggan yang terdaftar:
* **Katalog & Detail Produk**:
  * `GET products` (`products.index`): Menampilkan daftar katalog produk.
  * `GET products/{product}` (`products.show`): Menampilkan detail produk secara interaktif beserta ulasan konsumen.
* **Keanggotaan & Kupon**:
  * `GET membership` (`membership.index`): Dashboard member untuk melihat akumulasi poin belanja.
  * `POST membership/register` (`membership.register`): Mendaftarkan pelanggan menjadi member aktif menggunakan nomor telepon.
  * `GET coupons` (`coupons.index`): Katalog kupon diskon yang tersedia.
  * `POST coupons/{id}/redeem` (`coupons.redeem`): Menukarkan akumulasi poin belanja member dengan kupon diskon tertentu.
* **Keranjang Belanja Persistent (Cart)**:
  * `POST cart` (`cart.add`): Menambahkan produk ke keranjang belanja yang disimpan langsung di database.
  * `PATCH cart/{id}` (`cart.update`): Memperbarui kuantiti produk di keranjang (otomatis divalidasi terhadap sisa stok).
  * `DELETE cart/{id}` (`cart.remove`): Menghapus item dari keranjang belanja.
* **Transaksi Pemesanan & Ulasan (Checkout & Orders)**:
  * `GET checkout` (`checkout.index`): Halaman form checkout untuk memilih kanal pembayaran aktif (BCA, GoPay, QRIS, dll) dan menerapkan kupon belanja.
  * `POST orders/checkout` (`orders.checkout`): Memproses pemesanan, mencatat diskon kupon, menghitung biaya admin kanal pembayaran, dan membuat token transaksi Midtrans Snap.
  * `GET orders` (`orders.index`): Riwayat pesanan/transaksi yang pernah dilakukan pelanggan.
  * `GET orders/{id}` (`orders.show`): Halaman invoice digital premium yang siap dicetak (A4 Printable).
  * `POST reviews` (`reviews.store`): Mengirimkan rating bintang (1-5) dan ulasan komentar untuk produk yang telah dibayar.

### C. Rute Manajemen Admin & Owner (Dashboard & Operations)
Menggunakan pengaman middleware `role:admin|owner` untuk membatasi akses fitur operasional internal toko:
* `GET stock/movements` (`stock.movements`): Log histori pergerakan stok barang masuk/keluar (audit trail).
* `GET stock/opnames` (`stock.opname.index`): Daftar dokumen pemeriksaan stok fisik gudang (Stock Opname).
* `GET stock/opnames/{id}` (`stock.opname.show`): Detail item opname beserta selisih (*discrepancy*).
* `GET reviews` (`reviews.index`): Manajemen daftar ulasan produk dari pelanggan.
* `GET admin/payment-channels` (`admin.payment-channels.index`): Mengelola kanal pembayaran terintegrasi.
* `PUT admin/payment-channels/{paymentChannel}` (`admin.payment-channels.update`): Mengaktifkan/menonaktifkan metode pembayaran secara dinamis.

### D. Rute Operasional Khusus Administrator (Admin-Only Routes)
Menggunakan middleware `role:admin` untuk membatasi hak akses CRUD mutlak:
* **Manajemen Katalog**: Menambah, mengubah, dan menghapus data produk (`products.store`, `products.update`, `products.destroy`).
* **Rekonsiliasi Stok & Opname**:
  * `POST stock/opnames` (`stock.opname.store`): Membuat draft opname fisik produk.
  * `POST stock/opnames/{id}/complete` (`stock.opname.complete`): Memfinalisasi opname, merekonsiliasi jumlah stok fisik ke tabel produk, dan memicu histori pergerakan penyesuaian stok (`opname_adjustment`).
  * `POST stock/adjust` (`stock.adjust`): Melakukan penyesuaian stok manual.
* **Manajemen Kupon Belanja**: Membuat dan menghapus kupon diskon template (`coupons.store`, `coupons.destroy`).
* **Merchant Reply**: Memberikan tanggapan admin (`reviews.reply`) atas ulasan yang masuk dari konsumen.

---

## 2. Analisis MVC (Model, View, Controller) dan Migrasi

Aplikasi ini menerapkan pola arsitektur **Model-View-Controller (MVC)** modern yang dipisahkan antara logika server-side (PHP Laravel) dan representasi client-side (React JSX/TSX via Inertia.js).

| Komponen MVC | Nama File / Class | Keterangan & Tanggung Jawab |
| :--- | :--- | :--- |
| **Model** | `User.php` | Mengelola data pengguna, status keanggotaan (`member_status`), akumulasi poin reward (`member_points`), serta relasi Spatie Roles. |
| **Model** | `Product.php` | Representasi data roti/kue, SKU unik, stok aktif, relasi ke kategori produk, serta cover gambar dengan fallback URL. |
| **Model** | `Category.php` | Pengelompokan jenis produk (misal: Pastry & Croissant, Cake & Tart). |
| **Model** | `Order.php` | Pencatatan transaksi penjualan, total bayar, kupon yang digunakan, biaya admin, hingga snapshot data pelanggan masa lalu. |
| **Model** | `OrderItem.php` | Menyimpan rincian item produk yang dipesan beserta snapshot detail harga dan SKU saat transaksi dilakukan. |
| **Model** | `StockOpname.php` | Log penyesuaian inventaris fisik tahunan/bulanan toko beserta relasi user pembuat. |
| **Model** | `StockOpnameItem.php` | Rincian selisih stok riil di gudang vs stok tercatat sistem komputer. |
| **Model** | `StockMovement.php` | Ledger pencatatan masuk/keluar stok produk karena transaksi pembelian (`purchase`) maupun koreksi gudang (`opname_adjustment`). |
| **Model** | `Coupon.php` | Template kupon belanja (tipe nominal flat maupun persentase). |
| **Model** | `UserCoupon.php` | Dompet kupon member yang melacak tanggal klaim, tanggal penggunaan, dan status validitas kupon. |
| **Model** | `CartItem.php` | Penyimpanan item keranjang belanja persistent konsumen di dalam database MySQL. |
| **Model** | `PaymentChannel.php` | Konfigurasi gerbang kanal pembayaran aktif beserta persentase/flat fee admin. |
| **Model** | `Team.php` | Mengelola data entitas kolaborasi tim toko yang menampung Owner dan Administrator terdaftar. |
| **Model** | `TeamInvitation.php` | Menyimpan rincian email, token, dan status undangan admin yang dikirimkan oleh Owner. |
| **Controller** | `DashboardController.php` | Menghitung statistik penjualan bulanan, produk terlaris, donut chart metode pembayaran, dan menyuntikkannya ke halaman admin/owner. |
| **Controller** | `ProductController.php` | Menangani daftar katalog publik serta aksi manajemen CRUD produk oleh Admin. |
| **Controller** | `OrderController.php` | Menangani alur checkout konsumen, memvalidasi sisa stok, mendaftarkan pesanan, dan menerima notifikasi callback IPN Midtrans. |
| **Controller** | `StockController.php` | Mengelola histori pergerakan stok barang serta pencatatan audit opname gudang. |
| **Controller** | `CheckoutController.php` | Menyajikan form checkout dengan kalkulasi dinamis biaya admin dan diskon. |
| **Controller** | `MembershipController.php` | Memproses aktivasi keanggotaan pelanggan baru menjadi member. |
| **Controller** | `CouponController.php` | Mengelola klaim penukaran poin member dengan kupon diskon. |
| **Controller** | `ReviewController.php` | Menampung ulasan rating pembeli serta memproses balasan admin. |
| **Controller** | `PaymentChannelController.php` | Menangani aksi toggle status aktif/nonaktif saluran metode pembayaran oleh Owner. |
| **Controller** | `TeamController.php` | Mengelola pembaruan nama kolaborasi tim toko serta pembubaran/penghapusan tim oleh Owner. |
| **Controller** | `TeamInvitationController.php` | Memproses pembuatan token undangan kolaborasi admin baru serta pengiriman email undangan oleh Owner. |
| **Controller** | `TeamMemberController.php` | Menangani penambahan anggota admin baru ke tim serta pengeluaran anggota dari tim oleh Owner. |
| **View** | `welcome.tsx` | Landing page interaktif Kala Karsa dengan filter kategori, sorting produk, serta slide-out keranjang belanja instan. |
| **View** | `checkout.tsx` | Portal transaksi interaktif pemilihan metode pembayaran dan penerapan kupon. |
| **View** | `dashboard.tsx` | Dashboard admin/owner yang menyajikan statistik premium dan visualisasi interaktif (Rounded SVG Bar Chart & Donut Chart). |
| **View** | `orders/show.tsx` | Invoice digital premium A4 Printable lengkap dengan barcode QRIS langsung dan layout cetak instan. |
| **View** | `admin/payment_channels.tsx` | Dasbor konfigurasi aktif/nonaktif payment channel terintegrasi menggunakan routing Wayfinder. |
| **View** | `teams/show.tsx` | Portal kolaborasi tim toko untuk mengundang admin baru, membatalkan undangan pending, dan mengelola peran anggota oleh Owner. |

### Analisis File Migrasi Database (`database/migrations/`)

1. **`create_users_table`**: Menyimpan kredensial dasar pengguna. Dimodifikasi lewat migrasi `add_member_fields_to_users_table` untuk menambahkan kolom keanggotaan: `phone_number` (string, nullable), `member_status` (enum: 'non-member', 'active', 'suspended'), dan `member_points` (integer, default 0).
2. **`create_categories_table`**: Menyimpan data kategori produk (`id`, `name`, `slug`, `image`).
3. **`create_products_table`**: Menyimpan detail produk. Memiliki foreign key `category_id` (migrasi terpisah `add_category_id_to_products_table`), kolom `name`, `sku` (unique), `slug` (unique), `price` (decimal), `stock` (integer), `cover` (string, nullable), `metadata` (json, nullable), dan `is_active` (boolean).
4. **`create_orders_table`**: Mencatat transaksi pembayaran. Berisi `user_id` (foreign key), `order_number` (unique), `status` (pending, paid, cancelled), `payment_status` (settlement, deny, expire), `payment_method`, `payment_channel_code` (relasi ke payment channel), `total_amount` (decimal), `discount_amount` (decimal), `admin_fee` (decimal), `points_used`, `points_earned`, `snap_token`, `snap_url`, `notes` (text), dan `customer_snapshot` (json, menyimpan profil user saat checkout).
5. **`create_order_items_table`**: Rincian pemesanan produk. Menyimpan `order_id` (foreign), `product_id` (foreign), `quantity`, `price`, dan `product_snapshot` (json, guna mencegah perubahan harga produk di masa depan merusak sejarah laporan keuangan).
6. **`create_stock_opnames_table`**: Mencatat berkas verifikasi stok gudang (`opname_number`, `notes`, `status` [draft, completed], `created_by` [foreign]).
7. **`create_stock_opname_items_table`**: Menyimpan detail pencocokan produk opname (`stock_opname_id` [foreign], `product_id` [foreign], `system_stock`, `actual_stock`, `discrepancy`).
8. **`create_stock_movements_table`**: Buku besar inventaris (`product_id` [foreign], `quantity` [integer, positif/negatif], `type` [purchase, opname_adjustment, manual], `reference_id` [integer, polymorphic reference]).
9. **`create_coupons_table`**: Berisi template diskon promo (`code` [unique], `name`, `discount_type` [fixed, percentage], `discount_value`, `points_required`, `min_purchase`, `is_active`).
10. **`create_user_coupons_table`**: Dompet digital kupon pengguna (`user_id` [foreign], `coupon_id` [foreign], `redeemed_at`, `used_at`, `status` [active, used, expired]).
11. **`create_cart_items_table`**: Menyimpan keranjang belanja persistent konsumen terdaftar (`user_id` [foreign], `product_id` [foreign], `quantity`).
12. **`create_payment_channels_table`**: Daftar kanal gerbang pembayaran aktif (`code` [unique], `name`, `type` [VIRTUAL_ACCOUNT, E_WALLET, QRIS, CARD, RETAIL_STORE], `fee_flat`, `fee_percent`, `is_active`).

---

## 3. Analisis Alur Kerja Aplikasi (Workflow)

Aplikasi memiliki dua poros utama alur kerja dengan peran yang terbagi secara ketat demi keamanan data dan akurasi keuangan.

### A. Alur Kerja Admin & Owner
1. **Autentikasi & Dashboard Utama**:
   * Admin masuk ke sistem melalui portal login terenkripsi Fortify.
   * Dashboard menyajikan statistik total pendapatan bulanan, volume transaksi, sisa varian roti, dan jumlah produk kritis (stok menipis).
   * **Visualisasi Tren**: Admin memantau grafik penjualan bulanan (Rounded SVG Bar Chart) serta proporsi kanal transaksi pembayaran favorit pelanggan (Interactive Donut Chart).
2. **Manajemen Master Data & Promosi**:
   * Admin mengelola kategori roti dan detail item produk (Nama, SKU unik, Harga, Cover gambar, deskripsi, dan status aktif).
   * Admin merilis kupon belanja diskon baru dengan menetapkan syarat poin keanggotaan minimal untuk penukaran.
3. **Pencocokan Inventaris Fisik (Stock Opname)**:
   * Untuk menjaga sinkronisasi data gudang, Admin membuat dokumen draft **Stock Opname**.
   * Admin menginput jumlah fisik aktual roti yang dihitung di dapur/rak display.
   * Sistem otomatis menghitung nilai selisih (`discrepancy` = fisik - sistem komputer).
   * Saat Admin menekan tombol **Complete Opname**, sistem secara otomatis memperbarui kolom `stock` pada tabel produk agar sesuai dengan jumlah aktual fisik, mendaftarkan log transaksi ke `stock_movements` dengan tipe `opname_adjustment`, dan mengubah status berkas menjadi `completed` (kunci mati).
4. **Respon Komunitas & Payment Channel**:
   * Admin memantau umpan balik ulasan rating konsumen dan memberikan balasan (*Merchant Reply*).
   * Admin dapat menonaktifkan metode pembayaran tertentu secara dinamis melalui dashboard admin payment channels.

### B. Alur Kerja Pelanggan (Member / Customer)
1. **Penjelajahan Katalog & Pembelian**:
   * Pelanggan membuka landing page, menyaring produk berdasarkan kategori (misal: Pastry & Croissant), dan membaca rating/ulasan pembeli sebelumnya.
   * Pelanggan menekan tombol "Tambah ke Keranjang". Item belanja otomatis masuk ke database persistent (`cart_items`), sehingga keranjang tidak hilang saat pindah browser/perangkat.
2. **Menjadi Member & Mengumpulkan Poin**:
   * Konsumen mendaftarkan nomor telepon mereka untuk menjadi member terverifikasi.
   * Setiap melakukan checkout belanja kelipatan Rp10.000, member otomatis mendapatkan reward **1 Poin Belanja**.
   * Member dapat menukarkan poin yang terkumpul dengan berbagai pilihan kupon diskon aktif yang ada di menu reward.
3. **Proses Checkout & Integrasi Midtrans**:
   * Di halaman checkout, pelanggan memilih metode pembayaran (seperti BCA Virtual Account atau QRIS) dan menerapkan kupon belanja aktif.
   * Sistem melakukan validasi kuota stok produk di database secara ketat. Jika lolos, keranjang dihapus, order dibuat dengan status `pending`, dan nominal akhir dihitung: 
     $$\text{Total Bayar} = \text{Subtotal Produk} - \text{Diskon Kupon} + \text{Biaya Admin Kanal}$$
   * Sistem memicu API Midtrans Snap untuk memunculkan modal pembayaran berlisensi (VA, QRIS GoPay, dll).
4. **Penyelesaian Transaksi & Ulasan**:
   * Setelah konsumen memindai QRIS/membayar VA, Midtrans mengirimkan notifikasi callback secara aman ke endpoint aplikasi.
   * Status pesanan otomatis berubah menjadi `paid` dan sisa stok produk dikurangi dengan mencatatkan histori pergerakan `purchase` di `stock_movements`.
   * Poin belanja member langsung ditambahkan secara otomatis.
   * Konsumen diarahkan ke halaman invoice digital premium yang siap dicetak/disimpan ke PDF.
   * Konsumen kini diizinkan untuk memberikan rating bintang dan ulasan komentar pada menu produk terkait.

---

## 4. DFD (Data Flow Diagram) Level 0, Level 1 & Level 2

Diagram berikut memodelkan bagaimana data mengalir di dalam sistem Kala Karsa Bakery.

### DFD Level 0 (Context Diagram)

```mermaid
graph TD
    %% Entities
    Customer["Konsumen / Member"]
    Admin["Administrator (Staf Toko)"]
    Owner["Store Owner (Pemilik Toko)"]
    Midtrans["Midtrans Payment Gateway"]

    %% Process
    System["Sistem E-Commerce & POS Kala Karsa Bakery (Level 0)"]

    %% Customer Flows
    Customer -->|1. Registrasi & Login Kredensial| System
    Customer -->|2. Data Keranjang & Kupon Belanja| System
    Customer -->|3. Request Checkout & Pilihan Metode Bayar| System
    Customer -->|4. Input Rating & Komentar Ulasan| System
    System -->|A. Informasi Katalog & Kupon Aktif| Customer
    System -->|B. Token Midtrans Snap & Invoice Cetak| Customer
    System -->|C. Akumulasi Poin Reward Member| Customer

    %% Admin Flows
    Admin -->|1. Login Kredensial & Autentikasi| System
    Admin -->|2. Kelola CRUD Produk, Kategori, Kupon| System
    Admin -->|3. Entry Data Hitung Fisik Stock Opname| System
    System -->|A. Histori Pergerakan Stok & Selisih Opname| Admin

    %% Owner Flows
    Owner -->|1. Login Kredensial & Autentikasi| System
    Owner -->|2. Kelola Kolaborasi Tim & Hak Akses| System
    Owner -->|3. Toggle Status Aktif/Nonaktif Kanal Pembayaran| System
    Owner -->|4. Tinjau Katalog Produk & Laporan Penjualan| System
    System -->|A. Statistik Laporan Keuangan & Tren SVG| Owner
    System -->|B. Laporan Audit Aktivitas Kolaborasi Tim| Owner
    System -->|C. Informasi Katalog Produk & Data Stok| Owner

    %% Midtrans Flows
    System -->|1. Request Token Transaksi & Detail Nominal| Midtrans
    Midtrans -->|2. Callback Notifikasi IPN - Status Bayar| System
```

---

### DFD Level 1 (Decomposition Diagram)

```mermaid
graph TD
    %% Process Group
    subgraph Proses Sistem
        P1["1.0 Autentikasi & Akun"]
        P2["2.0 Katalog & Keranjang"]
        P3["3.0 Checkout & Pemrosesan Transaksi"]
        P4["4.0 Inventaris & Stock Opname"]
        P5["5.0 Poin Reward & Kupon"]
        P6["6.0 Ulasan & Feedback"]
    end

    %% Entities
    Cust["Konsumen"]
    Adm["Admin"]
    Own["Owner"]
    Gateway["Midtrans"]

    %% Data Stores
    DB_Users[("db_users")]
    DB_Products[("db_products / categories")]
    DB_Carts[("db_cart_items")]
    DB_Orders[("db_orders / order_items")]
    DB_Stocks[("db_stock_movements / opnames")]
    DB_Coupons[("db_coupons / user_coupons")]
    DB_Reviews[("db_reviews")]

    %% P1 Flows
    Cust -->|Kredensial Login| P1
    Adm -->|Kredensial Login| P1
    Own -->|Kredensial Login| P1
    Own -->|Undang Anggota & Ubah Role Tim| P1
    P1 -->|Validasi & Update Sesi/Tim| DB_Users

    %% P2 Flows
    Cust -->|Pilih Produk & Tambah Cart| P2
    P2 -->|Baca Katalog| DB_Products
    P2 -->|Simpan Persistent Cart| DB_Carts
    DB_Carts -->|Tampilkan Detail Cart| Cust
    Own -->|Tinjau Katalog & Stok Roti| P2
    P2 -->|Tampilkan Daftar Katalog| Own

    %% P3 Flows
    Cust -->|Kirim Request Checkout| P3
    P3 -->|Ambil Persentase Fee Admin| DB_Orders
    P3 -->|Kirim Detail Tagihan| Gateway
    Gateway -->|IPN Callback Settlement| P3
    P3 -->|Catat Transaksi Lunas| DB_Orders
    P3 -->|Kurangi Stok & Catat Log| DB_Stocks
    Own -->|Toggle Status Kanal Pembayaran| P3

    %% P4 Flows
    Adm -->|Entry Fisik Gudang| P4
    P4 -->|Simpan Berkas Opname & Reconcile| DB_Stocks
    P4 -->|Update Stok Final Roti| DB_Products

    %% P5 Flows
    Cust -->|Redeem Poin Belanja| P5
    P5 -->|Kurangi Poin Member| DB_Users
    P5 -->|Klaim Voucher Diskon| DB_Coupons

    %% P6 Flows
    Cust -->|Kirim Rating & Ulasan| P6
    P6 -->|Simpan Review Lunas| DB_Reviews
    Adm -->|Kirim Balasan Merchant| P6
    Own -->|Tinjau Komentar Ulasan| P6
```

---

### DFD Level 2 (Detailed Decomposition Diagram)

Untuk memperjelas operasi spesifik dengan granularitas tinggi, sub-bab ini memecah dua proses paling kritis di DFD Level 1 menjadi sub-proses detail:

#### DFD Level 2: Proses 1.0 (Autentikasi, Akun & Kolaborasi Tim)

Diagram ini menguraikan bagaimana kredensial diverifikasi, pendaftaran konsumen berjalan otomatis dengan role `'customer'`, serta bagaimana Owner mengundang Administrator secara terenkripsi ke dalam tim.

```mermaid
graph TD
    %% Entities
    Cust["Konsumen"]
    Adm["Admin"]
    Own["Owner"]

    %% Sub-Processes
    P1_1["1.1 Verifikasi Login Fortify"]
    P1_2["1.2 Registrasi Member Baru"]
    P1_3["1.3 Undang Admin (Owner-Only)"]
    P1_4["1.4 Terima Undangan Tim"]

    %% Data Stores
    DB_Users[("db_users")]
    DB_Invites[("db_team_invitations")]

    %% P1.1 Flows (Login)
    Cust -->|1. Input Username & Password| P1_1
    Adm -->|1. Input Username & Password| P1_1
    Own -->|1. Input Username & Password| P1_1
    P1_1 -->|2. Cocokkan Kredensial| DB_Users
    DB_Users -->|3. Kirim Status Validasi & Peran| P1_1

    %% P1.2 Flows (Register)
    Cust -->|1. Form Register & Nomor HP| P1_2
    P1_2 -->|2. Buat User Baru - Role customer| DB_Users

    %% P1.3 Flows (Invite)
    Own -->|1. Email Calon Admin & Role| P1_3
    P1_3 -->|2. Simpan Token Undangan| DB_Invites
    P1_3 -->|3. Kirim Notifikasi Email Undangan| Cust_Mail["Inbox Calon Admin"]

    %% P1.4 Flows (Accept)
    Cust_Mail -->|4. Klik Link Undangan & Buat Akun| P1_4
    P1_4 -->|5. Validasi Token & Ubah Status| DB_Invites
    P1_4 -->|6. Tautkan Akun & Set Role 'admin'| DB_Users
```

---

#### DFD Level 2: Proses 3.0 (Checkout & Pemrosesan Transaksi)

Diagram ini memecah bagaimana nominal tagihan akhir dihitung secara dinamis, stok roti divalidasi ketat di database, token Midtrans Snap dipicu, dan status bayar diselesaikan secara aman via callback IPN.

```mermaid
graph TD
    %% Entities
    Cust["Konsumen"]
    Own["Owner"]
    Gateway["Midtrans Gateway"]

    %% Sub-Processes
    P3_1["3.1 Kalkulasi Biaya & Diskon"]
    P3_2["3.2 Validasi Sisa Stok Roti"]
    P3_3["3.3 Pembuatan Tagihan Midtrans"]
    P3_4["3.4 Callback IPN Settlement"]

    %% Data Stores
    DB_Products[("db_products")]
    DB_Payment[("db_payment_channels")]
    DB_Coupons[("db_coupons")]
    DB_Orders[("db_orders")]
    DB_Stocks[("db_stock_movements")]
    DB_Users[("db_users")]

    %% P3.1 Flows (Kalkulasi)
    Cust -->|1. Request Checkout & Kode Kupon| P3_1
    P3_1 -->|2. Ambil Persentase/Flat Fee Admin| DB_Payment
    P3_1 -->|3. Cek Masa Berlaku Kupon| DB_Coupons
    P3_1 -->|4. Kirim Rincian Tagihan Akhir| P3_2

    %% P3.2 Flows (Stok)
    P3_2 -->|5. Cek Stok Produk Terkini| DB_Products
    DB_Products -->|6. Status Ketersediaan Stok| P3_2
    P3_2 -->|7. Buat Rekaman Order - Status pending| DB_Orders

    %% P3.3 Flows (Midtrans Snap)
    P3_2 -->|8. Picu Token Pembayaran| P3_3
    P3_3 -->|9. Kirim Detail Nominal Bayar| Gateway
    Gateway -->|10. Balasan Token & URL SNAP| P3_3
    P3_3 -->|11. Tampilkan Gerbang Bayar Snap Modal| Cust

    %% P3.4 Flows (IPN Callback)
    Gateway -->|12. Notifikasi Callback Settlement| P3_4
    P3_4 -->|13. Update Status Order - Status paid| DB_Orders
    P3_4 -->|14. Kurangi Stok Produk - Tipe purchase| DB_Stocks
    P3_4 -->|15. Tambah Poin Belanja Akumulasi| DB_Users
    Own -->|Aksi Manual: Toggle Status Kanal Bayar| DB_Payment
```

---

#### DFD Level 2: Proses 4.0 (Inventaris & Stock Opname)

Diagram ini menguraikan bagaimana Administrator memulai draft, menghitung discrepancy selisih aktual gudang, dan melakukan pengujian validasi ganda untuk menolak data jika berkas audit sudah berstatus terkunci (`completed`) atau terdapat input aktual bernilai negatif.

```mermaid
graph TD
    %% Entities
    Adm["Administrator"]

    %% Sub-Processes
    P4_1["4.1 Inisiasi Berkas Draft"]
    P4_2["4.2 Hitung Selisih & Draft Simpan"]
    P4_3["4.3 Validasi Nilai & Pengecekan Kunci"]
    P4_4["4.4 Eksekusi Rekonsiliasi Stok"]

    %% Data Stores
    DB_Products[("db_products")]
    DB_Stocks[("db_stock_opnames")]
    DB_StockItems[("db_stock_opname_items")]
    DB_StockMovements[("db_stock_movements")]

    %% P4.1 Flows (Draft Creation)
    Adm -->|1. Email Pembuat & Catatan Notes| P4_1
    P4_1 -->|2. Buat Draft Rekaman Baru| DB_Stocks

    %% P4.2 Flows (Count & Discrepancy)
    Adm -->|3. Entry Varian Roti & Jumlah Hitung Aktual| P4_2
    P4_2 -->|4. Hitung Discrepancy Selisih Aktual| P4_2
    P4_2 -->|5. Simpan Rincian Hasil Hitung Fisik| DB_StockItems

    %% P4.3 Flows (Validation & Exception)
    Adm -->|6. Request Selesaikan Audit Opname| P4_3
    P4_3 -->|7. Validasi Status Draft Terkini| DB_Stocks
    DB_Stocks -->|8. Status Berkas Valid Draft| P4_3
    P4_3 -->|9. Eror Berkas Terkunci / Input Negatif| Adm

    %% P4.4 Flows (Reconciliation Execution)
    P4_3 -->|10. Picu Eksekusi Koreksi Stok Final| P4_4
    P4_4 -->|11. Reconcile Stok Menjadi Fisik Aktual| DB_Products
    P4_4 -->|12. Catat Log Transaksi Opname Adjustment| DB_StockMovements
    P4_4 -->|13. Kunci Berkas Status Menjadi Completed| DB_Stocks
```

---

## 5. Sequence Diagram

Sequence Diagram menggambarkan interaksi objek berdasarkan urutan waktu operasional sistem.

### 5.1. Sequence Diagram Login (Fortify Secure Auth)

```mermaid
sequenceDiagram
    autonumber
    actor User as Pengguna (Admin/Customer)
    participant welcome as Halaman Login/Welcome (React UI)
    participant Route as Laravel Router & Fortify
    participant DB as Database (MySQL)

    User->>welcome: Input Email & Password, Klik Login
    activate welcome
    welcome->>Route: POST /login (Request Payload)
    activate Route
    Route->>DB: Query User Berdasarkan Email
    activate DB
    DB-->>Route: Kembalikan Data User & Hash Password
    deactivate DB
    Route->>Route: Verifikasi Kredensial & Validasi Password
    alt Kredensial Tidak Valid
        Route-->>welcome: Response Eror (Kredensial Salah / 422)
        welcome-->>User: Tampilkan Pesan Kesalahan Merah
    else Kredensial Valid & Berhasil
        Route->>DB: Update Session Token & Remember Me
        Route-->>welcome: Redirect Ke Dashboard / Home
        deactivate Route
        welcome-->>User: Arahkan Halaman Sesuai Role
    end
    deactivate welcome
```

---

### 5.2. Sequence Diagram Pemesanan & Checkout (Midtrans Integrated)

```mermaid
sequenceDiagram
    autonumber
    actor Cust as Konsumen (Customer)
    participant UI as Halaman Checkout (React)
    participant Ctrl as OrderController (Backend)
    participant Mid as Midtrans Snap Engine
    participant DB as Database (MySQL)

    Cust->>UI: Pilih Metode Bayar & Klik Buat Pesanan
    activate UI
    UI->>Ctrl: POST /orders/checkout (Cart, Coupon, Channel Code)
    activate Ctrl
    Ctrl->>DB: Lock & Validasi Stok Produk Gudang
    activate DB
    DB-->>Ctrl: Stok Terpenuhi / Cukup
    deactivate DB
    Ctrl->>DB: Ambil Info Diskon Kupon & Flat/Percent Fee Admin
    Ctrl->>Ctrl: Hitung Nominal Total Akhir Belanja
    Ctrl->>DB: Insert Order (Pending) & OrderItem (Snapshot)
    Ctrl->>Mid: Kirim Permintaan Snap Token (Detail Transaksi)
    activate Mid
    Mid-->>Ctrl: Kembalikan Token Transaksi & Redirect URL
    deactivate Mid
    Ctrl-->>UI: Response Token Snap & Redirect URL
    deactivate Ctrl
    UI->>UI: Tampilkan Modal Pembayaran Midtrans Snap
    UI-->>Cust: Tampilkan QRIS / Rekening VA untuk Dipindai/Dibayar
    deactivate UI
```

---

### 5.3. Sequence Diagram Rekonsiliasi Stok Opname (Admin-Only)

```mermaid
sequenceDiagram
    autonumber
    actor Adm as Administrator
    participant UI as Dashboard Stock Opname (React)
    participant Ctrl as StockController (Backend)
    participant DB as Database (MySQL)

    Adm->>UI: Input Jumlah Hitung Fisik Roti Aktual
    activate UI
    UI->>Ctrl: POST /stock/opnames (Notes, Items: Product ID & Actual Count)
    activate Ctrl
    Ctrl->>DB: Hitung Selisih (Discrepancy = Actual - System Stock)
    Ctrl->>DB: Simpan Berkas Draft Stock Opname & Items
    Ctrl-->>UI: Response Draft Berhasil Disimpan
    deactivate Ctrl
    UI-->>Adm: Tampilkan Berkas Draft Berstatus "Draft"
    
    Adm->>UI: Klik Tombol "Complete Opname"
    UI->>Ctrl: POST /stock/opnames/{id}/complete
    activate Ctrl
    Ctrl->>DB: Cek Status Berkas Terkini & Validitas Input Aktual
    activate DB
    DB-->>Ctrl: Status Berkas (completed/draft) & Nilai Aktual
    deactivate DB
    alt Berkas Sudah Selesai (Status: 'completed') ATAU Ada Jumlah Aktual < 0
        Ctrl-->>UI: Response Eror (422: Berkas Terkunci / Validasi Eror)
        UI-->>Adm: Tampilkan Notifikasi Eror Peringatan Merah
    else Berkas Valid Draft & Jumlah Aktual >= 0
        Ctrl->>DB: Update Kolom Stock di Tabel Products Sesuai Jumlah Fisik Aktual
        Ctrl->>DB: Catat Log Penyesuaian ke Stock Movements (opname_adjustment)
        Ctrl->>DB: Ubah Status Berkas Menjadi "Completed"
        Ctrl-->>UI: Rekonsiliasi Berhasil (Status Terkunci)
        deactivate Ctrl
        UI-->>Adm: Tampilkan Status Berkas "Completed" & Update Stok Roti Rak Display
    end
    deactivate UI
```

---

### 5.4. Sequence Diagram Penukaran Poin & Kupon Diskon

```mermaid
sequenceDiagram
    autonumber
    actor Mem as Anggota (Member)
    participant UI as Dashboard Reward (React)
    participant Ctrl as CouponController (Backend)
    participant DB as Database (MySQL)

    Mem->>UI: Klik Tombol "Tukarkan" Pada Kupon Pilihan
    activate UI
    UI->>Ctrl: POST /coupons/{id}/redeem
    activate Ctrl
    Ctrl->>DB: Cek Poin Akumulasi Member & Persyaratan Kupon
    activate DB
    DB-->>Ctrl: Data Poin & Kupon Valid
    deactivate DB
    alt Poin Tidak Mencukupi
        Ctrl-->>UI: Response Eror (Poin Belanja Kurang)
        UI-->>Mem: Tampilkan Notifikasi Merah Peringatan
    else Poin Cukup
        Ctrl->>DB: Potong Kolom member_points di Tabel Users
        Ctrl->>DB: Insert ke user_coupons (Status: 'active')
        Ctrl-->>UI: Klaim Kupon Sukses
        deactivate Ctrl
        UI-->>Mem: Voucher Ditambahkan ke Dompet Belanja Konsumen
    end
    deactivate UI
```

---

### 5.5. Sequence Diagram Kolaborasi Tim & Manajemen Kanal Pembayaran (Owner-Only)

```mermaid
sequenceDiagram
    autonumber
    actor Own as Pemilik (Owner)
    participant UI as Dashboard Owner Settings (React)
    participant Ctrl as Team/Payment Controllers (Backend)
    participant DB as Database (MySQL)

    %% Flow 1: Toggle Payment Channel
    Own->>UI: Klik Tab "Metode Pembayaran" & Klik Toggle Aktif/Nonaktif
    activate UI
    UI->>Ctrl: PATCH /admin/payment-channels/{id}/toggle
    activate Ctrl
    Ctrl->>DB: Update Kolom is_active (0 / 1) di Tabel payment_channels
    Ctrl-->>UI: Response Sukses (Status Saluran Pembayaran Berubah)
    deactivate Ctrl
    UI-->>Own: Tampilkan Notifikasi Perubahan Status Saluran Pembayaran

    %% Flow 2: Invite Admin Member
    Own->>UI: Buka Menu "Kolaborasi Tim" & Input Email Calon Admin
    UI->>Ctrl: POST /teams/invitations (Email & Role)
    activate Ctrl
    Ctrl->>DB: Cek Keberadaan User & Insert ke team_invitations
    Ctrl->>Ctrl: Kirim Email Notifikasi Undangan (TeamInvitation Notification)
    Ctrl-->>UI: Undangan Berhasil Terbuat
    deactivate Ctrl
    UI-->>Own: Tampilkan Status Undangan "Pending" di Tabel Tim
    deactivate UI
```

---

## 6. Activity Diagram & Flowchart

Bagian ini memodelkan logika alur proses bisnis utama sistem secara berurutan.

### 6.1. Activity Diagram: Proses Pemesanan & Checkout Produk

```mermaid
stateDiagram-v2
    [*] --> Mulai_Pemesanan
    Mulai_Pemesanan --> Pilih_Produk : Pelanggan menelusuri katalog
    Pilih_Produk --> Tambah_Keranjang : Klik "Tambah ke Keranjang"
    Tambah_Keranjang --> Isi_Form_Checkout : Buka halaman Checkout
    Isi_Form_Checkout --> Terapkan_Kupon_Diskon : Opsional memilih kupon
    Terapkan_Kupon_Diskon --> Pilih_Kanal_Bayar : Pilih BCA/BRI/GoPay/QRIS
    Pilih_Kanal_Bayar --> Kirim_Order_Request : Klik "Buat Pesanan"
    
    state "Validasi Stok Oleh Sistem" as validasi
    Kirim_Order_Request --> validasi
    
    validasi --> Batal_Pemesanan : Stok Roti Habis / Tidak Cukup
    Batal_Pemesanan --> [*] : Tampilkan Eror Kehabisan Stok
    
    validasi --> Hitung_Biaya_Admin : Stok Roti Aman & Terkunci
    Hitung_Biaya_Admin --> Minta_Token_Midtrans : Sistem memicu API Midtrans
    Minta_Token_Midtrans --> Tampilkan_Modal_Bayar : Modal Snap muncul di layar
    Tampilkan_Modal_Bayar --> Proses_Pembayaran_Konsumen : Konsumen scan/transfer
    
    state "Webhook Notifikasi Midtrans" as callback
    Proses_Pembayaran_Konsumen --> callback
    
    callback --> Pembayaran_Gagal : Pembayaran Ditolak / Kedaluwarsa
    Pembayaran_Gagal --> Batalkan_Order_Sistem : Ubah status order menjadi cancelled
    Batalkan_Order_Sistem --> [*]
    
    callback --> Pembayaran_Sukses : Pembayaran Sukses (Settlement)
    Pembayaran_Sukses --> Kurangi_Stok_Produk : Potong kolom stock di DB
    Kurangi_Stok_Produk --> Catat_Stock_Movement : Tipe "purchase" ditambahkan
    Catat_Stock_Movement --> Tambah_Poin_Reward : Akumulasi poin member ditambahkan
    Tambah_Poin_Reward --> Selesai_Pemesanan : Arahkan ke Invoice Printable
    Selesai_Pemesanan --> [*]
```

---

### 6.2. Activity Diagram: Proses Rekonsiliasi Stok Opname (Admin-Only)

```mermaid
stateDiagram-v2
    [*] --> Mulai_Opname
    Mulai_Opname --> Buat_Dokumen_Draft : Klik "Mulai Opname Baru"
    Buat_Dokumen_Draft --> Hitung_Stok_Fisik : Hitung riil roti di rak/dapur
    Hitung_Stok_Fisik --> Input_Jumlah_Aktual : Entry data aktual ke sistem
    Input_Jumlah_Aktual --> Simpan_Sebagai_Draft : Klik "Simpan Draft"
    
    state "Sistem Menghitung Selisih (Discrepancy)" as hitung_selisih
    Simpan_Sebagai_Draft --> hitung_selisih
    hitung_selisih --> Tinjau_Daftar_Draft : Tampilkan selisih (+/-) di monitor
    
    Tinjau_Daftar_Draft --> Hapus_Draft : Batalkan pemeriksaan stok
    Hapus_Draft --> [*] : Dokumen dihapus
    
    Tinjau_Daftar_Draft --> Cek_Status_Awal : Klik "Complete Opname"
    
    state "Pengecekan Keabsahan Berkas" as check_validity {
        [*] --> Cek_Status : Apakah status berkas 'completed'?
        Cek_Status --> Tampilkan_Eror_Terkunci : Ya (Sudah Selesai)
        Cek_Status --> Verifikasi_Jumlah : Tidak (Draft Valid)
        Verifikasi_Jumlah --> Tampilkan_Eror_Negatif : Ada Jumlah Hitung Aktual < 0?
        Verifikasi_Jumlah --> Rekonsiliasi_Database : Semua Jumlah Aktual >= 0
    }
    
    Cek_Status_Awal --> check_validity
    Tampilkan_Eror_Terkunci --> [*] : Batalkan Eksekusi (Eror 422 Berkas Terkunci)
    Tampilkan_Eror_Negatif --> [*] : Batalkan Eksekusi (Eror 422 Nilai Negatif)
    
    state "Proses Rekonsiliasi Database" as reconcile {
        [*] --> Update_Stok_Produk : Sinkronkan kolom stock produk ke aktual
        Update_Stok_Produk --> Catat_Log_Movement : Tipe "opname_adjustment" dicatat
        Catat_Log_Movement --> Lock_Status_Completed : Kunci berkas status "completed"
    }
    
    Rekonsiliasi_Database --> reconcile
    reconcile --> Selesai_Opname : Stok riil display terverifikasi & terkunci
    Selesai_Opname --> [*]
```

---

### 6.3. Activity Diagram: Kolaborasi Tim & Manajemen Pembayaran (Owner-Only)

```mermaid
stateDiagram-v2
    [*] --> Akses_Dashboard : Owner Berhasil Login & Otentik
    
    state "Manajemen Kolaborasi Tim" as tim_mgmt {
        [*] --> Input_Email_Admin : Input email calon administrator baru
        Input_Email_Admin --> Buat_Undangan : Klik "Send Invitation"
        Buat_Undangan --> Simpan_Database : Catat token ke table 'team_invitations'
        Simpan_Database --> Kirim_Email : Kirim notifikasi email invitation link
        Kirim_Email --> Menunggu_Penerimaan : Status undangan "Pending"
        Menunggu_Penerimaan --> Penerima_Menerima : Calon admin mengklik link & register/login
        Penerima_Menerima --> Assign_Role_Tim : Tambahkan ke team & sematkan role 'admin'
        Assign_Role_Tim --> Selesai_Tim : Admin baru resmi tergabung aktif
    }
    
    state "Manajemen Kanal Pembayaran" as payment_mgmt {
        [*] --> Pilih_Kanal_Bayar : Tinjau daftar channel Midtrans
        Pilih_Kanal_Bayar --> Klik_Toggle : Klik toggle aktif/nonaktif
        Klik_Toggle --> Cek_Status_Awal : Apakah kanal berstatus aktif?
        Cek_Status_Awal --> Nonaktifkan_Kanal : Ya -> Set is_active = 0 di database
        Cek_Status_Awal --> Aktifkan_Kanal : Tidak -> Set is_active = 1 di database
        Nonaktifkan_Kanal --> Selesai_Payment : Kanal diblokir dari antarmuka checkout
        Aktifkan_Kanal --> Selesai_Payment : Kanal tersedia instan di modal Snap
    }
    
    Akses_Dashboard --> tim_mgmt : Pilih menu Kolaborasi Tim
    Akses_Dashboard --> payment_mgmt : Pilih menu Metode Pembayaran
    
    Selesai_Tim --> [*]
    Selesai_Payment --> [*]
```

---

### 6.4. Flowchart Utama Aplikasi (End-to-End E-Commerce & Admin Portal)

```mermaid
flowchart TD
    Start([Mulai]) --> Tampilkan_Home{Pengguna Login?}
    
    %% Guest Route
    Tampilkan_Home -->|Tidak| Tamu_View[Buka Landing Page welcome]
    Tamu_View --> Tamu_Browse[Lihat Detail Katalog Roti]
    Tamu_Browse --> Tamu_AddCart[Klik Beli / Tambah Cart]
    Tamu_AddCart --> Tamu_AuthRedirect[Diarahkan ke Portal Login/Register]
    Tamu_AuthRedirect --> Auth_Process[Proses Autentikasi Fortify]
    
    %% Logged In Route
    Tampilkan_Home -->|Ya| Cek_Role{Peran Pengguna?}
    Auth_Process --> Cek_Role
    
    %% Customer Flow
    Cek_Role -->|Customer| Cust_Home[Buka Landing Page Terautentikasi]
    Cust_Home --> Cust_Cart[Kelola Database Persistent Cart]
    Cust_Cart --> Cust_Redeem{Tukarkan Poin Belanja?}
    Cust_Redeem -->|Ya| Cust_Claim[Potong Poin & Dapatkan Kupon]
    Cust_Redeem -->|Tidak| Cust_Checkout[Buka Halaman Checkout]
    Cust_Claim --> Cust_Checkout
    Cust_Checkout --> Cust_Pay[Pilih Metode Bayar & Terapkan Kupon]
    Cust_Pay --> Cust_Gateway[Picu Gerbang Midtrans Snap Modal]
    Cust_Gateway --> Cust_Status{Bayar Lunas?}
    Cust_Status -->|Tidak| Cust_Home
    Cust_Status -->|Ya| Cust_Receipt[Buka Invoice Premium Cetak A4]
    Cust_Receipt --> Cust_Review[Beri Bintang & Ulasan Roti]
    Cust_Review --> End_Flow([Selesai])
    
    %% Admin Flow
    Cek_Role -->|Admin| Adm_Dash[Buka Dasbor Admin]
    Adm_Dash --> Adm_Menu{Pilih Menu Admin?}
    Adm_Menu -->|Kelola CRUD| Adm_CRUD[Tambah/Edit/Hapus Produk, Kategori, Kupon]
    Adm_CRUD --> Adm_Dash
    Adm_Menu -->|Stock Opname| Adm_Opname[Entri Hitung Fisik Aktual Gudang]
    Adm_Opname --> Adm_Reconcile[Klik Complete Opname & Rekonsiliasi]
    Adm_Reconcile --> Adm_Dash
    Adm_Menu -->|Merchant Reply| Adm_Reply[Balas Ulasan Komentar Konsumen]
    Adm_Reply --> Adm_Dash
    Adm_Menu -->|Keluar| Adm_Logout[Sesi Logout Sistem]
    Adm_Logout --> End_Flow
    
    %% Owner Flow
    Cek_Role -->|Owner| Own_Dash[Buka Dasbor Owner]
    Own_Dash --> Own_Menu{Pilih Menu Owner?}
    Own_Menu -->|Tinjau Laporan SVG| Own_Report[Lihat Grafik Tren SVG & Omzet]
    Own_Report --> Own_Dash
    Own_Menu -->|Payment Gateway| Own_Payment[Toggle Aktif/Nonaktif Kanal Pembayaran]
    Own_Payment --> Own_Dash
    Own_Menu -->|Kolaborasi Tim| Own_Team[Undang Admin & Kelola Hak Akses]
    Own_Team --> Own_Dash
    Own_Menu -->|Keluar| Own_Logout[Sesi Logout Sistem]
    Own_Logout --> End_Flow
```

---

## 7. Database Diagram & Entity Relationship Diagram (ERD)

### 7.1. Entity Relationship Diagram (ERD)

Berikut adalah visualisasi hubungan relasional antarentitas (*Entity Relationship Diagram*) dari database aplikasi Kala Karsa Bakery:

<p align="center">
  <img src="public/erd.png" alt="Kala Karsa Bakery ERD Diagram" width="100%" style="border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
</p>

---

### 7.2. Database Markup Language (DBML)

Berikut adalah definisi struktur skema relasional tabel database menggunakan format **Database Markup Language (DBML)** yang diturunkan langsung dari file migrasi aplikasi:

```dbml
// ==========================================
// KALA KARSA BAKERY RELATIONAL DBML SCHEMA
// ==========================================

Table users {
  id bigint [pk, increment]
  name varchar
  email varchar [unique]
  email_verified_at timestamp [null]
  password varchar
  remember_token varchar [null]
  current_team_id bigint [null]
  profile_photo_path varchar [null]
  phone_number varchar [null]
  member_status varchar // non-member, active, suspended
  member_points integer [default: 0]
  created_at timestamp
  updated_at timestamp
}

Table categories {
  id bigint [pk, increment]
  name varchar
  slug varchar [unique]
  image varchar
  created_at timestamp
  updated_at timestamp
}

Table products {
  id bigint [pk, increment]
  category_id bigint [ref: > categories.id]
  name varchar
  sku varchar [unique]
  slug varchar [unique]
  price decimal
  stock integer
  cover varchar [null]
  metadata json [null]
  is_active boolean [default: true]
  created_at timestamp
  updated_at timestamp
}

Table orders {
  id bigint [pk, increment]
  user_id bigint [ref: > users.id]
  order_number varchar [unique]
  status varchar // pending, paid, cancelled
  payment_status varchar [null] // settlement, deny, expire
  payment_method varchar [null]
  payment_channel_code varchar [ref: > payment_channels.code]
  total_amount decimal
  discount_amount decimal
  admin_fee decimal
  points_used integer [default: 0]
  points_earned integer [default: 0]
  snap_token varchar [null]
  snap_url varchar [null]
  notes text [null]
  customer_snapshot json
  created_at timestamp
  updated_at timestamp
}

Table order_items {
  id bigint [pk, increment]
  order_id bigint [ref: > orders.id]
  product_id bigint [ref: > products.id]
  quantity integer
  price decimal
  product_snapshot json
  created_at timestamp
  updated_at timestamp
}

Table stock_opnames {
  id bigint [pk, increment]
  opname_number varchar [unique]
  notes text [null]
  status varchar // draft, completed
  created_by bigint [ref: > users.id]
  created_at timestamp
  updated_at timestamp
}

Table stock_opname_items {
  id bigint [pk, increment]
  stock_opname_id bigint [ref: > stock_opnames.id]
  product_id bigint [ref: > products.id]
  system_stock integer
  actual_stock integer
  discrepancy integer
  created_at timestamp
  updated_at timestamp
}

Table stock_movements {
  id bigint [pk, increment]
  product_id bigint [ref: > products.id]
  quantity integer
  type varchar // purchase, opname_adjustment, manual
  reference_id bigint [null] // Polymorphic ID (Order ID / StockOpname ID)
  created_at timestamp
  updated_at timestamp
}

Table coupons {
  id bigint [pk, increment]
  code varchar [unique]
  name varchar
  discount_type varchar // fixed, percentage
  discount_value decimal
  points_required integer
  min_purchase decimal
  is_active boolean [default: true]
  created_at timestamp
  updated_at timestamp
}

Table user_coupons {
  id bigint [pk, increment]
  user_id bigint [ref: > users.id]
  coupon_id bigint [ref: > coupons.id]
  redeemed_at timestamp
  used_at timestamp [null]
  status varchar // active, used, expired
  created_at timestamp
  updated_at timestamp
}

Table cart_items {
  id bigint [pk, increment]
  user_id bigint [ref: > users.id]
  product_id bigint [ref: > products.id]
  quantity integer
  created_at timestamp
  updated_at timestamp
}

Table payment_channels {
  id bigint [pk, increment]
  code varchar [pk, unique]
  name varchar
  type varchar // VIRTUAL_ACCOUNT, E_WALLET, QRIS, CARD, RETAIL_STORE
  fee_flat decimal
  fee_percent decimal
  is_active boolean [default: true]
  created_at timestamp
  updated_at timestamp
}
```

---

## 8. Laporan Pengujian (Testing)

Sistem Kala Karsa Bakery telah diuji secara menyeluruh menggunakan framework pengujian terintegrasi bawaan Laravel (**Pest PHP**) dengan memanfaatkan lingkungan database transaksi terisolasi MySQL (`mini_projek_testing`). 

Seluruh skenario pengujian utama menunjukkan hasil **LULUS (PASS)** dengan statistik sempurna sebagai berikut:
* **Total Tes Lulus**: `95 passed`
* **Total Asersi**: `323 assertions`
* **Durasi Pengujian**: `3.18s`

Berikut adalah rekapitulasi pengujian fitur-fitur pada aplikasi berdasarkan standar spesifikasi kebutuhan fungsional sistem (*Functional Requirements*):

### Matriks Kebutuhan Sistem (System Requirements Mapping)

| &nbsp;&nbsp;&nbsp;&nbsp;Req ID&nbsp;&nbsp;&nbsp;&nbsp; | Deskripsi Kebutuhan Sistem |
| :--- | :--- |
| <nobr>**FR-01**</nobr> | Sistem harus mengizinkan pengguna untuk mendaftar akun baru dan menyimpannya ke database dengan otomatis menyematkan role `'customer'`. |
| <nobr>**FR-02**</nobr> | Sistem harus mengizinkan pengguna login menggunakan email dan password terdaftar yang valid. |
| <nobr>**FR-03**</nobr> | Sistem harus menolak autentikasi login jika email atau password salah. |
| <nobr>**FR-04**</nobr> | Sistem harus mengarahkan pengguna yang berhasil login ke halaman dasbor utama yang sesuai dengan peran mereka. |
| <nobr>**FR-05**</nobr> | Admin dan Owner dapat mengelola data master katalog (Kategori, Produk, Kupon) termasuk menambah, mengubah, dan menghapus. |
| <nobr>**FR-06**</nobr> | Sistem harus memblokir akses pengguna biasa (Customer/Guest) dari fitur pengelolaan data master dan manajemen inventaris. |
| <nobr>**FR-07**</nobr> | Pelanggan dapat mendaftar menjadi member aktif menggunakan nomor telepon dan berhak mengumpulkan poin belanja dari transaksi kelipatan Rp10.000. |
| <nobr>**FR-08**</nobr> | Member dapat menukarkan akumulasi poin reward belanja mereka dengan kupon potongan harga secara dinamis. |
| <nobr>**FR-09**</nobr> | Sistem harus memfasilitasi keranjang persistent di database (`cart_items`) dan membatasi kuantiti agar tidak melebihi persediaan stok produk. |
| <nobr>**FR-10**</nobr> | Sistem harus melakukan kalkulasi order secara akurat (Subtotal - Diskon Kupon + Biaya Admin Kanal) serta memicu API modal pembayaran Midtrans Snap. |
| <nobr>**FR-11**</nobr> | Sistem harus menerima callback notifikasi settlement pembayaran dari Midtrans untuk otomatis mengubah status pesanan menjadi lunas (`paid`), memotong sisa stok produk, mencatat pergerakan stok (`purchase`), dan memberikan poin reward. |
| <nobr>**FR-12**</nobr> | Admin dapat memproses pencocokan inventaris fisik (**Stock Opname**), otomatis memperbarui stok produk ke database, mencatat penyesuaian stok (`opname_adjustment`), dan mengunci berkas. |
| <nobr>**FR-13**</nobr> | Admin dapat merespon rating ulasan pembeli, serta mengaktifkan/menonaktifkan metode pembayaran aktif toko. |

---

### Matriks Skenario Pengujian (Test Scenarios & Pest Execution)

| &nbsp;&nbsp;&nbsp;&nbsp;ID Skenario&nbsp;&nbsp;&nbsp;&nbsp; | Kategori Fitur | Deskripsi Uji Fitur (Pest Test Suite) | Status |
| :--- | :--- | :--- | :---: |
| <nobr>**TS-AUTH-01**</nobr> | Pendaftaran Akun | Pendaftaran akun baru via `/register` dengan data valid & otomatis assign role `'customer'` | `✅ PASS` |
| <nobr>**TS-AUTH-02**</nobr> | Autentikasi | Login sukses via portal welcome, pengujian enkripsi password, dan pembatasan rate-limiting | `✅ PASS` |
| <nobr>**TS-AUTH-03**</nobr> | Proteksi Auth | Penolakan autentikasi jika email/password salah atau format tidak memenuhi syarat | `✅ PASS` |
| <nobr>**TS-CART-01**</nobr> | Keranjang Belanja | Tamu diblokir dari keranjang belanja persistent sebelum login dilakukan | `✅ PASS` |
| <nobr>**TS-CART-02**</nobr> | Operasional Cart | Penambahan item persistent, kalkulasi kuantiti, pembatasan kuantiti terhadap sisa stok | `✅ PASS` |
| <nobr>**TS-MEM-01**</nobr> | Membership | Pelanggan mendaftar member aktif toko dengan nomor telepon dan mengubah status menjadi `'active'` | `✅ PASS` |
| <nobr>**TS-REWARD-01**</nobr>| Reward Poin | Member mengklaim kupon belanja sukses dengan memotong poin belanja secara akurat di DB | `✅ PASS` |
| <nobr>**TS-CHECK-01**</nobr> | Pemesanan | Checkout keranjang belanja, integrasi API Midtrans Snap, kalkulasi diskon kupon & admin fee | `✅ PASS` |
| <nobr>**TS-IPN-01**</nobr> | Webhook Gateway | Callback notifikasi settlement Midtrans: update status `paid`, potong sisa stok, catat movement | `✅ PASS` |
| <nobr>**TS-OPNAME-01**</nobr>| Stock Opname | Admin membuat dokumen draft opname fisik, mencocokkan stok aktual, dan memproses rekonsiliasi | `✅ PASS` |
| <nobr>**TS-REVIEW-01**</nobr>| Feedback Ulasan| Konsumen mengirim ulasan rating bintang pada produk berstatus paid, admin membalas ulasan | `✅ PASS` |
| <nobr>**TS-ROLES-01**</nobr> | Hak Akses | Pelanggan biasa diblokir mutlak dari mengakses CRUD Katalog & Stock Gudang (Status 403) | `✅ PASS` |
| <nobr>**TS-TEAMS-01**</nobr> | Kolaborasi | Pembuatan tim toko, manajemen undangan anggota (`invitations`), pengubahan role tim oleh owner | `✅ PASS` |
| <nobr>**TS-SETTINGS-01**</nobr>| Profil & Kemanan| Pembaruan data profil, validasi hapus akun, verifikasi email, serta 2FA (Two Factor Auth) | `✅ PASS` |

---

### Rekapitulasi Eksekusi Uji Konsol (Console Test Logs)

Berikut adalah tangkapan log konsol eksekusi Pest PHP yang mengesahkan kestabilan dan validitas 100% fungsionalitas sistem Kala Karsa Bakery:

```bash
akuma@Hnzsama:~/projects/kala-karsa$ php artisan test

   PASS  Tests\Unit\ExampleTest
  ✓ that true is true                                                                             0.01s  

   PASS  Tests\Feature\Auth\AuthenticationTest
  ✓ login screen can be rendered                                                                  0.23s  
  ✓ users can authenticate using the login screen                                                 0.04s  
  ✓ users with two factor enabled are redirected to two factor challenge                          0.02s  
  ✓ users can not authenticate with invalid password                                              0.02s  
  ✓ users can logout                                                                              0.02s  
  ✓ users are rate limited                                                                        0.01s  

   PASS  Tests\Feature\Auth\EmailVerificationTest
  ✓ email verification screen can be rendered                                                     0.03s  
  ✓ email can be verified                                                                         0.02s  
  ✓ email is not verified with invalid hash                                                       0.02s  
  ✓ email is not verified with invalid user id                                                    0.02s  
  ✓ verified user is redirected to dashboard from verification prompt                             0.02s  
  ✓ already verified user visiting verification link is redirected without firing event again     0.02s  

   PASS  Tests\Feature\Auth\PasswordConfirmationTest
  ✓ confirm password screen can be rendered                                                       0.03s  
  ✓ password confirmation requires authentication                                                 0.01s  

   PASS  Tests\Feature\Auth\PasswordResetTest
  ✓ reset password link screen can be rendered                                                    0.01s  
  ✓ reset password link can be requested                                                          0.22s  
  ✓ reset password screen can be rendered                                                         0.22s  
  ✓ password can be reset with valid token                                                        0.22s  
  ✓ password cannot be reset with invalid token                                                   0.23s  

   PASS  Tests\Feature\Auth\RegistrationTest
  ✓ registration screen can be rendered                                                           0.02s  
  ✓ new users can register                                                                        0.03s  

   PASS  Tests\Feature\Auth\TwoFactorChallengeTest
  ✓ two factor challenge redirects to login when not authenticated                                0.01s  
  ✓ two factor challenge can be rendered                                                          0.02s  

   PASS  Tests\Feature\Auth\VerificationNotificationTest
  ✓ sends verification notification                                                               0.02s  
  ✓ does not send verification notification if email is verified                                  0.02s  

   PASS  Tests\Feature\CartTest
  ✓ it prevents guests from adding items to cart                                                  0.01s  
  ✓ it allows authenticated users to add items to persistent database cart                        0.02s  
  ✓ it increments quantity when adding same product multiple times                                0.02s  
  ✓ it caps quantity to available stock when adding or updating                                   0.02s  
  ✓ it allows authenticated users to update cart item quantity                                    0.02s  
  ✓ it allows authenticated users to remove items from cart                                       0.02s  
  ✓ it passes persistent cart items to the welcome view                                           0.02s  

   PASS  Tests\Feature\DashboardTest
  ✓ guests are redirected to the login page                                                       0.02s  
  ✓ authenticated users can visit the dashboard                                                   0.02s  

   PASS  Tests\Feature\ECommerceSuiteTest
  ✓ customer is forbidden from managing catalog products                                          0.04s  
  ✓ owner can read but is forbidden from modifying products                                       0.05s  
  ✓ admin can manage catalog products                                                             0.03s  
  ✓ product cover accessor handles file upload paths and default fallbacks                        0.03s  
  ✓ customer can register as a store member and earns active status                               0.05s  
  ✓ member can exchange accumulated rewards points for discount coupons                           0.03s  
  ✓ checkout creates order with historical snapshots and calls midtrans snap                      0.05s  
  ✓ checkout succeeds when customer phone number is null or empty                                 0.04s  
  ✓ midtrans callback with correct signature completes order and awards points                    0.04s  
  ✓ admin can complete stock opname reconciling physical counts                                   0.07s  
  ✓ admin and owner can view reviews list and write administrative merchant replies               0.07s  
  ✓ customer can submit review for purchased items but is restricted from reviews management      0.04s  

   PASS  Tests\Feature\ExampleTest
  ✓ returns a successful response                                                                 0.02s  

   PASS  Tests\Feature\Settings\ProfileUpdateTest
  ✓ profile page is displayed                                                                     0.02s  
  ✓ profile information can be updated                                                            0.02s  
  ✓ email verification status is unchanged when the email address is unchanged                    0.02s  
  ✓ user can delete their account                                                                 0.01s  
  ✓ correct password must be provided to delete account                                           0.01s  

   PASS  Tests\Feature\Settings\SecurityTest
  ✓ security page is displayed                                                                    0.02s  
  ✓ security page requires password confirmation when enabled                                     0.01s  
  ✓ security page does not require password confirmation when disabled                            0.02s  
  ✓ security page renders without two factor when feature is disabled                             0.02s  
  ✓ password can be updated                                                                       0.02s  
  ✓ correct password must be provided to update password                                           0.02s  

   PASS  Tests\Feature\Teams\TeamInvitationTest
  ✓ team invitations can be created                                                               0.03s  
  ✓ team invitations can be created by admins                                                     0.02s  
  ✓ existing team members cannot be invited                                                       0.02s  
  ✓ duplicate invitations cannot be created                                                       0.01s  
  ✓ team invitations cannot be created by members                                                 0.02s  
  ✓ team invitations can be cancelled by owners                                                   0.01s  
  ✓ team invitations can be accepted                                                              0.02s  
  ✓ team invitations cannot be accepted by uninvited user                                         0.02s  
  ✓ expired invitations cannot be accepted                                                        0.02s  

   PASS  Tests\Feature\Teams\TeamMemberTest
  ✓ team member roles can be updated by owners                                                    0.02s  
  ✓ team member roles cannot be updated by non owners                                             0.02s  
  ✓ team members can be removed by owners                                                         0.03s  
  ✓ team members cannot be removed by non owners                                                  0.02s  
  ✓ team owner cannot be removed                                                                  0.02s  
  ✓ team member role cannot be set to owner                                                       0.02s  
  ✓ removed member current team is set to personal team                                           0.02s  

   PASS  Tests\Feature\Teams\TeamTest
  ✓ the teams index page can be rendered                                                          0.02s  
  ✓ teams can be created                                                                          0.02s  
  ✓ team slug uses next available suffix                                                          0.02s  
  ✓ the team edit page can be rendered                                                            0.02s  
  ✓ teams can be updated by owners                                                                0.02s  
  ✓ teams cannot be updated by members                                                            0.02s  
  ✓ teams can be deleted by owners                                                                0.01s  
  ✓ team deletion requires name confirmation                                                      0.02s  
  ✓ deleting current team switches to alphabetically first remaining team                         0.02s  
  ✓ deleting current team falls back to personal team when alphabetically first                   0.02s  
  ✓ deleting non current team leaves current team unchanged                                       0.02s  
  ✓ deleting team switches other affected users to their personal team                            0.02s  
  ✓ personal teams cannot be deleted                                                              0.01s  
  ✓ teams cannot be deleted by non owners                                                         0.02s  
  ✓ users can switch teams                                                                        0.02s  
  ✓ users cannot switch to team they dont belong to                                               0.01s  
  ✓ guests cannot access teams                                                                    0.01s  

   PASS  Tests\Feature\WelcomePageTest
  ✓ it renders the welcome page for guests with seeded products and categories                    0.02s  
  ✓ it renders the welcome page for logged in customers and shows their coupons                   0.03s  
  ✓ it redirects guests to login during checkout                                                  0.01s  

  Tests:    95 passed (323 assertions)
  Duration: 3.18s
```

Laporan di atas mengonfirmasi bahwa seluruh pilar modularitas, keamanan data, integrasi gateway pembayaran pihak ketiga, serta log penyesuaian audit stok gudang Kala Karsa Bakery telah siap diluncurkan secara penuh dan teruji dengan tingkat kepatuhan asersi 100%!
