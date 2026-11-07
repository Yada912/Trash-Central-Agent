import Link from 'next/link'
import { MaterialIcon } from '@/components/ui/material-icon'
import { BrandLogo } from '@/components/ui/brand-logo'

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t-4 border-ink bg-card text-ink">
      <div className="mx-auto max-w-6xl px-4 py-8 grid gap-6 md:grid-cols-4">
        {/* Brand & Purpose */}
        <div className="md:col-span-2 grid gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-ink bg-primary text-white p-1.5 shadow-[2px_2px_0_#1F2933]">
              <BrandLogo variant="white" className="h-full w-full object-contain" />
            </div>
            <div>
              <span className="font-black text-base tracking-tight text-ink">Central Trash Agent Bali</span>
              <p className="text-[11px] font-black text-ink">
                Prototipe Inovasi AI · Tim Punya Dendam (Bali DigiFest 2026)
              </p>
            </div>
          </div>
          <p className="text-xs text-ink/80 leading-relaxed max-w-md">
            Sistem agen cerdas pengelolaan persampahan berbasis sumber, menyelaraskan permintaan penjemputan warga dengan kapasitas dan toleransi kelonggaran (leeway) armada TPS3R kecamatan.
          </p>
          <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-extrabold">
            <span className="rounded border border-ink bg-mint px-2 py-0.5">
              Pergub Bali 47/2019
            </span>
            <span className="rounded border border-ink bg-sky px-2 py-0.5">
              Perda Denpasar 8/2023
            </span>
            <span className="rounded border border-ink bg-lavender px-2 py-0.5">
              UU PDP 27/2022
            </span>
          </div>
        </div>

        {/* Layanan & Akses */}
        <div className="grid content-start gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-primary">
            Layanan Aplikasi
          </span>
          <ul className="grid gap-1.5 text-xs font-bold text-ink/85">
            <li>
              <Link href="/warga" className="hover:text-primary hover:underline flex items-center gap-1">
                <MaterialIcon name="home" size="sm" />
                <span>Portal Dasbor Warga</span>
              </Link>
            </li>
            <li>
              <Link href="/report" className="hover:text-primary hover:underline flex items-center gap-1">
                <MaterialIcon name="add_a_photo" size="sm" />
                <span>Lapor Foto / Tumpukan</span>
              </Link>
            </li>
            <li>
              <Link href="/schedule" className="hover:text-primary hover:underline flex items-center gap-1">
                <MaterialIcon name="calendar_month" size="sm" />
                <span>Jadwal Pengangkutan Kota</span>
              </Link>
            </li>
            <li>
              <Link href="/masuk/petugas" className="hover:text-primary hover:underline flex items-center gap-1">
                <MaterialIcon name="badge" size="sm" />
                <span>Masuk Petugas Operasional</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Kepatuhan & Hukum */}
        <div className="grid content-start gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-primary">
            Kepatuhan &amp; Regulasi
          </span>
          <ul className="grid gap-1.5 text-xs font-bold text-ink/85">
            <li>
              <Link href="/kebijakan-privasi" className="hover:text-primary hover:underline flex items-center gap-1">
                <MaterialIcon name="shield" size="sm" />
                <span>Kebijakan Privasi (UU PDP)</span>
              </Link>
            </li>
            <li>
              <Link href="/syarat-ketentuan" className="hover:text-primary hover:underline flex items-center gap-1">
                <MaterialIcon name="gavel" size="sm" />
                <span>Syarat &amp; Ketentuan Prototipe</span>
              </Link>
            </li>
            <li>
              <a
                href="https://github.com/Yada912/Trash-Central-Agent"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary hover:underline flex items-center gap-1"
              >
                <MaterialIcon name="code" size="sm" />
                <span>Repositori Sumber Terbuka (GitHub)</span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t-2 border-ink/20 bg-bg px-4 py-3 text-center text-xs font-black text-ink">
        <p>© 2026 Central Trash Agent Bali — Prototipe Inovasi AI oleh Tim Punya Dendam untuk AI Web Innovation Challenge Bali DigiFest 2026. Tidak berafiliasi dengan instansi pemerintah mana pun.</p>
      </div>
    </footer>
  )
}
