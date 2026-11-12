
<?php
// ============================================================
// BAGIAN 1: KONFIGURASI KEAMANAN DASAR
// ============================================================

// Mengirim header keamanan agar browser tidak menebak
// jenis konten (MIME type) yang berbeda dari deklarasi server.
header('X-Content-Type-Options: nosniff');
?>

<!doctype html>

<!--
    BAGIAN 2: STRUKTUR DASAR WEBSITE

    <!doctype html> menandakan penggunaan HTML5.
    lang="id" menunjukkan bahasa utama website adalah Indonesia.
-->
<html lang="id">

<head>
    <!--
        BAGIAN 3: METADATA WEBSITE

        Metadata merupakan informasi tentang halaman
        yang dibaca browser.
    -->

    <!-- Mendukung karakter Unicode, termasuk emoji. -->
    <meta charset="UTF-8">

    <!--
        Mengatur viewport agar tampilan dapat disesuaikan
        dengan lebar layar perangkat.
    -->
    <meta
        name="viewport"
        content="width=device-width,initial-scale=1"
    >

    <!-- Mengatur warna tema browser yang mendukung. -->
    <meta name="theme-color" content="#f8f6fd">

    <!-- Judul yang muncul pada tab browser. -->
    <title>Fatay. — Make your day count</title>

    <!--
        BAGIAN 4: MENGHUBUNGKAN GOOGLE FONTS

        preconnect membantu browser menyiapkan koneksi
        ke server Google Fonts lebih awal.
    -->
    <link
        rel="preconnect"
        href="https://fonts.googleapis.com"
    >

    <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossorigin
    >

    <!--
        Memuat font DM Sans dan Plus Jakarta Sans
        untuk tampilan website yang modern.
    -->
    <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
    >

    <!--
        BAGIAN 5: MENGHUBUNGKAN FILE CSS

        style.css digunakan untuk mengatur:
        - Warna dan background
        - Ukuran tulisan
        - Sidebar dan dashboard
        - Tombol dan form
        - Kalender dan modal
        - Tampilan responsif

        ?v=1 adalah parameter versi untuk membantu
        pengelolaan cache browser.
    -->
    <link rel="stylesheet" href="assets/style.css?v=1">

</head>

