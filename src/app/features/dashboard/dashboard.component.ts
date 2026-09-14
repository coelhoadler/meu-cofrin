import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, AfterViewInit, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChartConfiguration } from 'chart.js';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../core/auth/auth.service';
import { Conta, ContaService } from '../../core/services/conta.service';
import { MessagingService } from '../../core/services/messaging.service';
import { TourService } from '../../core/services/tour.service';
import { LayoutService } from '../../core/services/layout.service';
import { UserPreferencesService } from '../../core/services/user-preferences.service';
import { Variacao } from '../../core/models/resumo-mensal.model';
import { formatDataVencimento, formatDataPagamento } from '../../core/utils/formatacao.utils';

import { FinanceiroCalculoService } from './services/financeiro-calculo.service';
import { ReplicarMesService, ContaReplicavel } from './services/replicar-mes.service';

import { ResumoCardsComponent } from './components/resumo-cards/resumo-cards.component';
import { GraficoBarrasComponent } from './components/grafico-barras/grafico-barras.component';
import { GraficoPizzaComponent } from './components/grafico-pizza/grafico-pizza.component';
import { DetalhesContaModalComponent } from './components/detalhes-conta-modal/detalhes-conta-modal.component';
import { ReciboModalComponent } from './components/recibo-modal/recibo-modal.component';
import { ReplicarMesModalComponent } from './components/replicar-mes-modal/replicar-mes-modal.component';

