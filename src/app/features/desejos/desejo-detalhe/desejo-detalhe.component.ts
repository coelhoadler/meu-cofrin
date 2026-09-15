import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DesejoService } from '../../../core/services/desejo.service';
import {
  Desejo,
  DesejoLink,
  DesejoCategoria,
  DESEJO_CATEGORIAS,
  DESEJO_CATEGORIA_ICONS
} from '../../../core/models/desejo.model';
import { NavigationHistoryService } from '../../../core/services/navigation-history.service';
import { formatarMoeda, parseFloatValor } from '../../../core/utils/formatacao.utils';
import { NgxCurrencyDirective } from 'ngx-currency';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-desejo-detalhe',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    NgxCurrencyDirective,
    ProgressSpinnerModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './desejo-detalhe.component.html'
})
export class DesejoDetalheComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private desejoService = inject(DesejoService);
  public navigationHistory = inject(NavigationHistoryService);

  readonly categorias = DESEJO_CATEGORIAS;
  readonly categoriaIcons = DESEJO_CATEGORIA_ICONS;

  desejoId = signal<string | null>(null);
  desejo = signal<Desejo | null>(null);
  isLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // Máscara de privacidade
  showValues = signal<boolean>(localStorage.getItem('showValues') !== 'false');

  // Modal de Link
  isLinkModalOpen = signal<boolean>(false);
  isEditLinkMode = signal<boolean>(false);
  editingLinkId = signal<string | null>(null);
  formLink!: FormGroup;

  // Modal de Edição dos dados do Desejo
  isEditDesejoModalOpen = signal<boolean>(false);
  selectedFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);
  formDesejo!: FormGroup;

  // Computeds
  menorPreco = computed(() => this.desejo()?.menorPreco ?? null);
  maiorPreco = computed(() => this.desejo()?.maiorPreco ?? null);

  economiaPotencial = computed(() => {
    const menor = this.menorPreco();
    const maior = this.maiorPreco();
    if (menor != null && maior != null && maior > menor) {
      const diff = maior - menor;
      const pct = Math.round((diff / maior) * 100);
      return { valor: diff, percentual: pct };
    }
    return null;
  });

  linksOrdenados = computed(() => {
    const links = [...(this.desejo()?.links || [])];
    return links.sort((a, b) => a.preco - b.preco);
  });

  ngOnInit(): void {
    this.initForms();

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.desejoId.set(id);
        this.loadDesejo(id);
      }
    });
  }

  private initForms(): void {
    this.formLink = this.fb.group({
      url: ['', [Validators.required]],
      loja: [''],
      preco: ['', [Validators.required, Validators.min(0.01)]],
      observacao: ['', [Validators.maxLength(150)]]
    });

    // Auto detecção do nome da loja pela URL
    this.formLink.get('url')?.valueChanges.subscribe(url => {
      const lojaControl = this.formLink.get('loja');
      if (url && (!lojaControl?.value || lojaControl.pristine)) {
        const detected = this.detectLojaFromUrl(url);
        if (detected) {
          lojaControl?.setValue(detected, { emitEvent: false });
        }
      }
    });

    this.formDesejo = this.fb.group({
      nome: ['', [Validators.required, Validators.maxLength(100)]],
      categoria: ['Eletrônico' as DesejoCategoria, [Validators.required]],
      descricao: ['', [Validators.maxLength(400)]]
    });
  }

  detectLojaFromUrl(url: string): string {
    if (!url) return '';
    try {
      let host = url.trim().toLowerCase();
      if (!host.startsWith('http://') && !host.startsWith('https://')) {
        host = 'https://' + host;
      }
      const parsed = new URL(host);
      const hostname = parsed.hostname.replace(/^www\./, '');

      if (hostname.includes('amazon')) return 'Amazon';
      if (hostname.includes('mercadolivre') || hostname.includes('mercado-livre')) return 'Mercado Livre';
      if (hostname.includes('magazineluiza') || hostname.includes('magalu')) return 'Magazine Luiza';
      if (hostname.includes('kabum')) return 'KaBuM!';
      if (hostname.includes('shopee')) return 'Shopee';
      if (hostname.includes('aliexpress')) return 'AliExpress';
      if (hostname.includes('casasbahia')) return 'Casas Bahia';
      if (hostname.includes('americanas')) return 'Americanas';
      if (hostname.includes('pichau')) return 'Pichau';
      if (hostname.includes('terabyteshop') || hostname.includes('terabyte')) return 'TerabyteShop';
      if (hostname.includes('fastshop')) return 'Fast Shop';
      if (hostname.includes('submarino')) return 'Submarino';
      if (hostname.includes('carrefour')) return 'Carrefour';
      if (hostname.includes('extra.')) return 'Extra';

      const parts = hostname.split('.');
      if (parts.length > 0 && parts[0]) {
        return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      }
      return '';
    } catch {
      return '';
    }
  }

  async loadDesejo(id: string): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const data = await this.desejoService.getDesejoById(id);
      if (data) {
        this.desejo.set(data);
      } else {
        this.errorMessage.set('Produto não encontrado.');
      }
    } catch (error) {
      console.error('Erro ao carregar desejo:', error);
      this.errorMessage.set('Erro ao carregar detalhes do produto.');
    } finally {
      this.isLoading.set(false);
    }
  }

  openAddLinkModal(): void {
    this.isEditLinkMode.set(false);
    this.editingLinkId.set(null);
    this.formLink.reset({
      url: '',
      loja: '',
      preco: '',
      observacao: ''
    });
    this.isLinkModalOpen.set(true);
  }

  openEditLinkModal(link: DesejoLink): void {
    this.isEditLinkMode.set(true);
    this.editingLinkId.set(link.id);
    this.formLink.patchValue({
      url: link.url,
      loja: link.loja || '',
      preco: link.preco,
      observacao: link.observacao || ''
    });
    this.isLinkModalOpen.set(true);
  }

  closeLinkModal(): void {
    this.isLinkModalOpen.set(false);
    this.isEditLinkMode.set(false);
    this.editingLinkId.set(null);
    this.formLink.reset();
  }

  async onSaveLink(): Promise<void> {
    if (this.formLink.invalid) {
      this.formLink.markAllAsTouched();
      return;
    }

    const id = this.desejoId();
    if (!id) return;

    this.isSaving.set(true);
    try {
      const raw = this.formLink.getRawValue();
      const precoNum = typeof raw.preco === 'number' ? raw.preco : parseFloatValor(raw.preco);

      let cleanUrl = raw.url.trim();
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        cleanUrl = 'https://' + cleanUrl;
      }

      const lojaNome = raw.loja?.trim() || this.detectLojaFromUrl(cleanUrl) || 'Loja Online';

      if (this.isEditLinkMode() && this.editingLinkId()) {
        await this.desejoService.updateLink(id, this.editingLinkId()!, {
          url: cleanUrl,
          loja: lojaNome,
          preco: precoNum,
          observacao: raw.observacao?.trim() || ''
        });
      } else {
        await this.desejoService.addLink(id, {
          url: cleanUrl,
          loja: lojaNome,
          preco: precoNum,
          observacao: raw.observacao?.trim() || ''
        });
      }

      this.closeLinkModal();
      await this.loadDesejo(id);
    } catch (error) {
      console.error('Erro ao salvar link:', error);
      alert('Não foi possível salvar o link. Verifique as informações e tente novamente.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async onDeleteLink(link: DesejoLink): Promise<void> {
    const id = this.desejoId();
    if (!id) return;

    if (confirm(`Deseja remover o link da loja "${link.loja || 'esta loja'}"?`)) {
      this.isSaving.set(true);
      try {
        await this.desejoService.removeLink(id, link.id);
        await this.loadDesejo(id);
      } catch (error) {
        console.error('Erro ao remover link:', error);
        alert('Erro ao excluir link da loja.');
      } finally {
        this.isSaving.set(false);
      }
    }
  }

  openEditDesejoModal(): void {
    const current = this.desejo();
    if (!current) return;

    this.selectedFile.set(null);
    this.previewUrl.set(current.imagemUrl || null);
    this.formDesejo.patchValue({
      nome: current.nome,
      categoria: current.categoria,
      descricao: current.descricao || ''
    });
    this.isEditDesejoModalOpen.set(true);
  }

  closeEditDesejoModal(): void {
    this.isEditDesejoModalOpen.set(false);
    this.selectedFile.set(null);
    this.previewUrl.set(null);
    this.formDesejo.reset();
  }

  onFileSelected(event: any): void {
    const file = event.target?.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB.');
        return;
      }
      this.selectedFile.set(file);
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  async onSaveDesejo(): Promise<void> {
    if (this.formDesejo.invalid) {
      this.formDesejo.markAllAsTouched();
      return;
    }

    const id = this.desejoId();
    const current = this.desejo();
    if (!id || !current) return;

    this.isSaving.set(true);
    try {
      const raw = this.formDesejo.getRawValue();
      const payload: Partial<Desejo> = {
        nome: raw.nome.trim(),
        categoria: raw.categoria as DesejoCategoria,
        descricao: raw.descricao?.trim() || '',
        imagemUrl: this.previewUrl() ? current.imagemUrl : '',
        imagemPath: this.previewUrl() ? current.imagemPath : ''
      };

      await this.desejoService.updateDesejo(id, payload, this.selectedFile());
      this.closeEditDesejoModal();
      await this.loadDesejo(id);
    } catch (error) {
      console.error('Erro ao atualizar dados do produto:', error);
      alert('Erro ao atualizar produto.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async onDeleteDesejo(): Promise<void> {
    const current = this.desejo();
    const id = this.desejoId();
    if (!current || !id) return;

    if (confirm(`Tem certeza que deseja excluir "${current.nome}" e todos os links registrados?`)) {
      try {
        await this.desejoService.deleteDesejo(id);
        this.router.navigate(['/desejos']);
      } catch (error) {
        console.error('Erro ao excluir desejo:', error);
        alert('Não foi possível excluir o produto.');
      }
    }
  }

  formatMoedaDisplay(valor: number | null | undefined): string {
    if (!this.showValues()) return 'R$ •••••';
    if (valor == null) return 'R$ 0,00';
    return formatarMoeda(valor);
  }
}
