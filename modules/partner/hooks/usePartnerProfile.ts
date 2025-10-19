import { useEffect, useState } from 'react';
import { supabase } from '@/modules/common/services/supabaseClient';

export interface PartnerProfileData {
  full_name: string;
  must_change_password?: boolean;
}

export const usePartnerProfile = () => {
  const [profileData, setProfileData] = useState<PartnerProfileData | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (active) setLoading(false);
        return;
      }
      if (active) setUserId(user.id);

      // Buscar perfil do parceiro
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('full_name, must_change_password')
        .eq('id', user.id)
        .single();

      if (profile && !error) {
        const data: PartnerProfileData = {
          full_name: profile.full_name || '',
          must_change_password: !!profile.must_change_password,
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
