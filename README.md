# NetPulse — Real-Time Network Performance Analyzer

> A stunning browser-based dashboard for monitoring and analyzing network bandwidth, latency, throughput, and packet loss in real time.

![NetPulse Dashboard](assets/favicon.svg)

---

## 🚀 Features

| Feature | Description |
|---------|-------------|
| 📊 **Live Charts** | 4 animated real-time line charts updating every second |
| 🎛️ **Metric Cards** | Bandwidth (Mbps), Latency (ms), Throughput (Mbps), Packet Loss (%) |
| 📈 **Historical Stats** | Min / Average / Max for every metric |
| 🔔 **Smart Alerts** | Threshold-based warnings & critical notifications |
| 🌐 **Network Quality Score** | Composite 0–100 score with color-coded gauge |
| 🔴 **Connection Status** | Live quality badge (Excellent / Good / Fair / Poor) |
| 🎭 **Simulation Modes** | Simulate congestion, outages, and recovery with one click |
| ⚙️ **Configurable** | Adjustable update interval (0.5s – 5s) and chart history (30–120 pts) |
| 📋 **Connection Info** | Interface, IP, DNS, Jitter, Uptime, Total Data, Packets Sent |
| 🌙 **Dark Mode UI** | Glassmorphism, neon accents, animated gradient background |

---

## 📁 Project Structure

```
NetPulse/
├── index.html          # Main dashboard page
├── css/
│   └── style.css       # Full design system & animations
├── js/
│   ├── metrics.js      # Network simulation engine (noise + spikes)
│   ├── charts.js       # Chart.js initialization & real-time updates
│   ├── ui.js           # DOM updates, alerts, badges, stats
│   └── app.js          # Main controller & event bindings
├── assets/
│   └── favicon.svg     # Custom SVG icon
└── README.md           # Project documentation
```

---

## 🛠️ Tech Stack

- **HTML5** — Semantic markup, accessibility attributes
- **CSS3** — Custom properties, glassmorphism, CSS animations, responsive grid
- **Vanilla JavaScript** — ES6+ modules, closure-based architecture
- **[Chart.js v4](https://www.chartjs.org/)** — Real-time canvas charts with gradient fills
- **[Font Awesome 6](https://fontawesome.com/)** — Icon library
- **[Google Fonts](https://fonts.google.com/)** — Inter + JetBrains Mono typography

---

## ▶️ Getting Started

### Option 1: Open Directly
Just open `index.html` in any modern browser — no server required!

```
double-click index.html
```

### Option 2: Local Dev Server
If you have Node.js installed:

```bash
npx serve .
# or
npx http-server .
```

### Option 3: Python
```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`

---

## 📊 Metrics Explained

| Metric | Unit | Description |
|--------|------|-------------|
| **Bandwidth** | Mbps | Maximum data transfer rate of the network link |
| **Latency** | ms | Round-trip time for a packet to travel to a destination and back |
| **Throughput** | Mbps | Actual data successfully delivered per unit time |
| **Packet Loss** | % | Percentage of transmitted packets that fail to reach the destination |
| **Jitter** | ms | Variation in latency between successive packets |

### Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Bandwidth | < 30 Mbps | < 10 Mbps |
| Latency | > 150 ms | > 300 ms |
| Throughput | < 20 Mbps | < 5 Mbps |
| Packet Loss | > 5% | > 20% |

---

## 🎮 Controls

| Control | Action |
|---------|--------|
| **Pause / Resume** | Freeze or continue real-time monitoring |
| **Reset Stats** | Clear all historical data and restart counters |
| **Simulate Congestion** | Trigger a high-latency / low-bandwidth scenario |
| **Simulate Outage** | Simulate a near-complete network failure |
| **Recover** | Return network to normal operating conditions |
| **Update Interval** | Set how often metrics update (0.5s, 1s, 2s, 5s) |
| **History** | Set how many data points are shown per chart |

---

## 🏗️ Architecture

```
app.js (Controller)
   │
   ├── metrics.js (Simulation Engine)
   │      ├── tick()          → generates one sample of all 4 metrics
   │      ├── setMode()       → switch simulation mode
   │      ├── qualityScore()  → compute composite quality 0–100
   │      └── getStats()      → min/avg/max over history
   │
   ├── charts.js (Visualization)
   │      ├── init()          → create all Chart.js instances
   │      ├── update()        → push new data to line charts
   │      └── updateGauge()   → update doughnut gauge
   │
   └── ui.js (DOM Layer)
          ├── update()        → refresh all metric displays
          ├── addAlert()      → push new alert to panel
          ├── setLiveState()  → toggle live/paused indicator
          └── updateQualityBadge() → refresh connection quality
```

---

## 🎓 College Mini Project — Computer Networks

This project demonstrates core concepts from **Computer Networks**:

1. **Network Metrics** — Understanding and visualizing bandwidth, latency, throughput, packet loss
2. **Real-Time Monitoring** — Polling-based metric collection with configurable intervals
3. **Statistical Analysis** — Rolling min/avg/max computation over sliding windows
4. **Threshold Alerting** — Rule-based anomaly detection and notification
5. **Data Visualization** — Time-series charts with Chart.js for performance analysis
6. **Quality of Service (QoS)** — Composite scoring of network health

---

## 👨‍💻 Author

Built with ❤️ for College Mini Project — 2026

---

## 📄 License

MIT License — Free to use, modify, and distribute.
