# Guia de Implementação - Sprint Fluxos do Consultor

## Resumo das Mudanças

Este documento descreve as novas funcionalidades implementadas para permitir que um consultor aceda e navegue toda a plataforma, incluindo atualização de perfil e visualização de estatísticas.

## Arquivos Modificados

### 1. Backend - Controllers
- **`api/src/controllers/auth.controller.js`**
  - Adicionada função `updateProfile()` para PUT /api/auth/me
  - Permite atualizar: nome completo, telefone, data de nascimento, imagem de perfil, idioma, localização e biografia

- **`api/src/controllers/gamification.controller.js`**
  - Adicionada função `getConsultantStats()` para GET /api/gamification/consultant-stats
  - Adicionada função `getEarnedBadges()` para GET /api/gamification/earned-badges

### 2. Backend - Validações
- **`api/src/validations/auth.validation.js`**
  - Adicionado `updateProfileSchema` com validações Zod para todos os campos atualizáveis

### 3. Backend - Rotas
- **`api/src/routes/auth.routes.js`**
  - Adicionada rota `PUT /api/auth/me`

- **`api/src/routes/gamification.routes.js`**
  - Adicionadas rotas `GET /api/gamification/consultant-stats`
  - Adicionada rota `GET /api/gamification/earned-badges`

### 4. Configuração
- **`api/src/config/responseCodes.json`**
  - Adicionados 12 novos códigos de resposta relacionados com perfil e estatísticas

## Endpoints Novos

### 1. PUT /api/auth/me - Atualizar Perfil do Utilizador

**Autenticação:** Obrigatória (qualquer role autenticado)

**Body (todos campos opcionais):**
```json
{
  "full_name": "João Silva Novo",
  "phone_number": "+351912345678",
  "birthdate": "1990-05-15",
  "profile_img_url": "https://storage.url/public-assets/temp/image.jpg",
  "preferred_lang_id": 1,
  "location_id": 5,
  "biography": "Sou um consultor com 10 anos de experiência em desenvolvimento."
}
```

**Respostas:**
- `200 OK` - Perfil atualizado com sucesso (código: `AUTH_PROFILE_UPDATED`)
- `400 Bad Request` - Validação falhou ou dados inválidos
- `404 Not Found` - Utilizador não encontrado
- `500 Server Error` - Erro interno

**Notas:**
- Pelo menos um campo deve ser fornecido
- A imagem será movida de temporary para permanent storage
- Location e language IDs são validados contra a BD
- Biography é validada quanto a comprimento, profanidade e conteúdo
- Cache Redis é invalidado após sucesso

---

### 2. GET /api/gamification/consultant-stats - Dashboard de Estatísticas

**Autenticação:** Obrigatória (apenas Consultants)

**Query Parameters:** Nenhum

**Resposta (200 OK):**
```json
{
  "success": true,
  "code": "GAMIFICATION_STATS_RETRIEVED",
  "data": {
    "totalPoints": 850,
    "earnedBadges": 5,
    "badgesInProgress": 2,
    "rankingPosition": 12,
    "totalInteractions": 28,
    "interactionsSummary": {
      "VIEW": 15,
      "FAVORITE": 10,
      "SHARE_LINKEDIN": 3
    }
  }
}
```

**Respostas de Erro:**
- `403 Forbidden` - Não é um Consultant
- `404 Not Found` - Consultant não encontrado
- `500 Server Error` - Erro interno (código: `GAMIFICATION_STATS_FETCH_FAILED`)

---

### 3. GET /api/gamification/earned-badges - Badges Conquistadas

**Autenticação:** Obrigatória (apenas Consultants)

**Query Parameters:**
- `page` (int, default: 1) - Página para paginação
- `limit` (int, default: 10) - Número de badges por página

