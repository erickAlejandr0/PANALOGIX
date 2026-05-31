const footerColumns = [
  {
    title: "Producto",
    links: ["Marketplace", "Rastreo GPS", "Precios"],
  },
  {
    title: "Compañía",
    links: ["Sobre nosotros", "Carreras", "Contacto"],
  },
  {
    title: "Soporte",
    links: ["Centro de ayuda", "FAQ Transportistas", "Estado del sistema"],
  },
  {
    title: "Legal",
    links: ["Privacidad", "Términos"],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-[rgba(196,198,206,0.2)] bg-white">
      <div className="mx-auto max-w-[1440px] px-6 py-16 md:px-12 md:py-20">
        <div className="flex flex-col gap-12 lg:flex-row lg:justify-between">
          <div className="max-w-xs">
            <p className="font-mono text-2xl font-bold text-[#0b1f3a]">Panalogix</p>
            <p className="mt-4 text-base leading-6 text-[#44474d]">
              Conectando la carga de Panamá con tecnología de vanguardia,
              precisión y confiabilidad.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4 sm:gap-16">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <p className="text-base font-bold text-[#0b1f3a]">{column.title}</p>
                <ul className="mt-4 space-y-3">
                  {column.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm text-[#44474d] transition hover:text-[#0b1f3a]"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 border-t border-[rgba(196,198,206,0.2)] pt-8">
          <p className="text-base text-[#44474d]">
            © 2024 Panalogix. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
