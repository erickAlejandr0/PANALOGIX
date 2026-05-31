"use client";

import {
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { GoogleIcon } from "./GoogleIcon";

export type AccountType = "transportista" | "empresa";

const accountTypes = [
  { id: "transportista" as const, label: "Transportista", icon: Truck },
  { id: "empresa" as const, label: "Empresa", icon: Building2 },
];

export function SignUpForm() {
  const [accountType, setAccountType] = useState<AccountType>("transportista");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = () => {
    console.log({ accountType, email, password });
  };

  return (
    <div className="w-full max-w-[448px] bg-[#f8f9ff] text-[#121c27] [color-scheme:light]">
      <div className="pb-2">
        <h1 className="font-mono text-[30px] font-semibold leading-[38px] text-[#121c27]">
          Crear Cuenta
        </h1>
        <p className="mt-1 text-base text-[#44474d]">
          Únete a la red logística más eficiente.
        </p>
      </div>

      <div className="mt-6 space-y-2">
        <p className="text-xs font-semibold tracking-wide text-[#121c27]">
          Tipo de cuenta
        </p>
        <div className="grid grid-cols-2 gap-2">
          {accountTypes.map((type) => {
            const Icon = type.icon;
            const selected = accountType === type.id;

            return (
              <button
                key={type.id}
                type="button"
                onClick={() => setAccountType(type.id)}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 transition ${
                  selected
                    ? "border-[#00aeef] bg-[rgba(0,174,239,0.05)] shadow-[inset_0_0_0_2px_#00aeef]"
                    : "border-[#c4c6ce] bg-white hover:border-[#94a3b8]"
                }`}
              >
                <Icon
                  className={selected ? "text-[#00aeef]" : "text-[#64748b]"}
                  size={28}
                />
                <span className="text-xs font-semibold tracking-wide text-[#121c27]">
                  {type.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 space-y-6">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#c4c6ce] bg-white px-4 py-3.5 text-sm font-semibold tracking-wide text-[#121c27] shadow-sm transition hover:bg-[#f8f9ff]"
          onClick={() => console.log("google sign up")}
        >
          <GoogleIcon />
          Registrarse con Google
        </button>

        <div className="flex items-center py-2">
          <hr className="flex-1 border-[#c4c6ce]" />
          <span className="px-2 text-xs font-semibold tracking-wide text-[#44474d]">
            o regístrate con tu correo
          </span>
          <hr className="flex-1 border-[#c4c6ce]" />
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="signup-email"
              className="mb-1 block text-xs font-semibold tracking-wide text-[#121c27]"
            >
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280]"
                size={16}
              />
              <input
                id="signup-email"
                type="email"
                className="w-full rounded-lg border border-[#c4c6ce] bg-white py-[11px] pl-10 pr-4 text-base text-[#121c27] outline-none placeholder:text-[#6b7280] focus:border-[#00aeef] focus:ring-1 focus:ring-[#00aeef]"
                placeholder="juan@ejemplo.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="signup-password"
              className="mb-1 block text-xs font-semibold tracking-wide text-[#121c27]"
            >
              Contraseña
            </label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280]"
                size={16}
              />
              <input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                className="w-full rounded-lg border border-[#c4c6ce] bg-white py-[11px] pl-10 pr-10 text-base text-[#121c27] outline-none placeholder:text-[#6b7280] focus:border-[#00aeef] focus:ring-1 focus:ring-[#00aeef]"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#121c27]"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2ecc71] px-4 py-3 text-sm font-semibold tracking-wide text-white shadow-sm transition hover:brightness-105"
          onClick={handleSubmit}
        >
          Registrarse
          <ArrowRight size={14} />
        </button>

        <p className="text-center text-sm text-[#44474d]">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="text-xs font-semibold tracking-wide text-[#00aeef] hover:underline"
          >
            Iniciar Sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
