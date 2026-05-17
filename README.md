<p align="center">
  <img src="public/favicon.svg" alt="Kala Karsa Bakery Logo" width="120px" style="border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);" />
</p>

<h1 align="center">🥖 Kala Karsa Bakery — E-Commerce Suite & POS 🍰</h1>

<p align="center">
  <strong>Aplikasi E-Commerce & Point of Sales (POS) Premium Terintegrasi untuk Toko Roti & Kue</strong>
</p>

<p align="center">
  <a href="https://github.com/Hnzsama/kala_karsa">
    <img src="https://img.shields.io/badge/REPOSITORY-Hnzsama%2Fkala__karsa-8A2BE2?style=flat-square&logo=github" alt="Repository" />
  </a>
  <img src="https://img.shields.io/badge/LARAVEL-v13-FF2D20?style=flat-square&logo=laravel&logoColor=white" alt="Laravel 13" />
  <img src="https://img.shields.io/badge/INERTIA.JS-v3-9553E9?style=flat-square&logo=inertia&logoColor=white" alt="Inertia.js v3" />
  <img src="https://img.shields.io/badge/REACT-v19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/TAILWIND%20CSS-v4-06B6D4?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind CSS v4" />
</p>

<p align="center">
  <strong>Author: <a href="https://github.com/Hnzsama">Hnzsama</a></strong>
</p>

---

## 📖 Dokumentasi Lengkap Aplikasi

Untuk membaca arsitektur sistem, skema database (DBML), analisis MVC, Data Flow Diagram (DFD Level 0 & 1), Sequence Diagram, Activity Diagram, serta Laporan Pengujian Pest secara lengkap, silakan klik tombol di bawah ini:

<p align="center">
  <a href="documentation.md">
    <img src="https://img.shields.io/badge/BACA_DOKUMENTASI_TEKNIS-0052FF?style=for-the-badge&logo=gitbook&logoColor=white" alt="Read Technical Documentation Button" height="40px" />
  </a>
</p>

---

## 🌟 Tentang Kala Karsa Bakery

**Kala Karsa Bakery** adalah platform digital All-in-One yang menggabungkan keunggulan **E-Commerce berorientasi konsumen** dengan keandalan **Point of Sales (POS) & Manajemen Inventaris internal**. Aplikasi ini dirancang khusus untuk toko roti, kue kering tradisional, pastry, dan cake premium guna menghadirkan pengalaman berbelanja modern yang mulus serta mempermudah operasional bisnis secara presisi.

### 🚀 Fitur Utama Sistem

* **🛒 E-Commerce & Persistent Shopping Cart**: Konsumen dapat menelusuri katalog roti premium dengan filter kategori cepat, ulasan ulasan, dan memasukkan produk ke keranjang belanja yang tersinkronisasi di database.
* **💳 Gerbang Pembayaran Otomatis (Midtrans Snap)**: Pembayaran instan menggunakan kode QRIS, Virtual Account bank nasional (BCA, BRI, BNI, Mandiri), credit card, retail store, hingga e-wallet secara real-time.
* **🪙 Keanggotaan & Loyalty Points**: Pelanggan dapat mendaftar menjadi member aktif dengan nomor telepon dan otomatis mengumpulkan poin reward belanja kelipatan Rp10.000 untuk ditukarkan dengan kupon diskon.
* **📦 Manajemen Inventaris & Stock Opname**: Fitur eksklusif admin untuk mencatat hitung fisik produk aktual gudang, otomatis menghitung nilai selisih (`discrepancy`), merekonsiliasi stok komputer, dan melacak log penyesuaian pergerakan stok (`stock_movements`).
* **📊 Visualisasi Data Dashboard**: Grafik interaktif modern (Rounded SVG Bar Chart & Donut Chart) untuk memantau pendapatan bulanan toko, volume penjualan produk terlaris, serta pembagian metode pembayaran favorit pembeli.
* **💬 Ulasan Konsumen & merchant Reply**: Penilaian rating bintang (1-5) dan komentar ulasan oleh pembeli terverifikasi, serta portal balasan tanggapan resmi dari merchant/admin toko.
* **🧾 Invoice Digital Premium**: Halaman rincian transaksi A4 Printable dengan layout cetak instan profesional.

---

## 🛠️ Teknologi yang Digunakan

Aplikasi ini menggunakan perpaduan teknologi mutakhir berkinerja tinggi untuk menjamin kecepatan, skalabilitas, dan keamanan sistem:

### ⚡ Server-Side (Backend)
* **PHP 8.5**: Versi PHP terbaru yang tangguh dan memiliki performa tinggi.
* **Laravel 13 Framework**: Framework web PHP modern dengan ekosistem terlengkap di dunia.
* **Inertia.js Laravel Adapter (v3)**: Menghubungkan routing backend Laravel langsung ke React tanpa perlu membangun REST API terpisah.
* **Spatie Laravel Permission**: Mengatur role-based access control (RBAC) dengan pemisahan hak akses ketat antara `guest`, `customer`, `owner`, dan `admin`.
* **Laravel Fortify & Two-Factor Authentication**: Manajemen login terenkripsi, registrasi akun otomatis, pembaruan profil keamanan, dan otentikasi dua faktor (2FA/TOTP).

### 🎨 Client-Side (Frontend)
* **React 19**: Library UI berbasis komponen terpopuler dengan fitur rendering super cepat.
* **Tailwind CSS v4**: Framework styling utility-first terbaru untuk performa CSS super ringan dan visual estetik premium.
* **Inertia.js React Client (v3)**: Mengatur navigasi single page application (SPA), optimasi rendering instan, prefetching data, serta penanganan error dinamis.
* **Lucide React**: Paket ikon modern berkualitas tinggi untuk menunjang estetika visual.

### 💾 Database & Integrasi Pihak Ketiga
* **MySQL / MariaDB**: Database relasional penyimpan seluruh skema data transaksi.
* **Midtrans Snap API**: Integrasi gateway pembayaran berlisensi resmi OJK untuk menangani invoice pembayaran otomatis.

### 🧪 Quality Assurance & Pengujian
* **Pest PHP v4**: Framework testing modern terintegrasi dengan asersi 100% lulus untuk memvalidasi kestabilan sistem (95 Skenario Tes & 323 Asersi Sukses).

---

## 💻 Panduan Instalasi Lokal

### 1. Kloning Repositori
```bash
git clone https://github.com/Hnzsama/kala_karsa.git
cd kala_karsa
```

### 2. Instalasi Dependensi PHP & JS
```bash
composer install
npm install
```

### 3. Konfigurasi Environment `.env`
Salin file template `.env.example` menjadi `.env`, lalu lengkapi konfigurasi database MySQL serta kredensial API Midtrans:
```bash
cp .env.example .env
php artisan key:generate
```

### 4. Migrasi & Seed Database
Jalankan migrasi tabel beserta data awal bawaan (katalog produk, admin, owner, dan payment channels):
```bash
php artisan migrate:fresh --seed
```

### 5. Menjalankan Server Pengembangan
Jalankan server Laravel dan kompiler aset Vite secara bersamaan:
```bash
# Terminal 1 - Server PHP
php artisan serve

# Terminal 2 - Compiler Assets
npm run dev
```

### 6. Menjalankan Pengujian (Testing Suite)
Jalankan suite tes Pest untuk memastikan seluruh fungsionalitas berfungsi 100%:
```bash
php artisan test --compact
```

---

<p align="center">
  Dibuat dengan 🥖 & 💖 oleh <strong><a href="https://github.com/Hnzsama">Hnzsama</a></strong>. Hak Cipta © 2026. All Rights Reserved.
</p>
