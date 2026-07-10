import Link from "next/link";

const navLinks = [
  { label: "Soluciones", href: "#soluciones" },
  { label: "Buscar Flete", href: "#flete" },
  { label: "Transportistas", href: "#transportistas" },
  { label: "Empresa", href: "#empresa" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[rgba(196,198,206,0.2)] bg-[rgba(248,249,255,0.6)] backdrop-blur-md">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-5 lg:px-12">
        <Link href="/" className="font-mono text-2xl font-bold tracking-tight text-[#0b1f3a]">
          Panalogix
        </Link>

        <nav className="hidden items-center gap-10 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-semibold tracking-wide text-[#44474d] transition hover:text-[#0b1f3a]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-6">
          <Link
            href="/login"
            className="hidden text-sm font-semibold tracking-wide text-[#0b1f3a] sm:block"
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/Sign-up"
            className="rounded-full bg-[#0b1f3a] px-7 py-3 text-sm font-semibold tracking-wide text-white shadow-md transition hover:bg-[#0d2747]"
          >
            Registrarse
          </Link>
        </div>
      </div>
    </header>
  );
}
