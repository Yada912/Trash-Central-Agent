'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { MaterialIcon } from '@/components/ui/material-icon'

export function PhotoUploader({
  previewUrl,
  error,
  onFile,
  onClear,
}: {
  previewUrl: string | null
  error: string | null
  onFile: (file: File) => void
  onClear: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)

  function stopStream() {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop()
      }
      streamRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      stopStream()
    }
  }, [])

  async function openLiveCamera() {
    setCameraError(null)
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      cameraInputRef.current?.click()
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      setCameraOpen(true)
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          void videoRef.current.play()
        }
      }, 50)
    } catch {
      setCameraError('Akses kamera langsung ditolak atau tidak tersedia. Membuka pemilih kamera perangkat…')
      cameraInputRef.current?.click()
    }
  }

  function closeLiveCamera() {
    stopStream()
    setCameraOpen(false)
  }

  function captureFrame() {
    const video = videoRef.current
    if (!video) return
    const width = video.videoWidth || 1280
    const height = video.videoHeight || 720
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, width, height)
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const file = new File([blob], `kamera-sampah-${Date.now()}.jpg`, { type: 'image/jpeg' })
        onFile(file)
        closeLiveCamera()
      },
      'image/jpeg',
      0.86,
    )
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label htmlFor="photo" className="flex items-center gap-1.5 text-base font-extrabold">
          <MaterialIcon name="photo_camera" className="text-primary" />
          Foto kondisi sampah (opsional)
        </Label>
        <span className="vector-pill bg-mint text-ink">Otomatis dikompresi ≤ 1280 px</span>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        id="photo"
        name="photo"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) onFile(file)
          event.target.value = ''
        }}
      />
      <input
        ref={cameraInputRef}
        id="photo-camera-capture"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) onFile(file)
          event.target.value = ''
        }}
      />

      {/* Tactile 3D Action Buttons for Camera & Image Import */}
      <div className="flex flex-wrap gap-3">
        <Button variant="gold" onClick={() => void openLiveCamera()}>
          <MaterialIcon name="photo_camera" />
          Ambil Foto via Kamera
        </Button>
        <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
          <MaterialIcon name="upload_file" />
          Impor Gambar dari Galeri / Perangkat
        </Button>
      </div>

      {cameraError ? <p className="text-xs font-bold text-alert">{cameraError}</p> : null}

      {/* Live WebRTC Camera Viewfinder Modal */}
      {cameraOpen ? (
        <div className="vector-card bg-ink p-4 text-white grid gap-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-sm font-extrabold text-gold">
              <MaterialIcon name="videocam" size="sm" />
              Kamera Langsung Aktif — Arahkan ke Tumpukan Sampah
            </span>
            <Button variant="secondary" onClick={closeLiveCamera}>
              <MaterialIcon name="close" size="sm" />
              Tutup
            </Button>
          </div>
          <video
            ref={videoRef}
            playsInline
            muted
            className="max-h-72 w-full rounded-md border-2 border-white bg-black object-cover"
          />
          <div className="flex flex-wrap gap-3">
            <Button variant="gold" onClick={captureFrame}>
              <MaterialIcon name="camera" />
              Jepret & Gunakan Foto Ini
            </Button>
            <Button variant="secondary" onClick={closeLiveCamera}>
              Batal
            </Button>
          </div>
        </div>
      ) : null}

      {error ? <p className="text-sm font-bold text-alert">{error}</p> : null}

      {previewUrl ? (
        <div className="vector-card-soft bg-bg p-3 grid gap-3 sm:grid-cols-[auto_1fr] sm:items-center">
          <img
            src={previewUrl}
            alt="Pratinjau foto terkompresi"
            className="max-h-48 rounded-md border-2 border-ink object-cover"
          />
          <div className="grid gap-2">
            <p className="text-sm font-extrabold text-primary flex items-center gap-1.5">
              <MaterialIcon name="check_circle" size="sm" />
              Foto siap dianalisis bersama deskripsi Anda
            </p>
            <p className="text-xs font-semibold text-ink">
              Anda dapat mengganti foto atau menghapusnya jika ingin mengirim laporan teks saja.
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={onClear}>
                <MaterialIcon name="delete" size="sm" />
                Hapus foto
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs font-bold text-ink">
          Mendukung JPEG, PNG, atau WebP. Gunakan tombol kamera untuk memotret langsung di lokasi atau impor dari galeri.
        </p>
      )}
    </div>
  )
}
