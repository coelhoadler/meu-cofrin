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
        const result = await client.sendEmailWithTemplate({
            From: "naoresponder@meu-cofrin.app.br",
            To: targetEmail,
            TemplateId: 46163306,
            TemplateModel: {
                primeiro_nome: primeiroNome,
                unsubscribe_url: "https://meu-cofrin.app.br/unsubscribe?email=" + encodeURIComponent(targetEmail) + "&userId=test",
            },
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