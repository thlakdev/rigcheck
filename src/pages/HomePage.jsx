import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hardwareService } from '../services/hardwareService';
import {
  evaluateCombinedBuild,
  evaluateSoftwareTarget
} from '../utils/scoringEngine';
import {
  Cpu,
  Monitor,
  HardDrive,
  Sliders,
  MessageSquare,
  LayoutDashboard,
  Globe,
  User,
  ChevronDown,
  Search,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Save,
  History,
  Calculator,
  LogOut,
  Loader2,
  Pencil,
  Trash2,
  Laptop,
  Lock,
  Copy,
  Check,
  X,
  Info,
  Zap,
  ArrowRight
} from 'lucide-react';

// ============================================================================
// 1. REUSABLE SEARCHABLE HARDWARE DROPDOWN (Matches Original Card Aesthetic)
// ============================================================================
function HardwareDropdown({
  label,
  icon: Icon,
  iconColor = 'text-cyan-400',
  options = [],
  selected,
  onSelect,
  type = 'CPU' // 'CPU' | 'GPU'
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleOutside = e => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const filtered = useMemo(() => {
    const clean = search.trim().toLowerCase();
    if (!clean) return options;
    const tokens = clean.split(/\s+/);
    return options.filter(item => {
      const hay = `${item.brand} ${item.model} ${item.tier} ${item.is_mobile ? 'laptop mobile' : 'desktop'}`.toLowerCase();
      return tokens.every(t => hay.includes(t));
    });
  }, [options, search]);

  const formatMeta = item => {
    if (!item) return 'Select from database';
    const formFactor = item.is_mobile ? 'Laptop (0.85x)' : 'Desktop';
    if (type === 'CPU') {
      return `Score ${Number(item.universal_score).toFixed(1)} • ${item.cores}C/${item.threads}T • ${formFactor}`;
    }
    return `Score ${Number(item.universal_score).toFixed(1)} • ${item.vram_gb}GB VRAM • ${formFactor}`;
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
        <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
        <span>{label}</span>
      </div>

      {/* Trigger Card */}
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className={`w-full text-left px-4 py-3 rounded-xl bg-[#070b14] border transition-all flex items-center justify-between gap-3 ${
          open
            ? 'border-cyan-500 ring-2 ring-cyan-500/20'
            : 'border-slate-700/80 hover:border-slate-600'
        }`}
      >
        <div className="min-w-0">
          <div className="text-sm font-bold text-white truncate">
            {selected ? `${selected.brand} ${selected.model}` : `Select ${type}...`}
          </div>
          <div className="text-xs text-slate-400 truncate mt-0.5">
            {selected ? (
              <>
                <span className="text-cyan-400 font-semibold">
                  Score {Number(selected.universal_score).toFixed(1)}
                </span>{' '}
                •{' '}
                {type === 'CPU'
                  ? `${selected.cores}C/${selected.threads}T`
                  : `${selected.vram_gb}GB VRAM`}{' '}
                • {selected.is_mobile ? 'Laptop' : 'Desktop'}
              </>
            ) : (
              'Click to choose from Supabase catalog'
            )}
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
            open ? 'rotate-180 text-cyan-400' : ''
          }`}
        />
      </button>

      {/* Searchable Dropdown Menu */}
      {open && (
        <div className="absolute z-50 left-0 right-0 mt-2 rounded-2xl bg-[#0c1322] border border-cyan-500/40 shadow-2xl shadow-black/90 overflow-hidden">
          <div className="p-2.5 border-b border-slate-800 bg-[#090e1a]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={`Search ${options.length} ${type}s (e.g., ${type === 'CPU' ? 'Ryzen, Core i5' : 'RTX 4070, RX 7800'})...`}
                className="w-full pl-8 pr-7 py-2 rounded-lg bg-[#070b14] border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/70">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                {options.length === 0
                  ? `No ${type} records found in Supabase components table.`
                  : `No ${type} matches "${search}".`}
              </div>
            ) : (
              filtered.map(item => {
                const isSelected = selected?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelect(item);
                      setSearch('');
                      setOpen(false);
                    }}
                    className={`w-full px-3.5 py-2.5 text-left hover:bg-slate-800/90 transition-colors flex items-center justify-between gap-3 ${
                      isSelected ? 'bg-cyan-500/15' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                        <span className="truncate">
                          {item.brand} {item.model}
                        </span>
                        {item.is_mobile && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
                            Laptop
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {formatMeta(item)}
                      </div>
                    </div>
                    <span className="text-xs font-black font-mono text-cyan-300 bg-[#070b14] px-2 py-1 rounded border border-slate-800 shrink-0">
                      {Number(item.universal_score).toFixed(1)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 2. HELPERS FOR TIERS & TARGET SCORES
// ============================================================================
function getRigTierBadge(score) {
  if (score >= 70) return { label: '4K Flagship Rig', tone: 'text-violet-300 bg-violet-500/15 border-violet-500/35' };
  if (score >= 48) return { label: '1440p Enthusiast Rig', tone: 'text-cyan-300 bg-cyan-500/15 border-cyan-500/35' };
  if (score >= 30) return { label: '1080p Mid-Range Rig', tone: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/35' };
  return { label: 'Entry / Portable Rig', tone: 'text-amber-300 bg-amber-500/15 border-amber-500/35' };
}

function getSoftwareTargetScore(sw, tier = 'rec') {
  const cpu = Number(tier === 'min' ? sw.min_cpu_score : sw.rec_cpu_score);
  const gpu = Number(tier === 'min' ? sw.min_gpu_score : sw.rec_gpu_score);
  const ram = Number(tier === 'min' ? sw.min_ram_score : sw.rec_ram_score);
  const storage = Number(tier === 'min' ? sw.min_storage_score : sw.rec_storage_score);
  return Number((0.40 * gpu + 0.35 * cpu + 0.15 * ram + 0.10 * storage).toFixed(1));
}

const QUICK_PRESETS = [
  {
    id: 'budget',
    title: 'Budget Esports',
    subtitle: '1080p Competitive',
    cpuMatch: '5600',
    gpuMatch: '4060 (8GB)',
    ramGb: 16,
    storageMatch: 'SN580'
  },
  {
    id: 'mid1440',
    title: 'Mid-Range 1440p',
    subtitle: 'High-FPS Sweet Spot',
    cpuMatch: '7600X',
    gpuMatch: '4070 Super',
    ramGb: 32,
    storageMatch: '990 Pro'
  },
  {
    id: 'flagship4k',
    title: '4K Flagship',
    subtitle: 'Uncompromised Ultra',
    cpuMatch: '7950X3D',
    gpuMatch: '4090 (24GB)',
    ramGb: 64,
    storageMatch: 'T700'
  },
  {
    id: 'ultrabook',
    title: 'Ultrabook Laptop',
    subtitle: 'Portable Productivity',
    cpuMatch: '226V',
    gpuMatch: '130V',
    ramGb: 16,
    storageMatch: 'SN580'
  }
];

const OS_OPTIONS = ['Windows 11', 'Windows 10', 'macOS', 'Linux'];

// ============================================================================
// 3. MAIN HOMEPAGE COMPONENT
// ============================================================================
export default function HomePage() {
  const { user, profile, isAuthenticated, loading: authLoading, logout, updatePrivacy } = useAuth();

  // Top Navigation Tab: 'checker' | 'hardware' | 'dashboard' | 'profile'
  const [activeNav, setActiveNav] = useState('checker');

  // Database Catalog State
  const [allComponents, setAllComponents] = useState([]);
  const [laptops, setLaptops] = useState([]);
  const [softwareTitles, setSoftwareTitles] = useState([]);
  const [savedRigs, setSavedRigs] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState('');

  // Active Custom Rig State
  const [selectedCpu, setSelectedCpu] = useState(null);
  const [selectedGpu, setSelectedGpu] = useState(null);
  const [selectedRam, setSelectedRam] = useState(null);
  const [selectedStorage, setSelectedStorage] = useState(null);
  const [selectedOs, setSelectedOs] = useState('Windows 11');
  const [activePresetId, setActivePresetId] = useState('mid1440');

  // Backend RPC Score State
  const [backendEval, setBackendEval] = useState(null);
  const [evaluatingRpc, setEvaluatingRpc] = useState(false);

  // Save / Edit Saved Rig State
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [rigNameInput, setRigNameInput] = useState('');
  const [editingRigId, setEditingRigId] = useState(null);
  const [savingRig, setSavingRig] = useState(false);

  // Local Snapshot History
  const [snapshots, setSnapshots] = useState([]);

  // Software Catalog Filters
  const [catFilter, setCatFilter] = useState('All');
  const [verdictFilter, setVerdictFilter] = useState('All'); // 'All' | 'Rec' | 'Min' | 'Fail'
  const [softwareSearch, setSoftwareSearch] = useState('');

  // Hardware Tab Filter
  const [hwTabFilter, setHwTabFilter] = useState('GPU'); // 'GPU' | 'CPU' | 'RAM' | 'STORAGE' | 'LAPTOP'
  const [hwSearch, setHwSearch] = useState('');

  // Profile Privacy & Copy State
  const [privacyUpdating, setPrivacyUpdating] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (message, tone = 'success') => setToast({ message, tone, id: Date.now() });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // Split DB components by category
  const cpuOptions = useMemo(() => allComponents.filter(c => c.category === 'CPU'), [allComponents]);
  const gpuOptions = useMemo(() => allComponents.filter(c => c.category === 'GPU'), [allComponents]);
  const ramOptions = useMemo(() => allComponents.filter(c => c.category === 'RAM'), [allComponents]);
  const storageOptions = useMemo(() => allComponents.filter(c => c.category === 'STORAGE'), [allComponents]);

  // Available RAM capacity buttons (derived cleanly from DB + standard tiers)
  const ramCapacities = [8, 16, 32, 64];

  // Fetch Full Supabase Catalog on Mount
  useEffect(() => {
    let active = true;
    async function loadCatalog() {
      setLoadingCatalog(true);
      setCatalogError('');
      try {
        const [componentsData, laptopsData, softwareData] = await Promise.all([
          hardwareService.getAllComponents(),
          hardwareService.getScoredLaptops(),
          hardwareService.getSoftwareTitles()
        ]);
        if (!active) return;

        setAllComponents(componentsData);
        setLaptops(laptopsData);
        setSoftwareTitles(softwareData);

        const cpus = componentsData.filter(c => c.category === 'CPU');
        const gpus = componentsData.filter(c => c.category === 'GPU');
        const rams = componentsData.filter(c => c.category === 'RAM');
        const storages = componentsData.filter(c => c.category === 'STORAGE');

        // Default to Mid-Range 1440p preset if available
        setSelectedCpu(cpus.find(c => c.model.includes('7600X')) || cpus.find(c => c.model.includes('7800X3D')) || cpus[0] || null);
        setSelectedGpu(gpus.find(g => g.model.includes('4070 Super')) || gpus[0] || null);
        setSelectedRam(rams.find(r => Number(r.capacity_gb) === 32) || rams[0] || null);
        setSelectedStorage(storages.find(s => s.model.includes('990 Pro')) || storages[0] || null);
      } catch (err) {
        if (active) setCatalogError(err?.message || 'Could not load hardware catalog from Supabase.');
      } finally {
        if (active) setLoadingCatalog(false);
      }
    }
    loadCatalog();
    return () => {
      active = false;
    };
  }, []);

  // Load Authenticated User's Saved Rigs Backup
  useEffect(() => {
    if (!user?.id) {
      setSavedRigs([]);
      return;
    }
    hardwareService
      .getUserSavedRigs(user.id)
      .then(setSavedRigs)
      .catch(err => console.error('Saved rigs fetch error:', err.message));
  }, [user?.id]);

  // Evaluate Selected Parts via Backend PostgreSQL RPC
  useEffect(() => {
    if (!selectedCpu?.id || !selectedGpu?.id || !selectedRam?.id || !selectedStorage?.id) return;
    let active = true;
    setEvaluatingRpc(true);
    hardwareService
      .evaluateBuildInBackend({
        cpuId: selectedCpu.id,
        gpuId: selectedGpu.id,
        ramId: selectedRam.id,
        storageId: selectedStorage.id
      })
      .then(res => {
        if (active) setBackendEval(res);
      })
      .catch(err => console.error('Backend evaluation RPC error:', err.message))
      .finally(() => {
        if (active) setEvaluatingRpc(false);
      });
    return () => {
      active = false;
    };
  }, [selectedCpu?.id, selectedGpu?.id, selectedRam?.id, selectedStorage?.id]);

  // Combined Rig Summary
  const rigSummary = useMemo(() => {
    if (!selectedCpu || !selectedGpu || !selectedRam || !selectedStorage) return null;
    const localCalc = evaluateCombinedBuild({
      cpu: selectedCpu,
      gpu: selectedGpu,
      ram: selectedRam,
      storage: selectedStorage
    });
    const finalScore = Number(backendEval?.final_score ?? localCalc.finalScore);
    return {
      ...localCalc,
      finalScore,
      balanceLabel: backendEval?.balance_label ?? localCalc.balance.label,
      tier: getRigTierBadge(finalScore)
    };
  }, [selectedCpu, selectedGpu, selectedRam, selectedStorage, backendEval]);

  // Evaluate All Software & Games in Database
  const evaluatedTitles = useMemo(() => {
    if (!rigSummary || !selectedGpu) return [];
    return softwareTitles.map(sw => ({
      ...sw,
      minTarget: getSoftwareTargetScore(sw, 'min'),
      recTarget: getSoftwareTargetScore(sw, 'rec'),
      check: evaluateSoftwareTarget(
        {
          cpuScore: rigSummary.cpuScore,
          gpuScore: rigSummary.gpuScore,
          ramScore: rigSummary.ramScore,
          storageScore: rigSummary.storageScore,
          vramGb: selectedGpu.vram_gb
        },
        sw
      )
    }));
  }, [rigSummary, selectedGpu, softwareTitles]);

  const verdictCounts = useMemo(() => {
    return evaluatedTitles.reduce(
      (acc, t) => {
        if (t.check.verdict === 'recommended') acc.rec += 1;
        else if (t.check.verdict === 'minimum') acc.min += 1;
        else acc.fail += 1;
        return acc;
      },
      { rec: 0, min: 0, fail: 0 }
    );
  }, [evaluatedTitles]);

  const softwareCategories = useMemo(() => {
    return ['All', ...Array.from(new Set(softwareTitles.map(s => s.category)))];
  }, [softwareTitles]);

  const filteredTitles = useMemo(() => {
    const q = softwareSearch.trim().toLowerCase();
    return evaluatedTitles.filter(sw => {
      if (catFilter !== 'All' && sw.category !== catFilter) return false;
      if (verdictFilter === 'Rec' && sw.check.verdict !== 'recommended') return false;
      if (verdictFilter === 'Min' && sw.check.verdict !== 'minimum') return false;
      if (verdictFilter === 'Fail' && sw.check.verdict !== 'cannot_run') return false;
      if (q && !`${sw.name} ${sw.category}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [evaluatedTitles, catFilter, verdictFilter, softwareSearch]);

  // Apply Quick-Fill Preset
  const handleApplyPreset = preset => {
    setActivePresetId(preset.id);
    const matchCpu = cpuOptions.find(c => c.model.includes(preset.cpuMatch)) || cpuOptions[0];
    const matchGpu = gpuOptions.find(g => g.model.includes(preset.gpuMatch)) || gpuOptions[0];
    const matchRam = ramOptions.find(r => Number(r.capacity_gb) === preset.ramGb) || ramOptions[0];
    const matchStorage = storageOptions.find(s => s.model.includes(preset.storageMatch)) || storageOptions[0];

    if (matchCpu) setSelectedCpu(matchCpu);
    if (matchGpu) setSelectedGpu(matchGpu);
    if (matchRam) setSelectedRam(matchRam);
    if (matchStorage) setSelectedStorage(matchStorage);
    showToast(`Applied "${preset.title}" preset from database.`);
  };

  // Pick RAM capacity button -> selects best matching DB RAM kit
  const handleSelectRamCapacity = gb => {
    const match = ramOptions.find(r => Number(r.capacity_gb) === gb);
    if (match) {
      setSelectedRam(match);
      setActivePresetId('');
    }
  };

  // Save or Update Rig Profile in Supabase
  const handleSaveOrUpdateRig = async e => {
    e.preventDefault();
    if (!isAuthenticated || !user?.id) {
      showToast('Sign in to save your rig profile to your database backup.', 'info');
      return;
    }
    if (!rigSummary || !selectedCpu || !selectedGpu || !selectedRam || !selectedStorage) return;

    const cleanName = rigNameInput.trim() || `${selectedCpu.model} + ${selectedGpu.model}`;
    const payload = {
      rig_name: cleanName,
      rig_type: rigSummary.isMobileBuild ? 'Laptop' : 'Desktop',
      cpu_id: selectedCpu.id,
      gpu_id: selectedGpu.id,
      ram_id: selectedRam.id,
      storage_id: selectedStorage.id,
      final_score: rigSummary.finalScore,
      is_public: profile?.is_public ?? true
    };

    setSavingRig(true);
    try {
      if (editingRigId) {
        await hardwareService.updateUserRig(editingRigId, payload);
        showToast(`Updated saved rig "${cleanName}" in database!`);
      } else {
        await hardwareService.saveUserRig({ ...payload, user_id: user.id });
        showToast(`Saved "${cleanName}" to My Dashboard!`);
      }
      const updatedList = await hardwareService.getUserSavedRigs(user.id);
      setSavedRigs(updatedList);
      setEditingRigId(null);
      setRigNameInput('');
      setShowSaveForm(false);
    } catch (err) {
      showToast(err?.message || 'Failed to save rig profile.', 'error');
    } finally {
      setSavingRig(false);
    }
  };

  // Load or Edit a Saved Rig from My Dashboard
  const handleLoadSavedRig = (rig, editMode = false) => {
    if (rig.cpu) setSelectedCpu(rig.cpu);
    if (rig.gpu) setSelectedGpu(rig.gpu);
    if (rig.ram) setSelectedRam(rig.ram);
    if (rig.storage) setSelectedStorage(rig.storage);
    setActivePresetId('');
    setActiveNav('checker');

    if (editMode) {
      setEditingRigId(rig.id);
      setRigNameInput(rig.rig_name);
      setShowSaveForm(true);
      showToast(`Editing "${rig.rig_name}". Adjust parts and click Update Saved Rig.`, 'info');
    } else {
      setEditingRigId(null);
      setShowSaveForm(false);
      showToast(`Loaded "${rig.rig_name}" into Spec Checker.`);
    }
  };

  const handleDeleteSavedRig = async rig => {
    try {
      await hardwareService.deleteUserRig(rig.id);
      setSavedRigs(prev => prev.filter(r => r.id !== rig.id));
      if (editingRigId === rig.id) {
        setEditingRigId(null);
        setShowSaveForm(false);
      }
      showToast(`Deleted "${rig.rig_name}".`, 'info');
    } catch (err) {
      showToast(err?.message || 'Could not delete saved rig.', 'error');
    }
  };

  const handleLogSnapshot = () => {
    if (!rigSummary) return;
    const entry = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      cpu: `${selectedCpu.brand} ${selectedCpu.model}`,
      gpu: `${selectedGpu.brand} ${selectedGpu.model}`,
      ram: `${selectedRam.capacity_gb}GB`,
      score: rigSummary.finalScore,
      recCount: verdictCounts.rec
    };
    setSnapshots(prev => [entry, ...prev].slice(0, 10));
    showToast(`Logged rig snapshot (Score ${rigSummary.finalScore}) to My Dashboard.`);
  };

  const handleToggleProfilePrivacy = async () => {
    if (!isAuthenticated) return;
    setPrivacyUpdating(true);
    try {
      const next = !(profile?.is_public ?? true);
      await updatePrivacy(next);
      showToast(`Profile visibility set to ${next ? 'Public' : 'Private'}.`);
    } catch (err) {
      showToast(err?.message || 'Failed to update privacy.', 'error');
    } finally {
      setPrivacyUpdating(false);
    }
  };

  const handleCopyPublicUrl = () => {
    const handle = profile?.handle || 'member';
    const url = `${window.location.origin}${import.meta.env.BASE_URL}#/u/${handle}`;
    if (navigator.clipboard) navigator.clipboard.writeText(url).catch(() => {});
    setCopiedUrl(true);
    showToast('Copied public profile URL!');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div
      className="min-h-screen bg-[#070b14] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200"
      style={{
        backgroundImage:
          'linear-gradient(to right, rgba(30, 41, 59, 0.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(30, 41, 59, 0.16) 1px, transparent 1px)',
        backgroundSize: '42px 42px'
      }}
    >
      {/* =====================================================================
          TOP NAVBAR (Restored Original Phase 2 Layout + Parts Scorer Link)
         ===================================================================== */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#090d18]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Brand */}
          <button
            type="button"
            onClick={() => setActiveNav('checker')}
            className="flex items-center gap-2.5 text-left shrink-0"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Cpu className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="text-base font-black tracking-tight text-white leading-none">
                Rig<span className="text-cyan-400">Check</span>
              </div>
              <div className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">
                CAN YOU RUN IT
              </div>
            </div>
          </button>

          {/* Center Navigation Pill Bar */}
          <nav className="hidden lg:flex items-center gap-1 p-1 rounded-2xl bg-[#0e1525] border border-slate-800">
            {[
              { id: 'checker', label: 'Spec Checker', icon: Sliders },
              { id: 'hardware', label: 'Hardware Catalog', icon: MessageSquare },
              { id: 'dashboard', label: 'My Dashboard', icon: LayoutDashboard },
              { id: 'profile', label: 'Public Profile', icon: Globe }
            ].map(tab => {
              const Icon = tab.icon;
              const active = activeNav === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveNav(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    active
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-white border border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}

            {/* Dedicated Button Linking to Custom Parts & Laptop Scorer Page */}
            <Link
              to="/scorer"
              className="ml-1 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-500/20 to-cyan-500/20 hover:from-violet-500/30 hover:to-cyan-500/30 text-cyan-200 border border-violet-500/40 flex items-center gap-1.5 transition-all"
            >
              <Calculator className="w-3.5 h-3.5 text-violet-300" />
              Parts &amp; Laptop Scorer
            </Link>
          </nav>

          {/* Right Status + Auth Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {selectedGpu && (
              <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0e1525] border border-slate-800 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-slate-400">Active:</span>
                <span className="font-bold text-white max-w-[140px] truncate">
                  {selectedGpu.model}
                </span>
              </div>
            )}

            {authLoading ? (
              <div className="h-8 w-20 animate-pulse rounded-xl bg-slate-800" />
            ) : isAuthenticated ? (
              <div className="flex items-center gap-1.5">
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-xl bg-[#0e1525] hover:bg-slate-800 border border-slate-700 text-xs font-mono text-cyan-300 flex items-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>@{profile?.handle || user?.email?.split('@')[0]}</span>
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  title="Sign Out"
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-3.5 py-1.5 rounded-xl bg-[#0e1525] hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-amber-400" />
                Guest
              </Link>
            )}
          </div>
        </div>

        {/* Compact Mobile / Tablet Nav */}
        <div className="lg:hidden px-4 pb-2.5 flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'checker', label: 'Spec Checker' },
            { id: 'hardware', label: 'Catalog' },
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'profile', label: 'Profile' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveNav(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 ${
                activeNav === tab.id
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40'
                  : 'bg-[#0e1525] text-slate-400 border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <Link
            to="/scorer"
            className="px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 bg-violet-500/20 text-cyan-200 border border-violet-500/40 flex items-center gap-1"
          >
            <Calculator className="w-3 h-3" />
            Parts Scorer
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {catalogError && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/35 text-rose-200 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{catalogError}</span>
          </div>
        )}

        {loadingCatalog ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Loading RigCheck hardware &amp; software database...
            </span>
          </div>
        ) : (
          <>
            {/* ===============================================================
                TAB 1: SPEC CHECKER (Matches Original Phase 2 Layout)
               =============================================================== */}
            {activeNav === 'checker' && (
              <div className="space-y-6">
                {/* Top Row: Left Builder (8 cols) + Right Live Rig Score (4 cols) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  {/* LEFT CARD: PC Spec Builder & Instant Checker (NO overflow-hidden!) */}
                  <section className="lg:col-span-8 rounded-2xl bg-[#0e1525]/95 border border-slate-800 p-5 sm:p-6 space-y-5 overflow-visible">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2.5">
                          <Sliders className="w-5 h-5 text-cyan-400" />
                          PC Spec Builder &amp; Instant Checker
                        </h1>
                        <p className="text-xs text-slate-400 mt-1">
                          Select your hardware once to evaluate {softwareTitles.length} games &amp; creative apps in real time.
                        </p>
                      </div>
                      {editingRigId && (
                        <span className="px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-[11px] font-bold">
                          Editing Saved Rig
                        </span>
                      )}
                    </div>

                    {/* Quick-Fill Rig Presets */}
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                        QUICK-FILL RIG PRESETS
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {QUICK_PRESETS.map(preset => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => handleApplyPreset(preset)}
                            className={`px-3.5 py-2 rounded-xl border text-xs transition-all flex items-center gap-1.5 ${
                              activePresetId === preset.id
                                ? 'bg-cyan-500/10 border-cyan-500/50 text-white'
                                : 'bg-[#070b14] border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <span className="font-bold">{preset.title}</span>
                            <span className="text-slate-500">•</span>
                            <span className="text-slate-400">{preset.subtitle}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* CPU & GPU Searchable Database Dropdowns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-visible">
                      <HardwareDropdown
                        label="PROCESSOR (CPU)"
                        icon={Cpu}
                        iconColor="text-cyan-400"
                        options={cpuOptions}
                        selected={selectedCpu}
                        onSelect={part => {
                          setSelectedCpu(part);
                          setActivePresetId('');
                        }}
                        type="CPU"
                      />

                      <HardwareDropdown
                        label="GRAPHICS CARD (GPU)"
                        icon={Monitor}
                        iconColor="text-sky-400"
                        options={gpuOptions}
                        selected={selectedGpu}
                        onSelect={part => {
                          setSelectedGpu(part);
                          setActivePresetId('');
                        }}
                        type="GPU"
                      />
                    </div>

                    {/* RAM, Primary Storage & OS Row */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-1">
                      {/* System RAM */}
                      <div className="md:col-span-4 space-y-2">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          SYSTEM RAM
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {ramCapacities.map(gb => {
                            const active = Number(selectedRam?.capacity_gb) === gb;
                            return (
                              <button
                                key={gb}
                                type="button"
                                onClick={() => handleSelectRamCapacity(gb)}
                                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                                  active
                                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                                    : 'bg-[#070b14] border-slate-800 text-slate-300 hover:border-slate-700'
                                }`}
                              >
                                {gb}GB
                              </button>
                            );
                          })}
                        </div>
                        {selectedRam && (
                          <div className="text-[11px] text-slate-400 truncate">
                            {selectedRam.brand} {selectedRam.model} (Score {Number(selectedRam.universal_score).toFixed(1)})
                          </div>
                        )}
                      </div>

                      {/* Primary Storage Dropdown */}
                      <div className="md:col-span-4 space-y-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                          <span>PRIMARY STORAGE</span>
                        </div>
                        <select
                          value={selectedStorage?.id || ''}
                          onChange={e => {
                            const found = storageOptions.find(s => s.id === e.target.value);
                            if (found) {
                              setSelectedStorage(found);
                              setActivePresetId('');
                            }
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b14] border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500"
                        >
                          {storageOptions.map(st => (
                            <option key={st.id} value={st.id}>
                              {st.brand} {st.model} (Score {Number(st.universal_score).toFixed(1)})
                            </option>
                          ))}
                        </select>
                        {selectedStorage && (
                          <div className="text-[11px] text-slate-400">
                            Read {selectedStorage.read_mbs} MB/s • Write {selectedStorage.write_mbs} MB/s
                          </div>
                        )}
                      </div>

                      {/* Operating System */}
                      <div className="md:col-span-4 space-y-2">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          OPERATING SYSTEM
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {OS_OPTIONS.map(os => (
                            <button
                              key={os}
                              type="button"
                              onClick={() => setSelectedOs(os)}
                              className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                                selectedOs === os
                                  ? 'bg-indigo-500/20 border-indigo-400 text-indigo-200'
                                  : 'bg-[#070b14] border-slate-800 text-slate-300 hover:border-slate-700'
                              }`}
                            >
                              {os}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* RIGHT CARD: LIVE RIG SCORE */}
                  <aside className="lg:col-span-4 rounded-2xl bg-[#0e1525]/95 border border-slate-800 p-5 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-cyan-400" />
                        LIVE RIG SCORE
                      </div>
                      {evaluatingRpc && <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />}
                    </div>

                    {rigSummary && (
                      <>
                        <div className="space-y-2.5">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-4xl font-black font-mono text-white">
                              {rigSummary.finalScore}
                            </span>
                            <span className="text-sm text-slate-500 font-semibold">/ 100</span>
                          </div>

                          {/* Gradient Progress Bar */}
                          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 transition-all duration-300"
                              style={{ width: `${Math.min(100, rigSummary.finalScore)}%` }}
                            />
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-0.5">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${rigSummary.tier.tone}`}>
                              {rigSummary.tier.label}
                            </span>
                            {rigSummary.isMobileBuild && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                0.85x Laptop Penalty
                              </span>
                            )}
                          </div>
                        </div>

                        {/* CPU / GPU Balance Box */}
                        <div className="p-4 rounded-xl bg-[#070b14] border border-slate-800 space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-200">CPU / GPU Balance</span>
                            <span
                              className={`font-bold ${
                                rigSummary.balance.status === 'balanced'
                                  ? 'text-emerald-400'
                                  : 'text-amber-400'
                              }`}
                            >
                              {rigSummary.balanceLabel}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            {rigSummary.balance.note}
                          </p>
                          <div className="grid grid-cols-2 gap-2.5">
                            <div className="p-2.5 rounded-lg bg-[#0e1525] border border-slate-800">
                              <div className="text-[10px] font-bold uppercase text-slate-500">CPU BENCH</div>
                              <div className="text-sm font-black font-mono text-white mt-0.5">
                                {rigSummary.cpuScore}
                              </div>
                            </div>
                            <div className="p-2.5 rounded-lg bg-[#0e1525] border border-slate-800">
                              <div className="text-[10px] font-bold uppercase text-slate-500">GPU BENCH</div>
                              <div className="text-sm font-black font-mono text-white mt-0.5 flex items-baseline gap-1.5">
                                <span>{rigSummary.gpuScore}</span>
                                <span className="text-[10px] font-bold text-cyan-400">
                                  {selectedGpu?.vram_gb || 0}GB
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Save / Update Rig Action */}
                        {showSaveForm ? (
                          <form onSubmit={handleSaveOrUpdateRig} className="space-y-2 p-3 rounded-xl bg-[#070b14] border border-cyan-500/40">
                            <label className="text-[11px] font-bold text-cyan-300 block">
                              {editingRigId ? 'Update Saved Rig Name' : 'Name Your Rig Profile'}
                            </label>
                            <input
                              type="text"
                              value={rigNameInput}
                              onChange={e => setRigNameInput(e.target.value)}
                              placeholder="e.g., My Main Desktop"
                              className="w-full px-3 py-2 rounded-lg bg-[#0e1525] border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                            />
                            <div className="flex gap-2">
                              <button
                                type="submit"
                                disabled={savingRig}
                                className="flex-1 py-2 rounded-lg bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                              >
                                {savingRig ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                {editingRigId ? 'Update Rig' : 'Confirm Save'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowSaveForm(false);
                                  setEditingRigId(null);
                                }}
                                className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (!isAuthenticated) {
                                showToast('Sign in to save your rig profile to your database backup.', 'info');
                                return;
                              }
                              setShowSaveForm(true);
                            }}
                            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
                          >
                            <Save className="w-4 h-4" />
                            Save This Rig Profile
                          </button>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={handleLogSnapshot}
                            className="py-2.5 px-3 rounded-xl bg-[#070b14] hover:bg-slate-800/90 border border-slate-800 text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <History className="w-3.5 h-3.5 text-cyan-400" />
                            Log Snapshot
                          </button>

                          <Link
                            to="/scorer"
                            className="py-2.5 px-3 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/40 text-violet-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Calculator className="w-3.5 h-3.5" />
                            Parts Scorer
                          </Link>
                        </div>
                      </>
                    )}
                  </aside>
                </div>

                {/* 4 Summary Stat Cards (Matches Original Screenshot) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="rounded-2xl bg-[#0e1525] border border-cyan-500/35 p-4 sm:p-5">
                    <div className="text-xs text-slate-400 font-semibold">Catalog Checked</div>
                    <div className="text-3xl font-black font-mono text-white mt-1.5">
                      {evaluatedTitles.length}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">Games &amp; Apps</div>
                  </div>

                  <div className="rounded-2xl bg-[#0e1525] border border-slate-800 p-4 sm:p-5">
                    <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Recommended
                    </div>
                    <div className="text-3xl font-black font-mono text-emerald-400 mt-1.5">
                      {verdictCounts.rec}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">High / Smooth Experience</div>
                  </div>

                  <div className="rounded-2xl bg-[#0e1525] border border-slate-800 p-4 sm:p-5">
                    <div className="text-xs text-amber-400 font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> Minimum (Playable)
                    </div>
                    <div className="text-3xl font-black font-mono text-amber-400 mt-1.5">
                      {verdictCounts.min}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">Meets Base Requirements</div>
                  </div>

                  <div className="rounded-2xl bg-[#0e1525] border border-slate-800 p-4 sm:p-5">
                    <div className="text-xs text-rose-400 font-semibold flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" /> Cannot Run
                    </div>
                    <div className="text-3xl font-black font-mono text-rose-400 mt-1.5">
                      {verdictCounts.fail}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">Hardware Upgrade Needed</div>
                  </div>
                </div>

                {/* Filter & Search Bar + Compatibility Results Grid */}
                <section className="space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Category Filter Pills */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {softwareCategories.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCatFilter(cat)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            catFilter === cat
                              ? 'bg-cyan-500 text-slate-950'
                              : 'bg-[#0e1525] text-slate-300 hover:text-white border border-slate-800'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Search + Verdict Toggle */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative flex-1 md:w-64">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={softwareSearch}
                          onChange={e => setSoftwareSearch(e.target.value)}
                          placeholder="Search Cyberpunk, Blender, VS Code..."
                          className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#0e1525] border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div className="flex items-center p-1 rounded-xl bg-[#0e1525] border border-slate-800 text-xs font-bold">
                        {['All', 'Rec', 'Min', 'Fail'].map(v => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setVerdictFilter(v)}
                            className={`px-2.5 py-1 rounded-lg transition-colors ${
                              verdictFilter === v
                                ? 'bg-slate-700 text-white'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Evaluated Software Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredTitles.map(sw => (
                      <div
                        key={sw.id}
                        className="rounded-2xl bg-[#0e1525] border border-slate-800 p-4 sm:p-5 flex flex-col justify-between gap-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-extrabold text-white flex items-center gap-2">
                              <span>{sw.name}</span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                                {sw.category}
                              </span>
                            </div>
                            <p
                              className={`text-xs mt-1.5 leading-relaxed ${
                                sw.check.verdict === 'cannot_run'
                                  ? 'text-rose-300'
                                  : sw.check.verdict === 'minimum'
                                  ? 'text-amber-300'
                                  : 'text-slate-400'
                              }`}
                            >
                              {sw.check.note}
                            </p>
                          </div>

                          {sw.check.verdict === 'recommended' && (
                            <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" /> Recommended
                            </span>
                          )}
                          {sw.check.verdict === 'minimum' && (
                            <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              <AlertTriangle className="w-3 h-3" /> Playable
                            </span>
                          )}
                          {sw.check.verdict === 'cannot_run' && (
                            <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                              <AlertCircle className="w-3 h-3" /> Cannot Run
                            </span>
                          )}
                        </div>

                        <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
                          <span>
                            Your Rig: <strong className="text-cyan-300">{rigSummary?.finalScore}</strong>
                          </span>
                          <span>
                            Min Target: <strong className="text-slate-200">{sw.minTarget}</strong>
                          </span>
                          <span>
                            Rec Target: <strong className="text-emerald-300">{sw.recTarget}</strong>
                          </span>
                          <span>
                            VRAM: <strong className="text-slate-200">{sw.min_vram_gb}GB+</strong>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {/* ===============================================================
                TAB 2: HARDWARE CATALOG (Browse All DB Parts & Laptops)
               =============================================================== */}
            {activeNav === 'hardware' && (
              <div className="space-y-5">
                <div className="rounded-2xl bg-[#0e1525] border border-slate-800 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-white">
                      Database Hardware &amp; Laptop Benchmarks
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Browse all {allComponents.length} scored components and {laptops.length} laptops stored in Supabase.
                    </p>
                  </div>
                  <Link
                    to="/scorer"
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 font-extrabold text-xs inline-flex items-center gap-1.5 shrink-0"
                  >
                    <Calculator className="w-4 h-4" />
                    Score Custom Parts Together
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    {['GPU', 'CPU', 'RAM', 'STORAGE', 'LAPTOP'].map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setHwTabFilter(cat)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold ${
                          hwTabFilter === cat
                            ? 'bg-cyan-500 text-slate-950'
                            : 'bg-[#0e1525] text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {cat === 'LAPTOP' ? `Laptops (${laptops.length})` : `${cat}s`}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={hwSearch}
                      onChange={e => setHwSearch(e.target.value)}
                      placeholder="Filter catalog..."
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#0e1525] border border-slate-800 text-xs text-white"
                    />
                  </div>
                </div>

                {hwTabFilter === 'LAPTOP' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {laptops
                      .filter(l => `${l.brand} ${l.model} ${l.cpu_name} ${l.gpu_name}`.toLowerCase().includes(hwSearch.toLowerCase()))
                      .map(lap => (
                        <div key={lap.id} className="rounded-2xl bg-[#0e1525] border border-slate-800 p-5 flex flex-col justify-between gap-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                                {lap.category}
                              </span>
                              <h3 className="text-base font-extrabold text-white mt-1.5">
                                {lap.brand} {lap.model}
                              </h3>
                              <p className="text-xs text-slate-400 mt-1">
                                {lap.cpu_name} • {lap.gpu_name}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-[10px] text-slate-400 uppercase font-bold">Mobile Rank</div>
                              <div className="text-xl font-black font-mono text-cyan-400">{lap.leaderboard_laptop_score}</div>
                              <div className="text-[10px] text-amber-300 font-mono">Game (0.85x): {lap.universal_laptop_score}</div>
                            </div>
                          </div>
                          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                            <span className="text-slate-400">{lap.display_spec}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const c = allComponents.find(x => x.id === lap.cpu_id);
                                const g = allComponents.find(x => x.id === lap.gpu_id);
                                const r = allComponents.find(x => x.id === lap.ram_id);
                                const s = allComponents.find(x => x.id === lap.storage_id);
                                if (c) setSelectedCpu(c);
                                if (g) setSelectedGpu(g);
                                if (r) setSelectedRam(r);
                                if (s) setSelectedStorage(s);
                                setActiveNav('checker');
                                showToast(`Loaded ${lap.brand} ${lap.model} into Spec Checker.`);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/35 font-bold"
                            >
                              Test in Checker
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allComponents
                      .filter(c => c.category === hwTabFilter)
                      .filter(c => `${c.brand} ${c.model} ${c.tier}`.toLowerCase().includes(hwSearch.toLowerCase()))
                      .map(part => (
                        <div key={part.id} className="rounded-2xl bg-[#0e1525] border border-slate-800 p-4 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate">
                              {part.brand} {part.model}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {part.tier} • {part.is_mobile ? 'Mobile (0.85x)' : 'Desktop'}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-[10px] text-slate-500 uppercase font-bold">Score</div>
                            <div className="text-base font-black font-mono text-cyan-300">
                              {Number(part.universal_score).toFixed(1)}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* ===============================================================
                TAB 3: MY DASHBOARD (Saved Rigs Backup, Edit, Delete & History)
               =============================================================== */}
            {activeNav === 'dashboard' && (
              <div className="space-y-6">
                <div className="rounded-2xl bg-[#0e1525] border border-slate-800 p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-extrabold text-white">
                        My Saved Rig Backups ({savedRigs.length})
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Load any saved rig to test new software/games, or click Edit to update its components in Supabase.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveNav('checker')}
                      className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-extrabold text-xs"
                    >
                      + Build New Rig
                    </button>
                  </div>

                  {!isAuthenticated ? (
                    <div className="py-10 text-center space-y-3">
                      <p className="text-sm text-slate-300 font-semibold">
                        Sign in to back up and edit your custom rigs across devices.
                      </p>
                      <Link
                        to="/login"
                        className="inline-block px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 font-extrabold text-xs"
                      >
                        Sign In / Create Account
                      </Link>
                    </div>
                  ) : savedRigs.length === 0 ? (
                    <div className="py-10 text-center text-xs text-slate-400">
                      You have no saved rigs yet. Configure your parts in Spec Checker and click <strong>Save This Rig Profile</strong>.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {savedRigs.map(rig => (
                        <div key={rig.id} className="p-5 rounded-2xl bg-[#070b14] border border-slate-800 flex flex-col justify-between gap-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                                  {rig.rig_type}
                                </span>
                                <span className="text-xs font-mono font-black text-emerald-400">
                                  Score: {Number(rig.final_score).toFixed(1)}
                                </span>
                              </div>
                              <h3 className="text-base font-extrabold text-white mt-1.5">
                                {rig.rig_name}
                              </h3>
                              <p className="text-xs text-slate-400 mt-1">
                                {rig.cpu?.brand} {rig.cpu?.model} • {rig.gpu?.brand} {rig.gpu?.model}
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {rig.ram?.model} • {rig.storage?.model}
                              </p>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleLoadSavedRig(rig, false)}
                              className="flex-1 py-2 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/35 text-cyan-300 text-xs font-bold"
                            >
                              Test Games &amp; Apps
                            </button>
                            <button
                              type="button"
                              onClick={() => handleLoadSavedRig(rig, true)}
                              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1"
                            >
                              <Pencil className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSavedRig(rig)}
                              className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              aria-label="Delete rig"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {snapshots.length > 0 && (
                  <div className="rounded-2xl bg-[#0e1525] border border-slate-800 p-6 space-y-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <History className="w-4 h-4 text-cyan-400" />
                      Session Snapshots ({snapshots.length})
                    </h3>
                    <div className="space-y-2">
                      {snapshots.map(s => (
                        <div key={s.id} className="p-3 rounded-xl bg-[#070b14] border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="font-bold text-white">{s.cpu} + {s.gpu} ({s.ram})</span>
                          <div className="flex items-center gap-3 font-mono">
                            <span className="text-cyan-300">Score: {s.score}</span>
                            <span className="text-emerald-400">{s.recCount} Rec</span>
                            <span className="text-slate-500">{s.timestamp}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===============================================================
                TAB 4: PUBLIC PROFILE (Synced with Supabase profiles.is_public)
               =============================================================== */}
            {activeNav === 'profile' && (
              <div className="rounded-2xl bg-[#0e1525] border border-slate-800 p-6 sm:p-8 space-y-6">
                {!isAuthenticated ? (
                  <div className="py-10 text-center space-y-3">
                    <p className="text-sm text-slate-300 font-semibold">
                      Sign in to manage your public RigCheck profile and share your saved rigs.
                    </p>
                    <Link
                      to="/login"
                      className="inline-block px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-extrabold text-xs"
                    >
                      Sign In
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
                      <div>
                        <h2 className="text-2xl font-extrabold text-white">
                          {profile?.display_name || user?.email?.split('@')[0]}
                        </h2>
                        <div className="text-xs font-mono text-cyan-400 mt-1">
                          @{profile?.handle || 'member'}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={privacyUpdating}
                          onClick={handleToggleProfilePrivacy}
                          className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                            profile?.is_public
                              ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                              : 'bg-slate-900 border-slate-700 text-slate-300'
                          }`}
                        >
                          {privacyUpdating ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : profile?.is_public ? (
                            <Globe className="w-3.5 h-3.5" />
                          ) : (
                            <Lock className="w-3.5 h-3.5" />
                          )}
                          Profile: {profile?.is_public ? 'Public' : 'Private'}
                        </button>

                        <button
                          type="button"
                          onClick={handleCopyPublicUrl}
                          className="px-4 py-2 rounded-xl bg-[#070b14] border border-slate-700 text-xs font-mono text-slate-200 flex items-center gap-1.5"
                        >
                          {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                          Copy Profile URL
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Showcased Builds ({savedRigs.length})
                      </h3>
                      {savedRigs.length === 0 ? (
                        <p className="text-xs text-slate-500">
                          Save a rig in Spec Checker to display it on your profile.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {savedRigs.map(rig => (
                            <div key={rig.id} className="p-4 rounded-xl bg-[#070b14] border border-slate-800 flex items-center justify-between gap-3">
                              <div>
                                <div className="text-sm font-bold text-white">{rig.rig_name}</div>
                                <div className="text-xs text-slate-400 mt-0.5">
                                  {rig.cpu?.model} • {rig.gpu?.model}
                                </div>
                              </div>
                              <div className="text-lg font-black font-mono text-cyan-400">
                                {Number(rig.final_score).toFixed(1)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {toast && (
        <div role="status" aria-live="polite" className="fixed bottom-5 right-5 z-50 max-w-sm">
          <div
            className={`px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold flex items-center gap-2.5 backdrop-blur-md ${
              toast.tone === 'error'
                ? 'bg-rose-950/95 border-rose-500/50 text-rose-200'
                : toast.tone === 'info'
                ? 'bg-slate-900/95 border-cyan-500/50 text-cyan-200'
                : 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200'
            }`}
          >
            {toast.tone === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : toast.tone === 'info' ? (
              <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}