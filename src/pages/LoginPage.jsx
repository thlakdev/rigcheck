import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Cpu,
  Monitor,
  Shield,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Mail,
  KeyRound,
  User,
  AtSign,
  Check,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  LogOut,
  Gamepad2,
  Zap,
  Globe,
  Server,
  Database,
  Fingerprint,
  Smartphone,
  Terminal,
  X,
  ChevronRight,
  Loader2,
  Sliders,
  Star,
  Laptop,
  Code2,
  Info,
  Copy
} from 'lucide-react';

// ============================================================================
// 1. SAMPLE LIVE SHOWCASE RIG DATA (Left Panel Interactive Hardware Preview)
// ============================================================================
const SHOWCASE_BUILDS = [
  {
    id: 'enthusiast-1440p',
    label: 'Primary Desktop',
    tier: '1440p Enthusiast',
    score: 862,
    cpu: 'AMD Ryzen 7 7800X3D',
    cpuScore: 915,
    gpu: 'NVIDIA RTX 4070 Super (12GB)',
    gpuScore: 810,
    ram: '32GB DDR5-6000',
    storage: '2TB NVMe Gen4 SSD',
    balance: { label: 'Well-Balanced', note: 'Optimal CPU/GPU pairing for 1440p high-refresh' },
    titles: [
      { name: 'Cyberpunk 2077', category: 'AAA RPG', status: 'recommended', note: '1440p Ultra • 95+ FPS' },
      { name: 'Alan Wake 2', category: 'Next-Gen', status: 'recommended', note: '1440p High + DLSS' },
      { name: 'Unreal Engine 5', category: 'Creative 3D', status: 'minimum', note: 'Bottleneck: 64GB RAM recommended for huge scenes' }
    ]
  },
  {
    id: 'college-laptop',
    label: 'College Ultrabook',
    tier: 'Portable Creator',
    score: 545,
    cpu: 'AMD Ryzen 7 8840U',
    cpuScore: 635,
    gpu: 'Radeon 780M Integrated (4GB)',
    gpuScore: 215,
    ram: '16GB LPDDR5X',
    storage: '512GB NVMe SSD',
    balance: { label: 'GPU-Bound', note: 'Strong productivity CPU; integrated graphics limits AAA' },
    titles: [
      { name: 'Valorant', category: 'Esports', status: 'recommended', note: '1080p High • 160+ FPS' },
      { name: 'Adobe Photoshop', category: 'Creative', status: 'recommended', note: 'Smooth multi-layer canvas' },
      { name: 'Black Myth: Wukong', category: 'AAA Action', status: 'cannot_run', note: 'Bottleneck: Requires 6GB VRAM (4GB installed)' }
    ]
  }
];

// ============================================================================
// 2. INLINE BRAND SVGS (Google, GitHub, Discord)
// ============================================================================
function GoogleIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
      />
    </svg>
  );
}

function GitHubIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2c-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.17 1.18a11.02 11.02 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.77.11 3.06.74.8 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}

function DiscordIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#818CF8" aria-hidden="true">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

// ============================================================================
// 3. PASSWORD STRENGTH ANALYZER
// ============================================================================
function evaluatePassword(pw) {
  const checks = {
    length: pw.length >= 8,
    uppercase: /[A-Z]/.test(pw),
    number: /[0-9]/.test(pw),
    symbol: /[^A-Za-z0-9]/.test(pw)
  };
  const passedCount = Object.values(checks).filter(Boolean).length;
  const levels = [
    { label: 'Enter password', color: 'bg-slate-700', text: 'text-slate-500' },
    { label: 'Weak', color: 'bg-rose-500', text: 'text-rose-400' },
    { label: 'Fair', color: 'bg-amber-500', text: 'text-amber-400' },
    { label: 'Good', color: 'bg-cyan-400', text: 'text-cyan-400' },
    { label: 'Strong', color: 'bg-emerald-400', text: 'text-emerald-400' }
  ];
  return { checks, passedCount, meta: levels[pw.length === 0 ? 0 : passedCount] };
}

