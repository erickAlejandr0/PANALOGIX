"use client";
import Image from "next/image";
import Grainient from "@/components/Grainient"; // ajusta el path según donde lo instale shadcn

export function AuthBrandingPanel() {
  return (
    <section className="relative hidden w-[50%] shrink-0 flex-col items-center justify-center overflow-hidden border-r border-[#e2e8f0] md:flex">
      {/* Background animado reemplaza los dos divs de gradiente estático */}
      <div className="absolute inset-0">
        <Grainient
          color1="#0B1F3A"
          color2="#061328"
          color3="#00AEEF"
          timeSpeed={2.0}
          colorBalance={0}
          warpStrength={0.6}
          warpFrequency={3}
          warpSpeed={0.8}
          warpAmplitude={30}
          blendAngle={0}
          blendSoftness={0.15}
          rotationAmount={150}
          noiseScale={2}
          grainAmount={0.06}
          grainScale={2}
          grainAnimated={false}
          contrast={1.3}
          gamma={1}
          saturation={0.9}
          centerX={-0.1}
          centerY={-0.3}
          zoom={1.5}
        />
      </div>

      {/* Vignette sutil para que el logo resalte, igual que tenías */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255,255,255,0.15) 0%, transparent 70%)",
        }}
      />

      <div className="relative flex flex-col items-center px-8">
        <Image
          src="/auth/panalogix-logo.png"
          alt="Panalogix"
          width={392}
          height={176}
          priority
          className="h-auto w-full max-w-[392px] drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
        />
      </div>

      <div className="absolute inset-x-8 bottom-8 border-t border-white/10 pt-6">
        <p className="text-center text-base text-[#64748b]">
          © 2026 Panalogix Inc. Todos los derechos reservados.
        </p>
      </div>
    </section>
  );
}