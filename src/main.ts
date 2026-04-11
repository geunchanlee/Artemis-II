import './style.css'
import { inject } from '@vercel/analytics'
import { generateStars, drawStars } from './canvas/background'
import { makeScene, updateMoonAngle, drawBodies, drawTraveledOrbit, drawSpacecraft } from './canvas/orbit'
import { initGauges, updateGauges, setGaugeMax, setGaugeMin } from './dashboard/gauges'
import { updateTelemetry, startTimeTicker, freezeTimeTo } from './dashboard/telemetry'
import { fetchEphemeris, fetchFullTrajectory, TRAJECTORY_START, MISSION_END, getMoonAngle } from './horizons'
import type { Ephemeris, TrajectoryPoint } from './types'

// ─── DOM ─────────────────────────────────────────────────────────────────────
inject()

const app = document.getElementById('app')!
app.innerHTML = `
  <div id="canvas-wrap">
    <span class="canvas-title"><span class="canvas-title-mission">Artemis II</span><span class="canvas-title-sub"> · Earth–Moon Transit</span></span>
    <canvas id="main-canvas"></canvas>
  </div>
  <aside id="sidebar">
    <div class="sidebar-section">
      <div class="sidebar-section-title">Status</div>
      <div id="status">
        <div id="status-dot" class="loading"></div>
        <span id="status-text">Fetching telemetry…</span>
      </div>
    </div>
    <div class="sidebar-section">
      <div class="sidebar-section-title">Gauges</div>
      <div id="gauges"></div>
    </div>
    <div class="sidebar-section">
      <div class="sidebar-section-title">Telemetry</div>
      <div id="telemetry"></div>
    </div>
    <div class="sidebar-section" style="margin-top: 1rem; text-align: center; padding-bottom: 1rem; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 1rem; display: flex; flex-direction: column; gap: 0.5rem;">
      <a href="https://www.nasa.gov/mission/artemis-ii/" target="_blank" rel="noopener noreferrer" style="color: #2a7de1; text-decoration: none; font-size: 0.7rem; letter-spacing: 1.5px; text-transform: uppercase; display: inline-flex; align-items: center; justify-content: center; gap: 6px; opacity: 0.8; transition: opacity 0.2s;" onmouseover="this.style.opacity='1'; this.style.color='#9ad8f0'" onmouseout="this.style.opacity='0.8'; this.style.color='#2a7de1'">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
        Official Mission Page
      </a>
      
      <!-- GitHub 레포지토리 링크 -->
      <a href="https://github.com/geunchanlee/Artemis-II" target="_blank" rel="noopener noreferrer" style="color: #2a7de1; text-decoration: none; font-size: 0.7rem; letter-spacing: 1.5px; text-transform: uppercase; display: inline-flex; align-items: center; justify-content: center; gap: 6px; opacity: 0.8; transition: opacity 0.2s;" onmouseover="this.style.opacity='1'; this.style.color='#9ad8f0'" onmouseout="this.style.opacity='0.8'; this.style.color='#2a7de1'">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
        View on GitHub
      </a>

      <div style="margin-top: 0.5rem; font-size: 0.6rem; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 1px;">
        Data: NASA JPL Horizons API<br>
        Images: NASA
      </div>
    </div>
  </aside>
`

const canvas     = document.getElementById('main-canvas') as HTMLCanvasElement
const ctx        = canvas.getContext('2d')!
const statusDot  = document.getElementById('status-dot')!
const statusText = document.getElementById('status-text')!

// ─── 궤도 마커 (DOM 오버레이) ─────────────────────────────────────────────────
const flybyMarker = document.createElement('a')
flybyMarker.href = 'https://www.nasa.gov/gallery/lunar-flyby/'
flybyMarker.target = '_blank'
flybyMarker.rel = 'noopener noreferrer'
flybyMarker.className = 'orbit-marker'
flybyMarker.style.display = 'none'
flybyMarker.innerHTML = `<span class="orbit-marker-dot"></span><span class="orbit-marker-label">LUNAR FLYBY</span>`
document.getElementById('canvas-wrap')!.appendChild(flybyMarker)

let flybyPoint: { x: number; y: number } | null = null

