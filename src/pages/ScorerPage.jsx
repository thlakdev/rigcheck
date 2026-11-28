import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hardwareService } from '../services/hardwareService';
import ComponentSearchPicker, { formatPartSpecs } from '../components/ComponentSearchPicker';
import {
  computeUniversalGpuScore,
  computeUniversalCpuScore,
  computeRamScore,
  computeStorageScore,
  computeStandaloneMobileGpuScore,
  computeStandaloneMobileCpuScore,
  evaluateCombinedBuild,
  evaluateSoftwareTarget,
  compareHeadToHead
} from '../utils/scoringEngine';
import {
  Cpu,
  Calculator,
  Sliders,
  Trophy,
  Scale,
  LogOut,
  Loader2,
  Bookmark,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Search,
  Wrench,
  Database
} from 'lucide-react';

function getSoftwareTargetScore(sw, tier = 'rec') {
  const cpu = Number(tier === 'min' ? sw.min_cpu_score : sw.rec_cpu_score);
  const gpu = Number(tier === 'min' ? sw.min_gpu_score : sw.rec_gpu_score);
  const ram = Number(tier === 'min' ? sw.min_ram_score : sw.rec_ram_score);
  const storage = Number(tier === 'min' ? sw.min_storage_score : sw.rec_storage_score);
  return Number((0.40 * gpu + 0.35 * cpu + 0.15 * ram + 0.10 * storage).toFixed(1));
}

