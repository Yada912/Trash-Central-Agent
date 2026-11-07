import { HAZARDOUS_LABEL } from '@/components/report/hazard-policy'

export function HazardWarning({
  checked,
  hazardousPercent,
  classifierFlag,
  onChange,
}: {
  checked: boolean
  hazardousPercent: number
  classifierFlag: boolean
  onChange: (checked: boolean) => void
}) {
  const positiveShare = hazardousPercent > 0
  const warningOn = checked || positiveShare
  return (
    <fieldset className="grid gap-3 rounded-lg border border-alert/30 bg-alert/10 p-4">
      <legend className="px-1 text-base font-semibold text-alert">
        Peringatan limbah berbahaya (B3)
      </legend>
      <p className="text-sm">
        Proporsi limbah berbahaya di atas 0% selalu dipisahkan dari rute truk biasa. Pada
        proporsi 0%, kotak peringatan yang tidak dicentang akan menghapus tanda
        hazardous_present dari klasifikasi terkonfirmasi.
      </p>
      {classifierFlag && hazardousPercent === 0 && !checked ? (
        <p className="text-sm">
          Pengklasifikasi menyetel hazardous_present. Proporsi B3 terkonfirmasi saat ini 0%,
          sehingga tanda tersebut dihapus kecuali Anda mencentang kotak peringatan di bawah.
        </p>
      ) : null}
      <label className="flex items-start gap-3 text-base">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4"
          checked={warningOn}
          disabled={positiveShare}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span>Sertakan hazardous_present pada klasifikasi terkonfirmasi</span>
      </label>
      {warningOn ? <p className="text-sm">{HAZARDOUS_LABEL}</p> : null}
    </fieldset>
  )
}
