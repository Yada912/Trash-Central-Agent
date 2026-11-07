'use client'

import { useEffect } from 'react'
import {
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet'
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
  const map = useMapEvents({
    click(event) {
      onPick?.(event.latlng.lat, event.latlng.lng)
    },
  })

  useEffect(() => {
    if (onPick) {
      map.getContainer().style.cursor = 'crosshair'
    } else {
      map.getContainer().style.cursor = ''
    }
  }, [map, onPick])

  return null
}

function MapRecenter({ center }: { center?: [number, number] | null }) {
  const map = useMap()
  useEffect(() => {
    if (center && Number.isFinite(center[0]) && Number.isFinite(center[1])) {
      map.setView(center, Math.max(map.getZoom(), 13), { animate: true })
    }
  }, [center, map])
  return null
}

export default function DenpasarMap({
  markers = [],
  routes = [],
  pin,
  onPick,
  height = '320px',
}: DenpasarMapProps) {
  const initialCenter =
    pin && Number.isFinite(pin.lat) && Number.isFinite(pin.lng)
      ? ([pin.lat, pin.lng] as [number, number])
      : DENPASAR_CENTER

  return (
    <div style={{ height }} className="overflow-hidden rounded-lg border border-ink/10">
      <MapContainer
        center={initialCenter}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <PickHandler onPick={onPick} />
        <MapRecenter
          center={
            pin && Number.isFinite(pin.lat) && Number.isFinite(pin.lng)
              ? [pin.lat, pin.lng]
              : null
          }
        />
        {routes.map((route) => (
          <Polyline
            key={route.id}
            positions={route.positions}
            pathOptions={{ color: route.color, weight: 4, dashArray: route.dashArray }}
          />
        ))}
        {markers.map((marker) => (
          <CircleMarker
            key={marker.id}
            center={[marker.lat, marker.lng]}
            radius={9}
            pathOptions={{ color: marker.color, fillColor: marker.color, fillOpacity: 0.85 }}
          >
            <Popup>{marker.label}</Popup>
          </CircleMarker>
        ))}
        {pin && Number.isFinite(pin.lat) && Number.isFinite(pin.lng) ? (
          <>
            <CircleMarker
              center={[pin.lat, pin.lng]}
              radius={18}
              pathOptions={{
                color: '#0F766E',
                fillColor: '#0F766E',
                fillOpacity: 0.22,
                weight: 2,
                dashArray: '4, 4',
              }}
            />
            <CircleMarker
              center={[pin.lat, pin.lng]}
              radius={10}
              pathOptions={{
                color: '#FFFFFF',
                fillColor: '#0F766E',
                fillOpacity: 1,
                weight: 3,
              }}
            >
              <Tooltip permanent direction="top" offset={[0, -10]}>
                📍 Titik Jemput
              </Tooltip>
              <Popup>
                <div className="text-xs">
                  <strong className="block text-primary">Titik Jemput Sampah</strong>
                  <span>
                    {pin.lat.toFixed(6)}, {pin.lng.toFixed(6)}
                  </span>
                </div>
              </Popup>
            </CircleMarker>
          </>
        ) : null}
      </MapContainer>
    </div>
  )
}
