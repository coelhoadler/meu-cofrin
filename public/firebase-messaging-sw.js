importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAPDHqVLWlphds13yTj_YK_P2irI_lVLG0",
  authDomain: "meu-cofrin.firebaseapp.com",
  projectId: "meu-cofrin",
  storageBucket: "meu-cofrin.firebasestorage.app",
  messagingSenderId: "570567455946",
  appId: "1:570567455946:web:ea39f614bd1397991f7033",
  measurementId: "G-QHZ9Q0MRZS"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification?.title || 'Nova Notificação';
  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
