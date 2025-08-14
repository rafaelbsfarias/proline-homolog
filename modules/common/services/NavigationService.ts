/**
 * Serviço para navegação baseada em roles
 * Implementa o padrão Early Return para reduzir aninhamento
 * Implementa Object Calisthenics - evita estruturas condicionais aninhadas
 */

import { UserRole } from '@/modules/common/domain/UserRole';

export class NavigationService {
  private static instance: NavigationService;

  private constructor() {}

  public static getInstance(): NavigationService {
    if (!NavigationService.instance) {
      NavigationService.instance = new NavigationService();
    }
    return NavigationService.instance;
  }

  /**
   * Navega para dashboard apropriado baseado no role
   * Usa Early Return para evitar aninhamento
   */
  public navigateToDashboard(userRole: string, router: any): void {
    const role = UserRole.createSafe(userRole);

    // Early return para role inválido
    if (!role) {
      router.push('/');
      return;
    }

    // Early return para admin
    if (role.isAdmin()) {
      router.push('/dashboard');
      return;
    }

    // Early return para client
    if (role.isClient()) {
      router.push('/dashboard');
      return;
    }

    // Early return para partner
    if (role.isPartner()) {
      router.push('/dashboard');
      return;
    }

    // Early return para specialist
    if (role.isSpecialist()) {
      router.push('/dashboard');
      return;
    }

    // Default fallback
    router.push('/');
  }

  /**
   * Verifica se usuário pode acessar rota
   * Usa Guard Clauses para reduzir aninhamento
   */
  public canAccessRoute(userRole: string, route: string): boolean {
    const role = UserRole.createSafe(userRole);

    // Guard clause - role inválido
    if (!role) {
      return false;
    }

    // Guard clause - rotas públicas
    if (this.isPublicRoute(route)) {
      return true;
    }

    // Guard clause - admin tem acesso a tudo
    if (role.isAdmin()) {
      return true;
    }

    // Guard clause - rotas admin apenas para admin
    if (route.startsWith('/admin')) {
      return false;
    }

    // Guard clause - dashboard para usuários autenticados
    if (route.startsWith('/dashboard')) {
      return role.canViewDashboard();
    }

    // Default - acesso negado
    return false;
  }

  /**
   * Determina redirecionamento após login
   * Usa Strategy Pattern para evitar condicionais complexas
   */
  public getPostLoginRedirect(userRole: string): string {
    const role = UserRole.createSafe(userRole);

    // Early return para role inválido
    if (!role) {
      return '/';
    }

    return role.getDashboardRoute();
  }

  /**
   * Verifica se a rota é pública
   */
  private isPublicRoute(route: string): boolean {
    const publicRoutes = ['/', '/login', '/cadastro', '/recuperar-senha', '/reset-password'];

    return publicRoutes.includes(route);
  }

  /**
   * Gera breadcrumbs para navegação
   * Usa Pipe Pattern para transformações
   */
  public generateBreadcrumbs(route: string, userRole: string): string[] {
    return route
      .split('/')
      .filter(segment => segment.length > 0)
      .map(segment => this.formatSegment(segment))
      .filter(segment => this.isValidSegment(segment, userRole));
  }

  private formatSegment(segment: string): string {
    return segment.replace(/-/g, ' ').replace(/^\w/, char => char.toUpperCase());
  }

  private isValidSegment(segment: string, userRole: string): boolean {
    const role = UserRole.createSafe(userRole);

    if (!role) {
      return false;
    }

    if (segment.toLowerCase() === 'admin') {
      return role.isAdmin();
    }

    return true;
  }
}
