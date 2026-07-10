import { ShieldCheck, Sparkles, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const features: Feature[] = [
  {
    icon: Sparkles,
    title: "Marketplace Inteligente",
    description:
      "Conexión automática mediante algoritmos de 'smart matching' entre cargas y transportistas calificados. Optimización de rutas y consolidación de carga en un ecosistema transparente.",
  },
  {
    icon: Truck,
    title: "Tecnología y Rastreo Real",
    description:
      "Monitoreo GPS en tiempo real con alertas predictivas. Gestión documental 100% digital, desde la orden de carga hasta la prueba de entrega electrónica (ePOD).",
  },
  {
    icon: ShieldCheck,
    title: "Seguridad Financiera",
    description:
      "Proceso riguroso de verificación y compliance para toda la red de transportistas. Sistema de pagos centralizado y seguro, garantizando trazabilidad financiera y puntualidad.",
  },
];

export function FeaturesSection() {
  return (
    <section id="soluciones" className="px-6 py-24 md:px-12 md:py-32">
      <div className="mx-auto max-w-[1440px]">
        <div className="mx-auto max-w-[768px] text-center">
          <h2 className="font-mono text-3xl font-bold leading-tight text-[#0b1f3a] md:text-[40px] md:leading-[50px]">
            Herramientas inteligentes para
            <br />
            una logística sin fricciones
          </h2>
          <p className="mt-6 text-base leading-6 text-[#44474d]">
            Diseñado para simplificar operaciones complejas, brindando visibilidad
            total y control a cada paso del camino.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-12">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className="rounded-[32px] border border-[rgba(255,255,255,0.3)] bg-[rgba(255,255,255,0.7)] p-10 shadow-[0px_4px_30px_0px_rgba(0,0,0,0.05)] backdrop-blur-md"
              >
                <div className="flex size-16 items-center justify-center rounded-xl bg-[rgba(11,31,58,0.05)]">
                  <Icon className="text-[#0b1f3a]" size={28} />
                </div>
                <h3 className="mt-6 font-mono text-2xl font-bold leading-9 text-[#0b1f3a]">
                  {feature.title}
                </h3>
                <p className="mt-4 text-base leading-[26px] text-[#44474d]">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
