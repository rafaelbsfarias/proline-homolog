/**
 * Container de Injeção de Dependência
 * Implementa o padrão Dependency Injection Container
 * Centraliza a criação e gerenciamento de dependências
 */

type Constructor<T = {}> = new (...args: unknown[]) => T;
type ServiceFactory<T> = () => T;

export class DIContainer {
  private static instance: DIContainer;
  private services = new Map<string, unknown>();
  private factories = new Map<string, ServiceFactory<unknown>>();
  private singletons = new Map<string, unknown>();

  private constructor() {}

  public static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  /**
   * Registra um serviço singleton
   */
  public registerSingleton<T>(key: string, factory: ServiceFactory<T>): void {
    this.factories.set(key, factory);
  }

  /**
   * Registra uma instância direta
   */
  public registerInstance<T>(key: string, instance: T): void {
    this.services.set(key, instance);
  }

  /**
   * Registra uma classe
   */
  public registerClass<T>(key: string, ClassConstructor: Constructor<T>): void {
    this.factories.set(key, () => new ClassConstructor());
  }

  /**
   * Resolve uma dependência
   */
  public resolve<T>(key: string): T {
    // Verifica instância direta
    if (this.services.has(key)) {
      return this.services.get(key) as T;
    }

    // Verifica singleton já criado
    if (this.singletons.has(key)) {
      return this.singletons.get(key) as T;
    }

    // Cria singleton a partir da factory
    if (this.factories.has(key)) {
      const factory = this.factories.get(key)!;
      const instance = factory();
      this.singletons.set(key, instance);
      return instance as T;
    }

    throw new Error(`Service not found: ${key}`);
  }

  /**
   * Verifica se um serviço está registrado
   */
  public has(key: string): boolean {
    return this.services.has(key) || this.factories.has(key) || this.singletons.has(key);
  }

  /**
   * Remove um serviço
   */
  public remove(key: string): void {
    this.services.delete(key);
    this.factories.delete(key);
    this.singletons.delete(key);
  }

  /**
   * Limpa todos os serviços (útil para testes)
   */
  public clear(): void {
    this.services.clear();
    this.factories.clear();
    this.singletons.clear();
  }

  /**
   * Lista todos os serviços registrados
   */
  public getRegisteredServices(): string[] {
    const allKeys = new Set([
      ...this.services.keys(),
      ...this.factories.keys(),
      ...this.singletons.keys(),
    ]);
    return Array.from(allKeys);
  }
}
