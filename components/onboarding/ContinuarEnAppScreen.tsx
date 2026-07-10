import Image from "next/image";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

function BackgroundDots() {
  const dots = [
    [15, 25, 5, 0.2],
    [53, 58, 6, 0.17],
    [21, 96, 4, 0.39],
    [54, 25, 4, 0.31],
    [85, 46, 2, 0.37],
    [25, 58, 6, 0.32],
    [75, 12, 5, 0.36],
    [4, 30, 4, 0.34],
    [24, 42, 2, 0.16],
    [41, 52, 2, 0.22],
    [66, 24, 4, 0.27],
    [39, 3, 4, 0.32],
    [76, 89, 3, 0.39],
    [26, 72, 5, 0.28],
    [17, 31, 3, 0.29],
    [70, 80, 4, 0.3],
    [60, 15, 3, 0.16],
    [66, 31, 4, 0.12],
    [28, 56, 3, 0.21],
    [55, 25, 6, 0.17],
    [38, 86, 4, 0.11],
    [64, 28, 6, 0.23],
    [66, 82, 6, 0.11],
    [3, 63, 3, 0.31],
    [65, 14, 6, 0.17],
    [18, 16, 4, 0.12],
    [38, 29, 3, 0.13],
    [42, 27, 4, 0.22],
    [78, 76, 2, 0.17],
    [40, 82, 5, 0.3],
    [22, 17, 4, 0.16],
    [25, 99, 6, 0.38],
    [48, 55, 5, 0.28],
    [42, 19, 5, 0.33],
    [54, 93, 3, 0.11],
    [59, 14, 3, 0.11],
    [31, 90, 4, 0.35],
    [23, 71, 5, 0.37],
    [53, 37, 5, 0.37],
    [10, 83, 4, 0.3],
    [34, 80, 5, 0.25],
    [22, 12, 4, 0.27],
    [73, 31, 6, 0.24],
    [36, 47, 2, 0.33],
    [68, 74, 5, 0.18],
    [78, 33, 5, 0.11],
    [81, 69, 4, 0.24],
    [17, 39, 4, 0.18],
    [15, 21, 3, 0.11],
    [39, 81, 3, 0.28],
    [34, 5, 4, 0.28],
    [33, 49, 4, 0.22],
    [83, 85, 3, 0.33],
    [15, 48, 3, 0.23],
    [84, 27, 3, 0.39],
    [28, 69, 5, 0.27],
    [20, 69, 5, 0.26],
    [66, 2, 2, 0.34],
    [78, 70, 5, 0.31],
    [11, 49, 6, 0.14],
    [71, 83, 4, 0.13],
    [45, 37, 3, 0.17],
    [16, 74, 5, 0.22],
    [10, 16, 4, 0.38],
    [45, 28, 2, 0.23],
    [82, 56, 4, 0.16],
    [81, 38, 5, 0.11],
    [8, 59, 3, 0.24],
    [63, 42, 3, 0.16],
  ] as const;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {dots.map(([left, top, size, opacity], index) => (
        <span
          key={index}
          className="absolute rounded-sm bg-[#0b1f3a]"
          style={{
            left: `${left}%`,
            top: `${top}%`,
            width: size,
            height: size,
            opacity,
          }}
        />
      ))}
    </div>
  );
}

function AppleIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 24"
      className="h-6 w-5 shrink-0 fill-white"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M16.705 12.763c.012-.92.262-1.822.727-2.622.465-.8 1.13-1.472 1.933-1.954-.51-.711-1.183-1.296-1.965-1.709-.782-.413-1.652-.642-2.541-.669-1.896-.194-3.733 1.108-4.7 1.108-.984 0-2.471-1.088-4.073-1.056-1.036.033-2.046.327-2.931.854-.885.527-1.615 1.269-2.119 2.153-2.183 3.69-.554 9.114 1.537 12.097 1.046 1.461 2.269 3.092 3.869 3.034 1.566-.063 2.151-.974 4.041-.974 1.872 0 2.421.975 4.054.938 1.68-.027 2.739-1.467 3.749-2.942.752-1.04 1.33-2.191 1.714-3.408-.976-.403-1.809-1.078-2.395-1.94-.586-.862-.899-1.874-.9-2.909Zm-3.084-8.916c.916-1.074 1.367-2.454 1.258-3.847-1.4.144-2.693.797-3.621 1.83-.454.504-.802 1.091-1.023 1.727-.222.636-.313 1.308-.268 1.978.7.007 1.393-.141 2.026-.433.633-.292 1.19-.721 1.628-1.255Z" />
    </svg>
  );
}

