# Audit Report

## Ringkasan

Audit ini dilakukan secara menyeluruh terhadap struktur project, kualitas source code, keamanan, database, backend, frontend, performa, dependensi, dan kepatuhan terhadap standar PKM (Program Kreativitas Mahasiswa).

AIWarung adalah aplikasi pengelolaan UMKM terintegrasi berbasis **Node.js, Express.js, EJS, dan Sequelize (MySQL/MariaDB)**. Aplikasi ini dirancang sebagai pengganti (refactor) dari project berbasis Laravel sebelumnya. Secara arsitektur, aplikasi ini telah mengimplementasikan pola MVC (Model-View-Controller) dengan baik dan memisahkan logika transaksi ke dalam Service layer.

Namun, audit ini menemukan beberapa **isu kritis** yang menghambat aplikasi untuk dideploy ke lingkungan production, terutama terkait **portabilitas sistem operasi (casing file)**, **ketiadaan proteksi CSRF**, **penggunaan MemoryStore untuk session**, dan **layout sidebar yang patah (tidak responsive) pada perangkat mobile**.

---

## Struktur Project

Struktur folder utama menggunakan pola MVC yang disesuaikan untuk Express.js:
* `/app/Models` - Model Sequelize
* `/app/controllers` - Controller aplikasi
* `/app/middlewares` - Middleware otentikasi dan otorisasi
* `/app/routes` - Routing modular
* `/app/validators` - Validasi request menggunakan express-validator
* `/views` - User Interface berbasis EJS (Embedded JavaScript templates)

### Temuan Struktur:
* **Ketidakjelasan Arsitektur (Laravel Leftovers)**: Ditemukan berkas sisa proyek Laravel di direktori root seperti `composer.json`, `composer.lock`, direktori `/vendor`, `artisan`, dan `phpunit.xml`. Hal ini memperbesar ukuran proyek secara tidak perlu dan mengaburkan identitas teknologi utama.
* **Inkonsistensi Penamaan Folder (Masalah Portabilitas Sistem Operasi)**:
  * Folder model dinamai `/app/Models` (kapital) dan folder service dinamai `/app/Services` (kapital).
  * Namun, berkas kontroler, middleware, dan validator mengimpor keduanya dengan huruf kecil, contoh: `import { User } from '../models/index.js';` dan `import { TransactionService } from '../services/transactionService.js';`.
  * **Dampak**: Pada Windows (case-insensitive), aplikasi berjalan lancar. Namun pada Linux/Docker (case-sensitive) yang umum digunakan untuk server production, aplikasi akan langsung **crash** dengan pesan error `Cannot find module`.

**Skor Struktur Project: 70 / 100**

---

## Code Quality

Secara umum, kode ditulis secara bersih (Clean Code) dengan pembagian tanggung jawab yang jelas. Logika transaksi yang kompleks didelegasikan ke `TransactionService` dan visualisasi data ke `DashboardService` (mengikuti Single Responsibility Principle / SRP).

### Temuan Code Smell & Rekomendasi:
1. **Redundansi Method-Override**:
   Aplikasi memuat middleware `method-override` di `app.js` dan menyisipkan elemen input tersembunyi `<input type="hidden" name="_method" value="POST">` pada form pengeditan (seperti `edit.ejs`). Namun, semua rute pembaruan data di router didefinisikan dengan metode `POST` asli (misal: `router.post('/user/:id', ...)`). Ini adalah redundansi pola RESTful yang tidak fungsional.
2. **Ketiadaan Validasi Input di Beberapa Endpoint Kritis**:
   * Rute `updateProfile` dan `updatePassword` di `authController.js` memproses data langsung dari body request tanpa melalui middleware validator. Pengguna dapat mengosongkan nama, menginput email dengan format salah, atau mengubah password menjadi kosong.
   * Parameter query `bulan` dan `tahun` pada `LaporanController.js` langsung di-parse menggunakan `parseInt()` tanpa memeriksa nilai `NaN` atau memvalidasi batasan nilai bulan (1–12). Jika pengguna memasukkan nilai non-angka, query database akan menghasilkan kesalahan sintaks SQL.
