import { Injectable, inject } from '@angular/core';
import { Messaging, getToken, onMessage } from '@angular/fire/messaging';
import { Firestore, doc, setDoc, arrayUnion } from '@angular/fire/firestore';
import { AuthService } from '../auth/auth.service';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class MessagingService {
  private messaging = inject(Messaging);
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  private toastr = inject(ToastrService);

  // Evitam repetir a permissão, a gravação do token e o listener a cada visita ao Dashboard
  private tokenSalvoPara: string | null = null;
  private escutandoMensagens = false;

  async requestPermissionAndGetToken() {
    const user = await this.authService.getCurrentUserAsync();
    if (!user || this.tokenSalvoPara === user.uid) return;
    this.tokenSalvoPara = user.uid;

    try {
      if (!('Notification' in window)) {
        console.warn('Este navegador não suporta notificações de sistema.');
        return;
      }

      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        const token = await getToken(this.messaging, {
          vapidKey: 'BLG5yJCaAx0PVyk0V3SujWOJEq3HxVPGtBLd7qNU_Gd0ZgtSDNg1zZeoY624qXg6Ho9XpP6xYbPtVmwyktyibzY'
        });

        if (token) {
          await this.saveTokenToFirestore(user.uid, token);
          console.log('Token FCM obtido e salvo com sucesso.');
        } else {
          console.log('Nenhum token FCM recebido.');
        }
      } else {
        console.warn('Permissão para notificações negada pelo usuário.');
      }
    } catch (error) {
      // Permite tentar de novo na próxima visita
      this.tokenSalvoPara = null;
      console.error('Erro ao obter token FCM:', error);
    }
  }

  private async saveTokenToFirestore(uid: string, token: string) {
    const userDocRef = doc(this.firestore, `users/${uid}`);
    // Usa setDoc com merge para criar o documento caso não exista e adicionar o token ao array
    await setDoc(userDocRef, {
      fcmTokens: arrayUnion(token)
    }, { merge: true });
  }

  listenForMessages() {
    if (this.escutandoMensagens) return;
    this.escutandoMensagens = true;

    onMessage(this.messaging, (payload) => {
      console.log('Notificação recebida em primeiro plano: ', payload);

      if (payload.notification) {
        this.toastr.info(payload.notification.body, payload.notification.title, {
          timeOut: 10000
        });
      }
    });
  }
}
