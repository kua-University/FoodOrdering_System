<?php
/**
 * Zayid Food System — Backend
 * Design Pattern: Front Controller
 * Single entry point that routes all API requests
 */

// ── Session & Headers ──────────────────────────────────────
session_start();

header('Content-Type: application/json');

// FIX: Cannot use wildcard '*' with credentials:true.
// We reflect the request origin (works for localhost XAMPP/Docker).
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    // fallback for same-origin requests (no Origin header sent)
    header('Access-Control-Allow-Origin: http://localhost');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ── Autoload ───────────────────────────────────────────────
require_once __DIR__ . '/config/Database.php';
require_once __DIR__ . '/repositories/RepositoryInterface.php';
require_once __DIR__ . '/repositories/UserRepository.php';
require_once __DIR__ . '/repositories/MenuRepository.php';
require_once __DIR__ . '/repositories/OrderRepository.php';

// ── Parse request body ─────────────────────────────────────
$body = json_decode(file_get_contents('php://input'), true) ?? [];

// ── Route ──────────────────────────────────────────────────
$route  = $_GET['route']  ?? '';
$action = $_GET['action'] ?? '';

try {
    switch ($route) {
        case 'auth':
            handleAuth($action, $body);
            break;
        case 'menu':
            handleMenu($action, $body);
            break;
        case 'orders':
            handleOrders($action, $body);
            break;
        default:
            jsonError('Unknown route', 404);
    }
} catch (Throwable $e) {
    jsonError($e->getMessage(), 500);
}

// ══════════════════════════════════════════════════════════════
// AUTH HANDLERS
// ══════════════════════════════════════════════════════════════
function handleAuth(string $action, array $body): void
{
    $repo = new UserRepository(Database::getInstance());

    switch ($action) {

        case 'login':
            $username = trim($body['username'] ?? '');
            $password = $body['password'] ?? '';

            if (!$username || !$password) {
                jsonError('Username and password required', 400);
            }

            $user = $repo->findByUsername($username);
            if (!$user || !password_verify($password, $user['password'])) {
                jsonError('Invalid username or password', 401);
            }

            $_SESSION['user_id'] = $user['id'];
            $_SESSION['role']    = $user['role'];

            unset($user['password']);
            jsonSuccess(['user' => $user]);
            break;

        case 'logout':
            session_destroy();
            jsonSuccess(['message' => 'Logged out']);
            break;

        case 'register':
            $name     = trim($body['name']     ?? '');
            $username = trim($body['username'] ?? '');
            $password = $body['password']      ?? '';

            if (!$name || !$username || !$password) {
                jsonError('All fields required', 400);
            }
            if (strlen($password) < 4) {
                jsonError('Password too short (min 4 chars)', 400);
            }
            if ($repo->findByUsername($username)) {
                jsonError('Username already taken', 409);
            }

            $hash = password_hash($password, PASSWORD_BCRYPT);
            $id   = $repo->create($name, $username, $hash, 'user');
            $user = $repo->findById($id);
            unset($user['password']);

            $_SESSION['user_id'] = $user['id'];
            $_SESSION['role']    = $user['role'];
            jsonSuccess(['user' => $user]);
            break;

        case 'me':
            if (empty($_SESSION['user_id'])) {
                jsonSuccess(['user' => null]);
            }
            $user = (new UserRepository(Database::getInstance()))->findById($_SESSION['user_id']);
            if (!$user) { jsonSuccess(['user' => null]); }
            unset($user['password']);
            jsonSuccess(['user' => $user]);
            break;

        default:
            jsonError('Unknown auth action', 404);
    }
}

// ══════════════════════════════════════════════════════════════
// MENU HANDLERS
// ══════════════════════════════════════════════════════════════
function handleMenu(string $action, array $body): void
{
    $repo = new MenuRepository(Database::getInstance());

    switch ($action) {
        case 'list':
            jsonSuccess(['items' => $repo->getAll()]);
            break;

        case 'add':
            requireAdmin();
            $name     = trim($body['name']      ?? '');
            $price    = floatval($body['price']  ?? 0);
            $category = trim($body['category']   ?? '');
            $image    = trim($body['image_url']  ?? '');

            if (!$name || $price <= 0) jsonError('Name and valid price required', 400);

            $id   = $repo->create($name, $price, $category, $image ?: null);
            $item = $repo->findById($id);
            jsonSuccess(['item' => $item]);
            break;

        case 'delete':
            requireAdmin();
            $id = intval($body['id'] ?? 0);
            if (!$id) jsonError('Item ID required', 400);
            $repo->delete($id);
            jsonSuccess(['message' => 'Deleted']);
            break;

        default:
            jsonError('Unknown menu action', 404);
    }
}

// ══════════════════════════════════════════════════════════════
// ORDER HANDLERS
// ══════════════════════════════════════════════════════════════
function handleOrders(string $action, array $body): void
{
    requireAuth();
    $repo   = new OrderRepository(Database::getInstance());
    $userId = $_SESSION['user_id'];

    switch ($action) {
        case 'place':
            $items = $body['items'] ?? [];
            $total = floatval($body['total'] ?? 0);
            if (empty($items)) jsonError('Cart is empty', 400);

            $id    = $repo->create($userId, $items, $total);
            $order = $repo->findById($id);
            jsonSuccess(['order' => $order]);
            break;

        case 'my':
            jsonSuccess(['orders' => $repo->getByUser($userId)]);
            break;

        case 'list':
            requireAdmin();
            jsonSuccess(['orders' => $repo->getAll()]);
            break;

        case 'update-status':
            requireAdmin();
            $id     = intval($body['id']     ?? 0);
            $status = trim($body['status']   ?? '');
            $valid  = ['pending','confirmed','preparing','ready','delivered','cancelled'];
            if (!$id || !in_array($status, $valid)) jsonError('Invalid data', 400);
            $repo->updateStatus($id, $status);
            jsonSuccess(['message' => 'Status updated']);
            break;

        case 'stats':
            requireAdmin();
            jsonSuccess(['stats' => $repo->getStats()]);
            break;

        default:
            jsonError('Unknown orders action', 404);
    }
}

// ══════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════
function jsonSuccess(array $data): never
{
    echo json_encode(array_merge(['success' => true], $data));
    exit;
}

function jsonError(string $message, int $code = 400): never
{
    http_response_code($code);
    echo json_encode(['success' => false, 'error' => $message]);
    exit;
}

function requireAuth(): void
{
    if (empty($_SESSION['user_id'])) jsonError('Not authenticated', 401);
}

function requireAdmin(): void
{
    requireAuth();
    if (($_SESSION['role'] ?? '') !== 'admin') jsonError('Admin only', 403);
}