3. **Hardcoded Credentials & Secrets**:
   * Berkas `config/database.js` dan `config/config.json` memiliki kredensial database default yang tertulis keras (*hardcoded*): `username: 'bossKDMP'` dan `password: 'FTtkUMrah'`.
   * Nilai fallback untuk `SESSION_SECRET` tertulis keras di `app.js`: `'aiwarungsecretkey123!@#'`.

---

## Security

Pemeriksaan keamanan menunjukkan beberapa celah keamanan dengan tingkat risiko bervariasi:

| Celah Keamanan | Deskripsi | Tingkat Risiko |
| :--- | :--- | :--- |
| **Ketiadaan Proteksi CSRF** | Aplikasi tidak memiliki middleware perlindungan terhadap Cross-Site Request Forgery (CSRF). Penyerang dapat membuat situs web pihak ketiga yang memaksa browser pengguna yang terotentikasi untuk mengirimkan permintaan POST berbahaya (misal: mengubah password atau menghapus data UMKM). | **CRITICAL** |
| **Penyimpanan Session di Memori (MemoryStore)** | Session dikonfigurasi menggunakan default memori Express (`express-session`). Ini membocorkan memori (*memory leak*), mencegah skalabilitas horizontal cluster, dan menyebabkan semua pengguna ter-logout otomatis setiap kali server Node.js restart. | **HIGH** |
| **Hardcoded Database & Session Key** | Kredensial database dan kunci rahasia sesi tertulis langsung di repositori kode (bukan hanya di `.env`), memudahkan kebocoran kredensial jika kode terunggah ke repositori publik. | **HIGH** |
| **Ketiadaan Atribut Keamanan Cookie** | Konfigurasi session cookie di `app.js` tidak menetapkan parameter `secure: true` (agar cookie hanya ditransmisikan lewat HTTPS) dan `sameSite: 'lax'` untuk mengurangi risiko CSRF. | **MEDIUM** |
| **Potensi XSS pada Grafik Analytics** | Berkas `dashboard.ejs` memuat data tren grafik menggunakan tag unescaped `<%- JSON.stringify(stats.chart_sales) %>`. Walaupun saat ini datanya berupa angka agregat, penulisan unescaped di dalam blok `<script>` merupakan anti-pattern yang dapat memicu Stored XSS jika data sumber mengandung karakter jahat. | **LOW** |

---

## Database

Aplikasi menggunakan database relasional (MySQL/MariaDB) yang diakses via Sequelize ORM. Relasi tabel dikonfigurasi dengan baik di dalam folder `/app/Models/index.js` dengan cascade delete yang tepat pada beberapa entitas terkait.

### Temuan & Rekomendasi Database:
1. **Inkonsistensi Naming Convention Tabel**:
   * Beberapa tabel menggunakan format jamak (*plural*): `roles`, `umkms`, `users`.
   * Beberapa tabel lain menggunakan format tunggal (*singular*): `barang`, `supplier`, `penjualan`, `detail_penjualan`, `pembelian`, `detail_pembelian`, `stok_log`.
   * *Rekomendasi*: Standarkan semua nama tabel database menjadi satu format konsisten (disarankan menggunakan jamak sesuai standar Sequelize, atau tunggal sepenuhnya).
2. **Ketiadaan Database Unique Constraints**:
   * Kolom `kode_barang` di tabel `barang` dan `kode_supplier` di tabel `supplier` hanya divalidasi keunikannya di tingkat aplikasi melalui validator. Tidak ada indeks unik (`UNIQUE`) tingkat database untuk kombinasi `(kode_barang, umkm_id)` dan `(kode_supplier, umkm_id)`.
   * *Dampak*: Pada kondisi transaksi bersamaan (*high concurrency*), duplikasi kode barang/supplier pada satu UMKM tetap dapat terjadi di tingkat database.
3. **Ketiadaan Indeks Non-Primary Key**:
   * Kolom `tanggal` pada tabel `penjualan` dan `pembelian` sering dijadikan parameter pencarian, pengurutan, dan fungsi agregasi bulanan (`MONTH()`, `YEAR()`). Kolom ini tidak memiliki indeks database, yang berpotensi memperlambat performa query saat volume data transaksi membesar (Full Table Scan).

---

## Backend

