"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consolidarResumosMensais = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");
const calcularResumoMensal_1 = require("../utils/calcularResumoMensal");
exports.consolidarResumosMensais = (0, scheduler_1.onSchedule)({
    schedule: "0 5 * * *",
    timeZone: "America/Sao_Paulo",
}, async (event) => {
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
            await (0, calcularResumoMensal_1.calcularResumoMensal)(db, userId, mesReferencia);
            usersProcessados++;
        }
        logger.info(`Consolidação concluída para o mês ${mesReferencia}. Usuários processados: ${usersProcessados}`);
    }
    catch (erro) {
        logger.error("Erro ao consolidar resumos mensais:", erro);
    }
});
//# sourceMappingURL=consolidarResumosMensais.js.map