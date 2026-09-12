import { FormControl } from '@angular/forms';
import { describe, it, expect } from 'vitest';
import { cnpjValidator, validarCnpj } from './cnpj.validator';

describe('validarCnpj', () => {
  it('deve retornar true para CNPJs válidos conhecidos', () => {
    // Exemplos de CNPJs válidos (algoritmo)
    expect(validarCnpj('11.222.333/0001-81')).toBe(true);
    expect(validarCnpj('11222333000181')).toBe(true);
    expect(validarCnpj('00.000.000/0001-91')).toBe(true); // Banco do Brasil
    expect(validarCnpj('33.000.167/0001-01')).toBe(true); // Petrobras
  });

  it('deve retornar false para CNPJs com dígitos verificadores incorretos', () => {
    expect(validarCnpj('11.222.333/0001-82')).toBe(false);
    expect(validarCnpj('11222333000180')).toBe(false);
  });

  it('deve retornar false para CNPJs com todos os números repetidos', () => {
    expect(validarCnpj('00.000.000/0000-00')).toBe(false);
    expect(validarCnpj('11111111111111')).toBe(false);
    expect(validarCnpj('22.222.222/2222-22')).toBe(false);
    expect(validarCnpj('99999999999999')).toBe(false);
  });

  it('deve retornar false para valores com tamanho inválido ou vazios', () => {
    expect(validarCnpj('')).toBe(false);
    expect(validarCnpj('123')).toBe(false);
    expect(validarCnpj('1122233300018')).toBe(false); // 13 dígitos
    expect(validarCnpj('112223330001811')).toBe(false); // 15 dígitos
  });
});

describe('cnpjValidator (Angular ValidatorFn)', () => {
  it('deve retornar null para campo vazio (delega para Validators.required)', () => {
    const control = new FormControl('');
    expect(cnpjValidator(control)).toBeNull();
  });

  it('deve retornar null para controle com CNPJ válido', () => {
    const control = new FormControl('11.222.333/0001-81');
    expect(cnpjValidator(control)).toBeNull();
  });

  it('deve retornar { cnpjInvalido: true } para controle com CNPJ inválido', () => {
    const control = new FormControl('00.000.000/0000-00');
    expect(cnpjValidator(control)).toEqual({ cnpjInvalido: true });

    control.setValue('11.222.333/0001-99');
    expect(cnpjValidator(control)).toEqual({ cnpjInvalido: true });
  });
});
