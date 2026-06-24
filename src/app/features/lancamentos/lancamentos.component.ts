import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { ContaService, Conta } from '../../core/services/conta.service';
import { CategoriaService, Categoria } from '../../core/services/categoria.service';

@Component({
  selector: 'app-lancamentos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DatePickerModule, SelectModule],
  templateUrl: './lancamentos.component.html',
})
export class LancamentosComponent implements OnInit {
  private contaService = inject(ContaService);
  private categoriaService = inject(CategoriaService);

  meses = [
    { valor: 'Todos', nome: 'Todos' },
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
  mesFiltro = signal<string>('Todos');
  anoFiltro = signal<string>(new Date().getFullYear().toString());
  tipoFiltro = signal<string>('Todos');
  categoriaFiltro = signal<string>('Todos');
  nomeFiltro = signal<string>('');
  dataRangeFiltro = signal<Date[] | null>(null);

  // Dados
  contas = signal<Conta[]>([]);
  categorias = signal<Categoria[]>([]);
  isLoading = signal<boolean>(false);

  tiposOptions = [
    { label: 'Todos', value: 'Todos' },
    { label: 'Receitas', value: 'Receita' },
    { label: 'Despesas', value: 'Despesa' }
  ];

  categoriasOptions = computed(() => {
    return [
      { label: 'Todas', value: 'Todos' },
      ...this.categorias().map(c => ({ label: c.nome, value: c.nome }))
    ];
  });

  // Computeds
  contasFiltradas = computed(() => {
    let filtradas = this.contas();

    if (this.tipoFiltro() !== 'Todos') {
      filtradas = filtradas.filter(c => c.tipo === this.tipoFiltro());
    }

    if (this.categoriaFiltro() !== 'Todos') {
      filtradas = filtradas.filter(c => c.categoria === this.categoriaFiltro());
    }

    if (this.nomeFiltro().trim()) {
      const termo = this.nomeFiltro().toLowerCase().trim();
      filtradas = filtradas.filter(c => c.nome.toLowerCase().includes(termo));
    }

    const range = this.dataRangeFiltro();
    if (range && range.length === 2 && range[0] && range[1]) {
      const inicio = range[0];
      const fim = range[1];
      
      filtradas = filtradas.filter(c => {
        // Criar data baseada no mesReferencia e diaVencimento
        const [ano, mes] = c.mesReferencia.split('-');
        const dataVencimento = new Date(parseInt(ano), parseInt(mes) - 1, c.diaVencimento);
        
        // Zera as horas para comparar apenas datas
        const dataVencZera = new Date(dataVencimento.getFullYear(), dataVencimento.getMonth(), dataVencimento.getDate());
        const inicioZera = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
        const fimZera = new Date(fim.getFullYear(), fim.getMonth(), fim.getDate());

        return dataVencZera >= inicioZera && dataVencZera <= fimZera;
      });
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
    this.atualizarDateRange();
    this.carregarDados();
  }

  gerarAnos() {
    const anoAtual = new Date().getFullYear().toString();
    this.anos = [anoAtual];
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
    try {
      let contas: Conta[] = [];
      if (this.mesFiltro() === 'Todos') {
        contas = await this.contaService.getContasByAno(this.anoFiltro(), 50);
      } else {
        const mesReferencia = `${this.anoFiltro()}-${this.mesFiltro()}`;
        contas = await this.contaService.getContasByMesReferencia(mesReferencia);
      }
      contas.sort((a, b) => a.diaVencimento - b.diaVencimento);
      this.contas.set(contas);
    } catch (e) {
      console.error('Erro ao carregar contas', e);
    } finally {
      this.isLoading.set(false);
    }
  }

  atualizarDateRange() {
    const ano = parseInt(this.anoFiltro());
    let inicio: Date, fim: Date;

    if (this.mesFiltro() === 'Todos') {
      inicio = new Date(ano, 0, 1);
      fim = new Date(ano, 11, 31);
    } else {
      const mes = parseInt(this.mesFiltro()) - 1;
      inicio = new Date(ano, mes, 1);
      fim = new Date(ano, mes + 1, 0);
    }
    this.dataRangeFiltro.set([inicio, fim]);
  }

  onFiltroMesAnoChange() {
    this.atualizarDateRange();
    this.carregarDados();
  }

  limparFiltros() {
    this.mesFiltro.set('Todos');
    this.anoFiltro.set(new Date().getFullYear().toString());
    this.tipoFiltro.set('Todos');
    this.categoriaFiltro.set('Todos');
    this.nomeFiltro.set('');
    this.atualizarDateRange();
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