**Resposta (200 OK):**
```json
{
  "success": true,
  "code": "GAMIFICATION_EARNED_BADGES_RETRIEVED",
  "data": [
    {
      "awardedBadgeId": 1,
      "badge": {
        "id": 5,
        "title": "JavaScript Expert",
        "slug": "javascript-expert",
        "imageUrl": "https://storage.url/badges/javascript-expert.jpg",
        "description": "Demonstrou domínio completo de JavaScript",
        "pointsValue": 100
      },
      "awardedDate": "2024-03-15T10:30:00Z",
      "expirationDate": null,
      "pointsSnapshot": 100,
      "isPublished": true,
      "isFeatured": false,
      "verificationLink": "https://certificates.example.com/verify/abc123"
    }
  ],
  "pagination": {
    "totalItems": 5,
    "totalPages": 1,
    "currentPage": 1,
    "limit": 10
  }
}
```

**Respostas de Erro:**
- `400 Bad Request` - Query parameters inválidos
- `403 Forbidden` - Não é um Consultant
- `404 Not Found` - Consultant não encontrado
- `500 Server Error` - Erro interno (código: `GAMIFICATION_EARNED_BADGES_FETCH_FAILED`)

**Nota:** Se o consultant não tiver badges, retorna:
```json
{
  "success": true,
  "code": "GAMIFICATION_NO_ACHIEVEMENTS",
  "data": [],
  "pagination": { "totalItems": 0, "totalPages": 0, ... }
}
```

## Fluxo de Uso Completo

### 1. Registo e Autenticação
```bash
# Registo
POST /api/auth/register
{
  "full_name": "João Silva",
  "username": "joao.silva",
  "email_address": "joao@example.com",
  "password": "SecurePass123!",
  "user_role": "Consultant",
  "phone_number": "+351912345678",
  "birthdate": "1990-05-15",
  "location_id": 5,
  "preferred_lang_id": 1,
  "areas": [
    {"area_id": 2, "is_primary": true},
    {"area_id": 3, "is_primary": false}
  ]
}

# Confirmar email (via link)
GET /api/auth/confirm-email?token=xxxxx

# Login
POST /api/auth/login
{
  "identifier": "joao@example.com",
  "password": "SecurePass123!"
}
```

### 2. Completar Perfil (NOVO)
```bash
PUT /api/auth/me
Authorization: Bearer <access_token>
{
  "biography": "Sou um desenvolvedor com 10 anos de experiência...",
  "profile_img_url": "https://storage.url/public-assets/temp/photo.jpg"
}
```

### 3. Explorar Estrutura
```bash
# Learning Paths
GET /api/learning-paths

# Service Lines de um Learning Path
GET /api/learning-paths/digital-skills/service-lines

# Áreas de uma Service Line
GET /api/learning-paths/digital-skills/service-lines/backend/areas

# Níveis de uma Área
GET /api/learning-paths/digital-skills/service-lines/backend/areas/nodejs/levels

# Badges de um Nível
GET /api/learning-paths/digital-skills/service-lines/backend/areas/nodejs/levels/1/badges
```

### 4. Explorar Catálogo de Badges
```bash
# Listar todos os badges
GET /api/badges

# Detalhe de um badge com requisitos
GET /api/badges/javascript-expert
```

### 5. Abrir Candidatura
```bash
POST /api/applications/start
Authorization: Bearer <access_token>
{
  "badge_id": 5
}
```

### 6. Submeter Evidência
```bash
POST /api/applications/{application_guid}/evidences
Authorization: Bearer <access_token>
{
  "requirement_id": 12,
  "evidence_title": "Projeto GitHub",
  "evidence_description": "https://github.com/usuario/projeto",
  "evidence_link": "https://github.com/usuario/projeto"
}
```

### 7. Submeter Candidatura
```bash
POST /api/applications/{application_guid}/submit
Authorization: Bearer <access_token>
```

### 8. Ver Estatísticas (NOVO)
```bash
GET /api/gamification/consultant-stats
Authorization: Bearer <access_token>
```

### 9. Ver Badges Conquistadas (NOVO)
```bash
GET /api/gamification/earned-badges?page=1&limit=10
Authorization: Bearer <access_token>
```

### 10. Ver Ranking
```bash
GET /api/ranking?page=1&limit=20
```

## Testes Recomendados

### Teste Manual 1: Atualizar Perfil Completo
```bash
curl -X PUT http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "João Silva Santos",
    "phone_number": "+351987654321",
    "biography": "Desenvolvedor fullstack com foco em Node.js e React"
  }'
```

