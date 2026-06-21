# API REST — Backend

## Visão Geral

A API REST do projeto constitui a camada de lógica de negócio e intermediação entre a base de dados PostgreSQL 18 e as aplicações cliente (Web e Mobile). Foi desenvolvida em **Node.js** com a framework **Express.js 5.2.1**, seguindo o padrão CommonJS, e expõe os seus endpoints sob o prefixo `/api`. O servidor HTTP é partilhado entre o Express e o Socket.io, permitindo comunicação em tempo real sem necessidade de portas adicionais.

O arranque da aplicação segue um fluxo assíncrono: carregamento das variáveis de ambiente, verificação da conexão à base de dados, inicialização dos workers em segundo plano e, por fim, a escuta no porto configurado (por defeito, 3000).

---

## Estrutura do Projeto

A organização do código segue o princípio da separação de responsabilidades, distribuindo a lógica por diretórios especializados:

```
api/
├── server.js                        # Ponto de entrada — arranque do servidor HTTP
├── src/
│   ├── app.js                       # Configuração do Express e cadeia de middleware
│   ├── config/                      # Módulos de configuração (BD, Redis, WebSocket, Firebase)
│   ├── models/                      # Modelos Sequelize (43+ entidades)
│   ├── routes/                      # Definição dos endpoints (30+ ficheiros)
│   ├── controllers/                 # Controladores (35+ ficheiros)
│   ├── services/                    # Serviços de negócio (email, gamificação, armazenamento)
│   ├── middlewares/                 # Middleware de autenticação, validação e logging
│   ├── validations/                 # Esquemas Zod para validação de dados
│   ├── workers/                     # Tarefas agendadas (cron jobs)
│   └── utils/                       # Funções auxiliares (logger, cache, contagens)
├── package.json
├── jest.config.js                   # Configuração de testes
└── keys.env                         # Variáveis de ambiente
```

O fluxo de um pedido HTTP segue a cadeia: **Rota → Middleware(s) → Controlador → Serviço(s) → Modelo(s) → Base de Dados**, assegurando uma separação limpa entre o encaminhamento, a lógica de negócio e o acesso a dados.

---

## Dependências Principais

A API assenta num conjunto de bibliotecas criteriosamente selecionadas para cada domínio funcional:

| Domínio | Biblioteca | Finalidade |
|---------|-----------|------------|
| Framework HTTP | Express.js 5.2.1 | Encaminhamento, middleware, gestão de pedidos |
| ORM | Sequelize 6.37.0 | Mapeamento objeto-relacional para PostgreSQL |
| Base de Dados | pg, pg-hstore | Driver PostgreSQL e suporte a tipos JSON |
| Autenticação | jsonwebtoken, bcryptjs | Geração/verificação de JWT e hashing de palavras-passe |
| Validação | Zod | Validação de esquemas com tipagem estrita |
| Caching | ioredis | Cliente Redis com fallback em memória |
| Armazenamento | @supabase/supabase-js | Upload e gestão de ficheiros na cloud |
| Tempo Real | socket.io | Comunicação WebSocket bidirecional |
| Email | nodemailer | Envio de emails via SMTP (Gmail) |
| Segurança | helmet, express-rate-limit, sanitize-html | Cabeçalhos HTTP, limitação de taxa, prevenção XSS |
| PDF | pdfkit, qrcode | Geração de certificados com códigos QR |
| Exportação | exceljs | Exportação de dados em formato CSV/Excel |
| Logging | winston | Registo estruturado em ficheiro |
| Agendamento | node-cron | Tarefas periódicas em segundo plano |
| Moderação | leo-profanity | Filtragem de conteúdo ofensivo (pt, es) |
| Notificações Push | Firebase Admin SDK | Notificações push via FCM |

---

## Cadeia de Middleware

A configuração do middleware em `app.js` define a ordem de processamento de cada pedido HTTP que chega à API. Esta cadeia foi desenhada para garantir segurança, rastreabilidade e integridade dos dados antes de qualquer lógica aplicacional:

1. **Helmet** — Adiciona cabeçalhos de segurança HTTP (Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, entre outros), mitigando ataques comuns como clickjacking e sniffing de tipo MIME.

2. **CORS** — Restringe as origens aceites à variável de ambiente `APP_URL`, com suporte a credenciais (cookies). Não utiliza wildcard (`*`), prevenindo acessos de origens não autorizadas.

3. **Body Parsing** — Parseia corpos JSON e URL-encoded com um limite de **100 KB**, protegendo contra ataques de negação de serviço por payloads excessivamente grandes. Os ficheiros são enviados diretamente para o Supabase, nunca transitando pelo corpo do pedido.

4. **Cookie Parser** — Interpreta cookies do pedido para utilização em autenticação e sessões persistentes.

