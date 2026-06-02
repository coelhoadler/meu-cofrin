import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';

import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { getMessaging, provideMessaging } from '@angular/fire/messaging';
import { provideServiceWorker } from '@angular/service-worker';
import { provideEnvironmentNgxMask } from 'ngx-mask';

import { registerLocaleData } from '@angular/common';
import ptBr from '@angular/common/locales/pt';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

registerLocaleData(ptBr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    { provide: LOCALE_ID, useValue: 'pt' },
    provideFirebaseApp(() =>
      initializeApp({
        apiKey: "AIzaSyAPDHqVLWlphds13yTj_YK_P2irI_lVLG0",
        authDomain: "meu-cofrin.firebaseapp.com",
        projectId: "meu-cofrin",
        storageBucket: "meu-cofrin.firebasestorage.app",
        messagingSenderId: "570567455946",
        appId: "1:570567455946:web:ea39f614bd1397991f7033",
        measurementId: "G-QHZ9Q0MRZS"
      }),
    ),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
    provideMessaging(() => getMessaging()),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    provideEnvironmentNgxMask(), provideClientHydration(withEventReplay()),
  ],
};

