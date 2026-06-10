import { Injectable, inject } from '@angular/core';
import { Auth, signInWithCustomToken } from '@angular/fire/auth';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

@Injectable({
  providedIn: 'root'
})
export class WebauthnService {
  private auth = inject(Auth);
  private functions = inject(Functions);

  async registerPasskey() {
    // 1. Get registration options from server
    const generateRegistrationOptionsFn = httpsCallable<any, any>(this.functions, 'generateRegistrationOptionsFn');
    const optionsResp = await generateRegistrationOptionsFn();
    const options = optionsResp.data;

    // 2. Pass options to browser WebAuthn API
    let attResp;
    try {
      attResp = await startRegistration({ optionsJSON: options });
    } catch (error: any) {
      if (error.name === 'InvalidStateError') {
        throw new Error('Você já registrou uma biometria neste dispositivo.');
      }
      if (error.name === 'NotAllowedError') {
        throw new Error('Operação cancelada ou não permitida pelo dispositivo.');
      }
      throw error;
    }

    // 3. Send response back to server for verification
    const verifyRegistrationResponseFn = httpsCallable<any, any>(this.functions, 'verifyRegistrationResponseFn');
    const verificationResp = await verifyRegistrationResponseFn({ response: attResp });

    if (verificationResp.data && verificationResp.data.success) {
      return true;
    } else {
      throw new Error('Falha ao verificar o registro biométrico.');
    }
  }

  async authenticateWithPasskey(email: string) {
    // 1. Get authentication options from server
    const generateAuthenticationOptionsFn = httpsCallable<any, any>(this.functions, 'generateAuthenticationOptionsFn');
    const optionsResp = await generateAuthenticationOptionsFn({ email });
    const options = optionsResp.data;

    // 2. Pass options to browser WebAuthn API
    let asseResp;
    try {
      asseResp = await startAuthentication({ optionsJSON: options });
    } catch (error: any) {
      if (error.name === 'NotAllowedError') {
        throw new Error('Operação cancelada ou não permitida pelo dispositivo.');
      }
      throw error;
    }

    // 3. Send response back to server for verification
    const verifyAuthenticationResponseFn = httpsCallable<any, any>(this.functions, 'verifyAuthenticationResponseFn');
    const verificationResp = await verifyAuthenticationResponseFn({ email, response: asseResp });

    if (verificationResp.data && verificationResp.data.token) {
      // 4. Sign in to Firebase with Custom Token
      await signInWithCustomToken(this.auth, verificationResp.data.token);
      return true;
    } else {
      throw new Error('Falha ao verificar a autenticação biométrica.');
    }
  }
}