5. **Request Logger** — Middleware baseado em Winston que regista cada pedido (método, URL, cabeçalhos) e resposta (código de estado, tempo de resposta, tamanho). Os campos sensíveis (password, token, authorization, secret, apikey, cookie) são automaticamente redigidos para `[REDACTED]`.

6. **Inicialização de Workers** — Arranque das tarefas cron em segundo plano (monitorização de SLA, expiração de badges, lembretes de objetivos).

7. **Inicialização do Firebase** — Configuração do Firebase Admin SDK para notificações push, com possibilidade de desativação via variável `SKIP_FIREBASE=1`.

---

## Sistema de Encaminhamento (Routing)

Os endpoints da API estão organizados em mais de 30 ficheiros de rotas, agregados num ficheiro central (`apiRoutes.js`). A estrutura suporta tanto caminhos planos como hierárquicos aninhados, refletindo a hierarquia do domínio.

### Mapa de Recursos

| Prefixo | Descrição | Exemplos de Operações |
|---------|-----------|----------------------|
| `/api/auth` | Gestão de sessões | Login, registo, reset de password, confirmação de email, 2FA |
| `/api/me` | Perfil do utilizador autenticado | Consulta e atualização de dados pessoais |
| `/api/learning-paths` | Percursos de aprendizagem | CRUD (admin), consulta (todos); aninha service-lines, areas, levels, badges |
| `/api/service-lines` | Linhas de serviço | CRUD (admin), consulta; aninha areas e badges |
| `/api/areas` | Áreas de competência | CRUD (admin), consulta; aninha levels e badges |
| `/api/levels` | Estágios de progressão | Consulta; aninha badges |
| `/api/badges` | Catálogo de badges | CRUD (admin), consulta do catálogo |
| `/api/applications` | Candidaturas a badges | Criação, submissão, validação, aceitação/rejeição |
| `/api/goals` | Objetivos de aprendizagem | CRUD pessoal do consultor |
| `/api/ranking` | Tabelas de classificação | Leaderboards por pontos |
| `/api/gamification` | Motor de pontos | Resumo de pontos, streaks, conquistas |
| `/api/notifications` | Notificações in-app | Listagem, marcação como lida |
| `/api/statistics` | Análises e métricas | Estatísticas por utilizador, área, serviço |
| `/api/slas` | Acordos de nível de serviço | Configuração e monitorização de SLAs |
| `/api/announcements` | Anúncios do sistema | Criação (admin), listagem filtrada por papel/SL |
| `/api/search` | Pesquisa global | Pesquisa textual em badges, utilizadores, learning paths |
| `/api/exports` | Exportações | CSV e PDF via ExcelJS |
| `/api/admin` | Administração | Gestão de utilizadores, atribuição de papéis, configurações |
| `/api/gdpr` | Proteção de dados | Consentimentos, histórico, eliminação de conta |
| `/api/integrations` | Integrações externas | Webhooks para eventos da plataforma |
| `/api/utils` | Utilitários | Upload de ficheiros, contagens de referências |
| `/api/public` | Acesso público | Verificação de certificados, catálogo público (sem autenticação) |

### Suporte a Caminhos Hierárquicos

A API suporta dois modos de acesso ao mesmo recurso, facilitando tanto a navegação direta como a contextualizada:

- **Caminho plano**: `GET /api/badges/{slug}` — acesso direto a um badge pelo seu slug.
- **Caminho aninhado**: `GET /api/learning-paths/{pathSlug}/service-lines/{slSlug}/areas/{areaSlug}/levels/{stageCode}/badges/{slug}` — acesso contextualizado pela hierarquia completa.

Uma decisão arquitetural importante é que **nunca são expostos IDs numéricos auto-incrementais** nos URLs. Em vez disso, utilizam-se **slugs** (para entidades de conteúdo) e **UUIDs/GUIDs** (para utilizadores e candidaturas), prevenindo ataques de enumeração.

---

## Autenticação

O sistema de autenticação implementa um fluxo completo baseado em **JSON Web Tokens (JWT)**, com suporte a refresh tokens para sessões persistentes.

### Fluxo de Autenticação

1. **Registo** — O utilizador submete os seus dados (nome, email, username, password, papel). A password é hashed com **bcryptjs** (12 salt rounds = 4096 iterações). A criação do utilizador e do registo específico do papel (consultor, TM ou SLL) ocorre numa **transação atómica** — se qualquer passo falhar, toda a operação é revertida. É enviado um email de confirmação com um token único.

2. **Confirmação de Email** — O utilizador clica no link com o token de confirmação. A API valida o token (verificando existência, propósito e prazo de validade) e marca o campo `email_confirmed` como verdadeiro.

3. **Login** — O utilizador autentica-se com email/username e password. A API verifica as credenciais via bcrypt e, em caso de sucesso, gera dois tokens:
   - **Access Token (JWT)** — Token de curta duração contendo `sub` (user_id), `role` (papel do utilizador) e `fpc` (flag de mudança forçada de password).
   - **Refresh Token** — Token de longa duração armazenado na base de dados (hash), utilizado para renovar o access token sem re-autenticação.

