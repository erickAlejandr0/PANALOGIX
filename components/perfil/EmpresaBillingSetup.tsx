"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

type EmpresaBillingSetupProps = {
  onCompleted: () => void;
  onCancel?: () => void;
  autoStart?: boolean;
  mode?: "initial" | "change";
};

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

function BillingSetupForm({
  onCompleted,
  onCancel,
  mode = "initial",
}: EmpresaBillingSetupProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!stripe || !elements) return;

    setIsSubmitting(true);
    setError(null);

    const result = await stripe.confirmSetup({
      elements,
      redirect: "if_required",
    });

    if (result.error) {
      setError(result.error.message ?? "No se pudo guardar la tarjeta");
      setIsSubmitting(false);
      return;
    }

    const setupIntentId = result.setupIntent?.id;
    if (!setupIntentId) {
      setError("No se pudo confirmar la configuración de pago");
      setIsSubmitting(false);
      return;
    }

    const response = await fetch("/api/billing/complete-setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ setupIntentId }),
    });

    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(payload.error ?? "No se pudo completar la configuración");
      setIsSubmitting(false);
      return;
    }

    onCompleted();
    setIsSubmitting(false);
  }, [elements, onCompleted, stripe]);

  return (
    <div className="flex flex-col gap-4">
      <PaymentElement />
      {error ? <p className="text-sm text-[#ef4444]">{error}</p> : null}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={!stripe || !elements || isSubmitting}
          className="inline-flex items-center justify-center rounded-lg bg-[#0b1f3a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#123456] disabled:opacity-60"
        >
          {isSubmitting
            ? "Guardando..."
            : mode === "change"
              ? "Guardar nueva tarjeta"
              : "Guardar método de pago"}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-lg border border-[#e2e8f0] px-4 py-2 text-sm font-medium text-[#64748b] transition hover:bg-[#f8fafc] disabled:opacity-60"
          >
            Cancelar
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function EmpresaBillingSetup({
  onCompleted,
  onCancel,
  autoStart = false,
  mode = "initial",
}: EmpresaBillingSetupProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startSetup = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await fetch("/api/billing/setup-intent", {
      method: "POST",
    });
    const payload = (await response.json()) as {
      error?: string;
      data?: { clientSecret: string };
    };

    if (!response.ok || !payload.data?.clientSecret) {
      setError(payload.error ?? "No se pudo iniciar la configuración de pago");
      setLoading(false);
      return;
    }

    setClientSecret(payload.data.clientSecret);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (autoStart && !clientSecret && !loading) {
      void startSetup();
    }
  }, [autoStart, clientSecret, loading, startSetup]);

  const options = useMemo(
    () =>
      clientSecret
        ? {
            clientSecret,
            appearance: {
              theme: "stripe" as const,
            },
          }
        : null,
    [clientSecret],
  );

  const description =
    mode === "change"
      ? "Ingresa los datos de la nueva tarjeta. Reemplazará la tarjeta principal actual."
      : "Agrega una tarjeta para publicar fletes. Los fondos se reservan al publicar y se liberan al transportista cuando la entrega se complete.";

  if (!stripePromise) {
    return (
      <p className="text-sm text-[#64748b]">
        Stripe no está configurado. Agrega NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY al
        entorno.
      </p>
    );
  }

  if (!clientSecret) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-[#64748b]">{description}</p>
        {error ? <p className="text-sm text-[#ef4444]">{error}</p> : null}
        {autoStart ? (
          <p className="text-sm text-[#64748b]">
            {loading ? "Preparando formulario de pago..." : "Cargando..."}
          </p>
        ) : (
          <button
            type="button"
            onClick={() => void startSetup()}
            disabled={loading}
            className="self-start rounded-lg bg-[#0ea5e9] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0284c7] disabled:opacity-60"
          >
            {loading
              ? "Preparando..."
              : mode === "change"
                ? "Continuar"
                : "+ Agregar tarjeta"}
          </button>
        )}
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="self-start text-sm font-medium text-[#64748b] transition hover:text-[#0b1f3a] disabled:opacity-60"
          >
            Cancelar
          </button>
        ) : null}
      </div>
    );
  }

  if (!options) return null;

  return (
    <Elements stripe={stripePromise} options={options}>
      <BillingSetupForm
        onCompleted={onCompleted}
        onCancel={onCancel}
        mode={mode}
      />
    </Elements>
  );
}
