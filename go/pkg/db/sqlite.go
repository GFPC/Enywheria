package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"
)

func InitDB(dbPath string) (*sql.DB, error) {
	dir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create db directory: %w", err)
	}

	db, err := sql.Open("sqlite", dbPath+"?_pragma=foreign_keys(1)&_pragma=journal_mode(WAL)")
	if err != nil {
		return nil, fmt.Errorf("failed to open sqlite database: %w", err)
	}

	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(5)

	if err := createTables(db); err != nil {
		db.Close()
		return nil, err
	}

	log.Println("[Go DB] SQLite database initialized successfully with FTS5 search tables.")
	return db, nil
}

func createTables(db *sql.DB) error {
	schema := `
	CREATE TABLE IF NOT EXISTS boxes (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		location TEXT DEFAULT '',
		description TEXT DEFAULT '',
		barcode TEXT DEFAULT '',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS collections (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		title TEXT NOT NULL,
		description TEXT DEFAULT '',
		cover_item_id INTEGER,
		parent_id INTEGER REFERENCES collections(id) ON DELETE SET NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS clients (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		email TEXT DEFAULT '',
		company TEXT DEFAULT '',
		notes TEXT DEFAULT '',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS projects (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		title TEXT NOT NULL,
		description TEXT DEFAULT '',
		status TEXT DEFAULT 'active',
		deadline DATETIME,
		client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS items (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		title TEXT NOT NULL,
		description TEXT DEFAULT '',
		item_type TEXT DEFAULT 'asset',
		mime_type TEXT DEFAULT 'application/octet-stream',
		size_bytes INTEGER DEFAULT 0,
		file_path TEXT DEFAULT '',
		file_hash TEXT DEFAULT '',
		is_encrypted INTEGER DEFAULT 0,
		digital_sig TEXT DEFAULT '',
		box_id INTEGER REFERENCES boxes(id) ON DELETE SET NULL,
		collection_id INTEGER REFERENCES collections(id) ON DELETE SET NULL,
		project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		deleted_at DATETIME
	);

	CREATE TABLE IF NOT EXISTS tags (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL UNIQUE,
		color_hex TEXT DEFAULT '#6B7280',
		parent_id INTEGER REFERENCES tags(id) ON DELETE SET NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS devices (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		device_type TEXT DEFAULT 'pc',
		ip_address TEXT DEFAULT '',
		mac_address TEXT DEFAULT '',
		encrypted_ssh TEXT DEFAULT '',
		is_online INTEGER DEFAULT 0,
		last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS scripts (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		title TEXT NOT NULL,
		interpreter TEXT DEFAULT 'bash',
		code TEXT NOT NULL,
		timeout_sec INTEGER DEFAULT 30,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS notes (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		title TEXT NOT NULL,
		content TEXT NOT NULL,
		is_pinned INTEGER DEFAULT 0,
		item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS events (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		event_type TEXT NOT NULL,
		message TEXT NOT NULL,
		details TEXT DEFAULT '',
		timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	-- Junction Tables (M2M)
	CREATE TABLE IF NOT EXISTS item_tags (
		item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
		tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
		PRIMARY KEY (item_id, tag_id)
	);

	CREATE TABLE IF NOT EXISTS collection_items (
		collection_id INTEGER REFERENCES collections(id) ON DELETE CASCADE,
		item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
		PRIMARY KEY (collection_id, item_id)
	);

	CREATE TABLE IF NOT EXISTS project_items (
		project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
		item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
		PRIMARY KEY (project_id, item_id)
	);

	CREATE TABLE IF NOT EXISTS box_items (
		box_id INTEGER REFERENCES boxes(id) ON DELETE CASCADE,
		item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
		PRIMARY KEY (box_id, item_id)
	);

	CREATE TABLE IF NOT EXISTS device_scripts (
		device_id INTEGER REFERENCES devices(id) ON DELETE CASCADE,
		script_id INTEGER REFERENCES scripts(id) ON DELETE CASCADE,
		PRIMARY KEY (device_id, script_id)
	);

	CREATE TABLE IF NOT EXISTS project_notes (
		project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
		note_id INTEGER REFERENCES notes(id) ON DELETE CASCADE,
		PRIMARY KEY (project_id, note_id)
	);

	-- FTS5 Virtual Table & Triggers
	CREATE VIRTUAL TABLE IF NOT EXISTS item_fts USING fts5(
		title,
		description,
		item_type,
		tokenize='unicode61'
	);

	CREATE TRIGGER IF NOT EXISTS item_fts_insert AFTER INSERT ON items BEGIN
		INSERT INTO item_fts(rowid, title, description, item_type)
		VALUES (new.id, new.title, new.description, new.item_type);
	END;

	CREATE TRIGGER IF NOT EXISTS item_fts_delete AFTER DELETE ON items BEGIN
		DELETE FROM item_fts WHERE rowid = old.id;
	END;

	CREATE TRIGGER IF NOT EXISTS item_fts_update AFTER UPDATE ON items BEGIN
		DELETE FROM item_fts WHERE rowid = old.id;
		INSERT INTO item_fts(rowid, title, description, item_type)
		VALUES (new.id, new.title, new.description, new.item_type);
	END;
	`

	_, err := db.Exec(schema)
	return err
}
