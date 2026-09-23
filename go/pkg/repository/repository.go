package repository

import (
	"database/sql"
	"fmt"
	"strings"

	"github.com/GFPC/Enywheria/pkg/models"
)

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

// ----------------- ITEMS -----------------

func (r *Repository) CreateItem(item *models.Item) error {
	query := `
	INSERT INTO items (title, description, item_type, mime_type, size_bytes, file_path, file_hash, is_encrypted, digital_sig, box_id, collection_id, project_id)
	VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	res, err := r.db.Exec(query, item.Title, item.Description, item.ItemType, item.MimeType, item.SizeBytes, item.FilePath, item.FileHash, item.IsEncrypted, item.DigitalSig, item.BoxID, item.CollectionID, item.ProjectID)
	if err != nil {
		return err
	}
	id, err := res.LastInsertId()
	if err == nil {
		item.ID = id
	}
	return nil
}

func (r *Repository) GetItem(id int64) (*models.Item, error) {
	query := `SELECT id, title, description, item_type, mime_type, size_bytes, file_path, file_hash, is_encrypted, digital_sig, box_id, collection_id, project_id, created_at, updated_at, deleted_at FROM items WHERE id = ? AND deleted_at IS NULL`
	row := r.db.QueryRow(query, id)

	var item models.Item
	err := row.Scan(&item.ID, &item.Title, &item.Description, &item.ItemType, &item.MimeType, &item.SizeBytes, &item.FilePath, &item.FileHash, &item.IsEncrypted, &item.DigitalSig, &item.BoxID, &item.CollectionID, &item.ProjectID, &item.CreatedAt, &item.UpdatedAt, &item.DeletedAt)
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *Repository) ListItems(limit, offset int) ([]models.Item, error) {
	query := `SELECT id, title, description, item_type, mime_type, size_bytes, file_path, file_hash, is_encrypted, digital_sig, box_id, collection_id, project_id, created_at, updated_at, deleted_at FROM items WHERE deleted_at IS NULL ORDER BY id DESC LIMIT ? OFFSET ?`
	rows, err := r.db.Query(query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.Item
	for rows.Next() {
		var item models.Item
		_ = rows.Scan(&item.ID, &item.Title, &item.Description, &item.ItemType, &item.MimeType, &item.SizeBytes, &item.FilePath, &item.FileHash, &item.IsEncrypted, &item.DigitalSig, &item.BoxID, &item.CollectionID, &item.ProjectID, &item.CreatedAt, &item.UpdatedAt, &item.DeletedAt)
		items = append(items, item)
	}
	return items, nil
}

func (r *Repository) SoftDeleteItem(id int64) error {
	_, err := r.db.Exec(`UPDATE items SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?`, id)
	return err
}

func (r *Repository) RestoreItem(id int64) error {
	_, err := r.db.Exec(`UPDATE items SET deleted_at = NULL WHERE id = ?`, id)
	return err
}

// ----------------- TAGS -----------------

func (r *Repository) CreateTag(tag *models.Tag) error {
	query := `INSERT INTO tags (name, color_hex, parent_id) VALUES (?, ?, ?)`
	res, err := r.db.Exec(query, tag.Name, tag.ColorHex, tag.ParentID)
	if err != nil {
		return err
	}
	id, err := res.LastInsertId()
	if err == nil {
		tag.ID = id
	}
	return nil
}

func (r *Repository) ListTags() ([]models.Tag, error) {
	rows, err := r.db.Query(`SELECT id, name, color_hex, parent_id, created_at FROM tags ORDER BY name ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tags []models.Tag
	for rows.Next() {
		var t models.Tag
		_ = rows.Scan(&t.ID, &t.Name, &t.ColorHex, &t.ParentID, &t.CreatedAt)
		tags = append(tags, t)
	}
	return tags, nil
}

// ----------------- COLLECTIONS -----------------

func (r *Repository) CreateCollection(c *models.Collection) error {
	query := `INSERT INTO collections (title, description, cover_item_id, parent_id) VALUES (?, ?, ?, ?)`
	res, err := r.db.Exec(query, c.Title, c.Description, c.CoverItemID, c.ParentID)
	if err != nil {
		return err
	}
	id, err := res.LastInsertId()
	if err == nil {
		c.ID = id
	}
	return nil
}

