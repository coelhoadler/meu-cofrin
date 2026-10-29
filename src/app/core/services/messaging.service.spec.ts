import { TestBed } from '@angular/core/testing';
import { Messaging, getToken, onMessage } from '@angular/fire/messaging';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { ToastrService } from 'ngx-toastr';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuthService } from '../auth/auth.service';
import { MessagingService } from './messaging.service';

vi.mock('@angular/fire/messaging', () => ({
  Messaging: vi.fn(),
  getToken: vi.fn(),
  onMessage: vi.fn(),
}));

vi.mock('@angular/fire/firestore', () => ({
  Firestore: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn(),
  arrayUnion: vi.fn((valor: string) => valor),
}));

describe('MessagingService', () => {
  let service: MessagingService;

  const mockAuthService = {
    getCurrentUserAsync: vi.fn(),
  };
  const mockNotification = {
    requestPermission: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('Notification', mockNotification);

    mockAuthService.getCurrentUserAsync.mockResolvedValue({ uid: 'user-1' });
    mockNotification.requestPermission.mockResolvedValue('granted');
    vi.mocked(getToken).mockResolvedValue('token-fcm');
    vi.mocked(doc).mockReturnValue({} as any);
    vi.mocked(setDoc).mockResolvedValue(undefined);

    TestBed.configureTestingModule({
      providers: [
        MessagingService,
        { provide: Messaging, useValue: {} },
        { provide: Firestore, useValue: {} },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ToastrService, useValue: { info: vi.fn() } },
      ],
    });
    service = TestBed.inject(MessagingService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('deve registrar o listener de mensagens uma única vez', () => {
    service.listenForMessages();
    service.listenForMessages();
    service.listenForMessages();

    expect(onMessage).toHaveBeenCalledTimes(1);
  });

  it('deve pedir permissão e salvar o token uma única vez por usuário', async () => {
    await service.requestPermissionAndGetToken();
    await service.requestPermissionAndGetToken();

    expect(mockNotification.requestPermission).toHaveBeenCalledTimes(1);
    expect(doc).toHaveBeenCalledWith(expect.anything(), 'users/user-1');
    expect(setDoc).toHaveBeenCalledTimes(1);
  });

  it('deve salvar o token de novo quando outro usuário entrar', async () => {
    await service.requestPermissionAndGetToken();
    mockAuthService.getCurrentUserAsync.mockResolvedValue({ uid: 'user-2' });
    await service.requestPermissionAndGetToken();

    expect(setDoc).toHaveBeenCalledTimes(2);
    expect(doc).toHaveBeenLastCalledWith(expect.anything(), 'users/user-2');
  });

  it('deve tentar de novo depois de uma falha', async () => {
    vi.mocked(getToken).mockRejectedValueOnce(new Error('offline'));

    await service.requestPermissionAndGetToken();
    await service.requestPermissionAndGetToken();

    expect(getToken).toHaveBeenCalledTimes(2);
    expect(setDoc).toHaveBeenCalledTimes(1);
  });

  it('não deve fazer nada sem usuário autenticado', async () => {
    mockAuthService.getCurrentUserAsync.mockResolvedValue(null);

    await service.requestPermissionAndGetToken();

    expect(mockNotification.requestPermission).not.toHaveBeenCalled();
  });
});
