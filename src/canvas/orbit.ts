/**
 * 지구-달 시스템을 2D 캔버스에 그린다.
 * 좌표계: 화면 중앙 = 지구, Horizons ICRF X-Y 평면 투영
 */

const EARTH_R_PX = 56
const MOON_R_PX  = 20
const MOON_DIST_KM = 384_400

const earthImg = new Image()
earthImg.src = '/earth-artemis.png'

const moonImg = new Image()
moonImg.src = '/moon.jpg'

export interface OrbitalScene {
  cx: number
  cy: number
  scale: number  // km → px
  moonAngle: number
}

export function makeScene(w: number, h: number): OrbitalScene {
  // 지구와 달 사이 거리를 캔버스 너비의 65% 정도로 설정하여 확대
  const moonDistPx = w * 0.65
  const scale = moonDistPx / MOON_DIST_KM
  
  // 캔버스 중앙(w/2)이 지구(cx)와 달(cx + moonDistPx)의 한가운데가 되도록 지구를 왼쪽으로 이동
  const cx = (w / 2) - (moonDistPx / 2)
  const cy = h / 2
  
  return { cx, cy, scale, moonAngle: 0 }
}

export function updateMoonAngle(scene: OrbitalScene, _at: Date): void {
  // 지구-달 회전 좌표계(Rotating Frame)를 적용하여 달을 항상 지구 오른편(각도 0)에 고정
  scene.moonAngle = 0
}

/** 달 궤도선 + 지구 + 달 */
export function drawBodies(
  ctx: CanvasRenderingContext2D,
  scene: OrbitalScene,
): void {
  const { cx, cy, scale, moonAngle } = scene
  const moonDist = MOON_DIST_KM * scale

  // 브라우저 크기(scale)에 맞춰 지구, 달, 오프셋 크기를 동적으로 조절 (기준: 폭 약 1000px)
  const refScale = (1000 * 0.65) / MOON_DIST_KM
  const sizeRatio = Math.max(0.4, Math.min(1.5, scale / refScale))
  
  const currentEarthR = EARTH_R_PX * sizeRatio
  const currentMoonR = MOON_R_PX * sizeRatio
  const earthOffset = 40 * sizeRatio

  // 지구 (궤도와 겹치지 않게 우상단으로 시각적 오프셋 적용)
  const ex = cx + earthOffset
  const ey = cy - earthOffset
  
  if (earthImg.complete && earthImg.naturalWidth > 0) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(ex, ey, currentEarthR, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(earthImg, ex - currentEarthR, ey - currentEarthR, currentEarthR * 2, currentEarthR * 2)
    
    // 입체감을 위한 내부 음영 추가
    const innerShadow = ctx.createRadialGradient(ex - 8 * sizeRatio, ey - 8 * sizeRatio, 0, ex, ey, currentEarthR)
    innerShadow.addColorStop(0, 'rgba(0,0,0,0)')
    innerShadow.addColorStop(0.8, 'rgba(0,0,0,0.4)')
    innerShadow.addColorStop(1, 'rgba(0,0,0,0.8)')
    ctx.fillStyle = innerShadow
    ctx.fill()
    ctx.restore()
  } else {
    const eg = ctx.createRadialGradient(ex - 8 * sizeRatio, ey - 8 * sizeRatio, 0, ex, ey, currentEarthR)
    eg.addColorStop(0,   '#9ad8f0')
    eg.addColorStop(0.4, '#2a7de1')
    eg.addColorStop(1,   '#0a2f5e')
    ctx.beginPath()
    ctx.arc(ex, ey, currentEarthR, 0, Math.PI * 2)
    ctx.fillStyle = eg
    ctx.fill()
  }

  // 약해진 지구 글로우 효과
  const earthGlow = ctx.createRadialGradient(ex, ey, currentEarthR * 0.8, ex, ey, currentEarthR * 1.5)
  earthGlow.addColorStop(0, 'rgba(42,125,225,0.1)')
  earthGlow.addColorStop(1, 'rgba(42,125,225,0)')
  ctx.beginPath()
  ctx.arc(ex, ey, currentEarthR * 1.5, 0, Math.PI * 2)
  ctx.fillStyle = earthGlow
  ctx.fill()

  // 달
  const mx = cx + Math.cos(moonAngle) * moonDist
  const my = cy - Math.sin(moonAngle) * moonDist
  
  if (moonImg.complete && moonImg.naturalWidth > 0) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(mx, my, currentMoonR, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(moonImg, mx - currentMoonR, my - currentMoonR, currentMoonR * 2, currentMoonR * 2)
    
    // 입체감을 위한 내부 음영 추가
    const innerShadow = ctx.createRadialGradient(mx - 3 * sizeRatio, my - 3 * sizeRatio, 0, mx, my, currentMoonR)
    innerShadow.addColorStop(0, 'rgba(0,0,0,0)')
    innerShadow.addColorStop(0.8, 'rgba(0,0,0,0.4)')
    innerShadow.addColorStop(1, 'rgba(0,0,0,0.8)')
    ctx.fillStyle = innerShadow
    ctx.fill()
    ctx.restore()
  } else {
    const mg = ctx.createRadialGradient(mx - 3 * sizeRatio, my - 3 * sizeRatio, 0, mx, my, currentMoonR)
    mg.addColorStop(0, '#e8e8e8')
    mg.addColorStop(0.6, '#b0b0b0')
    mg.addColorStop(1, '#707070')
    ctx.beginPath()
    ctx.arc(mx, my, currentMoonR, 0, Math.PI * 2)
    ctx.fillStyle = mg
    ctx.fill()
  }

  // 약해진 달 글로우 효과
  const moonGlow = ctx.createRadialGradient(mx, my, currentMoonR * 0.8, mx, my, currentMoonR * 1.5)
  moonGlow.addColorStop(0, 'rgba(180,180,180,0.05)')
  moonGlow.addColorStop(1, 'rgba(180,180,180,0)')
  ctx.beginPath()
  ctx.arc(mx, my, currentMoonR * 1.5, 0, Math.PI * 2)
  ctx.fillStyle = moonGlow
  ctx.fill()

  ctx.fillStyle = 'rgba(255,255,255,0.95)'
  ctx.font = '10px "Space Mono", monospace'
  ctx.textAlign = 'center'
  ctx.fillText('MOON', mx, my - currentMoonR - 6)
  ctx.fillText('EARTH', ex, ey - currentEarthR - 6)
}

