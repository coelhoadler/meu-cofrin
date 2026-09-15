import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-empresas-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- Corporate Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 pb-4">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-[#421b7b] dark:text-[#9d6bf3] bg-[#421b7b]/10 dark:bg-[#9d6bf3]/10 px-3 py-1 rounded-full inline-block mb-2">
            Módulo Corporativo (B2B)
          </span>
          <h1 class="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Dashboard Corporativo
          </h1>
          <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Gestão financeira dedicada para sua empresa.
          </p>
        </div>

        <div class="flex gap-3">
          <a routerLink="/nova-conta"
            class="px-5 py-2.5 bg-[#421b7b] hover:bg-[#341561] text-white text-sm font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-2">
            <span class="material-symbols-outlined text-lg">add</span>
            Novo lançamento PJ
          </a>
        </div>
      </div>

      <!-- Corporate Status Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white dark:bg-[#1a112c] rounded-[20px] p-6 shadow-sm border border-slate-200/80 dark:border-slate-800/50 flex flex-col justify-between h-[150px] transition-colors duration-300">
          <div>
            <p class="text-slate-500 dark:text-slate-400 text-sm font-medium mb-2">Empresa Cadastrada</p>
            <h3 class="text-xl font-bold text-slate-800 dark:text-white truncate">
              {{ companyName() || 'Carregando...' }}
            </h3>
          </div>
          <div class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span class="material-symbols-outlined text-base text-[#421b7b] dark:text-[#9d6bf3]">badge</span>
            <span>CNPJ: {{ companyCnpj() || 'Não informado' }}</span>
          </div>
        </div>

        <div class="bg-white dark:bg-[#1a112c] rounded-[20px] p-6 shadow-sm border border-slate-200/80 dark:border-slate-800/50 flex flex-col justify-between h-[150px] transition-colors duration-300">
          <div>
            <p class="text-slate-500 dark:text-slate-400 text-sm font-medium mb-2">Status da Conta PJ</p>
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
              <span class="text-lg font-bold text-slate-800 dark:text-white">Ativa & Verificada</span>
            </div>
          </div>
          <p class="text-xs text-slate-400 dark:text-slate-500">
            Ambiente corporativo seguro com isolamento de dados
          </p>
        </div>

        <div class="bg-gradient-to-br from-[#381174] via-[#581fa4] to-[#7941dc] text-white rounded-[20px] p-6 shadow-lg shadow-purple-900/15 flex flex-col justify-between h-[150px] transition-all">
          <div>
            <p class="text-purple-200/90 text-sm font-medium mb-2">Controle Financeiro PJ</p>
            <h3 class="text-lg font-bold text-white">Central Corporativa</h3>
          </div>
          <div class="flex items-center gap-2 text-xs text-purple-200/80">
            <span class="material-symbols-outlined text-base">domain</span>
            <span>Multi-usuários e DRE em breve</span>
          </div>
        </div>
      </div>

      <!-- Quick Guidance Box -->
      <div class="bg-purple-50 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-800/40 rounded-2xl p-6 text-sm">
        <div class="flex items-start gap-4">
          <div class="w-10 h-10 rounded-xl bg-[#421b7b] text-white flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-xl">corporate_fare</span>
          </div>
          <div>
            <h4 class="font-bold text-slate-800 dark:text-slate-100 text-base">Bem-vindo ao Meu Cofrin Empresas</h4>
            <p class="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              Você está utilizando o módulo corporativo. Os lançamentos desta área são organizados para atender a rotina financeira de empresas e pessoas jurídicas.
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class EmpresasDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private firestore = inject(Firestore);

  companyName = signal<string>('');
  companyCnpj = signal<string>('');

  async ngOnInit() {
    const user = this.authService.currentUser();
    if (user?.uid) {
      await this.loadCompanyData(user.uid);
    }
  }

  private async loadCompanyData(uid: string) {
    try {
      const compSnap = await getDoc(doc(this.firestore, `companies/${uid}`));
      if (compSnap.exists()) {
        const data = compSnap.data();
        this.companyName.set(data?.['nomeFantasia'] || data?.['razaoSocial'] || 'Empresa');
        this.companyCnpj.set(data?.['cnpj'] || '');
      }
    } catch (e) {
      console.error('Erro ao carregar dados da empresa no Firestore:', e);
    }
  }
}
