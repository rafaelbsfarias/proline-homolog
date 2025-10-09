# Plano de Refatoração - Contexto do Parceiro

**Data:** 2025-10-09  
**Branch Base:** `aprovacao-orcamento-pelo-admin`  
**Objetivo:** Refatorar contexto do parceiro seguindo princípios DRY, SOLID e Arquitetura Modular

---

## 🎯 Estratégia Geral

### Abordagem: Refatoração Gradual e Segura

1. **Não quebrar produção** - Manter retrocompatibilidade
2. **Testar incrementalmente** - Cada mudança deve ser testável
3. **Commits atômicos** - Cada commit deve ser independente
4. **Documentar mudanças** - Atualizar documentação conforme avançamos

### Fases do Plano

- **Fase 1:** Correções Críticas de Segurança (P0)
- **Fase 2:** Padronização de Infraestrutura (P1)
- **Fase 3:** Refatoração de Arquitetura (P2)
- **Fase 4:** Melhorias de Qualidade (P3)

---

## 📅 Fase 1: Correções Críticas de Segurança (P0)

**Duração Estimada:** 2-3 horas  
**Branch:** `refactor/partner-security-fixes`

### 1.1 Adicionar Autenticação em Endpoints Desprotegidos

**Arquivos Afetados:**
- ❌ `app/api/partner/checklist/load/route.ts`
- ❌ `app/api/partner/checklist/load-anomalies/route.ts`
- ❌ `app/api/partner/checklist/exists/route.ts`
- ❌ `app/api/partner/get-vehicle-from-inspection/route.ts`

**Ações:**
```typescript
// ANTES
export async function POST(request: Request) {
  const body = await request.json();
  // ... lógica sem autenticação
}

// DEPOIS
import { withPartnerAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';

async function loadChecklistHandler(req: AuthenticatedRequest) {
  const body = await req.json();
  // ... lógica com req.user.id disponível
}

export const POST = withPartnerAuth(loadChecklistHandler);
```

**Checklist:**
- [ ] Adicionar `withPartnerAuth` em `checklist/load/route.ts`
- [ ] Adicionar `withPartnerAuth` em `checklist/load-anomalies/route.ts`
- [ ] Adicionar `withPartnerAuth` em `checklist/exists/route.ts`
- [ ] Adicionar `withPartnerAuth` em `get-vehicle-from-inspection/route.ts`
- [ ] Testar cada endpoint com token válido
- [ ] Testar cada endpoint sem token (deve retornar 401)
- [ ] Atualizar testes automatizados

---

### 1.2 Remover Hardcoded Credentials

**Arquivo Crítico:**
- 🔴 `app/api/partner/checklist/exists/route.ts`

**Código Problemático:**
```typescript
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

**Correção:**
```typescript
import { SupabaseService } from '@/modules/common/services/SupabaseService';

const supabase = SupabaseService.getInstance().getAdminClient();
```

**Checklist:**
- [ ] Substituir `createClient` direto por `SupabaseService`
- [ ] Remover imports de `@supabase/supabase-js`
- [ ] Verificar se não há outras instâncias hardcoded
- [ ] Testar funcionalidade

---

### 1.3 Adicionar Validação Básica com Zod

**Criar Schemas de Validação:**

```typescript
// app/api/partner/checklist/lib/schemas.ts
import { z } from 'zod';

export const LoadChecklistSchema = z.object({
  inspection_id: z.string().uuid('inspection_id inválido'),
  vehicle_id: z.string().uuid('vehicle_id inválido'),
});

export const SaveAnomaliesSchema = z.object({
  inspection_id: z.string().uuid('inspection_id inválido'),
  vehicle_id: z.string().uuid('vehicle_id inválido'),
  anomalies: z.array(z.object({
    description: z.string().min(1, 'Descrição é obrigatória'),
    photos: z.array(z.string()).optional(),
  })),
});

export const ExistsChecklistSchema = z.object({
  quoteId: z.string().uuid('quoteId inválido'),
});
```

**Aplicar nos Endpoints:**
```typescript
// Exemplo: checklist/load/route.ts
import { LoadChecklistSchema } from '../lib/schemas';

