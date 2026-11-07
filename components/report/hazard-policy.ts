export const HAZARDOUS_LABEL = 'Flagged for special handling by DLH (demo, not sent)'

export function hazardousShare(classification: { types: readonly { type: string; share: number }[] }): number {
  return classification.types.find((entry) => entry.type === 'hazardous')?.share ?? 0
}

/** Any positive hazardous share, or the flag, is kept off ordinary routes. There is no 0.2 cutoff. */
export function isSeparateHazard(classification: {
  types: readonly { type: string; share: number }[]
  flags: readonly string[]
}): boolean {
  if (classification.flags.includes('hazardous_present')) return true
  return hazardousShare(classification) > 0
}
