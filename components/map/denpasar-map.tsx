'use client'

import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMapEvents } from 'react-leaflet'
import { DENPASAR_CENTER } from '@/lib/geo'
import 'leaflet/dist/leaflet.css'

export type MapMarker = {
  id: string
  lat: number
  lng: number
  label: string
  color: string
}

export type MapRoute = {
  id: string
  positions: [number, number][]
  color: string
  dashArray?: string
}

export type DenpasarMapProps = {
  markers?: MapMarker[]
  routes?: MapRoute[]
  pin?: { lat: number; lng: number } | null
  onPick?: (lat: number, lng: number) => void
  height?: string
}

function PickHandler({ onPick }: { onPick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onPick?.(event.latlng.lat, event.latlng.lng)
    },
  })
  return null
}

export default function DenpasarMap({ markers = [], routes = [], pin, onPick, height = '320px' }: DenpasarMapProps) {
  return (
    <div style={{ height }} className="overflow-hidden rounded-lg border border-ink/10">
      <MapContainer center={pin ? [pin.lat, pin.lng] : DENPASAR_CENTER} zoom={12} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <PickHandler onPick={onPick} />
        {routes.map((route) => (
          <Polyline
            key={route.id}
            positions={route.positions}
            pathOptions={{ color: route.color, weight: 4, dashArray: route.dashArray }}
          />
        ))}
        {markers.map((marker) => (
          <CircleMarker key={marker.id} center={[marker.lat, marker.lng]} radius={9} pathOptions={{ color: marker.color, fillColor: marker.color, fillOpacity: 0.85 }}>
            <Popup>{marker.label}</Popup>
          </CircleMarker>
        ))}
        {pin ? (
          <CircleMarker center={[pin.lat, pin.lng]} radius={11} pathOptions={{ color: '#0F766E', fillColor: '#0F766E', fillOpacity: 1 }}>
            <Popup>Selected pin</Popup>
          </CircleMarker>
        ) : null}
      </MapContainer>
    </div>
  )
}
