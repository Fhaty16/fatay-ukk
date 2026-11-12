<?php
declare(strict_types=1);
ini_set('display_errors', '0');
error_reporting(E_ALL);
session_name('taskify_session');
ini_set('session.use_strict_mode', '1');
ini_set('session.cookie_httponly', '1');
ini_set('session.cookie_samesite', 'Lax');
if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    ini_set('session.cookie_secure', '1');
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
function respond(array $data, int $code = 200): never
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function db(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    if (!extension_loaded('pdo_mysql')) {
        respond([
            'error' => 'Ekstensi pdo_mysql belum aktif.'
        ], 500);
    }

    $host = '127.0.0.1';
    $port = 3306;
    $database = 'fatay_ukk';
    $username = 'root';
    $password = '';

    $dsn = "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4";

    try {
        $pdo = new PDO(
            $dsn,
            $username,
            $password,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ]
        );

    } catch (PDOException $e) {
        error_log('Fatay database error: ' . $e->getMessage());

        respond([
            'error' => 'Koneksi database MySQL gagal.'
        ], 500);
    }

    return $pdo;
}
function request_data(): array
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '{}', true);
    if (!is_array($data))
        respond(['error' => 'JSON tidak valid'], 422);
    return $data;
}
function user_id(): int
{
    if (empty($_SESSION['uid']))
        respond(['error' => 'Silakan login terlebih dahulu.'], 401);
    return (int) $_SESSION['uid'];
}
function csrf(): void
{
    if (empty($_SESSION['csrf']))
        $_SESSION['csrf'] = bin2hex(random_bytes(24));
}
function check_csrf(): void
{
    csrf();
    if (!hash_equals($_SESSION['csrf'], (string) ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '')))
        respond(['error' => 'Sesi tidak valid. Muat ulang halaman.'], 419);
}
function valid_date($d): bool
{
    if ($d === null || $d === '')
        return true;
    if (!is_string($d) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $d))
        return false;
    $v = DateTimeImmutable::createFromFormat('!Y-m-d', $d);
    return $v !== false && $v->format('Y-m-d') === $d;
}
function color($value): bool
{
    return is_string($value) && preg_match('/^#[a-fA-F0-9]{6}$/', $value) === 1;
}
function get_owned_project(int $uid, ?int $pid): void
{
    if ($pid === null)
        return;
    $st = db()->prepare('SELECT id FROM projects WHERE id=? AND user_id=?');
    $st->execute([$pid, $uid]);
    if (!$st->fetch())
        respond(['error' => 'Proyek tidak ditemukan.'], 422);
}
