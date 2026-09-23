# ⚡ Personal Knowledge & Asset System (PersonalVault)

High-performance, local personal vault and knowledge management system built with Python 3.11+, FastAPI, async SQLAlchemy 2.0, SQLite FTS5 full-text search, SHA-256 sharded file deduplication, AES-GCM encryption, ECDSA signatures, and an HTMX/Alpine.js web dashboard.

---

## 🧱 10 Core Entities

1. **Item** — Central asset repository (photo, pdf, note, link, script, schematic, log, firmware, other). Supports soft delete (`deleted_at`).
2. **Tag** — Flexible hierarchical tags with HEX colors.
3. **Collection** — Logical groupings & folders with optional cover item.
4. **Project** — Projects with status (`active`, `paused`, `done`, `archived`), deadlines, client linkage.
5. **Client** — People / Organizations associated with projects.
6. **Device** — Hardware devices (PC, Phone, MCU, Router, SBC) with status tracking (`online`, `offline`), IP, MAC, SSH keys.
7. **Script** — Automation scripts (Bash, Python, PowerShell) executable per device.
8. **Box** — Physical boxes/shelves tracking hardware location and items inside.
9. **Note** — Markdown text notes.
10. **Event** — Audit log of uploads, script runs, device status transitions, and syncs.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Language | Python 3.11+ |
| Web Framework | FastAPI |
| Database | SQLite (`data/app.db`) via `aiosqlite` |
| ORM | SQLAlchemy 2.0 (Async Declarative) |
| Migrations | Alembic |
| Validation | Pydantic v2 & `pydantic-settings` |
| Full-Text Search | SQLite FTS5 + RapidFuzz (fuzzy re-ranking) |
| Hashing & Deduplication | SHA-256 (`hashlib`) |
| Cryptography | AES-GCM encryption & ECDSA signatures (`cryptography`) |
| Frontend | HTMX + Alpine.js + Tailwind CSS + Jinja2 |
| Testing | Pytest + Pytest-Asyncio |
| Logging | Loguru (`data/logs/app.log`) |

---

## 🚀 Quick Start Guide

### 1. Environment Setup

```bash
# Clone repository and create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# Linux/macOS:
source .venv/bin/activate

# Install dependencies in editable mode with dev dependencies
pip install -e ".[dev]"

# Copy environment configuration
cp .env.example .env
```

### 2. Run Database Migrations

Apply Alembic migrations to create SQLite schema, FTS5 virtual table, and auto-sync triggers:

```bash
alembic upgrade head
```

### 3. Launch Development Server

```bash
uvicorn app.main:app --reload
```

- **Web Dashboard**: [http://localhost:8000/](http://localhost:8000/)
- **Swagger REST API Specs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc API Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 🧪 Running Automated Tests

Run the complete async test suite with coverage report:

```bash
pytest --cov=app --cov-report=term-missing
```

---

## 🔐 Sharded File Storage & Deduplication

Files uploaded via `POST /api/v1/files/upload`:
- Have their **SHA-256** hash calculated automatically.
- Are stored in sharded directories at `data/files/{hash[:2]}/{hash}`.
- **Deduplication**: If a file with an identical SHA-256 digest has already been uploaded, no physical disk write occurs. A new `Item` record points to the existing file path.
- **Encryption**: Files marked `is_encrypted=True` are encrypted using AES-GCM prior to disk storage.
- **ECDSA Signatures**: Digital signatures generated using private key in `data/keys/ecdsa_private.pem`.

---

## 🔍 Full-Text & Fuzzy Search Architecture

- **SQLite FTS5**: Maintains virtual index table `item_fts` on `title` and `content`.
- **Database Triggers**: `item_fts_ai`, `item_fts_au`, `item_fts_ad` automatically sync `items` table changes into `item_fts`.
- **Fuzzy Re-Ranking**: Search query results are re-ranked using `rapidfuzz.fuzz.token_sort_ratio` for maximum contextual relevance.
- **Autocompletion**: `GET /api/v1/search/suggest?q=...` provides live search suggestions across items, notes, and scripts.
