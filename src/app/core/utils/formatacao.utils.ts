/**
 * Utilitários compartilhados de formatação financeira e datas.
 */

/**
 * Converte valor numérico ou string com formatação BRL para número float.
 * Suporta formatos: 1234.56, "1.234,56", "R$ 1.234,56", etc.
 */
export function parseFloatValor(valor: any): number {
  if (!valor) return 0;
  if (typeof valor === 'number') return valor;
  const str = valor.toString();
  const cleanValue = str.replace(/\./g, '').replace(',', '.').replace('R$', '').trim();
  const numValue = parseFloat(cleanValue);
  return isNaN(numValue) ? 0 : numValue;
}

/**
 * Formata um número para a moeda brasileira (BRL).
 */
export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Formata o dia de vencimento com 2 dígitos.
 */
export function formatDataVencimento(conta: { diaVencimento: number }): string {
  return conta.diaVencimento.toString().padStart(2, '0');
}

/**
 * Formata a data de pagamento recebida no formato ISO ou string com data/hora para exibição pt-BR.
 */
export function formatDataPagamento(dataPagamento?: string | null): string {
  if (!dataPagamento) return '';
  try {
    if (dataPagamento.includes('T') || dataPagamento.includes(' ')) {
      const date = new Date(dataPagamento);
      if (!isNaN(date.getTime())) {
        const dia = String(date.getDate()).padStart(2, '0');
        const mes = String(date.getMonth() + 1).padStart(2, '0');
        const ano = date.getFullYear();
        const horas = String(date.getHours()).padStart(2, '0');
        const minutos = String(date.getMinutes()).padStart(2, '0');
        return `${dia}/${mes}/${ano} ${horas}:${minutos}`;
      }
    }

    const parts = dataPagamento.split('-');
    if (parts.length === 3) {
      const ano = parts[0];
      const mes = parts[1].padStart(2, '0');
      const dia = parts[2].padStart(2, '0');
      return `${dia}/${mes}/${ano}`;
    }

    const date = new Date(dataPagamento);
    if (!isNaN(date.getTime())) {
      const dia = String(date.getDate()).padStart(2, '0');
      const mes = String(date.getMonth() + 1).padStart(2, '0');
      const ano = date.getFullYear();
      const horas = String(date.getHours()).padStart(2, '0');
      const minutos = String(date.getMinutes()).padStart(2, '0');
      return `${dia}/${mes}/${ano} ${horas}:${minutos}`;
    }
  } catch {
    // Retorna fallback se não conseguir processar
  }
  return dataPagamento;
}

/**
 * Converte diferentes representações de data (Firestore Timestamp, ISO string, Date, timestamp em ms)
 * em um objeto Date válido. Retorna null caso inválido.
 */
export function converterParaDate(data: any): Date | null {
  if (!data) return null;
  if (typeof data?.toDate === 'function') {
    return data.toDate();
  }
  if (data instanceof Date) {
    return isNaN(data.getTime()) ? null : data;
  }
  if (typeof data?.seconds === 'number') {
    return new Date(data.seconds * 1000);
  }
  if (typeof data?._seconds === 'number') {
    return new Date(data._seconds * 1000);
  }
  if (typeof data === 'number') {
    const d = new Date(data);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof data === 'string') {
    const dateOnlyMatch = data.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnlyMatch) {
      const [, ano, mes, dia] = dateOnlyMatch;
      return new Date(Number(ano), Number(mes) - 1, Number(dia));
    }
    const d = new Date(data);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Formata qualquer formato de data aceito para o padrão brasileiro dd/MM/yyyy.
 */
export function formatarData(data: any): string {
  const date = converterParaDate(data);
  if (!date) return '';
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const ano = date.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

/**
 * Formata qualquer formato de data aceito para o padrão brasileiro dd/MM/yyyy às HH:mm.
 */
export function formatarDataHora(data: any): string {
  const date = converterParaDate(data);
  if (!date) return '';
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const ano = date.getFullYear();
  const horas = String(date.getHours()).padStart(2, '0');
  const minutos = String(date.getMinutes()).padStart(2, '0');
  return `${dia}/${mes}/${ano} às ${horas}:${minutos}`;
}

