import { TestBed } from '@angular/core/testing';
import { Firestore, doc, updateDoc, deleteField } from '@angular/fire/firestore';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '../auth/auth.service';
import { InvestimentoService } from './investimento.service';

vi.mock('@angular/fire/firestore', () => ({
  Firestore: vi.fn(),
  collection: vi.fn(),
  addDoc: vi.fn(),
  serverTimestamp: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  getDocs: vi.fn(),
  doc: vi.fn(),
  deleteDoc: vi.fn(),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteField: vi.fn(),
}));

describe('InvestimentoService', () => {
  let service: InvestimentoService;

  const mockUser = { uid: 'user-123', email: 'test@example.com' };
  const mockAuthService = {
    getCurrentUserAsync: vi.fn().mockResolvedValue(mockUser)
  };
  const mockFirestore = {};
  const registroRef = { id: 'reg-1' };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(doc).mockReturnValue(registroRef as any);
    vi.mocked(updateDoc).mockResolvedValue(undefined);
    vi.mocked(deleteField).mockReturnValue('DELETE_FIELD' as any);

    TestBed.configureTestingModule({
      providers: [
        InvestimentoService,
        { provide: Firestore, useValue: mockFirestore },
        { provide: AuthService, useValue: mockAuthService }
      ]
    });

    service = TestBed.inject(InvestimentoService);
  });

  it('deve gravar a anotação no registro do usuário autenticado', async () => {
    await service.updateAnotacaoRegistro('inv-1', 'reg-1', 'US$ 5,33');

    expect(doc).toHaveBeenCalledWith(mockFirestore, 'users/user-123/investimentos/inv-1/registros', 'reg-1');
    expect(updateDoc).toHaveBeenCalledWith(registroRef, { anotacao: 'US$ 5,33' });
  });

  it('deve remover o campo quando a anotação for vazia', async () => {
    await service.updateAnotacaoRegistro('inv-1', 'reg-1', '');

    expect(updateDoc).toHaveBeenCalledWith(registroRef, { anotacao: 'DELETE_FIELD' });
  });

  it('deve exigir usuário autenticado para editar a anotação', async () => {
    mockAuthService.getCurrentUserAsync.mockResolvedValueOnce(null);

    await expect(service.updateAnotacaoRegistro('inv-1', 'reg-1', 'x')).rejects.toThrow('Usuário não autenticado');
    expect(updateDoc).not.toHaveBeenCalled();
  });
});
