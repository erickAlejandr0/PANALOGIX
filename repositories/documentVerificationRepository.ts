import { db } from "@/db";
import {
  documentVerifications,
  transportistas,
  type DocumentVerification,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";

import type { DocumentVerificationStatus } from "@/lib/svd/types";

export type UpsertVerificationInput = {
  transportistaId: number;
  tipoDocumento: string;
  status: DocumentVerificationStatus;
  svdDocumentoId?: string | null;
  s3KeyRaw?: string | null;
  resultadoSvd?: string | null;
  scoreLectura?: string | null;
  scoreAutenticidad?: string | null;
  fechaVencimiento?: string | null;
  lastError?: string | null;
  submittedAt?: Date | null;
  completedAt?: Date | null;
};

export const documentVerificationRepository = {
  getByTransportistaId: async (
    transportistaId: number,
  ): Promise<DocumentVerification[]> => {
    return db.query.documentVerifications.findMany({
      where: eq(documentVerifications.transportistaId, transportistaId),
    });
  },

  getByTransportistaAndTipo: async (
    transportistaId: number,
    tipoDocumento: string,
  ): Promise<DocumentVerification | undefined> => {
    return db.query.documentVerifications.findFirst({
      where: and(
        eq(documentVerifications.transportistaId, transportistaId),
        eq(documentVerifications.tipoDocumento, tipoDocumento),
      ),
    });
  },

  getTransportistaBySvdExternalId: async (svdExternalId: string) => {
    return db.query.transportistas.findFirst({
      where: eq(transportistas.svdExternalId, svdExternalId),
    });
  },

  upsertByTipo: async (
    input: UpsertVerificationInput,
  ): Promise<DocumentVerification> => {
    const now = new Date();
    const existing = await documentVerificationRepository.getByTransportistaAndTipo(
      input.transportistaId,
      input.tipoDocumento,
    );

    if (existing) {
      const [row] = await db
        .update(documentVerifications)
        .set({
          status: input.status,
          svdDocumentoId:
            input.svdDocumentoId !== undefined
              ? input.svdDocumentoId
              : existing.svdDocumentoId,
          s3KeyRaw:
            input.s3KeyRaw !== undefined ? input.s3KeyRaw : existing.s3KeyRaw,
          resultadoSvd:
            input.resultadoSvd !== undefined
              ? input.resultadoSvd
              : existing.resultadoSvd,
          scoreLectura:
            input.scoreLectura !== undefined
              ? input.scoreLectura
              : existing.scoreLectura,
          scoreAutenticidad:
            input.scoreAutenticidad !== undefined
              ? input.scoreAutenticidad
              : existing.scoreAutenticidad,
          fechaVencimiento:
            input.fechaVencimiento !== undefined
              ? input.fechaVencimiento
              : existing.fechaVencimiento,
          lastError:
            input.lastError !== undefined ? input.lastError : existing.lastError,
          submittedAt:
            input.submittedAt !== undefined
              ? input.submittedAt
              : existing.submittedAt,
          completedAt:
            input.completedAt !== undefined
              ? input.completedAt
              : existing.completedAt,
          updatedAt: now,
        })
        .where(eq(documentVerifications.id, existing.id))
        .returning();
      return row;
    }

    const [row] = await db
      .insert(documentVerifications)
      .values({
        transportistaId: input.transportistaId,
        tipoDocumento: input.tipoDocumento,
        status: input.status,
        svdDocumentoId: input.svdDocumentoId ?? null,
        s3KeyRaw: input.s3KeyRaw ?? null,
        resultadoSvd: input.resultadoSvd ?? null,
        scoreLectura: input.scoreLectura ?? null,
        scoreAutenticidad: input.scoreAutenticidad ?? null,
        fechaVencimiento: input.fechaVencimiento ?? null,
        lastError: input.lastError ?? null,
        submittedAt: input.submittedAt ?? null,
        completedAt: input.completedAt ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return row;
  },
};