function AppStoreButton() {
  return (
    <button
      type="button"
      disabled
      aria-label="Descargar en App Store — Próximamente"
      className="inline-flex h-[46px] w-[137px] items-center gap-2 rounded-[15px] border border-[#a6a6a6] bg-black px-2 opacity-90"
    >
      <AppleIcon />
      <span className="flex flex-col items-start text-left text-white">
        <span className="text-[9px] leading-[9px]">Download on the</span>
        <span className="text-lg leading-none tracking-[-0.47px]">
          App Store
        </span>
      </span>
    </button>
  );
}

export function ContinuarEnAppScreen() {
  return (
    <div className="relative flex min-h-screen flex-col bg-[#f8f9ff]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at 15% 50%, rgba(45, 188, 254, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 85% 30%, rgba(0, 101, 141, 0.05) 0%, transparent 50%)
          `,
        }}
      />
      <BackgroundDots />

      <header className="relative z-10 px-6 py-4 lg:px-8">
        <div className="mx-auto flex max-w-[1280px] items-center gap-2 p-6">
          <Image
            src="/auth/panalogix-logo.png"
            alt="Panalogix"
            width={33}
            height={26}
            className="h-[26px] w-auto"
            priority
          />
          <div>
            <p className="font-mono text-2xl font-bold tracking-[-0.6px] text-[#000615]">
              Panalogix
            </p>
            <p className="text-[9px] font-semibold tracking-[0.24px] text-[#44474d]">
              Conectamos carga, Movemos Panamá
            </p>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center px-4 py-8 lg:px-6">
        <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <section className="rounded-xl border border-[rgba(196,198,206,0.5)] bg-white/70 p-8 shadow-[0px_8px_32px_0px_rgba(11,31,58,0.05)] backdrop-blur-[6px] lg:p-[33px]">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <span className="inline-flex w-fit items-center gap-1 rounded-full border border-[#c4c6ce] bg-[#e5efff] px-[9px] py-[5px] text-xs font-semibold tracking-[0.24px] text-[#00658d]">
                  <CheckCircle2 className="size-[14px] shrink-0" aria-hidden />
                  Registro Completado
                </span>

                <h1 className="font-mono text-4xl font-bold leading-[1.15] tracking-[-1.2px] text-[#000615] lg:text-[48px] lg:leading-[56px]">
                  Lleva Panalogix en
                  <br />
                  tu bolsillo.
                </h1>
              </div>

              <p className="max-w-xl text-lg leading-7 text-[#44474d]">
                Has completado tu registro con éxito. Para empezar a gestionar
                fletes, optimizar tus rutas y recibir notificaciones en tiempo
                real, descarga nuestra aplicación móvil oficial.
              </p>

              <div className="pt-2">
                <AppStoreButton />
              </div>

              <p className="text-sm text-[#44474d]">
                Inicia sesión en la app con el mismo correo y contraseña que
                registraste en la web.
              </p>
            </div>
          </section>

          <section className="relative flex items-center justify-center py-8 lg:py-0">
            <div
              className="pointer-events-none absolute inset-0 scale-125"
              style={{
                backgroundImage: `radial-gradient(circle at center, rgba(45,188,254,0.15) 0%, rgba(45,188,254,0) 60%)`,
              }}
            />
            <div className="relative h-[520px] w-[275px] shadow-[0px_4px_4px_rgba(0,0,0,0.25)] lg:h-[640px] lg:w-[337px]">
              <Image
                src="/onboarding/phone-mockup.png"
                alt="Vista previa de la app móvil Panalogix"
                fill
                className="object-contain"
                priority
                sizes="(max-width: 1024px) 275px, 337px"
              />
            </div>
          </section>
        </div>
      </main>

      <footer className="relative z-10 mt-auto border-t border-[#c4c6ce] bg-[#f8f9ff] px-8 py-6">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-[#00658d]">© 2026 Panalogix.</p>
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-[#44474d]">
            <Link href="#" className="hover:text-[#00658d]">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-[#00658d]">
              Terms of Service
            </Link>
            <Link href="#" className="hover:text-[#00658d]">
              Contact Us
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
