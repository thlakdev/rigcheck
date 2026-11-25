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
  Zap,
  Globe,
  Loader2,
  Sliders,
  Star,
  Laptop,
  Info,
  Copy
} from 'lucide-react';

// ============================================================================
// 1. LIVE SHOWCASE RIG DATA (Left Panel Interactive Hardware Preview)
// ============================================================================
const SHOWCASE_BUILDS = [
  {
    id: 'enthusiast-1440p',
    label: 'Primary Desktop',
    score: 862,
    cpu: 'AMD Ryzen 7 7800X3D',
    cpuScore: 915,
    gpu: 'NVIDIA RTX 4070 Super (12GB)',
    gpuScore: 835,
    ram: '32GB DDR5-6000',
    storage: '2TB NVMe Gen4 SSD',
    balance: { label: 'Well-Balanced' },
    titles: [
      { name: 'Cyberpunk 2077', category: 'AAA RPG', status: 'recommended', note: '1440p Ultra • 95+ FPS' },
      { name: 'Red Dead Redemption 2', category: 'Open World', status: 'recommended', note: '1440p Max • 100+ FPS' },
      { name: 'DaVinci Resolve Studio', category: '4K Video', status: 'recommended', note: 'Smooth 4K timeline playback' }
    ]
  },
  {
    id: 'college-laptop',
    label: 'Portable Ultrabook',
    score: 545,
    cpu: 'Intel Core Ultra 5 226V',
    cpuScore: 640,
    gpu: 'Intel Arc 130V Integrated',
    gpuScore: 245,
    ram: '16GB LPDDR5X',
    storage: '512GB NVMe SSD',
    balance: { label: 'GPU-Bound' },
    titles: [
      { name: 'Valorant', category: 'Esports', status: 'recommended', note: '1080p High • 160+ FPS' },
      { name: 'Red Dead Redemption 2', category: 'Open World', status: 'cannot_run', note: 'Bottleneck: Integrated GPU below minimum' },
      { name: 'Cyberpunk 2077', category: 'AAA RPG', status: 'cannot_run', note: 'Bottleneck: Requires 6GB VRAM' }
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
// 4. POST-LOGIN AUTHENTICATED SESSION HANDOFF VIEW
// ============================================================================
function AuthenticatedSessionView({
  user,
  profile,
  onTogglePrivacy,
  onSignOut,
  onLaunchApp,
  showToast
}) {
  const [signingOut, setSigningOut] = useState(false);
  const [privacySaving, setPrivacySaving] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const displayName =
    profile?.display_name ||
    user?.user_metadata?.display_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.user_name ||
    user?.email?.split('@')[0] ||
    'RigCheck Builder';
  const handle =
    profile?.handle ||
    user?.user_metadata?.handle ||
    user?.user_metadata?.user_name ||
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
                Signed In
              </div>
            </div>
          </div>

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
                    Active Member
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[
                {
                  icon: Sliders,
                  title: 'Instant Compatibility Engine',
                  desc: 'Evaluate CPU, GPU, VRAM, RAM, and SSD specs against games and creative suites.'
                },
                {
                  icon: Laptop,
                  title: 'Scored Laptop & Component Catalog',
                  desc: 'Compare desktop parts and laptops side-by-side with thermal scaling.'
                },
                {
                  icon: Zap,
                  title: 'Bottleneck Detection',
                  desc: 'Identify CPU-bound or GPU-bound pairings before buying or upgrading parts.'
                },
                {
                  icon: Shield,
                  title: 'Saved Cloud Builds',
                  desc: 'Save multiple desktop and laptop builds to your account and edit them anytime.'
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
                        Active
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
                  Ready to benchmark and compare builds
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Open the RigCheck Spec Builder, Part &amp; Laptop Scorer, and your saved builds.
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
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Account Summary
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between gap-2 py-1.5 border-b border-slate-800/80">
                  <span className="text-slate-500">Handle</span>
                  <span className="font-mono text-cyan-300">@{handle}</span>
                </div>
                <div className="flex justify-between gap-2 py-1.5 border-b border-slate-800/80">
                  <span className="text-slate-500">Sign-In Method</span>
                  <span className="text-slate-200 capitalize">{provider}</span>
                </div>
                <div className="flex justify-between gap-2 py-1.5 border-b border-slate-800/80">
                  <span className="text-slate-500">Profile Visibility</span>
                  <span className={isPublicProfile ? 'text-emerald-400 font-semibold' : 'text-slate-300'}>
                    {isPublicProfile ? 'Public' : 'Private'}
                  </span>
                </div>
                <div className="flex justify-between gap-2 py-1.5">
                  <span className="text-slate-500">Member Since</span>
                  <span className="text-slate-300">
                    {profile?.created_at
                      ? new Date(profile.created_at).toLocaleDateString()
                      : new Date().toLocaleDateString()}
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
              Sign Out
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// 5. MAIN LOGIN PAGE COMPONENT (Email + Google / GitHub / Discord OAuth)
// ============================================================================
export default function LoginPage() {
  const {
    user,
    profile,
    loading: authLoading,
    login,
    register,
    signInWithOAuth,
    logout,
    resetPassword,
    updatePrivacy
  } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('signin'); // 'signin' | 'register' | 'reset'

  // Sign In State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [showSignInPw, setShowSignInPw] = useState(false);

  // Create Account State
  const [regName, setRegName] = useState('');
  const [regHandle, setRegHandle] = useState('');
  const [handleManuallyEdited, setHandleManuallyEdited] = useState(false);
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPw, setRegConfirmPw] = useState('');
  const [showRegPw, setShowRegPw] = useState(false);
  const [regPublicProfile, setRegPublicProfile] = useState(true);

  // Reset Password State
  const [resetEmail, setResetEmail] = useState('');
  const [resetSentMsg, setResetSentMsg] = useState('');

  // Showcase Panel State
  const [showcaseIndex, setShowcaseIndex] = useState(0);
  const [previewPrivacyOn, setPreviewPrivacyOn] = useState(true);

  // Feedback & Loaders ('signin' | 'register' | 'reset' | 'google' | 'github' | 'discord' | null)
  const [loadingAction, setLoadingAction] = useState(null);
  const [formError, setFormError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (message, tone = 'success') => {
    setToast({ message, tone, id: Date.now() });
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // Surface any OAuth callback error returned in URL query or hash parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const hashQuery = window.location.hash.includes('?')
      ? window.location.hash.split('?')[1]
      : '';
    const hashParams = new URLSearchParams(hashQuery);

    const errDesc =
      searchParams.get('error_description') ||
      hashParams.get('error_description') ||
      searchParams.get('error') ||
      hashParams.get('error');

    if (errDesc) {
      setFormError(decodeURIComponent(errDesc.replace(/\+/g, ' ')));
    }
  }, []);

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

  // --- Email Sign In ---
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

  // --- Email Create Account ---
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
          'Account created! Check your inbox for a verification email from RigCheck before signing in.'
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

  // --- Password Reset ---
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

  // --- Live OAuth Sign In / Sign Up (Google, GitHub, Discord) ---
  const handleOAuthClick = async providerKey => {
    setFormError('');
    setInfoMessage('');

    if (typeof signInWithOAuth !== 'function') {
      setFormError('OAuth is not wired in AuthContext.jsx yet. Export signInWithOAuth from AuthContext.');
      return;
    }

    setLoadingAction(providerKey);
    try {
      await signInWithOAuth(providerKey);
      // Browser redirects to provider; keep spinner active until navigation happens
    } catch (err) {
      const msg = err?.message || `Could not sign in with ${providerKey}.`;
      if (msg.toLowerCase().includes('provider is not enabled')) {
        setFormError(
          `${providerKey.charAt(0).toUpperCase() + providerKey.slice(1)} login is not enabled in Supabase Authentication → Providers yet.`
        );
      } else {
        setFormError(msg);
      }
      setLoadingAction(null);
    }
  };

  const handleGuestClick = () => {
    navigate('/');
  };

  const handleSignOut = async () => {
    try {
      await logout();
      setSignInPassword('');
      setFormError('');
      showToast('Signed out cleanly.', 'info');
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
            Loading RigCheck session...
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
                      PC Compatibility &amp; Hardware Hub
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h1 className="text-4xl xl:text-[2.75rem] font-black text-white tracking-tight leading-[1.1]">
                  Know what your rig can run.{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-emerald-300 to-violet-400">
                    Compare every build.
                  </span>
                </h1>
                <p className="text-slate-400 text-base max-w-xl leading-relaxed">
                  Benchmark desktop components and laptops with a unified scoring formula, uncover CPU/VRAM bottlenecks, and save your rigs to compare upgrades side-by-side.
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
                  { icon: Laptop, text: 'Save & compare multiple desktop & laptop rigs' },
                  { icon: Zap, text: 'Instant CPU, GPU, VRAM & RAM bottleneck alerts' },
                  { icon: Star, text: 'Formula-scored laptop & part rankings' },
                  { icon: Shield, text: 'Public or private profile visibility toggles' }
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
                    <span className="text-cyan-400">Compare every build.</span>
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Save PC profiles, detect bottlenecks, and compare parts side-by-side.
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

                {/* Live OAuth Buttons (works for both Sign In and Create Account) */}
                {mode !== 'reset' && (
                  <>
                    <div className="grid grid-cols-3 gap-2.5 mb-5">
                      {[
                        { key: 'google', label: 'Google', icon: GoogleIcon },
                        { key: 'github', label: 'GitHub', icon: GitHubIcon },
                        { key: 'discord', label: 'Discord', icon: DiscordIcon }
                      ].map(prov => {
                        const Icon = prov.icon;
                        const activeLoad = loadingAction === prov.key;
                        return (
                          <button
                            key={prov.key}
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleOAuthClick(prov.key)}
                            className="py-2.5 px-3 rounded-xl bg-[#070b14] hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/40 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                          >
                            {activeLoad ? (
                              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                            ) : (
                              <Icon className="w-4 h-4 shrink-0" />
                            )}
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
                            ? 'Showcase saved rigs on your profile (editable anytime).'
                            : 'Keep all saved rigs private until you opt in.'}
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
                    Guests can run compatibility checks and compare parts without saving builds.
                  </p>
                </div>
              </div>
            </section>
          </main>

          <footer className="border-t border-slate-800/70 bg-[#070b14]/80 backdrop-blur-md py-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>RigCheck • PC Hardware Compatibility &amp; Comparison Engine</span>
              </div>
              <span>Powered by Supabase &amp; PostgreSQL</span>
            </div>
          </footer>
        </div>
      )}

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