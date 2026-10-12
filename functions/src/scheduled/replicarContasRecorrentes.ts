import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { getMesesReferenciaPadrao, replicarContasRecorrentesUsuario } from "../utils/replicarContasRecorrentes";

/**
 * Cloud Function agendada para executar diariamente entre os dias 27 e 31 às 06:00 (Horário de Brasília).
 * Executa a replicação de contas recorrentes para todos os usuários exclusivamente no penúltimo dia do mês.
 */
export const replicarContasRecorrentes = onSchedule({
  schedule: "0 6 27-31 * *",
  timeZone: "America/Sao_Paulo",
}, async (event: any) => {
  const { mesOrigem, mesDestino, isPenultimoDia, penultimoDia, diaAtual } = getMesesReferenciaPadrao();

  // Executar estritamente no penúltimo dia do mês
  if (!isPenultimoDia) {
    logger.info(`[replicarContasRecorrentes] Hoje (dia ${diaAtual}) não é o penúltimo dia do mês (esperado dia ${penultimoDia}). Nenhuma ação realizada.`);
    return;
  }

  const db = admin.firestore();
  logger.info(`[replicarContasRecorrentes] Iniciando replicação de contas recorrentes do mês ${mesOrigem} para ${mesDestino} (penúltimo dia do mês: ${penultimoDia}).`);

  try {
    const usersSnapshot = await db.collection("users").get();

    if (usersSnapshot.empty) {
      logger.info("[replicarContasRecorrentes] Nenhum usuário encontrado no sistema.");
      return;
    }

    let usersProcessados = 0;
    let totalContasCriadas = 0;
    let totalContasIgnoradas = 0;
    let usersComErro = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;

      try {
        const resultado = await replicarContasRecorrentesUsuario(
          db,
          userId,
          mesOrigem,
          mesDestino,
          false // dryRun = false para gravar no Firestore
        );

        usersProcessados++;
        totalContasCriadas += resultado.totalProcessadas;
        totalContasIgnoradas += resultado.totalDuplicadasIgnoradas;
      } catch (userError) {
        usersComErro++;
        logger.error(`[replicarContasRecorrentes] Erro ao replicar contas para o usuário ${userId}:`, userError);
      }
    }

    logger.info(
      `[replicarContasRecorrentes] Finalizado com sucesso. Usuários processados: ${usersProcessados}, ` +
      `Contas criadas: ${totalContasCriadas}, Contas ignoradas (duplicadas): ${totalContasIgnoradas}, Usuários com erro: ${usersComErro}`
    );
  } catch (error) {
    logger.error("[replicarContasRecorrentes] Erro fatal durante a execução agendada:", error);
  }
});
