"use client";

import {
  ArrowRight,
  Building2,
  Hash,
  MapPin,
  Phone,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { completeEmpresaOnboardingAction } from "@/actions/onboardingActions";

type FormFieldProps = {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  icon: ReactNode;
  helperText?: string;
};

function FormField({
  id,
  label,
  placeholder,
  value,
  onChange,
  icon,
  helperText,
}: FormFieldProps) {
  return (
    <div className="flex w-full flex-col gap-2">
      <label
        htmlFor={id}
        className="text-sm font-semibold tracking-wide text-[#121c27]"
      >
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#44474d]">
          {icon}
        </span>
        <input
          id={id}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-[#c4c6ce] bg-[#f8f9ff] py-[19px] pl-[65px] pr-4 text-base text-[#121c27] shadow-sm outline-none placeholder:text-[#c4c6ce] focus:border-[#00658d] focus:ring-1 focus:ring-[#00658d]"
        />
      </div>
      {helperText && (
        <p className="text-[10px] font-bold leading-[14px] text-[#44474d]">
          {helperText}
        </p>
      )}
    </div>
  );
}

export function EmpresaOnboardingForm() {
  const [nombre, setNombre] = useState("");
  const [ruc, setRuc] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("nombre", nombre);
      formData.append("ruc", ruc);
      formData.append("direccion", direccion);
      formData.append("telefono", telefono);

      const result = await completeEmpresaOnboardingAction(formData);
      if (result?.error) {
        setError(result.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-white">
      <div className="flex items-center justify-end px-8 py-8 lg:px-16">
        <p className="text-sm text-[#44474d]">
          ¿Ya tienes una cuenta?{" "}
          <Link
            href="/login"
            className="font-semibold tracking-wide text-[#00658d] hover:underline"
          >
            Inicia sesión
          </Link>
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 pb-8 lg:px-16">
        <div className="w-full max-w-[672px]">
          <div className="mb-12 lg:hidden">
            <Image
              src="/auth/panalogix-logo.png"
              alt="Panalogix"
              width={200}
              height={90}
              priority
              className="h-auto w-[180px]"
            />
          </div>

          {error && (
            <p className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-12">
            <div className="flex flex-col gap-4">
              <h2 className="font-mono text-[30px] font-semibold leading-[38px] tracking-[-0.75px] text-[#121c27]">
                Datos de la Empresa
              </h2>
              <p className="text-base leading-6 text-[#44474d]">
                Ingresa la información legal de tu organización para facturación
                y validación.
              </p>
            </div>

            <div className="flex flex-col gap-6">
              <FormField
                id="nombre"
                label="Razón Social"
                placeholder="Ej. Logística Global S.A."
                value={nombre}
                onChange={setNombre}
                icon={<Building2 size={18} />}
                helperText="Nombre legal completo como aparece en su registro."
              />

              <FormField
                id="ruc"
                label="RUC"
                placeholder="Ej. 155500000-2-1234"
                value={ruc}
                onChange={setRuc}
                icon={<Hash size={18} />}
              />

              <FormField
                id="direccion"
                label="Dirección Principal"
                placeholder="Calle, Número, Edificio, Ciudad"
                value={direccion}
                onChange={setDireccion}
                icon={<MapPin size={18} />}
              />

              <FormField
                id="telefono"
                label="Teléfono Corporativo"
                placeholder="+507 200-0000"
                value={telefono}
                onChange={setTelefono}
                icon={<Phone size={18} />}
              />

              <button
                type="button"
                disabled={isLoading}
                onClick={handleSubmit}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0b1f3a] px-6 py-4 text-sm font-semibold tracking-wide text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? "Guardando..." : "Continuar"}
                {!isLoading && <ArrowRight size={12} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-[#c4c6ce]/30 px-8 py-6">
        <p className="text-center text-[10px] font-bold leading-[14px] text-[#44474d] lg:text-right">
          Al continuar, aceptas nuestros{" "}
          <Link href="#" className="text-[#00658d] hover:underline">
            Términos de Servicio
          </Link>{" "}
          y{" "}
          <Link href="#" className="text-[#00658d] hover:underline">
            Política de Privacidad
          </Link>
          .
        </p>
      </footer>
    </div>
  );
}
