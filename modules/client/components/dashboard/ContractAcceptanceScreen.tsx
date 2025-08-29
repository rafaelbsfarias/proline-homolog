import React from 'react';
import headerStyles from '@/modules/common/components/SignupPage.module.css';
import css from './ContractAcceptanceScreen.module.css';

interface Props {
  fullName: string;
  parqueamento?: number;
  taxaOperacao?: number;
  checked: boolean;
  setChecked: (v: boolean) => void;
  loading?: boolean;
  onAccept: () => void;
}

const ContractAcceptanceScreen: React.FC<Props> = ({
  fullName,
  parqueamento,
  taxaOperacao,
  checked,
  setChecked,
  loading,
  onAccept,
}) => {
  return (
    <main className={css.main}>
      <h1 className={css.title}>Termos do Contrato</h1>
      <p className={css.subtitle}>
        Por favor, leia e aceite os termos abaixo para ter acesso completo ao seu painel.
      </p>
      <div className={css.centerRow}>
        <div className={css.card}>
          <h2 className={css.sectionTitle}>Detalhes do Serviço</h2>
          <div className={css.row}>
            <b>Parqueamento:</b> R${' '}
            {typeof parqueamento === 'number' ? parqueamento.toFixed(2) : '0.00'}
          </div>
          <div className={css.row}>
            <b>Taxa de Operação:</b> R${' '}
            {typeof taxaOperacao === 'number' ? taxaOperacao.toFixed(2) : '0.00'}
          </div>
          <div className={css.row}>...</div>
          <div className={css.muted}>
            Demais termos e condições serão detalhados em documento anexo.
          </div>
          <div className={css.checkboxRow}>
            <input
              id="accept-contract"
              className={css.checkbox}
              type="checkbox"
              checked={checked}
              onChange={e => setChecked(e.target.checked)}
            />
            <label htmlFor="accept-contract">Li e concordo com os termos do contrato</label>
          </div>
          <button
            className={`${headerStyles.submitButton} ${css.acceptButtonExtra}`}
            style={{ opacity: checked ? 1 : 0.7, cursor: checked ? 'pointer' : 'not-allowed' }}
            disabled={!checked || !!loading}
            onClick={onAccept}
          >
            Aceitar Contrato
          </button>
        </div>
      </div>
    </main>
  );
};

export default ContractAcceptanceScreen;
