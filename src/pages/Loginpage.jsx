import React, { useState, useEffect, useMemo } from 'react';
import {
  Cpu,
  Monitor,
  Shield,
  ShieldCheck,
  Lock,
  Unlock,
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
  Sparkles,
  Gamepad2,
  Zap,
  Globe,
  Server,
  Database,
  Layers,
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
  Copy,
  HardDrive,
  RefreshCw
} from 'lucide-react';
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithCustomToken,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

// ============================================================================
// 1. CLOUD INFRASTRUCTURE BOOTSTRAP (Safe Module-Level Singleton)
// ============================================================================
let firebaseApp = null;
let auth = null;
let db = null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'rigcheck-default-app';

try {
  if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    const parsedConfig =
      typeof __firebase_config === 'string'
        ? JSON.parse(__firebase_config)
        : __firebase_config;
    firebaseApp = getApps().length ? getApps()[0] : initializeApp(parsedConfig);
    auth = getAuth(firebaseApp);
    db = getFirestore(firebaseApp);
  }
} catch (err) {
  console.error('Firebase initialization skipped; running local AuthAdapter:', err);
}

// ============================================================================
// 2. MODULAR AUTH SERVICE ABSTRACTION LAYER (RigCheckAuthService)
// ============================================================================
/**
 * RigCheckAuthService
 * ---------------------------------------------------------------------------
 * Clean repository/adapter boundary decoupling all React UI from the identity
 * provider. Uses Firebase Authentication + Firestore (strict /artifacts/{appId}
 * paths) when available, with graceful sandbox fallback if a provider method
 * is disabled in the current environment.
 *
 * EXPANSION / NEXTAUTH.JS + PRISMA MIGRATION:
 * Replace this adapter's method bodies with NextAuth `signIn()`, `/api/auth/*`,
 * and Prisma `User`/`Account`/`Session` mutations without changing UI code.
 *
 * Normalized Session Shape (NextAuth + RBAC + 2FA ready):
 * {
 *   uid: string,
 *   email: string | null,
 *   displayName: string,
 *   handle: string,
 *   role: 'USER' | 'GUEST' | 'MODERATOR' | 'ADMIN',
 *   provider: 'credentials' | 'google' | 'github' | 'discord' | 'guest',
 *   adapterMode: 'firebase-cloud' | 'local-sandbox-adapter',
 *   isPublicProfile: boolean,
 *   linkedProviders: string[],
 *   security: { twoFactorEnabled: boolean, passkeysCount: number, agentTokens: number },
 *   metadata: { createdAt: string, lastLoginAt: string, keepSignedIn: boolean, sessionId: string }
 * }
 */
class RigCheckAuthService {
  constructor(firebaseAuth, firestoreDb, projectAppId) {
    this.auth = firebaseAuth;
    this.db = firestoreDb;
    this.appId = projectAppId;
    // In-memory account registry used only when sandbox disables email/password auth
    this._sandboxRegistry = new Map();
  }

