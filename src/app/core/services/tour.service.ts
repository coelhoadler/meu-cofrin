import { Injectable } from '@angular/core';
import { driver, Driver, Config, DriveStep } from 'driver.js';

@Injectable({
  providedIn: 'root'
})
export class TourService {
  private activeDriver: Driver | null = null;
  private readonly TOUR_KEY = 'meu_cofrin_dashboard_tour_seen';

  /**
   * Inicia o tour interativo do Dashboard.
   * @param force Se verdadeiro, ignora se o usuário já fez o tour antes e força o início.
   */
  startDashboardTour(force: boolean = false): void {
    const hasSeenTour = localStorage.getItem(this.TOUR_KEY);
    if (hasSeenTour && !force) {
      return;
    }

    const steps: DriveStep[] = [
      {
        element: '#tour-btn-replicar-mes',
        popover: {
          title: '🔁 Replicar mês',
          description: 'Replique os lançamentos do mês anterior para o mês atual.',
          side: 'bottom',
          align: 'center'
        }
      },
      {
        element: '#tour-btn-nova-conta',
        popover: {
          title: '➕ Nova Conta / Lançamento',
          description: 'Cadastre rapidamente novas despesas ou receitas na sua conta.',
          side: 'left',
          align: 'center'
        }
      },
      {
        element: '#tour-saldo-card',
        popover: {
          title: '💰 Saldo do Mês',
          description: 'Acompanhe seu saldo total consolidado do mês atual em tempo real.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '#tour-receitas-card',
        popover: {
          title: '📈 Total de Receitas',
          description: 'Visualize todas as suas entradas de dinheiro confirmadas e pendentes.',
          side: 'bottom',
          align: 'center'
        }
      },
      {
        element: '#tour-despesas-card',
        popover: {
          title: '📉 Total de Despesas',
          description: 'Controle os gastos do mês e fique atento para não estourar seu orçamento.',
          side: 'bottom',
          align: 'center'
        }
      },
      {
        element: '#tour-grafico-resumo',
        popover: {
          title: '📊 Comparativo Financeiro',
          description: 'Compare graficamente a evolução das suas receitas e despesas ao longo do tempo.',
          side: 'top',
          align: 'center'
        }
      },
      {
        element: '#tour-dist-mes',
        popover: {
          title: '🍕 Distribuição do mês',
          description: 'Veja rapidamente a distribuição de receitas e despesas do mês.',
          side: 'top',
          align: 'center'
        }
      },
      {
        element: '#tour-lancamentos-recents',
        popover: {
          title: '📋 Lançamentos Recentes',
          description: 'Veja suas últimas movimentações financeiras, altere status de pagamento ou anexe comprovantes.',
          side: 'top',
          align: 'center'
        }
      }
    ];

    // Filtra passos garantindo que os elementos existam na tela atual (ex: visibilidade em mobile)
    const validSteps = steps.filter(step => {
      if (typeof step.element === 'string') {
        const el = document.querySelector(step.element);
        return !!el && el.getBoundingClientRect().width > 0;
      }
      return true;
    });

    if (validSteps.length === 0) {
      return;
    }

    const config: Config = {
      showProgress: true,
      animate: true,
      allowClose: true,
      overlayColor: '#0f172a',
      overlayOpacity: 0.75,
      stagePadding: 6,
      stageRadius: 16,
      nextBtnText: 'Próximo →',
      prevBtnText: '← Anterior',
      doneBtnText: 'Concluir 🎉',
      progressText: 'Passo {{current}} de {{total}}',
      onDestroyed: () => {
        localStorage.setItem(this.TOUR_KEY, 'true');
      },
      steps: validSteps
    };

    this.activeDriver = driver(config);
    this.activeDriver.drive();
  }

  /**
   * Limpa o registro do localStorage permitindo refazer o tour.
   */
  resetTourHistory(): void {
    localStorage.removeItem(this.TOUR_KEY);
  }

  /**
   * Encerra o tour caso esteja em andamento.
   */
  stopTour(): void {
    if (this.activeDriver) {
      this.activeDriver.destroy();
      this.activeDriver = null;
    }
  }
}
