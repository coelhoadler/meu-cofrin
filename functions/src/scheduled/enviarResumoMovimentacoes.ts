import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { defineSecret } from "firebase-functions/params";
import * as postmark from "postmark";

const emailApiKey = defineSecret("POSTMARK_MEU_COFRIN_SERVER_TOKEN");

/**
 * Cloud Function agendada para rodar dias 15 e no último dia do mês às 10:00 BRT.
 * Busca os usuários que possuem contas (movimentações) no mês corrente e envia um e-mail de resumo.
 */
export const enviarResumoMovimentacoes = onSchedule({
  schedule: "0 10 15,28-31 * *",
  timeZone: "America/Sao_Paulo",
  secrets: [emailApiKey],
}, async (event: any) => {
  const db = admin.firestore();

  const dataAtual = new Date();
  const dia = dataAtual.getDate();
  const ano = dataAtual.getFullYear();
  const mes = dataAtual.getMonth() + 1; // 1-12

  // Lógica simples para garantir que o envio do fim do mês ocorra apenas no último dia
  const ultimoDiaDoMes = new Date(ano, mes, 0).getDate();
  if (dia !== 15 && dia !== ultimoDiaDoMes) {
    logger.info("Não é dia 15 nem o último dia do mês. Pulando execução.");
    return;
  }

  // Define o mêsReferencia no padrão YYYY-MM (ex: "2026-08") para bater com o banco
  const mesFormatado = String(mes).padStart(2, '0');
  const mesReferencia = `${ano}-${mesFormatado}`;
  const nomeMes = dataAtual.toLocaleString('pt-BR', { month: 'long' });
  const mesAnoFormatado = `${nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)} de ${ano}`;

  const tituloEmail = dia === 15
    ? "Como estão as coisas até agora 🧐"
    : "Seu resumo do mês chegou! 📊";

  const textoIntrodutorio = dia === 15
    ? "A metade do mês já passou!"
    : "O mês está acabando!";

  try {
    const usersSnapshot = await db.collection("users").get();

    if (usersSnapshot.empty) {
      logger.info("Nenhum usuário encontrado.");
      return;
    }

    const emails = [];

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;

      // Pular usuários que desativaram notificações
      if (userData.notificacoesEmail === false || userData.emailNotificationsEnabled === false) {
        continue;
      }

      // Busca as contas do usuário para o mês corrente
      const contasSnapshot = await db.collection(`users/${userId}/contas`)
        .where("mesReferencia", "==", mesReferencia)
        .get();

      // Se não tiver contas cadastradas nesse mês, não envia o email
      if (contasSnapshot.empty) {
        continue;
      }

      let totalDespesas = 0;
      let totalReceitas = 0;
      const transacoes: any[] = [];

      contasSnapshot.docs.forEach(contaDoc => {
        const conta = contaDoc.data();

        // Conversão de valor (baseado na sua utils)
        if (conta.valor) {
          let cleanValue = String(conta.valor).trim().replace(/R\$\s?/g, '');
          cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
          const numValue = parseFloat(cleanValue);

          if (!isNaN(numValue)) {
            if (conta.tipo === 'Despesa') {
              totalDespesas += numValue;
            } else if (conta.tipo === 'Receita') {
              totalReceitas += numValue;
            }
          }
        }

        // Definindo cor baseada no status
        // Ajuste os status possíveis conforme a regra do seu App ('Paga', 'Pendente', 'Atrasada')
        let corFundoStatus = '#fef3c7'; // Amarelo (pendente) padrão
        let corTextoStatus = '#d97706';

        if (conta.statusPago) {
          corFundoStatus = '#d1fae5'; // Verde
          corTextoStatus = '#059669';
        }

        transacoes.push({
          nome: conta.nome || conta.descricao || 'Sem Nome',
          valor: conta.valor, // Mantendo a string original "1.500,00"
          tipo: conta.tipo,
          status: conta.statusPago ? 'Paga' : 'Pendente',
          statusPago: conta.statusPago || false,
          diaVencimento: Number(conta.diaVencimento) || 0,
          data_formatada: 'Dia de vencimento: ' + (conta.diaVencimento || '--'),
          cor_valor: conta.tipo === 'Receita' ? '#10B981' : '#1b1230',
          cor_fundo_status: corFundoStatus,
          cor_texto_status: corTextoStatus
        });
      });

      const contasNaoPagas = transacoes.filter(t => !t.statusPago);
      const contasPagas = transacoes.filter(t => t.statusPago);

      // Ordenar decrescente pelo dia de vencimento
      contasNaoPagas.sort((a, b) => b.diaVencimento - a.diaVencimento);
      contasPagas.sort((a, b) => b.diaVencimento - a.diaVencimento);

      // Priorizar contas não pagas. Se não atingir 5, preenche com as pagas
      const ultimasTransacoes = [...contasNaoPagas, ...contasPagas].slice(0, 5);

      const formatarMoeda = (valor: number) => {
        return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      };

      const saldo = totalReceitas - totalDespesas;

      try {
        const authUser = await admin.auth().getUser(userId);

        console.log("authUser", authUser);
        console.log("userData", userData);

        if (authUser.email) {
          const nomeCompleto = authUser.displayName || userData.nome || "Usuário";
          const primeiroNome = nomeCompleto.split(" ")[0];
          const unsubscribeUrl = `https://meu-cofrin.app.br/unsubscribe?email=${encodeURIComponent(authUser.email)}&userId=${userId}`;

          emails.push({
            From: "naoresponder@meu-cofrin.app.br",
            To: authUser.email,
            TemplateId: 46187286,
            TemplateModel: {
              titulo_email: tituloEmail,
              texto_introdutorio: textoIntrodutorio,
              primeiro_nome: primeiroNome,
              mes_ano: mesAnoFormatado,
              total_receitas: formatarMoeda(totalReceitas),
              total_despesas: formatarMoeda(totalDespesas),
              saldo: formatarMoeda(saldo),
              transacoes: ultimasTransacoes,
              ano_atual: ano,
              unsubscribe: unsubscribeUrl,
            },
            Headers: [
              {
                Name: "List-Unsubscribe",
                Value: `<https://meu-cofrin.app.br/unsubscribe?email=${encodeURIComponent(authUser.email)}&userId=${userId}>`
              }
            ],
            MessageStream: "outbound"
          });
        }
      } catch (authError) {
        logger.warn(`Erro ao buscar dados de autenticação para o usuário ${userId}:`, authError);
      }
    }

    console.log("Emails a serem enviados:", JSON.stringify(emails, null, 2));

    if (emails.length > 0) {
      const client = new postmark.ServerClient(emailApiKey.value());
      await client.sendEmailBatchWithTemplates(emails);
      logger.info(`Resumo mensal enviado com sucesso via Postmark para ${emails.length} usuário(s).`);
    } else {
      logger.info("Nenhum usuário com transações no mês ou e-mail válido encontrado para notificar.");
    }
  } catch (error) {
    logger.error("Erro ao processar notificação de resumo mensal:", error);
  }
});
