import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserPreferencesService {
  private readonly SHOW_VALUES_KEY = 'showValues';

  readonly showValues = signal<boolean>(this.getInitialShowValues());

  private getInitialShowValues(): boolean {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(this.SHOW_VALUES_KEY) !== 'false';
    }
    return true;
  }

  toggleValuesVisibility(): void {
    const newValue = !this.showValues();
    this.showValues.set(newValue);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(this.SHOW_VALUES_KEY, newValue.toString());
    }
  }

  setShowValues(value: boolean): void {
    this.showValues.set(value);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(this.SHOW_VALUES_KEY, value.toString());
    }
  }
}
