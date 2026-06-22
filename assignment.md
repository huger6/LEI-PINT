# SOFTINSA: Plataforma de Badges da Softinsa

A Softinsa, como empresa líder em consultoria tecnológica, reconhece a importância da formação contínua e da certificação de competências dos seus colaboradores. 

Atualmente, a empresa possui múltiplos Learning Paths organizados por Service Lines com várias áreas, tendo cada uma pelo menos 5 níveis de progressão. Cada nível inclui requisitos (por exemplo, pacotes de formação, certificações, cursos, etc.).

Pretende-se desenvolver um portal de badges, que consiga transformar as formações que os consultores realizam ou pretendem realizar, com base nos requisitos e pressupostos de cada badge ("crachás") identificados/definidos no portal. As formações realizadas serão externas ao portal, mas serão identificadas no portal como requisitos e pressupostos de cada badge (exemplos: Udemy, IBM, AWS, Microsoft, etc.).

---

## Objetivos do Projeto

Este projeto visa colmatar os seguintes pontos:
* Dificuldade em evidenciar e validar competências adquiridas.
* Falta de um sistema de *gamification* que motive a aprendizagem contínua.
* Ausência de uma forma padronizada de apresentar credenciais profissionais.
* Necessidade de aumentar a visibilidade da empresa e o leque de competências dos seus colaboradores através de certificações verificáveis.

O objetivo principal é desenvolver uma plataforma de badges digitais similar ao **Credly.com**, que permita:
* Gestão de credenciais de competências verificadas;
* Sistema de *gamification* para estimular a evolução profissional;
* Integração com assinaturas de email corporativas (bónus);
* Agregar informação e aproximar a empresa de uma forma mais colaborativa, mantendo-a conectada com a rede de colaboradores e clientes e racionalizando os processos.

---

## Perfis e Plataformas Gerais
Pretende-se o desenvolvimento de:
1. **Plataforma Web:** Com quatro perfis disponíveis:
   * **Administrador:** Gestor de conteúdos e de toda a plataforma.
   * **Utilizador (Consultor):** O colaborador que progride na carreira.
   * **Talent Manager:** Quem vai validar as competências conforme as evidências submetidas.
   * **Service Line Leader:** Quem vai validar e aprovar os badges finais.
2. **Plataforma Mobile:** Dedicada exclusivamente ao perfil do **Consultor**.

---

## Estrutura dos Learning Paths

**Resumo da hierarquia:** Um Learning Path pode conter várias Service Lines, que podem conter várias áreas, que, por sua vez, contêm vários níveis. Cada nível pode conter vários requisitos ($A_1, \dots, A_n$).

Neste projeto específico, vamos focar-nos em apenas um Learning Path: **Jornada Técnica** (embora a base de dados deva ser desenhada para permitir a adição de novos no futuro, como o de *Power Skills*).

### Detalhe do Learning Path: Jornada Técnica
* **Service Line: Hybrid Cloud**
  * **Área: LowCode (Outsystems)**
    * **A - Nível Júnior:** Requisitos ($A_1; A_2; A_3$) $\rightarrow$ 1 Badge quando cumpre os 3 requisitos.
    * **B - Nível Intermédio:** Requisitos ($B_1; B_2; B_3$) $\rightarrow$ 1 Badge.
    * **C - Nível Sénior:** Requisitos ($C_1; C_2; C_3$) $\rightarrow$ 1 Badge.
    * **D - Nível Especialista:** Requisitos ($D_1; D_2; D_3$) $\rightarrow$ 1 Badge.
    * **E - Nível Líder de conhecimento:** Requisitos ($E_1; E_2; E_3$) $\rightarrow$ 1 Badge.

* **Service Line: Application Operations**
  * **Área: DevSecOps & IT Automation - DevOps**
    * Níveis A, B, C, D, E (Seguem a mesma lógica de requisitos de 1 a 3 e atribuição de 1 Badge por nível).

