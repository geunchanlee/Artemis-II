# Artemis II · Earth–Moon Transit Tracker 🚀

![Artemis II Tracker](https://img.shields.io/badge/Artemis%20II-Mission%20Tracker-2a7de1?style=for-the-badge)
![Vibe Coding](https://img.shields.io/badge/Vibe_Coding-Claude_Code_%26_Gemini_CLI-9ad8f0?style=for-the-badge)

[**한국어 (Korean)**](#한국어) | [**English**](#english)

---

<a id="english"></a>
## 🌌 Overview (English)

A real-time, interactive web dashboard tracking the orbital trajectory of NASA's **Artemis II** mission. Built entirely through **"Vibe Coding"**—an AI-assisted development process using [Claude Code](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview) for initial scaffolding and [Gemini CLI](https://github.com/google/gemini-cli) for iterative refinement, feature implementation, and deployment.

### ✨ Features
*   **Real-Time Ephemeris Data:** Fetches live spacecraft telemetry (speed, distance from Earth/Moon) directly from the **NASA JPL Horizons API**.
*   **Dynamic Orbital Rendering:** Visualizes the Earth-Moon system and the spacecraft's trajectory on a dynamic HTML5 Canvas, simulating the rotating reference frame.
*   **Mission Telemetry Dashboard:** Displays critical mission metrics including Mission Elapsed Time (MET), UTC, velocity, traveled distance, and progress percentage.
*   **Vercel Edge Proxy:** Bypasses CORS restrictions seamlessly using a Vercel Edge Function proxy for the NASA API.

### 🛠️ Tech Stack
*   **Frontend:** TypeScript, Vite, HTML5 Canvas API, Vanilla CSS
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

<a id="한국어"></a>
## 🌌 프로젝트 소개 (Korean)

NASA의 **아르테미스 2호(Artemis II)** 미션 궤도를 실시간으로 추적하는 인터랙티브 웹 대시보드입니다. 이 프로젝트는 순수하게 **"바이브 코딩(Vibe Coding)"** 방식을 통해 개발되었습니다. 초기 프로젝트 구조 설계는 [Claude Code](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview)를 활용했으며, 이후 상세 기능 구현, UI 개선, 버그 수정 및 Vercel 배포 과정은 모두 [Gemini CLI](https://github.com/google/gemini-cli) 에이전트와 대화하며 완성했습니다.

### ✨ 주요 기능
*   **실시간 위치 데이터:** **NASA JPL Horizons API**에서 우주선의 실시간 텔레메트리(속도, 지구 및 달과의 거리)를 직접 가져옵니다.
*   **동적 궤도 렌더링:** HTML5 캔버스를 사용하여 지구-달 시스템과 우주선의 궤적을 동적으로 시각화합니다. (회전 좌표계 적용)
*   **미션 대시보드:** 미션 경과 시간(MET), 현재 속도, 이동 거리, 전체 미션 진행률 등 핵심 데이터를 직관적인 계기판과 텍스트로 제공합니다.
*   **Vercel Edge 프록시:** 브라우저의 CORS(교차 출처 리소스 공유) 제한을 우회하기 위해 Vercel Edge Function을 활용하여 NASA API와 통신합니다.

### 🛠️ 기술 스택
*   **프론트엔드:** TypeScript, Vite, HTML5 Canvas API, 순수(Vanilla) CSS
*   **데이터 출처:** NASA JPL Horizons REST API
*   **배포 및 통계:** Vercel, Vercel Web Analytics
*   **AI 개발 도구:** Claude Code, Gemini CLI

### 🚀 로컬 실행 방법
```bash
# 1. 저장소 클론
git clone https://github.com/geunchanlee/Artemis-II.git
cd Artemis-II

# 2. 패키지 설치
npm install

# 3. 로컬 개발 서버 실행
npm run dev
```

### 📜 출처 및 저작권
*   **데이터:** NASA JPL Horizons API
*   **이미지:** NASA (퍼블릭 도메인)

---

*This project is open-source under the MIT License.*
