'use client'

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useParallax } from "@/hooks/useParallax";
import type { Variants } from "framer-motion"

type ComingSoonHeroProps = {
  profileLabel?: string;
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.2 } },
}

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: "easeInOut" },
  },
}

export function ComingSoonHero({ profileLabel }: ComingSoonHeroProps) {
  const { heroRef, neb1Ref, neb2Ref } = useParallax();
  

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#000615] text-white [color-scheme:dark]">
      {/* Background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse at center, #0b1f3a 0%, #061328 50%, #000615 100%)" }}
      />

      {/* Partículas */}
      {/* <ParticleCanvas /> */}

      {/* Nebula blobs — ahora con ref para parallax */}
      <div ref={neb1Ref} className="pointer-events-none absolute -left-32 -top-32 size-[908px] rounded-full bg-[#00658d] opacity-40 blur-[50px] transition-transform duration-500 ease-out" />
      <div ref={neb2Ref} className="pointer-events-none absolute -bottom-32 -right-32 size-[757px] rounded-full bg-[#2dbcfe] opacity-40 blur-[50px] transition-transform duration-500 ease-out" />

      {/* Header */}
      <header className="relative flex justify-end px-6 pt-6 md:px-12 md:pt-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="animate-float"
        >
          <Image
            src="/auth/panalogix-logo-hero.png"
            alt="Panalogix"
            width={484}
            height={107}
            priority
            className="h-auto w-[200px] drop-shadow-[0_0_25px_rgba(45,188,254,0.6)] md:w-[280px]"
          />
        </motion.div>
      </header>

      {/* Main */}
      <main className="relative flex flex-1 flex-col items-center justify-center px-6 pb-32 pt-12 text-center md:px-12">
        <motion.div
          ref={heroRef}
          variants={stagger}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
        >
          {profileLabel && (
            <motion.span
              variants={item}
              className="mb-6 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#b5c7ea]"
            >
              {profileLabel} · Coming Soon
            </motion.span>
          )}

          <div className="max-w-3xl space-y-4">
            <motion.h1
              variants={item}
              className="font-mono text-3xl font-bold leading-tight tracking-tight text-white drop-shadow-lg md:text-5xl md:leading-[56px]"
            >
              El futuro de la logística
              <br />
              en Panamá está llegando.
            </motion.h1>
            <motion.p
              variants={item}
              className="mx-auto max-w-2xl text-base leading-7 text-[#b5c7ea] opacity-90 md:text-lg md:leading-8"
            >
              Estamos construyendo el marketplace de fletes más avanzado del país.
              Únete a la revolución logística.
            </motion.p>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="relative px-6 pb-6 md:px-[116px]"
      >
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-4 rounded-none border border-white/10 bg-white/5 px-8 py-6 backdrop-blur-md sm:flex-row">
          <p className="text-sm text-[#b5c7ea] opacity-80">
            © 2024 Panalogix. Precision Freight Marketplace.
          </p>
          <div className="flex gap-4">
            <Link href="#" className="text-sm text-[#b5c7ea] transition hover:text-white">Privacidad</Link>
            <Link href="#" className="text-sm text-[#b5c7ea] transition hover:text-white">Términos</Link>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}