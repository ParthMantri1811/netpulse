/**
 * ui.js — DOM update layer
 * Handles: metric cards, stats, alerts, badges, connection info, uptime
 */

const NetUI = (() => {
  // ——— Cached DOM elements ———
  const el = {
    // Values
    bandwidth:   document.getElementById('metricBandwidth'),
    latency:     document.getElementById('metricLatency'),
    throughput:  document.getElementById('metricThroughput'),
    packetloss:  document.getElementById('metricPacketloss'),

    // Min/Avg/Max — bandwidth
    bwMin: document.getElementById('bwMin'),
    bwAvg: document.getElementById('bwAvg'),
    bwMax: document.getElementById('bwMax'),

    // Min/Avg/Max — latency
    latMin: document.getElementById('latMin'),
    latAvg: document.getElementById('latAvg'),
    latMax: document.getElementById('latMax'),

    // Min/Avg/Max — throughput
    tpMin: document.getElementById('tpMin'),
    tpAvg: document.getElementById('tpAvg'),
    tpMax: document.getElementById('tpMax'),

    // Min/Avg/Max — packetloss
    plMin: document.getElementById('plMin'),
    plAvg: document.getElementById('plAvg'),
    plMax: document.getElementById('plMax'),

    // Sparklines
    bwSparkline: document.getElementById('bwSparkline'),
    latSparkline: document.getElementById('latSparkline'),
    tpSparkline:  document.getElementById('tpSparkline'),
    plSparkline:  document.getElementById('plSparkline'),

    // Chart badges
    bwBadge:  document.getElementById('bwBadge'),
    latBadge: document.getElementById('latBadge'),
    tpBadge:  document.getElementById('tpBadge'),
    plBadge:  document.getElementById('plBadge'),

    // Cards (for alert state)
    cardBandwidth:  document.getElementById('cardBandwidth'),
    cardLatency:    document.getElementById('cardLatency'),
    cardThroughput: document.getElementById('cardThroughput'),
    cardPacketloss: document.getElementById('cardPacketloss'),

    // Quality badge
    qualityBadge: document.getElementById('qualityBadge'),
    qualityText:  document.getElementById('qualityText'),
    gaugeScore:   document.getElementById('gaugeScore'),

    // Live indicator
    liveBadge:    document.getElementById('liveBadge'),
    liveBadgeText: document.getElementById('liveBadgeText'),

    // Connection info
    infoJitter:    document.getElementById('infoJitter'),
    infoUptime:    document.getElementById('infoUptime'),
    infoTotalData: document.getElementById('infoTotalData'),
    infoPacketsSent: document.getElementById('infoPacketsSent'),

    // Alerts
    alertsList:  document.getElementById('alertsList'),
    alertEmpty:  document.getElementById('alertEmpty'),
    alertCount:  document.getElementById('alertCount'),

    // Footer
    footerSampleCount: document.getElementById('footerSampleCount'),

    // Time
    timeDisplay: document.getElementById('timeDisplay'),
  };

  // ——— Alert thresholds ———
  const THRESHOLDS = {
    bwLow:   30,     // Mbps
    latHigh: 150,    // ms
    plHigh:  5,      // %
    tpLow:   20,     // Mbps
  };

  let alertCount = 0;
  let lastAlertState = { bw: false, lat: false, pl: false, tp: false };
  let uptimeStart = Date.now();
  let uptimeInterval = null;

  // ——— Format helpers ———
  function fmt2(v) { return v.toFixed(2); }
  function fmt1(v) { return v.toFixed(1); }
  function fmt0(v) { return v.toFixed(0); }

  function animateValue(el, newVal) {
    el.classList.remove('value-updated');
    // Trigger reflow
    void el.offsetWidth;
    el.classList.add('value-updated');
    el.textContent = newVal;
  }

  // ——— Set sparkline fill % ———
  function setSparkline(el, value, max) {
    el.style.width = Math.min(100, (value / max) * 100).toFixed(1) + '%';
  }

  // ——— Set chart status badge ———
  function setBadge(el, status) {
    el.className = 'chart-badge';
    if (status === 'Warning')  el.classList.add('badge-warn');
    if (status === 'Critical') el.classList.add('badge-critical');
    el.textContent = status;
  }

  // ——— Add an alert item ———
  function addAlert(type, icon, message) {
    // Remove empty placeholder
    if (el.alertEmpty && el.alertEmpty.parentNode === el.alertsList) {
      el.alertsList.removeChild(el.alertEmpty);
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;

    const item = document.createElement('div');
    item.className = `alert-item alert-${type}`;
    item.innerHTML = `
      <i class="fas fa-${icon}" aria-hidden="true"></i>
      <div class="alert-item-content">
        <span class="alert-msg">${message}</span>
        <span class="alert-time">${timeStr}</span>
      </div>
    `;

    el.alertsList.prepend(item);

    // Cap alerts at 20
    const items = el.alertsList.querySelectorAll('.alert-item');
    if (items.length > 20) items[items.length - 1].remove();

    alertCount++;
    el.alertCount.textContent = alertCount;
  }

  // ——— Clear all alerts ———
  function clearAlerts() {
    el.alertsList.innerHTML = '';
    el.alertsList.appendChild(el.alertEmpty);
    alertCount = 0;
    el.alertCount.textContent = '0';
    lastAlertState = { bw: false, lat: false, pl: false, tp: false };
  }

  // ——— Update connection quality badge ———
  function updateQualityBadge(score) {
    const badge = el.qualityBadge;
    badge.className = 'connection-quality-badge';

    let label, cls;
    if (score >= 81)      { label = 'Excellent'; cls = 'quality-excellent'; }
    else if (score >= 66) { label = 'Good';      cls = 'quality-good'; }
    else if (score >= 41) { label = 'Fair';      cls = 'quality-fair'; }
    else                  { label = 'Poor';      cls = 'quality-poor'; }

    badge.classList.add(cls);
    el.qualityText.textContent = label;

    // Gauge score
    el.gaugeScore.textContent = score;
    el.gaugeScore.style.color =
      score >= 81 ? '#93c5fd' :
      score >= 66 ? '#86efac' :
      score >= 41 ? '#fcd34d' : '#fca5a5';
  }

  // ——— Set live/paused badge ———
  function setLiveState(isLive) {
    if (isLive) {
      el.liveBadge.classList.remove('paused');
      el.liveBadgeText.textContent = 'LIVE';
    } else {
      el.liveBadge.classList.add('paused');
      el.liveBadgeText.textContent = 'PAUSED';
    }
  }

  // ——— Update clock ———
  function updateClock() {
    const now = new Date();
    const h   = String(now.getHours()).padStart(2, '0');
    const m   = String(now.getMinutes()).padStart(2, '0');
    const s   = String(now.getSeconds()).padStart(2, '0');
    if (el.timeDisplay) el.timeDisplay.textContent = `${h}:${m}:${s}`;
  }

  // ——— Update uptime display ———
  function updateUptime() {
    const ms   = Date.now() - uptimeStart;
    const secs = Math.floor(ms / 1000);
    const h    = Math.floor(secs / 3600);
    const m    = Math.floor((secs % 3600) / 60);
    const s    = secs % 60;
    if (el.infoUptime) {
      el.infoUptime.textContent =
        `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    }
  }

  function resetUptime() {
    uptimeStart = Date.now();
  }

  // ——— Main update function called each tick ———
  function update(bw, lat, tp, pl, stats, sessionState) {
    // ——— Update primary values ———
    animateValue(el.bandwidth,  fmt2(bw));
    animateValue(el.latency,    fmt1(lat));
    animateValue(el.throughput, fmt2(tp));
    animateValue(el.packetloss, fmt2(pl));

    // ——— Update sparklines ———
    setSparkline(el.bwSparkline,  bw,  1000);
    setSparkline(el.latSparkline, lat, 500);
    setSparkline(el.tpSparkline,  tp,  1000);
    setSparkline(el.plSparkline,  pl,  100);

    // ——— Update Min/Avg/Max stats ———
    if (stats.bw.min  !== Infinity) {
      el.bwMin.textContent  = fmt2(stats.bw.min);
      el.bwAvg.textContent  = fmt2(stats.bw.avg);
      el.bwMax.textContent  = fmt2(stats.bw.max);
    }
    if (stats.lat.min !== Infinity) {
      el.latMin.textContent = fmt1(stats.lat.min);
      el.latAvg.textContent = fmt1(stats.lat.avg);
      el.latMax.textContent = fmt1(stats.lat.max);
    }
    if (stats.tp.min  !== Infinity) {
      el.tpMin.textContent  = fmt2(stats.tp.min);
      el.tpAvg.textContent  = fmt2(stats.tp.avg);
      el.tpMax.textContent  = fmt2(stats.tp.max);
    }
    if (stats.pl.min  !== Infinity) {
      el.plMin.textContent  = fmt2(stats.pl.min);
      el.plAvg.textContent  = fmt2(stats.pl.avg);
      el.plMax.textContent  = fmt2(stats.pl.max);
    }

    // ——— Alert & badge logic ———
    // Bandwidth
    if (bw < THRESHOLDS.bwLow) {
      setBadge(el.bwBadge, bw < 10 ? 'Critical' : 'Warning');
      el.cardBandwidth.classList.add('alert-state');
      if (!lastAlertState.bw) {
        addAlert(bw < 10 ? 'critical' : 'warn',
          bw < 10 ? 'circle-xmark' : 'triangle-exclamation',
          `Bandwidth dropped to ${fmt2(bw)} Mbps`);
        lastAlertState.bw = true;
      }
    } else {
      setBadge(el.bwBadge, 'Normal');
      el.cardBandwidth.classList.remove('alert-state');
      if (lastAlertState.bw) {
        addAlert('success', 'circle-check', `Bandwidth recovered to ${fmt2(bw)} Mbps`);
        lastAlertState.bw = false;
      }
    }

    // Latency
    if (lat > THRESHOLDS.latHigh) {
      setBadge(el.latBadge, lat > 300 ? 'Critical' : 'Warning');
      el.cardLatency.classList.add('alert-state');
      if (!lastAlertState.lat) {
        addAlert(lat > 300 ? 'critical' : 'warn',
          lat > 300 ? 'circle-xmark' : 'triangle-exclamation',
          `High latency detected: ${fmt1(lat)} ms`);
        lastAlertState.lat = true;
      }
    } else {
      setBadge(el.latBadge, 'Normal');
      el.cardLatency.classList.remove('alert-state');
      if (lastAlertState.lat) {
        addAlert('success', 'circle-check', `Latency normalized: ${fmt1(lat)} ms`);
        lastAlertState.lat = false;
      }
    }

    // Packet Loss
    if (pl > THRESHOLDS.plHigh) {
      setBadge(el.plBadge, pl > 20 ? 'Critical' : 'Warning');
      el.cardPacketloss.classList.add('alert-state');
      if (!lastAlertState.pl) {
        addAlert(pl > 20 ? 'critical' : 'warn',
          pl > 20 ? 'circle-xmark' : 'triangle-exclamation',
          `Packet loss spike: ${fmt2(pl)}%`);
        lastAlertState.pl = true;
      }
    } else {
      setBadge(el.plBadge, 'Normal');
      el.cardPacketloss.classList.remove('alert-state');
      if (lastAlertState.pl) {
        addAlert('success', 'circle-check', `Packet loss resolved: ${fmt2(pl)}%`);
        lastAlertState.pl = false;
      }
    }

    // Throughput
    if (tp < THRESHOLDS.tpLow) {
      setBadge(el.tpBadge, tp < 5 ? 'Critical' : 'Warning');
      el.cardThroughput.classList.add('alert-state');
      if (!lastAlertState.tp) {
        addAlert(tp < 5 ? 'critical' : 'warn',
          'triangle-exclamation',
          `Low throughput: ${fmt2(tp)} Mbps`);
        lastAlertState.tp = true;
      }
    } else {
      setBadge(el.tpBadge, 'Normal');
      el.cardThroughput.classList.remove('alert-state');
      if (lastAlertState.tp) {
        addAlert('success', 'circle-check', `Throughput recovered: ${fmt2(tp)} Mbps`);
        lastAlertState.tp = false;
      }
    }

    // ——— Connection info ———
    const jitter = sessionState.jitter || 0;
    el.infoJitter.textContent    = `${jitter.toFixed(1)} ms`;
    el.infoTotalData.textContent = formatDataSize(sessionState.totalDataMB);
    el.infoPacketsSent.textContent = sessionState.packetsSent.toLocaleString();

    // ——— Footer ———
    el.footerSampleCount.textContent = `Samples: ${sessionState.sampleCount.toLocaleString()}`;
  }

  function formatDataSize(mb) {
    if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
    return `${mb.toFixed(2)} MB`;
  }

  function resetStats() {
    // Reset displayed min/avg/max
    ['bwMin','bwAvg','bwMax','latMin','latAvg','latMax','tpMin','tpAvg','tpMax','plMin','plAvg','plMax']
      .forEach(id => { if (el[id]) el[id].textContent = '—'; });

    // Reset sparklines
    ['bwSparkline','latSparkline','tpSparkline','plSparkline']
      .forEach(id => { if (el[id]) el[id].style.width = '0%'; });

    clearAlerts();
    resetUptime();
  }

  // Start clock
  setInterval(updateClock, 1000);
  updateClock();

  return {
    update,
    clearAlerts,
    setLiveState,
    updateQualityBadge,
    updateUptime,
    resetStats,
    addAlert,
  };
})();
