# Aplicação Web — Front-Office

## 1. Visão Geral e Stack Tecnológica

A aplicação web da Plataforma de Badges da Softinsa constitui o Front-Office do sistema, servindo como interface principal de interação para todos os perfis de utilizador: Consultor, Talent Manager, Service Line Leader e Administrador. Trata-se de uma Single Page Application (SPA) construída sobre o ecossistema React.

### 1.1. Tecnologias Principais

| Tecnologia | Versão | Finalidade |
|---|---|---|
| React | 19.2.5 | Biblioteca de interface de utilizador (componentes reativos) |
| React Router DOM | 7.14.2 | Routing do lado do cliente (navegação SPA) |
| Vite | 8.0.10 | Bundler e servidor de desenvolvimento com HMR (Hot Module Replacement) |
| Axios | 1.15.2 | Cliente HTTP para comunicação com a API REST |
| Bootstrap | 5.3.8 | Framework CSS de base para layout e componentes utilitários |
| React Bootstrap | 2.10.10 | Componentes Bootstrap adaptados para React |
| Bootstrap Icons | 1.13.1 | Biblioteca de ícones integrada |
| i18next | 26.0.8 | Motor de internacionalização (PT, EN, ES) |
| react-i18next | 17.0.6 | Integração do i18next com React (hook `useTranslation`) |
| Recharts | 3.8.1 | Biblioteca de gráficos e visualização de dados |
| Socket.IO Client | 4.8.3 | Comunicação em tempo real via WebSocket |
| Fabric.js | 7.3.1 | Biblioteca de canvas para o editor visual de badges |
| @tsparticles/react | 3.0.0 | Animações de partículas para efeitos visuais de fundo |
| react-helmet-async | 3.0.0 | Gestão dinâmica de meta tags e títulos de página (SEO) |

### 1.2. Dimensão do Projeto

A aplicação web compreende **409 ficheiros fonte**, distribuídos por **196 componentes JSX**, **137 módulos CSS** com escopo isolado, e **6 ficheiros de tradução** (2 por cada idioma suportado). A arquitetura está organizada numa estrutura modular que separa claramente páginas, componentes reutilizáveis, features de domínio, serviços, contextos e utilitários.

---

## 2. Arquitetura da Aplicação

### 2.1. Estrutura de Diretórios

A organização do código fonte segue uma abordagem híbrida entre estrutura por funcionalidade (feature-based) e por tipo de ficheiro:

```
web/src/
├── main.jsx                    # Ponto de entrada da aplicação
├── App.jsx                     # Componente raiz com composição de providers
├── i18n.js                     # Configuração do motor de internacionalização
├── index.css                   # Importação de estilos globais
│
├── routes/                     # Configuração de routing e guardas de rota
├── layouts/                    # Layouts visuais por papel de utilizador
├── pages/                      # Páginas organizadas por papel (admin/, consultant/, management/, shared/, public/)
├── features/                   # Módulos de domínio (auth, badges, applications, structure, notifications, etc.)
├── components/                 # Componentes reutilizáveis partilhados (~70 componentes)
├── context/                    # Providers de contexto React (Auth, User, Language)
├── hooks/                      # Custom hooks partilhados
├── services/                   # Camada de serviços (API, Socket, Storage)
├── validations/                # Regras e schemas de validação client-side
├── utils/                      # Funções utilitárias (datas, coleções, telefone)
├── locales/                    # Ficheiros de tradução (pt/, en/, es/)
├── assets/                     # Estilos globais, variáveis CSS, fontes, imagens
└── config/                     # Variáveis de ambiente (.env)
```

### 2.2. Ponto de Entrada e Composição de Providers

O ficheiro `App.jsx` define a hierarquia de providers que envolvem toda a aplicação:

```
HelmetProvider          → Gestão de meta tags e SEO
  └─ BrowserRouter      → Router HTML5 do React Router
      └─ AuthProvider    → Estado de autenticação e gestão de sessão
          └─ UserProvider  → Perfil do utilizador, notificações, pontos
              └─ LanguageProvider  → Idiomas disponíveis na plataforma
                  └─ ErrorBoundary   → Captura global de erros de renderização
                      └─ AppRoutes     → Dispatcher de rotas
```

Esta ordem de aninhamento é intencional: o `AuthProvider` deve estar disponível antes do `UserProvider` (que depende do estado de autenticação), e o `LanguageProvider` carrega os idiomas disponíveis da base de dados para os formulários de seleção.

### 2.3. Padrão de Feature Modules

Cada domínio funcional da aplicação está encapsulado num módulo dentro de `features/`, seguindo uma estrutura consistente:

```
features/<domínio>/
├── api/              # Funções de chamada à API REST (uma por endpoint)
├── components/       # Componentes específicos do domínio
├── hooks/            # Custom hooks do domínio
├── layouts/          # Layouts específicos (quando aplicável)
├── pages/            # Páginas específicas do domínio
└── index.js          # Exportações públicas do módulo
```

Os módulos de domínio implementados são:

| Módulo | Descrição |
|---|---|
| **auth** | Autenticação, registo, recuperação de password, confirmação de email |
| **badges** | Gestão, catálogo, hierarquia e requisitos de badges |
| **applications** | Candidaturas a badges e fluxo de validação |
| **structure** | Gestão da hierarquia organizacional (Learning Paths, Service Lines, Áreas, Níveis) |
| **notifications** | Sistema de notificações em tempo real e gestão administrativa |
| **announcements** | Anúncios globais da plataforma |
| **statistics** | Dashboards estatísticos e exportação de dados |
| **goals** | Objetivos de aprendizagem e metas |
| **gamification** | Motor de pontos, conquistas e favoritos |
| **evolution** | Acompanhamento da progressão do consultor |
| **slas** | Gestão de Service Level Agreements |
| **gdpr** | Conformidade RGPD (consentimentos, exportação e eliminação de dados) |
| **users** | Gestão de utilizadores e perfis |

---

## 3. Sistema de Routing e Controlo de Acesso

### 3.1. Organização das Rotas

O sistema de routing está centralizado na pasta `routes/` e divide-se em ficheiros por papel de utilizador, cada um exportando um array de objetos `{ path, element }`:

- **`adminRoutes.jsx`** — Rotas exclusivas do Administrador (21 rotas)
- **`consultantRoutes.jsx`** — Rotas exclusivas do Consultor (5 rotas)
- **`tmRoutes.jsx`** — Rotas exclusivas do Talent Manager (2 rotas)
- **`sllRoutes.jsx`** — Rotas exclusivas do Service Line Leader (3 rotas)
- **`sharedRoutes.jsx`** — Rotas partilhadas por todos os utilizadores autenticados (17 rotas)
- **`paths.js`** — Constantes centralizadas com todos os caminhos URL

### 3.2. Categorias de Rotas

**Rotas Públicas (sem autenticação):**

- `/softinsa` — Microsite corporativo público
- `/softinsa/badges/:slug` — Página pública de detalhe de um badge
- `/softinsa/u/:guid` — Perfil público de um consultor
- `/verify/:link` — Verificação pública de credenciais
- `/login`, `/register` — Páginas de autenticação
- `/forgot-password`, `/reset-password`, `/confirm-email` — Fluxos de recuperação

**Rotas Protegidas (requerem autenticação):**

- Rotas do Administrador (`/admin/*`)
- Rotas do Consultor (`/catalog`, `/achievements`, `/points`, `/evolution`, `/objectives`)
- Rotas do Talent Manager (`/consultants`, `/consultants/:userGuid`)
- Rotas do Service Line Leader (`/team`, `/team/:userGuid`, `/badge-history`)
- Rotas partilhadas TM+SLL (`/validations`, `/stats`, `/badges`)
- Rotas comuns a todos (`/`, `/search`, `/profile`, `/settings`, `/ranking`, `/announcements`, `/privacy`, `/security`)

### 3.3. Guardas de Rota

O sistema implementa três níveis de proteção:

1. **`ProtectedRoute`** — Verifica se o utilizador está autenticado. Se não estiver, redireciona para `/login`. Suporta renderização otimista durante o carregamento quando existe uma sessão armazenada em `localStorage`, evitando um flash de ecrã de loading. Também gere o fluxo de mudança obrigatória de password (FPC — Force Password Change), redirecionando para `/change-password` quando o flag `fpc` está ativo.

2. **`RoleRoute`** — Recebe um array `allowedRoles` e verifica se o papel do utilizador está incluído. Caso contrário, renderiza a página de erro 403 (Forbidden). Durante o carregamento do perfil, renderiza o `Outlet` para permitir a exibição do skeleton de loading.

3. **`PublicRoute`** — Envolve as rotas de autenticação, impedindo o acesso por utilizadores já autenticados.

### 3.4. Layouts por Papel

O componente `RoleLayout` atua como dispatcher: com base no papel do utilizador autenticado, seleciona o layout correspondente (`ConsultantLayout`, `TmLayout`, `SllLayout`, `AdminLayout`). Cada layout configura um menu lateral (Sidebar) com as opções de navegação específicas do papel e partilha a estrutura visual comum (TopBar, Footer, área de conteúdo principal).

Durante o carregamento do perfil do utilizador, o `RoleLayout` exibe um skeleton de dashboard completo (Sidebar vazia + TopBar + DashboardSkeleton), proporcionando uma experiência de carregamento suave.

---

## 4. Funcionalidades por Papel de Utilizador

### 4.1. Consultor

O Consultor é o utilizador central da plataforma, com acesso às seguintes funcionalidades:

#### 4.1.1. Dashboard do Consultor

Página de aterragem personalizada que apresenta um cartão de boas-vindas com saudação contextual, as últimas 4 candidaturas submetidas com o respetivo estado (chips coloridos por estado), e um carrossel horizontal de badges por descobrir na área primária do consultor. Inclui estados vazios com call-to-action para explorar o catálogo.

#### 4.1.2. Catálogo de Badges

Interface de pesquisa e descoberta de badges com vista em grelha (3 colunas em desktop, responsivo), painel de filtros avançados incluindo: Learning Path (cascading), Service Line, Área, Nível de Progressão (A-E), Tipo de Badge (Standard/Special), Intervalo de Pontos (0-5000 com range slider duplo), badges em expiração e estado de obtenção (Todos/Obtidos/Não Obtidos). Suporta marcação de favoritos (ícone de coração) e paginação de 12 badges por página.

#### 4.1.3. Detalhe de Badge

Página de informação detalhada de um badge que exibe a imagem, título, tipo, metadados hierárquicos (Learning Path, Service Line, Área), pontos, duração de validade, descrição e lista de requisitos. Cada requisito apresenta código, título e descrição. Inclui carrossel de badges relacionados (mesma Service Line), botão de candidatura (com gate RGPD na primeira utilização) e download de certificado (quando já obtido).

#### 4.1.4. Minhas Candidaturas

Vista consolidada de todas as candidaturas do consultor, com contadores por estado (Open, Submitted, In validation, Accepted, Rejected) e navegação por tabs para filtragem. Cada cartão de candidatura exibe a imagem do badge, nome, área, data de submissão e estado com codificação por cor (azul=Open, púrpura=Submitted, laranja=In validation, verde=Accepted, vermelho=Rejected).

#### 4.1.5. Detalhe de Candidatura

Quando a candidatura está no estado Open, o consultor pode editar a candidatura: carregar ficheiros de evidência para cada requisito, pré-visualizar os ficheiros carregados e submeter a candidatura para validação. Inclui validação de formulário e funcionalidade de guardar rascunho.

#### 4.1.6. Conquistas (Achievements)

Galeria de badges obtidos com estatísticas resumo (total de badges, total de pontos, próximo marco), visualização de marcos (milestones) aos 1, 3, 5, 10 e 25 badges, e funcionalidade de destaque (toggle para mostrar badges no perfil público). Inclui um modal de celebração (CelebrationModal) com animação de confetti quando o consultor atinge um novo marco, com suporte para `prefers-reduced-motion`.

#### 4.1.7. Evolução

Representação visual do percurso de aprendizagem com gráficos de linha/área (timeline de aquisição de badges), radar (badges por área), barras (badges por nível), e heatmap de atividade dos últimos 28 dias. Apresenta estatísticas de taxa de aprovação, tempo médio de validação e posição no ranking.

#### 4.1.8. Pontos e Ranking

Dashboard de gamificação com histórico de pontos por mês (6 meses), pontos por dia da semana, heatmap de atividade, barras de progresso por Learning Path, top badges obtidos, tabela de ranking com filtros por Service Line e Área, e comparação entre pares.

