"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testNotificarUsuariosInativos = void 0;
const https_1 = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const params_1 = require("firebase-functions/params");
const postmark = require("postmark");
const emailApiKey = (0, params_1.defineSecret)("POSTMARK_MEU_COFRIN_SERVER_TOKEN");
/**
 * Cloud Function HTTP de Teste.
 * Permite disparar manualmente o e-mail de reengajamento para teste.
 * Exemplo de uso: GET /testNotificarUsuariosInativos?email=adlercoelhosantos12@gmail.com
 */
exports.testNotificarUsuariosInativos = (0, https_1.onRequest)({
    secrets: [emailApiKey],
}, async (req, res) => {
    const targetEmail = req.query.email || "adlercoelhosantos12@gmail.com";
    try {
        const client = new postmark.ServerClient(emailApiKey.value());
        const primeiroNome = "Adler";
        const result = await client.sendEmail({
            From: "naoresponder@meu-cofrin.app.br",
            To: targetEmail,
            Subject: `${primeiroNome}, sentimos sua falta no Meu Cofrin! [TESTE]`,
            HtmlBody: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #4F46E5;">Olá, ${primeiroNome}! 👋</h2>
          <p>Notamos que você não acessa o <strong>Meu Cofrin</strong> há mais de 15 dias.</p>
          <p>Manter o controle das suas finanças em dia é essencial para atingir suas metas. Que tal dar uma passadinha rápida hoje para atualizar suas movimentações?</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://meu-cofrin.app.br" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Acessar Meu Cofrin</a>
          </div>
          <p style="font-size: 12px; color: #777; text-align: center;">Este é um disparo de teste gerado para validação do modelo de e-mail.</p>
        </div>
      `,
            MessageStream: "outbound"
        });
        logger.info(`E-mail de teste enviado com sucesso via Postmark para ${targetEmail}. MessageID: ${result.MessageID}`);
        res.status(200).json({ success: true, message: `E-mail de teste enviado com sucesso para ${targetEmail}`, messageId: result.MessageID });
    }
    catch (error) {
        logger.error("Erro ao enviar e-mail de teste:", error);
        res.status(500).json({ success: false, error: error.message || error });
    }
});
//# sourceMappingURL=testNotificarUsuariosInativos.js.map