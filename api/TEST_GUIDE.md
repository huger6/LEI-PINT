# Guia de Execução de Testes

## Resumo do Trabalho Realizado

Este documento descreve como executar os testes do projeto após as alterações implementadas para o sprint de fluxos do consultor.

### Endpoints Implementados
1. **PUT /api/auth/me** - Atualizar perfil do utilizador autenticado
2. **GET /api/gamification/consultant-stats** - Obter estatísticas de gamificação do consultor
3. **GET /api/gamification/earned-badges** - Obter insígnias conquistadas pelo consultor

### Correções Aplicadas
- ✅ `storage.service.js`: Inicialização segura do cliente Supabase (tolerante quando env vars ausentes)
- ✅ `redis.js`: Mock em memória quando REDIS_URL não está configurado ou em testes
- ✅ Validações adicionadas com Zod
- ✅ Testes unitários adicionados para os novos endpoints
- ✅ Códigos de erro padronizados em `responseCodes.json`

## Executar Testes Localmente

### Opção 1: Com Docker Compose (Recomendado)

```bash
cd api

# Iniciar Postgres e Redis em containers
docker-compose up -d

# Esperar 5 segundos para os serviços iniciarem
sleep 5

# Executar testes
npm test

# Ou executar testes específicos
npm test -- --runInBand tests/auth.test.js tests/gamification.test.js

# Parar os serviços
docker-compose down
```

### Opção 2: Com Instâncias Locais Já Em Execução

Se já tiveres Postgres e Redis em execução localmente:

```bash
cd api

# Certificar-te de que as variáveis de ambiente estão configuradas
export DB_NAME=pint_db
export DB_USER=postgres
export DB_PASSWORD=password
export DB_HOST=localhost
export DB_PORT=5432
export REDIS_URL=redis://localhost:6379

# Executar testes
npm test
```

### Opção 3: Sem Dependências Externas (Limitado)

Para um teste rápido sem banco de dados real (suites falharão ao interagir com DB):

```bash
cd api
npm install --save-dev jest-mock-extended
# (Não implementado - não recomendado)
```

## Configuração de Ambiente para Testes

O projeto detecta automaticamente `NODE_ENV=test` e adapta comportamentos:

- **Redis**: Usa mock em memória se `REDIS_URL` não estiver definido
- **Supabase**: Retorna URLs dummy se variáveis de ambiente não estiverem presentes
- **Postgres**: Desativa SSL em `NODE_ENV=test` (para compatibilidade com setupslocais)

## Dependências de Teste

- Jest (^27.0.0)
- Supertest (para testes HTTP)
- Node: v14+

## Comandos Úteis

```bash
# Executar apenas testes de auth
npm test -- tests/auth.test.js

# Executar apenas testes de gamificação
npm test -- tests/gamification.test.js

# Executar em modo watch (não termina)
npm test -- --watch

# Executar com cobertura de código
npm test -- --coverage

# Debugar um teste específico
node inspect node_modules/.bin/jest tests/auth.test.js
```

## Solução de Problemas

### Erro: "ECONNREFUSED" para Redis ou Postgres

**Causa**: Os serviços não estão em execução.

**Solução**:
```bash
# Iniciar com Docker Compose
docker-compose up -d

# OU verificar se estão em execução localmente
ps aux | grep postgres
ps aux | grep redis
```

### Erro: "supabaseUrl is required"

**Causa**: Variáveis de ambiente Supabase não foram corrigidas.

**Solução**: O ficheiro `storage.service.js` agora fornece um no-op seguro. Se ainda vires erro, define as variáveis:
```bash
export SUPABASE_STORAGE_URL=https://example.supabase.co
export SUPABASE_STORAGE_API_KEY=anon-key
```

### Erro: Testes falham com "Cannot CREATE table"

**Causa**: Base de dados de testes não foi criada ou Postgres não está acessível.

**Solução**:
```bash
docker-compose logs postgres  # Ver logs do Postgres
docker-compose restart        # Reiniciar os serviços
```

## CI/CD

Para ambientes de CI (GitHub Actions, etc.), adiciona ao workflow:

```yaml
services:
  postgres:
    image: postgres:13
    env:
      POSTGRES_DB: pint_test
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5

  redis:
    image: redis:6
    options: >-
      --health-cmd "redis-cli ping"
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5

steps:
  - uses: actions/checkout@v3
  - uses: actions/setup-node@v3
    with:
      node-version: '16'
  - run: cd api && npm install
  - run: cd api && npm test
    env:
      DB_NAME: pint_test
      DB_USER: postgres
      DB_PASSWORD: password
      DB_HOST: postgres
```

## Próximos Passos

- [ ] Expandir testes para cobrir casos de erro e edge cases
- [ ] Adicionar testes de integração para fluxos end-to-end
- [ ] Implementar testes de performance/carga
- [ ] Migrar todas as respostas antigas para usar códigos de erro (scope completo)
