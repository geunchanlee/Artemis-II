interface Star {
  x: number
  y: number
  r: number
  a: number
  speed: number
}

let stars: Star[] = []
let driftAngle = Math.PI * 0.25

export function generateStars(w: number, h: number): void {
  stars = []
  for (let i = 0; i < 320; i++) {
    const r = Math.random() * 1.0 + 0.5
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r,
      a: Math.random() * 0.7 + 0.2,
      speed: 0.4 + ((r - 0.5) / 1.0) * 0.6,
    })
  }
}

export function drawStars(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  dt: number,
): void {
  driftAngle += 0.015 * dt
  const BASE = 4
  const dx = Math.cos(driftAngle) * BASE * dt
  const dy = Math.sin(driftAngle) * BASE * dt

  for (const s of stars) {
    s.x = (s.x + dx * s.speed + w) % w
    s.y = (s.y + dy * s.speed + h) % h

    ctx.beginPath()
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255,255,255,${s.a})`
    ctx.fill()
  }
}
