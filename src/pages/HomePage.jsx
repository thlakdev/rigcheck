import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Cpu,
  Monitor,
  HardDrive,
  Layers,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Star,
  Shield,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Edit3,
  Save,
  Share2,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Sliders,
  Gamepad2,
  Sparkles,
  Briefcase,
  Laptop,
  History,
  User,
  LogOut,
  LogIn,
  X,
  ExternalLink,
  Zap,
  Gauge,
  Filter,
  ArrowUpRight,
  Info,
  MessageSquare,
  Database,
  Server,
  Award,
  Wrench,
  RefreshCw,
  Globe,
  ArrowLeft,
  MemoryStick,
  Terminal,
  CopyCheck
} from 'lucide-react';
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  onSnapshot,
  collection
} from 'firebase/firestore';

// ============================================================================
// 1. CLOUD INFRASTRUCTURE INITIALIZATION (Safe Module-Level Singleton)
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
} catch (initError) {
  console.error('Backend initialization fallback to in-memory mode:', initError);
}

// ============================================================================
// 2. INITIAL SEED DATA (Mirrors PostgreSQL / Prisma Seed Tables)
// ============================================================================

/**
 * Table: HardwareComponent (type = 'CPU') — 18 CPUs
 * Benchmark scale: 0 - 1000
 */
const SEED_CPUS = [
  { id: 'cpu-i3-12100f', name: 'Intel Core i3-12100F', brand: 'Intel', category: 'Desktop', cores: 4, threads: 8, tdp: 58, score: 420, baseRating: 4.5, msrp: 99 },
  { id: 'cpu-i5-12400f', name: 'Intel Core i5-12400F', brand: 'Intel', category: 'Desktop', cores: 6, threads: 12, tdp: 65, score: 560, baseRating: 4.7, msrp: 135 },
  { id: 'cpu-i5-13600k', name: 'Intel Core i5-13600K', brand: 'Intel', category: 'Desktop', cores: 14, threads: 20, tdp: 125, score: 770, baseRating: 4.8, msrp: 289 },
  { id: 'cpu-i5-14600k', name: 'Intel Core i5-14600K', brand: 'Intel', category: 'Desktop', cores: 14, threads: 20, tdp: 125, score: 795, baseRating: 4.6, msrp: 309 },
  { id: 'cpu-i7-13700k', name: 'Intel Core i7-13700K', brand: 'Intel', category: 'Desktop', cores: 16, threads: 24, tdp: 125, score: 855, baseRating: 4.6, msrp: 369 },
  { id: 'cpu-i7-14700k', name: 'Intel Core i7-14700K', brand: 'Intel', category: 'Desktop', cores: 20, threads: 28, tdp: 125, score: 905, baseRating: 4.5, msrp: 399 },
  { id: 'cpu-i9-14900k', name: 'Intel Core i9-14900K', brand: 'Intel', category: 'Desktop', cores: 24, threads: 32, tdp: 125, score: 970, baseRating: 4.3, msrp: 549 },
  { id: 'cpu-ultra7-155h', name: 'Intel Core Ultra 7 155H', brand: 'Intel', category: 'Laptop', cores: 16, threads: 22, tdp: 28, score: 660, baseRating: 4.4, msrp: 0 },
  { id: 'cpu-r5-3600', name: 'AMD Ryzen 5 3600', brand: 'AMD', category: 'Desktop', cores: 6, threads: 12, tdp: 65, score: 410, baseRating: 4.7, msrp: 89 },
  { id: 'cpu-r5-5600x', name: 'AMD Ryzen 5 5600X', brand: 'AMD', category: 'Desktop', cores: 6, threads: 12, tdp: 65, score: 575, baseRating: 4.8, msrp: 145 },
  { id: 'cpu-r5-7600x', name: 'AMD Ryzen 5 7600X', brand: 'AMD', category: 'Desktop', cores: 6, threads: 12, tdp: 105, score: 710, baseRating: 4.7, msrp: 219 },
  { id: 'cpu-r7-5800x3d', name: 'AMD Ryzen 7 5800X3D', brand: 'AMD', category: 'Desktop', cores: 8, threads: 16, tdp: 105, score: 785, baseRating: 4.9, msrp: 319 },
  { id: 'cpu-r7-7800x3d', name: 'AMD Ryzen 7 7800X3D', brand: 'AMD', category: 'Desktop', cores: 8, threads: 16, tdp: 120, score: 915, baseRating: 4.9, msrp: 389 },
  { id: 'cpu-r7-8840u', name: 'AMD Ryzen 7 8840U', brand: 'AMD', category: 'Laptop', cores: 8, threads: 16, tdp: 28, score: 635, baseRating: 4.6, msrp: 0 },
  { id: 'cpu-r9-7950x', name: 'AMD Ryzen 9 7950X', brand: 'AMD', category: 'Desktop', cores: 16, threads: 32, tdp: 170, score: 950, baseRating: 4.8, msrp: 549 },
  { id: 'cpu-r9-9950x', name: 'AMD Ryzen 9 9950X', brand: 'AMD', category: 'Desktop', cores: 16, threads: 32, tdp: 170, score: 995, baseRating: 4.8, msrp: 649 },
  { id: 'cpu-apple-m2', name: 'Apple M2', brand: 'Apple', category: 'Laptop', cores: 8, threads: 8, tdp: 20, score: 590, baseRating: 4.7, msrp: 0 },
  { id: 'cpu-apple-m3-pro', name: 'Apple M3 Pro', brand: 'Apple', category: 'Laptop', cores: 12, threads: 12, tdp: 30, score: 765, baseRating: 4.8, msrp: 0 }
].map(item => ({ ...item, type: 'CPU' }));

/**
 * Table: HardwareComponent (type = 'GPU') — 18 GPUs
 * Benchmark scale: 0 - 1000
 */
const SEED_GPUS = [
  { id: 'gpu-uhd-730', name: 'Intel UHD Graphics 730', brand: 'Intel', category: 'Integrated', vramGB: 2, tdp: 15, score: 75, baseRating: 3.1, msrp: 0 },
  { id: 'gpu-radeon-780m', name: 'AMD Radeon 780M', brand: 'AMD', category: 'Integrated', vramGB: 4, tdp: 28, score: 215, baseRating: 4.6, msrp: 0 },
  { id: 'gpu-gtx-1050ti', name: 'NVIDIA GeForce GTX 1050 Ti', brand: 'NVIDIA', category: 'Desktop', vramGB: 4, tdp: 75, score: 205, baseRating: 4.3, msrp: 139 },
  { id: 'gpu-gtx-1650', name: 'NVIDIA GeForce GTX 1650', brand: 'NVIDIA', category: 'Desktop', vramGB: 4, tdp: 75, score: 260, baseRating: 4.1, msrp: 149 },
  { id: 'gpu-gtx-1660s', name: 'NVIDIA GeForce GTX 1660 Super', brand: 'NVIDIA', category: 'Desktop', vramGB: 6, tdp: 125, score: 385, baseRating: 4.6, msrp: 229 },
  { id: 'gpu-rtx-2060', name: 'NVIDIA GeForce RTX 2060', brand: 'NVIDIA', category: 'Desktop', vramGB: 6, tdp: 160, score: 445, baseRating: 4.5, msrp: 299 },
  { id: 'gpu-rtx-3050', name: 'NVIDIA GeForce RTX 3050', brand: 'NVIDIA', category: 'Desktop', vramGB: 8, tdp: 130, score: 415, baseRating: 3.8, msrp: 249 },
  { id: 'gpu-rtx-3060', name: 'NVIDIA GeForce RTX 3060', brand: 'NVIDIA', category: 'Desktop', vramGB: 12, tdp: 170, score: 540, baseRating: 4.7, msrp: 289 },
  { id: 'gpu-rtx-3070', name: 'NVIDIA GeForce RTX 3070', brand: 'NVIDIA', category: 'Desktop', vramGB: 8, tdp: 220, score: 685, baseRating: 4.5, msrp: 499 },
  { id: 'gpu-rtx-4060', name: 'NVIDIA GeForce RTX 4060', brand: 'NVIDIA', category: 'Desktop', vramGB: 8, tdp: 115, score: 595, baseRating: 4.2, msrp: 299 },
  { id: 'gpu-rtx-4070s', name: 'NVIDIA GeForce RTX 4070 Super', brand: 'NVIDIA', category: 'Desktop', vramGB: 12, tdp: 220, score: 810, baseRating: 4.9, msrp: 599 },
  { id: 'gpu-rtx-4080s', name: 'NVIDIA GeForce RTX 4080 Super', brand: 'NVIDIA', category: 'Desktop', vramGB: 16, tdp: 320, score: 915, baseRating: 4.8, msrp: 999 },
  { id: 'gpu-rtx-4090', name: 'NVIDIA GeForce RTX 4090', brand: 'NVIDIA', category: 'Desktop', vramGB: 24, tdp: 450, score: 995, baseRating: 4.9, msrp: 1599 },
  { id: 'gpu-rx-6600', name: 'AMD Radeon RX 6600', brand: 'AMD', category: 'Desktop', vramGB: 8, tdp: 132, score: 495, baseRating: 4.7, msrp: 199 },
  { id: 'gpu-rx-6700xt', name: 'AMD Radeon RX 6700 XT', brand: 'AMD', category: 'Desktop', vramGB: 12, tdp: 230, score: 645, baseRating: 4.8, msrp: 329 },
  { id: 'gpu-rx-7700xt', name: 'AMD Radeon RX 7700 XT', brand: 'AMD', category: 'Desktop', vramGB: 12, tdp: 245, score: 725, baseRating: 4.6, msrp: 419 },
  { id: 'gpu-rx-7800xt', name: 'AMD Radeon RX 7800 XT', brand: 'AMD', category: 'Desktop', vramGB: 16, tdp: 263, score: 790, baseRating: 4.8, msrp: 499 },
  { id: 'gpu-rx-7900xtx', name: 'AMD Radeon RX 7900 XTX', brand: 'AMD', category: 'Desktop', vramGB: 24, tdp: 355, score: 935, baseRating: 4.7, msrp: 949 }
].map(item => ({ ...item, type: 'GPU' }));

const RAM_OPTIONS = [4, 8, 16, 32, 64, 128];

const STORAGE_OPTIONS = [
  { id: 'hdd-256', label: '256GB HDD', capacityGB: 256, isSSD: false, tier: 'Mechanical' },
  { id: 'sata-512', label: '512GB SATA SSD', capacityGB: 512, isSSD: true, tier: 'SATA III' },
  { id: 'nvme-1tb', label: '1TB NVMe SSD', capacityGB: 1000, isSSD: true, tier: 'NVMe Gen3' },
  { id: 'nvme-2tb', label: '2TB NVMe Gen4 SSD', capacityGB: 2000, isSSD: true, tier: 'NVMe Gen4' },
  { id: 'nvme-4tb', label: '4TB NVMe SSD', capacityGB: 4000, isSSD: true, tier: 'NVMe Gen4+' }
];

const OS_OPTIONS = ['Windows 11', 'Windows 10', 'macOS', 'Linux'];

const RIG_PRESETS = [
  {
    id: 'preset-budget',
    label: 'Budget Esports',
    tagline: '1080p Competitive',
    specs: { cpuId: 'cpu-i3-12100f', gpuId: 'gpu-rx-6600', ramGB: 16, storageId: 'sata-512', os: 'Windows 11' }
  },
  {
    id: 'preset-mid',
    label: 'Mid-Range 1440p',
    tagline: 'High-FPS Sweet Spot',
    specs: { cpuId: 'cpu-r5-7600x', gpuId: 'gpu-rtx-4070s', ramGB: 32, storageId: 'nvme-1tb', os: 'Windows 11' }
  },
  {
    id: 'preset-flagship',
    label: '4K Flagship',
    tagline: 'Uncompromised Ultra',
    specs: { cpuId: 'cpu-r7-7800x3d', gpuId: 'gpu-rtx-4090', ramGB: 64, storageId: 'nvme-4tb', os: 'Windows 11' }
  },
  {
    id: 'preset-ultrabook',
    label: 'Ultrabook Laptop',
    tagline: 'Portable Productivity',
    specs: { cpuId: 'cpu-r7-8840u', gpuId: 'gpu-radeon-780m', ramGB: 16, storageId: 'sata-512', os: 'Windows 11' }
  }
];

/**
 * Table: SoftwareTitle — 20 Popular Games & Applications
 */
