'use client';

import { useEffect } from 'react';

export const MOBILE_BILLING_RETURN_DEEP_LINK =
  process.env.NEXT_PUBLIC_MOBILE_BILLING_RETURN_DEEP_LINK ??
  'panalogix://profile?billing=return';

export const MOBILE_BILLING_REFRESH_DEEP_LINK =
  process.env.NEXT_PUBLIC_MOBILE_BILLING_REFRESH_DEEP_LINK ??
  'panalogix://profile?billing=refresh';

type ConnectReturnActionsProps = {
  stripe?: string;
};

export function ConnectReturnActions({ stripe }: ConnectReturnActionsProps) {
  const deepLink =
    stripe === 'refresh'
      ? MOBILE_BILLING_REFRESH_DEEP_LINK
      : MOBILE_BILLING_RETURN_DEEP_LINK;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.location.href = deepLink;
    }, 300);

    return () => window.clearTimeout(timer);
  }, [deepLink]);

  return (
    <div className="flex flex-col items-center gap-3">
      <a
        href={deepLink}
        className="rounded-lg bg-[#0b1f3a] px-5 py-3 text-sm font-semibold text-white"
      >
        Volver a la app
      </a>
      <p className="text-sm text-[#64748b]">
        Si no se abre automáticamente, toca el botón para regresar a Panalogix móvil.
      </p>
    </div>
  );
}
