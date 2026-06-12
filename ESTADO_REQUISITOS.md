# Estado dos Requisitos — Plataforma de Badges Softinsa

> Auditoria do estado de implementação de cada requisito do `Enunciado_PINT.pdf`, por perfil.
> **Âmbito:** Web (React/Vite/Bootstrap) + API (Node/Express/Sequelize/PostgreSQL). **Mobile fica fora** (plataforma separada).
> **Branch auditada:** `web-new` · **Data:** 2026-06-12 (atualizado após as correções TM/SLL do mesmo dia)

> **Atualização (12/06/2026):** Após a auditoria inicial foram fechadas várias lacunas TM/SLL — histórico do processo exposto ao TM (req 21), páginas de consultores (TM) e equipa (SLL) com filtros, histórico de badges da SL, email ao SLL em nova validação (req 16), e alinhamento com o Figma das páginas de consultores, histórico, dashboard e estatísticas. As tabelas abaixo já refletem este estado.

## Legenda

| Símbolo | Significado |
|---------|-------------|
| ✅ | Done — implementado em web+API, integrado com API real |
| 🟡 | Partial — parcial, só UI/sem integração, falta endpoint ou caso de borda |
| ❌ | Missing — sem implementação |
| ⚪ | N/A — não aplicável a este perfil |

## Resumo global

| Perfil | ✅ Done | 🟡 Partial | ❌ Missing | ⚪ N/A | Total |
|--------|:------:|:---------:|:---------:|:-----:|:-----:|
| Consultor | 19 | 8 | 1 | 0 | 28 |
| Talent Manager | 17 | 2 | 1 | 2 | 22 |
| Service Line Leader | 16 | 2 | 1 | 1 | 20 |
| Administrador | 7 | 5 | 1 | 0 | 13 |
| Requisitos Gerais | 10 | 5 | 0 | 0 | 15 |

**Leitura rápida:** o TM e o SLL estão com os requisitos **obrigatórios essencialmente completos** — o que falta nesses perfis é sobretudo **bónus** (Timeline de evolução no TM; métricas de comparação no SLL) e polish menor (modais de exportação no painel de revisão; "tempo real" por refresh). As lacunas mais relevantes que sobram estão no **Admin** (endpoints completos sem UI: RGPD, SLAs, gestão de requisitos, ações sobre pedidos) e no **Consultor** (página pública de verificação `/verify/:link` sem rota no web; integração softinsa.pt).

---

## 1. Perfil Consultor

