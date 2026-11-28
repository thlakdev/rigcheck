import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hardwareService } from '../services/hardwareService';
import ComponentSearchPicker, { formatPartSpecs } from '../components/ComponentSearchPicker';
import {
  evaluateCombinedBuild,
  compareHeadToHead
} from '../utils/scoringEngine';
import {
  Cpu,
  Laptop,
  Calculator,
  Sliders,
  Trophy,
  Scale,
  LogOut,
  Loader2,
  Bookmark
} from 'lucide-react';

export default function ScorerPage() {
  const { user, profile, isAuthenticated, loading: authLoading, logout } = useAuth();

  // Workspace Sub-Mode: 'parts' | 'laptops' | 'compare'
  const [scorerMode, setScorerMode] = useState('parts');

  const [allComponents, setAllComponents] = useState([]);
  const [laptops, setLaptops] = useState([]);
  const [savedRigs, setSavedRigs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Individual Parts Scorer Selection
  const [cpu, setCpu] = useState(null);
  const [gpu, setGpu] = useState(null);
  const [ram, setRam] = useState(null);
  const [storage, setStorage] = useState(null);

  // Side-by-Side Comparison Selection
  const [compareCat, setCompareCat] = useState('GPU'); // 'GPU' | 'CPU' | 'RAM' | 'STORAGE' | 'LAPTOP'
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
        const [compData, lapData] = await Promise.all([
          hardwareService.getAllComponents(),
          hardwareService.getScoredLaptops(),
        ]);
        if (!active) return;

        setAllComponents(compData);
        setLaptops(lapData);

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

  const combinedPartsResult = useMemo(() => {
    if (!cpu || !gpu || !ram || !storage) return null;
    return evaluateCombinedBuild({ cpu, gpu, ram, storage });
  }, [cpu, gpu, ram, storage]);

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
        a: { name: `${a.brand} ${a.model}`, sub: `${a.cpu_name} • ${a.gpu_name}`, score: Number(a.leaderboard_laptop_score), note: `Universal Game Score (0.85x): ${a.universal_laptop_score}` },
        b: { name: `${b.brand} ${b.model}`, sub: `${b.cpu_name} • ${b.gpu_name}`, score: Number(b.leaderboard_laptop_score), note: `Universal Game Score (0.85x): ${b.universal_laptop_score}` },
        stats: compareHeadToHead({ score: a.leaderboard_laptop_score }, { score: b.leaderboard_laptop_score }),
      };
    }

    if (!partA || !partB) return null;
    return {
      a: { name: `${partA.brand} ${partA.model}`, sub: formatPartSpecs(partA), score: Number(partA.universal_score), note: partA.is_mobile ? 'Mobile (0.85x applied)' : 'Desktop Baseline' },
      b: { name: `${partB.brand} ${partB.model}`, sub: formatPartSpecs(partB), score: Number(partB.universal_score), note: partB.is_mobile ? 'Mobile (0.85x applied)' : 'Desktop Baseline' },
      stats: compareHeadToHead({ score: partA.universal_score }, { score: partB.universal_score }),
    };
  }, [compareCat, laptops, lapAId, lapBId, partA, partB]);

  return (
    <div
      className="min-h-screen bg-[#070b14] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200"
      style={{
        backgroundImage:
          'linear-gradient(to right, rgba(30, 41, 59, 0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(30, 41, 59, 0.22) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }}
    >
      {/* Shared Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#0b0f19]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Cpu className="w-5 h-5 text-slate-950" />
              </div>
              <div>
                <div className="text-lg font-black tracking-tight text-white leading-none">
                  Rig<span className="text-cyan-400">Check</span>
                </div>
                <div className="text-[10px] font-semibold text-slate-400 tracking-widest uppercase">
                  Score Calculator
                </div>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1.5">
              <Link
                to="/"
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent flex items-center gap-1.5 transition-colors"
              >
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                Compatibility Checker
              </Link>
              <Link
                to="/scorer"
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/35 flex items-center gap-1.5"
              >
                <Calculator className="w-3.5 h-3.5" />
                Part &amp; Laptop Scorer
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

        <div className="md:hidden px-4 pb-2.5 flex items-center gap-2">
          <Link
            to="/"
            className="flex-1 py-1.5 rounded-lg text-center text-xs font-bold bg-[#111827] text-slate-300 border border-slate-800"
          >
            Compatibility Checker
          </Link>
          <Link
            to="/scorer"
            className="flex-1 py-1.5 rounded-lg text-center text-xs font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/35"
          >
            Part &amp; Laptop Scorer
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Sub-Tabs inside Scorer Page */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-4">
          {[
            { id: 'parts', label: 'Combined PC Parts Scorer', icon: Calculator },
            { id: 'laptops', label: `Saved & Database Laptops (${laptops.length})`, icon: Trophy },
            { id: 'compare', label: 'Compare Parts / Laptops', icon: Scale }
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
            {/* MODE 1: INDIVIDUAL PC PARTS COMBINED SCORER */}
            {scorerMode === 'parts' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-6 rounded-3xl bg-[#0e1525] border border-slate-800 p-6 space-y-4 overflow-visible">
                  <div>
                    <h1 className="text-lg font-extrabold text-white">Score Individual PC Parts Together</h1>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Pick any combination of parts from the database dropdowns to calculate their individual and combined scores.
                    </p>
                  </div>

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

                {combinedPartsResult && (
                  <div className="lg:col-span-6 space-y-5">
                    <div className="rounded-3xl bg-gradient-to-br from-[#111827] via-[#0f172a] to-[#0c1629] border border-slate-800 p-6 shadow-xl space-y-5">
                      <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                            Combined Formula Score
                          </span>
                          <div className="text-4xl font-black font-mono text-white mt-1">
                            {combinedPartsResult.finalScore}
                            <span className="text-sm font-normal text-slate-400"> / 100</span>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            combinedPartsResult.balance.status === 'balanced'
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {combinedPartsResult.balance.label}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {[
                          { title: 'GPU Score (Weight 40%)', part: gpu, score: combinedPartsResult.gpuScore, bar: 'bg-violet-400' },
                          { title: 'CPU Score (Weight 35%)', part: cpu, score: combinedPartsResult.cpuScore, bar: 'bg-cyan-400' },
                          { title: 'RAM Score (Weight 15%)', part: ram, score: combinedPartsResult.ramScore, bar: 'bg-emerald-400' },
                          { title: 'Storage Score (Weight 10%)', part: storage, score: combinedPartsResult.storageScore, bar: 'bg-sky-400' }
                        ].map(row => (
                          <div key={row.title} className="p-3.5 rounded-2xl bg-[#070b14] border border-slate-800 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-white">
                                {row.part?.brand} {row.part?.model}
                              </span>
                              <span className="font-mono font-black text-cyan-300">{row.score}</span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${row.bar}`}
                                style={{ width: `${Math.min(100, row.score)}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span>{row.title}</span>
                              <span>{formatPartSpecs(row.part)}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <p className="text-xs text-slate-400">{combinedPartsResult.balance.note}</p>
                    </div>
                  </div>
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