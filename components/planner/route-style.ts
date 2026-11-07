export const ROUTE_STYLES = [
  { color: '#0F766E', dashArray: undefined, pattern: 'solid' },
  { color: '#1D4E89', dashArray: '14 8', pattern: 'dashed' },
  { color: '#6D28D9', dashArray: '2 8', pattern: 'dotted' },
  { color: '#B4532A', dashArray: '14 6 2 6', pattern: 'dash-dot' },
  { color: '#3F6212', dashArray: '8 6', pattern: 'short dash' },
  { color: '#9A3412', dashArray: '2 6 12 6', pattern: 'dot-dash' },
] as const

export function routeStyle(index: number) {
  return ROUTE_STYLES[index % ROUTE_STYLES.length]
}
