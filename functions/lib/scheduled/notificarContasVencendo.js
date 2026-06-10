"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificarContasVencendo = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");
exports.notificarContasVencendo = (0, scheduler_1.onSchedule)({
    schedule: "0 11 * * *",
    timeZone: "America/Sao_Paulo",
}, async (event) => {
    var _a;
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
        for (const doc of snapshot.docs) {
            const conta = doc.data();
            const nomeConta = conta.nome || "Conta";
            const valor = conta.valor || 0;
            // A coleção de contas fica em users/{userId}/contas/{contaId}
            // O parent do documento da conta é a subcoleção "contas", o parent dessa subcoleção é o documento do usuário
            const userId = (_a = doc.ref.parent.parent) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId)
                continue;
            // Buscar tokens FCM salvos no documento do usuário
            const userSnap = await db.collection("users").doc(userId).get();
            if (!userSnap.exists)
                continue;
            const userData = userSnap.data();
            const fcmTokens = (userData === null || userData === void 0 ? void 0 : userData.fcmTokens) || []; // Assumindo que salvaremos os tokens em um array
            if (fcmTokens.length === 0)
                continue;
            // Criar uma notificação para cada token deste usuário
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
        if (mensagens.length > 0) {
            // O sendEach pode enviar até 500 mensagens por vez
            // Para simplificar, assumimos que não vai passar de 500 no nosso cenário inicial
            const responses = await admin.messaging().sendEach(mensagens);
            if (responses.failureCount > 0) {
                responses.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        logger.error(`Falha ao enviar para o token ${mensagens[idx].token}:`, resp.error);
                    }
                });
            }
            logger.info(`Notificações enviadas: ${responses.successCount} sucessos, ${responses.failureCount} falhas.`);
        }
        else {
            logger.info("Nenhum token encontrado para as contas a vencer.");
        }
    }
    catch (erro) {
        logger.error("Erro ao verificar contas ou enviar notificações:", erro);
    }
});
//# sourceMappingURL=notificarContasVencendo.js.map