/** 미션 전체 궤도를 흰색 점선으로 표시 */
export function drawFullOrbit(
  ctx: CanvasRenderingContext2D,
  scene: OrbitalScene,
  points: Array<{ x: number; y: number }>,
): void {
  if (points.length < 2) return
  const { cx, cy, scale } = scene

  // 외곽 글로우 (넓고 흐릿하게)
  ctx.setLineDash([6, 6])
  ctx.beginPath()
  ctx.moveTo(cx + points[0].x * scale, cy - points[0].y * scale)
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(cx + points[i].x * scale, cy - points[i].y * scale)
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'
  ctx.lineWidth = 4
  ctx.stroke()

  // 메인 점선 (선명하게)
  ctx.beginPath()
  ctx.moveTo(cx + points[0].x * scale, cy - points[0].y * scale)
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(cx + points[i].x * scale, cy - points[i].y * scale)
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.60)'
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.setLineDash([])
}

/**
 * 이미 지나간 궤적을 파란 빛으로 표시.
 * 오래된 쪽은 흐리고 얇게, 최근 쪽은 밝고 굵게.
 * 3개 레이어(넓은 글로우 → 중간 글로우 → 핵심 선)로 발광 효과 구현.
 */
export function drawTraveledOrbit(
  ctx: CanvasRenderingContext2D,
  scene: OrbitalScene,
  points: Array<{ x: number; y: number }>,
): void {
  if (points.length < 2) return
  const { cx, cy, scale } = scene

  function buildPath(pts: Array<{ x: number; y: number }>, i0: number, i1: number) {
    ctx.beginPath()
    ctx.moveTo(cx + pts[i0].x * scale, cy - pts[i0].y * scale)
    for (let i = i0 + 1; i <= i1; i++) {
      ctx.lineTo(cx + pts[i].x * scale, cy - pts[i].y * scale)
    }
  }

  const GROUPS = 16
  for (let g = 0; g < GROUPS; g++) {
    const i0 = Math.floor((g / GROUPS) * (points.length - 1))
    const i1 = Math.floor(((g + 1) / GROUPS) * (points.length - 1))
    if (i0 >= i1) continue

    const t = (g + 1) / GROUPS

    // 레이어 1: 넓은 외곽 글로우
    buildPath(points, i0, i1)
    ctx.strokeStyle = `rgba(30,120,255,${(0.08 + t * 0.12).toFixed(2)})`
    ctx.lineWidth = 8 + t * 6
    ctx.lineJoin = 'round'
    ctx.stroke()

    // 레이어 2: 중간 글로우
    buildPath(points, i0, i1)
    ctx.strokeStyle = `rgba(60,160,255,${(0.20 + t * 0.30).toFixed(2)})`
    ctx.lineWidth = 3 + t * 3
    ctx.lineJoin = 'round'
    ctx.stroke()

    // 레이어 3: 핵심 밝은 선
    buildPath(points, i0, i1)
    ctx.strokeStyle = `rgba(140,210,255,${(0.50 + t * 0.45).toFixed(2)})`
    ctx.lineWidth = 1.0 + t * 1.5
    ctx.lineJoin = 'round'
    ctx.stroke()
  }

  // 최근 구간: 우주선 직전 trailing glow
  if (points.length >= 4) {
    const tail = points.slice(-8)

    // 외곽 글로우
    ctx.beginPath()
    ctx.moveTo(cx + tail[0].x * scale, cy - tail[0].y * scale)
    for (let i = 1; i < tail.length; i++) {
      ctx.lineTo(cx + tail[i].x * scale, cy - tail[i].y * scale)
    }
    ctx.strokeStyle = 'rgba(80,180,255,0.25)'
    ctx.lineWidth = 14
    ctx.lineJoin = 'round'
    ctx.stroke()

    // 밝은 핵심 선
    ctx.beginPath()
    ctx.moveTo(cx + tail[0].x * scale, cy - tail[0].y * scale)
    for (let i = 1; i < tail.length; i++) {
      ctx.lineTo(cx + tail[i].x * scale, cy - tail[i].y * scale)
    }
    ctx.strokeStyle = 'rgba(180,230,255,0.95)'
    ctx.lineWidth = 2.5
    ctx.lineJoin = 'round'
    ctx.stroke()
  }
}

