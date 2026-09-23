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
  HardDrive,
  Grid,
  List,
  ChevronRight,
  Copy,
  Server,
  ArrowUpRight,
  Clock,
  Shield,
  Radio
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
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

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

  // Copy state
  const [copiedId, setCopiedId] = useState(null);

  // Note selection
  const [selectedNote, setSelectedNote] = useState(null);

  // Modals state
  const [newNoteModalOpen, setNewNoteModalOpen] = useState(false);
  const [noteForm, setNoteForm] = useState({ title: '', content: '', folder: 'general' });

  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: '', description: '', status: 'active' });

  // P2P ping telemetry
  const [p2pLatency, setP2pLatency] = useState(1.4);

  // Keyboard shortcut Ctrl+K
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
      if (notesRes.status === 'fulfilled' && Array.isArray(notesRes.value)) {
        setNotes(notesRes.value);
        if (notesRes.value.length > 0 && !selectedNote) setSelectedNote(notesRes.value[0]);
      }
      if (projRes.status === 'fulfilled' && Array.isArray(projRes.value)) setProjects(projRes.value);
      if (clientRes.status === 'fulfilled' && Array.isArray(clientRes.value)) setClients(clientRes.value);
      if (devRes.status === 'fulfilled' && Array.isArray(devRes.value)) setDevices(devRes.value);
      if (scrRes.status === 'fulfilled' && Array.isArray(scrRes.value)) setScripts(scrRes.value);
      if (boxRes.status === 'fulfilled' && Array.isArray(boxRes.value)) setBoxes(boxRes.value);
      if (evtRes.status === 'fulfilled' && Array.isArray(evtRes.value)) setEvents(evtRes.value);
    } catch (err) {
      console.error('API Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Spotlight search
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
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Upload file
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

  // Create note
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

  // Create project
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

  // Delete item
  const handleDeleteItem = async (id) => {
    try {
      await fetch(`${API_BASE}/items/${id}`, { method: 'DELETE' });
      fetchAllData();
    } catch (err) {
      console.error('Delete item failed:', err);
    }
  };

  // Copy helper
  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const navigation = [
    {
      group: 'WORKSPACE',
      items: [
        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
        { id: 'assets', label: 'Vault Storage', icon: FolderKanban, count: items.length },
        { id: 'notes', label: 'Knowledge Base', icon: FileText, count: notes.length },
        { id: 'projects', label: 'Projects & Tasks', icon: Layers, count: projects.length },
      ],
    },
    {
      group: 'INFRASTRUCTURE',
      items: [
        { id: 'clients', label: 'Entities & Clients', icon: Users, count: clients.length },
        { id: 'devices', label: 'Managed Nodes', icon: Monitor, count: devices.length },
        { id: 'scripts', label: 'Automation Scripts', icon: Terminal, count: scripts.length },
        { id: 'boxes', label: 'Storage Boxes', icon: Package, count: boxes.length },
      ],
    },
    {
      group: 'SYSTEM & NETWORK',
      items: [
        { id: 'p2p', label: 'Mesh Topology', icon: Radio },
        { id: 'audit', label: 'Security Audit Log', icon: ShieldCheck, count: events.length },
      ],
    },
  ];

  return (
    <div className="flex h-screen w-screen bg-[#09090b] text-zinc-100 font-sans select-none overflow-hidden antialiased">
      {/* ENTERPRISE SIDEBAR */}
      <aside className="w-64 flex-shrink-0 bg-[#0c0c0e] border-r border-zinc-800/80 flex flex-col justify-between p-4 z-20">
        <div>
          {/* Brand Header */}
          <div className="flex items-center gap-3 px-2 py-3 mb-6 border-b border-zinc-800/60 pb-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-semibold text-sm tracking-tight text-white flex items-center gap-1.5">
                PersonalVault
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                  v0.1.0
                </span>
              </div>
              <div className="text-[11px] text-zinc-400 font-mono">Pure Go Infrastructure</div>
            </div>
          </div>

          {/* Navigation Groups */}
          <div className="space-y-6">
            {navigation.map((group, idx) => (
              <div key={idx}>
                <div className="px-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 font-mono">
                  {group.group}
                </div>
                <nav className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                          active
                            ? 'bg-zinc-800/90 text-white shadow-sm border border-zinc-700/60'
                            : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${active ? 'text-indigo-400' : 'text-zinc-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.count !== undefined && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                            active ? 'bg-zinc-700 text-zinc-200' : 'bg-zinc-900 text-zinc-500'
                          }`}>
                            {item.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>
        </div>

        {/* System Telemetry Footer */}
        <div className="pt-4 border-t border-zinc-800/80">
          <div className="bg-[#121215] rounded-xl p-3 border border-zinc-800 text-xs space-y-2">
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                P2P Link Status
              </span>
              <span className="text-emerald-400 font-medium">{p2pLatency} ms</span>
            </div>
            <div className="text-[10px] text-zinc-500 font-mono flex justify-between border-t border-zinc-800/60 pt-2">
              <span>DIRECT_P2P</span>
              <span>192.168.0.x</span>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* HEADER BAR */}
        <header className="h-14 border-b border-zinc-800/80 px-6 flex items-center justify-between bg-[#0c0c0e]/80 backdrop-blur-md">
          {/* Spotlight Trigger Button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-3 px-3 py-1.5 bg-[#121215] hover:bg-zinc-800/70 border border-zinc-800 rounded-lg text-xs text-zinc-400 transition-all w-80 shadow-sm group"
          >
            <Search className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200" />
            <span>Search vault entities...</span>
            <kbd className="ml-auto bg-zinc-900 border border-zinc-700/80 text-[10px] font-mono px-1.5 py-0.5 rounded text-zinc-400">
              Ctrl K
            </kbd>
          </button>

          {/* Action Header Items */}
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex bg-[#121215] border border-zinc-800 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded transition-colors ${viewMode === 'grid' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}
                title="Grid View"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1 rounded transition-colors ${viewMode === 'table' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Refresh Data */}
            <button
              onClick={fetchAllData}
              className="p-1.5 bg-[#121215] hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Upload Button */}
            <button
              onClick={() => setUploadModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium shadow-sm transition-colors"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Asset</span>
            </button>
          </div>
        </header>

        {/* MAIN BODY VIEW */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="saas-card saas-card-hover rounded-xl p-4 border border-zinc-800">
                  <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
                    <span>Vault Assets</span>
                    <FolderKanban className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-2xl font-semibold text-white mt-2">{items.length}</div>
                  <div className="text-[11px] text-zinc-500 mt-1 font-mono">SHA-256 Sharded</div>
                </div>

                <div className="saas-card saas-card-hover rounded-xl p-4 border border-zinc-800">
                  <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
                    <span>Knowledge Base</span>
                    <FileText className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-semibold text-white mt-2">{notes.length}</div>
                  <div className="text-[11px] text-zinc-500 mt-1 font-mono">SQLite FTS5 Indexed</div>
                </div>

                <div className="saas-card saas-card-hover rounded-xl p-4 border border-zinc-800">
                  <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
                    <span>Projects & Tasks</span>
                    <Layers className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-semibold text-white mt-2">{projects.length}</div>
                  <div className="text-[11px] text-zinc-500 mt-1 font-mono">Active Kanban</div>
                </div>

                <div className="saas-card saas-card-hover rounded-xl p-4 border border-zinc-800">
                  <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
                    <span>Mesh P2P Link</span>
                    <Wifi className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-xl font-semibold text-emerald-400 mt-2">DIRECT_P2P</div>
                  <div className="text-[11px] text-zinc-500 mt-1 font-mono">{p2pLatency} ms roundtrip</div>
                </div>
              </div>

              {/* Two Column Layout: Recent Assets & Audit Log */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Assets Card */}
                <div className="saas-card rounded-xl p-5 border border-zinc-800">
                  <div className="flex items-center justify-between mb-4 border-b border-zinc-800/80 pb-3">
                    <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                      <FolderKanban className="w-4 h-4 text-indigo-400" />
                      Recent Assets
                    </h3>
                    <button onClick={() => setActiveTab('assets')} className="text-xs text-indigo-400 hover:underline flex items-center gap-1">
                      View all <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {items.slice(0, 5).map((item) => (
                      <div key={item.id} className="p-3 bg-[#0d0d0f] rounded-lg border border-zinc-800/70 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-medium text-white">{item.title}</div>
                          <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                            {item.file_hash ? `SHA256: ${item.file_hash.substring(0, 20)}...` : item.item_type}
                          </div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono border border-zinc-700">
                          {item.is_encrypted ? 'AES-256' : 'PLAIN'}
                        </span>
                      </div>
                    ))}
                    {items.length === 0 && (
                      <div className="text-xs text-zinc-500 italic py-6 text-center">No vault assets stored yet.</div>
                    )}
                  </div>
                </div>

                {/* Audit Stream Card */}
                <div className="saas-card rounded-xl p-5 border border-zinc-800">
                  <div className="flex items-center justify-between mb-4 border-b border-zinc-800/80 pb-3">
                    <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      Security Audit Stream
                    </h3>
                    <button onClick={() => setActiveTab('audit')} className="text-xs text-amber-400 hover:underline flex items-center gap-1">
                      Full Log <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {events.slice(0, 5).map((evt) => (
                      <div key={evt.id} className="p-2.5 bg-[#0d0d0f] rounded-lg border-l-2 border-amber-500 text-xs">
                        <div className="font-mono text-amber-400 font-medium">{evt.event_type}</div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">{evt.message}</div>
                      </div>
                    ))}
                    {events.length === 0 && (
                      <div className="text-xs text-zinc-500 italic py-6 text-center">No security audit events recorded.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VAULT STORAGE TAB */}
          {activeTab === 'assets' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Vault Storage</h2>
                  <p className="text-xs text-zinc-400">SHA-256 Sharded & AES-256-GCM Encrypted Objects</p>
                </div>
                <button
                  onClick={() => setUploadModalOpen(true)}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-2 shadow-sm transition-colors"
                >
                  <UploadCloud className="w-3.5 h-3.5" /> Upload File
                </button>
              </div>

              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {items.map((item) => (
                    <div key={item.id} className="saas-card saas-card-hover rounded-xl p-4 flex flex-col justify-between border border-zinc-800">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-white truncate max-w-[180px]">{item.title}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                            {(item.size_bytes / 1024).toFixed(1)} KB
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mb-3 line-clamp-2">{item.description || 'No description'}</p>
                        {item.file_hash && (
                          <div className="bg-[#0b0b0e] p-2 rounded-lg border border-zinc-800/80 text-[10px] font-mono text-zinc-400 break-all mb-3">
                            <div className="flex items-center justify-between text-indigo-400 mb-1">
                              <span>SHA-256:</span>
                              <button
                                onClick={() => copyToClipboard(item.file_hash, item.id)}
                                className="hover:text-white transition-colors"
                              >
                                {copiedId === item.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                            <span>{item.file_hash}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-xs">
                        <div className="flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                          <Lock className="w-3 h-3" />
                          <span>{item.is_encrypted ? 'AES-256' : 'PLAIN'}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 text-zinc-500 hover:text-rose-400 transition-colors"
                          title="Delete asset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div className="col-span-3 text-center text-xs text-zinc-500 py-12">No files stored yet.</div>
                  )}
                </div>
              ) : (
                <div className="saas-card rounded-xl overflow-hidden border border-zinc-800">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#0b0b0e] text-zinc-400 border-b border-zinc-800 text-[10px] uppercase tracking-wider">
                      <tr>
                        <th className="p-3">Title</th>
                        <th className="p-3">SHA-256 Hash</th>
                        <th className="p-3">Size</th>
                        <th className="p-3">Encryption</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-zinc-800/30">
                          <td className="p-3 font-semibold text-white">{item.title}</td>
                          <td className="p-3 text-zinc-400 text-[11px]">{item.file_hash ? item.file_hash.substring(0, 24) + '...' : '-'}</td>
                          <td className="p-3 text-zinc-300">{(item.size_bytes / 1024).toFixed(1)} KB</td>
                          <td className="p-3 text-emerald-400">{item.is_encrypted ? 'AES-256' : 'PLAIN'}</td>
                          <td className="p-3 text-right">
                            <button onClick={() => handleDeleteItem(item.id)} className="text-zinc-500 hover:text-rose-400">
                              <Trash2 className="w-3.5 h-3.5 inline" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* KNOWLEDGE BASE TAB */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Knowledge Base</h2>
                  <p className="text-xs text-zinc-400">Markdown docs & SQLite FTS5 instant search</p>
                </div>
                <button
                  onClick={() => setNewNoteModalOpen(true)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium flex items-center gap-2 shadow-sm transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> New Document
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[580px]">
                {/* Note Selector List */}
                <div className="saas-card rounded-xl p-3 border border-zinc-800 overflow-y-auto space-y-1.5">
                  {notes.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => setSelectedNote(n)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedNote?.id === n.id
                          ? 'bg-zinc-800/90 border-indigo-500/50 text-white'
                          : 'bg-[#0b0b0e] border-zinc-800/80 text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-white">{n.title}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-500 border border-zinc-800">
                          {n.folder || 'general'}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate">{n.content}</p>
                    </div>
                  ))}
                  {notes.length === 0 && <div className="text-xs text-zinc-500 text-center py-12">No documents created.</div>}
                </div>

                {/* Note Detail Panel */}
                <div className="lg:col-span-2 saas-card rounded-xl p-5 border border-zinc-800 flex flex-col justify-between">
                  {selectedNote ? (
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                        <h3 className="text-base font-semibold text-white">{selectedNote.title}</h3>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {selectedNote.folder || 'general'}
                        </span>
                      </div>
                      <pre className="text-xs font-mono text-zinc-300 bg-[#0b0b0e] p-4 rounded-xl border border-zinc-800/80 h-[460px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
                        {selectedNote.content}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-center text-zinc-500 text-xs py-24">Select a document from the left list.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PROJECTS TAB */}
          {activeTab === 'projects' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Projects & Tasks</h2>
                  <p className="text-xs text-zinc-400">Sprint planning and task execution</p>
                </div>
                <button
                  onClick={() => setNewProjectModalOpen(true)}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-medium flex items-center gap-2 shadow-sm transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Project
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {projects.map((p) => (
                  <div key={p.id} className="saas-card saas-card-hover rounded-xl p-4 border border-zinc-800">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-xs text-white">{p.name}</h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 font-medium border border-amber-800/50 uppercase">
                        {p.status}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mb-3">{p.description || 'No description'}</p>
                    <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-zinc-800">
                      <div className="bg-amber-500 h-full w-3/4 rounded-full"></div>
                    </div>
                  </div>
                ))}
                {projects.length === 0 && <div className="col-span-3 text-center text-xs text-zinc-500 py-12">No projects created.</div>}
              </div>
            </div>
          )}

          {/* CLIENTS */}
          {activeTab === 'clients' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Entities & Clients</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {clients.map((c) => (
                  <div key={c.id} className="saas-card rounded-xl p-4 border border-zinc-800">
                    <h3 className="font-semibold text-xs text-white">{c.name}</h3>
                    <p className="text-xs text-zinc-400 mt-1 font-mono">{c.email || 'No email'}</p>
                  </div>
                ))}
                {clients.length === 0 && <div className="col-span-3 text-center text-xs text-zinc-500 py-12">No client records.</div>}
              </div>
            </div>
          )}

          {/* MANAGED DEVICES */}
          {activeTab === 'devices' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Managed Infrastructure Nodes</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {devices.map((d) => (
                  <div key={d.id} className="saas-card rounded-xl p-4 border border-zinc-800">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-xs text-white">{d.name}</h3>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                        {d.ip_address}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-2">{d.os_type}</p>
                  </div>
                ))}
                {devices.length === 0 && <div className="col-span-3 text-center text-xs text-zinc-500 py-12">No nodes registered.</div>}
              </div>
            </div>
          )}

          {/* AUTOMATION SCRIPTS */}
          {activeTab === 'scripts' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Automation Scripts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scripts.map((s) => (
                  <div key={s.id} className="saas-card rounded-xl p-4 border border-zinc-800">
                    <h3 className="font-semibold text-xs text-emerald-400">{s.title}</h3>
                    <pre className="text-xs font-mono text-zinc-300 bg-[#0b0b0e] p-3 rounded-lg mt-2 overflow-x-auto border border-zinc-800">
                      {s.code}
                    </pre>
                  </div>
                ))}
                {scripts.length === 0 && <div className="col-span-2 text-center text-xs text-zinc-500 py-12">No scripts saved.</div>}
              </div>
            </div>
          )}

          {/* STORAGE BOXES */}
          {activeTab === 'boxes' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Storage Containers</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {boxes.map((b) => (
                  <div key={b.id} className="saas-card rounded-xl p-4 border border-zinc-800">
                    <h3 className="font-semibold text-xs text-white">{b.name}</h3>
                    <p className="text-xs text-zinc-400 mt-1">{b.location}</p>
                  </div>
                ))}
                {boxes.length === 0 && <div className="col-span-3 text-center text-xs text-zinc-500 py-12">No storage boxes registered.</div>}
              </div>
            </div>
          )}

          {/* MESH P2P RADAR */}
          {activeTab === 'p2p' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white">Mesh Network Topology</h2>
                <p className="text-xs text-zinc-400">Zero-dependency UDP Hole Punching & Subnet Discovery</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="saas-card rounded-xl p-4 border border-emerald-500/30">
                  <div className="text-xs font-mono text-zinc-400 uppercase">Link Mode</div>
                  <div className="text-xl font-semibold text-emerald-400 mt-2">DIRECT_P2P</div>
                  <p className="text-[11px] text-zinc-400 mt-2">LAN Directed Subnet Broadcast</p>
                </div>

                <div className="saas-card rounded-xl p-4 border border-zinc-800">
                  <div className="text-xs font-mono text-zinc-400 uppercase">Target Node</div>
                  <div className="text-xl font-semibold text-indigo-400 mt-2">phone</div>
                  <p className="text-[11px] text-zinc-400 mt-2">LAN IP: 192.168.0.x</p>
                </div>

                <div className="saas-card rounded-xl p-4 border border-zinc-800">
                  <div className="text-xs font-mono text-zinc-400 uppercase">Latency</div>
                  <div className="text-xl font-semibold text-emerald-400 mt-2">{p2pLatency} ms</div>
                  <p className="text-[11px] text-zinc-400 mt-2">Direct Local UDP</p>
                </div>
              </div>
            </div>
          )}

          {/* SECURITY AUDIT LOG */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Security Audit Log</h2>
              <div className="saas-card rounded-xl p-4 border border-zinc-800 space-y-2">
                {events.map((evt) => (
                  <div key={evt.id} className="p-2.5 bg-[#0b0b0e] rounded-lg border-l-2 border-amber-500 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-mono text-amber-400 font-semibold mr-3">[{evt.event_type}]</span>
                      <span className="text-zinc-200">{evt.message}</span>
                    </div>
                  </div>
                ))}
                {events.length === 0 && <div className="text-xs text-zinc-500 text-center py-6">No audit records found.</div>}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* COMMAND PALETTE MODAL (Ctrl + K) */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-24">
          <div className="w-full max-w-xl bg-[#121215] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
            <div className="p-3 border-b border-zinc-800 flex items-center gap-3">
              <Search className="w-4 h-4 text-zinc-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type a command or search index (FTS5)..."
                className="w-full bg-transparent text-xs text-white focus:outline-none placeholder-zinc-500 font-mono"
              />
              <button onClick={() => setSearchOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto p-3 space-y-1.5 font-mono text-xs">
              {searchResults.map((res, i) => (
                <div key={i} className="p-2.5 bg-[#0b0b0e] hover:bg-zinc-800/60 rounded-lg border border-zinc-800 cursor-pointer">
                  <div className="flex items-center justify-between text-indigo-400 font-semibold">
                    <span>{res.title}</span>
                    <span className="text-[9px] bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-400">{res.entity_type}</span>
                  </div>
                  <p className="text-zinc-400 mt-0.5 text-[11px]">{res.snippet}</p>
                </div>
              ))}
              {searchQuery && searchResults.length === 0 && (
                <div className="text-xs text-zinc-500 text-center py-6">No matches found.</div>
              )}
              {!searchQuery && (
                <div className="text-xs text-zinc-500 text-center py-6">Type to search items, notes, and projects.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD MODAL */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center">
          <div className="w-full max-w-md bg-[#121215] border border-zinc-800 rounded-xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-indigo-400" />
                Upload Vault Asset
              </h3>
              <button onClick={() => setUploadModalOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-4 flex items-center justify-between p-2.5 bg-[#0b0b0e] rounded-lg border border-zinc-800">
              <div className="flex items-center gap-2 text-xs">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-zinc-300 font-mono">AES-256-GCM Encryption</span>
              </div>
              <input
                type="checkbox"
                checked={encryptUpload}
                onChange={(e) => setEncryptUpload(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded"
              />
            </div>

            <label className="border border-dashed border-zinc-700 hover:border-indigo-500/60 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-[#0b0b0e]">
              <UploadCloud className="w-8 h-8 text-indigo-400 mb-2" />
              <span className="text-xs font-semibold text-white">Click or Drag file to upload</span>
              <span className="text-[10px] font-mono text-zinc-500 mt-1">Automatic SHA-256 Sharding</span>
              <input
                type="file"
                className="hidden"
                onChange={(e) => e.target.files && handleDropFile(e.target.files[0])}
              />
            </label>

            {uploading && (
              <div className="mt-3 text-center text-xs text-indigo-400 flex items-center justify-center gap-2 font-mono">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Encrypting & Uploading...
              </div>
            )}
          </div>
        </div>
      )}

      {/* NEW NOTE MODAL */}
      {newNoteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center">
          <form onSubmit={handleCreateNote} className="w-full max-w-lg bg-[#121215] border border-zinc-800 rounded-xl p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-white">New Markdown Document</h3>
              <button type="button" onClick={() => setNewNoteModalOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              required
              placeholder="Document Title"
              value={noteForm.title}
              onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
              className="w-full bg-[#0b0b0e] border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            />

            <textarea
              required
              rows={6}
              placeholder="Markdown content..."
              value={noteForm.content}
              onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
              className="w-full bg-[#0b0b0e] border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNewNoteModalOpen(false)}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 rounded-lg font-mono"
              >
                Cancel
              </button>
              <button type="submit" className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-xs text-white font-medium rounded-lg shadow-sm">
                Save Document
              </button>
            </div>
          </form>
        </div>
      )}

      {/* NEW PROJECT MODAL */}
      {newProjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center">
          <form onSubmit={handleCreateProject} className="w-full max-w-md bg-[#121215] border border-zinc-800 rounded-xl p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-white">Create Project</h3>
              <button type="button" onClick={() => setNewProjectModalOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              required
              placeholder="Project Name"
              value={projectForm.name}
              onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
              className="w-full bg-[#0b0b0e] border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            />

            <textarea
              rows={3}
              placeholder="Project Description..."
              value={projectForm.description}
              onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
              className="w-full bg-[#0b0b0e] border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNewProjectModalOpen(false)}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 rounded-lg font-mono"
              >
                Cancel
              </button>
              <button type="submit" className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-xs text-white font-medium rounded-lg shadow-sm">
                Create Project
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
