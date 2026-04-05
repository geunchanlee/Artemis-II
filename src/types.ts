export interface Vec3 {
  x: number
  y: number
  z: number
}

export interface Ephemeris {
  time: Date
  position: Vec3   // km, Earth-centered
  velocity: Vec3   // km/s
  distanceFromEarth: number  // km
  distanceFromMoon: number   // km
  speed: number              // km/s
}

/** 궤적 상의 한 점 (ICRF 지구 중심 좌표 + 유닉스 타임스탬프) */
export interface TrajectoryPoint {
  x: number   // km
  y: number   // km
  z: number   // km
  t: number   // unix ms
  d?: number  // 누적 이동 거리 (km)
  v?: number  // 속력 (km/s)
}