4. **Renovação (Refresh)** — Quando o access token expira, o cliente envia o refresh token. A API valida-o contra o hash armazenado, verifica que não foi revogado, e emite um novo access token.

5. **Logout** — Revoga o refresh token na base de dados, impedindo futuras renovações.

### Recuperação de Password

O fluxo de recuperação de password utiliza tokens temporários com prazo de validade:

1. O utilizador solicita a recuperação via `POST /api/auth/forgot-password` com o seu email.
2. A API gera um token de propósito `password_reset` e envia-o por email.
3. O utilizador acede ao link e submete a nova password via `POST /api/auth/reset-password`.
4. A API valida o token, hasha a nova password e atualiza o registo.

### Mudança Forçada de Password

Quando o campo `force_password_change` está ativo no utilizador, o middleware de autenticação bloqueia todos os endpoints exceto `/change-password`, devolvendo o código HTTP 403 com a indicação de que a mudança é obrigatória.

### Limitação de Taxa (Rate Limiting)

Para prevenir ataques de força bruta, estão configurados limitadores de taxa específicos por endpoint:

| Endpoint | Limite | Janela Temporal |
|----------|--------|-----------------|
| Login | 10 tentativas | 15 minutos |
| Registo | 5 tentativas | 1 hora |
| Recuperação de password | 5 tentativas | 1 hora |
| Reset de password | 10 tentativas | 15 minutos |
| Refresh de token | 100 pedidos | 15 minutos |

---

## Autorização e Controlo de Acesso (RBAC)

O controlo de acesso baseia-se num modelo **RBAC (Role-Based Access Control)** com quatro papéis distintos, implementado através de middleware reutilizável.

### Middleware de Autorização

O ficheiro `auth.middleware.js` exporta as seguintes funções:

- **`loginRequired`** — Verifica a presença e validade do JWT no cabeçalho `Authorization: Bearer <token>`. Extrai os dados do utilizador para `req.user`. Devolve 401 se o token for inválido ou ausente.

- **`checkRole(...allowedRoles)`** — Função fábrica que gera middleware para restringir o acesso a papéis específicos. É utilizada para criar dois atalhos:
  - `isAdmin` — Restringe a administradores.
  - `leadership` — Permite acesso a Service Line Leaders, Talent Managers e Administradores.

- **`optionalAuth`** — Tenta decodificar o JWT mas não bloqueia o pedido se o token for inválido. Utilizado em rotas públicas que apresentam conteúdo diferente para utilizadores autenticados.

- **`annonymousUsersOnly`** — Bloqueia utilizadores já autenticados, impedindo o acesso a endpoints de registo e login quando já existe uma sessão ativa.

### Matriz de Permissões por Papel

| Recurso | Consultor | Talent Manager | Service Line Leader | Administrador |
|---------|-----------|----------------|---------------------|---------------|
| Perfil pessoal | Leitura/Escrita próprio | Leitura/Escrita próprio | Leitura/Escrita próprio | Leitura/Escrita todos |
| Catálogo de badges | Leitura | Leitura | Leitura | CRUD completo |
| Candidaturas | Leitura/Escrita próprias | Leitura todas (estado >= Submitted) | Leitura da sua SL | Leitura todas |
| Validação de candidaturas | — | Valida → "In validation" | Aceita/Rejeita (na sua SL) | — |
| Gestão de utilizadores | — | — | — | CRUD completo |
| Estrutura hierárquica | Leitura | Leitura | Leitura | CRUD completo |
| Estatísticas | Próprias | Agregadas (sem PII) | Agregadas da sua SL | Completas |
| SLAs | — | Visualização | Visualização | CRUD completo |
| Anúncios | Leitura | Leitura | Leitura | CRUD completo |

### Filtragem ao Nível da Query

A autorização não se limita a bloquear ou permitir endpoints — a **filtragem de dados é aplicada ao nível da query SQL**. Por exemplo, quando um Consultor lista as suas candidaturas, a query inclui automaticamente `WHERE user_id = ?`; quando um SLL consulta candidaturas, é adicionado um filtro pela sua Service Line. Esta abordagem garante que nenhum dado não autorizado transita pela rede, mesmo em caso de erro na lógica do controlador.

---

## Modelos de Dados (ORM)

A camada de acesso a dados utiliza o **Sequelize 6.37.0** como ORM, com modelos gerados a partir do esquema PostgreSQL. Todos os modelos seguem a convenção `snake_case` e utilizam `underscored: true` na configuração do Sequelize, assegurando mapeamento direto com as colunas da base de dados.

### Hierarquia Principal

A estrutura hierárquica do domínio é modelada através de relações de chave estrangeira em cascata:

```
learning_paths
  └── service_lines (learning_path_id FK)
        └── areas (service_line_id FK)
              └── progression_stages (area_id FK)
                    └── badges (progression_stage_id FK)
                          └── badge_requirements (badge_id FK)
```

