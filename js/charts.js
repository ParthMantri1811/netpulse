/**
 * charts.js — Chart.js initialization and real-time update logic
 * Creates 4 live line charts + 1 gauge doughnut chart
 */

const NetCharts = (() => {
  // ——— Color definitions ———
  const COLORS = {
    bandwidth:   { line: '#3b82f6', fill: 'rgba(59,130,246,0.12)',  grid: 'rgba(59,130,246,0.06)'  },
    latency:     { line: '#a855f7', fill: 'rgba(168,85,247,0.12)', grid: 'rgba(168,85,247,0.06)'  },
    throughput:  { line: '#22d3ee', fill: 'rgba(34,211,238,0.12)', grid: 'rgba(34,211,238,0.06)'  },
    packetloss:  { line: '#f43f5e', fill: 'rgba(244,63,94,0.12)',  grid: 'rgba(244,63,94,0.06)'   },
  };

  // ——— Shared chart options factory ———
  function makeOptions(label, unit, color, maxY) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 0 },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(10,22,44,0.95)',
          borderColor:      color.line,
          borderWidth:      1,
          titleColor:       '#94a3b8',
          bodyColor:        '#e2e8f0',
          titleFont:        { family: 'JetBrains Mono', size: 11 },
          bodyFont:         { family: 'JetBrains Mono', size: 12, weight: '600' },
          padding:          10,
          callbacks: {
            label: ctx => ` ${ctx.parsed.y.toFixed(2)} ${unit}`,
          },
        },
      },
      scales: {
        x: {
          grid:  { color: 'rgba(255,255,255,0.03)', drawBorder: false },
          ticks: {
            color:    '#475569',
            font:     { family: 'JetBrains Mono', size: 10 },
            maxTicksLimit: 8,
            maxRotation: 0,
          },
          border: { display: false },
        },
        y: {
          grid:   { color: color.grid, drawBorder: false },
          ticks:  {
            color:    '#475569',
            font:     { family: 'JetBrains Mono', size: 10 },
            maxTicksLimit: 6,
            callback: v => `${v.toFixed(0)} ${unit}`,
          },
          border: { display: false },
          min: 0,
          ...(maxY ? { max: maxY } : {}),
          suggestedMax: maxY || undefined,
        },
      },
      elements: {
        point: { radius: 0, hoverRadius: 5, hoverBorderWidth: 2 },
        line:  { tension: 0.4, borderWidth: 2.5, borderJoinStyle: 'round' },
      },
    };
  }

  // ——— Generate time labels ———
  function makeLabel() {
    const now = new Date();
    return `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
  }

  // ——— Build gradient fill ———
  function buildGradient(ctx, color) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 220);
    gradient.addColorStop(0,   color.fill.replace('0.12', '0.25'));
    gradient.addColorStop(0.5, color.fill);
    gradient.addColorStop(1,   color.fill.replace('0.12', '0.0'));
    return gradient;
  }

  // ——— Initialize all charts ———
  let charts = {};

  function init(historyLen) {
    // Destroy existing
    Object.values(charts).forEach(c => c && c.destroy && c.destroy());
    charts = {};

    const emptyData = Array(historyLen).fill(null);
    const emptyLabels = Array(historyLen).fill('');

    function makeDataset(label, color) {
      return {
        label,
        data: [...emptyData],
        borderColor:     color.line,
        backgroundColor: ctx => buildGradient(ctx.chart.ctx, color),
        fill:            true,
        pointBorderColor: color.line,
        cubicInterpolationMode: 'monotone',
      };
    }

    // Bandwidth
    charts.bandwidth = new Chart(
      document.getElementById('chartBandwidth').getContext('2d'),
      {
        type: 'line',
        data: {
          labels:   [...emptyLabels],
          datasets: [makeDataset('Bandwidth (Mbps)', COLORS.bandwidth)],
        },
        options: makeOptions('Bandwidth', 'Mbps', COLORS.bandwidth, 1000),
      }
    );

    // Latency
    charts.latency = new Chart(
      document.getElementById('chartLatency').getContext('2d'),
      {
        type: 'line',
        data: {
          labels:   [...emptyLabels],
          datasets: [makeDataset('Latency (ms)', COLORS.latency)],
        },
        options: makeOptions('Latency', 'ms', COLORS.latency, 500),
      }
    );

    // Throughput
    charts.throughput = new Chart(
      document.getElementById('chartThroughput').getContext('2d'),
      {
        type: 'line',
        data: {
          labels:   [...emptyLabels],
          datasets: [makeDataset('Throughput (Mbps)', COLORS.throughput)],
        },
        options: makeOptions('Throughput', 'Mbps', COLORS.throughput, 1000),
      }
    );

    // Packet Loss
    charts.packetloss = new Chart(
      document.getElementById('chartPacketloss').getContext('2d'),
      {
        type: 'line',
        data: {
          labels:   [...emptyLabels],
          datasets: [makeDataset('Packet Loss (%)', COLORS.packetloss)],
        },
        options: makeOptions('Packet Loss', '%', COLORS.packetloss, 100),
      }
    );

    // ——— Gauge Chart (doughnut) ———
    charts.gauge = new Chart(
      document.getElementById('gaugeChart').getContext('2d'),
      {
        type: 'doughnut',
        data: {
          datasets: [{
            data:            [100, 0],
            backgroundColor: ['#3b82f6', 'rgba(255,255,255,0.05)'],
            borderWidth:     0,
            borderRadius:    4,
            cutout:          '78%',
          }],
        },
        options: {
          responsive:          false,
          maintainAspectRatio: false,
          rotation:            -Math.PI,
          circumference:       Math.PI,
          animation:           { duration: 500 },
          plugins:             { legend: { display: false }, tooltip: { enabled: false } },
        },
      }
    );

    return charts;
  }

  // ——— Push new data point to a line chart ———
  function pushData(chart, value, maxPoints) {
    const data   = chart.data.datasets[0].data;
    const labels = chart.data.labels;

    data.push(value);
    labels.push(makeLabel());

    if (data.length   > maxPoints) data.shift();
    if (labels.length > maxPoints) labels.shift();

    chart.update('none');
  }

  // ——— Update all line charts ———
  function update(bw, lat, tp, pl, maxPoints) {
    if (charts.bandwidth)  pushData(charts.bandwidth,  bw,  maxPoints);
    if (charts.latency)    pushData(charts.latency,    lat, maxPoints);
    if (charts.throughput) pushData(charts.throughput, tp,  maxPoints);
    if (charts.packetloss) pushData(charts.packetloss, pl,  maxPoints);
  }

  // ——— Update gauge chart ———
  function updateGauge(score) {
    if (!charts.gauge) return;

    // Color based on score
    let color;
    if      (score >= 81) color = '#3b82f6';
    else if (score >= 66) color = '#22c55e';
    else if (score >= 41) color = '#f59e0b';
    else                  color = '#ef4444';

    charts.gauge.data.datasets[0].data            = [score, 100 - score];
    charts.gauge.data.datasets[0].backgroundColor = [color, 'rgba(255,255,255,0.05)'];
    charts.gauge.update();
  }

  return { init, update, updateGauge };
})();
