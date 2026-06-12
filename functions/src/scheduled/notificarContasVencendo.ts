import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { defineSecret } from "firebase-functions/params";
import * as sgMail from "@sendgrid/mail";

const sendgridApiKey = defineSecret("SENDGRID_MEU_COFRIN");

export const notificarContasVencendo = onSchedule({
  schedule: "0 11 * * *",
  timeZone: "America/Sao_Paulo",
  secrets: [sendgridApiKey],
}, async (event: any) => {
  const db = admin.firestore();

  // Como queremos avisar com 1 dia de antecedência, vamos olhar para o dia de amanhã.
  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);

  // Formatar mesReferencia no formato YYYY-MM
  const ano = amanha.getFullYear();
  const mes = String(amanha.getMonth() + 1).padStart(2, '0');
  const mesReferencia = `${ano}-${mes}`;

  const diaVencimento = amanha.getDate();

  try {
    // Buscar todas as contas pendentes que vencem amanhã
    const contasRef = db.collectionGroup("contas");
    const snapshot = await contasRef
      .where("mesReferencia", "==", mesReferencia)
      .where("diaVencimento", "==", diaVencimento)
      .where("statusPago", "==", false)
      .get();

    if (snapshot.empty) {
      logger.info(`Nenhuma conta vencendo amanhã (${diaVencimento}/${mes}).`);
      return;
    }

    const mensagens = new Array();
    const emails = new Array();

    // Configura a API Key do SendGrid usando o Secret
    sgMail.setApiKey(sendgridApiKey.value());

    for (const doc of snapshot.docs) {
      const conta = doc.data();
      const nomeConta = conta.nome || "Conta";
      const valor = conta.valor || 0;

      // A coleção de contas fica em users/{userId}/contas/{contaId}
      // O parent do documento da conta é a subcoleção "contas", o parent dessa subcoleção é o documento do usuário
      const userId = doc.ref.parent.parent?.id;
      if (!userId) continue;

      // Buscar tokens FCM salvos no documento do usuário
      const userSnap = await db.collection("users").doc(userId).get();
      if (!userSnap.exists) continue;

      const userData = userSnap.data();
      const fcmTokens = userData?.fcmTokens || []; // Assumindo que salvaremos os tokens em um array
      const emailUsuario = userData?.email;

      if (fcmTokens.length === 0 && !emailUsuario) continue;

      // Criar uma notificação para cada token deste usuário
      if (fcmTokens.length > 0) {
        for (const token of fcmTokens) {
          mensagens.push({
            notification: {
              title: "Conta vencendo amanhã! 🚨",
              body: `Lembrete: Sua conta de ${nomeConta} no valor de R$ ${valor} vence amanhã.`,
            },
            token: token,
          });
        }
      }

      // Adicionar notificação por E-mail (se houver e-mail)
      if (emailUsuario) {
        emails.push({
          to: 'adlercoelhosantos12@gmail.com',
          from: 'meucofrinnoreply@gmail.com',
          subject: "Conta vencendo amanhã! 🚨",
          text: `Olá! Lembrete: Sua conta de ${nomeConta} no valor de R$ ${valor} vence amanhã. Não se esqueça de pagar para evitar juros.`,
          html: `<p>Olá!</p><p>Lembrete: Sua conta de <strong>${nomeConta}</strong> no valor de <strong>R$ ${valor}</strong> vence amanhã.</p><p>Não se esqueça de pagar para evitar juros.</p>`,
        });
      }
    }

    // Disparar e-mails via SendGrid
    if (emails.length > 0) {
      try {
        await sgMail.send(emails);
        logger.info(`E-mails enviados com sucesso para ${emails.length} destinatários.`);
      } catch (error: any) {
        logger.error("Erro ao enviar e-mails via SendGrid:", error);
        if (error.response) {
          logger.error("Detalhes do erro do SendGrid:", error.response.body);
        }
      }
    }

    if (mensagens.length > 0) {
      // O sendEach pode enviar até 500 mensagens por vez
      // Para simplificar, assumimos que não vai passar de 500 no nosso cenário inicial
      const responses = await admin.messaging().sendEach(mensagens);

      if (responses.failureCount > 0) {
        responses.responses.forEach((resp: any, idx: any) => {
          if (!resp.success) {
            logger.error(`Falha ao enviar para o token ${mensagens[idx].token}:`, resp.error);
          }
        });
      }

      logger.info(`Notificações enviadas: ${responses.successCount} sucessos, ${responses.failureCount} falhas.`);
    } else {
      logger.info("Nenhum token encontrado para as contas a vencer.");
    }

  } catch (erro) {
    logger.error("Erro ao verificar contas ou enviar notificações:", erro);
  }
});
