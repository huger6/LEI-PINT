# Conteúdo redigido e imagens necessárias (Capítulos 5, 6 e 7)

## What I wrote (from the codebase, non-technical)

**Chapter 5 — Workflow de Aprovação:** an intro that lays out the chronological lifecycle (Aberta → Submetida → Em Validação → Aceite/Rejeitada), then the three sections: Submissão (Consultor), Triagem (Talent Manager — encaminhar / devolver), and Homologação Final (Service Line Leader — aprovar / rejeitar / devolver), plus the closing on notification and badge publication.

**Chapter 6 — Funcionalidades Transversais:** Gamification (points per badge defined by admin, permanent accumulation, points kept after expiry, streak, milestone animations, special badges, rewards store, ranking) and the Statistics/Reporting module (dashboard KPIs, monthly badges, date-range volume, distribution by level/Learning Path, registered users, exports — SLL scoped vs TM/Admin global).

## Images you need to provide

Drop the PNGs into these folders with exactly these names:

### `docs/images/chapter5/` (Workflow)

- `consultor-submissao.png` — Consultant: prepare/submit a candidatura (Web)
- `mobile-submissao.png` — Consultant: submit a candidatura (Mobile)
- `tm-triagem.png` — Talent Manager: validations queue
- `tm-revisao-evidencias.png` — Talent Manager: reviewing a candidatura's evidence
- `sll-homologacao.png` — Service Line Leader: final decision screen

### `docs/images/chapter6/` (Gamification & Reporting)

- `consultor-pontos.png` — Consultant points/gamification screen
- `loja-recompensas.png` — Rewards store
- `dashboard-gestao.png` — Management home dashboard (KPIs)
- `estatisticas-relatorios.png` — Statistics/reports page

### `docs/images/chapter7/` (Apresentação de Ecrãs)

**Web:** `web-login.png`, `web-consultor-inicio.png`, `web-consultor-catalogo.png`, `web-consultor-detalhe-badge.png`, `web-consultor-candidaturas.png`, `web-consultor-conquistas.png`, `web-consultor-pontos.png`, `web-consultor-loja.png`, `web-sll-dashboard.png`, `web-sll-minha-service-line.png`, `web-sll-gamificacao.png`, `web-sll-equipa.png`, `web-admin-dashboard.png`

**Mobile:** `mob-login.png`, `mob-dashboard.png`, `mob-badges.png`, `mob-detalhe-badge.png`, `mob-candidatura.png`, `mob-objetivos.png`, `mob-evolucao.png`, `mob-notificacoes.png`, `mob-perfil.png`

## Notes

- The report still compiles before the images exist — each missing one renders a labelled "[Imagem em falta]" box, so you'll see exactly which slot a file maps to.
- I had no LaTeX toolchain to compile here, but I verified the structure (chapter ordering correct; figure/itemize/enumerate environments all balanced).
- Chapter 7's gallery is fairly complete; if it's more screenshots than you want to capture, tell me which roles/pages to trim and I'll prune the figures.
