import { onDocumentWritten } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { calcularResumoMensal } from "../utils/calcularResumoMensal";

export const onContaWritten = onDocumentWritten("users/{userId}/contas/{contaId}", async (event) => {
  const db = admin.firestore();
  const userId = event.params.userId;
  
  // Pegar os dados da conta (antes ou depois da modificação) para saber qual é o mesReferencia
  const contaData = event.data?.after.data() || event.data?.before.data();
  if (!contaData || !contaData.mesReferencia) {
    logger.warn(`Conta modificada em users/${userId} não possui mesReferencia.`);
    return;
  }

  const mesReferencia = contaData.mesReferencia;

  try {
    await calcularResumoMensal(db, userId, mesReferencia);
    logger.info(`Resumo atualizado para o usuário ${userId} no mês ${mesReferencia}`);
  } catch (error) {
    logger.error(`Erro ao atualizar resumo do usuário ${userId} para o mês ${mesReferencia}:`, error);
  }
});
