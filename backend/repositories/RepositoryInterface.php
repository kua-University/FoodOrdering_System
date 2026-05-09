<?php
/**
 * Design Pattern: Repository Pattern
 * Defines contract for all repository classes
 */
interface RepositoryInterface
{
    public function getAll(): array;
    public function findById(int $id): ?array;
}
