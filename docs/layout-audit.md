# Laporan Audit Layout UI/UX — AIWarung

Laporan ini mendokumentasikan seluruh bug layout yang ditemukan, perbaikan yang dilakukan, file yang diubah, serta hasil pengujian lintas perangkat.

---

## Halaman yang Diperbaiki

| Halaman | File yang Diubah | Isu yang Ditemukan |
|---|---|---|
| **Semua halaman** | `public/css/style.css` | Hardcoded width sidebar, overflow, pos layout, mobile topnav |
| **Semua halaman** | `views/partials/header.ejs` | `d-lg-none` konflik dengan CSS, `d-flex` wrapper layout error |
| **Semua halaman** | `views/partials/footer.ejs` | Sidebar toggle tidak punya overlay, tidak ada cleanup saat resize |
| **Profil Saya** | `views/auth/profile.ejs` | Card terlalu sempit (`col-md-6 col-lg-5`) |
| **Ubah Password** | `views/auth/change-password.ejs` | Card terlalu sempit |
| **Profil UMKM** | `views/admin_umkm/profile.ejs` | Card terlalu sempit |
| **Tambah Pegawai** | `views/admin_umkm/user/create.ejs` | Card terlalu sempit (`col-md-8 col-lg-6`) |
| **Edit Pegawai** | `views/admin_umkm/user/edit.ejs` | Card terlalu sempit |
| **Tambah Barang** | `views/admin_umkm/barang/create.ejs` | Card terlalu sempit |
| **Edit Barang** | `views/admin_umkm/barang/edit.ejs` | Card terlalu sempit |
| **Tambah Supplier** | `views/admin_umkm/supplier/create.ejs` | Card terlalu sempit |
| **Edit Supplier** | `views/admin_umkm/supplier/edit.ejs` | Card terlalu sempit |
| **Buat UMKM (Admin)** | `views/admin_system/umkm/create.ejs` | Card tidak full-width di mobile |
| **Edit UMKM (Admin)** | `views/admin_system/umkm/edit.ejs` | Card tidak full-width di mobile |
| **Laporan Penjualan** | `views/admin_umkm/laporan/penjualan.ejs` | Filter row + export buttons overflow ke luar card di layar kecil |
| **Laporan Pembelian** | `views/admin_umkm/laporan/pembelian.ejs` | Filter row + export buttons overflow ke luar card di layar kecil |

---

## Bug yang Ditemukan

### 1. Sidebar Sessions Table Conflict (HTTP 500) — Sudah Diperbaiki Sebelumnya
> Tabel `sessions` warisan Laravel menyebabkan Sequelize gagal membaca sesi pengguna.

### 2. Hardcoded Layout Width pada `.sidebar-wrapper`
- **Bug**: `min-width: 260px; max-width: 260px;` memaksa sidebar fixed size tanpa fallback.
- **Akibat**: Sidebar meluber dan bertumbukan dengan main content di resolusi kecil.
- **Perbaikan**: Menggunakan CSS custom property `--sidebar-width: 260px` dan `position: fixed` dengan transisi bersih.

### 3. `d-flex` Wrapper di `header.ejs` Konflik dengan Sidebar Fixed
- **Bug**: `<div class="d-flex">` membungkus sidebar dan main content, memaksa flexbox dua kolom berdampingan.
- **Akibat**: Sidebar muncul dalam aliran dokumen (in-flow), mendorong konten secara paksa dan merusak layout saat sidebar dalam posisi `fixed`.
- **Perbaikan**: Wrapper diubah ke `<div>` biasa. Sidebar menggunakan `position: fixed` dan main content menggunakan `margin-left: var(--sidebar-width)`.

### 4. `.mobile-top-nav` Dikontrol Dua Sistem Sekaligus
- **Bug**: Class Bootstrap `d-lg-none` dan CSS custom `display: none` berkonflik, menyebabkan mobile navbar tidak muncul di resolusi tertentu.
- **Perbaikan**: Menghapus `d-lg-none` dari header, membiarkan CSS murni yang mengontrol visibilitas.

### 5. Form Card Terlalu Sempit di Desktop
- **Bug**: Semua halaman form (profil, ubah password, tambah/edit user/barang/supplier/umkm) menggunakan `col-md-6 col-lg-5` atau `col-md-8 col-lg-6` tanpa fallback `col-12`.
- **Akibat**: Di layar mobile, form terpotong dan tidak bisa diakses. Di laptop lebar, card terasa sempit dan tidak proporsional.
- **Perbaikan**:
  - Profil/password: `col-12 col-md-8 col-lg-6 col-xl-5`
  - User/Barang/Supplier: `col-12 col-md-10 col-lg-8 col-xl-7`
  - UMKM Admin System: `col-12 col-lg-10 col-xl-8`

### 6. Laporan Filter + Export Buttons Overflow di Mobile
- **Bug**: Filter bulan/tahun menggunakan `col-md-3` (menyempit di mobile) dan tombol export menggunakan `col-auto ms-auto` yang mendorong tombol ke sudut kanan dan meluber ke luar layar kecil.
- **Perbaikan**: Baris filter menggunakan breakpoint responsif `col-12 col-sm-6 col-md-4 col-lg-3`. Tombol export dipindah ke baris terpisah dengan `flex-wrap gap-2`.