#### 4.1.9. Objetivos

Acompanhamento de metas de aprendizagem com estatísticas globais (total, ativos, concluídos), cartões de objetivo com título, descrição, Learning Path, nível, dias restantes e barra de progresso de requisitos. Os objetivos são agrupados por Área com visualização de timeline de progressão.

#### 4.1.10. Assinatura de Email

Gerador de assinatura HTML para email corporativo que inclui o nome, papel, email e badges obtidos do consultor. A assinatura pode ser copiada e colada em clientes como Gmail e Outlook, com instruções visuais de configuração incluindo ícones SVG dos respetivos clientes. Cada badge na assinatura inclui um link de verificação pública.

### 4.2. Talent Manager

O Talent Manager tem acesso às funcionalidades de gestão de equipa e validação de candidaturas:

#### 4.2.1. Dashboard de Gestão

Visão geral com KPIs: candidaturas pendentes (estado Submitted), total de consultores, badges atribuídos, taxa de aprovação (%) e badges em expiração. Inclui gráficos de barras verticais (badges por Service Line) e donut (distribuição por nível), e top 5 consultores do ranking.

#### 4.2.2. Quadro de Validações

Fila de candidaturas aguardando revisão, apresentada em formato tabular com colunas: nome do consultor, nome do badge, Service Line, Área, data de submissão e estado (pill colorido). Filtrado por defeito para candidaturas no estado "Submitted". Suporta paginação (12 por página), ordenação e atualização automática (a cada 2 minutos e ao focar o tab).

#### 4.2.3. Revisão de Candidatura

Interface de revisão detalhada com layout em coluna principal + barra lateral. A coluna principal exibe o cabeçalho do consultor, timeline do processo (submissão → validação TM → decisão SLL → emissão), cartão de informação do badge e cartões de requisito em formato acordeão com: código, título, descrição, pré-visualização/download de ficheiros de evidência, e toggle de validação (Marcar Correto). A barra lateral contém o resumo de validação (anel de percentagem), painel de decisão com notas do revisor (obrigatórias para devolver/rejeitar) e botões de ação: "Aprovar e Encaminhar" ou "Solicitar Retificação". Após a decisão, apresenta um ecrã de resultado com ícone e tom adequado ao resultado.

#### 4.2.4. Lista de Consultores

Vista tabular de todos os consultores do sistema com colunas de nome, pontos, badges, última atualização, taxa de aprovação e tempo médio de validação. Suporta filtros por nome, Service Line, Área e intervalo de pontos, com paginação de 20 por página.

#### 4.2.5. Detalhe de Consultor

Vista detalhada do desempenho individual com cabeçalho (avatar, nome, área primária, pontos, badges), gráfico de timeline de evolução (aquisição de badges ao longo do tempo), e histórico de badges com toggle entre "Obtidos" (Accepted) e "Em Processo" (Open/Submitted/In validation).

### 4.3. Service Line Leader

O Service Line Leader partilha várias funcionalidades com o Talent Manager, com as seguintes especificidades:

- **Dashboard**: Filtrado exclusivamente para a sua Service Line. O KPI de "badges em expiração" está oculto.
- **Quadro de Validações**: Filtrado por defeito para candidaturas no estado "In validation". A coluna de Service Line não é exibida (implícita).
- **Revisão de Candidatura**: Apresenta a opinião prévia do Talent Manager. Botões de ação: "Aprovar e Publicar", "Rejeitar" ou "Devolver ao Consultor".
- **Equipa (Team)**: Lista de consultores restrita à sua Service Line.
- **Detalhe de Consultor**: Inclui secção de comparação entre pares (peer comparison) com dropdown para selecionar consultor de comparação, posição no grupo, gráficos comparativos de pontos e badges, e tabela dos melhores pares.
- **Histórico de Badges**: Vista histórica de todos os badges atribuídos na sua Service Line.

### 4.4. Administrador

O Administrador tem acesso completo à plataforma, incluindo todas as funcionalidades de gestão:

#### 4.4.1. Dashboard Administrativo

Painel de controlo com KPIs globais: total de utilizadores, total de badges, Learning Paths, Service Lines, Áreas e candidaturas. Inclui distribuição de candidaturas por estado, anúncios recentes e SLAs recentes com indicadores de estado (Ativo, A Expirar, Expirado).

#### 4.4.2. Gestão de Badges

Interface CRUD completa com vista em grelha de cartões, filtros avançados (pesquisa, Learning Path, Service Line, Área, Nível, Tipo, Intervalo de Pontos, badges em expiração), indicadores de estado (Ativo/Inativo com pills visuais), e ações rápidas (Editar, Desativar/Reativar com modal de confirmação).

#### 4.4.3. Formulário de Badge (Criar/Editar)

Formulário completo com campos: título, Learning Path (seleção em cascata), Service Line (filtrada pela LP selecionada), Área (filtrada pela SL), Nível de Progressão (filtrado para evitar duplicação), tipo (Standard/Special), pontos, duração de expiração (dias), URL de imagem com picker, descrição e toggle ativo/inativo. Inclui gestor de requisitos com operações CRUD para cada requisito (código, título, descrição).

#### 4.4.4. Gestão de Utilizadores

Vista tabular com colunas de nome + email + avatar, username, papel (pill colorido por papel), estado ativo/inativo (indicador visual), e ações (Editar, Desativar/Reativar). Suporta filtros por nome/email, papel, Service Line e Área. Inclui modal de criação de novo utilizador e link para página de detalhe do perfil.

#### 4.4.5. Gestão de Estrutura Organizacional

Hub de navegação para as quatro entidades hierárquicas: Learning Paths, Service Lines, Áreas e Níveis de Progressão. Cada entidade tem uma vista de lista/detalhe com operações CRUD completas (criar, editar, eliminar), contadores de entidades filhas, e modais de criação/edição específicos. Inclui breadcrumb de navegação, cartões de subestrutura, e exportação da estrutura.

#### 4.4.6. Gestão de Notificações

Configuração global de preferências de notificação com toggles por tipo (anúncio publicado, candidatura submetida/aprovada/rejeitada, objetivo vencido, badge a expirar/expirado, violação de SLA) e por canal (In-app, Email, Push).

#### 4.4.7. Gestão de SLAs

