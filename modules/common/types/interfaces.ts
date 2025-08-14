// ========================================================================================
// MODULE INTERFACES - CONTRATOS ENTRE MÓDULOS
// ========================================================================================
// Seguindo Clean Architecture - Interface Segregation Principle
// ========================================================================================

import { Result } from './domain';

/**
 * Interface para Comunicação entre Módulos
 * Define contratos claros entre diferentes domínios
 */
export interface ModuleInterface {
  readonly moduleName: string;
  readonly version: string;
}

// ========================================================================================
// USER MODULE INTERFACES
// ========================================================================================

/**
 * Interface pública do módulo User
 * Expõe apenas operações necessárias para outros módulos
 */
export interface IUserModule extends ModuleInterface {
  // Autenticação
  authenticateUser(email: string, password: string): Promise<Result<UserAuth>>;
  getCurrentUser(userId: string): Promise<Result<UserInfo>>;

  // Gestão de usuários (apenas admin)
  getUserById(id: string): Promise<Result<UserInfo>>;
  getAllUsers(): Promise<Result<UserInfo[]>>;

  // Verificações
  userExists(email: string): Promise<boolean>;
  userHasPermission(userId: string, permission: string): Promise<boolean>;
  userCanAccessRoute(userId: string, route: string): Promise<boolean>;
}

export interface UserAuth {
  readonly userId: string;
  readonly email: string;
  readonly role: string;
  readonly accessToken: string;
  readonly refreshToken: string;
}

export interface UserInfo {
  readonly id: string;
  readonly email: string;
  readonly role: string;
  readonly status: string;
  readonly profile: UserProfile;
  readonly createdAt: Date;
}

interface UserProfile {
  readonly firstName: string;
  readonly lastName: string;
  readonly phone?: string;
  readonly avatar?: string;
}

// ========================================================================================
// ADMIN MODULE INTERFACES
// ========================================================================================

/**
 * Interface pública do módulo Admin
 * Expõe operações administrativas
 */
export interface IAdminModule extends ModuleInterface {
  // Gestão de usuários
  approveUserRegistration(userId: string): Promise<Result<void>>;
  suspendUser(userId: string, reason: string): Promise<Result<void>>;
  deleteUser(userId: string): Promise<Result<void>>;

  // Relatórios
  getUsersReport(): Promise<Result<UsersReport>>;
  getSystemMetrics(): Promise<Result<SystemMetrics>>;
}

export interface UsersReport {
  readonly totalUsers: number;
  readonly activeUsers: number;
  readonly pendingUsers: number;
  readonly usersByRole: Record<string, number>;
  readonly generatedAt: Date;
}

export interface SystemMetrics {
  readonly performance: PerformanceMetrics;
  readonly usage: UsageMetrics;
  readonly errors: ErrorMetrics;
}

interface PerformanceMetrics {
  readonly averageResponseTime: number;
  readonly uptime: number;
  readonly memoryUsage: number;
}

interface UsageMetrics {
  readonly dailyActiveUsers: number;
  readonly monthlyActiveUsers: number;
  readonly featuresUsage: Record<string, number>;
}

interface ErrorMetrics {
  readonly errorRate: number;
  readonly criticalErrors: number;
  readonly lastErrors: ErrorInfo[];
}

interface ErrorInfo {
  readonly message: string;
  readonly timestamp: Date;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
}

// ========================================================================================
// CLIENT MODULE INTERFACES
// ========================================================================================

/**
 * Interface pública do módulo Client
 * Expõe operações do cliente
 */
export interface IClientModule extends ModuleInterface {
  // Serviços
  requestService(
    clientId: string,
    serviceRequest: ServiceRequest
  ): Promise<Result<ServiceRequestInfo>>;
  getClientServices(clientId: string): Promise<Result<ServiceInfo[]>>;

  // Veículos
  addVehicle(clientId: string, vehicle: VehicleData): Promise<Result<VehicleInfo>>;
  getClientVehicles(clientId: string): Promise<Result<VehicleInfo[]>>;
}

export interface ServiceRequest {
  readonly serviceType: string;
  readonly vehicleId: string;
  readonly description: string;
  readonly urgency: 'low' | 'medium' | 'high';
  readonly preferredDate?: Date;
}

export interface ServiceRequestInfo {
  readonly id: string;
  readonly clientId: string;
  readonly serviceType: string;
  readonly status: string;
  readonly createdAt: Date;
  readonly estimatedCompletion?: Date;
}

export interface ServiceInfo {
  readonly id: string;
  readonly type: string;
  readonly status: string;
  readonly vehicle: VehicleInfo;
  readonly createdAt: Date;
  readonly completedAt?: Date;
}

export interface VehicleData {
  readonly make: string;
  readonly model: string;
  readonly year: number;
  readonly licensePlate: string;
  readonly color?: string;
}

export interface VehicleInfo extends VehicleData {
  readonly id: string;
  readonly clientId: string;
  readonly createdAt: Date;
}

// ========================================================================================
// PARTNER MODULE INTERFACES
// ========================================================================================

/**
 * Interface pública do módulo Partner
 * Expõe operações do parceiro/fornecedor
 */
export interface IPartnerModule extends ModuleInterface {
  // Orçamentos
  createBudget(
    partnerId: string,
    serviceRequestId: string,
    budget: BudgetData
  ): Promise<Result<BudgetInfo>>;
  getPartnerBudgets(partnerId: string): Promise<Result<BudgetInfo[]>>;

  // Serviços
  acceptService(partnerId: string, serviceId: string): Promise<Result<void>>;
  completeService(
    partnerId: string,
    serviceId: string,
    completion: ServiceCompletion
  ): Promise<Result<void>>;
}

export interface BudgetData {
  readonly items: BudgetItem[];
  readonly totalAmount: number;
  readonly validUntil: Date;
  readonly notes?: string;
}

export interface BudgetItem {
  readonly description: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly totalPrice: number;
}

export interface BudgetInfo extends BudgetData {
  readonly id: string;
  readonly partnerId: string;
  readonly serviceRequestId: string;
  readonly status: string;
  readonly createdAt: Date;
}

export interface ServiceCompletion {
  readonly completionNotes: string;
  readonly completionImages?: string[];
  readonly actualAmount?: number;
}

// ========================================================================================
// NOTIFICATION MODULE INTERFACES
// ========================================================================================

/**
 * Interface para sistema de notificações
 * Usado por todos os módulos para comunicação
 */
export interface INotificationModule extends ModuleInterface {
  sendEmail(to: string, subject: string, content: string): Promise<Result<void>>;
  sendPushNotification(userId: string, title: string, message: string): Promise<Result<void>>;
  sendSMS(phone: string, message: string): Promise<Result<void>>;
}

// ========================================================================================
// MODULE REGISTRY
// ========================================================================================

/**
 * Registry para descoberta de módulos
 * Permite comunicação loose-coupled entre módulos
 */
export interface IModuleRegistry {
  registerModule<T extends ModuleInterface>(name: string, module: T): void;
  getModule<T extends ModuleInterface>(name: string): T | null;
  getAllModules(): ModuleInterface[];
}

/**
 * Chaves dos módulos registrados
 */
export const MODULE_KEYS = {
  USER: 'user',
  ADMIN: 'admin',
  CLIENT: 'client',
  PARTNER: 'partner',
  NOTIFICATION: 'notification',
} as const;
