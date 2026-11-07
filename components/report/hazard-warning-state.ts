export type HazardWarningState = {
  checked: boolean
  explicit: boolean
}

/**
 * The warning checkbox is the only source of a confirmed hazardous_present
 * flag. It starts checked only when the classifier set that flag and the
 * hazardous share is already above 0. A share of 0 leaves it unchecked so a
 * stale flag is not submitted. Changing the share to 0 clears it again
 * unless the resident has explicitly toggled the checkbox.
 */
export function initialHazardWarning(flags: readonly string[], hazardousPercent: number): HazardWarningState {
  if (hazardousPercent <= 0) return { checked: false, explicit: false }
  return { checked: flags.includes('hazardous_present'), explicit: false }
}

export function nextHazardWarning(current: HazardWarningState, hazardousPercent: number): HazardWarningState {
  if (current.explicit) return current
  if (hazardousPercent <= 0) return { checked: false, explicit: false }
  return current
}
