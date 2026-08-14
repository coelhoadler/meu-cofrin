# Feature Specification: Redesign da Gestão de Categorias com Ícones

**Feature Branch**: `002-category-icons-redesign`

**Created**: 2026-08-13

**Status**: Draft

**Input**: User description: "eu quero modificar a minha tela de categorias, quero deixar ela mais legal de se utilizar. Irei mudar a listagem inicial, quando eu adiciono ou edito uma nova catergoria (todos os print estão em anexo). Gostaria que você me auxiliasse em uma lib interessante para eu estar colocando os ícones mais utilizados por categorias. Hoje em dia os dados necesários são os mesmos, porém ao invés de ícone o usuário escolhe uma cor. Gostaria de remover todo esse código que não vai ser usado mais utilizado, também quero salvar no meu banco Firestore o nome do ícone selecionado, no caso de ter uma cor salva e não ter o nome do ícone, a gente vai colocar um ícone padrão. Depois vou fazer um script para deletar o campo "cor" de cada usuário, entrando em cada categoria cadastrada e verificando."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visualização e Listagem de Categorias com Ícone Visual e Destaque de Tipo (Priority: P1)

Como usuário do MeuCofrin, quero visualizar minhas categorias cadastradas em uma grade de cartões modernos e elegantes com ícones representativos e distinção de cor de alto contraste entre Despesas e Receitas (tanto no tema claro quanto no escuro), para que eu possa identificar rapidamente meus agrupamentos financeiros tanto no desktop quanto no celular.

**Why this priority**: A listagem é o ponto de entrada e o componente visual central da tela de categorias. Exibir as categorias com seus respectivos ícones (ou um ícone padrão amigável para categorias legadas) e diferenciação cromática de alto contraste (vermelho/rose para despesas e verde/emerald para receitas) estabelece clareza imediata e acessibilidade.

**Independent Test**: Pode ser testado acessando a página `/categorias` com categorias existentes no Firestore. Cada cartão deve apresentar o ícone com a paleta temática correspondente ao tipo, o nome, a tag de tipo (Despesa/Receita), descrição (se houver) e ações de edição/exclusão em ambos os temas (light e dark).

**Acceptance Scenarios**:
1. **Given** que o usuário possui categorias com um `icone` e `tipo` definidos, **When** ele acessa a tela de categorias, **Then** cada categoria é exibida em um cartão contendo o contêiner de ícone estilizado de acordo com o tipo (rose para Despesa, emerald para Receita), tag de tipo com alto contraste no tema claro e escuro, nome da categoria e botões de ação (editar e excluir).
2. **Given** que o usuário possui categorias legadas que têm apenas `cor` e não possuem `icone`, **When** a listagem é renderizada, **Then** o sistema exibe automaticamente um ícone padrão (ex: etiqueta / tag `sell`) sem disparar erros.
3. **Given** que o usuário não possui nenhuma categoria cadastrada, **When** ele acessa a tela, **Then** é exibido um estado vazio elegante e informativo incentivando a criação da primeira categoria.

---

### User Story 2 - Cadastro de Nova Categoria com Seletor de Tipo e Ícones em Modal (Priority: P1)

Como usuário do MeuCofrin, quero clicar no botão "+ Nova categoria" para abrir uma janela modal intuitiva onde posso selecionar o tipo (Despesa ou Receita), preencher nome, descrição e escolher um ícone em uma lista visual de ícones financeiros populares, para registrar minha categoria de forma prática.

**Why this priority**: Permite que o usuário cadastre novas categorias no novo formato (definindo tipo, persistindo o identificador do ícone e sem o campo de cor), viabilizando o fluxo principal de gerenciamento de categorias.

**Independent Test**: Clicar no botão "+ Nova categoria", selecionar o tipo (Despesa/Receita), preencher os campos obrigatórios, selecionar um ícone na grade de ícones disponíveis e salvar. A modal deve fechar, a listagem deve atualizar imediatamente exibindo o novo cartão com o ícone e cores condizentes ao tipo.

