# 2. Requisitos do Sistema e Abordagem

Nesta secção, deves mapear como interpretaste as regras do Enunciado_PINT.pdf e as dividiste sob a ótica da engenharia de software.

## 2.1. Requisitos Funcionais (RF)

Listagem direta das ações que as plataformas (Web e Mobile) permitem fazer.
Podes dividi-los sumariamente pelas necessidades essenciais de cada ator (Consultor, Administrador, Talent Manager e Service Line Leader), focando-te apenas no que foi considerado fundamental e implementado (como o login, submissão de evidências, fluxo de estados e visualização de dashboards).

## 2.2. Requisitos Não Funcionais (RNF)

- **Segurança:** Uso de HTTPS para comunicação segura e encriptação/regras de validação de credenciais (como a obrigatoriedade de alteração de password no primeiro acesso e validação visual de erros a vermelho).
- **Usabilidade e Responsividade:** Interface adaptada tanto para desktop como para dispositivos móveis.
- **Escalabilidade:** Capacidade da arquitetura suportar a introdução de novos Learning Paths no futuro (como as Power Skills).
- **Internacionalização:** Suporte para múltiplos idiomas (Português, Inglês e Espanhol).

---

# 3. Arquitetura de Informação e Modelo de Dados

Uma visão muito breve de como a informação foi estruturada nos bastidores para suportar o negócio da Softinsa.

## 3.1. Estrutura Hierárquica

Explicação sucinta de como geraste a árvore de dados exigida: Learning Path → Service Lines → Áreas → Níveis → Requisitos.

## 3.2. Modelo de Dados (Diagrama Entidade-Associação / Relacional)

- Inclusão do diagrama da Base de Dados (tabelas de utilizadores, perfis, badges, candidaturas, requisitos e logs de auditoria).
- Breve descrição das relações fundamentais (ex: como uma candidatura associa um Consultor a um Badge e armazena as evidências e o estado atual).

---

# 4. Prototipagem e Design de Interface (Figma)

O elo de ligação entre os requisitos e o produto final. Aqui demonstras o aspeto visual e a experiência do utilizador planeada.

## 4.1. Conceito de Design e UI/UX

Descrição do estilo visual adotado no Figma (alinhamento com a identidade da Softinsa, escolha de cores para estados, etc.).

## 4.2. Demonstração de Ecrãs Chave

Inclusão de capturas de ecrã do protótipo com anotações:

- Ecrãs de Autenticação (Login e Recuperação de Password com as regras de validação).
- Dashboard Principal do Consultor (Web e Mobile) mostrando o progresso visual na "Jornada Técnica".
- Catálogo de Badges e detalhe dos requisitos (Cards com título e descrição).

---

# 5. Workflow de Aprovação e Ciclo de Vida do Pedido

Explicação detalhada de como o sistema reflete o fluxo dinâmico estipulado no enunciado, detalhando a transição de estados através das ações dos utilizadores.

## 5.1. Submissão (Consultor)

O utilizador anexa as evidências externas, alterando o estado do pedido de Open para Submitted.

## 5.2. Triagem e Validação de Evidências (Talent Manager)

Avaliação global das evidências submetidas, com transição para Em Validação (se correto) ou retorno a Open (se incorreto para retificação), garantindo o registo auditável de quem avaliou e quando.

## 5.3. Homologação Final (Service Line Leader)

Validação restrita aos colaboradores da sua área, culminando no estado Fechado (quer por aprovação/publicação do badge ou rejeição definitiva) ou Open (via Send Back com comentários).

---

# 6. Funcionalidades Transversais Implementadas

Foco nas lógicas de suporte e negócio que foram integradas no sistema core.

## 6.1. Mecânicas de Gamificação

Como funciona o sistema de atribuição de pontos gerido pelo Administrador, a acumulação no perfil do consultor e a regra de retenção de pontos mesmo após a expiração de um badge.

## 6.2. Módulo de Estatísticas e Reporting

Demonstração dos ecrãs que geram as métricas mínimas exigidas (visão mensal de badges, volume por ranges de datas, contagem por níveis/learning paths e utilizadores registados).

---

# 7. Extras e Funcionalidades Bónus

Destaque para o valor acrescentado que eleva a qualidade do projeto face ao enunciado original.

## 7.1. Sistema de Saudações Inteligente

Demonstração da lógica multi-idioma que saúda o utilizador com base na hora do dia ("Bom dia/Tarde/Noite") ou deteta ausências superiores a 15 dias ("Seja bem-vindo novamente").

## 7.2. Mural de Avisos e Comunicação

Espaço gerido pelos administradores para publicação imediata de informações genéricas a todos os utilizadores.

## 7.3. Alertas de SLA e Notificações

Mecanismo (PUSH ou email) que avisa os validadores ou gestores quando os prazos de resposta a pedidos são ultrapassados.