### Modelos de Utilizador

O sistema implementa uma **herança por tabela especializada**: a tabela `users` contém os campos comuns (nome, email, username, password hash, papel, idioma, localização, foto de perfil, etc.), enquanto tabelas especializadas (`consultants`, `talent_managers`, `service_line_leaders`, `administrators`) armazenam campos específicos de cada papel. A relação é de 1:1, partilhando o mesmo `user_id` como chave primária e estrangeira.

Campos notáveis da tabela `users`:
- `user_guid` (UUID) — identificador público para exposição em URLs.
- `user_role` (enum) — um de: Consultant, Talent Manager, Service Line Leader, Administrator.
- `force_password_change` — flag booleana que força a mudança de password no próximo login.
- `last_login_at` — timestamp do último login, utilizado para as saudações dinâmicas.
- `current_streak_days` — contagem de dias consecutivos de login.
- `is_active` — soft delete (desativação sem eliminação).

A tabela `users` possui índices GIN com operador `trgm` no campo `full_name` para pesquisa fuzzy, bem como índices compostos em `(user_role, is_active)` para filtragem eficiente.

### Modelos do Fluxo de Candidatura

- **`badge_applications`** — Máquina de estados com cinco estados possíveis (`Open`, `Submitted`, `In validation`, `Accepted`, `Rejected`). Contém GUIDs para exposição pública e timestamps por fase (opened_at, submitted_at, closed_at).

- **`requirements_evidences`** — Ficheiros de prova por requisito, com controlo de revisão individual (`tm_reviewed`, `sll_reviewed`). Aplica uma constraint de unicidade `(application_id, requirement_id)` — uma evidência por requisito.

- **`application_validation_logs`** — Trilha de auditoria imutável: cada transição de estado gera um registo com a função do validador, a ação executada e os comentários. Estes registos nunca são atualizados nem eliminados.

### Modelos de Gamificação

- **`points_history`** — Ledger imutável de pontos. Cada entrada regista o delta de pontos, a justificação e a referência ao requisito ou badge que originou a atribuição. A idempotência é garantida por constraints: não é possível atribuir pontos duplicados para o mesmo par `(user_id, requirement_id)` ou `(user_id, badge_id)`.

- **`awarded_badges`** — Badges conquistados pelo utilizador, com link de verificação pública único, data de expiração e flag de publicação/destaque.

- **`goals`** — Objetivos de aprendizagem pessoais com data-alvo e valor em pontos.

### Modelos de Notificações

O sistema de notificações é modelado em três níveis de configuração:

1. **`notification_definitions`** — Templates de notificação (nome, ativação global, envio por email, envio push).
2. **`notification_preferences`** — Configuração por papel (override global).
3. **`user_notification_preferences`** — Override individual por utilizador.
4. **`notifications`** — Instâncias de notificação com payload JSON, URL de ação, tipo categorizado (HOME, BADGES, APPLICATIONS, ACHIEVEMENTS, POINTS, OBJECTIVES, EVOLUTION, ANNOUNCEMENTS, SYSTEM) e flag de leitura.
5. **`device_tokens`** — Tokens FCM para notificações push móveis.

### Outros Modelos Relevantes

- **`slas`** e **`sla_breach_alerts`** — Acordos de nível de serviço com monitorização automática de violações.
- **`system_announcements`** com tabelas de junção `announc_roles` e `announc_sl` — Anúncios direcionados por papel e/ou linha de serviço.
- **`gdpr_policies`** e **`gdpr_consent_history`** — Gestão de consentimentos RGPD com histórico de aceitações.
- **`user_account_tokens`** — Tokens temporários para confirmação de email e recuperação de password.
- **`user_refresh_tokens`** — Armazenamento seguro de refresh tokens (hash, revogação, expiração).
- **`certificates`** — Certificados PDF gerados com URL e idioma.
- **`skills`** e **`consultants_selected_skills`** — Catálogo de competências e seleção por consultor.
- **`locations`** e **`languages`** — Dados de referência (localizações e idiomas suportados: pt-PT, en-GB, es-ES).

### Configuração do Sequelize

- **Produção**: PostgreSQL 18 com SSL obrigatório, índices GIN para pesquisa textual e `DISTINCT ON` para queries complexas.
- **Testes**: SQLite em memória, com associações sanitizadas (sem chaves estrangeiras nem índices específicos de PostgreSQL).
- `timestamps: false` — Os campos `created_at` e `updated_at` são geridos manualmente com `Sequelize.fn('now')`.

---

## Controladores

Os controladores constituem a camada de processamento dos pedidos HTTP, orquestrando a validação, a lógica de negócio e a formatação das respostas. Existem mais de 35 ficheiros de controladores, cada um responsável por um domínio funcional específico.

### Controlador de Autenticação (`auth.controller.js`)