export type { Variacao };

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ButtonModule,
    DatePickerModule,
    FormsModule,
    ResumoCardsComponent,
    GraficoBarrasComponent,
    GraficoPizzaComponent,
    DetalhesContaModalComponent,
    ReciboModalComponent,
    ReplicarMesModalComponent
  ],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements AfterViewInit {
  private contaService = inject(ContaService);
  private authService = inject(AuthService);
  private messagingService = inject(MessagingService);
  private tourService = inject(TourService);
  public layoutService = inject(LayoutService);
  private userPreferences = inject(UserPreferencesService);
  private calculoService = inject(FinanceiroCalculoService);
  private replicarMesService = inject(ReplicarMesService);

  showValues = this.userPreferences.showValues;

  selectedDate = signal<Date>((() => {
    const saved = localStorage.getItem('dashboard_selected_month');
    if (saved) {
      const parsed = new Date(saved);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  })());

  selectedMesRef = computed(() => {
    const d = this.selectedDate();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  isCurrentMonth = computed(() => {
    const d = this.selectedDate();
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  selectedMesExtenso = computed(() => {
    const d = this.selectedDate();
    const str = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(d);
    return str.charAt(0).toUpperCase() + str.slice(1);
  });

  lancamentos = signal<Conta[]>([]);
  isLoading = signal(true);

  selectedConta = signal<Conta | null>(null);

  totalDespesas = signal('R$ 0,00');
  totalReceitas = signal('R$ 0,00');
  saldoMes = signal('R$ 0,00');
  totalAPagar = signal('R$ 0,00');
  totalPago = signal('R$ 0,00');

  variacaoReceitas = signal<Variacao>(null);
  variacaoDespesas = signal<Variacao>(null);
  variacaoSaldo = signal<Variacao>(null);

  // Replicar Mês states
  showReplicarModal = signal(false);
  mesOrigem = signal<Date | null>(null);
  mesDestino = signal<Date | null>(null);
  contasParaReplicar = signal<ContaReplicavel[]>([]);
  isLoadingReplicacao = signal(false);

  // Modal Imagem states
  showImageModal = signal(false);
  selectedImageConta = signal<Conta | null>(null);
  isImageLoading = signal(true);

  pieChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'left',
        align: 'center',
        labels: {
          usePointStyle: true,
          pointStyle: 'rectRounded',
          color: '#64748b',
          font: { size: 12 }
        }
      }
    }
  };

  pieChartData = signal<ChartConfiguration<'pie'>['data']>({
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [],
      borderWidth: 0
    }]
  });

  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
        ticks: { color: '#94a3b8' }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8' }
      }
    }
  };

  barChartData = signal<ChartConfiguration<'bar'>['data']>({
    labels: [],
    datasets: []
  });

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      const mesRef = this.selectedMesRef();
      if (user && mesRef) {
        this.authService.saveUserProfile(user);
        this.loadLancamentos(mesRef);
        this.loadResumoMes(mesRef);
        this.loadResumoGrafico();

        this.messagingService.requestPermissionAndGetToken();
        this.messagingService.listenForMessages();
      }
    });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.tourService.startDashboardTour(false);
    }, 1200);
  }

  previousMonth() {
    const current = this.selectedDate();
    const prev = new Date(current.getFullYear(), current.getMonth() - 1, 1);
    this.selectedDate.set(prev);
    localStorage.setItem('dashboard_selected_month', prev.toISOString());
  }

  nextMonth() {
    const current = this.selectedDate();
    const next = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    this.selectedDate.set(next);
    localStorage.setItem('dashboard_selected_month', next.toISOString());
  }

  goToCurrentMonth() {
    this.selectedDate.set(new Date());
    localStorage.removeItem('dashboard_selected_month');
  }

  onMonthSelect(date: Date) {
    if (date) {
      const newDate = new Date(date.getFullYear(), date.getMonth(), 1);
      this.selectedDate.set(newDate);
      localStorage.setItem('dashboard_selected_month', newDate.toISOString());
    }
  }

  toggleVisibility() {
    this.userPreferences.toggleValuesVisibility();
  }

  async loadLancamentos(mesRef: string = this.selectedMesRef()) {
    this.isLoading.set(true);
    try {
      const items = await this.contaService.getContasByMesReferencia(mesRef);
      items.sort((a, b) => {
        if (a.statusPago === b.statusPago) {
          return a.diaVencimento - b.diaVencimento;
        }
        return a.statusPago ? 1 : -1;
      });
      this.lancamentos.set(items);
    } catch (error) {
      console.error('Erro ao buscar lançamentos do mês:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadResumoMes(mesRef: string = this.selectedMesRef()) {
    try {
      const contasDoMes = await this.contaService.getContasByMesReferencia(mesRef);
      const resumo = this.calculoService.calcularResumoDoMes(contasDoMes);

      const topData = [...resumo.topReceitas, ...resumo.topDespesas];
      const labels = topData.map(item => item[0]);
      const data = topData.map(item => item[1]);
      const colors = [
        '#421b7b', '#10b981', '#f59e0b', '#f43f5e', '#3b82f6',
        '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16'
      ];

      this.pieChartData.set({
        labels,
        datasets: [{
          data,
          backgroundColor: labels.map((_, i) => colors[i % colors.length]),
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 4
        }]
      });

      const saldo = resumo.somaReceitas - resumo.somaDespesas;
      const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
      this.totalDespesas.set(formatter.format(resumo.somaDespesas));
      this.totalReceitas.set(formatter.format(resumo.somaReceitas));
      this.saldoMes.set(formatter.format(saldo));
      this.totalAPagar.set(formatter.format(resumo.somaAPagar));
      this.totalPago.set(formatter.format(resumo.somaDespesas - resumo.somaAPagar));

      const [ano, mes] = mesRef.split('-');
      const currentDate = new Date(parseInt(ano), parseInt(mes) - 1, 1);
      const prevDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const prevMesRef = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

      const prevResumo = await this.contaService.getResumoMensalById(prevMesRef);
      if (prevResumo) {
        this.variacaoReceitas.set(this.calculoService.calcularVariacao(prevResumo.totalReceitas || 0, resumo.somaReceitas));
        this.variacaoDespesas.set(this.calculoService.calcularVariacao(prevResumo.totalDespesas || 0, resumo.somaDespesas));
        this.variacaoSaldo.set(this.calculoService.calcularVariacao(prevResumo.saldo || 0, saldo));
      } else {
        this.variacaoReceitas.set(null);
        this.variacaoDespesas.set(null);
        this.variacaoSaldo.set(null);
      }
    } catch (error) {
      console.error('Erro ao buscar resumo do mês:', error);
    }
  }

  async loadResumoGrafico() {
    try {
      const resumos = await this.contaService.getResumosMensais(6);
      resumos.reverse();

      const labels: string[] = [];
      const dataReceitas: number[] = [];
      const dataDespesas: number[] = [];
      const dataSaldos: number[] = [];

      resumos.forEach(r => {
        const [anoStr, mesStr] = r.id.split('-');
        const date = new Date(parseInt(anoStr), parseInt(mesStr) - 1, 1);

        let mesNome = new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(date).replace('.', '');
        mesNome = mesNome.charAt(0).toUpperCase() + mesNome.slice(1);

        labels.push(mesNome);
        dataReceitas.push(r.totalReceitas || 0);
        dataDespesas.push(r.totalDespesas || 0);
        dataSaldos.push(r.saldo || 0);
      });

      this.barChartData.set({
        labels,
        datasets: [
          {
            type: 'bar',
            data: dataReceitas,
            label: 'Receitas',
            backgroundColor: '#9d6bf3',
            borderRadius: 4,
            order: 1
          },
          {
            type: 'bar',
            data: dataDespesas,
            label: 'Despesas',
            backgroundColor: '#421b7b',
            borderRadius: 4,
            order: 1
          },
          {
            type: 'line',
            data: dataSaldos,
            label: 'Saldo',
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            borderWidth: 2,
            fill: false,
            tension: 0.3,
            order: 0
          }
        ] as any
      });
    } catch (error) {
      console.error('Erro ao buscar resumo gráfico:', error);
    }
  }

  openModal(conta: Conta) {
    this.selectedConta.set(conta);
  }

  closeModal() {
    this.selectedConta.set(null);
  }

  openImageModal(event: Event, conta: Conta) {
    event.stopPropagation();
    if (this.selectedImageConta()?.reciboUrl !== conta.reciboUrl) {
      this.isImageLoading.set(true);
    }
    this.selectedImageConta.set(conta);
    this.showImageModal.set(true);
  }

  onImageLoad() {
    this.isImageLoading.set(false);
  }

  onImageError() {
    console.error('Erro ao carregar a imagem do recibo.');
    this.isImageLoading.set(false);
  }

  formatDataVencimento = formatDataVencimento;
  formatDataPagamento = formatDataPagamento;

  getRowClass(item: Conta): string {
    if (item.statusPago || item.tipo === 'Receita') {
      return 'hover:bg-slate-50 dark:hover:bg-slate-800/40';
    }

    if (item.mesReferencia && item.diaVencimento) {
      const diffDays = this.calculoService.calcularDiffDataVencimento(item);
      if (diffDays <= 0) {
        return 'bg-red-200 hover:bg-red-300 dark:bg-rose-900/40 dark:hover:bg-rose-900/60';
      } else if (diffDays <= 5) {
        return 'bg-yellow-100 hover:bg-yellow-200 dark:bg-[#7941dc]/20 dark:hover:bg-[#7941dc]/40';
      }
    }

    return 'hover:bg-slate-50 dark:hover:bg-slate-800/40';
  }

  async deleteLancamento(id: string | undefined) {
    if (!id) return;

    try {
      const conta = await this.contaService.getContaById(id);
      if (!conta) return;

      const isParcelada = !!conta.parcelamentoId;
      const msg = isParcelada
        ? `Esta conta faz parte de um parcelamento (${conta.totalParcelas || '?'} parcelas). Deseja excluir TODAS as parcelas? Esta ação não pode ser desfeita.`
        : 'Tem certeza que deseja deletar este lançamento? Esta ação não pode ser desfeita.';

      if (window.confirm(msg)) {
        if (isParcelada) {
          await this.contaService.deleteContasByParcelamentoId(conta.parcelamentoId!);
        } else {
          await this.contaService.deleteConta(id);
        }
        this.closeModal();
        await this.loadLancamentos(this.selectedMesRef());
        await this.loadResumoMes(this.selectedMesRef());
        await this.loadResumoGrafico();
      }
    } catch (error) {
      console.error('Erro ao deletar lançamento:', error);
      alert('Erro ao deletar lançamento. Tente novamente.');
    }
  }

  async marcarComoPaga(id: string | undefined) {
    if (!id) return;

    try {
      await this.contaService.marcarComoPaga(id);
      this.closeModal();
      await this.loadLancamentos(this.selectedMesRef());
      await this.loadResumoMes(this.selectedMesRef());
      await this.loadResumoGrafico();
    } catch (error) {
      console.error('Erro ao marcar como paga:', error);
      alert('Erro ao atualizar lançamento. Tente novamente.');
    }
  }

  public greetingUser(): string {
    const data = new Date();
    const hora = data.getHours();
    const userName = this.authService.currentUser()?.displayName?.split(' ')[0] || '';

    if (hora < 12) {
      return `Bom dia, ${userName}!`;
    } else if (hora < 18) {
      return `Boa tarde, ${userName}!`;
    } else {
      return `Boa noite, ${userName}!`;
    }
  }

  // --- REPLICAR MÊS LOGIC ---
  openReplicarModal() {
    const selected = this.selectedDate();
    const proximoMes = new Date(selected.getFullYear(), selected.getMonth() + 1, 1);

    this.mesOrigem.set(selected);
    this.mesDestino.set(proximoMes);
    this.showReplicarModal.set(true);

    this.loadContasParaReplicar();
  }

  closeReplicarModal() {
    this.showReplicarModal.set(false);
    this.contasParaReplicar.set([]);
  }

  async loadContasParaReplicar() {
    const origem = this.mesOrigem();
    const destino = this.mesDestino();

    if (!origem || !destino) {
      this.contasParaReplicar.set([]);
      return;
    }

    this.isLoadingReplicacao.set(true);
    try {
      const items = await this.replicarMesService.loadContasParaReplicar(origem, destino);
      this.contasParaReplicar.set(items);
    } catch (error) {
      console.error('Erro ao carregar contas para replicar:', error);
    } finally {
      this.isLoadingReplicacao.set(false);
    }
  }

  get isAllSelected(): boolean {
    const validContas = this.contasParaReplicar().filter(c => !c.existsInDestino);
    if (validContas.length === 0) return false;
    return validContas.every(c => c.selected);
  }

  toggleAllSelection() {
    const newValue = !this.isAllSelected;
    const contas = this.contasParaReplicar();
    const updated = contas.map(c => c.existsInDestino ? c : { ...c, selected: newValue });
    this.contasParaReplicar.set(updated);
  }

  toggleContaSelection(conta: ContaReplicavel) {
    if (conta.existsInDestino) return;
    const contas = this.contasParaReplicar();
    const updated = contas.map(c => c.id === conta.id ? { ...c, selected: !c.selected } : c);
    this.contasParaReplicar.set(updated);
  }

  get selectedContasCount(): number {
    return this.contasParaReplicar().filter(c => c.selected).length;
  }

  async confirmReplicacao() {
    const destino = this.mesDestino();
    if (!destino) return;

    const contasSelecionadas = this.contasParaReplicar().filter(c => c.selected);
    if (contasSelecionadas.length === 0) return;

    this.isLoadingReplicacao.set(true);
    try {
      const mesDestinoStr = `${destino.getFullYear()}-${String(destino.getMonth() + 1).padStart(2, '0')}`;
      await this.replicarMesService.replicarContas(contasSelecionadas, mesDestinoStr);

      this.closeReplicarModal();

      if (mesDestinoStr === this.selectedMesRef()) {
        await this.loadLancamentos(this.selectedMesRef());
        await this.loadResumoMes(this.selectedMesRef());
      }
      await this.loadResumoGrafico();
    } catch (error) {
      console.error('Erro ao replicar contas:', error);
    } finally {
      this.isLoadingReplicacao.set(false);
    }
  }
}
