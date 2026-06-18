"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onContaWritten = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");
const calcularResumoMensal_1 = require("../utils/calcularResumoMensal");
exports.onContaWritten = (0, firestore_1.onDocumentWritten)("users/{userId}/contas/{contaId}", async (event) => {
    var _a, _b;
    const db = admin.firestore();
    const userId = event.params.userId;
    // Pegar os dados da conta (antes ou depois da modificação) para saber qual é o mesReferencia
    const contaData = ((_a = event.data) === null || _a === void 0 ? void 0 : _a.after.data()) || ((_b = event.data) === null || _b === void 0 ? void 0 : _b.before.data());
    if (!contaData || !contaData.mesReferencia) {
        logger.warn(`Conta modificada em users/${userId} não possui mesReferencia.`);
        return;
    }
    const mesReferencia = contaData.mesReferencia;
    try {
        await (0, calcularResumoMensal_1.calcularResumoMensal)(db, userId, mesReferencia);
        logger.info(`Resumo atualizado para o usuário ${userId} no mês ${mesReferencia}`);
    }
    catch (error) {
        logger.error(`Erro ao atualizar resumo do usuário ${userId} para o mês ${mesReferencia}:`, error);
    }
});
//# sourceMappingURL=onContaWritten.js.map