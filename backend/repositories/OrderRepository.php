<?php
/**
 * Design Pattern: Repository Pattern
 * Separates SQL from business logic for orders
 */
class OrderRepository implements RepositoryInterface
{
    public function __construct(private PDO $db) {}

    public function getAll(): array
    {
        $sql = '
            SELECT o.*, u.username
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
        ';
        return $this->db->query($sql)->fetchAll();
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM orders WHERE id = ?');
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public function getByUser(int $userId): array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC'
        );
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }

    public function create(int $userId, array $items, float $total): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO orders (user_id, items, total, status) VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([$userId, json_encode($items), $total, 'pending']);
        return (int) $this->db->lastInsertId();
    }

    public function updateStatus(int $id, string $status): void
    {
        $stmt = $this->db->prepare('UPDATE orders SET status = ? WHERE id = ?');
        $stmt->execute([$status, $id]);
    }

    public function getStats(): array
    {
        $revenue = $this->db->query("SELECT COALESCE(SUM(total), 0) as v FROM orders WHERE status != 'cancelled'")->fetch()['v'];
        $total   = $this->db->query("SELECT COUNT(*) as v FROM orders")->fetch()['v'];
        $pending = $this->db->query("SELECT COUNT(*) as v FROM orders WHERE status = 'pending'")->fetch()['v'];
        $done    = $this->db->query("SELECT COUNT(*) as v FROM orders WHERE status = 'delivered'")->fetch()['v'];
        $items   = $this->db->query("SELECT COUNT(*) as v FROM menu_items")->fetch()['v'];

        return [
            'total_revenue' => (float) $revenue,
            'total_orders'  => (int)   $total,
            'pending'       => (int)   $pending,
            'delivered'     => (int)   $done,
            'menu_items'    => (int)   $items,
        ];
    }
}
