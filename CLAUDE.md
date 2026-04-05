# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server (localhost:5173)
npm run build     # TypeScript compile + Vite production build (tsc && vite build)
npm run preview   # Preview production build locally
```

No test runner or linter is configured — TypeScript strict mode (`tsc`) is the primary static check. Run `npx tsc --noEmit` to type-check without building.

## Architecture

**Artemis II real-time mission tracker** — visualizes the spacecraft trajectory from Earth to Moon (April 2–11, 2026) using NASA Horizons ephemeris data. Plain TypeScript + Vite, no framework.

### Data Flow

```
NASA Horizons API (ssd.jpl.nasa.gov)
  ↓ /api/horizons.ts (Vercel Edge proxy, CORS bypass)
  ↓ src/horizons.ts  (HTTP fetch, CSV parse from SOE/EOE markers)
  ↓ Ephemeris { position: Vec3(km), velocity: Vec3(km/s), distanceFromEarth, distanceFromMoon, speed }
  ↓ src/main.ts      (orchestration: startup load + 30s polling)
  ├→ src/canvas/orbit.ts      (Canvas 2D, requestAnimationFrame loop)
  ├→ src/canvas/background.ts (animated starfield)
  ├→ src/dashboard/gauges.ts  (D3.js arc gauges)
  └→ src/dashboard/telemetry.ts (DOM innerHTML updates)
```

### Key Modules

| File | Responsibility |
|------|---------------|
| `src/main.ts` | App entry: trajectory pre-load on startup, 30s polling for live telemetry, render loop coordination |
| `src/horizons.ts` | NASA Horizons API client — two functions: `fetchEphemeris()` (single point) and `fetchFullTrajectory()` (9-day window, 30min steps) |
| `src/types.ts` | Core interfaces: `Ephemeris`, `TrajectoryPoint`, `Vec3` |
| `src/canvas/orbit.ts` | ICRF X-Y plane projection to canvas coords; renders Earth, Moon (27.3-day orbit), full-mission dashed path, traveled-path blue gradient, and spacecraft marker |
| `src/dashboard/gauges.ts` | D3.js arc gauges for velocity and distances (600ms transitions) |
| `src/dashboard/telemetry.ts` | Mission elapsed time (T+HH:MM:SS), distance/speed readouts, progress bar |
| `api/horizons.ts` | Vercel Edge Function that proxies requests to `ssd.jpl.nasa.gov` |

### NASA Horizons API

- **Object ID:** `-1024` (Artemis II)
- **Center:** `500@399` (Earth-centered ICRF)
- **Units:** km and km/s
- **Dev proxy:** Vite rewrites `/api/horizons` → `https://ssd.jpl.nasa.gov/api/horizons.api`
- **Prod proxy:** Vercel Edge Function at `api/horizons.ts`
- Response is JSON with CSV embedded in a `result` string; data rows are delimited by `$$SOE` / `$$EOE` markers

### Coordinate System

All trajectory points are stored in ICRF (Earth-centered inertial) coordinates from Horizons, then transformed into an **Earth-Moon rotating frame** (Moon fixed at angle 0 on the right) before rendering. This transform is applied once after `fetchFullTrajectory()` and again per `pollTelemetry()` call. `getMoonAngle(tMs)` computes the Moon's orbital phase; the inverse rotation `(-angle)` is applied to spacecraft X/Y. The `getApproxMoonPos()` function is used only for `distanceFromMoon` computation in `parseFirstPoint`, not for canvas positioning.

### Canvas Rendering

Drawing order per frame: clear → stars (drift animation) → update moon angle → Earth + Moon bodies → traveled trajectory (blue gradient) → spacecraft dot + glow.

`drawFullOrbit` (white dashed full trajectory) exists in `orbit.ts` but is currently commented out in `main.ts`. Only the traveled portion (blue glow, 16-segment gradient) is rendered. Scale adapts dynamically to viewport size; Earth is offset slightly up-left so the trajectory arc is centered.

### Mission Constants

- Launch: `2026-04-01T22:35:12Z`
- Trajectory window: `2026-04-02T02:00Z` – `2026-04-11T01:00Z`
- Polling interval: 30 seconds
- Trajectory step size: 30-minute intervals (~430 points total)

### Deployment

Deployed on Vercel. The `api/` directory contains Vercel Edge Functions. `vite.config.ts` sets `base: '/'` and configures the dev proxy.