Sisi backend menggunakan framework Express.js dengan arsitektur REST-ish:
* **Routing**: Rute dikelompokkan secara logis berdasarkan peran pengguna (`adminSystemRoutes`, `adminUmkmRoutes`, `kasirRoutes`, `pembelianRoutes`).
* **Middleware**: `authMiddleware` berfungsi dengan baik dalam membatasi hak akses halaman berdasarkan peran (*Role-Based Access Control*). Namun, middleware ini melakukan query database `User.findByPk` pada setiap request rute non-statis. Ini dapat dioptimalkan dengan menyimpan data esensial di sesi atau menambahkan caching jangka pendek.
* **Error Handling**: Handler global untuk error 404 (Not Found) dan 500 (Internal Server Error) sudah tersedia di `app.js` dan merender halaman error berbasis EJS.
* **Endpoint Tidak Digunakan**: Rute form pengiriman data menggunakan POST untuk aksi hapus (contoh: `/barang/:id/delete`) alih-alih menggunakan metode HTTP `DELETE` asli yang didukung oleh konfigurasi `method-override`.

---

## Frontend

Tampilan antarmuka dibangun menggunakan EJS dan Bootstrap 5 dengan desain visual yang mengadopsi tema modern (font Google `Outfit` dan kartu bergaya semi-glassmorphism).

### Temuan Frontend & UI/UX:
* **Masalah Responsivitas Kritis (Broken Mobile Layout)**:
  * Navigasi sidebar (`.sidebar-wrapper`) memiliki lebar tetap `260px` dengan posisi `fixed`. Area konten utama (`.main-wrapper`) memiliki `margin-left: 260px` tetap.
  * **Dampak**: Tidak ada media query CSS yang menyembunyikan atau mengubah sidebar menjadi menu collapsable di layar kecil. Pada resolusi mobile (< 992px), sidebar akan menutupi konten utama, membuat aplikasi **sama sekali tidak dapat digunakan pada layar ponsel**.
* **POS Terminal Grid Clip**:
  * Pada halaman checkout kasir (`/kasir/transaksi`), grid pembagi halaman menggunakan `grid-template-columns: 3fr 2fr` tanpa responsivitas. Tampilan katalog barang dan keranjang belanja akan menjadi sangat sempit dan bertabrakan di layar resolusi menengah ke bawah.
* **Asset Bermasalah (Console Error)**:
  * Pada berkas `views/partials/header.ejs` baris 13, terdapat pemanggilan stylesheet CDN Bootstrap yang salah: `https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/style.css`.
  * Berkas tersebut tidak ada di CDN dan mengembalikan error **HTTP 404 (Not Found)** pada console browser. Berkas CSS Bootstrap yang benar dipanggil di baris berikutnya, tetapi link rusak ini menyebabkan overhead request dan error konsol yang tidak rapi.

---

## Performance

* **N+1 Query**: Tidak ditemukan masalah N+1 query yang signifikan karena kode mengambil data relasi secara optimal menggunakan opsi `include` (Eager Loading) bawaan Sequelize.
* **Query Lambat**: Analisis performa tren bulanan pada `DashboardService` menggunakan fungsi SQL `MONTH(tanggal)` di dalam klausa `group`. Tanpa indeks pada kolom `tanggal`, query ini akan lambat saat volume data transaksi mencapai puluhan ribu baris.
* **Asset Ukuran Besar**: Seluruh library luar (Bootstrap, Chart.js, Bootstrap Icons) dimuat secara langsung melalui CDN pihak ketiga. Hal ini menghemat bandwidth server internal tetapi membuat rendering halaman awal sangat bergantung pada koneksi internet klien.

---

## Dependency

Evaluasi dependensi di `package.json`:
* `multer` (`^1.4.5-lts.1`): **Paket tidak digunakan**. Multer terpasang di dependensi proyek tetapi tidak diimpor atau digunakan di backend manapun. Selain itu, versi 1.x ini terdeteksi memiliki kerentanan keamanan (vulnerabilities) yang telah diperbaiki pada versi 2.x.
* Dependensi lain seperti `bcryptjs`, `exceljs`, `express`, `express-session`, `express-validator`, `mysql2`, `pdfkit`, `pdfkit-table`, dan `sequelize` berada pada versi stabil dan digunakan secara aktif di dalam kode.

---

