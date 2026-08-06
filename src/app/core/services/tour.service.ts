import { Injectable } from '@angular/core';
import { driver, Driver, Config, DriveStep } from 'driver.js';

@Injectable({
  providedIn: 'root'
})
export class TourService {
  private isTour = false;
  private activeDriver: Driver | null = null;
  private readonly TOUR_KEY = 'meu_cofrin_dashboard_tour_seen';

  /**
   * Inicia o tour interativo do Dashboard.
   * @param force Se verdadeiro, ignora se o usuário já fez o tour antes e força o início.
   */
  startDashboardTour(force: boolean = false): void {

    const hasSeenTour = localStorage.getItem(this.TOUR_KEY);
    if ((hasSeenTour && !force) || this.isTour) {
      return;
    }

    this.isTour = true;

    const isMobile = window.innerWidth <= 768;
    const targetElement = isMobile ? '#tour-menu-mobile' : '#tour-menu';

    const steps: DriveStep[] = [
      {
        element: targetElement,
        popover: {
          title: '🪙 Menu de navegação',
          description: `
          <ul>
              <li><b>Dashboard</b>: Visão geral das finanças (tela inicial).</li>
              <li><b>Lançamentos</b>: Lista de lançamentos.</li>
              <li><b>Nova conta</b>: Cadastro de novas contas.</li>
              <li><b>Categorias</b>: Cadastro de categorias.</li>
              <li><b>Apoiar projeto</b>: Doação para o projeto.</li>
              <li><b>Meu perfil</b>: Dados do perfil.</li>
              <li><b>Fale conosco</b>: Contato com o suporte.</li>
              <li><b>Tour</b>: Inicie o tour pelo sistema quando quiser.</li>
            </ul>`,
          side: 'bottom',
          align: 'center'
        }
      },
      {
        element: '#tour-date-picker',
        popover: {
          title: '🗓️ Seleção de mês',
          description: `Visão facilitada para o mês de sua preferência.`,
          side: 'bottom',
          align: 'center'
        }
      },
      {
        element: '#tour-btn-replicar-mes',
        popover: {
          title: '🔁 Replicar mês',
          description: 'Tenha mais agilidade usando a funcionalidade de replicar lançamentos do mês anterior.',
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
        element: '#tour-saldo-card',
        popover: {
          title: '💰 Saldo do Mês',
          description: 'Acompanhe seu saldo total consolidado do mês atual em tempo real.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '#tour-grafico-resumo',
        popover: {
          title: '📊 Comparativo Financeiro',
          description: 'Compare graficamente a evolução das suas receitas e despesas ao longo do tempo durante 6 meses.',
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
      },
      {
        element: '#tour-cadastrar-primeira-conta',
        popover: {
          title: '➕ Cadastrar primeira conta',
          description: 'Cadastre a sua primeira conta para colher os benefícios do Meu Cofrin.',
          side: 'bottom',
          align: 'center'
        }
      },
      {
        element: '#tour-fab-nova-conta',
        popover: {
          title: '➕ Nova Conta / Lançamento',
          description: 'Cadastre rapidamente novas despesas ou receitas na sua conta.',
          side: 'left',
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
      overlayClickBehavior: () => {},
      showButtons: ['next', 'previous', 'close'],
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
        this.isTour = false;
      },
      steps: validSteps,
      allowScroll: false,
      allowKeyboardControl: true,
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
    this.isTour = false;
    if (this.activeDriver) {
      this.activeDriver.destroy();
      this.activeDriver = null;
    }
  }
}
