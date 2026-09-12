import { environment } from '../../../environments/environment';

/**
 * Tempo de duração da sessão do usuário em minutos.
 * Pode ser ajustado com facilidade para qualquer valor (ex: 15, 30, 60 minutos).
 */
export const SESSION_DURATION_MINUTES = (environment as any).sessionDurationMinutes ?? 60;

/**
 * Duração da sessão em milissegundos.
 */
export const SESSION_DURATION_MS = SESSION_DURATION_MINUTES * 60 * 1000;
