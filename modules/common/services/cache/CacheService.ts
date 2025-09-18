/**
 * Cache Service - Sistema de Cache Inteligente
 *
 * Implementa cache em memória com TTL, invalidação inteligente
 * e estratégias de cache para diferentes tipos de dados.
 */

export interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
  lastAccessed: number;
}

export interface CacheConfig {
  defaultTtl: number;
  maxSize: number;
  cleanupInterval: number;
}

export class CacheService {
  private cache = new Map<string, CacheEntry<unknown>>();
  private config: CacheConfig;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTtl: 300000, // 5 minutos
      maxSize: 1000,
      cleanupInterval: 60000, // 1 minuto
      ...config,
    };

    this.startCleanupTimer();
  }

  /**
   * Armazena um valor no cache
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTtl,
      hits: 0,
      lastAccessed: Date.now(),
    };

    // Remove entrada antiga se existir
    this.cache.delete(key);

    // Verifica limite de tamanho
    if (this.cache.size >= this.config.maxSize) {
      this.evictLeastRecentlyUsed();
    }

    this.cache.set(key, entry);
  }

  /**
   * Recupera um valor do cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    // Verifica se expirou
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }

    // Atualiza estatísticas
    entry.hits++;
    entry.lastAccessed = Date.now();

    return entry.data;
  }

  /**
   * Remove uma entrada do cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Remove todas as entradas que contenham a chave parcial
   */
  deleteByPattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Invalida cache de serviços de um parceiro específico
   */
  invalidatePartnerServices(partnerId: string): void {
    this.deleteByPattern(`partner:${partnerId}:services`);
  }

  /**
   * Invalida cache de serviço específico
   */
  invalidateService(serviceId: string): void {
    this.deleteByPattern(`service:${serviceId}`);
  }

  /**
   * Invalida cache de contagem de serviços ativos
   */
  invalidateActiveServicesCount(partnerId: string): void {
    this.deleteByPattern(`partner:${partnerId}:active:count`);
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Obtém estatísticas do cache
   */
  getStats() {
    const entries = Array.from(this.cache.values());
    const totalHits = entries.reduce((sum, entry) => sum + entry.hits, 0);
    const expiredCount = entries.filter(entry => this.isExpired(entry)).length;

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      totalHits,
      expiredCount,
      hitRate: this.cache.size > 0 ? totalHits / this.cache.size : 0,
      utilization: (this.cache.size / this.config.maxSize) * 100,
    };
  }

  /**
   * Verifica se uma entrada expirou
   */
  private isExpired(entry: CacheEntry<unknown>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Remove a entrada menos recentemente usada (LRU)
   */
  private evictLeastRecentlyUsed(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Inicia o timer de limpeza automática
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredEntries();
    }, this.config.cleanupInterval);
  }

  /**
   * Remove entradas expiradas
   */
  private cleanupExpiredEntries(): void {
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
  }

  /**
   * Para o timer de limpeza (para testes)
   */
  stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }
}

// Instância singleton do serviço de cache
let cacheInstance: CacheService | null = null;

export function getCacheService(): CacheService {
  if (!cacheInstance) {
    cacheInstance = new CacheService({
      defaultTtl: 300000, // 5 minutos
      maxSize: 1000,
      cleanupInterval: 60000, // 1 minuto
    });
  }
  return cacheInstance;
}

// Chaves de cache padronizadas
export const CACHE_KEYS = {
  // Serviços por parceiro
  partnerServices: (partnerId: string, page: number, limit: number, nameFilter?: string) =>
    `partner:${partnerId}:services:page${page}:limit${limit}${nameFilter ? `:filter${nameFilter}` : ''}`,

  // Serviço específico
  service: (serviceId: string) => `service:${serviceId}`,

  // Pesquisa de serviços por nome
  searchServices: (name: string, partnerId?: string) =>
    `search:services:name${name}${partnerId ? `:partner${partnerId}` : ''}`,

  // Serviços por faixa de preço
  priceRangeServices: (minPrice: number, maxPrice: number, partnerId?: string) =>
    `search:services:price${minPrice}-${maxPrice}${partnerId ? `:partner${partnerId}` : ''}`,

  // Contagem de serviços ativos
  activeServicesCount: (partnerId: string) => `partner:${partnerId}:active:count`,

  // Estatísticas do parceiro
  partnerStats: (partnerId: string) => `partner:${partnerId}:stats`,

  // Categorias de serviço
  serviceCategories: () => 'service:categories',

  // Configurações globais
  globalConfig: (key: string) => `global:config:${key}`,
} as const;