**Acceptance Scenarios**:
1. **Given** que o usuário está na tela de categorias, **When** ele clica no botão "+ Nova categoria", **Then** uma modal abre com o seletor de Tipo (Despesa/Receita), campos de Nome (obrigatório), Descrição (opcional) e uma grade de ícones pré-definidos para seleção.
2. **Given** que a modal de nova categoria está aberta, **When** o usuário clica sobre um ícone na grade de ícones ou alterna o tipo, **Then** o item selecionado ganha destaque visual imediato com cores de alto contraste.
3. **Given** que o usuário preenche o nome e seleciona o tipo e um ícone, **When** ele clica no botão "Salvar", **Then** a categoria é gravada no banco de dados com o identificador do ícone e tipo, a modal fecha e a categoria aparece na lista.
4. **Given** que o usuário tenta salvar sem preencher o nome obrigatório, **When** ele clica em "Salvar", **Then** o sistema exibe mensagem de validação e não envia o formulário.
5. **Given** que a modal está aberta, **When** o usuário clica em "Cancelar" ou no botão de fechar ("X"), **Then** a modal fecha sem persistir alterações e o formulário é limpo.

---

### User Story 3 - Edição de Categoria com Troca de Ícone em Modal (Priority: P2)

Como usuário do MeuCofrin, quero editar uma categoria existente clicando no botão de edição de seu cartão para alterar seu nome, descrição ou trocar o ícone selecionado.

**Why this priority**: Oferece flexibilidade para o usuário ajustar nomes ou migrar categorias antigas para novos ícones visualmente.

**Independent Test**: Clicar no ícone de lápis em um cartão de categoria existente, verificar se a modal abre com título "Editar categoria" e dados preenchidos (incluindo o ícone atualmente selecionado destacado), alterar os dados/ícone e salvar.

**Acceptance Scenarios**:
1. **Given** uma categoria na lista, **When** o usuário clica no botão de edição (lápis), **Then** a modal "Editar categoria" abre com nome, descrição e o ícone atual pré-selecionado na grade.
2. **Given** uma categoria legada sem ícone salvo, **When** a modal de edição é aberta, **Then** o ícone padrão vem selecionado por padrão na grade de ícones.
3. **Given** que o usuário modifica o nome ou seleciona outro ícone, **When** ele clica em "Salvar", **Then** os dados da categoria são atualizados no banco de dados e refletidos imediatamente na interface.

---

### User Story 4 - Exclusão de Categoria com Confirmação (Priority: P3)

Como usuário do MeuCofrin, quero excluir uma categoria que não utilizo mais, com uma confirmação prévia para evitar exclusões acidentais.

**Why this priority**: Manutenção da integridade das categorias cadastradas pelo usuário.

**Independent Test**: Clicar no ícone de lixeira em um cartão de categoria, confirmar na mensagem de confirmação e checar se o cartão é removido da listagem.

**Acceptance Scenarios**:
1. **Given** uma categoria existente, **When** o usuário clica no botão de excluir (lixeira) e confirma a ação, **Then** a categoria é removida do banco de dados e da listagem na tela.
2. **Given** que o usuário clicou no botão de excluir, **When** ele cancela a confirmação, **Then** a categoria permanece intacta.

---

### Edge Cases