* **Service Line: Sourcing & Talent Management**
  * **Área: Sourcing & Talent Management - Talent Managem.**
    * Níveis A, B, C, D, E (Seguem a mesma lógica de requisitos de 1 a 3 e atribuição de 1 Badge por nível).

### Regras dos Badges e Requisitos
* O Administrador define os vários requisitos de cada nível ao criar um badge.
* Cada requisito é representado por um *card* contendo: **Título**, **Descrição** (que explica quais as evidências a submeter) e **Imagem**.
* Para obter o Badge de um nível, o consultor tem de cumprir todos os requisitos desse nível.
* Um consultor pode candidatar-se a **qualquer nível** diretamente (sem ter obrigatoriamente os badges dos níveis anteriores), desde que tenha os requisitos necessários.
* Ao candidatar-se, pode (ou não) estar definido um intervalo temporal para obter o Badge (regra opcional).

---

## Descrição do Workflow de Aprovação

1. **Início (Estado: Open)**
   * **Consultor:** Regista-se e acede ao sistema. Submete a candidatura a um determinado badge, fazendo o upload das evidências (**Estado: Submitted**).
2. **Talent Manager (Estado: Submitted)**
   * Vê todas as submissões do sistema (independentemente da área ou service line). Como existem vários utilizadores com este perfil, deve registar-se **quem** avaliou e **quando**.
   * **Ação:** Valida as evidências submetidas.
   * **Decisão:**
     * *Correto:* Envia para o Service Line Leader (**Estado: Em Validação**).
     * *Incorreto:* Retorna ao consultor para retificação (**Estado: Open**).
3. **Service Line Leader (Estado: Em Validação)**
   * Tem acesso apenas aos badges e áreas da sua própria Service Line (deve indicar a sua Service Line/área no registo).
   * **Ação:** Realiza a validação final do pedido.
   * **Decisão:**
     * *Aprovar:* Notifica o consultor e o Badge fica disponível para publicação (**Estado: Fechado** - Badge aprovado e publicado).
     * *Rejeitar:* Envia um e-mail de rejeição ao consultor (**Estado: Fechado** - Pedido rejeitado com feedback).
     * *Send Back:* Retorna ao consultor com um comentário para revisão (**Estado: Open**, aguarda informação adicional).

---

## Requisitos Detalhados por Perfil

### 1. Perfil do Consultor (FrontOffice / Web)
* **1.** Receber e-mail de confirmação de registo. Obrigatório alterar a password no primeiro login.
* **2.** Escolher a sua área no registo para que a aplicação mostre os badges preferenciais no início.
* **3.** Consultar todos os badges disponíveis na plataforma, mesmo de outras áreas.
* **4.** Dashboard pessoal com o progresso nos Learning Paths.
* **5.** Sistema de upload de evidências (certificados, diplomas, relatórios).
* **6.** Visualização em tempo real do status dos pedidos de badges.
* **7.** Consulta do histórico de badges obtidos e em processo.
* **8.** Catálogo de badges disponíveis com descrições.
* **9.** Consultar os requisitos detalhados de cada badge.
* **10.** Aceitação de termos de RGPD para publicação e partilha de badges.
* **11.** Possibilidade de partilhar o badge diretamente no LinkedIn.
* **13.** Sistema de pontos por badges obtidos.
* **14.** Badges de conquistas especiais (ex: certificações pagas).
* **15.** Métricas de progresso visual.
* **16.** Celebração de marcos alcançados (ex: atingir $X$ badges num determinado período).
* **17.** Recomendações de próximos badges com base no histórico.
* **18.** Download de certificados personalizados em formato PDF.
* **19.** Receber e-mail de confirmação de candidatura a badges.
* **20.** Receber notificações de aprovação/rejeição.
* **21.** Alertas de expiração de badges (definido opcionalmente pelo administrador).
* **22.** Lembretes de objetivos temporais (ex: "Tem até ao final do ano para cumprir...").
* **24.** Galeria pública de badges obtidos.
* **25.** Página individual pública para cada badge, acessível via URL ou clicando no badge.
* **26.** Sistema de verificação por link único para cada badge (página pública que comprova a certificação).
* **27.** Informações detalhadas sobre as competências certificadas de cada badge.
* **28.** Integração na página de badges com o site da Softinsa para ver info sobre competências.
* **BÓNUS 12:** Colocar o badge obtido na assinatura do e-mail corporativo.
* **BÓNUS 23:** Configuração de template de e-mail com os badges obtidos.