async function loadChecklistHandler(req: AuthenticatedRequest) {
  const body = await req.json();
  
  // Validação
  const validation = LoadChecklistSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { success: false, errors: validation.error.errors },
      { status: 400 }
    );
  }
  
  const { inspection_id, vehicle_id } = validation.data;
  // ... resto da lógica
}
```

**Checklist:**
- [ ] Criar pasta `app/api/partner/checklist/lib/`
- [ ] Criar arquivo `schemas.ts` com todos os schemas
- [ ] Aplicar validação em `load/route.ts`
- [ ] Aplicar validação em `load-anomalies/route.ts`
- [ ] Aplicar validação em `exists/route.ts`
- [ ] Aplicar validação em `save-anomalies/route.ts`
- [ ] Testar com dados inválidos
- [ ] Testar com dados válidos

---

## 📅 Fase 2: Padronização de Infraestrutura (P1)

**Duração Estimada:** 4-6 horas  
**Branch:** `refactor/partner-standardization`

### 2.1 Padronizar Cliente Supabase

**Objetivo:** Usar APENAS `SupabaseService` em todos os endpoints

**Arquivos para Modificar:**
- `checklist/save-anomalies/route.ts`
- `checklist/upload-evidence/route.ts`
- `checklist/load/route.ts`
- `checklist/submit/route.ts`
- `checklist/init/route.ts`
- `quotes/send-to-admin/route.ts`

**Padrão de Substituição:**
```typescript
// REMOVER
import { createApiClient } from '@/lib/supabase/api';
const supabase = createApiClient();

// ADICIONAR
import { SupabaseService } from '@/modules/common/services/SupabaseService';
const supabase = SupabaseService.getInstance().getAdminClient();
```

**Checklist:**
- [ ] Criar script de busca e substituição
- [ ] Executar substituição em cada arquivo
- [ ] Remover imports não utilizados
- [ ] Testar cada endpoint modificado
- [ ] Verificar se não quebrou nenhum teste
- [ ] Commit: "refactor(partner): padroniza uso de SupabaseService"

---

### 2.2 Remover Autenticação Manual

**Objetivo:** Usar APENAS `withPartnerAuth` middleware

**Arquivos para Modificar:**
- `checklist/save-anomalies/route.ts` (linhas 64-82)
- `checklist/upload-evidence/route.ts` (linhas 23-25)
- `checklist/submit/route.ts` (linhas 212-228)

**Padrão de Refatoração:**

**ANTES:**
```typescript
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring('Bearer '.length)
    : undefined;

  let partnerId: string | undefined;
  if (token) {
    const { data: userData } = await supabase.auth.getUser(token);
    partnerId = userData.user?.id;
  }
  if (!partnerId) {
    return NextResponse.json(
      { success: false, error: 'Usuário não autenticado' },
      { status: 401 }
    );
  }
  
  // ... resto da lógica usando partnerId
}
```

**DEPOIS:**
```typescript
import { withPartnerAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';

async function handler(req: AuthenticatedRequest) {
  const partnerId = req.user.id; // Disponível diretamente
  
  // ... resto da lógica
}

export const POST = withPartnerAuth(handler);
```

**Checklist:**
- [ ] Refatorar `save-anomalies/route.ts`
- [ ] Refatorar `upload-evidence/route.ts`
- [ ] Refatorar `submit/route.ts`
- [ ] Remover código de autenticação manual
- [ ] Testar autenticação com token válido
- [ ] Testar sem token (deve retornar 401)
- [ ] Commit: "refactor(partner): usa withPartnerAuth em todos endpoints"

---

### 2.3 Deprecar Endpoints v1 de Serviços

**Objetivo:** Manter apenas v2, remover v1

**Análise de Uso:**
```bash
# Buscar uso de v1 no frontend
grep -r "/api/partner/services" app/ modules/ --exclude-dir=node_modules
```

**Estratégia:**
1. Identificar todos os consumidores de v1
2. Migrar consumidores para v2
3. Adicionar deprecation notice em v1
4. Após 1 semana, remover v1

**Arquivos v1 para Remover (depois da migração):**
- `app/api/partner/services/route.ts`
- `app/api/partner/services/[serviceId]/route.ts`

**Migration Guide para Frontend:**
```typescript
// ANTES (v1)
const response = await fetch('/api/partner/services', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ name, description, price, category }),
});

