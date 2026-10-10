import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { DesejoDetalheComponent } from './desejo-detalhe.component';
import { DesejoService } from '../../../core/services/desejo.service';
import { Desejo } from '../../../core/models/desejo.model';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('DesejoDetalheComponent', () => {
  let component: DesejoDetalheComponent;
  let fixture: ComponentFixture<DesejoDetalheComponent>;

  const mockDesejo: Desejo = {
    id: 'desejo-123',
    nome: 'PlayStation 5 Slim',
    descricao: 'Edição Digital',
    categoria: 'Vídeo game',
    menorPreco: 3200,
    maiorPreco: 3900,
    criadoEm: '2026-09-17T12:00:00.000Z',
    links: [
      { id: 'l1', url: 'https://www.amazon.com.br/dp/B000', loja: 'Amazon', preco: 3500, criadoEm: '2026-09-17T12:30:00.000Z' },
      { id: 'l2', url: 'https://www.kabum.com.br/produto/123', loja: 'KaBuM!', preco: 3200, criadoEm: '2026-09-17T13:00:00.000Z' },
      { id: 'l3', url: 'https://www.mercadolivre.com.br/p/456', loja: 'Mercado Livre', preco: 3900 }
    ]
  };

  const mockDesejoService = {
    getDesejoById: vi.fn().mockImplementation((id: string) => Promise.resolve(id === 'desejo-123' ? { ...mockDesejo } : null)),
    addLink: vi.fn().mockResolvedValue(undefined),
    updateLink: vi.fn().mockResolvedValue(undefined),
    removeLink: vi.fn().mockResolvedValue(undefined),
    updateDesejo: vi.fn().mockResolvedValue(undefined),
    deleteDesejo: vi.fn().mockResolvedValue(undefined),
    marcarRealizado: vi.fn().mockResolvedValue(undefined),
    desfazerRealizacao: vi.fn().mockResolvedValue(undefined)
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [DesejoDetalheComponent],
      providers: [
        provideRouter([]),
        { provide: DesejoService, useValue: mockDesejoService },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(new Map([['id', 'desejo-123']]))
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DesejoDetalheComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('deve instanciar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('deve carregar o produto e calcular menor e maior preço corretamente', async () => {
    await component.loadDesejo('desejo-123');

    expect(component.desejo()?.nome).toBe('PlayStation 5 Slim');
    expect(component.menorPreco()).toBe(3200);
    expect(component.maiorPreco()).toBe(3900);

    const econ = component.economiaPotencial();
    expect(econ).toBeTruthy();
    expect(econ?.valor).toBe(700);
    expect(econ?.percentual).toBe(18);
  });

  it('deve ordenar links do menor para o maior preço', async () => {
    await component.loadDesejo('desejo-123');

    const ordenados = component.linksOrdenados();
    expect(ordenados.length).toBe(3);
    expect(ordenados[0].preco).toBe(3200);
    expect(ordenados[0].loja).toBe('KaBuM!');
    expect(ordenados[2].preco).toBe(3900);
  });

  it('deve autodetectar o nome da loja a partir da URL', () => {
    expect(component.detectLojaFromUrl('https://www.amazon.com.br/dp/123')).toBe('Amazon');
    expect(component.detectLojaFromUrl('https://produto.mercadolivre.com.br/MLB-123')).toBe('Mercado Livre');
    expect(component.detectLojaFromUrl('https://www.kabum.com.br/produto/1')).toBe('KaBuM!');
    expect(component.detectLojaFromUrl('https://www.magazineluiza.com.br/item')).toBe('Magazine Luiza');
    expect(component.detectLojaFromUrl('https://shopee.com.br/item')).toBe('Shopee');
  });

  it('deve abrir e fechar o modal de link', () => {
    component.openAddLinkModal();
    expect(component.isLinkModalOpen()).toBe(true);
    expect(component.isEditLinkMode()).toBe(false);

    component.closeLinkModal();
    expect(component.isLinkModalOpen()).toBe(false);
  });

  it('deve formatar data de cadastro do produto e dos links', async () => {
    await component.loadDesejo('desejo-123');
    fixture.detectChanges();

    expect(component.formatarData(component.desejo()?.criadoEm)).toBe('17/09/2026');
    const links = component.linksOrdenados();
    expect(component.formatarData(links[0].criadoEm)).toBe('17/09/2026');

    const nativeEl = fixture.nativeElement as HTMLElement;
    expect(nativeEl.textContent).toContain('Criado em 17/09/2026');
  });

  describe('Desejo realizado', () => {
    it('deve exibir o botão "Desejo realizado" quando o desejo não foi realizado', async () => {
      await component.loadDesejo('desejo-123');
      fixture.detectChanges();

      const nativeEl = fixture.nativeElement as HTMLElement;
      expect(nativeEl.querySelector('#btn-desejo-realizado')).toBeTruthy();
      expect(nativeEl.querySelector('#card-desejo-realizado')).toBeNull();
    });

    it('deve abrir o modal pré-preenchido com o menor preço e a data/hora atual', async () => {
      await component.loadDesejo('desejo-123');
      component.openRealizacaoModal();

      expect(component.isRealizacaoModalOpen()).toBe(true);
      const raw = component.formRealizacao.getRawValue();
      expect(raw.valorPago).toBe(3200);
      expect(raw.descricao).toBe('');
      expect(raw.realizadoEm).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);

      component.closeRealizacaoModal();
      expect(component.isRealizacaoModalOpen()).toBe(false);
    });

    it('não deve salvar quando o valor pago for inválido', async () => {
      await component.loadDesejo('desejo-123');
      component.openRealizacaoModal();
      component.formRealizacao.patchValue({ valorPago: 0 });

      await component.onSaveRealizacao();

      expect(mockDesejoService.marcarRealizado).not.toHaveBeenCalled();
      expect(component.isRealizacaoModalOpen()).toBe(true);
    });

    it('deve salvar a realização com valor, descrição e data em ISO', async () => {
      await component.loadDesejo('desejo-123');
      component.openRealizacaoModal();
      component.formRealizacao.patchValue({
        valorPago: 3100,
        descricao: '  Comprei na Black Friday  ',
        realizadoEm: '2026-10-10T20:30'
      });

      await component.onSaveRealizacao();

      expect(mockDesejoService.marcarRealizado).toHaveBeenCalledWith('desejo-123', {
        valorPago: 3100,
        descricao: 'Comprei na Black Friday',
        realizadoEm: new Date('2026-10-10T20:30').toISOString()
      });
      expect(component.isRealizacaoModalOpen()).toBe(false);
    });

    it('deve exibir o card de realizado com economia e esconder o botão', async () => {
      mockDesejoService.getDesejoById.mockResolvedValueOnce({
        ...mockDesejo,
        realizacao: {
          valorPago: 3000,
          descricao: 'Parcelado em 10x',
          realizadoEm: new Date(2026, 9, 10, 20, 30).toISOString(),
          registradoEm: new Date().toISOString()
        }
      });
      await component.loadDesejo('desejo-123');
      fixture.detectChanges();

      const econ = component.economiaRealizacao();
      expect(econ?.valor).toBe(900);
      expect(econ?.percentual).toBe(23);

      const nativeEl = fixture.nativeElement as HTMLElement;
      expect(nativeEl.querySelector('#btn-desejo-realizado')).toBeNull();
      const card = nativeEl.querySelector('#card-desejo-realizado');
      expect(card).toBeTruthy();
      expect(card?.textContent).toContain('10/10/2026 às 20:30');
      expect(card?.textContent).toContain('Parcelado em 10x');
    });

    it('deve abrir o modal em modo edição com os dados da realização existente', async () => {
      mockDesejoService.getDesejoById.mockResolvedValueOnce({
        ...mockDesejo,
        realizacao: {
          valorPago: 3000,
          descricao: 'Obs',
          realizadoEm: new Date(2026, 9, 1, 9, 5).toISOString(),
          registradoEm: new Date().toISOString()
        }
      });
      await component.loadDesejo('desejo-123');
      component.openRealizacaoModal();

      const raw = component.formRealizacao.getRawValue();
      expect(raw.valorPago).toBe(3000);
      expect(raw.descricao).toBe('Obs');
      expect(raw.realizadoEm).toBe('2026-10-01T09:05');
    });

    it('deve desfazer a realização após confirmação', async () => {
      mockDesejoService.getDesejoById.mockResolvedValueOnce({
        ...mockDesejo,
        realizacao: { valorPago: 3000, realizadoEm: new Date().toISOString(), registradoEm: new Date().toISOString() }
      });
      await component.loadDesejo('desejo-123');
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      await component.onDesfazerRealizacao();

      expect(confirmSpy).toHaveBeenCalled();
      expect(mockDesejoService.desfazerRealizacao).toHaveBeenCalledWith('desejo-123');
      confirmSpy.mockRestore();
    });

    it('não deve desfazer a realização se o usuário cancelar', async () => {
      mockDesejoService.getDesejoById.mockResolvedValueOnce({
        ...mockDesejo,
        realizacao: { valorPago: 3000, realizadoEm: new Date().toISOString(), registradoEm: new Date().toISOString() }
      });
      await component.loadDesejo('desejo-123');
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      await component.onDesfazerRealizacao();

      expect(mockDesejoService.desfazerRealizacao).not.toHaveBeenCalled();
      confirmSpy.mockRestore();
    });
  });
});
