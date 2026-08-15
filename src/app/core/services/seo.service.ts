import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

export interface SeoConfig {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private titleService = inject(Title);
  private metaService = inject(Meta);

  private defaultTitle = 'Meu Cofrin - Controle Financeiro Pessoal Simples e Eficiente';
  private defaultDescription = 'Meu Cofrin ajuda você a controlar e gerenciar suas finanças pessoais de forma simples, rápida e transparente.';
  private defaultImage = 'https://meu-cofrin.app.br/thumb.jpg';
  private defaultUrl = 'https://meu-cofrin.app.br/';

  public updateSeo(config: SeoConfig): void {
    const title = config.title ? `${config.title} | Meu Cofrin` : this.defaultTitle;
    const description = config.description || this.defaultDescription;
    const image = config.image || this.defaultImage;
    const url = config.url || this.defaultUrl;

    // Document Title
    this.titleService.setTitle(title);

    // Primary Meta Tags
    this.metaService.updateTag({ name: 'description', content: description });
    if (config.keywords) {
      this.metaService.updateTag({ name: 'keywords', content: config.keywords });
    }

    // OpenGraph
    this.metaService.updateTag({ property: 'og:title', content: title });
    this.metaService.updateTag({ property: 'og:description', content: description });
    this.metaService.updateTag({ property: 'og:image', content: image });
    this.metaService.updateTag({ property: 'og:url', content: url });

    // Twitter
    this.metaService.updateTag({ name: 'twitter:title', content: title });
    this.metaService.updateTag({ name: 'twitter:description', content: description });
    this.metaService.updateTag({ name: 'twitter:image', content: image });
  }
}
