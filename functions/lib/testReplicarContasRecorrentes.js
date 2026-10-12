"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testReplicarContasRecorrentes = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");
const replicarContasRecorrentes_1 = require("./utils/replicarContasRecorrentes");
/**
 * Cloud Function HTTP de Teste.
 * Permite disparar manualmente a replicação de contas recorrentes para um usuário específico.
 *
 * Exemplo de uso:
 * - Simulação (dryRun default): GET /testReplicarContasRecorrentes
 * - Execução real: GET /testReplicarContasRecorrentes?dryRun=false
 * - Outro usuário/mês: GET /testReplicarContasRecorrentes?userId=XYZ&mesOrigem=2026-10&mesDestino=2026-11&dryRun=false
 */
exports.testReplicarContasRecorrentes = (0, https_1.onRequest)(async (req, res) => {
    const db = admin.firestore();
    const targetUserId = req.query.userId || "CIcXBzimArUmXX0zsawodtzDszs2";
    const { mesOrigem: defaultMesOrigem, mesDestino: defaultMesDestino } = (0, replicarContasRecorrentes_1.getMesesReferenciaPadrao)();
    const mesOrigem = req.query.mesOrigem || defaultMesOrigem;
    const mesDestino = req.query.mesDestino || defaultMesDestino;
    // Por segurança, se não passar dryRun ou passar "true", roda como simulação. Só roda de verdade se for explicitamente "false".
    const dryRunParam = req.query.dryRun;
    const dryRun = dryRunParam !== "false";
    try {
        logger.info(`Iniciando teste de replicação de contas recorrentes: userId=${targetUserId}, origem=${mesOrigem}, destino=${mesDestino}, dryRun=${dryRun}`);
        const resultado = await (0, replicarContasRecorrentes_1.replicarContasRecorrentesUsuario)(db, targetUserId, mesOrigem, mesDestino, dryRun);
        res.status(200).json(Object.assign({ success: true, mensagem: dryRun
                ? "Simulação concluída com sucesso (nenhum dado foi salvo no Firestore). Use ?dryRun=false para persistir."
                : "Replicação concluída e dados gravados com sucesso no Firestore." }, resultado));
    }
    catch (error) {
        logger.error("Erro ao testar replicação de contas recorrentes:", error);
        res.status(500).json({
            success: false,
            error: error.message || error,
        });
    }
});
//# sourceMappingURL=testReplicarContasRecorrentes.js.map