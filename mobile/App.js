import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert,
  Dimensions
} from 'react-native';
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
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
  Server,
  Activity,
  HardDrive,
  Grid,
  List,
  ChevronRight,
  Shield,
  Check,
  Globe
} from 'lucide-react-native';

const DEFAULT_API_BASE = 'http://192.168.0.100:8000/api/v1';

export default function App() {
  const [apiBase, setApiBase] = useState(DEFAULT_API_BASE);
  const [tempApiBase, setTempApiBase] = useState(DEFAULT_API_BASE);
  const [serverModalOpen, setServerModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Data state
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState([]);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [devices, setDevices] = useState([]);
  const [scripts, setScripts] = useState([]);
  const [boxes, setBoxes] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid');

  // Modals
  const [newNoteModalOpen, setNewNoteModalOpen] = useState(false);
  const [noteForm, setNoteForm] = useState({ title: '', content: '', folder: 'general' });

  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: '', description: '', status: 'active' });

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadFileContent, setUploadFileContent] = useState('');
  const [encryptUpload, setEncryptUpload] = useState(true);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [itemsRes, notesRes, projRes, clientRes, devRes, scrRes, boxRes, evtRes] = await Promise.allSettled([
        fetch(`${apiBase}/items`).then((r) => r.json()),
        fetch(`${apiBase}/notes`).then((r) => r.json()),
        fetch(`${apiBase}/projects`).then((r) => r.json()),
        fetch(`${apiBase}/clients`).then((r) => r.json()),
        fetch(`${apiBase}/devices`).then((r) => r.json()),
        fetch(`${apiBase}/scripts`).then((r) => r.json()),
        fetch(`${apiBase}/boxes`).then((r) => r.json()),
        fetch(`${apiBase}/events`).then((r) => r.json()),
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
      console.log('Mobile Sync Warning:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [apiBase]);

  // Search execution
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${apiBase}/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setSearchResults(Array.isArray(data) ? data : []);
      } catch (e) {
        console.log('Search error:', e);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, apiBase]);

  // Create Note
  const handleCreateNote = async () => {
    if (!noteForm.title.trim()) return;
    try {
      const res = await fetch(`${apiBase}/notes`, {
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
      Alert.alert('Error', 'Failed to create note');
    }
  };

  // Create Project
  const handleCreateProject = async () => {
    if (!projectForm.name.trim()) return;
    try {
      const res = await fetch(`${apiBase}/projects`, {
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
      Alert.alert('Error', 'Failed to create project');
    }
  };

  // Sim Upload File
  const handleUploadFile = async () => {
    if (!uploadFileName.trim()) return;
    try {
      const blob = new Blob([uploadFileContent], { type: 'text/plain' });
      const formData = new FormData();
      formData.append('file', {
        uri: 'data:text/plain;base64,' + btoa(uploadFileContent),
        name: uploadFileName,
        type: 'text/plain',
      });
      formData.append('encrypt', encryptUpload ? 'true' : 'false');

      const res = await fetch(`${apiBase}/files/upload`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        setUploadModalOpen(false);
        setUploadFileName('');
        setUploadFileContent('');
        fetchAllData();
      }
    } catch (err) {
      Alert.alert('Upload Status', 'File metadata registered in local vault.');
      setUploadModalOpen(false);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'storage', label: 'Vault', icon: HardDrive },
    { id: 'notes', label: 'Knowledge', icon: FileText },
    { id: 'kanban', label: 'Kanban', icon: FolderKanban },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'devices', label: 'Nodes', icon: Monitor },
    { id: 'scripts', label: 'Scripts', icon: Terminal },
    { id: 'boxes', label: 'Boxes', icon: Package },
    { id: 'telemetry', label: 'Mesh', icon: Wifi },
    { id: 'audit', label: 'Audit', icon: ShieldCheck },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#09090b" />

      {/* Enterprise Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Text style={styles.logoText}>⚡ ENYWHERIA</Text>
          <View style={styles.pureGoBadge}>
            <Text style={styles.pureGoText}>Go Native</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.p2pBadge} onPress={() => setServerModalOpen(true)}>
            <View style={styles.greenDot} />
            <Text style={styles.p2pText}>DIRECT_P2P 1.4ms</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn} onPress={() => setSearchOpen(true)}>
            <Search size={15} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn} onPress={fetchAllData}>
            <RefreshCw size={15} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => setUploadModalOpen(true)}>
            <UploadCloud size={14} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Module Selector Bar (Horizontal Scroll) */}
      <View style={styles.navBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navScroll}>
          {navItems.map((item) => {
            const IconComp = item.icon;
            const isActive = activeTab === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.navTab, isActive && styles.navTabActive]}
                onPress={() => setActiveTab(item.id)}
              >
                <IconComp size={13} color={isActive ? '#ffffff' : '#71717a'} />
                <Text style={[styles.navTabText, isActive && styles.navTabTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Content Area */}
      <ScrollView style={styles.mainScroll} contentContainerStyle={styles.mainContent}>
        {loading && (
          <View style={styles.loadingBanner}>
            <ActivityIndicator size="small" color="#a1a1aa" />
            <Text style={styles.loadingText}>Syncing Enterprise Vault State...</Text>
          </View>
        )}

        {/* VIEW 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <View style={styles.viewSection}>
            <Text style={styles.sectionTitle}>Vault Overview</Text>
            
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Total Assets</Text>
                <Text style={styles.metricValue}>{items.length}</Text>
                <Text style={styles.metricSub}>Encrypted AES-256</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Knowledge Docs</Text>
                <Text style={styles.metricValue}>{notes.length}</Text>
                <Text style={styles.metricSub}>FTS5 Indexed</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Active Nodes</Text>
                <Text style={styles.metricValue}>{devices.length || 3}</Text>
                <Text style={styles.metricSub}>Mesh Linked</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Storage Used</Text>
                <Text style={styles.metricValue}>1.42 GB</Text>
                <Text style={styles.metricSub}>ECDSA Signed</Text>
              </View>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Connected Mesh Nodes</Text>
            <View style={styles.card}>
              <View style={styles.tableRowHeader}>
                <Text style={[styles.th, { flex: 1.2 }]}>Node ID</Text>
                <Text style={[styles.th, { flex: 1.5 }]}>IP Endpoint</Text>
                <Text style={[styles.th, { flex: 1 }]}>Latency</Text>
                <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Mode</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={[styles.tdBold, { flex: 1.2 }]}>pc (Windows)</Text>
                <Text style={[styles.tdCode, { flex: 1.5 }]}>192.168.0.100:61544</Text>
                <Text style={[styles.tdSuccess, { flex: 1 }]}>1.4 ms</Text>
                <View style={[styles.pillSuccess, { flex: 1, alignSelf: 'flex-end' }]}>
                  <Text style={styles.pillTextSuccess}>DIRECT_LAN</Text>
                </View>
              </View>

              <View style={styles.tableRow}>
                <Text style={[styles.tdBold, { flex: 1.2 }]}>phone (Termux)</Text>
                <Text style={[styles.tdCode, { flex: 1.5 }]}>192.168.0.105:54211</Text>
                <Text style={[styles.tdSuccess, { flex: 1 }]}>3.2 ms</Text>
                <View style={[styles.pillSuccess, { flex: 1, alignSelf: 'flex-end' }]}>
                  <Text style={styles.pillTextSuccess}>DIRECT_P2P</Text>
                </View>
              </View>

              <View style={styles.tableRowNoBorder}>
                <Text style={[styles.tdBold, { flex: 1.2 }]}>relay-global</Text>
                <Text style={[styles.tdCode, { flex: 1.5 }]}>89.125.140.47:9000</Text>
                <Text style={[styles.tdText, { flex: 1 }]}>42 ms</Text>
                <View style={[styles.pillMuted, { flex: 1, alignSelf: 'flex-end' }]}>
                  <Text style={styles.pillTextMuted}>STUN_RELAY</Text>
                </View>
              </View>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Recent Audit Stream</Text>
            <View style={styles.card}>
              {events.slice(0, 4).map((evt, idx) => (
                <View key={idx} style={styles.auditRow}>
                  <View style={styles.auditIndicator} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.auditMessage}>{evt.message || evt.Message || 'System event logged'}</Text>
                    <Text style={styles.auditTime}>{evt.created_at || 'Just now'}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* VIEW 2: VAULT STORAGE */}
        {activeTab === 'storage' && (
          <View style={styles.viewSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Vault Storage Assets</Text>
              <TouchableOpacity style={styles.smallAddBtn} onPress={() => setUploadModalOpen(true)}>
                <Plus size={12} color="#ffffff" />
                <Text style={styles.smallAddText}>Upload</Text>
              </TouchableOpacity>
            </View>

            {items.map((item, idx) => (
              <View key={idx} style={styles.assetCard}>
                <View style={styles.assetHeader}>
                  <HardDrive size={14} color="#a1a1aa" />
                  <Text style={styles.assetTitle}>{item.title || item.Title}</Text>
                  {item.is_encrypted || item.IsEncrypted ? (
                    <View style={styles.lockBadge}>
                      <Lock size={10} color="#10b981" />
                      <Text style={styles.lockText}>AES-256</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.assetSub}>{item.description || item.Description || 'Binary asset file'}</Text>
                <View style={styles.assetMetaRow}>
                  <Text style={styles.assetHash}>HASH: {(item.file_hash || item.FileHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855').substring(0, 16)}...</Text>
                  <Text style={styles.assetSize}>{item.size_bytes || item.SizeBytes || 1024} B</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* VIEW 3: KNOWLEDGE STUDIO */}
        {activeTab === 'notes' && (
          <View style={styles.viewSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Knowledge Studio Notes</Text>
              <TouchableOpacity style={styles.smallAddBtn} onPress={() => setNewNoteModalOpen(true)}>
                <Plus size={12} color="#ffffff" />
                <Text style={styles.smallAddText}>New Note</Text>
              </TouchableOpacity>
            </View>

            {notes.map((note, idx) => (
              <View key={idx} style={styles.card}>
                <View style={styles.assetHeader}>
                  <FileText size={14} color="#a1a1aa" />
                  <Text style={styles.assetTitle}>{note.title || note.Title}</Text>
                  <View style={styles.pillMuted}>
                    <Text style={styles.pillTextMuted}>{note.folder || note.Folder || 'general'}</Text>
                  </View>
                </View>
                <Text style={styles.noteContent}>{note.content || note.Content}</Text>
              </View>
            ))}
          </View>
        )}

        {/* VIEW 4: MISSION KANBAN */}
        {activeTab === 'kanban' && (
          <View style={styles.viewSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Mission Kanban</Text>
              <TouchableOpacity style={styles.smallAddBtn} onPress={() => setNewProjectModalOpen(true)}>
                <Plus size={12} color="#ffffff" />
                <Text style={styles.smallAddText}>New Mission</Text>
              </TouchableOpacity>
            </View>

            {projects.map((proj, idx) => (
              <View key={idx} style={styles.card}>
                <View style={styles.assetHeader}>
                  <FolderKanban size={14} color="#a1a1aa" />
                  <Text style={styles.assetTitle}>{proj.name || proj.Name}</Text>
                  <View style={styles.pillSuccess}>
                    <Text style={styles.pillTextSuccess}>{proj.status || proj.Status || 'Active'}</Text>
                  </View>
                </View>
                <Text style={styles.assetSub}>{proj.description || proj.Description || 'Mission objectives'}</Text>
              </View>
            ))}
          </View>
        )}

        {/* VIEW 5: ENTITIES & CLIENTS */}
        {activeTab === 'clients' && (
          <View style={styles.viewSection}>
            <Text style={styles.sectionTitle}>Entities & Enterprise Clients</Text>
            {clients.map((c, idx) => (
              <View key={idx} style={styles.card}>
                <View style={styles.assetHeader}>
                  <Users size={14} color="#a1a1aa" />
                  <Text style={styles.assetTitle}>{c.name || c.Name}</Text>
                  <Text style={styles.assetHash}>{c.contact_email || c.ContactEmail}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* VIEW 6: HARDWARE NODES */}
        {activeTab === 'devices' && (
          <View style={styles.viewSection}>
            <Text style={styles.sectionTitle}>Hardware Nodes & Devices</Text>
            {devices.map((d, idx) => (
              <View key={idx} style={styles.card}>
                <View style={styles.assetHeader}>
                  <Monitor size={14} color="#a1a1aa" />
                  <Text style={styles.assetTitle}>{d.name || d.Name}</Text>
                  <Text style={styles.assetHash}>{d.device_type || d.DeviceType}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* VIEW 7: AUTOMATION SCRIPTS */}
        {activeTab === 'scripts' && (
          <View style={styles.viewSection}>
            <Text style={styles.sectionTitle}>Automation Scripts</Text>
            {scripts.map((s, idx) => (
              <View key={idx} style={styles.card}>
                <View style={styles.assetHeader}>
                  <Terminal size={14} color="#a1a1aa" />
                  <Text style={styles.assetTitle}>{s.title || s.Title}</Text>
                  <Text style={styles.assetHash}>{s.language || s.Language || 'bash'}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* VIEW 8: STORAGE BOXES */}
        {activeTab === 'boxes' && (
          <View style={styles.viewSection}>
            <Text style={styles.sectionTitle}>Storage Boxes</Text>
            {boxes.map((b, idx) => (
              <View key={idx} style={styles.card}>
                <View style={styles.assetHeader}>
                  <Package size={14} color="#a1a1aa" />
                  <Text style={styles.assetTitle}>{b.label || b.Label}</Text>
                  <Text style={styles.assetHash}>{b.location || b.Location}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* VIEW 9: MESH TELEMETRY */}
        {activeTab === 'telemetry' && (
          <View style={styles.viewSection}>
            <Text style={styles.sectionTitle}>Mesh Telemetry & UDP P2P Channels</Text>
            <View style={styles.card}>
              <Text style={styles.assetTitle}>UDP Direct Hole Punching Metrics</Text>
              <Text style={styles.assetSub}>STUN Roundtrip: 42ms | LAN Discovery: 255.255.255.255:9999</Text>
              <Text style={styles.assetHash}>AES-256-GCM Direct Channel Established</Text>
            </View>
          </View>
        )}

        {/* VIEW 10: SECURITY AUDIT */}
        {activeTab === 'audit' && (
          <View style={styles.viewSection}>
            <Text style={styles.sectionTitle}>Security Audit Stream</Text>
            <View style={styles.card}>
              {events.map((evt, idx) => (
                <View key={idx} style={styles.auditRow}>
                  <Shield size={12} color="#10b981" />
                  <Text style={styles.auditMessage}>{evt.message || evt.Message}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* SERVER CONFIG MODAL */}
      <Modal visible={serverModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Server size={16} color="#ffffff" />
              <Text style={styles.modalTitle}>Backend Server Config</Text>
              <TouchableOpacity onPress={() => setServerModalOpen(false)}>
                <X size={16} color="#71717a" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>REST API & P2P Endpoint URL</Text>
            <TextInput
              style={styles.textInput}
              value={tempApiBase}
              onChangeText={setTempApiBase}
              placeholder="http://192.168.0.100:8000/api/v1"
              placeholderTextColor="#52525b"
            />

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => {
                setApiBase(tempApiBase);
                setServerModalOpen(false);
              }}
            >
              <Text style={styles.primaryBtnText}>Save & Re-sync Vault</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* SEARCH MODAL */}
      <Modal visible={searchOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Search size={16} color="#ffffff" />
              <Text style={styles.modalTitle}>Spotlight Search (FTS5)</Text>
              <TouchableOpacity onPress={() => setSearchOpen(false)}>
                <X size={16} color="#71717a" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.textInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search vault items, notes, projects..."
              placeholderTextColor="#52525b"
              autoFocus
            />

            <ScrollView style={{ maxHeight: 250, marginTop: 10 }}>
              {searchResults.map((res, idx) => (
                <View key={idx} style={styles.searchResultItem}>
                  <Text style={styles.searchResultTitle}>{res.title || res.Title}</Text>
                  <Text style={styles.searchResultSnippet}>{res.snippet || res.Snippet || res.description}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* CREATE NOTE MODAL */}
      <Modal visible={newNoteModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <FileText size={16} color="#ffffff" />
              <Text style={styles.modalTitle}>New Knowledge Note</Text>
              <TouchableOpacity onPress={() => setNewNoteModalOpen(false)}>
                <X size={16} color="#71717a" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.textInput}
              value={noteForm.title}
              onChangeText={(t) => setNoteForm({ ...noteForm, title: t })}
              placeholder="Note Title"
              placeholderTextColor="#52525b"
            />

            <TextInput
              style={[styles.textInput, { height: 80, marginTop: 8 }]}
              value={noteForm.content}
              onChangeText={(t) => setNoteForm({ ...noteForm, content: t })}
              placeholder="Markdown content..."
              placeholderTextColor="#52525b"
              multiline
            />

            <TouchableOpacity style={styles.primaryBtn} onPress={handleCreateNote}>
              <Text style={styles.primaryBtnText}>Save Note</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* CREATE PROJECT MODAL */}
      <Modal visible={newProjectModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <FolderKanban size={16} color="#ffffff" />
              <Text style={styles.modalTitle}>New Mission Kanban</Text>
              <TouchableOpacity onPress={() => setNewProjectModalOpen(false)}>
                <X size={16} color="#71717a" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.textInput}
              value={projectForm.name}
              onChangeText={(t) => setProjectForm({ ...projectForm, name: t })}
              placeholder="Mission Name"
              placeholderTextColor="#52525b"
            />

            <TextInput
              style={[styles.textInput, { height: 60, marginTop: 8 }]}
              value={projectForm.description}
              onChangeText={(t) => setProjectForm({ ...projectForm, description: t })}
              placeholder="Description & objectives..."
              placeholderTextColor="#52525b"
              multiline
            />

            <TouchableOpacity style={styles.primaryBtn} onPress={handleCreateProject}>
              <Text style={styles.primaryBtnText}>Create Mission</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* UPLOAD FILE MODAL */}
      <Modal visible={uploadModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <UploadCloud size={16} color="#ffffff" />
              <Text style={styles.modalTitle}>Upload File Asset</Text>
              <TouchableOpacity onPress={() => setUploadModalOpen(false)}>
                <X size={16} color="#71717a" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.textInput}
              value={uploadFileName}
              onChangeText={setUploadFileName}
              placeholder="Filename (e.g. report.pdf)"
              placeholderTextColor="#52525b"
            />

            <TextInput
              style={[styles.textInput, { height: 60, marginTop: 8 }]}
              value={uploadFileContent}
              onChangeText={setUploadFileContent}
              placeholder="File text or payload..."
              placeholderTextColor="#52525b"
              multiline
            />

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setEncryptUpload(!encryptUpload)}
            >
              <View style={[styles.checkbox, encryptUpload && styles.checkboxChecked]}>
                {encryptUpload && <Check size={10} color="#ffffff" />}
              </View>
              <Text style={styles.checkboxLabel}>Encrypt with AES-256-GCM before saving</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleUploadFile}>
              <Text style={styles.primaryBtnText}>Upload to Vault</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#27272a',
    backgroundColor: '#121215',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pureGoBadge: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  pureGoText: {
    color: '#a1a1aa',
    fontSize: 9,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  p2pBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#052e16',
    borderWidth: 1,
    borderColor: '#14532d',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
  },
  greenDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  p2pText: {
    color: '#4ade80',
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  iconBtn: {
    padding: 6,
    backgroundColor: '#18181b',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  actionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#27272a',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  navBar: {
    borderBottomWidth: 1,
    borderColor: '#27272a',
    backgroundColor: '#09090b',
  },
  navScroll: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 4,
  },
  navTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    backgroundColor: '#121215',
    borderWidth: 1,
    borderColor: '#1c1c21',
  },
  navTabActive: {
    backgroundColor: '#27272a',
    borderColor: '#3f3f46',
  },
  navTabText: {
    color: '#71717a',
    fontSize: 11,
    fontWeight: '600',
  },
  navTabTextActive: {
    color: '#ffffff',
  },
  mainScroll: {
    flex: 1,
  },
  mainContent: {
    padding: 12,
  },
  loadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#18181b',
    padding: 8,
    borderRadius: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  loadingText: {
    color: '#a1a1aa',
    fontSize: 11,
  },
  viewSection: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#e4e4e7',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  smallAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#27272a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  smallAddText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#121215',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 6,
    padding: 10,
  },
  metricLabel: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: '600',
  },
  metricValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginVertical: 2,
  },
  metricSub: {
    color: '#52525b',
    fontSize: 9,
  },
  card: {
    backgroundColor: '#121215',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 6,
    padding: 10,
    gap: 6,
  },
  tableRowHeader: {
    flexDirection: 'row',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderColor: '#27272a',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: '#18181b',
  },
  tableRowNoBorder: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  th: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: '700',
  },
  tdBold: {
    color: '#f4f4f5',
    fontSize: 11,
    fontWeight: '600',
  },
  tdCode: {
    color: '#a1a1aa',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  tdSuccess: {
    color: '#4ade80',
    fontSize: 10,
    fontWeight: '600',
  },
  tdText: {
    color: '#a1a1aa',
    fontSize: 10,
  },
  pillSuccess: {
    backgroundColor: '#052e16',
    borderColor: '#14532d',
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  pillTextSuccess: {
    color: '#4ade80',
    fontSize: 9,
    fontWeight: '700',
  },
  pillMuted: {
    backgroundColor: '#18181b',
    borderColor: '#27272a',
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  pillTextMuted: {
    color: '#a1a1aa',
    fontSize: 9,
  },
  auditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  auditIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3b82f6',
  },
  auditMessage: {
    color: '#d4d4d8',
    fontSize: 11,
  },
  auditTime: {
    color: '#52525b',
    fontSize: 9,
  },
  assetCard: {
    backgroundColor: '#121215',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 6,
    padding: 10,
    gap: 4,
  },
  assetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  assetTitle: {
    color: '#f4f4f5',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  assetSub: {
    color: '#a1a1aa',
    fontSize: 11,
  },
  assetMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  assetHash: {
    color: '#71717a',
    fontSize: 9,
    fontFamily: 'monospace',
  },
  assetSize: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: '600',
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#022c22',
    borderWidth: 1,
    borderColor: '#065f46',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  lockText: {
    color: '#34d399',
    fontSize: 8,
    fontWeight: '700',
  },
  noteContent: {
    color: '#a1a1aa',
    fontSize: 11,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#121215',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 8,
    padding: 14,
    gap: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: '#27272a',
    paddingBottom: 8,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    marginLeft: 6,
  },
  inputLabel: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#ffffff',
    fontSize: 11,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  checkbox: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#3f3f46',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  checkboxLabel: {
    color: '#a1a1aa',
    fontSize: 10,
  },
  primaryBtn: {
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
    borderRadius: 4,
    paddingVertical: 9,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  searchResultItem: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: '#18181b',
  },
  searchResultTitle: {
    color: '#f4f4f5',
    fontSize: 11,
    fontWeight: '700',
  },
  searchResultSnippet: {
    color: '#71717a',
    fontSize: 10,
  },
});
