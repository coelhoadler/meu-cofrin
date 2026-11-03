import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResumoCardsComponent } from './resumo-cards.component';
import { ComponentRef } from '@angular/core';

describe('ResumoCardsComponent', () => {
  let component: ResumoCardsComponent;
  let componentRef: ComponentRef<ResumoCardsComponent>;
  let fixture: ComponentFixture<ResumoCardsComponent>;

  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // Deprecated
        removeListener: vi.fn(), // Deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResumoCardsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ResumoCardsComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;

    componentRef.setInput('totalReceitas', 'R$ 1.000,00');
    componentRef.setInput('totalDespesas', 'R$ 500,00');
    componentRef.setInput('saldoMes', 'R$ 500,00');

    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('deve instanciar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('deve exibir os valores passados via input corretamente', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    const receitasTitle = compiled.querySelector('#tour-receitas-card h3');
    expect(receitasTitle?.textContent?.trim()).toBe('R$ 1.000,00');

    const despesasTitle = compiled.querySelector('#tour-despesas-card h3');
    expect(despesasTitle?.textContent?.trim()).toBe('R$ 500,00');

    const saldoTitle = compiled.querySelector('#tour-saldo-card h3');
    expect(saldoTitle?.textContent?.trim()).toBe('R$ 500,00');
  });

  it('deve ocultar os valores quando showValues for falso', () => {
    componentRef.setInput('showValues', false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    const receitasTitle = compiled.querySelector('#tour-receitas-card h3');
    expect(receitasTitle?.textContent?.trim()).toBe('R$ ••••');

    const despesasTitle = compiled.querySelector('#tour-despesas-card h3');
    expect(despesasTitle?.textContent?.trim()).toBe('R$ ••••');

    const saldoTitle = compiled.querySelector('#tour-saldo-card h3');
    expect(saldoTitle?.textContent?.trim()).toBe('R$ ••••');
  });

  it('deve emitir o evento toggleVisibility quando o botão for clicado', () => {
    const emitSpy = vi.spyOn(component.toggleVisibility, 'emit');
    // Note: tests use globally mocked window.matchMedia
    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector(
      '#tour-saldo-card div[title="Ocultar / Mostrar valores"]',
    ) as HTMLElement;

    button.click();

    expect(emitSpy).toHaveBeenCalled();
  });

  it('deve exibir variação positiva corretamente para receitas', () => {
    componentRef.setInput('variacaoReceitas', { percent: 10, direction: 'up' });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const card = compiled.querySelector('#tour-receitas-card') as HTMLElement;

    expect(card.textContent).toContain('+10%');
    expect(card.textContent).toContain('em comparação ao mês passado');
    expect(card.querySelector('.text-emerald-500')).toBeTruthy();
  });

  it('deve exibir variação negativa corretamente para receitas', () => {
    componentRef.setInput('variacaoReceitas', { percent: 5, direction: 'down' });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const card = compiled.querySelector('#tour-receitas-card') as HTMLElement;

    expect(card.textContent).toContain('-5%');
    expect(card.textContent).toContain('em comparação ao mês passado');
    expect(card.querySelector('.text-rose-500')).toBeTruthy();
  });

  it('deve exibir sem alteração para receitas', () => {
    componentRef.setInput('variacaoReceitas', { percent: 0, direction: 'none' });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const card = compiled.querySelector('#tour-receitas-card') as HTMLElement;

    expect(card.textContent).toContain('Sem alteração');
  });
});
