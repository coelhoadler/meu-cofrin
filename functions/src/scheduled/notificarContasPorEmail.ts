import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { defineSecret } from "firebase-functions/params";
import * as sgMail from "@sendgrid/mail";

const sendgridApiKey = defineSecret("SENDGRID_MEU_COFRIN");

export const notificarContasPorEmail = onSchedule({
  schedule: "0 6 * * *",
  timeZone: "America/Sao_Paulo",
  secrets: [sendgridApiKey],
}, async (event: any) => {
  const db = admin.firestore();

  // Datas
  const hoje = new Date();
  const daqui3Dias = new Date();
  daqui3Dias.setDate(daqui3Dias.getDate() + 3);

  // Função para formatar mesReferencia e dia
  const formatarData = (data: Date) => {
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
      .get();

    // Consulta 2: Contas vencendo em 3 dias
    const snapshot3Dias = await contasRef
      .where("mesReferencia", "==", daqui3DiasFormatado.mesReferencia)
      .where("diaVencimento", "==", daqui3DiasFormatado.diaVencimento)
      .where("statusPago", "==", false)
      .get();

    const emails = new Array();

    // Configura a API Key do SendGrid usando o Secret
    sgMail.setApiKey(sendgridApiKey.value());

    const processarDocumentos = async (docs: any[], titulo: string, fraseContexto: string) => {
      for (const doc of docs) {
        const conta = doc.data();
        const nomeConta = conta.nome || "Conta";
        const valor = conta.valor || 0;

        const userId = doc.ref.parent.parent?.id;
        if (!userId) continue;

        // Por enquanto, o email está fixado para testes conforme solicitado
        const emailUsuario = 'adlercoelhosantos12@gmail.com';

        emails.push({
          to: emailUsuario,
          from: 'meucofrinnoreply@gmail.com',
          subject: titulo,
          text: `Olá! Lembrete: Sua conta de ${nomeConta} no valor de R$ ${valor} ${fraseContexto}. Não se esqueça de pagar para evitar juros.`,
          html: `<p>Olá!</p><p>Lembrete: Sua conta de <strong>${nomeConta}</strong> no valor de <strong>R$ ${valor}</strong> ${fraseContexto}.</p><p>Não se esqueça de pagar para evitar juros.</p>`,
        });
      }
    };

    // Processar contas de hoje
    if (!snapshotHoje.empty) {
      await processarDocumentos(snapshotHoje.docs, "Conta vencendo HOJE! 🚨", "vence HOJE");
    }

    // Processar contas de 3 dias
    if (!snapshot3Dias.empty) {
      await processarDocumentos(snapshot3Dias.docs, "Conta vencendo em 3 dias! 📅", "vence em 3 dias");
    }

    // Disparar e-mails via SendGrid
    if (emails.length > 0) {
      try {
        await sgMail.send(emails);
        logger.info(`E-mails enviados com sucesso para ${emails.length} destinatários.`);
      } catch (error: any) {
        logger.error("Erro ao enviar e-mails via SendGrid:", error);
        if (error.response) {
          logger.error("Detalhes do erro do SendGrid:", error.response.body);
        }
      }
    } else {
      logger.info("Nenhuma conta encontrada para notificar por e-mail hoje ou daqui a 3 dias.");
    }

  } catch (erro) {
    logger.error("Erro ao verificar contas ou enviar e-mails:", erro);
  }
});
