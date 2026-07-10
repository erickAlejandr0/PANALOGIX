"use client";

import { useRouter } from "next/navigation";
import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { EmpresaBillingSetup } from "@/components/perfil/EmpresaBillingSetup";
import type {
  EmpresaPerfilEmpresa,
  EmpresaPerfilMetodoPago,
  EmpresaPerfilPagoHistorial,
  EmpresaPerfilResumen,
} from "@/lib/perfil/empresa-perfil-types";
import {
  BadgeCheck,
  CreditCard,
  FileText,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type EmpresaPerfilViewProps = {
  empresa: EmpresaPerfilEmpresa;
  resumen: EmpresaPerfilResumen;
  metodosPago: EmpresaPerfilMetodoPago[];
  historialPagos: EmpresaPerfilPagoHistorial[];
  billingReady: boolean;
  showBillingSetup: boolean;
  focusPaymentsSection?: boolean;
};

export function EmpresaPerfilView({
  empresa,
  resumen,
  metodosPago,
  historialPagos,
  billingReady,
  showBillingSetup,
  focusPaymentsSection = false,
}: EmpresaPerfilViewProps) {
  const router = useRouter();
  const paymentsSectionRef = useRef<HTMLElement>(null);

  const handleBillingCompleted = useCallback(() => {
    router.replace("/Perfil");
    router.refresh();
  }, [router]);

  useEffect(() => {
    if (!focusPaymentsSection) return;

    const timer = window.setTimeout(() => {
      paymentsSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);

    return () => window.clearTimeout(timer);
  }, [focusPaymentsSection]);

  return (
    <div className="mx-auto flex w-full max-w-[1152px] flex-col gap-8 px-8 py-12">
      <PerfilPageHeader billingReady={billingReady} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <EmpresaProfileCard empresa={empresa} />
          <PaymentMethodsCard
            ref={paymentsSectionRef}
            metodosPago={metodosPago}
            billingReady={billingReady}
            showBillingSetup={showBillingSetup}
            focusPaymentsSection={focusPaymentsSection}
            onBillingCompleted={handleBillingCompleted}
          />
          <PaymentHistoryCard historialPagos={historialPagos} />
        </div>

        <div className="flex flex-col gap-6">
          <AccountSummaryWidget resumen={resumen} billingReady={billingReady} />
          <SupportWidget />
        </div>
      </div>
    </div>
  );
}

function PerfilPageHeader({ billingReady }: { billingReady: boolean }) {
  return (
    <header className="flex flex-col gap-2">
      <p className="text-xs font-bold uppercase tracking-[0.6px] text-[#0ea5e9]">
        Configuración
      </p>
      <h1 className="text-[30px] font-bold leading-9 text-[#0b1f3a]">
        Información de la empresa
      </h1>
      <p className="text-base text-[#64748b]">
        Datos corporativos y facturación registrados en Panalogix.
      </p>
      {!billingReady ? (
        <p className="rounded-lg border border-[#fde68a] bg-[#fffbeb] px-4 py-3 text-sm text-[#b45309]">
          Debes configurar un método de pago antes de publicar fletes.
        </p>
      ) : null}
    </header>
  );
}

function EmpresaProfileCard({ empresa }: { empresa: EmpresaPerfilEmpresa }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-sm">
      <div className="h-32 bg-[#0b1f3a]" />

      <div className="flex flex-col gap-6 px-8 pb-8 pt-0">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold text-[#0b1f3a]">{empresa.nombre}</h2>
            {empresa.verificada ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#bbf7d0] bg-[#f0fdf4] px-2.5 py-1 text-xs font-medium text-[#15803d]">
                <BadgeCheck className="size-3" aria-hidden />
                VERIFICADA
              </span>
            ) : null}
          </div>
          <p className="text-sm text-[#64748b]">RFC: {empresa.ruc}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
          <ContactInfoItem
            icon={Mail}
            label="Correo electrónico"
            value={empresa.contacto.email}
          />
          <ContactInfoItem
            icon={Phone}
            label="Teléfono"
            value={empresa.contacto.telefono}
          />
          <ContactInfoItem
            icon={MapPin}
            label="Dirección fiscal"
            value={empresa.contacto.direccion}
            className="sm:col-span-2"
          />
        </div>

        <div className="border-t border-[#e2e8f0]" />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-[#64748b]">
            Última actualización: {empresa.ultimaActualizacion}
          </p>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-[#0b1f3a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#123456]"
          >
            <Pencil className="size-4" aria-hidden />
            Editar datos
          </button>
        </div>
      </div>
    </section>
  );
}

function ContactInfoItem({
  icon: Icon,
  label,
  value,
  className = "",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-4 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-4 ${className}`}
    >
      <div className="rounded-full border border-[#e2e8f0] bg-white p-2 shadow-sm">
        <Icon className="size-5 text-[#0ea5e9]" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.6px] text-[#64748b]">
          {label}
        </p>
        <p className="truncate text-sm font-medium text-[#0b1f3a]">{value}</p>
      </div>
    </div>
  );
}

const PaymentMethodsCard = forwardRef<
  HTMLElement,
  {
    metodosPago: EmpresaPerfilMetodoPago[];
    billingReady: boolean;
    showBillingSetup: boolean;
    focusPaymentsSection: boolean;
    onBillingCompleted: () => void;
  }
>(function PaymentMethodsCard(
  {
    metodosPago,
    billingReady,
    showBillingSetup,
    focusPaymentsSection,
    onBillingCompleted,
  },
  ref,
) {
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [setupKey, setSetupKey] = useState(0);

  const shouldShowSetup = showBillingSetup || isEditingPayment;

  useEffect(() => {
    if (focusPaymentsSection && showBillingSetup) {
      setIsEditingPayment(false);
    }
  }, [focusPaymentsSection, showBillingSetup]);

  const handleSetupCompleted = useCallback(() => {
    setIsEditingPayment(false);
    onBillingCompleted();
  }, [onBillingCompleted]);

  const handleCancelSetup = useCallback(() => {
    setIsEditingPayment(false);
    setSetupKey((current) => current + 1);
  }, []);

  const handleStartChange = useCallback(() => {
    setRemoveError(null);
    setIsEditingPayment(true);
    setSetupKey((current) => current + 1);
  }, []);

  const handleRemovePayment = useCallback(async () => {
    const confirmed = window.confirm(
      "¿Eliminar la tarjeta principal? No podrás publicar fletes hasta agregar una nueva.",
    );
    if (!confirmed) return;

    setIsRemoving(true);
    setRemoveError(null);

    const response = await fetch("/api/billing/remove-payment-method", {
      method: "POST",
    });
    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setRemoveError(payload.error ?? "No se pudo eliminar la tarjeta");
      setIsRemoving(false);
      return;
    }

    setIsRemoving(false);
    onBillingCompleted();
  }, [onBillingCompleted]);

  const setupMode = showBillingSetup ? "initial" : "change";
  const autoStartSetup = shouldShowSetup;

  return (
    <section
      ref={ref}
      id="pagos"
      className={`rounded-2xl border bg-white p-6 shadow-sm ${
        focusPaymentsSection && !billingReady
          ? "border-[#fde68a] ring-2 ring-[#fef3c7]"
          : "border-[#e2e8f0]"
      }`}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <CreditCard className="size-6 text-[#0ea5e9]" aria-hidden />
          <h3 className="text-xl font-bold text-[#0b1f3a]">Métodos de Pago</h3>
        </div>
        {!shouldShowSetup && metodosPago.length > 0 ? (
          <button
            type="button"
            onClick={handleStartChange}
            className="rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-sm font-medium text-[#0b1f3a] transition hover:bg-[#f8fafc]"
          >
            Cambiar tarjeta
          </button>
        ) : null}
      </div>

      {shouldShowSetup ? (
        <EmpresaBillingSetup
          key={setupKey}
          mode={setupMode}
          autoStart={autoStartSetup}
          onCompleted={handleSetupCompleted}
          onCancel={isEditingPayment ? handleCancelSetup : undefined}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {metodosPago.map((metodo) => (
              <PaymentMethodCard
                key={metodo.id}
                metodo={metodo}
                onRemove={() => void handleRemovePayment()}
                isRemoving={isRemoving}
              />
            ))}
          </div>
          {removeError ? (
            <p className="text-sm text-[#ef4444]">{removeError}</p>
          ) : null}
        </div>
      )}
    </section>
  );
});

function PaymentMethodCard({
  metodo,
  onRemove,
  isRemoving,
}: {
  metodo: EmpresaPerfilMetodoPago;
  onRemove: () => void;
  isRemoving: boolean;
}) {
  const isPrimary = metodo.principal;

  return (
    <div
      className={`flex flex-col gap-8 rounded-2xl p-[18px] ${
        isPrimary
          ? "border-2 border-[rgba(14,165,233,0.2)] bg-[rgba(14,165,233,0.05)]"
          : "border border-[#e2e8f0] bg-white"
      }`}
    >
      <div className="flex items-start justify-between">
        <CardBrandIcon marca={metodo.marca} />
        {isPrimary ? (
          <span className="rounded bg-[#0b1f3a] px-2 py-0.5 text-[10px] font-bold text-white">
            PRINCIPAL
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <p className="font-mono text-sm tracking-[0.14em] text-[#0b1f3a]">
          •••• •••• •••• {metodo.ultimosCuatro}
        </p>
        <div className="flex items-end justify-between">
          <p className="text-xs uppercase text-[#64748b]">EXP: {metodo.expiracion}</p>
          {isPrimary ? (
            <button
              type="button"
              onClick={onRemove}
              disabled={isRemoving}
              className="text-[#64748b] transition hover:text-[#ef4444] disabled:opacity-60"
              aria-label="Eliminar tarjeta"
            >
              <Trash2 className="size-4" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function CardBrandIcon({ marca }: { marca: EmpresaPerfilMetodoPago["marca"] }) {
  if (marca === "mastercard") {
    return (
      <div className="flex size-10 items-center justify-center" aria-hidden>
        <div className="relative size-8">
          <span className="absolute left-0 top-1/2 size-5 -translate-y-1/2 rounded-full bg-[#eb001b]" />
          <span className="absolute right-0 top-1/2 size-5 -translate-y-1/2 rounded-full bg-[#f79e1b]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex size-10 items-center justify-center rounded-lg bg-[#f1f5f9]">
      <CreditCard className="size-5 text-[#94a3b8]" aria-hidden />
    </div>
  );
}

function PaymentHistoryCard({
  historialPagos,
}: {
  historialPagos: EmpresaPerfilPagoHistorial[];
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-sm">
      <div className="border-b border-[#e2e8f0] px-6 py-6">
        <div className="flex items-center gap-2">
          <FileText className="size-6 text-[#0ea5e9]" aria-hidden />
          <h3 className="text-xl font-bold text-[#0b1f3a]">Historial de Pagos</h3>
        </div>
      </div>

      {historialPagos.length === 0 ? (
        <p className="px-6 py-8 text-sm text-[#64748b]">
          Aún no hay transacciones registradas.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px]">
            <thead>
              <tr className="bg-[#f8fafc]">
                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.5px] text-[#64748b]">
                  Fecha
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.5px] text-[#64748b]">
                  Monto
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.5px] text-[#64748b]">
                  Estado
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.5px] text-[#64748b]">
                  Referencia
                </th>
              </tr>
            </thead>
            <tbody>
              {historialPagos.map((pago, index) => (
                <tr
                  key={pago.id}
                  className={index > 0 ? "border-t border-[#e2e8f0]" : undefined}
                >
                  <td className="px-6 py-4 text-sm font-medium text-[#0b1f3a]">
                    {pago.fecha}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-[#0b1f3a]">
                    {pago.monto}
                  </td>
                  <td className="px-6 py-4">
                    <EstadoPagoBadge estado={pago.estado} />
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-[#64748b]">
                    {pago.referencia}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function EstadoPagoBadge({
  estado,
}: {
  estado: EmpresaPerfilPagoHistorial["estado"];
}) {
  if (estado === "pagada" || estado === "liberada") {
    return (
      <span className="inline-flex rounded border border-[#dcfce7] bg-[#f0fdf4] px-2 py-0.5 text-xs font-medium text-[#15803d]">
        {estado === "liberada" ? "Liberada" : "Pagada"}
      </span>
    );
  }

  if (estado === "reembolsada") {
    return (
      <span className="inline-flex rounded border border-[#fee2e2] bg-[#fef2f2] px-2 py-0.5 text-xs font-medium text-[#b91c1c]">
        Reembolsada
      </span>
    );
  }

  return (
    <span className="inline-flex rounded border border-[#fde68a] bg-[#fffbeb] px-2 py-0.5 text-xs font-medium text-[#b45309]">
      Reservada
    </span>
  );
}

function AccountSummaryWidget({
  resumen,
  billingReady,
}: {
  resumen: EmpresaPerfilResumen;
  billingReady: boolean;
}) {
  const items = [
    { label: "Plan activo", value: resumen.planActivo },
    { label: "Cliente desde", value: resumen.clienteDesde },
    {
      label: "Entregas este mes",
      value: String(resumen.entregasEsteMes),
    },
    {
      label: "Pagos configurados",
      value: billingReady ? "Sí" : "No",
    },
  ];

  return (
    <section className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
      <h3 className="text-base font-bold text-[#0b1f3a]">Resumen de cuenta</h3>
      <ul className="mt-4 flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.label} className="flex items-center justify-between gap-4">
            <span className="text-sm text-[#64748b]">{item.label}</span>
            <span className="text-sm font-medium text-[#0b1f3a]">{item.value}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SupportWidget() {
  return (
    <section className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
      <h3 className="text-base font-bold text-[#0b1f3a]">Soporte</h3>
      <p className="mt-2 text-sm leading-5 text-[#64748b]">
        ¿Necesitas actualizar información fiscal o legal? Contacta a soporte.
      </p>
      <a
        href="mailto:soportePNLGX@gmail.com"
        className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[#0ea5e9] transition hover:text-[#0284c7]"
      >
        <Mail className="size-4" aria-hidden />
        soportePNLGX@gmail.com
      </a>
    </section>
  );
}
