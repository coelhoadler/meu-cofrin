import { describe, it, expect } from 'vitest';
import {
  parseFloatValor,
  formatarMoeda,
  formatDataVencimento,
  formatDataPagamento,
  converterParaDate,
  formatarData,
  formatarDataHora
} from './formatacao.utils';

describe('formatacao.utils', () => {
  describe('parseFloatValor', () => {
    it('deve converter valores numéricos e strings formatadas em pt-BR', () => {
      expect(parseFloatValor(123.45)).toBe(123.45);
      expect(parseFloatValor('1.234,56')).toBe(1234.56);
      expect(parseFloatValor('R$ 10.599,00')).toBe(10599);
      expect(parseFloatValor(null)).toBe(0);
      expect(parseFloatValor(undefined)).toBe(0);
    });
  });

  describe('formatarMoeda', () => {
    it('deve formatar número como moeda brasileira', () => {
      const res = formatarMoeda(10599);
      expect(res).toContain('10.599,00');
    });
  });

  describe('converterParaDate', () => {
    it('deve retornar null para valores vazios ou inválidos', () => {
      expect(converterParaDate(null)).toBeNull();
      expect(converterParaDate(undefined)).toBeNull();
      expect(converterParaDate('')).toBeNull();
      expect(converterParaDate('data-invalida')).toBeNull();
    });

    it('deve converter instâncias de Date válidas', () => {
      const d = new Date(2026, 8, 17, 10, 30);
      expect(converterParaDate(d)).toBe(d);
    });

    it('deve converter objeto com método toDate() do Firestore', () => {
      const d = new Date(2026, 8, 17, 10, 30);
      const firestoreTimestamp = {
        toDate: () => d
      };
      expect(converterParaDate(firestoreTimestamp)).toBe(d);
    });

    it('deve converter objeto com seconds do Firestore', () => {
      const epochSeconds = 1726574400;
      const res = converterParaDate({ seconds: epochSeconds });
      expect(res).toBeInstanceOf(Date);
      expect(res?.getTime()).toBe(epochSeconds * 1000);
    });

    it('deve converter objeto com _seconds', () => {
      const epochSeconds = 1726574400;
      const res = converterParaDate({ _seconds: epochSeconds });
      expect(res).toBeInstanceOf(Date);
      expect(res?.getTime()).toBe(epochSeconds * 1000);
    });

    it('deve converter string no formato YYYY-MM-DD sem distorção de fuso', () => {
      const res = converterParaDate('2026-09-17');
      expect(res).toBeInstanceOf(Date);
      expect(res?.getFullYear()).toBe(2026);
      expect(res?.getMonth()).toBe(8); // Setembro (0-indexed)
      expect(res?.getDate()).toBe(17);
    });

    it('deve converter string ISO 8601', () => {
      const iso = '2026-09-17T12:00:00.000Z';
      const res = converterParaDate(iso);
      expect(res).toBeInstanceOf(Date);
      expect(res?.toISOString()).toBe(iso);
    });

    it('deve converter timestamp numérico em milissegundos', () => {
      const millis = 1726574400000;
      const res = converterParaDate(millis);
      expect(res).toBeInstanceOf(Date);
      expect(res?.getTime()).toBe(millis);
    });
  });

  describe('formatarData', () => {
    it('deve retornar string vazia para data nula ou indefinida', () => {
      expect(formatarData(null)).toBe('');
      expect(formatarData(undefined)).toBe('');
    });

    it('deve formatar corretamente para dd/MM/yyyy', () => {
      const d = new Date(2026, 8, 17); // 17 de setembro de 2026
      expect(formatarData(d)).toBe('17/09/2026');
    });

    it('deve formatar Timestamp do Firestore para dd/MM/yyyy', () => {
      const firestoreTimestamp = {
        toDate: () => new Date(2026, 8, 17)
      };
      expect(formatarData(firestoreTimestamp)).toBe('17/09/2026');
    });

    it('deve formatar data com dias ou meses de 1 dígito com zero à esquerda', () => {
      const d = new Date(2026, 0, 5); // 05 de janeiro de 2026
      expect(formatarData(d)).toBe('05/01/2026');
    });
  });

  describe('formatarDataHora', () => {
    it('deve retornar string vazia para data inválida', () => {
      expect(formatarDataHora(null)).toBe('');
    });

    it('deve formatar no padrão dd/MM/yyyy às HH:mm', () => {
      const d = new Date(2026, 8, 17, 9, 5);
      expect(formatarDataHora(d)).toBe('17/09/2026 às 09:05');
    });
  });
});