Criação e gestão de Service Level Agreements com intervalos de datas, acompanhamento de expiração (Ativo, A Expirar, Expirado), e operações de edição/eliminação.

#### 4.4.8. Conformidade RGPD

Painel de gestão de privacidade e conformidade com o Regulamento Geral de Proteção de Dados, incluindo gestão de políticas, consentimentos de utilizadores e pedidos de dados.

#### 4.4.9. Estatísticas e Relatórios

Dashboard estatístico com distribuição de candidaturas por estado, métricas de utilizadores, desempenho por Service Line, e funcionalidades de exportação.

### 4.5. Funcionalidades Partilhadas (Todos os Papéis)

#### 4.5.1. Pesquisa Global

Motor de pesquisa centralizado (`/search`) que permite pesquisar em múltiplos tipos de entidade (badges, utilizadores, etc.) com resultados agrupados por tipo e resumos em cartão.

#### 4.5.2. Ranking Global

Tabela de classificação de consultores com pódio destacado (top 3 com estilização especial: medalhas dourada/prateada/bronze com anel colorido), tabela com restantes consultores, filtros por Service Line e Área, e destaque da posição pessoal do utilizador. Paginação de 30 por página.

#### 4.5.3. Perfil de Utilizador

Vista de perfil com avatar (com fallback para iniciais), informações pessoais, biografia, competências, interesses, metas e estatísticas (total de badges, pontos, taxa de aprovação, objetivos ativos). Modo de edição com upload de imagem, gestão de interesses e metas. Secção de badges em destaque e link para perfil público.

#### 4.5.4. Definições

Página de configurações com seleção de idioma (Português, Inglês, Espanhol) através de botões segmentados, e links para política de privacidade e gestão de segurança/password.

#### 4.5.5. Anúncios

Feed centralizado de anúncios da plataforma com ordenação por data, filtro e pesquisa.

#### 4.5.6. Privacidade (RGPD)

Página de privacidade do utilizador com histórico de consentimentos, funcionalidade de exportação de dados pessoais (download em formato JSON com nome `os-meus-dados-YYYY-MM-DD.json`), e pedido de eliminação de conta com modal de confirmação e subsequente logout automático.

#### 4.5.7. Segurança

Gestão de password e informações de segurança da conta.

### 4.6. Páginas Públicas (Sem Autenticação)

#### 4.6.1. Microsite Corporativo Softinsa

Landing page pública em `/softinsa` que apresenta a plataforma com: hero com CTA, secção "Sobre o Projeto", funcionalidades em destaque (Learning Paths, Credenciais Verificáveis, Gamificação, Validação por Especialistas, Estatísticas, Multilíngue), perfis de utilizador, catálogo público de badges, explicação do fluxo em 4 passos, e footer com links corporativos e políticas. Inclui animação de revelação por scroll (IntersectionObserver) e suporte multilingue.

#### 4.6.2. Verificação Pública de Badge

Página em `/verify/:link` que permite a qualquer pessoa verificar a autenticidade de uma credencial digital através de um link único, exibindo os detalhes do badge, o consultor que o obteve, a data de obtenção e o estado de validade.

#### 4.6.3. Perfil Público de Consultor

Portfólio público de um consultor em `/softinsa/u/:guid` com nome, papel, localização, headline profissional, biografia, galeria de badges em destaque, contagem total de badges/pontos e competências/interesses.

---

## 5. Gestão de Estado

### 5.1. Contextos React

A aplicação utiliza três contextos React como mecanismo principal de gestão de estado global:

**AuthContext** — Responsável pelo ciclo de vida da sessão de autenticação. Gere o token JWT, o estado de autenticação, o flag de mudança de password obrigatória (FPC), e o mecanismo de refresh automático do token. Implementa persistência de sessão via `localStorage` com dois modos: sessão persistente ("Lembrar-me", com janela de atividade de 5 minutos) e sessão efémera (janela de atividade de 10 minutos). Monitoriza a atividade do utilizador (mousemove, click, keydown) com debounce de 10 segundos e verifica a necessidade de refresh do token a cada 30 segundos, acionando o refresh quando o tempo restante é inferior a 60 segundos.

**UserContext** — Gere o perfil do utilizador autenticado, as preferências de idioma, os pontos de gamificação (apenas para Consultores) e todo o subsistema de notificações. Integra-se com o WebSocket (Socket.IO) para receber notificações em tempo real, mantendo contadores de notificações não lidas por tipo (HOME, BADGES, APPLICATIONS, ACHIEVEMENTS, POINTS, OBJECTIVES, EVOLUTION, ANNOUNCEMENTS, SYSTEM). Expõe métodos para marcar notificações como lidas, buscar notificações paginadas, atualizar o perfil e alterar o idioma.

**LanguageContext** — Carrega e armazena em cache a lista de idiomas disponíveis na plataforma a partir da API. Utiliza memoização de Promise para garantir uma única chamada à API por ciclo de vida da aplicação, com fallback silencioso para array vazio em caso de falha.

### 5.2. Custom Hooks

| Hook | Descrição |
|---|---|
| `useAuth()` | Acede ao AuthContext com verificação de erro |
| `useUser()` | Acede ao UserContext com verificação de erro |
| `useFormValidation()` | Gestão de estado de formulário sem bibliotecas externas (values, touched, errors, submitAttempted) |
| `useFormWithServerErrors()` | Estende o anterior com tratamento de erros do servidor, mesclando erros client-side e server-side |
| `useNotifications()` | Acesso conveniente ao subsistema de notificações do UserContext |
| `usePhoneMetadata()` | Carregamento e cache de metadados para validação de números de telefone |
| `useStructureCounts()` | Contadores de entidades da estrutura organizacional |

---

## 6. Comunicação com o Backend

### 6.1. Camada de Serviço HTTP (Axios)

A comunicação com a API REST é centralizada numa instância Axios configurada em `services/api.js`, com:

- **Base URL**: `${import.meta.env.API_URL}/api`, com proxy Vite em desenvolvimento
- **Credenciais**: `withCredentials: true` (inclusão de cookies)
- **Content-Type**: `application/json`

**Interceptor de Pedido** — Injeta automaticamente o header `Authorization: Bearer <token>` em todos os pedidos quando o token existe. Em modo de desenvolvimento, adiciona metadados de rastreio (timestamp de início, caller stack trace) para diagnóstico de performance.

