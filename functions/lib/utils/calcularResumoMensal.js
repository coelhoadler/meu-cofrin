"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcularResumoMensal = void 0;
const admin = require("firebase-admin");
async function calcularResumoMensal(db, userId, mesReferencia) {
    const contasSnapshot = await db.collection(`users/${userId}/contas`)
        .where("mesReferencia", "==", mesReferencia)
        .get();
    let totalDespesas = 0;
    let totalReceitas = 0;
    for (const contaDoc of contasSnapshot.docs) {
        const conta = contaDoc.data();
        if (conta.valor) {
            // Converter string "1.500,00" para number 1500.00
            // Adicionamos trimming e replace global para cobrir variações de espaçamento
            let cleanValue = String(conta.valor).trim().replace(/R\$\s?/g, '');
            cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
            const numValue = parseFloat(cleanValue);
            if (!isNaN(numValue)) {
                if (conta.tipo === 'Despesa') {
                    totalDespesas += numValue;
                }
                else if (conta.tipo === 'Receita') {
                    totalReceitas += numValue;
                }
            }
        }
    }
    const saldo = totalReceitas - totalDespesas;
    // Salvar os totais na subcoleção resumosMensais
    const resumoRef = db.doc(`users/${userId}/resumosMensais/${mesReferencia}`);
    await resumoRef.set({
        totalDespesas,
        totalReceitas,
        saldo,
        atualizadoEm: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
}
exports.calcularResumoMensal = calcularResumoMensal;
//# sourceMappingURL=calcularResumoMensal.js.map