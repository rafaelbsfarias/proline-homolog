# PartnerService API v2 Documentation

## Visão Geral

A API v2 do PartnerService foi completamente refatorada seguindo princípios de **Domain-Driven Design (DDD)** e **Clean Architecture**. Esta versão oferece melhorias significativas em relação à v1:

- ✅ **Validação rigorosa** com Zod schemas
- ✅ **Estrutura de resposta padronizada**
- ✅ **Tratamento de erros consistente**
- ✅ **Paginação avançada** com filtros
- ✅ **Autenticação obrigatória** via JWT
- ✅ **Soft delete** para desativação de serviços

## Autenticação

Todos os endpoints requerem autenticação através do header `Authorization`:

```
Authorization: Bearer <seu-jwt-token>
```

## Endpoints

### 1. Listar Serviços
```http
GET /api/partner/services/v2?page=1&limit=20&name=filtro
```

**Parâmetros de Query:**
- `page` (opcional): Número da página (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 20, máximo: 100)
- `name` (opcional): Filtro por nome do serviço

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "services": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "partnerId": "456e7890-e89b-12d3-a456-426614174001",
        "name": "Troca de Óleo",
        "price": 89.90,
        "description": "Troca completa de óleo do motor com filtro",
        "isActive": true,
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T14:20:00Z"
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 20,
    "totalPages": 2
  }
}
```

### 2. Criar Serviço
```http
POST /api/partner/services/v2
```

**Corpo da Requisição:**
```json
{
  "name": "Troca de Óleo",
  "price": 89.90,
  "description": "Troca completa de óleo do motor com filtro"
}
```

**Resposta de Sucesso (201):**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "partnerId": "456e7890-e89b-12d3-a456-426614174001",
    "name": "Troca de Óleo",
    "price": 89.90,
    "description": "Troca completa de óleo do motor com filtro",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### 3. Buscar Serviço Específico
```http
GET /api/partner/services/v2/{serviceId}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "partnerId": "456e7890-e89b-12d3-a456-426614174001",
    "name": "Troca de Óleo",
    "price": 89.90,
    "description": "Troca completa de óleo do motor com filtro",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T14:20:00Z"
  }
}
```

### 4. Atualizar Serviço
```http
PUT /api/partner/services/v2/{serviceId}
```

**Corpo da Requisição (apenas campos a atualizar):**
```json
{
  "price": 99.90,
  "description": "Troca de óleo com produtos premium"
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "partnerId": "456e7890-e89b-12d3-a456-426614174001",
    "name": "Troca de Óleo",
    "price": 99.90,
    "description": "Troca de óleo com produtos premium",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T15:45:00Z"
  }
}
```

### 5. Desativar Serviço
```http
DELETE /api/partner/services/v2/{serviceId}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "message": "Serviço desativado com sucesso"
  }
}
```

## Tratamento de Erros

Todos os erros seguem um formato padronizado:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Mensagem descritiva do erro",
    "details": {} // Opcional - detalhes adicionais
  }
}
```

### Códigos de Erro

| Código | Status HTTP | Descrição |
|--------|-------------|-----------|
| `VALIDATION_ERROR` | 400 | Dados de entrada inválidos |
| `UNAUTHORIZED_ERROR` | 401 | Token ausente ou inválido |
| `FORBIDDEN_ERROR` | 403 | Acesso negado ao recurso |
| `NOT_FOUND_ERROR` | 404 | Recurso não encontrado |
| `CONFLICT_ERROR` | 409 | Conflito com dados existentes |
| `INTERNAL_ERROR` | 500 | Erro interno do servidor |

### Exemplos de Erros

**Erro de Validação (400):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados de entrada inválidos",
    "details": {
      "name": "Nome é obrigatório",
      "price": "Preço deve ser maior que zero"
    }
  }
}
```

**Erro de Autenticação (401):**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED_ERROR",
    "message": "Token de autenticação obrigatório"
  }
}
```

**Serviço Não Encontrado (404):**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND_ERROR",
    "message": "Serviço não encontrado"
  }
}
```

## Validações

### Criar Serviço
- `name`: obrigatório, 1-100 caracteres
- `price`: obrigatório, maior que 0, máximo 999999.99
- `description`: obrigatório, 1-500 caracteres

### Atualizar Serviço
- Todos os campos são opcionais
- Mesmas validações quando fornecidos

### Listar Serviços
- `page`: mínimo 1
- `limit`: 1-100
- `name`: 1-100 caracteres quando fornecido

## Exemplos de Uso

### JavaScript/Fetch
```javascript
// Listar serviços
const response = await fetch('/api/partner/services/v2?page=1&limit=10', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const data = await response.json();

// Criar serviço
const newService = await fetch('/api/partner/services/v2', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Revisão Completa',
    price: 299.99,
    description: 'Revisão completa com 15 itens verificados'
  })
});
```

### cURL
```bash
# Listar serviços
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     "http://localhost:3000/api/partner/services/v2?page=1&limit=10"

# Criar serviço
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Troca de Óleo",
    "price": 89.90,
    "description": "Troca completa de óleo do motor"
  }' \
  http://localhost:3000/api/partner/services/v2
```

## Migração da v1 para v2

### Diferenças Principais
1. **Estrutura de Resposta**: Respostas sempre incluem `success` boolean
2. **Códigos de Erro**: Sistema de códigos padronizado
3. **Validação**: Mais rigorosa e específica
4. **Paginação**: Sempre retorna metadados completos
5. **Autenticação**: Obrigatória em todos os endpoints

### Plano de Migração
1. **Fase 1**: Manter v1 ativa, implementar v2 em paralelo
2. **Fase 2**: Migrar consumidores gradualmente para v2
3. **Fase 3**: Depreciar v1 após período de transição
4. **Fase 4**: Remover v1 completamente

### Compatibilidade
- A v2 **não é compatível** com v1
- Todos os consumidores devem ser atualizados
- Documentação completa disponível em `/docs/api/partner-services-v2-openapi.yaml`

## Monitoramento e Logs

### Logs Estruturados
Todos os endpoints geram logs estruturados incluindo:
- Timestamp da requisição
- ID do usuário/parceiro
- Endpoint acessado
- Status da resposta
- Tempo de processamento

### Métricas Disponíveis
- Taxa de sucesso por endpoint
- Tempo médio de resposta
- Número de erros por tipo
- Uso de paginação e filtros

## Suporte

Para dúvidas ou problemas:
- 📧 **Email**: dev@proline.com.br
- 📚 **Documentação Técnica**: Consulte os arquivos na pasta `/docs`
- 🐛 **Issues**: Abra uma issue no repositório do projeto

---

**Última atualização**: Janeiro 2025
**Versão da API**: v2.0.0