**Interceptor de Resposta** — Em modo de desenvolvimento, regista detalhes de cada resposta na consola (método, URL, status, duração, dados). Para respostas 401, implementa retry automático: (1) marca o pedido com `_retry` para evitar loops infinitos, (2) tenta um refresh do token via `POST /auth/refresh`, (3) se bem-sucedido, reenvia o pedido original com o novo token; (4) se falhar, dispara um evento `auth:logout` para limpar a sessão.

**Refresh do Token** — A função `performRefresh()` implementa deduplicação de pedidos via memoização de Promise: múltiplas chamadas simultâneas partilham a mesma Promise, evitando pedidos duplicados ao servidor.

### 6.2. Comunicação em Tempo Real (WebSocket)

A aplicação utiliza Socket.IO para comunicação bidirecional em tempo real, configurada em `services/socket.js`:

- **Autenticação**: O token JWT é enviado no payload `auth` da conexão
- **Reconexão**: Habilitada com backoff exponencial (1s inicial, máximo 30s), tentativas infinitas
- **Atualização de Token**: A cada tentativa de reconexão, o socket obtém o token mais recente (que pode ter sido refrescado pelo interceptor Axios)

Os eventos WebSocket tratados no `UserContext` são:

- `notification:new` — Nova notificação recebida: adicionada ao topo da lista, incrementa contadores, e atualiza pontos se a notificação for do tipo POINTS ou ACHIEVEMENTS
- `notification:read` — Notificação marcada como lida: atualiza o estado na lista, decrementa contador e recalcula contadores por tipo
- `notification:all-read` — Todas marcadas como lidas: reseta todos os contadores

### 6.3. Armazenamento de Ficheiros (Supabase Storage)

O serviço de armazenamento (`services/storage.js`) utiliza o Supabase Storage com URLs pré-assinadas:

1. Validação local do ficheiro (tipo MIME e extensão)
2. Obtenção de URL de upload pré-assinada via API
3. Upload direto do browser para o Supabase (com header `apikey`)
4. Receção do URL público do ficheiro
5. Envio do caminho de armazenamento à API para associação à entidade

Limites: imagens de perfil até 2 MB, ficheiros de evidência até 10 MB. Formatos aceites: JPEG, PNG, WebP, GIF, BMP, SVG, HEIC, HEIF (imagens); PDF, JPEG, PNG, ZIP (evidências).

---

## 7. Design Visual e Estilização

### 7.1. Arquitetura CSS

A aplicação segue uma abordagem de estilização em três camadas:

1. **Bootstrap 5.3.8** — Framework CSS de base importado globalmente, com overrides customizados para alinhar com o tema da plataforma (cores de foco, badges de estado, tabelas, botões)
2. **Variáveis CSS globais** — Sistema completo de design tokens definido em `assets/styles/colors.css`, seguindo princípios do Material Design 3 com naming semântico
3. **CSS Modules** — 137 ficheiros `.module.css` com escopo isolado por componente, garantindo zero conflitos de nomes

### 7.2. Sistema de Cores e Design Tokens

O sistema de cores segue uma arquitetura inspirada no Material Design 3 com pares semânticos (cor + cor-on) para garantir conformidade de contraste:

| Token | Valor | Utilização |
|---|---|---|
| `--color-primary` | `#00B8E0` (Ciano) | Cor principal da marca, botões, links |
| `--color-secondary` | `#39639C` (Azul) | Elementos de suporte, containers |
| `--color-error` | `#B3261E` (Vermelho) | Estados de erro, validação |
| `--color-success` | `#04CE00` (Verde) | Confirmações, estados aceites |
| `--color-warning` | `#CFA600` (Âmbar) | Alertas, estados em validação |
| `--color-background` | `#FDF7FF` | Fundo geral da aplicação |
| `--color-surface` | `#F5FAFD` | Superfícies de cartões e painéis |

Além das cores base, o sistema define:

- Variantes de opacidade para estados interativos (hover a 8%, 12%; focus ring a 15%, 25%)
- Gradientes para campos, dropdowns e painéis (`--gradient-surface-field`, `--gradient-surface-dropdown`, `--gradient-surface-panel`)
- Cores suaves para cartões de perfil e secções (azul, laranja, verde, vermelho, púrpura)
- Intensidades de heatmap (5 níveis: empty, low, medium, high, max)
- Sombras de cartão (`--shadow-card`)

**Tipografia**: Família `Inter` com fallback para `Roboto` e `system-ui`. Headings com peso 700-800 e letter-spacing negativo (-0.01em a -0.02em).

### 7.3. Design Responsivo

A aplicação suporta dispositivos desde 300px de largura (requisito do projeto), utilizando uma abordagem mobile-first com os seguintes breakpoints principais:

| Breakpoint | Adaptação |
|---|---|
| ≤ 360px | Telefones muito pequenos: layouts compactados |
| ≤ 576px | Smartphones: grids de coluna única, botões empilhados |
| ≤ 768px | Tablets: grids de 2 colunas, sidebar em drawer |
| ≤ 991px | Tablets landscape: transição sidebar desktop/mobile |
| ≤ 1200px | Desktop: grids de 3 colunas, layouts expandidos |

Padrões responsivos implementados:

- Mudança de direção flex (coluna em mobile, linha em desktop)
- Reflow de grids (3→2→1 colunas)
- Sidebar colapsável (rail de ícones em desktop, drawer off-canvas em mobile)
- Redução de padding e tamanho de fonte em breakpoints menores
- Empilhamento vertical de botões em ecrãs estreitos

### 7.4. Animações e Transições

A aplicação implementa um conjunto de animações CSS para melhorar a experiência do utilizador:

| Animação | Duração | Utilização |
|---|---|---|
| `spin` | 0.65s linear | Spinners de carregamento |
| `slideIn` | 300ms ease | Entrada de toasts |
| `pop` | 0.3s ease-out | Entrada de modais |
| `shimmer` | 1.6s ease-in-out | Skeletons de carregamento |
| `cardGlow` | 3.6s ease-out | Brilho de badges especiais |
| `fuseTrace` | 2.8s ease-in-out | Animação de bordo com gradiente cónico (badges premium) |
| `bounce` | 0.9s ease | Emoji de celebração |
| `fall` | Variável | Confetti de celebração |
| `dropdownIn` | 0.18s ease | Abertura de dropdowns |