func (r *Repository) ListCollections() ([]models.Collection, error) {
	rows, err := r.db.Query(`SELECT id, title, description, cover_item_id, parent_id, created_at FROM collections ORDER BY id DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var cols []models.Collection
	for rows.Next() {
		var c models.Collection
		_ = rows.Scan(&c.ID, &c.Title, &c.Description, &c.CoverItemID, &c.ParentID, &c.CreatedAt)
		cols = append(cols, c)
	}
	return cols, nil
}

// ----------------- PROJECTS -----------------

func (r *Repository) CreateProject(p *models.Project) error {
	query := `INSERT INTO projects (title, description, status, deadline, client_id) VALUES (?, ?, ?, ?, ?)`
	res, err := r.db.Exec(query, p.Title, p.Description, p.Status, p.Deadline, p.ClientID)
	if err != nil {
		return err
	}
	id, err := res.LastInsertId()
	if err == nil {
		p.ID = id
	}
	return nil
}

func (r *Repository) ListProjects() ([]models.Project, error) {
	rows, err := r.db.Query(`SELECT id, title, description, status, deadline, client_id, created_at FROM projects ORDER BY id DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var projects []models.Project
	for rows.Next() {
		var p models.Project
		_ = rows.Scan(&p.ID, &p.Title, &p.Description, &p.Status, &p.Deadline, &p.ClientID, &p.CreatedAt)
		projects = append(projects, p)
	}
	return projects, nil
}

// ----------------- CLIENTS -----------------

func (r *Repository) CreateClient(c *models.Client) error {
	query := `INSERT INTO clients (name, email, company, notes) VALUES (?, ?, ?, ?)`
	res, err := r.db.Exec(query, c.Name, c.Email, c.Company, c.Notes)
	if err != nil {
		return err
	}
	id, err := res.LastInsertId()
	if err == nil {
		c.ID = id
	}
	return nil
}

func (r *Repository) ListClients() ([]models.Client, error) {
	rows, err := r.db.Query(`SELECT id, name, email, company, notes, created_at FROM clients ORDER BY id DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var clients []models.Client
	for rows.Next() {
		var c models.Client
		_ = rows.Scan(&c.ID, &c.Name, &c.Email, &c.Company, &c.Notes, &c.CreatedAt)
		clients = append(clients, c)
	}
	return clients, nil
}

// ----------------- DEVICES -----------------

func (r *Repository) CreateDevice(d *models.Device) error {
	query := `INSERT INTO devices (name, device_type, ip_address, mac_address, encrypted_ssh, is_online, last_seen) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
	res, err := r.db.Exec(query, d.Name, d.DeviceType, d.IPAddress, d.MacAddress, d.EncryptedSSH, d.IsOnline)
	if err != nil {
		return err
	}
	id, err := res.LastInsertId()
	if err == nil {
		d.ID = id
	}
	return nil
}

func (r *Repository) ListDevices() ([]models.Device, error) {
	rows, err := r.db.Query(`SELECT id, name, device_type, ip_address, mac_address, encrypted_ssh, is_online, last_seen FROM devices ORDER BY id DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var devices []models.Device
	for rows.Next() {
		var d models.Device
		_ = rows.Scan(&d.ID, &d.Name, &d.DeviceType, &d.IPAddress, &d.MacAddress, &d.EncryptedSSH, &d.IsOnline, &d.LastSeen)
		devices = append(devices, d)
	}
	return devices, nil
}

// ----------------- SCRIPTS -----------------

func (r *Repository) CreateScript(s *models.Script) error {
	query := `INSERT INTO scripts (title, interpreter, code, timeout_sec) VALUES (?, ?, ?, ?)`
	res, err := r.db.Exec(query, s.Title, s.Interpreter, s.Code, s.TimeoutSec)
	if err != nil {
		return err
	}
	id, err := res.LastInsertId()
	if err == nil {
		s.ID = id
	}
	return nil
}

func (r *Repository) ListScripts() ([]models.Script, error) {
	rows, err := r.db.Query(`SELECT id, title, interpreter, code, timeout_sec, created_at FROM scripts ORDER BY id DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var scripts []models.Script
	for rows.Next() {
		var s models.Script
		_ = rows.Scan(&s.ID, &s.Title, &s.Interpreter, &s.Code, &s.TimeoutSec, &s.CreatedAt)
		scripts = append(scripts, s)
	}
	return scripts, nil
}

// ----------------- BOXES -----------------

func (r *Repository) CreateBox(b *models.Box) error {
	query := `INSERT INTO boxes (name, location, description, barcode) VALUES (?, ?, ?, ?)`
	res, err := r.db.Exec(query, b.Name, b.Location, b.Description, b.Barcode)
	if err != nil {
		return err
	}
	id, err := res.LastInsertId()
	if err == nil {
		b.ID = id
	}
	return nil
}

func (r *Repository) ListBoxes() ([]models.Box, error) {
	rows, err := r.db.Query(`SELECT id, name, location, description, barcode, created_at FROM boxes ORDER BY id DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var boxes []models.Box
	for rows.Next() {
		var b models.Box
		_ = rows.Scan(&b.ID, &b.Name, &b.Location, &b.Description, &b.Barcode, &b.CreatedAt)
		boxes = append(boxes, b)
	}
	return boxes, nil
}

// ----------------- NOTES -----------------

func (r *Repository) CreateNote(n *models.Note) error {
	query := `INSERT INTO notes (title, content, is_pinned, item_id) VALUES (?, ?, ?, ?)`
	res, err := r.db.Exec(query, n.Title, n.Content, n.IsPinned, n.ItemID)
	if err != nil {
		return err
	}
	id, err := res.LastInsertId()
	if err == nil {
		n.ID = id
	}
	return nil
}

func (r *Repository) ListNotes() ([]models.Note, error) {
	rows, err := r.db.Query(`SELECT id, title, content, is_pinned, item_id, created_at, updated_at FROM notes ORDER BY is_pinned DESC, id DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notes []models.Note
	for rows.Next() {
		var n models.Note
		_ = rows.Scan(&n.ID, &n.Title, &n.Content, &n.IsPinned, &n.ItemID, &n.CreatedAt, &n.UpdatedAt)
		notes = append(notes, n)
	}
	return notes, nil
}

// ----------------- EVENTS -----------------

func (r *Repository) LogEvent(eventType, message, details string) error {
	query := `INSERT INTO events (event_type, message, details) VALUES (?, ?, ?)`
	_, err := r.db.Exec(query, eventType, message, details)
	return err
}

func (r *Repository) ListEvents(limit int) ([]models.Event, error) {
	rows, err := r.db.Query(`SELECT id, event_type, message, details, timestamp FROM events ORDER BY id DESC LIMIT ?`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []models.Event
	for rows.Next() {
		var e models.Event
		_ = rows.Scan(&e.ID, &e.EventType, &e.Message, &e.Details, &e.Timestamp)
		events = append(events, e)
	}
	return events, nil
}

// ----------------- FTS5 SEARCH -----------------

func (r *Repository) SearchFTS5(q string, limit int) ([]models.SearchResult, error) {
	cleanQ := strings.ReplaceAll(q, "'", "''")
	matchQuery := fmt.Sprintf("%s*", cleanQ)

	query := `
	SELECT i.id, i.title, i.description, i.item_type, 1.0 as score
	FROM item_fts fts
	JOIN items i ON fts.rowid = i.id
	WHERE item_fts MATCH ? AND i.deleted_at IS NULL
	LIMIT ?
	`

	rows, err := r.db.Query(query, matchQuery, limit)
	if err != nil {
		// Fallback to LIKE if FTS expression is invalid
		likeQuery := "%" + cleanQ + "%"
		fallbackQuery := `SELECT id, title, description, item_type, 1.0 FROM items WHERE (title LIKE ? OR description LIKE ?) AND deleted_at IS NULL LIMIT ?`
		rows, err = r.db.Query(fallbackQuery, likeQuery, likeQuery, limit)
		if err != nil {
			return nil, err
		}
	}
	defer rows.Close()

	var results []models.SearchResult
	for rows.Next() {
		var res models.SearchResult
		_ = rows.Scan(&res.ID, &res.Title, &res.Description, &res.ItemType, &res.Score)
		results = append(results, res)
	}
	return results, nil
}
