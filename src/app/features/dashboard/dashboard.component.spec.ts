import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../../core/auth/auth.service';
import { ContaService } from '../../core/services/conta.service';
import { MessagingService } from '../../core/services/messaging.service';
import { TourService } from '../../core/services/tour.service';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  const mockAuthService = {
    currentUser: signal<any>({ uid: 'user-1' }),
    saveUserProfile: vi.fn(),
  };
  const mockContaService = {
    getContasByMesReferencia: vi.fn(),
    getResumoMensalById: vi.fn(),
    getResumosMensais: vi.fn(),
  };
  const mockMessagingService = {
    requestPermissionAndGetToken: vi.fn(),
    listenForMessages: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    localStorage.removeItem('dashboard_selected_month');
    mockContaService.getContasByMesReferencia.mockResolvedValue([]);
    mockContaService.getResumoMensalById.mockResolvedValue(null);
    mockContaService.getResumosMensais.mockResolvedValue([]);

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        provideCharts(withDefaultRegisterables()),
        { provide: AuthService, useValue: mockAuthService },
        { provide: ContaService, useValue: mockContaService },
        { provide: MessagingService, useValue: mockMessagingService },
        { provide: TourService, useValue: { startDashboardTour: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    localStorage.removeItem('dashboard_selected_month');
  });

  it('deve carregar o mês e executar os efeitos do usuário ao abrir', () => {
    expect(mockContaService.getContasByMesReferencia).toHaveBeenCalledWith(component.selectedMesRef());
    expect(mockAuthService.saveUserProfile).toHaveBeenCalledTimes(1);
    expect(mockContaService.getResumosMensais).toHaveBeenCalledTimes(1);
    expect(mockMessagingService.requestPermissionAndGetToken).toHaveBeenCalledTimes(1);
    expect(mockMessagingService.listenForMessages).toHaveBeenCalledTimes(1);
  });

  it('deve recarregar só os dados do mês ao trocar de mês', async () => {
    const mesInicial = component.selectedMesRef();
    vi.clearAllMocks();

    component.nextMonth();
    await fixture.whenStable();

    expect(component.selectedMesRef()).not.toBe(mesInicial);
    expect(mockContaService.getContasByMesReferencia).toHaveBeenCalledWith(component.selectedMesRef());
    expect(mockAuthService.saveUserProfile).not.toHaveBeenCalled();
    expect(mockContaService.getResumosMensais).not.toHaveBeenCalled();
    expect(mockMessagingService.requestPermissionAndGetToken).not.toHaveBeenCalled();
    expect(mockMessagingService.listenForMessages).not.toHaveBeenCalled();
  });
});
