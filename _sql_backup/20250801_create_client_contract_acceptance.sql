-- Tabela para armazenar aceite de contrato do cliente
CREATE TABLE IF NOT EXISTS client_contract_acceptance (
    id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    accepted_at timestamptz NOT NULL DEFAULT now()
);
