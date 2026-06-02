import { Injectable, inject } from '@angular/core';
import { Messaging, getToken, onMessage } from '@angular/fire/messaging';
import { Firestore, doc, setDoc, arrayUnion } from '@angular/fire/firestore';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class MessagingService {
  private messaging = inject(Messaging);
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  async requestPermissionAndGetToken() {
    try {
      if (!('Notification' in window)) {
        console.warn('Este navegador não suporta notificações de sistema.');
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(this.messaging, {
          // IMPORTANTE: Adicione sua VAPID Key aqui!
          // Você consegue gerar ela em: Console do Firebase > Configurações do Projeto > Cloud Messaging > Certificados Web Push
          vapidKey: 'jAOsuHgVrsLUJBUQIxXwK8qFWPJqwDZfGJWvnv794BE'
        });

        if (token) {
          await this.saveTokenToFirestore(token);
          console.log('Token FCM obtido e salvo com sucesso.');
        } else {
          console.log('Nenhum token FCM recebido.');
        }
      } else {
        console.warn('Permissão para notificações negada pelo usuário.');
      }
    } catch (error) {
      console.error('Erro ao obter token FCM:', error);
    }
  }

  private async saveTokenToFirestore(token: string) {
    const user = await this.authService.getCurrentUserAsync();
    if (!user) return;

    const userDocRef = doc(this.firestore, `users/${user.uid}`);
    // Usa setDoc com merge para criar o documento caso não exista e adicionar o token ao array
    await setDoc(userDocRef, {
      fcmTokens: arrayUnion(token)
    }, { merge: true });
  }

  listenForMessages() {
    onMessage(this.messaging, (payload) => {
      console.log('Notificação recebida em primeiro plano: ', payload);
      // Aqui você poderia integrar um serviço de Toast (ex: ngx-toastr) para mostrar a notificação
      // alert(`${payload.notification?.title}\n${payload.notification?.body}`);
    });
  }
}
