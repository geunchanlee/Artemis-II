import type { Ephemeris } from '../types'

export interface DistanceInfo {
  traveled: number   // km (현재까지 이동한 실제 경로 길이)
  total: number      // km (전체 미션 경로 길이)
}

const MET_ID = 'telem-met'
const UTC_ID = 'telem-utc'

function formatUTC(date: Date): string {
  return date.toUTCString().replace('GMT', 'UTC')
}

export function updateTelemetry(
  el: HTMLElement,
  data: Ephemeris,
  dist: DistanceInfo,
): void {
  const met      = missionElapsedTime(data.time)
  const progress = dist.total > 0 ? (dist.traveled / dist.total) * 100 : 0

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
      <span class="telem-value telem-highlight">${data.speed.toFixed(3)} <span class="telem-unit">km/s</span></span>
    </div>
    <div class="telem-row">
      <span class="telem-label">DIST / EARTH</span>
      <span class="telem-value">${Math.round(data.distanceFromEarth).toLocaleString()} <span class="telem-unit">km</span></span>
    </div>
    <div class="telem-row">
      <span class="telem-label">DIST / MOON</span>
      <span class="telem-value">${Math.round(data.distanceFromMoon).toLocaleString()} <span class="telem-unit">km</span></span>
    </div>
    <div class="telem-row">
      <span class="telem-label">TRAVELED</span>
      <span class="telem-value telem-highlight">${Math.round(dist.traveled).toLocaleString()} <span class="telem-unit">km</span></span>
    </div>
    <div class="telem-row">
      <span class="telem-label">TOTAL MISSION</span>
      <span class="telem-value">${dist.total > 0 ? Math.round(dist.total).toLocaleString() : '—'} <span class="telem-unit">km</span></span>
    </div>
    <div class="telem-row">
      <span class="telem-label">PROGRESS</span>
      <div class="progress-bar-wrap">
        <div class="progress-bar-fill" style="width:${progress.toFixed(1)}%"></div>
      </div>
      <span class="telem-value telem-small">${progress.toFixed(1)}%</span>
    </div>
  `

  // innerHTML 재빌드 후 캐시 무효화
  cachedMetEl = null
  cachedUtcEl = null
}

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
