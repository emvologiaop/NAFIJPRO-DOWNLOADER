package migrations

import "database/sql"

// MigrationAIAPIKeys creates the AI API Keys schema
func MigrationAIAPIKeys() Migration {
	return Migration{
		Name: "001_ai_api_keys_schema",
		Up: func(db *sql.DB) error {
			// Create tables
			queries := []string{
				// Main API Keys Table
				`CREATE TABLE IF NOT EXISTS ai_api_keys (
					id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
					provider TEXT NOT NULL CHECK (provider IN ('groq', 'openai', 'gemini', 'claude', 'azure')),
					api_key_encrypted TEXT NOT NULL,
					api_key_hash TEXT NOT NULL UNIQUE,
					model TEXT NOT NULL,
					priority_order INTEGER NOT NULL CHECK (priority_order BETWEEN 1 AND 5),
					enabled BOOLEAN DEFAULT TRUE,
					status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'testing', 'error', 'disabled')),
					last_tested_at TIMESTAMP WITH TIME ZONE,
					last_error TEXT,
					error_count INTEGER DEFAULT 0,
					success_count INTEGER DEFAULT 0,
					created_by UUID,
					created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
					updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
					deleted_at TIMESTAMP WITH TIME ZONE
				);`,

				// Audit Log Table
				`CREATE TABLE IF NOT EXISTS ai_api_key_audit (
					id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
					key_id UUID REFERENCES ai_api_keys(id) ON DELETE CASCADE,
					action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'tested', 'deleted', 'rotated', 'disabled', 'enabled')),
					provider TEXT,
					performed_by UUID,
					details JSONB,
					created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
				);`,

				// Provider Usage Tracking
				`CREATE TABLE IF NOT EXISTS ai_provider_usage (
					id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
					key_id UUID REFERENCES ai_api_keys(id) ON DELETE CASCADE,
					provider TEXT NOT NULL,
					total_requests INTEGER DEFAULT 0,
					success_requests INTEGER DEFAULT 0,
					failed_requests INTEGER DEFAULT 0,
					total_tokens INTEGER DEFAULT 0,
					total_cost_usd NUMERIC DEFAULT 0,
					last_used_at TIMESTAMP WITH TIME ZONE,
					created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
					updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
				);`,

				// Provider Configuration
				`CREATE TABLE IF NOT EXISTS ai_provider_config (
					id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
					provider TEXT UNIQUE NOT NULL CHECK (provider IN ('groq', 'openai', 'gemini', 'claude', 'azure')),
					api_endpoint TEXT NOT NULL,
					default_model TEXT,
					timeout_seconds INTEGER DEFAULT 30,
					rate_limit_per_minute INTEGER,
					pricing_input_per_1k NUMERIC,
					pricing_output_per_1k NUMERIC,
					enabled BOOLEAN DEFAULT TRUE,
					updated_by UUID,
					created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
					updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
				);`,

				// Key Rotation History
				`CREATE TABLE IF NOT EXISTS ai_api_key_rotation_history (
					id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
					key_id UUID REFERENCES ai_api_keys(id) ON DELETE CASCADE,
					old_key_hash TEXT,
					new_key_hash TEXT,
					reason TEXT,
					rotated_by UUID,
					created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
				);`,

				// Create indexes
				`CREATE INDEX IF NOT EXISTS idx_ai_api_keys_provider ON ai_api_keys(provider);`,
				`CREATE INDEX IF NOT EXISTS idx_ai_api_keys_enabled ON ai_api_keys(enabled);`,
				`CREATE INDEX IF NOT EXISTS idx_ai_api_keys_status ON ai_api_keys(status);`,
				`CREATE INDEX IF NOT EXISTS idx_ai_api_keys_priority ON ai_api_keys(priority_order);`,
				`CREATE INDEX IF NOT EXISTS idx_ai_api_key_audit_key_id ON ai_api_key_audit(key_id);`,
				`CREATE INDEX IF NOT EXISTS idx_ai_api_key_audit_action ON ai_api_key_audit(action);`,
				`CREATE INDEX IF NOT EXISTS idx_ai_provider_usage_key_id ON ai_provider_usage(key_id);`,
				`CREATE INDEX IF NOT EXISTS idx_ai_provider_usage_provider ON ai_provider_usage(provider);`,
			}

			for _, query := range queries {
				if _, err := db.Exec(query); err != nil {
					return err
				}
			}

			return nil
		},
		Down: func(db *sql.DB) error {
			statements := []string{
				"DROP TABLE IF EXISTS ai_api_key_rotation_history;",
				"DROP TABLE IF EXISTS ai_provider_config;",
				"DROP TABLE IF EXISTS ai_provider_usage;",
				"DROP TABLE IF EXISTS ai_api_key_audit;",
				"DROP TABLE IF EXISTS ai_api_keys;",
			}

			for _, stmt := range statements {
				if _, err := db.Exec(stmt); err != nil {
					return err
				}
			}

			return nil
		},
	}
}
