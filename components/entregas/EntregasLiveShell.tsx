"use client";

import { useLayoutEffect, useMemo, useState } from "react";

import { EntregasView } from "@/components/entregas/EntregasView";
import { useEmpresaRealtime } from "@/components/realtime/EmpresaRealtimeProvider";
import { countEntregasByEstado } from "@/lib/entregas/negociacion-mappers";
import type { EntregasPageData } from "@/lib/entregas/types";

type EntregasLiveShellProps = {
  initialData: EntregasPageData;
};

export function EntregasLiveShell({ initialData }: EntregasLiveShellProps) {
  const { entregasItems, setInitialEntregas } = useEmpresaRealtime();
  const [hydrated, setHydrated] = useState(false);

  useLayoutEffect(() => {
    setInitialEntregas(initialData.items);
    setHydrated(true);
  }, [initialData.items, setInitialEntregas]);

  const items = hydrated ? entregasItems : initialData.items;
  const counts = useMemo(() => countEntregasByEstado(items), [items]);

  return (
    <EntregasView items={items} totalHoy={items.length} counts={counts} />
  );
}
