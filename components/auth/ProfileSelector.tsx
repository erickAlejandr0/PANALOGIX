"use client";

import { Building2, ShieldCheck, Truck } from "lucide-react";

export type ProfileType = "transportista" | "empresa" | "administrador";

type ProfileSelectorProps = {
  selectedProfile: ProfileType;
  onSelect: (profile: ProfileType) => void;
};

const profiles = [
  {
    id: "transportista" as const,
    title: "Transportista",
    subtitle: "Busca cargas y gestiona rutas",
    icon: Truck,
  },
  {
    id: "empresa" as const,
    title: "Empresa",
    subtitle: "Publica cargas y monitorea envios",
    icon: Building2,
  },
  {
    id: "administrador" as const,
    title: "Administrador",
    subtitle: "Gestion interna y reportes",
    icon: ShieldCheck,
  },
];

export function ProfileSelector({
  selectedProfile,
  onSelect,
}: ProfileSelectorProps) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
        Selecciona tu perfil
      </p>
      <div className="flex flex-col gap-3">
        {profiles.map((profile) => {
          const Icon = profile.icon;
          const selected = selectedProfile === profile.id;

          return (
            <div
              key={profile.id}
              onClick={() => onSelect(profile.id)}
              className={`flex cursor-pointer items-center gap-4 rounded-xl border px-4 py-4 transition-all ${
                selected
                  ? "border-blue-400 bg-[#1a3a5c] ring-1 ring-blue-400"
                  : "border-slate-700 bg-[#112240]"
              }`}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  onSelect(profile.id);
                }
              }}
              aria-pressed={selected}
            >
              <div className="rounded-lg bg-[#0d1b2e] p-2">
                <Icon className="text-slate-200" size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{profile.title}</p>
                <p className="text-xs text-slate-400">{profile.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
