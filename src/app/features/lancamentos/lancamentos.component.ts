import { Component, OnInit, computed, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { ContaService, Conta } from '../../core/services/conta.service';
import { CategoriaService, Categoria } from '../../core/services/categoria.service';

export type VisaoModo = 'lista' | 'resumo';

export interface ItemResumoMensal {
  mesIndex: number;
  mesNome: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

export interface ResumoAnual {
  ano: number;
  meses: ItemResumoMensal[];
  totalReceitas: number;
  totalDespesas: number;
  saldoTotal: number;
}

const MESES_NOMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

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
        if (parsed.visaoModo !== undefined) this.visaoModo.set(parsed.visaoModo);
        if (parsed.resumoAno !== undefined) this.resumoAno.set(parsed.resumoAno);
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
        isBuscaGlobal: this.isBuscaGlobal(),
        visaoModo: this.visaoModo(),
        resumoAno: this.resumoAno()
      };
      localStorage.setItem('lancamentosFiltros', JSON.stringify(filtros));
    });
  }

  // Modos de Visão
  visaoModo = signal<VisaoModo>('lista');
  resumoAno = signal<number>(new Date().getFullYear());

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

  anosOptions = computed(() => {
    const currentYear = new Date().getFullYear();
    const anosSet = new Set<number>();
    anosSet.add(currentYear);
    for (let i = -5; i <= 2; i++) {
      anosSet.add(currentYear + i);
    }
    for (const conta of this.contas()) {
      if (conta.mesReferencia) {
        const yearNum = parseInt(conta.mesReferencia.split('-')[0]);
        if (!isNaN(yearNum)) anosSet.add(yearNum);
      }
    }
    return Array.from(anosSet)
      .sort((a, b) => b - a)
      .map(ano => ({ label: ano.toString(), value: ano }));
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
        const [ano, mes] = c.mesReferencia.split('-');
        const dataVencimento = new Date(parseInt(ano), parseInt(mes) - 1, c.diaVencimento);

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

  resumoConsolidado = computed<ResumoAnual>(() => {
    const ano = this.resumoAno();
    const todasContas = this.contas();
    const meses: ItemResumoMensal[] = [];

    let totalReceitasAno = 0;
    let totalDespesasAno = 0;

    for (let mesIndex = 0; mesIndex < 12; mesIndex++) {
      const mesStr = String(mesIndex + 1).padStart(2, '0');
      const mesRef = `${ano}-${mesStr}`;

      const contasDoMes = todasContas.filter(c => c.mesReferencia === mesRef);

      const receitas = contasDoMes
        .filter(c => c.tipo === 'Receita')
        .reduce((acc, c) => acc + this.parseFloatValor(c.valor), 0);

      const despesas = contasDoMes
        .filter(c => c.tipo === 'Despesa')
        .reduce((acc, c) => acc + this.parseFloatValor(c.valor), 0);

      const saldo = receitas - despesas;

      totalReceitasAno += receitas;
      totalDespesasAno += despesas;

      meses.push({
        mesIndex,
        mesNome: MESES_NOMES[mesIndex],
        receitas,
        despesas,
        saldo
      });
    }

    return {
      ano,
      meses,
      totalReceitas: totalReceitasAno,
      totalDespesas: totalDespesasAno,
      saldoTotal: totalReceitasAno - totalDespesasAno
    };
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
      let ano = this.resumoAno().toString();
      
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

  async carregarDadosPorAno(anoNum: number) {
    this.isBuscaGlobal.set(false);
    this.isLoading.set(true);
    try {
      const contas = await this.contaService.getContasByAno(anoNum.toString(), 500);
      contas.sort((a, b) => a.diaVencimento - b.diaVencimento);
      this.contas.set(contas);
    } catch (e) {
      console.error('Erro ao carregar contas por ano', e);
    } finally {
      this.isLoading.set(false);
    }
  }

  async setVisaoModo(modo: VisaoModo) {
    this.visaoModo.set(modo);
    if (modo === 'resumo') {
      await this.carregarDadosPorAno(this.resumoAno());
    }
  }

  async onResumoAnoChange(ano: number) {
    this.resumoAno.set(ano);
    await this.carregarDadosPorAno(ano);
  }

  async verMes(mesIndex: number) {
    const ano = this.resumoAno();
    const inicio = new Date(ano, mesIndex, 1);
    const fim = new Date(ano, mesIndex + 1, 0);

    this.dataRangeFiltro.set([inicio, fim]);
    this.visaoModo.set('lista');
    await this.carregarDadosPorAno(ano);
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