| Nº | Requisito | Estado | Evidência (ficheiros) | Notas |
|----|-----------|--------|------------------------|-------|
| 1 | Email de confirmação antes de usar; 1º login muda password | ✅ | `api/src/controllers/auth.controller.js:214,463-472,543`; `LoginPage.jsx:57-65`; `ChangePasswordPage.jsx`; `email.service.js:22` | API-integrado. Login força mudança de password no 1º acesso. |
| 2 | Escolhe área no registo; ao iniciar mostra badges preferidos da área | ✅ | `RegisterPage.jsx:63,287,408`; `BadgeCatalog.jsx:167-188` | "Preferidos" = filtro default pela área primária. |
| 3 | Ver badges disponíveis fora da sua área | ✅ | `BadgeCatalog.jsx` (filtro de área limpável); `badgesApi.getBadges` | API-integrado. |
| 4 | Dashboard pessoal com progresso nos Learning Paths | ✅ | `Evolution.jsx` (`getLearningPathProgress`); `statsApi.js`; `Objectives.jsx` | Detalhe LP em Evolution/Objectives. |
| 5 | Upload de evidências (certificados, diplomas, relatórios) | ✅ | `applicationsApi.js getUploadUrl/upsertEvidence`; `ApplicationDetail.jsx` | Upload via signed URL. |
| 6 | Visualização em tempo real do estado do pedido | 🟡 | `ConsultantDashboard.jsx`; `MyApplications.jsx`; `ApplicationStatus.jsx` | Por fetch/refresh; sem websocket/polling. |
| 7 | Histórico de badges obtidos e em processo | ✅ | `Evolution.jsx` (`/gamification/earned-badges`); `MyApplications.jsx` | API-integrado. |
| 8 | Catálogo de badges com descrições | ✅ | `BadgeCatalog.jsx`; `BadgeDetail.jsx` | API-integrado. |
| 9 | Ver requisitos de cada badge | ✅ | `BadgeDetail.jsx` (`RequirementCard`) | API-integrado. |
| 10 | Aceitação RGPD para publicar/partilhar badges | ✅ | `BadgeDetail.jsx`→`GdprConsentModal`; `gdprApi.js`→`/gdpr/consent` | Partilha bloqueada atrás de consentimento. |
| 11 | Partilhar badge no LinkedIn | ✅ | `BadgeDetail.jsx doShareLinkedIn` | Após consentimento RGPD. |
| 12 | (BÓNUS) Badge na assinatura de email | ✅ | `shared/MailSignature/MailSignature.jsx` | HTML copiável com badges. |
| 13 | Sistema de pontos por badges obtidos | ✅ | `Points.jsx`; `applications.controller.js:699`; `points_history` | API-integrado. |
| 14 | Badges especiais (ex. certificações pagas / Premium) | 🟡 | `DB/PINT_SCRIPT.sql:219`; `applications.controller.js:721`; `Points.jsx`/`Evolution.jsx` | Modelo distingue Special; sem visual "Premium" dedicado no catálogo. |
| 15 | Métricas visuais de progresso | ✅ | `Evolution.jsx` (recharts); `Objectives.jsx`; `Points.jsx` | API-integrado. |
| 16 | Celebração de marcos | 🟡 | `Points.jsx:444`; notif `NOTIF_APP_BADGE_AWARDED` | Sem celebração visual (confetti/modal). |
| 17 | Recomendações de próximos badges | ✅ | `Points.jsx:238,524`; `gamification.controller.js:179` | API-integrado. |
| 18 | Download de certificados PDF | ✅ | `BadgeDetail.jsx`; `certificate.service.js`; `certificate.generator` | Gera/armazena PDF. |
| 19 | Email de confirmação de candidatura | ✅ | `applications.controller.js:504`; `email.service.js:385` | No submit. |
| 20 | Notificações de aprovação/rejeição | ✅ | `applications.controller.js:721-775`; `email.service.js:425,466` | In-app + email. |
| 21 | Alertas de expiração de badges (opcional por badge) | ✅ | `workers/badge_expiration.worker.js`; `BadgeDetail.jsx` | Só dispara se `expiration_at` definido. |
| 22 | Lembretes (objetivos/prazos) | ✅ | `workers/goal_reminder.worker.js`; `Objectives.jsx` | API-integrado. |
| 23 | (BÓNUS) Config. template de assinatura com badges | ✅ | `MailSignature.jsx` | Cobre bónus 12/23. |
| 24 | Galeria pública de badges obtidos | 🟡 | `UserProfile.jsx:714`; `getEarnedBadges` | Link para catálogo; sem galeria pública dedicada. |
| 25 | Página Softinsa individual por badge (url/badge/assinatura) | 🟡 | `public.routes.js /badge/:link`; `BadgeDetail.jsx`/`MailSignature.jsx` geram `/verify/:link` | Página pública existe na API; **link web `/verify/:link` não tem rota** — desalinhamento. |
| 26 | Sistema de verificação por link único | 🟡 | `awarded_badges.public_verification_link`; `public.controller.js` (+QR) | Backend completo; mesmo bug de wiring do nº25. |
| 27 | Info detalhada de competências certificadas | ✅ | `BadgeDetail.jsx` (skills); `consultants_selected_skills` | API-integrado. |
| 28 | Integração na página de badges com www.softinsa.pt | ❌ | Sem referências a `softinsa.pt` (só texto i18n) | Não implementado. |

