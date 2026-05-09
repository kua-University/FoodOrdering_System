<?php
/**
 * Design Pattern: Repository Pattern
 * Separates SQL from business logic for menu items
 */
class MenuRepository implements RepositoryInterface
{
    public function __construct(private PDO $db) {}

    public function getAll(): array
    {
        return $this->db->query('SELECT * FROM menu_items ORDER BY category, name')->fetchAll();
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM menu_items WHERE id = ?');
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public function create(string $name, float $price, string $category, ?string $imageUrl): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO menu_items (name, price, category, image_url) VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([$name, $price, $category, $imageUrl]);
        return (int) $this->db->lastInsertId();
    }

    public function delete(int $id): void
    {
        $stmt = $this->db->prepare('DELETE FROM menu_items WHERE id = ?');
        $stmt->execute([$id]);
    }
}
