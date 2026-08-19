"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postmarkWebhook = exports.resubscribeFn = exports.unsubscribeFn = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");
const params_1 = require("firebase-functions/params");
const postmark = require("postmark");
const emailApiKey = (0, params_1.defineSecret)("POSTMARK_MEU_COFRIN_SERVER_TOKEN");
/**
 * Função auxiliar para atualizar o status de notificação no Firestore para um e-mail.
 */
async function atualizarStatusNotificacaoPorEmail(email, userId, habilitado) {
    const db = admin.firestore();
    const normalizedEmail = email.toLowerCase().trim();
    let resolvedUserId = (userId === null || userId === void 0 ? void 0 : userId.trim()) || null;
    // 1. Se userId não foi fornecido, tenta buscar no Firebase Auth pelo e-mail
    if (!resolvedUserId) {
        try {
            const authUser = await admin.auth().getUserByEmail(normalizedEmail).catch(() => null);
            if (authUser === null || authUser === void 0 ? void 0 : authUser.uid) {
                resolvedUserId = authUser.uid;
            }
        }
        catch (e) {
            logger.warn(`Aviso ao buscar authUser para ${normalizedEmail}:`, e);
        }
    }
    // 2. Se ainda não encontrou, busca no Firestore na coleção 'users'
    if (!resolvedUserId) {
        try {
            const userByEmailSnap = await db.collection("users").where("email", "==", normalizedEmail).limit(1).get();
            if (!userByEmailSnap.empty) {
                resolvedUserId = userByEmailSnap.docs[0].id;
            }
            else {
                const userByPerfilSnap = await db.collection("users").where("perfil.email", "==", normalizedEmail).limit(1).get();
                if (!userByPerfilSnap.empty) {
                    resolvedUserId = userByPerfilSnap.docs[0].id;
                }
            }
        }
        catch (e) {
            logger.warn(`Aviso ao buscar documento de usuário no Firestore para ${normalizedEmail}:`, e);
        }
    }
    // 3. Se temos o userId (fornecido ou resolvido), atualiza as preferências no documento do usuário
    if (resolvedUserId) {
        try {
            await db.collection("users").doc(resolvedUserId).set({
                notificacoesEmail: habilitado,
                emailNotificationsEnabled: habilitado,
            }, { merge: true });
        }
        catch (e) {
            logger.warn(`Erro ao atualizar preferências do usuário ${resolvedUserId}:`, e);
        }
    }
    // 4. Atualizar coleção de controle geral 'unsubscribed_emails' com o userId resolvido
    const unsubDocRef = db.collection("unsubscribed_emails").doc(normalizedEmail);
    if (habilitado) {
        await unsubDocRef.delete().catch(() => { });
    }
    else {
        await unsubDocRef.set({
            email: normalizedEmail,
            userId: resolvedUserId,
            unsubscribedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
    }
}
/**
 * Cloud Function HTTP para processar cancelamento de inscrição (Unsubscribe).
 * Suporta RFC 8058 One-Click POST e requisições GET/POST do Frontend.
 */
exports.unsubscribeFn = (0, https_1.onRequest)({
    cors: true,
    secrets: [emailApiKey],
}, async (req, res) => {
    var _a, _b, _c, _d, _e, _f;
    const email = (_c = ((req.query.email || ((_a = req.body) === null || _a === void 0 ? void 0 : _a.email) || ((_b = req.body) === null || _b === void 0 ? void 0 : _b.userEmail)))) === null || _c === void 0 ? void 0 : _c.trim();
    const userId = (_e = ((req.query.userId || ((_d = req.body) === null || _d === void 0 ? void 0 : _d.userId)))) === null || _e === void 0 ? void 0 : _e.trim();
    if (!email) {
        res.status(400).json({ success: false, message: "O parâmetro 'email' é obrigatório." });
        return;
    }
    try {
        // 1. Criar supressão na API do Postmark
        try {
            const client = new postmark.ServerClient(emailApiKey.value());
            await client.createSuppressions("outbound", {
                Suppressions: [{ EmailAddress: email }]
            });
            logger.info(`Supressão criada no Postmark para o e-mail: ${email}`);
        }
        catch (postmarkErr) {
            logger.warn(`Aviso ao registrar supressão no Postmark para ${email}:`, (postmarkErr === null || postmarkErr === void 0 ? void 0 : postmarkErr.message) || postmarkErr);
        }
        // 2. Atualizar no Firestore
        await atualizarStatusNotificacaoPorEmail(email, userId, false);
        logger.info(`Usuário ${email} cancelou a inscrição com sucesso.`);
        // Se for uma requisição de navegador direta esperando HTML (link antigo), redireciona para a página Angular
        if (req.method === "GET" && ((_f = req.headers.accept) === null || _f === void 0 ? void 0 : _f.includes("text/html"))) {
            res.redirect(`https://meu-cofrin.app.br/unsubscribe?email=${encodeURIComponent(email)}&status=success`);
            return;
        }
        res.status(200).json({
            success: true,
            message: `O e-mail ${email} foi cancelado com sucesso das notificações.`,
        });
    }
    catch (error) {
        logger.error(`Erro ao processar unsubscribe para ${email}:`, error);
        res.status(500).json({
            success: false,
            message: "Ocorreu um erro ao processar o cancelamento. Tente novamente.",
            error: (error === null || error === void 0 ? void 0 : error.message) || error,
        });
    }
});
/**
 * Cloud Function HTTP para reativar o recebimento de notificações (Resubscribe).
 */
exports.resubscribeFn = (0, https_1.onRequest)({
    cors: true,
    secrets: [emailApiKey],
}, async (req, res) => {
    var _a, _b, _c, _d, _e;
    const email = (_c = ((req.query.email || ((_a = req.body) === null || _a === void 0 ? void 0 : _a.email) || ((_b = req.body) === null || _b === void 0 ? void 0 : _b.userEmail)))) === null || _c === void 0 ? void 0 : _c.trim();
    const userId = (_e = ((req.query.userId || ((_d = req.body) === null || _d === void 0 ? void 0 : _d.userId)))) === null || _e === void 0 ? void 0 : _e.trim();
    if (!email) {
        res.status(400).json({ success: false, message: "O parâmetro 'email' é obrigatório." });
        return;
    }
    try {
        // 1. Remover supressão na API do Postmark
        try {
            const client = new postmark.ServerClient(emailApiKey.value());
            await client.deleteSuppressions("outbound", {
                Suppressions: [{ EmailAddress: email }]
            });
            logger.info(`Supressão removida no Postmark para o e-mail: ${email}`);
        }
        catch (postmarkErr) {
            logger.warn(`Aviso ao remover supressão no Postmark para ${email}:`, (postmarkErr === null || postmarkErr === void 0 ? void 0 : postmarkErr.message) || postmarkErr);
        }
        // 2. Atualizar status no Firestore para ativo
        await atualizarStatusNotificacaoPorEmail(email, userId, true);
        logger.info(`Usuário ${email} reativou as notificações com sucesso.`);
        res.status(200).json({
            success: true,
            message: `Notificações por e-mail reativadas com sucesso para ${email}.`,
        });
    }
    catch (error) {
        logger.error(`Erro ao processar resubscribe para ${email}:`, error);
        res.status(500).json({
            success: false,
            message: "Ocorreu um erro ao reativar as notificações.",
            error: (error === null || error === void 0 ? void 0 : error.message) || error,
        });
    }
});
/**
 * Cloud Function HTTP para receber Webhooks do Postmark.
 * Trata eventos como SubscriptionChange, SpamComplaint e Bounces.
 */
exports.postmarkWebhook = (0, https_1.onRequest)({
    cors: true,
    secrets: [emailApiKey],
}, async (req, res) => {
    try {
        const body = req.body || {};
        const recordType = body.RecordType;
        const email = body.EmailAddress || body.Recipient || body.Email;
        const suppressSending = body.SuppressSending;
        logger.info(`Postmark Webhook recebido: Tipo=${recordType}, E-mail=${email}, Suppress=${suppressSending}`);
        if (email) {
            // Se for reclamação de spam ou mudança de inscrição com supressão ativada
            if (recordType === "SpamComplaint" || (recordType === "SubscriptionChange" && suppressSending)) {
                await atualizarStatusNotificacaoPorEmail(email, undefined, false);
                logger.info(`Status de notificação desativado via Webhook para ${email}`);
            }
            else if (recordType === "SubscriptionChange" && suppressSending === false) {
                await atualizarStatusNotificacaoPorEmail(email, undefined, true);
                logger.info(`Status de notificação reativado via Webhook para ${email}`);
            }
        }
        res.status(200).json({ received: true });
    }
    catch (error) {
        logger.error("Erro ao processar webhook do Postmark:", error);
        res.status(500).json({ received: false, error: (error === null || error === void 0 ? void 0 : error.message) || error });
    }
});
//# sourceMappingURL=unsubscribe.js.map