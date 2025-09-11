import React from 'react';

interface ContractAcceptanceViewProps {
  contractContent: string;
  checked: boolean;
  setChecked: (checked: boolean) => void;
  handleAcceptContract: () => void;
  loading: boolean;
  contractSignedAt: string | null;
}

const ContractAcceptanceView: React.FC<ContractAcceptanceViewProps> = ({
  contractContent,
  checked,
  setChecked,
  handleAcceptContract,
  loading,
  contractSignedAt,
}) => {
  return (
    <main>
      <div
        style={{
          padding: 48,
          maxWidth: 800,
          margin: '0 auto',
          background: '#fff',
          borderRadius: 8,
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        }}
      >
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 600,
            marginBottom: 24,
            color: '#333',
            textAlign: 'center',
          }}
        >
          Termos e Condições do Contrato de Parceria
        </h1>
        <div
          style={{
            border: '1px solid #eee',
            padding: 24,
            maxHeight: 400,
            overflowY: 'auto',
            marginBottom: 24,
            lineHeight: 1.6,
            color: '#555',
          }}
          dangerouslySetInnerHTML={{ __html: contractContent }}
        />
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <input
            type="checkbox"
            id="acceptTerms"
            checked={checked}
            onChange={e => setChecked(e.target.checked)}
            style={{ marginRight: 10 }}
          />
          <label htmlFor="acceptTerms" style={{ fontSize: '1.1rem', color: '#333' }}>
            Li e concordo com os termos e condições.
          </label>
        </div>
        <button
          onClick={handleAcceptContract}
          disabled={!checked || loading}
          style={{
            background: '#002E4C',
            color: '#fff',
            fontWeight: 600,
            fontSize: '1.2rem',
            border: 0,
            borderRadius: 6,
            padding: '12px 24px',
            cursor: 'pointer',
            width: '100%',
            opacity: !checked || loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Processando...' : 'Aceitar Contrato'}
        </button>
        {contractSignedAt && (
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.9rem', color: '#777' }}>
            Contrato aceito em: {new Date(contractSignedAt).toLocaleString()}
          </p>
        )}
      </div>
    </main>
  );
};

export default ContractAcceptanceView;