function updateMarkerPositions(): void {
  if (!flybyPoint) return
  const sx = scene.cx + flybyPoint.x * scene.scale
  const sy = scene.cy - flybyPoint.y * scene.scale
  // 달 중심에서 마커 방향 단위벡터로 7px 밀어 궤도 선 위에 정렬
  const MOON_X_ROT = 384_400
  const dx = flybyPoint.x - MOON_X_ROT, dy = flybyPoint.y
  const dist = Math.hypot(dx, dy)
  const nudge = 3
  const nx = dist > 0 ? (dx / dist) * nudge : 0
  const ny = dist > 0 ? (dy / dist) * nudge : 0
  flybyMarker.style.left = `${sx + nx}px`
  flybyMarker.style.top  = `${sy - ny}px`
  flybyMarker.style.display = ''
}

initGauges(document.getElementById('gauges')!)

// ─── 크기 조정 ────────────────────────────────────────────────────────────────
let scene = makeScene(canvas.width, canvas.height)

function resize(): void {
  const wrap = canvas.parentElement!
  canvas.width  = wrap.clientWidth
  canvas.height = wrap.clientHeight
  generateStars(canvas.width, canvas.height)
  scene = makeScene(canvas.width, canvas.height)
  updateMarkerPositions()
}

window.addEventListener('resize', resize)
resize()

// ─── 상태 ────────────────────────────────────────────────────────────────────
let ephemeris: Ephemeris | null = null

/** 발사~귀환 전체 궤적 (30분 간격) */
let fullTrajectory: TrajectoryPoint[] = []

/** 현재 시각 기준으로 분리한 지나간 궤적 */
let traveledPoints: Array<{ x: number; y: number; d?: number; v?: number }> = []

let traveledKm = 0
let totalKm    = 1100000  // 아르테미스 2호 전체 미션 왕복 거리 추정치 고정

// ─── 궤적 분리 & 거리 계산 ────────────────────────────────────────────────────

/** fullTrajectory를 현재 시각 기준으로 분리하고 거리를 계산한다 */
function splitTrajectory(nowMs: number): void {
  if (fullTrajectory.length === 0) return

  // 현재 시각 이전의 마지막 인덱스를 찾는다
  let splitIdx = fullTrajectory.length - 1
  for (let i = 0; i < fullTrajectory.length; i++) {
    if (fullTrajectory[i].t > nowMs) { splitIdx = Math.max(0, i - 1); break }
  }

  traveledPoints = fullTrajectory.slice(0, splitIdx + 1)
  
  let d = traveledPoints.length > 0 ? (traveledPoints[traveledPoints.length - 1].d || 0) : 0

  // 다음 지점이 있다면, 시간 비율에 따라 거리를 보간(Interpolate)하여 더 부드럽게 증가하도록 함
  if (splitIdx < fullTrajectory.length - 1) {
    const p1 = fullTrajectory[splitIdx]
    const p2 = fullTrajectory[splitIdx + 1]
    const ratio = Math.max(0, Math.min(1, (nowMs - p1.t) / (p2.t - p1.t)))
    const extraDist = ((p2.d || 0) - (p1.d || 0)) * ratio
    d += extraDist
  }
  
  traveledKm = d
}

// ─── 미션 궤적 로드 (앱 시작 시 + 실패 시 재시도) ───────────────────────────────

