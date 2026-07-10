"use client";

import {
  ArrowRight,
  Bus,
  ChevronDown,
  CreditCard,
  Info,
  MapPin,
  Phone,
  Shield,
  Truck,
  Wrench,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import {
  completeTransportistaOnboardingAction,
  getVehiculoConfigDetalleAction,
  getVehiculoConfigsByCategoriaAction,
} from "@/actions/onboardingActions";
import { VEHICULO_MARCAS } from "@/lib/vehiculos/marcas";

type Categoria = {
  id: number;
  nombre: string;
};

type ConfigOption = {
  id: number;
  label: string;
};

const CATEGORIA_LABELS: Record<number, string> = {
  1: "Camión Rígido",
  2: "Vehículos Articulados (Mulas)",
  3: "Especializado",
};

const CATEGORIA_ORDER = [2, 1, 3];

const CATEGORIA_ICONS: Record<number, ReactNode> = {
  1: <Truck className="size-7 text-[#121c27]" />,
  2: <Truck className="size-7 text-[#121c27]" />,
  3: <Wrench className="size-7 text-[#121c27]" />,
};

type FormFieldProps = {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  icon?: ReactNode;
  type?: string;
};

function FormField({
  id,
  label,
  placeholder,
  value,
  onChange,
  icon,
  type = "text",
}: FormFieldProps) {
  return (
    <div className="flex w-full flex-col gap-2">
      <label
        htmlFor={id}
        className="text-xs font-semibold tracking-wide text-[#121c27]"
      >
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#44474d]">
            {icon}
          </span>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-lg border border-[#c4c6ce] bg-[#f8f9ff] py-3 text-base text-[#121c27] shadow-sm outline-none placeholder:text-[#6b7280] focus:border-[#00658d] focus:ring-1 focus:ring-[#00658d] ${
            icon ? "pl-10 pr-4" : "px-4"
          }`}
        />
      </div>
    </div>
  );
}

type TransportistaOnboardingFormProps = {
  categorias: Categoria[];
};

export function TransportistaOnboardingForm({
  categorias,
}: TransportistaOnboardingFormProps) {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [cedula, setCedula] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [anio, setAnio] = useState("");
  const [placa, setPlaca] = useState("");
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [configId, setConfigId] = useState<number | null>(null);
  const [configOptions, setConfigOptions] = useState<ConfigOption[]>([]);
  const [configDetalle, setConfigDetalle] = useState("");
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingConfigs, setLoadingConfigs] = useState(false);

  const orderedCategorias = CATEGORIA_ORDER.map((id) =>
    categorias.find((c) => c.id === id),
  ).filter((c): c is Categoria => Boolean(c));

  useEffect(() => {
    if (!categoriaId) {
      setConfigOptions([]);
      setConfigId(null);
      setConfigDetalle("");
      return;
    }

    let cancelled = false;
    setLoadingConfigs(true);
    setConfigId(null);
    setConfigDetalle("");

    getVehiculoConfigsByCategoriaAction(categoriaId)
      .then((configs) => {
        if (!cancelled) {
          setConfigOptions(configs);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingConfigs(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [categoriaId]);

  useEffect(() => {
    if (!configId) {
      setConfigDetalle("");
      return;
    }

    let cancelled = false;

    getVehiculoConfigDetalleAction(configId).then((result) => {
      if (!cancelled && "detalle" in result && result.detalle) {
        setConfigDetalle(result.detalle);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [configId]);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("nombre", nombre);
      formData.append("apellido", apellido);
      formData.append("cedula", cedula);
      formData.append("direccion", direccion);
      formData.append("telefono", telefono);
      formData.append("marca", marca);
      formData.append("modelo", modelo);
      formData.append("anio", anio);
      formData.append("placa", placa);
      formData.append("id_categoria", String(categoriaId ?? ""));
      formData.append("id_config", String(configId ?? ""));
      formData.append("aceptaTerminos", aceptaTerminos ? "true" : "false");

      const result = await completeTransportistaOnboardingAction(formData);
      if (result?.error) {
        setError(result.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-white">
      <div className="flex items-center justify-end px-6 py-6 lg:px-16">
        <p className="text-xs text-[#44474d]">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="font-semibold text-[#00658d] hover:underline"
          >
            Inicia sesión
          </Link>
        </p>
      </div>

      <div className="flex flex-1 justify-center overflow-auto px-6 pb-12 lg:px-16">
        <div className="w-full max-w-[900px]">
          <div className="mb-8 lg:hidden">
            <Image
              src="/auth/panalogix-logo.png"
              alt="Panalogix"
              width={200}
              height={90}
              priority
              className="h-auto w-[180px]"
            />
          </div>

          <div className="mb-8 flex items-center justify-between">
            <h2 className="font-mono text-2xl font-semibold text-[#121c27]">
              Crea tu cuenta
            </h2>
          </div>

          {error && (
            <p className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-8">
            <section className="flex flex-col gap-6">
              <h3 className="border-b border-[#c4c6ce] pb-2 text-sm font-semibold text-[#121c27]">
                Información del Conductor
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  id="nombre"
                  label="Nombres"
                  placeholder="Ej. Juan Carlos"
                  value={nombre}
                  onChange={setNombre}
                />
                <FormField
                  id="apellido"
                  label="Apellidos"
                  placeholder="Ej. Pérez Gómez"
                  value={apellido}
                  onChange={setApellido}
                />
                <FormField
                  id="cedula"
                  label="Cédula / Pasaporte"
                  placeholder="8-000-0000"
                  value={cedula}
                  onChange={setCedula}
                  icon={<CreditCard size={18} />}
                />
                <FormField
                  id="telefono"
                  label="Teléfono Celular"
                  placeholder="+507 6000-0000"
                  value={telefono}
                  onChange={setTelefono}
                  icon={<Phone size={18} />}
                />
              </div>

              <FormField
                id="direccion"
                label="Dirección"
                placeholder="Dirección"
                value={direccion}
                onChange={setDireccion}
                icon={<MapPin size={18} />}
              />
            </section>

            <section className="flex flex-col gap-6">
              <h3 className="border-b border-[#c4c6ce] pb-2 text-sm font-semibold text-[#121c27]">
                Detalles del Vehículo Principal
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="marca"
                    className="text-xs font-semibold text-[#121c27]"
                  >
                    Marca
                  </label>
                  <div className="relative">
                    <select
                      id="marca"
                      value={marca}
                      onChange={(e) => setMarca(e.target.value)}
                      className="w-full appearance-none rounded-lg border border-[#c4c6ce] bg-[#f8f9ff] py-3 pl-4 pr-10 text-base text-[#121c27] shadow-sm outline-none focus:border-[#00658d] focus:ring-1 focus:ring-[#00658d]"
                    >
                      <option value="">Seleccione</option>
                      {VEHICULO_MARCAS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#44474d]" />
                  </div>
                </div>

                <FormField
                  id="modelo"
                  label="Modelo"
                  placeholder="Ej. Cascadia"
                  value={modelo}
                  onChange={setModelo}
                />
                <FormField
                  id="anio"
                  label="Año"
                  placeholder="2020"
                  value={anio}
                  onChange={setAnio}
                  type="number"
                />
              </div>

              <div className="max-w-xs">
                <FormField
                  id="placa"
                  label="Placa"
                  placeholder="AT5473"
                  value={placa}
                  onChange={setPlaca}
                />
              </div>

              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold text-[#121c27]">
                  Seleccione Categoría de vehículo
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {orderedCategorias.map((categoria) => {
                    const selected = categoriaId === categoria.id;
                    return (
                      <button
                        key={categoria.id}
                        type="button"
                        onClick={() => setCategoriaId(categoria.id)}
                        className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 transition ${
                          selected
                            ? "border-[#00658d] bg-[#e5efff] ring-1 ring-[#00658d]"
                            : "border-[#c4c6ce] bg-white hover:border-[#00658d]/50"
                        }`}
                      >
                        {CATEGORIA_ICONS[categoria.id]}
                        <span className="text-center text-[10px] font-bold leading-tight text-[#121c27]">
                          {CATEGORIA_LABELS[categoria.id] ?? categoria.nombre}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="config"
                    className="text-xs font-semibold text-[#121c27]"
                  >
                    Seleccione configuración de su vehículo
                  </label>
                  <div className="relative">
                    <select
                      id="config"
                      value={configId ?? ""}
                      disabled={!categoriaId || loadingConfigs}
                      onChange={(e) =>
                        setConfigId(
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                      className="w-full appearance-none rounded-lg border border-[#c4c6ce] bg-[#f8f9ff] py-3 pl-4 pr-10 text-base text-[#121c27] shadow-sm outline-none disabled:cursor-not-allowed disabled:opacity-60 focus:border-[#00658d] focus:ring-1 focus:ring-[#00658d]"
                    >
                      <option value="">
                        {loadingConfigs ? "Cargando..." : "Seleccione"}
                      </option>
                      {configOptions.map((config) => (
                        <option key={config.id} value={config.id}>
                          {config.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#44474d]" />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-[#121c27]">
                    Detalle de configuración
                  </p>
                  <div className="min-h-[82px] rounded-xl border border-[#c4c6ce] bg-white p-4 text-sm leading-5 text-[#44474d] shadow-sm">
                    {configDetalle ||
                      "Seleccione una configuración para ver el detalle."}
                  </div>
                </div>
              </div>
            </section>

            <section className="flex flex-col gap-6">
              <h3 className="border-b border-[#c4c6ce] pb-2 text-sm font-semibold text-[#121c27]">
                Documentación Requerida (En Desarrollo)
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <DocCard
                  icon={<Shield className="size-5 text-[#00658d]" />}
                  title="Póliza de Seguro (SOAT)"
                  subtitle="Vigente del vehículo"
                />
                <DocCard
                  icon={<Bus className="size-5 text-[#00658d]" />}
                  title="Revisado Vehicular"
                  subtitle="Inspección técnica"
                />
              </div>

              <div className="flex items-start gap-3 rounded-lg bg-[#f8f9ff] p-4">
                <Info className="mt-0.5 size-5 shrink-0 text-[#00658d]" />
                <p className="text-xs leading-5 text-[#434750]">
                  Próximamente estará disponible el servicio de verificación
                  para Transportistas. Desarrollado por el equipo de Panalogix.
                </p>
              </div>
            </section>

            <div className="flex flex-col gap-6 border-t border-[#c4c6ce] pt-8 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={aceptaTerminos}
                  onChange={(e) => setAceptaTerminos(e.target.checked)}
                  className="size-5 rounded border-[#c4c6ce] accent-[#0b1f3a]"
                />
                <span className="text-sm text-[#44474d]">
                  Acepto los{" "}
                  <Link href="#" className="text-[#00658d] hover:underline">
                    Términos y Condiciones
                  </Link>
                </span>
              </label>

              <button
                type="button"
                disabled={isLoading}
                onClick={handleSubmit}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0b1f3a] px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? "Guardando..." : "Continuar"}
                {!isLoading && <ArrowRight className="size-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocCard({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div
      aria-disabled
      className="flex items-center gap-4 rounded-xl border border-[#c4c6ce] bg-white p-4 opacity-70 shadow-sm"
    >
      <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[#e5efff]">
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold text-[#121c27]">{title}</p>
        <p className="text-xs text-[#44474d]">{subtitle}</p>
      </div>
    </div>
  );
}
