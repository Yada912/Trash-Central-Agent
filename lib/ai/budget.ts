/** Hard cap on Gemini calls inside one HTTP request. */
export const MAX_GEMINI_CALLS_PER_REQUEST = 4

export class ProviderBudgetExceeded extends Error {
  constructor() {
    super('provider-budget')
    this.name = 'ProviderBudgetExceeded'
  }
}

export function createProviderBudget(max = MAX_GEMINI_CALLS_PER_REQUEST) {
  let left = max
  return {
    take(): void {
      if (left <= 0) throw new ProviderBudgetExceeded()
      left -= 1
    },
  }
}

export type ProviderBudget = ReturnType<typeof createProviderBudget>
