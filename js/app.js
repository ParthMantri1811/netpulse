/**
 * app.js — Main application controller
 * Orchestrates the tick loop, event bindings, and state management.
 */

const NetApp = (() => {
  // ——— App state ———
  let isRunning  = true;
  let intervalId = null;
  let historyLen = 60;
  let updateMs   = 1000;

  // ——— Initialize ———
  function init() {
    // Boot charts
    NetCharts.init(historyLen);

    // Event listeners
    document.getElementById('btnStartStop').addEventListener('click', togglePause);
    document.getElementById('btnReset').addEventListener('click', resetAll);

    document.getElementById('updateInterval').addEventListener('change', e => {
      updateMs = parseInt(e.target.value, 10);
      if (isRunning) restartLoop();
    });

    document.getElementById('historyLength').addEventListener('change', e => {
      historyLen = parseInt(e.target.value, 10);
      NetCharts.init(historyLen);
    });

    document.getElementById('btnSimulateCongestion').addEventListener('click', () => {
      NetMetrics.setMode('congestion');
      NetUI.addAlert('warn', 'triangle-exclamation', 'Simulating network congestion...');
    });

    document.getElementById('btnSimulateOutage').addEventListener('click', () => {
      NetMetrics.setMode('outage');
      NetUI.addAlert('critical', 'plug-circle-xmark', 'Simulating network outage!');
    });

    document.getElementById('btnSimulateRecover').addEventListener('click', () => {
      NetMetrics.setMode('normal');
      NetUI.addAlert('info', 'circle-check', 'Network recovering to normal...');
    });

    document.getElementById('btnClearAlerts').addEventListener('click', () => {
      NetUI.clearAlerts();
    });

    // Start the main loop
    startLoop();

    // Uptime ticker (every second)
    setInterval(() => NetUI.updateUptime(), 1000);

    // Initial alert
    setTimeout(() => {
      NetUI.addAlert('info', 'circle-info',
        'NetPulse monitoring started. All systems nominal.');
    }, 500);
  }

  // ——— Main tick loop ———
  function startLoop() {
    intervalId = setInterval(tick, updateMs);
  }

  function stopLoop() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function restartLoop() {
    stopLoop();
    if (isRunning) startLoop();
  }

  // ——— One tick of data ———
  function tick() {
    const { bw, lat, tp, pl } = NetMetrics.tick();
    const stats  = NetMetrics.getStats();
    const state  = NetMetrics.getState();
    const score  = NetMetrics.qualityScore(bw, lat, tp, pl);

    // Update DOM
    NetUI.update(bw, lat, tp, pl, stats, state);
    NetUI.updateQualityBadge(score);

    // Update charts
    NetCharts.update(bw, lat, tp, pl, historyLen);
    NetCharts.updateGauge(score);
  }

  // ——— Toggle pause ———
  function togglePause() {
    isRunning = !isRunning;

    const btnIcon = document.getElementById('btnIcon');
    const btnText = document.getElementById('btnText');

    if (isRunning) {
      startLoop();
      btnIcon.className = 'fas fa-pause';
      btnText.textContent = 'Pause';
      NetUI.setLiveState(true);
      NetUI.addAlert('info', 'play', 'Monitoring resumed.');
    } else {
      stopLoop();
      btnIcon.className = 'fas fa-play';
      btnText.textContent = 'Resume';
      NetUI.setLiveState(false);
      NetUI.addAlert('info', 'pause', 'Monitoring paused.');
    }
  }

  // ——— Reset all ———
  function resetAll() {
    stopLoop();

    // Reset metric engine history
    const s = NetMetrics.getState();
    s.bwHistory.length  = 0;
    s.latHistory.length = 0;
    s.tpHistory.length  = 0;
    s.plHistory.length  = 0;
    s.sampleCount       = 0;
    s.totalDataMB       = 0;
    s.packetsSent       = 0;

    // Reset UI
    NetUI.resetStats();

    // Re-init charts
    NetCharts.init(historyLen);

    // Restart if was running
    if (isRunning) startLoop();

    NetUI.addAlert('success', 'rotate-left', 'All statistics have been reset.');
  }

  // ——— Boot on DOM ready ———
  document.addEventListener('DOMContentLoaded', init);

  return { togglePause, resetAll };
})();