/** 우주선 현재 위치 점 + 글로우 + 레이블 */
export function drawSpacecraft(
  ctx: CanvasRenderingContext2D,
  scene: OrbitalScene,
  posKm: { x: number; y: number },
): void {
  const { cx, cy, scale } = scene
  const sx = cx + posKm.x * scale
  const sy = cy - posKm.y * scale

  const outerGlow = ctx.createRadialGradient(sx, sy, 0, sx, sy, 16)
  outerGlow.addColorStop(0, 'rgba(100,220,255,0.35)')
  outerGlow.addColorStop(1, 'rgba(100,220,255,0)')
  ctx.beginPath()
  ctx.arc(sx, sy, 16, 0, Math.PI * 2)
  ctx.fillStyle = outerGlow
  ctx.fill()

  ctx.beginPath()
  ctx.arc(sx, sy, 3.5, 0, Math.PI * 2)
  ctx.fillStyle = '#ffffff'
  ctx.shadowBlur = 8
  ctx.shadowColor = '#64dcff'
  ctx.fill()
  ctx.shadowBlur = 0

  ctx.fillStyle = 'rgba(150,230,255,0.95)'
  ctx.font = '10px "Space Mono", monospace'
  ctx.textAlign = 'left'
  ctx.fillText('ARTEMIS II', sx + 9, sy - 4)
}