Todas as animações respeitam a media query `prefers-reduced-motion: reduce`, desativando efeitos visuais para utilizadores com sensibilidade a movimento.

---

## 8. Internacionalização (i18n)

### 8.1. Configuração

O sistema de internacionalização utiliza o i18next com deteção automática do idioma do browser (via `i18next-browser-languagedetector`) e fallback para Português (PT).

A configuração define dois namespaces de tradução:

- **`common`** — Strings de UI (labels, botões, mensagens, conteúdo) — ~1.925 linhas por idioma
- **`api`** — Mensagens de erro da API traduzidas — ~96 linhas por idioma

### 8.2. Idiomas Suportados

| Código ISO | Idioma | Papel |
|---|---|---|
| `pt` | Português (Portugal) | Idioma predefinido e de fallback |
| `en` | Inglês (Grã-Bretanha) | Segundo idioma |
| `es` | Espanhol (Espanha) | Terceiro idioma |

### 8.3. Cobertura de Tradução

Os ficheiros de tradução cobrem todas as secções da aplicação: microsite público, autenticação (login, registo, recuperação de password), dashboard por papel, catálogo de badges, candidaturas, conquistas, evolução, pontos, objetivos, gestão de utilizadores e estrutura, validações, perfil, definições, privacidade, notificações, erros da API, e mensagens de validação de formulários.

As traduções utilizam interpolação de variáveis (ex: `{{count}}`, `{{badgeTitle}}`, `{{daysRemaining}}`) e formas plurais (ex: `retrySeconds_one`, `retrySeconds_other`).

### 8.4. Fluxo de Mudança de Idioma

A mudança de idioma é efetuada na página de Definições através de botões segmentados. Quando o utilizador seleciona um novo idioma: (1) a UI é atualizada imediatamente via `i18next.changeLanguage()`, (2) a preferência é persistida no servidor via `PATCH /me/language/{id}`, e (3) o estado local é atualizado no `UserContext`. A falha na persistência no servidor é não-bloqueante (a UI permanece atualizada).

---

## 9. Componentes Reutilizáveis

A aplicação dispõe de uma biblioteca de ~70 componentes reutilizáveis organizados em `components/`, seguindo o princípio de uma única responsabilidade por ficheiro (cada componente numa pasta própria com ficheiro `.jsx` e `.module.css`).

### 9.1. Componentes de Layout e Navegação

| Componente | Descrição |
|---|---|
| **Sidebar** | Barra lateral de navegação com modo colapsado (rail de ícones em desktop), drawer off-canvas em mobile com backdrop, e badges de contagem de notificações por secção |
| **TopBar** | Barra superior com logo, barra de pesquisa global, cartão de pontos (Consultores), notificações (NotificationBell), seletor de idioma e dropdown de utilizador |
| **Footer** | Rodapé com links institucionais e informações de copyright |

### 9.2. Componentes de Formulário

| Componente | Descrição |
|---|---|
| **FormInput** | Input de texto com suporte para label, placeholder, ícone, estados de erro (bordo e texto vermelho), e integração com validação |
| **FormButton** | Botão de formulário com variantes (filled, outlined) e estado de loading (spinner integrado) |
| **FormAlert** | Alerta de formulário com variantes semânticas (sucesso, erro, aviso) |
| **CustomSelect** | Select customizado com navegação por teclado (setas), animação de abertura, inversão vertical automática para manter-se no viewport, indicador de seleção (checkmark), e variante compacta |
| **DatePicker** | Calendário com grelha de 7 colunas, navegação mensal, destaque do dia atual e data selecionada, e datas desativadas |
| **DateTimePicker** | Extensão do DatePicker com seleção de hora |
| **RangeSlider** | Slider com track, fill indicator, thumb customizado com focus ring, e label com valor atual |
| **FileDropZone** | Zona de drag-and-drop para upload de ficheiros com feedback visual, lista de ficheiros com tamanho, botões de remoção e ícones por tipo de ficheiro |
| **PasswordToggle** | Toggle de visibilidade da password |
| **PasswordRules** | Visualização das regras de complexidade da password (mínimo 8 caracteres, maiúscula, minúscula, dígito, caractere especial) com indicadores visuais |
| **FilterSearchInput** | Input de pesquisa com ícone e funcionalidade de limpar |
| **AreaPickerList** | Lista pesquisável e paginada de seleção de áreas para consultores, com multi-seleção (máximo 5), indicador de área primária e chips de seleção |

### 9.3. Componentes de Exibição de Dados

| Componente | Descrição |
|---|---|
| **BadgeCard** | Cartão de badge com imagem, tipo (pill Standard/Special), título, descrição, metadados (Área, Nível, Pontos). Badges especiais/premium têm animações de brilho (cardGlow) e revelação de bordo com gradiente cónico (fuseTrace) |
| **ContentCard** | Cartão de conteúdo genérico com cabeçalho (CardHeader) |
| **WelcomeCard** | Cartão de boas-vindas com saudação contextual e StatCards para KPIs |
| **ProfileStatItem** | Item de estatística de perfil (ícone + valor + label) |
| **InfoRow** | Linha de informação chave-valor |
| **Avatar** | Avatar de utilizador com fallback para iniciais |
| **Chip** | Pill com funcionalidade de remoção |
| **BulletItem / CheckItem** | Itens de lista com bullet ou checkbox |

### 9.4. Componentes de Gráficos (Recharts)

| Componente | Descrição |
|---|---|
| **ActivityHeatmap** | Mapa de calor de atividade com 5 níveis de intensidade (empty, low, medium, high, max), configurável por semanas |
| **HorizontalBar** | Gráfico de barras horizontais |
| **VerticalBar** | Gráfico de barras verticais |
| **LineArea** | Gráfico de linha com área preenchida |
| **PieDonut** | Gráfico de donut/pizza |

### 9.5. Componentes de Feedback e Interação

