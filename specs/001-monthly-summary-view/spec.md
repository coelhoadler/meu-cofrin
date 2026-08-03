# Feature Specification: Monthly Summary View for Transactions

**Feature Branch**: `001-monthly-summary-view`

**Created**: 2026-08-03

**Status**: Draft

**Input**: User description: "eu quero criar uma nova funcionalidade para a minha tela de lancamentos onde nela vou ter a opção de ter uma visualização diferente. Hoje em dia eu tenho a opção de Lista, mas quero implementar a visão Resumo mensal... Vamos manter a opção Lista, implementando apenas a opção de toggle para Lista | Resumo mensal. O segundo print é a visão do Resumo mensal, nele vamos ter um consolidado por mês e eu vou ter um select no header podendo selecionar o ano. Ao clicar em 'Ver' vou retornar para a visão de Lista com o mês/ano em questão selecionado."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Monthly Summary Consolidated by Year (Priority: P1)

As a user managing personal finances, I want to switch from the transaction list to a consolidated monthly summary view for a selected year, so that I can quickly see my financial health across all 12 months at a glance without sifting through individual transactions.

**Why this priority**: Core value of the feature—giving users a high-level annual and monthly overview of total income, expenses, and net balance.

**Independent Test**: Can be tested by clicking the "Resumo mensal" toggle button and verifying that all 12 months display accurate totals for income (Receitas), expenses (Despesas), net balance (Saldo), and an overall annual balance total row.

**Acceptance Scenarios**:

1. **Given** the user is on the transaction management screen in "Lista" view, **When** the user clicks the "Resumo mensal" toggle option, **Then** the screen switches to the monthly summary view showing a monthly breakdown for the currently active year.
2. **Given** the user is in the "Resumo mensal" view, **When** the user changes the selected year in the header dropdown filter, **Then** the monthly summary table updates immediately to display consolidated totals for the selected year (January to December plus the annual total row).
3. **Given** months with transactions, **When** viewing the table, **Then** income values appear in green, expense values appear in red, net balances appear in bold, and the final row displays the annual consolidated totals ("Balanço [Ano]").

---

### User Story 2 - Navigate from Monthly Summary to Detailed List View (Priority: P2)

As a user looking at a specific month's summary in the monthly table, I want to click a "Ver" action on that month to return to the detailed List view pre-filtered by that month and year, so that I can inspect individual transactions for that period without manual filter configuration.

**Why this priority**: Enhances navigation efficiency and seamlessly connects high-level summary analysis with granular transaction details.

**Independent Test**: Can be tested by clicking "Ver" next to any month (e.g., "Junho") in the monthly summary view and verifying that the view switches back to "Lista" with Month set to "Junho" and Year set to the summary year.

**Acceptance Scenarios**:

1. **Given** the user is in the "Resumo mensal" view for year 2026, **When** the user clicks "Ver" on a specific month (e.g., "Junho"), **Then** the view switches back to "Lista" view with the Month filter set to "Junho" and the Year filter set to "2026".
2. **Given** the view switches back to "Lista" after clicking "Ver", **When** the list loads, **Then** only transactions for the selected month and year are displayed.

---

### User Story 3 - Switch Seamlessly Between List and Resumo Mensal Views (Priority: P3)

As a user, I want a clear view toggle indicator at the top of the page so that I always know which view is active and can toggle back and forth effortlessly.

**Why this priority**: Delivers intuitive user interface controls and consistent visual feedback.

**Independent Test**: Can be tested by clicking back and forth between "Lista" and "Resumo mensal" toggles and verifying the active visual state of the buttons and transition of visible content.

**Acceptance Scenarios**:

1. **Given** the user is on the transaction screen, **When** observing the view header, **Then** a toggle group with "Lista" and "Resumo mensal" options is visible.
2. **Given** the "Lista" view is active, **When** viewing the toggle group, **Then** "Lista" is highlighted as selected, and when "Resumo mensal" is clicked, "Resumo mensal" becomes highlighted as selected.

---

### Edge Cases

- **No transactions in a given year**: All 12 months and the annual balance row display R$ 0,00 for Receitas, Despesas, and Saldo without errors.
- **Negative monthly balance**: If expenses exceed income in a month, the Saldo column displays the negative amount formatted clearly according to local currency standards.
- **Future years or years with incomplete data**: Months that have not occurred or have zero records display R$ 0,00 and still allow clicking "Ver".

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a view mode toggle ("Lista" vs. "Resumo mensal") at the top of the transaction screen.
- **FR-002**: System MUST retain the existing "Lista" view layout (filters card, summary cards, and results table) when the "Lista" mode is selected.
- **FR-003**: System MUST display a consolidated 12-month table in the "Resumo mensal" view showing January through December for the selected year.
- **FR-004**: System MUST calculate and present total income ("Receitas"), total expenses ("Despesas"), and net balance ("Saldo") for each month of the selected year.
- **FR-005**: System MUST present an annual summary row at the bottom of the table titled "Balanço [Ano]" showing total income, total expenses, and net annual balance.
- **FR-006**: System MUST provide a year dropdown selection control in the "Resumo mensal" view header to allow changing the target year.
- **FR-007**: System MUST include a "Ver" action button for each month row in the monthly summary table.
- **FR-008**: System MUST transition to the "Lista" view upon clicking "Ver" for a month, automatically setting the Month and Year filters to match the selected month and summary year.
- **FR-009**: System MUST format all monetary figures in Portuguese (Brazil) currency format (`R$ X.XXX,XX`).

### Key Entities

- **Monthly Summary Record**: Represents the aggregated financial metrics for a single calendar month.
  - *Attributes*: Month Name, Year, Total Income, Total Expenses, Net Balance.
- **Annual Summary Record**: Represents the aggregated financial metrics for a full calendar year.
  - *Attributes*: Year, Annual Total Income, Annual Total Expenses, Annual Net Balance.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can toggle between "Lista" and "Resumo mensal" views in under 1 second without full page reloads.
- **SC-002**: Monthly financial totals accurately reflect 100% of underlying transactions for the selected year.
- **SC-003**: 100% of clicks on the "Ver" action successfully navigate to the List view with appropriate month and year filters pre-selected.
- **SC-004**: Users can view all 12 months and annual total row within a single organized card layout without horizontal scrolling on standard screen resolutions.

## Assumptions

- Target year options in the summary dropdown reflect available years from the user's transaction data or a reasonable default range (e.g. current year and surrounding years).
- Income values use green visual styling, expense values use red visual styling, and balance values use neutral bold formatting.
- Portuguese (pt-BR) is the standard language and currency locale for all labels, month names, and formatted monetary numbers.
