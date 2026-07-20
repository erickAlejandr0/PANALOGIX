import type {
  DocumentVerificationStatus,
  MandatoryDocumentTipo,
  VerificationOverall,
} from "@/lib/svd/types";
import { MANDATORY_DOCUMENT_TIPOS } from "@/lib/svd/types";

/**
 * Precedencia explícita (primer match gana), alineada a has_reject > has_manual del SVD:
 * needs_retry > incomplete > manual_review > processing > completed
 */
export function computeOverall(
  byTipo: Partial<
    Record<MandatoryDocumentTipo, DocumentVerificationStatus | null | undefined>
  >,
): VerificationOverall {
  const statuses = MANDATORY_DOCUMENT_TIPOS.map((t) => byTipo[t] ?? null);

  if (statuses.some((s) => s === "rechazado")) {
    return "needs_retry";
  }

  if (statuses.some((s) => s == null || s === "pending")) {
    return "incomplete";
  }

  if (statuses.some((s) => s === "revision_manual")) {
    return "manual_review";
  }

  if (statuses.some((s) => s === "submitted" || s === "processing")) {
    return "processing";
  }

  if (statuses.every((s) => s === "aprobado")) {
    return "completed";
  }

  return "processing";
}
