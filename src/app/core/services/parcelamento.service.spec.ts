import { TestBed } from '@angular/core/testing';
import { ParcelamentoService } from './parcelamento.service';
import { Firestore } from '@angular/fire/firestore';
import { Storage } from '@angular/fire/storage';
import { AuthService } from '../auth/auth.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Conta } from '../models/conta.model';

describe('ParcelamentoService', () => {
  let service: ParcelamentoService;

  const mockUser = { uid: 'user-123', email: 'test@example.com' };

  const mockAuthService = {
    getCurrentUserAsync: vi.fn().mockResolvedValue(mockUser)
  };

  const mockFirestore = {};
  const mockStorage = {};

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        ParcelamentoService,
        { provide: Firestore, useValue: mockFirestore },
        { provide: Storage, useValue: mockStorage },
        { provide: AuthService, useValue: mockAuthService }
      ]
    });

    service = TestBed.inject(ParcelamentoService);
  });

  it('deve ser instanciado com sucesso', () => {
    expect(service).toBeTruthy();
  });

  it('deve retornar array vazio se usuario nao autenticado em getContasByParcelamentoId', async () => {
    mockAuthService.getCurrentUserAsync.mockResolvedValueOnce(null);
    const result = await service.getContasByParcelamentoId('p1');
    expect(result).toEqual([]);
  });

  it('deve exigir usuario autenticado para addContasParceladas', async () => {
    mockAuthService.getCurrentUserAsync.mockResolvedValueOnce(null);
    await expect(service.addContasParceladas([])).rejects.toThrow('Usuário não autenticado');
  });

  it('deve exigir usuario autenticado para updateContasParceladas', async () => {
    mockAuthService.getCurrentUserAsync.mockResolvedValueOnce(null);
    await expect(service.updateContasParceladas([])).rejects.toThrow('Usuário não autenticado');
  });

  it('deve exigir usuario autenticado para deleteContasByParcelamentoId', async () => {
    mockAuthService.getCurrentUserAsync.mockResolvedValueOnce(null);
    await expect(service.deleteContasByParcelamentoId('p1')).rejects.toThrow('Usuário não autenticado');
  });
});