**Resultado esperado:** Status 200 com código `AUTH_PROFILE_UPDATED`

### Teste Manual 2: Validar Location Inválida
```bash
curl -X PUT http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "location_id": 9999
  }'
```

**Resultado esperado:** Status 400 com código `AUTH_INVALID_LOCATION`

### Teste Manual 3: Obter Estatísticas
```bash
curl -X GET http://localhost:3000/api/gamification/consultant-stats \
  -H "Authorization: Bearer <consultant_token>"
```

**Resultado esperado:** Status 200 com dashboard completo

### Teste Manual 4: Obter Badges Conquistadas
```bash
curl -X GET "http://localhost:3000/api/gamification/earned-badges?page=1&limit=5" \
  -H "Authorization: Bearer <consultant_token>"
```

**Resultado esperado:** Status 200 com lista paginada de badges

### Teste Manual 5: Acesso Negado para Non-Consultants
```bash
curl -X GET http://localhost:3000/api/gamification/consultant-stats \
  -H "Authorization: Bearer <talent_manager_token>"
```

**Resultado esperado:** Status 403 com código `APP_ACCESS_DENIED_OWN`

## Validações Implementadas

### PUT /api/auth/me
- **full_name:** 2-255 caracteres, sem HTML/scripts
- **phone_number:** Formato internacional (+351XXXXXXXXX)
- **birthdate:** Data válida, idade ≥ 16 anos
- **profile_img_url:** URL válida, deve estar em temporary storage
- **preferred_lang_id:** ID positivo, deve existir na BD
- **location_id:** ID positivo, deve existir na BD
- **biography:** Max 5000 caracteres, max 500 palavras, sem profanidade

### GET /api/gamification/consultant-stats
- Apenas Consultants autenticados
- Consultant deve existir na BD

### GET /api/gamification/earned-badges
- Apenas Consultants autenticados
- `page` e `limit` devem ser inteiros positivos
- Default: page=1, limit=10

## Códigos de Erro Novos

| Código | Status HTTP | Descrição |
|--------|------------|-----------|
| `AUTH_PROFILE_UPDATED` | 200 | Perfil atualizado com sucesso |
| `AUTH_PROFILE_UPDATE_FAILED` | 500 | Erro ao atualizar perfil |
| `AUTH_INVALID_LOCATION` | 400 | ID de location inválido |
| `AUTH_INVALID_LANGUAGE` | 400 | ID de linguagem inválido |
| `AUTH_INVALID_PROFILE_IMAGE` | 400 | URL de imagem inválida |
| `GAMIFICATION_STATS_RETRIEVED` | 200 | Estatísticas obtidas |
| `GAMIFICATION_STATS_FETCH_FAILED` | 500 | Erro ao obter estatísticas |
| `GAMIFICATION_EARNED_BADGES_RETRIEVED` | 200 | Badges obtidas |
| `GAMIFICATION_EARNED_BADGES_FETCH_FAILED` | 500 | Erro ao obter badges |
| `GAMIFICATION_CONSULTANT_NOT_FOUND` | 404 | Consultant não existe |
| `GAMIFICATION_NO_ACHIEVEMENTS` | 200 | Sem badges conquistadas |

## Melhorias Futuras

1. **Perfil Público** - Endpoint para ver perfil de outro consultor
2. **Histórico de Progresso** - Rastreamento de evolução em áreas específicas
3. **Certificados** - Download de certificados de badges conquistadas
4. **Filtros de Estatísticas** - Por período, por área, etc.
5. **Badges em Andamento Detalhado** - Mostrar percentagem de conclusão das candidaturas

## Notas Importantes

- ✅ Todas as funcionalidades mantêm coerência com o padrão de resposta existente
- ✅ Sistema de cache Redis é utilizado e invalidado apropriadamente
- ✅ Transações SQL garantem consistência dos dados
- ✅ Logging detalhado em todos os endpoints novos
- ✅ Validação com Zod em todas as entradas
- ✅ Permissões e autenticação corretamente implementadas
