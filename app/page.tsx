import Link from 'next/link'

const LINKS = [
  { href: '/report', title: 'Report a pile', text: 'Add a description, an optional photo, and a location. You review the classification before it is saved.' },
  { href: '/dashboard', title: 'Dashboard', text: 'See synthetic demo reports on a Denpasar map, with totals and a separate list for hazardous loads.' },
  { href: '/planner', title: 'Planner', text: 'Build routes from truck capacity and the shift. An officer approves, edits, or rejects the proposal.' },
]

export default function HomePage() {
  return (
    <main id="main">
      <p className="text-sm font-semibold text-primary">Bali DigiFest 2026 · AI Web Innovation Challenge</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Central Trash Agent</h1>
      <p className="mt-4 max-w-2xl text-lg">
        Residents describe a pile of waste. An officer sees where it is and decides whether a proposed pickup route should run.
      </p>
      <ul className="mt-8 grid gap-4 md:grid-cols-3">
        {LINKS.map((link) => (
          <li key={link.href} className="rounded-lg border border-ink/10 bg-card p-4 shadow-none">
            <h2 className="text-xl font-semibold">
              <Link href={link.href}>{link.title}</Link>
            </h2>
            <p className="mt-2 text-sm">{link.text}</p>
          </li>
        ))}
      </ul>
      <p className="mt-8 max-w-2xl text-sm">
        Seeded reports are synthetic. Facility pins are published locations, not a check that a site is open or accepting waste.
      </p>
    </main>
  )
}
