import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Layers,
  Users,
  Monitor,
  Terminal,
  Package,
  Wifi,
  ShieldCheck,
  Search,
  Plus,
  UploadCloud,
  Lock,
  RefreshCw,
  X,
  Key,
  Check,
  Trash2,
  ExternalLink,
  Activity,
  HardDrive
} from 'lucide-react';

const API_BASE = 'http://localhost:8000/api/v1';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [encryptUpload, setEncryptUpload] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Data states
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState([]);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [devices, setDevices] = useState([]);
  const [scripts, setScripts] = useState([]);
  const [boxes, setBoxes] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  // New item modal states
  const [newNoteModalOpen, setNewNoteModalOpen] = useState(false);
  const [noteForm, setNoteForm] = useState({ title: '', content: '', folder: 'general' });
  
  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: '', description: '', status: 'active' });

  // P2P status simulated/live state
  const [p2pStatus, setP2pStatus] = useState({ mode: 'DIRECT_P2P', target: 'phone', latencyMs: 1.4, online: true });

  // Keyboard shortcut Ctrl+K / Cmd+K for Spotlight search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [itemsRes, notesRes, projRes, clientRes, devRes, scrRes, boxRes, evtRes] = await Promise.allSettled([
        fetch(`${API_BASE}/items`).then((r) => r.json()),
        fetch(`${API_BASE}/notes`).then((r) => r.json()),
        fetch(`${API_BASE}/projects`).then((r) => r.json()),
        fetch(`${API_BASE}/clients`).then((r) => r.json()),
        fetch(`${API_BASE}/devices`).then((r) => r.json()),
        fetch(`${API_BASE}/scripts`).then((r) => r.json()),
        fetch(`${API_BASE}/boxes`).then((r) => r.json()),
        fetch(`${API_BASE}/events`).then((r) => r.json()),
      ]);

      if (itemsRes.status === 'fulfilled' && Array.isArray(itemsRes.value)) setItems(itemsRes.value);
      if (notesRes.status === 'fulfilled' && Array.isArray(notesRes.value)) setNotes(notesRes.value);
      if (projRes.status === 'fulfilled' && Array.isArray(projRes.value)) setProjects(projRes.value);
      if (clientRes.status === 'fulfilled' && Array.isArray(clientRes.value)) setClients(clientRes.value);
      if (devRes.status === 'fulfilled' && Array.isArray(devRes.value)) setDevices(devRes.value);
      if (scrRes.status === 'fulfilled' && Array.isArray(scrRes.value)) setScripts(scrRes.value);
      if (boxRes.status === 'fulfilled' && Array.isArray(boxRes.value)) setBoxes(boxRes.value);
      if (evtRes.status === 'fulfilled' && Array.isArray(evtRes.value)) setEvents(evtRes.value);
    } catch (err) {
      console.error('Error fetching data from Go backend API:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Handle Spotlight Search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setSearchResults(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Search failed:', e);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle File Upload
  const handleDropFile = async (file) => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('encrypt', encryptUpload ? 'true' : 'false');

    try {
      const res = await fetch(`${API_BASE}/files/upload`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        setUploadModalOpen(false);
        fetchAllData();
      }
    } catch (err) {
      console.error('File upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  // Handle Create Note
  const handleCreateNote = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteForm),
      });
      if (res.ok) {
        setNewNoteModalOpen(false);
        setNoteForm({ title: '', content: '', folder: 'general' });
        fetchAllData();
      }
    } catch (err) {
      console.error('Create note failed:', err);
    }
  };

  // Handle Create Project
  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectForm),
      });
      if (res.ok) {
        setNewProjectModalOpen(false);
        setProjectForm({ name: '', description: '', status: 'active' });
        fetchAllData();
      }
    } catch (err) {
      console.error('Create project failed:', err);
    }
  };

  // Delete Item
  const handleDeleteItem = async (id) => {
    try {
      await fetch(`${API_BASE}/items/${id}`, { method: 'DELETE' });
      fetchAllData();
    } catch (err) {
      console.error('Delete item failed:', err);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'assets', label: 'Vault Assets', icon: FolderKanban, count: items.length },
    { id: 'notes', label: 'Notes', icon: FileText, count: notes.length },
    { id: 'projects', label: 'Projects', icon: Layers, count: projects.length },
    { id: 'clients', label: 'Clients', icon: Users, count: clients.length },
    { id: 'devices', label: 'Devices', icon: Monitor, count: devices.length },
    { id: 'scripts', label: 'Scripts', icon: Terminal, count: scripts.length },
    { id: 'boxes', label: 'Storage Boxes', icon: Package, count: boxes.length },
    { id: 'p2p', label: 'Mesh P2P', icon: Wifi },
    { id: 'audit', label: 'Audit Log', icon: ShieldCheck, count: events.length },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0b0f19] text-slate-100">
      {/* LEFT SIDEBAR */}
      <aside className="w-64 flex-shrink-0 bg-slate-900/80 border-r border-slate-800 flex flex-col justify-between p-4 backdrop-blur-xl select-none">
        <div>
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 px-2 py-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Key className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-wide text-white">Enywheria</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 p2p-online-glow"></span>
                <span className="text-[11px] font-medium text-slate-400">Pure Go Engine</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                    active
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${active ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${active ? 'bg-indigo-500/30 text-indigo-300' : 'bg-slate-800 text-slate-400'}`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Info */}
        <div className="pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between px-2 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
              <span>SQLite FTS5</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">AES-256</span>
          </div>
        </div>
      </aside>

      {/* MAIN VIEW AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-br from-slate-950 via-[#0b0f19] to-slate-900">
        {/* HEADER BAR */}
        <header className="h-16 border-b border-slate-800/80 px-6 flex items-center justify-between bg-slate-900/40 backdrop-blur-md">
          {/* Spotlight Trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-3 px-4 py-2 bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-xs text-slate-400 transition-all w-80 shadow-inner"
          >
            <Search className="w-4 h-4 text-slate-400" />
            <span>Search vault entities...</span>
            <kbd className="ml-auto bg-slate-900 border border-slate-700 text-[10px] font-mono px-2 py-0.5 rounded text-slate-300">
              Ctrl + K
            </kbd>
          </button>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {/* P2P LAN Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-xs font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 p2p-online-glow"></span>
              <span>LAN P2P: 192.168.0.x ({p2pStatus.latencyMs}ms)</span>
            </div>

            <button
              onClick={() => setUploadModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload File</span>
            </button>

            <button
              onClick={fetchAllData}
              className="p-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl transition-all"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* BODY CONTENT VIEW */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Quick Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="glass-panel rounded-2xl p-5 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                    <span>Total Vault Assets</span>
                    <FolderKanban className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-2xl font-bold text-white mt-2">{items.length}</div>
                  <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Encrypted & Sharded
                  </div>
                </div>

                <div className="glass-panel rounded-2xl p-5 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                    <span>Notes & Docs</span>
                    <FileText className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold text-white mt-2">{notes.length}</div>
                  <div className="text-[11px] text-slate-400 mt-1">Full FTS5 Indexing</div>
                </div>

                <div className="glass-panel rounded-2xl p-5 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                    <span>Active Projects</span>
                    <Layers className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-bold text-white mt-2">{projects.length}</div>
                  <div className="text-[11px] text-amber-400 mt-1">Go Backend SQLite</div>
                </div>

                <div className="glass-panel rounded-2xl p-5 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                    <span>Mesh P2P Link</span>
                    <Wifi className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold text-emerald-400 mt-2">DIRECT_P2P</div>
                  <div className="text-[11px] text-slate-400 mt-1">Dual-LAN UDP Punching</div>
                </div>
              </div>

              {/* Two Column Layout: Recent Assets & Audit Stream */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Recent Assets Card */}
                <div className="glass-panel rounded-2xl p-5 border border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                      <FolderKanban className="w-4 h-4 text-indigo-400" />
                      Recent Vault Assets
                    </h3>
                    <button onClick={() => setActiveTab('assets')} className="text-xs text-indigo-400 hover:underline">
                      View all ({items.length})
                    </button>
                  </div>
                  <div className="space-y-2">
                    {items.slice(0, 5).map((item) => (
                      <div key={item.id} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-medium text-slate-200">{item.title}</div>
                          <div className="text-[10px] font-mono text-slate-500">{item.file_hash ? item.file_hash.substring(0, 16) + '...' : item.item_type}</div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-mono">
                          {item.is_encrypted ? 'AES-256' : 'PLAIN'}
                        </span>
                      </div>
                    ))}
                    {items.length === 0 && <div className="text-xs text-slate-500 italic py-4 text-center">No assets stored yet. Click 'Upload File' to add.</div>}
                  </div>
                </div>

                {/* Audit Stream Card */}
                <div className="glass-panel rounded-2xl p-5 border border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      Security Audit Stream
                    </h3>
                    <button onClick={() => setActiveTab('audit')} className="text-xs text-amber-400 hover:underline">
                      View log
                    </button>
                  </div>
                  <div className="space-y-2">
                    {events.slice(0, 5).map((evt) => (
                      <div key={evt.id} className="p-2.5 bg-slate-900/60 rounded-xl border-l-2 border-amber-500/80 text-xs">
                        <div className="font-mono text-slate-300 font-medium">{evt.event_type}</div>
                        <div className="text-[11px] text-slate-400">{evt.message}</div>
                      </div>
                    ))}
                    {events.length === 0 && <div className="text-xs text-slate-500 italic py-4 text-center">No audit events logged yet.</div>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VAULT ASSETS TAB */}
          {activeTab === 'assets' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Vault Assets & Storage</h2>
                  <p className="text-xs text-slate-400">SHA-256 Sharded & AES-256-GCM Encrypted Objects</p>
                </div>
                <button
                  onClick={() => setUploadModalOpen(true)}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium flex items-center gap-2 shadow-md"
                >
                  <UploadCloud className="w-4 h-4" /> Upload New File
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {items.map((item) => (
                  <div key={item.id} className="glass-panel glass-panel-hover rounded-2xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-indigo-400 truncate max-w-[180px]">{item.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                          {(item.size_bytes / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mb-3">{item.description || 'No description'}</p>
                      {item.file_hash && (
                        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-400 break-all mb-3">
                          <span className="text-indigo-400">SHA-256:</span> {item.file_hash}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                      <div className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
                        <Lock className="w-3 h-3" />
                        <span>{item.is_encrypted ? 'Encrypted' : 'Plain'}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Delete asset"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NOTES TAB */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Notes & Knowledge Vault</h2>
                  <p className="text-xs text-slate-400">Markdown documents with FTS5 instant search</p>
                </div>
                <button
                  onClick={() => setNewNoteModalOpen(true)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium flex items-center gap-2 shadow-md"
                >
                  <Plus className="w-4 h-4" /> New Note
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {notes.map((note) => (
                  <div key={note.id} className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-sm text-emerald-400">{note.title}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 font-mono">{note.folder || 'general'}</span>
                    </div>
                    <p className="text-xs text-slate-300 whitespace-pre-wrap line-clamp-4 font-mono bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
                      {note.content}
                    </p>
                  </div>
                ))}
                {notes.length === 0 && (
                  <div className="col-span-2 text-center text-xs text-slate-500 py-12">
                    No notes created yet. Click 'New Note' to write one.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PROJECTS TAB */}
          {activeTab === 'projects' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Projects & Tasks</h2>
                  <p className="text-xs text-slate-400">Track initiatives and deliverables</p>
                </div>
                <button
                  onClick={() => setNewProjectModalOpen(true)}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-medium flex items-center gap-2 shadow-md"
                >
                  <Plus className="w-4 h-4" /> Add Project
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {projects.map((p) => (
                  <div key={p.id} className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-sm text-white">{p.name}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 uppercase font-bold tracking-wider">{p.status}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">{p.description || 'No description'}</p>
                  </div>
                ))}
                {projects.length === 0 && (
                  <div className="col-span-3 text-center text-xs text-slate-500 py-12">No projects created yet.</div>
                )}
              </div>
            </div>
          )}

          {/* CLIENTS TAB */}
          {activeTab === 'clients' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white">Clients & Contacts</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {clients.map((c) => (
                  <div key={c.id} className="glass-panel rounded-2xl p-4">
                    <h3 className="font-semibold text-sm text-white">{c.name}</h3>
                    <p className="text-xs text-slate-400">{c.email || 'No email'}</p>
                  </div>
                ))}
                {clients.length === 0 && <div className="col-span-3 text-center text-xs text-slate-500 py-12">No clients recorded.</div>}
              </div>
            </div>
          )}

          {/* DEVICES TAB */}
          {activeTab === 'devices' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white">Managed Devices & Nodes</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {devices.map((d) => (
                  <div key={d.id} className="glass-panel rounded-2xl p-4 border border-slate-800">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm text-indigo-400">{d.name}</h3>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded">{d.ip_address}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">{d.os_type}</p>
                  </div>
                ))}
                {devices.length === 0 && <div className="col-span-3 text-center text-xs text-slate-500 py-12">No devices registered.</div>}
              </div>
            </div>
          )}

          {/* SCRIPTS TAB */}
          {activeTab === 'scripts' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white">Automations & Scripts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scripts.map((s) => (
                  <div key={s.id} className="glass-panel rounded-2xl p-4 border border-slate-800">
                    <h3 className="font-semibold text-sm text-emerald-400">{s.title}</h3>
                    <pre className="text-xs font-mono text-slate-300 bg-slate-950 p-3 rounded-xl mt-2 overflow-x-auto">{s.code}</pre>
                  </div>
                ))}
                {scripts.length === 0 && <div className="col-span-2 text-center text-xs text-slate-500 py-12">No scripts stored.</div>}
              </div>
            </div>
          )}

          {/* BOXES TAB */}
          {activeTab === 'boxes' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white">Physical & Digital Storage Boxes</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {boxes.map((b) => (
                  <div key={b.id} className="glass-panel rounded-2xl p-4">
                    <h3 className="font-semibold text-sm text-amber-400">{b.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">{b.location}</p>
                  </div>
                ))}
                {boxes.length === 0 && <div className="col-span-3 text-center text-xs text-slate-500 py-12">No storage boxes registered.</div>}
              </div>
            </div>
          )}

          {/* P2P MESH TAB */}
          {activeTab === 'p2p' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white">Mesh P2P Network Topology</h2>
                <p className="text-xs text-slate-400">Zero-dependency UDP Hole Punching & LAN Broadcast Engine</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-panel rounded-2xl p-5 border border-emerald-500/30">
                  <div className="text-xs font-medium text-slate-400">Active Link Mode</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1">DIRECT_P2P</div>
                  <p className="text-[11px] text-slate-400 mt-2">Bypasses external server for ultra-low latency local transfer</p>
                </div>

                <div className="glass-panel rounded-2xl p-5 border border-slate-800">
                  <div className="text-xs font-medium text-slate-400">Target Node</div>
                  <div className="text-xl font-bold text-indigo-400 mt-1">phone</div>
                  <p className="text-[11px] text-slate-400 mt-2">LAN IP: 192.168.0.x</p>
                </div>

                <div className="glass-panel rounded-2xl p-5 border border-slate-800">
                  <div className="text-xs font-medium text-slate-400">Roundtrip Latency</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1">1.42 ms</div>
                  <p className="text-[11px] text-slate-400 mt-2">Direct Wi-Fi Broadcast Connection</p>
                </div>
              </div>
            </div>
          )}

          {/* AUDIT LOG TAB */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white">Security & Audit Event Stream</h2>
              <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
                {events.map((evt) => (
                  <div key={evt.id} className="p-3 bg-slate-900/80 rounded-xl border-l-4 border-amber-500 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono text-amber-400 font-bold mr-3">[{evt.event_type}]</span>
                      <span className="text-slate-200">{evt.message}</span>
                    </div>
                  </div>
                ))}
                {events.length === 0 && <div className="text-xs text-slate-500 text-center py-6">No audit records found.</div>}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* SPOTLIGHT SEARCH MODAL (Ctrl + K) */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-20">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center gap-3">
              <Search className="w-5 h-5 text-indigo-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search SQLite FTS5 index (items, notes, projects)..."
                className="w-full bg-transparent text-sm text-white focus:outline-none placeholder-slate-500"
              />
              <button onClick={() => setSearchOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto p-4 space-y-2">
              {searchResults.map((res, i) => (
                <div key={i} className="p-3 bg-slate-800/60 hover:bg-slate-800 rounded-xl border border-slate-700/50 cursor-pointer">
                  <div className="flex items-center justify-between text-xs font-semibold text-indigo-400">
                    <span>{res.title}</span>
                    <span className="text-[10px] font-mono bg-slate-900 px-2 py-0.5 rounded text-slate-400">{res.entity_type}</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{res.snippet}</p>
                </div>
              ))}
              {searchQuery && searchResults.length === 0 && (
                <div className="text-xs text-slate-500 text-center py-8">No FTS5 search matches found.</div>
              )}
              {!searchQuery && (
                <div className="text-xs text-slate-500 text-center py-8">Type to execute full-text search query across all vault tables.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FILE UPLOAD MODAL */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-indigo-400" />
                Upload Asset to Vault
              </h3>
              <button onClick={() => setUploadModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 text-xs">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-200">AES-256-GCM Encryption</span>
              </div>
              <input
                type="checkbox"
                checked={encryptUpload}
                onChange={(e) => setEncryptUpload(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded"
              />
            </div>

            <label className="border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-950/40">
              <UploadCloud className="w-10 h-10 text-indigo-400 mb-2" />
              <span className="text-xs font-semibold text-slate-200">Click or Drag file to upload</span>
              <span className="text-[10px] text-slate-500 mt-1">Automatic SHA-256 sharding & deduplication</span>
              <input
                type="file"
                className="hidden"
                onChange={(e) => e.target.files && handleDropFile(e.target.files[0])}
              />
            </label>

            {uploading && (
              <div className="mt-4 text-center text-xs text-indigo-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" /> Uploading & Encrypting...
              </div>
            )}
          </div>
        </div>
      )}

      {/* NEW NOTE MODAL */}
      {newNoteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center">
          <form onSubmit={handleCreateNote} className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-white">Create Markdown Note</h3>
              <button type="button" onClick={() => setNewNoteModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <input
              type="text"
              required
              placeholder="Note Title"
              value={noteForm.title}
              onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
            />

            <textarea
              required
              rows={6}
              placeholder="Write Markdown note content..."
              value={noteForm.content}
              onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
            />

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setNewNoteModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-xl"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs text-white font-semibold rounded-xl shadow-md">
                Save Note
              </button>
            </div>
          </form>
        </div>
      )}

      {/* NEW PROJECT MODAL */}
      {newProjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center">
          <form onSubmit={handleCreateProject} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-white">Add New Project</h3>
              <button type="button" onClick={() => setNewProjectModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <input
              type="text"
              required
              placeholder="Project Name"
              value={projectForm.name}
              onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
            />

            <textarea
              rows={3}
              placeholder="Project Description..."
              value={projectForm.description}
              onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
            />

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setNewProjectModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-xl"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-xs text-white font-semibold rounded-xl shadow-md">
                Create Project
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
