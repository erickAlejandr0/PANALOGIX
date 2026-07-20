import { Info } from "lucide-react";

export function DocumentAlert() {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-[#fde68a] bg-[#fffbeb] p-4 shadow-sm">
      <Info className="mt-0.5 shrink-0 text-amber-600" size={20} />
      <p className="text-base leading-[26px] text-[#78350f]">
        <span className="font-bold">Aviso:</span> Tras el registro deberás
        verificar cédula, licencia, SOAT y revisado técnico. La verificación
        automática suele resolverse en segundos; algunos casos pasan a revisión
        manual.
      </p>
    </div>
  );
}
