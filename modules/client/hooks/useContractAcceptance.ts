import { useEffect, useState } from 'react';
import { clientDashboardService } from '@/modules/client/services/clientDashboardService';

export const useContractAcceptance = (userId: string | null) => {
  const [accepted, setAccepted] = useState(false);
  const [loadingAcceptance, setLoadingAcceptance] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!userId) {
        if (active) {
          setAccepted(false);
          setLoadingAcceptance(false);
        }
        return;
      }
      setLoadingAcceptance(true);
      const ok = await clientDashboardService.getContractAcceptance(userId);
      if (active) {
        setAccepted(ok);
        setLoadingAcceptance(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  const acceptContract = async (content: string) => {
    if (!userId) return false;
    const ok = await clientDashboardService.acceptContract(userId, content);
    if (ok) setAccepted(true);
    return ok;
  };

  return { accepted, setAccepted, loadingAcceptance, acceptContract } as const;
};