Gere todo o ciclo de vida da sessão do utilizador:

- **`register()`** — Cria o utilizador e o registo específico do papel numa transação atómica. Envia email de confirmação. Suporta três variantes de registo (Consultor, TM, SLL) através de uma discriminated union no esquema Zod.
- **`login()`** — Valida credenciais com bcrypt, gera JWT e refresh token, atualiza `last_login_at`.
- **`refresh()`** — Emite novo access token a partir de um refresh token válido e não revogado.
- **`logout()`** — Revoga o refresh token.
- **`confirmEmail()`** — Verifica o token de confirmação e ativa a conta.
- **`changePassword()`** — Requer a password atual, hasha a nova e desativa a flag `force_password_change`.
- **`resetPassword()`** — Utiliza o token de recuperação, sem necessidade da password atual.
- **`forgotPassword()`** — Gera e envia o token de recuperação por email.

### Controlador de Candidaturas (`applications.controller.js`)

Implementa a máquina de estados do fluxo de candidatura a badges:

- **`getApplications()`** — Filtragem baseada no papel: Consultores veem apenas as suas, Talent Managers e Administradores veem todas, SLLs veem apenas as da sua linha de serviço.
- **`startApplication()`** — Cria uma candidatura no estado `Open`.
- **`submitApplication()`** — Transita para `Submitted`, regista na trilha de auditoria e notifica o Talent Manager por email.
- **`validateApplication()`** — O TM transita para `In validation`; o SLL aceita ou rejeita. Na aceitação, são atribuídos pontos de conclusão do badge.
- **`reviewEvidence()`** — O TM ou SLL aprova/rejeita evidências individuais, atribuindo pontos por requisito de forma idempotente.
- **`getUploadUrl()`** — Gera URL assinada do Supabase para upload direto pelo cliente.
- **`upsertEvidence()`** — Cria ou atualiza a referência ao ficheiro de evidência.

### Controlador de Badges (`badges.controller.js`)

- **`getBadges()`** — Consulta com filtragem hierárquica complexa, paginação e caching em Redis.
- **`getBadgeBySlug()`** — Detalhes completos de um badge incluindo toda a árvore de requisitos.
- **`createBadge()`** (admin) — Criação com validação de unicidade do slug.
- **`updateBadge()`** (admin) — Atualização com invalidação automática do cache.
- **`deleteBadge()`** (admin) — Soft delete (marca `is_active` como falso).

### Controlador de Administração (`admin.controller.js`)

- **`getUsers()`** — Listagem com filtragem por papel, área e linha de serviço.
- **`createUser()`** — Criação de utilizadores exclusiva do administrador.
- **`updateUser()`** — Alteração de papel, atribuições de área e linha de serviço.
- **`deactivateUser()`** / **`reactivateUser()`** — Soft delete e reativação.

### Outros Controladores

- **`user.controller.js`** — Perfil do utilizador autenticado (`me()`), atualização de dados pessoais, mudança de idioma. O perfil é cacheado em Redis.
- **`gamification.controller.js`** — Resumo de pontos e ledger do utilizador.
- **`ranking.controller.js`** — Leaderboards por pontos acumulados.
- **`notifications.controller.js`** — Listagem de notificações e marcação como lida.
- **`statistics.controller.js`** — Métricas por utilizador (pontos, badges, áreas, competências).
- **`certificates.controller.js`** — Geração de certificados PDF com PDFKit e códigos QR.
- **`search.controller.js`** — Pesquisa full-text via operador `iLike` do Sequelize ou FTS nativo do PostgreSQL.
- **`exports.controller.js`** — Exportação de dados em CSV/PDF via ExcelJS.

---

## Validação de Dados (Zod)

A validação de dados de entrada é centralizada na diretória `validations/`, utilizando a biblioteca **Zod** para definição de esquemas com tipagem estrita. Um middleware dedicado (`validate.middleware.js`) interceta os erros de validação e devolve respostas HTTP 400 com erros detalhados por campo.

### Regras Partilhadas (`shared-rules.js`)

Um conjunto de regras reutilizáveis foi definido para campos comuns:

| Regra | Validação |
|-------|-----------|
| `positiveIntIdRule` | Coerção para inteiro, obrigatoriamente > 0 |
| `uuidRule` | Formato UUID válido |
| `fullNameRule` | 2–255 caracteres, trim, sanitização HTML, formatação de nome próprio, verificação de profanidade |
| `usernameRule` | 3–50 caracteres, alfanumérico com pontos e underscores |
| `emailRule` | Formato de email válido, máximo 255 caracteres |
| `passwordRule` | 8–100 caracteres; obrigatório: maiúscula, minúscula, número, carácter especial |
| `phoneNumberRule` | Formato internacional `+<7-15 dígitos>` |
| `birthdateRule` | Data válida, idade mínima de 16 anos |
| `biographyRule` | Máximo 5000 caracteres, máximo 500 palavras, sanitização HTML, sem profanidade |

