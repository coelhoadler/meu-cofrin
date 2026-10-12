"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replicarContasRecorrentesUsuario = exports.getMesesReferenciaPadrao = void 0;
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");
const calcularResumoMensal_1 = require("./calcularResumoMensal");
/**
 * Calcula os meses de referência padrão e verifica se a data informada
 * (no fuso horário de São Paulo) corresponde ao penúltimo dia do mês.
 */
function getMesesReferenciaPadrao(dataBase = new Date()) {
    const dataSP = new Date(dataBase.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const ano = dataSP.getFullYear();
    const mes = dataSP.getMonth(); // 0 a 11
    const diaAtual = dataSP.getDate();
    const mesOrigem = `${ano}-${String(mes + 1).padStart(2, "0")}`;
    const proximoMesDate = new Date(ano, mes + 1, 1);
    const anoDestino = proximoMesDate.getFullYear();
    const mesDestino = `${anoDestino}-${String(proximoMesDate.getMonth() + 1).padStart(2, "0")}`;
    const ultimoDiaMesAtual = new Date(ano, mes + 1, 0).getDate();
    const penultimoDia = ultimoDiaMesAtual - 1;
    const isPenultimoDia = diaAtual === penultimoDia;
    return {
        mesOrigem,
        mesDestino,
        isPenultimoDia,
        penultimoDia,
        diaAtual,
    };
}
exports.getMesesReferenciaPadrao = getMesesReferenciaPadrao;
/**
 * Replica as contas recorrentes de um determinado usuário do mês de origem para o mês de destino.
 */
async function replicarContasRecorrentesUsuario(db, userId, mesOrigem, mesDestino, dryRun = false) {
    const contasRef = db.collection(`users/${userId}/contas`);
    // 1. Buscar contas do mês de origem
    const snapshotOrigem = await contasRef
        .where("mesReferencia", "==", mesOrigem)
        .get();
    // Filtrar apenas recorrentes (isRecorrente === true) e que não pertençam a parcelamento
    const contasRecorrentesOrigem = snapshotOrigem.docs
        .map(doc => (Object.assign({ id: doc.id }, doc.data())))
        .filter(c => c.isRecorrente === true && !c.parcelamentoId);
    // 2. Buscar contas já existentes no mês de destino para evitar duplicidades
    const snapshotDestino = await contasRef
        .where("mesReferencia", "==", mesDestino)
        .get();
    const contasDestino = snapshotDestino.docs.map(doc => doc.data());
    // 3. Obter último dia do mês de destino para ajuste de vencimento
    const [anoDestStr, mesDestStr] = mesDestino.split("-");
    const anoDestino = parseInt(anoDestStr, 10);
    const mesDestinoNum = parseInt(mesDestStr, 10);
    const ultimoDiaDestino = new Date(anoDestino, mesDestinoNum, 0).getDate();
    const contasParaCriar = [];
    const relatorioContas = [];
    let totalDuplicadasIgnoradas = 0;
    // Manter controle em memória para não duplicar se houver itens repetidos no mês de origem
    const chavesDestinoExistentes = new Set();
    for (const cd of contasDestino) {
        if (cd.nome && cd.diaVencimento !== undefined) {
            chavesDestinoExistentes.add(`${String(cd.nome).trim().toLowerCase()}_${cd.diaVencimento}`);
        }
    }
    for (const conta of contasRecorrentesOrigem) {
        const diaOriginal = Number(conta.diaVencimento) || 1;
        const diaAjustado = Math.min(diaOriginal, ultimoDiaDestino);
        const chaveComparacao = `${String(conta.nome || "").trim().toLowerCase()}_${diaAjustado}`;
        if (chavesDestinoExistentes.has(chaveComparacao)) {
            totalDuplicadasIgnoradas++;
            relatorioContas.push({
                nome: conta.nome || "Sem nome",
                tipo: conta.tipo || "Despesa",
                valor: conta.valor || null,
                diaVencimentoOriginal: diaOriginal,
                diaVencimentoAjustado: diaAjustado,
                status: "IGNORADA_DUPLICADA",
                motivo: `Já existe conta com nome '${conta.nome}' e vencimento dia ${diaAjustado} em ${mesDestino}`,
            });
            continue;
        }
        // Registra no conjunto para não permitir duplicatas no mesmo lote
        chavesDestinoExistentes.add(chaveComparacao);
        const novaConta = Object.assign(Object.assign({}, conta), { mesReferencia: mesDestino, diaVencimento: diaAjustado, statusPago: false, dataPagamento: null, reciboUrl: "", valorAntigo: conta.valor || null, isRecorrente: true, createdAt: admin.firestore.FieldValue.serverTimestamp() });
        // Remover identificadores de instância anterior
        delete novaConta.id;
        delete novaConta.parcelamentoId;
        delete novaConta.numeroParcela;
        delete novaConta.totalParcelas;
        contasParaCriar.push(novaConta);
        relatorioContas.push({
            nome: conta.nome || "Sem nome",
            tipo: conta.tipo || "Despesa",
            valor: conta.valor || null,
            diaVencimentoOriginal: diaOriginal,
            diaVencimentoAjustado: diaAjustado,
            status: dryRun ? "SIMULADA" : "CRIADA",
        });
    }
    // 4. Persistir no Firestore se não for dryRun
    if (!dryRun && contasParaCriar.length > 0) {
        const chunkSize = 400;
        for (let i = 0; i < contasParaCriar.length; i += chunkSize) {
            const chunk = contasParaCriar.slice(i, i + chunkSize);
            const batch = db.batch();
            for (const item of chunk) {
                const newDocRef = contasRef.doc();
                batch.set(newDocRef, item);
            }
            await batch.commit();
        }
        // Recalcular resumo mensal do mês de destino
        try {
            await (0, calcularResumoMensal_1.calcularResumoMensal)(db, userId, mesDestino);
        }
        catch (resumoError) {
            logger.error(`Erro ao atualizar resumo mensal de ${userId} para ${mesDestino}:`, resumoError);
        }
    }
    return {
        userId,
        mesOrigem,
        mesDestino,
        dryRun,
        totalRecorrentesEncontradas: contasRecorrentesOrigem.length,
        totalDuplicadasIgnoradas,
        totalProcessadas: contasParaCriar.length,
        contas: relatorioContas,
    };
}
exports.replicarContasRecorrentesUsuario = replicarContasRecorrentesUsuario;
//# sourceMappingURL=replicarContasRecorrentes.js.map