- **Categoria sem ícone no banco de dados (Legado)**: A aplicação deve utilizar um ícone padrão de fallback (ex: `sell`) para evitar quebras ou espaços em branco nos cartões e na modal.
- **Lista de ícones extensa**: A grade de seleção de ícones dentro da modal deve possuir rolagem suave e layout responsivo sem estourar os limites da janela modal em dispositivos móveis.
- **Nomes longos de categoria**: O texto nos cartões de categoria deve contar com truncamento visual apropriado ou quebra de linha harmoniosa para não quebrar a diagramação dos botões de ação.
- **Comportamento offline ou falha de rede**: Ao falhar uma operação de salvar ou excluir, o usuário deve receber notificação amigável e clara sem travar a interface em estado de carregamento perpétuo.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE exibir a lista de categorias em uma grade responsiva de cartões, apresentando o ícone correspondente à esquerda, o nome da categoria e as ações de edição e exclusão à direita.
- **FR-002**: O sistema DEVE fornecer um botão "+ Nova categoria" destacado no cabeçalho da página para abrir a modal de criação.
- **FR-003**: O sistema DEVE disponibilizar uma janela modal reutilizável para operações de criação ("Nova categoria") e edição ("Editar categoria").
- **FR-004**: O formulário da modal DEVE conter os campos: `Tipo` (seletor interativo 'Despesa' | 'Receita'), `Nome` (texto, obrigatório), `Descrição` (área de texto, opcional) e `Ícone` (seletor visual interativo).
- **FR-005**: O seletor de ícones DEVE apresentar uma coleção curada de ícones populares representativos para finanças pessoais (ex: alimentação, moradia, transporte, saúde, educação, lazer, compras, salário, investimentos, contas, presentes, pet, viagens, etc.).
- **FR-006**: O sistema DEVE permitir a seleção de exatamente um ícone por categoria, destacando visualmente o item selecionado.
- **FR-007**: O sistema DEVE remover completamente o seletor de cores (`cor`) e suas referências na interface de criação e edição de categorias.
- **FR-008**: O sistema DEVE persistir no banco de dados Firestore o campo `icone` (string identificadora) junto aos dados da categoria.
- **FR-009**: O sistema DEVE tratar categorias pré-existentes sem campo `icone`, atribuindo em tempo de exibição um ícone padrão de fallback (`sell` / tag).
- **FR-010**: O sistema DEVE validar o preenchimento obrigatório do campo `Nome` antes de submeter o formulário.
- **FR-011**: O sistema DEVE permitir o cancelamento da criação/edição através de botão "Cancelar", ícone "X" de fechar ou tecla Escape, fechando a modal e resetando o estado.
- **FR-012**: O sistema DEVE solicitar confirmação do usuário antes de realizar a exclusão definitiva de uma categoria.
- **FR-013**: O sistema DEVE aplicar estilização de alto contraste compatível com os temas Claro (Light) e Escuro (Dark), diferenciando `Despesa` (tons de rose/vermelho acessíveis) e `Receita` (tons de emerald/verde acessíveis) tanto no contêiner do ícone quanto na tag de tipo do cartão e nos botões do seletor da modal.

### Key Entities *(include if feature involves data)*

- **Categoria**:
  - `id`: Identificador único do documento no Firestore.
  - `nome`: Nome descritivo da categoria (ex: "Moradia", "Salário").
  - `descricao`: Texto opcional com detalhes ou observações sobre a categoria.
  - `tipo`: Classificação do fluxo financeiro ('Despesa' | 'Receita').
  - `icone`: Identificador textual do ícone selecionado (ex: `home`, `shopping_cart`, `directions_car`, `restaurant`, `sell`, etc.).
  - `createdAt`: Timestamp de criação do registro.
  - *(Nota: O campo legado `cor` torna-se opcional/descontinuado na interface, sendo mantida a tolerância na leitura até a execução do script de limpeza pelo usuário).*

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O usuário consegue abrir a modal, selecionar um ícone e salvar uma nova categoria em menos de 20 segundos.
- **SC-002**: 100% das categorias existentes (com ou sem o novo campo de ícone) são renderizadas com um ícone visual válido na listagem sem erros de renderização.
- **SC-003**: A interface de seleção de ícones e a listagem de categorias respondem fluidamente e adaptam-se com 100% de usabilidade em telas móveis e desktop.
- **SC-004**: O código legado de seleção de cor é 100% removido da interface da tela de categorias, mantendo o formulário mais limpo e focado.
- **SC-005**: A taxa de sucesso em testes unitários e de integração de CRUD de categorias permanece em 100%.

## Assumptions

- O projeto já possui a biblioteca de ícones `material-symbols` e `primeicons` instaladas no ecossistema Angular. A biblioteca de ícones adotada para a seleção visual será a `material-symbols` (já amplamente utilizada no projeto), provendo consistência visual com os designs apresentados.
- Categorias antigas que possuam apenas `cor` gravada no Firestore continuarão funcionando normalmente, exibindo o ícone padrão de fallback `sell` até que sejam editadas ou atualizadas pelo script de limpeza do usuário.
- O script de migração de banco para deletar o campo `cor` será executado separadamente pelo usuário conforme explicitado em sua descrição, não bloqueando o funcionamento do novo frontend.