### 7. POS Cart Sticky / Height Hardcoded
- **Bug**: `.pos-cart { height: 100%; }` menyebabkan cart tidak mengisi tinggi secara proporsional.
- **Perbaikan**: Cart menggunakan `position: sticky; top: 20px; max-height: calc(100vh - 130px)` di desktop dan `position: static; max-height: none` di mobile.

### 8. Sidebar Overlay Tidak Ada
- **Bug**: Saat sidebar terbuka di mobile, mengklik luar sidebar tidak menutupnya. Tidak ada overlay gelap di belakang sidebar.
- **Perbaikan**: Ditambahkan `<div class="sidebar-overlay" id="sidebarOverlay">` dengan CSS `background: rgba(0,0,0,0.45)`. Toggle JS diperbarui untuk mengelola open/close sidebar+overlay secara bersamaan dan me-reset saat layar kembali ke ukuran desktop.

### 9. `.glass-card` Memiliki `overflow: hidden`
- **Bug**: `overflow: hidden` pada card memotong konten dropdown, invalid-feedback, dan elemen yang melewati border radius card.
- **Perbaikan**: Menghapus `overflow: hidden` dari `.glass-card`.

---

## CSS yang Diubah

**File**: [`public/css/style.css`](file:///c:/xampp/htdocs/KDMP/public/css/style.css)

| Selector | Perubahan |
|---|---|
| `:root` | Ditambahkan `--sidebar-width` dan `--topnav-height` sebagai token |
| `.sidebar-wrapper` | Diubah dari `min/max-width` fixed menjadi `width: var(--sidebar-width)`, `position: fixed`, `flex-direction: column` |
| `.main-wrapper` | Diubah dari `margin-left: 260px` statis ke `margin-left: var(--sidebar-width)`, ditambahkan `overflow-x: hidden` |
| `.glass-card` | Dihapus `overflow: hidden` yang memotong konten |
| `.pos-container` | Diubah dari `height: calc(100vh-150px)` ke `min-height: calc(100vh-180px)` |
| `.pos-cart` | Ditambahkan `position: sticky`, `max-height: calc(100vh-130px)` |
| `.mobile-top-nav` | Diubah dari `display: flex` selalu aktif ke `display: none` default, tampil hanya di `< 992px` |
| `.sidebar-overlay` | **BARU**: Class untuk overlay mobile tap-to-close |
| `@media (max-width: 991.98px)` | Diperbaiki padding topnav, pos-cart `position: static`, page-header-nav `flex-wrap` |
| `@media (max-width: 575.98px)` | **BARU**: Breakpoint tambahan untuk layar kecil, font table dikecilin, padding dikompreskan |

---

## Hasil Pengujian

### Desktop (1280px+)
- ✅ Sidebar tampil permanen di kiri dengan lebar 260px
- ✅ Main content tidak tumpang tindih dengan sidebar
- ✅ Semua form card memiliki lebar proporsional yang nyaman dibaca
- ✅ Tabel data (Pegawai, Barang, Supplier) responsif dengan `table-responsive`
- ✅ POS Terminal: katalog di kiri 60%, cart di kanan 40%, cart sticky saat scroll katalog
- ✅ Laporan: filter row dan tombol export terpisah rapi
- ✅ Tidak ada elemen yang terpotong atau overflow

### Tablet (768px – 991px)
- ✅ Sidebar tersembunyi, mobile topnav muncul dengan hamburger menu
- ✅ Sidebar membuka sebagai drawer dari kiri saat hamburger diklik
- ✅ Overlay gelap muncul di belakang sidebar, klik overlay menutup sidebar
- ✅ Main content mengisi penuh layar tablet
- ✅ Form card melebar mengisi layar
- ✅ POS Terminal: beralih ke satu kolom vertikal (katalog di atas, cart di bawah)
- ✅ Laporan: filter stack vertikal per baris, export buttons wrap ke baris baru

### Mobile (< 576px)
- ✅ Semua form card full-width (`col-12`)
- ✅ Tabel menggunakan `table-responsive` sehingga dapat di-scroll horizontal
- ✅ Tombol aksi di tabel tidak terpotong
- ✅ Page header stack vertikal (judul di atas, tombol di bawah)
- ✅ POS Terminal: stack vertikal, katalog max-height 55vh, cart scrollable
- ✅ Laporan: setiap filter field full-width, export buttons wrap
- ✅ Tidak ada horizontal scroll pada level body

---

## Catatan Teknis

> [!TIP]
> Seluruh perubahan menggunakan Bootstrap Grid dan CSS custom properties (design tokens) agar mudah dikustomisasi. Tidak ada `width` hardcode pada elemen layout utama.

> [!NOTE]
> Sidebar overlay menggunakan `z-index: 1020` (di bawah sidebar `z-index: 1030` dan mobile topnav `z-index: 1040`). Urutan z-index ini memastikan tumpukan layer yang benar di semua resolusi.
