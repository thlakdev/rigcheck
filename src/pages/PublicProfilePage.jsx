import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { hardwareService } from '../services/hardwareService';
import { Cpu, ArrowLeft, Globe, Lock, Loader2, Monitor, HardDrive } from 'lucide-react';

export default function PublicProfilePage() {
  const { handle } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    hardwareService
      .getPublicProfileByHandle(handle)
      .then(res => {
        if (active) setData(res);
      })
      .catch(err => {
        if (active) setError(err?.message || 'Unable to load profile.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [handle]);

  return (
    <div
      className="min-h-screen bg-[#070b14] text-slate-100 font-sans"
      style={{
        backgroundImage:
          'linear-gradient(to right, rgba(30, 41, 59, 0.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(30, 41, 59, 0.16) 1px, transparent 1px)',
        backgroundSize: '42px 42px'
      }}
    >
      <header className="border-b border-slate-800/80 bg-[#090d18]/95 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-slate-950" />
            </div>
            <span className="text-base font-black text-white">
              Rig<span className="text-cyan-400">Check</span>
            </span>
          </Link>

          <Link
            to="/"
            className="px-3.5 py-2 rounded-xl bg-[#0e1525] hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Spec Checker
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin text-cyan-400" />
            <span className="text-xs font-semibold uppercase">Loading @{handle}...</span>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-sm">
            {error}
          </div>
        ) : !data ? (
          <div className="p-10 rounded-3xl bg-[#0e1525] border border-slate-800 text-center space-y-3">
            <Lock className="w-8 h-8 text-slate-500 mx-auto" />
            <h1 className="text-xl font-extrabold text-white">Profile Unavailable</h1>
            <p className="text-xs text-slate-400">
              @{handle} does not exist or is set to Private.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-3xl bg-gradient-to-br from-[#111827] via-[#0f172a] to-[#0c1629] border border-slate-800 p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 mb-2">
                  <Globe className="w-3 h-3" /> Public Builder Profile
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {data.profile.display_name}
                </h1>
                <p className="text-xs font-mono text-cyan-400 mt-1">@{data.profile.handle}</p>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-slate-500">Public Builds</div>
                <div className="text-3xl font-black font-mono text-white">{data.rigs.length}</div>
              </div>
            </div>

            {data.rigs.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#0e1525] border border-slate-800 text-center text-xs text-slate-400">
                No public builds showcased yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.rigs.map(rig => (
                  <div key={rig.id} className="p-5 rounded-2xl bg-[#0e1525] border border-slate-800 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                          {rig.rig_type}
                        </span>
                        <h2 className="text-base font-extrabold text-white mt-1.5">{rig.rig_name}</h2>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] uppercase text-slate-500 font-bold">Rig Score</div>
                        <div className="text-2xl font-black font-mono text-cyan-400">
                          {Number(rig.final_score).toFixed(1)}
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#070b14] border border-slate-800 space-y-1.5 text-xs text-slate-300">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>{rig.cpu?.brand} {rig.cpu?.model}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Monitor className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                        <span>{rig.gpu?.brand} {rig.gpu?.model}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <HardDrive className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{rig.ram?.model} • {rig.storage?.model}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}