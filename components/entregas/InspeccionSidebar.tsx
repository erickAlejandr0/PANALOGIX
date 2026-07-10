import {
  AlertTriangle,
  Clock,
  Package,
  Upload,
  UserPlus,
} from "lucide-react";
import { getApplicantInitials } from "@/lib/publicaciones/format";
import type {
  InspeccionFleteDetalle,
  InspeccionTransportista,
} from "@/lib/entregas/types";

function RouteTimeline({
  origen,
  destino,
}: {
  origen: string;
  destino: string;
}) {
  return (
    <div className="relative flex flex-col gap-4 pt-1">
      <div
        aria-hidden
        className="absolute bottom-2 left-[9px] top-2 w-0.5 bg-[#e5e7eb]"
      />

      <div className="relative flex gap-3">
        <div className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-[#00aeef] bg-white p-0.5">
          <div className="size-1.5 rounded-full bg-[#00aeef]" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.6px] text-[#6b7280]">
            Origen
          </p>
          <p className="text-sm text-[#111827]">{origen}</p>
        </div>
      </div>

      <div className="relative flex gap-3">
        <div className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-[#22c55e] bg-white p-0.5">
          <div className="size-1.5 rounded-full bg-[#22c55e]" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.6px] text-[#6b7280]">
            Destino
          </p>
          <p className="text-sm text-[#111827]">{destino}</p>
        </div>
      </div>
    </div>
  );
}

function FleteDetailCard({ flete }: { flete: InspeccionFleteDetalle }) {
  const fields = [
    { label: "Peso", value: `${flete.pesoKg.toLocaleString("es-PA")} kg` },
    { label: "Pago", value: flete.pago.toLocaleString("es-PA") },
    { label: "Tipo de carga", value: flete.tipoCarga },
    { label: "Fecha de entrega", value: flete.fechaEntrega },
  ];

  return (
    <section className="overflow-hidden rounded-lg border border-[#e5e7eb] bg-white shadow-[0px_1px_2px_rgba(0,0,0,0.05)]">
      <header className="flex items-center justify-between border-b border-[#e5e7eb] bg-[rgba(249,250,251,0.5)] px-5 py-4">
        <h2 className="text-xs font-bold uppercase tracking-[0.6px] text-[#6b7280]">
          Detalle del flete
        </h2>
        <Package className="size-4 text-[#6b7280]" />
      </header>

      <div className="flex flex-col gap-5 p-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.6px] text-[#6b7280]">
            Código de flete
          </p>
          <p className="mt-1 text-lg font-bold text-[#0b1f3a]">
            #{flete.codigo}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {fields.map((field) => (
            <div key={field.label}>
              <p className="text-xs font-bold uppercase tracking-[0.6px] text-[#6b7280]">
                {field.label}
              </p>
              <p className="mt-1 text-base font-bold text-[#0b1f3a]">
                {field.value}
              </p>
            </div>
          ))}
        </div>

        <RouteTimeline origen={flete.origen} destino={flete.destino} />
      </div>
    </section>
  );
}

function TransportistaCard({
  transportista,
}: {
  transportista: InspeccionTransportista;
}) {
  const fullName = `${transportista.nombre} ${transportista.apellido}`.trim();
  const initials = getApplicantInitials(
    transportista.nombre,
    transportista.apellido,
  );

  return (
    <section className="rounded-lg border border-[#e5e7eb] bg-white p-[21px] shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
      <h2 className="text-xs font-bold uppercase tracking-[0.6px] text-[#6b7280]">
        Transportista
      </h2>

      <div className="mt-4 flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#0b1f3a] text-sm font-bold text-white">
          {initials}
        </div>
        <div>
          <p className="text-sm font-bold text-[#0b1f3a]">{fullName}</p>
          <p className="text-xs text-[#6b7280]">
            Placa: {transportista.placa} · Cédula: {transportista.cedula}
          </p>
          <p className="text-xs text-[#6b7280]">
            Camión: {transportista.vehiculo}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1.5 text-xs text-[#6b7280]">
        <Clock className="size-4 shrink-0" />
        <span>
          Iniciada {transportista.iniciadaAt} · {transportista.iniciadaHace}
        </span>
      </div>
    </section>
  );
}

const QUICK_ACTIONS = [
  { label: "Subir evidencia", icon: Upload },
  { label: "Asignar revisor", icon: UserPlus },
  { label: "Marcar anomalía", icon: AlertTriangle },
] as const;

function QuickActionsCard() {
  return (
    <section className="rounded-lg border border-[#e5e7eb] bg-white p-[21px] shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
      <h2 className="text-xs font-bold uppercase tracking-[0.6px] text-[#6b7280]">
        Acciones rápidas{" "}
        <span className="font-normal normal-case tracking-normal text-[#9ca3af]">
          [ Próximamente ]
        </span>
      </h2>

      <ul className="mt-2 flex flex-col">
        {QUICK_ACTIONS.map((action, index) => {
          const Icon = action.icon;
          return (
            <li key={action.label}>
              <button
                type="button"
                disabled
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#75777e] opacity-70 ${
                  index === QUICK_ACTIONS.length - 1 ? "pb-2 pt-3" : "py-2"
                }`}
              >
                <Icon className="size-5 shrink-0" />
                {action.label}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

type InspeccionSidebarProps = {
  flete: InspeccionFleteDetalle;
  transportista: InspeccionTransportista;
};

export function InspeccionSidebar({
  flete,
  transportista,
}: InspeccionSidebarProps) {
  return (
    <aside className="flex flex-col gap-6">
      <FleteDetailCard flete={flete} />
      <TransportistaCard transportista={transportista} />
      <QuickActionsCard />
    </aside>
  );
}