### Resumo Consultor
- ✅ 19 · 🟡 8 · ❌ 1 (total 28)
- **Lacunas principais:** (28) sem integração softinsa.pt; (25/26) link público `/verify/:link` não resolve no router web — partilha/assinatura quebradas; (24) sem galeria pública dedicada; (16) sem celebração visual; (6) estado por fetch, não tempo real.

---

## 2. Perfil Talent Manager

| Nº | Requisito | Estado | Evidência (ficheiros) | Notas |
|----|-----------|--------|------------------------|-------|
| 1 | Ver badges disponíveis | ✅ | `routes/index.jsx:82` (TM.BADGES→`BadgeCatalog`); `BadgeCatalog.jsx:8` | Catálogo partilhado, API real. |
| 2 | Dashboard com progresso de todos os consultores | ✅ | `ManagementDashboard.jsx` (KPIs + gráficos); `ConsultantsList.jsx` (via `TmConsultants`); API `GET /statistics/consultants` | Página de consultores com pontos/badges/candidaturas/último login + filtros; dashboard com KPIs e gráficos. |
| 3 | Sistema de verificação de evidências | ✅ | `ApplicationReview.jsx:134-146,48` (`tm_reviewed`) | TM marca cada evidência; API real. |
| 4 | Visualização em tempo real do estado | 🟡 | `ValidationsBoard.jsx:64-75` | Refresh on-focus/visibility; sem websocket. |
| 5 | Histórico de badges obtidos/em processo | 🟡 | `ValidationsBoard.jsx:77-83`; `ManagementDashboard.jsx:18-23` | Por estado (global); sem vista por consultor. |
| 6 | Catálogo de badges com descrições | ✅ | `BadgeCatalog.jsx`; `BadgeCard.jsx:110-111` | API real. |
| 7 | Ver requisitos de cada badge | ✅ | `ApplicationReview.jsx:91-102,336-399`; `sharedRoutes.jsx:15` | Na review e no detalhe. |
| 8 | Relatórios de badges por área/período | ✅ | `TmStats.jsx:128-155`; `exports.routes.js:11-24` (`from`/`to`) | Gráficos por SL/LP/nível + exports por período. |
| 9 | Exportar pedidos para Excel/PDF | ✅ | `ExportsPanel.jsx:19`; `exports.routes.js:18` | csv/xlsx/pdf. |
| 10 | Exportar badges para Excel/PDF | ✅ | `ExportsPanel.jsx:22`; `exports.routes.js:21` | API real. |
| 11 | Exportar consultores para Excel/PDF | ✅ | `ExportsPanel.jsx:18`; `exports.routes.js:12` | API real. |
| 12 | Exportar aprovações para Excel/PDF | ✅ | `ExportsPanel.jsx:20` (`state:'Accepted'`) | API real. |
| 13 | Exportar rejeições para Excel/PDF | ✅ | `ExportsPanel.jsx:21` (`state:'Rejected'`) | API real. |
| 14 | Badge na assinatura de email | ⚪ | `MailSignature.jsx:40` | Só consultores ganham badges. |
| 15 | Ver sistema de pontos por badge | ✅ | `BadgeCard.jsx`; `BadgeDetail.jsx`; `TmStats.jsx:100` | Pontos visíveis (partilhados). |
| 16 | Ver badges de conquista especial (Premium) | ✅ | `BadgeCard.jsx:11,35,79`; `BadgeCatalog.jsx:31` | Special distinguido no catálogo. |
| 17 | Descarregar certificados PDF | ⚪ | `applications.routes.js:78`; `certificate.service.js:17` (ownership) | Geração scoped ao dono (consultor). |
| 18 | Receber emails de pedidos de aplicação | ✅ | `applications.controller.js:532-544` | Notificação in-app a todos os TMs no submit. |
| 19 | Notificações de aprovação/rejeição ao consultor | ✅ | `applications.controller.js:717-755,760-785` | TM 'review'→In validation notifica consultor. |
| 20 | Ver badges próximos da expiração | ✅ | `TmStats.jsx:65-79,160-211`; `statistics.controller.js:329` | Tabela com janelas (30/90/180/365/730d). |
| 21 | Ver histórico de cada processo de aplicação | ✅ | `ApplicationReview.jsx` (bloco "Histórico do Processo") | Exposto também ao TM (removido o gate `isSll &&`). |
| B1 | (BÓNUS) Timeline de evolução por consultor | ❌ | `Evolution.jsx`; `evolutionApi.js:23` | Timeline só para o consultor logado. |

