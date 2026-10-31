import { TestBed } from '@angular/core/testing';
import { Firestore, collection, doc, getDocs, deleteDoc, writeBatch } from '@angular/fire/firestore';
import { Storage } from '@angular/fire/storage';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserDataService } from './user-data.service';

vi.mock('@angular/fire/firestore', () => ({
  Firestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  deleteDoc: vi.fn(),
  writeBatch: vi.fn(),
  setDoc: vi.fn(),
  serverTimestamp: vi.fn(),
}));

vi.mock('@angular/fire/storage', () => ({
  Storage: vi.fn(),
  ref: vi.fn(),
  listAll: vi.fn(),
  deleteObject: vi.fn(),
}));

describe('UserDataService', () => {
  let service: UserDataService;

  // Firestore em memória: caminho da coleção -> ids dos documentos
  let banco: Record<string, string[]>;
  let apagados: string[];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    apagados = [];
    banco = {
      'users/u1/contas': ['c1', 'c2'],
      'users/u1/categorias': ['cat1'],
      'users/u1/desejos': ['d1'],
      'users/u1/passkeys': ['p1'],
      'users/u1/investimentos': ['i1', 'i2'],
      'users/u1/investimentos/i1/registros': ['r1', 'r2'],
      'users/u1/investimentos/i2/registros': [],
    };

    vi.mocked(collection).mockImplementation((_fs: any, path: string) => ({ path }) as any);
    vi.mocked(doc).mockImplementation((_fs: any, path: string) => ({ path }) as any);
    vi.mocked(getDocs).mockImplementation(async (ref: any) => ({
      docs: (banco[ref.path] ?? []).map(id => ({ ref: { path: `${ref.path}/${id}` } }))
    }) as any);
    vi.mocked(writeBatch).mockImplementation(() => {
      const pendentes: string[] = [];
      return {
        delete: vi.fn((ref: any) => pendentes.push(ref.path)),
        commit: vi.fn(async () => { apagados.push(...pendentes); })
      } as any;
    });
    vi.mocked(deleteDoc).mockImplementation(async (ref: any) => { apagados.push(ref.path); });

    TestBed.configureTestingModule({
      providers: [
        UserDataService,
        { provide: Firestore, useValue: {} },
        { provide: Storage, useValue: {} }
      ]
    });

    service = TestBed.inject(UserDataService);
  });

  it('deve apagar investimentos, desejos e passkeys junto com as demais subcoleções', async () => {
    await service.deleteUserFirestoreData('u1');

    expect(apagados).toEqual(expect.arrayContaining([
      'users/u1/contas/c1',
      'users/u1/contas/c2',
      'users/u1/categorias/cat1',
      'users/u1/desejos/d1',
      'users/u1/passkeys/p1',
      'users/u1/investimentos/i1',
      'users/u1/investimentos/i2',
      'users/u1/investimentos/i1/registros/r1',
      'users/u1/investimentos/i1/registros/r2',
      'users/u1',
      'companies/u1'
    ]));
  });

  it('deve apagar os registros antes do investimento a que pertencem', async () => {
    await service.deleteUserFirestoreData('u1');

    const investimento = apagados.indexOf('users/u1/investimentos/i1');
    expect(apagados.indexOf('users/u1/investimentos/i1/registros/r1')).toBeLessThan(investimento);
    expect(apagados.indexOf('users/u1/investimentos/i1/registros/r2')).toBeLessThan(investimento);
  });

  it('deve apagar em lotes de no máximo 500 documentos', async () => {
    banco['users/u1/contas'] = Array.from({ length: 501 }, (_, i) => `c${i}`);

    await service.deleteUserFirestoreData('u1');

    const lotesDeContas = vi.mocked(writeBatch).mock.results
      .map(r => vi.mocked(r.value.delete).mock.calls.map(([ref]: any) => ref.path))
      .filter(paths => paths.some((p: string) => p.startsWith('users/u1/contas/')));
    expect(lotesDeContas.map(l => l.length)).toEqual([500, 1]);
  });

  it('deve seguir apagando as outras subcoleções quando uma falhar', async () => {
    const getDocsOriginal = vi.mocked(getDocs).getMockImplementation()!;
    vi.mocked(getDocs).mockImplementation(async (ref: any) => {
      if (ref.path === 'users/u1/contas') throw new Error('offline');
      return getDocsOriginal(ref);
    });

    await service.deleteUserFirestoreData('u1');

    expect(apagados).not.toContain('users/u1/contas/c1');
    expect(apagados).toContain('users/u1/investimentos/i1/registros/r1');
    expect(apagados).toContain('users/u1/desejos/d1');
    expect(apagados).toContain('users/u1');
  });
});