### 2. Perfil do Service Line Leader (FrontOffice)
* **1.** Consultar badges disponíveis na plataforma, mesmo fora da sua área.
* **2.** Dashboard pessoal com o progresso de todos os consultores da sua Service Line.
* **3.** Visualização do status dos pedidos da sua área em tempo real.
* **4.** Consultar histórico de badges da sua área (obtidos e em processo).
* **5.** Catálogo de badges disponíveis com descrições e (**6**) consulta dos seus requisitos.
* **8.** Visualizar o sistema de pontos por badges da sua área (gerido pelo administrador).
* **9.** Ver sistema de conquistas especiais (*Badges Premium* - apela à criatividade dos estudantes).
* **10.** Gerar relatórios de badges atribuídos por área/período.
* **11, 12, 13, 14.** Exportação de pedidos, badges, consultores e aprovações para Excel/PDF.
* **15.** Download e geração de certificados de badges personalizados em PDF.
* **16.** Receber e-mails com pedidos de candidaturas / validações.
* **17.** Notificações de aprovação/rejeição.
* **18.** Visualizar e comparar o *ranking* de badges/pontos dos consultores da sua Service Line (utilizado para avaliar mérito, aumentos de ordenado ou compensações).
* **19.** Consultar o histórico associado a cada processo de candidatura.
* **BÓNUS 1:** Sistema de métricas de comparação entre consultores com a mesma experiência e área.
* **BÓNUS 7:** Colocar o seu badge na assinatura de e-mail.

### 3. Perfil do Talent Manager (FrontOffice)
* **1.** Consultar badges disponíveis na plataforma e catálogo com descrições (**6**) e requisitos (**7**).
* **2.** Dashboard pessoal com o progresso de todos os consultores da sua área/Service Line.
* **3.** Sistema de verificação de evidências para cada badge.
* **4.** Visualização em tempo real do status de todos os pedidos e histórico (**5**).
* **8, 9, 10, 11, 12, 13.** Gerar relatórios e exportar dados (pedidos, badges, consultores, aprovações, rejeições) para Excel/PDF.
* **14.** Colocar o seu badge na assinatura de e-mail.
* **15, 16.** Visualizar o sistema de pontos e conquistas especiais.
* **17.** Download de certificados em PDF personalizados.
* **18.** Receber e-mails de pedidos de candidaturas.
* **19.** Notificações de aprovação/rejeição enviadas ao consultor após a sua ação.
* **20.** Visualizar badges próximos da data de expiração.
* **21.** Consultar o histórico completo associado a cada processo de candidatura.
* **BÓNUS 1:** Criar uma *Timeline* de evolução profissional para cada consultor.

### 4. Perfil do Administrador / Gestor (BackOffice / FrontOffice)
* **1.** Gestão de utilizadores, permissões e criação de perfis (Service Line, Talent Manager).
* **3, 4.** Criar, editar e eliminar: Badges, Learning Paths, Service Lines, Áreas, Níveis e Requisitos.
* **5.** Exportação de dados gerais para Excel/PDF.
* **6.** Gestão completa dos badges (regras de expiração, definição de pontos por badge, etc.).
* **7.** Configuração de notificações do sistema.
* **8.** Configuração de políticas de RGPD.
* **9.** Consultar e gerir globalmente todos os pedidos de badges.
* **12.** Criação de informações genéricas e avisos ativos/inativos.
* **BÓNUS 10:** Definir e gerir os SLAs de resposta das equipas de Talent e Service Line.
* **BÓNUS 1/11:** Enviar notificações por e-mail ou via *PUSH* caso o SLA seja ultrapassado.

