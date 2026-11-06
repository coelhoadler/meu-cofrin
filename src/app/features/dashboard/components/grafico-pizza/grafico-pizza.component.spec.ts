import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { By } from '@angular/platform-browser';
import { GraficoPizzaComponent } from './grafico-pizza.component';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BaseChartDirective } from 'ng2-charts';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

describe('GraficoPizzaComponent', () => {
  let component: GraficoPizzaComponent;
  let fixture: ComponentFixture<GraficoPizzaComponent>;
  let componentRef: ComponentRef<GraficoPizzaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraficoPizzaComponent, BaseChartDirective],
      providers: [provideCharts(withDefaultRegisterables())],
    }).compileComponents();

    fixture = TestBed.createComponent(GraficoPizzaComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;

    // Provide required inputs
    componentRef.setInput('chartData', {
      labels: ['Label 1', 'Label 2'],
      datasets: [
        { data: [300, 500] }
      ]
    });
    componentRef.setInput('chartOptions', { responsive: true });

    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('deve instanciar o componente corretamente', () => {
    expect(component).toBeTruthy();
  });

  it('deve renderizar o título e subtítulo', () => {
    const titleElement = fixture.debugElement.query(By.css('h3')).nativeElement;
    const subtitleElement = fixture.debugElement.query(By.css('p')).nativeElement;

    expect(titleElement.textContent).toContain('Distribuição do mês');
    expect(subtitleElement.textContent).toContain('Composição atual');
  });

  it('deve renderizar o canvas do gráfico pie', () => {
    const canvasElement = fixture.debugElement.query(By.css('canvas'));
    expect(canvasElement).toBeTruthy();

    const chartDirective = canvasElement.injector.get(BaseChartDirective);
    expect(chartDirective.type).toBe('pie');
    expect(chartDirective.data?.labels).toEqual(['Label 1', 'Label 2']);
    expect(chartDirective.data?.datasets[0].data).toEqual([300, 500]);
    expect(chartDirective.options).toEqual({ responsive: true });
  });

  it('deve atualizar o gráfico ao mudar os inputs', () => {
    componentRef.setInput('chartData', {
      labels: ['Novo Label'],
      datasets: [{ data: [100] }]
    });
    fixture.detectChanges();

    const canvasElement = fixture.debugElement.query(By.css('canvas'));
    const chartDirective = canvasElement.injector.get(BaseChartDirective);

    expect(chartDirective.data?.labels).toEqual(['Novo Label']);
    expect(chartDirective.data?.datasets[0].data).toEqual([100]);
  });
});