// DEPOIS (v2)
const response = await fetch('/api/partner/services/v2', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ name, description, price, category }),
});
```

**Checklist:**
- [ ] Identificar todos os consumidores de v1
- [ ] Criar lista de arquivos frontend para atualizar
- [ ] Atualizar cada consumidor para v2
- [ ] Testar fluxo completo de cada feature
- [ ] Adicionar deprecation warning em v1
- [ ] Aguardar período de migração
- [ ] Remover endpoints v1
- [ ] Commit: "feat(partner): migra serviços de v1 para v2"

---

## 📅 Fase 3: Refatoração de Arquitetura (P2)

**Duração Estimada:** 10-15 horas  
**Branch:** `refactor/partner-architecture`

### 3.1 Extrair MediaUploadService

**Objetivo:** Centralizar lógica de upload de arquivos

**Estrutura:**
```
modules/partner/services/
└── MediaUploadService.ts
```

**Implementação:**
```typescript
// modules/partner/services/MediaUploadService.ts
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('partner:media-upload');

export interface UploadResult {
  success: boolean;
  storagePath?: string;
  error?: string;
}

export interface UploadOptions {
  bucket: string;
  folder: string;
  file: File;
  maxSize?: number; // em bytes
  allowedTypes?: string[];
}

export class MediaUploadService {
  private static instance: MediaUploadService;
  private supabase;

  private constructor() {
    this.supabase = SupabaseService.getInstance().getAdminClient();
  }

  static getInstance(): MediaUploadService {
    if (!this.instance) {
      this.instance = new MediaUploadService();
    }
    return this.instance;
  }

  /**
   * Gera nome único para arquivo
   */
  private generateFileName(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop();
    return `${timestamp}-${random}.${extension}`;
  }

  /**
   * Valida tipo de arquivo
   */
  private validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.some(type => file.type.includes(type));
  }

  /**
   * Faz upload de arquivo único
   */
  async uploadFile(options: UploadOptions): Promise<UploadResult> {
    try {
      const { bucket, folder, file, maxSize = 5 * 1024 * 1024, allowedTypes = ['image/'] } = options;

      // Validações
      if (maxSize && file.size > maxSize) {
        return {
          success: false,
          error: `Arquivo muito grande. Máximo: ${maxSize / 1024 / 1024}MB`,
        };
      }

      if (!this.validateFileType(file, allowedTypes)) {
        return {
          success: false,
          error: `Tipo de arquivo não permitido. Permitidos: ${allowedTypes.join(', ')}`,
        };
      }

      // Upload
      const fileName = this.generateFileName(file.name);
      const filePath = `${folder}/${fileName}`;

      const { error } = await this.supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        logger.error('upload_error', { error: error.message, filePath });
        return {
          success: false,
          error: 'Erro ao fazer upload do arquivo',
        };
      }

      return {
        success: true,
        storagePath: filePath,
      };
    } catch (error) {
      logger.error('upload_exception', { error: String(error) });
      return {
        success: false,
        error: 'Erro interno ao fazer upload',
      };
    }
  }

  /**
   * Faz upload de múltiplos arquivos
   */
  async uploadMultiple(
    files: File[],
    bucket: string,
    folder: string
  ): Promise<UploadResult[]> {
    const promises = files.map(file =>
      this.uploadFile({ bucket, folder, file })
    );
    return Promise.all(promises);
  }

  /**
   * Gera URL assinada para visualização
   */
  async getSignedUrl(bucket: string, path: string, expiresIn: number = 3600): Promise<string | null> {
    try {
      const { data } = await this.supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);
      
      return data?.signedUrl || null;
    } catch (error) {
      logger.error('signed_url_error', { error: String(error), path });
      return null;
    }
  }

  /**
   * Remove arquivo
   */
  async deleteFile(bucket: string, path: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.storage
        .from(bucket)
        .remove([path]);
      
      if (error) {
        logger.error('delete_error', { error: error.message, path });
        return false;
      }
      
      return true;
    } catch (error) {
      logger.error('delete_exception', { error: String(error), path });
      return false;
    }
  }
}
```

**Uso nos Endpoints:**
```typescript
// save-anomalies/route.ts (DEPOIS)
import { MediaUploadService } from '@/modules/partner/services/MediaUploadService';

const mediaService = MediaUploadService.getInstance();