export default function ScorerPage() {
  const { user, profile, isAuthenticated, loading: authLoading, logout } = useAuth();

  // Workspace Sub-Mode: 'parts' | 'laptops' | 'compare'
  const [scorerMode, setScorerMode] = useState('parts');
  // Input Mode inside 'parts': 'database' | 'custom'
  const [inputSource, setInputSource] = useState('database');

  const [allComponents, setAllComponents] = useState([]);
  const [laptops, setLaptops] = useState([]);
  const [softwareTitles, setSoftwareTitles] = useState([]);
  const [savedRigs, setSavedRigs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Database Picker Selection
  const [cpu, setCpu] = useState(null);
  const [gpu, setGpu] = useState(null);
  const [ram, setRam] = useState(null);
  const [storage, setStorage] = useState(null);

  // Manual Custom Raw Hardware Spec Inputs (Formulas 1–7)
  const [customIsMobile, setCustomIsMobile] = useState(false);
  const [customGpu, setCustomGpu] = useState({
    shader_cores: 5888,
    vram_gb: 12,
    bandwidth_gbs: 504,
    boost_clock_mhz: 2475
  });
  const [customCpu, setCustomCpu] = useState({
    cores: 8,
    threads: 16,
    cache_mb: 96,
    boost_clock_ghz: 5.0
  });
  const [customRam, setCustomRam] = useState({
    capacity_gb: 32,
    speed_mhz: 6000
  });
  const [customStorage, setCustomStorage] = useState({
    read_mbs: 7000,
    write_mbs: 6000
  });

  // Software Comparison Filter
  const [swQuery, setSwQuery] = useState('');
  const [swCat, setSwCat] = useState('All');

  // Side-by-Side Comparison Selection
  const [compareCat, setCompareCat] = useState('GPU');
  const [partA, setPartA] = useState(null);
  const [partB, setPartB] = useState(null);
  const [lapAId, setLapAId] = useState('');
  const [lapBId, setLapBId] = useState('');

  const cpuOptions = useMemo(() => allComponents.filter(c => c.category === 'CPU'), [allComponents]);
  const gpuOptions = useMemo(() => allComponents.filter(c => c.category === 'GPU'), [allComponents]);
  const ramOptions = useMemo(() => allComponents.filter(c => c.category === 'RAM'), [allComponents]);
  const storageOptions = useMemo(() => allComponents.filter(c => c.category === 'STORAGE'), [allComponents]);

  const savedLaptopRigs = useMemo(
    () => savedRigs.filter(r => r.rig_type === 'Laptop'),
    [savedRigs]
  );

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const [compData, lapData, swData] = await Promise.all([
          hardwareService.getAllComponents(),
          hardwareService.getScoredLaptops(),
          hardwareService.getSoftwareTitles()
        ]);
        if (!active) return;

        setAllComponents(compData);
        setLaptops(lapData);
        setSoftwareTitles(swData);

        const cpus = compData.filter(c => c.category === 'CPU');
        const gpus = compData.filter(c => c.category === 'GPU');
        const rams = compData.filter(c => c.category === 'RAM');
        const storages = compData.filter(c => c.category === 'STORAGE');

        if (cpus[0]) setCpu(cpus[0]);
        if (gpus[0]) setGpu(gpus[0]);
        if (rams[0]) setRam(rams[0]);
        if (storages[0]) setStorage(storages[0]);

        if (gpus.length >= 2) {
          setPartA(gpus[0]);
          setPartB(gpus[1]);
        }
        if (lapData.length >= 2) {
          setLapAId(lapData[0].id);
          setLapBId(lapData[1].id);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

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

  // Active Evaluation (Switches seamlessly between Database Parts & Manual Custom Specs)
  const activeScoreSummary = useMemo(() => {
    if (inputSource === 'custom') {
      const gpuScore = computeUniversalGpuScore({ ...customGpu, is_mobile: customIsMobile });
      const cpuScore = computeUniversalCpuScore({ ...customCpu, is_mobile: customIsMobile });
      const ramScore = computeRamScore(customRam);
      const storageScore = computeStorageScore(customStorage);

      const mobileGpuRank = customIsMobile ? computeStandaloneMobileGpuScore(customGpu) : null;
      const mobileCpuRank = customIsMobile ? computeStandaloneMobileCpuScore(customCpu) : null;

      const combined = evaluateCombinedBuild({
        cpu: { universal_score: cpuScore, is_mobile: customIsMobile },
        gpu: { universal_score: gpuScore, is_mobile: customIsMobile },
        ram: { universal_score: ramScore },
        storage: { universal_score: storageScore }
      });

      return {
        ...combined,
        vramGb: Number(customGpu.vram_gb) || 0,
        mobileGpuRank,
        mobileCpuRank,
        labels: {
          gpu: customIsMobile ? 'Custom Mobile GPU (0.85x)' : 'Custom Desktop GPU',
          cpu: customIsMobile ? 'Custom Mobile CPU (0.85x)' : 'Custom Desktop CPU',
          ram: `Custom ${customRam.capacity_gb}GB @ ${customRam.speed_mhz} MHz`,
          storage: `Custom ${customStorage.read_mbs}/${customStorage.write_mbs} MB/s`
        }
      };
    }

    if (!cpu || !gpu || !ram || !storage) return null;
    const combined = evaluateCombinedBuild({ cpu, gpu, ram, storage });
    return {
      ...combined,
      vramGb: Number(gpu.vram_gb) || 0,
      mobileGpuRank: gpu.is_mobile ? Number(gpu.mobile_rank_score) : null,
      mobileCpuRank: cpu.is_mobile ? Number(cpu.mobile_rank_score) : null,
      labels: {
        gpu: `${gpu.brand} ${gpu.model}`,
        cpu: `${cpu.brand} ${cpu.model}`,
        ram: `${ram.brand} ${ram.model}`,
        storage: `${storage.brand} ${storage.model}`
      }
    };
  }, [inputSource, customIsMobile, customGpu, customCpu, customRam, customStorage, cpu, gpu, ram, storage]);

  // Compare Active Scorer Output Against Database Games & Software
  const swCategories = useMemo(
    () => ['All', ...Array.from(new Set(softwareTitles.map(s => s.category)))],
    [softwareTitles]
  );

  const comparedSoftware = useMemo(() => {
    if (!activeScoreSummary) return [];
    const q = swQuery.trim().toLowerCase();
    return softwareTitles
      .filter(sw => {
        const matchCat = swCat === 'All' || sw.category === swCat;
        const matchQ = !q || `${sw.name} ${sw.category}`.toLowerCase().includes(q);
        return matchCat && matchQ;
      })
      .map(sw => ({
        ...sw,
        minTarget: getSoftwareTargetScore(sw, 'min'),
        recTarget: getSoftwareTargetScore(sw, 'rec'),
        check: evaluateSoftwareTarget(
          {
            cpuScore: activeScoreSummary.cpuScore,
            gpuScore: activeScoreSummary.gpuScore,
            ramScore: activeScoreSummary.ramScore,
            storageScore: activeScoreSummary.storageScore,
            vramGb: activeScoreSummary.vramGb
          },
          sw
        )
      }));
  }, [activeScoreSummary, softwareTitles, swQuery, swCat]);

  const handleChangeCompareCat = nextCat => {
    setCompareCat(nextCat);
    if (nextCat === 'LAPTOP') return;
    const list = allComponents.filter(c => c.category === nextCat);
    setPartA(list[0] || null);
    setPartB(list[1] || list[0] || null);
  };

  const compareOutput = useMemo(() => {
    if (compareCat === 'LAPTOP') {
      const a = laptops.find(l => l.id === lapAId);
      const b = laptops.find(l => l.id === lapBId);
      if (!a || !b) return null;
      return {
        a: {
          name: `${a.brand} ${a.model}`,
          score: Number(a.leaderboard_laptop_score),
          note: `Universal Game Score (0.85x): ${a.universal_laptop_score}`
        },
        b: {
          name: `${b.brand} ${b.model}`,
          score: Number(b.leaderboard_laptop_score),
          note: `Universal Game Score (0.85x): ${b.universal_laptop_score}`
        },
        stats: compareHeadToHead(
          { score: a.leaderboard_laptop_score },
          { score: b.leaderboard_laptop_score }
        )
      };
    }

    if (!partA || !partB) return null;
    return {
      a: {
        name: `${partA.brand} ${partA.model}`,
        score: Number(partA.universal_score),
        note: partA.is_mobile ? 'Mobile (0.85x applied)' : 'Desktop Baseline'
      },
      b: {
        name: `${partB.brand} ${partB.model}`,
        score: Number(partB.universal_score),
        note: partB.is_mobile ? 'Mobile (0.85x applied)' : 'Desktop Baseline'
      },
      stats: compareHeadToHead(
        { score: partA.universal_score },
        { score: partB.universal_score }
      )
    };
  }, [compareCat, laptops, lapAId, lapBId, partA, partB]);

  return (
    <div
      className="min-h-screen bg-[#070b14] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200"
      style={{
        backgroundImage:
          'linear-gradient(to right, rgba(30, 41, 59, 0.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(30, 41, 59, 0.16) 1px, transparent 1px)',
        backgroundSize: '42px 42px'
      }}
    >
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#090d18]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Cpu className="w-5 h-5 text-slate-950" />
              </div>
              <div>
                <div className="text-base font-black tracking-tight text-white leading-none">
                  Rig<span className="text-cyan-400">Check</span>
                </div>
                <div className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">
                  SCORE CALCULATOR
                </div>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1.5">
              <Link
                to="/"
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent flex items-center gap-1.5 transition-colors"
              >
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                Spec Checker
              </Link>
              <Link
                to="/scorer"
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/35 flex items-center gap-1.5"
              >
                <Calculator className="w-3.5 h-3.5" />
                Parts &amp; Laptop Scorer
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            {authLoading ? (
              <div className="h-8 w-24 animate-pulse rounded-xl bg-slate-800" />
            ) : isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-xl bg-[#111827] hover:bg-slate-800 border border-slate-800 text-xs font-mono text-cyan-300"
                >
                  @{profile?.handle || user?.email?.split('@')[0]}
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 text-xs font-extrabold"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Sub-Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-4">
          {[
            { id: 'parts', label: 'Parts & Custom Spec Scorer', icon: Calculator },
            { id: 'laptops', label: `Saved & Database Laptops (${laptops.length})`, icon: Trophy },
            { id: 'compare', label: 'Head-to-Head Compare', icon: Scale }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setScorerMode(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  scorerMode === tab.id
                    ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                    : 'bg-[#111827] text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            <span className="text-xs font-semibold uppercase tracking-wider">Loading formula database...</span>
          </div>
        ) : (
          <>
            {/* MODE 1: DATABASE PARTS OR CUSTOM RAW SPECS + SOFTWARE COMPARISON */}
            {scorerMode === 'parts' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Input Panel */}
                  <div className="lg:col-span-6 rounded-3xl bg-[#0e1525] border border-slate-800 p-6 space-y-5 overflow-visible">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h1 className="text-lg font-extrabold text-white">Score Parts &amp; Compare Software</h1>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Choose parts from Supabase or enter raw hardware specs manually.
                        </p>
                      </div>

                      <div className="flex p-1 rounded-xl bg-[#070b14] border border-slate-800 text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => setInputSource('database')}
                          className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                            inputSource === 'database'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Database className="w-3.5 h-3.5" />
                          Database
                        </button>
                        <button
                          type="button"
                          onClick={() => setInputSource('custom')}
                          className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                            inputSource === 'custom'
                              ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          Custom Specs
                        </button>
                      </div>
                    </div>

                    {inputSource === 'database' ? (
                      <div className="space-y-4 overflow-visible">
                        <ComponentSearchPicker
                          label="Processor (CPU)"
                          options={cpuOptions}
                          selectedPart={cpu}
                          onSelectPart={setCpu}
                        />
                        <ComponentSearchPicker
                          label="Graphics Card (GPU)"
                          options={gpuOptions}
                          selectedPart={gpu}
                          onSelectPart={setGpu}
                        />
                        <ComponentSearchPicker
                          label="System Memory (RAM)"
                          options={ramOptions}
                          selectedPart={ram}
                          onSelectPart={setRam}
                        />
                        <ComponentSearchPicker
                          label="Storage Drive"
                          options={storageOptions}
                          selectedPart={storage}
                          onSelectPart={setStorage}
                        />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Desktop vs Laptop 0.85x Switch */}
                        <div className="p-3 rounded-xl bg-[#070b14] border border-slate-800 flex items-center justify-between gap-3">
                          <div>
                            <div className="text-xs font-bold text-white">Hardware Form Factor</div>
                            <div className="text-[11px] text-slate-400">
                              Laptop mode applies the 0.85x thermal multiplier to CPU &amp; GPU scores.
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCustomIsMobile(prev => !prev)}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                              customIsMobile
                                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                                : 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                            }`}
                          >
                            {customIsMobile ? 'Laptop (0.85x)' : 'Desktop (1.0x)'}
                          </button>
                        </div>

                        {/* Custom GPU Inputs */}
                        <div className="p-4 rounded-2xl bg-[#070b14] border border-slate-800 space-y-2.5">
                          <div className="text-xs font-bold uppercase tracking-wider text-violet-300">
                            GPU Raw Specs (Formula 1)
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {[
                              { key: 'shader_cores', label: 'Shader Cores' },
                              { key: 'vram_gb', label: 'VRAM (GB)' },
                              { key: 'bandwidth_gbs', label: 'BW (GB/s)' },
                              { key: 'boost_clock_mhz', label: 'Clock (MHz)' }
                            ].map(f => (
                              <label key={f.key} className="block">
                                <span className="text-[10px] text-slate-400 font-semibold">{f.label}</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={customGpu[f.key]}
                                  onChange={e =>
                                    setCustomGpu(prev => ({ ...prev, [f.key]: Number(e.target.value) || 0 }))
                                  }
                                  className="mt-1 w-full px-2.5 py-1.5 rounded-lg bg-[#0e1525] border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                                />
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Custom CPU Inputs */}
                        <div className="p-4 rounded-2xl bg-[#070b14] border border-slate-800 space-y-2.5">
                          <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                            CPU Raw Specs (Formula 2)
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {[
                              { key: 'cores', label: 'Cores' },
                              { key: 'threads', label: 'Threads' },
                              { key: 'cache_mb', label: 'Cache (MB)' },
                              { key: 'boost_clock_ghz', label: 'Clock (GHz)' }
                            ].map(f => (
                              <label key={f.key} className="block">
                                <span className="text-[10px] text-slate-400 font-semibold">{f.label}</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={customCpu[f.key]}
                                  onChange={e =>
                                    setCustomCpu(prev => ({ ...prev, [f.key]: Number(e.target.value) || 0 }))
                                  }
                                  className="mt-1 w-full px-2.5 py-1.5 rounded-lg bg-[#0e1525] border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                                />
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Custom RAM & Storage Inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="p-4 rounded-2xl bg-[#070b14] border border-slate-800 space-y-2.5">
                            <div className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                              RAM (Formula 3)
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <label className="block">
                                <span className="text-[10px] text-slate-400 font-semibold">Capacity (GB)</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={customRam.capacity_gb}
                                  onChange={e =>
                                    setCustomRam(prev => ({ ...prev, capacity_gb: Number(e.target.value) || 0 }))
                                  }
                                  className="mt-1 w-full px-2.5 py-1.5 rounded-lg bg-[#0e1525] border border-slate-700 text-xs text-white font-mono"
                                />
                              </label>
                              <label className="block">
                                <span className="text-[10px] text-slate-400 font-semibold">Speed (MHz)</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={customRam.speed_mhz}
                                  onChange={e =>
                                    setCustomRam(prev => ({ ...prev, speed_mhz: Number(e.target.value) || 0 }))
                                  }
                                  className="mt-1 w-full px-2.5 py-1.5 rounded-lg bg-[#0e1525] border border-slate-700 text-xs text-white font-mono"
                                />
                              </label>
                            </div>
                          </div>

                          <div className="p-4 rounded-2xl bg-[#070b14] border border-slate-800 space-y-2.5">
                            <div className="text-xs font-bold uppercase tracking-wider text-sky-300">
                              Storage (Formula 4)
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <label className="block">
                                <span className="text-[10px] text-slate-400 font-semibold">Read (MB/s)</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={customStorage.read_mbs}
                                  onChange={e =>
                                    setCustomStorage(prev => ({ ...prev, read_mbs: Number(e.target.value) || 0 }))
                                  }
                                  className="mt-1 w-full px-2.5 py-1.5 rounded-lg bg-[#0e1525] border border-slate-700 text-xs text-white font-mono"
                                />
                              </label>
                              <label className="block">
                                <span className="text-[10px] text-slate-400 font-semibold">Write (MB/s)</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={customStorage.write_mbs}
                                  onChange={e =>
                                    setCustomStorage(prev => ({ ...prev, write_mbs: Number(e.target.value) || 0 }))
                                  }
                                  className="mt-1 w-full px-2.5 py-1.5 rounded-lg bg-[#0e1525] border border-slate-700 text-xs text-white font-mono"
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Formula Score Breakdown */}
                  {activeScoreSummary && (
                    <div className="lg:col-span-6 rounded-3xl bg-gradient-to-br from-[#111827] via-[#0f172a] to-[#0c1629] border border-slate-800 p-6 shadow-xl space-y-5">
                      <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                            Combined Formula Score
                          </span>
                          <div className="text-4xl font-black font-mono text-white mt-1">
                            {activeScoreSummary.finalScore}
                            <span className="text-sm font-normal text-slate-400"> / 100</span>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            activeScoreSummary.balance.status === 'balanced'
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {activeScoreSummary.balance.label}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {[
                          { title: 'GPU Score (Weight 40%)', name: activeScoreSummary.labels.gpu, score: activeScoreSummary.gpuScore, bar: 'bg-violet-400', mobileRank: activeScoreSummary.mobileGpuRank },
                          { title: 'CPU Score (Weight 35%)', name: activeScoreSummary.labels.cpu, score: activeScoreSummary.cpuScore, bar: 'bg-cyan-400', mobileRank: activeScoreSummary.mobileCpuRank },
                          { title: 'RAM Score (Weight 15%)', name: activeScoreSummary.labels.ram, score: activeScoreSummary.ramScore, bar: 'bg-emerald-400', mobileRank: null },
                          { title: 'Storage Score (Weight 10%)', name: activeScoreSummary.labels.storage, score: activeScoreSummary.storageScore, bar: 'bg-sky-400', mobileRank: null }
                        ].map(row => (
                          <div key={row.title} className="p-3.5 rounded-2xl bg-[#070b14] border border-slate-800 space-y-2">
                            <div className="flex items-center justify-between text-xs gap-2">
                              <span className="font-bold text-white truncate">{row.name}</span>
                              <span className="font-mono font-black text-cyan-300 shrink-0">{row.score}</span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${row.bar}`}
                                style={{ width: `${Math.min(100, row.score)}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span>{row.title}</span>
                              {row.mobileRank !== null && (
                                <span className="font-mono text-amber-300">
                                  Standalone Mobile Rank: {row.mobileRank}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <p className="text-xs text-slate-400">{activeScoreSummary.balance.note}</p>
                    </div>
                  )}
                </div>

                {/* Software & Game Comparison Against the Calculated Custom/DB Score */}
                {activeScoreSummary && (
                  <section className="rounded-3xl bg-[#0e1525] border border-slate-800 p-6 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <h2 className="text-base font-extrabold text-white">
                          Compare This Score Against Database Games &amp; Software ({comparedSoftware.length})
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Live pass/fail verdicts using your calculated CPU ({activeScoreSummary.cpuScore}), GPU ({activeScoreSummary.gpuScore}), VRAM ({activeScoreSummary.vramGb}GB), RAM ({activeScoreSummary.ramScore}), and Storage ({activeScoreSummary.storageScore}) scores.
                        </p>
                      </div>

                      <div className="relative w-full md:w-64">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={swQuery}
                          onChange={e => setSwQuery(e.target.value)}
                          placeholder="Search games or apps..."
                          className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#070b14] border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {swCategories.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSwCat(cat)}
                          className={`px-3 py-1 rounded-lg text-[11px] font-bold ${
                            swCat === cat
                              ? 'bg-cyan-500 text-slate-950'
                              : 'bg-[#070b14] text-slate-400 hover:text-white border border-slate-800'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {comparedSoftware.map(sw => (
                        <div key={sw.id} className="p-4 rounded-2xl bg-[#070b14] border border-slate-800 space-y-2.5">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-extrabold text-white flex items-center gap-2">
                                <span>{sw.name}</span>
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                                  {sw.category}
                                </span>
                              </div>
                              <p
                                className={`text-xs mt-1 ${
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

                          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
                            <span>
                              Your Score: <strong className="text-cyan-300">{activeScoreSummary.finalScore}</strong>
                            </span>
                            <span>
                              Min Target: <strong className="text-slate-200">{sw.minTarget}</strong>
                            </span>
                            <span>
                              Rec Target: <strong className="text-emerald-300">{sw.recTarget}</strong>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* MODE 2: SAVED LAPTOPS & DATABASE LAPTOP LEADERBOARD */}
            {scorerMode === 'laptops' && (
              <div className="space-y-6">
                {savedLaptopRigs.length > 0 && (
                  <div className="rounded-3xl bg-[#0e1525] border border-cyan-500/30 p-6 space-y-3">
                    <h2 className="text-sm font-extrabold text-cyan-300 flex items-center gap-2">
                      <Bookmark className="w-4 h-4" />
                      Your Saved Laptop Rigs ({savedLaptopRigs.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {savedLaptopRigs.map(rig => (
                        <div key={rig.id} className="p-4 rounded-2xl bg-[#070b14] border border-slate-800 flex items-center justify-between gap-4">
                          <div>
                            <div className="text-sm font-extrabold text-white">{rig.rig_name}</div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {rig.cpu?.model} • {rig.gpu?.model} • {rig.ram?.model}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-[10px] uppercase text-slate-500 font-bold">Saved Score</div>
                            <div className="text-xl font-black font-mono text-emerald-400">{rig.final_score}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {laptops.map((lap, idx) => (
                    <div key={lap.id} className="rounded-3xl bg-[#0e1525] border border-slate-800 p-6 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                              #{idx + 1}
                            </span>
                            <span className="text-[11px] font-bold uppercase text-slate-400">{lap.category}</span>
                          </div>
                          <h3 className="text-lg font-extrabold text-white mt-1.5">
                            {lap.brand} {lap.model}
                          </h3>
                        </div>

                        <div className="text-right">
                          <div className="text-[10px] uppercase text-slate-400 font-bold">Mobile Rank</div>
                          <div className="text-2xl font-black font-mono text-cyan-400">
                            {lap.leaderboard_laptop_score}
                          </div>
                          <div className="text-[10px] font-mono text-amber-300">
                            Universal (0.85x): {lap.universal_laptop_score}
                          </div>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-[#070b14] border border-slate-800 space-y-1 text-xs text-slate-300">
                        <div>
                          <strong className="text-slate-400">CPU:</strong> {lap.cpu_name} (Mobile: {lap.cpu_mobile_score} | Univ: {lap.cpu_universal_score})
                        </div>
                        <div>
                          <strong className="text-slate-400">GPU:</strong> {lap.gpu_name} (Mobile: {lap.gpu_mobile_score} | Univ: {lap.gpu_universal_score})
                        </div>
                        <div>
                          <strong className="text-slate-400">RAM &amp; Storage:</strong> {lap.ram_name} ({lap.ram_score}) • {lap.storage_name} ({lap.storage_score})
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                        <span>{lap.display_spec}</span>
                        <span className="font-bold text-white">
                          {lap.price_inr > 0 ? `₹${lap.price_inr.toLocaleString('en-IN')}` : '—'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MODE 3: HEAD-TO-HEAD COMPARISON */}
            {scorerMode === 'compare' && (
              <div className="rounded-3xl bg-[#0e1525] border border-slate-800 p-6 sm:p-8 space-y-6 overflow-visible">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-white">Side-by-Side Part &amp; Laptop Comparison</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Compare any two database parts or two laptops directly using their stored formula scores.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5 p-1 rounded-2xl bg-[#070b14] border border-slate-800">
                    {['GPU', 'CPU', 'RAM', 'STORAGE', 'LAPTOP'].map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleChangeCompareCat(cat)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          compareCat === cat
                            ? 'bg-cyan-500 text-slate-950'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {compareCat === 'LAPTOP' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-[#070b14] border border-slate-800 space-y-2">
                      <label className="text-xs font-bold text-cyan-400 uppercase">Laptop A</label>
                      <select
                        value={lapAId}
                        onChange={e => setLapAId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e1525] border border-slate-700 text-sm text-white"
                      >
                        {laptops.map(l => (
                          <option key={l.id} value={l.id}>
                            {l.brand} {l.model} (Mobile Rank: {l.leaderboard_laptop_score})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="p-4 rounded-2xl bg-[#070b14] border border-slate-800 space-y-2">
                      <label className="text-xs font-bold text-violet-400 uppercase">Laptop B</label>
                      <select
                        value={lapBId}
                        onChange={e => setLapBId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e1525] border border-slate-700 text-sm text-white"
                      >
                        {laptops.map(l => (
                          <option key={l.id} value={l.id}>
                            {l.brand} {l.model} (Mobile Rank: {l.leaderboard_laptop_score})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-visible">
                    <div className="p-4 rounded-2xl bg-[#111827] border border-slate-800 overflow-visible">
                      <ComponentSearchPicker
                        label={`Contender A (${compareCat})`}
                        options={allComponents.filter(c => c.category === compareCat)}
                        selectedPart={partA}
                        onSelectPart={setPartA}
                      />
                    </div>
                    <div className="p-4 rounded-2xl bg-[#111827] border border-slate-800 overflow-visible">
                      <ComponentSearchPicker
                        label={`Contender B (${compareCat})`}
                        options={allComponents.filter(c => c.category === compareCat)}
                        selectedPart={partB}
                        onSelectPart={setPartB}
                      />
                    </div>
                  </div>
                )}

                {compareOutput && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div
                      className={`p-5 rounded-2xl border ${
                        compareOutput.stats.winner === 'A'
                          ? 'bg-emerald-500/10 border-emerald-500/40'
                          : 'bg-[#070b14] border-slate-800'
                      }`}
                    >
                      <div className="text-[11px] text-slate-400">{compareOutput.a.note}</div>
                      <div className="text-base font-extrabold text-white mt-1">{compareOutput.a.name}</div>
                      <div className="text-3xl font-black font-mono text-cyan-400 mt-2">{compareOutput.a.score}</div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#070b14] border border-slate-800 text-center space-y-1">
                      <div className="text-[11px] font-bold uppercase text-slate-500">Formula Verdict</div>
                      {compareOutput.stats.winner === 'tie' ? (
                        <div className="text-lg font-extrabold text-white">Tie (0% diff)</div>
                      ) : (
                        <>
                          <div className="text-2xl font-black text-emerald-400">
                            +{compareOutput.stats.pctDifference}% Higher
                          </div>
                          <div className="text-xs text-slate-300">
                            {compareOutput.stats.winner === 'A' ? compareOutput.a.name : compareOutput.b.name} leads by{' '}
                            {Math.abs(compareOutput.stats.scoreDiff)} pts
                          </div>
                        </>
                      )}
                    </div>

                    <div
                      className={`p-5 rounded-2xl border ${
                        compareOutput.stats.winner === 'B'
                          ? 'bg-emerald-500/10 border-emerald-500/40'
                          : 'bg-[#070b14] border-slate-800'
                      }`}
                    >
                      <div className="text-[11px] text-slate-400">{compareOutput.b.note}</div>
                      <div className="text-base font-extrabold text-white mt-1">{compareOutput.b.name}</div>
                      <div className="text-3xl font-black font-mono text-violet-400 mt-2">{compareOutput.b.score}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}