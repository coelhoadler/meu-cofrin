import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { FormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { AuthService } from '../../core/auth/auth.service';
import { Conta, ContaService } from '../../core/services/conta.service';
import { MessagingService } from '../../core/services/messaging.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, CommonModule, BaseChartDirective, ButtonModule, DatePickerModule, FormsModule, CheckboxModule, DialogModule],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  currentDate = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date());

  private contaService = inject(ContaService);
  private authService = inject(AuthService);
  private messagingService = inject(MessagingService);

  lancamentos = signal<Conta[]>([]);
  isLoading = signal(true);

  selectedConta = signal<Conta | null>(null);

  totalDespesas = signal('R$ 0,00');
  totalReceitas = signal('R$ 0,00');
  saldoMes = signal('R$ 0,00');
  totalAPagar = signal('R$ 0,00');
  totalPago = signal('R$ 0,00');
  statusConta = signal('');

  // Replicar Mês states
  showReplicarModal = signal(false);
  mesOrigem = signal<Date | null>(null);
  mesDestino = signal<Date | null>(null);
  contasParaReplicar = signal<(Conta & { existsInDestino?: boolean, selected?: boolean })[]>([]);
  isLoadingReplicacao = signal(false);

  // Modal Imagem states
  showImageModal = signal(false);
  selectedImageConta = signal<Conta | null>(null);

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
          font: {
            size: 12
          }
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
      legend: {
        display: false // Let's hide the default legend since the HTML already has a custom legend below
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#f1f5f9', // slate-100
        },
        ticks: {
          color: '#94a3b8', // slate-400
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#94a3b8', // slate-400
        }
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
      if (user) {
        this.authService.saveUserProfile(user);
        this.loadLancamentos();
        this.loadResumoMes();
        this.loadResumoGrafico();

        // Pede permissão para notificações e salva o token (ideal ser chamado após login)
        this.messagingService.requestPermissionAndGetToken();
        this.messagingService.listenForMessages();
      }
    });
  }

  async loadLancamentos() {
    this.isLoading.set(true);
    try {
      const recentes = await this.contaService.getLancamentosRecentes();
      this.lancamentos.set(recentes);
    } catch (error) {
      console.error('Erro ao buscar lançamentos recentes:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadResumoMes() {
    try {
      const date = new Date();
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const mesRef = `${year}-${month}`;

      const contasDoMes = await this.contaService.getContasByMesReferencia(mesRef);

      let somaDespesas = 0;
      let somaReceitas = 0;
      let somaAPagar = 0;
      const chartReceitasMap = new Map<string, number>();
      const chartDespesasMap = new Map<string, number>();

      contasDoMes.forEach(c => {
        if (c.valor) {
          const cleanValue = c.valor.replace(/\./g, '').replace(',', '.').replace('R$', '');
          const numValue = parseFloat(cleanValue);
          if (!isNaN(numValue)) {
            if (c.tipo === 'Despesa') {
              somaDespesas += numValue;
              if (!c.statusPago) {
                somaAPagar += numValue;
              }
              const label = `D - ${c.categoria || 'Outros'}`;
              chartDespesasMap.set(label, (chartDespesasMap.get(label) || 0) + numValue);
            }
            if (c.tipo === 'Receita') {
              somaReceitas += numValue;
              const label = `R - ${c.categoria || 'Outros'}`;
              chartReceitasMap.set(label, (chartReceitasMap.get(label) || 0) + numValue);
            }
          }
        }
      });

      // Pegar top 3 de cada
      const topReceitas = Array.from(chartReceitasMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

      const topDespesas = Array.from(chartDespesasMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

      const topData = [...topReceitas, ...topDespesas];

      const labels = topData.map(item => item[0]);
      const data = topData.map(item => item[1]);
      const colors = [
        '#421b7b', '#10b981', '#f59e0b', '#f43f5e', '#3b82f6',
        '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16'
      ];

      // Update chart with deep copy to trigger change detection in ng2-charts
      this.pieChartData.set({
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: labels.map((_, i) => colors[i % colors.length]),
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 4
        }]
      });

      const saldo = somaReceitas - somaDespesas;

      const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
      this.totalDespesas.set(formatter.format(somaDespesas));
      this.totalReceitas.set(formatter.format(somaReceitas));
      this.saldoMes.set(formatter.format(saldo));
      this.totalAPagar.set(formatter.format(somaAPagar));
      this.totalPago.set(formatter.format(somaDespesas - somaAPagar));

    } catch (error) {
      console.error('Erro ao buscar resumo do mês:', error);
    }
  }

  async loadResumoGrafico() {
    try {
      // Busca os últimos 6 meses (ordenados do mais recente para o mais antigo)
      const resumos = await this.contaService.getResumosMensais(6);

      // Inverte para ficar cronológico no gráfico (ex: Jan, Fev, Mar...)
      resumos.reverse();

      const labels: string[] = [];
      const dataReceitas: number[] = [];
      const dataDespesas: number[] = [];
      const dataSaldos: number[] = [];

      resumos.forEach(resumo => {
        // Converter "2026-06" para "Jun 26" ou "Jun"
        const [anoStr, mesStr] = resumo.id.split('-');
        const date = new Date(parseInt(anoStr), parseInt(mesStr) - 1, 1);

        let mesNome = new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(date).replace('.', '');
        mesNome = mesNome.charAt(0).toUpperCase() + mesNome.slice(1);

        labels.push(mesNome);
        dataReceitas.push(resumo.totalReceitas || 0);
        dataDespesas.push(resumo.totalDespesas || 0);
        dataSaldos.push(resumo.saldo || 0);
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

  openImageModal(event: Event, conta: Conta) {
    event.stopPropagation();
    this.selectedImageConta.set(conta);
    this.showImageModal.set(true);
  }

  formatDataVencimento(conta: Conta): string {
    if (!conta.mesReferencia) return `${conta.diaVencimento}`;
    const [ano, mes] = conta.mesReferencia.split('-');
    const dia = conta.diaVencimento.toString().padStart(2, '0');

    const date = new Date(parseInt(ano), parseInt(mes) - 1, conta.diaVencimento);
    const mesNome = new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(date).replace('.', '');

    return `${dia} de ${mesNome}`?.toUpperCase();
  }

  closeModal() {
    this.selectedConta.set(null);
  }

  getRowClass(item: Conta): string {
    if (item.statusPago || item.tipo === 'Receita') {
      return 'hover:bg-slate-50 dark:hover:bg-slate-800/40';
    }

    if (item.mesReferencia && item.diaVencimento) {
      const diffDays = this.calcularDiffDataVencimento(item);

      if (diffDays <= 0) {
        // this.statusConta.set('vencido');
        return 'bg-red-200 hover:bg-red-300 dark:bg-rose-900/40 dark:hover:bg-rose-900/60';
      } else if (diffDays <= 5) {
        // this.statusConta.set('prestes_vencer');
        return 'bg-yellow-100 hover:bg-yellow-200 dark:bg-[#7941dc]/20 dark:hover:bg-[#7941dc]/40';
      }
    }

    return 'hover:bg-slate-50 dark:hover:bg-slate-800/40';
  }

  async deleteLancamento(id: string | undefined) {
    if (!id) return;

    if (window.confirm('Tem certeza que deseja deletar este lançamento? Esta ação não pode ser desfeita.')) {
      try {
        await this.contaService.deleteConta(id);
        this.closeModal();
        // Recarregar os lançamentos após deletar
        await this.loadLancamentos();
        await this.loadResumoMes();
        await this.loadResumoGrafico();
      } catch (error) {
        console.error('Erro ao deletar lançamento:', error);
        alert('Erro ao deletar lançamento. Tente novamente.');
      }
    }
  }

  public calcularDiffDataVencimento(item: Conta): number {
    const [ano, mes] = item.mesReferencia.split('-');
    const dataVencimento = new Date(parseInt(ano), parseInt(mes) - 1, item.diaVencimento);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const diffTime = dataVencimento.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
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
    const hoje = new Date();
    const proximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);

    this.mesOrigem.set(hoje);
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
      const mesOrigemStr = `${origem.getFullYear()}-${String(origem.getMonth() + 1).padStart(2, '0')}`;
      const mesDestinoStr = `${destino.getFullYear()}-${String(destino.getMonth() + 1).padStart(2, '0')}`;

      const contasOrigem = await this.contaService.getContasByMesReferencia(mesOrigemStr);
      let contasDestino: Conta[] = [];

      if (mesOrigemStr !== mesDestinoStr) {
        contasDestino = await this.contaService.getContasByMesReferencia(mesDestinoStr);
      }

      // Filtrar apenas as recorrentes
      const contasRecorrentes = contasOrigem.filter(c => c.isRecorrente);

      const items = contasRecorrentes.map(conta => {
        // Checar se já existe no destino (mesmo nome e vencimento)
        const exists = mesOrigemStr === mesDestinoStr || contasDestino.some(d => d.nome === conta.nome && d.diaVencimento === conta.diaVencimento);
        return {
          ...conta,
          existsInDestino: exists,
          selected: !exists // Só seleciona por padrão se não existe no destino
        };
      }).sort((a, b) => a.diaVencimento - b.diaVencimento);

      this.contasParaReplicar.set(items);
    } catch (error) {
      console.error('Erro ao carregar contas para replicar:', error);
    } finally {
      this.isLoadingReplicacao.set(false);
    }
  }

  onMesReplicacaoChange() {
    this.loadContasParaReplicar();
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

  toggleContaSelection(conta: Conta & { existsInDestino?: boolean, selected?: boolean }) {
    if (conta.existsInDestino) return; // Não pode selecionar se já existe

    const contas = this.contasParaReplicar();
    const updated = contas.map(c => c.id === conta.id ? { ...c, selected: !c.selected } : c);
    this.contasParaReplicar.set(updated);
  }

  get selectedContasCount(): number {
    return this.contasParaReplicar().filter(c => c.selected).length;
  }

  formatDateName(date: Date | null): string {
    if (!date) return '';
    const mes = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(date);
    const ano = date.getFullYear();
    return `${mes} de ${ano}`;
  }

  async confirmReplicacao() {
    const destino = this.mesDestino();
    if (!destino) return;

    const contasSelecionadas = this.contasParaReplicar().filter(c => c.selected);
    if (contasSelecionadas.length === 0) return;

    this.isLoadingReplicacao.set(true);
    try {
      const mesDestinoStr = `${destino.getFullYear()}-${String(destino.getMonth() + 1).padStart(2, '0')}`;

      const promises = contasSelecionadas.map(conta => {
        const novaConta: any = { ...conta };
        delete novaConta.id;
        delete novaConta.existsInDestino;
        delete novaConta.selected;

        novaConta.mesReferencia = mesDestinoStr;
        novaConta.statusPago = false;
        novaConta.dataPagamento = null;
        novaConta.reciboUrl = ''; // Não copia recibo? Provavelmente não.
        novaConta.valorAntigo = conta.valor;

        return this.contaService.addConta(novaConta);
      });

      await Promise.all(promises);

      this.closeReplicarModal();

      // Recarregar os dados do dashboard se o destino for o mês atual
      const date = new Date();
      const currentMesRef = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (mesDestinoStr === currentMesRef) {
        await this.loadLancamentos();
        await this.loadResumoMes();
      }
      await this.loadResumoGrafico();

    } catch (error) {
      console.error('Erro ao replicar contas:', error);
    } finally {
      this.isLoadingReplicacao.set(false);
    }
  }

  async marcarComoPaga(id: string | undefined) {
    if (!id) return;

    try {
      await this.contaService.marcarComoPaga(id);

      this.closeModal();
      // Recarregar os lançamentos após deletar
      await this.loadLancamentos();
      await this.loadResumoMes();
      await this.loadResumoGrafico();
    } catch (error) {
      console.error('Erro ao deletar lançamento:', error);
      alert('Erro ao deletar lançamento. Tente novamente.');
    }
  }

}