async function loadFullTrajectory(): Promise<void> {
  try {
    // 1차: 전체 범위(과거 + 미래 예측) 시도
    fullTrajectory = await fetchFullTrajectory(TRAJECTORY_START, MISSION_END, 2)
    console.info(`[Artemis] Full trajectory: ${fullTrajectory.length} pts`)
  } catch (e1) {
    console.warn('[Artemis] Full trajectory failed, trying historical only:', e1)
    try {
      // 2차: 미래 예측 데이터 없을 경우 현재까지만 취득
      fullTrajectory = await fetchFullTrajectory(TRAJECTORY_START, new Date(), 2)
      console.info(`[Artemis] Historical trajectory: ${fullTrajectory.length} pts`)
    } catch (e2) {
      console.error('[Artemis] Trajectory load failed:', e2)
      return
    }
  }

  // 회전 좌표계로 변환하기 '전'에 실제 우주선의 관성 좌표계 상 이동 거리 누적 계산 및 최고 속도 갱신
  let cumDist = 0
  let maxSpeed = 0
  for (let i = 0; i < fullTrajectory.length; i++) {
    if (i > 0) {
      const prev = fullTrajectory[i-1]
      const curr = fullTrajectory[i]
      cumDist += Math.hypot(curr.x - prev.x, curr.y - prev.y, curr.z - prev.z)
    }
    fullTrajectory[i].d = cumDist
    if (fullTrajectory[i].v && fullTrajectory[i].v! > maxSpeed) {
      maxSpeed = fullTrajectory[i].v!
    }
  }

  // 최고 속도를 속도 게이지의 최대값(100%)으로 설정
  if (maxSpeed > 0) {
    setGaugeMax('speed', Math.ceil(maxSpeed * 10) / 10)
  }

  // 실제 총 이동 거리(마지막 포인트 누적값)를 미션 거리로 사용
  totalKm = Math.round(fullTrajectory[fullTrajectory.length - 1].d ?? 0)

  // 달의 위치를 고정하기 위해 지구-달 회전 좌표계로 변환 (Moon at Angle 0)
  // 변환 후 지구/달 최대 거리를 계산하여 게이지 스케일 설정
  const MOON_ORBITAL_RADIUS = 384400 // km (근사값)
  let maxDistEarth = 0
  let maxDistMoon  = 0
  fullTrajectory.forEach(pt => {
    const angle = getMoonAngle(pt.t)
    const cos = Math.cos(-angle)
    const sin = Math.sin(-angle)
    const rx = pt.x * cos - pt.y * sin
    const ry = pt.x * sin + pt.y * cos
    pt.x = rx
    pt.y = ry

    const dE = Math.hypot(pt.x, pt.y, pt.z)
    const dM = Math.hypot(pt.x - MOON_ORBITAL_RADIUS, pt.y, pt.z)
    if (dE > maxDistEarth) maxDistEarth = dE
    if (dM > maxDistMoon)  maxDistMoon  = dM
  })

  // 게이지 최대값을 실제 미션 최대 거리에 맞춰 설정 (1,000 km 단위 올림)
  if (maxDistEarth > 0) setGaugeMax('distEarth', Math.ceil(maxDistEarth / 1000) * 1000)
  if (maxDistMoon  > 0) setGaugeMax('distMoon',  Math.ceil(maxDistMoon  / 1000) * 1000)
  setGaugeMin('distEarth', 0)

  // 루나 플라이바이 포인트 탐색: 회전 좌표계에서 달(384,400, 0)에 가장 가까운 점
  const MOON_X_ROT = 384_400
  let flybyIdx = 0, minDist2 = Infinity
  for (let i = 0; i < fullTrajectory.length; i++) {
    const dx = fullTrajectory[i].x - MOON_X_ROT
    const dy = fullTrajectory[i].y
    const d2 = dx * dx + dy * dy
    if (d2 < minDist2) { minDist2 = d2; flybyIdx = i }
  }
  flybyPoint = fullTrajectory[flybyIdx]
  updateMarkerPositions()

  splitTrajectory(Date.now())
}

// ─── 실시간 폴링 (30초마다) ──────────────────────────────────────────────────

