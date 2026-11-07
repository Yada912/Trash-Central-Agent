import { describe, expect, it } from 'vitest'

function buildGoogleMapsDirectionsUrl(stops: Array<{ lat: number; lng: number }>): string {
  if (stops.length < 2) return 'https://maps.google.com'
  const origin = `${stops[0].lat},${stops[0].lng}`
  const destination = `${stops[stops.length - 1].lat},${stops[stops.length - 1].lng}`
  const waypoints = stops
    .slice(1, -1)
    .map((s) => `${s.lat},${s.lng}`)
    .join('|')
  const base = 'https://www.google.com/maps/dir/?api=1'
  return `${base}&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}${
    waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : ''
  }&travelmode=driving`
}

describe('Petugas Google Maps Navigation Generator', () => {
  it('builds a valid Google Maps directions URL with origin, destination, and waypoints', () => {
    const stops = [
      { lat: -8.6562, lng: 115.2124 },
      { lat: -8.6621, lng: 115.2089 },
      { lat: -8.6705, lng: 115.2155 },
      { lat: -8.7214, lng: 115.2289 },
    ]

    const url = buildGoogleMapsDirectionsUrl(stops)
    expect(url).toContain('https://www.google.com/maps/dir/?api=1')
    expect(url).toContain('origin=-8.6562%2C115.2124')
    expect(url).toContain('destination=-8.7214%2C115.2289')
    expect(url).toContain('waypoints=-8.6621%2C115.2089%7C-8.6705%2C115.2155')
    expect(url).toContain('travelmode=driving')
  })

  it('handles 2 stops without intermediate waypoints', () => {
    const stops = [
      { lat: -8.6562, lng: 115.2124 },
      { lat: -8.7214, lng: 115.2289 },
    ]

    const url = buildGoogleMapsDirectionsUrl(stops)
    expect(url).toContain('origin=-8.6562%2C115.2124')
    expect(url).toContain('destination=-8.7214%2C115.2289')
    expect(url).not.toContain('waypoints=')
  })
})

