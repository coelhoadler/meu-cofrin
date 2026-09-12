import { Component, OnInit, OnDestroy, inject, Renderer2 } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-empresas-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <router-outlet></router-outlet>
  `,
})
export class EmpresasLayoutComponent implements OnInit, OnDestroy {
  private document = inject(DOCUMENT);
  private renderer = inject(Renderer2);

  ngOnInit() {
    this.renderer.addClass(this.document.body, 'theme-empresas');
  }

  ngOnDestroy() {
    this.renderer.removeClass(this.document.body, 'theme-empresas');
  }
}