### Resumo Talent Manager
- ✅ 17 · 🟡 2 · ❌ 1 · ⚪ 2 (total 22)
- **Resolvido:** (2) página de consultores + dashboard com KPIs/gráficos; (21) histórico do processo agora visível ao TM.
- **Lacunas que sobram:** (B1, bónus) Timeline de evolução por consultor — ❌ inexistente; (5) sem vista de histórico dedicada por consultor e (4) "tempo real" por refresh on-focus — 🟡 menor.
- **Nota:** TM corretamente sem ação 'accept' (`ApplicationReview.jsx`); exports scoped por role no backend.

---

## 3. Perfil Service Line Leader

| Nº | Requisito | Estado | Evidência (ficheiros) | Notas |
|----|-----------|--------|------------------------|-------|
| 1 | Ver badges fora da sua área | ✅ | `BadgeCatalog.jsx`; `routes/index.jsx:82` | Catálogo não scoped (correto). |
| 2 | Dashboard com progresso de TODOS os consultores da SL | ✅ | `ManagementDashboard.jsx` (KPIs + gráficos); `ConsultantsList.jsx` (via `SllTeam`, scoped); API `GET /statistics/consultants` | Página de equipa scoped à SL com pontos/badges/cand. em aberto/último login + filtros. |
| 3 | Tempo real do estado dos pedidos da SL | 🟡 | `ValidationsBoard.jsx:64-75`; `applications.controller.js:62-72` | API scoped; "tempo real" = refresh on-focus. |
| 4 | Histórico de badges da SL (obtidos e em curso) | ✅ | `SllBadgeHistory.jsx`; `getApplications` (scoped) | 2 tabs (Obtidos/Em Processo), coluna Nível, filtros Área/Badge/datas. |
| 5 | Catálogo de badges com descrições | ✅ | `BadgeCatalog.jsx`; `BadgeCard` | Partilhado, API real. |
| 6 | Ver requisitos de cada badge | ✅ | `BadgeDetail.jsx:51,437-445`; `ApplicationReview.jsx` | No detalhe e na revisão. |
| 8 | Ver sistema de pontos por badge | ✅ | `BadgeDetail.jsx:148,233-236` | `badge_points`; pode ser nulo. |
| 9 | Ver badges de conquista especial (Premium) | ✅ | `BadgeCatalog.jsx:491-503`; `BadgeDetail.jsx:324,352-379` | Classe special/Premium visível. |
| 10 | Relatórios de badges por área/período | ✅ | `SllStats.jsx` + `StatsOverview.jsx`; API `GET /statistics/badges-summary` | KPIs + filtros Área/Período (scoped à SL) + relatório mensal + exports. |
| 11 | Exportar candidaturas Excel/PDF | ✅ | `ExportsPanel.jsx:19-21`; `exports.controller.js:202-208` | Scoped por SL. |
| 12 | Exportar badges Excel/PDF | ✅ | `ExportsPanel.jsx:22`; `exports.controller.js:269-298` | Scoped `b.service_line_id`. |
| 13 | Exportar consultores Excel/PDF | ✅ | `ExportsPanel.jsx:18`; `exports.controller.js:138-155` | Scoped via `CONSULTANTS_IN_SL_SUBQUERY`. |
| 14 | Exportar aprovações Excel/PDF | ✅ | `ExportsPanel.jsx:20-21,24`; `exports.controller.js:165-181` | Logs scoped por SL. |
| 15 | Descarregar certificados PDF | 🟡 | `certificates.controller.js:14-33` (SLL autorizado) | API permite, mas sem botão/UI no fluxo SLL. |
| 16 | Receber emails de pedidos/validações | ✅ | `applications.controller.js` (loop SLL "In validation"); `email.service.js` `sendApplicationPendingSllReviewEmail` | Email a cada SLL ao chegar a "In validation" (respeita preferências). |
| 17 | Notificações de aprovação/rejeição | ✅ | `applications.controller.js`; `notifications.service.js` | Notif in-app + email ao SLL na nova validação. |
| 18 | Ver/comparar ranking dos consultores da SL | ✅ | `shared/Ranking/Ranking.jsx:247-276,392-414` | Scoped client-side a `user.serviceLine` + filtro por área. |
| 19 | Ver histórico de cada processo de candidatura | ✅ | `ApplicationReview.jsx:69-298`; `ApplicationDetailPage.jsx:64-66` | Timeline + parecer do TM. |
| B1 | (BÓNUS) Métricas de comparação entre consultores | ❌ | — | Sem página/endpoint. |
| B7 | (BÓNUS) Badge na assinatura de email | ⚪ | `MailSignature.jsx:40` | Só consultores ganham badges. |

