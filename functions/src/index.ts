import * as admin from "firebase-admin";

admin.initializeApp();

export * from "./scheduled/notificarContasVencendo";
export * from "./scheduled/consolidarResumosMensais";
