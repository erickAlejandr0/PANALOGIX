import Ably from "ably";

import type { DomainEventName } from "@/lib/events/types";

let restClient: Ably.Rest | null = null;

function getRestClient() {
  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey) {
    return null;
  }

  if (!restClient) {
    restClient = new Ably.Rest(apiKey);
  }

  return restClient;
}

export async function publishDomainEvent(
  channelName: string,
  eventName: DomainEventName,
  data: unknown,
) {
  const client = getRestClient();
  if (!client) {
    console.warn(
      `[events] ABLY_API_KEY no configurada; omitiendo ${eventName} en ${channelName}`,
    );
    return;
  }

  try {
    await client.channels.get(channelName).publish(eventName, data);
  } catch (error) {
    console.error(`[events] Error publicando ${eventName} en ${channelName}`, error);
  }
}

export async function createAblyTokenRequest(options: {
  clientId: string;
  capability: string;
  ttlMs?: number;
}) {
  const client = getRestClient();
  if (!client) {
    throw new Error("ABLY_API_KEY no configurada");
  }

  return client.auth.createTokenRequest({
    clientId: options.clientId,
    capability: options.capability,
    ttl: options.ttlMs ?? 60 * 60 * 1000,
  });
}
