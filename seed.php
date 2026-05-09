<?php
/**
 * Zayid Food — Database Seeder
 * Run this ONCE after importing schema.sql to set correct password hashes.
 *
 * XAMPP:  visit http://localhost/zayid_food/seed.php
 * Docker: docker exec zayid_php php /var/www/html/zayid_food/seed.php
 *
 * DELETE THIS FILE after running it.
 */

require_once __DIR__ . '/backend/config/Database.php';

$pdo = Database::getInstance();

// ── Wipe and re-seed users with correct bcrypt hashes ──────
$pdo->exec("DELETE FROM users WHERE username IN ('admin', 'user')");

$users = [
    ['Admin',     'admin', '1234', 'admin'],
    ['Demo User', 'user',  '1111', 'user'],
];

$stmt = $pdo->prepare(
    "INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)"
);

foreach ($users as [$name, $username, $plainPassword, $role]) {
    $hash = password_hash($plainPassword, PASSWORD_BCRYPT);
    $stmt->execute([$name, $username, $hash, $role]);
    echo "✅ Created user: <b>$username</b> / password: <b>$plainPassword</b><br>";
}

// ── Seed menu items if table is empty ─────────────────────
$count = $pdo->query("SELECT COUNT(*) FROM menu_items")->fetchColumn();
if ($count == 0) {
    $items = [
        ['Injera with Doro Wat',   120.00, 'Ethiopian'],
        ['Tibs (Beef)',            150.00, 'Ethiopian'],
        ['Shiro Fitfit',            80.00, 'Ethiopian'],
        ['Firfir',                  70.00, 'Ethiopian'],
        ['Beyaynetu (Fasting)',    100.00, 'Fasting'],
        ['Misir Wot',               65.00, 'Fasting'],
        ['Gomen (Collard Greens)',  55.00, 'Fasting'],
        ['Burger',                 130.00, 'Fast Food'],
        ['Club Sandwich',          110.00, 'Fast Food'],
        ['French Fries',            50.00, 'Sides'],
        ['Fresh Juice (Mixed)',     60.00, 'Drinks'],
        ['Sprite / Coca-Cola',      35.00, 'Drinks'],
    ];
    $m = $pdo->prepare("INSERT INTO menu_items (name, price, category) VALUES (?, ?, ?)");
    foreach ($items as $item) {
        $m->execute($item);
    }
    echo "<br>✅ Seeded " . count($items) . " menu items.<br>";
}

echo "<br><b style='color:red'>⚠️ Delete this file (seed.php) now for security!</b>";
