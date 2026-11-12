
/* ==========================================================
   FATAY — JAVASCRIPT FRONTEND
   File: assets/app.js

   FUNGSI UTAMA:
   1. Login dan register
   2. Menghubungkan frontend dengan API PHP
   3. Menampilkan dashboard dan statistik
   4. Mengelola tugas (CRUD)
   5. Mengelola proyek
   6. Menampilkan kalender
   7. Membuat laporan CSV
   8. Mengatur profil dan tema

   JavaScript berjalan di browser, sedangkan PHP
   bertanggung jawab memproses dan menyimpan data.
========================================================== */

"use strict";

// ==========================================================
// BAGIAN 1 — MENGAMBIL ELEMEN HTML
// ==========================================================

// $ digunakan untuk mengambil satu elemen HTML.
// $$ digunakan untuk mengambil banyak elemen HTML.

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

// ==========================================================
// BAGIAN 2 — KEAMANAN TEKS HTML
// ==========================================================

// Fungsi esc() mengubah karakter khusus menjadi HTML entity.
// Tujuannya membantu mencegah HTML injection dan XSS
// ketika data pengguna ditampilkan melalui innerHTML.

const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );

// ==========================================================
// BAGIAN 3 — PENGOLAHAN TANGGAL
// ==========================================================

// Mengubah tanggal JavaScript menjadi format YYYY-MM-DD.

const localDate = (d) => {
  const x = new Date(d);

  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

// Mengubah tanggal database menjadi tanggal bahasa Indonesia.

const fmt = (iso) =>
  iso
    ? new Date(`${iso}T12:00:00`).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "No deadline";

// Mengambil tanggal hari ini.

const today = () => localDate(new Date());

// ==========================================================
// BAGIAN 4 — STATE APLIKASI
// ==========================================================

// State menyimpan kondisi dan data sementara di browser.
//
// user         = pengguna yang login
// csrf         = token keamanan request
// tasks        = daftar tugas
// projects     = daftar proyek
// stats        = statistik produktivitas
// page         = halaman aktif
// search       = kata pencarian
// status       = filter status tugas
// project      = filter proyek
// month        = bulan kalender
// selectedDate = tanggal terpilih
// theme        = light atau dark
// authRegister = mode login atau register

const state = {
  user: null,
  csrf: "",
  tasks: [],
  projects: [],
  stats: null,
  page: "dashboard",
  search: "",
  status: "all",
  project: "all",
  month: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  selectedDate: today(),
  theme: "light",
  authRegister: false,
};

// ==========================================================
// BAGIAN 5 — NOTIFIKASI WEBSITE
// ==========================================================

// notify() digunakan untuk menampilkan pesan singkat.
//
// Contoh:
// - Tugas berhasil ditambahkan
// - Pengaturan tersimpan
// - Login gagal
//
// Pesan otomatis hilang setelah 3,2 detik.

let toastTimer;

function notify(msg, error = false) {
  const el = $("#toast");

  el.textContent = msg;
  el.className = (error ? "error " : "") + "show";

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => (el.className = ""), 3200);
}

// ==========================================================
// BAGIAN 6 — KOMUNIKASI FRONTEND DAN BACKEND
// ==========================================================

// api() mengirim permintaan ke api/index.php.
//
// GET    = mengambil data
// POST   = membuat data
// PUT    = memperbarui data
// PATCH  = memperbarui sebagian data
// DELETE = menghapus data
//
// fetch() merupakan fitur JavaScript untuk HTTP request.
// JSON digunakan sebagai format pertukaran data.
// CSRF Token membantu melindungi request perubahan data.

async function api(action, method = "GET", data, query = "") {
  const opts = {
    method,
    credentials: "same-origin",
    headers: {},
  };

  if (method !== "GET") {
    opts.headers["Content-Type"] = "application/json";
    opts.headers["X-CSRF-Token"] = state.csrf;
    opts.body = JSON.stringify(data ?? {});
  }

  let response;

  try {
    response = await fetch(
      `api/index.php?action=${encodeURIComponent(action)}${query}`,
      opts,
    );
  } catch {
    throw Error("Koneksi gagal. Pastikan server PHP/Laragon aktif.");
  }

  let json;

  try {
    json = await response.json();
  } catch {
    throw Error("Respons server tidak valid. Cek PHP error log.");
  }

  if (!response.ok) {
    if (response.status === 401) {
      state.user = null;
      showAuth();
    }

    throw Error(json.error || "Permintaan gagal");
  }

  return json;
}

// ==========================================================
// BAGIAN 7 — INISIAL NAMA PENGGUNA
// ==========================================================

// initials() mengambil huruf pertama dari maksimal dua kata.
//
// Contoh:
// Fhaty Bintang Tyaga -> FB
//
// Hasilnya digunakan pada avatar pengguna.

