import type { Ephemeris } from '../types'

export interface DistanceInfo {
  traveled: number   // km (현재까지 이동한 실제 경로 길이)
  total: number      // km (전체 미션 경로 길이)
}

const LAUNCH = new Date('2026-04-01T22:35:12Z')

function missionElapsedTime(now: Date): string {
  const ms = now.getTime() - LAUNCH.getTime()
  if (ms < 0) return 'T-00:00:00'
  const s  = Math.floor(ms / 1000)
  const hh = Math.floor(s / 3600).toString().padStart(3, '0')
  const mm = Math.floor((s % 3600) / 60).toString().padStart(2, '0')
  const ss = (s % 60).toString().padStart(2, '0')
  return `T+${hh}:${mm}:${ss}`
}

function formatUTC(date: Date): string {
  return date.toUTCString().replace('GMT', 'UTC')
}

// ── Count animation ──────────────────────────────────────────────────────────

const ANIM_MS = 600

// el에 _prevVal / _raf 를 붙여 진행 중인 애니메이션을 덮어쓸 수 있게 함
interface AnimEl extends HTMLElement {
  _prevVal?: number
  _raf?: number
}

function countAnimate(id: string, newVal: number, fmt: (v: number) => string): void {
  const el = document.getElementById(id) as AnimEl | null
  if (!el) return
  const node: AnimEl = el  // non-null ref for closure

  const prevVal = node._prevVal ?? newVal
  node._prevVal = newVal

  if (prevVal === newVal) return

  if (node._raf) cancelAnimationFrame(node._raf)

  const start = performance.now()
  const diff  = newVal - prevVal

  function tick(now: number) {
    const t     = Math.min((now - start) / ANIM_MS, 1)
    const eased = t * (2 - t)               // easeQuadOut
    node.textContent = fmt(prevVal + diff * eased)
    if (t < 1) node._raf = requestAnimationFrame(tick)
  }

  node._raf = requestAnimationFrame(tick)
}

// ── DOM IDs ──────────────────────────────────────────────────────────────────

const MET_ID = 'telem-met'
const UTC_ID = 'telem-utc'

const ID = {
  speed:       'telem-speed-num',
  distEarth:   'telem-dist-earth-num',
  distMoon:    'telem-dist-moon-num',
  traveled:    'telem-traveled-num',
  total:       'telem-total-num',
  progress:    'telem-progress-val',
  progressBar: 'telem-progress-bar',
}

let initialized = false

// ── Public API ────────────────────────────────────────────────────────────────

export function updateTelemetry(
  el: HTMLElement,
  data: Ephemeris,
  dist: DistanceInfo,
): void {
  const met      = missionElapsedTime(data.time)
  const progress = dist.total > 0 ? (dist.traveled / dist.total) * 100 : 0

  if (!initialized) {
    el.innerHTML = `
      <div class="telem-row">
        <span class="telem-label">MISSION TIME</span>
        <span class="telem-value" id="${MET_ID}">${met}</span>
      </div>
      <div class="telem-row">
        <span class="telem-label">UTC</span>
        <span class="telem-value" id="${UTC_ID}">${formatUTC(data.time)}</span>
      </div>
      <div class="telem-row">
        <span class="telem-label">SPEED</span>
        <span class="telem-value telem-highlight"><span id="${ID.speed}">${data.speed.toFixed(3)}</span> <span class="telem-unit">km/s</span></span>
      </div>
      <div class="telem-row">
        <span class="telem-label">DIST / EARTH</span>
        <span class="telem-value"><span id="${ID.distEarth}">${Math.round(data.distanceFromEarth).toLocaleString()}</span> <span class="telem-unit">km</span></span>
      </div>
      <div class="telem-row">
        <span class="telem-label">DIST / MOON</span>
        <span class="telem-value"><span id="${ID.distMoon}">${Math.round(data.distanceFromMoon).toLocaleString()}</span> <span class="telem-unit">km</span></span>
      </div>
      <div class="telem-row">
        <span class="telem-label">TRAVELED</span>
        <span class="telem-value telem-highlight"><span id="${ID.traveled}">${Math.round(dist.traveled).toLocaleString()}</span> <span class="telem-unit">km</span></span>
      </div>
      <div class="telem-row">
        <span class="telem-label">TOTAL MISSION</span>
        <span class="telem-value"><span id="${ID.total}">${dist.total > 0 ? Math.round(dist.total).toLocaleString() : '—'}</span> <span class="telem-unit">km</span></span>
      </div>
      <div class="telem-row">
        <span class="telem-label">PROGRESS</span>
        <div class="progress-bar-wrap">
          <div class="progress-bar-fill" id="${ID.progressBar}" style="width:${progress.toFixed(1)}%"></div>
        </div>
        <span class="telem-value telem-small"><span id="${ID.progress}">${progress.toFixed(1)}</span>%</span>
      </div>
    `
    initialized = true
    cachedMetEl = null
    cachedUtcEl = null

    // _prevVal 초기화
    const initNum = (id: string, v: number) => {
      const e = document.getElementById(id) as AnimEl | null
      if (e) e._prevVal = v
    }
    initNum(ID.speed,     data.speed)
    initNum(ID.distEarth, data.distanceFromEarth)
    initNum(ID.distMoon,  data.distanceFromMoon)
    initNum(ID.traveled,  dist.traveled)
    initNum(ID.progress,  progress)
    return
  }

  countAnimate(ID.speed,     data.speed,              v => v.toFixed(3))
  countAnimate(ID.distEarth, data.distanceFromEarth,  v => Math.round(v).toLocaleString())
  countAnimate(ID.distMoon,  data.distanceFromMoon,   v => Math.round(v).toLocaleString())
  countAnimate(ID.traveled,  dist.traveled,           v => Math.round(v).toLocaleString())
  countAnimate(ID.progress,  progress,                v => v.toFixed(1))

  const totalEl = document.getElementById(ID.total)
  if (totalEl) {
    const newTotal = dist.total > 0 ? Math.round(dist.total).toLocaleString() : '—'
    if (totalEl.textContent !== newTotal) totalEl.textContent = newTotal
  }

  const progressBar = document.getElementById(ID.progressBar) as HTMLElement | null
  if (progressBar) progressBar.style.width = `${progress.toFixed(1)}%`
}

// ── Time ticker ───────────────────────────────────────────────────────────────

let cachedMetEl: HTMLElement | null = null
let cachedUtcEl: HTMLElement | null = null
let tickerId: ReturnType<typeof setInterval> | null = null

export function startTimeTicker(): void {
  tickerId = setInterval(() => {
    cachedMetEl ??= document.getElementById(MET_ID)
    cachedUtcEl ??= document.getElementById(UTC_ID)
    const now = new Date()
    if (cachedMetEl) cachedMetEl.textContent = missionElapsedTime(now)
    if (cachedUtcEl) cachedUtcEl.textContent = formatUTC(now)
  }, 1000)
}

export function stopTimeTicker(): void {
  if (tickerId !== null) {
    clearInterval(tickerId)
    tickerId = null
  }
}
