package migrations

import (
	"database/sql"
	"fmt"
	"log"
)

// Migration represents a database migration
type Migration struct {
	Name string
	Up   func(*sql.DB) error
	Down func(*sql.DB) error
}

// Runner manages database migrations
type Runner struct {
	db         *sql.DB
	migrations []Migration
}

// NewRunner creates a new migration runner
func NewRunner(db *sql.DB) *Runner {
	return &Runner{
		db:         db,
		migrations: []Migration{},
	}
}

// Register adds a migration to be run
func (r *Runner) Register(m Migration) {
	r.migrations = append(r.migrations, m)
}

// Run executes all pending migrations
func (r *Runner) Run() error {
	// Create migrations table if not exists
	if err := r.createMigrationsTable(); err != nil {
		return fmt.Errorf("failed to create migrations table: %w", err)
	}

	// Run each migration
	for _, m := range r.migrations {
		applied, err := r.isMigrationApplied(m.Name)
		if err != nil {
			return fmt.Errorf("failed to check migration status: %w", err)
		}

		if applied {
			log.Printf("Migration already applied: %s", m.Name)
			continue
		}

		log.Printf("Running migration: %s", m.Name)
		if err := m.Up(r.db); err != nil {
			return fmt.Errorf("migration failed (%s): %w", m.Name, err)
		}

		// Record migration
		if err := r.recordMigration(m.Name); err != nil {
			return fmt.Errorf("failed to record migration: %w", err)
		}

		log.Printf("Migration completed: %s", m.Name)
	}

	log.Println("All migrations completed successfully")
	return nil
}

// Rollback reverts the last migration
func (r *Runner) Rollback() error {
	// Get last applied migration
	var lastMigration string
	err := r.db.QueryRow(
		"SELECT name FROM migrations ORDER BY applied_at DESC LIMIT 1",
	).Scan(&lastMigration)

	if err == sql.ErrNoRows {
		return fmt.Errorf("no migrations to rollback")
	}
	if err != nil {
		return fmt.Errorf("failed to get last migration: %w", err)
	}

	// Find and execute down migration
	for _, m := range r.migrations {
		if m.Name == lastMigration {
			log.Printf("Rolling back migration: %s", m.Name)
			if err := m.Down(r.db); err != nil {
				return fmt.Errorf("rollback failed (%s): %w", m.Name, err)
			}

			// Remove migration record
			_, err := r.db.Exec("DELETE FROM migrations WHERE name = $1", m.Name)
			if err != nil {
				return fmt.Errorf("failed to remove migration record: %w", err)
			}

			log.Printf("Rollback completed: %s", m.Name)
			return nil
		}
	}

	return fmt.Errorf("migration not found: %s", lastMigration)
}

// createMigrationsTable creates the migrations tracking table
func (r *Runner) createMigrationsTable() error {
	query := `
	CREATE TABLE IF NOT EXISTS migrations (
		id SERIAL PRIMARY KEY,
		name TEXT UNIQUE NOT NULL,
		applied_at TIMESTAMP DEFAULT NOW()
	);
	`

	_, err := r.db.Exec(query)
	return err
}

// isMigrationApplied checks if a migration has been applied
func (r *Runner) isMigrationApplied(name string) (bool, error) {
	var count int
	err := r.db.QueryRow(
		"SELECT COUNT(*) FROM migrations WHERE name = $1",
		name,
	).Scan(&count)

	if err != nil && err != sql.ErrNoRows {
		return false, err
	}

	return count > 0, nil
}

// recordMigration records a migration as applied
func (r *Runner) recordMigration(name string) error {
	_, err := r.db.Exec(
		"INSERT INTO migrations (name) VALUES ($1)",
		name,
	)
	return err
}