### Resumo Service Line Leader
- ✅ 16 · 🟡 2 · ❌ 1 · ⚪ 1 (total 20)
- **SL-scoping** bem aplicado no backend (candidaturas, exports, consultores e badges-summary scoped à SL).
- **Resolvido:** (16) email ao SLL na nova validação; (4) histórico de badges da SL; (2) página de equipa; (10) relatórios com filtros Área/Período + KPIs; (17) notificações in-app + email.
- **Lacunas que sobram:** (B1, bónus) métricas de comparação entre consultores — ❌ inexistente; (15) certificado PDF sem UI no fluxo SLL e (3) "tempo real" por refresh — 🟡 menor. "Ferramenta de Comparação" no header continua omitida (decisão de âmbito).

---

## 4. Perfil Administrador

| Nº | Requisito | Estado | Evidência (ficheiros) | Notas |
|----|-----------|--------|------------------------|-------|
| 1 | Gestão de utilizadores e permissões | ✅ | `admin/AdminUsers/AdminUsers.jsx`; `users/api/usersApi.js`; `user.controller.js` | Lista/filtros/criar/editar/desativar — API real. |
| 2 | Criar utilizadores e atribuir perfil | ✅ | `CreateUserModal.jsx`; `AdminUsers.jsx:300-307` | Modal com role/SL/área. |
| 3 | Adicionar e remover badges | ✅ | `admin/AdminBadges/AdminBadges.jsx:88-111`; `badges.routes.js` | CRUD completo via API. |
| 4 | Add/del LP / SL / Áreas / Níveis / Requisitos | 🟡 | `features/structure/*`; `LevelsList.jsx:134` (no-op); `AdminRequirements.jsx` (só leitura) | LP/SL/Áreas full CRUD. **Requisitos sem CRUD UI nem endpoint.** |
| 5 | Exportar dados para Excel/PDF | ✅ | `ExportsPanel.jsx`; `exports.routes.js:12-24` | CSV/XLSX/PDF, 5 entidades. |
| 6 | Gestão de badges (expiração, pontos) | 🟡 | `AdminBadges.jsx:284-291` (pontos); `models/badges.js:61-64` | Pontos editáveis. **Campo de expiração não está no formulário web.** |
| 7 | Configuração de notificações | ❌ | `notifications.routes.js` (só inbox+prefs) | Sem UI nem endpoints admin para templates/alertas globais. |
| 8 | Configuração de políticas RGPD | 🟡 | `gdpr.routes.js:17-20` (admin endpoints); `gdprApi.js` (só consumer) | API admin completa; **sem UI admin.** |
| 9 | Ver e gerir todos os pedidos de badge | 🟡 | `admin/AdminApplications/AdminApplications.jsx:33-83`; `applications.controller.js:74-79` | API dá acesso total; **web só-leitura, sem detalhe/ações.** |
| 12 | Informação genérica e Anúncios Ativos/Inativos | ✅ | `management/Announcements/Announcements.jsx`; `announcements.controller.js` | CRUD + toggle ativo/inativo. |
| B1 | (BÓNUS) Email à equipa quando SLA excedido | ✅ | `workers/sla.worker.js:172`; `custom_sla.worker.js:182`; `email.service.js:540,630` | Cron 15min + email trilingue. |
| B10 | (BÓNUS) Definir e gerir SLAs das equipas | 🟡 | `slas.routes.js:12-40`; `slas.controller.js`; `AdminLayout.jsx:10` (link morto) | CRUD API completo; **sem página web nem cliente.** |
| B11 | (BÓNUS) Notificação PUSH de SLAs excedidos | ✅ | `workers/sla.worker.js:154`; `notifications.service.js:9-27` (`emitToUser`) | Notif na plataforma + push WebSocket. |