for (let j = 0; j < photos.length; j++) {
  const photoKey = `anomaly-${i}-photo-${j}`;
  const photoFile = formData.get(photoKey) as File;

  if (photoFile instanceof File) {
    const result = await mediaService.uploadFile({
      bucket: 'vehicle-media',
      folder: `anomalies/${inspection_id}/${vehicle_id}`,
      file: photoFile,
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/'],
    });

    if (result.success) {
      uploadedPhotoUrls.push(result.storagePath!);
    }
  }
}
```

**Checklist:**
- [ ] Criar `MediaUploadService.ts`
- [ ] Implementar método `uploadFile`
- [ ] Implementar método `uploadMultiple`
- [ ] Implementar método `getSignedUrl`
- [ ] Implementar método `deleteFile`
- [ ] Adicionar testes unitários
- [ ] Refatorar `save-anomalies/route.ts` para usar service
- [ ] Refatorar `upload-evidence/route.ts` para usar service
- [ ] Testar uploads
- [ ] Commit: "refactor(partner): cria MediaUploadService centralizado"

---

### 3.2 Criar Domain Layer para Checklist

**Objetivo:** Aplicar DDD ao contexto de Checklist

**Estrutura Proposta:**
```
modules/partner/domain/
└── checklist/
    ├── entities/
    │   ├── VehicleChecklist.ts
    │   ├── MechanicsChecklist.ts
    │   └── Anomaly.ts
    ├── value-objects/
    │   ├── ChecklistStatus.ts
    │   ├── FuelLevel.ts
    │   └── InspectionDate.ts
    ├── repositories/
    │   ├── IChecklistRepository.ts
    │   └── SupabaseChecklistRepository.ts
    └── application/
        └── services/
            └── ChecklistApplicationService.ts
```

**Entidade Principal:**
```typescript
// entities/VehicleChecklist.ts
export class VehicleChecklist {
  constructor(
    public readonly id: string,
    public readonly vehicleId: string,
    public readonly inspectionDate: Date,
    public readonly odometer: number,
    public readonly fuelLevel: FuelLevel,
    public readonly observations: string | null,
    public readonly status: ChecklistStatus,
    public readonly finalized: boolean,
    public readonly services: InspectionService[],
    public readonly media: InspectionMedia[],
  ) {}

  /**
   * Valida se checklist pode ser finalizado
   */
  canBeFinalized(): boolean {
    return (
      !this.finalized &&
      this.odometer > 0 &&
      this.inspectionDate <= new Date()
    );
  }

  /**
   * Finaliza checklist
   */
  finalize(): VehicleChecklist {
    if (!this.canBeFinalized()) {
      throw new Error('Checklist não pode ser finalizado');
    }

    return new VehicleChecklist(
      this.id,
      this.vehicleId,
      this.inspectionDate,
      this.odometer,
      this.fuelLevel,
      this.observations,
      ChecklistStatus.FINALIZED,
      true,
      this.services,
      this.media,
    );
  }

  /**
   * Adiciona serviço
   */
  addService(service: InspectionService): VehicleChecklist {
    if (this.finalized) {
      throw new Error('Não é possível adicionar serviço em checklist finalizado');
    }

    return new VehicleChecklist(
      this.id,
      this.vehicleId,
      this.inspectionDate,
      this.odometer,
      this.fuelLevel,
      this.observations,
      this.status,
      this.finalized,
      [...this.services, service],
      this.media,
    );
  }
}
```

**Repository Interface:**
```typescript
// repositories/IChecklistRepository.ts
export interface IChecklistRepository {
  findById(id: string): Promise<VehicleChecklist | null>;
  findByVehicleId(vehicleId: string): Promise<VehicleChecklist[]>;
  findActiveByVehicleId(vehicleId: string): Promise<VehicleChecklist | null>;
  save(checklist: VehicleChecklist): Promise<VehicleChecklist>;
  update(checklist: VehicleChecklist): Promise<VehicleChecklist>;
  delete(id: string): Promise<void>;
}
```

**Application Service:**
```typescript
// application/services/ChecklistApplicationService.ts
export class ChecklistApplicationService {
  constructor(
    private readonly repository: IChecklistRepository,
    private readonly mediaService: MediaUploadService,
  ) {}

