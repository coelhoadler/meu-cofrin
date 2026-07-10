import { Component, OnInit, computed, inject, signal, effect } from '@angular/core';
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

  constructor() {
    const savedFiltros = localStorage.getItem('lancamentosFiltros');
    if (savedFiltros) {
      try {
        const parsed = JSON.parse(savedFiltros);
        if (parsed.tipoFiltro) this.tipoFiltro.set(parsed.tipoFiltro);
        if (parsed.categoriaFiltro) this.categoriaFiltro.set(parsed.categoriaFiltro);
        if (parsed.nomeFiltro !== undefined) this.nomeFiltro.set(parsed.nomeFiltro);
        if (parsed.somentePagos !== undefined) this.somentePagos.set(parsed.somentePagos);
        if (parsed.somentePendentes !== undefined) this.somentePendentes.set(parsed.somentePendentes);
        if (parsed.isBuscaGlobal !== undefined) this.isBuscaGlobal.set(parsed.isBuscaGlobal);
        if (parsed.dataRangeFiltro) {
          const [start, end] = parsed.dataRangeFiltro;
          this.dataRangeFiltro.set([start ? new Date(start) : null, end ? new Date(end) : null] as any);
        }
      } catch (e) {
        console.error('Erro ao recuperar filtros', e);
      }
    }

    effect(() => {
      const filtros = {
        tipoFiltro: this.tipoFiltro(),
        categoriaFiltro: this.categoriaFiltro(),
        nomeFiltro: this.nomeFiltro(),
        dataRangeFiltro: this.dataRangeFiltro(),
        somentePagos: this.somentePagos(),
        somentePendentes: this.somentePendentes(),
        isBuscaGlobal: this.isBuscaGlobal()
      };
      localStorage.setItem('lancamentosFiltros', JSON.stringify(filtros));
    });
  }

  // Filtros
  tipoFiltro = signal<string>('Todos');
  categoriaFiltro = signal<string>('Todos');
  nomeFiltro = signal<string>('');
  dataRangeFiltro = signal<Date[] | null>(null);
  somentePagos = signal<boolean>(false);
  somentePendentes = signal<boolean>(false);
  isBuscaGlobal = signal<boolean>(false);

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

    if (this.somentePagos()) {
      filtradas = filtradas.filter(c => c.statusPago === true);
    } else if (this.somentePendentes()) {
      filtradas = filtradas.filter(c => c.statusPago === false);
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
    this.carregarCategorias();

    if (this.isBuscaGlobal() && this.nomeFiltro().trim()) {
      this.executarPesquisaGlobal();
    } else {
      if (!this.dataRangeFiltro()) {
        this.atualizarDateRange();
      }
      this.carregarDados();
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
    this.isBuscaGlobal.set(false);
    this.isLoading.set(true);
    try {
      let contas: Conta[] = [];
      const range = this.dataRangeFiltro();
      let ano = new Date().getFullYear().toString();
      
      if (range && range[0]) {
        ano = range[0].getFullYear().toString();
      }

      contas = await this.contaService.getContasByAno(ano, 500);
      contas.sort((a, b) => a.diaVencimento - b.diaVencimento);
      this.contas.set(contas);
    } catch (e) {
      console.error('Erro ao carregar contas', e);
    } finally {
      this.isLoading.set(false);
    }
  }

  atualizarDateRange() {
    const dataAtual = new Date();
    const ano = dataAtual.getFullYear();
    const mes = dataAtual.getMonth();
    const inicio = new Date(ano, mes, 1);
    const fim = new Date(ano, mes + 1, 0);

    this.dataRangeFiltro.set([inicio, fim]);
  }

  onDataRangeChange(event: any) {
    this.dataRangeFiltro.set(event);
    if (event && event[0] && event[1]) {
      this.carregarDados();
    }
  }

  limparFiltros() {
    localStorage.removeItem('lancamentosFiltros');
    this.tipoFiltro.set('Todos');
    this.categoriaFiltro.set('Todos');
    this.nomeFiltro.set('');
    this.somentePagos.set(false);
    this.somentePendentes.set(false);
    this.isBuscaGlobal.set(false);
    this.atualizarDateRange();
    this.carregarDados();
  }

  async pesquisaGlobal() {
    const termo = this.nomeFiltro().trim();
    if (!termo) {
      this.limparFiltros();
      return;
    }

    this.tipoFiltro.set('Todos');
    this.categoriaFiltro.set('Todos');
    this.dataRangeFiltro.set(null);
    this.somentePagos.set(false);
    this.somentePendentes.set(false);
    this.isBuscaGlobal.set(true);

    await this.executarPesquisaGlobal();
  }

  async executarPesquisaGlobal() {
    const termo = this.nomeFiltro().trim();
    this.isLoading.set(true);
    try {
      const contas = await this.contaService.buscarContasPorNome(termo);
      contas.sort((a, b) => {
        const dateA = new Date(`${a.mesReferencia}-${String(a.diaVencimento).padStart(2, '0')}`);
        const dateB = new Date(`${b.mesReferencia}-${String(b.diaVencimento).padStart(2, '0')}`);
        return dateB.getTime() - dateA.getTime();
      });
      this.contas.set(contas);
    } catch (e) {
      console.error('Erro na pesquisa global', e);
    } finally {
      this.isLoading.set(false);
    }
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