### Resumo Administrador
- ✅ 7 · 🟡 5 · ❌ 1 (total 13)
- **Padrão:** backend mais maduro que o front-office admin — vários endpoints completos sem UI (RGPD, SLAs, expiração de badge, ações sobre pedidos).
- **Lacunas principais:** (7) configuração de notificações — único totalmente em falta; (9) gerir pedidos só-leitura (falta detalhe+ações); (4) CRUD de requisitos A1..An inexistente (UI e API); (B10) SLAs com link de sidebar morto; (8/6) RGPD e expiração de badge só faltam UI.
- **Nota de arquitetura:** páginas admin mortas (`AdminLearningPaths/ServiceLines/Areas/Levels`) não importadas em `adminRoutes.jsx` — limpeza recomendada.

---

## 5. Requisitos Gerais (transversais)

| Nº | Requisito | Estado | Evidência (ficheiros) | Notas |
|----|-----------|--------|----------------------|-------|
| G1 | Dashboard responsivo mobile/desktop (~300px) | 🟡 | `WelcomeCard/`; 33 ficheiros com `@media`; `ProfileStatItem.module.css:10` | Responsivo extenso; sem breakpoint explícito ~300px na maioria — carece verificação visual. |
| G2 | Workflow de aprovação auditável (log imutável) | ✅ | `models/application_validation_logs.js`; `applications.controller.js:468,685,899` | Registo em cada transição. |
| G3 | KPIs em dashboards de gestores | ✅ | `admin/AdminDashboard/AdminDashboard.jsx:23-46`; `TmStats.jsx:47-103`; `SllStats/` | KPIs com dados reais. |
| G4 | Comunicação cliente-servidor via HTTPS | 🟡 | `api/server.js:1,18` (`http.createServer`); `app.js:37` (`helmet()`) | Servidor HTTP puro; TLS delegado a proxy externo. |
| G5 | Login com Email + Password obrigatórios | ✅ | `auth/pages/LoginPage/LoginPage.jsx:48,116-138`; `auth.controller.js:389` | Valida front+back. |
| G6 | "Remember me" / sessão persistente | ✅ | `LoginPage.jsx:143-152`; `AuthContext.jsx:101-138`; `auth.controller.js:493,520-526` | Refresh token 30d vs 1h. |
| G7 | Validação login com destaque vermelho por campo | 🟡 | `FormInput.jsx:13,32` (`is-invalid`); `LoginPage.jsx:48-50,159` | Login mostra erro geral (FormAlert), não highlight por campo vazio. |
| G8 | Recuperação de password | 🟡 | `ForgotPasswordPage.jsx`; `ResetPasswordPage.jsx:120-160` | Fluxo por link/token; mensagem "Palavra-passe redefinida!" (≈, não literal). |
| G9 | Logout com confirmação | 🟡 | `TopBar/UserDropdown/UserDropdown.jsx:147,154-161`; `pt/common.json:242` | ConfirmToast com confirmar/cancelar; não página dedicada nem texto literal. |
| G10 | Quatro perfis de utilizador | ✅ | `routes/{admin,consultant,sll,tm}Routes.jsx`; `responseCodes.json:77-79` | Consultant/Admin/TM/SLL em rotas e RBAC. |
| G11 | Relatórios mínimos (% badges, mensal, intervalo, LP, níveis, # users) | ✅ | `statistics.routes.js:84-120`; `statistics.controller.js:210-299`; `statisticsApi.js:4-31` | Todos presentes e consumidos. |
| G12 | (BÓNUS) 3 idiomas (PT/EN/ES) | ✅ | `i18n.js:15-18`; `locales/{pt,en,es}/common.json` | Configurado. |
| G13 | (BÓNUS) Saudação por tempo/contexto, localizada | ✅ | `WelcomeCard/WelcomeCard.jsx:9-25`; `pt/common.json:174-178` | first_login/>15d/parte do dia nos 3 idiomas. |
| G14 | Página de Anúncios/Informações (criar/ver/editar, imediato) | ✅ | `announcements.routes.js:12-40`; `management/Announcements/`; `consultant/ConsultantAnnouncements/` | CRUD com guard `leadership`. |
| G15 | (BÓNUS) Integração Teams/Slack | ✅ | `integrations.service.js:6,62,106-118`; `notifications.service.js:3,39` | Webhooks reais Teams+Slack. |

### Resumo Requisitos Gerais
- ✅ 10 · 🟡 5 · ❌ 0 (total 15)
- **Parciais a fechar:** (G4) servidor HTTP puro (TLS por proxy); (G8) texto de sucesso ≠ literal e fluxo por link; (G9) ConfirmToast vs página dedicada; (G7) erro geral em vez de highlight por campo no login; (G1) responsividade a ~300px por confirmar visualmente.

---

## Mobile (fora de âmbito desta auditoria)
O enunciado lista um perfil Mobile-Consultor (26 requisitos + bónus a/b). Esta auditoria cobre apenas Web + API, conforme âmbito do trabalho. O estado do Mobile deve ser avaliado separadamente sobre `Mobile/`.

---

## Foco: o que falta no TM e no SLL

Os requisitos **obrigatórios** de TM e SLL estão essencialmente completos. O que sobra:

**Talent Manager**
1. **(BÓNUS, ❌)** Timeline de evolução por consultor (B1) — inexistente.
2. **(menor, 🟡)** Vista de histórico dedicada por consultor (req 5); "tempo real" (req 4) por refresh on-focus em vez de polling/SSE.

**Service Line Leader**
1. **(BÓNUS, ❌)** Métricas de comparação entre consultores da mesma área/experiência (B1) — inexistente.
2. **(menor, 🟡)** Botão de certificado PDF no fluxo SLL (req 15, API já permite); "tempo real" (req 3) por refresh.
3. "Ferramenta de Comparação" no header SLL — omitida por decisão de âmbito (sem feature).

**Fechado neste ciclo:** tabela de validações; redesign do painel de revisão (TM+SLL); blocos exclusivos SLL (Histórico/Parecer/Verificado pelo TM + Pontos/Ranking no header); ecrã de resultado pós-decisão; gate de consentimento RGPD; histórico do processo exposto ao TM (req 21); páginas de consultores (TM) e equipa (SLL) com filtros e colunas Figma; histórico de badges da SL; email ao SLL na nova validação (req 16); dashboard com KPIs + gráficos; estatísticas com filtros avançados + KPI cards. Endpoints novos: `GET /statistics/consultants`, `GET /statistics/badges-summary`; `getApplications` com `progression_stage` + filtros área/badge/datas; pontos+ranking do consultor no detalhe.
