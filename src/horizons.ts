import type { Ephemeris, TrajectoryPoint } from './types'

const BASE = '/api/horizons'
const ARTEMIS_II = '-1024'
const CENTER = '500@399'

export const TRAJECTORY_START = new Date('2026-04-02T02:00:00Z')
export const MISSION_END      = new Date('2026-04-11T01:00:00Z')

/**
 * 현재 위치/속도 단일 포인트를 가져온다 (30초 폴링용)
 * 달 위치도 Horizons에서 병렬로 가져와 정확한 거리를 계산한다.
 */
export async function fetchEphemeris(at: Date): Promise<Ephemeris> {
  const stop = new Date(at.getTime() + 60_000)
  const timeParams = {
    START_TIME: formatDate(at),
    STOP_TIME:  formatDate(stop),
    STEP_SIZE:  '1m',
    VEC_TABLE:  '2',
    CSV_FORMAT: 'YES',
    VEC_LABELS: 'NO',
  }
  const [scJson, moonJson] = await Promise.all([
    horizonsGet(buildQS({ ...timeParams, COMMAND: ARTEMIS_II })),
    horizonsGet(buildQS({ ...timeParams, COMMAND: '301' })),
  ])
  return parseFirstPoint(scJson.result, moonJson.result, at)
}

/**
 * 미션 전체 궤적(발사→귀환)을 한 번에 가져온다.
 * 각 포인트에 ICRF 좌표(x, y, z)와 유닉스 타임스탬프(t)가 포함된다.
 */
export async function fetchFullTrajectory(
  from: Date,
  to: Date,
  stepMinutes = 30,
): Promise<TrajectoryPoint[]> {
  const qs = buildQS({
    START_TIME: formatDate(from),
    STOP_TIME:  formatDate(to),
    STEP_SIZE:  `${stepMinutes}m`,
    VEC_TABLE:  '2',
    CSV_FORMAT: 'YES',
    VEC_LABELS: 'NO',
  })
  const json = await horizonsGet(qs)
  return parseAllPoints(json.result)
}

// ─── HTTP ─────────────────────────────────────────────────────────────────────

async function horizonsGet(qs: string): Promise<{ result: string }> {
  const url = `${BASE}?${qs}`
  console.debug('[Horizons] GET', url.slice(0, 120))
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Horizons HTTP ${res.status}`)
  const json: { result?: string; signature?: { error?: string } } = await res.json()
  if (json.signature?.error) throw new Error(`Horizons API error: ${json.signature.error}`)
  if (!json.result) throw new Error('Horizons: empty result')
  console.debug('[Horizons] result length:', json.result.length, 'chars')
  return json as { result: string }
}

// ─── URL 빌더 ─────────────────────────────────────────────────────────────────

function buildQS(extra: Record<string, string>): string {
  const base: Record<string, string> = {
    format:     'json',
    COMMAND:    ARTEMIS_II,
    CENTER:     CENTER,
    MAKE_EPHEM: 'YES',
    TABLE_TYPE: 'VECTORS',
    OUT_UNITS:  'KM-S',
  }
  return Object.entries({ ...base, ...extra })
    .map(([k, v]) => {
      const needsQuote = v.includes(' ')
      const val = needsQuote ? `'${v}'` : v
      return `${k}=${encodeURIComponent(val)}`
    })
    .join('&')
}

// ─── 날짜 포맷 ────────────────────────────────────────────────────────────────

const MONTH = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function formatDate(d: Date): string {
  const y  = d.getUTCFullYear()
  const mo = MONTH[d.getUTCMonth()]
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const hh = String(d.getUTCHours()).padStart(2, '0')
  const mm = String(d.getUTCMinutes()).padStart(2, '0')
  const ss = String(d.getUTCSeconds()).padStart(2, '0')
  return `${y}-${mo}-${dd} ${hh}:${mm}:${ss}`
}

// ─── 파서 ─────────────────────────────────────────────────────────────────────

function extractSOE(raw: string): string[][] {
  const match = raw.match(/\$\$SOE\s*([\s\S]*?)\s*\$\$EOE/)
  if (!match) throw new Error('Horizons: SOE/EOE markers not found')
  return match[1]
    .trim()
    .split('\n')
    .filter(l => l.trim())
    .map(l => l.split(',').map(s => s.trim()))
}

function colsToVec(cols: string[]): { x: number; y: number; z: number; vx: number; vy: number; vz: number } | null {
  // Horizons CSV with VEC_LABELS=NO usually has JD, Date, X, Y, Z, VX, VY, VZ
  // X, Y, Z are columns index 2, 3, 4
  if (cols.length < 8) return null
  const x  = parseFloat(cols[2])
  const y  = parseFloat(cols[3])
  const z  = parseFloat(cols[4])
  const vx = parseFloat(cols[5])
  const vy = parseFloat(cols[6])
  const vz = parseFloat(cols[7])
  if ([x, y, z, vx, vy, vz].some(isNaN)) return null
  return { x, y, z, vx, vy, vz }
}

/** Julian Date (TDB) → Unix timestamp (ms). */
function jdToMs(jd: number): number {
  return (jd - 2440587.5) * 86_400_000
}

/** 
 * 특정 시점의 달의 공전 위상을 계산한다.
 */
export function getMoonAngle(tMs: number): number {
  // 2026-04-02 02:00 UTC (미션 시작점) 근처의 달의 위상을 대략적으로 설정 (약 185도)
  const startAngle = (185 * Math.PI) / 180
  const msPerOrbit = 27.32 * 86400 * 1000
  const elapsed = tMs - new Date('2026-04-02T02:00:00Z').getTime()
  return startAngle + (elapsed / msPerOrbit) * 2 * Math.PI
}

function parseFirstPoint(rawSc: string, rawMoon: string, at: Date): Ephemeris {
  const rows = extractSOE(rawSc)
  const vec = colsToVec(rows[0])
  if (!vec) throw new Error('Horizons: failed to parse first data row')
  const { x, y, z, vx, vy, vz } = vec

  const moonRows = extractSOE(rawMoon)
  const moonVec = colsToVec(moonRows[0])
  if (!moonVec) throw new Error('Horizons: failed to parse Moon position')
  const distMoon = Math.hypot(x - moonVec.x, y - moonVec.y, z - moonVec.z)
  
  return {
    time: at,
    position: { x, y, z },
    velocity: { x: vx, y: vy, z: vz },
    distanceFromEarth: Math.hypot(x, y, z),
    distanceFromMoon:  distMoon,
    speed: Math.hypot(vx, vy, vz),
  }
}

function parseAllPoints(raw: string): TrajectoryPoint[] {
  const points: TrajectoryPoint[] = []
  for (const cols of extractSOE(raw)) {
    const jd  = parseFloat(cols[0])
    const vec = colsToVec(cols)
    if (vec && !isNaN(jd)) {
      points.push({ 
        x: vec.x, 
        y: vec.y, 
        z: vec.z, 
        t: jdToMs(jd),
        v: Math.hypot(vec.vx, vec.vy, vec.vz)
      })
    }
  }
  if (points.length === 0) throw new Error('Horizons: no valid data points parsed')
  return points
}
