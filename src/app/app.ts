import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SessionExpiredModalComponent } from './core/layout/session-expired-modal/session-expired-modal.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SessionExpiredModalComponent],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('meu-cofrin');
}
