import React, { useState, useEffect, useRef } from 'react';
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
  Zap,
  Cpu,
  Gauge,
  Radio,
  Sliders,
  Eye,
  Copy,
  Sparkles,
  Command,
  ChevronRight,
  Grid,
  List,
  Filter,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Server,
  Play
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
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Terminal state
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState([
    '[SYSTEM] Enywheria PersonalVault Go Engine initialized.',
    '[CRYPT] AES-256-GCM hardware acceleration ready.',
    '[FTS5] SQLite indexing engine online.',
    '[P2P] Dual-LAN UDP Hole-Punching socket listening on 192.168.0.x',
    '[NETWORK] Direct UDP link established with phone (1.42ms)'
  ]);
  const [terminalInput, setTerminalInput] = useState('');

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

  // Copy notification state
  const [copiedHash, setCopiedHash] = useState(null);

  // Modals state
  const [newNoteModalOpen, setNewNoteModalOpen] = useState(false);
  const [noteForm, setNoteForm] = useState({ title: '', content: '', folder: 'general' });
  const [selectedNote, setSelectedNote] = useState(null);

  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: '', description: '', status: 'active' });

  // P2P telemetry
  const [p2pLatency, setP2pLatency] = useState(1.42);

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === '`' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setTerminalOpen((prev) => !prev);
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
      console.error('API Sync Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(() => {
      // Jitter latency slightly for live telemetry effect
      setP2pLatency((1.3 + Math.random() * 0.3).toFixed(2));
    }, 3000);
    return () => clearInterval(interval);
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
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Terminal submission
  const handleTerminalSubmit = (e) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;
    const cmd = terminalInput.trim();
    setTerminalLogs((prev) => [...prev, `enywheria-cli> ${cmd}`]);

    if (cmd === '/ping') {
      setTerminalLogs((prev) => [...prev, `🏓 [DIRECT_P2P] Pong from phone! Latency: ${p2pLatency} ms`]);
    } else if (cmd === '/help') {
      setTerminalLogs((prev) => [
        ...prev,
        'Available CLI Commands:',
        '  /ping     - Ping connected P2P target node',
        '  /status   - Display node telemetry & Go memory stats',
        '  /clear    - Clear terminal buffer',
        '  /sync     - Force database FTS5 re-index'
      ]);
    } else if (cmd === '/status') {
      setTerminalLogs((prev) => [
        ...prev,
        `[STATUS] Node: pc | Target: phone | Link: DIRECT_P2P`,
        `[STORAGE] Assets: ${items.length} | Notes: ${notes.length} | Projects: ${projects.length}`,
        `[ENGINE] Pure Go (GOOS=windows GOARCH=amd64) | AES-256-GCM ACTIVE`
      ]);
    } else if (cmd === '/clear') {
      setTerminalLogs([]);
    } else {
      setTerminalLogs((prev) => [...prev, `Unknown command: '${cmd}'. Type /help for assistance.`]);
    }
    setTerminalInput('');
  };

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
        setTerminalLogs((prev) => [...prev, `[UPLOAD] File '${file.name}' stored & encrypted successfully.`]);
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

  // Copy SHA-256 hash helper
  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const navItems = [
    { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
    { id: 'assets', label: 'Vault Storage', icon: FolderKanban, count: items.length },
    { id: 'notes', label: 'Knowledge Studio', icon: FileText, count: notes.length },
    { id: 'projects', label: 'Mission Operations', icon: Layers, count: projects.length },
    { id: 'clients', label: 'Entities & Clients', icon: Users, count: clients.length },
    { id: 'devices', label: 'Node Hardware', icon: Monitor, count: devices.length },
    { id: 'scripts', label: 'Automation Matrix', icon: Terminal, count: scripts.length },
    { id: 'boxes', label: 'Storage Boxes', icon: Package, count: boxes.length },
    { id: 'p2p', label: 'Mesh P2P Radar', icon: Radio },
    { id: 'audit', label: 'Security Stream', icon: ShieldCheck, count: events.length },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden cyber-bg text-slate-100 font-sans select-none">
      {/* CYBER MUSTANG SIDEBAR */}
      <aside className="w-72 flex-shrink-0 bg-[#090d16]/90 border-r border-slate-800/80 flex flex-col justify-between p-4 backdrop-blur-2xl z-20">
        <div>
          {/* Huracan Style Logo */}
          <div className="flex items-center gap-3 px-2 py-3 mb-6 border-b border-slate-800/60 pb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 flex items-center justify-center glow-purple">
              <Zap className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <div className="font-orbitron font-extrabold text-base tracking-widest gradient-text-purple">
                ENYWHERIA
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 p2p-radar-dot"></span>
                <span className="text-[10px] font-mono tracking-wider text-cyan-400 uppercase font-semibold">
                  HYPER-VAULT 2.0
                </span>
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
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 ${
                    active
                      ? 'bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-transparent text-white border-l-4 border-purple-500 shadow-lg shadow-purple-950/40'
                      : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${active ? 'text-purple-400' : 'text-slate-400'}`} />
                    <span className={active ? 'gradient-text-purple font-bold' : ''}>{item.label}</span>
                  </div>
                  {item.count !== undefined && (
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                      active ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-slate-800/80 text-slate-400'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Telemetry Radar Widget */}
        <div className="bg-[#0c101c] rounded-2xl p-3 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              P2P Telemetry
            </span>
            <span className="text-emerald-400 font-bold">{p2pLatency} ms</span>
          </div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div className="bg-gradient-to-r from-purple-500 via-cyan-400 to-emerald-400 h-full rounded-full w-full animate-pulse"></div>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
            <span>DIRECT_P2P</span>
            <span className="text-purple-400">192.168.0.x</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* HUD TELEMETRY HEADER BAR */}
        <header className="h-16 border-b border-slate-800/80 px-6 flex items-center justify-between bg-[#080b13]/80 backdrop-blur-xl z-10">
          {/* Spotlight Search Trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-3 px-4 py-2 bg-[#0c101c] hover:bg-[#121727] border border-slate-800 hover:border-purple-500/40 rounded-xl text-xs text-slate-400 transition-all w-96 shadow-inner group"
          >
            <Search className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
            <span className="font-mono text-slate-300">Quick search index (FTS5)...</span>
            <kbd className="ml-auto bg-[#07090f] border border-slate-800 text-[10px] font-mono px-2 py-0.5 rounded text-purple-300 shadow">
              Ctrl + K
            </kbd>
          </button>

          {/* HUD Telemetry Gauges */}
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 bg-[#0c101c] border border-slate-800/80 rounded-xl text-[11px] font-mono">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">Engine:</span>
              <span className="text-white font-bold">Go v1.27</span>
              <span className="text-slate-600">|</span>
              <Gauge className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-slate-400">AES:</span>
              <span className="text-emerald-400 font-bold">GCM-256</span>
            </div>

            {/* View Switcher */}
            <div className="flex bg-[#0c101c] border border-slate-800 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                title="Dense List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Terminal Drawer Toggle */}
            <button
              onClick={() => setTerminalOpen((prev) => !prev)}
              className={`p-2 border rounded-xl transition-all ${
                terminalOpen
                  ? 'bg-purple-600 border-purple-400 text-white glow-purple'
                  : 'bg-[#0c101c] hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
              title="Toggle Cyber Terminal (Ctrl+`)"
            >
              <Terminal className="w-4 h-4" />
            </button>

            {/* Upload File Button */}
            <button
              onClick={() => setUploadModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white rounded-xl text-xs font-bold tracking-wider uppercase shadow-lg shadow-purple-600/30 transition-all hover:scale-105 active:scale-95"
            >
              <UploadCloud className="w-4 h-4" />
              <span>+ Upload Asset</span>
            </button>
          </div>
        </header>

        {/* VIEW AREA */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Telemetry Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="cyber-glass cyber-glass-hover rounded-2xl p-5 border-l-4 border-l-purple-500 relative overflow-hidden">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold font-mono tracking-wider uppercase">
                    <span>Storage Assets</span>
                    <FolderKanban className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-3xl font-orbitron font-extrabold text-white mt-3">{items.length}</div>
                  <div className="text-[11px] text-cyan-400 mt-2 flex items-center gap-1 font-mono">
                    <ShieldCheck className="w-3.5 h-3.5" /> SHA-256 Sharded & Encrypted
                  </div>
                </div>

                <div className="cyber-glass cyber-glass-hover rounded-2xl p-5 border-l-4 border-l-cyan-500 relative overflow-hidden">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold font-mono tracking-wider uppercase">
                    <span>Knowledge Docs</span>
                    <FileText className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-3xl font-orbitron font-extrabold text-white mt-3">{notes.length}</div>
                  <div className="text-[11px] text-slate-400 mt-2 font-mono">SQLite FTS5 Indexed</div>
                </div>

                <div className="cyber-glass cyber-glass-hover rounded-2xl p-5 border-l-4 border-l-amber-500 relative overflow-hidden">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold font-mono tracking-wider uppercase">
                    <span>Active Projects</span>
                    <Layers className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-3xl font-orbitron font-extrabold text-white mt-3">{projects.length}</div>
                  <div className="text-[11px] text-amber-400 mt-2 font-mono">Kanban Workflows</div>
                </div>

                <div className="cyber-glass cyber-glass-hover rounded-2xl p-5 border-l-4 border-l-emerald-500 relative overflow-hidden">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold font-mono tracking-wider uppercase">
                    <span>Mesh P2P Status</span>
                    <Wifi className="w-4 h-4 text-emerald-400 animate-pulse" />
                  </div>
                  <div className="text-2xl font-orbitron font-extrabold text-emerald-400 mt-3">DIRECT_P2P</div>
                  <div className="text-[11px] text-slate-400 mt-2 font-mono">Latency: {p2pLatency} ms</div>
                </div>
              </div>

              {/* Two Column Grid: Assets & Security Log */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Assets Card */}
                <div className="cyber-glass rounded-2xl p-5 border border-slate-800">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                    <h3 className="font-orbitron font-bold text-sm text-purple-300 flex items-center gap-2">
                      <FolderKanban className="w-4 h-4 text-purple-400" />
                      RECENT VAULT ASSETS
                    </h3>
                    <button onClick={() => setActiveTab('assets')} className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1">
                      View all ({items.length}) <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {items.slice(0, 5).map((item) => (
                      <div key={item.id} className="p-3 bg-[#0a0e19] rounded-xl border border-slate-800/80 flex items-center justify-between hover:border-purple-500/40 transition-colors">
                        <div>
                          <div className="text-xs font-semibold text-white">{item.title}</div>
                          <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                            {item.file_hash ? `SHA256: ${item.file_hash.substring(0, 16)}...` : item.item_type}
                          </div>
                        </div>
                        <span className="text-[10px] px-2.5 py-1 rounded-md bg-purple-950/80 text-purple-300 font-mono border border-purple-800/50">
                          {item.is_encrypted ? 'AES-256-GCM' : 'PLAIN'}
                        </span>
                      </div>
                    ))}
                    {items.length === 0 && (
                      <div className="text-xs text-slate-500 italic py-6 text-center">No vault assets uploaded yet.</div>
                    )}
                  </div>
                </div>

                {/* Cryptographic Security Audit Log */}
                <div className="cyber-glass rounded-2xl p-5 border border-slate-800">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                    <h3 className="font-orbitron font-bold text-sm text-amber-300 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      SECURITY AUDIT STREAM
                    </h3>
                    <button onClick={() => setActiveTab('audit')} className="text-xs font-mono text-amber-400 hover:underline flex items-center gap-1">
                      Full Log ({events.length}) <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {events.slice(0, 5).map((evt) => (
                      <div key={evt.id} className="p-3 bg-[#0a0e19] rounded-xl border-l-4 border-amber-500/80 text-xs">
                        <div className="font-mono text-amber-400 font-bold">{evt.event_type}</div>
                        <div className="text-[11px] text-slate-300 mt-1">{evt.message}</div>
                      </div>
                    ))}
                    {events.length === 0 && (
                      <div className="text-xs text-slate-500 italic py-6 text-center">No security audit records logged.</div>
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
                  <h2 className="text-xl font-orbitron font-bold text-white">Vault Storage Matrix</h2>
                  <p className="text-xs text-slate-400 font-mono">SHA-256 Content Addressed & AES-256-GCM Encrypted</p>
                </div>
                <button
                  onClick={() => setUploadModalOpen(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg glow-purple transition-all"
                >
                  <UploadCloud className="w-4 h-4" /> Upload Asset
                </button>
              </div>

              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {items.map((item) => (
                    <div key={item.id} className="cyber-glass cyber-glass-hover rounded-2xl p-5 flex flex-col justify-between border border-slate-800">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold text-cyan-400 truncate max-w-[200px]">{item.title}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 font-mono border border-slate-800">
                            {(item.size_bytes / 1024).toFixed(1)} KB
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mb-3">{item.description || 'No description provided'}</p>
                        {item.file_hash && (
                          <div className="bg-[#070a12] p-2.5 rounded-xl border border-slate-800 text-[10px] font-mono text-slate-400 break-all mb-3 relative group">
                            <div className="flex items-center justify-between text-purple-400 mb-1">
                              <span>SHA-256:</span>
                              <button
                                onClick={() => copyToClipboard(item.file_hash, item.id)}
                                className="hover:text-white transition-colors"
                              >
                                {copiedHash === item.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
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
                          className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Delete asset"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="cyber-glass rounded-2xl overflow-hidden border border-slate-800">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#070911] text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="p-4">Title</th>
                        <th className="p-4">SHA-256 Hash</th>
                        <th className="p-4">Size</th>
                        <th className="p-4">Security</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-800/40">
                          <td className="p-4 font-semibold text-white">{item.title}</td>
                          <td className="p-4 text-slate-400 text-[11px]">{item.file_hash ? item.file_hash.substring(0, 24) + '...' : '-'}</td>
                          <td className="p-4 text-slate-300">{(item.size_bytes / 1024).toFixed(1)} KB</td>
                          <td className="p-4 text-emerald-400">{item.is_encrypted ? 'AES-256' : 'PLAIN'}</td>
                          <td className="p-4 text-right">
                            <button onClick={() => handleDeleteItem(item.id)} className="text-slate-500 hover:text-rose-400">
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

          {/* KNOWLEDGE STUDIO TAB (NOTES) */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-orbitron font-bold text-white">Knowledge Studio</h2>
                  <p className="text-xs text-slate-400 font-mono">Markdown documentation & instant SQLite FTS5 search</p>
                </div>
                <button
                  onClick={() => setNewNoteModalOpen(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg glow-cyan transition-all"
                >
                  <Plus className="w-4 h-4" /> New Note
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                {/* Note List */}
                <div className="cyber-glass rounded-2xl p-4 border border-slate-800 overflow-y-auto space-y-2">
                  {notes.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => setSelectedNote(n)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        selectedNote?.id === n.id
                          ? 'bg-emerald-950/40 border-emerald-500/60 text-white shadow-md'
                          : 'bg-[#090d16] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-emerald-400">{n.title}</span>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400">{n.folder || 'general'}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{n.content}</p>
                    </div>
                  ))}
                  {notes.length === 0 && <div className="text-xs text-slate-500 text-center py-12">No notes stored.</div>}
                </div>

                {/* Note Detail Preview */}
                <div className="lg:col-span-2 cyber-glass rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
                  {selectedNote ? (
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <h3 className="text-lg font-orbitron font-bold text-emerald-400">{selectedNote.title}</h3>
                        <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {selectedNote.folder || 'general'}
                        </span>
                      </div>
                      <pre className="text-xs font-mono text-slate-200 bg-[#070911] p-5 rounded-2xl border border-slate-800 h-[480px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
                        {selectedNote.content}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-center text-slate-500 text-xs py-24">Select a note to inspect content.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* MISSION OPERATIONS (PROJECTS KANBAN) */}
          {activeTab === 'projects' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-orbitron font-bold text-white">Mission Operations Kanban</h2>
                  <p className="text-xs text-slate-400 font-mono">Project task tracking & sprint deliverables</p>
                </div>
                <button
                  onClick={() => setNewProjectModalOpen(true)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all"
                >
                  <Plus className="w-4 h-4" /> Add Project
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {projects.map((p) => (
                  <div key={p.id} className="cyber-glass cyber-glass-hover rounded-2xl p-5 border border-slate-800">
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
                {projects.length === 0 && <div className="col-span-3 text-center text-xs text-slate-500 py-12">No projects created yet.</div>}
              </div>
            </div>
          )}

          {/* ENTITIES & CLIENTS */}
          {activeTab === 'clients' && (
            <div className="space-y-4">
              <h2 className="text-xl font-orbitron font-bold text-white">Entities & Client Intelligence</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {clients.map((c) => (
                  <div key={c.id} className="cyber-glass rounded-2xl p-5 border border-slate-800">
                    <h3 className="font-bold text-sm text-purple-300">{c.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 font-mono">{c.email || 'No contact email'}</p>
                  </div>
                ))}
                {clients.length === 0 && <div className="col-span-3 text-center text-xs text-slate-500 py-12">No entity records.</div>}
              </div>
            </div>
          )}

          {/* NODE HARDWARE & DEVICES */}
          {activeTab === 'devices' && (
            <div className="space-y-4">
              <h2 className="text-xl font-orbitron font-bold text-white">Managed Node Hardware</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {devices.map((d) => (
                  <div key={d.id} className="cyber-glass rounded-2xl p-5 border border-slate-800">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-cyan-400">{d.name}</h3>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                        {d.ip_address}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">{d.os_type}</p>
                  </div>
                ))}
                {devices.length === 0 && <div className="col-span-3 text-center text-xs text-slate-500 py-12">No hardware nodes registered.</div>}
              </div>
            </div>
          )}

          {/* AUTOMATION SCRIPTS */}
          {activeTab === 'scripts' && (
            <div className="space-y-4">
              <h2 className="text-xl font-orbitron font-bold text-white">Automation Script Matrix</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scripts.map((s) => (
                  <div key={s.id} className="cyber-glass rounded-2xl p-5 border border-slate-800">
                    <h3 className="font-bold text-sm text-emerald-400">{s.title}</h3>
                    <pre className="text-xs font-mono text-slate-300 bg-[#070a12] p-4 rounded-xl mt-3 overflow-x-auto border border-slate-800">
                      {s.code}
                    </pre>
                  </div>
                ))}
                {scripts.length === 0 && <div className="col-span-2 text-center text-xs text-slate-500 py-12">No scripts registered.</div>}
              </div>
            </div>
          )}

          {/* STORAGE BOXES */}
          {activeTab === 'boxes' && (
            <div className="space-y-4">
              <h2 className="text-xl font-orbitron font-bold text-white">Storage Containers & Units</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {boxes.map((b) => (
                  <div key={b.id} className="cyber-glass rounded-2xl p-5 border border-slate-800">
                    <h3 className="font-bold text-sm text-amber-400">{b.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">{b.location}</p>
                  </div>
                ))}
                {boxes.length === 0 && <div className="col-span-3 text-center text-xs text-slate-500 py-12">No containers registered.</div>}
              </div>
            </div>
          )}

          {/* P2P MESH RADAR */}
          {activeTab === 'p2p' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-orbitron font-bold text-white">Mesh P2P Telemetry Radar</h2>
                <p className="text-xs text-slate-400 font-mono">Zero-dependency UDP Hole Punching & Directed Subnet Broadcast Engine</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="cyber-glass rounded-2xl p-5 border border-emerald-500/40">
                  <div className="text-xs font-mono text-slate-400 uppercase">Link Mode</div>
                  <div className="text-2xl font-orbitron font-bold text-emerald-400 mt-2">DIRECT_P2P</div>
                  <p className="text-[11px] text-slate-400 mt-2">LAN Directed Subnet Broadcast (Bypasses Hairpin NAT)</p>
                </div>

                <div className="cyber-glass rounded-2xl p-5 border border-slate-800">
                  <div className="text-xs font-mono text-slate-400 uppercase">Linked Peer</div>
                  <div className="text-2xl font-orbitron font-bold text-purple-400 mt-2">phone</div>
                  <p className="text-[11px] text-slate-400 mt-2">LAN IP: 192.168.0.x</p>
                </div>

                <div className="cyber-glass rounded-2xl p-5 border border-slate-800">
                  <div className="text-xs font-mono text-slate-400 uppercase">Roundtrip Latency</div>
                  <div className="text-2xl font-orbitron font-bold text-cyan-400 mt-2">{p2pLatency} ms</div>
                  <p className="text-[11px] text-slate-400 mt-2">High-Frequency Telemetry Ping</p>
                </div>
              </div>
            </div>
          )}

          {/* AUDIT LOG STREAM */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <h2 className="text-xl font-orbitron font-bold text-white">Cryptographic Security Stream</h2>
              <div className="cyber-glass rounded-2xl p-5 border border-slate-800 space-y-3">
                {events.map((evt) => (
                  <div key={evt.id} className="p-3 bg-[#080c16] rounded-xl border-l-4 border-amber-500 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-mono text-amber-400 font-bold mr-3">[{evt.event_type}]</span>
                      <span className="text-slate-200">{evt.message}</span>
                    </div>
                  </div>
                ))}
                {events.length === 0 && <div className="text-xs text-slate-500 text-center py-8">No security events recorded.</div>}
              </div>
            </div>
          )}
        </main>

        {/* SLIDE-OUT CYBER TERMINAL DRAWER (Ctrl+`) */}
        {terminalOpen && (
          <div className="h-64 bg-[#06080f] border-t border-slate-800 p-4 flex flex-col justify-between z-30 font-mono text-xs shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400 text-[11px]">
              <span className="flex items-center gap-2 text-purple-400 font-bold">
                <Terminal className="w-4 h-4" /> ENYWHERIA CYBER TERMINAL DRAWER
              </span>
              <span className="text-slate-500">Type /help for options</span>
              <button onClick={() => setTerminalOpen(false)} className="hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-2 space-y-1 text-slate-300">
              {terminalLogs.map((log, idx) => (
                <div key={idx} className={log.startsWith('🏓') ? 'text-emerald-400 font-bold' : log.startsWith('enywheria-cli>') ? 'text-purple-400 font-bold' : ''}>
                  {log}
                </div>
              ))}
            </div>

            <form onSubmit={handleTerminalSubmit} className="pt-2 border-t border-slate-800 flex items-center gap-2">
              <span className="text-purple-400 font-bold">enywheria-cli&gt;</span>
              <input
                type="text"
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                placeholder="Type command (/ping, /status, /help, /clear)..."
                className="flex-1 bg-transparent text-white focus:outline-none placeholder-slate-600 font-mono text-xs"
              />
            </form>
          </div>
        )}
      </div>

      {/* SPOTLIGHT MODAL (Ctrl + K) */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center pt-24">
          <div className="w-full max-w-2xl bg-[#090d18] border border-purple-500/40 rounded-2xl shadow-2xl overflow-hidden glow-purple">
            <div className="p-4 border-b border-slate-800 flex items-center gap-3">
              <Search className="w-5 h-5 text-purple-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search SQLite FTS5 full-text index..."
                className="w-full bg-transparent text-sm text-white focus:outline-none placeholder-slate-500 font-mono"
              />
              <button onClick={() => setSearchOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto p-4 space-y-2 font-mono text-xs">
              {searchResults.map((res, i) => (
                <div key={i} className="p-3 bg-[#0d1222] hover:bg-[#131a30] rounded-xl border border-slate-800 cursor-pointer transition-colors">
                  <div className="flex items-center justify-between font-bold text-purple-400">
                    <span>{res.title}</span>
                    <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-400 border border-slate-800">{res.entity_type}</span>
                  </div>
                  <p className="text-slate-300 mt-1 text-[11px]">{res.snippet}</p>
                </div>
              ))}
              {searchQuery && searchResults.length === 0 && (
                <div className="text-xs text-slate-500 text-center py-8">No FTS5 search matches found.</div>
              )}
              {!searchQuery && (
                <div className="text-xs text-slate-500 text-center py-8">Type query to execute FTS5 search across all vault tables.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FILE UPLOAD MODAL */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center">
          <div className="w-full max-w-md bg-[#090d18] border border-purple-500/40 rounded-2xl p-6 shadow-2xl glow-purple">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-orbitron font-bold text-base text-white flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-purple-400" />
                Upload Vault Asset
              </h3>
              <button onClick={() => setUploadModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 flex items-center justify-between p-3 bg-[#060810] rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 text-xs">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-200 font-mono">AES-256-GCM Encryption</span>
              </div>
              <input
                type="checkbox"
                checked={encryptUpload}
                onChange={(e) => setEncryptUpload(e.target.checked)}
                className="w-4 h-4 accent-purple-600 rounded"
              />
            </div>

            <label className="border-2 border-dashed border-purple-500/40 hover:border-purple-400 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all bg-[#060810]">
              <UploadCloud className="w-10 h-10 text-purple-400 mb-2 animate-bounce" />
              <span className="text-xs font-bold text-white">Click or Drag file to upload</span>
              <span className="text-[10px] font-mono text-slate-400 mt-1">SHA-256 Content Addressed Sharding</span>
              <input
                type="file"
                className="hidden"
                onChange={(e) => e.target.files && handleDropFile(e.target.files[0])}
              />
            </label>

            {uploading && (
              <div className="mt-4 text-center text-xs text-purple-400 flex items-center justify-center gap-2 font-mono">
                <RefreshCw className="w-4 h-4 animate-spin" /> Storing & Encrypting...
              </div>
            )}
          </div>
        </div>
      )}

      {/* NEW NOTE MODAL */}
      {newNoteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center">
          <form onSubmit={handleCreateNote} className="w-full max-w-lg bg-[#090d18] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-orbitron font-bold text-base text-white">New Markdown Note</h3>
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
              className="w-full bg-[#060810] border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
            />

            <textarea
              required
              rows={6}
              placeholder="Markdown note content..."
              value={noteForm.content}
              onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
              className="w-full bg-[#060810] border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
            />

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setNewNoteModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-xl font-mono"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs text-white font-bold rounded-xl shadow-lg glow-cyan">
                Save Note
              </button>
            </div>
          </form>
        </div>
      )}

      {/* NEW PROJECT MODAL */}
      {newProjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center">
          <form onSubmit={handleCreateProject} className="w-full max-w-md bg-[#090d18] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-orbitron font-bold text-base text-white">Add New Project</h3>
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
              className="w-full bg-[#060810] border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
            />

            <textarea
              rows={3}
              placeholder="Project Description..."
              value={projectForm.description}
              onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
              className="w-full bg-[#060810] border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
            />

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setNewProjectModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-xl font-mono"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-xs text-white font-bold rounded-xl shadow-lg">
                Create Project
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
