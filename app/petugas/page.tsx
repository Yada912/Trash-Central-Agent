import Link from 'next/link'
import { cookies } from 'next/headers'
import { PetugasPortal } from '@/components/petugas/petugas-portal'
import { readSessionToken, SESSION_COOKIE } from '@/lib/auth/session'

export default async function PetugasPage() {
  const jar = await cookies()
  const session = readSessionToken(jar.get(SESSION_COOKIE)?.value)
  if (!session || session.role !== 'petugas') {
    return (
      <main id="main" className="mx-auto grid max-w-3xl gap-6">
        <section className="vector-card grid gap-4 bg-card p-6">
          <h1 className="text-3xl font-extrabold">Halaman ini khusus petugas</h1>
          <p className="text-base font-medium text-ink/85">
            Masuk dengan akun petugas untuk membuka panel armada. Pemeriksaan peran dilakukan di server.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/masuk/petugas"
              className="vector-btn inline-flex items-center gap-2 rounded-md border-2 border-ink bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-[2px_2px_0_#1F2933]"
            >
              Masuk dengan akun petugas
            </Link>
            <Link
              href="/warga"
              className="vector-btn inline-flex items-center gap-2 rounded-md border-2 border-ink bg-mint px-4 py-2.5 text-sm font-bold text-ink shadow-[2px_2px_0_#1F2933]"
            >
              Buka portal warga
            </Link>
          </div>
        </section>
      </main>
    )
  }
  return <PetugasPortal />
}