| Componente | Descrição |
|---|---|
| **Modal** | Modal genérico com tamanhos responsivos (sm: 420px, default: 560px, lg: 720px, xl: 1100px), backdrop com 45% opacidade, max-height 90vh com scroll, e layout header/body/footer |
| **CelebrationModal** | Modal de celebração de marcos com confetti CSS (36 peças animadas), emoji bouncing, e respeito por prefers-reduced-motion |
| **GdprConsentModal** | Gate de consentimento RGPD que verifica se o utilizador já aceitou a política atual antes de mostrar o modal |
| **ConfirmToast** | Toast de confirmação com backdrop com blur e gradiente |
| **SaveToast** | Toast de salvamento automático |
| **Spinner** | Spinner de carregamento com animação de rotação (0.65s) e variantes de cor |
| **LoadingScreen** | Ecrã de carregamento de página inteira |
| **Tooltip** | Tooltip com posicionamento automático |
| **Pagination** | Componente de paginação com botões de página e contagem responsiva de botões (3-8 conforme a largura do ecrã) |
| **Tabs** | Componente de tabs com navegação horizontal e badges opcionais de contagem |
| **Stepper** | Componente de passos para fluxos multi-etapa |
| **ErrorBoundary** | Captura de erros de renderização com ecrã de fallback (título, subtítulo, botão para recarregar) |

### 9.6. Componentes Especializados

| Componente | Descrição |
|---|---|
| **BadgeEditor** | Editor visual de badges baseado em Fabric.js com canvas 450×450px, suporte para formas (círculo, retângulo, hexágono, escudo), texto, imagens, gradientes, undo/redo, snap guidelines, templates pré-definidos, e exportação SVG. Inclui ToolbarPanel e PropertiesPanel |
| **BadgeImagePicker** | Seletor de imagem para badges |
| **BadgeRequirementsManager** | Gestor de requisitos de badge com operações CRUD |
| **ParticlesBackground** | Fundo animado com partículas (@tsparticles) utilizado nas páginas de autenticação |
| **ExportsPanel** | Painel de exportação de dados |
| **UserFilters** | Barra de filtros abrangente para gestão de utilizadores com filtros rápidos (papel, estado) e filtros avançados colapsáveis (Service Line, Área, email confirmado, RGPD aceite, intervalo de datas, intervalo de pontos) |
| **NotificationBell** | Sino de notificações com painel deslizante, contagem de não lidas, e paginação infinita |
| **Logo** | Componente de logotipo da aplicação |

### 9.7. Skeletons de Carregamento

A aplicação implementa 6 variantes de skeleton loading para diferentes tipos de página:

| Skeleton | Utilização |
|---|---|
| **DashboardSkeleton** | Páginas de dashboard |
| **CardGridSkeleton** | Grelhas de cartões (catálogo, badges) |
| **DetailPageSkeleton** | Páginas de detalhe |
| **ListSkeleton** | Listas e tabelas |
| **TableSkeleton** | Tabelas de dados |
| **StructureDetailSkeleton** | Páginas de detalhe de estrutura |

Todos utilizam a animação `shimmer` (1.6s ease-in-out infinite) para simular o carregamento de conteúdo.

### 9.8. Padrões de Componentes Identificados

| Padrão | Componentes | Descrição |
|---|---|---|
| **Polimórfico** | Button, SidebarOption, DropdownOption | Prop `as` permite renderizar como diferentes elementos HTML |
| **Compound Component** | Sidebar + SidebarOption, ContentCard + CardHeader, WelcomeCard + StatCard | Componente pai com sub-componentes acoplados |
| **Controlled/Uncontrolled** | SearchBar, FormInput | Suportam ambos os padrões de controlo de estado |
| **Gate Component** | GdprConsentModal | Bloqueia ação até condição cumprida |
| **Memoização** | ParticlesBackground | `React.memo` para evitar re-renderizações desnecessárias |

---

## 10. Validação de Dados

### 10.1. Validação Client-Side

O sistema de validação client-side está centralizado na pasta `validations/` e é composto por:

**Regras de Validação (`rules.js`)** — Funções puras de validação para cada tipo de campo:

- Nome completo (2-255 caracteres)
- Username (3-50 caracteres, alfanumérico com `.` e `_`)
- Email (formato válido, máximo 255 caracteres)
- Password (mínimo 8 caracteres, maiúscula, minúscula, dígito, caractere especial, máximo 100)
- Número de telefone (formato internacional com validação via libphonenumber)
- Data de nascimento (data válida, não futura, idade mínima 16 anos)
- Biografia (máximo 5000 caracteres ou 500 palavras)
- Áreas do consultor (1-5 áreas, sem duplicados, máximo 1 primária)
- Confirmação de password (correspondência entre campos)

**Schemas de Formulário (`forms.js`)** — Funções que agrupam validações por formulário:

- `validateLoginForm` — identifier + password
- `validateRegisterStep2` — nome, username, email, password
- `validateRegisterStep3` — telefone, nascimento, biografia, idioma, localização, áreas (Consultor)
- Schemas adicionais para perfil, badges, estrutura, etc.

**Hook de Validação (`useFormValidation`)** — Gestão de estado de formulário sem dependências externas, com: valores, campos tocados, erros, flag de tentativa de submissão, e lógica de visibilidade de erros (mostra quando campo tocado OU formulário submetido).

**Tratamento de Erros do Servidor (`useFormWithServerErrors`)** — Extensão que mescla erros de validação do cliente com erros campo-a-campo retornados pelo servidor, limpando automaticamente os erros do servidor quando o utilizador interage com o campo afetado.

**Verificação de Disponibilidade (`useAvailability`)** — Hook assíncrono que verifica em tempo real a disponibilidade de username e email durante o registo/edição de perfil.

**Mapeamento de Erros da API (`apiErrors.js`)** — Função `resolveErrorMessage` que traduz códigos de erro da API em mensagens legíveis ao utilizador, utilizando o namespace `api` do i18next.

### 10.2. Feedback Visual de Erro

Os campos com erros de validação recebem:

- Bordo na cor de erro (`--color-error`)
- Fundo na cor do container de erro (`--color-error-container`)
- Mensagem de erro em texto vermelho abaixo do campo
- Focus ring na cor de erro

---

## 11. Acessibilidade

A aplicação implementa diversas práticas de acessibilidade:

- **Focus Visible** — Todos os elementos interativos utilizam `:focus-visible` com anéis de foco de 3px na cor primária
- **ARIA** — Atributos `aria-hidden="true"` em ícones decorativos, `aria-label` em botões de ação, `role="dialog"` e `aria-modal="true"` em modais, `role="alertdialog"` em confirmações, `role="status"` e `aria-live="polite"` em toasts
- **Navegação por Teclado** — Componentes customizados (CustomSelect, Modal, CelebrationModal) mantêm gestão de foco e respondem ao Escape. O CustomSelect suporta navegação por setas, Home/End, e pesquisa por digitação
- **Contraste de Cores** — Sistema de pares semânticos `--color-on-*` para garantir conformidade WCAG AA
- **Preferência de Movimento** — Media query `prefers-reduced-motion: reduce` que desativa animações de confetti, brilho de badges e efeitos visuais não essenciais
- **Semântica HTML** — Utilização de elemento nativo `<dialog>` para modais, landmarks de navegação (`<nav>`, `<main>`, `<aside>`, `<footer>`)

---

## 12. Segurança no Frontend

### 12.1. Gestão de Tokens

O token JWT é armazenado exclusivamente em memória (variável privada no módulo `api.js`), nunca em `localStorage` ou `sessionStorage`, mitigando o risco de roubo por XSS. A persistência da sessão é conseguida através do mecanismo de refresh via cookies HTTP-only (flag `withCredentials: true`), sendo os flags de `localStorage` (`hasSession`, `sessionPersistent`) utilizados apenas como indicadores booleanos para otimização de UX.

### 12.2. Proteção contra Inatividade

O sistema monitoriza a atividade do utilizador e encerra a sessão após um período configurável de inatividade (5 minutos para sessões persistentes, 10 minutos para efémeras), com verificação a cada 15 segundos. A atividade é rastreada via eventos `mousemove`, `click` e `keydown` com debounce de 10 segundos.

### 12.3. Refresh Automático de Token

O token é refrescado proativamente 60 segundos antes da sua expiração, através de uma verificação periódica a cada 30 segundos. A função `performRefresh()` implementa deduplicação: múltiplas chamadas simultâneas partilham a mesma Promise. Em caso de falha no refresh (401/403), um evento `auth:logout` é disparado para coordenação entre tabs do browser.

### 12.4. Consentimento RGPD

O `GdprConsentModal` implementa um gate de consentimento que: (1) verifica se o utilizador já aceitou a versão atual da política, (2) em caso afirmativo, permite a ação sem fricção, (3) caso contrário, apresenta o texto completo da política, (4) requer checkbox de concordância explícita, e (5) regista o consentimento via API antes de permitir a ação (ex: publicação de badge, partilha de perfil público). Suporta três tipos de política: Privacy, Terms e Cookies.

### 12.5. Proteção de Rotas

A combinação de `ProtectedRoute` e `RoleRoute` garante que: utilizadores não autenticados são redirecionados para login, utilizadores autenticados sem o papel adequado veem uma página de erro 403, e utilizadores com FPC pendente são forçados a alterar a password antes de aceder a qualquer funcionalidade.

### 12.6. Dados Sensíveis

- Passwords nunca são registadas na consola
- Dados pessoais são exibidos apenas em contextos autenticados
- Imagens de perfil são carregadas via HTTPS (Supabase CDN)
- O `localStorage` contém apenas flags booleanos não sensíveis (`hasSession`, `sessionPersistent`, `theme`, `celebratedMilestone`)
- A exportação de dados RGPD utiliza `Blob` com `URL.createObjectURL()` e revoga o URL após download

---

## 13. Configuração e Build

### 13.1. Vite

A aplicação utiliza o Vite 8 como bundler, configurado em `vite.config.js`:

- **Variáveis de ambiente**: Carregadas de `src/config/` com prefixos `VITE_`, `SUPABASE_`, `API_`
- **Proxy de desenvolvimento**: Redireciona `/api` e `/socket.io` para o `API_URL` (por defeito `http://localhost:3000`), com suporte WebSocket habilitado para Socket.IO
- **Plugin**: `@vitejs/plugin-react` para suporte JSX e Fast Refresh

### 13.2. Scripts

| Comando | Ação |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento com HMR |
| `npm run build` | Gera o build de produção otimizado |
| `npm run lint` | Executa o ESLint para análise estática |
| `npm run preview` | Pré-visualiza o build de produção localmente |

---

## 14. Matriz de Controlo de Acesso (RBAC)

| Funcionalidade | Administrador | Consultor | Talent Manager | Service Line Leader |
|---|:---:|:---:|:---:|:---:|
| Dashboard Admin | ✓ | — | — | — |
| Gestão de Badges (CRUD) | ✓ | — | — | — |
| Gestão de Utilizadores | ✓ | — | — | — |
| Gestão de Estrutura | ✓ | — | — | — |
| Gestão de SLAs | ✓ | — | — | — |
| Gestão de Notificações | ✓ | — | — | — |
| Gestão RGPD (Admin) | ✓ | — | — | — |
| Catálogo de Badges (leitura) | ✓ | ✓ | ✓ | ✓ |
| Candidatura a Badge | — | ✓ | — | — |
| Editar Candidatura (Open) | — | ✓ | — | — |
| Minhas Candidaturas | — | ✓ | — | — |
| Conquistas | — | ✓ | — | — |
| Pontos/Evolução | — | ✓ | — | — |
| Objetivos | — | ✓ | — | — |
| Assinatura de Email | ✓ | ✓ | ✓ | ✓ |
| Dashboard Gestão | ✓ | — | ✓ | ✓ |
| Quadro de Validações | ✓ | — | ✓ | ✓ |
| Revisão de Candidatura | ✓ | — | ✓ | ✓ |
| Lista de Consultores/Equipa | ✓ | — | ✓ | ✓ |
| Detalhe de Consultor | ✓ | — | ✓ | ✓ |
| Estatísticas | ✓ | — | ✓ | ✓ |
| Ranking | ✓ | ✓ | ✓ | ✓ |
| Perfil (ver/editar) | ✓ | ✓ | ✓ | ✓ |
| Definições | ✓ | ✓ | ✓ | ✓ |
| Privacidade (RGPD pessoal) | ✓ | ✓ | ✓ | ✓ |
| Anúncios (leitura) | ✓ | ✓ | ✓ | ✓ |
| Pesquisa Global | ✓ | ✓ | ✓ | ✓ |
| Microsite Público | Todos | Todos | Todos | Todos |
| Verificação de Badge | Todos | Todos | Todos | Todos |
