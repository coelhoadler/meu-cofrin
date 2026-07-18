"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificarContasPorEmail = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");
const params_1 = require("firebase-functions/params");
const sgMail = require("@sendgrid/mail");
const sendgridApiKey = (0, params_1.defineSecret)("SENDGRID_MEU_COFRIN");
exports.notificarContasPorEmail = (0, scheduler_1.onSchedule)({
    schedule: "0 6 * * *",
    timeZone: "America/Sao_Paulo",
    secrets: [sendgridApiKey],
}, async (event) => {
    const db = admin.firestore();
    // Datas
    const hoje = new Date();
    const daqui3Dias = new Date();
    daqui3Dias.setDate(daqui3Dias.getDate() + 3);
    // Função para formatar mesReferencia e dia
    const formatarData = (data) => {
        const ano = data.getFullYear();
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        return {
            mesReferencia: `${ano}-${mes}`,
            diaVencimento: data.getDate()
        };
    };
    const hojeFormatado = formatarData(hoje);
    const daqui3DiasFormatado = formatarData(daqui3Dias);
    try {
        const contasRef = db.collectionGroup("contas");
        // Consulta 1: Contas vencendo hoje
        const snapshotHoje = await contasRef
            .where("mesReferencia", "==", hojeFormatado.mesReferencia)
            .where("diaVencimento", "==", hojeFormatado.diaVencimento)
            .where("statusPago", "==", false)
            .where("tipo", "==", "Despesa")
            .get();
        // Consulta 2: Contas vencendo em até 3 dias
        const snapshot3Dias = await contasRef
            .where("mesReferencia", "==", daqui3DiasFormatado.mesReferencia)
            .where("diaVencimento", "<=", daqui3DiasFormatado.diaVencimento)
            .where("statusPago", "==", false)
            .where("tipo", "==", "Despesa")
            .get();
        const emails = new Array();
        // Configura a API Key do SendGrid usando o Secret
        sgMail.setApiKey(sendgridApiKey.value());
        // Cache para evitar requisições repetidas ao Firebase Auth para o mesmo usuário
        const authCache = new Map();
        const processarDocumentos = async (docs, vencimentoTexto) => {
            var _a, _b;
            for (const doc of docs) {
                const conta = doc.data();
                const nomeConta = conta.nome || "Conta";
                const valorNumerico = Number((_a = conta.valor) === null || _a === void 0 ? void 0 : _a.replace('R$', '').replace('.', '').replace(',', '.').trim()) || 0;
                const valorFormatado = new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                }).format(valorNumerico);
                const userId = (_b = doc.ref.parent.parent) === null || _b === void 0 ? void 0 : _b.id;
                if (!userId)
                    continue;
                let authData = authCache.get(userId);
                if (authData === undefined) {
                    try {
                        const authUser = await admin.auth().getUser(userId);
                        // Só guarda o e-mail se estiver verificado
                        if (authUser.emailVerified && authUser.email) {
                            const nomeCompleto = authUser.displayName || "Usuário";
                            const primeiroNome = nomeCompleto.split(" ")[0];
                            authData = { email: authUser.email, nome: primeiroNome };
                        }
                        else {
                            authData = null;
                        }
                    }
                    catch (error) {
                        logger.warn(`Erro ao buscar usuário ${userId} no Auth`, error);
                        authData = null;
                    }
                    authCache.set(userId, authData);
                }
                // Se o usuário não tiver e-mail verificado, ignora
                if (!authData)
                    continue;
                emails.push({
                    to: authData.email,
                    from: 'naoresponder@meu-cofrin.app.br',
                    templateId: 'd-acf3eb353a97428c8acb4b66fa6923de',
                    dynamicTemplateData: {
                        id_conta: doc.id,
                        nome_usuario: authData.nome,
                        nome_conta: nomeConta,
                        valor: valorFormatado,
                        vencimento_texto: (vencimentoTexto === "HOJE") ? vencimentoTexto : conta.diaVencimento + '/' + conta.mesReferencia.split('-')[1],
                        ano_atual: new Date().getFullYear().toString()
                    }
                });
            }
        };
        // Processar contas de hoje
        if (!snapshotHoje.empty) {
            await processarDocumentos(snapshotHoje.docs, "HOJE");
        }
        // Processar contas de 3 dias
        if (!snapshot3Dias.empty) {
            await processarDocumentos(snapshot3Dias.docs, "EM 3 DIAS");
        }
        // Disparar e-mails via SendGrid
        if (emails.length > 0) {
            try {
                await sgMail.send(emails);
                logger.info(`E-mails enviados com sucesso para ${emails.length} destinatários.`);
            }
            catch (error) {
                logger.error("Erro ao enviar e-mails via SendGrid:", error);
                if (error.response) {
                    logger.error("Detalhes do erro do SendGrid:", error.response.body);
                }
            }
        }
        else {
            logger.info("Nenhuma conta encontrada para notificar por e-mail hoje ou daqui a 3 dias.");
        }
    }
    catch (erro) {
        logger.error("Erro ao verificar contas ou enviar e-mails:", erro);
    }
});
//# sourceMappingURL=notificarContasPorEmail.js.map