import { Component, inject, signal, ChangeDetectionStrategy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { Auth, fetchSignInMethodsForEmail } from '@angular/fire/auth';
import { Firestore, doc, setDoc, serverTimestamp } from '@angular/fire/firestore';
import { NgxMaskDirective } from 'ngx-mask';
import { cnpjValidator } from '../../../core/validators/cnpj.validator';
import * as packageJson from '../../../../../package.json';

@Component({
  selector: 'app-empresas-cadastro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NgxMaskDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './empresas-cadastro.component.html',
})
export class EmpresasCadastroComponent implements AfterViewInit {
  @ViewChild('nomeFantasiaInput') nomeFantasiaInput!: ElementRef<HTMLInputElement>;
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);

  form = this.fb.group({
    nomeFantasia: ['', Validators.required],
    cnpj: ['', [Validators.required, cnpjValidator]],
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(6)]],
  });

  isLoading = signal(false);
  errorMessage = signal('');
  showPassword = signal(false);
  version = signal(packageJson.version);

  ngAfterViewInit() {
    this.nomeFantasiaInput?.nativeElement.focus();
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

    const { nomeFantasia, cnpj, email, senha } = this.form.value;

    try {
      // 1. Verifica preventivamente se o e-mail já está cadastrado
      try {
        const signInMethods = await fetchSignInMethodsForEmail(this.auth, email!);
        if (signInMethods.length > 0) {
          this.errorMessage.set('Este e-mail já está em uso. Por favor, utilize um outro endereço de e-mail.');
          this.isLoading.set(false);
          return;
        }
      } catch (enumError) {
        // Ignora caso proteção de enumeração de e-mail esteja ativada no Firebase
      }

      // 2. Cria conta no Firebase Auth com e-mail e senha
      const userCredential = await this.authService.signup(email!, senha!, nomeFantasia!);

      const cleanCnpj = cnpj?.replace(/\D/g, '') || '';
      const companyPayload = {
        nomeFantasia: nomeFantasia,
        cnpj: cleanCnpj,
        email: email,
        userId: userCredential.user.uid,
        createdAt: serverTimestamp(),
      };

      // 3. Salva os dados corporativos exclusivamente na coleção 'companies/{uid}'
      const companyDocRef = doc(this.firestore, `companies/${userCredential.user.uid}`);
      await setDoc(companyDocRef, companyPayload, { merge: true });

      // 4. Redireciona para dashboard corporativo
      this.router.navigate(['/empresas/dashboard']);
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') {
        this.errorMessage.set('Este e-mail já está em uso. Por favor, utilize um outro endereço de e-mail.');
      } else {
        this.errorMessage.set('Erro ao criar conta corporativa. Tente novamente.');
      }
      console.error('Erro ao cadastrar empresa:', e);
    } finally {
      this.isLoading.set(false);
    }
  }
}
