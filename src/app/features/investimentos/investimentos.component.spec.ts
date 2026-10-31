import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InvestimentosComponent } from './investimentos.component';
import { InvestimentoService } from '../../core/services/investimento.service';
import { Investimento } from '../../core/models/investimento.model';

describe('InvestimentosComponent', () => {
  let component: InvestimentosComponent;
  let fixture: ComponentFixture<InvestimentosComponent>;

  const investimento = (dados: Partial<Investimento>): Investimento => ({
    nome: '',
    tipo: 'CDB',
    instituicao: 'Nubank',
    aporteInicial: 1000,
    valorAtual: 1100,
    criadoEm: '2026-10-01T10:00:00.000Z',
    ...dados
  });

  const mockInvestimentos: Investimento[] = [
    investimento({ id: 'cdb-xp', nome: 'CDB XP', instituicao: 'Banco XP' }),
    investimento({ id: 'cdb-nubank', nome: 'CDB Nubank', descricao: '  Reserva de emergência  ' }),
    investimento({ id: 'cdb-inter', nome: 'CDB Inter', instituicao: 'Inter', descricao: 'Liquidez diária', dataVencimento: '2027-01-15' }),
    investimento({ id: 'acao-itsa', nome: 'ITSA4', tipo: 'Ações', descricao: '   ' }),
    investimento({ id: 'dolar', nome: 'Dólar', tipo: 'Outros', instituicao: 'Itaú', descricao: 'Para a viagem\nde dezembro' })
  ];

  const mockInvestimentoService = {
    getInvestimentos: vi.fn(),
    deleteInvestimento: vi.fn()
  };

  const el = () => fixture.nativeElement as HTMLElement;
  const alertas = () => Array.from(el().querySelectorAll<HTMLElement>('[aria-label="Descrições dos investimentos"]'));
  const categoria = (tipo: string) => component.investimentosPorCategoria().find(c => c.tipo === tipo)!;

  async function criarComponente() {
    fixture = TestBed.createComponent(InvestimentosComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  }

  beforeEach(async () => {
    vi.clearAllMocks();
    localStorage.removeItem('showValues');
    mockInvestimentoService.getInvestimentos.mockImplementation(() =>
      Promise.resolve(mockInvestimentos.map(inv => ({ ...inv })))
    );

    await TestBed.configureTestingModule({
      imports: [InvestimentosComponent],
      providers: [
        provideRouter([]),
        { provide: InvestimentoService, useValue: mockInvestimentoService }
      ]
    }).compileComponents();

    await criarComponente();
  });

  afterEach(() => {
    localStorage.removeItem('showValues');
  });

  it('deve listar as descrições do Tipo na mesma ordem dos cards, sem espaços nas pontas', () => {
    const cdb = categoria('CDB');

    expect(cdb.investimentos.map(inv => inv.nome)).toEqual(['CDB Inter', 'CDB Nubank', 'CDB XP']);
    expect(cdb.descricoes).toEqual([
      { id: 'cdb-inter', nome: 'CDB Inter', descricao: 'Liquidez diária' },
      { id: 'cdb-nubank', nome: 'CDB Nubank', descricao: 'Reserva de emergência' }
    ]);
  });

  it('deve ignorar descrições vazias ou só com espaços', () => {
    expect(categoria('Ações').descricoes).toEqual([]);
  });

  it('deve exibir um alerta apenas nos Tipos com alguma descrição', () => {
    const textos = alertas().map(alerta => alerta.textContent ?? '');

    expect(textos).toHaveLength(2);
    expect(textos[0]).toContain('CDB Inter: Liquidez diária');
    expect(textos[0]).toContain('CDB Nubank: Reserva de emergência');
    expect(textos[0]).not.toContain('CDB XP');
    expect(textos[1]).toContain('Dólar: Para a viagem\nde dezembro');
    expect(textos.join()).not.toContain('ITSA4');
  });

  it('deve manter as descrições visíveis com os valores ocultos', async () => {
    localStorage.setItem('showValues', 'false');
    await criarComponente();

    expect(component.showValues()).toBe(false);
    expect(alertas()).toHaveLength(2);
    expect(alertas()[0].textContent).toContain('CDB Inter: Liquidez diária');
  });
});