const SEED_SOFTWARE = [
  // GAMES (12)
  {
    id: 'sw-cyberpunk',
    name: 'Cyberpunk 2077',
    category: 'Games',
    subcategory: 'AAA',
    releaseYear: 2023,
    description: 'Open-world action RPG featuring heavy crowd density, ray-traced lighting, and demanding GPU shaders.',
    min: { cpuScore: 410, gpuScore: 380, ramGB: 12, vramGB: 6, storageGB: 70 },
    rec: { cpuScore: 680, gpuScore: 650, ramGB: 16, vramGB: 8, storageGB: 70 },
    ssdRequired: true,
    supportedOS: ['Windows 11', 'Windows 10', 'Linux']
  },
  {
    id: 'sw-elden-ring',
    name: 'Elden Ring',
    category: 'Games',
    subcategory: 'AAA',
    releaseYear: 2022,
    description: 'Expansive fantasy action RPG requiring steady single-threaded CPU performance and 12GB+ RAM.',
    min: { cpuScore: 390, gpuScore: 350, ramGB: 12, vramGB: 4, storageGB: 60 },
    rec: { cpuScore: 560, gpuScore: 520, ramGB: 16, vramGB: 8, storageGB: 60 },
    ssdRequired: false,
    supportedOS: ['Windows 11', 'Windows 10', 'Linux']
  },
  {
    id: 'sw-rdr2',
    name: 'Red Dead Redemption 2',
    category: 'Games',
    subcategory: 'AAA',
    releaseYear: 2019,
    description: 'Photorealistic western epic with volumetric clouds and dense foliage demanding solid GPU throughput.',
    min: { cpuScore: 350, gpuScore: 260, ramGB: 8, vramGB: 4, storageGB: 150 },
    rec: { cpuScore: 550, gpuScore: 490, ramGB: 16, vramGB: 6, storageGB: 150 },
    ssdRequired: false,
    supportedOS: ['Windows 11', 'Windows 10', 'Linux']
  },
  {
    id: 'sw-alan-wake-2',
    name: 'Alan Wake 2',
    category: 'Games',
    subcategory: 'AAA',
    releaseYear: 2023,
    description: 'Next-gen mesh shader showcase with path tracing. Requires modern GPU architecture and NVMe SSD.',
    min: { cpuScore: 520, gpuScore: 440, ramGB: 16, vramGB: 6, storageGB: 90 },
    rec: { cpuScore: 720, gpuScore: 780, ramGB: 16, vramGB: 12, storageGB: 90 },
    ssdRequired: true,
    supportedOS: ['Windows 11', 'Windows 10']
  },
  {
    id: 'sw-bg3',
    name: "Baldur's Gate 3",
    category: 'Games',
    subcategory: 'AAA',
    releaseYear: 2023,
    description: 'Deep turn-based CRPG where Act 3 city crowds heavily stress multi-core CPUs and SSD streaming.',
    min: { cpuScore: 400, gpuScore: 360, ramGB: 8, vramGB: 4, storageGB: 150 },
    rec: { cpuScore: 640, gpuScore: 550, ramGB: 16, vramGB: 8, storageGB: 150 },
    ssdRequired: true,
    supportedOS: ['Windows 11', 'Windows 10', 'macOS', 'Linux']
  },
  {
    id: 'sw-wukong',
    name: 'Black Myth: Wukong',
    category: 'Games',
    subcategory: 'AAA',
    releaseYear: 2024,
    description: 'Unreal Engine 5 action showcase utilizing Nanite geometry and Lumen global illumination.',
    min: { cpuScore: 480, gpuScore: 410, ramGB: 16, vramGB: 6, storageGB: 130 },
    rec: { cpuScore: 710, gpuScore: 720, ramGB: 32, vramGB: 12, storageGB: 130 },
    ssdRequired: true,
    supportedOS: ['Windows 11', 'Windows 10']
  },
  {
    id: 'sw-valorant',
    name: 'Valorant',
    category: 'Games',
    subcategory: 'Esports',
    releaseYear: 2020,
    description: 'Ultra-responsive 5v5 tactical shooter optimized for high framerates even on integrated GPUs.',
    min: { cpuScore: 180, gpuScore: 70, ramGB: 4, vramGB: 1, storageGB: 35 },
    rec: { cpuScore: 410, gpuScore: 220, ramGB: 8, vramGB: 4, storageGB: 35 },
    ssdRequired: false,
    supportedOS: ['Windows 11', 'Windows 10']
  },
  {
    id: 'sw-cs2',
    name: 'Counter-Strike 2',
    category: 'Games',
    subcategory: 'Esports',
    releaseYear: 2023,
    description: 'Source 2 tactical shooter with volumetric smokes requiring stronger GPUs than CS:GO.',
    min: { cpuScore: 350, gpuScore: 200, ramGB: 8, vramGB: 4, storageGB: 85 },
    rec: { cpuScore: 580, gpuScore: 460, ramGB: 16, vramGB: 8, storageGB: 85 },
    ssdRequired: false,
    supportedOS: ['Windows 11', 'Windows 10', 'Linux']
  },
  {
    id: 'sw-lol',
    name: 'League of Legends',
    category: 'Games',
    subcategory: 'Esports',
    releaseYear: 2009,
    description: 'Iconic competitive MOBA engineered to run smoothly across almost any modern laptop or desktop.',
    min: { cpuScore: 160, gpuScore: 65, ramGB: 4, vramGB: 1, storageGB: 25 },
    rec: { cpuScore: 350, gpuScore: 200, ramGB: 8, vramGB: 2, storageGB: 25 },
    ssdRequired: false,
    supportedOS: ['Windows 11', 'Windows 10', 'macOS']
  },
  {
    id: 'sw-fortnite',
    name: 'Fortnite',
    category: 'Games',
    subcategory: 'Esports',
    releaseYear: 2023,
    description: 'Fast-paced Unreal Engine 5 battle royale scalable from Performance Mode up to Lumen hardware RT.',
    min: { cpuScore: 300, gpuScore: 190, ramGB: 8, vramGB: 4, storageGB: 65 },
    rec: { cpuScore: 560, gpuScore: 490, ramGB: 16, vramGB: 8, storageGB: 65 },
    ssdRequired: false,
    supportedOS: ['Windows 11', 'Windows 10']
  },
  {
    id: 'sw-apex',
    name: 'Apex Legends',
    category: 'Games',
    subcategory: 'Esports',
    releaseYear: 2019,
    description: 'High-mobility squad battle royale favoring crisp frame pacing and 6GB+ VRAM for high textures.',
    min: { cpuScore: 340, gpuScore: 210, ramGB: 8, vramGB: 4, storageGB: 75 },
    rec: { cpuScore: 550, gpuScore: 460, ramGB: 16, vramGB: 8, storageGB: 75 },
    ssdRequired: false,
    supportedOS: ['Windows 11', 'Windows 10']
  },
  {
    id: 'sw-minecraft-rtx',
    name: 'Minecraft (RTX / Shaders)',
    category: 'Games',
    subcategory: 'AAA',
    releaseYear: 2024,
    description: 'Path-traced block world or heavy Complementary/SEUS shaders demanding dedicated RT-capable GPUs.',
    min: { cpuScore: 400, gpuScore: 410, ramGB: 8, vramGB: 6, storageGB: 20 },
    rec: { cpuScore: 620, gpuScore: 640, ramGB: 16, vramGB: 8, storageGB: 20 },
    ssdRequired: false,
    supportedOS: ['Windows 11', 'Windows 10', 'macOS', 'Linux']
  },

  // CREATIVE SOFTWARE (5)
  {
    id: 'sw-premiere',
    name: 'Adobe Premiere Pro (4K)',
    category: 'Creative Software',
    subcategory: 'Video Editing',
    releaseYear: 2025,
    description: 'Industry-standard 4K timeline editing, Lumetri grading, and GPU-accelerated media encoding.',
    min: { cpuScore: 520, gpuScore: 380, ramGB: 16, vramGB: 6, storageGB: 80 },
    rec: { cpuScore: 780, gpuScore: 650, ramGB: 32, vramGB: 12, storageGB: 250 },
    ssdRequired: true,
    supportedOS: ['Windows 11', 'Windows 10', 'macOS']
  },
  {
    id: 'sw-davinci',
    name: 'DaVinci Resolve Studio',
    category: 'Creative Software',
    subcategory: 'Video Editing',
    releaseYear: 2025,
    description: 'GPU-intensive color grading, Fusion VFX, and AI Magic Mask workflows requiring high VRAM.',
    min: { cpuScore: 500, gpuScore: 420, ramGB: 16, vramGB: 8, storageGB: 60 },
    rec: { cpuScore: 790, gpuScore: 760, ramGB: 32, vramGB: 16, storageGB: 250 },
    ssdRequired: true,
    supportedOS: ['Windows 11', 'Windows 10', 'macOS', 'Linux']
  },
  {
    id: 'sw-blender',
    name: 'Blender (Cycles 3D)',
    category: 'Creative Software',
    subcategory: '3D',
    releaseYear: 2025,
    description: 'Open-source 3D creation suite with GPU-accelerated ray-traced Cycles rendering and sculpting.',
    min: { cpuScore: 410, gpuScore: 350, ramGB: 16, vramGB: 6, storageGB: 30 },
    rec: { cpuScore: 760, gpuScore: 750, ramGB: 32, vramGB: 12, storageGB: 100 },
    ssdRequired: false,
    supportedOS: ['Windows 11', 'Windows 10', 'macOS', 'Linux']
  },
  {
    id: 'sw-photoshop',
    name: 'Adobe Photoshop',
    category: 'Creative Software',
    subcategory: 'Design',
    releaseYear: 2025,
    description: 'Multi-layer raster imaging and Neural Filters with smooth canvas GPU acceleration.',
    min: { cpuScore: 350, gpuScore: 180, ramGB: 8, vramGB: 4, storageGB: 40 },
    rec: { cpuScore: 590, gpuScore: 400, ramGB: 16, vramGB: 6, storageGB: 100 },
    ssdRequired: false,
    supportedOS: ['Windows 11', 'Windows 10', 'macOS']
  },
  {
    id: 'sw-ue5',
    name: 'Unreal Engine 5',
    category: 'Creative Software',
    subcategory: '3D',
    releaseYear: 2025,
    description: 'Real-time 3D game engine requiring massive RAM, fast shader compilation CPUs, and 12GB+ VRAM.',
    min: { cpuScore: 560, gpuScore: 490, ramGB: 16, vramGB: 8, storageGB: 180 },
    rec: { cpuScore: 840, gpuScore: 800, ramGB: 64, vramGB: 16, storageGB: 300 },
    ssdRequired: true,
    supportedOS: ['Windows 11', 'Windows 10', 'macOS', 'Linux']
  },

  // PRODUCTIVITY (3)
  {
    id: 'sw-vscode-llm',
    name: 'VS Code + Docker + Local LLMs',
    category: 'Productivity',
    subcategory: 'Dev/IDE',
    releaseYear: 2025,
    description: 'Full-stack containerized dev environment paired with quantized 7B–14B local AI inference.',
    min: { cpuScore: 480, gpuScore: 350, ramGB: 16, vramGB: 8, storageGB: 80 },
    rec: { cpuScore: 760, gpuScore: 780, ramGB: 32, vramGB: 16, storageGB: 200 },
    ssdRequired: true,
    supportedOS: ['Windows 11', 'Windows 10', 'macOS', 'Linux']
  },
  {
    id: 'sw-android-studio',
    name: 'Android Studio',
    category: 'Productivity',
    subcategory: 'Dev/IDE',
    releaseYear: 2025,
    description: 'Gradle builds and hardware-accelerated Android emulators that crave RAM and fast SSD I/O.',
    min: { cpuScore: 410, gpuScore: 100, ramGB: 16, vramGB: 2, storageGB: 50 },
    rec: { cpuScore: 680, gpuScore: 250, ramGB: 32, vramGB: 4, storageGB: 120 },
    ssdRequired: true,
    supportedOS: ['Windows 11', 'Windows 10', 'macOS', 'Linux']
  },
  {
    id: 'sw-autocad',
    name: 'AutoCAD 2025',
    category: 'Productivity',
    subcategory: 'CAD',
    releaseYear: 2025,
    description: 'Precision 2D drafting and 3D CAD modeling relying heavily on high single-core CPU clock speeds.',
    min: { cpuScore: 420, gpuScore: 200, ramGB: 8, vramGB: 4, storageGB: 40 },
    rec: { cpuScore: 700, gpuScore: 480, ramGB: 32, vramGB: 8, storageGB: 80 },
    ssdRequired: false,
    supportedOS: ['Windows 11', 'Windows 10', 'macOS']
  }
];

const PERFORMANCE_TAGS = [
  'Thermals',
  'Value',
  'Gaming Performance',
  'Productivity',
  'Quiet/Acoustics',
  'Build Quality',
  'Battery Life'
];

/**
 * Table: ComponentReview — 12 Pre-seeded Community Reviews
 */
const SEED_REVIEWS = [
  {
    id: 'seed-rev-1',
    targetType: 'CPU',
    targetId: 'cpu-r7-7800x3d',
    targetName: 'AMD Ryzen 7 7800X3D',
    authorId: 'community-alex',
    authorName: 'AlexV_Builds',
    rating: 5,
    tags: ['Gaming Performance', 'Thermals', 'Value'],
    body: 'Unbeatable 1% lows in Cyberpunk and Baldur’s Gate 3. Draws barely 65W while gaming under a dual-tower air cooler. Best gaming chip I have owned.',
    createdAt: '2026-09-14T10:30:00Z',
    isPublic: true,
    isSeed: true
  },
  {
    id: 'seed-rev-2',
    targetType: 'GPU',
    targetId: 'gpu-rtx-4070s',
    targetName: 'NVIDIA GeForce RTX 4070 Super',
    authorId: 'community-priya',
    authorName: 'PriyaRenders',
    rating: 5,
    tags: ['Gaming Performance', 'Quiet/Acoustics', 'Value'],
    body: 'Sweet spot for 1440p ultra gaming and Blender Cycles renders. Stays whisper quiet at 64°C and DLSS Frame Gen handles Alan Wake 2 effortlessly.',
    createdAt: '2026-09-20T14:15:00Z',
    isPublic: true,
    isSeed: true
  },
  {
    id: 'seed-rev-3',
    targetType: 'GPU',
    targetId: 'gpu-rx-7800xt',
    targetName: 'AMD Radeon RX 7800 XT',
    authorId: 'community-marcus',
    authorName: 'Marcus_FPS',
    rating: 5,
    tags: ['Value', 'Gaming Performance', 'Thermals'],
    body: '16GB VRAM at this price point gives real peace of mind for high-res texture packs. Crushes 1440p native rasterization with zero stuttering.',
    createdAt: '2026-09-25T18:40:00Z',
    isPublic: true,
    isSeed: true
  },
  {
    id: 'seed-rev-4',
    targetType: 'SETUP',
    targetId: 'setup-zephyrus-g14',
    targetName: 'ASUS ROG Zephyrus G14 (2024 OLED)',
    authorId: 'community-devon',
    authorName: 'DevonOnTheGo',
    rating: 5,
    tags: ['Build Quality', 'Battery Life', 'Gaming Performance'],
    body: 'The CNC aluminum chassis feels like a workstation, yet it runs Elden Ring at high settings on the road. OLED display makes DaVinci Resolve grading a joy.',
    createdAt: '2026-10-02T09:05:00Z',
    isPublic: true,
    isSeed: true
  },
  {
    id: 'seed-rev-5',
    targetType: 'CPU',
    targetId: 'cpu-i5-13600k',
    targetName: 'Intel Core i5-13600K',
    authorId: 'community-hana',
    authorName: 'HanaEdits4K',
    rating: 5,
    tags: ['Productivity', 'Value', 'Gaming Performance'],
    body: 'Quick Sync makes 4K H.265 timelines in Premiere Pro buttery smooth. Great hybrid balance between heavy multitasking and high-refresh esports.',
    createdAt: '2026-10-06T12:20:00Z',
    isPublic: true,
    isSeed: true
  },
  {
    id: 'seed-rev-6',
    targetType: 'GPU',
    targetId: 'gpu-rtx-4090',
    targetName: 'NVIDIA GeForce RTX 4090',
    authorId: 'community-kai',
    authorName: 'Kai_LocalAI',
    rating: 5,
    tags: ['Productivity', 'Gaming Performance', 'Build Quality'],
    body: '24GB VRAM lets me run quantized LLMs locally in VS Code while pushing native 4K 120Hz in AAA releases. Massive shroud, so check case clearance!',
    createdAt: '2026-10-10T21:10:00Z',
    isPublic: true,
    isSeed: true
  },
  {
    id: 'seed-rev-7',
    targetType: 'CPU',
    targetId: 'cpu-apple-m3-pro',
    targetName: 'Apple M3 Pro',
    authorId: 'community-elena',
    authorName: 'ElenaSwiftDev',
    rating: 5,
    tags: ['Battery Life', 'Quiet/Acoustics', 'Productivity'],
    body: 'Fans almost never spin up during Android Studio and Docker sessions. Unplugged performance matches plugged-in speed all day long.',
    createdAt: '2026-10-12T16:45:00Z',
    isPublic: true,
    isSeed: true
  },
  {
    id: 'seed-rev-8',
    targetType: 'SETUP',
    targetId: 'setup-legion-pro-5i',
    targetName: 'Lenovo Legion Pro 5i (i7-14700HX / RTX 4070)',
    authorId: 'community-rohan',
    authorName: 'Rohan_CompSci',
    rating: 4,
    tags: ['Thermals', 'Gaming Performance', 'Build Quality'],
    body: 'Fantastic cooling for a college dorm replacement desktop. Keyboard is top tier, though the 300W power brick is hefty in a backpack.',
    createdAt: '2026-10-18T11:15:00Z',
    isPublic: true,
    isSeed: true
  },
  {
    id: 'seed-rev-9',
    targetType: 'GPU',
    targetId: 'gpu-rtx-3060',
    targetName: 'NVIDIA GeForce RTX 3060',
    authorId: 'community-sam',
    authorName: 'SamBudgetRig',
    rating: 4,
    tags: ['Value', 'Quiet/Acoustics'],
    body: 'The 12GB VRAM buffer aged far better than expected. Still holds 60+ FPS at 1080p high in modern RPGs and handles Blender scenes well.',
    createdAt: '2026-10-22T08:50:00Z',
    isPublic: true,
    isSeed: true
  },
  {
    id: 'seed-rev-10',
    targetType: 'CPU',
    targetId: 'cpu-r5-5600x',
    targetName: 'AMD Ryzen 5 5600X',
    authorId: 'community-nina',
    authorName: 'NinaPlaysCS2',
    rating: 5,
    tags: ['Value', 'Thermals', 'Gaming Performance'],
    body: 'Drop-in AM4 upgrade that doubled my CS2 and Valorant framerates. Runs super cool even on a compact budget tower cooler.',
    createdAt: '2026-10-28T19:00:00Z',
    isPublic: true,
    isSeed: true
  },
  {
    id: 'seed-rev-11',
    targetType: 'GPU',
    targetId: 'gpu-rtx-4060',
    targetName: 'NVIDIA GeForce RTX 4060',
    authorId: 'community-toby',
    authorName: 'TobySFF',
    rating: 4,
    tags: ['Thermals', 'Quiet/Acoustics'],
    body: 'At 115W TDP it fits effortlessly into my Mini-ITX case. 8GB VRAM is limiting in Unreal Engine 5, but efficiency for 1080p gaming is stellar.',
    createdAt: '2026-11-04T15:30:00Z',
    isPublic: true,
    isSeed: true
  },
  {
    id: 'seed-rev-12',
    targetType: 'SETUP',
    targetId: 'setup-custom-1440p',
    targetName: 'Custom 1440p Airflow Mid-Tower (7600X + 4070S)',
    authorId: 'community-jordan',
    authorName: 'JordanMeshCase',
    rating: 5,
    tags: ['Thermals', 'Quiet/Acoustics', 'Value'],
    body: 'Built this specifically for 1440p 165Hz gaming and light Unreal Engine prototyping. Zero bottlenecks and super clean cable routing.',
    createdAt: '2026-11-11T20:10:00Z',
    isPublic: true,
    isSeed: true
  }
];

const DEFAULT_PROFILE_SETTINGS = {
  displayName: 'PC Enthusiast',
  bio: 'Benchmarking games, testing thermal curves, and dialing in frame pacing.',
  isPublicProfile: true,
  visibleSpecFields: {
    cpu: true,
    gpu: true,
    ram: true,
    storage: true,
    os: true
  }
};

