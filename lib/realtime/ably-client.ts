import Ably from "ably";

import { createAblyAuthCallback } from "@/lib/realtime/ably-auth";

let realtimeClient: Ably.Realtime | null = null;

// Singleton compartido para el cliente Ably de la empresa. Un unico cliente por
// pestana evita el connect->close churn que se producia al crear/cerrar el
// cliente en cada montaje del provider (Strict Mode / Fast Refresh generaban
// "unhandledRejection: Connection closed" al cerrar una conexion aun abriendose).
export function getEmpresaRealtimeClient(): Ably.Realtime {
  if (realtimeClient) {
    return realtimeClient;
  }

  realtimeClient = new Ably.Realtime({
    authCallback: createAblyAuthCallback(),
  });

  return realtimeClient;
}

export function closeEmpresaRealtimeClient() {
  realtimeClient?.close();
  realtimeClient = null;
}
