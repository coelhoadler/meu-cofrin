"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificarUsuariosInativos = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");
const params_1 = require("firebase-functions/params");
const sgMail = require("@sendgrid/mail");
const emailApiKey = (0, params_1.defineSecret)("POSTMARK_MEU_COFRIN_SERVER_TOKEN");
/**
 * Cloud Function agendada para rodar de 15 em 15 dias (dias 1 e 15 de cada mês às 09:00 BRT).
 * Busca usuários na coleção 'users' que possuem 'lastAccessAt' há mais de 15 dias
 * e envia um e-mail de reengajamento ("Sentimos sua falta").
 */
exports.notificarUsuariosInativos = (0, scheduler_1.onSchedule)({
    schedule: "0 9 1,15 * *",
    timeZone: "America/Sao_Paulo",
    secrets: [emailApiKey],
}, async (event) => {
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
        sgMail.setApiKey(emailApiKey.value());
        const emails = [];
        for (const doc of snapshot.docs) {
            const userData = doc.data();
            const userId = doc.id;
            try {
                const authUser = await admin.auth().getUser(userId);
                // Envia o e-mail apenas se o usuário possuir e-mail válido e verificado
                // if (authUser.email && authUser.emailVerified) {
                if (authUser.email) {
                    const nomeCompleto = authUser.displayName || userData.nome || "Usuário";
                    const primeiroNome = nomeCompleto.split(" ")[0];
                    emails.push({
                        to: authUser.email,
                        from: "naoresponder@meu-cofrin.app.br",
                        subject: `${primeiroNome}, sentimos sua falta no Meu Cofrin!`,
                        html: `
              <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                <h2 style="color: #4F46E5;">Olá, ${primeiroNome}! 👋</h2>
                <p>Notamos que você não acessa o <strong>Meu Cofrin</strong> há mais de 15 dias.</p>
                <p>Manter o controle das suas finanças em dia é essencial para atingir suas metas. Que tal dar uma passadinha rápida hoje para atualizar suas movimentações?</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://meu-cofrin.app.br" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Acessar Meu Cofrin</a>
                </div>
                <p style="font-size: 12px; color: #777; text-align: center;">Se você já acessou recentemente, pode desconsiderar esta mensagem.</p>
              </div>
            `
                    });
                }
            }
            catch (authError) {
                logger.warn(`Erro ao buscar dados de autenticação para o usuário ${userId}:`, authError);
            }
        }
        if (emails.length > 0) {
            await sgMail.send(emails);
            logger.info(`E-mails de reengajamento enviados com sucesso para ${emails.length} usuário(s) inativo(s).`);
        }
        else {
            logger.info("Nenhum usuário com e-mail verificado para notificar.");
        }
    }
    catch (error) {
        logger.error("Erro ao processar notificação de usuários inativos:", error);
    }
});
//# sourceMappingURL=notificarUsuariosInativos.js.map