  async createChecklist(command: CreateChecklistCommand): Promise<Result<VehicleChecklist>> {
    try {
      // Validações
      if (command.odometer <= 0) {
        return Result.failure('Quilometragem inválida');
      }

      // Criar entidade
      const checklist = new VehicleChecklist(
        generateId(),
        command.vehicleId,
        command.inspectionDate,
        command.odometer,
        command.fuelLevel,
        command.observations,
        ChecklistStatus.DRAFT,
        false,
        [],
        [],
      );

      // Persistir
      const saved = await this.repository.save(checklist);

      return Result.success(saved);
    } catch (error) {
      return Result.failure('Erro ao criar checklist');
    }
  }

  async finalizeChecklist(id: string): Promise<Result<VehicleChecklist>> {
    // Buscar checklist
    const checklist = await this.repository.findById(id);
    if (!checklist) {
      return Result.failure('Checklist não encontrado');
    }

    // Finalizar (lógica de domínio)
    const finalized = checklist.finalize();

    // Persistir
    const updated = await this.repository.update(finalized);

    return Result.success(updated);
  }
}
```

**Checklist:**
- [ ] Criar estrutura de pastas
- [ ] Implementar Value Objects
- [ ] Implementar Entidades
- [ ] Implementar Repository Interface
- [ ] Implementar Supabase Repository
- [ ] Implementar Application Service
- [ ] Criar testes unitários para entidades
- [ ] Criar testes de integração para repository
- [ ] Commit: "feat(partner): adiciona domain layer para checklist"

---

### 3.3 Unificar Endpoints de Checklist

**Objetivo:** Consolidar lógica dispersa em um único Application Service

**Endpoints Atuais:**
1. `/api/partner/save-vehicle-checklist` - Checklist inicial
2. `/api/partner/checklist/submit` - Checklist mecânico
3. `/api/partner/checklist/save-anomalies` - Anomalias

**Nova Estrutura Proposta:**
```
/api/partner/checklist/
├── [id]/
│   ├── route.ts (GET, PUT, DELETE)
│   ├── finalize/route.ts (POST)
│   └── anomalies/route.ts (GET, POST)
├── route.ts (GET list, POST create)
├── mechanics/[id]/route.ts (GET, PUT)
└── upload/route.ts (POST para upload de mídia)
```

**Migração Gradual:**
```typescript
// Novo endpoint unificado: /api/partner/checklist/route.ts
import { withPartnerAuth } from '@/modules/common/utils/authMiddleware';
import { ChecklistApplicationService } from '@/modules/partner/domain/checklist/application/services/ChecklistApplicationService';

const service = new ChecklistApplicationService(/*...*/);

// GET /api/partner/checklist - Lista checklists
async function getChecklists(req: AuthenticatedRequest) {
  const { vehicleId } = req.query;
  
  if (vehicleId) {
    const result = await service.getChecklistsByVehicle(vehicleId);
    return mapToResponse(result);
  }
  
  const result = await service.getChecklistsByPartner(req.user.id);
  return mapToResponse(result);
}

// POST /api/partner/checklist - Cria checklist
async function createChecklist(req: AuthenticatedRequest) {
  const dto = await req.json();
  const command = mapToCreateCommand(dto, req.user.id);
  const result = await service.createChecklist(command);
  return mapToResponse(result);
}

export const GET = withPartnerAuth(getChecklists);
export const POST = withPartnerAuth(createChecklist);
```

**Checklist:**
- [ ] Criar novos endpoints unificados
- [ ] Implementar GET list
- [ ] Implementar POST create
- [ ] Implementar GET by id
- [ ] Implementar PUT update
- [ ] Implementar DELETE
- [ ] Implementar POST finalize
- [ ] Implementar anomalies endpoints
- [ ] Manter endpoints antigos com deprecation notice
- [ ] Atualizar frontend para usar novos endpoints
- [ ] Testar todas as funcionalidades
- [ ] Remover endpoints antigos após migração
- [ ] Commit: "refactor(partner): unifica endpoints de checklist"

---

## 📅 Fase 4: Melhorias de Qualidade (P3)

**Duração Estimada:** 6-8 horas  
**Branch:** `refactor/partner-quality`

### 4.1 Criar Schemas Zod Completos

**Objetivo:** Validação robusta em todos os endpoints

**Estrutura:**
```
app/api/partner/
├── checklist/
│   └── lib/
│       └── schemas.ts
├── budgets/
│   └── lib/
│       └── schemas.ts
└── services/
    └── v2/
        └── lib/
            └── schemas.ts (já existe)
