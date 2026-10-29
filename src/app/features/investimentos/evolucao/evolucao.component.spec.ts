import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { provideEnvironmentNgxMask } from 'ngx-mask';
import { ToastrService } from 'ngx-toastr';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EvolucaoComponent } from './evolucao.component';
import { InvestimentoService } from '../../../core/services/investimento.service';
import { Investimento, RegistroInvestimento } from '../../../core/models/investimento.model';

describe('EvolucaoComponent', () => {
  let component: EvolucaoComponent;
  let fixture: ComponentFixture<EvolucaoComponent>;

  const mockInvestimento: Investimento = {
    id: 'inv-1',
    nome: 'Conta em dólar',
    tipo: 'Outros',
    instituicao: 'Nubank',
    aporteInicial: 11551.06,
    valorAtual: 11604.77,
    criadoEm: '2026-10-29T10:00:00.000Z'
  };

  // Exibidos do mais recente para o mais antigo: r3, r2, r1
  const mockRegistros: RegistroInvestimento[] = [
    { id: 'r1', data: '2026-10-29T10:00:00.000Z', valor: 11551.06, anotacao: 'Aporte inicial' },
    { id: 'r2', data: '2026-10-29T12:00:00.000Z', valor: 11604.77, anotacao: 'US$ 5,33' },
    { id: 'r3', data: '2026-10-30T12:00:00.000Z', valor: 11610 }
  ];

  const mockInvestimentoService = {
    getInvestimentoById: vi.fn(),
    getRegistros: vi.fn(),
    updateAnotacaoRegistro: vi.fn(),
    addRegistro: vi.fn(),
    deleteRegistro: vi.fn()
  };

  const mockToastr = { error: vi.fn() };

  const el = () => fixture.nativeElement as HTMLElement;
  const botoes = (title: string) =>
    Array.from(el().querySelectorAll<HTMLButtonElement>(`button[title="${title}"]`));
  const inputAnotacao = () => el().querySelector<HTMLInputElement>('input[aria-label="Anotação do registro"]');

  async function abrirEdicao(indice: number) {
    botoes('Editar anotação')[indice].click();
    await fixture.whenStable();
  }

  async function digitar(texto: string) {
    const input = inputAnotacao()!;
    input.value = texto;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  async function tecla(key: string) {
    inputAnotacao()!.dispatchEvent(new KeyboardEvent('keydown', { key }));
    await fixture.whenStable();
  }

  beforeEach(async () => {
    vi.clearAllMocks();
    mockInvestimentoService.getInvestimentoById.mockResolvedValue({ ...mockInvestimento });
    mockInvestimentoService.getRegistros.mockImplementation(() =>
      Promise.resolve(mockRegistros.map(r => ({ ...r })))
    );
    mockInvestimentoService.updateAnotacaoRegistro.mockResolvedValue(undefined);

    await TestBed.configureTestingModule({
      imports: [EvolucaoComponent],
      providers: [
        provideRouter([]),
        provideCharts(withDefaultRegisterables()),
        provideEnvironmentNgxMask(),
        { provide: InvestimentoService, useValue: mockInvestimentoService },
        { provide: ToastrService, useValue: mockToastr },
        { provide: ActivatedRoute, useValue: { paramMap: of(new Map([['id', 'inv-1']])) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EvolucaoComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('deve exibir o lápis em todos os registros, inclusive sem anotação', () => {
    expect(botoes('Editar anotação')).toHaveLength(3);
    expect(botoes('Deletar registro')).toHaveLength(3);
  });

  it('deve trocar o texto por um input focado com a anotação atual', async () => {
    await abrirEdicao(1);

    const input = inputAnotacao();
    expect(input?.value).toBe('US$ 5,33');
    expect(input?.maxLength).toBe(100);
    expect(document.activeElement).toBe(input);
    expect(el().textContent).not.toContain('US$ 5,33');
  });

  it('deve trocar lápis e lixeira por salvar e cancelar apenas no registro em edição', async () => {
    await abrirEdicao(1);

    expect(botoes('Salvar anotação')).toHaveLength(1);
    expect(botoes('Cancelar edição')).toHaveLength(1);
    expect(botoes('Editar anotação')).toHaveLength(2);
    expect(botoes('Deletar registro')).toHaveLength(2);
  });

  it('deve abrir o input vazio em registro sem anotação', async () => {
    await abrirEdicao(0);

    expect(inputAnotacao()?.value).toBe('');
  });

  it('deve salvar com Enter, sem espaços nas pontas e sem recarregar a página', async () => {
    await abrirEdicao(1);
    await digitar('  Cotação US$ 5,33  ');
    await tecla('Enter');

    expect(mockInvestimentoService.updateAnotacaoRegistro).toHaveBeenCalledWith('inv-1', 'r2', 'Cotação US$ 5,33');
    expect(inputAnotacao()).toBeNull();
    expect(el().textContent).toContain('Cotação US$ 5,33');
    expect(mockInvestimentoService.getRegistros).toHaveBeenCalledTimes(1);
    expect(mockToastr.error).not.toHaveBeenCalled();
  });

  it('deve salvar pelo botão de confirmar', async () => {
    await abrirEdicao(2);
    await digitar('Primeiro aporte');
    botoes('Salvar anotação')[0].click();
    await fixture.whenStable();

    expect(mockInvestimentoService.updateAnotacaoRegistro).toHaveBeenCalledWith('inv-1', 'r1', 'Primeiro aporte');
    expect(el().textContent).toContain('Primeiro aporte');
  });

  it('deve cancelar com Esc sem gravar', async () => {
    await abrirEdicao(1);
    await digitar('texto descartado');
    await tecla('Escape');

    expect(mockInvestimentoService.updateAnotacaoRegistro).not.toHaveBeenCalled();
    expect(inputAnotacao()).toBeNull();
    expect(el().textContent).toContain('US$ 5,33');
  });

  it('deve cancelar pelo botão sem gravar', async () => {
    await abrirEdicao(1);
    await digitar('texto descartado');
    botoes('Cancelar edição')[0].click();
    await fixture.whenStable();

    expect(mockInvestimentoService.updateAnotacaoRegistro).not.toHaveBeenCalled();
    expect(el().textContent).toContain('US$ 5,33');
  });

  it('não deve gravar quando o texto não mudou', async () => {
    await abrirEdicao(1);
    await digitar(' US$ 5,33 ');
    await tecla('Enter');

    expect(mockInvestimentoService.updateAnotacaoRegistro).not.toHaveBeenCalled();
    expect(inputAnotacao()).toBeNull();
  });

  it('deve remover a anotação quando o texto ficar vazio', async () => {
    await abrirEdicao(1);
    await digitar('   ');
    await tecla('Enter');

    expect(mockInvestimentoService.updateAnotacaoRegistro).toHaveBeenCalledWith('inv-1', 'r2', '');
    expect(component.registros().find(r => r.id === 'r2')?.anotacao).toBeUndefined();
    expect(el().textContent).not.toContain('US$ 5,33');
  });

  it('deve descartar a edição em andamento ao abrir outro registro', async () => {
    await abrirEdicao(1);
    await digitar('texto descartado');
    await abrirEdicao(1); // r1: o lápis de r2 sumiu, então o índice 1 agora é r1

    expect(el().querySelectorAll('input[aria-label="Anotação do registro"]')).toHaveLength(1);
    expect(inputAnotacao()?.value).toBe('Aporte inicial');
    expect(el().textContent).toContain('US$ 5,33');
  });

  it('deve exibir toast e manter o input aberto quando a gravação falhar', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockInvestimentoService.updateAnotacaoRegistro.mockRejectedValueOnce(new Error('offline'));

    await abrirEdicao(1);
    await digitar('Nova anotação');
    await tecla('Enter');

    expect(mockToastr.error).toHaveBeenCalledWith('Não foi possível salvar a anotação. Tente novamente.');
    expect(inputAnotacao()?.value).toBe('Nova anotação');
    expect(component.registros().find(r => r.id === 'r2')?.anotacao).toBe('US$ 5,33');
  });

  it('deve limitar a anotação do novo registro a 100 caracteres', () => {
    const anotacao = component.formRegistro.get('anotacao')!;

    anotacao.setValue('a'.repeat(100));
    expect(anotacao.valid).toBe(true);

    anotacao.setValue('a'.repeat(101));
    expect(anotacao.valid).toBe(false);
  });
});
