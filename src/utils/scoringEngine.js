// ============================================================================
// RIGCHECK MATHEMATICAL SCORING & COMPARISON ENGINE
// ============================================================================

// Formula 1 & 5: Universal GPU Score (with 0.85 thermal penalty if isMobile = true)
export function computeUniversalGpuScore({
  shader_cores = 0,
  vram_gb = 0,
  bandwidth_gbs = 0,
  boost_clock_mhz = 0,
  is_mobile = false,
}) {
  const base =
    100 *
    (0.40 * (Number(shader_cores) / 16384) +
      0.30 * (Number(vram_gb) / 24) +
      0.20 * (Number(bandwidth_gbs) / 1000) +
      0.10 * (Number(boost_clock_mhz) / 3000));
  const multiplier = is_mobile ? 0.85 : 1.0;
  return Number((base * multiplier).toFixed(2));
}

// Formula 2 & 5: Universal CPU Score (with 0.85 thermal penalty if isMobile = true)
export function computeUniversalCpuScore({
  cores = 0,
  threads = 0,
  cache_mb = 0,
  boost_clock_ghz = 0,
  is_mobile = false,
}) {
  const base =
    100 *
    (0.25 * (Number(cores) / 24) +
      0.10 * (Number(threads) / 32) +
      0.25 * (Number(cache_mb) / 144) +
      0.40 * (Number(boost_clock_ghz) / 6.0));
  const multiplier = is_mobile ? 0.85 : 1.0;
  return Number((base * multiplier).toFixed(2));
}

// Formula 3: RAM Score (Desktop & Laptop)
export function computeRamScore({ capacity_gb = 0, speed_mhz = 0 }) {
  const score =
    100 *
    (0.60 * (Number(capacity_gb) / 64) +
      0.40 * (Number(speed_mhz) / 7200));
  return Number(score.toFixed(2));
}

// Formula 4: Storage Drive Score (Desktop & Laptop)
export function computeStorageScore({ read_mbs = 0, write_mbs = 0 }) {
  const score =
    100 *
    (0.50 * (Number(read_mbs) / 14000) +
      0.50 * (Number(write_mbs) / 12000));
  return Number(score.toFixed(2));
}

// Formula 6: Standalone Mobile GPU Score (Laptop vs. Laptop Leaderboard Only)
export function computeStandaloneMobileGpuScore({
  shader_cores = 0,
  vram_gb = 0,
  bandwidth_gbs = 0,
  boost_clock_mhz = 0,
}) {
  const score =
    100 *
    (0.40 * (Number(shader_cores) / 10496) +
      0.30 * (Number(vram_gb) / 24) +
      0.20 * (Number(bandwidth_gbs) / 900) +
      0.10 * (Number(boost_clock_mhz) / 1700));
  return Number(score.toFixed(2));
}

// Formula 7: Standalone Mobile CPU Score (Laptop vs. Laptop Leaderboard Only)
export function computeStandaloneMobileCpuScore({
  cores = 0,
  threads = 0,
  cache_mb = 0,
  boost_clock_ghz = 0,
}) {
  const score =
    100 *
    (0.25 * (Number(cores) / 24) +
      0.10 * (Number(threads) / 32) +
      0.25 * (Number(cache_mb) / 128) +
      0.40 * (Number(boost_clock_ghz) / 5.4));
  return Number(score.toFixed(2));
}

// Evaluate Combined PC / Laptop Build from Stored Database Scores
export function evaluateCombinedBuild({ cpu, gpu, ram, storage }) {
  const cpuScore = Number(cpu?.universal_score ?? 0);
  const gpuScore = Number(gpu?.universal_score ?? 0);
  const ramScore = Number(ram?.universal_score ?? 0);
  const storageScore = Number(storage?.universal_score ?? 0);

  const finalScore = Number(
    (0.40 * gpuScore + 0.35 * cpuScore + 0.15 * ramScore + 0.10 * storageScore).toFixed(2)
  );

  const maxCore = Math.max(cpuScore, gpuScore, 1);
  const bottleneckPct = Math.round(((cpuScore - gpuScore) / maxCore) * 100);

  let balance = {
    status: 'balanced',
    label: 'Well-Balanced',
    note: 'CPU and GPU scores are well-aligned for gaming and productivity.',
  };

  if (bottleneckPct > 18) {
    balance = {
      status: 'gpu_bound',
      label: 'GPU-Bound',
      note: `CPU outpaces GPU by ${bottleneckPct}%. Graphics-heavy 3D games will hit GPU limits first.`,
    };
  } else if (bottleneckPct < -18) {
    balance = {
      status: 'cpu_bound',
      label: 'CPU-Bound',
      note: `GPU outpaces CPU by ${Math.abs(bottleneckPct)}%. High-FPS esports or simulation workloads may bottleneck.`,
    };
  }

  return {
    finalScore,
    cpuScore,
    gpuScore,
    ramScore,
    storageScore,
    isMobileBuild: Boolean(cpu?.is_mobile || gpu?.is_mobile),
    balance,
  };
}

// Compare Selected Build Scores Against Game / Software Universal Targets
export function evaluateSoftwareTarget({ cpuScore, gpuScore, ramScore, storageScore, vramGb }, target) {
  const blockers = [];

  if (cpuScore < Number(target.min_cpu_score)) blockers.push('CPU below minimum');
  if (gpuScore < Number(target.min_gpu_score)) blockers.push('GPU below minimum');
  if (Number(vramGb) < Number(target.min_vram_gb)) {
    blockers.push(`Needs ${target.min_vram_gb}GB VRAM (${vramGb}GB installed)`);
  }
  if (ramScore < Number(target.min_ram_score)) blockers.push('RAM below minimum');

  if (blockers.length > 0) {
    return {
      verdict: 'cannot_run',
      label: 'Cannot Run',
      note: `Bottleneck: ${blockers.join(' • ')}`,
    };
  }

  const meetsRecommended =
    cpuScore >= Number(target.rec_cpu_score) &&
    gpuScore >= Number(target.rec_gpu_score) &&
    ramScore >= Number(target.rec_ram_score) &&
    storageScore >= Number(target.rec_storage_score);

  if (meetsRecommended) {
    return {
      verdict: 'recommended',
      label: 'Recommended',
      note: 'Meets or exceeds all recommended universal hardware targets.',
    };
  }

  const upgrades = [];
  if (gpuScore < Number(target.rec_gpu_score)) upgrades.push('GPU');
  if (cpuScore < Number(target.rec_cpu_score)) upgrades.push('CPU');
  if (ramScore < Number(target.rec_ram_score)) upgrades.push('RAM');
  if (storageScore < Number(target.rec_storage_score)) upgrades.push('Storage');

  return {
    verdict: 'minimum',
    label: 'Playable',
    note: `Meets minimum specs. Upgrade ${upgrades.join(', ')} to hit recommended tier.`,
  };
}

// Side-by-Side Comparison Between Two Parts or Two Laptops
export function compareHeadToHead(itemA, itemB) {
  const scoreA = Number(itemA?.score ?? 0);
  const scoreB = Number(itemB?.score ?? 0);
  const diff = Number((scoreA - scoreB).toFixed(2));
  const baseline = Math.max(Math.min(scoreA, scoreB), 0.01);
  const pctDifference = Math.round((Math.abs(diff) / baseline) * 100);

  return {
    winner: diff === 0 ? 'tie' : diff > 0 ? 'A' : 'B',
    scoreDiff: diff,
    pctDifference,
  };
}