import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

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
  return (
    <div className="grid gap-2">
      <Label htmlFor="photo">Photo, optional</Label>
      <input
        id="photo"
        name="photo"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="text-sm"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) onFile(file)
          event.target.value = ''
        }}
      />
      {error ? <p className="text-sm font-semibold text-alert">{error}</p> : null}
      {previewUrl ? (
        <div className="grid gap-2">
          <img src={previewUrl} alt="Compressed photo preview" className="max-h-64 rounded-lg border border-ink/10" />
          <Button variant="secondary" onClick={onClear}>
            Remove photo
          </Button>
        </div>
      ) : (
        <p className="text-sm text-ink/80">JPEG, PNG, or WebP. The photo is compressed before it is sent.</p>
      )}
    </div>
  )
}