function initials(name) {
  return String(name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join("");
}

// ==========================================================
// BAGIAN 8 — MENAMPILKAN LOGIN ATAU DASHBOARD
// ==========================================================

// showAuth() menyembunyikan dashboard dan menampilkan login.

function showAuth() {
  $("#app").classList.add("hidden");
  $("#auth").classList.remove("hidden");
}

// showApp() menampilkan dashboard setelah login.
// Nama, avatar, dan tanggal diperbarui berdasarkan data pengguna.

function showApp() {
  $("#auth").classList.add("hidden");
  $("#app").classList.remove("hidden");

  $("#hello").textContent = `Hi, ${state.user.name.split(" ")[0]} 👋`;

  $("#side-name").textContent = state.user.name;

  $("#side-avatar").textContent = initials(state.user.name);

  $("#top-avatar").textContent = initials(state.user.name);

  $("#top-date").textContent = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

// ==========================================================
// BAGIAN 9 — MEMUAT ULANG DATA DARI BACKEND
// ==========================================================

// reload() mengambil data tugas, proyek, dan statistik.
//
// Promise.all() menjalankan tiga request secara bersamaan.
//
// Setelah data diperoleh:
// 1. Memperbarui state
// 2. Memperbarui jumlah tugas di sidebar
// 3. Memeriksa tugas yang mendekati deadline
// 4. Memperbarui tampilan aplikasi

async function reload() {
  const [t, p, s] = await Promise.all([
    api("tasks"),
    api("projects"),
    api("stats"),
  ]);

  state.tasks = t.tasks;
  state.projects = p.projects;
  state.stats = s;

  $("#nav-count").textContent = state.tasks.filter(
    (x) => x.status !== "done",
  ).length;

  $("#notice-dot").style.display = state.tasks.some(
    (x) => x.due_date && x.due_date <= today() && x.status !== "done",
  )
    ? "block"
    : "none";

  render();
}

// ==========================================================
// BAGIAN 10 — MEMULAI APLIKASI
// ==========================================================

// start() berjalan ketika website pertama kali dibuka.
//
// Memeriksa session pengguna melalui backend.
// Jika belum login, halaman login ditampilkan.
// Jika sudah login, dashboard dan data pengguna dimuat.

async function start() {
  try {
    const sess = await api("session");

    state.csrf = sess.csrf;
    state.user = sess.user;

    if (!state.user) {
      showAuth();
      return;
    }

    showApp();

    const pref = await api("profile");

    state.theme = pref.settings.theme;

    document.body.classList.toggle("dark", state.theme === "dark");

    await reload();
  } catch (e) {
    notify(e.message, true);
    showAuth();
  }
}

// ==========================================================
// BAGIAN 11 — NAVIGASI HALAMAN
// ==========================================================

// go() digunakan untuk berpindah menu tanpa reload browser.
//
// Contoh:
// go("dashboard") membuka dashboard.
// go("tasks") membuka daftar tugas.
//
// Filter pencarian direset ketika berpindah halaman.

function go(page) {
  state.page = page;
  state.search = "";
  state.status = "all";
  state.project = "all";

  $$("[data-page]").forEach((b) =>
    b.classList.toggle("active", b.dataset.page === page),
  );

  render();

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

// ==========================================================
// BAGIAN 12 — MENAMPILKAN HALAMAN DINAMIS
// ==========================================================

// render() memilih tampilan sesuai halaman yang aktif.
//
// Setiap menu dihubungkan dengan fungsi pembuat HTML.
// Hasilnya dimasukkan ke elemen <main id="view">.
//
// Cara ini membuat aplikasi seperti Single Page Application.

function render() {
  if (!state.user) return;

  const views = {
    dashboard: dashboard,
    tasks: tasksPage,
    projects: projectsPage,
    calendar: calendarPage,
    reports: reportsPage,
    settings: settingsPage,
  };

  $("#view").innerHTML = (views[state.page] || dashboard)();

  renderRightbar();
  bindView();
}

// ==========================================================
// BAGIAN 13 — MENGHITUNG PERSENTASE
// ==========================================================

// Rumus:
// (jumlah tugas selesai / jumlah seluruh tugas) x 100
//
// Jika total tugas nol, hasilnya langsung nol.

function percentage(done, total) {
  return total ? Math.round((done / total) * 100) : 0;
}

// ==========================================================
// BAGIAN 14 — KARTU PROYEK
// ==========================================================

// projectCard() membuat tampilan satu kartu proyek.
//
// Informasi yang ditampilkan:
// - Nama proyek
// - Tanggal dibuat
// - Jumlah tugas
// - Progress bar
// - Persentase penyelesaian
// - Jumlah tugas tersisa

function projectCard(p) {
  const pct = percentage(+p.done_tasks, +p.total_tasks);

  return `
    <article
      class="project-card"
      data-open-project="${p.id}"
      tabindex="0"
      role="button"
      aria-label="Lihat proyek ${esc(p.name)}"
    >
      <div class="project-date">
        ${fmt((p.created_at || "").slice(0, 10))}
      </div>

      <h3>${esc(p.name)}</h3>

      <small>${p.total_tasks} tasks in this project</small>

      <div class="progress-track" style="--bar:${esc(p.color)}">
        <div style="width:${pct}%"></div>
      </div>

      <div class="progress-meta">
        <span>Progress</span>
        <strong>${pct}%</strong>
      </div>

      <div class="project-avatars">
        <span class="tiny-avatar">
          ${initials(state.user.name)}
        </span>

        <span class="project-pill">
          ${p.total_tasks - p.done_tasks} remaining
        </span>
      </div>
    </article>
  `;
}

// ==========================================================
// BAGIAN 15 — KARTU STATISTIK
// ==========================================================

// statsCards() menampilkan:
// 1. Total seluruh tugas
// 2. Jumlah tugas selesai
// 3. Jumlah tugas yang sedang dikerjakan

function statsCards() {
  const s = state.stats?.summary || {};

  return `
    <div class="stat-grid">
      <div class="stat-card">
        <span class="stat-icon">◫</span>
        <strong>${+s.total || 0}</strong>
        <span>Total tasks</span>
      </div>

      <div class="stat-card">
        <span class="stat-icon">◉</span>
        <strong>${+s.done || 0}</strong>
        <span>Completed tasks</span>
      </div>

      <div class="stat-card">
        <span class="stat-icon">◷</span>
        <strong>${+s.progress || 0}</strong>
        <span>In progress</span>
      </div>
    </div>
  `;
}

// ==========================================================
// BAGIAN 16 — GRAFIK PRODUKTIVITAS MINGGUAN
// ==========================================================

// weeklyChart() membuat diagram batang dari data statistik.
//
// Data berasal dari API stats.
// Tinggi batang menyesuaikan jumlah tugas yang diselesaikan.
// Grafik dibuat menggunakan HTML dan CSS.

function weeklyChart() {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const map = Object.fromEntries(
    (state.stats?.weekly || []).map((x) => [+x.weekday, +x.count]),
  );

  const now = new Date();

  const arr = Array.from({ length: 7 }, (_, i) => {
    let d = new Date(now);

    d.setDate(now.getDate() - (6 - i));

    return {
      label: days[d.getDay()],
      count: map[d.getDay()] || 0,
    };
  });

  const max = Math.max(...arr.map((d) => d.count), 1);

  return `
    <div
      class="weekly-chart"
      aria-label="Grafik tugas selesai selama 7 hari terakhir"
    >
      ${arr.map((d) => `
        <div class="chart-column">
          <div
            class="chart-bar"
            title="${d.count} tugas selesai"
            style="--h:${Math.max(5, (d.count / max) * 87)}%"
          ></div>

          <small>${d.label}</small>
        </div>
      `).join("")}
    </div>
  `;
}

// ==========================================================
// BAGIAN 17 — MENAMPILKAN SATU BARIS TUGAS
// ==========================================================

// taskRow() membuat tampilan satu tugas.
//
// Fitur yang disiapkan:
// - Checkbox untuk menyelesaikan tugas
// - Judul tugas
// - Nama proyek
// - Deadline
// - Status
// - Prioritas
// - Tombol edit
//
// Overdue berarti deadline sudah lewat
// dan tugas belum selesai.

function taskRow(t) {
  const done = t.status === "done";

  const overdue = t.due_date && t.due_date < today() && !done;

  return `
    <div class="list-task">
      <button
        class="task-checkbox ${done ? "checked" : ""}"
        data-toggle-task="${t.id}"
        title="${done ? "Tandai belum selesai" : "Tandai selesai"}"
        aria-label="Ubah status ${esc(t.title)}"
      >
        ${done ? "✓" : ""}
      </button>

      <div class="task-copy">
        <strong class="${done ? "done" : ""}">
          ${esc(t.title)}
        </strong>

        <small>
          ${esc(t.project_name || "Personal")}
          &nbsp;·&nbsp;
          ${fmt(t.due_date)}

          ${overdue
            ? '&nbsp;·&nbsp; <span style="color:#d75c79">Overdue</span>'
            : ""}

          &nbsp;·&nbsp;

          ${t.status === "progress"
            ? "In Progress"
            : done
              ? "Completed"
              : "To do"}
        </small>
      </div>

      <span class="priority ${esc(t.priority)}">
        ${{ high: "High", medium: "Medium", low: "Low" }[t.priority] || "Medium"}
      </span>

      <button
        class="task-edit"
        data-edit-task="${t.id}"
        aria-label="Edit tugas"
      >
        ✎
      </button>
    </div>
  `;
}

// ==========================================================
// BAGIAN 18 — HALAMAN DASHBOARD
// ==========================================================

// dashboard() membuat seluruh tampilan halaman utama.
//
// Bagian yang ditampilkan:
// - Hero/banner motivasi
// - Tombol tambah tugas
// - Statistik
// - Tiga proyek teratas
// - Grafik produktivitas
// - Lima tugas terbaru

function dashboard() {
  const recent = state.tasks.slice(0, 5);
  const p = state.projects.slice(0, 3);
  const s = state.stats?.summary || {};

  return `
    <section class="hero">
      <div>
        <span class="hero-overline">
          ✦ YOUR DAILY WORKSPACE
        </span>

        <h1>
          Today is a great day<br>
          to get things done.
        </h1>

        <p>Stay on track, make progress, and shine! ✨</p>

        <button class="btn primary" data-add-task>
          + Add new task <span>↗</span>
        </button>
      </div>

      <div class="hero-art" aria-hidden="true">
        <div class="art-orbit"></div>
        <div class="art-check">✓</div>
        <div class="art-spark">✦</div>
        <div class="art-mini">▤ ✧</div>
      </div>
    </section>

    ${statsCards()}

    <div class="section-row">
      <div>
        <h2>My Projects</h2>
        <p>Keep everything organized in one place</p>
      </div>

      <button class="view-all" data-nav="projects">
        View all ↗
      </button>
    </div>

    <section class="project-cards">
      ${p.length
        ? p.map(projectCard).join("")
        : '<div class="empty">Belum ada proyek. Buat proyek pertamamu!</div>'}
    </section>

    <section class="dashboard-bottom">
      <div class="panel">
        <div class="section-row" style="margin:0">
          <div>
            <h3>Tasks Progress</h3>
            <p>Your completed tasks this week</p>
          </div>

          <span class="project-pill">Weekly</span>
        </div>

        ${weeklyChart()}

        <div class="report-line">
          <span>Overall completion</span>
          <b>${percentage(+s.done, +s.total)}%</b>
        </div>
      </div>

      <div class="panel">
        <div class="section-row" style="margin:0 0 8px">
          <div>
            <h3>Recent Tasks</h3>
            <p>${s.done || 0}/${s.total || 0} completed</p>
          </div>

          <button class="view-all" data-nav="tasks">
            View all ↗
          </button>
        </div>

        ${recent.length
          ? recent.map(taskRow).join("")
          : '<div class="empty"><span class="empty-icon">✧</span>Belum ada tugas.</div>'}
      </div>
    </section>
  `;
}

// ==========================================================
// BAGIAN 19 — HALAMAN MY TASKS
// ==========================================================

// tasksPage() menampilkan daftar seluruh pekerjaan.
//
// Mendukung:
// - Pencarian berdasarkan judul atau deskripsi
// - Filter status
// - Filter proyek
// - Menambah tugas
// - Mengubah dan menyelesaikan tugas

function tasksPage() {
  let list = state.tasks.filter(
    (t) =>
      (state.status === "all" || t.status === state.status) &&
      (state.project === "all" || String(t.project_id) === state.project) &&
      (!state.search ||
        (t.title + " " + t.description)
          .toLowerCase()
          .includes(state.search.toLowerCase())),
  );

  return `
    <div class="page-title">
      <div>
        <h1>My Tasks ✦</h1>
        <p>Kelola semua pekerjaanmu dengan lebih mudah.</p>
      </div>

      <button class="btn primary" data-add-task>
        + New Task
      </button>
    </div>

    <div class="toolbar">
      <input
        id="task-search"
        class="searchbox"
        value="${esc(state.search)}"
        placeholder="⌕  Search tasks..."
      >

      <select id="project-filter" class="selectbox">
        <option value="all">All projects</option>

        ${state.projects.map((p) => `
          <option
            value="${p.id}"
            ${state.project === String(p.id) ? "selected" : ""}
          >
            ${esc(p.name)}
          </option>
        `).join("")}
      </select>
    </div>

    <div class="filter-tabs">
      ${[
        ["all", "All tasks"],
        ["todo", "To do"],
        ["progress", "In progress"],
        ["done", "Completed"],
      ].map(([v, l]) => `
        <button
          class="filter-tab ${state.status === v ? "active" : ""}"
          data-filter="${v}"
        >
          ${l}
        </button>
      `).join("")}
    </div>

    <section class="task-panel" id="tasks-results">
      ${list.length
        ? list.map(taskRow).join("")
        : '<div class="empty"><span class="empty-icon">☑</span>Tidak ada tugas yang cocok dengan filter.</div>'}
    </section>
  `;
}

// ==========================================================
// BAGIAN 20 — HALAMAN PROJECTS
// ==========================================================

// projectsPage() menampilkan semua proyek.
//
// Pengguna dapat:
// - Membuat proyek baru
// - Melihat jumlah tugas
// - Melihat persentase progres
// - Membuka tugas suatu proyek
// - Menghapus proyek

function projectsPage() {
  return `
    <div class="page-title">
      <div>
        <h1>Projects ✦</h1>
        <p>Organize your ideas, track your progress.</p>
      </div>

      <button class="btn primary" data-add-project>
        + New Project
      </button>
    </div>

    <div class="project-management">
      ${state.projects.map((p) => `
        <div>
          <div
            class="project-card"
            data-open-project="${p.id}"
          >
            <div class="project-date">PROJECT</div>

            <h3>${esc(p.name)}</h3>

            <small>${p.total_tasks} tasks</small>

            <div
              class="progress-track"
              style="--bar:${esc(p.color)}"
            >
              <div
                style="width:${percentage(+p.done_tasks, +p.total_tasks)}%"
              ></div>
            </div>

            <div class="progress-meta">
              <span>${p.done_tasks} completed</span>

              <strong>
                ${percentage(+p.done_tasks, +p.total_tasks)}%
              </strong>
            </div>

            <div class="project-actions">
              <span class="project-pill">
                Manage tasks ↗
              </span>

              <button
                class="small-icon-btn"
                data-delete-project="${p.id}"
                title="Hapus proyek"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      `).join("") || '<div class="empty">Belum ada proyek.</div>'}
    </div>
  `;
}

// ==========================================================
// BAGIAN 21 — HALAMAN CALENDAR
// ==========================================================

// calendarPage() membuat halaman kalender utama.
// bigCalendar() membuat isi tanggal dan tugasnya.

function calendarPage() {
  return `
    <div class="page-title">
      <div>
        <h1>Calendar ✦</h1>
        <p>Jadwal tugas dan tenggat dalam satu kalender.</p>
      </div>

      <button class="btn primary" data-add-task>
        + Add Task
      </button>
    </div>

    <div class="panel calendar-layout">
      <div class="section-row" style="margin:0">
        <h2>
          ${state.month.toLocaleDateString("id-ID", {
            month: "long",
            year: "numeric",
          })}
        </h2>

        <div>
          <button
            class="btn secondary"
            data-change-month="-1"
          >‹</button>

          <button
            class="btn secondary"
            data-change-month="1"
          >›</button>
        </div>
      </div>

      ${bigCalendar()}
    </div>
  `;
}

// ==========================================================
// BAGIAN 22 — MEMBUAT ISI KALENDER BULANAN
// ==========================================================

// Menghitung jumlah hari dalam bulan yang dipilih.
// Menyesuaikan posisi hari pertama.
// Menampilkan maksimal tiga tugas pada setiap tanggal.

function bigCalendar() {
  const m = state.month;

  const first =
    (new Date(m.getFullYear(), m.getMonth(), 1).getDay() + 6) % 7;

  const total =
    new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();

  const week = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

  let html = week
    .map((w) => `<div class="month-weekday">${w}</div>`)
    .join("");

  for (let i = 0; i < first; i++) {
    html += '<div class="month-day ghost"></div>';
  }

  for (let day = 1; day <= total; day++) {
    let d = localDate(
      new Date(m.getFullYear(), m.getMonth(), day),
    );

    let items = state.tasks.filter(
      (t) => t.due_date === d,
    );

    html += `
      <div class="month-day ${d === today() ? "today" : ""}">
        <span class="day-number">${day}</span>

        ${items.slice(0, 3).map((t) => `
          <button
            class="day-task"
            data-edit-task="${t.id}"
            title="${esc(t.title)}"
          >
            ${esc(t.title)}
          </button>
        `).join("")}

        ${items.length > 3
          ? `<small class="muted">+${items.length - 3} lainnya</small>`
          : ""}
      </div>
    `;
  }

  return `<div class="month-grid">${html}</div>`;
}

// ==========================================================
// BAGIAN 23 — HALAMAN LAPORAN
// ==========================================================

// reportsPage() menampilkan analisis produktivitas.
//
// Data yang disajikan:
// - Total tugas
// - Tingkat penyelesaian
// - Tugas sedang berjalan
// - Tugas belum dikerjakan
// - Tugas terlambat
// - Grafik mingguan
// - Progres proyek
//
// Tombol Export CSV mengunduh daftar tugas.

function reportsPage() {
  const s = state.stats?.summary || {};

  const pct = percentage(+s.done, +s.total);

  return `
    <div class="page-title">
      <div>
        <h1>Reports & Insights ✦</h1>
        <p>Pantau produktivitas dan pencapaianmu.</p>
      </div>

      <button class="btn secondary" id="export-csv">
        ↓ Export CSV
      </button>
    </div>

    ${statsCards()}

    <div class="report-grid">
      <div class="panel">
        <h3>Completion rate</h3>

        <div class="donut" style="--pct:${pct}%">
          <span>${pct}%</span>
        </div>

        <div class="report-line">
          <span>
            <i class="report-dot" style="background:#9360d4"></i>
            Done
          </span>
          <b>${s.done || 0}</b>
        </div>

        <div class="report-line">
          <span>
            <i class="report-dot" style="background:#ecb578"></i>
            In progress
          </span>
          <b>${s.progress || 0}</b>
        </div>

        <div class="report-line">
          <span>
            <i class="report-dot" style="background:#c8b5e1"></i>
            To do
          </span>
          <b>${s.todo || 0}</b>
        </div>

        <div class="report-line">
          <span>
            <i class="report-dot" style="background:#ec859f"></i>
            Overdue
          </span>
          <b>${s.overdue || 0}</b>
        </div>
      </div>

      <div class="panel">
        <h3>Weekly productivity</h3>

        ${weeklyChart()}

        <p class="muted" style="font-size:11px;line-height:1.8">
          Grafik ini menunjukkan tugas yang selesai pada
          7 hari terakhir berdasarkan tanggal penyelesaian.
        </p>
      </div>

      <div class="panel" style="grid-column:1/-1">
        <h3>Project progress</h3>

        ${state.projects.length
          ? state.projects.map((p) => `
            <div style="margin-bottom:19px">
              <div class="report-line" style="margin:0">
                <strong>${esc(p.name)}</strong>

                <b>
                  ${percentage(+p.done_tasks, +p.total_tasks)}%
                </b>
              </div>

              <div
                class="progress-track"
                style="--bar:${esc(p.color)}"
              >
                <div
                  style="width:${percentage(+p.done_tasks, +p.total_tasks)}%"
                ></div>
              </div>
            </div>
          `).join("")
          : '<div class="empty">Belum ada proyek.</div>'}
      </div>
    </div>
  `;
}

// ==========================================================
// BAGIAN 24 — HALAMAN SETTINGS
// ==========================================================

// settingsPage() membuat halaman pengaturan pengguna.
//
// Berisi:
// - Nama lengkap
// - Email akun
// - Pilihan light mode / dark mode
// - Tombol menyimpan pengaturan
// - Tombol logout
// - Informasi aplikasi

function settingsPage() {
  return `
    <div class="page-title">
      <div>
        <h1>Settings ✦</h1>
        <p>Sesuaikan ruang produktivitasmu.</p>
      </div>
    </div>

    <section class="panel settings-card">
      <h3 class="settings-head">Your profile</h3>

      <form id="settings-form">
        <label class="field">
          Nama lengkap

          <input
            name="name"
            required
            minlength="2"
            maxlength="80"
            value="${esc(state.user.name)}"
          >
        </label>

        <label class="field">
          Email

          <input
            value="${esc(state.user.email)}"
            disabled
          >
        </label>

        <label class="field">
          Appearance

          <select name="theme">
            <option
              value="light"
              ${state.theme === "light" ? "selected" : ""}
            >
              ☀ Light mode
            </option>

            <option
              value="dark"
              ${state.theme === "dark" ? "selected" : ""}
            >
              ☾ Dark mode
            </option>
          </select>
        </label>

        <button class="btn primary" type="submit">
          Save changes
        </button>
      </form>

      <button
        class="btn danger"
        style="margin-top:18px"
        id="logout-mobile"
      >
        ↪ Log out
      </button>
    </section>

    <div class="panel settings-card" style="margin-top:17px">
      <h3>About Fatay</h3>

      <p class="muted" style="line-height:1.8">
        Fatay adalah aplikasi manajemen tugas full-stack
        berbasis PHP, SQLite dan JavaScript.
        Dibuat sebagai project UKK dengan fitur CRUD,
        login, dashboard, kalender, dan laporan.
      </p>
    </div>
  `;
}

// ==========================================================
// BAGIAN 25 — KALENDER MINI DI SIDEBAR KANAN
// ==========================================================

// renderRightbar() menampilkan kalender dan agenda.
//
// Tanggal yang memiliki tugas diberi indikator.
// Ketika tanggal diklik, agenda pada tanggal itu ditampilkan.
//
// Jam agenda dihitung sebagai urutan tampilan,
// bukan waktu kegiatan asli dari database.

function renderRightbar() {
  const m = state.month;

  const first =
    (new Date(m.getFullYear(), m.getMonth(), 1).getDay() + 6) % 7;

  const total =
    new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();

  $("#mini-month").textContent = m.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  let html = ["M", "T", "W", "T", "F", "S", "S"]
    .map((x) => `<div class="cal-weekday">${x}</div>`)
    .join("");

  for (let i = 0; i < first; i++) {
    html += "<span></span>";
  }

  for (let d = 1; d <= total; d++) {
    const date = localDate(
      new Date(m.getFullYear(), m.getMonth(), d),
    );

    const hasTask = state.tasks.some(
      (t) => t.due_date === date,
    );

    html += `
      <button
        class="cal-day
          ${date === today() ? "current" : ""}
          ${date === state.selectedDate ? "selected" : ""}
          ${hasTask ? "has-task" : ""}"
        data-select-date="${date}"
      >
        ${d}
      </button>
    `;
  }

  $("#mini-calendar").innerHTML = html;

  let tasks = state.tasks.filter(
    (t) => t.due_date === state.selectedDate,
  );

  $("#agenda").innerHTML = tasks.length
    ? tasks.slice(0, 5).map((t, i) => `
        <div class="agenda-item">
          <span class="agenda-time">
            ${String(i + 9).padStart(2, "0")}:00
          </span>

          <div class="agenda-content">
            <strong>${esc(t.title)}</strong>

            <small>
              ${esc(t.project_name || "Personal")} ·
              ${t.status === "done" ? "Done" : "Scheduled"}
            </small>
          </div>
        </div>
      `).join("")
    : '<div class="empty-agenda">No tasks on this day ☕</div>';
}

// ==========================================================
// BAGIAN 26 — EVENT INPUT PADA HALAMAN
// ==========================================================

// bindView() memasang event listener pada elemen dinamis.
//
// Event listener digunakan untuk merespons tindakan pengguna.
//
// Contoh:
// - Mengetik pada pencarian
// - Mengganti filter proyek
// - Menyimpan form pengaturan

function bindView() {
  const s = $("#task-search");

  if (s) {
    s.addEventListener("input", (e) => {
      state.search = e.target.value;

      const filtered = state.tasks.filter(
        (t) =>
          (state.status === "all" || t.status === state.status) &&
          (state.project === "all" ||
            String(t.project_id) === state.project) &&
          (!state.search ||
            (t.title + " " + t.description)
              .toLowerCase()
              .includes(state.search.toLowerCase())),
      );

      $("#tasks-results").innerHTML =
        filtered.map(taskRow).join("") ||
        '<div class="empty">Tidak ada tugas yang cocok.</div>';
    });
  }

  const pf = $("#project-filter");

  if (pf) {
    pf.addEventListener("change", (e) => {
      state.project = e.target.value;
      render();
    });
  }

  const settings = $("#settings-form");

  if (settings) {
    settings.addEventListener("submit", saveSettings);
  }
}

// ==========================================================
// BAGIAN 27 — MEMBUKA DAN MENUTUP MODAL
// ==========================================================

// Modal adalah popup untuk menampilkan formulir.
//
// openModal() menerima:
// title   = judul modal
// eyebrow = label kecil modal
// body    = isi HTML formulir

function openModal(title, eyebrow, body) {
  $("#modal-title").textContent = title;
  $("#modal-eyebrow").textContent = eyebrow;
  $("#modal-body").innerHTML = body;

  $("#modal").classList.remove("hidden");

  setTimeout(() => $("#modal input")?.focus(), 30);
}

// closeModal() menyembunyikan modal.

function closeModal() {
  $("#modal").classList.add("hidden");
}

// ==========================================================
// BAGIAN 28 — FORM TAMBAH, EDIT, DAN HAPUS TUGAS
// ==========================================================

// taskForm() digunakan untuk operasi CRUD tugas.
//
// Jika parameter t kosong:
//   Membuka form untuk menambahkan tugas.
//
// Jika parameter t berisi objek tugas:
//   Membuka form edit tugas.
//
// Informasi formulir:
// - Judul
// - Deskripsi
// - Proyek
// - Deadline
// - Prioritas
// - Status

function taskForm(t = null) {
  const projectOptions = state.projects
    .map((p) => `
      <option
        value="${p.id}"
        ${t?.project_id == p.id ? "selected" : ""}
      >
        ${esc(p.name)}
      </option>
    `)
    .join("");

  openModal(
    t ? "Edit task" : "Create new task",
    "TASK MANAGEMENT",
    `
      <form id="task-form">
        <label class="field">
          Task title *

          <input
            name="title"
            required
            minlength="2"
            maxlength="160"
            placeholder="What needs to get done?"
            value="${esc(t?.title || "")}"
          >
        </label>

        <label class="field">
          Description

          <textarea
            name="description"
            maxlength="3000"
            placeholder="Add some details..."
          >${esc(t?.description || "")}</textarea>
        </label>

        <div class="form-grid">
          <label class="field">
            Project

            <select name="project_id">
              <option value="">Personal / None</option>
              ${projectOptions}
            </select>
          </label>

          <label class="field">
            Due date

            <input
              type="date"
              name="due_date"
              value="${esc(t?.due_date || today())}"
            >
          </label>

          <label class="field">
            Priority

            <select name="priority">
              ${[
                ["low", "Low"],
                ["medium", "Medium"],
                ["high", "High"],
              ].map(([v, l]) => `
                <option
                  value="${v}"
                  ${(t?.priority || "medium") === v ? "selected" : ""}
                >
                  ${l}
                </option>
              `).join("")}
            </select>
          </label>

          <label class="field">
            Status

            <select name="status">
              ${[
                ["todo", "To do"],
                ["progress", "In progress"],
                ["done", "Done"],
              ].map(([v, l]) => `
                <option
                  value="${v}"
                  ${(t?.status || "todo") === v ? "selected" : ""}
                >
                  ${l}
                </option>
              `).join("")}
            </select>
          </label>
        </div>

        <div class="modal-footer">
          ${t
            ? '<button class="btn danger" type="button" id="delete-task">Delete task</button>'
            : "<span></span>"}

          <div class="right">
            <button
              class="btn secondary"
              type="button"
              id="cancel-task"
            >
              Cancel
            </button>

            <button class="btn primary" type="submit">
              ${t ? "Save changes" : "Create task"} →
            </button>
          </div>
        </div>
      </form>
    `,
  );

  // Tombol membatalkan pengisian form.

  $("#cancel-task").onclick = closeModal;

  // Ketika form dikirim, data dikumpulkan menggunakan FormData.
  // Jika edit menggunakan PUT, jika tambah menggunakan POST.

  $("#task-form").onsubmit = async (e) => {
    e.preventDefault();

    const f = new FormData(e.currentTarget);

    const data = Object.fromEntries(f.entries());

    data.project_id = data.project_id || null;

    if (t) {
      data.id = t.id;
    }

    try {
      await api("tasks", t ? "PUT" : "POST", data);

      closeModal();

      notify(
        t
          ? "Tugas berhasil diperbarui!"
          : "Tugas berhasil ditambahkan!",
      );

      await reload();
    } catch (err) {
      notify(err.message, true);
    }
  };

  // Fitur DELETE hanya ditampilkan ketika sedang mengedit tugas.
  // Pengguna diminta konfirmasi sebelum tugas dihapus.

  if (t) {
    $("#delete-task").onclick = async () => {
      if (!confirm(`Hapus tugas "${t.title}"?`)) {
        return;
      }

      try {
        await api("tasks", "DELETE", {
          id: t.id,
        });

        closeModal();

        notify("Tugas berhasil dihapus.");

        await reload();
      } catch (e) {
        notify(e.message, true);
      }
    };
  }
}

// ==========================================================
// BAGIAN 29 — FORM MEMBUAT PROYEK BARU
// ==========================================================

// projectForm() menampilkan popup untuk membuat proyek.
//
// Data yang diminta:
// - Nama proyek
// - Warna proyek
//
// Data dikirim ke backend menggunakan HTTP POST.

function projectForm() {
  openModal(
    "New project",
    "PROJECT MANAGEMENT",
    `
      <form id="project-form">
        <label class="field">
          Project name *

          <input
            name="name"
            required
            minlength="2"
            maxlength="80"
            placeholder="e.g. Website redesign"
          >
        </label>

        <label class="field">
          Project color

          <input
            name="color"
            type="color"
            value="#8654c9"
            style="height:48px;padding:5px"
          >
        </label>

        <div class="modal-footer">
          <span></span>

          <div class="right">
            <button
              class="btn secondary"
              type="button"
              id="cancel-project"
            >
              Cancel
            </button>

            <button class="btn primary" type="submit">
              Create project →
            </button>
          </div>
        </div>
      </form>
    `,
  );

  $("#cancel-project").onclick = closeModal;

  $("#project-form").onsubmit = async (e) => {
    e.preventDefault();

    const data = Object.fromEntries(
      new FormData(e.currentTarget).entries(),
    );

    try {
      await api("projects", "POST", data);

      closeModal();

      notify("Proyek berhasil dibuat!");

      await reload();
    } catch (err) {
      notify(err.message, true);
    }
  };
}

// ==========================================================
// BAGIAN 30 — MENGUBAH STATUS TUGAS
// ==========================================================

// toggleTask() digunakan ketika checkbox tugas diklik.
//
// Jika tugas belum selesai, status berubah menjadi done.
// Jika tugas sudah selesai, status kembali menjadi todo.
//
// PATCH digunakan untuk memperbarui hanya status tugas.

async function toggleTask(id) {
  const t = state.tasks.find(
    (x) => +x.id === +id,
  );

  if (!t) return;

  try {
    await api("tasks", "PATCH", {
      id: t.id,
      status: t.status === "done" ? "todo" : "done",
    });

    notify(
      t.status === "done"
        ? "Tugas dibuka kembali."
        : "Great job! Tugas selesai 🎉",
    );

    await reload();
  } catch (e) {
    notify(e.message, true);
  }
}

// ==========================================================
// BAGIAN 31 — MENGHAPUS PROYEK
// ==========================================================

// deleteProject() menghapus proyek berdasarkan ID.
//
// Pengguna diminta konfirmasi terlebih dahulu.
// Backend bertugas menghapus proyek dari database.
//
// Pesan antarmuka menyatakan bahwa tugas dalam proyek
// tetap tersimpan sebagai tugas Personal.

async function deleteProject(id) {
  const p = state.projects.find(
    (x) => +x.id === +id,
  );

  if (
    !confirm(
      `Hapus proyek "${p?.name || ""}"? Tugas tetap ada dan pindah ke Personal.`,
    )
  ) {
    return;
  }

  try {
    await api("projects", "DELETE", { id });

    notify("Proyek dihapus.");

    await reload();
  } catch (e) {
    notify(e.message, true);
  }
}

// ==========================================================
// BAGIAN 32 — MENYIMPAN PENGATURAN PROFIL
// ==========================================================

// saveSettings() mengambil data nama dan tema.
//
// Data dikirim ke API profile menggunakan PUT.
// Jika berhasil, nama dan tema di dashboard diperbarui.

async function saveSettings(e) {
  e.preventDefault();

  const data = Object.fromEntries(
    new FormData(e.currentTarget).entries(),
  );

  try {
    await api("profile", "PUT", data);

    state.user.name = data.name;
    state.theme = data.theme;

    document.body.classList.toggle(
      "dark",
      state.theme === "dark",
    );

    showApp();
    render();

    notify("Pengaturan tersimpan!");
  } catch (err) {
    notify(err.message, true);
  }
}

// ==========================================================
// BAGIAN 33 — EXPORT LAPORAN KE CSV
// ==========================================================

// exportCSV() membuat file laporan dari daftar tugas.
//
// CSV = Comma Separated Values.
//
// Data CSV dapat dibuka dengan Excel.
//
// Blob digunakan untuk membentuk file di browser.
// URL.createObjectURL() menghasilkan URL file sementara.
// Tombol download dibuat otomatis oleh JavaScript.

function exportCSV() {
  const fields = [
    "title",
    "description",
    "status",
    "priority",
    "due_date",
    "project_name",
    "created_at",
    "completed_at",
  ];

  const csv = [
    fields.join(","),

    ...state.tasks.map((t) =>
      fields
        .map((f) =>
          '"' + String(t[f] ?? "").replace(/"/g, '""') + '"',
        )
        .join(","),
    ),
  ].join("\r\n");

  const blob = new Blob(
    ["\ufeff" + csv],
    {
      type: "text/csv;charset=utf-8",
    },
  );

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");

  a.href = url;

  a.download = "fatay-report-" + today() + ".csv";

  a.click();

  URL.revokeObjectURL(url);

  notify("Laporan CSV berhasil diunduh.");
}

// ==========================================================
// BAGIAN 34 — MENGGANTI BULAN KALENDER
// ==========================================================

// changeMonth(-1) = bulan sebelumnya.
// changeMonth(1)  = bulan berikutnya.
//
// Setelah nilai bulan berubah, kalender dirender ulang.

function changeMonth(step) {
  state.month = new Date(
    state.month.getFullYear(),
    state.month.getMonth() + step,
    1,
  );

  render();
}

// ==========================================================
// BAGIAN 35 — EVENT LISTENER SELURUH TOMBOL
// ==========================================================

// document.addEventListener("click") menangani tombol
// yang diklik oleh pengguna.
//
// Teknik ini disebut event delegation.
//
// data-page          = navigasi halaman
// data-add-task      = menambah tugas
// data-add-project   = menambah proyek
// data-toggle-task   = mengubah status tugas
// data-edit-task     = mengedit tugas
// data-delete-project = menghapus proyek
// data-filter        = filter status tugas
// data-change-month  = mengganti bulan

document.addEventListener("click", async (e) => {
  const b = e.target.closest(
    "button,[data-open-project]",
  );

  if (!b) return;

  // Berpindah halaman melalui sidebar.

  if (b.dataset.page) {
    go(b.dataset.page);
    return;
  }

  // Navigasi melalui tombol View All.

  if (b.dataset.nav) {
    go(b.dataset.nav);
    return;
  }

  // Membuka formulir tambah tugas.

  if (b.hasAttribute("data-add-task")) {
    taskForm();
    return;
  }

  // Membuka formulir tambah proyek.

  if (b.hasAttribute("data-add-project")) {
    projectForm();
    return;
  }

  // Mengubah status selesai atau belum selesai.

  if (b.dataset.toggleTask) {
    await toggleTask(+b.dataset.toggleTask);
    return;
  }

  // Membuka formulir edit tugas berdasarkan ID.

  if (b.dataset.editTask) {
    taskForm(
      state.tasks.find(
        (t) => +t.id === +b.dataset.editTask,
      ),
    );

    return;
  }

  // Menghapus proyek berdasarkan ID.

  if (b.dataset.deleteProject) {
    await deleteProject(+b.dataset.deleteProject);
    return;
  }

  // Membuka daftar tugas dari proyek tertentu.

  if (b.dataset.openProject) {
    go("tasks");

    state.project = String(b.dataset.openProject);

    render();
    return;
  }

  // Mengubah filter status tugas.

  if (b.dataset.filter) {
    state.status = b.dataset.filter;

    render();
    return;
  }

  // Navigasi bulan pada kalender utama.

  if (b.dataset.changeMonth) {
    changeMonth(+b.dataset.changeMonth);
    return;
  }

  // Memilih tanggal pada kalender mini.

  if (b.dataset.selectDate) {
    state.selectedDate = b.dataset.selectDate;

    renderRightbar();
    return;
  }

  // Avatar mengarahkan pengguna ke Settings.

  if (b.id === "top-avatar") {
    go("settings");
    return;
  }

  // Tombol bulan sebelumnya.

  if (b.id === "month-prev") {
    changeMonth(-1);
    return;
  }

  // Tombol bulan berikutnya.

  if (b.id === "month-next") {
    changeMonth(1);
    return;
  }

  // Tombol menutup modal.

  if (b.id === "modal-close") {
    closeModal();
    return;
  }

  // Tombol cepat untuk membuat tugas.

  if (
    b.id === "agenda-add" ||
    b.id === "focus-add"
  ) {
    taskForm();
    return;
  }

  // Tombol notifikasi mengarahkan ke daftar tugas.

  if (b.id === "notice-btn") {
    go("tasks");

    state.status = "all";

    render();

    notify("Lihat tanggal deadline pada daftar tugas.");
    return;
  }

  // Tombol mengunduh laporan CSV.

  if (b.id === "export-csv") {
    exportCSV();
    return;
  }

  // Logout menghapus status login melalui backend.

  if (
    b.id === "logout" ||
    b.id === "logout-mobile"
  ) {
    try {
      await api("logout", "POST");

      state.user = null;

      showAuth();

      notify("Berhasil logout.");
    } catch (err) {
      notify(err.message, true);
    }

    return;
  }
});

// ==========================================================
// BAGIAN 36 — MENUTUP MODAL DENGAN KLIK DI LUAR FORM
// ==========================================================

// Jika pengguna mengklik area overlay modal,
// popup ditutup tanpa menyimpan perubahan.

$("#modal").addEventListener("click", (e) => {
  if (e.target.id === "modal") {
    closeModal();
  }
});

// ==========================================================
// BAGIAN 37 — SHORTCUT KEYBOARD
// ==========================================================

// Tombol Escape digunakan untuk menutup popup/modal.

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeModal();
  }
});

// ==========================================================
// BAGIAN 38 — BERPINDAH LOGIN DAN REGISTER
// ==========================================================

// Ketika tombol daftar ditekan:
// 1. Mode register diaktifkan
// 2. Input nama ditampilkan
// 3. Judul halaman berubah
// 4. Teks tombol berubah
//
// Form login dan register menggunakan struktur HTML yang sama.

$("#auth-toggle").addEventListener("click", () => {
  state.authRegister = !state.authRegister;

  $("#name-field").classList.toggle(
    "hidden",
    !state.authRegister,
  );

  $("#auth-title").textContent = state.authRegister
    ? "Join Fatay ✨"
    : "Welcome back 👋";

  $("#auth-caption").textContent = state.authRegister
    ? "Buat akun dan atur harimu lebih produktif."
    : "Masuk dan lanjutkan hal-hal hebat hari ini.";

  $("#auth-submit").innerHTML = state.authRegister
    ? "Create account ↗"
    : "Sign in ↗";

  $("#auth-question").textContent = state.authRegister
    ? "Sudah punya akun?"
    : "Belum punya akun?";

  $("#auth-toggle").textContent = state.authRegister
    ? "Masuk sekarang"
    : "Daftar sekarang";
});

// ==========================================================
// BAGIAN 39 — PROSES LOGIN DAN REGISTER
// ==========================================================

// Ketika formulir dikirim:
// 1. Mengambil email, password, dan nama jika register
// 2. Mengirim data ke backend melalui API
// 3. Backend memvalidasi data
// 4. Jika berhasil, user dan token CSRF disimpan di state
// 5. Dashboard ditampilkan
// 6. Tema dan data terbaru dimuat
//
// e.preventDefault() mencegah browser mengirim form
// dengan cara standar yang menyebabkan reload halaman.

$("#auth-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = Object.fromEntries(
    new FormData(e.currentTarget).entries(),
  );

  try {
    const res = await api(
      state.authRegister ? "register" : "login",
      "POST",
      data,
    );

    state.user = res.user;
    state.csrf = res.csrf;

    showApp();

    const pref = await api("profile");

    state.theme = pref.settings.theme;

    document.body.classList.toggle(
      "dark",
      state.theme === "dark",
    );

    await reload();

    notify("Welcome to Fatay! ✨");
  } catch (err) {
    notify(err.message, true);
  }
});

// ==========================================================
// BAGIAN 40 — MENJALANKAN APLIKASI
// ==========================================================

// start() adalah titik awal aplikasi.
// Fungsi ini dipanggil ketika file app.js dijalankan.
//
// Backend diperiksa untuk mengetahui apakah pengguna
// sudah login atau harus memasukkan akun terlebih dahulu.

start();

// ==========================================================
// AKHIR FILE assets/app.js
// ==========================================================