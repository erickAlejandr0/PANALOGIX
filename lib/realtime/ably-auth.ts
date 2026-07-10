import type Ably from "ably";

type RealtimeTokenResponse = {
  tokenRequest?: Ably.TokenRequest;
  error?: string;
};

export function createAblyAuthCallback(): Ably.AuthOptions["authCallback"] {
  return (_tokenParams, callback) => {
    void (async () => {
      try {
        const response = await fetch("/api/realtime/token", {
          credentials: "include",
        });

        const body = (await response.json().catch(() => null)) as
          | RealtimeTokenResponse
          | null;

        if (!response.ok) {
          callback(
            body?.error ?? `Error al obtener token realtime (${response.status})`,
            null,
          );
          return;
        }

        if (!body?.tokenRequest) {
          callback("Respuesta de token realtime inválida", null);
          return;
        }

        callback(null, body.tokenRequest);
      } catch (error) {
        callback(
          error instanceof Error ? error.message : "Error al obtener token realtime",
          null,
        );
      }
    })();
  };
}