// ============================================================================
// 3. MODULAR DATA SERVICE / REPOSITORY ABSTRACTION LAYER
// ============================================================================
/**
 * RigCheckDataService
 * ---------------------------------------------------------------------------
 * Encapsulates all persistence and catalog operations behind a clean repository
 * interface. Currently backed by Firestore (strict /artifacts/{appId}/... paths)
 * with graceful in-memory fallback for unauthenticated/guest sessions.
 *
 * EXPANSION / MIGRATION READY:
 * To migrate to Next.js App Router + PostgreSQL (Supabase) + Prisma + NextAuth,
 * replace method implementations inside this class with fetch('/api/...') calls
 * without altering any UI components or business logic.
 */
class RigCheckDataService {
  constructor(firestoreDb, projectAppId) {
    this.db = firestoreDb;
    this.appId = projectAppId;
  }

  isCloudReady() {
    return Boolean(this.db);
  }

  // --- Catalog Queries (Static Seed or Future GET /api/catalog) ---
  getCpus() {
    return SEED_CPUS;
  }

  getGpus() {
    return SEED_GPUS;
  }

  getSoftwareCatalog() {
    return SEED_SOFTWARE;
  }

  // --- Collection Path Builders (Strict RULE 1 Compliance) ---
  _publicCollection(name) {
    return collection(this.db, 'artifacts', this.appId, 'public', 'data', name);
  }

  _publicDoc(name, id) {
    return doc(this.db, 'artifacts', this.appId, 'public', 'data', name, id);
  }

  _userCollection(userId, name) {
    return collection(this.db, 'artifacts', this.appId, 'users', userId, name);
  }

  _userDoc(userId, name, id) {
    return doc(this.db, 'artifacts', this.appId, 'users', userId, name, id);
  }

  // --- Public Community Reviews ---
  subscribePublicReviews(onData, onError) {
    if (!this.isCloudReady()) {
      onData([]);
      return () => {};
    }
    return onSnapshot(
      this._publicCollection('reviews'),
      snapshot => {
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        docs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        onData(docs);
      },
      err => {
        console.error('Reviews listener error:', err);
        if (onError) onError(err);
      }
    );
  }

  async createReview(reviewPayload) {
    if (!this.isCloudReady()) {
      return { id: `local-rev-${Date.now()}`, ...reviewPayload };
    }
    const ref = await addDoc(this._publicCollection('reviews'), reviewPayload);
    return { id: ref.id, ...reviewPayload };
  }

  async updateReview(reviewId, patchPayload) {
    if (!this.isCloudReady()) return;
    await updateDoc(this._publicDoc('reviews', reviewId), patchPayload);
  }

  async deleteReview(reviewId) {
    if (!this.isCloudReady()) return;
    await deleteDoc(this._publicDoc('reviews', reviewId));
  }

  // --- User Saved Rigs ---
  subscribeUserRigs(userId, onData, onError) {
    if (!this.isCloudReady() || !userId) {
      onData([]);
      return () => {};
    }
    return onSnapshot(
      this._userCollection(userId, 'rigs'),
      snapshot => {
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        docs.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
        onData(docs);
      },
      err => {
        console.error('Rigs listener error:', err);
        if (onError) onError(err);
      }
    );
  }

  async saveRig(userId, rigData) {
    if (!this.isCloudReady() || !userId) {
      return { id: rigData.id || `local-rig-${Date.now()}`, ...rigData };
    }
    if (rigData.id) {
      const { id, ...rest } = rigData;
      await setDoc(this._userDoc(userId, 'rigs', id), rest, { merge: true });
      return rigData;
    }
    const ref = await addDoc(this._userCollection(userId, 'rigs'), rigData);
    return { id: ref.id, ...rigData };
  }

  async deleteRig(userId, rigId) {
    if (!this.isCloudReady() || !userId) return;
    await deleteDoc(this._userDoc(userId, 'rigs', rigId));
  }

  // --- User Compatibility Check History ---
  subscribeUserHistory(userId, onData, onError) {
    if (!this.isCloudReady() || !userId) {
      onData([]);
      return () => {};
    }
    return onSnapshot(
      this._userCollection(userId, 'history'),
      snapshot => {
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        docs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        onData(docs);
      },
      err => {
        console.error('History listener error:', err);
        if (onError) onError(err);
      }
    );
  }

  async logCompatibilityCheck(userId, logPayload) {
    if (!this.isCloudReady() || !userId) {
      return { id: `local-hist-${Date.now()}`, ...logPayload };
    }
    const ref = await addDoc(this._userCollection(userId, 'history'), logPayload);
    return { id: ref.id, ...logPayload };
  }

  async deleteHistoryItem(userId, logId) {
    if (!this.isCloudReady() || !userId) return;
    await deleteDoc(this._userDoc(userId, 'history', logId));
  }

  // --- User Profile & Privacy Settings ---
  subscribeUserProfile(userId, onData, onError) {
    if (!this.isCloudReady() || !userId) {
      onData(null);
      return () => {};
    }
    return onSnapshot(
      this._userDoc(userId, 'settings', 'profile'),
      snap => {
        onData(snap.exists() ? snap.data() : null);
      },
      err => {
        console.error('Profile listener error:', err);
        if (onError) onError(err);
      }
    );
  }

  async saveUserProfile(userId, profileData) {
    if (!this.isCloudReady() || !userId) return;
    await setDoc(this._userDoc(userId, 'settings', 'profile'), profileData, { merge: true });
  }

  /**
   * Synchronizes a privacy-redacted public profile snapshot so other users
   * can view shareable profiles without accessing private user collections.
   */
  async syncPublicProfileSnapshot(userId, profileSettings, userRigs, userReviews) {
    if (!this.isCloudReady() || !userId) return;
    const isPublic = Boolean(profileSettings.isPublicProfile);
    const vis = profileSettings.visibleSpecFields || DEFAULT_PROFILE_SETTINGS.visibleSpecFields;

    const sanitizedRigs = isPublic
      ? userRigs
          .filter(r => r.isPublic !== false)
          .map(r => ({
            id: r.id,
            name: r.name,
            createdAt: r.createdAt || null,
            specs: {
              cpuId: vis.cpu ? r.specs.cpuId : null,
              gpuId: vis.gpu ? r.specs.gpuId : null,
              ramGB: vis.ram ? r.specs.ramGB : null,
              storageId: vis.storage ? r.specs.storageId : null,
              os: vis.os ? r.specs.os : null
            }
          }))
      : [];

    const sanitizedReviews = isPublic
      ? userReviews
          .filter(rev => rev.isPublic !== false)
          .map(rev => ({
            id: rev.id,
            targetType: rev.targetType,
            targetId: rev.targetId,
            targetName: rev.targetName,
            rating: rev.rating,
            tags: rev.tags || [],
            body: rev.body,
            createdAt: rev.createdAt
          }))
      : [];

    await setDoc(this._publicDoc('publicProfiles', userId), {
      userId,
      isPublicProfile: isPublic,
      displayName: isPublic ? profileSettings.displayName : 'Private User',
      bio: isPublic ? profileSettings.bio : '',
      visibleSpecFields: vis,
      rigs: sanitizedRigs,
      reviews: sanitizedReviews,
      updatedAt: new Date().toISOString()
    });
  }

  async fetchPublicProfile(targetUserId) {
    if (!this.isCloudReady() || !targetUserId) return null;
    const snap = await getDoc(this._publicDoc('publicProfiles', targetUserId));
    return snap.exists() ? snap.data() : null;
  }
}

const dataService = new RigCheckDataService(db, appId);

// ============================================================================
// 4. COMPATIBILITY MATCHING ENGINE & BENCHMARK ANALYTICS
// ============================================================================

const CPU_MAP = Object.fromEntries(SEED_CPUS.map(c => [c.id, c]));
const GPU_MAP = Object.fromEntries(SEED_GPUS.map(g => [g.id, g]));
const STORAGE_MAP = Object.fromEntries(STORAGE_OPTIONS.map(s => [s.id, s]));

/**
 * Computes overall Rig Score, Rig Tier, and CPU/GPU Balance indicator.
 */
function evaluateSystemProfile(specs) {
  const cpu = CPU_MAP[specs.cpuId] || SEED_CPUS[0];
  const gpu = GPU_MAP[specs.gpuId] || SEED_GPUS[0];
  const storage = STORAGE_MAP[specs.storageId] || STORAGE_OPTIONS[2];

  const ramScore = Math.min(1000, (specs.ramGB / 32) * 850 + (specs.ramGB >= 64 ? 150 : 0));
  const storageScore = storage.isSSD ? (storage.capacityGB >= 1000 ? 950 : 800) : 350;

  // Weighted score focused on gaming & workstation throughput
  const overallScore = Math.round(
    gpu.score * 0.48 + cpu.score * 0.34 + ramScore * 0.12 + storageScore * 0.06
  );

  let tier = { label: 'Entry / Everyday', color: 'text-slate-300', bg: 'bg-slate-800/80 border-slate-700' };
  if (overallScore >= 850) {
    tier = { label: '4K Flagship Workstation', color: 'text-emerald-300', bg: 'bg-emerald-500/15 border-emerald-500/40' };
  } else if (overallScore >= 680) {
    tier = { label: '1440p Enthusiast Rig', color: 'text-cyan-300', bg: 'bg-cyan-500/15 border-cyan-500/40' };
  } else if (overallScore >= 500) {
    tier = { label: '1080p High / Creator', color: 'text-indigo-300', bg: 'bg-indigo-500/15 border-indigo-500/40' };
  } else if (overallScore >= 320) {
    tier = { label: 'Esports & Casual Ready', color: 'text-amber-300', bg: 'bg-amber-500/15 border-amber-500/40' };
  }

  // CPU vs GPU Balance calculation
  const diff = cpu.score - gpu.score;
  let balance = {
    status: 'Well-Balanced',
    detail: 'CPU and GPU tiers complement each other cleanly.',
    tone: 'emerald'
  };
  if (diff > 220) {
    balance = {
      status: 'GPU-Bound',
      detail: `Your ${cpu.name} has substantial headroom over the ${gpu.name}.`,
      tone: 'amber'
    };
  } else if (diff < -220) {
    balance = {
      status: 'CPU-Bound',
      detail: `Your ${gpu.name} may wait on the ${cpu.name} in CPU-heavy titles.`,
      tone: 'amber'
    };
  }

  return { overallScore, tier, balance, cpu, gpu, storage };
}

/**
 * Matches user specs against a single SoftwareTitle and computes exact
 * bottlenecks, status, row-by-row breakdown, and upgrade suggestions.
 */
function evaluateTitleCompatibility(title, specs) {
  const cpu = CPU_MAP[specs.cpuId] || SEED_CPUS[0];
  const gpu = GPU_MAP[specs.gpuId] || SEED_GPUS[0];
  const storage = STORAGE_MAP[specs.storageId] || STORAGE_OPTIONS[2];

  const criticalBottlenecks = [];
  const recommendedGaps = [];
  const upgradeSuggestions = [];

  // 1. OS Check
  const osSupported = title.supportedOS.includes(specs.os);
  if (!osSupported) {
    criticalBottlenecks.push(
      `OS unsupported: Requires ${title.supportedOS.join(' / ')}; current OS is ${specs.os}`
    );
  }

  // 2. CPU Check
  let cpuStatus = 'recommended';
  if (cpu.score < title.min.cpuScore) {
    cpuStatus = 'cannot_run';
    criticalBottlenecks.push(
      `CPU below minimum (${cpu.name} score ${cpu.score} vs ${title.min.cpuScore} required)`
    );
    const nextCpu = SEED_CPUS.filter(c => c.score >= title.rec.cpuScore).sort((a, b) => a.score - b.score)[0];
    if (nextCpu) upgradeSuggestions.push(`Upgrade CPU to at least ${nextCpu.name} (Score ${nextCpu.score}) for smooth performance.`);
  } else if (cpu.score < title.rec.cpuScore) {
    cpuStatus = 'minimum';
    recommendedGaps.push(
      `CPU meets minimum but below recommended (${cpu.score} vs ${title.rec.cpuScore})`
    );
  }

  // 3. GPU Score Check
  let gpuStatus = 'recommended';
  if (gpu.score < title.min.gpuScore) {
    gpuStatus = 'cannot_run';
    criticalBottlenecks.push(
      `GPU below minimum (${gpu.name} score ${gpu.score} vs ${title.min.gpuScore} required)`
    );
    const nextGpu = SEED_GPUS.filter(
      g => g.score >= title.rec.gpuScore && g.vramGB >= title.rec.vramGB
    ).sort((a, b) => a.score - b.score)[0];
    if (nextGpu) upgradeSuggestions.push(`Upgrade GPU to ${nextGpu.name} (${nextGpu.vramGB}GB VRAM, Score ${nextGpu.score}) to hit Recommended.`);
  } else if (gpu.score < title.rec.gpuScore) {
    gpuStatus = 'minimum';
    recommendedGaps.push(
      `GPU meets minimum but below recommended (${gpu.score} vs ${title.rec.gpuScore})`
    );
  }

  // 4. VRAM Check
  let vramStatus = 'recommended';
  if (gpu.vramGB < title.min.vramGB) {
    vramStatus = 'cannot_run';
    criticalBottlenecks.push(
      `Requires ${title.min.vramGB}GB VRAM; current GPU has ${gpu.vramGB}GB`
    );
  } else if (gpu.vramGB < title.rec.vramGB) {
    vramStatus = 'minimum';
    recommendedGaps.push(
      `Recommended ${title.rec.vramGB}GB VRAM; current GPU has ${gpu.vramGB}GB`
    );
  }

  // 5. RAM Check
  let ramStatus = 'recommended';
  if (specs.ramGB < title.min.ramGB) {
    ramStatus = 'cannot_run';
    criticalBottlenecks.push(
      `Requires ${title.min.ramGB}GB RAM; current system has ${specs.ramGB}GB`
    );
    upgradeSuggestions.push(`Upgrade system memory to at least ${title.rec.ramGB}GB RAM.`);
  } else if (specs.ramGB < title.rec.ramGB) {
    ramStatus = 'minimum';
    recommendedGaps.push(
      `Recommended ${title.rec.ramGB}GB RAM; current system has ${specs.ramGB}GB`
    );
  }

  // 6. Storage Capacity & SSD Check
  let storageStatus = 'recommended';
  if (storage.capacityGB < title.min.storageGB) {
    storageStatus = 'cannot_run';
    criticalBottlenecks.push(
      `Requires ${title.min.storageGB}GB storage space; current drive is ${storage.label}`
    );
    upgradeSuggestions.push(`Add a 1TB NVMe SSD for installation space and fast streaming.`);
  } else if (title.ssdRequired && !storage.isSSD) {
    storageStatus = 'minimum';
    recommendedGaps.push('SSD strongly required for asset streaming and load times; current drive is HDD');
    upgradeSuggestions.push('Switch from mechanical HDD to a SATA or NVMe SSD to eliminate asset pop-in.');
  } else if (!storage.isSSD) {
    storageStatus = 'minimum';
    recommendedGaps.push('SSD recommended for faster boot and loading times');
  }

  let status = 'recommended';
  if (criticalBottlenecks.length > 0) {
    status = 'cannot_run';
  } else if (recommendedGaps.length > 0) {
    status = 'minimum';
  }

  const rows = [
    {
      key: 'CPU',
      userVal: `${cpu.name} (${cpu.score})`,
      minVal: `Score ${title.min.cpuScore}+`,
      recVal: `Score ${title.rec.cpuScore}+`,
      status: cpuStatus
    },
    {
      key: 'GPU',
      userVal: `${gpu.name} (${gpu.score})`,
      minVal: `Score ${title.min.gpuScore}+`,
      recVal: `Score ${title.rec.gpuScore}+`,
      status: gpuStatus
    },
    {
      key: 'VRAM',
      userVal: `${gpu.vramGB} GB`,
      minVal: `${title.min.vramGB} GB`,
      recVal: `${title.rec.vramGB} GB`,
      status: vramStatus
    },
    {
      key: 'RAM',
      userVal: `${specs.ramGB} GB`,
      minVal: `${title.min.ramGB} GB`,
      recVal: `${title.rec.ramGB} GB`,
      status: ramStatus
    },
    {
      key: 'Storage',
      userVal: storage.label,
      minVal: `${title.min.storageGB}GB${title.ssdRequired ? ' (SSD)' : ''}`,
      recVal: `${title.rec.storageGB}GB SSD`,
      status: storageStatus
    },
    {
      key: 'OS',
      userVal: specs.os,
      minVal: title.supportedOS.join(', '),
      recVal: title.supportedOS[0],
      status: osSupported ? 'recommended' : 'cannot_run'
    }
  ];

  return {
    title,
    status,
    bottlenecks: [...criticalBottlenecks, ...recommendedGaps],
    criticalBottlenecks,
    recommendedGaps,
    rows,
    upgradeSuggestions: [...new Set(upgradeSuggestions)]
  };
}

