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
      <legend className="px-1 text-base font-semibold text-alert">Hazardous-material warning</legend>
      <p className="text-sm">
        Any hazardous share above 0 is kept off ordinary routes. The warning cannot turn that share into an ordinary stop. At 0%,
        an unchecked warning leaves hazardous_present off the confirmed classification.
      </p>
      {classifierFlag && hazardousPercent === 0 && !checked ? (
        <p className="text-sm">
          The classifier set hazardous_present. The confirmed hazardous share is 0%, so that flag is left off unless you check
          the warning.
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
        <span>Include hazardous_present on the confirmed classification</span>
      </label>
      {warningOn ? <p className="text-sm">{HAZARDOUS_LABEL}</p> : null}
    </fieldset>
  )
}
