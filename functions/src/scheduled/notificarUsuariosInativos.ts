import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { defineSecret } from "firebase-functions/params";
import * as postmark from "postmark";

const emailApiKey = defineSecret("POSTMARK_MEU_COFRIN_SERVER_TOKEN");

/**
 * Cloud Function agendada para rodar de 15 em 15 dias (dias 1 e 15 de cada mês às 09:00 BRT).
 * Busca usuários na coleção 'users' que possuem 'lastAccessAt' há mais de 15 dias
 * e envia um e-mail de reengajamento ("Sentimos sua falta").
 */
export const notificarUsuariosInativos = onSchedule({
  schedule: "0 9 1,15 * *",
  timeZone: "America/Sao_Paulo",
  secrets: [emailApiKey],
}, async (event: any) => {
  const db = admin.firestore();

  // Data limite: 15 dias atrás a partir de agora
  const limite15Dias = new Date();
  limite15Dias.setDate(limite15Dias.getDate() - 15);

  try {
    // Consulta documentos em 'users' onde lastAccessAt é anterior ou igual a 15 dias atrás
    const snapshot = await db.collection("users")
      .where("lastAccessAt", "<=", limite15Dias)
      .get();

    if (snapshot.empty) {
      logger.info("Nenhum usuário inativo há mais de 15 dias foi encontrado.");
      return;
    }

    const emails = [];

    for (const doc of snapshot.docs) {
      const userData = doc.data();
      const userId = doc.id;

      // Pular usuários que optaram por desativar notificações por e-mail
      if (userData.notificacoesEmail === false || userData.emailNotificationsEnabled === false) {
        continue;
      }

      try {
        const authUser = await admin.auth().getUser(userId);

        if (authUser.email) {
          const nomeCompleto = authUser.displayName || userData.nome || "Usuário";
          const primeiroNome = nomeCompleto.split(" ")[0];
          const unsubscribeUrl = `https://meu-cofrin.app.br/unsubscribe?email=${encodeURIComponent(authUser.email)}&userId=${userId}`;

          emails.push({
            From: "naoresponder@meu-cofrin.app.br",
            To: authUser.email,
            TemplateId: 46163306,
            TemplateModel: {
              primeiro_nome: primeiroNome,
              unsubscribe_url: unsubscribeUrl,
            },
            Headers: [
              {
                Name: "List-Unsubscribe",
                Value: `<https://meu-cofrin.app.br/unsubscribe?email=${encodeURIComponent(authUser.email)}&userId=${userId}>`
              },
              {
                Name: "List-Unsubscribe-Post",
                Value: "List-Unsubscribe=One-Click"
              }
            ],
            MessageStream: "outbound"
          });
        }
      } catch (authError) {
        logger.warn(`Erro ao buscar dados de autenticação para o usuário ${userId}:`, authError);
      }
    }

    if (emails.length > 0) {
      const client = new postmark.ServerClient(emailApiKey.value());
      await client.sendEmailBatchWithTemplates(emails);
      logger.info(`E-mails de reengajamento enviados com sucesso via Postmark para ${emails.length} usuário(s) inativo(s).`);
    } else {
      logger.info("Nenhum usuário com e-mail verificado para notificar.");
    }
  } catch (error) {
    logger.error("Erro ao processar notificação de usuários inativos:", error);
  }
});
