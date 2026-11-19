/**
 * metrics.js — Network Performance Simulation Engine
 * Generates realistic bandwidth, latency, throughput, and packet loss data.
 * Uses Perlin-like noise, exponential smoothing, and event-driven spikes.
 */

const NetMetrics = (() => {
  // ——— Simulation state ———
  const state = {
    mode: 'normal',         // 'normal' | 'congestion' | 'outage'
    recoveryTimer: 0,

    // Current raw values
    bandwidth:   250,
    latency:     18,
    throughput:  220,
    packetLoss:  0.1,
    jitter:      1.5,

    // Smooth targets
    bwTarget:    250,
    latTarget:   18,
    tpTarget:    220,
    plTarget:    0.1,

    // Historical arrays for stats
    bwHistory:   [],
    latHistory:  [],
    tpHistory:   [],
    plHistory:   [],

    // Session counters
    sampleCount:    0,
    totalDataMB:    0,
    packetsSent:    0,

    // Noise seed
    noisePhase: Math.random() * 1000,
  };

  // ——— Noise functions ———
  function smoothNoise(phase, freq = 1) {
    return Math.sin(phase * freq * 0.01) * 0.5 +
           Math.sin(phase * freq * 0.027) * 0.3 +
           Math.sin(phase * freq * 0.071) * 0.2;
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
  }

  // ——— Set simulation mode ———
  function setMode(mode) {
    state.mode = mode;
    state.recoveryTimer = 0;

    switch (mode) {
      case 'congestion':
        state.bwTarget  = rand(20, 60);
        state.latTarget = rand(200, 450);
        state.plTarget  = rand(5, 20);
        state.tpTarget  = state.bwTarget * rand(0.4, 0.65);
        break;

      case 'outage':
        state.bwTarget  = rand(0, 5);
        state.latTarget = rand(400, 600);
        state.plTarget  = rand(60, 100);
        state.tpTarget  = rand(0, 2);
        break;

      case 'normal':
      default:
        state.bwTarget  = rand(200, 450);
        state.latTarget = rand(10, 30);
        state.plTarget  = rand(0, 1);
        state.tpTarget  = state.bwTarget * rand(0.80, 0.95);
        break;
    }
  }

  // ——— Generate one tick of metrics ———
  function tick() {
    state.noisePhase += 1;
    state.sampleCount++;
    state.recoveryTimer++;

    const phase = state.noisePhase;

    // Gradually shift targets in normal mode
    if (state.mode === 'normal') {
      if (Math.random() < 0.015) {
        // Occasional random spikes
        state.bwTarget  = clamp(state.bwTarget  + rand(-80, 80),    5,   1000);
        state.latTarget = clamp(state.latTarget + rand(-10, 60),    1,    200);
        state.plTarget  = clamp(state.plTarget  + rand(-0.5, 2),    0,     8);
        state.tpTarget  = state.bwTarget * rand(0.75, 0.95);
      } else {
        // Slow drift
        state.bwTarget  = clamp(state.bwTarget  + rand(-5, 5),      5,   1000);
        state.latTarget = clamp(state.latTarget + rand(-2, 2),      1,    200);
        state.plTarget  = clamp(state.plTarget  + rand(-0.1, 0.15), 0,     8);
        state.tpTarget  = clamp(state.tpTarget  + rand(-4, 4),      5,    950);
      }
    }

    // Auto-recover from simulated events after ~25s
    if ((state.mode === 'congestion' || state.mode === 'outage') && state.recoveryTimer > 25) {
      setMode('normal');
    }

    // Apply exponential smoothing + noise
    const smoothFactor = state.mode === 'outage' ? 0.3 : 0.15;

    state.bandwidth  = lerp(state.bandwidth,  state.bwTarget,  smoothFactor);
    state.latency    = lerp(state.latency,    state.latTarget, smoothFactor);
    state.throughput = lerp(state.throughput, state.tpTarget,  smoothFactor);
    state.packetLoss = lerp(state.packetLoss, state.plTarget,  smoothFactor);

    // Add micro-noise
    const bwNoise   = smoothNoise(phase, 1.0) * (state.mode === 'normal' ? 15 : 5);
    const latNoise  = smoothNoise(phase, 1.5) * (state.mode === 'normal' ? 3  : 10);
    const tpNoise   = smoothNoise(phase, 0.8) * (state.mode === 'normal' ? 10 : 5);
    const plNoise   = smoothNoise(phase, 2.0) * (state.mode === 'normal' ? 0.1: 1.0);

    const bw  = clamp(state.bandwidth  + bwNoise,  0, 1000);
    const lat = clamp(state.latency    + latNoise, 0, 2000);
    const tp  = clamp(state.throughput + tpNoise,  0,  bw * 1.02);
    const pl  = clamp(state.packetLoss + plNoise,  0,  100);

    // Jitter = moving variance of latency
    const prevLat = state.latHistory[state.latHistory.length - 1] || lat;
    state.jitter  = lerp(state.jitter, Math.abs(lat - prevLat), 0.3);

    // Accumulate session stats
    state.totalDataMB += (bw / 8) * 0.001;   // very rough estimate per tick
    state.packetsSent += Math.round(rand(50, 200));

    // Push to history
    state.bwHistory.push(bw);
    state.latHistory.push(lat);
    state.tpHistory.push(tp);
    state.plHistory.push(pl);

    // Keep history capped at 300 samples
    const CAP = 300;
    if (state.bwHistory.length  > CAP) state.bwHistory.shift();
    if (state.latHistory.length > CAP) state.latHistory.shift();
    if (state.tpHistory.length  > CAP) state.tpHistory.shift();
    if (state.plHistory.length  > CAP) state.plHistory.shift();

    return { bw, lat, tp, pl };
  }

  // ——— Compute stats for a metric array ———
  function stats(arr) {
    if (!arr.length) return { min: 0, max: 0, avg: 0 };
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    return { min, max, avg };
  }

  // ——— Compute overall quality score 0–100 ———
  function qualityScore(bw, lat, tp, pl) {
    // Normalize each metric to 0–100 (higher is better)
    const bwScore  = clamp((bw  / 500) * 100, 0, 100);
    const latScore = clamp(100 - (lat / 300) * 100, 0, 100);
    const tpScore  = clamp((tp  / 450) * 100, 0, 100);
    const plScore  = clamp(100 - (pl  / 20)  * 100, 0, 100);

    // Weighted average
    return Math.round(bwScore * 0.3 + latScore * 0.3 + tpScore * 0.2 + plScore * 0.2);
  }

  function getState()  { return state; }
  function getStats()  {
    return {
      bw:  stats(state.bwHistory),
      lat: stats(state.latHistory),
      tp:  stats(state.tpHistory),
      pl:  stats(state.plHistory),
    };
  }

  return { tick, setMode, qualityScore, getState, getStats };
})();
