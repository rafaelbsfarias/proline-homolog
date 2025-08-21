import { useEffect, useState } from 'react';
import { supabase } from '@/modules/common/services/supabaseClient';
import type { AddressItem } from '@/modules/client/types';

export function useAddresses() {
  const [addresses, setAddresses] = useState<AddressItem[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth.user?.id;
        if (!uid) return;
        const { data: addrs } = await supabase
          .from('addresses')
          .select('id, street, number, city, is_collect_point')
          .eq('profile_id', uid)
          .order('created_at', { ascending: false });
        setAddresses(((addrs as any[]) || []) as AddressItem[]);
      } catch {
        setAddresses([]);
      }
    })();
  }, []);

  const collectPoints = addresses.filter(a => a.is_collect_point);
  return { addresses, collectPoints };
}

