/** Reports saved while GEMINI_API_KEY is unset are demo records. */
export function savedReportIsDemo(): boolean {
  return !process.env.GEMINI_API_KEY
}