  _sanitizeHandle(raw) {
    const cleaned = (raw || 'builder')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '')
      .slice(0, 24);
    return cleaned || 'builder';
  }

  _generateSessionId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return `sess_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
    }
    return `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * Ensures an underlying Firebase auth session exists before any Firestore write
   * (Strictly enforces Auth-Before-Queries Rule).
   */
  async _ensureCloudSession() {
    if (!this.auth) return null;
    if (this.auth.currentUser) return this.auth.currentUser;
    try {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        const res = await signInWithCustomToken(this.auth, __initial_auth_token);
        return res.user;
      }
      const res = await signInAnonymously(this.auth);
      return res.user;
    } catch {
      return null;
    }
  }

  /**
   * Persists normalized profile fields to Firestore under strict user path:
   * /artifacts/{appId}/users/{userId}/settings/profile
   */
  async _syncProfileToCloud(uid, profilePatch) {
    if (!this.db || !this.auth || !this.auth.currentUser || !uid) return;
    try {
      const ref = doc(this.db, 'artifacts', this.appId, 'users', uid, 'settings', 'profile');
      await setDoc(ref, profilePatch, { merge: true });
    } catch (err) {
      console.warn('Profile cloud sync skipped:', err?.code || err?.message);
    }
  }

  async _readCloudProfile(uid) {
    if (!this.db || !this.auth || !this.auth.currentUser || !uid) return null;
    try {
      const ref = doc(this.db, 'artifacts', this.appId, 'users', uid, 'settings', 'profile');
      const snap = await getDoc(ref);
      return snap.exists() ? snap.data() : null;
    } catch {
      return null;
    }
  }

  _buildSession({
    uid,
    email,
    displayName,
    handle,
    role = 'USER',
    provider = 'credentials',
    adapterMode = 'firebase-cloud',
    isPublicProfile = true,
    linkedProviders = [],
    keepSignedIn = true
  }) {
    const now = new Date().toISOString();
    return {
      uid,
      email,
      displayName,
      handle: this._sanitizeHandle(handle || displayName),
      role,
      provider,
      adapterMode,
      isPublicProfile,
      linkedProviders: linkedProviders.length ? linkedProviders : provider === 'guest' ? [] : [provider],
      security: {
        twoFactorEnabled: false,
        passkeysCount: 0,
        agentTokens: 0
      },
      metadata: {
        createdAt: now,
        lastLoginAt: now,
        keepSignedIn,
        sessionId: this._generateSessionId()
      }
    };
  }

  _mapFirebaseError(error) {
    const code = error?.code || '';
    switch (code) {
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please check your credentials and try again.';
      case 'auth/user-not-found':
        return 'No RigCheck account found with that email address.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists. Try signing in instead.';
      case 'auth/weak-password':
        return 'Password is too weak. Use at least 8 characters with mixed case and numbers.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please wait a moment and try again.';
      default:
        return error?.message || 'Authentication error. Please try again.';
    }
  }

  _isSandboxFallbackError(error) {
    const code = error?.code || '';
    return [
      'auth/operation-not-allowed',
      'auth/configuration-not-found',
      'auth/unauthorized-domain',
      'auth/popup-blocked',
      'auth/popup-closed-by-user',
      'auth/cancelled-popup-request',
      'auth/network-request-failed',
      'auth/admin-restricted-operation'
    ].includes(code);
  }

  /**
   * 1. Sign In with Email & Password
   */
  async signInWithEmail({ email, password, keepSignedIn = true }) {
    const cleanEmail = email.trim().toLowerCase();

    // Check sandbox registry first if user previously registered in fallback mode
    if (this._sandboxRegistry.has(cleanEmail)) {
      const record = this._sandboxRegistry.get(cleanEmail);
      if (record.password !== password) {
        throw new Error('Invalid email or password. Please check your credentials.');
      }
      return {
        session: {
          ...record.session,
          metadata: {
            ...record.session.metadata,
            lastLoginAt: new Date().toISOString(),
            keepSignedIn
          }
        },
        notice: 'Signed in via RigCheck Local AuthAdapter.'
      };
    }

    if (this.auth) {
      try {
        const cred = await signInWithEmailAndPassword(this.auth, cleanEmail, password);
        const cloudProf = await this._readCloudProfile(cred.user.uid);
        const derivedName =
          cloudProf?.displayName || cred.user.displayName || cleanEmail.split('@')[0];
        const session = this._buildSession({
          uid: cred.user.uid,
          email: cred.user.email,
          displayName: derivedName,
          handle: cloudProf?.handle || derivedName,
          provider: 'credentials',
          adapterMode: 'firebase-cloud',
          isPublicProfile: cloudProf?.isPublicProfile ?? true,
          keepSignedIn
        });
        return { session, notice: 'Authenticated via Firebase Auth.' };
      } catch (err) {
        // Real credential errors should surface cleanly unless email auth is disabled in sandbox
        if (
          !this._isSandboxFallbackError(err) &&
          err?.code !== 'auth/invalid-credential' &&
          err?.code !== 'auth/user-not-found'
        ) {
          throw new Error(this._mapFirebaseError(err));
        }

        // If Email/Password provider isn't enabled in this sandbox, smoothly bridge via cloud anon or local adapter
        if (this._isSandboxFallbackError(err)) {
          const cloudUser = await this._ensureCloudSession();
          const fallbackUid = cloudUser?.uid || `local_${Date.now().toString(36)}`;
          const baseName = cleanEmail.split('@')[0].replace(/[._-]+/g, ' ');
          const displayName = baseName.replace(/\b\w/g, c => c.toUpperCase());
          const session = this._buildSession({
            uid: fallbackUid,
            email: cleanEmail,
            displayName,
            handle: cleanEmail.split('@')[0],
            provider: 'credentials',
            adapterMode: 'local-sandbox-adapter',
            isPublicProfile: true,
            keepSignedIn
          });
          await this._syncProfileToCloud(fallbackUid, {
            displayName: session.displayName,
            handle: session.handle,
            isPublicProfile: session.isPublicProfile
          });
          return {
            session,
            notice:
              'Email/Password provider is disabled in this preview sandbox; signed in seamlessly via RigCheck AuthAdapter fallback.'
          };
        }

        throw new Error(this._mapFirebaseError(err));
      }
    }

    // Pure offline/local adapter fallback
    const baseName = cleanEmail.split('@')[0].replace(/[._-]+/g, ' ');
    const displayName = baseName.replace(/\b\w/g, c => c.toUpperCase());
    return {
      session: this._buildSession({
        uid: `local_${Date.now().toString(36)}`,
        email: cleanEmail,
        displayName,
        handle: cleanEmail.split('@')[0],
        provider: 'credentials',
        adapterMode: 'local-sandbox-adapter',
        isPublicProfile: true,
        keepSignedIn
      }),
      notice: 'Signed in via RigCheck AuthAdapter.'
    };
  }

  /**
   * 2. Register New Account
   */
  async registerWithEmail({ displayName, handle, email, password, isPublicProfile }) {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = displayName.trim();
    const cleanHandle = this._sanitizeHandle(handle);

    if (this.auth) {
      try {
        const cred = await createUserWithEmailAndPassword(this.auth, cleanEmail, password);
        await updateProfile(cred.user, { displayName: cleanName }).catch(() => {});
        const session = this._buildSession({
          uid: cred.user.uid,
          email: cred.user.email,
          displayName: cleanName,
          handle: cleanHandle,
          provider: 'credentials',
          adapterMode: 'firebase-cloud',
          isPublicProfile
        });
        await this._syncProfileToCloud(cred.user.uid, {
          displayName: cleanName,
          handle: cleanHandle,
          isPublicProfile,
          createdAt: session.metadata.createdAt
        });
        return { session, notice: 'Account created and synced with Firebase Auth.' };
      } catch (err) {
        if (!this._isSandboxFallbackError(err)) {
          throw new Error(this._mapFirebaseError(err));
        }
        // Graceful fallback when sandbox disables Email/Password signup
        const cloudUser = await this._ensureCloudSession();
        const uid = cloudUser?.uid || `local_${Date.now().toString(36)}`;
        const session = this._buildSession({
          uid,
          email: cleanEmail,
          displayName: cleanName,
          handle: cleanHandle,
          provider: 'credentials',
          adapterMode: 'local-sandbox-adapter',
          isPublicProfile
        });
        this._sandboxRegistry.set(cleanEmail, { password, session });
        await this._syncProfileToCloud(uid, {
          displayName: cleanName,
          handle: cleanHandle,
          isPublicProfile
        });
        return {
          session,
          notice:
            'Account provisioned via RigCheck AuthAdapter fallback (Email/Password provider not enabled in preview environment).'
        };
      }
    }

    const session = this._buildSession({
      uid: `local_${Date.now().toString(36)}`,
      email: cleanEmail,
      displayName: cleanName,
      handle: cleanHandle,
      provider: 'credentials',
      adapterMode: 'local-sandbox-adapter',
      isPublicProfile
    });
    this._sandboxRegistry.set(cleanEmail, { password, session });
    return { session, notice: 'Account created in local AuthAdapter mode.' };
  }

  /**
   * 3. OAuth Provider Sign In (Google, GitHub, Discord)
   */
  async signInWithOAuth(providerKey) {
    const providerMeta = {
      google: { label: 'Google', name: 'Alex Mercer', handle: 'alexmercer_pc', email: 'alex.mercer@gmail.com' },
      github: { label: 'GitHub', name: 'DevBench_IO', handle: 'devbench_io', email: 'builder@users.noreply.github.com' },
      discord: { label: 'Discord', name: 'FramePacer#4070', handle: 'framepacer', email: 'framepacer@discord.rigcheck.app' }
    }[providerKey];

    // Attempt real Google OAuth popup first if Firebase is configured
    if (providerKey === 'google' && this.auth) {
      try {
        const gProvider = new GoogleAuthProvider();
        const cred = await signInWithPopup(this.auth, gProvider);
        const session = this._buildSession({
          uid: cred.user.uid,
          email: cred.user.email,
          displayName: cred.user.displayName || 'Google Builder',
          handle: (cred.user.displayName || 'builder').replace(/\s+/g, '_'),
          provider: 'google',
          adapterMode: 'firebase-cloud',
          isPublicProfile: true
        });
        await this._syncProfileToCloud(cred.user.uid, {
          displayName: session.displayName,
          handle: session.handle,
          isPublicProfile: true
        });
        return { session, notice: 'Authenticated via Google OAuth.' };
      } catch (err) {
        if (!this._isSandboxFallbackError(err)) {
          throw new Error(this._mapFirebaseError(err));
        }
        // Fall through to graceful adapter session below
      }
    }

    // Graceful sandbox OAuth adapter for GitHub, Discord, or iframe-restricted Google popups
    const cloudUser = await this._ensureCloudSession();
    const uid = cloudUser?.uid || `oauth_${providerKey}_${Date.now().toString(36)}`;
    const session = this._buildSession({
      uid,
      email: providerMeta.email,
      displayName: providerMeta.name,
      handle: providerMeta.handle,
      provider: providerKey,
      adapterMode: 'local-sandbox-adapter',
      isPublicProfile: true
    });
    await this._syncProfileToCloud(uid, {
      displayName: session.displayName,
      handle: session.handle,
      isPublicProfile: true
    });
    return {
      session,
      notice: `${providerMeta.label} OAuth completed via RigCheck AuthAdapter (ready for NextAuth ${providerMeta.label}Provider keys).`
    };
  }

  /**
   * 4. Guest / Anonymous Quick Check Access
   */
  async signInAsGuest() {
    let uid = `guest_${Date.now().toString(36)}`;
    let adapterMode = 'local-sandbox-adapter';

    if (this.auth) {
      try {
        const user = await this._ensureCloudSession();
        if (user?.uid) {
          uid = user.uid;
          adapterMode = 'firebase-cloud';
        }
      } catch {
        // Fallback silently to local guest ID
      }
    }

    return {
      session: this._buildSession({
        uid,
        email: null,
        displayName: 'Guest Builder',
        handle: 'guest_session',
        role: 'GUEST',
        provider: 'guest',
        adapterMode,
        isPublicProfile: false,
        linkedProviders: [],
        keepSignedIn: false
      }),
      notice: 'Entered Guest Mode. You can run instant compatibility checks without saving rigs.'
    };
  }

  /**
   * 5. Password Reset Dispatch
   */
  async requestPasswordReset(email) {
    const cleanEmail = email.trim().toLowerCase();
    if (this.auth) {
      try {
        await sendPasswordResetEmail(this.auth, cleanEmail);
        return {
          delivered: true,
          message: `Password reset link sent to ${cleanEmail}. Check your inbox and spam folder.`
        };
      } catch (err) {
        if (!this._isSandboxFallbackError(err) && err?.code !== 'auth/user-not-found') {
          throw new Error(this._mapFirebaseError(err));
        }
      }
    }
    return {
      delivered: true,
      message: `If an account exists for ${cleanEmail}, a password reset link has been queued via RigCheck Mailer.`
    };
  }

  /**
   * 6. Update Profile Privacy Preference
   */
  async updatePrivacyPreference(uid, isPublicProfile) {
    await this._syncProfileToCloud(uid, { isPublicProfile });
  }

  /**
   * 7. Sign Out
   */
  async signOut() {
    if (this.auth && this.auth.currentUser) {
      try {
        await firebaseSignOut(this.auth);
      } catch {
        // Ignore signout errors in sandbox
      }
    }
  }
}

