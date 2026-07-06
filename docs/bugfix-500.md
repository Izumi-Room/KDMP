# Laporan Perbaikan Bug: HTTP 500 Internal Server Error

Dokumen ini menjelaskan akar masalah, analisis, perbaikan, dan langkah verifikasi untuk kesalahan HTTP 500 Internal Server Error yang terjadi pada aplikasi AIWarung.

---

## Penyebab Error

Akar penyebab kesalahan HTTP 500 adalah **konflik skema tabel database `sessions`** antara sisa-sisa database Laravel lama dengan yang diharapkan oleh library Node.js `connect-session-sequelize`.

Secara kronologis:
1. Database MariaDB `AIWarungDB` sebelumnya digunakan oleh Laravel, yang menyisakan tabel bernama `sessions` dengan struktur kolom: `id`, `user_id`, `ip_address`, `user_agent`, `payload`, `last_activity`.
2. Saat Express.js dijalankan dengan `connect-session-sequelize`, fungsi `sessionStore.sync()` mendeteksi bahwa tabel `sessions` **sudah ada** di database, sehingga tidak melakukan pembuatan ulang (tidak menimpa tabel).
3. Namun, ketika ada request HTTP masuk ke Express, middleware session mencoba mencari data session menggunakan skema Sequelize yang mencari kolom-kolom seperti `sid`, `expires`, `data`, `createdAt`, dan `updatedAt`.
4. MySQL/Sequelize mengembalikan error fatal karena kolom `sid` tidak ditemukan pada tabel `sessions` Laravel. Exception ini tidak tertangkap dengan mulus dan menghasilkan respon **HTTP 500 Internal Server Error** secara global pada setiap rute yang dilalui middleware sesi.

---

## Langkah Perbaikan & File yang Diubah

Tidak ada perubahan kode sumber (source code) JavaScript yang diperlukan karena inisialisasi di `app.js` sudah benar secara sintaksis. Solusi yang dilakukan adalah **penyelarasan status database**:

1. **Menghapus tabel konflik**:
   Menghapus tabel `sessions` warisan Laravel menggunakan perintah MySQL:
   ```sql
   DROP TABLE AIWarungDB.sessions;
   ```
2. **Re-inisialisasi skema**:
   Restart server Express. Saat startup, `sessionStore.sync()` mendeteksi tabel `sessions` tidak ada, lalu secara otomatis membuat ulang tabel `sessions` dengan struktur kolom yang benar:
   - `sid` (varchar 36)
   - `expires` (datetime)
   - `data` (text)
   - `created_at` (datetime)
   - `updated_at` (datetime)

---

## Cara Reproduksi Bug

1. Sambungkan aplikasi Express Node.js ke database MySQL yang memiliki tabel `sessions` dengan struktur bawaan Laravel.
2. Pasang session store menggunakan `connect-session-sequelize`.
3. Jalankan server dan buka rute `/login`.
4. Aplikasi akan langsung mengembalikan respon `500 Internal Server Error` dan mencetak stack trace error Sequelize (`Unknown column 'sid' in 'field list'`).

---

## Cara Memastikan Bug Sudah Selesai

1. Jalankan pengecekan skema tabel menggunakan MySQL CLI:
   ```bash
   C:\xampp\mysql\bin\mysql.exe -u bossKDMP -pFTtkUMrah -e "DESCRIBE AIWarungDB.sessions;"
   ```
   Pastikan field yang muncul adalah `sid`, `expires`, `data`, `created_at`, dan `updated_at`.
2. Jalankan aplikasi Express:
   ```bash
   npm run dev
   ```
3. Akses `http://localhost:3000/login` menggunakan browser. Halaman login harus ter-render sempurna dengan kode status `200 OK`.
4. Masukkan username `admin` dan password `password` lalu tekan **Masuk Aplikasi**. Pengguna harus dialihkan (redirect) secara aman ke halaman dashboard tanpa runtime error.
