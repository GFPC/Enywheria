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
  Radio,
  Sliders,
  Sparkles,
  Command,
  FileCode,
  Tag,
  ArrowRight,
  ChevronDown
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

  // Copy helper state
  const [copiedId, setCopiedId] = useState(null);

  // Markdown Studio state
  const [selectedNote, setSelectedNote] = useState(null);
  const [noteViewMode, setNoteViewMode] = useState('split'); // 'split' | 'edit' | 'preview'

  // Modals state
  const [newNoteModalOpen, setNewNoteModalOpen] = useState(false);
  const [noteForm, setNoteForm] = useState({ title: '', content: '', folder: 'general' });

  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: '', description: '', status: 'active' });

  // Audit filter state
  const [auditFilter, setAuditFilter] = useState('ALL');

  // P2P telemetry
  const [p2pLatency, setP2pLatency] = useState(1.42);

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
        { id: 'dashboard', label: 'Command Hub', icon: LayoutDashboard },
        { id: 'assets', label: 'Vault Assets', icon: FolderKanban, count: items.length },
        { id: 'notes', label: 'Knowledge Base', icon: FileText, count: notes.length },
        { id: 'projects', label: 'Mission Operations', icon: Layers, count: projects.length },
      ],
    },
    {
      group: 'INFRASTRUCTURE',
      items: [
        { id: 'clients', label: 'Entities & Clients', icon: Users, count: clients.length },
        { id: 'devices', label: 'Managed Nodes', icon: Monitor, count: devices.length },
        { id: 'scripts', label: 'Automation Matrix', icon: Terminal, count: scripts.length },
        { id: 'boxes', label: 'Storage Units', icon: Package, count: boxes.length },
      ],
    },
    {
      group: 'SECURITY & NETWORK',
      items: [
        { id: 'p2p', label: 'Mesh Telemetry', icon: Radio },
        { id: 'audit', label: 'Security Stream', icon: ShieldCheck, count: events.length },
      ],
    },
  ];

  return (
    <div className="flex h-screen w-screen bg-[#080a0f] text-slate-100 font-sans select-none overflow-hidden antialiased">
      {/* SIDEBAR */}
      <aside className="w-64 flex-shrink-0 bg-[#0d0f17]/90 border-r border-slate-800/80 flex flex-col justify-between p-4 z-20 backdrop-blur-xl">
        <div>
          {/* Brand Header */}
          <div className="flex items-center gap-3 px-2 py-3 mb-6 border-b border-slate-800/60 pb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                PersonalVault
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/50">
                  Go Engine
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 status-pulse"></span>
                <span>FTS5 • AES-256</span>
              </div>
            </div>
          </div>

          {/* Navigation Groups */}
          <div className="space-y-6">
            {navigation.map((group, idx) => (
              <div key={idx}>
                <div className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-mono">
                  {group.group}
                </div>
                <nav className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-150 ${
                          active
                            ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/40 shadow-sm'
                            : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${active ? 'text-indigo-400' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.count !== undefined && (
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono ${
                            active ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-500/30' : 'bg-slate-900 text-slate-400'
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

        {/* Mesh P2P Telemetry Widget */}
        <div className="bg-[#0b0e18] rounded-2xl p-3 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between font-mono text-[11px]">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              P2P Telemetry
            </span>
            <span className="text-emerald-400 font-bold">{p2pLatency} ms</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono flex justify-between border-t border-slate-800/60 pt-2">
            <span>DIRECT_P2P</span>
            <span className="text-indigo-400">192.168.0.x</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* HEADER BAR */}
        <header className="h-15 border-b border-slate-800/80 px-6 flex items-center justify-between bg-[#0b0e17]/80 backdrop-blur-md">
          {/* Breadcrumb Path */}
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="text-slate-300 font-semibold">PersonalVault</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-indigo-400 capitalize font-semibold">{activeTab}</span>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-3">
            {/* Command Palette Trigger */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-3 px-3 py-1.5 bg-[#0e121e] hover:bg-[#141a2a] border border-slate-800 hover:border-indigo-500/40 rounded-xl text-xs text-slate-400 transition-all w-72 shadow-inner group"
            >
              <Search className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span className="font-mono text-slate-300">Command menu (FTS5)...</span>
              <kbd className="ml-auto bg-slate-900 border border-slate-800 text-[10px] font-mono px-1.5 py-0.5 rounded text-indigo-300">
                Ctrl K
              </kbd>
            </button>

            {/* View Mode Toggle */}
            <div className="flex bg-[#0e121e] border border-slate-800 rounded-xl p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                title="Grid View"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Refresh Data */}
            <button
              onClick={fetchAllData}
              className="p-2 bg-[#0e121e] hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Upload File Button */}
            <button
              onClick={() => setUploadModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all hover:scale-105"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Asset</span>
            </button>
          </div>
        </header>

        {/* MAIN BODY VIEW */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Telemetry Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="titanium-card titanium-card-hover rounded-2xl p-5 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider font-mono">
                    <span>Vault Assets</span>
                    <FolderKanban className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-3xl font-bold text-white mt-3">{items.length}</div>
                  <div className="text-[11px] text-emerald-400 mt-2 font-mono flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> SHA-256 Encrypted
                  </div>
                </div>

                <div className="titanium-card titanium-card-hover rounded-2xl p-5 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider font-mono">
                    <span>Knowledge Docs</span>
                    <FileText className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-3xl font-bold text-white mt-3">{notes.length}</div>
                  <div className="text-[11px] text-slate-400 mt-2 font-mono">FTS5 Indexed</div>
                </div>

                <div className="titanium-card titanium-card-hover rounded-2xl p-5 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider font-mono">
                    <span>Active Projects</span>
                    <Layers className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-3xl font-bold text-white mt-3">{projects.length}</div>
                  <div className="text-[11px] text-amber-400 mt-2 font-mono">Kanban Workflows</div>
                </div>

                <div className="titanium-card titanium-card-hover rounded-2xl p-5 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider font-mono">
                    <span>Mesh P2P Link</span>
                    <Wifi className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold text-emerald-400 mt-3">DIRECT_P2P</div>
                  <div className="text-[11px] text-slate-400 mt-2 font-mono">{p2pLatency} ms roundtrip</div>
                </div>
              </div>

              {/* Two Column Layout: Recent Assets & Audit Log */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Assets Card */}
                <div className="titanium-card rounded-2xl p-5 border border-slate-800">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
                    <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                      <FolderKanban className="w-4 h-4 text-indigo-400" />
                      Recent Vault Assets
                    </h3>
                    <button onClick={() => setActiveTab('assets')} className="text-xs text-indigo-400 hover:underline flex items-center gap-1 font-mono">
                      View all ({items.length}) <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {items.slice(0, 5).map((item) => (
                      <div key={item.id} className="p-3 bg-[#0a0d15] rounded-xl border border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-medium text-white">{item.title}</div>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            {item.file_hash ? `SHA256: ${item.file_hash.substring(0, 20)}...` : item.item_type}
                          </div>
                        </div>
                        <span className="text-[10px] px-2.5 py-1 rounded-md bg-indigo-950/80 text-indigo-300 font-mono border border-indigo-800/50">
                          {item.is_encrypted ? 'AES-256-GCM' : 'PLAIN'}
                        </span>
                      </div>
                    ))}
                    {items.length === 0 && (
                      <div className="text-xs text-slate-400 italic py-6 text-center">No vault assets uploaded yet.</div>
                    )}
                  </div>
                </div>

                {/* Audit Log Stream */}
                <div className="titanium-card rounded-2xl p-5 border border-slate-800">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
                    <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      Security Audit Stream
                    </h3>
                    <button onClick={() => setActiveTab('audit')} className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-mono">
                      Full Log ({events.length}) <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {events.slice(0, 5).map((evt) => (
                      <div key={evt.id} className="p-3 bg-[#0a0d15] rounded-xl border-l-3 border-amber-500 text-xs">
                        <div className="font-mono text-amber-400 font-bold">{evt.event_type}</div>
                        <div className="text-[11px] text-slate-300 mt-0.5">{evt.message}</div>
                      </div>
                    ))}
                    {events.length === 0 && (
                      <div className="text-xs text-slate-400 italic py-6 text-center">No security audit records logged.</div>
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
                  <h2 className="text-xl font-bold text-white">Vault Storage Matrix</h2>
                  <p className="text-xs text-slate-400 font-mono">SHA-256 Content Addressed & AES-256-GCM Encrypted</p>
                </div>
                <button
                  onClick={() => setUploadModalOpen(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md transition-all"
                >
                  <UploadCloud className="w-4 h-4" /> Upload Asset
                </button>
              </div>

              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {items.map((item) => (
                    <div key={item.id} className="titanium-card titanium-card-hover rounded-2xl p-5 flex flex-col justify-between border border-slate-800">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold text-indigo-400 truncate max-w-[200px]">{item.title}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 font-mono border border-slate-800">
                            {(item.size_bytes / 1024).toFixed(1)} KB
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mb-3">{item.description || 'No description provided'}</p>
                        {item.file_hash && (
                          <div className="bg-[#070911] p-2.5 rounded-xl border border-slate-800 text-[10px] font-mono text-slate-400 break-all mb-3">
                            <div className="flex items-center justify-between text-indigo-400 mb-1">
                              <span>SHA-256:</span>
                              <button
                                onClick={() => copyToClipboard(item.file_hash, item.id)}
                                className="hover:text-white transition-colors"
                              >
                                {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                            <span>{item.file_hash}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
                          <Lock className="w-3.5 h-3.5" />
                          <span>{item.is_encrypted ? 'AES-256-GCM' : 'PLAIN'}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Delete asset"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && <div className="col-span-3 text-center text-xs text-slate-400 py-12">No assets stored yet.</div>}
                </div>
              ) : (
                <div className="titanium-card rounded-2xl overflow-hidden border border-slate-800">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#070911] text-slate-400 border-b border-slate-800 text-[10px] uppercase tracking-wider">
                      <tr>
                        <th className="p-4">Title</th>
                        <th className="p-4">SHA-256 Hash</th>
                        <th className="p-4">Size</th>
                        <th className="p-4">Encryption</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-800/30">
                          <td className="p-4 font-semibold text-white">{item.title}</td>
                          <td className="p-4 text-slate-400 text-[11px]">{item.file_hash ? item.file_hash.substring(0, 24) + '...' : '-'}</td>
                          <td className="p-4 text-slate-300">{(item.size_bytes / 1024).toFixed(1)} KB</td>
                          <td className="p-4 text-emerald-400">{item.is_encrypted ? 'AES-256' : 'PLAIN'}</td>
                          <td className="p-4 text-right">
                            <button onClick={() => handleDeleteItem(item.id)} className="text-slate-400 hover:text-rose-400">
                              <Trash2 className="w-4 h-4 inline" />
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

          {/* KNOWLEDGE BASE STUDIO TAB (NOTES) */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Knowledge Studio</h2>
                  <p className="text-xs text-slate-400 font-mono">Markdown documentation & instant SQLite FTS5 search</p>
                </div>
                <button
                  onClick={() => setNewNoteModalOpen(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md transition-all"
                >
                  <Plus className="w-4 h-4" /> New Document
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[580px]">
                {/* Note Selector Directory */}
                <div className="titanium-card rounded-2xl p-4 border border-slate-800 overflow-y-auto space-y-2">
                  {notes.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => setSelectedNote(n)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        selectedNote?.id === n.id
                          ? 'bg-emerald-950/40 border-emerald-500/60 text-white shadow-md'
                          : 'bg-[#090d15] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-emerald-400">{n.title}</span>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                          {n.folder || 'general'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{n.content}</p>
                    </div>
                  ))}
                  {notes.length === 0 && <div className="text-xs text-slate-400 text-center py-12">No notes created.</div>}
                </div>

                {/* Note Detail Panel */}
                <div className="lg:col-span-2 titanium-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
                  {selectedNote ? (
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div>
                          <h3 className="text-base font-bold text-white">{selectedNote.title}</h3>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            {selectedNote.content.length} chars • {(selectedNote.content.length / 200).toFixed(1)} min read
                          </div>
                        </div>
                        <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                          {selectedNote.folder || 'general'}
                        </span>
                      </div>
                      <pre className="text-xs font-mono text-slate-200 bg-[#070911] p-5 rounded-2xl border border-slate-800 h-[450px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
                        {selectedNote.content}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-center text-slate-400 text-xs py-24">Select a document from the left directory.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* MISSION OPERATIONS (PROJECTS) */}
          {activeTab === 'projects' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Mission Operations Kanban</h2>
                  <p className="text-xs text-slate-400 font-mono">Sprint planning & project execution</p>
                </div>
                <button
                  onClick={() => setNewProjectModalOpen(true)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md transition-all"
                >
                  <Plus className="w-4 h-4" /> Add Project
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {projects.map((p) => (
                  <div key={p.id} className="titanium-card titanium-card-hover rounded-2xl p-5 border border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-sm text-white">{p.name}</h3>
                      <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-amber-950 text-amber-300 font-bold uppercase tracking-wider border border-amber-800/60">
                        {p.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">{p.description || 'No description'}</p>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                      <div className="bg-amber-500 h-full w-2/3 rounded-full"></div>
                    </div>
                  </div>
                ))}
                {projects.length === 0 && <div className="col-span-3 text-center text-xs text-slate-400 py-12">No projects created yet.</div>}
              </div>
            </div>
          )}

          {/* CLIENTS */}
          {activeTab === 'clients' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">Entities & Client Intelligence</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {clients.map((c) => (
                  <div key={c.id} className="titanium-card rounded-2xl p-5 border border-slate-800">
                    <h3 className="font-bold text-sm text-indigo-400">{c.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 font-mono">{c.email || 'No contact email'}</p>
                  </div>
                ))}
                {clients.length === 0 && <div className="col-span-3 text-center text-xs text-slate-400 py-12">No entity records.</div>}
              </div>
            </div>
          )}

          {/* MANAGED HARDWARE NODES */}
          {activeTab === 'devices' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">Managed Infrastructure Nodes</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {devices.map((d) => (
                  <div key={d.id} className="titanium-card rounded-2xl p-5 border border-slate-800">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-cyan-400">{d.name}</h3>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                        {d.ip_address}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">{d.os_type}</p>
                  </div>
                ))}
                {devices.length === 0 && <div className="col-span-3 text-center text-xs text-slate-400 py-12">No hardware nodes registered.</div>}
              </div>
            </div>
          )}

          {/* AUTOMATION SCRIPTS */}
          {activeTab === 'scripts' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">Automation Script Matrix</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scripts.map((s) => (
                  <div key={s.id} className="titanium-card rounded-2xl p-5 border border-slate-800">
                    <h3 className="font-bold text-sm text-emerald-400">{s.title}</h3>
                    <pre className="text-xs font-mono text-slate-300 bg-[#070a12] p-4 rounded-xl mt-3 overflow-x-auto border border-slate-800">
                      {s.code}
                    </pre>
                  </div>
                ))}
                {scripts.length === 0 && <div className="col-span-2 text-center text-xs text-slate-400 py-12">No scripts registered.</div>}
              </div>
            </div>
          )}

          {/* STORAGE BOXES */}
          {activeTab === 'boxes' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">Storage Containers & Units</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {boxes.map((b) => (
                  <div key={b.id} className="titanium-card rounded-2xl p-5 border border-slate-800">
                    <h3 className="font-bold text-sm text-amber-400">{b.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">{b.location}</p>
                  </div>
                ))}
                {boxes.length === 0 && <div className="col-span-3 text-center text-xs text-slate-400 py-12">No containers registered.</div>}
              </div>
            </div>
          )}

          {/* MESH P2P RADAR */}
          {activeTab === 'p2p' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Mesh Network Telemetry</h2>
                <p className="text-xs text-slate-400 font-mono">Zero-dependency UDP Hole Punching & Directed Subnet Broadcast Engine</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="titanium-card rounded-2xl p-5 border border-emerald-500/40">
                  <div className="text-xs font-mono text-slate-400 uppercase">Link Mode</div>
                  <div className="text-2xl font-bold text-emerald-400 mt-2">DIRECT_P2P</div>
                  <p className="text-[11px] text-slate-400 mt-2">LAN Directed Subnet Broadcast</p>
                </div>

                <div className="titanium-card rounded-2xl p-5 border border-slate-800">
                  <div className="text-xs font-mono text-slate-400 uppercase">Linked Peer</div>
                  <div className="text-2xl font-bold text-indigo-400 mt-2">phone</div>
                  <p className="text-[11px] text-slate-400 mt-2">LAN IP: 192.168.0.x</p>
                </div>

                <div className="titanium-card rounded-2xl p-5 border border-slate-800">
                  <div className="text-xs font-mono text-slate-400 uppercase">Roundtrip Latency</div>
                  <div className="text-2xl font-bold text-cyan-400 mt-2">{p2pLatency} ms</div>
                  <p className="text-[11px] text-slate-400 mt-2">Direct Local UDP</p>
                </div>
              </div>
            </div>
          )}

          {/* SECURITY AUDIT STREAM */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Security & Audit Stream</h2>
                <div className="flex gap-2">
                  {['ALL', 'file_uploaded', 'item_created'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setAuditFilter(filter)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${
                        auditFilter === filter
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              <div className="titanium-card rounded-2xl p-5 border border-slate-800 space-y-3">
                {events
                  .filter((e) => auditFilter === 'ALL' || e.event_type === auditFilter)
                  .map((evt) => (
                    <div key={evt.id} className="p-3 bg-[#080c16] rounded-xl border-l-4 border-amber-500 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-mono text-amber-400 font-bold mr-3">[{evt.event_type}]</span>
                        <span className="text-slate-200">{evt.message}</span>
                      </div>
                    </div>
                  ))}
                {events.length === 0 && <div className="text-xs text-slate-400 text-center py-8">No security events recorded.</div>}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* SPOTLIGHT MODAL (Ctrl + K) */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center pt-24">
          <div className="w-full max-w-xl bg-[#0e121e] border border-indigo-500/40 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center gap-3">
              <Search className="w-5 h-5 text-indigo-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type a command or search index (FTS5)..."
                className="w-full bg-transparent text-sm text-white focus:outline-none placeholder-slate-500 font-mono"
              />
              <button onClick={() => setSearchOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto p-4 space-y-2 font-mono text-xs">
              {searchResults.map((res, i) => (
                <div key={i} className="p-3 bg-[#090d17] hover:bg-[#12192c] rounded-xl border border-slate-800 cursor-pointer transition-colors">
                  <div className="flex items-center justify-between font-bold text-indigo-400">
                    <span>{res.title}</span>
                    <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-400 border border-slate-800">{res.entity_type}</span>
                  </div>
                  <p className="text-slate-300 mt-1 text-[11px]">{res.snippet}</p>
                </div>
              ))}
              {searchQuery && searchResults.length === 0 && (
                <div className="text-xs text-slate-400 text-center py-8">No matches found.</div>
              )}
              {!searchQuery && (
                <div className="text-xs text-slate-400 text-center py-8">Type query to search across all vault tables.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FILE UPLOAD MODAL */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center">
          <div className="w-full max-w-md bg-[#0e121e] border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-indigo-400" />
                Upload Vault Asset
              </h3>
              <button onClick={() => setUploadModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 flex items-center justify-between p-3 bg-[#070911] rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 text-xs">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-200 font-mono">AES-256-GCM Encryption</span>
              </div>
              <input
                type="checkbox"
                checked={encryptUpload}
                onChange={(e) => setEncryptUpload(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded"
              />
            </div>

            <label className="border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all bg-[#070911]">
              <UploadCloud className="w-10 h-10 text-indigo-400 mb-2" />
              <span className="text-xs font-bold text-white">Click or Drag file to upload</span>
              <span className="text-[10px] font-mono text-slate-400 mt-1">Automatic SHA-256 Content Sharding</span>
              <input
                type="file"
                className="hidden"
                onChange={(e) => e.target.files && handleDropFile(e.target.files[0])}
              />
            </label>

            {uploading && (
              <div className="mt-4 text-center text-xs text-indigo-400 flex items-center justify-center gap-2 font-mono">
                <RefreshCw className="w-4 h-4 animate-spin" /> Storing & Encrypting...
              </div>
            )}
          </div>
        </div>
      )}

      {/* NEW NOTE MODAL */}
      {newNoteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center">
          <form onSubmit={handleCreateNote} className="w-full max-w-lg bg-[#0e121e] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-white">New Markdown Document</h3>
              <button type="button" onClick={() => setNewNoteModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <input
              type="text"
              required
              placeholder="Document Title"
              value={noteForm.title}
              onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
              className="w-full bg-[#070911] border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
            />

            <textarea
              required
              rows={6}
              placeholder="Markdown content..."
              value={noteForm.content}
              onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
              className="w-full bg-[#070911] border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
            />

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setNewNoteModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-xl font-mono"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs text-white font-semibold rounded-xl shadow-md">
                Save Document
              </button>
            </div>
          </form>
        </div>
      )}

      {/* NEW PROJECT MODAL */}
      {newProjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center">
          <form onSubmit={handleCreateProject} className="w-full max-w-md bg-[#0e121e] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-white">Create Project</h3>
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
              className="w-full bg-[#070911] border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
            />

            <textarea
              rows={3}
              placeholder="Project Description..."
              value={projectForm.description}
              onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
              className="w-full bg-[#070911] border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
            />

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setNewProjectModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-xl font-mono"
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
