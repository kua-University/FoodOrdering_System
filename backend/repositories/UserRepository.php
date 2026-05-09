<?php
/**
 * Design Pattern: Repository Pattern
 * Separates SQL from business logic for users
 */
class UserRepository implements RepositoryInterface
{
    public function __construct(private PDO $db) {}

    public function getAll(): array
    {
        return $this->db->query('SELECT id, name, username, role, created_at FROM users')->fetchAll();
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE id = ?');
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public function findByUsername(string $username): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE username = ?');
        $stmt->execute([$username]);
        return $stmt->fetch() ?: null;
    }

    public function create(string $name, string $username, string $passwordHash, string $role = 'user'): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([$name, $username, $passwordHash, $role]);
        return (int) $this->db->lastInsertId();
    }
}