### Esquemas por Domínio

- **Autenticação** — Esquema de registo com discriminated union por papel (os campos obrigatórios variam consoante se trate de Consultor, TM ou SLL). Esquema de login aceita identificador (email ou username) + password + flag de sessão persistente.

- **Candidaturas** — Validação da query de listagem (filtros de estado como array de enums, área, badge, intervalo de datas, paginação). Validação do upload (nome de ficheiro com extensão, content type, tamanho máximo de 10 MB). Validação de ações de revisão (ação como enum: accept, reject, review, send_back).

- **Estrutura** — Validação de criação e atualização de learning paths, service lines, áreas e badges (título, slug, tipo, pontos, dias de expiração).

### Tratamento de Erros de Validação

O ficheiro `error-map.js` traduz os códigos de erro internos do Zod para códigos legíveis por máquina (por exemplo, `VALIDATION_INVALID_TYPE`, `VALIDATION_VALUE_TOO_BIG`), padronizando as respostas de erro em toda a API.

### Segurança no Upload de Ficheiros

A validação de uploads aplica quatro controlos:
1. **Tipos MIME permitidos**: PDF, JPEG, PNG, ZIP.
2. **Tamanho máximo**: 10 MB.
3. **Extensão obrigatória**: O nome de ficheiro deve conter uma extensão válida.
4. **Validação prévia ao URL assinado**: O tamanho é verificado antes da geração do URL de upload, impedindo uploads de ficheiros excessivos.

---

## Serviços de Negócio

A camada de serviços encapsula a lógica de negócio complexa, desacoplando-a dos controladores e promovendo reutilização. Existem 8 serviços principais.

### Serviço de Email (`email.service.js`)

O maior serviço da API (~1200 linhas), responsável pelo envio de emails transacionais via **Nodemailer** com SMTP Gmail. Cada tipo de email possui templates em três idiomas (pt-PT, en-GB, es-ES):

- `sendConfirmationEmail()` — Confirmação de registo com link de ativação.
- `sendResetPasswordEmail()` — Recuperação de password com token temporário.
- `sendApplicationSubmittedEmail()` — Notificação de submissão de candidatura.
- `sendApplicationPendingSllReviewEmail()` — Alerta ao SLL de candidatura pendente.
- `sendApplicationApprovedEmail()` — Notificação de aprovação com URL do certificado.
- `sendApplicationRejectedEmail()` — Notificação de rejeição com feedback.
- `sendBadgeExpiringEmail()` — Alertas de expiração em limiares de 30, 7 e 1 dia.
- `sendBadgeExpiredEmail()` — Notificação de badge expirado.
- `sendGoalReminderEmail()` — Lembrete de aproximação da data-alvo de um objetivo.
- `sendSlaBreachAlertEmail()` — Notificação de violação de SLA.

### Serviço de Gamificação (`gamification.service.js`)

Implementa o motor de pontos com garantia de idempotência:

- **`awardRequirementPoints(userId, requirementId)`** — Atribui pontos por requisito aprovado. A operação é idempotente: cada par (utilizador, requisito) só pode gerar pontos uma vez.
- **`awardBadgeCompletionPoints(userId, badgeId)`** — Atribui pontos de conclusão do badge, incluindo quaisquer pontos de requisitos pendentes.
- **`getConsultantPointsSummary(userId)`** — Calcula o total de pontos e devolve o ledger completo.
- **`getConsultantStreak(userId)`** — Calcula a streak atual de dias consecutivos de login.

Os pontos são **permanentemente preservados** no perfil do consultor, mesmo que o badge subjacente expire — uma decisão de design que valoriza o esforço acumulado.

### Serviço de Armazenamento (`storage.service.js`)

Integração com **Supabase Storage** para gestão de ficheiros na cloud:

- **`generateSignedUploadUrl()`** — Gera URL assinado com validade de 5 minutos para upload direto pelo cliente.
- **`generateSignedDownloadUrl()`** — Gera URL assinado para download de evidências (bucket privado).
- **`uploadBuffer()`** — Upload server-side de buffers (utilizado para certificados PDF gerados).
- **`moveImageToPermanent()`** — Move ficheiros da pasta temporária para a permanente após confirmação.
- **`deleteFile()`** — Remove ficheiros do armazenamento.

Buckets configurados:
- `public-assets` — Imagens de perfil, badges e estrutura (URLs públicos).
- `private-assets` — Ficheiros de evidência (URLs assinados com expiração de 5 minutos).

Em ambiente de desenvolvimento, se o Supabase não estiver configurado, os ficheiros são escritos localmente em `logs/dev_storage/`.

### Serviço de Notificações (`notifications.service.js`)

- **`createNotification()`** — Insere notificação in-app, resolve preferências (global → papel → utilizador) e dispara email e/ou push se habilitado.
- **`resolvePreferences()`** — Resolve a configuração de notificação aplicável segundo a hierarquia de preferências.