## Folder

Analisis direktori proyek menemukan beberapa folder sisa yang tidak digunakan dan dapat dihapus:
* `/vendor` (Direktori sisa PHP/Composer - berisi ribuan file pustaka PHP yang sangat memakan ruang penyimpanan dan tidak terpakai oleh Node.js).
* `/reference_project` (Direktori proyek eksternal Next.js/Tailwind CSS yang berfungsi sebagai referensi UI. Direktori ini tidak dieksekusi oleh runtime server utama dan sebaiknya dipindahkan keluar dari repositori produksi untuk efisiensi ruang).

---

## File

Analisis berkas sisa yang tidak digunakan:
* `artisan` (Berkas eksekusi sisa Laravel/PHP).
* `composer.json` & `composer.lock` (Konfigurasi dependensi PHP).
* `phpunit.xml` (Konfigurasi pengujian PHP).
* `tailwind.config.js`, `postcss.config.js`, dan `vite.config.js` di direktori root (Berkas konfigurasi sistem build sisa Laravel/Vite yang tidak digunakan oleh aplikasi Express-EJS saat ini).
* `database/database.sqlite` (Database SQLite lokal sisa development/testing. Aplikasi saat ini terkonfigurasi ke database MySQL/MariaDB lewat `.env`).

---

## UI/UX

Desain antarmuka AIWarung sudah memiliki nilai estetika yang tinggi untuk aplikasi administrasi:
* **Konsistensi Warna**: Palette warna sudah dikonfigurasi lewat CSS Variables di `style.css` (warna latar slate muda, aksen biru, badge sukses hijau, badge kritis merah).
* **Typography**: Menggunakan font modern `Outfit` dengan rendering teks yang sangat tajam dan profesional.
* **Button & Input**: Tombol dan input memiliki transisi fokus yang halus (`transition: all 0.3s ease`).

### Saran Peningkatan UI/UX:
1. Sediakan tombol toggle hamburger di pojok kiri atas saat layar berukuran kecil untuk memunculkan/menyembunyikan sidebar navigasi.
2. Tambahkan indikator konfirmasi yang lebih ramah sebelum melakukan penghapusan data master (saat ini menggunakan fungsi `confirm()` bawaan browser yang terkesan kurang premium).
3. Halaman kasir (POS Checkout) sebaiknya menyediakan visualisasi gambar mini barang atau shortcut keyboard untuk mempercepat transaksi kasir di lapangan.

---

## PKM Compliance

Aplikasi dievaluasi berdasarkan kepatuhan spesifikasi teknis PKM (Program Kreativitas Mahasiswa):

| Kriteria Spesifikasi | Status | Catatan |
| :--- | :---: | :--- |
| Tidak menggunakan PHP | ✅ Sudah | Sepenuhnya berjalan di atas runtime Node.js. |
| Menggunakan Node.js + Express.js | ✅ Sudah | Menggunakan kerangka kerja Express.js. |
| Menggunakan MariaDB/MySQL | ✅ Sudah | Menggunakan mysql2 dan Sequelize ORM. |
| Responsive | ⚠️ Sebagian | Menggunakan Bootstrap 5, namun sidebar navigasi memotong tampilan di perangkat mobile. |
| Struktur MVC | ✅ Sudah | Model di `/app/Models`, View di `/views`, Controller di `/app/controllers`. |
| Role Management | ✅ Sudah | Multi-role: Admin System, Admin UMKM, Pegawai Penjualan, Pegawai Pembelian. |
| Session | ✅ Sudah | Menggunakan express-session (namun masih di MemoryStore). |
| Dashboard | ✅ Sudah | Halaman dashboard analitik tersedia untuk Admin dan Pegawai. |
| CRUD | ✅ Sudah | CRUD lengkap untuk data pegawai, katalog barang, dan supplier. |
| Laporan | ✅ Sudah | Laporan penjualan dan pembelian filter bulanan/tahunan. |
| Export PDF | ✅ Sudah | Berhasil menggunakan library `pdfkit-table`. |
| Export Excel | ✅ Sudah | Berhasil menggunakan library `exceljs`. |

---

## Testing

