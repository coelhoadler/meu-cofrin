# 🐷 Meu Cofrin

**Meu Cofrin** é um aplicativo moderno, seguro e intuitivo de gestão financeira pessoal e empresarial. Desenhado para quem deseja ter o controle total de suas finanças de maneira descomplicada, ele oferece uma visão completa e simplificada do seu dinheiro.

Esqueça as planilhas complexas! Com o Meu Cofrin, você acompanha suas receitas, despesas, objetivos de economia e a evolução dos seus investimentos de forma visual, elegante e direto ao ponto.

🌍 **Acesse online:** [https://meu-cofrin.app.br](https://meu-cofrin.app.br)  
*(Não quer baixar o código ou subir seu próprio ambiente? Sem problemas! Você pode simplesmente acessar o link oficial, criar sua conta gratuita e começar a controlar suas finanças agora mesmo.)*

---

## ✨ Principais Funcionalidades

- 📊 **Dashboard Interativo**: Visão geral do seu mês com gráficos de receitas, despesas e distribuição por categorias para fácil entendimento. Saiba instantaneamente o quanto recebeu, gastou e o seu saldo atual.
- 💸 **Controle de Lançamentos & Recorrências**: Registre receitas e despesas com poucos cliques, aplique parcelamentos, defina datas de vencimento e marque despesas fixas como recorrentes.
- 🔄 **Replicação Inteligente de Meses**: Não perca tempo recadastrando despesas mensais (aluguel, internet, contas fixas). A função de replicação copia automaticamente todas as contas recorrentes para o mês seguinte.
- 📈 **Gestão de Investimentos & Evolução**: Acompanhe o crescimento do seu patrimônio por modalidade (Poupança, CDB, Criptomoedas, Renda Fixa, Ações), com cálculo de rentabilidade e gráficos históricos.
- 🎯 **Lista de Desejos & Metas**: Planeje seus sonhos e metas de compra, acompanhando o valor alvo, montante já economizado, prioridades e progresso percentual.
- 🏢 **Meu Cofrin Empresas**: Módulo corporativo dedicado (B2B) com ambiente de login/cadastro empresarial e dashboard exclusivo para controle financeiro de negócios.
- 🏷️ **Categorias Personalizáveis**: Crie, edite e organize categorias próprias com ícones e cores customizadas para receitas e despesas.
- 🔑 **Autenticação Segura & Passkeys (Biometria)**: Entre com facilidade usando biometria (Touch ID, Face ID ou Windows Hello) via WebAuthn, além dos métodos de e-mail/senha e login social.
- 🛡️ **Privacidade em 1 Clique & LGPD**: Oculte valores numéricos rapidamente com a máscara de privacidade (`••••`) para usar o app em locais públicos, além de controle de inatividade de sessão e consentimento LGPD.
- 📱 **Instalável (PWA)**: Experiência nativa em smartphones e desktops com suporte a Progressive Web App (PWA) e Service Worker para carregamento ultrarrápido.
- 🌙 **Design Premium, Dark Mode & Tour Guiado**: Interface moderna de alto contraste com suporte total ao modo escuro, animações fluidas e tour guiado interativo para novos usuários.

---

## 🚀 Stack Tecnológica

Construído com tecnologia de ponta para máxima velocidade, segurança, reatividade e SEO:

| Camada | Tecnologia | Detalhes |
|---|---|---|
| **Frontend Framework** | **Angular 22+** | Signals-first (`signal`, `computed`, `resource`), Zoneless (`provideZonelessChangeDetection`) e Standalone Components |
| **Renderização & SSR** | **Angular SSR** | Server-Side Rendering integrado com servidor **Express 5** para alta performance e SEO |
| **Estilização & UI** | **Tailwind CSS v4** & **PrimeNG 21** | Design responsivo, tema moderno (Aura) com Dark Mode, PrimeIcons e Material Symbols |
| **Gráficos & Máscaras** | **Chart.js** & **ng2-charts** | Gráficos interativos; máscaras monetárias com `ngx-currency` e `ngx-mask` |
| **Backend & Cloud** | **Firebase** | Autenticação (Firebase Auth), Banco NoSQL em tempo real (Cloud Firestore), Cloud Storage e Messaging |
| **Backend Serverless** | **Cloud Functions** | Funções assíncronas em **Node 22** e TypeScript para automações, WebAuthn e e-mails transacionais (Postmark) |
| **PWA & Offline** | **Angular Service Worker** | Cache inteligente de assets e suporte a instalação como aplicativo nativo |
| **Qualidade & Testes** | **Vitest** & **Playwright** | Testes unitários com Vitest e suíte completa de testes End-to-End (E2E) com Playwright |
| **Observabilidade** | **Sentry** | Rastreamento e diagnóstico de erros e performance em tempo real |

---

## 🛠️ Para Desenvolvedores (Rodando Localmente)

### Pré-requisitos
- **Node.js**: versão 20+ ou 22 (recomendada)
- **npm**: versão 10+
- Um projeto configurado no [Firebase Console](https://console.firebase.google.com/)

### Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/coelhoadler/meu-cofrin.git
   cd meu-cofrin
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as credenciais do Firebase:**
   Crie o arquivo de ambiente a partir do modelo de exemplo:
   ```bash
   cp src/environments/environment.example.ts src/environments/environment.ts
   ```
   Preencha as chaves do seu projeto Firebase no arquivo `src/environments/environment.ts`.

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm start
   ```
   Acesse [http://localhost:4200/](http://localhost:4200/) no seu navegador. O aplicativo recarrega automaticamente a cada alteração.

---

## 📜 Comandos Úteis

| Comando | Descrição |
|---|---|
| `npm start` | Inicia o servidor local Angular em modo desenvolvimento |
| `npm run build` | Executa o build de produção (com SSR) |
| `npm test` | Executa os testes unitários utilizando Vitest |
| `npm run e2e` | Executa os testes automatizados End-to-End com Playwright |
| `npm run deploy` | Realiza o build de produção e faz deploy para o Firebase Hosting |
| `cd functions && npm run build` | Compila as Cloud Functions em TypeScript |

---

*Transforme a maneira como você cuida do seu dinheiro.*