### Serviço de Certificados (`certificate.service.js`)

Gera certificados PDF utilizando **PDFKit** com código QR embutido (via biblioteca `qrcode`) que aponta para o link de verificação pública do badge. Os templates suportam múltiplos idiomas.

### Serviço de Estatísticas (`statistics.service.js`)

- `getUserStatistics()` — Pontos ganhos, badges conquistados, progresso em áreas e distribuição de competências.
- `getAreaStatistics()` — Contagem de utilizadores e distribuição de badges por área.
- `getLeaderboardRanking()` — Posição global do utilizador no ranking.

### Serviço Firebase (`firebase.service.js`)

- `sendTopicUpdate()` — Envio de notificações push via Firebase Cloud Messaging para tópicos (por exemplo, `role:consultant`).

### Serviço de Integrações (`integrations.service.js`)

- Suporte a webhooks externos para eventos da plataforma (mudanças de estado de candidatura, atribuição de badges).
- Lógica de retry com backoff exponencial.

---

## Sistema de Cache (Redis)

A estratégia de caching utiliza **ioredis** em produção, com um **fallback em memória** (baseado em `Map`) para ambientes sem Redis disponível.

### Padrões de Utilização

1. **Cache de Perfil** — O perfil do utilizador autenticado é cacheado em Redis sob a chave `user:profile:{user_id}`, evitando queries repetidas para dados que raramente mudam.

2. **Cache de Listagens** — As listas de badges, utilizadores e outras entidades são cacheadas com chaves que incluem os parâmetros de filtro e paginação.

3. **Cache de Contagens** — Contagens de badges, utilizadores e outras métricas são cacheadas para queries administrativas rápidas.

### Invalidação

A invalidação é feita por **prefixo**: quando um badge é criado ou atualizado, todas as chaves que começam por `badge:list:*` são eliminadas, garantindo que nenhuma listagem obsoleta persista, independentemente dos parâmetros de filtro utilizados.

---

## Workers em Segundo Plano

A API inclui quatro tarefas agendadas via **node-cron** que executam em paralelo com o servidor HTTP, sem bloquear os pedidos:

### 1. Monitorização de Expiração de Badges (`badge_expiration.worker.js`)
- **Frequência**: A cada hora (`0 * * * *`)
- **Função**: Identifica badges a expirar dentro de 30 dias e envia alertas progressivos nos limiares de 30, 7 e 1 dia. Badges expirados são marcados com alerta 0 dias. A idempotência é garantida pelo campo `last_expiry_alert_days`, que regista o último limiar notificado.

### 2. Monitorização de SLA Global (`sla.worker.js`)
- **Frequência**: A cada 15 minutos (`*/15 * * * *`)
- **Função**: Identifica candidaturas que violaram o SLA configurado (tempo de resposta em horas excedido). Cria registos de violação (`sla_breach_alerts`) e notifica os Talent Managers e Service Line Leaders responsáveis.

### 3. Monitorização de SLA Personalizado (`custom_sla.worker.js`)
- **Função**: Similar ao worker de SLA global, mas para regras de SLA personalizadas por linha de serviço.

### 4. Lembretes de Objetivos (`goal_reminder.worker.js`)
- **Função**: Identifica objetivos de aprendizagem cuja data-alvo se aproxima e envia notificações de lembrete aos consultores.

---

## Comunicação em Tempo Real (WebSocket)

A comunicação em tempo real é implementada com **Socket.io**, partilhando o porto HTTP com o Express.

### Configuração

- **Autenticação**: O JWT é verificado durante o handshake WebSocket (`socket.handshake.auth.token`), garantindo que apenas utilizadores autenticados estabelecem conexão.
- **CORS**: Configurado para aceitar apenas ligações da origem definida em `APP_URL`.
- **Salas Privadas**: Cada utilizador é automaticamente associado a uma sala individual `user:{userId}`, permitindo envio direcionado de notificações.

### Utilização

A função `emitToUser(userId, event, data)` permite enviar eventos em tempo real para um utilizador específico, utilizada principalmente para:
- Entrega imediata de notificações in-app.
- Atualizações de estado de candidaturas.
- Alertas do sistema.

Se o Socket.io não estiver disponível (por exemplo, em ambiente de testes), o WebSocket é desativado graciosamente sem afetar o funcionamento da API.

---

## Segurança

A API implementa múltiplas camadas de segurança:

### Proteção contra Ataques Comuns

| Ameaça | Mitigação |
|--------|-----------|
| XSS (Cross-Site Scripting) | Sanitização HTML com `sanitize-html` em todos os campos de texto antes do armazenamento |
| Força Bruta | Rate limiting por endpoint com `express-rate-limit` |
| Clickjacking | Cabeçalhos `X-Frame-Options` e CSP via Helmet |
| MIME Sniffing | `X-Content-Type-Options: nosniff` via Helmet |
| CORS não autorizado | Origem restrita a `APP_URL`, sem wildcard |
| DoS por payload | Limite de corpo de 100 KB |
| Enumeração de IDs | UUIDs e slugs em vez de IDs numéricos |
| Injeção de conteúdo ofensivo | Filtro de profanidade (`leo-profanity`) em pt e es |

