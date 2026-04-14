# Artemis II · Earth–Moon Transit Tracker 🚀

![Artemis II Tracker](https://img.shields.io/badge/Artemis%20II-Mission%20Tracker-2a7de1?style=for-the-badge)
![Vibe Coding](https://img.shields.io/badge/Vibe_Coding-Claude_Code_%26_Gemini_CLI-9ad8f0?style=for-the-badge)

[**한국어 (Korean)**](./README.ko.md) | **English**

**[Live Demo → https://artemis-ii-kappa.vercel.app/](https://artemis-ii-kappa.vercel.app/)**

---

## 🌌 Overview

A real-time, interactive web dashboard tracking the orbital trajectory of NASA's **Artemis II** mission. Built entirely through **"Vibe Coding"**—an AI-assisted development process using [Claude Code](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview) for initial scaffolding and [Gemini CLI](https://github.com/google/gemini-cli) for iterative refinement, feature implementation, and deployment.

### ✨ Features
*   **Real-Time Ephemeris Data:** Fetches live spacecraft telemetry (speed, distance from Earth/Moon) directly from the **NASA JPL Horizons API**.
*   **Dynamic Orbital Rendering:** Visualizes the Earth-Moon system and the spacecraft's trajectory on a dynamic HTML5 Canvas, simulating the rotating reference frame.
*   **Mission Telemetry Dashboard:** Displays critical mission metrics including Mission Elapsed Time (MET), UTC, velocity, traveled distance, and progress percentage.
*   **Vercel Edge Proxy:** Bypasses CORS restrictions seamlessly using a Vercel Edge Function proxy for the NASA API.

### 🛠️ Tech Stack
*   **Frontend:** TypeScript, Vite, HTML5 Canvas API, D3.js, Vanilla CSS
*   **Data Source:** NASA JPL Horizons REST API
*   **Deployment & Analytics:** Vercel, Vercel Web Analytics
*   **AI Development:** Claude Code, Gemini CLI

### 🚀 Getting Started
```bash
# 1. Clone the repository
git clone https://github.com/geunchanlee/Artemis-II.git
cd Artemis-II

# 2. Install dependencies
npm install

# 3. Run the development server
npm run dev
```

### 📜 Credits
*   **Data:** NASA JPL Horizons API
*   **Images:** NASA (Public Domain)

---

*This project is open-source under the MIT License.*
