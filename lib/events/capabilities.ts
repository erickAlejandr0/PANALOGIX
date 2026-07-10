import {
  empresaChannel,
  transportistaChannel,
  viajeChannel,
} from "@/lib/events/channels";

type CapabilityMap = Record<string, string[]>;

export function buildEmpresaCapabilities(
  empresaId: number,
  activeViajeIds: number[],
): CapabilityMap {
  const capabilities: CapabilityMap = {
    [empresaChannel(empresaId)]: ["subscribe"],
  };

  for (const viajeId of activeViajeIds) {
    capabilities[viajeChannel(viajeId)] = ["subscribe"];
  }

  return capabilities;
}

export function buildTransportistaCapabilities(transportistaId: number): CapabilityMap {
  return {
    [transportistaChannel(transportistaId)]: ["subscribe"],
  };
}

export function serializeCapabilities(capabilities: CapabilityMap) {
  return JSON.stringify(capabilities);
}