### Hashing de Passwords

Utilização de **bcryptjs** com **12 salt rounds** (2^12 = 4096 iterações), um valor que equilibra segurança e performance.

### Redação de Dados Sensíveis nos Logs

O logger Winston redirige automaticamente os valores dos campos sensíveis (`password`, `token`, `authorization`, `secret`, `apikey`, `cookie`, `set-cookie`) para `[REDACTED]`. Strings com mais de 2000 caracteres são truncadas com o sufixo `...[truncated]`.

### Conformidade RGPD

- Tabela `gdpr_policies` para gestão de templates de consentimento (versão, conteúdo, estado ativo).
- Tabela `gdpr_consent_history` como trilha de auditoria de aceitações.
- Campo `consultants.gdpr_accepted` para rastreio rápido do consentimento.
- Endpoint `/api/gdpr/delete-account` para o direito ao esquecimento (eliminação de dados pessoais).

---

## Formato de Resposta Padronizado

Todos os endpoints seguem um formato de resposta uniforme:

```json
{
  "success": true,
  "code": "OPERATION_RESULT_CODE",
  "data": { ... }
}
```

Em caso de erro de validação:

```json
{
  "success": false,
  "code": "VALIDATION_DATA_ERROR",
  "errors": [
    { "field": "email", "message": "formato de email inválido" }
  ]
}
```

### Códigos HTTP Utilizados

| Código | Significado | Utilização |
|--------|-------------|------------|
| 200 | OK | Operação bem-sucedida |
| 400 | Bad Request | Erro de validação, formato inválido |
| 401 | Unauthorized | JWT ausente, inválido ou expirado |
| 403 | Forbidden | Permissões insuficientes para o papel, mudança de password forçada |
| 404 | Not Found | Recurso não encontrado |
| 409 | Conflict | Violação de unicidade (email, username, slug duplicado) |
| 429 | Too Many Requests | Limite de taxa excedido |

---

## Internacionalização (i18n)

A API suporta três idiomas: **Português (pt-PT)**, **Inglês (en-GB)** e **Espanhol (es-ES)**.

- O idioma preferido do utilizador é armazenado como chave estrangeira para a tabela `languages` e pode ser alterado via endpoint dedicado.
- Os templates de email estão codificados por idioma no serviço de email, sendo selecionado o template correspondente ao idioma do destinatário.
- Os dicionários de profanidade são carregados para português e espanhol, garantindo moderação de conteúdo nos idiomas suportados.
- A interface web gere a sua própria camada de i18n; a API limita-se a fornecer o código ISO do idioma do utilizador.

---

## Testes

A configuração de testes utiliza **Jest** com **SuperTest** para testes de integração dos endpoints HTTP.

- **Base de dados de teste**: SQLite em memória, sem estado persistente entre testes. As associações do Sequelize são sanitizadas (sem chaves estrangeiras nem índices específicos de PostgreSQL).
- **Serviços externos desativados**: Firebase, Supabase e Redis utilizam mocks ou fallbacks em memória durante os testes.
- **Execução**: `npm test` para a suite completa; `npm test -- --forceExit` para forçar a saída após conclusão.

---

## Decisões Arquiteturais Relevantes

1. **UUID + Slug para Exposição Pública** — IDs numéricos auto-incrementais nunca são expostos em URLs, prevenindo ataques de enumeração. São utilizados `user_guid` (UUID) para utilizadores e `badge_slug` para badges.

2. **Transações Atómicas no Registo** — A criação de utilizador e do registo específico do papel ocorre numa única transação, com rollback automático em caso de falha parcial.

3. **Idempotência nas Operações Críticas** — Atribuição de pontos, alertas de expiração e notificações são rastreados para prevenir duplicação.

4. **Filtragem ao Nível da Query** — A autorização é aplicada como cláusulas WHERE na query SQL, e não como filtro pós-fetch, garantindo eficiência e segurança.

5. **Workers Independentes** — As tarefas cron executam em paralelo sem bloquear respostas HTTP, com mecanismos de idempotência próprios.

6. **Invalidação de Cache por Prefixo** — Permite limpar todas as variantes de uma listagem cacheada sem necessidade de rastrear cada combinação de parâmetros.

7. **Trilha de Auditoria Imutável** — A tabela `application_validation_logs` funciona como um append-only log, fornecendo um histórico forense completo de cada transição no fluxo de candidatura.

8. **Fallbacks Graciosos** — Redis, Firebase e Supabase degradam graciosamente para alternativas locais em ambientes de desenvolvimento ou teste, permitindo que a API funcione sem dependências externas.
