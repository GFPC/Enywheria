package models

import (
	"time"
)

type Item struct {
	ID           int64      `json:"id" db:"id"`
	Title        string     `json:"title" db:"title"`
	Description  string     `json:"description" db:"description"`
	ItemType     string     `json:"item_type" db:"item_type"` // document, image, audio, video, archive, script, note, asset
	MimeType     string     `json:"mime_type" db:"mime_type"`
	SizeBytes    int64      `json:"size_bytes" db:"size_bytes"`
	FilePath     string     `json:"file_path" db:"file_path"`
	FileHash     string     `json:"file_hash" db:"file_hash"`
	IsEncrypted  bool       `json:"is_encrypted" db:"is_encrypted"`
	DigitalSig   string     `json:"digital_sig" db:"digital_sig"`
	BoxID        *int64     `json:"box_id,omitempty" db:"box_id"`
	CollectionID *int64     `json:"collection_id,omitempty" db:"collection_id"`
	ProjectID    *int64     `json:"project_id,omitempty" db:"project_id"`
	CreatedAt    time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt    *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
}

type Tag struct {
	ID        int64     `json:"id" db:"id"`
	Name      string    `json:"name" db:"name"`
	ColorHex  string    `json:"color_hex" db:"color_hex"`
	ParentID  *int64    `json:"parent_id,omitempty" db:"parent_id"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

type Collection struct {
	ID          int64     `json:"id" db:"id"`
	Title       string    `json:"title" db:"title"`
	Description string    `json:"description" db:"description"`
	CoverItemID *int64    `json:"cover_item_id,omitempty" db:"cover_item_id"`
	ParentID    *int64    `json:"parent_id,omitempty" db:"parent_id"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

type Project struct {
	ID          int64      `json:"id" db:"id"`
	Title       string     `json:"title" db:"title"`
	Description string     `json:"description" db:"description"`
	Status      string     `json:"status" db:"status"` // active, paused, done, archived
	Deadline    *time.Time `json:"deadline,omitempty" db:"deadline"`
	ClientID    *int64     `json:"client_id,omitempty" db:"client_id"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
}

type Client struct {
	ID        int64     `json:"id" db:"id"`
	Name      string    `json:"name" db:"name"`
	Email     string    `json:"email" db:"email"`
	Company   string    `json:"company" db:"company"`
	Notes     string    `json:"notes" db:"notes"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

type Device struct {
	ID           int64     `json:"id" db:"id"`
	Name         string    `json:"name" db:"name"`
	DeviceType   string    `json:"device_type" db:"device_type"` // pc, phone, server, router
	IPAddress    string    `json:"ip_address" db:"ip_address"`
	MacAddress   string    `json:"mac_address" db:"mac_address"`
	EncryptedSSH string    `json:"encrypted_ssh" db:"encrypted_ssh"`
	IsOnline     bool      `json:"is_online" db:"is_online"`
	LastSeen     time.Time `json:"last_seen" db:"last_seen"`
}

type Script struct {
	ID          int64     `json:"id" db:"id"`
	Title       string    `json:"title" db:"title"`
	Interpreter string    `json:"interpreter" db:"interpreter"` // bash, python, powershell
	Code        string    `json:"code" db:"code"`
	TimeoutSec  int       `json:"timeout_sec" db:"timeout_sec"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

type Box struct {
	ID          int64     `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	Location    string    `json:"location" db:"location"`
	Description string    `json:"description" db:"description"`
	Barcode     string    `json:"barcode" db:"barcode"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

type Note struct {
	ID        int64     `json:"id" db:"id"`
	Title     string    `json:"title" db:"title"`
	Content   string    `json:"content" db:"content"`
	IsPinned  bool      `json:"is_pinned" db:"is_pinned"`
	ItemID    *int64    `json:"item_id,omitempty" db:"item_id"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

type Event struct {
	ID        int64     `json:"id" db:"id"`
	EventType string    `json:"event_type" db:"event_type"` // item_created, file_uploaded, script_executed, device_ping
	Message   string    `json:"message" db:"message"`
	Details   string    `json:"details" db:"details"`
	Timestamp time.Time `json:"timestamp" db:"timestamp"`
}

type SearchResult struct {
	ID          int64   `json:"id"`
	Title       string  `json:"title"`
	Description string  `json:"description"`
	ItemType    string  `json:"item_type"`
	Score       float64 `json:"score"`
}
