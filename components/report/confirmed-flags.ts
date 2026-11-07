import { CLASSIFICATION_FLAGS, type ClassificationFlag } from '@/lib/schemas'

/**
 * Flags stored on the resident's confirmed classification.
 *
 * A hazardous share above 0 always keeps hazardous_present. There is no 0.2
 * cutoff and no way to leave that share on an ordinary route. At share 0 the
 * flag follows the warning checkbox, so an unchecked warning clears it.
 * The base flag array is never mutated; that array is the original classifier
 * result when the resident started from one.
 *
 * no_image follows whether a photo is attached. low_image_quality is
 * omitted when the confirmation has no photo, and also when the classifier
 * itself reported no_image, because that flag is not a judgment of a photo
 * the resident is sending.
 */
export function flagsForConfirmation(input: {
  baseFlags: readonly ClassificationFlag[]
  hasImage: boolean
  includeHazardousPresent: boolean
  hazardousShare: number
}): ClassificationFlag[] {
  const next = new Set<ClassificationFlag>(input.baseFlags)
  if (input.hasImage) next.delete('no_image')
  else next.add('no_image')
  if (!input.hasImage || input.baseFlags.includes('no_image')) next.delete('low_image_quality')
  if (input.includeHazardousPresent || input.hazardousShare > 0) next.add('hazardous_present')
  else next.delete('hazardous_present')
  return CLASSIFICATION_FLAGS.filter((flag) => next.has(flag))
}
