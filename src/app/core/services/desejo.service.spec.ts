import { TestBed } from '@angular/core/testing';
import { DesejoService } from './desejo.service';
import { Firestore } from '@angular/fire/firestore';
import { Storage } from '@angular/fire/storage';
import { AuthService } from '../auth/auth.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DesejoLink } from '../models/desejo.model';

describe('DesejoService', () => {
  let service: DesejoService;

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
        DesejoService,
        { provide: Firestore, useValue: mockFirestore },
        { provide: Storage, useValue: mockStorage },
        { provide: AuthService, useValue: mockAuthService }
      ]
    });

    service = TestBed.inject(DesejoService);
  });

  it('deve ser instanciado com sucesso', () => {
    expect(service).toBeTruthy();
  });

  it('deve calcular corretamente menor e maior preço a partir de links', () => {
    const calculate = (service as any).calculatePrecos.bind(service);

    const emptyResult = calculate([]);
    expect(emptyResult).toEqual({ menorPreco: null, maiorPreco: null });

    const links1: DesejoLink[] = [
      { id: '1', url: 'https://exemplo.com', preco: 1500 }
    ];
    expect(calculate(links1)).toEqual({ menorPreco: 1500, maiorPreco: 1500 });

    const links2: DesejoLink[] = [
      { id: '1', url: 'https://loja-a.com', preco: 1500 },
      { id: '2', url: 'https://loja-b.com', preco: 1200 },
      { id: '3', url: 'https://loja-c.com', preco: 1850 }
    ];
    expect(calculate(links2)).toEqual({ menorPreco: 1200, maiorPreco: 1850 });
  });
});
