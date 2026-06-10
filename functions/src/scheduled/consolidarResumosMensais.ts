import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

export const consolidarResumosMensais = onSchedule({
  schedule: "0 5 * * *",
  timeZone: "America/Sao_Paulo",
}, async (event: any) => {
  const db = admin.firestore();

  // Formatar mês-ano atual no mesmo formato de mesReferencia. Ex: 2026-06
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const mesReferencia = `${ano}-${mes}`;

  try {
    const usersSnapshot = await db.collection("users").get();
    
    if (usersSnapshot.empty) {
      logger.info("Nenhum usuário encontrado para consolidação.");
      return;
    }

    let usersProcessados = 0;

    // Processar cada usuário
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      
      const contasSnapshot = await db.collection(`users/${userId}/contas`)
        .where("mesReferencia", "==", mesReferencia)
        .get();

      let totalDespesas = 0;
      let totalReceitas = 0;

      for (const contaDoc of contasSnapshot.docs) {
        const conta = contaDoc.data();
        
        if (conta.valor) {
          // Converter string "1.500,00" para number 1500.00
          // Adicionamos trimming e replace global para cobrir variações de espaçamento
          let cleanValue = String(conta.valor).trim().replace(/R\$\s?/g, '');
          cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
          const numValue = parseFloat(cleanValue);

          if (!isNaN(numValue)) {
            if (conta.tipo === 'Despesa') {
              totalDespesas += numValue;
            } else if (conta.tipo === 'Receita') {
              totalReceitas += numValue;
            }
          }
        }
      }

      const saldo = totalReceitas - totalDespesas;

      // Salvar os totais na subcoleção resumosMensais
      const resumoRef = db.doc(`users/${userId}/resumosMensais/${mesReferencia}`);
      await resumoRef.set({
        totalDespesas,
        totalReceitas,
        saldo,
        atualizadoEm: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      usersProcessados++;
    }

    logger.info(`Consolidação concluída para o mês ${mesReferencia}. Usuários processados: ${usersProcessados}`);
  } catch (erro) {
    logger.error("Erro ao consolidar resumos mensais:", erro);
  }
});