* **Automated Tests**: Tidak ada unit test atau integration test otomatis yang terkonfigurasi pada sisi Node.js. Konfigurasi `phpunit.xml` yang tersisa adalah peninggalan Laravel dan tidak berguna di Express.js.
* **Console Error**:
  * Terdapat kesalahan **HTTP 404** di konsol browser pada setiap pemuatan halaman admin akibat link stylesheet rusak `bootstrap@5.3.3/dist/css/style.css` di `header.ejs`.
* **Runtime Error**:
  * Tidak ditemukan runtime crash saat pemuatan halaman standar di Windows, tetapi diproyeksikan akan langsung mengalami fatal error saat dideploy ke server Linux/Docker karena ketidaksesuaian casing folder `/app/Models` dan `/app/Services` pada kode impor.

---

## Production Readiness

### Status Kelayakan: **Layak Development (Belum Layak Production/Beta)**

### Alasan Teknis:
1. **Fatal Portability Crash**: Aplikasi akan langsung gagal berjalan di Linux (cloud server / VPS / Docker) akibat bug casing impor (`models` vs `Models`).
2. **Celah Keamanan Kritis**: Ketiadaan proteksi CSRF di seluruh form pengubahan data sangat berbahaya untuk aplikasi multi-tenant seperti ini.
3. **Session Instability**: Penggunaan `MemoryStore` untuk session di production akan memicu konsumsi RAM yang tinggi (memory leak) dan memutuskan koneksi masuk user secara berkala setiap kali server restart atau auto-scale.
4. **Mobile Usability**: Tampilan navigasi sidebar yang menutupi konten di layar ponsel membuat aplikasi tidak dapat digunakan secara mobile oleh pemilik warung atau kasir di tablet/smartphone.

---

## Score

| Kategori | Skor (0-100) | Keterangan |
| :--- | :---: | :--- |
| **Arsitektur** | **75** | Pembagian MVC dan Service layer baik, namun terganggu berkas Laravel sisa. |
| **Code Quality** | **70** | Kode bersih dan modular, terganggu isu case-sensitive import dan kurangnya validasi parameter. |
| **Security** | **50** | Ada password hashing bcrypt, namun fatal karena tidak ada CSRF guard dan menggunakan memory session. |
| **Performance** | **80** | Pemuatan data cepat dengan Eager Loading, perlu optimasi indeks pada kolom tanggal. |
| **UI/UX** | **65** | Desain visual premium dan modern, namun buruk dalam skalabilitas mobile (non-responsive). |
| **Maintainability**| **75** | Struktur folder modular membuat kode mudah dirawat oleh tim pengembang baru. |
| **Scalability** | **60** | Terhambat oleh penggunaan MemoryStore untuk session yang membatasi clustering server. |
| **Database** | **70** | Relasi antar tabel tepat, namun nama tabel tidak konsisten dan tidak ada unique database key. |
| **Testing** | **10** | Tidak ada testing suite Node.js, hanya sisa file testing PHP Laravel. |
| **Overall** | **62** | **Cukup baik untuk tahap development, butuh perbaikan sebelum dipublikasikan.** |

---

## Prioritas Perbaikan

### Critical
1. **Perbaikan Casing Impor**: Ubah nama direktori `/app/Models` menjadi `/app/models` (huruf kecil) dan `/app/Services` menjadi `/app/services` (huruf kecil) agar aplikasi tidak mengalami crash fatal di lingkungan server Linux/Docker.
2. **Implementasikan CSRF Protection**: Pasang modul pengaman CSRF (contoh: `csurf` atau token kustom berbasis cookie) pada middleware Express dan sematkan tokennya pada seluruh form EJS.
3. **Ubah Session Store**: Ganti penyimpanan session dari MemoryStore ke database menggunakan Sequelize Store (contoh: `connect-session-sequelize`) agar session tersimpan aman di database MariaDB.

### High
1. **Responsivitas Sidebar Navigasi**: Tambahkan media query CSS di `style.css` agar sidebar menyusut atau tersembunyi pada layar lebar < 992px dan dapat di-toggle lewat tombol hamburger.
2. **Perbaiki Link Bootstrap CDN**: Hapus baris pemanggilan stylesheet Bootstrap rusak yang menghasilkan error 404 di `header.ejs`.
3. **Sembunyikan Kredensial**: Pindahkan kredensial database default dari file konfigurasi Sequelize (`config.json`/`database.js`) dan gunakan environment variables (`process.env.DB_PASSWORD`, dsb) secara penuh.
4. **Pembersihan Berkas Sampah**: Hapus folder `/vendor`, `artisan`, `composer.json`, `composer.lock`, dan `phpunit.xml` sisa Laravel untuk merampingkan ukuran repository proyek.

