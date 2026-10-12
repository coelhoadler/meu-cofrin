import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { getMesesReferenciaPadrao, replicarContasRecorrentesUsuario } from "./utils/replicarContasRecorrentes";

/**
 * Cloud Function HTTP de Teste.
 * Permite disparar manualmente a replicação de contas recorrentes para um usuário específico.
 * 
 * Exemplo de uso:
 * - Simulação (dryRun default): GET /testReplicarContasRecorrentes
 * - Execução real: GET /testReplicarContasRecorrentes?dryRun=false
 * - Outro usuário/mês: GET /testReplicarContasRecorrentes?userId=XYZ&mesOrigem=2026-10&mesDestino=2026-11&dryRun=false
 */
export const testReplicarContasRecorrentes = onRequest(async (req, res) => {
  const db = admin.firestore();

  const targetUserId = (req.query.userId as string) || "CIcXBzimArUmXX0zsawodtzDszs2";
  const { mesOrigem: defaultMesOrigem, mesDestino: defaultMesDestino } = getMesesReferenciaPadrao();

  const mesOrigem = (req.query.mesOrigem as string) || defaultMesOrigem;
  const mesDestino = (req.query.mesDestino as string) || defaultMesDestino;

  // Por segurança, se não passar dryRun ou passar "true", roda como simulação. Só roda de verdade se for explicitamente "false".
  const dryRunParam = req.query.dryRun as string | undefined;
  const dryRun = dryRunParam !== "false";

  try {
    logger.info(`Iniciando teste de replicação de contas recorrentes: userId=${targetUserId}, origem=${mesOrigem}, destino=${mesDestino}, dryRun=${dryRun}`);

    const resultado = await replicarContasRecorrentesUsuario(
      db,
      targetUserId,
      mesOrigem,
      mesDestino,
      dryRun
    );

    res.status(200).json({
      success: true,
      mensagem: dryRun
        ? "Simulação concluída com sucesso (nenhum dado foi salvo no Firestore). Use ?dryRun=false para persistir."
        : "Replicação concluída e dados gravados com sucesso no Firestore.",
      ...resultado,
    });
  } catch (error: any) {
    logger.error("Erro ao testar replicação de contas recorrentes:", error);
    res.status(500).json({
      success: false,
      error: error.message || error,
    });
  }
});