// ============================================================================
// 5. SHARED REUSABLE UI COMPONENTS
// ============================================================================

/**
 * Custom Searchable Dropdown (Combobox) for CPUs & GPUs
 */
function HardwareCombobox({ label, icon: Icon, items, selectedId, onChange, type }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef(null);

  const selected = items.find(i => i.id === selectedId) || items[0];

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
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      item =>
        item.name.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.vramGB && `${item.vramGB}gb`.includes(q))
    );
  }, [items, query]);

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-cyan-400" />
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-[#0b0f19] border border-slate-700/80 hover:border-cyan-500/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-slate-100 truncate">{selected?.name}</div>
          <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
            <span className="text-cyan-400 font-mono font-semibold">Score {selected?.score}</span>
            <span>•</span>
            {type === 'CPU' ? (
              <span>{selected?.cores}C/{selected?.threads}T • {selected?.category}</span>
            ) : (
              <span>{selected?.vramGB}GB VRAM • {selected?.category}</span>
            )}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-40 mt-2 w-full rounded-xl bg-[#111827] border border-slate-700 shadow-2xl shadow-black/60 overflow-hidden">
          <div className="p-2 border-b border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={`Search ${type === 'CPU' ? 'Intel, AMD, Apple...' : 'RTX, RX, VRAM...'}`}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-[#0b0f19] border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/60">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-slate-500">
                No matching {type} found
              </div>
            ) : (
              filtered.map(item => {
                const isSelected = item.id === selectedId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onChange(item.id);
                      setOpen(false);
                      setQuery('');
                    }}
                    className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between gap-2 transition-colors ${
                      isSelected
                        ? 'bg-cyan-500/15 text-cyan-200'
                        : 'hover:bg-slate-800/80 text-slate-200'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate flex items-center gap-2">
                        {item.name}
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {item.category}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {type === 'CPU'
                          ? `${item.cores} Cores / ${item.threads} Threads • ${item.tdp}W TDP`
                          : `${item.vramGB}GB VRAM • ${item.tdp}W TDP`}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="inline-block px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-[#0b0f19] border border-slate-700 text-cyan-400">
                        {item.score}
                      </span>
                    </div>
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

function StatusBadge({ status, compact = false }) {
  if (status === 'recommended') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
        <CheckCircle2 className="w-3.5 h-3.5" />
        {compact ? 'Recommended' : 'Recommended'}
      </span>
    );
  }
  if (status === 'minimum') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
        <AlertTriangle className="w-3.5 h-3.5" />
        {compact ? 'Playable' : 'Minimum (Playable)'}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
      <XCircle className="w-3.5 h-3.5" />
      Cannot Run
    </span>
  );
}

