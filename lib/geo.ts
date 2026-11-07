export const DENPASAR_BBOX = {
  latMin: -8.75,
  latMax: -8.57,
  lngMin: 115.16,
  lngMax: 115.28,
} as const

export const DENPASAR_CENTER: [number, number] = [-8.67, 115.22]

export function isInsideDenpasar(lat: number, lng: number): boolean {
  return (
    lat >= DENPASAR_BBOX.latMin &&
    lat <= DENPASAR_BBOX.latMax &&
    lng >= DENPASAR_BBOX.lngMin &&
    lng <= DENPASAR_BBOX.lngMax
  )
}

export function nearestKecamatan<T extends { lat: number; lng: number; kecamatan: string }>(
  lat: number,
  lng: number,
  samples: readonly T[],
): T['kecamatan'] | null {
  let best: T | null = null
  let bestDistance = Number.POSITIVE_INFINITY
  for (const sample of samples) {
    const dLat = sample.lat - lat
    const dLng = sample.lng - lng
    const distance = dLat * dLat + dLng * dLng
    if (distance < bestDistance) {
      bestDistance = distance
      best = sample
    }
  }
  return best ? best.kecamatan : null
}