### 5. Requisitos Mobile (Apenas para o Consultor)
A aplicação móvel replica as funcionalidades essenciais do consultor da plataforma Web:
* **1 a 11.** Registo, login com alteração de password, escolha de área, catálogo, dashboard de progresso, upload de evidências, status em tempo real, termos RGPD e partilha LinkedIn.
* **13 a 18.** Visualizar pontos, conquistas, métricas de progresso, celebração de marcos, recomendações e download de PDFs.
* **19, 20.** Receber e-mails de confirmação e notificações de aprovação/rejeição.
* **21, 22.** Alertas de expiração e lembretes de objetivos na *timeline*.
* **24, 25, 26.** Acesso à página pública do badge, link de verificação único e competências detalhadas.
* **BÓNUS a):** Criação de uma *Timeline* de evolução profissional para cada consultor.
* **BÓNUS b):** Notificações *PUSH* nativas para SLAs ultrapassados na plataforma.

---

## Sistema de Gamificação (Notas Adicionais)
* O objetivo do sistema de pontos é permitir aos líderes identificar os melhores consultores (ex: a cada 100 pontos pode equivaler a $+X$ euros de ordenado ou atribuição de compensações).
* O ranking baseia-se nos pontos acumulados.
* Se um badge expirar, a pontuação que o consultor obteve com a conquista desse badge **mantém-se**.
* O Administrador tem total controlo para definir os pontos. Há total liberdade e apelo à criatividade das equipas de desenvolvimento para criar o sistema de gamificação e estatísticas visuais dos dashboards.

---

## Requisitos Gerais, Segurança e Interface

### Interface e Dashboard
* O design do dashboard deve ser totalmente responsivo (adaptado para Desktop e Mobile).
* Devem existir indicadores-chave de desempenho (KPIs) visíveis para os gestores.
* Todas as decisões de aprovação devem ser registadas e auditáveis num histórico de feedbacks.

### Segurança e Login
* Toda a comunicação cliente-servidor deve ser realizada obrigatoriamente via **HTTPS**.
* O formulário de **Login** deve conter os campos obrigatórios: `Email` e `Password`. Deve permitir a opção "Guardar dados de login" para evitar logins repetidos.
* As validações de campos incorretos ou em falta devem ser assinaladas visualmente com uma **identificação a vermelho** no respetivo campo.
* **Recuperar Password:** Opção disponível no login. O utilizador insere o e-mail, e se estiver registado, avança para os campos `Nova Password` e `Confirmar Password`. No fim, exibe-se a mensagem *"A sua password foi redefinida com sucesso"*. O processo pode ser cancelado a qualquer momento.
* **Terminar Sessão:** Ao aceder a esta opção, o sistema pergunta *"Pretende terminar a sua sessão?"*. Se confirmado, faz logout automático e obriga a novo login para aceder aos conteúdos. O processo pode ser cancelado.

### Reporting (Mínimo Exigível nos Dashboards)
* % de Badges com visão mensal;
* Número (#) de Badges por range de datas;
* Número (#) de Badges por Learning Paths;
* Número (#) de Badges por níveis das Learning Paths;
* Número (#) de utilizadores registados.

### Bónus Globais da Plataforma
* **Multi-idioma:** Plataforma disponível em 3 línguas: Português, Inglês e Espanhol.
* **Saudações dinâmicas conforme a hora e contexto:**
  * Mensagem *"Bem-vindo!"* após o registo ou após o primeiro login.
  * Mensagem *"Seja bem-vindo novamente"* se o utilizador estiver há mais de 15 dias sem efetuar login.
  * Mensagem *"Bom dia!"*, *"Boa Tarde!"* ou *"Boa Noite!"* nas restantes interações do dia a dia (traduzidas no idioma escolhido).
* **Página de Informações/Avisos (Notificações PUSH):** Espaço onde administradores, service lines e talent management criam e editam avisos genéricos imediatos para todos os utilizadores (ex: anunciar novos caminhos, gerir pedidos).
* **Integração Externa:** O sistema deve permitir integração com ferramentas corporativas de comunicação, nomeadamente **Microsoft Teams** ou **Slack**.