function StarRating({ value, size = 'sm', interactive = false, onChange }) {
  const sizes = { xs: 'w-3 h-3', sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' };
  const cls = sizes[size] || sizes.sm;
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => {
        const filled = star <= Math.round(value);
        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange && onChange(star)}
            className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform p-0.5' : 'cursor-default'}`}
            aria-label={`${star} star`}
          >
            <Star
              className={`${cls} ${
                filled ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

function ToggleSwitch({ checked, onChange, label, description, disabled = false }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="min-w-0">
        {label && <div className="text-sm font-medium text-slate-200">{label}</div>}
        {description && <div className="text-xs text-slate-400 mt-0.5">{description}</div>}
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
          checked ? 'bg-cyan-500' : 'bg-slate-700'
        } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

// ============================================================================
// 6. MAIN APPLICATION COMPONENT
// ============================================================================

export default function App() {
  // --- Auth & Session State ---
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);

  // --- Navigation State ---
  const [activeTab, setActiveTab] = useState('checker'); // 'checker' | 'hardware' | 'dashboard' | 'publicProfile'
  const [dashboardSubTab, setDashboardSubTab] = useState('rigs'); // 'rigs' | 'history' | 'reviews' | 'privacy'

  // --- Current Spec Builder State ---
  const [currentSpecs, setCurrentSpecs] = useState(RIG_PRESETS[1].specs);
  const [activeRigId, setActiveRigId] = useState(null);

  // --- Compatibility Filter State ---
  const [swSearch, setSwSearch] = useState('');
  const [swCategory, setSwCategory] = useState('All');
  const [swStatusFilter, setSwStatusFilter] = useState('All');
  const [selectedTitleDetail, setSelectedTitleDetail] = useState(null);

  // --- Cloud / In-Memory Data Collections ---
  const [cloudReviews, setCloudReviews] = useState([]);
  const [userRigs, setUserRigs] = useState([]);
  const [userHistory, setUserHistory] = useState([]);
  const [profileSettings, setProfileSettings] = useState(DEFAULT_PROFILE_SETTINGS);

  // --- Hardware Hub State ---
  const [hwSearch, setHwSearch] = useState('');
  const [hwTypeFilter, setHwTypeFilter] = useState('ALL'); // 'ALL' | 'CPU' | 'GPU' | 'SETUP'
  const [hwSort, setHwSort] = useState('rating'); // 'rating' | 'score' | 'reviews'
  const [selectedHardwareTarget, setSelectedHardwareTarget] = useState(null);

  // --- Public Profile Inspection State ---
  const [lookupProfileId, setLookupProfileId] = useState('');
  const [externalPublicProfile, setExternalPublicProfile] = useState(null);
  const [isFetchingProfile, setIsFetchingProfile] = useState(false);
  const [profileLookupError, setProfileLookupError] = useState('');

  // --- Modals & Toasts ---
  const [showSaveRigModal, setShowSaveRigModal] = useState(false);
  const [editingRig, setEditingRig] = useState(null);
  const [rigNameInput, setRigNameInput] = useState('');
  const [rigPublicInput, setRigPublicInput] = useState(true);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    targetType: 'GPU',
    targetId: 'gpu-rtx-4070s',
    customSetupName: '',
    rating: 5,
    tags: ['Gaming Performance'],
    body: '',
    isPublic: true
  });

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountTab, setAccountTab] = useState('profile'); // 'profile' | 'architecture'
  const [confirmModal, setConfirmModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  const showToast = useCallback((message, tone = 'success') => {
    setToast({ message, tone, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3400);
    return () => clearTimeout(timer);
  }, [toast]);

  // --- STEP 1: Authentication Effect (RULE 3 Compliant) ---
  useEffect(() => {
    if (!auth) {
      setAuthReady(true);
      setIsGuestMode(true);
      return;
    }

    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setAuthReady(true);
      }
    };

    initAuth();
    const unsubscribe = onAuthStateChanged(auth, user => {
      setFirebaseUser(user);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const activeUserId = !isGuestMode && firebaseUser ? firebaseUser.uid : null;
  const isAuthenticated = Boolean(activeUserId);

  // --- STEP 2: Firestore Subscriptions (Guarded by authenticated user) ---
  useEffect(() => {
    if (!firebaseUser) return;

    const unsubReviews = dataService.subscribePublicReviews(
      docs => setCloudReviews(docs),
      () => {}
    );

    if (isGuestMode) {
      return () => unsubReviews();
    }

    const unsubRigs = dataService.subscribeUserRigs(
      firebaseUser.uid,
      docs => setUserRigs(docs),
      () => {}
    );

    const unsubHistory = dataService.subscribeUserHistory(
      firebaseUser.uid,
      docs => setUserHistory(docs),
      () => {}
    );

    const unsubProfile = dataService.subscribeUserProfile(
      firebaseUser.uid,
      data => {
        if (data) {
          setProfileSettings(prev => ({
            ...prev,
            ...data,
            visibleSpecFields: {
              ...DEFAULT_PROFILE_SETTINGS.visibleSpecFields,
              ...(data.visibleSpecFields || {})
            }
          }));
        }
      },
      () => {}
    );

    return () => {
      unsubReviews();
      unsubRigs();
      unsubHistory();
      unsubProfile();
    };
  }, [firebaseUser, isGuestMode]);

  // Combine seeded reviews with live cloud reviews
  const allReviews = useMemo(() => {
    return [...cloudReviews, ...SEED_REVIEWS].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
  }, [cloudReviews]);

  const myReviews = useMemo(() => {
    if (!activeUserId) return [];
    return cloudReviews.filter(r => r.authorId === activeUserId);
  }, [cloudReviews, activeUserId]);

  // Keep public profile snapshot synced when authenticated user updates privacy/rigs/reviews
  useEffect(() => {
    if (!activeUserId || !dataService.isCloudReady()) return;
    const timeout = setTimeout(() => {
      dataService
        .syncPublicProfileSnapshot(activeUserId, profileSettings, userRigs, myReviews)
        .catch(err => console.error('Public snapshot sync warning:', err));
    }, 600);
    return () => clearTimeout(timeout);
  }, [activeUserId, profileSettings, userRigs, myReviews]);

  // ==========================================================================
  // DERIVED COMPATIBILITY & HARDWARE ANALYTICS
  // ==========================================================================

  const systemProfile = useMemo(() => evaluateSystemProfile(currentSpecs), [currentSpecs]);

  const compatibilityResults = useMemo(() => {
    return SEED_SOFTWARE.map(title => evaluateTitleCompatibility(title, currentSpecs));
  }, [currentSpecs]);

  const compatSummary = useMemo(() => {
    const recommended = compatibilityResults.filter(r => r.status === 'recommended').length;
    const minimum = compatibilityResults.filter(r => r.status === 'minimum').length;
    const cannotRun = compatibilityResults.filter(r => r.status === 'cannot_run').length;
    return { total: compatibilityResults.length, recommended, minimum, cannotRun };
  }, [compatibilityResults]);

  const filteredResults = useMemo(() => {
    const q = swSearch.trim().toLowerCase();
    return compatibilityResults.filter(item => {
      if (swCategory !== 'All' && item.title.category !== swCategory) return false;
      if (swStatusFilter !== 'All' && item.status !== swStatusFilter) return false;
      if (q) {
        const matchName = item.title.name.toLowerCase().includes(q);
        const matchSub = item.title.subcategory.toLowerCase().includes(q);
        const matchCat = item.title.category.toLowerCase().includes(q);
        if (!matchName && !matchSub && !matchCat) return false;
      }
      return true;
    });
  }, [compatibilityResults, swSearch, swCategory, swStatusFilter]);

  /**
   * Build Unified Hardware Directory (18 CPUs + 18 GPUs + Community Reviewed Full PC/Laptop Setups)
   */
  const hardwareDirectory = useMemo(() => {
    const reviewsByTarget = {};
    allReviews.forEach(rev => {
      if (!reviewsByTarget[rev.targetId]) reviewsByTarget[rev.targetId] = [];
      reviewsByTarget[rev.targetId].push(rev);
    });

    const cpuItems = SEED_CPUS.map(cpu => {
      const revs = reviewsByTarget[cpu.id] || [];
      const avgRating =
        revs.length > 0
          ? revs.reduce((acc, r) => acc + r.rating, 0) / revs.length
          : cpu.baseRating;
      return {
        ...cpu,
        targetType: 'CPU',
        reviews: revs,
        reviewCount: revs.length,
        avgRating: Number(avgRating.toFixed(1))
      };
    });

    const gpuItems = SEED_GPUS.map(gpu => {
      const revs = reviewsByTarget[gpu.id] || [];
      const avgRating =
        revs.length > 0
          ? revs.reduce((acc, r) => acc + r.rating, 0) / revs.length
          : gpu.baseRating;
      return {
        ...gpu,
        targetType: 'GPU',
        reviews: revs,
        reviewCount: revs.length,
        avgRating: Number(avgRating.toFixed(1))
      };
    });

    // Discover unique Full PC / Laptop Setups from reviews
    const setupMap = {};
    allReviews
      .filter(r => r.targetType === 'SETUP')
      .forEach(rev => {
        if (!setupMap[rev.targetId]) {
          setupMap[rev.targetId] = {
            id: rev.targetId,
            name: rev.targetName,
            brand: 'Community Setup',
            category: 'PC / Laptop',
            targetType: 'SETUP',
            score: null,
            reviews: []
          };
        }
        setupMap[rev.targetId].reviews.push(rev);
      });

    const setupItems = Object.values(setupMap).map(setup => {
      const avgRating =
        setup.reviews.reduce((acc, r) => acc + r.rating, 0) / setup.reviews.length;
      return {
        ...setup,
        reviewCount: setup.reviews.length,
        avgRating: Number(avgRating.toFixed(1))
      };
    });

    return [...cpuItems, ...gpuItems, ...setupItems];
  }, [allReviews]);

  const filteredHardware = useMemo(() => {
    const q = hwSearch.trim().toLowerCase();
    const list = hardwareDirectory.filter(item => {
      if (hwTypeFilter !== 'ALL' && item.targetType !== hwTypeFilter) return false;
      if (q) {
        return (
          item.name.toLowerCase().includes(q) ||
          (item.brand || '').toLowerCase().includes(q) ||
          (item.category || '').toLowerCase().includes(q)
        );
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (hwSort === 'score') return (b.score || 0) - (a.score || 0);
      if (hwSort === 'reviews') return b.reviewCount - a.reviewCount || b.avgRating - a.avgRating;
      return b.avgRating - a.avgRating || b.reviewCount - a.reviewCount;
    });
  }, [hardwareDirectory, hwSearch, hwTypeFilter, hwSort]);

  const activeHardwareDetail = useMemo(() => {
    if (!selectedHardwareTarget) return null;
    return hardwareDirectory.find(h => h.id === selectedHardwareTarget) || null;
  }, [selectedHardwareTarget, hardwareDirectory]);

  // ==========================================================================
  // HANDLERS: RIGS, HISTORY, REVIEWS, PRIVACY
  // ==========================================================================

  const handleLogSnapshot = async (customRigName = null) => {
    if (!isAuthenticated) {
      showToast('Sign in to save compatibility history to your dashboard.', 'info');
      setShowAccountModal(true);
      return;
    }

    const activeRigObj = userRigs.find(r => r.id === activeRigId);
    const label = customRigName || activeRigObj?.name || 'Quick Spec Check';

    const logEntry = {
      rigName: label,
      specs: { ...currentSpecs },
      overallScore: systemProfile.overallScore,
      summary: { ...compatSummary },
      createdAt: new Date().toISOString()
    };

    try {
      await dataService.logCompatibilityCheck(activeUserId, logEntry);
      showToast(`Logged "${label}" compatibility snapshot to history.`);
    } catch (err) {
      showToast('Could not log snapshot right now.', 'error');
    }
  };

  const openSaveRigModal = (rigToEdit = null) => {
    if (!isAuthenticated) {
      showToast('Sign in to save and manage multiple PC rigs.', 'info');
      setShowAccountModal(true);
      return;
    }
    if (rigToEdit) {
      setEditingRig(rigToEdit);
      setRigNameInput(rigToEdit.name);
      setRigPublicInput(rigToEdit.isPublic !== false);
      setCurrentSpecs({ ...rigToEdit.specs });
    } else {
      setEditingRig(null);
      setRigNameInput(userRigs.length === 0 ? 'Primary Desktop' : `Custom Rig #${userRigs.length + 1}`);
      setRigPublicInput(true);
    }
    setShowSaveRigModal(true);
  };

  const handleSaveRigSubmit = async e => {
    e.preventDefault();
    const trimmed = rigNameInput.trim();
    if (!trimmed) return;

    const payload = {
      ...(editingRig ? { id: editingRig.id, createdAt: editingRig.createdAt } : { createdAt: new Date().toISOString() }),
      name: trimmed,
      specs: { ...currentSpecs },
      isPublic: rigPublicInput,
      updatedAt: new Date().toISOString()
    };

    try {
      const saved = await dataService.saveRig(activeUserId, payload);
      setActiveRigId(saved.id);
      setShowSaveRigModal(false);
      setEditingRig(null);
      showToast(editingRig ? `Updated "${trimmed}".` : `Saved "${trimmed}" to your rigs.`);

      // Auto-log snapshot when saving a rig
      await dataService.logCompatibilityCheck(activeUserId, {
        rigName: trimmed,
        specs: { ...currentSpecs },
        overallScore: systemProfile.overallScore,
        summary: { ...compatSummary },
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      showToast('Error saving rig profile.', 'error');
    }
  };

  const handleToggleRigVisibility = async rig => {
    if (!isAuthenticated) return;
    try {
      await dataService.saveRig(activeUserId, {
        ...rig,
        isPublic: rig.isPublic === false ? true : false,
        updatedAt: new Date().toISOString()
      });
      showToast(`"${rig.name}" is now ${rig.isPublic === false ? 'visible' : 'hidden'} on your public profile.`);
    } catch (err) {
      showToast('Failed to update rig visibility.', 'error');
    }
  };

  const handleDeleteRig = rig => {
    setConfirmModal({
      title: 'Delete Saved Rig',
      message: `Are you sure you want to delete "${rig.name}"? This cannot be undone.`,
      confirmLabel: 'Delete Rig',
      onConfirm: async () => {
        try {
          await dataService.deleteRig(activeUserId, rig.id);
          if (activeRigId === rig.id) setActiveRigId(null);
          showToast(`Deleted "${rig.name}".`);
        } catch (err) {
          showToast('Error deleting rig.', 'error');
        }
        setConfirmModal(null);
      }
    });
  };

  const handleLoadSavedRig = async rig => {
    setCurrentSpecs({ ...rig.specs });
    setActiveRigId(rig.id);
    setActiveTab('checker');
    showToast(`Loaded "${rig.name}" into Spec Checker.`);

    if (isAuthenticated) {
      const results = SEED_SOFTWARE.map(t => evaluateTitleCompatibility(t, rig.specs));
      const prof = evaluateSystemProfile(rig.specs);
      const summary = {
        total: results.length,
        recommended: results.filter(r => r.status === 'recommended').length,
        minimum: results.filter(r => r.status === 'minimum').length,
        cannotRun: results.filter(r => r.status === 'cannot_run').length
      };
      dataService
        .logCompatibilityCheck(activeUserId, {
          rigName: rig.name,
          specs: { ...rig.specs },
          overallScore: prof.overallScore,
          summary,
          createdAt: new Date().toISOString()
        })
        .catch(() => {});
    }
  };

  // --- Review CRUD Handlers ---
  const openCreateReviewModal = (presetTarget = null) => {
    if (!isAuthenticated) {
      showToast('Sign in to publish hardware reviews.', 'info');
      setShowAccountModal(true);
      return;
    }
    setEditingReview(null);
    if (presetTarget) {
      setReviewForm({
        targetType: presetTarget.targetType,
        targetId: presetTarget.targetType === 'SETUP' ? presetTarget.id : presetTarget.id,
        customSetupName: presetTarget.targetType === 'SETUP' ? presetTarget.name : '',
        rating: 5,
        tags: ['Gaming Performance'],
        body: '',
        isPublic: true
      });
    } else {
      setReviewForm({
        targetType: 'GPU',
        targetId: currentSpecs.gpuId,
        customSetupName: '',
        rating: 5,
        tags: ['Gaming Performance'],
        body: '',
        isPublic: true
      });
    }
    setShowReviewModal(true);
  };

  const openEditReviewModal = review => {
    setEditingReview(review);
    setReviewForm({
      targetType: review.targetType,
      targetId: review.targetId,
      customSetupName: review.targetType === 'SETUP' ? review.targetName : '',
      rating: review.rating,
      tags: review.tags || [],
      body: review.body,
      isPublic: review.isPublic !== false
    });
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async e => {
    e.preventDefault();
    if (!isAuthenticated) return;
    const bodyText = reviewForm.body.trim();
    if (bodyText.length < 10) {
      showToast('Please write at least 10 characters of feedback.', 'error');
      return;
    }

    let targetId = reviewForm.targetId;
    let targetName = '';

    if (reviewForm.targetType === 'CPU') {
      const cpu = CPU_MAP[reviewForm.targetId] || SEED_CPUS[0];
      targetId = cpu.id;
      targetName = cpu.name;
    } else if (reviewForm.targetType === 'GPU') {
      const gpu = GPU_MAP[reviewForm.targetId] || SEED_GPUS[0];
      targetId = gpu.id;
      targetName = gpu.name;
    } else {
      const setupName = reviewForm.customSetupName.trim();
      if (!setupName) {
        showToast('Please enter the Laptop or Full PC Setup name.', 'error');
        return;
      }
      targetName = setupName;
      targetId =
        editingReview && editingReview.targetType === 'SETUP'
          ? editingReview.targetId
          : `setup-${setupName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 36)}`;
    }

    try {
      if (editingReview) {
        await dataService.updateReview(editingReview.id, {
          targetType: reviewForm.targetType,
          targetId,
          targetName,
          rating: reviewForm.rating,
          tags: reviewForm.tags,
          body: bodyText,
          isPublic: reviewForm.isPublic,
          authorName: profileSettings.displayName || 'PC Enthusiast',
          updatedAt: new Date().toISOString()
        });
        showToast('Review updated successfully.');
      } else {
        await dataService.createReview({
          targetType: reviewForm.targetType,
          targetId,
          targetName,
          authorId: activeUserId,
          authorName: profileSettings.displayName || 'PC Enthusiast',
          rating: reviewForm.rating,
          tags: reviewForm.tags,
          body: bodyText,
          isPublic: reviewForm.isPublic,
          createdAt: new Date().toISOString()
        });
        showToast(`Published review for ${targetName}!`);
      }
      setShowReviewModal(false);
      setEditingReview(null);
    } catch (err) {
      showToast('Unable to save review right now.', 'error');
    }
  };

  const handleDeleteReview = review => {
    setConfirmModal({
      title: 'Delete Review',
      message: `Delete your review for "${review.targetName}"? This action cannot be undone.`,
      confirmLabel: 'Delete Review',
      onConfirm: async () => {
        try {
          await dataService.deleteReview(review.id);
          showToast('Review deleted.');
        } catch (err) {
          showToast('Failed to delete review.', 'error');
        }
        setConfirmModal(null);
      }
    });
  };

  const handleToggleReviewVisibility = async review => {
    if (!isAuthenticated) return;
    try {
      const nextVal = review.isPublic === false ? true : false;
      await dataService.updateReview(review.id, { isPublic: nextVal });
      showToast(`Review for "${review.targetName}" is now ${nextVal ? 'visible' : 'hidden'} on your public profile.`);
    } catch (err) {
      showToast('Failed to update review visibility.', 'error');
    }
  };

  // --- Profile & Privacy Update ---
  const handleSaveProfileSettings = async updatedSettings => {
    setProfileSettings(updatedSettings);
    if (isAuthenticated) {
      try {
        await dataService.saveUserProfile(activeUserId, updatedSettings);
      } catch (err) {
        console.error('Profile save error:', err);
      }
    }
  };

  const handleCopyShareLink = () => {
    const shareToken = activeUserId ? `rigcheck.app/u/${activeUserId}` : 'Sign in to generate your share link';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareToken).catch(() => {});
    }
    setCopiedId(true);
    showToast('Shareable profile link copied to clipboard!');
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleLookupPublicProfile = async e => {
    e.preventDefault();
    const cleanId = lookupProfileId.trim().replace(/^.*\/u\//, '');
    if (!cleanId) {
      setExternalPublicProfile(null);
      setProfileLookupError('');
      return;
    }
    if (cleanId === activeUserId) {
      setExternalPublicProfile(null);
      setProfileLookupError('');
      showToast('Showing your own public profile preview.');
      return;
    }
    setIsFetchingProfile(true);
    setProfileLookupError('');
    try {
      const fetched = await dataService.fetchPublicProfile(cleanId);
      if (!fetched) {
        setProfileLookupError('No public profile found for that User ID.');
        setExternalPublicProfile(null);
      } else {
        setExternalPublicProfile(fetched);
      }
    } catch (err) {
      setProfileLookupError('Could not load profile. Verify the ID and try again.');
    } finally {
      setIsFetchingProfile(false);
    }
  };

  // ==========================================================================
  // VIEW RENDERERS
  // ==========================================================================

  const renderSpecCheckerView = () => {
    const activeRigObj = userRigs.find(r => r.id === activeRigId);
    const gaugePct = Math.min(100, Math.max(5, Math.round((systemProfile.overallScore / 1000) * 100)));

    return (
      <div className="space-y-6">
        {/* Top Builder + Live Score Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: PC Spec Builder Card */}
          <div className="lg:col-span-8 rounded-2xl bg-[#111827] border border-slate-800 p-5 sm:p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-cyan-400" />
                  PC Spec Builder & Instant Checker
                </h1>
                <p className="text-sm text-slate-400 mt-0.5">
                  Select your hardware once to evaluate 20 games & creative apps in real time.
                </p>
              </div>
              {isAuthenticated && userRigs.length > 0 && (
                <div className="flex items-center gap-2">
                  <select
                    value={activeRigId || ''}
                    onChange={e => {
                      const found = userRigs.find(r => r.id === e.target.value);
                      if (found) handleLoadSavedRig(found);
                    }}
                    className="px-3 py-2 text-xs font-medium rounded-xl bg-[#0b0f19] border border-cyan-500/40 text-cyan-300 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="">Load Saved Rig ({userRigs.length})</option>
                    {userRigs.map(rig => (
                      <option key={rig.id} value={rig.id}>
                        {rig.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Quick Presets */}
            <div className="mb-5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Quick-Fill Rig Presets
              </div>
              <div className="flex flex-wrap gap-2">
                {RIG_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setCurrentSpecs({ ...preset.specs });
                      setActiveRigId(null);
                      showToast(`Loaded "${preset.label}" preset.`);
                    }}
                    className="group px-3 py-1.5 rounded-xl bg-[#0b0f19] hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 transition-all text-left"
                  >
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300">
                      {preset.label}
                    </span>
                    <span className="text-[11px] text-slate-500 ml-1.5 hidden sm:inline">
                      • {preset.tagline}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Searchable CPU & GPU Comboboxes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <HardwareCombobox
                label="Processor (CPU)"
                icon={Cpu}
                items={SEED_CPUS}
                selectedId={currentSpecs.cpuId}
                onChange={cpuId => {
                  setCurrentSpecs(prev => ({ ...prev, cpuId }));
                  setActiveRigId(null);
                }}
                type="CPU"
              />
              <HardwareCombobox
                label="Graphics Card (GPU)"
                icon={Monitor}
                items={SEED_GPUS}
                selectedId={currentSpecs.gpuId}
                onChange={gpuId => {
                  setCurrentSpecs(prev => ({ ...prev, gpuId }));
                  setActiveRigId(null);
                }}
                type="GPU"
              />
            </div>

            {/* RAM, Storage, OS Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* RAM */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <MemoryStick className="w-3.5 h-3.5 text-cyan-400" />
                  System RAM
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {RAM_OPTIONS.map(ram => (
                    <button
                      key={ram}
                      type="button"
                      onClick={() => {
                        setCurrentSpecs(prev => ({ ...prev, ramGB: ram }));
                        setActiveRigId(null);
                      }}
                      className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                        currentSpecs.ramGB === ram
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                          : 'bg-[#0b0f19] border-slate-800 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {ram}GB
                    </button>
                  ))}
                </div>
              </div>

              {/* Storage */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                  Primary Storage
                </label>
                <select
                  value={currentSpecs.storageId}
                  onChange={e => {
                    setCurrentSpecs(prev => ({ ...prev, storageId: e.target.value }));
                    setActiveRigId(null);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0b0f19] border border-slate-700/80 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  {STORAGE_OPTIONS.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.label} ({st.tier})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  {systemProfile.storage.isSSD ? 'Fast solid-state streaming enabled' : 'HDD may bottleneck modern AAA loads'}
                </p>
              </div>

              {/* OS */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  Operating System
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {OS_OPTIONS.map(os => (
                    <button
                      key={os}
                      type="button"
                      onClick={() => {
                        setCurrentSpecs(prev => ({ ...prev, os }));
                        setActiveRigId(null);
                      }}
                      className={`py-2 px-2 rounded-lg text-xs font-semibold border transition-all truncate ${
                        currentSpecs.os === os
                          ? 'bg-indigo-500/20 border-indigo-400 text-indigo-200'
                          : 'bg-[#0b0f19] border-slate-800 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {os}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Live System Score Card */}
          <div className="lg:col-span-4 rounded-2xl bg-gradient-to-b from-[#111827] to-[#0f1624] border border-slate-800 p-5 sm:p-6 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-cyan-400" />
                  Live Rig Score
                </span>
                {activeRigObj && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 truncate max-w-[140px]">
                    {activeRigObj.name}
                  </span>
                )}
              </div>

              {/* Score Number & Bar */}
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-black font-mono text-white tracking-tight">
                  {systemProfile.overallScore}
                </span>
                <span className="text-sm text-slate-500 font-mono">/ 1000</span>
              </div>

              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden mb-3">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 transition-all duration-500"
                  style={{ width: `${gaugePct}%` }}
                />
              </div>

              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-semibold mb-4 ${systemProfile.tier.bg} ${systemProfile.tier.color}`}>
                <Award className="w-3.5 h-3.5" />
                {systemProfile.tier.label}
              </div>

              {/* CPU / GPU Balance Box */}
              <div className="rounded-xl bg-[#0b0f19] border border-slate-800 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">CPU / GPU Balance</span>
                  <span
                    className={`font-semibold ${
                      systemProfile.balance.tone === 'emerald' ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {systemProfile.balance.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {systemProfile.balance.detail}
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800/80">
                    <div className="text-[10px] uppercase text-slate-500">CPU Bench</div>
                    <div className="text-sm font-mono font-bold text-slate-100">{systemProfile.cpu.score}</div>
                  </div>
                  <div className="px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800/80">
                    <div className="text-[10px] uppercase text-slate-500">GPU Bench</div>
                    <div className="text-sm font-mono font-bold text-slate-100">
                      {systemProfile.gpu.score} <span className="text-[10px] text-cyan-400">{systemProfile.gpu.vramGB}GB</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => openSaveRigModal(null)}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
              >
                <Save className="w-4 h-4" />
                Save This Rig Profile
              </button>
              <button
                type="button"
                onClick={() => handleLogSnapshot()}
                className="w-full py-2 px-4 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 font-medium text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors"
              >
                <History className="w-3.5 h-3.5 text-cyan-400" />
                Log Snapshot to History
              </button>
            </div>
          </div>
        </div>

        {/* Summary KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => setSwStatusFilter('All')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              swStatusFilter === 'All'
                ? 'bg-slate-800/80 border-cyan-500/60'
                : 'bg-[#111827] border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="text-xs text-slate-400 font-medium">Catalog Checked</div>
            <div className="text-2xl font-black text-white mt-1 font-mono">{compatSummary.total}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Games & Apps</div>
          </button>

          <button
            type="button"
            onClick={() => setSwStatusFilter('recommended')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              swStatusFilter === 'recommended'
                ? 'bg-emerald-500/15 border-emerald-500'
                : 'bg-[#111827] border-slate-800 hover:border-emerald-500/40'
            }`}
          >
            <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Recommended
            </div>
            <div className="text-2xl font-black text-emerald-300 mt-1 font-mono">{compatSummary.recommended}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">High / Smooth Experience</div>
          </button>

          <button
            type="button"
            onClick={() => setSwStatusFilter('minimum')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              swStatusFilter === 'minimum'
                ? 'bg-amber-500/15 border-amber-500'
                : 'bg-[#111827] border-slate-800 hover:border-amber-500/40'
            }`}
          >
            <div className="text-xs text-amber-400 font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Minimum (Playable)
            </div>
            <div className="text-2xl font-black text-amber-300 mt-1 font-mono">{compatSummary.minimum}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Meets Base Requirements</div>
          </button>

          <button
            type="button"
            onClick={() => setSwStatusFilter('cannot_run')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              swStatusFilter === 'cannot_run'
                ? 'bg-rose-500/15 border-rose-500'
                : 'bg-[#111827] border-slate-800 hover:border-rose-500/40'
            }`}
          >
            <div className="text-xs text-rose-400 font-semibold flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" /> Cannot Run
            </div>
            <div className="text-2xl font-black text-rose-300 mt-1 font-mono">{compatSummary.cannotRun}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Hardware Upgrade Needed</div>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="rounded-2xl bg-[#111827] border border-slate-800 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {['All', 'Games', 'Creative Software', 'Productivity'].map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSwCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  swCategory === cat
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'bg-[#0b0f19] text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat === 'Games' && <Gamepad2 className="w-3.5 h-3.5" />}
                {cat === 'Creative Software' && <Sparkles className="w-3.5 h-3.5" />}
                {cat === 'Productivity' && <Briefcase className="w-3.5 h-3.5" />}
                {cat}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={swSearch}
                onChange={e => setSwSearch(e.target.value)}
                placeholder="Search Cyberpunk, Blender, VS Code..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-[#0b0f19] border border-slate-700/80 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="flex items-center gap-1 bg-[#0b0f19] p-1 rounded-xl border border-slate-800">
              {[
                { key: 'All', label: 'All' },
                { key: 'recommended', label: 'Rec' },
                { key: 'minimum', label: 'Min' },
                { key: 'cannot_run', label: 'Fail' }
              ].map(pill => (
                <button
                  key={pill.key}
                  type="button"
                  onClick={() => setSwStatusFilter(pill.key)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    swStatusFilter === pill.key
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Compatibility Results Grid */}
        {filteredResults.length === 0 ? (
          <div className="rounded-2xl bg-[#111827] border border-slate-800 p-12 text-center">
            <Filter className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-200">No matching games or apps</h3>
            <p className="text-sm text-slate-400 mt-1">Try clearing your search or changing the compatibility filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredResults.map(result => {
              const { title, status, bottlenecks } = result;
              const borderAccent =
                status === 'recommended'
                  ? 'hover:border-emerald-500/50'
                  : status === 'minimum'
                  ? 'hover:border-amber-500/50'
                  : 'hover:border-rose-500/50';

              return (
                <div
                  key={title.id}
                  onClick={() => setSelectedTitleDetail(result)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && setSelectedTitleDetail(result)}
                  className={`group rounded-2xl bg-[#111827] border border-slate-800 ${borderAccent} p-5 flex flex-col justify-between transition-all cursor-pointer hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/40`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div>
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 mb-1">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {title.category}
                          </span>
                          <span>•</span>
                          <span>{title.subcategory}</span>
                        </div>
                        <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {title.name}
                        </h3>
                      </div>
                      <StatusBadge status={status} compact />
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 mb-3.5 leading-relaxed">
                      {title.description}
                    </p>

                    {/* Bottleneck Highlights */}
                    {bottlenecks.length > 0 ? (
                      <div className="space-y-1.5 mb-4">
                        {bottlenecks.slice(0, 2).map((b, idx) => (
                          <div
                            key={idx}
                            className={`text-xs px-2.5 py-1.5 rounded-lg border flex items-start gap-2 ${
                              status === 'cannot_run'
                                ? 'bg-rose-500/10 border-rose-500/25 text-rose-200'
                                : 'bg-amber-500/10 border-amber-500/25 text-amber-200'
                            }`}
                          >
                            {status === 'cannot_run' ? (
                              <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                            ) : (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            )}
                            <span className="leading-snug">{b}</span>
                          </div>
                        ))}
                        {bottlenecks.length > 2 && (
                          <div className="text-[11px] text-slate-400 pl-1">
                            +{bottlenecks.length - 2} more bottleneck note(s) — click for breakdown
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs px-2.5 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 flex items-center gap-2 mb-4">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>All hardware specs exceed Recommended targets!</span>
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                      <span>RAM {title.rec.ramGB}GB</span>
                      <span>VRAM {title.rec.vramGB}GB</span>
                      <span>{title.min.storageGB}GB</span>
                    </div>
                    <span className="text-cyan-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Breakdown <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ==========================================================================
  // HARDWARE HUB & REVIEWS VIEW
  // ==========================================================================

  const renderHardwareHubView = () => {
    // Dedicated Public Hardware Detail View
    if (activeHardwareDetail) {
      const reviews = activeHardwareDetail.reviews;
      const dist = [5, 4, 3, 2, 1].map(star => {
        const count = reviews.filter(r => r.rating === star).length;
        const pct = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
        return { star, count, pct };
      });

      const tagCounts = {};
      reviews.forEach(r => {
        (r.tags || []).forEach(t => {
          tagCounts[t] = (tagCounts[t] || 0) + 1;
        });
      });
      const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);

      return (
        <div className="space-y-6">
          <button
            type="button"
            onClick={() => setSelectedHardwareTarget(null)}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Hardware Directory
          </button>

          {/* Detail Header */}
          <div className="rounded-2xl bg-[#111827] border border-slate-800 p-6 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    {activeHardwareDetail.targetType === 'SETUP' ? 'Full PC / Laptop Setup' : activeHardwareDetail.targetType}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
                    {activeHardwareDetail.brand}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400">
                    {activeHardwareDetail.category}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {activeHardwareDetail.name}
                </h1>

                {activeHardwareDetail.score && (
                  <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
                    <div className="px-3.5 py-2 rounded-xl bg-[#0b0f19] border border-slate-800">
                      <span className="text-xs text-slate-500 block">Benchmark Score</span>
                      <span className="text-lg font-mono font-bold text-cyan-400">
                        {activeHardwareDetail.score} <span className="text-xs text-slate-500">/ 1000</span>
                      </span>
                    </div>
                    {activeHardwareDetail.targetType === 'CPU' && (
                      <>
                        <div className="px-3.5 py-2 rounded-xl bg-[#0b0f19] border border-slate-800">
                          <span className="text-xs text-slate-500 block">Cores / Threads</span>
                          <span className="text-lg font-mono font-bold text-white">
                            {activeHardwareDetail.cores}C / {activeHardwareDetail.threads}T
                          </span>
                        </div>
                        <div className="px-3.5 py-2 rounded-xl bg-[#0b0f19] border border-slate-800">
                          <span className="text-xs text-slate-500 block">TDP Rating</span>
                          <span className="text-lg font-mono font-bold text-white">{activeHardwareDetail.tdp}W</span>
                        </div>
                      </>
                    )}
                    {activeHardwareDetail.targetType === 'GPU' && (
                      <>
                        <div className="px-3.5 py-2 rounded-xl bg-[#0b0f19] border border-slate-800">
                          <span className="text-xs text-slate-500 block">Video Memory</span>
                          <span className="text-lg font-mono font-bold text-white">
                            {activeHardwareDetail.vramGB}GB VRAM
                          </span>
                        </div>
                        <div className="px-3.5 py-2 rounded-xl bg-[#0b0f19] border border-slate-800">
                          <span className="text-xs text-slate-500 block">Board Power</span>
                          <span className="text-lg font-mono font-bold text-white">{activeHardwareDetail.tdp}W</span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => openCreateReviewModal(activeHardwareDetail)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                >
                  <Plus className="w-4 h-4" />
                  Write a Review
                </button>
                {activeHardwareDetail.targetType !== 'SETUP' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeHardwareDetail.targetType === 'CPU') {
                        setCurrentSpecs(prev => ({ ...prev, cpuId: activeHardwareDetail.id }));
                      } else {
                        setCurrentSpecs(prev => ({ ...prev, gpuId: activeHardwareDetail.id }));
                      }
                      setActiveTab('checker');
                      showToast(`Loaded ${activeHardwareDetail.name} into Spec Checker!`);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-sm border border-slate-700 flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4 text-cyan-400" />
                    Test in Spec Checker
                  </button>
                )}
              </div>
            </div>

            {/* Rating Distribution & Performance Tags */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6 pt-6 border-t border-slate-800">
              <div className="md:col-span-4 flex items-center gap-4">
                <div className="text-center px-4">
                  <div className="text-5xl font-black text-white font-mono">
                    {activeHardwareDetail.avgRating.toFixed(1)}
                  </div>
                  <div className="my-1.5">
                    <StarRating value={activeHardwareDetail.avgRating} size="sm" />
                  </div>
                  <div className="text-xs text-slate-400">
                    {reviews.length} community {reviews.length === 1 ? 'review' : 'reviews'}
                  </div>
                </div>
                <div className="flex-1 space-y-1.5">
                  {dist.map(row => (
                    <div key={row.star} className="flex items-center gap-2 text-xs">
                      <span className="w-4 text-slate-400 font-mono">{row.star}★</span>
                      <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: `${row.pct}%` }}
                        />
                      </div>
                      <span className="w-6 text-right text-slate-500 font-mono">{row.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="md:col-span-8">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Community Performance Tags
                </div>
                {sortedTags.length === 0 ? (
                  <p className="text-sm text-slate-500">No community performance tags yet — be the first to review!</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {sortedTags.map(([tag, count]) => (
                      <span
                        key={tag}
                        className="px-3 py-1.5 rounded-xl bg-[#0b0f19] border border-slate-700/80 text-xs font-medium text-slate-200 flex items-center gap-2"
                      >
                        <span>{tag}</span>
                        <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[11px] font-bold">
                          {count}
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Community Reviews Feed */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-cyan-400" />
              Community Reviews ({reviews.length})
            </h2>
            {reviews.length === 0 ? (
              <div className="rounded-2xl bg-[#111827] border border-slate-800 p-10 text-center">
                <p className="text-slate-400 text-sm mb-4">
                  No written reviews yet for {activeHardwareDetail.name}. Share real-world thermals, noise, and FPS feedback!
                </p>
                <button
                  type="button"
                  onClick={() => openCreateReviewModal(activeHardwareDetail)}
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-sm"
                >
                  Write First Review
                </button>
              </div>
            ) : (
              reviews.map(rev => {
                const isOwner = isAuthenticated && rev.authorId === activeUserId && !rev.isSeed;
                return (
                  <div
                    key={rev.id}
                    className="rounded-2xl bg-[#111827] border border-slate-800 p-5 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500/30 to-indigo-500/30 border border-cyan-500/40 flex items-center justify-center text-xs font-bold text-cyan-200">
                          {(rev.authorName || 'U').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white flex items-center gap-2">
                            {rev.authorName}
                            {isOwner && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500">
                            {new Date(rev.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StarRating value={rev.rating} size="sm" />
                        {isOwner && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditReviewModal(rev)}
                              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-cyan-400"
                              title="Edit Review"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteReview(rev)}
                              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400"
                              title="Delete Review"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-slate-300 leading-relaxed">{rev.body}</p>

                    {rev.tags && rev.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {rev.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-2.5 py-0.5 rounded-md bg-[#0b0f19] border border-slate-800 text-[11px] font-medium text-cyan-300"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      );
    }

    // Main Hardware Directory View
    return (
      <div className="space-y-6">
        <div className="rounded-2xl bg-[#111827] border border-slate-800 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-cyan-400" />
              Hardware & Community Reviews Hub
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Explore benchmarked CPUs, GPUs, and real-world laptop & desktop build reviews from the community.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openCreateReviewModal(null)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Write Hardware Review
          </button>
        </div>

        {/* Directory Filters */}
        <div className="rounded-2xl bg-[#111827] border border-slate-800 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {[
              { key: 'ALL', label: 'All Hardware' },
              { key: 'CPU', label: 'CPUs (18)' },
              { key: 'GPU', label: 'GPUs (18)' },
              { key: 'SETUP', label: 'Full PC / Laptop Setups' }
            ].map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setHwTypeFilter(tab.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  hwTypeFilter === tab.key
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-[#0b0f19] text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={hwSearch}
                onChange={e => setHwSearch(e.target.value)}
                placeholder="Search Ryzen, RTX, Zephyrus..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-[#0b0f19] border border-slate-700/80 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <select
              value={hwSort}
              onChange={e => setHwSort(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-[#0b0f19] border border-slate-700/80 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="rating">Sort: Highest Rated</option>
              <option value="score">Sort: Highest Benchmark</option>
              <option value="reviews">Sort: Most Reviews</option>
            </select>
          </div>
        </div>

        {/* Hardware Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredHardware.map(item => {
            const topTags = [];
            item.reviews.forEach(r => (r.tags || []).forEach(t => topTags.push(t)));
            const uniqueTags = [...new Set(topTags)].slice(0, 3);

            return (
              <div
                key={item.id}
                onClick={() => setSelectedHardwareTarget(item.id)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setSelectedHardwareTarget(item.id)}
                className="group rounded-2xl bg-[#111827] border border-slate-800 hover:border-cyan-500/50 p-5 flex flex-col justify-between transition-all cursor-pointer hover:-translate-y-0.5 hover:shadow-xl"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        item.targetType === 'CPU'
                          ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                          : item.targetType === 'GPU'
                          ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                          : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {item.targetType === 'SETUP' ? 'PC / Laptop' : item.targetType}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-bold text-white font-mono">{item.avgRating.toFixed(1)}</span>
                      <span className="text-xs text-slate-500">({item.reviewCount})</span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors mb-1">
                    {item.name}
                  </h3>
                  <div className="text-xs text-slate-400 mb-3">
                    {item.targetType === 'CPU' && `${item.cores} Cores / ${item.threads} Threads • ${item.tdp}W • ${item.category}`}
                    {item.targetType === 'GPU' && `${item.vramGB}GB VRAM • ${item.tdp}W TDP • ${item.category}`}
                    {item.targetType === 'SETUP' && 'Community Reviewed Full Build / Laptop'}
                  </div>

                  {item.score && (
                    <div className="mb-3">
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-500">Benchmark Score</span>
                        <span className="font-mono font-bold text-cyan-400">{item.score} / 1000</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400"
                          style={{ width: `${Math.min(100, item.score / 10)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {uniqueTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {uniqueTags.map(tag => (
                        <span
                          key={tag}
                          className="text-[11px] px-2 py-0.5 rounded bg-[#0b0f19] border border-slate-800 text-slate-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    {item.reviewCount > 0 ? `${item.reviewCount} user reviews` : 'Be first to review'}
                  </span>
                  <span className="text-cyan-400 font-semibold flex items-center gap-1">
                    View Page <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ==========================================================================
  // PERSONAL DASHBOARD & GRANULAR PRIVACY CONTROLS VIEW
  // ==========================================================================

  const renderDashboardView = () => {
    if (!isAuthenticated) {
      return (
        <div className="max-w-xl mx-auto rounded-2xl bg-[#111827] border border-slate-800 p-8 text-center shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-cyan-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Sign In to Unlock Your Dashboard</h2>
          <p className="text-sm text-slate-400 mt-2 mb-6 leading-relaxed">
            Save multiple PC & laptop rigs, track compatibility history over time, manage your hardware reviews, and customize granular public profile privacy controls.
          </p>
          <button
            type="button"
            onClick={() => setShowAccountModal(true)}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-slate-950 font-bold text-sm inline-flex items-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            Sign In / Enable Account Sync
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Dashboard Header */}
        <div className="rounded-2xl bg-[#111827] border border-slate-800 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-lg font-black text-white shadow-lg">
              {(profileSettings.displayName || 'PC').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                {profileSettings.displayName}
                <span
                  className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${
                    profileSettings.isPublicProfile
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {profileSettings.isPublicProfile ? 'Public Profile' : 'Private Profile'}
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5 font-mono break-all">
                User ID: {activeUserId}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCopyShareLink}
              className="px-3.5 py-2 rounded-xl bg-[#0b0f19] hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
            >
              {copiedId ? <CopyCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
              Copy Share Link
            </button>
            <button
              type="button"
              onClick={() => {
                setExternalPublicProfile(null);
                setActiveTab('publicProfile');
              }}
              className="px-4 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Preview Public Profile
            </button>
          </div>
        </div>

        {/* Dashboard Sub-Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
          {[
            { key: 'rigs', label: `Saved Rigs (${userRigs.length})`, icon: Laptop },
            { key: 'history', label: `Check History (${userHistory.length})`, icon: History },
            { key: 'reviews', label: `My Reviews (${myReviews.length})`, icon: Star },
            { key: 'privacy', label: 'Privacy & Public Profile', icon: Shield }
          ].map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setDashboardSubTab(t.key)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  dashboardSubTab === t.key
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'bg-[#111827] text-slate-400 hover:text-slate-100 border border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* SUB-TAB 1: SAVED RIGS */}
        {dashboardSubTab === 'rigs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Your Saved Devices</h2>
              <button
                type="button"
                onClick={() => openSaveRigModal(null)}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Save Current Specs as New Rig
              </button>
            </div>

            {userRigs.length === 0 ? (
              <div className="rounded-2xl bg-[#111827] border border-slate-800 p-10 text-center">
                <Laptop className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-white">No saved rigs yet</h3>
                <p className="text-sm text-slate-400 mt-1 mb-4">
                  Save your Primary Desktop, Gaming Laptop, or College Ultrabook for one-click compatibility checks.
                </p>
                <button
                  type="button"
                  onClick={() => openSaveRigModal(null)}
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
                >
                  Save Your First Rig
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userRigs.map(rig => {
                  const prof = evaluateSystemProfile(rig.specs);
                  const isVisible = rig.isPublic !== false;
                  return (
                    <div
                      key={rig.id}
                      className="rounded-2xl bg-[#111827] border border-slate-800 p-5 flex flex-col justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <h3 className="text-base font-bold text-white">{rig.name}</h3>
                            <span className="text-xs text-cyan-400 font-mono font-semibold">
                              Score {prof.overallScore} • {prof.tier.label}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleRigVisibility(rig)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1 transition-colors ${
                              isVisible
                                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                                : 'bg-slate-800 border-slate-700 text-slate-400'
                            }`}
                            title="Toggle visibility on public profile"
                          >
                            {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            {isVisible ? 'Public' : 'Private'}
                          </button>
                        </div>

                        <div className="space-y-1.5 text-xs bg-[#0b0f19] rounded-xl p-3 border border-slate-800/80">
                          <div className="flex justify-between gap-2">
                            <span className="text-slate-500">CPU</span>
                            <span className="text-slate-200 font-medium text-right">{prof.cpu.name}</span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="text-slate-500">GPU</span>
                            <span className="text-slate-200 font-medium text-right">
                              {prof.gpu.name} ({prof.gpu.vramGB}GB)
                            </span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="text-slate-500">RAM / Storage</span>
                            <span className="text-slate-200 font-medium text-right">
                              {rig.specs.ramGB}GB • {prof.storage.label}
                            </span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="text-slate-500">OS</span>
                            <span className="text-slate-200 font-medium text-right">{rig.specs.os}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
                        <button
                          type="button"
                          onClick={() => handleLoadSavedRig(rig)}
                          className="flex-1 py-2 px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          Load in Checker
                        </button>
                        <button
                          type="button"
                          onClick={() => openSaveRigModal(rig)}
                          className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRig(rig)}
                          className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SUB-TAB 2: COMPATIBILITY HISTORY */}
        {dashboardSubTab === 'history' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">Compatibility Check History</h2>
            {userHistory.length === 0 ? (
              <div className="rounded-2xl bg-[#111827] border border-slate-800 p-10 text-center">
                <History className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-400">
                  No compatibility snapshots logged yet. Use "Log Snapshot to History" in the Spec Checker or load a saved rig!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {userHistory.map(log => {
                  const cpu = CPU_MAP[log.specs?.cpuId];
                  const gpu = GPU_MAP[log.specs?.gpuId];
                  return (
                    <div
                      key={log.id}
                      className="rounded-2xl bg-[#111827] border border-slate-800 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-white text-sm">{log.rigName}</span>
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300">
                            Score {log.overallScore}
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400">
                          {cpu?.name} • {gpu?.name} • {log.specs?.ramGB}GB RAM • {log.specs?.os}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-mono font-bold">
                          {log.summary?.recommended ?? 0} Rec
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 text-xs font-mono font-bold">
                          {log.summary?.minimum ?? 0} Min
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-400 text-xs font-mono font-bold">
                          {log.summary?.cannotRun ?? 0} Fail
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentSpecs({ ...log.specs });
                            setActiveTab('checker');
                            showToast('Restored historical specs in Checker.');
                          }}
                          className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                        >
                          Re-Test
                        </button>
                        <button
                          type="button"
                          onClick={() => dataService.deleteHistoryItem(activeUserId, log.id)}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-rose-400"
                          title="Remove log"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SUB-TAB 3: MY REVIEWS */}
        {dashboardSubTab === 'reviews' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Your Submitted Reviews</h2>
              <button
                type="button"
                onClick={() => openCreateReviewModal(null)}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Write Review
              </button>
            </div>

            {myReviews.length === 0 ? (
              <div className="rounded-2xl bg-[#111827] border border-slate-800 p-10 text-center">
                <Star className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-400 mb-4">
                  You haven’t written any component or device reviews yet.
                </p>
                <button
                  type="button"
                  onClick={() => openCreateReviewModal(null)}
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
                >
                  Write Your First Review
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {myReviews.map(rev => (
                  <div
                    key={rev.id}
                    className="rounded-2xl bg-[#111827] border border-slate-800 p-5 space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-white">{rev.targetName}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase font-bold">
                            {rev.targetType}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <StarRating value={rev.rating} size="xs" />
                          <span className="text-xs text-slate-500">
                            {new Date(rev.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleReviewVisibility(rev)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1 ${
                            rev.isPublic !== false
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                              : 'bg-slate-800 border-slate-700 text-slate-400'
                          }`}
                        >
                          {rev.isPublic !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          {rev.isPublic !== false ? 'On Public Profile' : 'Hidden on Profile'}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditReviewModal(rev)}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReview(rev)}
                          className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-sm text-slate-300">{rev.body}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(rev.tags || []).map(t => (
                        <span key={t} className="text-[11px] px-2 py-0.5 rounded bg-[#0b0f19] border border-slate-800 text-cyan-300">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SUB-TAB 4: GRANULAR PRIVACY CONTROLS */}
        {dashboardSubTab === 'privacy' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column: Master Switch + Identity + Spec Field Redaction */}
            <div className="lg:col-span-6 space-y-5">
              <div className="rounded-2xl bg-[#111827] border border-slate-800 p-5 space-y-4">
                <div className="flex items-center gap-2 text-base font-bold text-white">
                  <Shield className="w-5 h-5 text-cyan-400" />
                  Master Visibility & Profile Identity
                </div>

                <div className="p-3.5 rounded-xl bg-[#0b0f19] border border-slate-800">
                  <ToggleSwitch
                    checked={profileSettings.isPublicProfile}
                    onChange={val => handleSaveProfileSettings({ ...profileSettings, isPublicProfile: val })}
                    label="Public Profile Visibility"
                    description={
                      profileSettings.isPublicProfile
                        ? 'Anyone with your shareable link can view your selected rigs and reviews.'
                        : 'Profile is locked. Visitors will see "This Profile is Private".'
                    }
                  />
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Public Display Name</label>
                    <input
                      type="text"
                      value={profileSettings.displayName}
                      onChange={e =>
                        handleSaveProfileSettings({ ...profileSettings, displayName: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-[#0b0f19] border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Public Bio</label>
                    <textarea
                      rows={2}
                      value={profileSettings.bio}
                      onChange={e =>
                        handleSaveProfileSettings({ ...profileSettings, bio: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-[#0b0f19] border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Individual Spec Field Toggles */}
              <div className="rounded-2xl bg-[#111827] border border-slate-800 p-5 space-y-3">
                <div className="text-base font-bold text-white">Spec Field Visibility on Shared Rigs</div>
                <p className="text-xs text-slate-400">
                  Hide individual hardware fields if you prefer not to disclose exact components. Hidden specs appear as "Hidden by user".
                </p>
                <div className="divide-y divide-slate-800/80">
                  {[
                    { key: 'cpu', label: 'Processor (CPU)' },
                    { key: 'gpu', label: 'Graphics Card (GPU & VRAM)' },
                    { key: 'ram', label: 'System Memory (RAM)' },
                    { key: 'storage', label: 'Primary Storage' },
                    { key: 'os', label: 'Operating System' }
                  ].map(field => (
                    <ToggleSwitch
                      key={field.key}
                      checked={profileSettings.visibleSpecFields?.[field.key] !== false}
                      disabled={!profileSettings.isPublicProfile}
                      onChange={val =>
                        handleSaveProfileSettings({
                          ...profileSettings,
                          visibleSpecFields: {
                            ...profileSettings.visibleSpecFields,
                            [field.key]: val
                          }
                        })
                      }
                      label={field.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Per-Rig & Per-Review Visibility Toggles */}
            <div className="lg:col-span-6 space-y-5">
              {/* Per-Rig Toggles */}
              <div className="rounded-2xl bg-[#111827] border border-slate-800 p-5 space-y-3">
                <div className="text-base font-bold text-white">Saved Rigs on Public Profile</div>
                {userRigs.length === 0 ? (
                  <p className="text-xs text-slate-500">Save a rig first to manage its public visibility.</p>
                ) : (
                  <div className="divide-y divide-slate-800/80">
                    {userRigs.map(rig => (
                      <ToggleSwitch
                        key={rig.id}
                        checked={rig.isPublic !== false}
                        disabled={!profileSettings.isPublicProfile}
                        onChange={() => handleToggleRigVisibility(rig)}
                        label={rig.name}
                        description={`${CPU_MAP[rig.specs.cpuId]?.name || ''} • ${GPU_MAP[rig.specs.gpuId]?.name || ''}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Per-Review Toggles */}
              <div className="rounded-2xl bg-[#111827] border border-slate-800 p-5 space-y-3">
                <div className="text-base font-bold text-white">Reviews on Public Profile</div>
                {myReviews.length === 0 ? (
                  <p className="text-xs text-slate-500">Write a hardware review to toggle whether it appears on your profile.</p>
                ) : (
                  <div className="divide-y divide-slate-800/80">
                    {myReviews.map(rev => (
                      <ToggleSwitch
                        key={rev.id}
                        checked={rev.isPublic !== false}
                        disabled={!profileSettings.isPublicProfile}
                        onChange={() => handleToggleReviewVisibility(rev)}
                        label={rev.targetName}
                        description={`${rev.rating}★ — ${rev.body.slice(0, 65)}${rev.body.length > 65 ? '...' : ''}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Shareable Link Box */}
              <div className="rounded-2xl bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 border border-cyan-500/30 p-5 space-y-3">
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-cyan-400" />
                  Shareable Public Profile Link
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 rounded-xl bg-[#0b0f19] border border-slate-800 text-xs text-cyan-300 font-mono truncate">
                    rigcheck.app/u/{activeUserId}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyShareLink}
                    className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shrink-0"
                  >
                    {copiedId ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setExternalPublicProfile(null);
                    setActiveTab('publicProfile');
                  }}
                  className="w-full py-2 rounded-xl bg-[#0b0f19] hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  Open Public Profile Preview
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ==========================================================================
  // SHAREABLE PUBLIC PROFILE VIEW
  // ==========================================================================

  const renderPublicProfileView = () => {
    const viewingExternal = Boolean(externalPublicProfile);

    // Resolve profile object either from external lookup or live preview of current user
    const targetProfile = viewingExternal
      ? externalPublicProfile
      : {
          userId: activeUserId || 'guest',
          isPublicProfile: profileSettings.isPublicProfile,
          displayName: profileSettings.displayName,
          bio: profileSettings.bio,
          visibleSpecFields: profileSettings.visibleSpecFields,
          rigs: userRigs
            .filter(r => r.isPublic !== false)
            .map(r => ({
              id: r.id,
              name: r.name,
              specs: {
                cpuId: profileSettings.visibleSpecFields.cpu ? r.specs.cpuId : null,
                gpuId: profileSettings.visibleSpecFields.gpu ? r.specs.gpuId : null,
                ramGB: profileSettings.visibleSpecFields.ram ? r.specs.ramGB : null,
                storageId: profileSettings.visibleSpecFields.storage ? r.specs.storageId : null,
                os: profileSettings.visibleSpecFields.os ? r.specs.os : null
              }
            })),
          reviews: myReviews.filter(rev => rev.isPublic !== false)
        };

    return (
      <div className="space-y-6">
        {/* Profile Switcher / Lookup Bar */}
        <div className="rounded-2xl bg-[#111827] border border-slate-800 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              {viewingExternal
                ? `Viewing shared profile: ${targetProfile.userId}`
                : 'Live preview of your shareable public profile (strictly reflecting your privacy toggles).'}
            </span>
          </div>

          <form onSubmit={handleLookupPublicProfile} className="flex items-center gap-2">
            <input
              type="text"
              value={lookupProfileId}
              onChange={e => setLookupProfileId(e.target.value)}
              placeholder="Paste another User ID to view..."
              className="w-56 px-3 py-1.5 rounded-xl bg-[#0b0f19] border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={isFetchingProfile}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
            >
              {isFetchingProfile ? 'Loading...' : 'Lookup'}
            </button>
            {viewingExternal && (
              <button
                type="button"
                onClick={() => {
                  setExternalPublicProfile(null);
                  setLookupProfileId('');
                  setProfileLookupError('');
                }}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/15 text-cyan-300 text-xs font-semibold"
              >
                My Profile
              </button>
            )}
          </form>
        </div>

        {profileLookupError && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {profileLookupError}
          </div>
        )}

        {/* Strict Private Profile Enforcement */}
        {!targetProfile.isPublicProfile ? (
          <div className="max-w-lg mx-auto rounded-2xl bg-[#111827] border border-slate-800 p-10 text-center shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">This Profile is Private</h2>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              The owner of this RigCheck profile has disabled public visibility. Saved rigs and community reviews are hidden.
            </p>
            {!viewingExternal && isAuthenticated && (
              <button
                type="button"
                onClick={() => {
                  setDashboardSubTab('privacy');
                  setActiveTab('dashboard');
                }}
                className="mt-6 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs inline-flex items-center gap-2"
              >
                <Unlock className="w-4 h-4" />
                Change Privacy Settings in Dashboard
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Public Profile Hero */}
            <div className="rounded-2xl bg-gradient-to-br from-[#111827] via-[#111827] to-[#0f1c2e] border border-slate-800 p-6 sm:p-8 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center text-2xl font-black text-white shadow-lg">
                    {(targetProfile.displayName || 'PC').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-extrabold text-white">{targetProfile.displayName}</h1>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        Verified Builder
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 mt-1 max-w-xl">
                      {targetProfile.bio || 'No bio provided.'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 rounded-xl bg-[#0b0f19] border border-slate-800 text-center">
                    <div className="text-xl font-black text-white font-mono">{targetProfile.rigs.length}</div>
                    <div className="text-[11px] text-slate-400">Public Rigs</div>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-[#0b0f19] border border-slate-800 text-center">
                    <div className="text-xl font-black text-white font-mono">{targetProfile.reviews.length}</div>
                    <div className="text-[11px] text-slate-400">Public Reviews</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Public Rigs Section */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Laptop className="w-5 h-5 text-cyan-400" />
                Showcased Rigs ({targetProfile.rigs.length})
              </h2>
              {targetProfile.rigs.length === 0 ? (
                <div className="rounded-2xl bg-[#111827] border border-slate-800 p-8 text-center text-sm text-slate-400">
                  No public rigs showcased on this profile.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {targetProfile.rigs.map(rig => {
                    const cpu = rig.specs.cpuId ? CPU_MAP[rig.specs.cpuId] : null;
                    const gpu = rig.specs.gpuId ? GPU_MAP[rig.specs.gpuId] : null;
                    const storage = rig.specs.storageId ? STORAGE_MAP[rig.specs.storageId] : null;
                    const allSpecsVisible = Boolean(
                      rig.specs.cpuId && rig.specs.gpuId && rig.specs.ramGB && rig.specs.storageId && rig.specs.os
                    );

                    const renderField = (label, value) => (
                      <div className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-800/60 last:border-0 text-xs">
                        <span className="text-slate-500">{label}</span>
                        {value ? (
                          <span className="text-slate-200 font-medium text-right">{value}</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-500 italic">
                            <EyeOff className="w-3 h-3" /> Hidden by user
                          </span>
                        )}
                      </div>
                    );

                    return (
                      <div key={rig.id} className="rounded-2xl bg-[#111827] border border-slate-800 p-5 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-base font-bold text-white">{rig.name}</h3>
                          {allSpecsVisible && (
                            <button
                              type="button"
                              onClick={() => {
                                setCurrentSpecs({ ...rig.specs });
                                setActiveTab('checker');
                                showToast(`Testing "${rig.name}" in Spec Checker.`);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 text-xs font-semibold flex items-center gap-1"
                            >
                              <Zap className="w-3 h-3" />
                              Test Specs
                            </button>
                          )}
                        </div>
                        <div className="bg-[#0b0f19] rounded-xl px-3.5 py-2 border border-slate-800/80">
                          {renderField('Processor (CPU)', cpu?.name)}
                          {renderField('Graphics (GPU)', gpu ? `${gpu.name} (${gpu.vramGB}GB)` : null)}
                          {renderField('System RAM', rig.specs.ramGB ? `${rig.specs.ramGB} GB` : null)}
                          {renderField('Storage', storage?.label)}
                          {renderField('Operating System', rig.specs.os)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Public Reviews Section */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400" />
                Public Hardware Reviews ({targetProfile.reviews.length})
              </h2>
              {targetProfile.reviews.length === 0 ? (
                <div className="rounded-2xl bg-[#111827] border border-slate-800 p-8 text-center text-sm text-slate-400">
                  No public reviews showcased on this profile.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {targetProfile.reviews.map(rev => (
                    <div key={rev.id} className="rounded-2xl bg-[#111827] border border-slate-800 p-5 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-bold text-white">{rev.targetName}</div>
                          <div className="text-[11px] text-slate-500">
                            {rev.targetType} • {new Date(rev.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <StarRating value={rev.rating} size="xs" />
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{rev.body}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(rev.tags || []).map(tag => (
                          <span
                            key={tag}
                            className="text-[10px] px-2 py-0.5 rounded bg-[#0b0f19] border border-slate-800 text-cyan-300"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ==========================================================================
  // RENDER ROOT SHELL + MODALS
  // ==========================================================================

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200 flex flex-col">
      {/* Sticky Top Navbar */}
      <header className="sticky top-0 z-30 bg-[#0b0f19]/90 backdrop-blur-md border-b border-slate-800/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Brand Logo */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('checker');
              setSelectedHardwareTarget(null);
            }}
            className="flex items-center gap-2.5 shrink-0 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Cpu className="w-5 h-5 text-slate-950" />
            </div>
            <div className="text-left">
              <div className="text-base font-black tracking-tight text-white leading-none">
                Rig<span className="text-cyan-400">Check</span>
              </div>
              <div className="text-[10px] font-medium text-slate-500 tracking-wide">
                CAN YOU RUN IT
              </div>
            </div>
          </button>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-[#111827] p-1 rounded-xl border border-slate-800">
            {[
              { id: 'checker', label: 'Spec Checker', icon: Gauge },
              { id: 'hardware', label: 'Hardware & Reviews', icon: MessageSquare },
              { id: 'dashboard', label: 'My Dashboard', icon: Sliders },
              { id: 'publicProfile', label: 'Public Profile', icon: Globe }
            ].map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id !== 'hardware') setSelectedHardwareTarget(null);
                  }}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    active
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Active Rig Pill + Account */}
          <div className="flex items-center gap-2">
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#111827] border border-slate-800 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-400">Active:</span>
              <span className="font-semibold text-slate-200 max-w-[160px] truncate">
                {systemProfile.gpu.name.replace('NVIDIA GeForce ', '').replace('AMD Radeon ', '')}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowAccountModal(true)}
              className="px-3 py-2 rounded-xl bg-[#111827] hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 flex items-center gap-2 transition-colors"
            >
              {isAuthenticated ? (
                <>
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px] font-bold">
                    {(profileSettings.displayName || 'U').slice(0, 1).toUpperCase()}
                  </span>
                  <span className="hidden sm:inline max-w-[110px] truncate">
                    {profileSettings.displayName}
                  </span>
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>Guest</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Bottom-of-Header Nav Tabs */}
        <div className="md:hidden border-t border-slate-800/80 px-2 py-1.5 grid grid-cols-4 gap-1 bg-[#0b0f19]">
          {[
            { id: 'checker', label: 'Checker', icon: Gauge },
            { id: 'hardware', label: 'Hardware', icon: MessageSquare },
            { id: 'dashboard', label: 'Dashboard', icon: Sliders },
            { id: 'publicProfile', label: 'Profile', icon: Globe }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id !== 'hardware') setSelectedHardwareTarget(null);
                }}
                className={`py-2 px-1 rounded-lg text-[11px] font-semibold flex flex-col items-center gap-1 ${
                  active ? 'bg-cyan-500/15 text-cyan-300' : 'text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {(() => {
          switch (activeTab) {
            case 'hardware':
              return renderHardwareHubView();
            case 'dashboard':
              return renderDashboardView();
            case 'publicProfile':
              return renderPublicProfileView();
            case 'checker':
            default:
              return renderSpecCheckerView();
          }
        })()}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0b0f19] py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-500" />
            <span className="font-semibold text-slate-300">RigCheck</span>
            <span>• Hardware Compatibility & Enthusiast Review Hub</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setAccountTab('architecture');
              setShowAccountModal(true);
            }}
            className="text-slate-400 hover:text-cyan-400 flex items-center gap-1.5 transition-colors"
          >
            <Database className="w-3.5 h-3.5" />
            Extensible Repository & Next.js / Prisma Blueprint
          </button>
        </div>
      </footer>

      {/* =====================================================================
          MODAL 1: DETAILED COMPATIBILITY BREAKDOWN
         ===================================================================== */}
      {selectedTitleDetail && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#111827] border border-slate-700 shadow-2xl">
            <div className="sticky top-0 bg-[#111827] border-b border-slate-800 px-6 py-4 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {selectedTitleDetail.title.category} • {selectedTitleDetail.title.subcategory}
                  </span>
                  <StatusBadge status={selectedTitleDetail.status} />
                </div>
                <h2 className="text-xl font-bold text-white">{selectedTitleDetail.title.name}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTitleDetail(null)}
                className="p-2 rounded-xl hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <p className="text-sm text-slate-300">{selectedTitleDetail.title.description}</p>

              {/* Row-by-Row Comparison Table */}
              <div className="rounded-xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0b0f19] text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Spec</th>
                        <th className="px-4 py-3">Your System</th>
                        <th className="px-4 py-3">Minimum</th>
                        <th className="px-4 py-3">Recommended</th>
                        <th className="px-4 py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {selectedTitleDetail.rows.map(row => (
                        <tr key={row.key} className="hover:bg-slate-800/30">
                          <td className="px-4 py-3 font-bold text-slate-200">{row.key}</td>
                          <td className="px-4 py-3 text-white font-medium">{row.userVal}</td>
                          <td className="px-4 py-3 text-slate-400">{row.minVal}</td>
                          <td className="px-4 py-3 text-slate-400">{row.recVal}</td>
                          <td className="px-4 py-3 text-right">
                            {row.status === 'recommended' && (
                              <span className="text-emerald-400 font-semibold">Pass (Rec)</span>
                            )}
                            {row.status === 'minimum' && (
                              <span className="text-amber-400 font-semibold">Min Only</span>
                            )}
                            {row.status === 'cannot_run' && (
                              <span className="text-rose-400 font-semibold">Bottleneck</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottlenecks & Upgrade Suggestions */}
              {selectedTitleDetail.bottlenecks.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Identified Bottlenecks
                  </h3>
                  {selectedTitleDetail.bottlenecks.map((b, i) => (
                    <div
                      key={i}
                      className="text-xs px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-200 flex items-center gap-2"
                    >
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      {b}
                    </div>
                  ))}
                </div>
              )}

              {selectedTitleDetail.upgradeSuggestions.length > 0 && (
                <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/30 p-4 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5" />
                    Recommended Hardware Upgrades
                  </h3>
                  <ul className="space-y-1.5 text-xs text-cyan-100 list-disc list-inside">
                    {selectedTitleDetail.upgradeSuggestions.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: SAVE / EDIT RIG PROFILE
         ===================================================================== */}
      {showSaveRigModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveRigSubmit}
            className="w-full max-w-md rounded-2xl bg-[#111827] border border-slate-700 p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {editingRig ? 'Edit Saved Rig' : 'Save Current Rig Profile'}
              </h2>
              <button
                type="button"
                onClick={() => setShowSaveRigModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Device Profile Name
              </label>
              <input
                type="text"
                required
                value={rigNameInput}
                onChange={e => setRigNameInput(e.target.value)}
                placeholder="e.g., Primary Desktop, College Laptop"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0f19] border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="rounded-xl bg-[#0b0f19] border border-slate-800 p-3.5 text-xs space-y-1.5">
              <div className="text-slate-500 font-semibold uppercase text-[10px]">Captured Hardware</div>
              <div className="text-slate-200">{systemProfile.cpu.name}</div>
              <div className="text-slate-200">
                {systemProfile.gpu.name} ({systemProfile.gpu.vramGB}GB VRAM)
              </div>
              <div className="text-slate-400">
                {currentSpecs.ramGB}GB RAM • {systemProfile.storage.label} • {currentSpecs.os}
              </div>
            </div>

            <ToggleSwitch
              checked={rigPublicInput}
              onChange={setRigPublicInput}
              label="Show on Public Profile"
              description="You can change this anytime in Privacy Controls."
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSaveRigModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-slate-950 text-xs font-bold"
              >
                {editingRig ? 'Save Changes' : 'Save Rig'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =====================================================================
          MODAL 3: WRITE / EDIT HARDWARE REVIEW
         ===================================================================== */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleReviewSubmit}
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-[#111827] border border-slate-700 p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {editingReview ? 'Edit Your Review' : 'Write a Hardware or Setup Review'}
              </h2>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">What are you reviewing?</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'CPU', label: 'CPU' },
                  { key: 'GPU', label: 'GPU' },
                  { key: 'SETUP', label: 'Full PC / Laptop' }
                ].map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() =>
                      setReviewForm(prev => ({
                        ...prev,
                        targetType: opt.key,
                        targetId:
                          opt.key === 'CPU'
                            ? SEED_CPUS[0].id
                            : opt.key === 'GPU'
                            ? SEED_GPUS[7].id
                            : 'setup-custom'
                      }))
                    }
                    className={`py-2 rounded-xl text-xs font-semibold border ${
                      reviewForm.targetType === opt.key
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                        : 'bg-[#0b0f19] border-slate-800 text-slate-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Component or Setup Name */}
            {reviewForm.targetType === 'CPU' && (
              <HardwareCombobox
                label="Select Processor"
                icon={Cpu}
                items={SEED_CPUS}
                selectedId={reviewForm.targetId}
                onChange={targetId => setReviewForm(prev => ({ ...prev, targetId }))}
                type="CPU"
              />
            )}
            {reviewForm.targetType === 'GPU' && (
              <HardwareCombobox
                label="Select Graphics Card"
                icon={Monitor}
                items={SEED_GPUS}
                selectedId={reviewForm.targetId}
                onChange={targetId => setReviewForm(prev => ({ ...prev, targetId }))}
                type="GPU"
              />
            )}
            {reviewForm.targetType === 'SETUP' && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Laptop Model or Custom PC Build Name
                </label>
                <input
                  type="text"
                  required
                  value={reviewForm.customSetupName}
                  onChange={e => setReviewForm(prev => ({ ...prev, customSetupName: e.target.value }))}
                  placeholder="e.g., MacBook Pro 14 M3 Pro, Dell XPS 15, Custom SFF Build"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0f19] border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            )}

            {/* Star Rating */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Overall Rating</label>
              <div className="flex items-center gap-3">
                <StarRating
                  value={reviewForm.rating}
                  size="lg"
                  interactive
                  onChange={rating => setReviewForm(prev => ({ ...prev, rating }))}
                />
                <span className="text-sm font-mono font-bold text-amber-400">{reviewForm.rating} / 5</span>
              </div>
            </div>

            {/* Performance Tags */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Performance Tags</label>
              <div className="flex flex-wrap gap-1.5">
                {PERFORMANCE_TAGS.map(tag => {
                  const selected = reviewForm.tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() =>
                        setReviewForm(prev => ({
                          ...prev,
                          tags: selected ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag]
                        }))
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        selected
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200'
                          : 'bg-[#0b0f19] border-slate-800 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Written Feedback */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Written Review</label>
              <textarea
                rows={4}
                required
                value={reviewForm.body}
                onChange={e => setReviewForm(prev => ({ ...prev, body: e.target.value }))}
                placeholder="Share real-world FPS, thermals under load, fan noise, value for money, or creative app workflow impressions..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0f19] border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <ToggleSwitch
              checked={reviewForm.isPublic}
              onChange={isPublic => setReviewForm(prev => ({ ...prev, isPublic }))}
              label="Feature on my Public Profile"
              description="Review still contributes to the hardware page rating."
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-slate-950 text-xs font-bold"
              >
                {editingReview ? 'Update Review' : 'Publish Review'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =====================================================================
          MODAL 4: ACCOUNT SESSION & EXTENSIBLE BACKEND ARCHITECTURE BLUEPRINT
         ===================================================================== */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#111827] border border-slate-700 shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAccountTab('profile')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    accountTab === 'profile' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
                  }`}
                >
                  Account & Sync
                </button>
                <button
                  type="button"
                  onClick={() => setAccountTab('architecture')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                    accountTab === 'architecture' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400'
                  }`}
                >
                  <Server className="w-3.5 h-3.5" />
                  Backend Blueprint
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowAccountModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {accountTab === 'profile' ? (
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between p-4 rounded-xl bg-[#0b0f19] border border-slate-800">
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      {isAuthenticated ? 'Cloud Account Active' : 'Guest Mode (Read-Only Spec Check)'}
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isAuthenticated ? 'bg-emerald-400' : 'bg-amber-400'
                        }`}
                      />
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {isAuthenticated
                        ? 'Your rigs, check history, reviews, and privacy toggles sync automatically.'
                        : 'Sign in to save multiple rigs, write reviews, and share your public profile.'}
                    </div>
                  </div>
                  {isAuthenticated ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsGuestMode(true);
                        showToast('Switched to Guest Mode.');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 shrink-0"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Guest Mode
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={async () => {
                        if (auth && !firebaseUser) {
                          try {
                            await signInAnonymously(auth);
                          } catch (e) {}
                        }
                        setIsGuestMode(false);
                        showToast('Signed in! Cloud sync enabled.');
                      }}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 shrink-0"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      Sign In
                    </button>
                  )}
                </div>

                {isAuthenticated && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Display Name</label>
                      <input
                        type="text"
                        value={profileSettings.displayName}
                        onChange={e =>
                          handleSaveProfileSettings({ ...profileSettings, displayName: e.target.value })
                        }
                        className="w-full px-3.5 py-2 rounded-xl bg-[#0b0f19] border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        Your Complete User ID (Shareable for Public Profile Lookup)
                      </label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-3 py-2 rounded-xl bg-[#0b0f19] border border-slate-800 text-xs text-cyan-300 font-mono break-all">
                          {activeUserId}
                        </code>
                        <button
                          type="button"
                          onClick={handleCopyShareLink}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 space-y-4 text-xs text-slate-300">
                <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
                  <div className="font-bold text-indigo-300 mb-1 flex items-center gap-1.5">
                    <Terminal className="w-4 h-4" />
                    Clean Repository Abstraction Ready for Full-Stack Growth
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    All data mutations and queries route through <code className="text-cyan-300">RigCheckDataService</code>. Swap its internal methods to Next.js App Router API routes backed by PostgreSQL (Supabase) + Prisma ORM + NextAuth.js with zero UI rewrites.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="font-bold text-white uppercase tracking-wider text-[11px]">
                    Relational Entity Map (Prisma-Ready)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { model: 'UserProfile', desc: 'id, displayName, bio, isPublicProfile, visibleSpecFields (JSON)' },
                      { model: 'SavedRig', desc: 'id, userId, name, cpuId, gpuId, ramGB, storageId, os, isPublic' },
                      { model: 'HardwareComponent', desc: 'id, type (CPU/GPU), name, brand, score, vramGB, cores, tdp' },
                      { model: 'SoftwareTitle', desc: 'id, name, category, minReq (JSON), recReq (JSON), supportedOS' },
                      { model: 'ComponentReview', desc: 'id, targetType, targetId, authorId, rating, tags[], body, isPublic' },
                      { model: 'CompatibilityCheckLog', desc: 'id, userId, rigName, specsSnapshot, summaryCounts, createdAt' }
                    ].map(m => (
                      <div key={m.model} className="p-3 rounded-xl bg-[#0b0f19] border border-slate-800">
                        <div className="font-mono font-bold text-cyan-400">{m.model}</div>
                        <div className="text-[11px] text-slate-400 mt-1">{m.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 5: CUSTOM CONFIRMATION DIALOG (Replaces window.confirm)
         ===================================================================== */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#111827] border border-slate-700 p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">{confirmModal.title}</h3>
            <p className="text-sm text-slate-400">{confirmModal.message}</p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold"
              >
                {confirmModal.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm animate-fade-in">
          <div
            className={`px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold flex items-center gap-2.5 ${
              toast.tone === 'error'
                ? 'bg-rose-950/95 border-rose-500/50 text-rose-200'
                : toast.tone === 'info'
                ? 'bg-slate-900/95 border-cyan-500/50 text-cyan-200'
                : 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200'
            }`}
          >
            {toast.tone === 'error' ? (
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
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