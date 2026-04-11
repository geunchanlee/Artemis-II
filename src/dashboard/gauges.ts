/**
 * D3.js로 계기판 게이지를 SVG에 렌더링한다.
 * 각 게이지는 arc 형태로 현재 값을 표시한다.
 */
import * as d3 from 'd3'

interface GaugeConfig {
  label: string
  unit: string
  min: number
  max: number
  color: string
  decimals: number
}

const GAUGES: Record<string, GaugeConfig> = {
  speed: {
    label: 'VELOCITY',
    unit: 'km/s',
    min: 0,
    max: 12,
    color: '#64dcff',
    decimals: 2,
  },
  distEarth: {
    label: 'DIST FROM EARTH',
    unit: 'km',
    min: 0,
    max: 420_000,
    color: '#4fa3e0',
    decimals: 0,
  },
  distMoon: {
    label: 'DIST FROM MOON',
    unit: 'km',
    min: 0,
    max: 420_000,
    color: '#a0c8ff',
    decimals: 0,
  },
}

const W = 140, H = 140, R_OUT = 56, R_IN = 40
const ARC_START = -Math.PI * 0.75
const ARC_END   =  Math.PI * 0.75

export function initGauges(container: HTMLElement): void {
  container.innerHTML = ''

  for (const [key, cfg] of Object.entries(GAUGES)) {
    const wrap = document.createElement('div')
    wrap.className = 'gauge-wrap'
    wrap.dataset.key = key

    const svg = d3
      .select(wrap)
      .append('svg')
      .attr('width', W)
      .attr('height', H)
      .attr('viewBox', `0 0 ${W} ${H}`)

    const g = svg.append('g').attr('transform', `translate(${W / 2},${H / 2 + 8})`)

    // 배경 arc
    const bgArc = d3.arc<unknown>()
      .innerRadius(R_IN).outerRadius(R_OUT)
      .startAngle(ARC_START).endAngle(ARC_END)
    g.append('path')
      .attr('class', 'gauge-bg')
      .attr('d', bgArc(null) ?? '')
      .attr('fill', 'rgba(255,255,255,0.05)')

    // 값 arc
    g.append('path')
      .attr('class', 'gauge-fill')
      .attr('fill', cfg.color)
      .attr('opacity', 0.85)

    // 값 텍스트
    g.append('text')
      .attr('class', 'gauge-value')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.1em')
      .attr('fill', cfg.color)
      .style('font', '700 15px "Space Mono", monospace')
      .text('—')

    // 단위
    g.append('text')
      .attr('class', 'gauge-unit')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.4em')
      .attr('fill', 'rgba(255,255,255,0.4)')
      .style('font', '400 9px "Space Mono", monospace')
      .text(cfg.unit)

    // 레이블 (arc 아래)
    svg.append('text')
      .attr('x', W / 2).attr('y', H - 6)
      .attr('text-anchor', 'middle')
      .attr('fill', 'rgba(255,255,255,0.35)')
      .style('font', '400 9px "Space Mono", monospace')
      .text(cfg.label)

    container.appendChild(wrap)
  }
}

export function setGaugeMax(key: keyof typeof GAUGES, max: number): void {
  if (GAUGES[key]) GAUGES[key].max = max
}

export function setGaugeMin(key: keyof typeof GAUGES, min: number): void {
  if (GAUGES[key]) GAUGES[key].min = min
}

export function updateGauges(values: {
  speed: number
  distEarth: number
  distMoon: number
}): void {
  for (const [key, cfg] of Object.entries(GAUGES)) {
    const raw = values[key as keyof typeof values]
    const t   = Math.min(1, Math.max(0, (raw - cfg.min) / (cfg.max - cfg.min)))
    const endAngle = ARC_START + (ARC_END - ARC_START) * t

    const wrap = document.querySelector<HTMLElement>(`.gauge-wrap[data-key="${key}"]`)
    if (!wrap) continue

    d3.select(wrap).select<SVGPathElement & { _prev?: number }>('.gauge-fill')
      .transition().duration(600)
      .attrTween('d', function () {
        const prev = this._prev ?? ARC_START
        this._prev = endAngle
        const interp = d3.interpolateNumber(prev, endAngle)
        return (t2: number) => {
          const a = d3.arc<unknown>()
            .innerRadius(R_IN).outerRadius(R_OUT)
            .startAngle(ARC_START).endAngle(interp(t2))
          return a(null) ?? ''
        }
      })

    d3.select(wrap).select<SVGTextElement & { _prevVal?: number }>('.gauge-value')
      .transition().duration(600).ease(d3.easeQuadOut)
      .tween('text', function () {
        const prev   = this._prevVal ?? raw
        this._prevVal = raw
        const interp = d3.interpolateNumber(prev, raw)
        return (t2: number) => {
          const v = interp(t2)
          this.textContent = cfg.decimals === 0
            ? Math.round(v).toLocaleString()
            : v.toFixed(cfg.decimals)
        }
      })
  }
}