```

**Exemplo de Schema Completo:**
```typescript
// checklist/lib/schemas.ts
import { z } from 'zod';

export const FuelLevelSchema = z.enum([
  'empty',
  'quarter',
  'half',
  'three_quarters',
  'full',
]);

export const CreateChecklistSchema = z.object({
  vehicleId: z.string().uuid('ID do veículo inválido'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (use YYYY-MM-DD)'),
  odometer: z.number().int().positive('Quilometragem deve ser positiva'),
  fuelLevel: FuelLevelSchema,
  observations: z.string().max(1000, 'Observações muito longas').optional(),
  services: z.object({
    mechanics: z.object({
      required: z.boolean().optional(),
      notes: z.string().max(500).optional(),
    }).optional(),
    bodyPaint: z.object({
      required: z.boolean().optional(),
      notes: z.string().max(500).optional(),
    }).optional(),
    // ... outros serviços
  }).optional(),
});

export const UpdateChecklistSchema = CreateChecklistSchema.partial().extend({
  id: z.string().uuid(),
});

export const FinalizeChecklistSchema = z.object({
  id: z.string().uuid(),
});
```

**Checklist:**
- [ ] Criar schemas para Checklist
- [ ] Criar schemas para Budgets
- [ ] Criar schemas para Anomalias
- [ ] Aplicar validação em todos os endpoints
- [ ] Adicionar mensagens de erro amigáveis
- [ ] Testar com dados inválidos
- [ ] Commit: "feat(partner): adiciona validação Zod completa"

---

### 4.2 Melhorar Tratamento de Erros

**Objetivo:** Erros consistentes e informativos

**Hierarquia de Exceções:**
```typescript
// modules/common/errors/index.ts
export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly code: string,
    public readonly statusCode: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Não autenticado') {
    super(message, 'AUTHENTICATION_ERROR', 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Sem permissão') {
    super(message, 'AUTHORIZATION_ERROR', 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} não encontrado`, 'NOT_FOUND', 404);
  }
}

export class BusinessRuleError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'BUSINESS_RULE_ERROR', 422, details);
  }
}

export class InfrastructureError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'INFRASTRUCTURE_ERROR', 500, details);
  }
}
```

**Error Handler Centralizado:**
```typescript
// modules/common/utils/errorHandler.ts
import { NextResponse } from 'next/server';
import { AppError } from '../errors';
import { getLogger } from '@/modules/logger';

const logger = getLogger('error-handler');

export function handleError(error: unknown): NextResponse {
  // AppError customizado
  if (error instanceof AppError) {
    logger.warn('app_error', {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.statusCode }
    );
  }

  // Erro desconhecido
  logger.error('unhandled_error', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });

  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro interno do servidor',
      },
    },
    { status: 500 }
  );
}
```

**Uso nos Endpoints:**
```typescript
import { handleError } from '@/modules/common/utils/errorHandler';
import { NotFoundError, ValidationError } from '@/modules/common/errors';

async function handler(req: AuthenticatedRequest) {
  try {
    const checklist = await repository.findById(id);
    
    if (!checklist) {
      throw new NotFoundError('Checklist');
    }
    
    if (!checklist.canBeFinalized()) {
      throw new BusinessRuleError('Checklist não pode ser finalizado');
    }
    
    // ... lógica
    
    return NextResponse.json({ success: true, data: checklist });
  } catch (error) {
    return handleError(error);
  }
}
```

**Checklist:**
- [ ] Criar hierarquia de exceções
- [ ] Criar error handler centralizado
- [ ] Refatorar todos os endpoints para usar exceções customizadas
- [ ] Remover try-catch genéricos
- [ ] Adicionar logs estruturados
- [ ] Testar diferentes tipos de erro
- [ ] Commit: "refactor(partner): melhora tratamento de erros"

---

### 4.3 Refatorar Funções Longas

**Objetivo:** Funções menores, mais legíveis e testáveis

**Princípios:**
- Máximo 20 linhas por função
- Máximo 3 níveis de indentação
- Uma responsabilidade por função

**Exemplo: Refatorar `checklist/submit/route.ts` (344 linhas)**

**ANTES:**
```typescript
export async function PUT(request: Request) {
  try {
    const checklistData = await request.json();
    
    // 50 linhas de validação
    // 100 linhas de mapeamento
    // 50 linhas de persistência
    // 50 linhas de lógica adicional
    
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Erro' }, { status: 500 });
  }
}
```

**DEPOIS:**
```typescript
// Quebrar em funções menores
async function validateChecklistData(data: unknown): ChecklistData {
  // validação
}

async function mapChecklistToEntities(data: ChecklistData): MechanicsChecklist {
  // mapeamento
}

async function persistChecklist(checklist: MechanicsChecklist): void {
  // persistência
}

async function recordChecklistHistory(checklistId: string): void {
  // histórico
}

// Handler principal fica pequeno
async function submitChecklistHandler(req: AuthenticatedRequest) {
  try {
    const data = await validateChecklistData(await req.json());
    const checklist = await mapChecklistToEntities(data);
    await persistChecklist(checklist);
    await recordChecklistHistory(checklist.id);
    
    return NextResponse.json({ success: true, data: checklist });
  } catch (error) {
    return handleError(error);
  }
}
```

**Arquivos Prioritários:**
- `checklist/submit/route.ts` (344 linhas)
- `save-vehicle-checklist/route.ts` (292 linhas)
- `save-anomalies/route.ts` (244 linhas)
- `budgets/[budgetId]/route.ts`

**Checklist:**
- [ ] Identificar funções com mais de 50 linhas
- [ ] Quebrar em funções menores
- [ ] Extrair lógica de negócio para services
- [ ] Adicionar testes unitários
- [ ] Verificar legibilidade
- [ ] Commit: "refactor(partner): quebra funções longas"

---

## 📊 Métricas de Sucesso

### Antes da Refatoração
- 🔴 **19 endpoints** com padrões inconsistentes
- 🔴 **6 endpoints** sem autenticação adequada
- 🔴 **3 formas diferentes** de criar cliente Supabase
- 🔴 **Autenticação manual** duplicada em 6+ arquivos
- 🔴 **Lógica de upload** duplicada em 2 arquivos
- 🔴 **Sem Domain Layer** (exceto v2 services)
- 🔴 **Funções grandes** (100-344 linhas)

### Depois da Refatoração
- ✅ **19 endpoints** com padrão único
- ✅ **Todos endpoints** protegidos com `withPartnerAuth`
- ✅ **Uma forma** de criar cliente (`SupabaseService`)
- ✅ **Zero duplicação** de autenticação
- ✅ **MediaUploadService** centralizado
- ✅ **Domain Layer completo** para Checklist
- ✅ **Funções pequenas** (< 30 linhas)
- ✅ **Validação Zod** em todos os endpoints
- ✅ **Error handling** consistente

---

## 🚀 Como Executar

### Pré-requisitos
- Branch limpa (commit ou stash de mudanças pendentes)
- Testes passando na branch atual
- Backup do banco de dados

### Executar Fase 1 (Segurança)
```bash
# Criar branch
git checkout -b refactor/partner-security-fixes

# Fazer mudanças...

# Testar
npm run test:partner

# Commit
git add .
git commit -m "fix(partner): adiciona autenticação em endpoints desprotegidos"

# Push
git push origin refactor/partner-security-fixes

# Criar PR
```

### Executar Fase 2 (Padronização)
```bash
# Criar branch
git checkout -b refactor/partner-standardization

# ... repetir processo
```

---

## 📝 Notas Importantes

### Retrocompatibilidade
- **Manter endpoints antigos** durante migração
- **Adicionar deprecation notice** antes de remover
- **Período de transição:** mínimo 1 semana
- **Comunicar mudanças** ao time

### Testes
- **Testar cada mudança** antes de commit
- **Manter coverage** acima de 80%
- **Adicionar testes de integração** para novos services
- **Não quebrar testes existentes**

### Documentação
- **Atualizar docs** conforme mudanças
- **Documentar breaking changes**
- **Criar migration guides**
- **Atualizar README**

---

## 🔗 Documentos Relacionados

- [01-ANALYSIS.md](./01-ANALYSIS.md) - Análise completa de inconsistências
- [03-MIGRATION-GUIDE.md](./03-MIGRATION-GUIDE.md) - Guia de migração para frontend
- [04-TESTING-PLAN.md](./04-TESTING-PLAN.md) - Plano de testes
