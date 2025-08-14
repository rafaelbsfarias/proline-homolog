-- Migration: Criação da tabela de aceite de contrato do parceiro
CREATE TABLE IF NOT EXISTS partner_contract_acceptance (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  accepted_at timestamptz NOT NULL DEFAULT now()
);
