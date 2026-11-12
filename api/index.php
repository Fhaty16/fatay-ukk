<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';
try {
    csrf();
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $action = (string) ($_GET['action'] ?? 'session');
    $input = in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true) ? request_data() : [];
    if (!in_array($method, ['GET', 'HEAD'], true))
        check_csrf();
    if ($action === 'session' && $method === 'GET') {
        $user = null;
        if (!empty($_SESSION['uid'])) {
            $st = db()->prepare('SELECT id,name,email FROM users WHERE id=?');
            $st->execute([$_SESSION['uid']]);
            $user = $st->fetch() ?: null;
        }
        respond(['user' => $user, 'csrf' => $_SESSION['csrf']]);
    }
    if ($action === 'login' && $method === 'POST') {
        $email = strtolower(trim((string) ($input['email'] ?? '')));
        $st = db()->prepare('SELECT * FROM users WHERE email=?');
        $st->execute([$email]);
        $u = $st->fetch();
        if (!$u || !password_verify((string) ($input['password'] ?? ''), $u['password']))
            respond(['error' => 'Email atau password salah.'], 401);
        session_regenerate_id(true);
        $_SESSION['uid'] = (int) $u['id'];
        $_SESSION['csrf'] = bin2hex(random_bytes(24));
        respond(['user' => ['id' => $u['id'], 'name' => $u['name'], 'email' => $u['email']], 'csrf' => $_SESSION['csrf']]);
    }
    if ($action === 'register' && $method === 'POST') {
        $name = trim((string) ($input['name'] ?? ''));
        $email = strtolower(trim((string) ($input['email'] ?? '')));
        $pass = (string) ($input['password'] ?? '');
        if (strlen($name) < 2 || strlen($name) > 80 || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($pass) < 8)
            respond(['error' => 'Nama minimal 2 karakter, email valid, password minimal 8 karakter.'], 422);
        try {
            db()->prepare('INSERT INTO users(name,email,password) VALUES(?,?,?)')->execute([$name, $email, password_hash($pass, PASSWORD_DEFAULT)]);
        } catch (PDOException $e) {
            if (str_contains($e->getMessage(), 'UNIQUE'))
                respond(['error' => 'Email sudah terdaftar.'], 409);
            throw $e;
        }
        session_regenerate_id(true);
        $_SESSION['uid'] = (int) db()->lastInsertId();
        $_SESSION['csrf'] = bin2hex(random_bytes(24));
        respond(['user' => ['id' => $_SESSION['uid'], 'name' => $name, 'email' => $email], 'csrf' => $_SESSION['csrf']], 201);
    }
    if ($action === 'logout' && $method === 'POST') {
        $_SESSION = [];
        session_regenerate_id(true);
        respond(['ok' => true]);
    }
    $uid = user_id();
    if ($action === 'projects') {
        if ($method === 'GET') {
            $st = db()->prepare('SELECT p.*,COUNT(t.id) total_tasks,SUM(CASE WHEN t.status="done" THEN 1 ELSE 0 END) done_tasks FROM projects p LEFT JOIN tasks t ON t.project_id=p.id AND t.user_id=p.user_id WHERE p.user_id=? GROUP BY p.id ORDER BY p.id DESC');
            $st->execute([$uid]);
            respond(['projects' => $st->fetchAll()]);
        }
        if ($method === 'POST') {
            $name = trim((string) ($input['name'] ?? ''));
            $col = (string) ($input['color'] ?? '#8053c8');
            if (strlen($name) < 2 || strlen($name) > 80 || !color($col))
                respond(['error' => 'Nama proyek (2–80 karakter) dan warna tidak valid.'], 422);
            db()->prepare('INSERT INTO projects(user_id,name,color) VALUES(?,?,?)')->execute([$uid, $name, $col]);
            respond(['ok' => true, 'id' => db()->lastInsertId()], 201);
        }
        if ($method === 'DELETE') {
            $id = (int) ($input['id'] ?? 0);
            $st = db()->prepare('DELETE FROM projects WHERE id=? AND user_id=?');
            $st->execute([$id, $uid]);
            if (!$st->rowCount())
                respond(['error' => 'Proyek tidak ditemukan.'], 404);
            respond(['ok' => true]);
        }
    }
    if ($action === 'tasks') {
        if ($method === 'GET') {
            $q = 'SELECT t.*,p.name project_name,p.color project_color FROM tasks t LEFT JOIN projects p ON p.id=t.project_id WHERE t.user_id=?';
            $params = [$uid];
            if (!empty($_GET['status']) && in_array($_GET['status'], ['todo', 'progress', 'done'], true)) {
                $q .= ' AND t.status=?';
                $params[] = $_GET['status'];
            }
            if (!empty($_GET['project']) && ctype_digit((string) $_GET['project'])) {
                $q .= ' AND t.project_id=?';
                $params[] = (int) $_GET['project'];
            }
            if (!empty($_GET['search'])) {
                $q .= ' AND (t.title LIKE ? OR t.description LIKE ?)';
                $like = '%' . substr((string) $_GET['search'], 0, 100) . '%';
                $params[] = $like;
                $params[] = $like;
            }
            $q .= ' ORDER BY CASE WHEN t.status="done" THEN 1 ELSE 0 END, CASE t.priority WHEN "high" THEN 0 WHEN "medium" THEN 1 ELSE 2 END, COALESCE(t.due_date,"9999-12-31"),t.id DESC';
            $st = db()->prepare($q);
            $st->execute($params);
            respond(['tasks' => $st->fetchAll()]);
        }
        if ($method === 'POST' || $method === 'PUT') {
            $title = trim((string) ($input['title'] ?? ''));
            $desc = trim((string) ($input['description'] ?? ''));
            $status = (string) ($input['status'] ?? 'todo');
            $priority = (string) ($input['priority'] ?? 'medium');
            $due = $input['due_date'] ?? null;
            $pid = $input['project_id'] ?? null;
            $pid = ($pid === '' || $pid === null) ? null : (int) $pid;
            if (strlen($title) < 2 || strlen($title) > 160 || strlen($desc) > 3000 || !in_array($status, ['todo', 'progress', 'done'], true) || !in_array($priority, ['low', 'medium', 'high'], true) || !valid_date($due))
                respond(['error' => 'Periksa judul, deskripsi, status, prioritas, dan tenggat.'], 422);
            get_owned_project($uid, $pid);
            $completed = $status === 'done' ? date('Y-m-d H:i:s') : null;
            if ($method === 'POST') {
                db()->prepare('INSERT INTO tasks(user_id,project_id,title,description,status,priority,due_date,completed_at) VALUES(?,?,?,?,?,?,?,?)')->execute([$uid, $pid, $title, $desc, $status, $priority, $due ?: null, $completed]);
                respond(['ok' => true, 'id' => db()->lastInsertId()], 201);
            }
            $id = (int) ($input['id'] ?? 0);
            $st = db()->prepare('UPDATE tasks SET project_id=?,title=?,description=?,status=?,priority=?,due_date=?,completed_at=CASE WHEN ?="done" THEN COALESCE(completed_at,?) ELSE NULL END WHERE id=? AND user_id=?');
            $st->execute([$pid, $title, $desc, $status, $priority, $due ?: null, $status, $completed, $id, $uid]);
            if (!$st->rowCount()) {
                $find = db()->prepare('SELECT id FROM tasks WHERE id=? AND user_id=?');
                $find->execute([$id, $uid]);
                if (!$find->fetch())
                    respond(['error' => 'Tugas tidak ditemukan.'], 404);
            }
            respond(['ok' => true]);
        }
        if ($method === 'PATCH') {
            $id = (int) ($input['id'] ?? 0);
            $status = (string) ($input['status'] ?? '');
            if (!in_array($status, ['todo', 'progress', 'done'], true))
                respond(['error' => 'Status tidak valid.'], 422);
            $st = db()->prepare('UPDATE tasks SET status=?,completed_at=CASE WHEN ?="done" THEN COALESCE(completed_at,?) ELSE NULL END WHERE id=? AND user_id=?');
            $st->execute([$status, $status, date('Y-m-d H:i:s'), $id, $uid]);
            if (!$st->rowCount())
                respond(['error' => 'Tugas tidak ditemukan atau tidak berubah.'], 404);
            respond(['ok' => true]);
        }
        if ($method === 'DELETE') {
            $st = db()->prepare('DELETE FROM tasks WHERE id=? AND user_id=?');
            $st->execute([(int) ($input['id'] ?? 0), $uid]);
            if (!$st->rowCount())
                respond(['error' => 'Tugas tidak ditemukan.'], 404);
            respond(['ok' => true]);
        }
    }
    if ($action === 'stats' && $method === 'GET') {
        $st = db()->prepare('SELECT COUNT(*) total,SUM(CASE WHEN status="done" THEN 1 ELSE 0 END) done,SUM(CASE WHEN status="progress" THEN 1 ELSE 0 END) progress,SUM(CASE WHEN status="todo" THEN 1 ELSE 0 END) todo,SUM(CASE WHEN due_date < CURDATE() AND status!="done" THEN 1 ELSE 0 END) overdue FROM tasks WHERE user_id=?');
        $st->execute([$uid]);
        $summary = $st->fetch();
        $st = db()->prepare('SELECT DAYOFWEEK(completed_at) - 1 AS weekday, COUNT(*) AS count FROM tasks WHERE user_id=? AND status="done" AND completed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) GROUP BY DAYOFWEEK(completed_at) - 1');
        $st->execute([$uid]);
        $weekly = $st->fetchAll();
        $st = db()->prepare('SELECT due_date day,COUNT(*) total FROM tasks WHERE user_id=? AND due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 6 DAY) GROUP BY due_date');
        $st->execute([$uid]);
        respond(['summary' => $summary, 'weekly' => $weekly, 'upcoming' => $st->fetchAll()]);
    }
    if ($action === 'profile') {
        if ($method === 'GET') {
            $st = db()->prepare('SELECT theme FROM settings WHERE user_id=?');
            $st->execute([$uid]);
            respond(['settings' => $st->fetch() ?: ['theme' => 'light']]);
        }
        if ($method === 'PUT') {
            $name = trim((string) ($input['name'] ?? ''));
            $theme = (string) ($input['theme'] ?? 'light');
            if (strlen($name) < 2 || strlen($name) > 80 || !in_array($theme, ['light', 'dark'], true))
                respond(['error' => 'Pengaturan tidak valid.'], 422);
            db()->prepare('UPDATE users SET name=? WHERE id=?')->execute([$name, $uid]);
            db()->prepare('INSERT INTO settings(user_id,theme) VALUES(?,?) ON DUPLICATE KEY UPDATE theme=VALUES(theme)')->execute([$uid, $theme]);
            respond(['ok' => true]);
        }
    }
    respond(['error' => 'Endpoint tidak tersedia.'], 404);
} catch (Throwable $e) {
    error_log('Taskify API: ' . $e->getMessage());
    respond(['error' => 'Terjadi kesalahan server. Periksa log PHP dan konfigurasi database.'], 500);
}