const authService = new RigCheckAuthService(auth, db, appId);

// ============================================================================
// 3. SAMPLE LIVE SHOWCASE RIG DATA (Left Panel Interactive Hardware Preview)
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
// 4. INLINE BRAND SVGS (Google, GitHub, Discord)
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
// 5. PASSWORD STRENGTH ANALYZER
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
// 6. SUB-COMPONENT: BACKEND & AUTH ARCHITECTURE SLIDE-OVER DRAWER
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
      {/* Backdrop click to close */}
      <div className="flex-1" onClick={onClose} aria-hidden="true" />

      {/* Slide-over Panel */}
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
                Pluggable AuthAdapter • NextAuth.js + Prisma + PostgreSQL Ready
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

        {/* Drawer Tabs */}
        <div className="px-6 pt-4 flex flex-wrap gap-2 border-b border-slate-800/80 pb-3">
          {[
            { id: 'adapter', label: 'AuthAdapter Pattern', icon: Code2 },
            { id: 'prisma', label: 'NextAuth + Prisma Schema', icon: Database },
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

        {/* Drawer Content */}
        <div className="p-6 space-y-5 flex-1 text-sm">
          {activeCodeTab === 'adapter' && (
            <>
              <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-xs text-cyan-100 leading-relaxed">
                <strong className="text-cyan-300">Zero-Rewrite Migration Design:</strong> All login, registration, OAuth, password reset, and privacy controls call <code className="text-cyan-300 font-mono">RigCheckAuthService</code>. Swap the underlying adapter from Firebase to NextAuth.js without changing any UI components.
              </div>

              <div className="rounded-xl bg-[#070b14] border border-slate-800 overflow-hidden">
                <div className="px-4 py-2 border-b border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                  <span>lib/auth/AuthAdapter.ts</span>
                  <span className="text-emerald-400">TypeScript Contract</span>
                </div>
                <pre className="p-4 text-[11px] leading-relaxed font-mono text-slate-300 overflow-x-auto">
{`export interface RigCheckSession {
  uid: string;
  email: string | null;
  displayName: string;
  handle: string;
  role: 'USER' | 'GUEST' | 'MODERATOR' | 'ADMIN';
  provider: 'credentials' | 'google' | 'github' | 'discord' | 'guest';
  isPublicProfile: boolean;
  linkedProviders: string[];
  security: {
    twoFactorEnabled: boolean;
    passkeysCount: number;
    agentTokens: number;
  };
}

export interface AuthAdapter {
  signInWithEmail(input: CredentialsInput): Promise<AuthResult>;
  registerWithEmail(input: RegisterInput): Promise<AuthResult>;
  signInWithOAuth(provider: 'google' | 'github' | 'discord'): Promise<AuthResult>;
  signInAsGuest(): Promise<AuthResult>;
  requestPasswordReset(email: string): Promise<ResetResult>;
  linkProvider(uid: string, provider: string): Promise<void>;
  enrollPasskey(uid: string): Promise<WebAuthnCredential>;
  signOut(): Promise<void>;
}`}
                </pre>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#111827] border border-slate-800">
                  <div className="font-bold text-emerald-400 mb-1">Active MVP Adapter</div>
                  <p className="text-slate-400 leading-relaxed">
                    Firebase Authentication + Firestore user profile sync with automatic sandbox fallback if an OAuth or Email provider isn't enabled.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#111827] border border-slate-800">
                  <div className="font-bold text-violet-400 mb-1">Production Target Adapter</div>
                  <p className="text-slate-400 leading-relaxed">
                    Next.js App Router + NextAuth.js v5 (Auth.js) + PrismaAdapter on Supabase PostgreSQL with HTTP-only JWT/database sessions.
                  </p>
                </div>
              </div>
            </>
          )}

          {activeCodeTab === 'prisma' && (
            <>
              <p className="text-xs text-slate-400 leading-relaxed">
                Drop-in Prisma schema extending NextAuth’s standard <code className="text-cyan-300">User</code>, <code className="text-cyan-300">Account</code>, and <code className="text-cyan-300">Session</code> models with RigCheck’s public handles, RBAC roles, privacy toggles, Passkeys, and Desktop Agent API tokens.
              </p>

              <div className="rounded-xl bg-[#070b14] border border-slate-800 overflow-hidden">
                <div className="px-4 py-2 border-b border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                  <span>prisma/schema.prisma</span>
                  <span className="text-cyan-400">PostgreSQL (Supabase)</span>
                </div>
                <pre className="p-4 text-[11px] leading-relaxed font-mono text-slate-300 overflow-x-auto">
{`enum Role { USER MODERATOR ADMIN }

model User {
  id                String          @id @default(cuid())
  name              String?
  handle            String          @unique
  email             String?         @unique
  emailVerified     DateTime?
  passwordHash      String?         // Argon2id for Credentials login
  role              Role            @default(USER)
  isPublicProfile   Boolean         @default(true)
  visibleSpecFields Json            @default("{\"cpu\":true,\"gpu\":true}")
  twoFactorEnabled  Boolean         @default(false)

  accounts          Account[]       // Google, GitHub, Discord, Steam, Epic
  sessions          Session[]
  authenticators    Authenticator[] // WebAuthn / Passkeys
  agentTokens       AgentApiToken[] // Desktop hardware scanner keys
  rigs              SavedRig[]
  reviews           ComponentReview[]
  createdAt         DateTime        @default(now())
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  access_token      String? @db.Text
  refresh_token     String? @db.Text
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  userAgent    String?
  ipHash       String?
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model AgentApiToken {
  id         String    @id @default(cuid())
  userId     String
  label      String
  tokenHash  String    @unique
  lastUsedAt DateTime?
  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}`}
                </pre>
              </div>
            </>
          )}

          {activeCodeTab === 'roadmap' && (
            <div className="space-y-3">
              {[
                {
                  icon: Fingerprint,
                  badge: 'Phase 2 • Security',
                  tone: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
                  title: 'Passkeys (WebAuthn) & TOTP 2FA',
                  desc: 'Passwordless biometric sign-in via Windows Hello, Touch ID, and hardware security keys using SimpleWebAuthn + Prisma Authenticator model.'
                },
                {
                  icon: Gamepad2,
                  badge: 'Phase 3 • Integrations',
                  tone: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30',
                  title: 'Steam & Epic Games Library OAuth Sync',
                  desc: 'Link Steam OpenID / Epic Games OAuth accounts to automatically import a user’s owned game library and badge every title with instant compatibility status.'
                },
                {
                  icon: Terminal,
                  badge: 'Phase 4 • Ecosystem',
                  tone: 'text-violet-400 bg-violet-500/15 border-violet-500/30',
                  title: 'RigCheck Desktop Agent API Tokens',
                  desc: 'Scoped personal access tokens (rgc_live_...) allowing a lightweight Rust/Electron companion tray app to read CPU, GPU, VRAM, RAM, and driver versions automatically.'
                },
                {
                  icon: ShieldCheck,
                  badge: 'Phase 5 • Governance',
                  tone: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
                  title: 'Role-Based Access Control (RBAC) & Verified Reviewers',
                  desc: 'Hardware-verified review badges for users whose Desktop Agent confirms ownership of the reviewed CPU, GPU, or laptop model.'
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
// 7. SUB-COMPONENT: POST-LOGIN AUTHENTICATED SESSION HANDOFF SCREEN
// ============================================================================
function AuthenticatedSessionView({
  session,
  onUpdateSession,
  onSignOut,
  onOpenArchitecture,
  showToast
}) {
  const [activeSection, setActiveSection] = useState('overview'); // 'overview' | 'security'
  const [signingOut, setSigningOut] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [generatedToken, setGeneratedToken] = useState(null);

  const isGuest = session.role === 'GUEST';

  const handleTogglePrivacy = async () => {
    if (isGuest) {
      showToast('Create a free account to publish a shareable RigCheck profile.', 'info');
      return;
    }
    const nextPublic = !session.isPublicProfile;
    onUpdateSession({ ...session, isPublicProfile: nextPublic });
    await authService.updatePrivacyPreference(session.uid, nextPublic);
    showToast(`Public profile set to ${nextPublic ? 'Public' : 'Private'}.`);
  };

  const handleToggleProviderLink = providerKey => {
    if (isGuest) {
      showToast('Sign in with a full account to link OAuth providers.', 'info');
      return;
    }
    const linked = session.linkedProviders || [];
    const isLinked = linked.includes(providerKey);
    if (isLinked && linked.length === 1 && session.provider === providerKey) {
      showToast('Cannot unlink your only active sign-in method.', 'error');
      return;
    }
    const nextLinked = isLinked
      ? linked.filter(p => p !== providerKey)
      : [...linked, providerKey];
    onUpdateSession({ ...session, linkedProviders: nextLinked });
    showToast(
      isLinked
        ? `Unlinked ${providerKey} account.`
        : `Linked ${providerKey} provider to your RigCheck account.`
    );
  };

  const handleToggle2FA = () => {
    if (isGuest) return;
    const next = !session.security.twoFactorEnabled;
    onUpdateSession({
      ...session,
      security: { ...session.security, twoFactorEnabled: next }
    });
    showToast(next ? '2FA authenticator preview enabled.' : '2FA authenticator disabled.');
  };

  const handleEnrollPasskey = () => {
    if (isGuest) return;
    const nextCount = session.security.passkeysCount + 1;
    onUpdateSession({
      ...session,
      security: { ...session.security, passkeysCount: nextCount }
    });
    showToast(`Registered Passkey #${nextCount} (WebAuthn hook ready).`);
  };

  const handleGenerateAgentToken = () => {
    if (isGuest) return;
    const rand = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const token = `rgc_live_${rand.slice(0, 24)}`;
    setGeneratedToken(token);
    onUpdateSession({
      ...session,
      security: { ...session.security, agentTokens: session.security.agentTokens + 1 }
    });
    showToast('Generated scoped Desktop Agent API token preview.');
  };

  const handleSignOutClick = async () => {
    setSigningOut(true);
    await onSignOut();
    setSigningOut(false);
  };

  const handleCopyProfileUrl = () => {
    const url = `https://rigcheck.app/u/${session.handle}`;
    if (navigator.clipboard) navigator.clipboard.writeText(url).catch(() => {});
    setCopiedUrl(true);
    showToast('Copied public profile URL to clipboard!');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const providerLabelMap = {
    credentials: 'Email & Password',
    google: 'Google OAuth',
    github: 'GitHub OAuth',
    discord: 'Discord OAuth',
    guest: 'Guest Session'
  };

  const initials = (session.displayName || 'RC')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Top Bar */}
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
                Session Authenticated
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
              className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              {signingOut ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Session Ready Card */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
        {/* Identity Hero Card */}
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
                    Session Ready
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    {providerLabelMap[session.provider] || session.provider}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-slate-800 text-slate-300 border border-slate-700">
                    Role: {session.role}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight truncate">
                  Welcome, {session.displayName}
                </h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1">
                  <span className="font-mono text-cyan-300">@{session.handle}</span>
                  <span>•</span>
                  <span>{session.email || 'Anonymous Guest Session'}</span>
                </div>
              </div>
            </div>

            {/* Privacy Pill & Launch Action */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleTogglePrivacy}
                className={`px-4 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  session.isPublicProfile
                    ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-300 hover:bg-emerald-500/20'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                {session.isPublicProfile ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                Profile: {session.isPublicProfile ? 'Public' : 'Private'}
              </button>

              {!isGuest && (
                <button
                  type="button"
                  onClick={handleCopyProfileUrl}
                  className="px-4 py-2 rounded-xl bg-[#070b14] hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono flex items-center justify-center gap-2 transition-colors"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                  rigcheck.app/u/{session.handle}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Section Tabs */}
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
            Security & Linked Accounts
          </button>
        </div>

        {/* TAB 1: SESSION OVERVIEW */}
        {activeSection === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Capabilities Grid */}
            <div className="lg:col-span-8 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[
                  {
                    icon: Sliders,
                    title: 'Instant Compatibility Engine',
                    desc: 'Check CPU, GPU, VRAM, RAM, and SSD requirements across AAA games & creative suites.',
                    unlocked: true
                  },
                  {
                    icon: Laptop,
                    title: 'Multi-Rig Cloud Profiles',
                    desc: 'Save & switch between your Primary Desktop, Gaming Laptop, and Secondary builds.',
                    unlocked: !isGuest
                  },
                  {
                    icon: Star,
                    title: 'Community Hardware Reviews',
                    desc: 'Publish, edit, and tag real-world reviews for CPUs, GPUs, and complete setups.',
                    unlocked: !isGuest
                  },
                  {
                    icon: Shield,
                    title: 'Granular Profile Privacy',
                    desc: 'Toggle individual saved rigs, spec fields, and reviews on your shareable URL.',
                    unlocked: !isGuest
                  }
                ].map(cap => {
                  const Icon = cap.icon;
                  return (
                    <div
                      key={cap.title}
                      className={`p-4 rounded-2xl border transition-all ${
                        cap.unlocked
                          ? 'bg-[#111827] border-slate-800'
                          : 'bg-[#0c111d] border-slate-800/60 opacity-75'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="w-9 h-9 rounded-xl bg-[#070b14] border border-slate-800 flex items-center justify-center">
                          <Icon className={`w-4 h-4 ${cap.unlocked ? 'text-cyan-400' : 'text-slate-500'}`} />
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            cap.unlocked
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {cap.unlocked ? 'Unlocked' : 'Account Required'}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white">{cap.title}</h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{cap.desc}</p>
                    </div>
                  );
                })}
              </div>

              {/* Action Handoff Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-violet-500/10 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {isGuest
                      ? 'Ready for a quick hardware check — or upgrade to save rigs'
                      : 'Your RigCheck session is synced and ready'}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {isGuest
                      ? 'Sign out to create a free account anytime to unlock cloud rig profiles & reviews.'
                      : 'Proceed straight to the Spec Builder, Hardware Reviews Hub, or your Privacy Dashboard.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    showToast(
                      isGuest
                        ? 'Handoff trigger: Launch RigCheck Spec Checker (Guest Session).'
                        : `Handoff trigger: Entering RigCheck Dashboard as @${session.handle}.`
                    )
                  }
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-cyan-500/20"
                >
                  Launch RigCheck App
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Session Metadata Card */}
            <div className="lg:col-span-4 rounded-2xl bg-[#111827] border border-slate-800 p-5 flex flex-col justify-between gap-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  Session Telemetry
                </h3>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between gap-2 py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-500">User UID</span>
                    <span className="font-mono text-slate-200 truncate max-w-[165px]" title={session.uid}>
                      {session.uid}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2 py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-500">Session ID</span>
                    <span className="font-mono text-cyan-300">{session.metadata.sessionId}</span>
                  </div>
                  <div className="flex justify-between gap-2 py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-500">Auth Adapter</span>
                    <span className="font-mono text-emerald-400">{session.adapterMode}</span>
                  </div>
                  <div className="flex justify-between gap-2 py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-500">Persistence</span>
                    <span className="text-slate-200">
                      {session.metadata.keepSignedIn ? 'Extended (30d)' : 'Session Only'}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2 py-1.5">
                    <span className="text-slate-500">Issued At</span>
                    <span className="text-slate-300">
                      {new Date(session.metadata.lastLoginAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSignOutClick}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                Sign Out & Return to Login
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: SECURITY & LINKED ACCOUNTS (Expansion Hooks) */}
        {activeSection === 'security' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Linked OAuth Providers */}
            <div className="lg:col-span-6 rounded-2xl bg-[#111827] border border-slate-800 p-5 space-y-4">
              <div>
                <h3 className="text-base font-bold text-white">Linked OAuth & Gaming Accounts</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Connect multiple sign-in methods or prepare library sync hooks for automated compatibility checks.
                </p>
              </div>

              <div className="space-y-2.5">
                {[
                  { key: 'google', name: 'Google', desc: 'Single sign-on & profile sync', icon: GoogleIcon, ready: true },
                  { key: 'github', name: 'GitHub', desc: 'Developer profile & OSS badge', icon: GitHubIcon, ready: true },
                  { key: 'discord', name: 'Discord', desc: 'Community rig showcase embeds', icon: DiscordIcon, ready: true }
                ].map(item => {
                  const Icon = item.icon;
                  const isLinked = (session.linkedProviders || []).includes(item.key);
                  return (
                    <div
                      key={item.key}
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
                      <button
                        type="button"
                        disabled={isGuest}
                        onClick={() => handleToggleProviderLink(item.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                          isGuest
                            ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                            : isLinked
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-rose-500/15 hover:border-rose-500/30 hover:text-rose-300'
                            : 'bg-slate-800 border-slate-700 text-slate-200 hover:border-cyan-500/50'
                        }`}
                      >
                        {isLinked ? 'Connected' : 'Link'}
                      </button>
                    </div>
                  );
                })}

                {/* Future Gaming Library Sync Placeholders */}
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
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-violet-500/10 border border-violet-500/30 text-violet-300 shrink-0">
                      Phase 3 Hook
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2FA, Passkeys & Desktop Agent API Tokens */}
            <div className="lg:col-span-6 space-y-4">
              <div className="rounded-2xl bg-[#111827] border border-slate-800 p-5 space-y-4">
                <h3 className="text-base font-bold text-white">Advanced Security Controls</h3>

                {/* Passkeys */}
                <div className="p-4 rounded-xl bg-[#070b14] border border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Fingerprint className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-semibold text-white">Passkeys (WebAuthn)</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {session.security.passkeysCount > 0
                          ? `${session.security.passkeysCount} passkey(s) registered for biometric login.`
                          : 'Sign in with Touch ID, Windows Hello, or YubiKey.'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isGuest}
                    onClick={handleEnrollPasskey}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 ${
                      isGuest
                        ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                        : 'bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300'
                    }`}
                  >
                    + Add Passkey
                  </button>
                </div>

                {/* 2FA */}
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
                    disabled={isGuest}
                    onClick={handleToggle2FA}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 border ${
                      isGuest
                        ? 'bg-slate-800 border-slate-800 text-slate-600 cursor-not-allowed'
                        : session.security.twoFactorEnabled
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-200 hover:border-cyan-500/50'
                    }`}
                  >
                    {session.security.twoFactorEnabled ? 'Enabled' : 'Enable 2FA'}
                  </button>
                </div>
              </div>

              {/* Desktop Agent API Token Preview */}
              <div className="rounded-2xl bg-[#111827] border border-slate-800 p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-violet-400" />
                    <h3 className="text-sm font-bold text-white">Desktop Agent API Tokens</h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    {session.security.agentTokens} active
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
                  disabled={isGuest}
                  onClick={handleGenerateAgentToken}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                    isGuest
                      ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                      : 'bg-violet-500/15 hover:bg-violet-500/25 border-violet-500/40 text-violet-300'
                  }`}
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
// 8. MAIN APPLICATION COMPONENT (Split-Screen Login & Auth Page)
// ============================================================================
export default function App() {
  // --- Auth Session State ---
  const [session, setSession] = useState(null);

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
  const [loadingAction, setLoadingAction] = useState(null); // null | 'signin' | 'register' | 'reset' | 'google' | 'github' | 'discord' | 'guest'
  const [formError, setFormError] = useState('');
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

  // Clear inline errors when switching auth tabs
  const switchMode = nextMode => {
    setMode(nextMode);
    setFormError('');
    setResetSentMsg('');
  };

  // Auto-generate clean handle from display name until user edits handle directly
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

  // --- Form Submission Handlers ---
  const handleSignInSubmit = async e => {
    e.preventDefault();
    setFormError('');

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
      const res = await authService.signInWithEmail({
        email: signInEmail,
        password: signInPassword,
        keepSignedIn
      });
      setSession(res.session);
      showToast(res.notice, 'success');
    } catch (err) {
      setFormError(err.message || 'Unable to sign in.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRegisterSubmit = async e => {
    e.preventDefault();
    setFormError('');

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
      const res = await authService.registerWithEmail({
        displayName: regName,
        handle: cleanHandlePreview,
        email: regEmail,
        password: regPassword,
        isPublicProfile: regPublicProfile
      });
      setSession(res.session);
      showToast(res.notice, 'success');
    } catch (err) {
      setFormError(err.message || 'Unable to create account.');
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
      const res = await authService.requestPasswordReset(resetEmail);
      setResetSentMsg(res.message);
      showToast('Password reset instructions dispatched.', 'info');
    } catch (err) {
      setFormError(err.message || 'Could not process password reset.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleOAuthClick = async providerKey => {
    setFormError('');
    setLoadingAction(providerKey);
    try {
      const res = await authService.signInWithOAuth(providerKey);
      setSession(res.session);
      showToast(res.notice, 'success');
    } catch (err) {
      setFormError(err.message || `Could not sign in with ${providerKey}.`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleGuestClick = async () => {
    setFormError('');
    setLoadingAction('guest');
    try {
      const res = await authService.signInAsGuest();
      setSession(res.session);
      showToast(res.notice, 'info');
    } catch (err) {
      setFormError('Unable to enter guest mode right now.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSignOut = async () => {
    await authService.signOut();
    setSession(null);
    setSignInPassword('');
    setFormError('');
    showToast('Signed out cleanly. See you on the next benchmark!', 'info');
  };

  const isBusy = Boolean(loadingAction);

  // ==========================================================================
  // RENDER: AUTHENTICATED SESSION HANDOFF OR SPLIT-SCREEN LOGIN PAGE
  // ==========================================================================
  return (
    <div
      className="min-h-screen bg-[#070b14] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-x-hidden"
      style={{
        backgroundImage:
          'linear-gradient(to right, rgba(30, 41, 59, 0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(30, 41, 59, 0.22) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }}
    >
      {/* Subtle Ambient Corner Glows */}
      <div className="fixed -top-40 -left-40 w-[30rem] h-[30rem] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-40 -right-40 w-[32rem] h-[32rem] bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      {session ? (
        <div className="relative z-10">
          <AuthenticatedSessionView
            session={session}
            onUpdateSession={setSession}
            onSignOut={handleSignOut}
            onOpenArchitecture={() => setShowArchDrawer(true)}
            showToast={showToast}
          />
        </div>
      ) : (
        <div className="relative z-10 min-h-screen flex flex-col justify-between">
          {/* Compact Mobile Header (visible below lg) */}
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

          {/* Main Split-Screen Grid */}
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* ===============================================================
                LEFT SHOWCASE PANEL (Desktop lg+, rich interactive rig preview)
               =============================================================== */}
            <section className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-center space-y-7 pr-2">
              {/* Brand Row */}
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
                  Live Engine v2.0
                </span>
              </div>

              {/* Bold Headline */}
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

              {/* Interactive Live Hardware Snapshot Card */}
              <div className="rounded-3xl bg-[#0d1424]/95 border border-slate-800/90 p-5 shadow-2xl shadow-black/50 space-y-4 relative overflow-hidden">
                {/* Top Accent Strip */}
                <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-cyan-500 via-emerald-400 to-violet-500" />

                {/* Rig Switcher + Privacy Toggle Preview */}
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

                  {/* Interactive Mini Privacy Toggle Preview */}
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

                {/* Specs + Benchmark Score */}
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

                {/* Live Compatibility Rows */}
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

              {/* Account Perks Bullets */}
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

            {/* ===============================================================
                RIGHT AUTHENTICATION CARD
               =============================================================== */}
            <section className="lg:col-span-6 xl:col-span-5 w-full max-w-md mx-auto lg:max-w-none">
              <div className="rounded-3xl bg-[#0e1525]/95 backdrop-blur-xl border border-slate-800/90 p-6 sm:p-8 shadow-2xl shadow-black/60 relative">
                {/* Mobile Headline Snippet */}
                <div className="lg:hidden mb-5">
                  <h1 className="text-xl font-extrabold text-white tracking-tight">
                    Know what your rig can run.{' '}
                    <span className="text-cyan-400">Sync every build.</span>
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Save PC profiles, detect hardware bottlenecks, and share community reviews.
                  </p>
                </div>

                {/* Mode Switcher (Hidden during Reset Password view) */}
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

                {/* Inline Error Alert */}
                {formError && (
                  <div
                    role="alert"
                    className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/35 text-rose-200 text-xs flex items-start gap-2.5"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span className="leading-snug">{formError}</span>
                  </div>
                )}

                {/* Social / OAuth Provider Buttons (Visible in Sign In & Register) */}
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

                {/* ===========================================================
                    VIEW A: SIGN IN FORM
                   =========================================================== */}
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

                {/* ===========================================================
                    VIEW B: CREATE ACCOUNT FORM
                   =========================================================== */}
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

                    {/* Live Public Profile URL Preview */}
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

                      {/* Live Strength Meter & Requirement Checklist */}
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

                    {/* Initial Privacy Preference Toggle */}
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

                {/* ===========================================================
                    VIEW C: RESET PASSWORD INLINE VIEW
                   =========================================================== */}
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

                {/* ===========================================================
                    GUEST QUICK CHECK CTA
                   =========================================================== */}
                <div className="mt-6 pt-5 border-t border-slate-800/90 space-y-2.5">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={handleGuestClick}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#070b14] hover:bg-slate-800/90 border border-slate-700/80 hover:border-cyan-500/40 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {loadingAction === 'guest' ? (
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                    ) : (
                      <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                    Continue as Guest (Quick Check)
                  </button>
                  <p className="text-[11px] text-center text-slate-500 leading-relaxed">
                    Guests can run instant game & software compatibility checks without saving device profiles or reviews.
                  </p>
                </div>
              </div>
            </section>
          </main>

          {/* Subtle Footer with Auth Architecture Blueprint Trigger */}
          <footer className="border-t border-slate-800/70 bg-[#070b14]/80 backdrop-blur-md py-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>RigCheck Identity Gateway • Encrypted Session Layer</span>
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

      {/* Developer Backend & Auth Blueprint Slide-Over Modal */}
      <AuthArchitectureDrawer
        open={showArchDrawer}
        onClose={() => setShowArchDrawer(false)}
      />

      {/* Toast Notification Banner */}
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