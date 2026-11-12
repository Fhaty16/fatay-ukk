# Taskify UKK — To-Do List Full-Stack

Aplikasi manajemen tugas full-stack PHP + SQLite + vanilla JavaScript, responsive, desain ungu pastel. **Tidak perlu Composer, Node.js, npm, atau internet untuk backend.** Internet opsional untuk Google Fonts; fallback tersedia.

## Fitur
- Login, registrasi, logout dengan password hashing (`password_hash`)
- Dashboard: ringkasan total, selesai, progres; grafik mingguan dan proyek
- CRUD tugas: tambah, lihat, cari, filter, edit, hapus, tandai selesai
- CRUD proyek: tambah, lihat, hapus; progress otomatis
- Kalender bulanan dan agenda tanggal terpilih
- Statistik, progress per proyek, dan ekspor CSV
- Settings: nama profil, tema gelap/terang
- Responsif untuk desktop dan HP
- Keamanan: prepared statements, CSRF token, session, validasi server, escaping output, kepemilikan data per akun

## Cara menjalankan di Laragon (Windows)
1. Ekstrak folder `taskify-ukk` ke `C:\laragon\www\taskify-ukk`.
2. Jalankan Laragon, klik **Start All** (Apache). PHP yang disarankan **8.2+**.
3. **Aktifkan SQLite**: di Laragon > PHP > php.ini, pastikan baris berikut aktif (tanpa titik koma):
   ```ini
   extension=pdo_sqlite
   extension=sqlite3
   ```
   Bila sudah aktif, tidak perlu diubah. Restart Apache jika mengubah php.ini.
4. Buka `http://localhost/taskify-ukk/` di browser. Database otomatis dibuat di `storage/taskify.sqlite` pertama kali akses API.
5. Login akun DEMO:
   - Email: `demo@taskify.local`
   - Password: `Demo12345!`
   Atau klik **Daftar sekarang** untuk membuat akun pribadi.

Alternatif menjalankan (terminal jika PHP CLI tersedia):
```bash
cd C:\laragon\www\taskify-ukk
php -S localhost:8000
```
Buka `http://localhost:8000`. **Jangan gunakan server development PHP bawaan untuk hosting publik**, karena folder `storage` dapat diakses tanpa konfigurasi web server. Gunakan Apache yang mengikuti `.htaccess` untuk local development.

## Struktur proyek
```text
taskify-ukk/
├── index.php            # UI, layout desktop dan mobile
├── assets/
│   ├── style.css        # Desain responsive + dark mode
│   └── app.js           # UI dinamis dan panggilan REST API
├── api/
│   ├── bootstrap.php    # koneksi SQLite, skema database, seed demo, helper
│   └── index.php        # REST API CRUD, auth, statistik, settings
├── storage/
│   └── .htaccess        # blok akses file database di Apache
└── .htaccess
```

## Endpoint API
Gunakan `/api/index.php?action=...`; JSON untuk POST/PUT/PATCH/DELETE, header `X-CSRF-Token` diperoleh dari GET `session`.

| Action | Method | Fungsi |
| --- | --- | --- |
| session | GET | Data user login dan CSRF |
| register | POST | Buat akun |
| login | POST | Masuk |
| logout | POST | Keluar |
| tasks | GET / POST / PUT / PATCH / DELETE | CRUD tugas, status cepat |
| projects | GET / POST / DELETE | Kelola proyek |
| stats | GET | Statistik dashboard |
| profile | GET / PUT | Profil dan tema |

## Database / relasi
- `users (id, name, email, password, created_at)`
- `projects (id, user_id, name, color, created_at)`
- `tasks (id, user_id, project_id, title, description, status, priority, due_date, created_at, completed_at)`
- `settings (user_id, theme)`

Relasi: User **1:N** Project, User **1:N** Task, Project **1:N** Task, User **1:1** Settings.

## Catatan untuk presentasi UKK
- Frontend: HTML5, CSS3, JavaScript ES6, Fetch API.
- Backend: PHP 8+ REST API dengan sesi autentikasi.
- Database: SQLite relasional, prepared statements PDO, foreign keys.
- Alur: Browser → Fetch API → PHP → PDO/SQLite → JSON → tampilan dinamis.
- Pengujian: registrasi akun, membuat proyek, membuat tugas, edit/hapus tugas, ubah status, kalender, grafik, ekspor CSV, logout/login ulang untuk membuktikan data persist.

## Catatan keamanan untuk deployment
Akun demo dan seeding otomatis hanya untuk ujian/lokal. Sebelum dipublikasikan: hapus/ubah akun demo, gunakan HTTPS, aktifkan rate limiting login, backup DB, batasi akses ke `storage/` di Nginx/Apache, matikan error detail, dan tempatkan database di luar document root jika memungkinkan.