<body>

    <!-- =====================================================
         BAGIAN 6: NOTIFIKASI WEBSITE (TOAST)
         =====================================================

         Elemen ini digunakan sebagai wadah notifikasi.

         Contoh:
         - Tugas berhasil ditambahkan
         - Perubahan berhasil disimpan
         - Terjadi kesalahan

         Isi notifikasi diatur menggunakan JavaScript.
         aria-live membantu pembaca layar mengetahui
         perubahan status.
    -->
    <div
        id="toast"
        role="status"
        aria-live="polite"
    ></div>

    <!-- =====================================================
         BAGIAN 7: HALAMAN LOGIN DAN REGISTER
         =====================================================

         id="auth" digunakan JavaScript untuk menemukan
         halaman autentikasi.

         class="hidden" menyembunyikan halaman sementara.

         JavaScript menentukan kapan halaman login
         atau dashboard harus ditampilkan.
    -->
    <div id="auth" class="auth-screen hidden">

        <!-- Elemen dekorasi background halaman login. -->
        <div class="auth-decoration"></div>

        <!-- Kartu utama untuk formulir autentikasi. -->
        <section class="auth-card">

            <!--
                BAGIAN 7.1: LOGO WEBSITE FATAY

                brand       = styling logo
                auth-brand  = styling khusus halaman login
                brand-mark  = simbol logo
                brand-dot   = titik berwarna pada logo
            -->
            <div class="brand auth-brand">

                <span class="brand-mark">◕</span>

                <span>
                    Fatay.<span class="brand-dot">.</span>
                </span>

            </div>

            <!-- BAGIAN 7.2: JUDUL HALAMAN LOGIN -->

            <!-- Teks kecil di atas judul utama. -->
            <div class="auth-eyebrow">
                YOUR PRODUCTIVITY SPACE
            </div>

            <!--
                Judul login yang bisa diganti JavaScript
                ketika pengguna berpindah ke halaman register.
            -->
            <h1 id="auth-title">
                Welcome back 👋
            </h1>

            <!-- Deskripsi halaman autentikasi. -->
            <p id="auth-caption">
                Masuk dan lanjutkan hal-hal hebat hari ini.
            </p>

            <!-- =================================================
                 BAGIAN 7.3: FORM LOGIN DAN REGISTER
                 =================================================

                 Form digunakan untuk menerima data pengguna.

                 Data yang dimasukkan:
                 - Nama lengkap (khusus register)
                 - Email
                 - Password

                 JavaScript menangani submit form dan mengirim
                 permintaan ke backend PHP.
            -->
            <form id="auth-form">

                <!--
                    INPUT NAMA LENGKAP

                    Digunakan saat registrasi akun baru.

                    class="hidden" membuat kolom ini
                    tidak terlihat saat login.
                -->
                <label id="name-field" class="hidden">

                    Nama lengkap

                    <input
                        name="name"
                        autocomplete="name"
                        placeholder="Nama kamu"
                    >

                </label>

                <!--
                    INPUT EMAIL

                    type="email" meminta format email yang valid.
                    name="email" digunakan untuk membaca nilai form.
                    required berarti input wajib diisi.

                    Backend tetap harus memvalidasi email.
                -->
                <label>

                    Email address

                    <input
                        type="email"
                        name="email"
                        autocomplete="email"
                        placeholder="nama@email.com"
                        required
                    >

                </label>

                <!--
                    INPUT PASSWORD

                    type="password" menyembunyikan karakter.
                    minlength="8" menentukan panjang minimal.
                    required berarti password wajib diisi.

                    Backend harus memeriksa password dan
                    menangani penyimpanannya secara aman.
                -->
                <label>

                    Password

                    <input
                        type="password"
                        name="password"
                        autocomplete="current-password"
                        minlength="8"
                        placeholder="Minimal 8 karakter"
                        required
                    >

                </label>

                <!--
                    TOMBOL LOGIN / REGISTER

                    type="submit" mengirim form.

                    JavaScript dapat mengganti teks tombol
                    sesuai mode login atau register.
                -->
                <button
                    class="btn primary full"
                    type="submit"
                    id="auth-submit"
                >
                    Sign in
                    <span>↗</span>
                </button>

            </form>

            <!-- =================================================
                 BAGIAN 7.4: PINDAH LOGIN KE REGISTER
                 =================================================

                 Tombol ini digunakan untuk mengganti mode
                 formulir dari login menjadi register,
                 atau sebaliknya, melalui JavaScript.
            -->
            <p class="auth-switch">

                <span id="auth-question">
                    Belum punya akun?
                </span>

                <button
                    id="auth-toggle"
                    class="text-btn"
                >
                    Daftar sekarang
                </button>

            </p>

            <!--
                BAGIAN 7.5: INFORMASI AKUN DEMO

                Digunakan untuk memudahkan pengujian UKK.

                Kredensial demo hanya cocok digunakan
                pada lingkungan demonstrasi, bukan untuk
                menampilkan akun nyata di website publik.
            -->
            <div class="demo-note">

                Akun demo:
                <strong>demo@taskify.local</strong>

                <br>

                Password:
                <strong>Demo12345!</strong>

            </div>

        </section>
    </div>

    <!-- =====================================================
         BAGIAN 8: APLIKASI UTAMA SETELAH LOGIN
         =====================================================

         id="app" adalah pembungkus seluruh dashboard.

         Elemen ini awalnya disembunyikan.

         Setelah pengguna berhasil login,
         JavaScript dapat menampilkan aplikasi utama.
    -->
    <div id="app" class="app hidden">

        <!-- =================================================
             BAGIAN 9: SIDEBAR NAVIGASI
             =================================================

             Sidebar adalah menu yang berada di sebelah kiri.

             Digunakan untuk berpindah antarhalaman
             tanpa harus membuka dokumen HTML baru.
        -->
        <aside class="sidebar">

            <!-- BAGIAN 9.1: LOGO DI SIDEBAR -->
            <div class="brand">

                <span class="brand-mark">◕</span>

                <span>
                    Fatay<span class="brand-dot">.</span>
                </span>

            </div>

            <!-- Label kelompok menu. -->
            <div class="nav-caption">
                WORKSPACE
            </div>

            <!--
                BAGIAN 9.2: MENU NAVIGASI

                Atribut data-page menentukan halaman
                yang dipilih oleh pengguna.

                JavaScript membaca data-page untuk
                mengganti konten aplikasi.
            -->
            <nav class="nav" aria-label="Menu utama">

                <!--
                    MENU DASHBOARD

                    Menampilkan ringkasan tugas,
                    proyek, statistik, dan progres.
                -->
                <button
                    data-page="dashboard"
                    class="nav-link active"
                >
                    <span class="nav-icon">▦</span>
                    Dashboard
                </button>

                <!--
                    MENU MY TASKS

                    Digunakan untuk mengelola tugas:
                    - Menambah tugas
                    - Melihat tugas
                    - Mengedit tugas
                    - Menghapus tugas
                    - Menyelesaikan tugas

                    nav-count menampilkan jumlah tugas
                    sesuai logika yang dibuat di JavaScript.
                -->
                <button
                    data-page="tasks"
                    class="nav-link"
                >
                    <span class="nav-icon">☑</span>

                    My Tasks

                    <span
                        id="nav-count"
                        class="nav-pill"
                    >
                        0
                    </span>
                </button>

                <!--
                    MENU PROJECTS

                    Digunakan untuk mengelompokkan
                    tugas berdasarkan proyek.
                -->
                <button
                    data-page="projects"
                    class="nav-link"
                >
                    <span class="nav-icon">▤</span>
                    Projects
                </button>

                <!--
                    MENU CALENDAR

                    Digunakan untuk melihat tugas
                    berdasarkan tanggal dan deadline.
                -->
                <button
                    data-page="calendar"
                    class="nav-link"
                >
                    <span class="nav-icon">▦</span>
                    Calendar
                </button>

                <!--
                    MENU REPORTS

                    Digunakan untuk menampilkan laporan
                    dan statistik produktivitas pengguna.
                -->
                <button
                    data-page="reports"
                    class="nav-link"
                >
                    <span class="nav-icon">▥</span>
                    Reports
                </button>

            </nav>

            <!-- =================================================
                 BAGIAN 9.3: MENU BAWAH SIDEBAR
                 ================================================= -->
            <div class="sidebar-bottom">

                <!--
                    KARTU MOTIVASI

                    Elemen tambahan untuk mempercantik
                    tampilan dan memberikan pesan motivasi.
                -->
                <div class="sidebar-tip">

                    <div class="tip-emoji">✦</div>

                    <strong>
                        Small steps,<br>
                        big results.
                    </strong>

                    <p>
                        Progress dimulai dari satu tugas kecil.
                    </p>

                </div>

                <!--
                    MENU SETTINGS

                    Membuka halaman pengaturan akun
                    dan preferensi aplikasi.
                -->
                <button
                    data-page="settings"
                    class="nav-link"
                >
                    <span class="nav-icon">⚙</span>
                    Settings
                </button>

                <!--
                    MENU LOGOUT

                    Digunakan untuk keluar dari akun.

                    JavaScript perlu menghubungi backend
                    agar session login diakhiri.
                -->
                <button
                    id="logout"
                    class="nav-link"
                >
                    <span class="nav-icon">↪</span>
                    Log out
                </button>

            </div>

        </aside>

        <!-- =================================================
             BAGIAN 10: WORKSPACE / KONTEN UTAMA
             =================================================

             Workspace merupakan area tengah website.

             Area ini menampilkan halaman:
             - Dashboard
             - My Tasks
             - Projects
             - Calendar
             - Reports
             - Settings
        -->
        <div class="workspace">

            <!-- BAGIAN 10.1: HEADER DASHBOARD -->
            <header class="topbar">

                <!-- Sapaan kepada pengguna. -->
                <div class="greeting">

                    <!--
                        Nama pengguna dapat diisi
                        secara dinamis oleh JavaScript.
                    -->
                    <div class="hello" id="hello">
                        Hi, there 👋
                    </div>

                    <!-- Pesan penyemangat. -->
                    <span id="subhello">
                        Let's finish your task today!
                    </span>

                </div>

                <!--
                    BAGIAN 10.2: AKSI HEADER

                    Berisi tanggal, notifikasi,
                    dan avatar pengguna.
                -->
                <div class="top-actions">

                    <!--
                        TANGGAL HARI INI

                        Awalnya kosong.
                        JavaScript dapat mengisinya
                        berdasarkan tanggal saat ini.
                    -->
                    <span
                        class="today-label"
                        id="top-date"
                    ></span>

                    <!--
                        TOMBOL NOTIFIKASI

                        Digunakan untuk mengakses informasi
                        tugas yang mendekati deadline.

                        notice-dot dapat menjadi penanda
                        adanya pemberitahuan.
                    -->
                    <button
                        class="icon-button"
                        id="notice-btn"
                        title="Tugas mendekati deadline"
                        aria-label="Lihat tugas mendekati deadline"
                    >
                        ♧

                        <span id="notice-dot"></span>
                    </button>

                    <!--
                        AVATAR PENGGUNA

                        Menampilkan inisial nama pengguna.

                        Tombol ini disiapkan sebagai
                        akses menuju pengaturan akun.
                    -->
                    <button
                        class="top-avatar"
                        id="top-avatar"
                        title="Pengaturan akun"
                        aria-label="Buka pengaturan"
                    >
                        K
                    </button>

                </div>

            </header>

            <!-- =================================================
                 BAGIAN 10.3: AREA KONTEN DINAMIS
                 =================================================

                 Elemen main adalah wadah utama halaman.

                 id="view" merupakan target JavaScript
                 untuk menampilkan berbagai halaman aplikasi.

                 Contohnya:
                 - Klik Dashboard, tampil ringkasan.
                 - Klik My Tasks, tampil daftar tugas.
                 - Klik Projects, tampil daftar proyek.

                 tabindex="-1" memungkinkan fokus
                 dipindahkan secara terprogram.

                 Konten utama sebagian besar dibuat
                 melalui file assets/app.js.
            -->
            <main
                id="view"
                tabindex="-1"
            ></main>

        </div>

        <!-- =================================================
             BAGIAN 11: RIGHTBAR / SIDEBAR KANAN
             =================================================

             Rightbar menampilkan:
             - Identitas pengguna
             - Kalender mini
             - Agenda hari ini
             - Kartu motivasi
        -->
        <aside class="rightbar">

            <!-- BAGIAN 11.1: KARTU PROFIL DAN KALENDER -->
            <div class="profile-box">

                <!-- IDENTITAS PENGGUNA -->
                <div class="mini-user">

                    <!--
                        Avatar berisi inisial pengguna.
                        Nilainya dapat diperbarui JavaScript.
                    -->
                    <div
                        class="avatar-pic"
                        id="side-avatar"
                    >
                        K
                    </div>

                    <div>

                        <!--
                            Nama pengguna yang dapat
                            diubah berdasarkan data login.
                        -->
                        <strong id="side-name">
                            Kim Namjoon
                        </strong>

                        <!-- Teks pendamping profil. -->
                        <small>
                            Productivity champion ✨
                        </small>

                    </div>

                </div>

                <!-- =================================================
                     BAGIAN 11.2: HEADER KALENDER
                     ================================================= -->
                <div class="calendar-head">

                    <!--
                        Nama bulan dan tahun.

                        Contoh: November 2026.
                        Kontennya diisi JavaScript.
                    -->
                    <strong id="mini-month"></strong>

                    <!-- Tombol navigasi bulan. -->
                    <div class="month-controls">

                        <!-- Berpindah ke bulan sebelumnya. -->
                        <button
                            id="month-prev"
                            aria-label="Bulan sebelumnya"
                        >
                            ‹
                        </button>

                        <!-- Berpindah ke bulan berikutnya. -->
                        <button
                            id="month-next"
                            aria-label="Bulan selanjutnya"
                        >
                            ›
                        </button>

                    </div>

                </div>

                <!-- =================================================
                     BAGIAN 11.3: ISI KALENDER MINI
                     =================================================

                     Elemen ini menjadi tempat JavaScript
                     membuat tampilan tanggal kalender.

                     Tanggal dapat memiliki indikator
                     berdasarkan jadwal atau tugas.
                -->
                <div
                    id="mini-calendar"
                    class="mini-calendar"
                ></div>

                <!-- =================================================
                     BAGIAN 11.4: JUDUL AGENDA HARI INI
                     ================================================= -->
                <div class="schedule-title">

                    <span>
                        Today's agenda
                    </span>

                    <!--
                        Tombol untuk membuka formulir
                        penambahan tugas.
                    -->
                    <button
                        class="more-link"
                        id="agenda-add"
                    >
                        + Add Task
                    </button>

                </div>

                <!-- =================================================
                     BAGIAN 11.5: DAFTAR AGENDA
                     =================================================

                     Tempat menampilkan tugas dan jadwal
                     yang relevan dengan agenda hari ini.

                     Kontennya dibuat oleh JavaScript
                     berdasarkan data yang tersedia.
                -->
                <div
                    id="agenda"
                    class="agenda"
                ></div>

            </div>

            <!-- =================================================
                 BAGIAN 12: KARTU MOTIVASI
                 =================================================

                 Kartu ini digunakan untuk:
                 - Memberikan motivasi kepada pengguna
                 - Mempercantik dashboard
                 - Memberikan akses cepat membuat tugas
            -->
            <div class="focus-card">

                <!-- Hiasan berbentuk bintang. -->
                <span class="focus-stars">
                    ✦ ✧
                </span>

                <!-- Ilustrasi dekoratif. -->
                <div class="focus-illustration">
                    ◉
                </div>

                <!-- Judul kartu motivasi. -->
                <h3>
                    Stay focused,<br>
                    stay inspired.
                </h3>

                <!-- Deskripsi motivasi. -->
                <p>
                    Setiap checklist membawa kamu selangkah
                    lebih dekat ke tujuan.
                </p>

                <!--
                    Tombol membuat tugas baru.

                    JavaScript dapat membuka modal
                    penambahan tugas saat diklik.
                -->
                <button id="focus-add">
                    + Create a task
                </button>

            </div>

            <!-- =================================================
                 BAGIAN 13: KUTIPAN MOTIVASI
                 =================================================

                 Menampilkan kutipan untuk membuat
                 pengalaman pengguna lebih menarik.
            -->
            <div class="quote">

                “The secret of getting ahead is getting started.”

                <small>
                    — Mark Twain
                </small>

            </div>

        </aside>

    </div>

    <!-- =====================================================
         BAGIAN 14: MODAL / POPUP FORMULIR
         =====================================================

         Modal adalah dialog yang muncul di atas halaman.

         Digunakan sebagai wadah formulir, misalnya:
         - Menambahkan tugas
         - Mengedit tugas
         - Menambahkan proyek
         - Mengedit proyek

         class="hidden" menyembunyikan modal ketika
         tidak sedang digunakan.
    -->
    <div
        class="modal-overlay hidden"
        id="modal"
    >

        <!--
            BAGIAN 14.1: KARTU MODAL

            role="dialog" menandakan elemen dialog.

            aria-modal="true" memberi informasi
            bahwa dialog bersifat modal.

            aria-labelledby menghubungkan dialog
            dengan judul modal.
        -->
        <div
            class="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >

            <!-- BAGIAN 14.2: HEADER MODAL -->
            <div class="modal-header">

                <div>

                    <!-- Label jenis formulir. -->
                    <small id="modal-eyebrow">
                        TASK MANAGEMENT
                    </small>

                    <!--
                        Judul modal.

                        Bisa berubah berdasarkan aksi,
                        misalnya New Task atau Edit Task.
                    -->
                    <h2 id="modal-title">
                        New task
                    </h2>

                </div>

                <!-- Tombol untuk menutup modal. -->
                <button
                    id="modal-close"
                    class="close-btn"
                    aria-label="Tutup"
                >
                    ×
                </button>

            </div>

            <!-- =================================================
                 BAGIAN 14.3: ISI MODAL DINAMIS
                 =================================================

                 Wadah untuk formulir yang dibuat
                 melalui JavaScript.

                 Isi dapat berubah sesuai tindakan
                 yang sedang dilakukan pengguna.
            -->
            <div id="modal-body"></div>

        </div>

    </div>

    <!-- =====================================================
         BAGIAN 15: MENGHUBUNGKAN JAVASCRIPT
         =====================================================

         File app.js bertanggung jawab untuk:
         - Menangani interaksi tombol
         - Login dan register melalui API
         - Menampilkan halaman secara dinamis
         - Mengelola tugas dan proyek
         - Mengirim data ke backend PHP
         - Memperbarui kalender dan agenda
         - Menampilkan notifikasi

         defer membuat skrip dieksekusi setelah
         HTML selesai diparsing.

         ?v=1 digunakan sebagai parameter versi
         untuk membantu pengelolaan cache.
    -->
    <script src="assets/app.js?v=1" defer></script>

</body>

</html>