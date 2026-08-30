import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { InvestimentoService } from '../../core/services/investimento.service';
import { Investimento } from '../../core/models/investimento.model';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { InvestimentoModalComponent } from './investimento-modal/investimento-modal.component';

@Component({
    selector: 'app-investimentos',
    standalone: true,
    imports: [CommonModule, RouterLink, ProgressSpinnerModule, InvestimentoModalComponent],
    templateUrl: './investimentos.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvestimentosComponent implements OnInit {
    private investimentoService = inject(InvestimentoService);
    private router = inject(Router);

    investimentos = signal<Investimento[]>([]);
    isLoading = signal(true);

    // Modal State
    showModal = signal(false);
    selectedInvestimento = signal<Investimento | null>(null);

    showValues = signal(localStorage.getItem('showValues') !== 'false');

    totalInvestido = computed(() => {
        return this.investimentos().reduce((acc, curr) => acc + (curr.valorAtual || 0), 0);
    });

    investimentosPorCategoria = computed(() => {
        const list = [...this.investimentos()];

        // Ordenar por data de vencimento (mais próxima primeiro)
        list.sort((a, b) => {
            const hasDataA = !!a.dataVencimento;
            const hasDataB = !!b.dataVencimento;

            if (hasDataA && hasDataB) {
                const dateA = new Date(a.dataVencimento!).getTime();
                const dateB = new Date(b.dataVencimento!).getTime();
                if (dateA !== dateB) return dateA - dateB;
            } else if (hasDataA && !hasDataB) {
                return -1;
            } else if (!hasDataA && hasDataB) {
                return 1;
            }
            // Fallback para ordem alfabética se não tiverem data
            return a.nome.localeCompare(b.nome);
        });

        const grouped = new Map<string, Investimento[]>();
        for (const inv of list) {
            if (!grouped.has(inv.tipo)) {
                grouped.set(inv.tipo, []);
            }
            grouped.get(inv.tipo)!.push(inv);
        }

        return Array.from(grouped.entries())
            .map(([tipo, investimentos]) => ({ tipo, investimentos }))
            .sort((a, b) => a.tipo.localeCompare(b.tipo));
    });

    async ngOnInit() {
        await this.loadInvestimentos();
    }

    async loadInvestimentos() {
        this.isLoading.set(true);
        try {
            const items = await this.investimentoService.getInvestimentos();
            this.investimentos.set(items || []);
        } catch (error) {
            console.error('Erro ao buscar investimentos', error);
        } finally {
            this.isLoading.set(false);
        }
    }

    getRentabilidade(inv: Investimento): { valor: number, percentual: number, positiva: boolean } {
        const rendimento = inv.valorAtual - inv.aporteInicial;
        let percentual = 0;
        if (inv.aporteInicial > 0) {
            percentual = (rendimento / inv.aporteInicial) * 100;
        }
        return {
            valor: rendimento,
            percentual: Math.abs(percentual),
            positiva: rendimento >= 0
        };
    }

    openNovoInvestimento() {
        this.selectedInvestimento.set(null);
        this.showModal.set(true);
    }

    openEditarInvestimento(inv: Investimento, event: Event) {
        event.stopPropagation();
        this.selectedInvestimento.set(inv);
        this.showModal.set(true);
    }

    async deleteInvestimento(id: string | undefined, event: Event) {
        event.stopPropagation();
        if (!id) return;

        if (confirm('Tem certeza que deseja excluir este investimento?')) {
            await this.investimentoService.deleteInvestimento(id);
            await this.loadInvestimentos();
        }
    }

    onModalClose(saved: boolean) {
        this.showModal.set(false);
        this.selectedInvestimento.set(null);
        if (saved) {
            this.loadInvestimentos();
        }
    }

    goToEvolucao(id: string | undefined) {
        if (id) {
            this.router.navigate(['/investimentos', id, 'evolucao']);
        }
    }

    toggleVisibility() {
        const newValue = !this.showValues();
        this.showValues.set(newValue);
        localStorage.setItem('showValues', newValue.toString());
    }
}