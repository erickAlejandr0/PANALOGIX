import { ConnectReturnActions } from "@/components/billing/ConnectReturnActions";

type ConnectReturnPageProps = {
  searchParams: Promise<{ stripe?: string }>;
};

export default async function ConnectReturnPage({
  searchParams,
}: ConnectReturnPageProps) {
  const params = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-6 px-6 py-12 text-center">
      <h1 className="text-2xl font-bold text-[#0b1f3a]">
        Configuración de cobros
      </h1>
      <p className="text-base text-[#64748b]">
        {params.stripe === "return"
          ? "Configuración completada. Te estamos llevando de vuelta a la app Panalogix."
          : "Puedes reintentar la configuración desde Perfil en la app móvil."}
      </p>
      <ConnectReturnActions stripe={params.stripe} />
    </main>
  );
}
