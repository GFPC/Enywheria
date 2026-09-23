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
  Radio,
  Zap
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

  // Copy helper
  const [copiedId, setCopiedId] = useState(null);

  // Markdown Studio
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
      console.error('API Sync Error:', err);
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
      group: 'CORE SYSTEM',
      items: [
        { id: 'dashboard', label: 'Command Hub', icon: LayoutDashboard },
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
        { id: 'scripts', label: 'Automation Matrix', icon: Terminal, count: scripts.length },
        { id: 'boxes', label: 'Storage Units', icon: Package, count: boxes.length },
      ],
    },
    {
      group: 'NETWORK & SECURITY',
      items: [
        { id: 'p2p', label: 'Mesh Telemetry', icon: Radio },
        { id: 'audit', label: 'Security Stream', icon: ShieldCheck, count: events.length },
      ],
    },
  ];

  return (
    <div className="flex h-screen w-screen bg-[#080b12] text-slate-200 font-sans select-none overflow-hidden text-xs antialiased">
      {/* SIDEBAR */}
      <aside className="w-60 flex-shrink-0 bg-[#0c101c]/90 border-r border-slate-800/80 flex flex-col justify-between p-3.5 z-20">
        <div>
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 px-2 py-2 mb-4 border-b border-slate-800/60 pb-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-bold text-xs tracking-tight text-white flex items-center gap-1">
                PersonalVault
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800/40">
                  Go
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">FTS5 • AES-256</div>
            </div>
          </div>

          {/* Navigation Groups */}
          <div className="space-y-4">
            {navigation.map((group, idx) => (
              <div key={idx}>
                <div className="px-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">
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
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          active
                            ? 'bg-purple-900/30 text-purple-300 border border-purple-500/40 font-semibold'
                            : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`w-3.5 h-3.5 ${active ? 'text-purple-400' : 'text-slate-400'}`} />
                          <span className="text-[11px]">{item.label}</span>
                        </div>
                        {item.count !== undefined && (
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono ${
                            active ? 'bg-purple-800/40 text-purple-200' : 'bg-slate-900 text-slate-500'
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

        {/* Telemetry Footer */}
        <div className="pt-3 border-t border-slate-800/80">
          <div className="bg-[#0f1422] rounded-xl p-2.5 border border-slate-800 text-[11px] space-y-1.5 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot"></span>
                P2P Ping
              </span>
              <span className="text-emerald-400 font-bold">{p2pLatency} ms</span>
            </div>
            <div className="text-[9px] text-slate-500 flex justify-between border-t border-slate-800/60 pt-1">
              <span>DIRECT_P2P</span>
              <span className="text-purple-400">192.168.0.x</span>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* HEADER BAR */}
        <header className="h-13 border-b border-slate-800/80 px-5 flex items-center justify-between bg-[#0c101c]/80 backdrop-blur-md">
          {/* Breadcrumb Path */}
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
            <span className="text-slate-300 font-medium text-[11px]">PersonalVault</span>
            <ChevronRight className="w-3 h-3 text-slate-500" />
            <span className="text-purple-400 font-bold text-[11px] capitalize">{activeTab}</span>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2.5">
            {/* Search Input Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1 bg-[#0f1422] hover:bg-slate-800/60 border border-slate-800 rounded-lg text-xs text-slate-400 transition-all w-72 group"
            >
              <Search className="w-3.5 h-3.5 text-purple-400" />
              <span className="font-mono text-[11px] text-slate-300">FTS5 Search index...</span>
              <kbd className="ml-auto bg-slate-900 border border-slate-800 text-[9px] font-mono px-1 py-0.2 rounded text-purple-300">
                Ctrl K
              </kbd>
            </button>

            {/* View Mode Toggle */}
            <div className="flex bg-[#0f1422] border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded transition-colors ${viewMode === 'grid' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                title="Grid View"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1 rounded transition-colors ${viewMode === 'table' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Refresh */}
            <button
              onClick={fetchAllData}
              className="p-1.5 bg-[#0f1422] hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Upload Button */}
            <button
              onClick={() => setUploadModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[11px] font-semibold transition-all shadow-sm"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload File</span>
            </button>
          </div>
        </header>

        {/* MAIN BODY VIEW */}
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="space-y-5">
              {/* Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
                <div className="cyber-card cyber-card-hover rounded-xl p-3.5 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold uppercase tracking-wider font-mono">
                    <span>Vault Assets</span>
                    <FolderKanban className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <div className="text-xl font-bold text-white mt-1.5">{items.length}</div>
                  <div className="text-[10px] text-emerald-400 mt-1 font-mono flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> SHA-256 Encrypted
                  </div>
                </div>

                <div className="cyber-card cyber-card-hover rounded-xl p-3.5 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold uppercase tracking-wider font-mono">
                    <span>Knowledge Docs</span>
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div className="text-xl font-bold text-white mt-1.5">{notes.length}</div>
                  <div className="text-[10px] text-slate-400 mt-1 font-mono">FTS5 Indexed</div>
                </div>

                <div className="cyber-card cyber-card-hover rounded-xl p-3.5 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold uppercase tracking-wider font-mono">
                    <span>Active Projects</span>
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="text-xl font-bold text-white mt-1.5">{projects.length}</div>
                  <div className="text-[10px] text-amber-400 mt-1 font-mono">Kanban Workflows</div>
                </div>

                <div className="cyber-card cyber-card-hover rounded-xl p-3.5 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold uppercase tracking-wider font-mono">
                    <span>Mesh P2P Link</span>
                    <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-lg font-bold text-emerald-400 mt-1.5">DIRECT_P2P</div>
                  <div className="text-[10px] text-slate-400 mt-1 font-mono">{p2pLatency} ms latency</div>
                </div>
              </div>

              {/* Two Column Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Recent Assets Card */}
                <div className="cyber-card rounded-xl p-4 border border-slate-800">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
                    <h3 className="font-semibold text-xs text-white flex items-center gap-1.5">
                      <FolderKanban className="w-3.5 h-3.5 text-purple-400" />
                      Recent Vault Assets
                    </h3>
                    <button onClick={() => setActiveTab('assets')} className="text-[11px] text-purple-400 hover:underline flex items-center gap-1 font-mono">
                      View all ({items.length}) <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {items.slice(0, 5).map((item) => (
                      <div key={item.id} className="p-2.5 bg-[#0a0e19] rounded-lg border border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-semibold text-white">{item.title}</div>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            {item.file_hash ? `SHA256: ${item.file_hash.substring(0, 20)}...` : item.item_type}
                          </div>
                        </div>
                        <span className="text-[9px] px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 font-mono border border-purple-800/50">
                          {item.is_encrypted ? 'AES-256-GCM' : 'PLAIN'}
                        </span>
                      </div>
                    ))}
                    {items.length === 0 && (
                      <div className="text-xs text-slate-500 italic py-4 text-center">No vault assets stored yet.</div>
                    )}
                  </div>
                </div>

                {/* Audit Stream Card */}
                <div className="cyber-card rounded-xl p-4 border border-slate-800">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
                    <h3 className="font-semibold text-xs text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      Security Audit Stream
                    </h3>
                    <button onClick={() => setActiveTab('audit')} className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-mono">
                      Full Log ({events.length}) <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {events.slice(0, 5).map((evt) => (
                      <div key={evt.id} className="p-2.5 bg-[#0a0e19] rounded-lg border-l-2 border-amber-500 text-xs">
                        <div className="font-mono text-amber-400 font-bold text-[11px]">{evt.event_type}</div>
                        <div className="text-[11px] text-slate-300 mt-0.5">{evt.message}</div>
                      </div>
                    ))}
                    {events.length === 0 && (
                      <div className="text-xs text-slate-500 italic py-4 text-center">No security audit records logged.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VAULT STORAGE TAB */}
          {activeTab === 'assets' && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-purple-400 font-mono">Vault Storage Matrix</h2>
                  <p className="text-[11px] text-slate-400">SHA-256 Content Addressed & AES-256-GCM Encrypted</p>
                </div>
                <button
                  onClick={() => setUploadModalOpen(true)}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1.5 shadow"
                >
                  <UploadCloud className="w-3.5 h-3.5" /> Upload File
                </button>
              </div>

              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {items.map((item) => (
                    <div key={item.id} className="cyber-card cyber-card-hover rounded-xl p-3.5 flex flex-col justify-between border border-slate-800">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-indigo-400 truncate max-w-[170px]">{item.title}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-300 font-mono border border-slate-800">
                            {(item.size_bytes / 1024).toFixed(1)} KB
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mb-2.5 line-clamp-2">{item.description || 'No description provided'}</p>
                        {item.file_hash && (
                          <div className="bg-[#070a12] p-2 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-400 break-all mb-2.5">
                            <div className="flex items-center justify-between text-purple-400 mb-0.5">
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
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
                        <div className="flex items-center gap-1 text-emerald-400 font-mono text-[10px]">
                          <Lock className="w-3 h-3" />
                          <span>{item.is_encrypted ? 'AES-256-GCM' : 'PLAIN'}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Delete asset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && <div className="col-span-3 text-center text-xs text-slate-500 py-10">No assets stored yet.</div>}
                </div>
              ) : (
                <div className="cyber-card rounded-xl overflow-hidden border border-slate-800">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#070911] text-slate-400 border-b border-slate-800 text-[9px] uppercase tracking-wider">
                      <tr>
                        <th className="p-3">Title</th>
                        <th className="p-3">SHA-256 Hash</th>
                        <th className="p-3">Size</th>
                        <th className="p-3">Encryption</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-800/30 text-[11px]">
                          <td className="p-3 font-semibold text-white">{item.title}</td>
                          <td className="p-3 text-slate-400 text-[10px]">{item.file_hash ? item.file_hash.substring(0, 24) + '...' : '-'}</td>
                          <td className="p-3 text-slate-300">{(item.size_bytes / 1024).toFixed(1)} KB</td>
                          <td className="p-3 text-emerald-400">{item.is_encrypted ? 'AES-256' : 'PLAIN'}</td>
                          <td className="p-3 text-right">
                            <button onClick={() => handleDeleteItem(item.id)} className="text-slate-400 hover:text-rose-400">
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

          {/* KNOWLEDGE BASE TAB (NOTES) */}
          {activeTab === 'notes' && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">Knowledge Base Studio</h2>
                  <p className="text-[11px] text-slate-400">Markdown docs & SQLite FTS5 instant search</p>
                </div>
                <button
                  onClick={() => setNewNoteModalOpen(true)}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-3.5 h-3.5" /> New Document
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 h-[560px]">
                {/* Note List */}
                <div className="cyber-card rounded-xl p-3 border border-slate-800 overflow-y-auto space-y-1.5">
                  {notes.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => setSelectedNote(n)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedNote?.id === n.id
                          ? 'bg-emerald-950/40 border-emerald-500/60 text-white shadow'
                          : 'bg-[#090d15] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-emerald-400">{n.title}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800">
                          {n.folder || 'general'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{n.content}</p>
                    </div>
                  ))}
                  {notes.length === 0 && <div className="text-xs text-slate-500 text-center py-10">No notes created.</div>}
                </div>

                {/* Note Detail Panel */}
                <div className="lg:col-span-2 cyber-card rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
                  {selectedNote ? (
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                        <div>
                          <h3 className="text-xs font-bold text-white">{selectedNote.title}</h3>
                          <div className="text-[9px] font-mono text-slate-400 mt-0.5">
                            {selectedNote.content.length} chars • {(selectedNote.content.length / 200).toFixed(1)} min read
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {selectedNote.folder || 'general'}
                        </span>
                      </div>
                      <pre className="text-[11px] font-mono text-slate-200 bg-[#070911] p-4 rounded-xl border border-slate-800 h-[440px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
                        {selectedNote.content}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-center text-slate-500 text-xs py-20">Select a document from the left list.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PROJECTS TAB */}
          {activeTab === 'projects' && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">Mission Operations Kanban</h2>
                  <p className="text-[11px] text-slate-400">Sprint planning & project execution</p>
                </div>
                <button
                  onClick={() => setNewProjectModalOpen(true)}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Project
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {projects.map((p) => (
                  <div key={p.id} className="cyber-card cyber-card-hover rounded-xl p-4 border border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-xs text-white">{p.name}</h3>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 font-bold uppercase border border-amber-800/60">
                        {p.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mb-3">{p.description || 'No description'}</p>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                      <div className="bg-amber-500 h-full w-2/3 rounded-full"></div>
                    </div>
                  </div>
                ))}
                {projects.length === 0 && <div className="col-span-3 text-center text-xs text-slate-500 py-10">No projects created.</div>}
              </div>
            </div>
          )}

          {/* CLIENTS */}
          {activeTab === 'clients' && (
            <div className="space-y-3.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-purple-400 font-mono">Entities & Clients</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {clients.map((c) => (
                  <div key={c.id} className="cyber-card rounded-xl p-3.5 border border-slate-800">
                    <h3 className="font-bold text-xs text-indigo-400">{c.name}</h3>
                    <p className="text-[11px] text-slate-400 mt-1 font-mono">{c.email || 'No email'}</p>
                  </div>
                ))}
                {clients.length === 0 && <div className="col-span-3 text-center text-xs text-slate-500 py-10">No entity records.</div>}
              </div>
            </div>
          )}

          {/* MANAGED DEVICES */}
          {activeTab === 'devices' && (
            <div className="space-y-3.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">Managed Infrastructure Nodes</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {devices.map((d) => (
                  <div key={d.id} className="cyber-card rounded-xl p-3.5 border border-slate-800">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-xs text-cyan-400">{d.name}</h3>
                      <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                        {d.ip_address}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2">{d.os_type}</p>
                  </div>
                ))}
                {devices.length === 0 && <div className="col-span-3 text-center text-xs text-slate-500 py-10">No hardware nodes registered.</div>}
              </div>
            </div>
          )}

          {/* AUTOMATION SCRIPTS */}
          {activeTab === 'scripts' && (
            <div className="space-y-3.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">Automation Scripts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {scripts.map((s) => (
                  <div key={s.id} className="cyber-card rounded-xl p-3.5 border border-slate-800">
                    <h3 className="font-bold text-xs text-emerald-400">{s.title}</h3>
                    <pre className="text-[11px] font-mono text-slate-300 bg-[#070a12] p-3 rounded-lg mt-2 overflow-x-auto border border-slate-800">
                      {s.code}
                    </pre>
                  </div>
                ))}
                {scripts.length === 0 && <div className="col-span-2 text-center text-xs text-slate-500 py-10">No scripts saved.</div>}
              </div>
            </div>
          )}

          {/* STORAGE BOXES */}
          {activeTab === 'boxes' && (
            <div className="space-y-3.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">Storage Containers</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {boxes.map((b) => (
                  <div key={b.id} className="cyber-card rounded-xl p-3.5 border border-slate-800">
                    <h3 className="font-bold text-xs text-amber-400">{b.name}</h3>
                    <p className="text-[11px] text-slate-400 mt-1">{b.location}</p>
                  </div>
                ))}
                {boxes.length === 0 && <div className="col-span-3 text-center text-xs text-slate-500 py-10">No containers registered.</div>}
              </div>
            </div>
          )}

          {/* MESH P2P RADAR */}
          {activeTab === 'p2p' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-purple-400 font-mono">Mesh Network Telemetry</h2>
                <p className="text-[11px] text-slate-400">Zero-dependency UDP Hole Punching & Subnet Broadcast Engine</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div className="cyber-card rounded-xl p-4 border border-emerald-500/30">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Link Mode</div>
                  <div className="text-lg font-bold text-emerald-400 mt-1">DIRECT_P2P</div>
                  <p className="text-[10px] text-slate-400 mt-1.5">LAN Directed Subnet Broadcast</p>
                </div>

                <div className="cyber-card rounded-xl p-4 border border-slate-800">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Target Peer</div>
                  <div className="text-lg font-bold text-purple-400 mt-1">phone</div>
                  <p className="text-[10px] text-slate-400 mt-1.5">LAN IP: 192.168.0.x</p>
                </div>

                <div className="cyber-card rounded-xl p-4 border border-slate-800">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Latency</div>
                  <div className="text-lg font-bold text-cyan-400 mt-1">{p2pLatency} ms</div>
                  <p className="text-[10px] text-slate-400 mt-1.5">Direct Local UDP</p>
                </div>
              </div>
            </div>
          )}

          {/* SECURITY AUDIT STREAM */}
          {activeTab === 'audit' && (
            <div className="space-y-3.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">Security Audit Stream</h2>
              <div className="cyber-card rounded-xl p-4 border border-slate-800 space-y-2">
                {events.map((evt) => (
                  <div key={evt.id} className="p-2.5 bg-[#080c16] rounded-lg border-l-2 border-amber-500 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-mono text-amber-400 font-bold mr-2 text-[11px]">[{evt.event_type}]</span>
                      <span className="text-slate-200 text-[11px]">{evt.message}</span>
                    </div>
                  </div>
                ))}
                {events.length === 0 && <div className="text-xs text-slate-500 text-center py-6">No audit records found.</div>}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* SPOTLIGHT MODAL (Ctrl + K) */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center pt-24">
          <div className="w-full max-w-lg bg-[#0e121e] border border-purple-500/40 rounded-xl shadow-2xl overflow-hidden">
            <div className="p-3 border-b border-slate-800 flex items-center gap-2.5">
              <Search className="w-4 h-4 text-purple-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search SQLite FTS5 index..."
                className="w-full bg-transparent text-xs text-white focus:outline-none placeholder-slate-500 font-mono"
              />
              <button onClick={() => setSearchOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto p-3 space-y-1.5 font-mono text-xs">
              {searchResults.map((res, i) => (
                <div key={i} className="p-2.5 bg-[#090d17] hover:bg-[#12192c] rounded-lg border border-slate-800 cursor-pointer">
                  <div className="flex items-center justify-between font-bold text-purple-400 text-[11px]">
                    <span>{res.title}</span>
                    <span className="text-[9px] bg-slate-900 px-1.5 py-0.2 rounded text-slate-400 border border-slate-800">{res.entity_type}</span>
                  </div>
                  <p className="text-slate-300 mt-0.5 text-[10px]">{res.snippet}</p>
                </div>
              ))}
              {searchQuery && searchResults.length === 0 && (
                <div className="text-xs text-slate-500 text-center py-6">No matches found.</div>
              )}
              {!searchQuery && (
                <div className="text-xs text-slate-500 text-center py-6">Type query to search vault tables.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FILE UPLOAD MODAL */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center">
          <div className="w-full max-w-md bg-[#0e121e] border border-slate-800 rounded-xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-xs text-white flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-purple-400" />
                Upload Vault Asset
              </h3>
              <button onClick={() => setUploadModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-3 flex items-center justify-between p-2.5 bg-[#070911] rounded-lg border border-slate-800">
              <div className="flex items-center gap-2 text-xs">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-200 font-mono text-[11px]">AES-256-GCM Encryption</span>
              </div>
              <input
                type="checkbox"
                checked={encryptUpload}
                onChange={(e) => setEncryptUpload(e.target.checked)}
                className="w-4 h-4 accent-purple-600 rounded"
              />
            </div>

            <label className="border-2 border-dashed border-slate-700 hover:border-purple-500/60 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all bg-[#070911]">
              <UploadCloud className="w-8 h-8 text-purple-400 mb-2" />
              <span className="text-xs font-bold text-white">Click or Drag file to upload</span>
              <span className="text-[10px] font-mono text-slate-400 mt-1">Automatic SHA-256 Content Sharding</span>
              <input
                type="file"
                className="hidden"
                onChange={(e) => e.target.files && handleDropFile(e.target.files[0])}
              />
            </label>

            {uploading && (
              <div className="mt-3 text-center text-xs text-purple-400 flex items-center justify-center gap-2 font-mono">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Storing & Encrypting...
              </div>
            )}
          </div>
        </div>
      )}

      {/* NEW NOTE MODAL */}
      {newNoteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center">
          <form onSubmit={handleCreateNote} className="w-full max-w-lg bg-[#0e121e] border border-slate-800 rounded-xl p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs text-white">New Markdown Document</h3>
              <button type="button" onClick={() => setNewNoteModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              required
              placeholder="Document Title"
              value={noteForm.title}
              onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
              className="w-full bg-[#070911] border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
            />

            <textarea
              required
              rows={6}
              placeholder="Markdown content..."
              value={noteForm.content}
              onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
              className="w-full bg-[#070911] border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNewNoteModalOpen(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-lg font-mono"
              >
                Cancel
              </button>
              <button type="submit" className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-xs text-white font-semibold rounded-lg shadow">
                Save Document
              </button>
            </div>
          </form>
        </div>
      )}

      {/* NEW PROJECT MODAL */}
      {newProjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center">
          <form onSubmit={handleCreateProject} className="w-full max-w-md bg-[#0e121e] border border-slate-800 rounded-xl p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs text-white">Create Project</h3>
              <button type="button" onClick={() => setNewProjectModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              required
              placeholder="Project Name"
              value={projectForm.name}
              onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
              className="w-full bg-[#070911] border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
            />

            <textarea
              rows={3}
              placeholder="Project Description..."
              value={projectForm.description}
              onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
              className="w-full bg-[#070911] border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNewProjectModalOpen(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-lg font-mono"
              >
                Cancel
              </button>
              <button type="submit" className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-xs text-white font-semibold rounded-lg shadow">
                Create Project
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