// ============================================================================
// 4. SUB-COMPONENT: BACKEND & AUTH ARCHITECTURE SLIDE-OVER DRAWER
// ============================================================================
function AuthArchitectureDrawer({ open, onClose }) {
  const [activeCodeTab, setActiveCodeTab] = useState('adapter'); // 'adapter' | 'prisma' | 'roadmap'

  useEffect(() => {
    if (!open) return;
    const onKeyDown = e => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm">
      <div className="flex-1" onClick={onClose} aria-hidden="true" />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Backend and Auth Architecture Blueprint"
        className="w-full max-w-2xl bg-[#0c1220] border-l border-slate-800 h-full overflow-y-auto shadow-2xl flex flex-col"
      >
        <div className="sticky top-0 z-10 bg-[#0c1220]/95 backdrop-blur-md px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
              <Server className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Backend & Auth Architecture Blueprint</h2>
              <p className="text-xs text-slate-400">
                Supabase Auth + PostgreSQL RLS • Modular Service Layer
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            aria-label="Close Architecture Blueprint"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pt-4 flex flex-wrap gap-2 border-b border-slate-800/80 pb-3">
          {[
            { id: 'adapter', label: 'Service Layer', icon: Code2 },
            { id: 'prisma', label: 'PostgreSQL / Prisma', icon: Database },
            { id: 'roadmap', label: 'Expansion Roadmap', icon: Zap }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCodeTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeCodeTab === tab.id
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40'
                    : 'bg-[#111827] text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6 space-y-5 flex-1 text-sm">
          {activeCodeTab === 'adapter' && (
            <>
              <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-xs text-cyan-100 leading-relaxed">
                <strong className="text-cyan-300">Decoupled Auth Layer:</strong> All login, registration, password reset, and profile visibility controls go through <code className="text-cyan-300 font-mono">AuthContext</code> and <code className="text-cyan-300 font-mono">src/services/authService.js</code> backed by Supabase PKCE auth.
              </div>

              <div className="rounded-xl bg-[#070b14] border border-slate-800 overflow-hidden">
                <div className="px-4 py-2 border-b border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                  <span>src/services/authService.js</span>
                  <span className="text-emerald-400">Active Phase 2</span>
                </div>
                <pre className="p-4 text-[11px] leading-relaxed font-mono text-slate-300 overflow-x-auto">
{`export interface AuthServiceContract {
  register({ email, password, displayName, handle, isPublic }): Promise<AuthData>;
  login({ email, password }): Promise<AuthData>;
  logout(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  getProfile(userId: string): Promise<PublicProfile>;
  updatePrivacy(userId: string, isPublic: boolean): Promise<PublicProfile>;
}`}
                </pre>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#111827] border border-slate-800">
                  <div className="font-bold text-emerald-400 mb-1">Active Phase 2 Stack</div>
                  <p className="text-slate-400 leading-relaxed">
                    Supabase Auth (PKCE flow) + PostgreSQL <code className="text-slate-300">public.profiles</code> table with Row Level Security and auto-signup trigger.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#111827] border border-slate-800">
                  <div className="font-bold text-violet-400 mb-1">Future Expansion Ready</div>
                  <p className="text-slate-400 leading-relaxed">
                    Plug in saved rigs, component reviews, OAuth providers (Google/GitHub/Discord), or migrate seamlessly to Next.js App Router + Prisma.
                  </p>
                </div>
              </div>
            </>
          )}

          {activeCodeTab === 'prisma' && (
            <>
              <p className="text-xs text-slate-400 leading-relaxed">
                Relational PostgreSQL schema backing <code className="text-cyan-300">public.profiles</code> today and extending cleanly to saved rigs, community reviews, and API tokens.
              </p>

              <div className="rounded-xl bg-[#070b14] border border-slate-800 overflow-hidden">
                <div className="px-4 py-2 border-b border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                  <span>supabase / postgres schema</span>
                  <span className="text-cyan-400">PostgreSQL (Supabase)</span>
                </div>
                <pre className="p-4 text-[11px] leading-relaxed font-mono text-slate-300 overflow-x-auto">
{`create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text unique not null,
  display_name text not null,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

-- Planned Phase 3 Tables:
-- public.saved_rigs (id, user_id, label, cpu_id, gpu_id, ram_gb, is_visible)
-- public.component_reviews (id, user_id, component_id, rating, tags, body)
-- public.compatibility_logs (id, user_id, rig_id, title_id, verdict)`}
                </pre>
              </div>
            </>
          )}

          {activeCodeTab === 'roadmap' && (
            <div className="space-y-3">
              {[
                {
                  icon: Fingerprint,
                  badge: 'Phase 3 • Security',
                  tone: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
                  title: 'OAuth Providers & Passkeys (WebAuthn)',
                  desc: 'Enable Google, GitHub, and Discord OAuth in Supabase Auth plus passwordless biometric sign-in.'
                },
                {
                  icon: Gamepad2,
                  badge: 'Phase 3 • Data Sync',
                  tone: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30',
                  title: 'Cloud Saved Rigs & Community Reviews',
                  desc: 'Persist saved desktop/laptop rigs, per-spec privacy toggles, and real-world hardware reviews in Supabase PostgreSQL.'
                },
                {
                  icon: Terminal,
                  badge: 'Phase 4 • Ecosystem',
                  tone: 'text-violet-400 bg-violet-500/15 border-violet-500/30',
                  title: 'RigCheck Desktop Agent API Tokens',
                  desc: 'Scoped personal access tokens allowing a companion desktop utility to detect CPU, GPU, VRAM, and RAM automatically.'
                }
              ].map(item => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="p-4 rounded-2xl bg-[#111827] border border-slate-800 flex items-start gap-3.5"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#070b14] border border-slate-800 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className="space-y-1">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.tone}`}>
                        {item.badge}
                      </span>
                      <h3 className="text-sm font-bold text-white">{item.title}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

// ============================================================================
// 5. SUB-COMPONENT: POST-LOGIN AUTHENTICATED SESSION HANDOFF SCREEN
// ============================================================================
function AuthenticatedSessionView({
  user,
  profile,
  onTogglePrivacy,
  onSignOut,
  onLaunchApp,
  onOpenArchitecture,
  showToast
}) {
  const [activeSection, setActiveSection] = useState('overview'); // 'overview' | 'security'
  const [signingOut, setSigningOut] = useState(false);
  const [privacySaving, setPrivacySaving] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Preview state for Phase 3/4 security controls
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [passkeysCount, setPasskeysCount] = useState(0);
  const [agentTokensCount, setAgentTokensCount] = useState(0);
  const [generatedToken, setGeneratedToken] = useState(null);

  const displayName =
    profile?.display_name ||
    user?.user_metadata?.display_name ||
    user?.email?.split('@')[0] ||
    'RigCheck Builder';
  const handle =
    profile?.handle ||
    user?.user_metadata?.handle ||
    'member';
  const isPublicProfile = profile?.is_public ?? true;
  const provider = user?.app_metadata?.provider || 'email';

  const handleTogglePrivacyClick = async () => {
    setPrivacySaving(true);
    try {
      const nextPublic = !isPublicProfile;
      await onTogglePrivacy(nextPublic);
      showToast(`Public profile set to ${nextPublic ? 'Public' : 'Private'}.`);
    } catch (err) {
      showToast(err?.message || 'Failed to update privacy setting.', 'error');
    } finally {
      setPrivacySaving(false);
    }
  };

  const handleSignOutClick = async () => {
    setSigningOut(true);
    try {
      await onSignOut();
    } finally {
      setSigningOut(false);
    }
  };

  const handleCopyProfileUrl = () => {
    const url = `${window.location.origin}${import.meta.env.BASE_URL}#/u/${handle}`;
    if (navigator.clipboard) navigator.clipboard.writeText(url).catch(() => {});
    setCopiedUrl(true);
    showToast('Copied profile URL to clipboard!');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleToggle2FA = () => {
    const next = !twoFactorEnabled;
    setTwoFactorEnabled(next);
    showToast(next ? '2FA preview enabled (connect Supabase MFA in Phase 3).' : '2FA preview disabled.', 'info');
  };

  const handleEnrollPasskey = () => {
    const nextCount = passkeysCount + 1;
    setPasskeysCount(nextCount);
    showToast(`Passkey #${nextCount} preview registered (WebAuthn hook ready).`, 'info');
  };

  const handleGenerateAgentToken = () => {
    const rand = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    setGeneratedToken(`rgc_live_${rand.slice(0, 24)}`);
    setAgentTokensCount(c => c + 1);
    showToast('Generated scoped Desktop Agent API token preview.', 'info');
  };

  const initials = displayName
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <header className="border-b border-slate-800/80 bg-[#0b0f19]/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Cpu className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="text-base font-black tracking-tight text-white leading-none">
                Rig<span className="text-cyan-400">Check</span>
              </div>
              <div className="text-[10px] font-semibold text-emerald-400 tracking-wide uppercase">
                Supabase Session Active
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenArchitecture}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111827] hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 transition-colors"
            >
              <Server className="w-3.5 h-3.5 text-violet-400" />
              Auth Architecture
            </button>
            <button
              type="button"
              onClick={handleSignOutClick}
              disabled={signingOut}
              className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {signingOut ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
        <div className="rounded-3xl bg-gradient-to-br from-[#111827] via-[#0f172a] to-[#0c1629] border border-slate-800 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 via-sky-500 to-violet-600 flex items-center justify-center text-xl font-black text-slate-950 shadow-xl shadow-cyan-500/20 shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" />
                    Authenticated
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 capitalize">
                    {provider === 'email' ? 'Email & Password' : `${provider} OAuth`}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight truncate">
                  Welcome, {displayName}
                </h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1">
                  <span className="font-mono text-cyan-300">@{handle}</span>
                  <span>•</span>
                  <span>{user?.email}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
              <button
                type="button"
                disabled={privacySaving}
                onClick={handleTogglePrivacyClick}
                className={`px-4 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-60 ${
                  isPublicProfile
                    ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-300 hover:bg-emerald-500/20'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                {privacySaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : isPublicProfile ? (
                  <Globe className="w-3.5 h-3.5" />
                ) : (
                  <Lock className="w-3.5 h-3.5" />
                )}
                Profile: {isPublicProfile ? 'Public' : 'Private'}
              </button>

              <button
                type="button"
                onClick={handleCopyProfileUrl}
                className="px-4 py-2 rounded-xl bg-[#070b14] hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono flex items-center justify-center gap-2 transition-colors"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                rigcheck.app/u/{handle}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
          <button
            type="button"
            onClick={() => setActiveSection('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeSection === 'overview'
                ? 'bg-cyan-500 text-slate-950'
                : 'bg-[#111827] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Unlocked Capabilities & Session
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('security')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeSection === 'security'
                ? 'bg-cyan-500 text-slate-950'
                : 'bg-[#111827] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Security & Expansion Hooks
          </button>
        </div>

        {activeSection === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-8 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[
                  {
                    icon: Sliders,
                    title: 'Instant Compatibility Engine',
                    desc: 'Check CPU, GPU, VRAM, RAM, and SSD requirements across AAA games & creative suites.'
                  },
                  {
                    icon: Laptop,
                    title: 'Multi-Rig Cloud Profiles',
                    desc: 'Save & switch between your Primary Desktop, College Laptop, and Secondary builds.'
                  },
                  {
                    icon: Star,
                    title: 'Community Hardware Reviews',
                    desc: 'Publish, edit, and tag real-world reviews for CPUs, GPUs, and complete setups.'
                  },
                  {
                    icon: Shield,
                    title: 'Granular Profile Privacy',
                    desc: 'Toggle individual saved rigs, spec fields, and reviews on your shareable URL.'
                  }
                ].map(cap => {
                  const Icon = cap.icon;
                  return (
                    <div
                      key={cap.title}
                      className="p-4 rounded-2xl border bg-[#111827] border-slate-800"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="w-9 h-9 rounded-xl bg-[#070b14] border border-slate-800 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-cyan-400" />
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
                          Unlocked
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white">{cap.title}</h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{cap.desc}</p>
                    </div>
                  );
                })}
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-violet-500/10 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Your RigCheck session is synced with Supabase
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Proceed straight to the Spec Builder, Hardware Reviews Hub, or your Privacy Dashboard.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onLaunchApp}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-cyan-500/20"
                >
                  Launch RigCheck App
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-4 rounded-2xl bg-[#111827] border border-slate-800 p-5 flex flex-col justify-between gap-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  Session Telemetry
                </h3>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between gap-2 py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-500">User ID</span>
                    <span className="font-mono text-slate-200 truncate max-w-[165px]" title={user?.id}>
                      {user?.id}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2 py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-500">Auth Backend</span>
                    <span className="font-mono text-emerald-400">supabase-pkce</span>
                  </div>
                  <div className="flex justify-between gap-2 py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-500">Profile Row</span>
                    <span className="font-mono text-cyan-300">{profile ? 'Synced' : 'Pending'}</span>
                  </div>
                  <div className="flex justify-between gap-2 py-1.5">
                    <span className="text-slate-500">Last Sign In</span>
                    <span className="text-slate-300">
                      {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleTimeString() : 'Active'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSignOutClick}
                disabled={signingOut}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-colors disabled:opacity-50"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                Sign Out & Return to Login
              </button>
            </div>
          </div>
        )}

        {activeSection === 'security' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-6 rounded-2xl bg-[#111827] border border-slate-800 p-5 space-y-4">
              <div>
                <h3 className="text-base font-bold text-white">OAuth & Gaming Integrations</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Planned Supabase OAuth providers and gaming library hooks for Phase 3.
                </p>
              </div>

              <div className="space-y-2.5">
                {[
                  { name: 'Google OAuth', desc: 'Single sign-on via Supabase Providers', icon: GoogleIcon },
                  { name: 'GitHub OAuth', desc: 'Developer profile & OSS badge', icon: GitHubIcon },
                  { name: 'Discord OAuth', desc: 'Community rig showcase embeds', icon: DiscordIcon }
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.name}
                      className="p-3.5 rounded-xl bg-[#070b14] border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#111827] border border-slate-800 flex items-center justify-center">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">{item.name}</div>
                          <div className="text-[11px] text-slate-400">{item.desc}</div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-violet-500/10 border border-violet-500/30 text-violet-300 shrink-0">
                        Phase 3 Hook
                      </span>
                    </div>
                  );
                })}

                {[
                  { name: 'Steam Library Sync', desc: 'Auto-check every owned game against your saved rigs' },
                  { name: 'Epic Games Store', desc: 'Import Epic catalog & Unreal Engine tools' }
                ].map(ext => (
                  <div
                    key={ext.name}
                    className="p-3.5 rounded-xl bg-[#070b14]/60 border border-dashed border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#111827] border border-slate-800 flex items-center justify-center">
                        <Gamepad2 className="w-4 h-4 text-slate-500" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-300">{ext.name}</div>
                        <div className="text-[11px] text-slate-500">{ext.desc}</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-400 shrink-0">
                      Planned
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6 space-y-4">
              <div className="rounded-2xl bg-[#111827] border border-slate-800 p-5 space-y-4">
                <h3 className="text-base font-bold text-white">Advanced Security Controls</h3>

                <div className="p-4 rounded-xl bg-[#070b14] border border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Fingerprint className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-semibold text-white">Passkeys (WebAuthn)</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {passkeysCount > 0
                          ? `${passkeysCount} passkey(s) registered in preview mode.`
                          : 'Sign in with Touch ID, Windows Hello, or YubiKey.'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleEnrollPasskey}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300"
                  >
                    + Add Passkey
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-[#070b14] border border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Smartphone className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-semibold text-white">Two-Factor Auth (TOTP)</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Protect saved rigs and verified hardware reviews with an authenticator app.
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggle2FA}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 border ${
                      twoFactorEnabled
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-200 hover:border-cyan-500/50'
                    }`}
                  >
                    {twoFactorEnabled ? 'Enabled' : 'Enable 2FA'}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl bg-[#111827] border border-slate-800 p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-violet-400" />
                    <h3 className="text-sm font-bold text-white">Desktop Agent API Tokens</h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    {agentTokensCount} active
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Future RigCheck Desktop Agent integration lets you auto-detect your CPU, GPU, RAM, and drivers via a scoped API key.
                </p>
                {generatedToken && (
                  <div className="p-2.5 rounded-xl bg-[#070b14] border border-violet-500/40 font-mono text-xs text-violet-300 break-all">
                    {generatedToken}
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleGenerateAgentToken}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors bg-violet-500/15 hover:bg-violet-500/25 border-violet-500/40 text-violet-300"
                >
                  Generate Preview Token
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ============================================================================
// 6. MAIN LOGIN PAGE COMPONENT (Connected to Supabase AuthContext)
// ============================================================================
export default function LoginPage() {
  const {
    user,
    profile,
    loading: authLoading,
    login,
    register,
    logout,
    resetPassword,
    updatePrivacy
  } = useAuth();
  const navigate = useNavigate();

  // --- Auth View Mode: 'signin' | 'register' | 'reset' ---
  const [mode, setMode] = useState('signin');

  // --- Sign In Form State ---
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [showSignInPw, setShowSignInPw] = useState(false);

  // --- Create Account Form State ---
  const [regName, setRegName] = useState('');
  const [regHandle, setRegHandle] = useState('');
  const [handleManuallyEdited, setHandleManuallyEdited] = useState(false);
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPw, setRegConfirmPw] = useState('');
  const [showRegPw, setShowRegPw] = useState(false);
  const [regPublicProfile, setRegPublicProfile] = useState(true);

  // --- Reset Password State ---
  const [resetEmail, setResetEmail] = useState('');
  const [resetSentMsg, setResetSentMsg] = useState('');

  // --- Showcase Panel Interactive State ---
  const [showcaseIndex, setShowcaseIndex] = useState(0);
  const [previewPrivacyOn, setPreviewPrivacyOn] = useState(true);

  // --- Feedback, Loaders & Drawer State ---
  const [loadingAction, setLoadingAction] = useState(null); // null | 'signin' | 'register' | 'reset'
  const [formError, setFormError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [showArchDrawer, setShowArchDrawer] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, tone = 'success') => {
    setToast({ message, tone, id: Date.now() });
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const switchMode = nextMode => {
    setMode(nextMode);
    setFormError('');
    setInfoMessage('');
    setResetSentMsg('');
  };

  const handleDisplayNameChange = val => {
    setRegName(val);
    if (!handleManuallyEdited) {
      const slug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 20);
      setRegHandle(slug);
    }
  };

  const cleanHandlePreview = useMemo(() => {
    return (
      regHandle
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '')
        .slice(0, 24) || 'your_handle'
    );
  }, [regHandle]);

  const pwAnalysis = useMemo(() => evaluatePassword(regPassword), [regPassword]);
  const passwordsMatch = regConfirmPw.length > 0 && regPassword === regConfirmPw;
  const passwordsMismatch = regConfirmPw.length > 0 && regPassword !== regConfirmPw;

  const activeShowcase = SHOWCASE_BUILDS[showcaseIndex];

  // --- Form Submission Handlers (Wired to Supabase AuthContext) ---
  const handleSignInSubmit = async e => {
    e.preventDefault();
    setFormError('');
    setInfoMessage('');

    if (!signInEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signInEmail.trim())) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (signInPassword.length < 6) {
      setFormError('Please enter your password (at least 6 characters).');
      return;
    }

    setLoadingAction('signin');
    try {
      await login({
        email: signInEmail,
        password: signInPassword
      });
      navigate('/');
    } catch (err) {
      setFormError(err?.message || 'Invalid email or password.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRegisterSubmit = async e => {
    e.preventDefault();
    setFormError('');
    setInfoMessage('');

    if (regName.trim().length < 2) {
      setFormError('Display name must be at least 2 characters.');
      return;
    }
    if (cleanHandlePreview === 'your_handle' || regHandle.trim().length < 3) {
      setFormError('Public handle must be at least 3 characters (letters, numbers, _ or -).');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim())) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (pwAnalysis.passedCount < 3) {
      setFormError('Please choose a stronger password meeting at least 3 of the 4 requirements.');
      return;
    }
    if (regPassword !== regConfirmPw) {
      setFormError('Passwords do not match.');
      return;
    }

    setLoadingAction('register');
    try {
      const result = await register({
        email: regEmail,
        password: regPassword,
        displayName: regName,
        handle: cleanHandlePreview,
        isPublic: regPublicProfile
      });

      if (!result?.session) {
        setInfoMessage(
          'Account created! Check your inbox for a confirmation link before signing in.'
        );
        setRegPassword('');
        setRegConfirmPw('');
      } else {
        navigate('/');
      }
    } catch (err) {
      if (err?.message?.toLowerCase().includes('database error saving new user')) {
        setFormError('That @handle is already taken. Try a different public handle.');
      } else {
        setFormError(err?.message || 'Unable to create account.');
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const handleResetSubmit = async e => {
    e.preventDefault();
    setFormError('');
    setResetSentMsg('');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail.trim())) {
      setFormError('Please enter the valid email address linked to your account.');
      return;
    }

    setLoadingAction('reset');
    try {
      await resetPassword(resetEmail);
      setResetSentMsg(
        `Password reset link sent to ${resetEmail.trim()}. Check your inbox and spam folder.`
      );
      showToast('Password reset link sent.', 'info');
    } catch (err) {
      setFormError(err?.message || 'Could not send password reset link.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleOAuthClick = providerLabel => {
    showToast(
      `${providerLabel} OAuth will activate once configured in Supabase Auth Providers (Phase 3). Use Email & Password or Guest Mode for now.`,
      'info'
    );
  };

  const handleGuestClick = () => {
    navigate('/');
  };

  const handleSignOut = async () => {
    try {
      await logout();
      setSignInPassword('');
      setFormError('');
      showToast('Signed out cleanly. See you on the next benchmark!', 'info');
    } catch (err) {
      showToast(err?.message || 'Failed to sign out.', 'error');
    }
  };

  const isBusy = Boolean(loadingAction);

  return (
    <div
      className="min-h-screen bg-[#070b14] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-x-hidden"
      style={{
        backgroundImage:
          'linear-gradient(to right, rgba(30, 41, 59, 0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(30, 41, 59, 0.22) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }}
    >
      <div className="fixed -top-40 -left-40 w-[30rem] h-[30rem] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-40 -right-40 w-[32rem] h-[32rem] bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      {authLoading ? (
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-7 h-7 animate-spin text-cyan-400" />
          <span className="text-xs font-semibold tracking-wide uppercase">
            Checking RigCheck session...
          </span>
        </div>
      ) : user ? (
        <div className="relative z-10">
          <AuthenticatedSessionView
            user={user}
            profile={profile}
            onTogglePrivacy={updatePrivacy}
            onSignOut={handleSignOut}
            onLaunchApp={() => navigate('/')}
            onOpenArchitecture={() => setShowArchDrawer(true)}
            showToast={showToast}
          />
        </div>
      ) : (
        <div className="relative z-10 min-h-screen flex flex-col justify-between">
          <header className="lg:hidden px-4 sm:px-6 pt-5 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Cpu className="w-5 h-5 text-slate-950" />
              </div>
              <div>
                <div className="text-lg font-black tracking-tight text-white leading-none">
                  Rig<span className="text-cyan-400">Check</span>
                </div>
                <div className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
                  Can You Run It
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowArchDrawer(true)}
              className="px-3 py-1.5 rounded-xl bg-[#0f1624] border border-slate-800 text-[11px] font-semibold text-slate-300 flex items-center gap-1.5"
            >
              <Server className="w-3.5 h-3.5 text-violet-400" />
              Auth Blueprint
            </button>
          </header>

          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* LEFT SHOWCASE PANEL */}
            <section className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-center space-y-7 pr-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-cyan-500/25">
                    <Cpu className="w-6 h-6 text-slate-950" />
                  </div>
                  <div>
                    <div className="text-2xl font-black tracking-tight text-white leading-none">
                      Rig<span className="text-cyan-400">Check</span>
                    </div>
                    <div className="text-[11px] font-semibold text-slate-400 tracking-widest uppercase mt-0.5">
                      PC Compatibility & Hardware Hub
                    </div>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Supabase Auth Live
                </span>
              </div>

              <div className="space-y-3">
                <h1 className="text-4xl xl:text-[2.75rem] font-black text-white tracking-tight leading-[1.1]">
                  Know what your rig can run.{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-emerald-300 to-violet-400">
                    Sync every build.
                  </span>
                </h1>
                <p className="text-slate-400 text-base max-w-xl leading-relaxed">
                  Input your specs once to uncover instant game & creative app compatibility, pinpoint CPU/VRAM bottlenecks, and share verified reviews with the PC builder community.
                </p>
              </div>

              <div className="rounded-3xl bg-[#0d1424]/95 border border-slate-800/90 p-5 shadow-2xl shadow-black/50 space-y-4 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-cyan-500 via-emerald-400 to-violet-500" />

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 bg-[#070b14] p-1 rounded-xl border border-slate-800">
                    {SHOWCASE_BUILDS.map((b, idx) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setShowcaseIndex(idx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          showcaseIndex === idx
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setPreviewPrivacyOn(prev => !prev)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold border flex items-center gap-1.5 transition-all ${
                      previewPrivacyOn
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}
                    title="Preview how RigCheck granular privacy redacts specs"
                  >
                    {previewPrivacyOn ? <Globe className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    Public Preview: {previewPrivacyOn ? 'Visible' : 'Redacted'}
                  </button>
                </div>

                <div className="grid grid-cols-12 gap-3 items-center bg-[#070b14] rounded-2xl p-4 border border-slate-800/80">
                  <div className="col-span-8 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-slate-200 font-semibold">
                      <Cpu className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">
                        {previewPrivacyOn ? activeShowcase.cpu : 'CPU Hidden by User'}
                      </span>
                      {previewPrivacyOn && (
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">
                          {activeShowcase.cpuScore}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-200 font-semibold">
                      <Monitor className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                      <span className="truncate">
                        {previewPrivacyOn ? activeShowcase.gpu : 'GPU Hidden by User'}
                      </span>
                      {previewPrivacyOn && (
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-violet-300">
                          {activeShowcase.gpuScore}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                      <span>{activeShowcase.ram}</span>
                      <span>•</span>
                      <span>{activeShowcase.storage}</span>
                    </div>
                  </div>
                  <div className="col-span-4 text-right border-l border-slate-800 pl-3">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                      Rig Score
                    </div>
                    <div className="text-3xl font-black font-mono text-white leading-tight">
                      {activeShowcase.score}
                    </div>
                    <div className="text-[11px] font-semibold text-emerald-400">
                      {activeShowcase.balance.label}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {activeShowcase.titles.map(t => (
                    <div
                      key={t.name}
                      className="px-3.5 py-2.5 rounded-xl bg-[#070b14]/80 border border-slate-800/80 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span>{t.name}</span>
                          <span className="text-[10px] font-normal text-slate-500">{t.category}</span>
                        </div>
                        <div
                          className={`text-[11px] truncate mt-0.5 ${
                            t.status === 'cannot_run'
                              ? 'text-rose-300'
                              : t.status === 'minimum'
                              ? 'text-amber-300'
                              : 'text-slate-400'
                          }`}
                        >
                          {t.note}
                        </div>
                      </div>
                      {t.status === 'recommended' && (
                        <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" /> Recommended
                        </span>
                      )}
                      {t.status === 'minimum' && (
                        <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          <AlertTriangle className="w-3 h-3" /> Playable
                        </span>
                      )}
                      {t.status === 'cannot_run' && (
                        <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                          <AlertCircle className="w-3 h-3" /> Cannot Run
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                {[
                  { icon: Laptop, text: 'Save & switch multiple desktop & laptop rigs' },
                  { icon: Zap, text: 'Instant CPU, GPU, VRAM & RAM bottleneck alerts' },
                  { icon: Star, text: 'Write & manage verified hardware reviews' },
                  { icon: Shield, text: 'Granular public profile & per-spec privacy toggles' }
                ].map(perk => {
                  const Icon = perk.icon;
                  return (
                    <div key={perk.text} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="w-3.5 h-3.5 text-cyan-400" />
                      </div>
                      <span className="leading-snug">{perk.text}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* RIGHT AUTHENTICATION CARD */}
            <section className="lg:col-span-6 xl:col-span-5 w-full max-w-md mx-auto lg:max-w-none">
              <div className="rounded-3xl bg-[#0e1525]/95 backdrop-blur-xl border border-slate-800/90 p-6 sm:p-8 shadow-2xl shadow-black/60 relative">
                <div className="lg:hidden mb-5">
                  <h1 className="text-xl font-extrabold text-white tracking-tight">
                    Know what your rig can run.{' '}
                    <span className="text-cyan-400">Sync every build.</span>
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Save PC profiles, detect hardware bottlenecks, and share community reviews.
                  </p>
                </div>

                {mode !== 'reset' ? (
                  <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[#070b14] border border-slate-800 mb-6">
                    <button
                      type="button"
                      onClick={() => switchMode('signin')}
                      className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                        mode === 'signin'
                          ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-white border border-cyan-500/40 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => switchMode('register')}
                      className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                        mode === 'register'
                          ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-white border border-cyan-500/40 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Create Account
                    </button>
                  </div>
                ) : (
                  <div className="mb-5">
                    <button
                      type="button"
                      onClick={() => switchMode('signin')}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors mb-3"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back to Sign In
                    </button>
                    <h2 className="text-xl font-extrabold text-white">Reset your password</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Enter your account email and we will send you a secure recovery link.
                    </p>
                  </div>
                )}

                {formError && (
                  <div
                    role="alert"
                    className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/35 text-rose-200 text-xs flex items-start gap-2.5"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span className="leading-snug">{formError}</span>
                  </div>
                )}

                {infoMessage && (
                  <div
                    role="status"
                    className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/35 text-emerald-200 text-xs flex items-start gap-2.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="leading-snug">{infoMessage}</span>
                  </div>
                )}

                {mode !== 'reset' && (
                  <>
                    <div className="grid grid-cols-3 gap-2.5 mb-5">
                      {[
                        { key: 'google', label: 'Google', icon: GoogleIcon },
                        { key: 'github', label: 'GitHub', icon: GitHubIcon },
                        { key: 'discord', label: 'Discord', icon: DiscordIcon }
                      ].map(prov => {
                        const Icon = prov.icon;
                        return (
                          <button
                            key={prov.key}
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleOAuthClick(prov.label)}
                            className="py-2.5 px-3 rounded-xl bg-[#070b14] hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/40 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                          >
                            <Icon className="w-4 h-4 shrink-0" />
                            <span>{prov.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="relative flex items-center justify-center my-5">
                      <div className="border-t border-slate-800 w-full" />
                      <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-[#0e1525] shrink-0">
                        or continue with email
                      </span>
                      <div className="border-t border-slate-800 w-full" />
                    </div>
                  </>
                )}

                {/* VIEW A: SIGN IN FORM */}
                {mode === 'signin' && (
                  <form onSubmit={handleSignInSubmit} className="space-y-4" noValidate>
                    <div>
                      <label htmlFor="signin-email" className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="signin-email"
                          type="email"
                          autoComplete="email"
                          required
                          value={signInEmail}
                          onChange={e => setSignInEmail(e.target.value)}
                          placeholder="builder@rigcheck.app"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070b14] border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor="signin-password" className="text-xs font-semibold text-slate-300">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setResetEmail(signInEmail);
                            switchMode('reset');
                          }}
                          className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="signin-password"
                          type={showSignInPw ? 'text' : 'password'}
                          autoComplete="current-password"
                          required
                          value={signInPassword}
                          onChange={e => setSignInPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-[#070b14] border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignInPw(prev => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200"
                          aria-label={showSignInPw ? 'Hide password' : 'Show password'}
                        >
                          {showSignInPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={keepSignedIn}
                        onChange={e => setKeepSignedIn(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-700 bg-[#070b14] text-cyan-500 focus:ring-cyan-500/30"
                      />
                      <span className="text-xs text-slate-300">Keep me signed in on this device</span>
                    </label>

                    <button
                      type="submit"
                      disabled={isBusy}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-60"
                    >
                      {loadingAction === 'signin' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Authenticating...
                        </>
                      ) : (
                        <>
                          Sign In to RigCheck
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* VIEW B: CREATE ACCOUNT FORM */}
                {mode === 'register' && (
                  <form onSubmit={handleRegisterSubmit} className="space-y-3.5" noValidate>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="reg-name" className="block text-xs font-semibold text-slate-300 mb-1">
                          Display Name
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            id="reg-name"
                            type="text"
                            required
                            value={regName}
                            onChange={e => handleDisplayNameChange(e.target.value)}
                            placeholder="Alex Builds"
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#070b14] border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="reg-handle" className="block text-xs font-semibold text-slate-300 mb-1">
                          Public Handle
                        </label>
                        <div className="relative">
                          <AtSign className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            id="reg-handle"
                            type="text"
                            required
                            value={regHandle}
                            onChange={e => {
                              setHandleManuallyEdited(true);
                              setRegHandle(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''));
                            }}
                            placeholder="alex_builds"
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#070b14] border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="px-3 py-1.5 rounded-lg bg-[#070b14] border border-slate-800/90 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Profile URL:</span>
                      <span className="font-mono text-cyan-400 truncate">
                        rigcheck.app/u/{cleanHandlePreview}
                      </span>
                    </div>

                    <div>
                      <label htmlFor="reg-email" className="block text-xs font-semibold text-slate-300 mb-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="reg-email"
                          type="email"
                          autoComplete="email"
                          required
                          value={regEmail}
                          onChange={e => setRegEmail(e.target.value)}
                          placeholder="alex@example.com"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070b14] border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="reg-password" className="block text-xs font-semibold text-slate-300 mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="reg-password"
                          type={showRegPw ? 'text' : 'password'}
                          autoComplete="new-password"
                          required
                          value={regPassword}
                          onChange={e => setRegPassword(e.target.value)}
                          placeholder="Create a strong password"
                          className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-[#070b14] border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPw(prev => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200"
                          aria-label={showRegPw ? 'Hide password' : 'Show password'}
                        >
                          {showRegPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-1.5">
                          {[1, 2, 3, 4].map(seg => (
                            <div
                              key={seg}
                              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                                seg <= pwAnalysis.passedCount ? pwAnalysis.meta.color : 'bg-slate-800'
                              }`}
                            />
                          ))}
                          <span className={`text-[11px] font-bold ml-1.5 ${pwAnalysis.meta.text}`}>
                            {pwAnalysis.meta.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                          {[
                            { ok: pwAnalysis.checks.length, label: '8+ characters' },
                            { ok: pwAnalysis.checks.uppercase, label: 'Uppercase letter' },
                            { ok: pwAnalysis.checks.number, label: 'At least 1 number' },
                            { ok: pwAnalysis.checks.symbol, label: 'Special symbol' }
                          ].map(req => (
                            <div
                              key={req.label}
                              className={`flex items-center gap-1.5 ${
                                req.ok ? 'text-emerald-400' : 'text-slate-500'
                              }`}
                            >
                              <Check className={`w-3 h-3 ${req.ok ? 'opacity-100' : 'opacity-40'}`} />
                              <span>{req.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="reg-confirm" className="block text-xs font-semibold text-slate-300 mb-1">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="reg-confirm"
                          type={showRegPw ? 'text' : 'password'}
                          autoComplete="new-password"
                          required
                          value={regConfirmPw}
                          onChange={e => setRegConfirmPw(e.target.value)}
                          placeholder="Re-enter password"
                          className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#070b14] border text-sm text-white placeholder-slate-500 focus:outline-none ${
                            passwordsMismatch
                              ? 'border-rose-500/70 focus:border-rose-500'
                              : passwordsMatch
                              ? 'border-emerald-500/60 focus:border-emerald-400'
                              : 'border-slate-700/80 focus:border-cyan-500'
                          }`}
                        />
                        {passwordsMatch && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                        )}
                        {passwordsMismatch && (
                          <AlertCircle className="w-4 h-4 text-rose-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                        )}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#070b14] border border-slate-800 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          {regPublicProfile ? (
                            <Globe className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          {regPublicProfile ? 'Start with Public Profile' : 'Start with Private Profile'}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {regPublicProfile
                            ? 'Showcase selected rigs & reviews (editable anytime).'
                            : 'Keep all saved rigs hidden until you opt in.'}
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={regPublicProfile}
                        onClick={() => setRegPublicProfile(prev => !prev)}
                        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors ${
                          regPublicProfile ? 'bg-emerald-500' : 'bg-slate-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                            regPublicProfile ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isBusy}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-60"
                    >
                      {loadingAction === 'register' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        <>
                          Create RigCheck Account
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* VIEW C: RESET PASSWORD INLINE VIEW */}
                {mode === 'reset' && (
                  <form onSubmit={handleResetSubmit} className="space-y-4" noValidate>
                    {resetSentMsg && (
                      <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/35 text-emerald-200 text-xs flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{resetSentMsg}</span>
                      </div>
                    )}

                    <div>
                      <label htmlFor="reset-email" className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Account Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="reset-email"
                          type="email"
                          required
                          value={resetEmail}
                          onChange={e => setResetEmail(e.target.value)}
                          placeholder="builder@rigcheck.app"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070b14] border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isBusy}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-60"
                    >
                      {loadingAction === 'reset' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending Link...
                        </>
                      ) : (
                        <>
                          Send Recovery Link
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* GUEST QUICK CHECK CTA */}
                <div className="mt-6 pt-5 border-t border-slate-800/90 space-y-2.5">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={handleGuestClick}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#070b14] hover:bg-slate-800/90 border border-slate-700/80 hover:border-cyan-500/40 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    Continue as Guest (Quick Check)
                  </button>
                  <p className="text-[11px] text-center text-slate-500 leading-relaxed">
                    Guests can run instant game & software compatibility checks without saving device profiles or reviews.
                  </p>
                </div>
              </div>
            </section>
          </main>

          <footer className="border-t border-slate-800/70 bg-[#070b14]/80 backdrop-blur-md py-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>RigCheck Identity Gateway • Supabase PKCE Session Layer</span>
              </div>
              <button
                type="button"
                onClick={() => setShowArchDrawer(true)}
                className="text-slate-400 hover:text-cyan-400 font-medium inline-flex items-center gap-1.5 transition-colors"
              >
                <Server className="w-3.5 h-3.5 text-violet-400" />
                Auth Architecture
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </footer>
        </div>
      )}

      <AuthArchitectureDrawer
        open={showArchDrawer}
        onClose={() => setShowArchDrawer(false)}
      />

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 max-w-sm"
        >
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
            <span className="leading-snug">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}