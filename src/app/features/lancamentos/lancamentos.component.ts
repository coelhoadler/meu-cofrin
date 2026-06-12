import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ContaService, Conta } from '../../core/services/conta.service';
import { CategoriaService, Categoria } from '../../core/services/categoria.service';

@Component({
  selector: 'app-lancamentos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './lancamentos.component.html',
})
export class LancamentosComponent implements OnInit {
  private contaService = inject(ContaService);
  private categoriaService = inject(CategoriaService);

  meses = [
    { valor: '01', nome: 'Janeiro' },
    { valor: '02', nome: 'Fevereiro' },
    { valor: '03', nome: 'Março' },
    { valor: '04', nome: 'Abril' },
    { valor: '05', nome: 'Maio' },
    { valor: '06', nome: 'Junho' },
    { valor: '07', nome: 'Julho' },
    { valor: '08', nome: 'Agosto' },
    { valor: '09', nome: 'Setembro' },
    { valor: '10', nome: 'Outubro' },
    { valor: '11', nome: 'Novembro' },
    { valor: '12', nome: 'Dezembro' },
  ];

  anos: string[] = [];

  // Filtros
  mesFiltro = signal<string>(new Date().toISOString().slice(5, 7));
  anoFiltro = signal<string>(new Date().getFullYear().toString());
  tipoFiltro = signal<string>('Todos');
  categoriaFiltro = signal<string>('Todos');

  // Dados
  contas = signal<Conta[]>([]);
  categorias = signal<Categoria[]>([]);
  isLoading = signal<boolean>(false);

  // Computeds
  contasFiltradas = computed(() => {
    let filtradas = this.contas();

    if (this.tipoFiltro() !== 'Todos') {
      filtradas = filtradas.filter(c => c.tipo === this.tipoFiltro());
    }

    if (this.categoriaFiltro() !== 'Todos') {
      filtradas = filtradas.filter(c => c.categoria === this.categoriaFiltro());
    }

    return filtradas;
  });

  totalReceitas = computed(() => {
    return this.contasFiltradas()
      .filter(c => c.tipo === 'Receita')
      .reduce((acc, c) => acc + this.parseFloatValor(c.valor), 0);
  });

  totalDespesas = computed(() => {
    return this.contasFiltradas()
      .filter(c => c.tipo === 'Despesa')
      .reduce((acc, c) => acc + this.parseFloatValor(c.valor), 0);
  });

  saldo = computed(() => {
    return this.totalReceitas() - this.totalDespesas();
  });

  ngOnInit() {
    this.gerarAnos();
    this.carregarCategorias();
    this.carregarDados();
  }

  gerarAnos() {
    const anoAtual = new Date().getFullYear();
    for (let i = anoAtual - 2; i <= anoAtual + 5; i++) {
      this.anos.push(i.toString());
    }
  }

  async carregarCategorias() {
    try {
      const cats = await this.categoriaService.getCategorias();
      this.categorias.set(cats);
    } catch (e) {
      console.error('Erro ao carregar categorias', e);
    }
  }

  async carregarDados() {
    this.isLoading.set(true);
    const mesReferencia = `${this.anoFiltro()}-${this.mesFiltro()}`;
    try {
      const contas = await this.contaService.getContasByMesReferencia(mesReferencia);
      contas.sort((a, b) => a.diaVencimento - b.diaVencimento);
      this.contas.set(contas);
    } catch (e) {
      console.error('Erro ao carregar contas', e);
    } finally {
      this.isLoading.set(false);
    }
  }

  onFiltroMesAnoChange() {
    this.carregarDados();
  }

  limparFiltros() {
    this.mesFiltro.set(new Date().toISOString().slice(5, 7));
    this.anoFiltro.set(new Date().getFullYear().toString());
    this.tipoFiltro.set('Todos');
    this.categoriaFiltro.set('Todos');
    this.carregarDados();
  }

  parseFloatValor(valor: any): number {
    if (!valor) return 0;
    if (typeof valor === 'number') return valor;
    const str = valor.toString();
    const cleanValue = str.replace(/\./g, '').replace(',', '.').replace('R$', '');
    const numValue = parseFloat(cleanValue);
    return isNaN(numValue) ? 0 : numValue;
  }

  formatarMoeda(valor: number): string {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}
