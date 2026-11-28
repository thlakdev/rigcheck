import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ChevronDown, CheckCircle2, X } from 'lucide-react';

export function formatPartSpecs(part) {
  if (!part) return '';
  if (part.category === 'GPU') {
    return `${part.shader_cores} Cores • ${part.vram_gb}GB VRAM • ${part.bandwidth_gbs} GB/s • ${part.boost_clock_mhz} MHz`;
  }
  if (part.category === 'CPU') {
    return `${part.cores}C/${part.threads}T • ${part.cache_mb}MB Cache • ${part.boost_clock_ghz} GHz`;
  }
  if (part.category === 'RAM') {
    return `${part.capacity_gb}GB • ${part.speed_mhz} MHz`;
  }
  if (part.category === 'STORAGE') {
    return `Read ${part.read_mbs} MB/s • Write ${part.write_mbs} MB/s`;
  }
  return '';
}

export default function ComponentSearchPicker({
  label,
  options = [],
  selectedPart,
  onSelectPart,
  scoreField = 'universal_score', // 'universal_score' | 'mobile_rank_score'
  placeholder = 'Click or type to search database...'
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = e => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Matches across combined brand + model + tier (so "AMD Ryzen 7" or "RTX 4060" always works)
  const filteredOptions = useMemo(() => {
    const clean = query.trim().toLowerCase();
    if (!clean) return options;

    const tokens = clean.split(/\s+/);
    return options.filter(item => {
      const searchable = `${item.brand} ${item.model} ${item.tier} ${item.is_mobile ? 'laptop mobile' : 'desktop'}`.toLowerCase();
      return tokens.every(token => searchable.includes(token));
    });
  }, [options, query]);

  const handleChoose = part => {
    onSelectPart(part);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
          {label}
        </label>
        {selectedPart && (
          <span className="text-[11px] font-mono font-bold text-cyan-400">
            Score: {Number(selectedPart[scoreField] ?? 0).toFixed(2)}
          </span>
        )}
      </div>

      {/* Input + Dropdown Toggle Button */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onClick={() => setIsOpen(true)}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder={
            selectedPart
              ? `${selectedPart.brand} ${selectedPart.model} (type to change)`
              : placeholder
          }
          className="w-full pl-10 pr-16 py-2.5 rounded-xl bg-[#070b14] border border-slate-700 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <button
              type="button"
              onMouseDown={e => {
                e.preventDefault();
                setQuery('');
              }}
              className="p-1 text-slate-400 hover:text-white"
              aria-label="Clear filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onMouseDown={e => {
              e.preventDefault();
              setIsOpen(prev => !prev);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800/80 transition-colors"
            aria-label="Toggle component dropdown"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180 text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Active Selected Part Pill */}
      {selectedPart && (
        <div className="p-2.5 rounded-xl bg-[#070b14]/90 border border-slate-800 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">
                {selectedPart.brand} {selectedPart.model}
              </span>
              {selectedPart.is_mobile && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
                  Mobile 0.85x
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 truncate mt-0.5">
              {formatPartSpecs(selectedPart)}
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-xs font-black font-mono text-cyan-300 shrink-0">
            {Number(selectedPart[scoreField] ?? 0).toFixed(2)}
          </span>
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded-2xl bg-[#0c1322] border border-cyan-500/40 shadow-2xl shadow-black/80 divide-y divide-slate-800/80">
          {filteredOptions.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              No database components match &ldquo;{query}&rdquo;.
            </div>
          ) : (
            filteredOptions.map(item => {
              const isSelected = selectedPart?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onMouseDown={e => {
                    e.preventDefault();
                    handleChoose(item);
                  }}
                  className={`w-full px-3.5 py-2.5 text-left hover:bg-slate-800/90 transition-colors flex items-center justify-between gap-3 ${
                    isSelected ? 'bg-cyan-500/15' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                      <span>
                        {item.brand} {item.model}
                      </span>
                      {item.is_mobile && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 shrink-0">
                          Mobile
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {formatPartSpecs(item)}
                    </div>
                  </div>
                  <span className="text-xs font-black font-mono text-cyan-300 bg-[#070b14] px-2 py-1 rounded border border-slate-800 shrink-0">
                    {Number(item[scoreField] ?? 0).toFixed(2)}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}