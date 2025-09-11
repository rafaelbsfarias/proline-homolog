'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/modules/common/services/SupabaseAuthService';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import AdminDashboard from './AdminDashboard';
import ClientDashboard from './ClientDashboard';
import SpecialistDashboard from './SpecialistDashboard';
import PartnerDashboard from './PartnerDashboard';
import { Loading } from '@/modules/common/components/Loading/Loading';

const DashboardPage: React.FC = () => {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Exemplo: buscar perfil do usuário autenticado
    const fetchRole = async () => {
      const user = await authService.getCurrentUser();
      if (!user.data.user) {
        router.push('/');
        return;
      }
      // A role do usuário está em app_metadata.role
      const userRole = user.data.user.user_metadata?.role || null;
      setRole(userRole);
      setLoading(false);
    };
    fetchRole();
  }, [router]);

  const handleClearAuth = async () => {
    await SupabaseService.clearAllAuth();
  };

  const handleDebugAuth = () => {
    SupabaseService.debugAuth();
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loading fullScreen />
      </div>
    );
  }
  if (!role) return <div>Usuário sem role definida.</div>;

  return (
    <div>
      {(() => {
        switch (role) {
          case 'admin':
            return <AdminDashboard />;
          case 'cliente':
          case 'client':
            return <ClientDashboard />;
          case 'especialista':
          case 'specialist':
            return <SpecialistDashboard />;
          case 'parceiro':
          case 'partner':
            return <PartnerDashboard />;
          default:
            return <div>Role desconhecida: {role}</div>;
        }
      })()}
    </div>
  );
};

export default DashboardPage;