### Medium
1. **Validasi Profil & Password**: Tambahkan skema validasi menggunakan `express-validator` pada endpoint pembaruan profil dan pengubahan password untuk mencegah input kosong.
2. **Validasi Query Laporan**: Tambahkan pengecekan tipe data parameter `bulan` dan `tahun` pada controller laporan sebelum diproses ke query database.
3. **Standarisasi Nama Tabel**: Ubah nama tabel database tunggal seperti `barang`, `supplier`, `penjualan` menjadi format jamak (`barangs`, `suppliers`, `penjualans`) agar konsisten dengan `users` dan `umkms`.
4. **Database Unique Constraints**: Buat migration untuk menambahkan index unique pada kombinasi `(kode_barang, umkm_id)` dan `(kode_supplier, umkm_id)`.

### Low
1. **Bersihkan Package.json**: Hapus library `multer` dari daftar dependensi karena tidak digunakan sama sekali.
2. **Pindahkan Proyek Referensi**: Pindahkan folder `/reference_project` keluar dari repositori utama aplikasi.
3. **Database Indexing**: Tambahkan index database pada kolom `tanggal` di tabel `penjualan` dan `pembelian`.

---

## Roadmap

### Tahap 1
* **Portabilitas & Kerapian (Bug Fix & Cleanup)**
  * Menyelaraskan nama direktori (`Models` -> `models` dan `Services` -> `services`) sesuai dengan sintaks import.
  * Menghapus file sisa Laravel (`/vendor`, `artisan`, `composer.json`, dll.) dari root project.
  * *Estimasi*: 1–2 hari kerja | Prioritas: *High*.

### Tahap 2
* **Penguatan Keamanan & Sesi (Security Hardening)**
  * Integrasi middleware pengaman CSRF dan inject CSRF token pada UI forms.
  * Mengganti Session Store dari `MemoryStore` ke database store ter-persistent menggunakan `connect-session-sequelize`.
  * Memindahkan default hardcoded database password dan session secret ke `.env`.
  * *Estimasi*: 2–3 hari kerja | Prioritas: *Critical*.

### Tahap 3
* **Responsivitas & Perbaikan UI (Frontend Optimization)**
  * Membuat media query CSS responsive untuk sidebar navigasi mobile dan layout grid POS checkout.
  * Menghilangkan console error 404 stylesheet Bootstrap CDN.
  * *Estimasi*: 2–3 hari kerja | Prioritas: *High*.

### Tahap 4
* **Validasi & Integritas Data (Data & Validation Layer)**
  * Menambahkan validasi parameter laporan dan update profile.
  * Menambahkan unique database index constraint pada `kode_barang` dan `kode_supplier` per UMKM.
  * *Estimasi*: 2 hari kerja | Prioritas: *Medium*.

### Tahap 5
* **Pembuatan Tes & Kesiapan Produksi (Testing & Deployment)**
  * Integrasi framework testing otomatis (seperti Jest/Supertest) untuk endpoint API utama.
  * Finalisasi konfigurasi clustering server (seperti PM2) untuk deployment production.
  * *Estimasi*: 3 hari kerja | Prioritas: *Medium/Low*.

---

## Kesimpulan

Aplikasi **AIWarung** saat ini secara struktural sudah fungsional dan memiliki dasar arsitektur MVC yang solid untuk keperluan Program Kreativitas Mahasiswa (PKM). Namun, aplikasi **belum layak digunakan pada lingkungan produksi** karena adanya kendala portabilitas sistem operasi (casing folder), celah keamanan CSRF, serta rusaknya tampilan pada perangkat mobile. 

Dengan mengikuti roadmap perbaikan di atas, pengembang dapat menaikkan status kelayakan aplikasi ini ke **Layak Beta** hingga **Layak Production** dalam waktu kurang dari dua minggu pengerjaan terfokus.
