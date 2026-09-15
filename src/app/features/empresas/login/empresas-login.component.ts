import { Component, inject, signal, ChangeDetectionStrategy, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import * as packageJson from '../../../../../package.json';

@Component({
  selector: 'app-empresas-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './empresas-login.component.html',
})
export class EmpresasLoginComponent implements OnInit, AfterViewInit {
  @ViewChild('emailInput') emailInput!: ElementRef<HTMLInputElement>;

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private firestore = inject(Firestore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(6)]],
  });

  isLoading = signal(false);
  errorMessage = signal('');
  showPassword = signal(false);
  version = signal(packageJson.version);

  ngOnInit() {
    const errorParam = this.route.snapshot.queryParams['error'];
    if (errorParam === 'acesso_exclusivo') {
      this.errorMessage.set('Este acesso é exclusivo para contas corporativas. Utilize o login principal para contas pessoais.');
    }
  }

  ngAfterViewInit() {
    this.emailInput?.nativeElement.focus();
  }

  togglePasswordVisibility() {
    this.showPassword.update((v) => !v);
  }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { email, senha } = this.form.value;

    try {
      const userCredential = await this.authService.login(email!, senha!);

      // Verifica se a empresa existe na coleção 'companies'
      let isEmpresa = false;
      try {
        const companyDocRef = doc(this.firestore, `companies/${userCredential.user.uid}`);
        const companySnap = await getDoc(companyDocRef);
        isEmpresa = companySnap.exists();
      } catch (firestoreError: any) {
        console.error('Erro ao verificar empresa na coleção companies:', firestoreError);
      }

      if (!isEmpresa) {
        await this.authService.logout();
        this.errorMessage.set('Este acesso é exclusivo para contas corporativas. Utilize o login principal para contas pessoais.');
        this.isLoading.set(false);
        return;
      }

      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/empresas/dashboard';
      this.router.navigateByUrl(returnUrl);
    } catch (e: any) {
      console.error('Erro no login de empresas:', e);
      if (
        e.code === 'auth/user-not-found' ||
        e.code === 'auth/wrong-password' ||
        e.code === 'auth/invalid-credential'
      ) {
        this.errorMessage.set('Credenciais inválidas. Verifique seu e-mail e senha.');
      } else if (e.code === 'auth/too-many-requests') {
        this.errorMessage.set('Muitas tentativas de login. Aguarde alguns minutos e tente novamente.');
      } else {
        this.errorMessage.set('Erro ao fazer login corporativo. Tente novamente.');
      }
    } finally {
      this.isLoading.set(false);
    }
  }
}
