import React from 'react';
import ProposeCollectionDateModal from './ProposeCollectionDateModal';
import { isoToBr } from '@/modules/common/components/date-picker/utils';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

type Item = { addressId: string; address: string; dateIso?: string | null };

interface Props {
  clientId: string;
  items: Item[];
  open: boolean;
  onClose: () => void;
  onDone?: () => void | Promise<void>;
}

const AdminDateAdequacyFlow: React.FC<Props> = ({ clientId, items, open, onClose, onDone }) => {
  const { post } = useAuthenticatedFetch();
  const [index, setIndex] = React.useState(0);
  const [changing, setChanging] = React.useState(false);
  const [proposedDate, setProposedDate] = React.useState<string>('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setIndex(0);
      setChanging(false);
      setError(null);
      setProposedDate(items?.[0]?.dateIso || '');
    }
  }, [open, items]);

  if (!open || !items?.length) return null;
  const current = items[index];
  const hasNext = index < items.length - 1;

  const finishOrNext = async () => {
    if (hasNext) {
      setIndex(i => i + 1);
      setChanging(false);
      setError(null);
      setProposedDate(items[index + 1]?.dateIso || '');
    } else {
      if (onDone) await onDone();
      onClose();
    }
  };

  const acceptDate = async () => {
    await finishOrNext();
  };

  const requestChange = () => {
    setChanging(true);
    setError(null);
    setProposedDate(current?.dateIso || '');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
    >
      {!changing ? (
        <div style={{ background: '#fff', padding: 16, borderRadius: 8, minWidth: 380 }}>
          <h4 style={{ margin: 0, marginBottom: 8 }}>Verificar data de coleta</h4>
          <p style={{ margin: 0, marginBottom: 4 }}>Endereço: {current.address}</p>
          <p style={{ margin: 0, marginBottom: 16 }}>
            Data atual: {current.dateIso ? isoToBr(current.dateIso) : 'sem data definida'}
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose}>
              Cancelar
            </button>
            <button type="button" onClick={requestChange}>
              Solicitar mudança de data
            </button>
            <button type="button" onClick={acceptDate}>
              Data adequada
            </button>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
            {index + 1} de {items.length}
          </div>
        </div>
      ) : (
        <ProposeCollectionDateModal
          addressLabel={current.address}
          initialDateIso={proposedDate}
          loading={loading}
          error={error || undefined}
          onClose={() => setChanging(false)}
          onChangeDate={setProposedDate}
          onConfirm={async () => {
            try {
              setLoading(true);
              setError(null);
              const resp = await post('/api/admin/propose-collection-date', {
                clientId,
                addressId: current.addressId,
                new_date: proposedDate,
              });
              if (!resp.ok) throw new Error(resp.error || 'Falha ao propor data');
              setChanging(false);
              await finishOrNext();
            } catch (e: any) {
              setError(e.message || 'Falha ao propor data');
            } finally {
              setLoading(false);
            }
          }}
        />
      )}
    </div>
  );
};

export default AdminDateAdequacyFlow;
