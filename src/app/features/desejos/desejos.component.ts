import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  ChangeDetectionStrategy
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DesejoService } from '../../core/services/desejo.service';
import {
  Desejo,
  DesejoCategoria,
  DESEJO_CATEGORIAS,
  DESEJO_CATEGORIA_ICONS
} from '../../core/models/desejo.model';
import { NavigationHistoryService } from '../../core/services/navigation-history.service';
import { formatarMoeda, formatarData } from '../../core/utils/formatacao.utils';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-desejos',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink, ProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './desejos.component.html'
})
export class DesejosComponent implements OnInit {
  private fb = inject(FormBuilder);
  private desejoService = inject(DesejoService);
  private router = inject(Router);
  public navigationHistory = inject(NavigationHistoryService);

  readonly categorias: DesejoCategoria[] = DESEJO_CATEGORIAS;
  readonly categoriaIcons = DESEJO_CATEGORIA_ICONS;
  readonly formatarData = formatarData;

  desejos = signal<Desejo[]>([]);
  isLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // Filtros
  filtroTexto = signal<string>('');
  filtroCategoria = signal<string>('Todas');

  // Máscara de privacidade
  showValues = signal<boolean>(localStorage.getItem('showValues') !== 'false');

  // Modal
  isModalOpen = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  editId = signal<string | null>(null);

  // Imagem
  selectedFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);
  currentImageUrl = signal<string | null>(null);
  currentImagePath = signal<string | null>(null);

  desejoForm = this.fb.group({
    nome: ['', [Validators.required, Validators.maxLength(100)]],
    categoria: ['Eletrônico' as DesejoCategoria, [Validators.required]],
    descricao: ['', [Validators.maxLength(400)]]
  });

  desejosFiltrados = computed(() => {
    const texto = this.filtroTexto().toLowerCase().trim();
    const cat = this.filtroCategoria();

    return this.desejos().filter(d => {
      const matchTexto =
        !texto ||
        d.nome.toLowerCase().includes(texto) ||
        (d.descricao && d.descricao.toLowerCase().includes(texto));

      const matchCategoria = cat === 'Todas' || d.categoria === cat;

      return matchTexto && matchCategoria;
    });
  });

  totalDesejos = computed(() => this.desejos().length);
  totalFiltrados = computed(() => this.desejosFiltrados().length);

  ngOnInit(): void {
    this.loadDesejos();
  }

  async loadDesejos(): Promise<void> {
    this.isLoading.set(true);
    try {
      const data = await this.desejoService.getDesejos();
      this.desejos.set(data);
    } catch (error) {
      console.error('Erro ao carregar desejos:', error);
      this.errorMessage.set('Não foi possível carregar seus desejos.');
    } finally {
      this.isLoading.set(false);
    }
  }

  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.filtroTexto.set(input.value);
  }

  setCategoria(cat: string): void {
    this.filtroCategoria.set(cat);
  }

  openNewModal(): void {
    this.isEditMode.set(false);
    this.editId.set(null);
    this.selectedFile.set(null);
    this.previewUrl.set(null);
    this.currentImageUrl.set(null);
    this.currentImagePath.set(null);
    this.errorMessage.set(null);
    this.desejoForm.reset({
      nome: '',
      categoria: 'Eletrônico',
      descricao: ''
    });
    this.isModalOpen.set(true);
  }

  openEditModal(desejo: Desejo, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.isEditMode.set(true);
    this.editId.set(desejo.id || null);
    this.selectedFile.set(null);
    this.currentImageUrl.set(desejo.imagemUrl || null);
    this.currentImagePath.set(desejo.imagemPath || null);
    this.previewUrl.set(desejo.imagemUrl || null);
    this.errorMessage.set(null);

    this.desejoForm.patchValue({
      nome: desejo.nome,
      categoria: desejo.categoria,
      descricao: desejo.descricao || ''
    });

    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.isEditMode.set(false);
    this.editId.set(null);
    this.selectedFile.set(null);
    this.previewUrl.set(null);
    this.currentImageUrl.set(null);
    this.currentImagePath.set(null);
    this.errorMessage.set(null);
    this.desejoForm.reset();
  }

  onFileSelected(event: any): void {
    const file = event.target?.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage.set('A imagem deve ter no máximo 5MB.');
        return;
      }
      this.selectedFile.set(file);
      this.errorMessage.set(null);
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.selectedFile.set(null);
    this.previewUrl.set(null);
    this.currentImageUrl.set(null);
  }

  async onSubmit(): Promise<void> {
    if (this.desejoForm.invalid) {
      this.desejoForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    try {
      const formVal = this.desejoForm.value;
      const nome = formVal.nome!.trim();
      const categoria = formVal.categoria as DesejoCategoria;
      const descricao = formVal.descricao?.trim() || '';

      if (this.isEditMode() && this.editId()) {
        const updatePayload: Partial<Desejo> = {
          nome,
          categoria,
          descricao,
          imagemUrl: this.currentImageUrl() || '',
          imagemPath: this.currentImagePath() || ''
        };
        await this.desejoService.updateDesejo(this.editId()!, updatePayload, this.selectedFile());
      } else {
        await this.desejoService.addDesejo(
          {
            nome,
            categoria,
            descricao,
            imagemUrl: '',
            imagemPath: ''
          },
          this.selectedFile()
        );
      }

      this.closeModal();
      await this.loadDesejos();
    } catch (error) {
      console.error('Erro ao salvar desejo:', error);
      this.errorMessage.set('Erro ao salvar o desejo. Tente novamente.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteDesejo(desejo: Desejo, event: Event): Promise<void> {
    event.stopPropagation();
    if (!desejo.id) return;

    if (confirm(`Tem certeza que deseja excluir o desejo "${desejo.nome}"?`)) {
      try {
        await this.desejoService.deleteDesejo(desejo.id);
        await this.loadDesejos();
      } catch (error) {
        console.error('Erro ao excluir desejo:', error);
        alert('Erro ao excluir o produto da sua lista de desejos.');
      }
    }
  }

  goToDetalhes(desejo: Desejo): void {
    if (desejo.id) {
      this.router.navigate(['/desejos', desejo.id]);
    }
  }

  formatPrecoDisplay(desejo: Desejo): string {
    if (!this.showValues()) {
      return 'R$ •••••';
    }

    if (desejo.menorPreco == null || desejo.maiorPreco == null) {
      return 'Sem preços registrados';
    }

    if (desejo.menorPreco === desejo.maiorPreco) {
      return formatarMoeda(desejo.menorPreco);
    }

    return `${formatarMoeda(desejo.menorPreco)} - ${formatarMoeda(desejo.maiorPreco)}`;
  }
}