async function pollTelemetry(): Promise<void> {
  // 미션 종료 여부 확인 (30초마다 1번씩만 체크하여 성능 부하 최소화)
  if (Date.now() > MISSION_END.getTime()) {
    statusDot.className = 'complete'
    statusText.textContent = 'MISSION COMPLETE'

    // 최종 데이터가 아직 없으면 한 번만 fetch/구성하여 고정 표시
    if (!ephemeris) {
      let finalData: import('./types').Ephemeris | null = null

      try {
        // 1차: NASA API에서 MISSION_END 시각 데이터 fetch
        const data = await fetchEphemeris(MISSION_END)
        const angle = getMoonAngle(MISSION_END.getTime())
        const cos = Math.cos(-angle)
        const sin = Math.sin(-angle)
        const rx = data.position.x * cos - data.position.y * sin
        const ry = data.position.x * sin + data.position.y * cos
        data.position.x = rx
        data.position.y = ry
        finalData = data
      } catch (e) {
        console.warn('[Artemis] Final API fetch failed, falling back to trajectory data:', e)
        // 2차: fullTrajectory 마지막 포인트로 Ephemeris 구성 (이미 회전 좌표계)
        if (fullTrajectory.length > 0) {
          const pt = fullTrajectory[fullTrajectory.length - 1]
          const MOON_ORBITAL_RADIUS = 384400 // km (근사값)
          finalData = {
            time: new Date(pt.t),
            position: { x: pt.x, y: pt.y, z: pt.z },
            velocity: { x: 0, y: 0, z: 0 },
            distanceFromEarth: Math.hypot(pt.x, pt.y, pt.z),
            distanceFromMoon:  Math.hypot(pt.x - MOON_ORBITAL_RADIUS, pt.y, pt.z),
            speed: pt.v ?? 0,
          }
        }
      }

      if (finalData) {
        // 미션 종료 = 지구 귀환 완료 → 지구와의 거리를 지구 반지름(착수)으로 고정
        const lastTelemetryTime = new Date(finalData.time)
        finalData.distanceFromEarth = 6371

        ephemeris = finalData
        splitTrajectory(finalData.time.getTime())
        updateGauges({
          speed:     finalData.speed,
          distEarth: finalData.distanceFromEarth,
          distMoon:  finalData.distanceFromMoon,
        })
        updateTelemetry(
          document.getElementById('telemetry')!,
          finalData,
          { traveled: traveledKm, total: totalKm },
          lastTelemetryTime,
        )
      }
    }

    freezeTimeTo(MISSION_END)
    return
  }

  statusDot.className = 'loading'
  statusText.textContent = 'Fetching telemetry…'
  try {
    const data = await fetchEphemeris(new Date())
    
    // 달의 위치를 고정하기 위해 회전 좌표계로 변환
    const angle = getMoonAngle(data.time.getTime())
    const cos = Math.cos(-angle)
    const sin = Math.sin(-angle)
    const rx = data.position.x * cos - data.position.y * sin
    const ry = data.position.x * sin + data.position.y * cos
    data.position.x = rx
    data.position.y = ry
    
    ephemeris = data

    // 새로 받은 실시간 데이터가 기존 궤적의 마지막 시각보다 미래라면 궤적에 추가
    // (이를 통해 페이지 새로고침 없이도 지나간 궤적과 거리가 동적으로 업데이트됨)
    if (fullTrajectory.length > 0) {
      const lastPt = fullTrajectory[fullTrajectory.length - 1]
      const tData = data.time.getTime()
      if (tData > lastPt.t) {
        const dt = (tData - lastPt.t) / 1000 // 초 단위 차이
        fullTrajectory.push({
          t: tData,
          x: rx,
          y: ry,
          z: data.position.z,
          d: (lastPt.d || 0) + (data.speed * dt),
          v: data.speed
        })
      }
    }

    // 궤적 분기점을 최신 시각으로 갱신
    splitTrajectory(data.time.getTime())

    updateGauges({
      speed:     data.speed,
      distEarth: data.distanceFromEarth,
      distMoon:  data.distanceFromMoon,
    })
    updateTelemetry(
      document.getElementById('telemetry')!,
      data,
      { traveled: traveledKm, total: totalKm },
    )

    statusDot.className = ''
    statusText.textContent = 'Live · updates every 30s'

    // 궤적이 비어 있으면 백그라운드에서 재시도 (이전 로드 실패 시 복구)
    if (fullTrajectory.length === 0) {
      loadFullTrajectory()
    }
  } catch (e) {
    statusDot.className = 'error'
    statusText.textContent = e instanceof Error ? e.message : 'Connection error'
    console.error(e)
  }
}

// 궤적 먼저 로드한 뒤 실시간 폴링 시작
loadFullTrajectory().then(() => {
  pollTelemetry()
  setInterval(pollTelemetry, 30_000)
})

// Mission Time / UTC 는 1초마다 실시간 갱신
startTimeTicker()

// ─── 렌더 루프 ───────────────────────────────────────────────────────────────
let lastTime = 0

function draw(ts: number): void {
  const dt = Math.min((ts - lastTime) / 1000, 0.1)
  lastTime = ts

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  drawStars(ctx, canvas.width, canvas.height, dt)
  updateMoonAngle(scene, new Date())
  drawBodies(ctx, scene)

  // 1) 전체 미션 궤도 — 흰색 점선 (숨김 처리)
  // if (fullTrajectory.length > 1) {
  //   drawFullOrbit(ctx, scene, fullTrajectory)
  // }

  // 2) 지나간 궤도 — 파란색 실선 (위에 덮어쓰기)
  if (traveledPoints.length > 1) {
    drawTraveledOrbit(ctx, scene, traveledPoints)
  }

  // 3) 현재 위치
  if (ephemeris) {
    drawSpacecraft(ctx, scene, ephemeris.position)
  }

  requestAnimationFrame(draw)
}

requestAnimationFrame(draw)
