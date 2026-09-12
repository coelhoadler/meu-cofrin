import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validador de CNPJ (Cadastro Nacional da Pessoa Jurídica).
 * Valida o formato e os dois dígitos verificadores segundo o algoritmo oficial da Receita Federal.
 */
export function validarCnpj(cnpj: string): boolean {
  if (!cnpj) return false;

  // Remove caracteres não numéricos
  const cleanCnpj = cnpj.replace(/\D/g, '');

  // CNPJ precisa ter exatamente 14 dígitos
  if (cleanCnpj.length !== 14) {
    return false;
  }

  // Elimina CNPJs conhecidos inválidos (todos os dígitos repetidos)
  if (/^(\d)\1{13}$/.test(cleanCnpj)) {
    return false;
  }

  // Validação do primeiro dígito verificador
  let tamanho = 12;
  let numeros = cleanCnpj.substring(0, tamanho);
  const digitos = cleanCnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
    if (pos < 2) {
      pos = 9;
    }
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0), 10)) {
    return false;
  }

  // Validação do segundo dígito verificador
  tamanho = 13;
  numeros = cleanCnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
    if (pos < 2) {
      pos = 9;
    }
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(1), 10)) {
    return false;
  }

  return true;
}

/**
 * Validador Angular para formulários reativos.
 */
export const cnpjValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;
  if (!value) {
    return null; // Deixa a validação de obrigatoriedade para Validators.required
  }

  const valido = validarCnpj(value);
  return valido ? null : { cnpjInvalido: true };
};
