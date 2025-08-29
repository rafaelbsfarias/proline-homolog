import { useEffect, useState } from 'react';
import {
  clientDashboardService,
  type ClientInfo,
} from '@/modules/client/services/clientDashboardService';

export interface ProfileData {
  full_name: string;
  must_change_password?: boolean;
  clients: { parqueamento?: number; taxa_operacao?: number }[];
}

export const useUserProfile = () => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const {
        data: { user },
      } = await clientDashboardService.getCurrentUser();
      if (!user) {
        if (active) setLoading(false);
        return;
      }
      if (active) setUserId(user.id);

      const [profile, client] = await Promise.all([
        clientDashboardService.getProfile(user.id),
        clientDashboardService.getClientInfo(user.id),
      ]);

      if (profile) {
        const clientObj: ClientInfo | null = client;
        const data: ProfileData = {
          full_name: profile.full_name || '',
          must_change_password: !!profile.must_change_password,
          clients: [
            {
              parqueamento: clientObj?.parqueamento,
              taxa_operacao: clientObj?.taxa_operacao,
            },
          ],
        };
        if (active) setProfileData(data);
      }
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return { profileData, userId, loading } as const;
};
