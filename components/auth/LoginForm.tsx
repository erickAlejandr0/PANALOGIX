"use client";

import { ArrowRight, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { DocumentAlert } from "./DocumentAlert";
import { GoogleIcon } from "./GoogleIcon";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = () => {
    console.log({ email, password, rememberMe });
  };

  return (
    <div className="w-full max-w-[440px] bg-[#f8fafc] text-[#0f172a] [color-scheme:light]">
      <div className="pb-4">
        <h1 className="font-mono text-[32px] font-bold leading-[48px] tracking-tight text-[#0f172a]">
          Iniciar Sesión
        </h1>
        <p className="mt-1 text-base text-[#64748b]">
          Bienvenido de nuevo. Ingresa tus datos.
        </p>
      </div>

      <DocumentAlert />

      <div className="mt-8 space-y-8">
        <div className="space-y-6">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-4 rounded-lg border border-[#e2e8f0] bg-white px-4 py-3.5 text-base font-semibold text-[#0f172a] shadow-sm transition hover:bg-[#f8fafc]"
            onClick={() => console.log("google sign in")}
          >
            <GoogleIcon />
            Continuar con Google
          </button>

          <div className="flex items-center">
            <hr className="flex-1 border-[#e2e8f0]" />
            <span className="px-4 text-base font-medium text-[#64748b]">
              o inicia con tu correo
            </span>
            <hr className="flex-1 border-[#e2e8f0]" />
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-base font-semibold text-[#0f172a]"
            >
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]"
                size={18}
              />
              <input
                id="email"
                type="email"
                className="w-full rounded-lg border border-[#e2e8f0] bg-white py-[15px] pl-11 pr-4 text-base text-[#0f172a] shadow-sm outline-none placeholder:text-[#94a3b8] focus:border-[#00aeef] focus:ring-1 focus:ring-[#00aeef]"
                placeholder="ejemplo@panalogix.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-base font-semibold text-[#0f172a]"
              >
                Contraseña
              </label>
              <a
                href="#"
                className="text-base font-medium text-[#00aeef] hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]"
                size={18}
              />
              <input
                id="password"
                type="password"
                className="w-full rounded-lg border border-[#e2e8f0] bg-white py-[15px] pl-11 pr-4 text-base text-[#0f172a] shadow-sm outline-none placeholder:text-[#94a3b8] focus:border-[#00aeef] focus:ring-1 focus:ring-[#00aeef]"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              className="size-4 rounded border-[#cbd5e1] bg-white text-[#00aeef] focus:ring-[#00aeef]"
            />
            <span className="text-base text-[#64748b]">
              Recordarme en este dispositivo
            </span>
          </label>
        </div>

        <div className="space-y-4 pt-4">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2ecc71] px-6 py-3.5 text-base font-bold text-white shadow-[0px_10px_15px_-3px_rgba(46,204,113,0.2),0px_4px_6px_-4px_rgba(46,204,113,0.2)] transition hover:brightness-105"
            onClick={handleSubmit}
          >
            Ingresar
            <ArrowRight size={16} />
          </button>

          <div className="flex items-center py-4">
            <hr className="flex-1 border-[#e2e8f0]" />
            <span className="px-4 text-base font-medium text-[#94a3b8]">
              ¿No tienes cuenta?
            </span>
            <hr className="flex-1 border-[#e2e8f0]" />
          </div>

          <Link
            href="/Sign-up"
            className="block w-full rounded-lg bg-gradient-to-b from-white to-[#ebeff3] px-6 py-3.5 text-center text-base font-bold text-[#1a4c90] shadow-sm transition hover:brightness-[0.98]"
          >
            Registrarse
          </Link>
        </div>
      </div>

      <div className="mt-8 flex justify-center gap-8 pt-4">
        {["Privacidad", "Términos", "Soporte"].map((link) => (
          <a
            key={link}
            href="#"
            className="text-base text-[#94a3b8] transition hover:text-[#64748b]"
          >
            {link}
          </a>
        ))}
      </div>
    </div>
  );
}
